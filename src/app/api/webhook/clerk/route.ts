import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) { 
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id =  headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occured', {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;


  // Handle the webhook
  try {
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      
      console.log('Processing user.created event for user:', id);
      
      // Extract primary email
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error('No primary email found for user:', id);
        return new NextResponse('No primary email found', { status: 400 });
      }

      // Prepare user data - handle null username to avoid unique constraint violation
      const userData = {
        id: id,
        email: primaryEmail.email_address,
        name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
        username: username && username.trim() !== '' ? username.trim() : null,
      };

      console.log('Creating user with data:', { ...userData, email: '[REDACTED]' });

      // Check if user already exists to avoid duplicate creation
      const existingUser = await db.user.findUnique({
        where: { id: id },
      });

      if (existingUser) {
        console.log('User already exists, skipping creation:', id);
        return new NextResponse('User already exists', { status: 200 });
      }

      // Create user in database
      const user = await db.user.create({
        data: userData,
      });

      console.log('Successfully created user:', user.id);
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      
      console.log('Processing user.updated event for user:', id);
      
      // Extract primary email
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error('No primary email found for user:', id);
        return new NextResponse('No primary email found', { status: 400 });
      }

      // Prepare user data - handle null username to avoid unique constraint violation
      const userData = {
        email: primaryEmail.email_address,
        name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
        username: username && username.trim() !== '' ? username.trim() : null,
      };

      console.log('Updating user with data:', { ...userData, email: '[REDACTED]' });

      // Update user in database
      const user = await db.user.update({
        where: { id: id },
        data: userData,
      });

      console.log('Successfully updated user:', user.id);
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      console.log('Processing user.deleted event for user:', id);
      
      // Delete user from database (this will cascade delete chats due to our schema)
      await db.user.delete({
        where: { id: id },
      });

      console.log('Successfully deleted user:', id);
    }

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    console.error('Event type:', eventType);
    console.error('User ID:', evt.data?.id);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    // Return more specific error information
    if (error instanceof Error) {
      return new NextResponse(`Webhook error: ${error.message}`, { status: 500 });
    }
    return new NextResponse('Error handling webhook', { status: 500 });
  }
}