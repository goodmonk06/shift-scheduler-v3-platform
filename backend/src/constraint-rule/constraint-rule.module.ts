import { Module } from '@nestjs/common';
import { ConstraintRuleService } from './constraint-rule.service';
import { ConstraintRuleController } from './constraint-rule.controller';

@Module({
  controllers: [ConstraintRuleController],
  providers: [ConstraintRuleService],
  exports: [ConstraintRuleService],
})
export class ConstraintRuleModule {}
