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
  addons: any[];
  billing: {
    city: string;
    country: string;
    state: string;
    street: string;
    zipcode: string;
  };
  cancel_at_next_billing_date: boolean;
  cancelled_at: string | null;
  created_at: string;
  currency: string;
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
  discount_cycles_remaining: number | null;
  discount_id: string | null;
  expires_at: string;
  metadata: Record<string, any>;
  meters: any[];
  next_billing_date: string;
  on_demand: boolean;
  payload_type: 'Subscription';
  payment_frequency_count: number;
  payment_frequency_interval: string;
  previous_billing_date: string;
  product_id: string;
  quantity: number;
  recurring_pre_tax_amount: number;
  status: 'active' | 'on_hold' | 'failed' | 'cancelled' | 'renewed';
  subscription_id: string;
  subscription_period_count: number;
  subscription_period_interval: string;
  tax_inclusive: boolean;
  trial_period_days: number;
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
  payload_type: 'Payment';
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
}
