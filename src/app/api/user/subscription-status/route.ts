import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            subscription: true,
        },
    });
    return NextResponse.json(user);
}