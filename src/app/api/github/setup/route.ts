import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Utility function for exponential backoff retry
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 500,
  maxDelayMs: number = 5000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Function to find and update installation with retry logic
async function findAndUpdateInstallation(installationId: string, userId: string) {
  return await retryWithBackoff(async () => {
    ;
    
    // Try to find the installation first
    const installation = await db.gitHubAppInstallation.findUnique({
      where: { installationId: BigInt(installationId) }
    });
    
    if (!installation) {
      throw new Error(`Installation ${installationId} not found in database`);
    }
    
    // Update with userId
    const updated = await db.gitHubAppInstallation.update({
      where: { installationId: BigInt(installationId) },
      data: { userId: userId }
    });
    
    ;
    return updated;
  }, 3, 500, 3000); // 3 retries, start with 500ms, max 3s delay
}

export async function GET(request: NextRequest) {
  try {
    ;
    const { searchParams } = new URL(request.url);
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');
    const state = searchParams.get('state');
    
    ;
    
    if (!installationId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Missing installation ID')}`);
    }
    
    if (!state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Missing state parameter')}`);
    }

    ;
    
    // Look up the pending installation to get the userId
    const pending = await db.pendingGitHubInstallation.findUnique({
      where: { state: state }
    });
    
    ;
    if (!pending || pending.expiresAt < new Date()) {
      ;
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Invalid or expired installation state')}`);
    }
    
    const userId = pending.userId;
    ; 
    
    // Update the installation with retry logic
    try {
      ;
      await findAndUpdateInstallation(installationId, userId);
      ;
    } catch (error) {
      console.error('Failed to update installation after all retries:', error);
      // You might want to handle this differently - maybe redirect to an error page
      // or create a fallback mechanism
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Installation setup failed - please try again')}`);
    }

    ;
    
    // Fetch installation to obtain the GitHub username (accountLogin)
    // Also use retry logic here in case of timing issues
    const installationRecord = await retryWithBackoff(async () => {
      const record = await db.gitHubAppInstallation.findUnique({
        where: { installationId: BigInt(installationId) },
        select: { accountLogin: true }
      });
      
      if (!record) {
        throw new Error(`Installation record ${installationId} not found when fetching accountLogin`);
      }
      
      return record;
    }, 2, 300, 1500); // Shorter retry for this operation

    ;
    
    // Update user's GitHub App connection status and username
    await db.user.update({
      where: { id: userId },
      data: { 
        isGithubAppConnected: true,
        githubUsername: installationRecord?.accountLogin ?? null
      }
    });
    
    ;
    
    // Clean up the temporary record
    await db.pendingGitHubInstallation.delete({
      where: { state: state }
    });
    
    ;
    
    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/new?github_app_connected=true`);
    
  } catch (error) {
    console.error('Error in GitHub App setup callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Setup callback error')}`);
  }
}