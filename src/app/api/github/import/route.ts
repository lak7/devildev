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
    const { repositoryId, fullName } = body;

    if (!repositoryId || !fullName) {
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

    let theProjectStructure = null;
    let packageJson = null;

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

      
      if (contentsResponse.ok) {
        theProjectStructure = await contentsResponse.json();
      }

      // Get package.json if it exists (for Node.js projects)
      
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


    } catch (error) {
      console.error('Error fetching repository contents:', error);
      // Continue with basic import even if we can't fetch all details
    } 

    return NextResponse.json({
      success: true,
      message: 'Repository imported successfully',
      fullName,
      theProjectStructure,
      packageJson
    });

  } catch (error) {
    console.error('Error importing repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
