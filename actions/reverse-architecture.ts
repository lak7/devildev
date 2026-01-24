"use server"
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { isNextOrReactPrompt, mainGenerateArchitecturePrompt, mainGenerateArchitecturePrompt2 } from '../prompts/ReverseArchitecture';
import { getFileContentTool, searchCodeTool, getFilePatchTool } from './github/gitTools';
import { getInstallationToken } from './githubAppAuth';
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
const { inngest } = await import('../src/inngest/client');

const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
    openAIApiKey: openaiKey,
    model: "gpt-5-mini-2025-08-07"
  })
  const llm2 = new ChatOpenAI({
    openAIApiKey: openaiKey,
    model: "gpt-4o-2024-08-06"
  })

// JSON Schema for structured architecture output
const architectureOutputSchema = {
  type: "object",
  description: "Architecture diagram output with components, connections, and rationale",
  properties: {
    components: {
      type: "array",
      description: "Array of architecture components representing runtime business capabilities",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique descriptive business-focused identifier" },
          title: { type: "string", description: "Business-focused component name" },
          icon: { type: "string", description: "Appropriate lucide icon name" },
          color: { type: "string", description: "Tailwind gradient class e.g. bg-gradient-to-r from-[color1] to-[color2]" },
          borderColor: { type: "string", description: "Tailwind border color class" },
          technologies: {
            type: "object",
            properties: {
              primary: { type: "string", description: "Main technology stack" },
              framework: { type: "string", description: "Key supporting framework" },
              additional: { type: "string", description: "Notable libraries or tools" }
            },
            required: ["primary", "framework", "additional"]
          },
          connections: {
            type: "array",
            items: { type: "string" },
            description: "Array of connected component IDs"
          },
          position: {
            type: "object",
            properties: {
              x: { type: "number", description: "X coordinate position" },
              y: { type: "number", description: "Y coordinate position" }
            },
            required: ["x", "y"]
          },
          dataFlow: {
            type: "object",
            properties: {
              sends: {
                type: "array",
                items: { type: "string" },
                description: "Business data types sent by this component"
              },
              receives: {
                type: "array",
                items: { type: "string" },
                description: "Business data types received by this component"
              }
            },
            required: ["sends", "receives"]
          },
          purpose: { type: "string", description: "Clear business function + technical approach description" },
          codeOwnership: {
            type: "object",
            properties: {
              primaryImplementation: {
                type: "object",
                description: "REQUIRED - core directories and files that ARE the component",
                properties: {
                  directories: { type: "array", items: { type: "string" } },
                  files: { type: "array", items: { type: "string" } },
                  confidence: { type: "number", minimum: 0.8, maximum: 1.0 },
                  rationale: { type: "string", description: "Brief explanation of why these paths are the core implementation" }
                },
                required: ["directories", "files", "confidence", "rationale"]
              },
              supportingRelated: {
                type: "object",
                description: "OPTIONAL - files that directly support this component",
                properties: {
                  directories: { type: "array", items: { type: "string" } },
                  files: { type: "array", items: { type: "string" } },
                  confidence: { type: "number", minimum: 0.5, maximum: 0.79 },
                  rationale: { type: "string" }
                },
                required: ["directories", "files", "confidence", "rationale"]
              },
              sharedDependencies: {
                type: "object",
                description: "OPTIONAL - shared infrastructure and utilities",
                properties: {
                  directories: { type: "array", items: { type: "string" } },
                  files: { type: "array", items: { type: "string" } },
                  confidence: { type: "number", minimum: 0.2, maximum: 0.49 },
                  rationale: { type: "string" }
                },
                required: ["directories", "files", "confidence", "rationale"]
              }
            },
            required: ["primaryImplementation"]
          }
        },
        required: ["id", "title", "icon", "color", "borderColor", "technologies", "connections", "position", "dataFlow", "purpose", "codeOwnership"]
      }
    },
    connectionLabels: {
      type: "object",
      description: "Business-focused connection descriptions keyed by 'component1-to-component2' format",
      additionalProperties: { type: "string" }
    },
    architectureRationale: {
      type: "string",
      description: "6-paragraph analysis focusing on current runtime architecture and business value delivery"
    }
  },
  required: ["components", "connectionLabels", "architectureRationale"]
} as const; 


export async function checkInfo(repositoryId: string, repoFullName: string){
  
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
    
    
    // Get user's GitHub access token
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          githubAccessToken: true,
          isGithubConnected: true,
        },
      });
      
      if (!user?.isGithubConnected || !user.githubAccessToken) {
        return { error: 'GitHub not connected' };
      }
      

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
        
        if (!repoInfoResponse.ok) {
          return { error: 'Failed to fetch repository information' };
        }
        const repoInfo = await repoInfoResponse.json();
        
        defaultBranch = repoInfo.default_branch;
        ;
        return { repoInfo: repoInfo, defaultBranch: defaultBranch };
      } catch (error) {
        console.error('Error fetching repository info:', error);
        return { error: 'Failed to fetch repository information' };
      }  
}

 
export async function checkPackageAndFramework(repositoryId: string, repoFullName: string, maxProjectSize: number, installationId?: string){
    
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
    
    
    const appFlowEnabled = process.env.GITHUB_APP_FLOW_ENABLED === 'true';
    // Prefer installation token when provided
    let authToken: string | null = null; 
    if (appFlowEnabled && installationId) {
      
      const { getInstallationToken } = await import('../actions/githubAppAuth');
      const { token } = await getInstallationToken(installationId);
      authToken = token;
    } else {
      // Get user's GitHub access token (OAuth fallback)
      const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            githubAccessToken: true,
            isGithubConnected: true,
          },
        });
        
        if (!user?.isGithubConnected || !user.githubAccessToken) {
          return { error: 'GitHub not connected' };
        }
        authToken = user.githubAccessToken;
    }
      

      // Get repository info to fetch default branch
      try {
        const repoInfoResponse = await fetch(
          `https://api.github.com/repos/${repoFullName}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'DevilDev-App',
            },
          }
        );
        
        if (!repoInfoResponse.ok) {
          return { error: 'Failed to fetch repository information' };
        }
        const repoInfo = await repoInfoResponse.json();
        if(repoInfo.size > maxProjectSize){
          return {status: "tooBig", error: 'Repository size is too large' };
        }
        
        defaultBranch = repoInfo.default_branch;
        ;
      } catch (error) {
        console.error('Error fetching repository info:', error);
        return { error: 'Failed to fetch repository information' };
      }  
      
      // Get repository contents
      try{   
        const repoContentResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents`,
            { 
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevilDev-App',
              }, 
            }
          );                              
          
          if (!repoContentResponse.ok) {
            return { error: 'Failed to fetch repository contents' };
          } 
                

           repoContent = await repoContentResponse.json();
           repoContent = repoContent.map((item: { name: any; }) => item.name);
           
      }catch(error){
        console.error('Error fetching repository contents:', error);
        return { error: 'Failed to fetch repository contents' };
      }
      
      // Get package.json if exists
      try{ 
        if(repoContent){ 
            
            const packageJsonResponse = repoContent.find((item: any) => item === 'package.json');
            
            if(packageJsonResponse){
                
                const packageJsonContent = await fetch(
                    `https://api.github.com/repos/${repoFullName}/contents/package.json`,
                    { 
                        headers: {
                          'Authorization': `Bearer ${authToken}`,
                          'Accept': 'application/vnd.github.v3+json',
                          'User-Agent': 'DevilDev-App',
                        },
                      }
                );
                
                if (packageJsonContent.ok) {
                  
                  packageJson = await packageJsonContent.json();
                  
                  // Decode the Base64 content to plain text
                  if (packageJson.content && packageJson.encoding === "base64") {
                    const decoded = Buffer.from(packageJson.content, "base64").toString("utf-8");
                    packageJson = JSON.parse(decoded); // Now it's the actual JSON object
                  }
                  
                }else{
                    return { error: 'Failed to fetch package.json' };
                }
            }else{
                
                return { isValid: false, framework: "" };
            }
          }
      }catch(error){
        console.error('Error fetching package.json:', error);
        return { isValid: false, framework: "" };
      } 
      
      // Check if the project is a react or next project
      const template = isNextOrReactPrompt 
      const prompt = PromptTemplate.fromTemplate(template);
      const chain = prompt.pipe(llm).pipe(new StringOutputParser());
      const result = await chain.invoke({repoContent: JSON.stringify(repoContent), packageJson: JSON.stringify(packageJson)});
      
      const resultObject = JSON.parse(result);
      let project = null;
      if(resultObject.isValid){
            project = await db.project.create({
            data: {
                name: repoFullName.split('/')[1] || repoFullName,
                userId: userId,
                repoId: repositoryId,  
                repoFullName: repoFullName,
                repoContent: repoContent,
                packageJson: packageJson,
                framework: resultObject.framework,
                defaultBranch: defaultBranch,
                ...(installationId ? { githubInstallationId: BigInt(installationId) } : {}),
            }
            });
      }
        return {result: result, project: project};
}

export async function getRepoTree(projectId: string) {
  try {
    // Fetch project details
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        repoFullName: true,
        defaultBranch: true,
        githubInstallationId: true,
      },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    if (!project.githubInstallationId) {
      return { error: 'GitHub installation ID not found for this project' };
    }

    if (!project.repoFullName) {
      return { error: 'Repository full name not found' };
    }

    // Get installation token (GitHub App flow only)
    const { token: accessToken } = await getInstallationToken(String(project.githubInstallationId));

    // Parse repo owner and name
    const [owner, repo] = project.repoFullName.split('/');
    const branch = project.defaultBranch || 'main';

    // Fetch repository tree recursively
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevilDev-App',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { error: `Repository or branch not found: ${owner}/${repo}/${branch}` };
      }
      return { error: `GitHub API error: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();

    if (!data.tree || !Array.isArray(data.tree)) {
      return { error: 'Invalid response from GitHub API' };
    }

    // Define excluded directories and files (build artifacts, dependencies, config files)
    const excludedDirectories = [
      '.github',
      '.git',
      'node_modules',
      '.next',
      '.nuxt',
      '.vscode',
      '.idea',
      'dist',
      'public',
      'assets',
      'build',
      '.cache',
      'coverage',
      '.nyc_output',
      '.turbo',
      '.vercel',
      '.DS_Store',
      'Thumbs.db',
    ];

    // Filter items by depth (max depth 4) and exclude unwanted directories/files
    // Root level = depth 0, counting '/' in path
    const filteredTree = data.tree.filter((node: any) => {
      const depth = node.path.split('/').length - 1;
      if (depth > 4) {
        return false;
      }

      // Check if path contains any excluded directory
      const pathParts = node.path.split('/');
      for (const part of pathParts) {
        if (excludedDirectories.includes(part)) {
          return false;
        }
      }

      // Exclude actual .env files (but keep .env.example, .env.local.example, etc.)
      if (node.path.endsWith('.env') && !node.path.includes('.example') && !node.path.includes('.sample')) {
        return false;
      }

      // Exclude log files
      if (node.path.endsWith('.log')) {
        return false;
      }

      return true;
    });

    // Transform flat array into nested tree structure
    interface TreeNode {
      f?: string[];
      d?: { [key: string]: TreeNode };
    }

    const nestedTree: TreeNode = {
      f: [],
      d: {},
    };

    filteredTree.forEach((node: any) => {
      const pathParts = node.path.split('/');
      const isFile = node.type === 'blob';

      if (pathParts.length === 1) {
        // Root level item
        if (isFile) {
          if (!nestedTree.f) nestedTree.f = [];
          nestedTree.f.push(pathParts[0]);
        } else {
          if (!nestedTree.d) nestedTree.d = {};
          if (!nestedTree.d[pathParts[0]]) {
            nestedTree.d[pathParts[0]] = {};
          }
        }
      } else {
        // Nested item - traverse the tree
        let currentLevel = nestedTree;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const dirName = pathParts[i];
          
          if (!currentLevel.d) currentLevel.d = {};
          if (!currentLevel.d[dirName]) {
            currentLevel.d[dirName] = {};
          }
          
          currentLevel = currentLevel.d[dirName];
        }

        // Add the final item (file or directory)
        const lastName = pathParts[pathParts.length - 1];
        if (isFile) {
          if (!currentLevel.f) currentLevel.f = [];
          currentLevel.f.push(lastName);
        } else {
          if (!currentLevel.d) currentLevel.d = {};
          if (!currentLevel.d[lastName]) {
            currentLevel.d[lastName] = {};
          }
        }
      }
    });

    // Helper function to remove empty directory objects
    const cleanEmptyDirectories = (node: TreeNode): TreeNode | null => {
      const cleaned: TreeNode = {};
      
      // Process files
      if (node.f && node.f.length > 0) {
        cleaned.f = node.f;
      }
      
      // Process directories
      if (node.d) {
        const cleanedDirs: { [key: string]: TreeNode } = {};
        for (const [dirName, dirNode] of Object.entries(node.d)) {
          const cleanedDir = cleanEmptyDirectories(dirNode);
          if (cleanedDir && (cleanedDir.f?.length || cleanedDir.d)) {
            cleanedDirs[dirName] = cleanedDir;
          }
        }
        if (Object.keys(cleanedDirs).length > 0) {
          cleaned.d = cleanedDirs;
        }
      }
      
      // Return null if node is completely empty, otherwise return cleaned node
      if (!cleaned.f?.length && !cleaned.d) {
        return null;
      }
      
      return cleaned;
    };

    const cleanedTree = cleanEmptyDirectories(nestedTree) || {};

    return {
      success: true,
      tree: cleanedTree,
      totalItems: filteredTree.length,
      truncated: data.truncated || false,
    };

  } catch (error) {
    console.error('Error fetching repository tree:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch repository tree' };
  }
}
 
export async function generateArchitecture(projectId: string, repoTree?: any){

    const project = await db.project.findUnique({
        where: { id: projectId},
        select: {
            name: true,
            framework: true,
            packageJson: true,
            repoContent: true,
            repoFullName: true,
            defaultBranch: true,
            detailedAnalysis: true,
            githubInstallationId: true,
            user: {
              select: {
                githubUsername: true,
                githubAccessToken: true,
              }
            }
        }
    });
    
    if(!project){
        return { error: 'Project not found' };
    }

    const stringifiedPackageJson = JSON.stringify(project.packageJson);
    const stringifiedRepoContent = JSON.stringify(project.repoContent);
    const stringifiedDefaultBranch = project.defaultBranch;

    const { name, framework, packageJson, repoContent, repoFullName, defaultBranch, user } = project;
    const { githubUsername, githubAccessToken } = user;

    if (!repoFullName) {
        return { error: 'Missing repository information' };
    }

    // Resolve access token: prefer GitHub App installation token when mapped and enabled
    const appFlowEnabled = process.env.GITHUB_APP_FLOW_ENABLED === 'true';
    let resolvedAccessToken: string | null = null;
    if (appFlowEnabled && project.githubInstallationId) {
        const { token } = await getInstallationToken(String(project.githubInstallationId));
        resolvedAccessToken = token;
    } else {
        resolvedAccessToken = githubAccessToken || null;
    }

    if (!resolvedAccessToken) {
        return { error: 'Missing authentication token for GitHub access' };
    }
    
    // If a detailed analysis already exists, skip invoking the agent and directly generate the architecture
    if (project.detailedAnalysis) {
        try {
            const existingAnalysisString = typeof project.detailedAnalysis === "string"
                ? project.detailedAnalysis
                : JSON.stringify(project.detailedAnalysis);

            const finalPrompt = PromptTemplate.fromTemplate(mainGenerateArchitecturePrompt2);
            const structuredLlm = llm.withStructuredOutput(architectureOutputSchema);
            const finalChain = finalPrompt.pipe(structuredLlm);
            const architecture = await finalChain.invoke({
                analysis_findings: existingAnalysisString,
                name: name,
                framework: framework,
                repoTree: repoTree ? JSON.stringify(repoTree) : 'Not provided'
            });

            return { architecture: architecture, detailedAnalysis: existingAnalysisString };
        } catch (error) {
            console.error("Error generating architecture from existing analysis:", error);
            return { error: 'Failed to generate architecture from existing analysis' };
        }
    }
    
    // Parse repo owner and name from repoFullName
    const [owner, repo] = repoFullName.split('/');
    
    // Create tools with pre-filled GitHub credentials
    // Note: getRepoTreeTool removed since repoTree is now passed as parameter
    const repoAnalysisTools = [
        getFileContentTool,
        searchCodeTool
    ];
    
   // Create the reverse architecture analysis prompt
      const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are Linus Torvalds - one of the greatest programmers and system architects in history. You built Linux and Git, and you have an unparalleled ability to understand complex codebases at a glance. Your expertise lies in cutting through complexity to reveal the essential architecture of any system.

YOUR MISSION:
Analyze this repository and produce a detailed architectural analysis report. This report will be used to generate a comprehensive architecture diagram that maps out every component, service, and their communication patterns. Write for developers who need to understand this codebase quickly and thoroughly.

REPOSITORY CONTEXT:
- Repository: {repoFullName}
- Framework: {framework}
- Default Branch: {defaultBranch}
- Package.json: {packageJson}
- Root Contents: {repoContent}
- Full Repository Tree (4 levels deep): {repoTree}

AVAILABLE TOOLS (use sparingly):
1. **getFileContent** - Read specific files when you need implementation details
2. **searchCode** - Search for specific patterns or implementations

Tool Parameters: owner={owner}, repo={repo}, accessToken={githubAccessToken}, branch={defaultBranch}

CRITICAL - TOKEN EFFICIENCY RULES:
You MUST minimize token usage. Every tool call costs tokens and time. Follow these rules strictly:

1. **DO NOT read every file** - This is wasteful and unnecessary. You already have the full repo tree, package.json, and root structure.

2. **Limit file reads to 5-8 files maximum** - Only read files that are ESSENTIAL for understanding architecture:
   - Main config files (next.config.js, prisma/schema.prisma, etc.)
   - Key entry points (app/layout.tsx, pages/_app.tsx)
   - Critical integration files only when dependencies suggest something non-obvious

3. **Infer before fetching** - Most architectural decisions can be determined from:
   - package.json dependencies (tells you 80% of the stack)
   - Directory structure (app/ vs pages/, presence of prisma/, lib/, etc.)
   - File names and locations in the repo tree

4. **Ask yourself before each tool call:** "Can I infer this from what I already have?" If yes, DO NOT use the tool.

5. **Use searchCode over getFileContent** when you just need to confirm a pattern exists, not read the full file.

6. **Never read these files** (waste of tokens):
   - README.md, LICENSE, CONTRIBUTING.md
   - Test files unless specifically relevant
   - Generated files, lock files
   - Individual component files (infer from directory structure)

ANALYSIS APPROACH:
1. **Phase 1 - Context Analysis (NO TOOLS):** Extract everything possible from package.json, repo tree, and root contents. Identify the stack, patterns, and structure from what you already have. This phase should answer 70-80% of your questions.

2. **Phase 2 - Targeted Tool Usage (MAX 5-8 calls):** Only use tools for critical unknowns that directly impact the architecture diagram. Examples of valid reads:
   - prisma/schema.prisma (to understand data models)
   - next.config.js (to understand custom configurations)
   - A key API route to understand patterns

3. **Phase 3 - Synthesis:** Combine findings into a cohesive architectural analysis.

WHAT TO ANALYZE:

**Core Architecture:**
- Is this App Router (app/) or Pages Router (pages/)?
- What's the component organization strategy?
- How is state managed (Context, Zustand, Redux, etc.)?
- What styling approach is used?

**Backend & Data Layer:**
- API routes structure and patterns
- Database setup (Prisma, Drizzle, direct clients)
- Authentication system (NextAuth, Clerk, Supabase, custom)
- External service integrations

**Infrastructure:**
- Third-party services (payment, email, storage, etc.)
- Real-time features if any
- Background jobs or queues
- Caching strategies

OUTPUT FORMAT - Your analysis MUST include these sections:

1. **EXECUTIVE SUMMARY** (2-3 sentences describing what this app does and its core architecture)

2. **TECH STACK** (List every technology with its purpose)
   - Frontend: [frameworks, UI libraries, styling]
   - Backend: [API patterns, server framework]
   - Database: [DB type, ORM]
   - Auth: [authentication solution]
   - Infrastructure: [hosting, services]

3. **ARCHITECTURE OVERVIEW** (How the system is organized)
   - Directory structure philosophy
   - Component organization pattern
   - Data flow patterns

4. **CORE COMPONENTS** (List each major component/module)
   For each: Name, Purpose, Dependencies, Communication patterns

5. **DATA FLOW** (How data moves through the system)
   - Client to server patterns
   - Database interactions
   - External API integrations

6. **EXTERNAL INTEGRATIONS** (Every third-party service)
   - Service name, purpose, how it's integrated

7. **KEY ARCHITECTURAL DECISIONS** (Notable patterns or choices)

CRITICAL CONSTRAINTS:
- Keep your entire analysis under 10000 characters
- Be specific and technical - no generic descriptions
- Every claim should be backed by evidence from the codebase
- Focus on what's needed to create accurate architecture diagrams
- Identify all components that would appear in a system architecture diagram`],

      ["human", `Analyze {repoFullName} and produce a comprehensive architectural analysis.

Your analysis will be used to generate a detailed architecture diagram showing:
- All major components and microservices
- How they communicate with each other
- External service integrations
- Data flow patterns

REMEMBER:
- The repo tree is already provided - DO NOT fetch it again
- Use tools ONLY when absolutely necessary (max 5-8 file reads)
- Infer from package.json and directory structure first
- Be efficient with tokens - every tool call has a cost

Start your analysis now.`],

      new MessagesPlaceholder("agent_scratchpad")
    ]);
    
    // Create agent executor
    const agent = await createToolCallingAgent({
        llm,
        tools: repoAnalysisTools,
        prompt,
    });
    
    const agentExecutor = new AgentExecutor({
        agent,
        tools: repoAnalysisTools,
        verbose: true,
        maxIterations: 15, // Efficient analysis with limited tool calls
    });
    
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
            githubAccessToken: resolvedAccessToken,
            repoTree: repoTree ? JSON.stringify(repoTree) : 'Not provided'
        });
        
        const detailedAnalysis = await db.project.update({
            where: { id: projectId },
            data: { detailedAnalysis: JSON.stringify(analysisResult.output) }
        });

        
            // Create the final architecture synthesis prompt
        // Enhanced Architecture Generation Prompt - Dynamic & Analysis-Driven
        const finalPrompt = PromptTemplate.fromTemplate(mainGenerateArchitecturePrompt2);
        const structuredLlm = llm.withStructuredOutput(architectureOutputSchema);
        const finalChain = finalPrompt.pipe(structuredLlm);
        const architecture = await finalChain.invoke({
            analysis_findings: JSON.stringify(analysisResult.output),
            name: name,
            framework: framework,
            repoTree: repoTree ? JSON.stringify(repoTree) : 'Not provided'
        });

        return {architecture: architecture, detailedAnalysis: JSON.stringify(analysisResult.output)};

    } catch (error) {
        console.error("Error in generateArchitecture:", error);
        return { error: 'Failed to generate architecture from repository analysis' };
    }
}

export async function testGenerateArchitecture(analysis: any, name: string, framework: string) {
  
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
        
        return architecture;

}

export async function getUserProjects() {
  const { userId } = await auth();
  
  if (!userId) {
    return { error: 'Unauthorized' };
  }

  try {
    // Fetch all user projects with repoId and repoFullName
    const projects = await db.project.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        name: true,
        repoId: true,
        repoFullName: true
      }
    });

    return { projects };
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return { error: 'Failed to fetch user projects' };
  }
}

// Trigger Inngest background job for reverse architecture generation
export async function triggerReverseArchitectureGeneration(data: {
  projectId: string;
  activeChatId: string | null;
  userId: string;
}) {
  try {
    
    
    const response = await inngest.send({
      name: "reverse-architecture/generate",
      data: data
    });
    
    return { success: true, response };
  } catch (error) {
    console.error('Error triggering reverse architecture generation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if project architecture exists (for polling)
export async function checkProjectArchitectureById(projectId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify project belongs to user
    const project = await db.project.findUnique({
      where: { 
        id: projectId, 
        userId: userId 
      },
      select: {
        id: true,
        ProjectArchitecture: true
      }
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Check if ProjectArchitecture exists for this project
    if (!project.ProjectArchitecture || project.ProjectArchitecture.length === 0) {
      return { success: true, exists: false };
    }

    const architecture = project.ProjectArchitecture[0];

    // Parse the architecture data
    const architectureData = {
      components: architecture.components,
      connectionLabels: architecture.connectionLabels,
      componentPositions: architecture.componentPositions,
      architectureRationale: architecture.architectureRationale,
    };

    return {
      success: true,
      exists: true,
      architecture: architectureData,
      componentPositions: architecture.componentPositions || {},
      metadata: {
        id: architecture.id,
        createdAt: architecture.createdAt,
        updatedAt: architecture.updatedAt,
      }
    };
  } catch (error) {
    console.error("Error checking project architecture by generation ID:", error);
    return { success: false, error: "Failed to check project architecture" };
  }
}

// Legacy alias for backward compatibility
export const checkProjectArchitectureByGenerationId = checkProjectArchitectureById;

export async function getGitHubCommitComparison(
  repoFullName: string,
  beforeCommit: string,
  afterCommit: string
) {
  try {
    // Step 1: Find project by repoFullName
    const project = await db.project.findFirst({
      where: { repoFullName: repoFullName },
      select: {
        id: true,
        userId: true,
        githubInstallationId: true,
        ProjectArchitecture: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Step 2: Verify project has ProjectArchitecture
    if (!project.ProjectArchitecture || project.ProjectArchitecture.length === 0) {
      return { error: 'Project has no existing architecture' };
    }

    // Step 3: Get installation token (no OAuth fallback)
    if (!project.githubInstallationId) {
      return { error: 'Project has no GitHub installation ID' };
    }

    const { getInstallationToken } = await import('./githubAppAuth');
    const { token } = await getInstallationToken(project.githubInstallationId);

    // Step 4: Make GitHub API call to compare commits
    const compareResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/compare/${beforeCommit}...${afterCommit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DevilDev-App',
        },
      }
    );

    if (!compareResponse.ok) {
      const errorText = await compareResponse.text();
      return { error: `GitHub API error (${compareResponse.status}): ${errorText}` };
    }

    const compareData = await compareResponse.json();

    return { success: true, data: compareData, userId: project.userId, projectId: project.id };
  } catch (error) {
    console.error('Error in getGitHubCommitComparison:', error);
    return { error: error instanceof Error ? error.message : 'Failed to get commit comparison' };
  }
}

export async function regeneratePushedArchitecture(args: {
  projectId: string;
  repoFullName: string;
  beforeCommit: string;
  afterCommit: string;
  exactFilesChanges: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
  latestArchitecture: any;
}) {
  const { projectId, repoFullName, beforeCommit, afterCommit, exactFilesChanges, latestArchitecture } = args;

  try {
    // Fetch project details
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        githubInstallationId: true,
        framework: true,
        name: true,
      },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Get installation token
    if (!project.githubInstallationId) {
      return { error: 'Project has no GitHub installation ID' };
    }

    const { token: accessToken } = await getInstallationToken(String(project.githubInstallationId));

    // Parse repo owner and name
    const [owner, repo] = repoFullName.split('/');

    // Create tools for the agent
    const tools = [getFilePatchTool, getFileContentTool];

    // Create the prompt for architecture regeneration
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an expert software architect tasked with updating a project's architecture diagram based on recent code changes.

CURRENT ARCHITECTURE:
{latestArchitecture}

RECENT CHANGES:
The following files were changed in commits {beforeCommit}...{afterCommit}:
{exactFilesChanges}

YOUR TASK:
1. Analyze the file changes to understand what was modified
2. Use the getFilePatch tool to examine specific file changes if you need more detail
3. Update the architecture to reflect these changes
4. Maintain the same JSON structure as the current architecture

AVAILABLE TOOLS:
- getFilePatch: Get the detailed patch/diff for any changed file
  Parameters: owner="{owner}", repo="{repo}", beforeCommit="{beforeCommit}", afterCommit="{afterCommit}", filename="<filename>", accessToken="<token>"
- getFileContent: Get the full current content of any file (use sparingly)

OUTPUT FORMAT:
Return ONLY a valid JSON object with these fields:
- architectureRationale: string (updated explanation of the architecture)
- components: array (updated list of components)
- connectionLabels: object (updated connection labels)
- componentPositions: object (preserve existing positions unless components changed significantly)

IMPORTANT:
- Keep component IDs consistent where possible
- Only add/remove/modify components if the changes warrant it
- Preserve componentPositions from the current architecture unless components are added/removed
- Be concise but accurate in your rationale`],
      ["human", `Analyze the changes and update the architecture. Return ONLY the JSON object.`],
      new MessagesPlaceholder("agent_scratchpad")
    ]);

    // Create agent
    const agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      maxIterations: 20,
    });

    // Execute the agent
    const result = await agentExecutor.invoke({
      latestArchitecture: JSON.stringify(latestArchitecture, null, 2),
      exactFilesChanges: JSON.stringify(exactFilesChanges, null, 2),
      owner,
      repo,
      beforeCommit,
      afterCommit,
      accessToken,
    });

    // Parse the output
    let cleanedResult = result.output;
    if (typeof cleanedResult === 'string') {
      cleanedResult = cleanedResult
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();
    }

    const parsedArchitecture = typeof cleanedResult === 'string'
      ? JSON.parse(cleanedResult)
      : cleanedResult;

    // Validate required fields
    if (!parsedArchitecture.components || !parsedArchitecture.architectureRationale) {
      throw new Error('Invalid architecture structure - missing required fields');
    }

    return { success: true, architecture: parsedArchitecture };
  } catch (error) {
    console.error('Error in regeneratePushedArchitecture:', error);
    return { error: error instanceof Error ? error.message : 'Failed to regenerate architecture' };
  }
}