import { Module } from '@nestjs/common';
import { ShiftPatternService } from './shift-pattern.service';
import { ShiftPatternController } from './shift-pattern.controller';

@Module({
  controllers: [ShiftPatternController],
  providers: [ShiftPatternService],
  exports: [ShiftPatternService],
})
export class ShiftPatternModule {}
