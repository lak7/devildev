import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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
    
    // Look up the pending installation to get the userId
    const pending = await db.pendingGitHubInstallation.findUnique({
      where: { state: state }
    });
    
    if (!pending || pending.expiresAt < new Date()) {
      console.log('No valid pending installation found for state:', state);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Invalid or expired installation state')}`);
    }
    
    const userId = pending.userId;
    console.log('Found userId from state:', userId);
    
    // Update the installation with the userId (if it exists)
    try {
      await db.gitHubAppInstallation.update({
        where: { installationId: BigInt(installationId) },
        data: { userId: userId }
      });
      console.log('Updated installation with userId');
    } catch (error) {
      console.log('Installation not found in DB yet, it will be created by webhook');
    }
    
    // Update user's GitHub App connection status
    await db.user.update({
      where: { id: userId },
      data: { isGithubAppConnected: true }
    });
    
    // Clean up the temporary record
    await db.pendingGitHubInstallation.delete({
      where: { state: state }
    });
    
    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?github_app_connected=true`);
    
  } catch (error) {
    console.error('Error in GitHub App setup callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent('Setup callback error')}`);
  }
}
