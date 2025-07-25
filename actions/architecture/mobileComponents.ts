import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.2,
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

const prompt = PromptTemplate.fromTemplate(`
You are a senior mobile app architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY mobile app components suitable for modern mobile development.

List only these possible components:
- Mobile Frontend
- Backend API
- Push Notifications
- Authentication
- Local Storage
- App Store Services
- Analytics (optional)
- Payment Integration (optional)
- Offline Sync (optional)

For each component, suggest the best 2024-2025 mobile technology stack using this format:

{{
  "components": [
    {{
      "name": "Mobile Frontend",
      "type": "core",
      "purpose": "Cross-platform mobile application interface",
      "technologies": {{
        "primary": "React Native",
        "framework": "Expo",
        "additional": "TypeScript, React Navigation, Zustand"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const mobileComponentsTool = new DynamicStructuredTool({
  name: "mobile_components",
  description: "Generate mobile app components and modern tech stack for iOS/Android development",
  schema: z.object({
    requirement: z.string().describe("User's mobile app requirement"),
    conversation_history: z.string().describe("All prior conversation messages as a single formatted string"),
    architectureData: z.string().describe("Previous architecture as stringified JSON if any"),
  }),
  func: async ({ requirement, conversation_history, architectureData }) => {
    const result = await chain.invoke({
      requirement,
      conversation_history,
      architectureData,
    });
    return result;
  },
}); 