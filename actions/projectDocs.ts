"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "langchain/tools";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { countTokens } from "gpt-tokenizer";
import { ConversationSummaryMemory, ConversationSummaryBufferMemory } from 'langchain/memory';
import { architectureModificationPrompt, chatbotPrompt } from "../prompts/Chatbot";
import { generateEasyMediumPrompt, generateNthProjectPhase, generateProjectPlanDocs, initialDocsGenerationPrompt, projectChatBotPrompt, theProjectChatBotPrompt, ultraProjectChatBotPrompt } from "../prompts/ReverseArchitecture";
import { webResearchAgentPrompt, summarizeProjectDocsContextPrompt } from "../prompts/ProjectDocs";
import openai from "openai";

import { RunnableLambda } from "@langchain/core/runnables";

// Custom context window manager class
class ContextWindowManager {
    private maxInputTokens: number;
    private maxOutputTokens: number;
    
    constructor(maxInputTokens: number = 8000, maxOutputTokens: number = 2000) {
        this.maxInputTokens = maxInputTokens;
        this.maxOutputTokens = maxOutputTokens;
    }
    
    // Rough token estimation (4 chars = 1 token)
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }
    
    // Truncate text to fit within token limits
    private truncateToTokens(text: string, maxTokens: number): string {
        const estimatedTokens = this.estimateTokens(text);
        if (estimatedTokens <= maxTokens) return text;
        
        const ratio = maxTokens / estimatedTokens;
        const truncatedLength = Math.floor(text.length * ratio * 0.9); // 10% safety margin
        return text.substring(0, truncatedLength) + "...[truncated]";
    }
    
    // Process messages to fit context window
    processMessages(messages: any[]): any[] {
        let totalTokens = 0;
        const processedMessages: any[] = [];
        
        // Process messages in reverse order (keep most recent)
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            let content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
            
            const messageTokens = this.estimateTokens(content);
            
            if (totalTokens + messageTokens > this.maxInputTokens) {
                // Truncate this message to fit remaining space
                const remainingTokens = this.maxInputTokens - totalTokens;
                if (remainingTokens > 100) { // Only include if we have reasonable space
                    content = this.truncateToTokens(content, remainingTokens);
                    processedMessages.unshift({ ...message, content });
                }
                break;
            }
            
            processedMessages.unshift({ ...message, content });
            totalTokens += messageTokens;
        }
        
        return processedMessages;
    }
}

const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-nano-2025-08-07" 
})

const llm2 = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-nano-2025-08-07"
})
const tool = {"type": "web_search_preview"}
// Memory setup (summary memory to limit tokens)
const llmWithWeb = llm2.bindTools([tool]);






export async function summarizeProjectDocsContext(userQuery: string, projectFramework: string, conversationHistory: any[], projectAnalysis: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = PromptTemplate.fromTemplate(summarizeProjectDocsContextPrompt);
     // Format prompt with variables
//   const rawPrompt = await prompt.format({
//     userQuery,
//     framework: projectFramework,
//     projectAnalysis,
//     conversationHistory: formattedHistory,
//   });

//   // ✅ Count tokens locally before sending
//   const tokenCount =  countTokens(rawPrompt);
//   console.log("Estimated input tokens:", tokenCount);
//   console.log("Raw Prompt:", rawPrompt);

//   const enc = encoding_for_model("gpt-4"); // close enough for gpt-5-nano
//   const tokenCount = enc.encode(formattedPrompt).length;
//   console.log("Final Prompt Token Count:", tokenCount);
//   console.log("Prompt Preview:", formattedPrompt.slice(0, 1500));
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({
        userQuery: userQuery,
        framework: projectFramework,
        projectAnalysis: projectAnalysis,
        conversationHistory: formattedHistory
    });
    console.log("Summarized Context Response: ", response.content);
    console.log("Token Usage Summarized Context: ", response.usage_metadata);
    return response.content;
}

export async function generateWebSearchDocs(summarizedContext: string, framework: string) {

    const contextManager = new ContextWindowManager(12000, 5000);



   
    const truncatedContext = contextManager.processMessages([{
        role: 'user',
        content: summarizedContext
    }])[0].content;


    // Create a runnable that manages context window
    const contextAwareRunnable = RunnableLambda.from(async (input: any) => {
        // If the conversation gets too long, truncate it
        if (input.messages && input.messages.length > 0) {
            input.messages = contextManager.processMessages(input.messages);
        }
        return input;
    });




    const prompt = PromptTemplate.fromTemplate(webResearchAgentPrompt);
    const chain = contextAwareRunnable.pipe(prompt).pipe(llmWithWeb);;
    try {
        const response = await chain.invoke({
            summarizedContext: truncatedContext,
            framework: framework
        });
        
        console.log("Web Search Response: ", response.content);
        console.log("Token Usage Web Search: ", response.usage_metadata);
        return response.content;
    } catch (error) {
        console.error("Context window exceeded:", error);
        // Fallback with even more aggressive truncation
        const veryShortContext = truncatedContext.substring(0, 1000);
        const response = await chain.invoke({
            summarizedContext: veryShortContext,
            framework: framework
        });
        console.log("Web Search Response: ", response.content);
        console.log("Token Usage Web Search: ", response.usage_metadata);
        return response.content;
    }

}

export async function saveProjectSummarizedContext(projectChatId: any, nameDocs: string, summarizedContext: string) {



    // const projectSummarizedContext = await db.projectContextDocs.create({
        const projectContextDocs = await db.projectContextDocs.create({
            data: {
                projectChatId: projectChatId,
                summarizedContext: summarizedContext,
                contextName: nameDocs
            }
        });

        return { success: true, projectContextDocs };


}   

export async function saveProjectWebSearchDocs(projectChatId: any, webSearchDocs: string) {

    const projectContextDocs = await db.projectContextDocs.update({
        where: { id: projectChatId },
        data: { webSearchDocs: webSearchDocs }
    });
    return { success: true, projectContextDocs };
}
