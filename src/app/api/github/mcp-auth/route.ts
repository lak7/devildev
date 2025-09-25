import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // GitHub OAuth parameters
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/github/callback`;
    
    if (!clientId) {
      return NextResponse.json({ error: 'GitHub client ID not configured' }, { status: 500 });
    }

    // Generate a random state parameter for security
    const state = crypto.randomUUID();
    
    // Store the state and userId in a way that can be retrieved in callback
    // For simplicity, we'll include the userId in the state (you might want to use a more secure approach in production)
    const stateWithUserId = `${state}:${userId}`;
    
    // GitHub OAuth URL with required scopes
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', clientId);
    githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
    githubAuthUrl.searchParams.set('scope', 'user:email read:user repo');
    githubAuthUrl.searchParams.set('state', stateWithUserId); 
    
    return NextResponse.redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error('Error initiating GitHub OAuth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}