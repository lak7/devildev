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
  You are a senior authentication architect. Analyze the requirement and return ONLY the authentication tool/service to use.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 DEFAULT AUTH TOOL: CLERK (unless explicitly mentioned otherwise)**
  
  **AUTH TOOL SELECTION:**
  - If requirement mentions "Firebase" → Use Firebase Auth
  - If requirement mentions "Supabase" → Use Supabase Auth  
  - If requirement mentions "Auth0" → Use Auth0
  - If requirement mentions "Stytch" → Use Stytch
  - If requirement mentions "passwordless" → Use Stytch
  - If requirement mentions "enterprise" → Use Auth0
  - Otherwise → Use Clerk (default)
  
  **AVAILABLE AUTH TOOLS:**
  
  **Clerk** (DEFAULT)
  - Features: Email/password, OAuth, MFA, user management UI
  - Platform: Web + Mobile (React Native)
  - Best for: Modern apps with great UX
  
  **Firebase Auth**
  - Features: Email/password, phone, OAuth, anonymous auth
  - Platform: Web + Mobile seamlessly
  - Best for: Google ecosystem apps
  
  **Supabase Auth**
  - Features: Email/password, magic links, OAuth, phone auth
  - Platform: Cross-platform support
  - Best for: Full-stack Supabase projects
  
  **Stytch**
  - Features: Passwordless, magic links, OTP, OAuth
  - Platform: Web + Mobile
  - Best for: Passwordless authentication
  
  **Auth0**
  - Features: Enterprise OAuth2, SAML, SSO, advanced rules
  - Platform: All platforms
  - Best for: Enterprise applications
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Authentication Service",
        "type": "auth",
        "purpose": "User authentication and management", 
        "technologies": {{
          "primary": "Selected Auth Tool",
          "features": "List of key features",
          "integration": "SDK/Library used"
        }}
      }}
    ]
  }}
  
  Return only the JSON with the selected auth tool.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const authComponentsTool = new DynamicStructuredTool({
  name: "auth_components",
  description: "To generate authentication, authorization, and user management architecture components including user registration/login systems, JWT/session management, OAuth/SSO integration, role-based access control (RBAC), multi-factor authentication (MFA), password security, user profiles, account management, API security, and identity providers. Use when requirements mention user accounts, login, signup, authentication, user management, permissions, roles, security, or user access control.",
  schema: z.object({
    requirement: z.string().describe("User's authentication requirement"),
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