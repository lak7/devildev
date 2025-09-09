import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  console.log('Webhook 0');
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) { 
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  console.log('Webhook 1');

  // Get the headers
  const headerPayload = await headers();
  const svix_id =  headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  console.log('Webhook 2');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400,
    });
  }

  console.log('Webhook 3');

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  console.log('Webhook 4');
  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    console.log('Webhook 5');
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    console.log('Webhook 6');
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occured', {
      status: 400,
    });
  }
  console.log('Webhook 7');

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log('Webhook 8');     
  // Handle the webhook
  try {
    console.log('Webhook 9');
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      
      // Extract primary email
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error('No primary email found for user:', id);
        return new NextResponse('No primary email found', { status: 400 });
      }

      console.log('Webhook 10');

      // Create user in database
      const user = await db.user.create({
        data: {
          id: id,
          email: primaryEmail.email_address,
          name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          username: username || null,
        },
      });
      console.log('Webhook 11');

    }

    console.log('Webhook 12');

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, username } = evt.data;

      console.log('Webhook 13');
      // Extract primary email
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error('No primary email found for user:', id);
        return new NextResponse('No primary email found', { status: 400 });
      }

      console.log('Webhook 14');

      // Update user in database
      const user = await db.user.update({
        where: { id: id },
        data: {
          email: primaryEmail.email_address,
          name: first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || null,
          username: username || null,
        },
      });

      console.log('Webhook 15');

    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;
      
      console.log('Webhook 16');

      // Delete user from database (this will cascade delete chats due to our schema)
      await db.user.delete({
        where: { id: id },
      });

      console.log('Webhook 17');

    }

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new NextResponse('Error handling webhook', { status: 500 });
  }
}