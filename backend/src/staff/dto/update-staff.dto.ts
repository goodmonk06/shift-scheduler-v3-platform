import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsArray, IsInt, IsBoolean } from 'class-validator';
import { EmploymentType } from '@prisma/client';

export class UpdateStaffDto {
  @ApiProperty({ example: '山田太郎', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'EMP001', required: false })
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @ApiProperty({ example: 'staff@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '090-1234-5678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: EmploymentType, example: 'FULL_TIME', required: false })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiProperty({ example: '介護士', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ example: ['介護福祉士', '看護師'], required: false })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiProperty({ example: 40, required: false })
  @IsOptional()
  @IsInt()
  maxHoursPerWeek?: number;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsInt()
  maxDaysPerWeek?: number;

  @ApiProperty({ example: [1, 3, 5], required: false })
  @IsOptional()
  @IsArray()
  preferredDays?: number[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
