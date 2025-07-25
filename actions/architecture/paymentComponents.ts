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
You are a senior fintech and payment systems architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY payment and financial components suitable for modern applications.

List only these possible components:
- Payment Gateway
- Subscription Management
- Wallet System
- Transaction Processing
- Fraud Detection
- Invoice Generation
- Tax Calculation (optional)
- Refund Processing (optional)
- Financial Reporting (optional)

For each component, suggest the best 2024-2025 payment technology stack using this format:

{{
  "components": [
    {{
      "name": "Payment Gateway",
      "type": "core",
      "purpose": "Secure payment processing and transaction handling",
      "technologies": {{
        "primary": "Stripe",
        "framework": "Stripe Elements",
        "additional": "PayPal, Square, Adyen"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const paymentComponentsTool = new DynamicStructuredTool({
  name: "payment_components",
  description: "Generate payment and financial components with modern fintech stack",
  schema: z.object({
    requirement: z.string().describe("User's payment system requirement"),
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