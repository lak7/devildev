import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { WebhookPayload, SubscriptionEventData } from "@/types/dodo-webhook";
import { SubscriptionService } from "@/lib/subscription-helpers";
import { SubscriptionStatus } from "@prisma/client";

function getWebhook(): Webhook {
  const secret = process.env.DODO_WEBHOOK_KEY;
  if (!secret) {
    throw new Error("DODO_WEBHOOK_KEY is not set");
  }
  return new Webhook(secret);
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const rawBody = await request.text();
    const webhook = getWebhook();

    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    // Verify webhook signature
    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody) as WebhookPayload;
    
    console.log(`Received webhook: ${payload.type}`, { id: payload.id });

    // Handle subscription events
    if (payload.type.startsWith('subscription.')) {
      await handleSubscriptionEvent(payload);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionEvent(payload: WebhookPayload) {
  const data = payload.data as SubscriptionEventData;
  const { subscription_id, customer, status, current_period_end, cancelled_at } = data;

  // Find user by customer email or customer_id
  // Note: You'll need to modify this based on how you map Dodo customers to your users
  // For now, assuming customer_id maps to your user ID or you find by email
  const userId = customer.customer_id; // Adjust this mapping as needed

  try {
    switch (payload.type) {
      case 'subscription.active':
        console.log(`Activating subscription ${subscription_id} for user ${userId}`);
        await SubscriptionService.upsertSubscription({
          userId,
          subscriptionId: subscription_id,
          productId: data.product_id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(current_period_end),
        });
        break;


      case 'subscription.renewed':
        console.log(`Subscription ${subscription_id} renewed`);
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(current_period_end),
        });
        break;

      case 'subscription.on_hold':
        console.log(`Subscription ${subscription_id} put on hold`);
        await SubscriptionService.holdSubscription(subscription_id);
        break;

      case 'subscription.cancelled':
        console.log(`Subscription ${subscription_id} cancelled`);
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.CANCELLED,
          canceledAt: cancelled_at ? new Date(cancelled_at) : new Date(),
        });
        break;

      case 'subscription.failed':
        console.log(`Subscription ${subscription_id} failed`);
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.FREE, // Set back to free on failure
        });
        break;

      default:
        console.log(`Unhandled subscription event: ${payload.type}`);
    }
  } catch (error) {
    console.error(`Error handling ${payload.type}:`, error);
    throw error;
  }
}
