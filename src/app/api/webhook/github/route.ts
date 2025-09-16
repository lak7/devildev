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
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const signature = req.headers.get('x-hub-signature-256');
    const delivery = req.headers.get('x-github-delivery');
    const event = req.headers.get('x-github-event');
    const rawBody = await req.text();

    if (!verifySignature(secret, rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!delivery) {
      return NextResponse.json({ error: 'Missing delivery id' }, { status: 400 });
    }

    // Dedupe by event id
    try {
      await db.webhookEvent.create({ data: { id: Number(BigInt.asUintN(32, BigInt(`0x${delivery.slice(0, 8)}`))), eventId: delivery, source: 'github' } });
    } catch (e) {
      // Unique constraint -> duplicate
      return NextResponse.json({ ok: true, deduped: true });
    }

    const payload = JSON.parse(rawBody);

    if (event === 'installation') {
      const installation = payload.installation;
      if (installation) {
        await db.gitHubAppInstallation.upsert({
          where: { installationId: BigInt(installation.id) },
          update: {
            accountLogin: installation.account?.login ?? 'unknown',
            accountId: BigInt(installation.account?.id ?? 0),
            accountType: installation.account?.type ?? 'Unknown',
            repositorySelection: installation.repository_selection ?? null,
            permissions: installation.permissions ?? null,
            lastSyncedAt: new Date(),
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
          },
        });
      }
    }

    if (event === 'installation_repositories') {
      const installationId = payload.installation?.id;
      if (installationId) {
        await db.gitHubAppInstallation.update({
          where: { installationId: BigInt(installationId) },
          data: { repositories: payload.repositories, lastSyncedAt: new Date() },
        }).catch(() => Promise.resolve());
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}


