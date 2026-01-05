import { db } from '@/lib/db';
import { SubscriptionStatus, SubscriptionPlan } from '@prisma/client';

export interface CreateSubscriptionData {
  userId: string;
  subscriptionId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
}

export interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
}

export class SubscriptionService {
  // Create or update subscription for a user
  static async upsertSubscription(data: CreateSubscriptionData) {
    try {
      const subscription = await db.subscription.upsert({
        where: { userId: data.userId },
        update: {
          subscriptionId: data.subscriptionId,
          status: data.status,
          productId: data.productId,
          currentPeriodEnd: data.currentPeriodEnd,
          updatedAt: new Date(),
        },
        create: {
          userId: data.userId,
          subscriptionId: data.subscriptionId,
          status: data.status,
          productId: data.productId,
          quantity: 1,
          // Price is $10 as per product configuration
          currency: 'USD',
          currentPeriodEnd: data.currentPeriodEnd,
        },
      });

      // Update user's subscription plan based on status
      const userPlan = data.status === SubscriptionStatus.ACTIVE ? SubscriptionPlan.PRO : SubscriptionPlan.FREE;
      await db.user.update({
        where: { id: data.userId },
        data: { subscriptionPlan: userPlan },
      });
      
      ;
      return subscription;
    } catch (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }
  }

  // Update subscription by subscription ID
  static async updateSubscriptionByDodoId(subscriptionId: string, data: UpdateSubscriptionData) {
    try {
      const subscription = await db.subscription.update({
        where: { subscriptionId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Update user's subscription plan based on status
      if (data.status) {
        const userPlan = data.status === SubscriptionStatus.ACTIVE ? SubscriptionPlan.PRO : SubscriptionPlan.FREE;
        await db.user.update({
          where: { id: subscription.userId },
          data: { subscriptionPlan: userPlan },
        });
      }
      
      ;
      return subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Find subscription by Dodo subscription ID
  static async findByDodoId(subscriptionId: string) {
    try {
      return await db.subscription.findUnique({
        where: { subscriptionId },
        include: { user: true },
      });
    } catch (error) {
      console.error('Error finding subscription:', error);
      throw error;
    }
  }

  // Find user's subscription
  static async findByUserId(userId: string) {
    try {
      return await db.subscription.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error('Error finding user subscription:', error);
      throw error;
    }
  }

  // Create free subscription for user
  static async createFreeSubscription(userId: string) {
    try {
      const subscription = await db.subscription.upsert({
        where: { userId },
        update: {
          status: SubscriptionStatus.NONE,
          updatedAt: new Date(),
        },
        create: {
          userId,
          status: SubscriptionStatus.NONE,
          quantity: 1,
          currency: 'USD',
        },
      });

      // Update user's subscription plan to FREE
      await db.user.update({
        where: { id: userId },
        data: { subscriptionPlan: SubscriptionPlan.FREE },
      });
      
      ;
      return subscription;
    } catch (error) {
      console.error('Error creating free subscription:', error);
      throw error;
    }
  }

  // Activate subscription
  static async activateSubscription(subscriptionId: string, currentPeriodEnd: Date) {
    try {
      const subscription = await db.subscription.update({
        where: { subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
      });

      // Update user's subscription plan to PRO
      await db.user.update({
        where: { id: subscription.userId },
        data: { subscriptionPlan: SubscriptionPlan.PRO },
      });
      
      ;
      return subscription;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await db.subscription.update({
        where: { subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELLED,
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update user's subscription plan to FREE
      await db.user.update({
        where: { id: subscription.userId },
        data: { subscriptionPlan: SubscriptionPlan.FREE },
      });
      
      ;
      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Put subscription on hold
  static async holdSubscription(subscriptionId: string) {
    try {
      const subscription = await db.subscription.update({
        where: { subscriptionId },
        data: {
          status: SubscriptionStatus.ON_HOLD,
          updatedAt: new Date(),
        },
      });

      // Update user's subscription plan to FREE when on hold
      await db.user.update({
        where: { id: subscription.userId },
        data: { subscriptionPlan: SubscriptionPlan.FREE },
      });
      
      ;
      return subscription;
    } catch (error) {
      console.error('Error putting subscription on hold:', error);
      throw error;
    }
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await db.subscription.findUnique({
        where: { userId },
      });
      
      if (!subscription) return false;
      
      // Check if subscription is active
      return subscription.status === SubscriptionStatus.ACTIVE;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}
