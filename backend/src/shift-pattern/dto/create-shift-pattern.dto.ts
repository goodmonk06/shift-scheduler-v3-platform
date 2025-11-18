import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateShiftPatternDto {
  @ApiProperty({ example: '早番' })
  @IsString()
  name: string;

  @ApiProperty({ example: '早' })
  @IsString()
  shortName: string;

  @ApiProperty({ example: '#3b82f6', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 'facility-id' })
  @IsString()
  facilityId: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  @IsInt()
  breakMinutes?: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsInt()
  requiredStaff?: number;

  @ApiProperty({ example: ['介護福祉士'], required: false })
  @IsOptional()
  @IsArray()
  requiredSkills?: string[];

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
