"use server";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { retriever } from "./retriever";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatMessage } from "@/app/dev/page";
import { z } from "zod";
import { aimlComponentsTool } from "./architecture/aimlComponents";
import { analyticsComponentsTool } from "./architecture/analyticsComponents";
import { authComponentsTool } from "./architecture/authComponents";
import { blockchainComponentsTool } from "./architecture/blockchainComponents";
import { DynamicStructuredTool } from "langchain/tools";
import { databaseComponentsTool } from "./architecture/databaseComponents";
import { mobileComponentsTool } from "./architecture/mobileComponents";
import { notificationComponentsTool } from "./architecture/notificationComponents";
import { paymentComponentsTool } from "./architecture/paymentComponents";
import { realtimeComponentsTool } from "./architecture/realtimeComponents";
import { basicWebComponentsTool } from "./architecture/webComponents";




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
    const llm = new ChatOpenAI({openAIApiKey: openaiKey, model: "gpt-4o", temperature: 0.25})
    const template1 = `You are an expert software architect. Analyze the requirement and plan optimal system components.


    🧠 Conversation History
    {conversation_history}
    
    📝 User Requirement
    {requirement}
    
    PREVIOUS ARCHITECTURE (If none then this is the first time we are generating an architecture)
    {architectureData}

Determine the domain type and plan 3-7 components. Always include Frontend, Backend, Database as core components.

Domain-specific additions:
- AI apps: Add "AI Engine", "Vector Store"  
- Web3: Add "Smart Contracts", "Wallet Integration"
- Real-time: Add "WebSocket Server", "Notification System"
- E-commerce: Add "Payment Gateway", "Inventory System"

Respond with ONLY this JSON:
{{
  "domain": "web3" | "ai" | "saas" | "ecommerce" | "fintech" | "other",
  "complexity": "simple" | "medium" | "complex", 
  "components": [
    {{
      "name": "Component Name",
      "type": "core" | "feature" | "external",
      "purpose": "What this component does"
    }}
  ]
}}

Rules:
- Use simple, clear component names
- 3-7 components total
- Include core components: Frontend, Backend, Database
- Add domain-specific components based on requirements`


const template2 = `Select optimal 2024-2025 technologies for each component.

COMPONENT PLAN: {componentPlan}

🧠 Conversation History
    {conversation_history}
    
    📝 User Requirement
    {requirement}
    
    PREVIOUS ARCHITECTURE (If none then this is the first time we are generating an architecture)
    {architectureData}

Modern Tech Preferences:
- Frontend: Next.js 14, Vite+React
- Backend: Next.js API, Node.js+Fastify, Hono
- Database: Supabase, Neon, PlanetScale  
- AI: OpenAI GPT-4, Anthropic Claude, Groq
- Auth: Clerk, NextAuth.js v5, Supabase Auth
- Real-time: Supabase realtime, Socket.io, Pusher
- Payments: Stripe, Lemonsqueezy
- Blockchain: wagmi, viem, ethers.js

For each component, select the most suitable technology stack.

Respond with ONLY this JSON:
{{
  "techStack": {{
    "componentName": {{
      "primary": "main technology name only",
      "framework": "supporting framework", 
      "additional": "extra tools"
    }}
  }},
  "rationale": "Brief explanation of stack choices"
}}`

  

//     const template3 = `You are DevilDev, an expert software architect specializing in modern, production-ready systems using cutting-edge technologies. Generate a complete software architecture that reflects current best practices and the most relevant tech stack for the specific use case.

// 🧠 Conversation History
// {conversation_history}

// 📚 Retrieved Context
// {context}

// 📝 User Requirement
// {requirement}

// PREVIOUS ARCHITECTURE
// {architectureData}
// MODERN TECH STACK PREFERENCES (2024-2025):
// Frontend:

// Next.js 14+ with App Router, React Server Components
// TypeScript, Tailwind CSS, shadcn/ui
// Vercel/Netlify deployment

// Backend:

// Next.js API routes (for full-stack apps) OR
// Node.js with Fastify/Hono (for separate backend)
// TypeScript, serverless-first approach
// tRPC for type-safe APIs

// Database & ORM:

// Supabase (PostgreSQL + real-time) OR Neon DB
// Prisma ORM with TypeScript
// Redis for caching (Upstash)

// Authentication:

// Clerk (modern auth solution) OR
// NextAuth.js v5 OR Supabase Auth
// Avoid generic "JWT" - be specific

// AI Integration (when needed):

// OpenAI GPT-4/GPT-3.5 API directly
// Langchain/LangGraph for complex workflows
// Vercel AI SDK for streaming
// Vector databases: Pinecone, Weaviate, or Supabase Vector

// Blockchain Integration (when needed):

// Ethereum: ethers.js, wagmi, RainbowKit
// Solana: @solana/web3.js, @solana/wallet-adapter
// Multi-chain: viem, ConnectKit
// Smart contracts: Hardhat, Foundry

// DevOps & Monitoring:

// Vercel/Railway for deployment
// Sentry for error tracking
// PostHog for analytics
// GitHub Actions for CI/CD

// ANALYSIS FRAMEWORK:

// Domain Analysis: Identify if this is web3, AI, fintech, e-commerce, SaaS, etc.
// Scale Requirements: Determine if it needs enterprise-grade solutions or startup-friendly stack
// Integration Needs: Detect AI, blockchain, payments, real-time features
// User Experience: Consider auth complexity, real-time updates, mobile needs
// Technical Constraints: Budget, team size, deployment preferences

// COMPONENT NAMING RULES:
// Core Components (use these exact simple names):

// "Frontend" (for UI layer)
// "Backend" (for API/server layer)
// "Authentication" (for auth system)
// "Database" (for data storage)

// Additional Components (be specific for domain features):

// For AI: "AI Verification Engine", "Vector Store", "Content Processing"
// For Blockchain: "Smart Contract Layer", "Token System", "Wallet Integration"
// For Real-time: "Real-time Sync", "Notification System"
// For External: "Payment Gateway", "File Storage", "Email Service"

// TECHNOLOGY SPECIFICITY RULES:
// In the technologies object, use ONLY the core technology name:

// primary: "Next.js 14", "Node.js", "OpenAI GPT-4", "Supabase", "Clerk"
// framework: "React", "Prisma", "LangChain", "wagmi", "Hardhat"
// additional: "TypeScript", "Tailwind CSS", "shadcn/ui"

// NEVER use these generic terms in technologies:

// ❌ "Next.js 14 with App Router and Server Components" → ✅ "Next.js 14"
// ❌ "OpenAI GPT-4 Turbo API with Function Calling" → ✅ "OpenAI GPT-4"
// ❌ "Supabase PostgreSQL with real-time" → ✅ "Supabase"
// ❌ "Clerk Authentication with Web3 wallet" → ✅ "Clerk"

// RESPONSE FORMAT:
// Return ONLY a JSON object with this exact structure (note the double curly brackets for LangChain compatibility):
// {{
// "components": [
// {{
// "id": "unique-component-id",
// "title": "Simple Component Name (e.g., 'Frontend', 'Backend', 'Authentication', 'Database', 'AI Verification Engine')",
// "icon": "appropriate-icon-from-list",
// "color": "from-{{color}}-{{shade}} to-{{color}}-{{shade}}",
// "borderColor": "border-{{color}}-{{shade}}/30",
// "technologies": {{
// "primary": "Core technology name only (e.g., 'Next.js 14', 'OpenAI GPT-4', 'Supabase', 'Clerk')",
// "framework": "Framework name only (e.g., 'React', 'Prisma', 'LangChain', 'wagmi')",
// "additional": "Additional tools (e.g., 'TypeScript', 'Tailwind CSS', 'shadcn/ui')"
// }},
// "connections": ["connected-component-ids"],
// "position": {{ "x": number, "y": number }},
// "dataFlow": {{
// "sends": ["specific-data-types-or-protocols"],
// "receives": ["specific-data-types-or-protocols"]
// }},
// "purpose": "Detailed description of this component's specific role"
// }}
// ],
// "connectionLabels": {{
// "component1-component2": "Specific Protocol/Connection Type (e.g., 'tRPC procedure calls', 'WebSocket real-time sync', 'GraphQL subscriptions')"
// }},
// "architectureRationale": "Detailed explanation of why this specific tech stack was chosen"
// }}

// ## REQUIREMENTS:
// - **SIMPLE COMPONENT NAMES**: 
//   ✅ "Frontend", "Backend", "Authentication", "Database" for core components
//   ✅ "AI Verification Engine", "Smart Contract Layer", "Vector Store" for additional features
// - **CLEAN TECHNOLOGY NAMES**: Use just the core tech name in primary/framework fields
//   ✅ primary: "Next.js 14", framework: "React"
//   ❌ primary: "Next.js 14 with App Router and Server Components"
// - **MODERN STACK FOCUS**: Use 2024-2025 best practices (Next.js 14, Supabase, Clerk, etc.)
// - **DOMAIN-TAILORED**: Architecture must reflect the specific use case
// - **4-7 COMPONENTS**: Focus on essential components with clear boundaries
// - **SPECIFIC PROTOCOLS**: Use exact connection types like "tRPC", "WebSocket", "GraphQL"

// ## COMMON PATTERNS TO FOLLOW:

// **For SaaS/Web Apps:**
// - Next.js Frontend → tRPC API → Prisma → Supabase/Neon
// - Clerk Authentication as separate component
// - Real-time features with Supabase subscriptions

// **For AI Apps:**
// - Next.js Frontend → OpenAI Integration → Vector Database → Data Processing
// - Streaming responses with Vercel AI SDK
// - LangChain for complex workflows

// **For Web3 Knowledge Platform (like your example):**
// - "Frontend" (Next.js 14) → "Authentication" (Clerk) → "Backend" (tRPC) → "Database" (Supabase + Prisma)
// - "AI Verification Engine" (OpenAI GPT-4) → "Vector Store" (Pinecone)
// - "Smart Contract Layer" (Hardhat + wagmi) → "Token System" (ERC-20)

// ## CRITICAL SUCCESS FACTORS:
// 1. **Keep component names simple** - "Frontend", "Backend", etc. for core, descriptive for features
// 2. **Use clean technology names** in the technologies object
// 3. **Focus on modern, production-ready stacks** 
// 4. **Tailor to the specific domain** (blockchain + AI + knowledge platform)

// Return ONLY the JSON object with double curly brackets {{}} for LangChain compatibility, no additional text or explanations outside the JSON.

// Return ONLY the JSON object, no additional text or explanations outside the JSON.`

const template3 = `Generate the final architecture JSON using the component plan and tech stack.

COMPONENT PLAN: {componentPlan}
TECH STACK: {techStack}  

    🧠Conversation History
    {conversation_history}
    
    PREVIOUS ARCHITECTURE (If none then this is the first time we are generating an architecture)
    {architectureData}

Create a clean architecture with proper positioning and connections.

Component Icons (choose appropriate):
- Frontend: "monitor", "smartphone", "globe"
- Backend: "server", "cpu", "database"  
- Database: "database", "hard-drive"
- AI: "brain", "zap", "eye"
- Auth: "shield", "key", "lock"
- Blockchain: "link", "coins", "wallet"

Colors (Tailwind format):
- blue, green, purple, orange, red, yellow, indigo, pink

Position components in a logical flow (left to right, top to bottom).

Connection protocols:
- REST API, GraphQL, tRPC
- WebSocket, Server-Sent Events  
- Database queries, Real-time subscriptions
- HTTP requests, gRPC calls

Generate ONLY this JSON:
{{
  "components": [
    {{
      "id": "kebab-case-id",
      "title": "Component Name",
      "icon": "icon-name",
      "color": "from-blue-500 to-blue-600",
      "borderColor": "border-blue-500/30", 
      "technologies": {{
        "primary": "primary tech",
        "framework": "framework",
        "additional": "additional tools"
      }},
      "connections": ["connected-component-ids"],
      "position": {{ "x": number, "y": number }},
      "dataFlow": {{
        "sends": ["data types"],
        "receives": ["data types"]  
      }},
      "purpose": "Detailed component purpose"
    }}
  ],
  "connectionLabels": {{
    "component1-component2": "connection protocol"
  }},
  "architectureRationale": "Why this architecture works well"
}}`

    const prompt1 = PromptTemplate.fromTemplate(template1);
    const prompt2 = PromptTemplate.fromTemplate(template2);
    const prompt3 = PromptTemplate.fromTemplate(template3);
    // const context = await retrieveFunc(requirement, conversationHistory);
    // console.log("This is the context: ", context);
     // Format conversation history for the prompt
     const formattedHistory = conversationHistory.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');
 

  const chain1 = prompt1.pipe(llm).pipe(new StringOutputParser());
  const chain2 = prompt2.pipe(llm).pipe(new StringOutputParser());
  const componentPlan = await chain1.invoke({requirement: requirement, conversation_history: formattedHistory, architectureData: JSON.stringify(architectureData)});
  const techStack = await chain2.invoke({requirement: requirement, conversation_history: formattedHistory, architectureData: JSON.stringify(architectureData), componentPlan: JSON.stringify(componentPlan)});







    const chain3 = prompt3.pipe(llm).pipe(new StringOutputParser());
    const result = await chain3.invoke({componentPlan: JSON.stringify(componentPlan), techStack: JSON.stringify(techStack), requirement: requirement, conversation_history: formattedHistory, architectureData: JSON.stringify(architectureData)});
    return result;
}

export async function generateArchitectureWithToolCalling(requirement: string, conversationHistory: any[] = [], architectureData: any){
  // Format conversation history for the prompt
  const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
).join('\n');

const llm = new ChatOpenAI({openAIApiKey: process.env.OPENAI_API_KEY, model: "gpt-4o"});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `You are DevilDev, an expert software architect specializing in modern, production-ready systems. Your primary task is to analyze software requirements and generate comprehensive architecture components using the appropriate tools, then return a structured JSON response.

MANDATORY TOOL SELECTION:
You MUST call exactly ONE of these platform tools based on the requirement:
- webComponents: For web-based applications (websites, web apps, SaaS platforms, admin dashboards, web portals, browser-based tools)
- mobileComponents: For mobile applications (iOS, Android, React Native, Flutter, cross-platform mobile apps)

PLATFORM DETECTION RULES:
- If requirement mentions: "web", "website", "dashboard", "admin panel", "SaaS", "browser", "portal" → Use webComponents
- If requirement mentions: "mobile", "iOS", "Android", "app store", "mobile app", "React Native", "Flutter" → Use mobileComponents  
- If platform is ambiguous or unspecified → Default to webComponents and mention assumption in response
- If both platforms mentioned → Ask for clarification on primary platform

OPTIONAL TOOLS (Use only when explicitly needed):
- aiml_components: When requirement mentions AI, ML, chatbots, intelligent features, recommendations, NLP, computer vision
- blockchain_components: When requirement mentions Web3, blockchain, NFTs, tokens, smart contracts, DeFi, cryptocurrency, wallet integration
- auth_components: When requirement mentions user accounts, login, authentication, user management, role-based access
- payment_components: When requirement mentions payments, e-commerce, subscriptions, billing, checkout, transactions
- realtime_components: When requirement mentions real-time updates, live chat, notifications, collaboration, live data
- database_components: When requirement mentions complex data relationships, analytics, reporting, data warehousing
- analytics_components: When requirement mentions tracking, metrics, analytics, monitoring, performance insights
- notification_components: When requirement mentions email, SMS, push notifications, alerts, communication

ANALYSIS PROCESS:
1. First, identify the target platform (web vs mobile) - this determines your mandatory tool
2. Then, scan for specific features that require additional tools
3. Only call tools for features explicitly mentioned or strongly implied
4. Avoid calling tools for basic/standard features already covered by platform tools
5. If the application includes CRUD operations, then call the database_components and auth_components no matter what

RESPONSE REQUIREMENTS:
After using the necessary tools, return your response in this EXACT JSON format:
{{
  "platform_assumption": "If platform wasn't explicitly stated, mention your assumption here, otherwise null",
  "components": [
    {{
      "name": "Exact Component Name From Tool Response",
      "technologies": ["Technology1", "Technology2"],
      "description": "Brief description of component's role in the architecture",
      "category": "platform|auth|payment|realtime|aiml|blockchain|database|analytics|notification"
  }}
  ],
  "architecture_summary": "2-3 sentence overview of the complete system architecture and how components work together",
  "tools_used": ["list", "of", "tools", "called"],
  "estimated_complexity": "low|medium|high"
  }}

QUALITY GUIDELINES:
- Be decisive about platform selection - don't hedge
- Only include components that are actually needed for the specific requirement
- Ensure all component names and technologies come directly from tool responses
- Provide clear reasoning for tool selection in your analysis
- If a requirement seems to need conflicting platforms, ask for clarification

CRITICAL SUCCESS FACTORS:
1. ALWAYS call exactly one platform tool (webComponents OR mobileComponents)
2. ONLY call additional tools when the requirement explicitly needs those features
3. Component data must match tool outputs exactly
4. Provide clear, actionable architecture guidance`],
  
  ["human", `Software Requirement: {requirement}

Conversation History:
{conversation_history}

Previous Architecture (if any):
{architecture_data}

Please analyze this requirement step by step:
1. Determine the target platform (web vs mobile)
2. Identify additional features that require specialized tools
3. Call the appropriate tools (mandatory platform tool + optional feature tools)
4. Return the structured JSON response with all required components

Focus on creating a practical, production-ready architecture that directly addresses the stated requirements.`],
  
  new MessagesPlaceholder("agent_scratchpad")
]);

const tools = [basicWebComponentsTool, aimlComponentsTool, analyticsComponentsTool, authComponentsTool, blockchainComponentsTool, databaseComponentsTool, mobileComponentsTool, notificationComponentsTool, paymentComponentsTool, realtimeComponentsTool];

const agent = await createToolCallingAgent({
  llm,
  tools,
  prompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,
  maxIterations: 10, // Allow multiple tool calls
});

try {
  const result = await agentExecutor.invoke({
    requirement: requirement,
    conversation_history: formattedHistory,
    architecture_data: JSON.stringify(architectureData)
  });
  
  console.log("Result: ", result);
  return result.output;

} catch (error) {
  console.error("Error in generateArchitectureWithToolCalling:", error);
  throw error;
}
}




