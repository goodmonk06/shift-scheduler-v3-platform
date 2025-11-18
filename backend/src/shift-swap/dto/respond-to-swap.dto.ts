import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SwapStatus } from '@prisma/client';

export class RespondToSwapDto {
  @IsEnum(SwapStatus)
  status: SwapStatus;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
