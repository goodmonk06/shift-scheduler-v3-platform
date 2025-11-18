import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
