import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 認証不要のパス
    const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/billing/webhook', '/api'];
    if (publicPaths.some(path => req.path.startsWith(path) || req.path === path)) {
      return next();
    }

    // JWTトークンからテナント情報を取得
    const token = this.extractTokenFromHeader(req);
    if (token) {
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        req['user'] = payload;
        req['tenantId'] = payload.tenantId;
      } catch (error) {
        // トークンが無効な場合はスルー（JwtAuthGuardで処理）
      }
    }

    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
