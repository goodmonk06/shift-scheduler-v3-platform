import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCustomer(tenantId: string, email: string, name: string) {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  async createCheckoutSession(tenantId: string, priceId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.stripeCustomerId) {
      throw new Error('Stripe customer not found');
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: tenant.stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.config.get('FRONTEND_URL')}/billing?success=true`,
      cancel_url: `${this.config.get('FRONTEND_URL')}/billing?canceled=true`,
      metadata: { tenantId },
    });

    return session;
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
      }

      return { received: true };
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenantId;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: this.mapStripeStatus(subscription.status),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenantId;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });
  }

  private mapStripeStatus(status: string): any {
    const statusMap = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELLED',
      incomplete: 'INCOMPLETE',
      trialing: 'TRIALING',
    };
    return statusMap[status] || 'ACTIVE';
  }

  async getSubscriptionInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.stripeSubscriptionId) {
      return null;
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId,
    );

    return subscription;
  }
}
