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
  You are a senior AI/ML architect. Analyze the requirement and return ONLY AI/ML components with appropriate technology stacks.
  
  REQUIREMENT ANALYSIS:
  - 🧠 Conversation history: {conversation_history}
  - 📝 Current requirement: {requirement}
  - 📦 Previous architecture: {architectureData}

  
  **COMPONENT SELECTION RULES:**
  Select components based on the requirement and the conversation history:
  - "chatbot" or "chat" or "LLM" → LLM Integration
  - "search" or "RAG" or "documents" → Vector Database + Embeddings
  - "voice" or "speech" → Speech Processing
  - "vision" or "image" → Vision Processing  
  - "agents" or "tools" → Agent Framework
  - "training" or "fine-tuning" → Model Training
  - If general "AI" mentioned → Include LLM Integration only
  
  **TECHNOLOGY SELECTION:**  
  
  **LLM Providers:**
  - If requirement mentions "OpenAI" or "ChatGPT" → Use OpenAI GPT-4o
  - If requirement mentions "Claude" or "Anthropic" → Use Anthropic Claude
  - If requirement mentions "Gemini" or "Google" → Use Google Gemini
  - If requirement mentions "open source" → Use Mistral/Mixtral
  - If requirement mentions "enterprise" → Use Cohere
  - Otherwise → Use OpenAI GPT-4o (ideal choice)
  
  **AI Frameworks:**
  - If requirement mentions "LangChain" → Use LangChain
  - If requirement mentions "LangGraph" → Use LangGraph
  - If requirement mentions "LlamaIndex" → Use LlamaIndex
  - If requirement mentions "RAG" or "documents" → Use LlamaIndex
  - If requirement mentions "agents" → Use CrewAI or LangChain Agents
  - Otherwise → Use LangChain (ideal choice)
  
  **Vector Databases:**
  - If requirement mentions "Pinecone" → Use Pinecone
  - If requirement mentions "Weaviate" → Use Weaviate
  - If requirement mentions "Qdrant" → Use Qdrant
  - If requirement mentions "local" or "development" → Use Chroma
  - If requirement mentions "Supabase" → Use Supabase Vector
  - Otherwise → Use Supabase Vector (ideal choice)
  
  **Embedding Models:**
  - If requirement mentions "OpenAI" → Use OpenAI Embeddings
  - If requirement mentions "Cohere" → Use Cohere Embed
  - If requirement mentions "open source" → Use Hugging Face Embeddings
  - Otherwise → Use OpenAI Embeddings (ideal choice)
  
  **AVAILABLE AI/ML TECHNOLOGIES:**
  
  **LLM Providers:**
  **OpenAI GPT-4o** (DEFAULT) - Industry standard, chat, vision, function calling
  **Anthropic Claude** - Privacy-focused, strong reasoning, long context
  **Google Gemini** - Multimodal, Google ecosystem integration
  **Mistral/Mixtral** - Open-weight models, OSS communities
  **Cohere** - Enterprise focus, Canadian provider
  
  **AI Frameworks:**
  **LangChain** (DEFAULT) - Modular framework for LLM chains, tools, memory
  **LangGraph** - Graph-based LLM orchestration on LangChain
  **LlamaIndex** - Document loaders, indexes, RAG-focused
  **Haystack** - Python RAG and search pipelines
  **CrewAI** - Multi-agent task collaboration
  
  **Vector Databases:**
  **Pinecone** (DEFAULT) - Fully managed, real-time, scalable
  **Weaviate** - Open-source, great semantic search
  **Qdrant** - Rust-based, fast and efficient
  **Chroma** - Local-first, development-friendly
  **Supabase Vector** - Postgres extension for vectors
  
  **Specialized AI Tools:**
  **Speech**: OpenAI Whisper, Deepgram, AssemblyAI, ElevenLabs
  **Vision**: GPT-4o Vision, Gemini Vision, Claude 3.5 Vision
  **Agents**: OpenAI Function Calling, LangChain Agents, AutoGPT
  
  **OUTPUT FORMAT:**
  {{
    "components": [
      {{
        "name": "Component Name",
        "type": "ai",
        "purpose": "Component purpose and AI capability",
        "technologies": {{
          "primary": "Selected AI Service/Framework",
          "integration": "SDK/API method",
          "features": "Key AI capabilities",
          "additional": "Supporting tools if needed"
        }}
      }}  
    ]
  }}
  
  **ANALYSIS INSTRUCTIONS:**
  1. **Check for explicit AI features** mentioned in requirement
  2. **Include only AI components** that are specifically needed
  3. **Choose technologies** based on explicit mentions or ideal stack
  4. **Consider use case complexity** (simple chat vs complex RAG)
  5. **Match AI capabilities** to requirement needs
  
  Return only the JSON with the specifically needed AI/ML components.
  `);

const outputParser = new StringOutputParser();

const chain = prompt.pipe(llm).pipe(outputParser);

export const aimlComponentsTool = new DynamicStructuredTool({
  name: "aiml_components",
  description: "Generate AI/ML components and modern tech stack for artificial intelligence applications",
  schema: z.object({
    requirement: z.string().describe("User's AI/ML requirement"),
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