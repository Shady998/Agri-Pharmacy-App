import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getTenantSettings(tenantId: string) {
    // Dev mode: return mock settings for dev tenants
    if (tenantId.startsWith('dev-')) {
      return {
        id: tenantId,
        name: 'Dev Tenant',
        slug: 'dev-tenant',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        settings: {
          lowStockAlerts: true,
          expiryAlerts: true,
        },
      };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, plan: true, status: true, settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('المستأجر غير موجود');
    }

    return tenant;
  }

  async updateTenantSettings(tenantId: string, settings: Record<string, any>) {
    // Dev mode: return mock updated settings
    if (tenantId.startsWith('dev-')) {
      return {
        id: tenantId,
        name: 'Dev Tenant',
        slug: 'dev-tenant',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        settings,
      };
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
      select: { id: true, name: true, slug: true, plan: true, status: true, settings: true },
    });
  }

  async getUnits(tenantId: string) {
    return {
      weight: ['KG', 'GRAM', 'TON'],
      volume: ['LITER', 'ML'],
      count: ['BOX', 'PACKET', 'PIECE', 'SEEDS'],
      custom: [],
    };
  }

  async getCategories(tenantId: string) {
    return {
      pesticideTypes: ['FUNGICIDE', 'INSECTICIDE', 'HERBICIDE', 'OTHER'],
      expenseCategories: ['RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'TRANSPORT', 'MAINTENANCE', 'INSURANCE', 'TAXES', 'OTHER'],
      customerTypes: ['FARMER', 'PRODUCER', 'BOTH'],
    };
  }
}