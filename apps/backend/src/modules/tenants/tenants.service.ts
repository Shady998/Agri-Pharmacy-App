import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionPlan, TenantStatus, UserRole } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; status?: TenantStatus; search?: string }) {
    const { skip = 0, take = 20, status, search } = params;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, products: true, sales: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data: tenants, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        _count: { select: { products: true, customers: true, sales: true, expenses: true } },
      },
    });

    if (!tenant) {
      throw new NotFoundException('المستأجر غير موجود');
    }

    return tenant;
  }

  async updatePlan(id: string, plan: SubscriptionPlan, requesterRole: UserRole) {
    if (requesterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('فقط المشرف العام يمكنه تغيير الباقة');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { plan },
    });
  }

  async updateStatus(id: string, status: TenantStatus, requesterRole: UserRole) {
    if (requesterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('فقط المشرف العام يمكنه تغيير حالة الاشتراك');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  async updateSettings(id: string, settings: Record<string, any>) {
    return this.prisma.tenant.update({
      where: { id },
      data: { settings: { ...settings } },
    });
  }

  async getStats() {
    const [total, active, trial, suspended] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.TRIAL } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.SUSPENDED } }),
    ]);

    return { total, active, trial, suspended };
  }
}