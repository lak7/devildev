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
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Function to find and update installation with retry logic
async function findAndUpdateInstallation(installationId: string, userId: string) {
  return await retryWithBackoff(async () => {
    console.log(`Attempting to update installation ${installationId} with userId ${userId}`);
    
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
    
    console.log(`Successfully updated installation ${installationId} with userId ${userId}`);
    return updated;
  }, 3, 500, 3000); // 3 retries, start with 500ms, max 3s delay
}

export async function GET(request: NextRequest) {
  try {
    console.log("GitHub Setup Callback");
    const { searchParams } = new URL(request.url);
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');
    const state = searchParams.get('state');
    
    console.log('GitHub Setup Callback:', { installationId, setupAction, state });
    
    if (!installationId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Missing installation ID')}`);
    }
    
    if (!state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Missing state parameter')}`);
    }

    console.log("GitHub Setup Callback 2");
    
    // Look up the pending installation to get the userId
    const pending = await db.pendingGitHubInstallation.findUnique({
      where: { state: state }
    });
    
    console.log("GitHub Setup Callback 3");
    if (!pending || pending.expiresAt < new Date()) {
      console.log('No valid pending installation found for state:', state);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Invalid or expired installation state')}`);
    }
    
    const userId = pending.userId;
    console.log('Found userId from state:', userId); 
    
    // Update the installation with retry logic
    try {
      console.log("GitHub Setup Callback 4 - Starting installation update with retry logic");
      await findAndUpdateInstallation(installationId, userId);
      console.log('Successfully updated installation with userId after retries');
    } catch (error) {
      console.error('Failed to update installation after all retries:', error);
      // You might want to handle this differently - maybe redirect to an error page
      // or create a fallback mechanism
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Installation setup failed - please try again')}`);
    }

    console.log("GitHub Setup Callback 5 - Fetching installation record");
    
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

    console.log("GitHub Setup Callback 6 - Updating user");
    
    // Update user's GitHub App connection status and username
    await db.user.update({
      where: { id: userId },
      data: { 
        isGithubAppConnected: true,
        githubUsername: installationRecord?.accountLogin ?? null
      }
    });
    
    console.log("GitHub Setup Callback 7 - Cleaning up pending installation");
    
    // Clean up the temporary record
    await db.pendingGitHubInstallation.delete({
      where: { state: state }
    });
    
    console.log("GitHub Setup Callback - Success!");
    
    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/new?github_app_connected=true`);
    
  } catch (error) {
    console.error('Error in GitHub App setup callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Setup callback error')}`);
  }
}