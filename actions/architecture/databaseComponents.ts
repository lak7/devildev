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
You are a senior database and storage architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY database and storage components suitable for modern applications.

List only these possible components:
- Primary Database
- Cache Layer
- File Storage
- Search Engine
- Data Backup
- Database Migration
- Connection Pooling (optional)
- Read Replicas (optional)
- CDN (optional)

For each component, suggest the best 2024-2025 database technology stack using this format:

{{
  "components": [
    {{
      "name": "Primary Database",
      "type": "core",
      "purpose": "Main data persistence layer for application data",
      "technologies": {{
        "primary": "PostgreSQL",
        "framework": "Prisma",
        "additional": "PlanetScale, Supabase, Neon"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const databaseComponentsTool = new DynamicStructuredTool({
  name: "database_components",
  description: "Generate database and storage components with modern data stack",
  schema: z.object({
    requirement: z.string().describe("User's database/storage requirement"),
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