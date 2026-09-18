import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContextService } from '../tenant-context/tenant-context.service';

let tenantContext: TenantContextService;

export const setTenantContext = (context: TenantContextService) => {
  tenantContext = context;
};

export const tenantMiddleware = (prisma: PrismaClient) => {
  prisma.$use(async (params, next) => {
    const tenantId = tenantContext?.getTenantId();

    if (tenantId && params.model) {
      const modelsWithTenant = [
        'User', 'Product', 'InventoryBatch', 'StockMovement',
        'Customer', 'Debt', 'DebtPayment', 'Sale', 'SaleItem',
        'Expense', 'AuditLog',
      ];

      if (modelsWithTenant.includes(params.model)) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'findMany') {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'create') {
          params.args.data = { ...params.args.data, tenantId };
        } else if (params.action === 'createMany') {
          params.args.data = params.args.data.map((d: any) => ({ ...d, tenantId }));
        } else if (params.action === 'update') {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'updateMany') {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'delete') {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'deleteMany') {
          params.args.where = { ...params.args.where, tenantId };
        } else if (params.action === 'upsert') {
          params.args.where = { ...params.args.where, tenantId };
          params.args.create = { ...params.args.create, tenantId };
          params.args.update = { ...params.args.update, tenantId };
        }
      }
    }

    return next(params);
  });
};