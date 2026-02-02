import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getInstallationToken } from '@/actions/githubAppAuth';
import { createOctokitWithToken } from '@/lib/githubClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { repositoryId, fullName, installationId: bodyInstallationId, projectId } = body;
    const appFlowEnabled = process.env.GITHUB_APP_FLOW_ENABLED === 'true';

    if (!repositoryId || !fullName) {
      return NextResponse.json({ error: 'Missing required repository information' }, { status: 400 });
    } 

    // Determine installationId: body > project mapping (if provided)
    let resolvedInstallationId: string | null = null;
    if (appFlowEnabled && bodyInstallationId) {
      resolvedInstallationId = String(bodyInstallationId);
    } else if (appFlowEnabled && projectId) {
      const project = await db.project.findUnique({ where: { id: projectId }, select: { githubInstallationId: true } });
      if (project?.githubInstallationId) {
        resolvedInstallationId = String(project.githubInstallationId);
      }
    }

    // If installationId available, prefer GitHub App flow
    let authToken: string | null = null;
    if (appFlowEnabled && resolvedInstallationId) {
      const { token } = await getInstallationToken(resolvedInstallationId);
      authToken = token;
    } else {
      // OAuth fallback
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
      authToken = user.githubAccessToken;
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
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'DevilDev-App',
          },
        }
      );


      if (contentsResponse.ok) {
        theProjectStructure = await contentsResponse.json();
      }

      // Get package.json if it exists (check root first, then subdirectories)

      try {
        const packageResponse = await fetch(
          `https://api.github.com/repos/${fullName}/contents/package.json`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
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
        } else {
          // package.json not in root, search subdirectories using Git tree API
          const repoInfoResponse = await fetch(
            `https://api.github.com/repos/${fullName}`,
            {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevilDev-App',
              },
            }
          );
          if (repoInfoResponse.ok) {
            const repoInfo = await repoInfoResponse.json();
            const branch = repoInfo.default_branch || 'main';
            const treeResponse = await fetch(
              `https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`,
              {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'DevilDev-App',
                },
              }
            );
            if (treeResponse.ok) {
              const treeData = await treeResponse.json();
              if (treeData.tree && Array.isArray(treeData.tree)) {
                // Find the shallowest package.json in subdirectories
                const packageJsonEntries = treeData.tree
                  .filter((node: any) => node.type === 'blob' && node.path.endsWith('/package.json'))
                  .sort((a: any, b: any) => a.path.split('/').length - b.path.split('/').length);
                if (packageJsonEntries.length > 0) {
                  const subPackageResponse = await fetch(
                    `https://api.github.com/repos/${fullName}/contents/${packageJsonEntries[0].path}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'DevilDev-App',
                      },
                    }
                  );
                  if (subPackageResponse.ok) {
                    const packageData = await subPackageResponse.json();
                    if (packageData.content) {
                      packageJson = JSON.parse(atob(packageData.content));
                    }
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Package.json might not exist, that's fine
        ;
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
      packageJson,
      installationId: authToken,
    });

  } catch (error) {
    console.error('Error importing repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
