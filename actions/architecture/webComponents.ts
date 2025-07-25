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
You are a senior software architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY basic components suitable for a typical web app (CRUD, SaaS, admin panels). Do not include AI, blockchain, or real-time systems.

List only these possible components:
- Frontend
- Backend
- Database
- Admin Panel (optional)
- Authentication (optional)

For each component, suggest the best 2024-2025 technology stack using this format:

{{
  "components": [
    {{
      "name": "Frontend",
      "type": "core",
      "purpose": "UI layer for users to interact with the system",
      "technologies": {{
        "primary": "Next.js 14",
        "framework": "React",
        "additional": "Tailwind CSS, TypeScript"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const basicWebComponentsTool = new DynamicStructuredTool({
  name: "basic_web_components",
  description: "Generate basic components and modern tech stack for typical web apps like CRUD or SaaS",
  schema: z.object({
    requirement: z.string().describe("User's software requirement"),
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
