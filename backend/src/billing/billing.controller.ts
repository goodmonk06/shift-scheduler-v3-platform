import { Controller, Get, Post, Body, UseGuards, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { Request } from 'express';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('create-customer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCustomer(
    @CurrentTenant() tenantId: string,
    @Body() data: { email: string; name: string },
  ) {
    return this.billingService.createCustomer(tenantId, data.email, data.name);
  }

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCheckoutSession(
    @CurrentTenant() tenantId: string,
    @Body() data: { priceId: string },
  ) {
    return this.billingService.createCheckoutSession(tenantId, data.priceId);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getSubscription(@CurrentTenant() tenantId: string) {
    return this.billingService.getSubscriptionInfo(tenantId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.rawBody;
    return this.billingService.handleWebhook(signature, payload);
  }
}
