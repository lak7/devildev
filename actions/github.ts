"use server";

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export interface GitHubStatus {
  githubAppConnected: boolean;
  isConnected: boolean;
  githubUsername?: string;
  githubAvatarUrl?: string;
  connectedAt?: Date;
}

export async function getGitHubStatus(): Promise<{ success: boolean; data?: GitHubStatus; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        isGithubAppConnected: true,
        isGithubConnected: true,
        githubUsername: true,
        githubAvatarUrl: true,
        githubConnectedAt: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      data: {
        isConnected: user.isGithubConnected,
        githubAppConnected: user.isGithubAppConnected,
        githubUsername: user.githubUsername || undefined,
        githubAvatarUrl: user.githubAvatarUrl || undefined,
        connectedAt: user.githubConnectedAt || undefined,
      },
    };
  } catch (error) {
    console.error('Error getting GitHub status:', error);
    return { success: false, error: 'Failed to get GitHub status' };
  }
}

export async function disconnectGitHubOAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // 1) Read the current user's GitHub access token before clearing it
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

    // 2) Revoke the OAuth grant at GitHub if we have the token and app creds
    if (user?.githubAccessToken && clientId && clientSecret) {
      try {
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch(`https://api.github.com/applications/${clientId}/grant`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${basic}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: user.githubAccessToken }),
        });

        // 204 indicates success; 404 can mean already revoked. Log others for observability.
        if (!response.ok && response.status !== 404) {
          console.warn('GitHub OAuth revoke failed', {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (revokeError) {
        console.warn('Error revoking GitHub OAuth grant:', revokeError);
      }
    }

    // 3) Clear local OAuth data regardless of remote revoke outcome
    await db.user.update({
      where: { id: userId },
      data: {
        githubId: null,
        githubAvatarUrl: null,
        githubAccessToken: null,
        githubConnectedAt: null,
        isGithubConnected: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    return { success: false, error: 'Failed to disconnect GitHub' };
  }
}

export async function initiateGitHubConnection(): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/api/github/mcp-auth`;

    return { success: true, redirectUrl };
  } catch (error) {
    console.error('Error initiating GitHub connection:', error);
    return { success: false, error: 'Failed to initiate GitHub connection' };
  }
}
