import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Generate HMAC signature for cookie validation
function generateSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}
 
function verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = generateSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function GET(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
 
    const secret = process.env.COOKIE_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production';

    // Check if we have a cached subscription status in cookies
    const cookieStore = await cookies();
    const cachedStatus = cookieStore.get('subscription_status');
    const cachedSignature = cookieStore.get('subscription_signature');
    const cachedUserId = cookieStore.get('subscription_user_id');

    // If cached data exists, verify signature and user match
    if (cachedStatus && cachedSignature && cachedUserId?.value === userId) {
        try {
            // Verify the signature to ensure data hasn't been tampered with
            if (verifySignature(cachedStatus.value, cachedSignature.value, secret)) {
                const cachedData = JSON.parse(cachedStatus.value);
                return NextResponse.json(cachedData);
            }
            // If signature verification fails, continue to fetch from DB
        } catch (e) {
            // If parsing or verification fails, continue to fetch from DB
        }
    }

    // Fetch from database
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            subscription: true,
        },
    });

    // Generate signature for the user data
    const userData = JSON.stringify(user);
    const signature = generateSignature(userData, secret);

    // Store in cookies (expires in 1 hour)
    const response = NextResponse.json(user);
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60, // 1 hour
    }; 

    response.cookies.set('subscription_status', userData, cookieOptions);
    response.cookies.set('subscription_signature', signature, cookieOptions);
    response.cookies.set('subscription_user_id', userId, cookieOptions);

    return response;
}