import { generateArchitectureWithToolCalling } from "../../actions/architecture";
import { saveArchitectureWithUserId } from "../../actions/architecturePersistence";
import { inngest } from "./client";
import { generateArchitecture, getGitHubCommitComparison } from "../../actions/reverse-architecture";
import { saveProjectArchitecture, saveInitialMessageForInngestRevArchitecture } from "../../actions/project";
import { db } from "@/lib/db";
import { maxFilesChangedFree, maxFilesChangedPro, maxLinesChangedFree, maxLinesChangedPro } from "../../Limits";


export const generateArchitectureFunction = inngest.createFunction(
  {
    id: "generate-architecture",
  },
  { event: "architecture/generate" },
  async ({ event, step }) => {
    const { generationId, requirement, conversationHistory, architectureData, chatId, componentPositions, userId } = event.data;

    try {
      // Step 1: Generate architecture (the expensive 5-10 min operation)
      const architectureResult = await step.run("generate-architecture", async () => {
        return await generateArchitectureWithToolCalling(
          requirement,
          conversationHistory,
          architectureData
        ); 
      });

      // Step 2: Clean and parse the result
      const parsedArchitecture = await step.run("parse-result", async () => {
        let cleanedResult = architectureResult;
        if (typeof architectureResult === 'string') {
          cleanedResult = architectureResult
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```\s*$/, '')
            .trim();
        }

        return typeof cleanedResult === 'string'
          ? JSON.parse(cleanedResult)
          : cleanedResult;
      });

      // Step 3: Save architecture to database
      if (chatId && parsedArchitecture) {
        await step.run("save-architecture", async () => {
          const saveResult = await saveArchitectureWithUserId(generationId, {
            chatId,
            architectureData: parsedArchitecture,
            requirement,
            componentPositions: componentPositions,
          }, userId);

          if (!saveResult.success) {
            throw new Error(`Failed to save architecture: ${saveResult.error}`);
          }

          return saveResult;
        });
      }

      return {
        success: true,
        architectureId: generationId,
        architecture: parsedArchitecture,
      };

    } catch (error) {
      console.error('Error generating architecture:', error);
      throw error; // Let Inngest handle retries
    }
  }
);

export const generateReverseArchitectureFunction = inngest.createFunction(
  {
    id: "generate-reverse-architecture",
    idempotency: 'event.data.projectId'
  },
  { event: "reverse-architecture/generate" },
  async ({ event, step }) => {
    const { projectId, activeChatId } = event.data;

    try {
      // Step 1: Generate architecture from GitHub repo analysis (expensive 5-7 min operation)
      const architectureResult = await step.run("generate-reverse-architecture", async () => {
        return await generateArchitecture(projectId);
      });

      // Check for errors in architecture generation
      if ('error' in architectureResult) {
        throw new Error(`Architecture generation failed: ${architectureResult.error}`);
      }

      const { architecture: architectureJSON, detailedAnalysis } = architectureResult;

      // Step 2: Clean and parse the architecture result
      const parsedArchitecture = await step.run("parse-architecture", async () => {
        let cleanedResult = architectureJSON;
        if (typeof architectureJSON === 'string') {
          cleanedResult = architectureJSON
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```\s*$/, '')
            .trim();
        }

        const parsed = typeof cleanedResult === 'string'
          ? JSON.parse(cleanedResult)
          : cleanedResult;

        // Add detailed analysis to the parsed architecture
        parsed.detailedAnalysis = detailedAnalysis;

        return parsed
      });

      // Step 3: Generate initial message from architecture rationale
      const initialMessage = await step.run("generate-initial-message", async () => {
        const architectureRationaleParagraphs = parsedArchitecture.architectureRationale.split(/\n\s*\n/);
        const firstParagraph = architectureRationaleParagraphs[0].trim();
        const lastParagraph = architectureRationaleParagraphs[architectureRationaleParagraphs.length - 1].trim();
        return firstParagraph + "\n\n" + lastParagraph;
      });

      // Step 4: Save architecture to database
      if (parsedArchitecture && parsedArchitecture.components && parsedArchitecture.architectureRationale) {
        await step.run("save-project-architecture", async () => {

          const saveResult = await saveProjectArchitecture(
            projectId,
            parsedArchitecture.architectureRationale,
            parsedArchitecture.components,
            parsedArchitecture.connectionLabels || {},
            parsedArchitecture.componentPositions || {}
          );

          if (saveResult.error || !saveResult.success) {
            throw new Error(`Failed to save architecture: ${saveResult.error}`);
          }

          return saveResult;
        });

        // Step 5: Ensure initial message is saved to chat in background-safe way
        if (initialMessage) {
          await step.run("save-initial-message", async () => {
            const res = await saveInitialMessageForInngestRevArchitecture(projectId, initialMessage, activeChatId);
            if ((res as any).error) {
              throw new Error(`Failed to save initial message: ${(res as any).error}`);
            }
            return res;
          });
        }
      } else {
        throw new Error('Invalid architecture structure - missing required fields');
      }

      return {
        success: true,
        projectId,
        architecture: parsedArchitecture,
        initialMessage,
      };

    } catch (error) {
      console.error('Error generating reverse architecture:', error);
      throw error; // Let Inngest handle retries
    }
  }
);

export const regenerateReverseArchitectureFunction = inngest.createFunction(
  {
    id: "regenerate-reverse-architecture",
    idempotency: 'event.data.projectId'
  },
  { event: "reverse-architecture/regenerate" },
  async ({ event, step }) => {
    const { repoFullName, beforeCommit, afterCommit, filesAdded, filesRemoved, filesModified } = event.data;

    try {
      // Step 1: Find project and verify it has ProjectArchitecture, get installation token, and fetch commit comparison
      const commitComparisonResult = await step.run("fetch-commit-comparison", async () => {
        const result = await getGitHubCommitComparison(repoFullName, beforeCommit, afterCommit);
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.success || !result.data || !result.userId || !result.projectId) {
          throw new Error('Invalid commit comparison result');
        }

        return result as { success: true; data: any; userId: string; projectId: string };
      });

      const commitComparison = commitComparisonResult.data;
      const userId = commitComparisonResult.userId;
      const projectId = commitComparisonResult.projectId;

      const exactFilesChanges = commitComparison.files && Array.isArray(commitComparison.files)
        ? commitComparison.files.map((file: any) => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
          }))
        : [];

      // Step 2: Get user subscription status
      const userSubscription = await step.run("get-user-subscription", async () => {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            subscriptionPlan: true,
            subscription: {
              select: {
                status: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const isPro = user.subscriptionPlan === "PRO" && user.subscription?.status === "ACTIVE";
        return { isPro, subscriptionPlan: user.subscriptionPlan };
      });

      // Step 3: Calculate total files changed
      const totalFilesChanged = await step.run("calculate-files-changed", async () => {
        const filesAddedCount = Array.isArray(filesAdded) ? filesAdded.length : 0;
        const filesRemovedCount = Array.isArray(filesRemoved) ? filesRemoved.length : 0;
        const filesModifiedCount = Array.isArray(filesModified) ? filesModified.length : 0;
        return filesAddedCount + filesRemovedCount + filesModifiedCount;
      });

      // Step 4: Calculate total lines changed
      const totalLinesChanged = await step.run("calculate-lines-changed", async () => {
        if (!commitComparison.files || !Array.isArray(commitComparison.files)) {
          return 0;
        }
        return commitComparison.files.reduce((sum: number, file: any) => {
          return sum + (file.changes || 0);
        }, 0);
      });

      // Step 5: Validate against limits
      await step.run("validate-limits", async () => {
        const maxFiles = userSubscription.isPro ? maxFilesChangedPro : maxFilesChangedFree;
        const maxLines = userSubscription.isPro ? maxLinesChangedPro : maxLinesChangedFree;
        const planName = userSubscription.isPro ? "PRO" : "FREE";



        if (totalFilesChanged > maxFiles) {
          throw new Error(
            `File change limit exceeded: ${totalFilesChanged} files changed (limit: ${maxFiles} for ${planName} users)`
          );
        }

        if (totalLinesChanged > maxLines) {
          throw new Error(
            `Line change limit exceeded: ${totalLinesChanged} lines changed (limit: ${maxLines} for ${planName} users)`
          );
        }

        return { validated: true };
      });

      // Step 6: Fetch latest project architecture
      const latestArchitecture = await step.run("fetch-latest-architecture", async () => {
        const project = await db.project.findUnique({
          where: { id: projectId },
          select: {
            ProjectArchitecture: {
              orderBy: {
                updatedAt: 'desc',
              },
              take: 1,
              select: {
                id: true,
                architectureRationale: true,
                components: true,
                connectionLabels: true,
                componentPositions: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        if (!project || !project.ProjectArchitecture || project.ProjectArchitecture.length === 0) {
          throw new Error('No architecture found for project');
        }

        return project.ProjectArchitecture[0];
      });

      return {
        success: true,
        commitComparison,
        totalFilesChanged,
        totalLinesChanged,
        latestArchitecture,
      };
    } catch (error) {
      console.error('Error in regenerateReverseArchitectureFunction:', error);
      throw error; // Let Inngest handle retries
    }
  }
);