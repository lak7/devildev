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
You are a senior AI/ML architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY AI/ML components suitable for modern AI applications.

List only these possible components:
- LLM Integration
- Vector Database
- Model Training Pipeline
- Data Processing
- ML Inference API
- Model Monitoring
- Feature Store (optional)
- MLOps Pipeline (optional)
- AI Gateway (optional)

For each component, suggest the best 2024-2025 AI/ML technology stack using this format:

{{
  "components": [
    {{
      "name": "LLM Integration",
      "type": "core",
      "purpose": "Integration with large language models for AI capabilities",
      "technologies": {{
        "primary": "OpenAI GPT-4",
        "framework": "LangChain",
        "additional": "Anthropic Claude, Together AI, Vercel AI SDK"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const aimlComponentsTool = new DynamicStructuredTool({
  name: "aiml_components",
  description: "Generate AI/ML components and modern tech stack for artificial intelligence applications",
  schema: z.object({
    requirement: z.string().describe("User's AI/ML requirement"),
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