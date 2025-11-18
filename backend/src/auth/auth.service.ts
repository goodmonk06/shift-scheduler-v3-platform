import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: user.tenant,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 新規テナント作成（tenantSlugが指定されている場合）
    let tenant;
    if (registerDto.tenantSlug) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug: registerDto.tenantSlug },
      });

      if (existingTenant) {
        throw new ConflictException('Tenant slug already exists');
      }

      tenant = await this.prisma.tenant.create({
        data: {
          name: registerDto.tenantName || registerDto.tenantSlug,
          slug: registerDto.tenantSlug,
          plan: 'TRIAL',
          status: 'ACTIVE',
        },
      });
    } else {
      throw new ConflictException('Tenant slug is required');
    }

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
      include: { tenant: true },
    });

    return this.login(user);
  }
}
