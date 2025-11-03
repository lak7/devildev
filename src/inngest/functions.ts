import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
} from "@inngest/agent-kit";
import z from "zod";
import { db } from "@/lib/db";
import { Sandbox } from "@e2b/code-interpreter";
import { generateArchitectureWithToolCalling, triggerArchitectureGeneration } from "../../actions/architecture";
import { saveArchitectureWithUserId } from "../../actions/architecturePersistence";
import { inngest } from "./client";
import { generateArchitecture } from "../../actions/reverse-architecture";
import { saveProjectArchitecture, saveInitialMessageForInngestRevArchitecture } from "../../actions/project";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { ContextualDocsData } from "../../actions/contextualDocsPersistence";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.run("fn", () => {
      console.log("something else") // this will always be run once
      return "something else"
    })
  
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

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
    const { projectId, activeChatId, userId } = event.data;

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

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("devil-nextjs-test");
      return sandbox.sandboxId;
    });

    // e.g. transcript step
    // await step.sleep("wait-a-moment", "5s");

    // Create a new agent with a system prompt (you can add optional tools, too)
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: "Random prompt for now, but later we will use a system prompt that is specific to the project",
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1, // Randomness (higher = more random)
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return (await result).stdout;
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,
                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({ 
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>,
          ) => {
            /**
             * {
             *   /app.tsx: "<p>hi</p>",
             * }
             */

            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              },
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  // Prevent hallucination to ensure file exists
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;


    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    // Save to db
    // await step.run("save-result", async () => {
    //   if (isError) {
    //     return await db.message.create({
    //       data: {
    //         projectId: event.data.projectId,
    //         content: "Something went wrong. Please try again.",
    //         role: "ASSISTANT",
    //         type: "ERROR",
    //       },
    //     });
    //   }

    //   return await db.message.create({
    //     data: {
    //       projectId: event.data.projectId,
    //       content: result.state.data.summary,
    //       role: "ASSISTANT",
    //       type: "RESULT",
    //       fragment: {
    //         create: {
    //           sandboxUrl: sandboxUrl,
    //           title: "Fragment",
    //           files: result.state.data.files,
    //         },
    //       },
    //     },
    //   });
    // });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);

export const deploySandboxWithDocs = inngest.createFunction(
  { id: "deploy-sandbox-with-docs" },
  { event: "sandbox/deploy" },
  async ({ event, step }) => {
    const { deploymentId, chatId, docsData } = event.data as { deploymentId: string; chatId: string; docsData: ContextualDocsData };

    try {
      // Step 1: Update status to in-progress
      await step.run("update-status-in-progress", async () => {
        await db.sandboxDeployment.update({
          where: { id: deploymentId },
          data: { status: "in-progress" },
        });
        return { success: true };
      });

      // Step 2: Create Sandbox
      const sandboxId = await step.run("create-sandbox", async () => {
        const sandbox = await Sandbox.create("devil-nextjs-test");
        return sandbox.sandboxId;
      });

      // Step 3: Delete nextjs-app folder if it exists
      await step.run("delete-nextjs-app", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          // Check if the directory exists before attempting to delete
          try {
            await sandbox.files.remove("/home/user/nextjs-app");
            return { deleted: true };
          } catch (e) {
            // Directory doesn't exist or couldn't be deleted, that's fine
            return { deleted: false, reason: "Directory not found or already deleted" };
          }
        } catch (error) {
          console.error("Error deleting nextjs-app folder:", error);
          // Don't throw - we want to continue even if this fails
          return { deleted: false, error };
        }
      });

      // Step 4: Create Directory Structure
      await step.run("create-directories", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          await sandbox.files.makeDir("/home/user/.devildev");
          await sandbox.files.makeDir("/home/user/.devildev/Docs");
          await sandbox.files.makeDir("/home/user/.devildev/Phases");
          return { success: true };
        } catch (error) {
          console.error("Error creating directories:", error);
          throw error;
        }
      });

      // Step 5: Write Documentation Files
      const filesWritten = await step.run("write-docs-files", async () => {
        const sandbox = await getSandbox(sandboxId);
        let count = 0;

        if (docsData.projectRules) {
          await sandbox.files.write("/home/user/.devildev/PROJECT_RULES.md", docsData.projectRules);
          count++;
        }

        if (docsData.plan) {
          await sandbox.files.write("/home/user/.devildev/PLAN.md", docsData.plan);
          count++;
        }

        if (docsData.prd) {
          await sandbox.files.write("/home/user/.devildev/PRD.md", docsData.prd);
          count++;
        }

        if (docsData.projectStructure) {
          await sandbox.files.write("/home/user/.devildev/Docs/PROJECT_STRUCTURE.md", docsData.projectStructure);
          count++;
        }

        if (docsData.uiUX) {
          await sandbox.files.write("/home/user/.devildev/Docs/UI_UX.md", docsData.uiUX);
          count++;
        }

        if (docsData.bugTracking) {
          await sandbox.files.write("/home/user/.devildev/Docs/BUG_TRACKING.md", docsData.bugTracking);
          count++;
        }

        if (docsData.phases && Array.isArray(docsData.phases)) {
          for (let i = 0; i < docsData.phases.length; i++) {
            await sandbox.files.write(`/home/user/.devildev/Phases/Phase_${i + 1}.md`, docsData.phases[i]);
            count++;
          }
        }

        return { count };
      });

      // Step 6: List All Sandbox Files
      const filesList = await step.run("list-sandbox-files", async () => {
        const sandbox = await getSandbox(sandboxId);
        const entries = await sandbox.files.list("/home/user", { depth: 3 });
        
        const simplifiedList = entries
          .filter((entry: any) => {
            // Exclude .next and node_modules directories
            const pathParts = entry.path.split('/');
            return !pathParts.includes('.next') && !pathParts.includes('node_modules');
          })
          .map((entry: any) => {
            // Remove /home/user prefix from path
            const relativePath = entry.path.replace(/^\/home\/user\/?/, '');
            return {
              name: entry.name,
              type: (entry.type === "directory" || entry.isDir) ? "dir" : "file",
              path: relativePath || '/', // Use '/' for root if path becomes empty
              size: entry.size,
            };
          });

        return simplifiedList;
      });

      // Step 7: Get Deployed URL
      const sandboxUrl = await step.run("get-deployed-url", async () => {
        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);
        return `https://${host}`;
      });

      // Step 8: Save results to database
      await step.run("save-to-database", async () => {
        await db.sandboxDeployment.update({
          where: { id: deploymentId },
          data: {
            status: "completed",
            sandboxId,
            sandboxUrl,
            filesList: filesList as any,
            updatedAt: new Date(),
          },
        });
        return { success: true };
      });

      return {
        success: true,
        sandboxId,
        sandboxUrl,
        filesList,
      };
    } catch (error) {
      console.error("Error deploying sandbox with docs:", error);
      
      // Update database with failed status
      try {
        await step.run("save-error-to-database", async () => {
          await db.sandboxDeployment.update({
            where: { id: deploymentId },
            data: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error occurred",
            },
          });
        });
      } catch (dbError) {
        console.error("Error saving failed status to database:", dbError);
      }
      
      throw error; // Let Inngest handle retries
    }
  },
);