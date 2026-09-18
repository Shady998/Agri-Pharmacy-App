import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../decorators/current-user.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('مستخدم غير مصادق');
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('المستخدم غير مرتبط بمستأجر');
    }

    // Dev mode: bypass DB lookup for dev tenants
    if (tenantId.startsWith('dev-')) {
      const mockTenant = { id: tenantId, status: 'ACTIVE' };
      (global as any).currentTenantId = tenantId;
      request.tenant = mockTenant;
      request.tenantId = tenantId;
      return true;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new ForbiddenException('المستأجر غير موجود');
    }

    if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
      throw new ForbiddenException('اشتراك المستأجر غير نشط');
    }

    (global as any).currentTenantId = tenantId;
    request.tenant = tenant;
    request.tenantId = tenantId;

    return true;
  }
}