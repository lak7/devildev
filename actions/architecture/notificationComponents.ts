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
  You are a senior notification systems architect. Analyze the requirement and return ONLY notification components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 IDEAL NOTIFICATION STACK (USE BY DEFAULT):**
  - Email: Resend (modern, TypeScript-native, Next.js friendly)
  - SMS: Twilio (reliable, global reach, great SDKs)
  - Push: Firebase Cloud Messaging (free, scalable, web + mobile)
  
  **COMPONENT SELECTION RULES:**
  Include ONLY components that are explicitly mentioned or strongly implied:
  - "email" or "transactional" → Email Service
  - "SMS" or "text message" → SMS Service  
  - "push notification" or "mobile notification" or "mobile app" → Push Notifications
  - "in-app" or "notification center" → In-App Notifications
  - If general "notifications" mentioned without specifics → Include Email Service only
  - If no notification type specified → Include Email Service only (most common need)
  
  **TECHNOLOGY SELECTION:**
  
  **Email Services:**
  - If requirement mentions "SendGrid" → Use SendGrid
  - If requirement mentions "Postmark" → Use Postmark
  - If requirement mentions "Mailgun" → Use Mailgun
  - Otherwise → Use Resend (ideal choice)
  
  **SMS Services:**
  - If requirement mentions "MessageBird" → Use MessageBird
  - If requirement mentions "Nexmo" or "Vonage" → Use Nexmo/Vonage
  - Otherwise → Use Twilio (ideal choice)
  
  **Push Notifications:**
  - If requirement mentions "OneSignal" → Use OneSignal
  - If requirement mentions "Pusher Beams" → Use Pusher Beams
  - Otherwise → Use Firebase Cloud Messaging (ideal choice)
  
  **AVAILABLE NOTIFICATION TOOLS:**
  
  **Email Services:**
  **Resend** (DEFAULT) - Modern, TypeScript-first, developer-friendly
  **SendGrid** - Cloud-based, great for transactional emails
  **Postmark** - Fast and reliable transactional email delivery
  **Mailgun** - Powerful APIs for sending, receiving, tracking emails
  
  **SMS Services:**
  **Twilio SMS** (DEFAULT) - Most popular, global SMS API
  **MessageBird** - European alternative, SMS + voice + chat
  **Nexmo (Vonage)** - SMS and voice messaging, developer-friendly
  
  **Push Notification Services:**
  **Firebase Cloud Messaging** (DEFAULT) - Free, web + mobile support
  **OneSignal** - Multi-platform with email/SMS add-ons
  **Pusher Beams** - Real-time and push notifications for mobile
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Email Service",
        "type": "notification",
        "purpose": "Transactional and marketing email delivery",
        "technologies": {{
          "primary": "Selected Email Service",
          "integration": "API/SDK method",
          "features": "Key capabilities",
          "platform": "web|mobile|cross-platform"
        }}
      }},
      {{
        "name": "SMS Service", 
        "type": "notification",
        "purpose": "Text message notifications and alerts",
        "technologies": {{
          "primary": "Selected SMS Service",
          "integration": "API/SDK method", 
          "features": "Key capabilities",
          "platform": "global|regional"
        }}
      }},
      {{
        "name": "Push Notifications",
        "type": "notification", 
        "purpose": "Mobile and web push notifications",
        "technologies": {{
          "primary": "Selected Push Service",
          "integration": "SDK/API method",
          "features": "Key capabilities", 
          "platform": "web|mobile|cross-platform"
        }}
      }}
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Check for explicit notification types** mentioned in requirement
  2. **Include only the notification types** that are specifically needed
  3. **If NO specific services mentioned → Use ideal stack** for selected types
  4. **Default to Email Service only** if just "notifications" mentioned generally
  5. **Consider platform compatibility** (web vs mobile vs both)
  
  Return only the JSON with the specifically needed notification components.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const notificationComponentsTool = new DynamicStructuredTool({
  name: "notification_components",
  description: "To generate notification and communication architecture components including email delivery systems, SMS messaging, push notifications (web/mobile), in-app alerts, real-time messaging, notification queues, delivery tracking, user preference management, and multi-channel communication workflows. Use when requirements mention email, SMS, push notifications, alerts, messaging, communication features, or user engagement through notifications.",
  schema: z.object({
    requirement: z.string().describe("User's notification system requirement"),
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