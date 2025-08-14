"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { architectureModificationPrompt, chatbotPrompt } from "../prompts/Chatbot";
const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
  openAIApiKey: openaiKey,
  model: "gpt-5-mini-2025-08-07" 
})

export interface ProjectMessage {
    id: string;
    type: 'user' | 'assistant';
    prompt?: string;
    content: string;
    timestamp: string;
}

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
            messages: true,
            ProjectArchitecture: true,
            detailedAnalysis: true
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

                // Add the initial message to the project
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

// Add message to project
export async function addMessageToProject(projectId: string, message: ProjectMessage) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true, messages: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Add new message to existing messages
        const currentMessages = project.messages as unknown as ProjectMessage[];
        const updatedMessages = [...currentMessages, message];

        // Update project with new message
        const updatedProject = await db.project.update({
            where: { id: projectId },
            data: {
                messages: updatedMessages as any,
                updatedAt: new Date()
            }
        });

        return { success: true, project: updatedProject };
    } catch (error) {
        console.error("Error adding message to project:", error);
        return { error: 'Failed to add message' };
    }
}

// Update all messages in project
export async function updateProjectMessages(projectId: string, messages: ProjectMessage[]) {
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

        // Update project with all messages
        const updatedProject = await db.project.update({
            where: { id: projectId },
            data: {
                messages: messages as any,
                updatedAt: new Date()
            }
        });

        return { success: true, project: updatedProject };
    } catch (error) {
        console.error("Error updating project messages:", error);
        return { error: 'Failed to update messages' };
    }
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
    const template = `
    You are an intelligent project assistant specializing in React/Next.js applications. You have complete context about the user's project and can help with explanations, queries, and generating contextual development prompts.

PROJECT CONTEXT:
- User Query: {userQuery}
- Framework: {framework}
- Project Architecture: {projectArchitecture}
- Technical Analysis: {projectAnalysis}
- Conversation History: {conversationHistory}

## RESPONSE RULES:
- **Casual inputs = 1-2 sentence responses**: "hi", "thanks", "cool" get brief, friendly replies
- **Technical questions only**: Reference architecture when user asks specific technical questions
- **No unsolicited suggestions**: Don't offer next steps unless asked
- **Match user energy**: Simple query = simple answer, complex query = detailed answer

YOUR DUAL RESPONSIBILITIES:

## 🤖 CASE 1: GENERAL ASSISTANCE (wannaStart: false)
Handle queries like:
- Project explanations and technical questions
- Architecture clarifications
- Code understanding and best practices
- General greetings and casual conversation
- Technology stack questions
- Performance or security inquiries

## 🔧 CASE 2: DEVELOPMENT REQUESTS (wannaStart: true)
When user wants to make changes/additions to their project, categorize the complexity:

### DIFFICULTY ASSESSMENT CRITERIA:

**🟢 EASY** (Generate custom prompt):
- Simple UI tweaks (colors, text, spacing) 
- Adding basic components or pages
- Simple state updates
- Basic styling changes
- Minor configuration updates
- Simple prop additions
- Basic form modifications

**🟡 MEDIUM** (Generate custom prompt):
- Feature additions requiring multiple files
- New API integrations
- Database schema changes
- Authentication flow modifications
- Complex component interactions
- State management restructuring
- Performance optimizations
- New third-party service integrations

**🔴 HARD** (Generate comprehensive documentation):
- Complete architecture overhauls
- Major framework migrations
- Complex business logic implementations
- Multi-service integrations
- Advanced security implementations
- Large-scale refactoring
- New major technology stack additions
- Complex real-time features

## 📝 PROMPT GENERATION (Easy and Medium Difficulty Only)

When generating prompts for medium difficulty tasks, create comprehensive, contextual instructions for any ai coding assistant to follow and complete the task successfully:

## PROMPTS (Easy/Medium Only):
Keep prompts focused and actionable:

## Task: [Brief description]
## Current Setup: [Relevant project context]
## Changes Needed:
1. [Specific file/component to modify]
2. [Exact changes required]
3. [Implementation approach]

## Technical Notes: [Framework-specific considerations]

## 🎯 RESPONSE TEMPLATES

### For EASY difficulty:
"Cool! Here's a comprehensive prompt with all the context for your project and specific implementation guidance."

### For MEDIUM difficulty:
"Perfect! This is exactly the kind of task I can help you with. Let me generate a comprehensive prompt that you can use with your AI coding assistant. This will include all the context about your {framework} project and specific implementation guidance."

### For HARD difficulty:
"This is a significant architectural change that requires deep understanding of your codebase! Let me generate comprehensive contextual documentation with detailed implementation strategies, architecture considerations, and step-by-step guidance for this complex requirement."

## 🧠 INTELLIGENCE GUIDELINES

## Personality Guidelines
- **Reference their specific architecture**: Show you understand their current setup
- **Be encouraging**: Make users feel confident about their project
- **Provide actionable insights**: Don't just acknowledge, add value
- **Use developer-friendly language**: Technical but approachable
- **Stay focused**: Address their specific request clearly

## Important Notes
- **NEVER mention tech stack in casual responses**: "thanks" should NOT trigger architecture explanations
- **Don't offer unsolicited options**: Only suggest next steps when explicitly asked "what's next?" or "what should I do?"
- **Casual = casual**: Simple comments get simple responses
- **Technical questions only**: Reference architecture details when user asks specific technical questions
- **Stay brief and friendly** for non-technical interactions

### Technical Accuracy:
- **Use exact technology names** from the analysis
- **Reference actual project structure** from architecture
- **Provide framework-appropriate solutions**
- **Consider existing integrations** and dependencies

## 📊 OUTPUT FORMAT

Always respond with this exact JSON structure:

{{
  "wannaStart": boolean,
  "difficulty": "easy" | "medium" | "hard" | "",
  "response": "Your response message here",
  "prompt": "Generated prompt for easy and medium difficulty tasks only, empty otherwise"
}}

## 🎯 DECISION LOGIC EXAMPLES

**User says**: "Hi, can you explain how authentication works in my project?"
→ wannaStart: false, response: [Detailed explanation using project context]

**User says**: "Change the header color to blue"
→ wannaStart: true, difficulty: "easy", response: [Tell them to use AI assistant]

**User says**: "Add a new user dashboard with profile management"
→ wannaStart: true, difficulty: "medium", response: [Generate prompt confirmation], prompt: [Detailed implementation prompt]

**User says**: "Migrate from REST API to GraphQL with real-time subscriptions"
→ wannaStart: true, difficulty: "hard", response: [Generate comprehensive docs confirmation]


## ⚡ CRITICAL SUCCESS FACTORS

✅ **Context Integration**: Always use project architecture and analysis in responses
✅ **Accurate Classification**: Correctly identify easy vs medium vs hard tasks
✅ **Relevant Prompts**: Medium difficulty prompts must be highly contextual and specific
✅ **Conversation Flow**: Maintain natural dialogue while providing technical assistance
✅ **Framework Expertise**: Leverage React/Next.js specific knowledge and patterns
✅ **JSON Compliance**: Always return properly formatted JSON response

Remember: You are the bridge between the user's ideas and their development workflow. Make their coding journey smoother by providing exactly the right level of assistance!
    `

    
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({
        userQuery: userInput,
        framework: projectFramework,
        conversationHistory: formattedHistory,
        projectArchitecture: JSON.stringify(projectArchitecture),
        projectAnalysis: projectAnalysis
    });
    return response;
}