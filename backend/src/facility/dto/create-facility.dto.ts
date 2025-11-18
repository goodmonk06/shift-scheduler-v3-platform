import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { FacilityType } from '@prisma/client';

export class CreateFacilityDto {
  @ApiProperty({ example: '本社介護施設' })
  @IsString()
  name: string;

  @ApiProperty({ enum: FacilityType, example: 'NURSING_HOME' })
  @IsEnum(FacilityType)
  type: FacilityType;

  @ApiProperty({ example: 'Asia/Tokyo', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}
