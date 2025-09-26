// Dodo Payments Webhook Types
export interface WebhookPayload {
  id: string;
  type: SubscriptionEventType | PaymentEventType;
  data: SubscriptionEventData | PaymentEventData;
  created_at: string;
  api_version: string;
}

export type SubscriptionEventType = 
  | 'subscription.active'
  | 'subscription.on_hold'
  | 'subscription.failed'
  | 'subscription.renewed'
  | 'subscription.cancelled';

export type PaymentEventType = 
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.pending'
  | 'payment.cancelled';

export interface SubscriptionEventData {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'on_hold' | 'failed' | 'cancelled';
  current_period_start: string;
  current_period_end: string;
  cancel_at?: string;
  cancelled_at?: string;
  billing: {
    city: string;
    country: string;
    state: string;
    street: string;
    zipcode: string;
  };
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
  product: {
    product_id: string;
    name: string;
    price: number;
    currency: string;
  };
  quantity: number;
}

export interface PaymentEventData {
  payment_id: string;
  customer_id: string;
  product_id?: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'cancelled';
  payment_method: string;
  created_at: string;
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
}
