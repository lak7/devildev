import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Deprecation notice for GitHub OAuth callback — migration to GitHub App underway.
    // Behavior remains unchanged during migration phases.
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code'); 
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorMessage = searchParams.get('error_description') || 'GitHub OAuth failed';
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(errorMessage)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Missing authorization code or state')}`);
    }

    // Extract userId from state
    const [stateValue, userId] = state.split(':');
    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Invalid state parameter')}`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Failed to exchange code for token')}`);
    }

    const accessToken = tokenData.access_token;

    // Get user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Failed to fetch GitHub user data')}`);
    }

    const githubUser = await userResponse.json();

    // Get user emails from GitHub
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    let primaryEmail = githubUser.email;
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primaryEmailObj = emails.find((email: any) => email.primary);
      if (primaryEmailObj) {
        primaryEmail = primaryEmailObj.email;
      }
    }

    // Update user in database with GitHub information
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          githubId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          githubEmail: primaryEmail,
          githubAvatarUrl: githubUser.avatar_url,
          githubAccessToken: accessToken, // Note: In production, you should encrypt this
          githubConnectedAt: new Date(),
          isGithubConnected: true,
        },
      });

      // Redirect to success page
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?github_connected=true`);
    } catch (dbError) {
      console.error('Error updating user with GitHub data:', dbError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Failed to save GitHub connection')}`);
    }
  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Internal server error')}`);
  }
}
