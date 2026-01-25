import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { inngest } from '@/inngest/client';

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifySignature(secret: string, body: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(body, 'utf-8').digest('hex');
  return timingSafeEqual(digest, signatureHeader);
}

export async function POST(req: NextRequest) {
  ;
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    };
    const signature = req.headers.get('x-hub-signature-256');
    const delivery = req.headers.get('x-github-delivery');
    const event = req.headers.get('x-github-event');
    const rawBody = await req.text();
    console.log("event", event);
    console.log('rawBody', rawBody);
    const action = JSON.parse(rawBody).action;
    console.log('action', action);

    if (!verifySignature(secret, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Missing delivery id' }, { status: 400 });
    }
    ;

    // Dedupe strictly on unique delivery eventId
    ;
    await db.webhookEvent.upsert({
      where: { eventId: delivery },
      create: { eventId: delivery, source: 'github' },
      update: {}
    });

    const payload = JSON.parse(rawBody);
    console.log('payload', payload);

    switch (event) {
      case 'installation': {
        const installation = payload.installation;
        
        if (installation) {
          switch (action) {
            case 'created': {
              // Webhook creates installation without user connection
              // User connection will be handled by the setup callback
              await db.gitHubAppInstallation.upsert({
                where: { installationId: BigInt(installation.id) },
                update: {
                  accountLogin: installation.account?.login ?? 'unknown',
                  accountId: BigInt(installation.account?.id ?? 0),
                  accountType: installation.account?.type ?? 'Unknown',
                  repositorySelection: installation.repository_selection ?? null,
                  permissions: installation.permissions ?? null,
                  lastSyncedAt: new Date(),
                  // Note: userId will be set by the setup callback
                },
                create: { 
                  id: Number(installation.id % 2147483647),
                  installationId: BigInt(installation.id),
                  accountLogin: installation.account?.login ?? 'unknown',
                  accountId: BigInt(installation.account?.id ?? 0),
                  accountType: installation.account?.type ?? 'Unknown',
                  repositorySelection: installation.repository_selection ?? null,
                  permissions: installation.permissions ?? null,
                  lastSyncedAt: new Date(),
                  userId: null, // Will be set by setup callback
                },
              });
              break;
            }
            case 'deleted': {
              // Find the installation record to get the userId
              const installationRecord = await db.gitHubAppInstallation.findUnique({
                where: { installationId: BigInt(installation.id) },
                select: { userId: true }
              });
              
              if (installationRecord?.userId) {
                // Delete all pending GitHub installations for this user
                await db.pendingGitHubInstallation.deleteMany({
                  where: { userId: installationRecord.userId }
                });
                
                // Update user to set isGithubAppConnected to false
                await db.user.update({
                  where: { id: installationRecord.userId },
                  data: { isGithubAppConnected: false, githubUsername: null }
                });
              }
              
              // Delete the GitHub App installation record
              await db.gitHubAppInstallation.delete({
                where: { installationId: BigInt(installation.id) }
              }).catch(() => {
                // Installation might not exist in our DB, which is fine
              });
              break;
            }
          }
        }
        break;
      }
      case 'installation_repositories': {
        const installationId = payload.installation?.id;
        if (installationId) {
          await db.gitHubAppInstallation.update({
            where: { installationId: BigInt(installationId) },
            data: { repositories: payload.repositories, lastSyncedAt: new Date() },
          }).catch(() => Promise.resolve());
        }
        break;
      }
      case 'push': {
        const pushedBranch = payload.ref.split('/').pop();
        const defaultBranch = payload.repository.default_branch;

        // Only regenerating the architecture if the pushed branch is the default branch
        if(pushedBranch === defaultBranch){
          const repoFullName = payload.repository.full_name;
          const beforeCommit = payload.before;
          const afterCommit = payload.after;
          const filesAdded = payload.head_commit.added;
          const filesRemoved = payload.head_commit.removed;
          const filesModified = payload.head_commit.modified;
          const commitMessage = payload.head_commit.message;
          const inngestDataToSend = {
            repoFullName: repoFullName,
            beforeCommit: beforeCommit,
            afterCommit: afterCommit,
            filesAdded: filesAdded,
            filesRemoved: filesRemoved,
            filesModified: filesModified,
            commitMessage: commitMessage,
            branchName: pushedBranch,
          };
          await inngest.send({
            name: "reverse-architecture/regenerate",
            data: inngestDataToSend,
          });
        } else {
          return NextResponse.json({ ok: true });
        }
        break;
      }
    }

    return NextResponse.json({ ok: true }); 
    ;
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
  

