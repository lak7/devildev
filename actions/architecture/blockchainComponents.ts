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
You are a senior blockchain and Web3 architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY blockchain and smart contract components suitable for modern Web3 applications.

List only these possible components:
- Smart Contracts
- Wallet Integration
- Blockchain Network
- Token Management
- NFT Platform
- DeFi Integration
- IPFS Storage (optional)
- Oracle Services (optional)
- Cross-chain Bridge (optional)

For each component, suggest the best 2024-2025 blockchain technology stack using this format:

{{
  "components": [
    {{
      "name": "Smart Contracts",
      "type": "core",
      "purpose": "Self-executing contracts with terms directly written into code",
      "technologies": {{
        "primary": "Solidity",
        "framework": "Hardhat",
        "additional": "OpenZeppelin, Foundry, Truffle"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
`);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const blockchainComponentsTool = new DynamicStructuredTool({
  name: "blockchain_components",
  description: "Generate blockchain and smart contract components with modern Web3 stack",
  schema: z.object({
    requirement: z.string().describe("User's blockchain/Web3 requirement"),
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