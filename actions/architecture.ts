"use server";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { retriever } from "./retriever";
import { ChatMessage } from "@/app/dev/page";


export async function retrieveFunc(question: string, conversationHistory: any[] = []){
  console.log("question", question);
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({openAIApiKey: openaiKey})
  
  const template = `You are a system design assistant. Your job is to reformulate the user's request into a standalone, specific, and context-rich technical query that can be used to retrieve relevant software architecture patterns or solutions from a vector database.

          Use the context of the full conversation to preserve intent and ensure the query is precise.

          Conversation History:
          {conversation_history}

          User Requirement:
          {requirement}

          Refined Query:`;
  const prompt = PromptTemplate.fromTemplate(template);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser()).pipe(retriever);

  // Format conversation history for the prompt
  const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
).join('\n');

  const response = await chain.invoke({requirement: question, conversation_history: formattedHistory});
  
  return response;

}

export async function generateArchitecture(requirement: string, conversationHistory: any[] = [], architectureData: any) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are DevilDev, an expert software architect specializing in modern, production-ready systems using cutting-edge technologies. Generate a complete software architecture that reflects current best practices and the most relevant tech stack for the specific use case.

🧠 Conversation History
{conversation_history}
📚 Retrieved Context
{context}

📝 User Requirement
{requirement}

PREVIOUS ARCHITECTURE
{architectureData}
MODERN TECH STACK PREFERENCES (2024-2025):
Frontend:

Next.js 14+ with App Router, React Server Components
TypeScript, Tailwind CSS, shadcn/ui
Vercel/Netlify deployment

Backend:

Next.js API routes (for full-stack apps) OR
Node.js with Fastify/Hono (for separate backend)
TypeScript, serverless-first approach
tRPC for type-safe APIs

Database & ORM:

Supabase (PostgreSQL + real-time) OR Neon DB
Prisma ORM with TypeScript
Redis for caching (Upstash)

Authentication:

Clerk (modern auth solution) OR
NextAuth.js v5 OR Supabase Auth
Avoid generic "JWT" - be specific

AI Integration (when needed):

OpenAI GPT-4/GPT-3.5 API directly
Langchain/LangGraph for complex workflows
Vercel AI SDK for streaming
Vector databases: Pinecone, Weaviate, or Supabase Vector

Blockchain Integration (when needed):

Ethereum: ethers.js, wagmi, RainbowKit
Solana: @solana/web3.js, @solana/wallet-adapter
Multi-chain: viem, ConnectKit
Smart contracts: Hardhat, Foundry

DevOps & Monitoring:

Vercel/Railway for deployment
Sentry for error tracking
PostHog for analytics
GitHub Actions for CI/CD

ANALYSIS FRAMEWORK:

Domain Analysis: Identify if this is web3, AI, fintech, e-commerce, SaaS, etc.
Scale Requirements: Determine if it needs enterprise-grade solutions or startup-friendly stack
Integration Needs: Detect AI, blockchain, payments, real-time features
User Experience: Consider auth complexity, real-time updates, mobile needs
Technical Constraints: Budget, team size, deployment preferences

COMPONENT NAMING RULES:
Core Components (use these exact simple names):

"Frontend" (for UI layer)
"Backend" (for API/server layer)
"Authentication" (for auth system)
"Database" (for data storage)

Additional Components (be specific for domain features):

For AI: "AI Verification Engine", "Vector Store", "Content Processing"
For Blockchain: "Smart Contract Layer", "Token System", "Wallet Integration"
For Real-time: "Real-time Sync", "Notification System"
For External: "Payment Gateway", "File Storage", "Email Service"

TECHNOLOGY SPECIFICITY RULES:
In the technologies object, use ONLY the core technology name:

primary: "Next.js 14", "Node.js", "OpenAI GPT-4", "Supabase", "Clerk"
framework: "React", "Prisma", "LangChain", "wagmi", "Hardhat"
additional: "TypeScript", "Tailwind CSS", "shadcn/ui"

NEVER use these generic terms in technologies:

❌ "Next.js 14 with App Router and Server Components" → ✅ "Next.js 14"
❌ "OpenAI GPT-4 Turbo API with Function Calling" → ✅ "OpenAI GPT-4"
❌ "Supabase PostgreSQL with real-time" → ✅ "Supabase"
❌ "Clerk Authentication with Web3 wallet" → ✅ "Clerk"

RESPONSE FORMAT:
Return ONLY a JSON object with this exact structure (note the double curly brackets for LangChain compatibility):
{{
"components": [
{{
"id": "unique-component-id",
"title": "Simple Component Name (e.g., 'Frontend', 'Backend', 'Authentication', 'Database', 'AI Verification Engine')",
"icon": "appropriate-icon-from-list",
"color": "from-{{color}}-{{shade}} to-{{color}}-{{shade}}",
"borderColor": "border-{{color}}-{{shade}}/30",
"technologies": {{
"primary": "Core technology name only (e.g., 'Next.js 14', 'OpenAI GPT-4', 'Supabase', 'Clerk')",
"framework": "Framework name only (e.g., 'React', 'Prisma', 'LangChain', 'wagmi')",
"additional": "Additional tools (e.g., 'TypeScript', 'Tailwind CSS', 'shadcn/ui')"
}},
"connections": ["connected-component-ids"],
"position": {{ "x": number, "y": number }},
"dataFlow": {{
"sends": ["specific-data-types-or-protocols"],
"receives": ["specific-data-types-or-protocols"]
}},
"purpose": "Detailed description of this component's specific role"
}}
],
"connectionLabels": {{
"component1-component2": "Specific Protocol/Connection Type (e.g., 'tRPC procedure calls', 'WebSocket real-time sync', 'GraphQL subscriptions')"
}},
"architectureRationale": "Detailed explanation of why this specific tech stack was chosen"
}}

## REQUIREMENTS:
- **SIMPLE COMPONENT NAMES**: 
  ✅ "Frontend", "Backend", "Authentication", "Database" for core components
  ✅ "AI Verification Engine", "Smart Contract Layer", "Vector Store" for additional features
- **CLEAN TECHNOLOGY NAMES**: Use just the core tech name in primary/framework fields
  ✅ primary: "Next.js 14", framework: "React"
  ❌ primary: "Next.js 14 with App Router and Server Components"
- **MODERN STACK FOCUS**: Use 2024-2025 best practices (Next.js 14, Supabase, Clerk, etc.)
- **DOMAIN-TAILORED**: Architecture must reflect the specific use case
- **4-7 COMPONENTS**: Focus on essential components with clear boundaries
- **SPECIFIC PROTOCOLS**: Use exact connection types like "tRPC", "WebSocket", "GraphQL"

## COMMON PATTERNS TO FOLLOW:

**For SaaS/Web Apps:**
- Next.js Frontend → tRPC API → Prisma → Supabase/Neon
- Clerk Authentication as separate component
- Real-time features with Supabase subscriptions

**For AI Apps:**
- Next.js Frontend → OpenAI Integration → Vector Database → Data Processing
- Streaming responses with Vercel AI SDK
- LangChain for complex workflows

**For Web3 Knowledge Platform (like your example):**
- "Frontend" (Next.js 14) → "Authentication" (Clerk) → "Backend" (tRPC) → "Database" (Supabase + Prisma)
- "AI Verification Engine" (OpenAI GPT-4) → "Vector Store" (Pinecone)
- "Smart Contract Layer" (Hardhat + wagmi) → "Token System" (ERC-20)

## CRITICAL SUCCESS FACTORS:
1. **Keep component names simple** - "Frontend", "Backend", etc. for core, descriptive for features
2. **Use clean technology names** in the technologies object
3. **Focus on modern, production-ready stacks** 
4. **Tailor to the specific domain** (blockchain + AI + knowledge platform)

Return ONLY the JSON object with double curly brackets {{}} for LangChain compatibility, no additional text or explanations outside the JSON.

Return ONLY the JSON object, no additional text or explanations outside the JSON.`
    const prompt = PromptTemplate.fromTemplate(template);
    const context = await retrieveFunc(requirement, conversationHistory);
    console.log("This is the context: ", context);
     // Format conversation history for the prompt
     const formattedHistory = conversationHistory.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({requirement: requirement, conversation_history: formattedHistory, context: context, architectureData: JSON.stringify(architectureData)});
    return result;
}