import { generateArchitectureWithToolCalling } from "../../actions/architecture";
import { saveArchitectureWithUserId } from "../../actions/architecturePersistence";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
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