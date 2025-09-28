import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { WebhookPayload, SubscriptionEventData } from "@/types/dodo-webhook";
import { SubscriptionService } from "@/lib/subscription-helpers";
import { SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";

function getWebhook(): Webhook {
  const secret = process.env.DODO_WEBHOOK_KEY;
  if (!secret) {
    throw new Error("DODO_WEBHOOK_KEY is not set");
  }
  return new Webhook(secret);
}

export async function POST(request: Request) {
  console.log("DODO webhook 1");
  try {
    const headersList = await headers();
    const rawBody = await request.text();
    const webhook = getWebhook();
    console.log("DODO webhook 2");

    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };
    console.log("DODO webhook 3");
    // Verify webhook signature
    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody) as WebhookPayload;
    console.log("DODO webhook 4");
    console.log(`Received webhook: ${payload.type}`, { id: payload.id });

    // Handle subscription events
    if (payload.data.payload_type === 'Subscription') {
      await handleSubscriptionEvent(payload);
    }
    console.log("DODO webhook 5");
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    console.log("DODO webhook 6");
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionEvent(payload: WebhookPayload) {
  console.log("DODO webhook 7");
  const data = payload.data as SubscriptionEventData;
  const { subscription_id, customer, status, next_billing_date, cancelled_at } = data;
  console.log("DATA: ", data)

  // Find user by email (authoritative mapping)
  const user = await db.user.findUnique({ where: { email: customer.email } });
  if (!user) {
    throw new Error(`User not found for email: ${customer.email}`);
  }
  const userId = user.id;
  console.log("DODO webhook 8");  
  try {
    console.log("DODO webhook 9");
    switch (payload.data.status) {
      case 'active':
        console.log(`Activating subscription ${subscription_id} for user ${userId}`);
        await SubscriptionService.upsertSubscription({
          userId,
          subscriptionId: subscription_id,
          productId: data.product_id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(next_billing_date),
        });
        break;

      case 'renewed':
        console.log(`Subscription ${subscription_id} renewed`);
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(next_billing_date),
        });
        break;
        
      case 'on_hold':
        console.log(`Subscription ${subscription_id} put on hold`);
        await SubscriptionService.holdSubscription(subscription_id);
        break;
        
      case 'cancelled':
        console.log(`Subscription ${subscription_id} cancelled`);
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.CANCELLED,
          canceledAt: cancelled_at ? new Date(cancelled_at) : new Date(),
        });
        break;
        
      case 'failed':
        console.log(`Subscription ${subscription_id} failed`);
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.NONE, // Set back to free on failure
        });
        break;
        
      default:
        console.log(`Unhandled subscription status: ${payload.data.status}`);
    }
    console.log("DODO webhook 15");
  } catch (error) {
    console.error(`Error handling ${payload.type}:`, error);
    throw error;
  }
}
