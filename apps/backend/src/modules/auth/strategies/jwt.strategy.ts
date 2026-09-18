import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET') || 'dev-secret-change-in-production',
    });
  }

  async validate(payload: { sub: string; email: string; tenantId: string; role: string }) {
    // Dev mode: allow mock users without DB lookup
    if (payload.sub.startsWith('dev-')) {
      return {
        id: 'dev-user-1',
        clerkId: payload.sub,
        email: payload.email,
        name: 'مطور النظام',
        role: payload.role || 'TENANT_ADMIN',
        tenantId: payload.tenantId,
        tenant: { id: payload.tenantId, name: 'Dev Tenant', status: 'ACTIVE' },
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { clerkId: payload.sub },
      include: { tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('المستخدم غير موجود أو غير نشط');
    }

    if (user.tenant.status !== 'ACTIVE' && user.tenant.status !== 'TRIAL') {
      throw new UnauthorizedException('اشتراك المستأجر غير نشط');
    }

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant,
    };
  }
}