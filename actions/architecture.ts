"use server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function generateArchitecture(requirement: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are DevilDev, an expert software architect. Based on the user requirement, generate a complete, production-ready software architecture.

User Requirement: {requirement}

ANALYSIS FRAMEWORK:
1. Identify the core functionality and user interactions
2. Determine scalability requirements (users, data, traffic)
3. Consider security, performance, and maintainability needs
4. Choose modern, industry-standard technologies
5. Design for cloud-native, scalable deployment

TECHNOLOGY SELECTION GUIDELINES:
Frontend: React/Next.js (SEO + performance), Vue.js (lightweight), Angular (enterprise), Svelte (minimal)
Backend: Node.js + Express (JS ecosystem), Python Django/Flask, Ruby on Rails (rapid MVP), Spring Boot (enterprise)
Database: Supabase (BaaS + PostgreSQL), Neon (serverless PostgreSQL), MongoDB (NoSQL), MySQL (relational)
ORM: Prisma (type-safe, auto-generates), Drizzle (lightweight), Mongoose (MongoDB)
Authentication: NextAuth.js, Auth0, Clerk, Supabase Auth, Firebase Auth
Caching: Redis, Memcached
File Storage: AWS S3, Cloudinary, Supabase Storage
Real-time: WebSockets, Socket.io, Supabase Realtime, Pusher
API: REST, GraphQL, tRPC
Deployment: Vercel, Netlify, Railway, AWS, Google Cloud
Monitoring: Sentry, LogRocket, DataDog

COMPONENT DESIGN RULES:
- Frontend components: Use Monitor, Smartphone, Tablet, Globe icons
- Backend services: Use Server, Cpu, Code icons  
- Databases: Use Database, HardDrive icons
- Auth/Security: Use Shield, Lock, Users icons
- APIs/Integration: Use Globe, Link, ExternalLink icons
- File/Media: Use Image, Video, FileText, Cloud icons
- Real-time/Communication: Use MessageSquare, Bell, Zap icons

ARCHITECTURE PATTERNS:
- Microservices vs Monolith based on complexity
- Include CDN for static assets
- Add load balancers for high-traffic apps
- Include caching layers where appropriate
- Design database relationships (primary, cache, analytics)
- Add monitoring and logging components
- Include CI/CD pipeline for production apps

POSITIONING STRATEGY:
- Frontend components: Top area (y: 50-150)
- API Gateway/Load Balancer: Upper middle (y: 200-250)
- Backend services: Middle area (y: 300-400)
- Databases: Bottom area (y: 450-550)
- External services: Right side (x: 600-800)
- Spread components horizontally: x: 100, 300, 500, 700

CONNECTION TYPES:
- "HTTP/REST API" - standard API calls
- "GraphQL" - GraphQL queries
- "WebSocket" - real-time connections
- "Database Query" - DB operations
- "Authentication" - auth flows
- "File Upload" - media handling
- "CDN Delivery" - static assets
- "Event Stream" - real-time events

DATA FLOW EXAMPLES:
- Frontend sends: ["user-input", "form-data", "file-uploads"]
- API Gateway receives: ["http-requests"] and sends: ["processed-data"]
- Backend sends: ["database-queries", "api-responses"] 
- Database receives: ["crud-operations"] and sends: ["query-results"]

RESPONSE FORMAT:
Return ONLY a JSON object with this exact structure:

{
  "components": [
    {
      "id": "unique-component-id",
      "title": "Descriptive Component Name",
      "icon": "appropriate-icon-from-list",
      "color": "from-color-500 to-color-600",
      "borderColor": "border-color-500/30",
      "technologies": {
        "primary": "Main Technology",
        "framework": "Framework Used",
        "additional": "Other Tools"
      },
      "connections": ["connected-component-ids"],
      "position": { "x": 0-800, "y": 50-600 },
      "dataFlow": {
        "sends": ["specific-data-types"],
        "receives": ["specific-data-types"]
      }
    }
  ],
  "connectionLabels": {
    "component1-component2": "Connection Protocol/Type"
  }
}

REQUIREMENTS:
- 5-10 components based on project complexity
- Include realistic tech stack for 2024/2025
- Ensure bidirectional connections in arrays
- Use logical positioning and appropriate colors
- Include both core and supporting components (monitoring, caching, etc.)
- Consider modern deployment patterns (serverless, containers, edge)

Return ONLY the JSON object, no additional text.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({requirement: requirement});
    return result;
}