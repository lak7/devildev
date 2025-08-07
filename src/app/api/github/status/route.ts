import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      isConnected: user.isGithubConnected,
      githubUsername: user.githubUsername,
      githubAvatarUrl: user.githubAvatarUrl,
      connectedAt: user.githubConnectedAt,
    });
  } catch (error) {
    console.error('Error checking GitHub status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Disconnect GitHub by clearing all GitHub-related fields
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

    return NextResponse.json({ success: true, message: 'GitHub disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting GitHub:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
