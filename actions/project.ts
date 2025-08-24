"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { architectureModificationPrompt, chatbotPrompt } from "../prompts/Chatbot";
import { generateEasyMediumPrompt, generateNthProjectPhase, generateProjectPlanDocs, initialDocsGenerationPrompt, projectChatBotPrompt, theProjectChatBotPrompt, ultraProjectChatBotPrompt } from "../prompts/ReverseArchitecture";
const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-mini-2025-08-07" 
})

const llm2 = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-nano-2025-08-07"
})
const tool = {"type": "web_search_preview"}
const llmWithWeb = llm2.bindTools([tool])

export interface ProjectMessage {
    id: string;
    type: 'user' | 'assistant';
    prompt?: string;
    content: string;
    projectDocsId?: string;
    docsName?: string;
    timestamp: string;
}


export const getProjects = cache(async () => {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }
    const projects = await db.project.findMany({
        where: { userId: userId },
        select: {
            id: true,
            name: true,
            framework: true,
            createdAt: true,
            repoFullName: true,
            defaultBranch: true,
        }
    });
    return projects;
})


export async function getProject(projectId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const project = await db.project.findUnique({
        where: { id: projectId, userId: userId },
        select: {
            name: true,
            userId: true,
            framework: true,
            createdAt: true,
            updatedAt: true,
            ProjectArchitecture: true,
            detailedAnalysis: true,
            ProjectChat: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });
    console.log("Project: ", project)
    return project;
}

export async function saveProjectArchitecture(
    projectId: string,
    architectureRationale: string,
    components: any,
    connectionLabels: any,
    componentPositions?: any,
    initialMessage?: string
) {
    console.log("In saveProjectArchitecture Step 0");
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    console.log("In saveProjectArchitecture Step 1");

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        console.log("In saveProjectArchitecture Step 2");
        if (!project) {
            return { error: 'Project not found' };
        }

        // Check if ProjectArchitecture already exists
        const existingArchitecture = await db.projectArchitecture.findUnique({
            where: { projectId: projectId } 
        });
        console.log("In saveProjectArchitecture Step 3");
        let savedArchitecture;
        
        if (existingArchitecture) {
            // Update existing architecture
            savedArchitecture = await db.projectArchitecture.update({
                where: { projectId: projectId },
                data: {
                    architectureRationale,
                    components,
                    connectionLabels,
                    componentPositions: componentPositions || existingArchitecture.componentPositions,
                    updatedAt: new Date()
                }
            });
        } else {
            // Create new architecture
            savedArchitecture = await db.projectArchitecture.create({
                data: {
                    projectId,
                    architectureRationale,
                    components,
                    connectionLabels,
                    componentPositions: componentPositions || {}
                }
            });

            // If this is a new architecture and we have an initial message, save it as the first assistant message
            if (initialMessage) {
                const assistantMessage: ProjectMessage = {
                    id: `${Date.now()}-init`,
                    type: 'assistant',
                    content: initialMessage,
                    timestamp: new Date().toISOString()
                };

                // Add the initial message to the project (will create/use first chat)
                await addMessageToProject(projectId, assistantMessage);
            }
        }
        console.log("In saveProjectArchitecture Step 4");
        return { success: true, architecture: savedArchitecture };
    } catch (error) {
        console.error("Error saving project architecture:", error);
        return { error: 'Failed to save project architecture' };
    }
}

// Update only component positions for a project (for performance during dragging)
export async function updateProjectComponentPositions(
    projectId: string, 
    positions: Record<string, { x: number; y: number }>
) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Check if ProjectArchitecture exists
        const existingArchitecture = await db.projectArchitecture.findUnique({
            where: { projectId: projectId }
        });
        
        if (!existingArchitecture) {
            return { error: 'Architecture not found' };
        }

        // Update only positions
        const savedArchitecture = await db.projectArchitecture.update({
            where: { projectId: projectId },
            data: {
                componentPositions: positions,
                updatedAt: new Date()
            }
        });

        return { success: true, architecture: savedArchitecture };
    } catch (error) {
        console.error("Error updating component positions:", error);
        return { error: 'Failed to update positions' };
    }
}

// Create a new project chat
export async function createProjectChat(projectId: string, title?: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Create new project chat
        const projectChat = await db.projectChat.create({
            data: {
                projectId,
                title: title || "New Chat",
                messages: []
            }
        });

        return { success: true, projectChat };
    } catch (error) {
        console.error("Error creating project chat:", error);
        return { error: 'Failed to create project chat' };
    }
}

// Get all project chats for a project
export async function getProjectChats(projectId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Get all project chats
        const projectChats = await db.projectChat.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' }
        });

        return { success: true, projectChats };
    } catch (error) {
        console.error("Error getting project chats:", error);
        return { error: 'Failed to get project chats' };
    }
}

// Get a specific project chat
export async function getProjectChat(projectId: string, chatId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Get specific project chat
        const projectChat = await db.projectChat.findUnique({
            where: { 
                id: BigInt(chatId),
                projectId: projectId 
            }
        });

        if (!projectChat) {
            return { error: 'Project chat not found' };
        }

        return { success: true, projectChat };
    } catch (error) {
        console.error("Error getting project chat:", error);
        return { error: 'Failed to get project chat' };
    }
}

// Add message to project chat
export async function addMessageToProjectChat(projectId: string, chatId: string, message: ProjectMessage) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // Get current project chat
        const projectChat = await db.projectChat.findUnique({
            where: { 
                id: BigInt(chatId),
                projectId: projectId 
            }
        });

        if (!projectChat) {
            return { error: 'Project chat not found' };
        }

        // Add new message to existing messages
        const currentMessages = projectChat.messages as unknown as ProjectMessage[];
        const updatedMessages = [...currentMessages, message];

        // Prepare update data
        const updateData: any = {
            messages: updatedMessages as any,
            updatedAt: new Date()
        };

        // If this is a user message and it's the first message in the chat, update the title
        if (message.type === 'user' && currentMessages.length === 0) {
            const title = message.content.length > 20 
                ? message.content.substring(0, 20) + '...' 
                : message.content;
            updateData.title = title;
        }

        // Update project chat with new message and potentially new title
        const updatedProjectChat = await db.projectChat.update({
            where: { id: BigInt(chatId) },
            data: updateData
        });

        return { success: true, projectChat: updatedProjectChat };
    } catch (error) {
        console.error("Error adding message to project chat:", error);
        return { error: 'Failed to add message' };
    }
}

// Legacy function - redirects to chat-based function
export async function addMessageToProject(projectId: string, message: ProjectMessage, chatId?: string) {
    if (chatId) {
        return addMessageToProjectChat(projectId, chatId, message);
    }
    
    // If no chatId provided, create or get the first chat
    const chatsResult = await getProjectChats(projectId);
    if (!chatsResult.success) {
        return chatsResult;
    }

    let targetChatId: string;
    if (chatsResult.projectChats!.length === 0) {
        // Create first chat
        const createResult = await createProjectChat(projectId);
        if (!createResult.success) {
            return createResult;
        }
        targetChatId = createResult.projectChat!.id.toString();
    } else {
        targetChatId = chatsResult.projectChats![0].id.toString();
    }

    return addMessageToProjectChat(projectId, targetChatId, message);
}

// Update all messages in project chat
export async function updateProjectChatMessages(projectId: string, chatId: string, messages: ProjectMessage[]) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Update project chat with all messages
        const updatedProjectChat = await db.projectChat.update({
            where: { id: BigInt(chatId) },
            data: {
                messages: messages as any,
                updatedAt: new Date()
            }
        });

        return { success: true, projectChat: updatedProjectChat };
    } catch (error) {
        console.error("Error updating project chat messages:", error);
        return { error: 'Failed to update messages' };
    }
}

// Legacy function - redirects to chat-based function
export async function updateProjectMessages(projectId: string, messages: ProjectMessage[], chatId?: string) {
    if (chatId) {
        return updateProjectChatMessages(projectId, chatId, messages);
    }
    
    // If no chatId provided, update the first chat
    const chatsResult = await getProjectChats(projectId);
    if (!chatsResult.success) {
        return chatsResult;
    }

    if (chatsResult.projectChats!.length === 0) {
        return { error: 'No project chats found' };
    }

    const targetChatId = chatsResult.projectChats![0].id.toString();
    return updateProjectChatMessages(projectId, targetChatId, messages);
}


export async function projectChatBot( userInput: string, projectFramework: string, conversationHistory: any[], projectArchitecture: any, projectAnalysis: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }
     // Format conversation history for the prompt
     const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n'); 

    console.log("This is the user Input: ", userInput);
    console.log("This is the conversation History: ", formattedHistory);
    
    const prompt = PromptTemplate.fromTemplate(ultraProjectChatBotPrompt);
    const chain = prompt.pipe(llmWithWeb).pipe(new StringOutputParser());
    const response = await chain.invoke({
        userQuery: userInput,
        framework: projectFramework,
        conversationHistory: formattedHistory,
        projectAnalysis: projectAnalysis
    });
    return response;
}

export async function generatePrompt(userInput: string, projectFramework: string, conversationHistory: any[], projectAnalysis: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }
    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n'); 

    const prompt = PromptTemplate.fromTemplate(generateEasyMediumPrompt);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
        const response = await chain.invoke({
            userQuery: userInput,
            framework: projectFramework,
            projectAnalysis: projectAnalysis,
            conversationHistory: formattedHistory
        });
    return response;
}

export async function initialDocsGeneration(userInput: string, projectFramework: string, conversationHistory: any[], projectAnalysis: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }
    // Format conversation history for the prompt
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const prompt = PromptTemplate.fromTemplate(initialDocsGenerationPrompt);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({
        userQuery: userInput,
        framework: projectFramework,
        projectAnalysis: projectAnalysis,
        conversationHistory: formattedHistory
    });
    return response;
}

// Create project context docs
export async function createProjectContextDocs(
    projectId: string,
    contextName: string,
    projectRules?: string,
    humanReview?: string,
    plan?: string,
    phases?: any[],
    phaseCount?: number
) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {

        // Create new project context docs
        const projectContextDocs = await db.projectContextDocs.create({
            data: {
                projectId,
                contextName,
                projectRules,
                humanReview, 
                plan,
                phases: phases as any,
                phaseCount
            }
        });

        return { success: true, projectContextDocs };
    } catch (error) {
        console.error("Error creating project context docs:", error);
        return { error: 'Failed to create project context docs' };
    }
}

// Get project context docs by ID
export async function getProjectContextDocs(projectId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        const projectContextDocs = await db.projectContextDocs.findMany({
            where: {projectId: projectId}
        });
        
        if (!projectContextDocs) {
            return { error: 'Project context docs not found' };
        }

        return {success: true, projectContextDocs: projectContextDocs};
    } catch (error) {
        console.error("Error getting project context docs:", error);
        return { error: 'Failed to get project context docs' };
    }
} 

export async function generateProjectPlan( framework: string, phaseCount: string, detailedAnalysis: string, requirement: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const prompt = PromptTemplate.fromTemplate(generateProjectPlanDocs);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({
        framework: framework,
        phaseCount: phaseCount,
        projectAnalysis: detailedAnalysis,
        requirement: requirement
    });
    return response;
}

export async function generateNthPhase(plan: string, framework: string, detailedAnalysis: string, requirement: string, phaseNum: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const prompt = PromptTemplate.fromTemplate(generateNthProjectPhase);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({
        plan: plan,
        framework: framework,
        projectAnalysis: detailedAnalysis,
        requirement: requirement,
        phaseNum: phaseNum
    });
    return response;
}

export async function updateProjectContextDocs(projectContextDocsId: string, plan: string, phases: any[]) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    await db.projectContextDocs.update({
        where: {id: projectContextDocsId},
        data: {plan: plan, phases: phases as any}
    })
}