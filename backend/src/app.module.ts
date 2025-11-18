import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { FacilityModule } from './facility/facility.module';
import { StaffModule } from './staff/staff.module';
import { DepartmentModule } from './department/department.module';
import { ShiftPatternModule } from './shift-pattern/shift-pattern.module';
import { ShiftAssignmentModule } from './shift-assignment/shift-assignment.module';
import { ShiftSwapModule } from './shift-swap/shift-swap.module';
import { ConstraintRuleModule } from './constraint-rule/constraint-rule.module';
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { NotificationModule } from './notification/notification.module';
import { BillingModule } from './billing/billing.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    TenantModule,
    FacilityModule,
    StaffModule,
    DepartmentModule,
    ShiftPatternModule,
    ShiftAssignmentModule,
    ShiftSwapModule,
    ConstraintRuleModule,
    LeaveRequestModule,
    NotificationModule,
    BillingModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
