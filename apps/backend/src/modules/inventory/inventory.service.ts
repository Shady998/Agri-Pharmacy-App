import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StockMovementType, UnitType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateBatchDto {
  productId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  expiryDate?: Date;
}

interface AdjustStockDto {
  productId: string;
  batchId?: string;
  type: StockMovementType;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createBatch(tenantId: string, data: CreateBatchDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    const existingBatch = await this.prisma.inventoryBatch.findFirst({
      where: { tenantId, batchNumber: data.batchNumber },
    });

    if (existingBatch) {
      throw new BadRequestException('رقم الدفعة موجود بالفعل');
    }

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.inventoryBatch.create({
        data: {
          productId: data.productId,
          tenantId,
          batchNumber: data.batchNumber,
          quantity: new Decimal(data.quantity),
          unitCost: new Decimal(data.unitCost),
          expiryDate: data.expiryDate,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          batchId: batch.id,
          type: StockMovementType.IN,
          quantity: new Decimal(data.quantity),
          referenceType: 'RECEIPT',
          referenceId: batch.id,
          notes: `استلام دفعة جديدة: ${data.batchNumber}`,
        },
      });

      return batch;
    });
  }

  async getBatches(tenantId: string, params: { productId?: string; skip?: number; take?: number; expiringSoon?: boolean } = {}) {
    const { productId, skip = 0, take = 20, expiringSoon } = params;

    const where: any = { tenantId, quantity: { gt: 0 } };
    if (productId) where.productId = productId;
    if (expiringSoon) {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      where.expiryDate = { lte: thirtyDaysLater, gte: new Date() };
    }

    const [batches, total] = await Promise.all([
      this.prisma.inventoryBatch.findMany({
        where,
        skip,
        take,
        orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'asc' }],
        include: { product: { select: { id: true, tradeName: true, unitType: true, minThreshold: true } } },
      }),
      this.prisma.inventoryBatch.count({ where }),
    ]);

    return { data: batches, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async adjustStock(tenantId: string, userId: string, data: AdjustStockDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: data.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    let batch: any = null;
    if (data.batchId) {
      batch = await this.prisma.inventoryBatch.findFirst({
        where: { id: data.batchId, tenantId },
      });
      if (!batch) {
        throw new NotFoundException('الدفعة غير موجودة');
      }
    } else if (data.type === StockMovementType.OUT) {
      batch = await this.prisma.inventoryBatch.findFirst({
        where: { productId: data.productId, tenantId, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' },
      });
      if (!batch) {
        throw new BadRequestException('لا يوجد مخزون متاح للصرف');
      }
    }

    const quantity = new Decimal(data.quantity);

    if (data.type === StockMovementType.OUT && batch && Number(batch.quantity) < Number(quantity)) {
      throw new BadRequestException(`الكمية المطلوبة (${data.quantity}) أكبر من المتاح (${batch.quantity})`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (batch) {
        const newQuantity = data.type === StockMovementType.IN
          ? Number(batch.quantity) + Number(quantity)
          : Number(batch.quantity) - Number(quantity);

        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: new Decimal(newQuantity) },
        });
      }

      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          productId: data.productId,
          batchId: batch?.id,
          type: data.type,
          quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
        },
      });

      await this.checkLowStockAlert(tx, tenantId, data.productId);

      return movement;
    });
  }

  async getMovements(tenantId: string, params: { productId?: string; batchId?: string; type?: StockMovementType; skip?: number; take?: number } = {}) {
    const { productId, batchId, type, skip = 0, take = 50 } = params;

    const where: any = { tenantId };
    if (productId) where.productId = productId;
    if (batchId) where.batchId = batchId;
    if (type) where.type = type;

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { tradeName: true } },
          batch: { select: { batchNumber: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data: movements, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async getStockSummary(tenantId: string) {
    const [totalProducts, totalBatches, totalValue, products, expiringSoon] = await Promise.all([
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.inventoryBatch.count({ where: { tenantId, quantity: { gt: 0 } } }),
      this.prisma.inventoryBatch.aggregate({
        where: { tenantId, quantity: { gt: 0 } },
        _sum: { quantity: true },
      }),
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        include: {
          inventoryBatches: { where: { quantity: { gt: 0 } }, select: { quantity: true } },
        },
      }),
      this.prisma.inventoryBatch.count({
        where: {
          tenantId,
          quantity: { gt: 0 },
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
        },
      }),
    ]);

    const lowStockCount = products.filter((p) => {
      const totalStock = p.inventoryBatches.reduce((sum: number, b: any) => sum + Number(b.quantity), 0);
      return totalStock <= Number(p.minThreshold);
    }).length;

    return {
      totalProducts,
      totalBatches,
      totalValue: totalValue._sum.quantity || 0,
      lowStockCount,
      expiringSoon,
    };
  }

  private async checkLowStockAlert(tx: any, tenantId: string, productId: string) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { minThreshold: true, tradeName: true },
      include: {
        inventoryBatches: {
          where: { quantity: { gt: 0 } },
          select: { quantity: true },
        },
      },
    });

    if (product) {
      const totalStock = product.inventoryBatches.reduce((sum: number, b: any) => sum + Number(b.quantity), 0);
      if (totalStock <= Number(product.minThreshold)) {
        console.log(`⚠️ LOW STOCK ALERT: ${product.tradeName} - Current: ${totalStock}, Threshold: ${product.minThreshold}`);
      }
    }
  }
}