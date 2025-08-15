"use server"
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { isNextOrReactPrompt, mainGenerateArchitecturePrompt } from '../prompts/ReverseArchitecture';
import { getFileContentTool, getRepoTreeTool, searchCodeTool } from './github/gitTools';
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
    openAIApiKey: openaiKey,
    model: "gpt-5-mini-2025-08-07"
  })
  const llm2 = new ChatOpenAI({
    openAIApiKey: openaiKey,
    model: "gpt-4o-2024-08-06"
  })


export async function checkPackageAndFramework(repositoryId: string, repoFullName: string){
    console.log("Step 0")
    const { userId } = await auth();
    let repoContent = null;
    let packageJson = null;
    let defaultBranch = null;
    
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!repositoryId || !repoFullName) {
        return { error: 'Missing required repository information' };
    }
    console.log("Step 1")
    
    // Get user's GitHub access token
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          githubAccessToken: true,
          isGithubConnected: true,
        },
      });
      console.log("Step 2")
      if (!user?.isGithubConnected || !user.githubAccessToken) {
        return { error: 'GitHub not connected' };
      }
      console.log("Step 3")

      // Get repository info to fetch default branch
      try {
        const repoInfoResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}`,
          {
            headers: {
              'Authorization': `Bearer ${user.githubAccessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'DevilDev-App',
            },
          }
        );
        console.log("Step 3.1")
        if (!repoInfoResponse.ok) {
          return { error: 'Failed to fetch repository information' };
        }
        const repoInfo = await repoInfoResponse.json();
        defaultBranch = repoInfo.default_branch;
        console.log("Step 3.2: Default branch is", defaultBranch);
      } catch (error) {
        console.error('Error fetching repository info:', error);
        return { error: 'Failed to fetch repository information' };
      }
      console.log("Step 3.3")
      // Get repository contents
      try{
        const repoContentResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents`,
            {
              headers: {
                'Authorization': `Bearer ${user.githubAccessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevilDev-App',
              },
            }
          );
          console.log("Step 4")
          if (!repoContentResponse.ok) {
            return { error: 'Failed to fetch repository contents' };
          } 
          console.log("Step 5")

           repoContent = await repoContentResponse.json();
           repoContent = repoContent.map((item: { name: any; }) => item.name);
           console.log("Step 5.1: ", repoContent)
      }catch(error){
        console.error('Error fetching repository contents:', error);
        return { error: 'Failed to fetch repository contents' };
      }
      console.log("Step 6")
      // Get package.json if exists
      try{ 
        if(repoContent){ 
            console.log("Step 6.1")
            const packageJsonResponse = repoContent.find((item: any) => item === 'package.json');
            console.log("Step 6.2: ", packageJsonResponse)
            if(packageJsonResponse){
                console.log("Step 6.3")
                const packageJsonContent = await fetch(
                    `https://api.github.com/repos/${repoFullName}/contents/package.json`,
                    { 
                        headers: {
                          'Authorization': `Bearer ${user.githubAccessToken}`,
                          'Accept': 'application/vnd.github.v3+json',
                          'User-Agent': 'DevilDev-App',
                        },
                      }
                );
                console.log("Step 6.4")
                if (packageJsonContent.ok) {
                  console.log("Step 6.5")
                  packageJson = await packageJsonContent.json();
                  
                  // Decode the Base64 content to plain text
                  if (packageJson.content && packageJson.encoding === "base64") {
                    const decoded = Buffer.from(packageJson.content, "base64").toString("utf-8");
                    packageJson = JSON.parse(decoded); // Now it's the actual JSON object
                  }
                  console.log("Step 6.5.1: ", packageJson)
                }else{
                    return { error: 'Failed to fetch package.json' };
                }
            }else{
                console.log("Step 6.6")
                return { isValid: false, framework: "" };
            }
          }
      }catch(error){
        console.error('Error fetching package.json:', error);
        return { isValid: false, framework: "" };
      }
      console.log("Step 7")
      // Check if the project is a react or next project
      const template = isNextOrReactPrompt
      const prompt = PromptTemplate.fromTemplate(template);
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
      const result = await chain.invoke({repoContent: JSON.stringify(repoContent), packageJson: JSON.stringify(packageJson)});
      console.log("Step 8")
      const resultObject = JSON.parse(result);
      if(resultObject.isValid){
            const project = await db.project.create({
            data: {
                name: repoFullName.split('/')[1] || repoFullName, // Use repo name as project name
                userId: userId,
                repoId: repositoryId,
                repoFullName: repoFullName,
                repoContent: repoContent,
                packageJson: packageJson,
                framework: resultObject.framework,
                defaultBranch: defaultBranch,
            }
            });
      }
        return result;
      
      
     

}
 
export async function generateArchitecture(projectId: string){
    console.log("Step 0")
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const project = await db.project.findUnique({
        where: { id: projectId, userId: userId },
        select: {
            name: true,
            framework: true,
            packageJson: true,
            repoContent: true,
            repoFullName: true,
            defaultBranch: true,
            user: {
              select: {
                githubUsername: true,
                githubAccessToken: true,
              }
            }
        }
    });
    console.log("Step 1")
    if(!project){
        return { error: 'Project not found' };
    }

    const stringifiedPackageJson = JSON.stringify(project.packageJson);
    const stringifiedRepoContent = JSON.stringify(project.repoContent);
    const stringifiedDefaultBranch = project.defaultBranch;

    const { name, framework, packageJson, repoContent, repoFullName, defaultBranch, user } = project;
    const { githubUsername, githubAccessToken } = user;

    if (!githubAccessToken || !repoFullName) {
        return { error: 'Missing GitHub access token or repository information' };
    }
    console.log("Step 2")
    // Parse repo owner and name from repoFullName
    const [owner, repo] = repoFullName.split('/');
    
    // Create tools with pre-filled GitHub credentials
    const repoAnalysisTools = [
        getRepoTreeTool,
        getFileContentTool, 
        searchCodeTool
    ];
    console.log("Step 3")
   // Create the reverse architecture analysis prompt
      const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an elite software architecture reverse engineer specializing in React/Next.js applications. Your mission is to analyze GitHub repositories and extract comprehensive architectural insights through strategic code examination.

    REPOSITORY CONTEXT:
    - Repository: {repoFullName}
    - Framework: {framework} (React/Next.js confirmed)
    - Default Branch: {defaultBranch}
    - Package.json Dependencies: {packageJson}
    - Root Structure: {repoContent}

    STRATEGIC TOOL USAGE PHILOSOPHY:
    🎯 **Use tools ONLY when critical information cannot be inferred from existing context**
    - Start analysis with provided package.json and root structure
    - Make educated assumptions based on React/Next.js patterns
    - Tool calls should be strategic, not exhaustive
    - Prioritize high-impact files over comprehensive scanning

    AVAILABLE TOOLS (Use Sparingly):
    1. **getRepoTree** - For understanding complete project structure (use only if root content is insufficient)
    2. **getFileContent** - For reading critical configuration/implementation files
    3. **searchCode** - For locating specific architectural patterns or technologies

    TOOL PARAMETERS:
    - owner: {owner}
    - repo: {repo}
    - accessToken: {githubAccessToken}
    - branch: {defaultBranch}

    ANALYSIS FRAMEWORK - REACT/NEXT.JS SPECIALIZED:

    ## 1. PROJECT STRUCTURE ANALYSIS
    **Infer from provided data first, tool call only if needed:**
    - **Next.js App Router** (app/ directory) vs **Pages Router** (pages/ directory)
    - **Component Organization**: components/, ui/, layouts/, hooks/
    - **Configuration Files**: next.config.js, tailwind.config.js, tsconfig.json
    - **Build System**: package.json scripts, build configurations

    ## 2. FRONTEND ARCHITECTURE DEEP DIVE
    **Key Areas to Identify:**
    - **Rendering Strategy**: SSG, SSR, ISR, Client-side patterns
    - **Component Architecture**: Atomic design, feature-based, or hybrid
    - **State Management**: React Context, Zustand, Redux, Jotai patterns
    - **Styling System**: Tailwind, CSS Modules, Styled Components, Emotion
    - **UI Framework**: shadcn/ui, Material-UI, Ant Design, Custom components
    - **Form Handling**: React Hook Form, Formik, or native approaches

    ## 3. BACKEND/API LAYER ANALYSIS
    **For Next.js Applications:**
    - **API Routes Structure**: pages/api/ or app/api/ patterns
    - **Server Components**: app/ directory server component usage
    - **Middleware**: Authentication, logging, CORS implementations
    - **Database Integration**: Prisma, Drizzle, direct database clients
    - **Authentication**: NextAuth.js, Clerk, Supabase Auth, custom JWT

    ## 4. DATA MANAGEMENT & EXTERNAL SERVICES
    **Critical Integrations to Identify:**
    - **Database**: PostgreSQL, MySQL, MongoDB connection patterns
    - **ORM/Query Builder**: Prisma, Drizzle ORM, raw SQL patterns
    - **External APIs**: REST clients, GraphQL (Apollo, React Query)
    - **File Storage**: AWS S3, Cloudinary, Supabase Storage
    - **Real-time Features**: WebSockets, Server-Sent Events, Pusher

    ## 5. DEPLOYMENT & INFRASTRUCTURE
    **Production Considerations:**
    - **Hosting Platform**: Vercel, Netlify, custom deployment
    - **Environment Management**: .env patterns, configuration strategies
    - **Performance**: Image optimization, bundle analysis, caching strategies
    - **Monitoring**: Analytics, error tracking, logging solutions

    INTELLIGENT ANALYSIS STRATEGY:

    ### Phase 1: Context-Driven Inference (No Tools)
    1. **Analyze provided package.json** for immediate architectural insights
    2. **Interpret root structure** to understand project organization
    3. **Make educated framework predictions** based on dependencies
    4. **Identify likely patterns** from standard React/Next.js conventions

    ### Phase 2: Strategic Tool Usage (Minimal & Targeted)
    **Only use tools for:**
    - **Critical missing information** that affects architectural decisions
    - **Ambiguous technology choices** requiring code inspection
    - **Custom implementations** not evident from dependencies
    - **Complex integrations** needing specific configuration analysis

    ### Phase 3: Comprehensive Architecture Synthesis
    **Deliver detailed analysis covering:**

    **FRONTEND ARCHITECTURE:**
    - Component hierarchy and organization patterns
    - State management implementation details
    - Routing and navigation structure
    - UI/UX framework integration
    - Performance optimization strategies

    **BACKEND/API DESIGN:**
    - API endpoint organization and patterns
    - Authentication and authorization flow
    - Database schema and relationship patterns
    - External service integration architecture
    - Server-side rendering implementations

    **DATA FLOW & INTEGRATIONS:**
    - Client-server communication patterns
    - Database connection and query strategies
    - Third-party service integrations
    - Real-time data handling approaches
    - Caching and optimization layers

    **DEPLOYMENT & SCALABILITY:**
    - Production deployment configuration
    - Environment variable management
    - Performance monitoring setup
    - Scalability considerations and patterns

    ANALYSIS OUTPUT REQUIREMENTS:

    Provide a comprehensive architectural analysis structured as:

    1. **Executive Summary** (2-3 sentences)
    2. **Technology Stack Identification** (definitive list)
    3. **Architectural Patterns** (specific implementations found)
    4. **Component Relationships** (data flow and dependencies)
    5. **External Integrations** (APIs, databases, services)
    6. **Performance & Scalability Considerations**
    7. **Security Implementation Details**
    8. **Development & Deployment Workflow**

    **Quality Standards:**
    - Be specific and technical, avoid generic descriptions
    - Provide concrete evidence for architectural decisions
    - Highlight unique or custom implementations
    - Note potential architectural improvements or concerns
    - Focus on actionable insights for diagram generation

    Remember: Tool efficiency is paramount. Make intelligent inferences from available data before resorting to repository exploration.`],

      ["human", `Analyze the repository {repoFullName} and reverse engineer its complete software architecture.

    **Primary Objectives:**
    1. **Architectural Pattern Recognition** - Identify specific React/Next.js implementation patterns
    2. **Technology Stack Mapping** - Map exact technologies and their integration points
    3. **Component Relationship Analysis** - Understand data flow and component interactions
    4. **Integration Architecture** - Identify external services, APIs, and data sources
    5. **Performance & Security Patterns** - Analyze optimization and security implementations

    **Analysis Approach:**
    - Start with the provided package.json and root structure analysis
    - Use your React/Next.js expertise to infer architectural patterns
    - Make strategic tool calls only for critical missing information
    - Focus on architectural decisions that impact diagram generation
    - Provide specific, technical insights rather than generic observations

    **Expected Output:**
    A comprehensive architectural analysis that enables accurate diagram generation, including:
    - Exact technology stack with versions and integration patterns
    - Specific component architecture and organization strategy
    - Detailed data flow and state management implementation
    - Complete external service integration mapping
    - Performance optimization and security implementation details

    **Constraint:** Minimize tool usage - leverage your expertise and provided context first, then make targeted tool calls only for essential missing information.

    Begin your strategic analysis now.`],

      new MessagesPlaceholder("agent_scratchpad")
    ]);



    console.log("Step 4")
    console.log("Step 5")
    // Create agent executor
    const agent = await createToolCallingAgent({
        llm,
        tools: repoAnalysisTools,
        prompt,
    });
    console.log("Step 6")
    const agentExecutor = new AgentExecutor({
        agent,
        tools: repoAnalysisTools,
        verbose: true,
        maxIterations: 40, // Allow thorough analysis
    });
    console.log("Step 7")
    try {
        // Execute repository analysis
        const analysisResult = await agentExecutor.invoke({
          repoFullName: repoFullName,
            framework: framework,
            owner: owner,
            repo: repo,
            packageJson: stringifiedPackageJson,
            repoContent: stringifiedRepoContent,
            defaultBranch: defaultBranch || 'main',
            githubAccessToken: githubAccessToken
        });
        console.log("Step 8")
        console.log("Analysis Result: ", analysisResult.output)
        console.log("Step 9")
        const detailedAnalysis = await db.project.update({
            where: { id: projectId },
            data: { detailedAnalysis: JSON.stringify(analysisResult.output) }
        });
        console.log("Step 10")
            // Create the final architecture synthesis prompt
        // Enhanced Architecture Generation Prompt - Dynamic & Analysis-Driven
        const finalPrompt = PromptTemplate.fromTemplate(mainGenerateArchitecturePrompt);       // Generate final architecture based on analysis
        const finalChain = finalPrompt.pipe(llm).pipe(new StringOutputParser());
        const architecture = await finalChain.invoke({
            analysis_findings: JSON.stringify(analysisResult.output),
            name: name,
            framework: framework
        });
        console.log("Step 11")
        return {architecture: architecture, detailedAnalysis: JSON.stringify(analysisResult.output)};

    } catch (error) {
        console.error("Error in generateArchitecture:", error);
        return { error: 'Failed to generate architecture from repository analysis' };
    }
}

export async function testGenerateArchitecture(analysis: any, name: string, framework: string) {
  console.log("Step 0")
  console.log(JSON.stringify(analysis))
  if(!analysis){
    return { error: 'No analysis found' };
  }
  const finalPrompt = PromptTemplate.fromTemplate(mainGenerateArchitecturePrompt);       // Generate final architecture based on analysis
        const finalChain = finalPrompt.pipe(llm).pipe(new StringOutputParser());
        const architecture = await finalChain.invoke({
            analysis_findings: JSON.stringify(analysis),
            name: name,
            framework: framework
        });
        console.log("Step 11")
        return architecture;

}