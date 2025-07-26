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
  You are a senior database architect. Analyze the requirement and return ONLY database and storage components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 IDEAL DATABASE STACK (USE BY DEFAULT):**
  - Database: Supabase (PostgreSQL)
  - ORM: Prisma
  - Features: Real-time, auth integration, type-safe queries
  
  **DATABASE SELECTION RULES:**
  - If requirement mentions "Firebase" → Use Firebase Firestore
  - If requirement mentions "real-time" only → Use Firebase Realtime DB
  - If requirement mentions "MongoDB" → Use MongoDB Atlas
  - If requirement mentions "SQLite" or "embedded" → Use SQLite
  - If requirement mentions "mobile offline" → Use Realm or WatermelonDB
  - If requirement mentions "lightweight" → Use SQLite
  - Otherwise → Use Supabase + Prisma (ideal stack)
  
  **AVAILABLE DATABASES:**
  
  **Cross-Platform (Web + Mobile):**
  **Supabase (PostgreSQL)** (DEFAULT)
  - Features: Real-time via WAL, auth integration, SQL-based
  - Best for: Full-stack apps with real-time needs
  
  **Firebase Firestore**
  - Features: Document NoSQL, offline-first, real-time updates
  - Best for: Firebase ecosystem apps
  
  **Firebase Realtime DB**
  - Features: NoSQL, real-time updates, Firebase integration
  - Best for: Simple real-time applications
  
  **MongoDB Atlas**
  - Features: Cloud MongoDB, works with Realm for offline sync
  - Best for: Document-heavy applications
  
  **SQLite**
  - Features: Lightweight, file-based, embedded
  - Best for: Simple local storage needs
  
  **Mobile-Focused (Offline-First):**
  **Realm (MongoDB)**
  - Features: Object-oriented, offline sync, mobile-optimized
  - Best for: Complex mobile apps with offline needs
  
  **WatermelonDB**
  - Features: Optimized for React Native, lazy-loading, SQLite-based
  - Best for: Large-scale React Native applications
  
  **COMPONENT SELECTION:**
  Include only components mentioned or implied in requirements:
  - Primary Database (always include)
  - Cache Layer (if "cache", "Redis", "performance" mentioned)
  - File Storage (if "files", "images", "uploads" mentioned)
  - Search Engine (if "search", "Elasticsearch" mentioned)
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Primary Database",
        "type": "core",
        "purpose": "Main data persistence and real-time features",
        "technologies": {{
          "primary": "Selected Database",
          "orm": "ORM/SDK if applicable",
          "features": "Key database features",
          "additional": "Related tools/services"
}}
      }}
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Check for explicit database mentions** in requirement
  2. **If NO specific database mentioned → Use Supabase + Prisma**
  3. **Consider platform needs** (web-only vs mobile vs both)
  4. **Include only necessary components** based on requirement
  5. **Match database to use case** (real-time, offline, etc.)
  
  Return only the JSON with selected database components.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const databaseComponentsTool = new DynamicStructuredTool({
  name: "database_components",
  description: "Generate database and storage components with modern data stack",
  schema: z.object({
    requirement: z.string().describe("User's database/storage requirement"),
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