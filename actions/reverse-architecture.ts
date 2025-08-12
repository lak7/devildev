"use server"
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { isNextOrReactPrompt } from '../prompts/ReverseArchitecture';

const openaiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
    openAIApiKey: openaiKey,
    model: "gpt-5-mini-2025-08-07"
  })


export async function checkPackageAndFramework(repositoryId: string, repoFullName: string){
    console.log("Step 0")
    const { userId } = await auth();
    let repoContent = null;
    let packageJson = null;
    
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
            }
            });
      }
        return result;
      
      
     

}

export async function generateArchitecture(projectId: string){
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }
}