import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

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
  console.log('Webhook 1');
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    console.log('Webhook 2');
    const signature = req.headers.get('x-hub-signature-256');
    const delivery = req.headers.get('x-github-delivery');
    const event = req.headers.get('x-github-event');
    const rawBody = await req.text();

    console.log("Event: ", event);
    const action = JSON.parse(rawBody).action;
    console.log("Action: ", action);

    if (!verifySignature(secret, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Missing delivery id' }, { status: 400 });
    }
    console.log('Webhook 3');

    // Dedupe by event id
    try {
      console.log('Webhook 3.1');
      await db.webhookEvent.create({ data: { id: Number(BigInt.asUintN(32, BigInt(`0x${delivery.slice(0, 8)}`))), eventId: delivery, source: 'github' } });
    } catch (e) {
      console.log('Webhook 3.2');
      // Unique constraint -> duplicate
      return NextResponse.json({ ok: true, deduped: true });
    }

    const payload = JSON.parse(rawBody);
    console.log('Webhook 4');

    if (event === 'installation') {
      console.log('Webhook 5');
      const installation = payload.installation;
      console.log('Webhook 5.1: ', installation);
      
      if (installation) {
        if (action === 'created') {
          console.log('Webhook 5.2: Creating installation record');
          
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
          
          console.log('Webhook 5.3: Installation record created/updated');
        } else if (action === 'deleted') {
          console.log('Webhook 5.4: Deleting installation and related records');
          
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
              data: { isGithubAppConnected: false }
            });
            
            console.log('Webhook 5.5: Updated user and deleted pending installations');
          }
          
          // Delete the GitHub App installation record
          await db.gitHubAppInstallation.delete({
            where: { installationId: BigInt(installation.id) }
          }).catch(() => {
            // Installation might not exist in our DB, which is fine
            console.log('Webhook 5.6: Installation record not found in DB (already deleted or never existed)');
          });
          
          console.log('Webhook 5.7: Installation deletion completed');
        }
      }
      console.log('Webhook 6');
    }

    if (event === 'installation_repositories') {
      console.log('Webhook 7');
      const installationId = payload.installation?.id;
      if (installationId) {
        await db.gitHubAppInstallation.update({
          where: { installationId: BigInt(installationId) },
          data: { repositories: payload.repositories, lastSyncedAt: new Date() },
        }).catch(() => Promise.resolve());
      }
      console.log('Webhook 8');
    }

    return NextResponse.json({ ok: true }); 
    console.log('Webhook 9');
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
  

