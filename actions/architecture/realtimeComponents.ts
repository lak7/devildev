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
You are a senior realtime systems architect.

Given:
- 🧠 Conversation history: {conversation_history}
- 📝 Requirement: {requirement}
- 📦 Previous architecture data: {architectureData}

Your job is to return ONLY realtime communication components suitable for modern applications.

List only these possible components:
- WebSocket Server
- Message Broker
- Video/Audio Streaming
- Live Chat System
- Real-time Collaboration
- Event Broadcasting
- Presence Detection (optional)
- Screen Sharing (optional)
- Live Updates (optional)

For each component, suggest the best 2024-2025 realtime technology stack using this format:

{{
  "components": [
    {{
      "name": "WebSocket Server",
      "type": "core",
      "purpose": "Bidirectional real-time communication between client and server",
      "technologies": {{
        "primary": "Socket.IO",
        "framework": "Node.js",
        "additional": "Pusher, Ably, WebRTC"
      }}
    }},
    ...
  ]
}}

Only return this JSON. Don't explain anything.
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