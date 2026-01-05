import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    ;
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } 
    ;

    // If enabled, new users are routed to GitHub App installation instead of OAuth
    const appNewUsers = process.env.GITHUB_APP_NEW_USERS === 'true';
    const appSlug = process.env.GITHUB_APP_SLUG;

    if (appNewUsers && appSlug) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { isGithubConnected: true, githubAccessToken: true, isGithubAppConnected: true },
      });
      ;
      const state = crypto.randomUUID();
 
        ;
        ;
        // Store the state mapping in database for webhook lookup
        if(user?.isGithubAppConnected === false){
          await db.pendingGitHubInstallation.create({
            data: {
              state: state,
              userId: userId,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            }
          });
        }
        
        ;
        // ;
        
        const installUrl = new URL(`https://github.com/apps/${appSlug}/installations/new`);
        installUrl.searchParams.set('state', state); // Just the state, not userId
        installUrl.searchParams.set('setup_action', 'install');
        return NextResponse.redirect(installUrl.toString()); 
    }

    
 
  } catch (error) {
    console.error('Error initiating GitHub OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
