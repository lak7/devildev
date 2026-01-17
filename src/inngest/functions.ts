import { generateArchitectureWithToolCalling } from "../../actions/architecture";
import { saveArchitectureWithUserId } from "../../actions/architecturePersistence";
import { inngest } from "./client";
import { generateArchitecture } from "../../actions/reverse-architecture";
import { saveProjectArchitecture, saveInitialMessageForInngestRevArchitecture } from "../../actions/project";


export const generateArchitectureFunction = inngest.createFunction(
  { 
    id: "generate-architecture",
  },
  { event: "architecture/generate" },
  async ({ event, step }) => {
    const {generationId, requirement, conversationHistory, architectureData, chatId, componentPositions, userId } = event.data;

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
    const { beforeCommit, afterCommit, filesAdded, filesRemoved, filesModified } = event.data;
  }
);