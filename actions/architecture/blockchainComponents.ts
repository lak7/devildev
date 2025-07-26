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
  You are a senior blockchain and Web3 architect. Analyze the requirement and return ONLY blockchain components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 IDEAL BLOCKCHAIN STACK (USE BY DEFAULT):**
  - Smart Contracts: Solidity + Hardhat
  - Chain: Polygon (or Ethereum)
  - SDK: wagmi + viem (TypeScript-first)
  - Wallet: RainbowKit + WalletConnect
  - Indexing: The Graph
  - Auth: thirdweb Auth or SIWE
  
  **COMPONENT SELECTION RULES:**
  Include ONLY components that are required as per conversation history or explicitly mentioned or strongly implied:
  - "smart contract" or "contract" → Smart Contracts
  - "wallet" or "MetaMask" or "connect wallet" → Wallet Integration
  - "blockchain" or "chain" → Blockchain Network
  - "token" or "ERC-20" → Token Management
  - "NFT" or "ERC-721" → NFT Platform
  - "DeFi" or "swap" or "liquidity" → DeFi Integration
  - "data" or "query" or "indexing" → Blockchain Indexing
  - If general "Web3" mentioned → Include Smart Contracts + Wallet Integration
  
  **TECHNOLOGY SELECTION:**
  
  **Smart Contract Platforms:**
  - If requirement mentions "Ethereum" → Use Ethereum
  - If requirement mentions "Polygon" → Use Polygon
  - If requirement mentions "Solana" → Use Solana + Rust
  - If requirement mentions "BSC" or "Binance" → Use Binance Smart Chain
  - If requirement mentions "Avalanche" → Use Avalanche
  - If requirement mentions "low fees" → Use Polygon
  - Otherwise → Use Polygon (ideal choice)
  
  **Smart Contract Languages:**
  - If requirement mentions "Rust" or "Solana" → Use Rust
  - If requirement mentions "Vyper" → Use Vyper
  - If requirement mentions "Move" → Use Move
  - Otherwise → Use Solidity (ideal choice)
  
  **Blockchain SDKs:**
  - If requirement mentions "ethers" → Use ethers.js
  - If requirement mentions "web3.js" → Use web3.js
  - If requirement mentions "viem" → Use viem
  - If requirement mentions "thirdweb" → Use thirdweb SDK
  - Otherwise → Use wagmi + viem (ideal choice)
  
  **Wallet Integration:**
  - If requirement mentions "MetaMask" → Use MetaMask SDK
  - If requirement mentions "WalletConnect" → Use WalletConnect
  - If requirement mentions "RainbowKit" → Use RainbowKit
  - Otherwise → Use RainbowKit + WalletConnect (ideal choice)
  
  **AVAILABLE BLOCKCHAIN TECHNOLOGIES:**
  
  **Smart Contract Platforms:**
  **Polygon** (DEFAULT) - L2 scaling, cheaper transactions, EVM-compatible
  **Ethereum** - Most widely used, extensive ecosystem
  **Solana** - High-performance, fast transactions, uses Rust
  **Binance Smart Chain** - EVM-compatible, low fees, DeFi focused
  **Avalanche** - Fast finality, EVM support, DeFi and gaming
  
  **Smart Contract Languages:**
  **Solidity** (DEFAULT) - Most popular, Ethereum and EVM chains
  **Rust** - High-performance chains like Solana and Near
  **Vyper** - Python-like, stricter contract patterns
  **Move** - Secure language for Aptos and Sui
  
  **Blockchain SDKs:**
  **wagmi + viem** (DEFAULT) - Modern TypeScript-first React hooks
  **ethers.js** - Lightweight Ethereum interaction library
  **web3.js** - Older but widely used Ethereum library
  **thirdweb** - All-in-one SDK for contracts, NFTs, auth
  
  **Wallet Integration:**
  **RainbowKit + WalletConnect** (DEFAULT) - Elegant UI with QR/deep linking
  **MetaMask SDK** - Direct MetaMask integration
  **WalletConnect** - Protocol for wallet connections
  
  **Specialized Tools:**
  **The Graph** - GraphQL blockchain data querying
  **Alchemy/Infura** - Blockchain infrastructure providers
  **Moralis** - Blockchain APIs and SDKs
  **Hardhat** - Smart contract development framework
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Component Name",
        "type": "blockchain",
        "purpose": "Component purpose and Web3 capability",
        "technologies": {{
          "primary": "Selected Technology",
          "chain": "Blockchain platform",
          "language": "Programming language if applicable",
          "integration": "SDK/Library used",
          "additional": "Supporting tools if needed"
        }}
      }}
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Check for explicit Web3 features** mentioned in requirement
  2. **Include only blockchain components** that are specifically needed
  3. **Choose technologies** based on explicit mentions or ideal stack
  4. **Consider performance needs** (high throughput → Solana, low fees → Polygon)
  5. **Match blockchain capabilities** to requirement complexity
  
  Return only the JSON with the specifically needed blockchain components.
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