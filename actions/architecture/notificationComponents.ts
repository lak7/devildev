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
You are a senior notification systems architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY notification and messaging components suitable for modern applications.

List only these possible components:
- Email Service
- SMS Service
- Push Notifications
- In-App Notifications
- Notification Queue
- Template Engine
- Delivery Tracking (optional)
- Unsubscribe Management (optional)
- A/B Testing (optional)

For each component, suggest the best 2024-2025 notification technology stack using this format:

{{
  "components": [
    {{
      "name": "Email Service",
      "type": "core",
      "purpose": "Transactional and marketing email delivery system",
      "technologies": {{
        "primary": "Resend",
        "framework": "React Email",
        "additional": "SendGrid, Postmark, AWS SES"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const notificationComponentsTool = new DynamicStructuredTool({
  name: "notification_components",
  description: "Generate notification and messaging components with modern email/SMS/push stack",
  schema: z.object({
    requirement: z.string().describe("User's notification system requirement"),
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