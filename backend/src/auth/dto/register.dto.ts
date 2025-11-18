import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '山田太郎' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'my-company', required: false })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiProperty({ example: '株式会社サンプル', required: false })
  @IsOptional()
  @IsString()
  tenantName?: string;
}
