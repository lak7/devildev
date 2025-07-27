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
You are a senior analytics and data architect.

Given: 
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY analytics and tracking components suitable for modern applications.

List only these possible components:
- Web Analytics
- Event Tracking
- User Behavior Analytics
- Performance Monitoring
- Business Intelligence
- Data Warehouse
- Real-time Dashboard (optional)
- A/B Testing (optional)
- Error Tracking (optional)

For each component, suggest the best 2024-2025 analytics technology stack using this format:

{{
  "components": [
    {{
      "name": "Web Analytics",
      "type": "core",
      "purpose": "Track user interactions and website performance metrics",
      "technologies": {{
        "primary": "Google Analytics 4",
        "framework": "Vercel Analytics",
        "additional": "Mixpanel, Amplitude, PostHog"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const analyticsComponentsTool = new DynamicStructuredTool({
  name: "analytics_components",
  description: "Generate analytics and tracking components with modern data stack",
  schema: z.object({
    requirement: z.string().describe("User's analytics requirement"),
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