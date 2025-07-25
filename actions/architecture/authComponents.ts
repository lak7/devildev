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
You are a senior security and authentication architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY authentication and security components suitable for modern applications.

List only these possible components:
- Identity Provider
- Session Management
- Multi-Factor Authentication
- Authorization Service
- Password Management
- OAuth Integration
- API Security (optional)
- User Management (optional)
- Audit Logging (optional)

For each component, suggest the best 2024-2025 authentication technology stack using this format:

{{
  "components": [
    {{
      "name": "Identity Provider",
      "type": "core",
      "purpose": "Centralized user authentication and identity management",
      "technologies": {{
        "primary": "Auth0",
        "framework": "NextAuth.js",
        "additional": "Clerk, Supabase Auth, Firebase Auth"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const authComponentsTool = new DynamicStructuredTool({
  name: "auth_components",
  description: "Generate authentication and security components with modern tech stack",
  schema: z.object({
    requirement: z.string().describe("User's authentication requirement"),
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