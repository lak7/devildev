"use server";

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export interface GitHubStatus {
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

export async function disconnectGitHub(): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    await db.user.update({
      where: { id: userId },
      data: {
        githubId: null,
        githubUsername: null,
        githubEmail: null,
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
