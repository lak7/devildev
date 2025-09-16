import { NextRequest, NextResponse } from 'next/server';
import { getAppJWT } from '@/actions/githubAppAuth';

export async function GET(_req: NextRequest) {
  try {
    const jwt = await getAppJWT();
    const res = await fetch('https://api.github.com/app/installations', {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevilDev-App',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Failed to list installations: ${text}` }, { status: res.status });
    }
    const data = await res.json();
    const installations = (data || []).map((i: any) => ({
      id: i.id,
      accountLogin: i.account?.login,
      accountId: i.account?.id,
      accountType: i.account?.type,
      repositorySelection: i.repository_selection,
    }));
    return NextResponse.json({ installations });
  } catch (error) {
    console.error('Error listing app installations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


