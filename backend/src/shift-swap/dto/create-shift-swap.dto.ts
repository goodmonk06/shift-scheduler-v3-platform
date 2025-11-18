import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateShiftSwapDto {
  @IsString()
  @IsNotEmpty()
  requesterAssignmentId: string;

  @IsString()
  @IsOptional()
  targetStaffId?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
