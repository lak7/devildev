import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { repositoryId, repositoryName, fullName, description, language, isPrivate } = body;

    if (!repositoryId || !repositoryName || !fullName) {
      return NextResponse.json({ error: 'Missing required repository information' }, { status: 400 });
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
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    // Create a new chat for this imported repository
    const chat = await db.chat.create({
      data: {
        userId,
        title: `Imported: ${repositoryName}`,
        messages: [
          {
            role: 'system',
            content: `Repository imported: ${fullName}`,
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant', 
            content: `I've successfully imported your repository "${repositoryName}". I'll now analyze the codebase structure and generate a comprehensive architecture diagram. This process includes examining the file structure, dependencies, code patterns, and component relationships to create a detailed visualization of your project's architecture.`,
            timestamp: new Date().toISOString(),
          }
        ],
      },
    });

    let theProjectStructure = null;

    // Fetch repository content for analysis
    try {
      // Get repository contents
      const contentsResponse = await fetch(
        `https://api.github.com/repos/${fullName}/contents`,
        {
          headers: {
            'Authorization': `Bearer ${user.githubAccessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'DevilDev-App',
          },
        }
      );

      let repositoryStructure = [];
      if (contentsResponse.ok) {
        repositoryStructure = await contentsResponse.json();
        theProjectStructure = repositoryStructure;
      }

      // Get package.json if it exists (for Node.js projects)
      let packageJson = null;
      try {
        const packageResponse = await fetch(
          `https://api.github.com/repos/${fullName}/contents/package.json`,
          {
            headers: {
              'Authorization': `Bearer ${user.githubAccessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'DevilDev-App',
            },
          }
        );
        
        if (packageResponse.ok) {
          const packageData = await packageResponse.json();
          if (packageData.content) { 
            packageJson = JSON.parse(atob(packageData.content));
          }
        }
      } catch (error) {
        // Package.json might not exist, that's fine
        console.log('No package.json found or error reading it');
      }

      // Create initial architecture data
      const architectureData = {
        domain: repositoryName,
        complexity: language ? 'medium' : 'low',
        architectureRationale: `Imported repository "${repositoryName}" (${language || 'Unknown language'}). ${description || 'No description provided.'}`,
        components: {
          imported: true,
          repositoryName,
          fullName,
          language,
          description,
          structure: repositoryStructure.slice(0, 20), // Limit to first 20 items
          dependencies: packageJson?.dependencies || {},
          devDependencies: packageJson?.devDependencies || {},
          scripts: packageJson?.scripts || {},
        },
        connectionLabels: {},
        componentPositions: {},
        requirement: `Reverse engineer and analyze the architecture of the imported repository: ${fullName}`,
      };


    } catch (error) {
      console.error('Error fetching repository contents:', error);
      // Continue with basic import even if we can't fetch all details
    }

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      message: 'Repository imported successfully',
      repositoryName,
      fullName,
      theProjectStructure
    });

  } catch (error) {
    console.error('Error importing repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
