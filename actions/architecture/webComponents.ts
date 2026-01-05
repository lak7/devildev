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
  You are a senior web architecture specialist. Analyze the requirement and return ONLY core web application components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  TECHNOLOGY SELECTION RULES:
  
  **🌟 IDEAL STACK (USE BY DEFAULT):**
  - Frontend: Next.js 14 (App Router) with TypeScript
  - Styling: Tailwind CSS
  - Backend: Next.js API Routes (full-stack approach)
  - Language: TypeScript throughout
  
  **OVERRIDE CONDITIONS (Only use different stack if explicitly mentioned):**
  Frontend Overrides:
  - If requirement explicitly mentions "React only" → Use React + Express.js backend
  - If requirement explicitly mentions "Vue" → Use Vue.js + Express.js backend  
  - If requirement explicitly mentions "Svelte" → Use Svelte + Express.js backend
  - If requirement explicitly mentions "Angular" → Use Angular + Express.js backend
  
  Backend Overrides (only if separate backend explicitly needed):
  - If requirement explicitly mentions "Python" → Use FastAPI
  - If requirement explicitly mentions "Java" → Use Spring Boot
  - If requirement explicitly mentions "Express" → Use Express.js
  - If requirement explicitly mentions "NestJS" → Use NestJS
  - If requirement explicitly mentions "high performance Node.js" → Use Fastify
  
  **DEFAULT RULE: Unless a specific technology is explicitly mentioned in the requirement, ALWAYS use the Next.js full-stack ideal stack.**
  
  **AVAILABLE FRAMEWORKS:**
  
  Frontend Options:
  - Next.js: Full-stack React with SSR/SSG, TypeScript, App Router
  - React: Component-based UI library, JavaScript/TypeScript
  - Vue.js: Progressive framework, simple learning curve, TypeScript
  - Svelte: Compiled, no virtual DOM, lightweight, TypeScript
  - Angular: Enterprise-grade, batteries-included, TypeScript
  
  Backend Options:
  - Express.js: Minimal Node.js framework, JavaScript/TypeScript
  - Fastify: High-performance Node.js, JavaScript/TypeScript
  - NestJS: Scalable Node.js with OOP/DI, TypeScript
  - FastAPI: Modern Python API framework, high-performance
  - Flask: Lightweight Python WSGI framework
  - Django: Full-stack Python with ORM and admin
  - Spring Boot: Popular Java backend framework
  
  **COMPONENT STRUCTURE:**
  Always include these components based on requirement complexity:
  - Frontend (mandatory)
  - Backend (mandatory for dynamic apps)
  - Admin Panel (only if management features mentioned)
  
  **STYLING DEFAULTS:**
  - Next.js/React/Vue/Svelte → Tailwind CSS
  - Angular → Angular Material or Tailwind CSS
  
  **OUTPUT FORMAT:**
  Return ONLY this JSON structure:
  {{
    "components": [
      {{
        "name": "Frontend",
        "type": "core",
        "purpose": "User interface and client-side logic",
        "technologies": {{
          "primary": "Selected Framework",
          "language": "TypeScript/JavaScript",
          "styling": "Tailwind CSS",
          "additional": "Relevant additional tools"
        }},
        "reasoning": "Brief explanation for framework choice"
      }},
      {{
        "name": "Backend",
        "type": "core", 
        "purpose": "Server-side logic and API endpoints",
        "technologies": {{
          "primary": "Selected Framework",
          "language": "TypeScript/JavaScript/Python/Java",
          "runtime": "Node.js/Python/JVM",
          "additional": "Database connectors, validation libraries"
}},
        "reasoning": "Brief explanation for framework choice"
      }}
    ],
    "stack_rationale": "1-2 sentence explanation of overall stack choice",
    "development_approach": "full-stack|separated|monolithic"
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **First, check for explicit technology mentions** in the requirement
  2. **If NO specific technologies mentioned → Use Next.js full-stack ideal stack**
  3. **If specific technology mentioned → Use that technology with appropriate pairing**
  4. Consider complexity level (simple CRUD vs complex SaaS)
  5. Ensure technologies work well together
  6. Provide reasoning for any non-ideal stack choices
  
  **CONSTRAINTS:**
  - Only include WEB components (no mobile, AI, blockchain, real-time)
  - Focus on proven, production-ready technologies
  - Prefer TypeScript when possible for better developer experience
  - Consider SEO needs for public-facing applications
  - Match complexity to requirement scope
  
  Return only the JSON response with no additional explanation.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const basicWebComponentsTool = new DynamicStructuredTool({
  name: "basic_web_components",
  description: "Generate basic components and modern tech stack for typical web apps like CRUD or SaaS",
  schema: z.object({
    requirement: z.string().describe("User's software requirement"),
    conversation_history: z.string().describe("All prior conversation messages as a single formatted string"),
    architectureData: z.string().describe("Previous architecture as stringified JSON if any"),
  }),
  func: async (input) => {
    const { requirement, conversation_history, architectureData } = input as { requirement: string, conversation_history: string, architectureData: string };
    const result = await chain.invoke({
      requirement,
      conversation_history,
      architectureData,
    });
    return result;
  },
});
