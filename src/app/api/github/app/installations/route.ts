import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's GitHub App installation from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        githubAppInstallation: {
          select: {
            id: true,
            installationId: true,
            accountLogin: true,
            accountId: true,
            accountType: true,
            repositorySelection: true,
          }
        }
      }
    });

    if (!user?.githubAppInstallation) {
      return NextResponse.json({ installations: [] });
    }

    const installation = {
      id: user.githubAppInstallation.id,
      installationId: user.githubAppInstallation.installationId.toString(), // Convert BigInt to string
      accountLogin: user.githubAppInstallation.accountLogin,
      accountId: user.githubAppInstallation.accountId.toString(), // Convert BigInt to string
      accountType: user.githubAppInstallation.accountType,
      repositorySelection: user.githubAppInstallation.repositorySelection,
    };

    return NextResponse.json({ installations: [installation] });
  } catch (error) {
    console.error('Error getting user GitHub App installation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


