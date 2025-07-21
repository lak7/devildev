"use server";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { retriever } from "./retriever";
import { ChatMessage } from "@/app/dev/page";


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
  console.log(response);
  return response;

}

export async function generateArchitecture(requirement: string, conversationHistory: any[] = [], architectureData: any) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are **DevilDev**, an expert software architect specializing in building full-stack, scalable, and modern systems. Based on the user's requirement and the architectural knowledge provided below, generate a complete, production-ready software architecture.

---

🧠 **Conversation History**  
{conversation_history}

📚 **Retrieved Context**  
{context}

---

📝 **User Requirement**  
{requirement}

---

  ***PREVIOUS ARCHITECTURE***
  {architectureData}

  ANALYSIS FRAMEWORK:
  1. Identify the core functionality and user interactions
  2. Determine scalability requirements (users, data, traffic)
  3. Consider security, performance, and maintainability needs
  4. Select technologies from the provided context only
  5. Design for cloud-native, modular, and scalable deployment
  6. Always include the following key components with this name only:
     - Frontend
     - Backend
     - Database Layer
     - Authentication

RESPONSE FORMAT:
Return ONLY a JSON object with this exact structure:

{{
  "components": [
    {{ 
      "id": "unique-component-id",
      "title": "Descriptive Component Name",
      "icon": "appropriate-icon-from-list",
      "color": "from-{{color}}-{{shade}} to-{{color}}-{{shade}}", // Use exact Tailwind gradient format
      "borderColor": "border-{{color}}-{{shade}}/30", // Use exact Tailwind border format with opacity
      "technologies": {{
        "primary": "Main Technology",
        "framework": "Framework Used",
        "additional": "Other Tools"
      }},
      "connections": ["connected-component-ids"],
      "position": {{ "x": number, "y": number }},
      "dataFlow": {{
        "sends": ["specific-data-types"],
        "receives": ["specific-data-types"]
      }}
    }}
  ],
  "connectionLabels": {{
    "component1-component2": "Connection Protocol/Type"
  }}
}}

COLOR GUIDELINES:
- Use ONLY valid Tailwind CSS color names: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, slate, gray, zinc, neutral, stone
- Use ONLY valid shade numbers: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
- Gradient format: "from-blue-500 to-cyan-600"
- Border format: "border-blue-500/30"
- Component color mapping:
  - Frontend: blue gradients (from-blue-500 to-sky-600)
  - Backend: green gradients (from-green-500 to-emerald-600)
  - Database: purple gradients (from-purple-500 to-violet-600)
  - Authentication: orange gradients (from-orange-500 to-amber-600)
  - Infrastructure/DevOps: gray gradients (from-gray-600 to-slate-700)
  - Monitoring: cyan gradients (from-cyan-500 to-teal-600)
  - Caching: red gradients (from-red-500 to-pink-600)
  - API Gateway: indigo gradients (from-indigo-500 to-purple-600)

POSITIONING GUIDELINES:
Layout components in a logical flow pattern:

**3 Components Layout:**
- Component 1: x: 200, y: 100
- Component 2: x: 400, y: 100  
- Component 3: x: 300, y: 300

**4 Components Layout:**
- Component 1: x: 150, y: 100
- Component 2: x: 350, y: 100
- Component 3: x: 550, y: 100
- Component 4: x: 350, y: 300

**5 Components Layout:**
- Component 1: x: 100, y: 100
- Component 2: x: 300, y: 100
- Component 3: x: 500, y: 100
- Component 4: x: 300, y: 300
- Component 5: x: 500, y: 300

**6 Components Layout:**
- Component 1: x: 80, y: 80
- Component 2: x: 280, y: 80
- Component 3: x: 480, y: 80
- Component 4: x: 680, y: 80
- Component 5: x: 280, y: 280
- Component 6: x: 480, y: 280

**7 Components Layout:**
- Component 1: x: 60, y: 60
- Component 2: x: 220, y: 60
- Component 3: x: 380, y: 60
- Component 4: x: 540, y: 60
- Component 5: x: 220, y: 220
- Component 6: x: 380, y: 220
- Component 7: x: 540, y: 220

REQUIREMENTS:
- 3-7 components based on project complexity
- Must include these core components: Frontend, Backend, Database Layer, Authentication
- Include realistic tech stack for 2024/2025
- Ensure bidirectional connections in arrays
- Use ONLY the specified positioning patterns above
- Include both core and supporting components (monitoring, caching, etc.)
- Consider modern deployment patterns (serverless, containers, edge)
- Follow the color mapping exactly as specified

Return ONLY the JSON object, no additional text.`
console.log("This is the architecture data: ", JSON.stringify(architectureData))
console.log("This is the template: ", template)
    const prompt = PromptTemplate.fromTemplate(template);
    const context = await retrieveFunc(requirement, conversationHistory);
     // Format conversation history for the prompt
     const formattedHistory = conversationHistory.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({requirement: requirement, conversation_history: formattedHistory, context: context, architectureData: JSON.stringify(architectureData)});
    return result;
}