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

export async function generateArchitecture(requirement: string, conversationHistory: any[] = []) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are **DevilDev**, an expert software architect specializing in building full-stack, scalable, and modern systems. Based on the user’s requirement and the architectural knowledge provided below, generate a complete, production-ready software architecture.

     ---

    🧠 **Conversation History**  
    {conversation_history}

    📚 **Retrieved Context**  
    {context}

    ---

    📝 **User Requirement**  
    {requirement}

    ---

      ANALYSIS FRAMEWORK:
      1. Identify the core functionality and user interactions
      2. Determine scalability requirements (users, data, traffic)
      3. Consider security, performance, and maintainability needs
      4. Select technologies from the provided context only
      5. Design for cloud-native, modular, and scalable deployment

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
    const context = await retrieveFunc(requirement, conversationHistory);
     // Format conversation history for the prompt
     const formattedHistory = conversationHistory.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({requirement: requirement, conversation_history: formattedHistory, context: context});
    return result;
}