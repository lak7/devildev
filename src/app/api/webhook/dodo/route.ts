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
  ;
  try {
    const headersList = await headers();
    const rawBody = await request.text();
    const webhook = getWebhook();
    ;
    ;


    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };
    ;
    // Verify webhook signature
    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody) as WebhookPayload;
    ;
    ;

    // Handle subscription events
    if (payload.data.payload_type === 'Subscription') {
      await handleSubscriptionEvent(payload);
    }
    ;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    ;
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionEvent(payload: WebhookPayload) {
  ;
  const data = payload.data as SubscriptionEventData;
  const { subscription_id, customer, status, next_billing_date, cancelled_at } = data;
  

  // Find user by email (authoritative mapping)
  const user = await db.user.findUnique({ where: { email: customer.email } });
  if (!user) {
    throw new Error(`User not found for email: ${customer.email}`);
  }
  const userId = user.id;
  ;  
  try {
    ;
    switch (payload.data.status) { 
      case 'active':
        ;
        await SubscriptionService.upsertSubscription({
          userId,
          subscriptionId: subscription_id,
          productId: data.product_id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(next_billing_date),
        });
        break;

      case 'renewed':
        ;
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: new Date(next_billing_date),
        });
        break;
        
      case 'on_hold':
        ;
        await SubscriptionService.holdSubscription(subscription_id);
        break;
        
      case 'cancelled':
        ;
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.CANCELLED,
          canceledAt: cancelled_at ? new Date(cancelled_at) : new Date(),
        });
        break;
        
      case 'failed':
        ;
        await SubscriptionService.updateSubscriptionByDodoId(subscription_id, {
          status: SubscriptionStatus.NONE, // Set back to free on failure
        });
        break;
        
      default:
        ;
    }
    ;
  } catch (error) {
    console.error(`Error handling ${payload.type}:`, error);
    throw error;
  }
}
