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
  ["system", `You are DevilDev, an expert software architect specializing in modern, production-ready systems. Your job is to analyze software requirements and use ONLY the appropriate tools to generate comprehensive architecture components, then return a structured JSON response.

AVAILABLE TOOLS:
- webComponents: For web applications (CRUD, SaaS, admin panels, dashboards) - includes Frontend, Backend, Database, Authentication
- mobileComponents: For mobile applications (iOS, Android, React Native, Flutter) - includes Mobile App, Push Notifications, Offline Sync
- aiml_components: For AI/ML applications - includes LLM Integration, Vector Database, Model Training, etc.
- database_components: For data storage needs - includes Primary Database, Cache Layer, File Storage, etc.
- auth_components: For authentication systems - includes User Management, OAuth, Session Management, etc.
- payment_components: For payment processing - includes Payment Gateway, Subscription Management, etc.
- realtime_components: For real-time features - includes WebSocket Server, Live Chat, Broadcasting, etc.
- blockchain_components: For Web3/blockchain apps - includes Smart Contracts, Wallet Integration, Token Management
- analytics_components: For analytics and monitoring - includes Data Analytics, User Tracking, Performance Monitoring
- notification_components: For notification systems - includes Email Service, Push Notifications, SMS Service

CRITICAL INSTRUCTIONS:
1. ONLY use components returned by the tools - DO NOT create your own components
2. Call ONLY the tools that are necessary based on the user's specific requirements
3. Choose between webComponents OR mobileComponents based on the platform specified:
   - Use webComponents for: web apps, websites, dashboards, admin panels, SaaS applications
   - Use mobileComponents for: mobile apps, iOS apps, Android apps, cross-platform mobile solutions
   - If both web and mobile are mentioned, use both tools
4. DO NOT call all tools by default - be selective and efficient

TOOL SELECTION LOGIC:
- webComponents OR mobileComponents: Choose based on target platform (required for most apps)
- aiml_components: ONLY if AI/ML features are explicitly mentioned (chatbots, ML models, AI processing)
- blockchain_components: ONLY if Web3/blockchain features are mentioned (NFTs, tokens, smart contracts, DeFi)
- auth_components: ONLY if user authentication/authorization is specifically required
- payment_components: ONLY if payment processing, e-commerce, or subscriptions are mentioned
- realtime_components: ONLY if real-time features are needed (live chat, real-time updates, collaboration)
- database_components: ONLY if complex/specialized data storage beyond basic needs is required
- analytics_components: ONLY if analytics, tracking, or monitoring is specifically mentioned
- notification_components: ONLY if email, SMS, or push notifications are explicitly needed

RESPONSE FORMAT:
After using the necessary tools, return your response in this EXACT JSON format:
{{
  "components": [
    {{
      "name": "Component Name From Tool",
      "technologies": ["Technology1", "Technology2"],
      "description": "Brief description of what this component does"
    }}
  ],
  "architecture_summary": "Brief overview of the complete architecture"
}}

IMPORTANT RULES:
- Use MINIMAL necessary tools - don't over-engineer
- Component names and technologies must come from the tools only
- Analyze the requirement carefully to determine the actual platform and features needed
- If the requirement is unclear about platform, ask for clarification before proceeding`],
  ["human", `Software Requirement: {requirement}

Conversation History:
{conversation_history}

Previous Architecture (if any):
{architecture_data}

Analyze this requirement and use ONLY the necessary tools to generate the required architecture components. Be selective and efficient - don't call unnecessary tools.`],
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




