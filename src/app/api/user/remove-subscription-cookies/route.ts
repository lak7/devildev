import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the cookie store
    const cookieStore = await cookies();

    // Delete all subscription-related cookies
    cookieStore.delete('subscription_status');
    cookieStore.delete('subscription_signature');
    cookieStore.delete('subscription_user_id');

    return NextResponse.json({ 
        success: true, 
        message: 'Subscription cookies removed successfully' 
    });
}

