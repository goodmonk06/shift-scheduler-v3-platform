import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';

export class CreateShiftAssignmentDto {
  @ApiProperty({ example: 'facility-id' })
  @IsString()
  facilityId: string;

  @ApiProperty({ example: 'staff-id' })
  @IsString()
  staffId: string;

  @ApiProperty({ example: 'pattern-id' })
  @IsString()
  patternId: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AssignmentStatus, example: 'CONFIRMED', required: false })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiProperty({ example: 'メモ', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
