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
  You are a senior mobile app architect. Analyze the requirement and return ONLY mobile app components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}
  
  **🌟 IDEAL MOBILE STACK (USE BY DEFAULT):**
  - Framework: Flutter (fast, beautiful, performant)
  - Language: Dart
  - Backend: RESTful APIs
  - State Management: Provider/Riverpod (Flutter) or Zustand (React Native)
  
  **FRAMEWORK SELECTION RULES:**
  - If requirement mentions "Flutter" → Use Flutter + Dart
  - If requirement mentions "React Native" → Use React Native + TypeScript
  - If requirement mentions "Expo" → Use Expo + React Native + TypeScript
  - If requirement mentions "native performance" or "low-level features" → Use Native (SwiftUI + Jetpack Compose)
  - If requirement mentions "web-first" or "PWA" → Use Capacitor + Ionic
  - If requirement mentions "iOS only" → Use SwiftUI + Swift
  - If requirement mentions "Android only" → Use Jetpack Compose + Kotlin
  - If requirement mentions "AR", "Camera", "Bluetooth", "NFC" → Use Native frameworks
  - Otherwise → Use Flutter + Dart (ideal choice)
  
  **COMPONENT SELECTION RULES:**
  Include components based on requirement and conversation history:
  - Always include "Mobile Frontend" (core component)
  - "API" or "backend" → Backend API
  - "notifications" or "push" → Push Notifications
  - "auth" or "login" → Authentication
  - "offline" or "local data" → Local Storage
  - "store" or "deployment" → App Store Services
  - "analytics" or "tracking" → Analytics
  - "payment" or "purchase" → Payment Integration
  - "sync" or "real-time" → Offline Sync
  
  **AVAILABLE MOBILE TECHNOLOGIES:**
  
  **Cross-Platform Frameworks:**
  **Flutter** (DEFAULT) - Google's toolkit, fast, beautiful, performant (Dart)
  **React Native** - Meta-backed, huge ecosystem, native-like (JavaScript/TypeScript)
  **Expo** - Built on React Native, easy setup, great dev experience (JavaScript/TypeScript)
  **Capacitor + Ionic** - Web-first apps packaged for mobile, ideal for PWAs
  
  **Native Frameworks:**
  **iOS: SwiftUI** - Modern declarative UI framework (Swift)
  **Android: Jetpack Compose** - Modern declarative UI toolkit (Kotlin)
  
  **State Management:**
  **Flutter**: Provider, Riverpod, Bloc
  **React Native**: Zustand, Redux Toolkit, Context API
  
  **TECHNOLOGY COMBINATIONS:**
  
  **Flutter Stack:**
  - Framework: Flutter + Dart
  - State: Provider or Riverpod
  - Navigation: GoRouter
  - HTTP: Dio or http package
  
  **React Native Stack:**
  - Framework: React Native + TypeScript
  - State: Zustand or Redux Toolkit
  - Navigation: React Navigation
  - HTTP: Axios or fetch
  
  **Expo Stack:**
  - Framework: Expo + React Native + TypeScript
  - State: Zustand
  - Navigation: Expo Router
  - Services: Expo services (notifications, auth, etc.)
  
  **Native Stack:**
  - iOS: SwiftUI + Swift + Combine
  - Android: Jetpack Compose + Kotlin + Coroutines
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Mobile Frontend",
        "type": "core",
        "purpose": "Cross-platform mobile application interface",
        "technologies": {{
          "primary": "Selected Framework",
          "language": "Programming Language",
          "state_management": "State management solution",
          "navigation": "Navigation library",
          "additional": "Supporting tools and packages"
        }}
      }}
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Check for explicit framework mentions** in requirement
  2. **Consider performance requirements** (high performance → Native, standard → Flutter)
  3. **Include only mobile components** that are specifically needed
  4. **Choose framework** based on explicit mentions or Flutter default
  5. **Match technology stack** to selected framework
  
  Return only the JSON with the specifically needed mobile components.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const mobileComponentsTool = new DynamicStructuredTool({
  name: "mobile_components",
  description: "Generate mobile app components and modern tech stack for iOS/Android development",
  schema: z.object({
    requirement: z.string().describe("User's mobile app requirement"),
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