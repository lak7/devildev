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
  You are a senior realtime systems architect. Analyze the requirement and return ONLY realtime communication components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 IDEAL REALTIME STACK (USE BY DEFAULT):**
  - Transport: WebSockets
  - Pub/Sub: Upstash (Redis)
  - Abstraction: Socket.IO or Pusher
  - Video/Audio: LiveKit
  - DB Sync: Supabase Realtime
  
  **COMPONENT SELECTION RULES:**
  Include components based on requirement mentions:
  - "chat" or "messaging" → Live Chat System
  - "video" or "audio" or "call" → Video/Audio Streaming  
  - "collaboration" or "shared" → Real-time Collaboration
  - "notifications" or "updates" → Event Broadcasting
  - "presence" or "online status" → Presence Detection
  - "screen share" → Screen Sharing
  - "live data" or "sync" → Live Updates
  - Default → WebSocket Server (basic realtime)
  
  **TECHNOLOGY SELECTION:**
  - If requirement mentions "Pusher" → Use Pusher
  - If requirement mentions "Socket.IO" → Use Socket.IO
  - If requirement mentions "Ably" → Use Ably
  - If requirement mentions "video/audio" → Use LiveKit
  - If requirement mentions "Firebase" → Use Firebase Realtime DB
  - If requirement mentions "Stream" → Use Stream API
  - Otherwise → Use ideal stack combination
  
  **AVAILABLE REALTIME TECHNOLOGIES:**
  
  **Cross-Platform:**
  **WebSockets** - Native bi-directional messaging (browser & mobile)
  **Socket.IO** - WebSocket abstraction with reconnects, rooms, auth
  **Pusher** - Hosted WebSocket service with channels, presence, triggers
  **Ably** - Reliable pub/sub over WebSockets with history, fallback
  **LiveKit** - WebRTC platform for real-time audio/video streaming
  **Stream** - Chat/messaging APIs with React Native/Web SDKs
  **WebRTC** - Peer-to-peer media streaming across browsers/mobile
  
  **Web-Only:**
  **Upstash Pub/Sub** - Serverless Redis pub/sub for Edge Functions
  **Supabase Realtime** - PostgreSQL WAL-based row-level updates
  **Server-Sent Events** - One-way server-to-browser push
  **BroadcastChannel API** - Inter-tab communication
  
  **Mobile-Optimized:**
  **Firebase Realtime Database** - Auto-sync data on mobile/web
  **Realm Sync** - Real-time data sync between devices and cloud
  **WebRTC Native SDKs** - Platform-specific audio/video streaming
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Component Name",
        "type": "realtime",
        "purpose": "Component purpose and use case",
        "technologies": {{
          "primary": "Main technology/service",
          "transport": "Underlying transport protocol",
          "features": "Key capabilities",
          "platform": "web|mobile|cross-platform"
        }}
      }}
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Identify realtime features** mentioned in requirement
  2. **Select appropriate components** for those features
  3. **Choose technologies** based on explicit mentions or ideal stack
  4. **Consider platform compatibility** (web vs mobile vs both)
  5. **Match complexity** to requirement scope
  
  Return only the JSON with selected realtime components.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const realtimeComponentsTool = new DynamicStructuredTool({
  name: "realtime_components",
  description: "Generate realtime communication components with modern WebSocket/WebRTC stack",
  schema: z.object({
    requirement: z.string().describe("User's realtime system requirement"),
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