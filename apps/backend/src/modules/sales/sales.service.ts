import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SaleStatus, StockMovementType, DebtStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface SaleItemDto {
  productId: string;
  batchId?: string;
  quantity: number;
  unitPrice: number;
}

interface CreateSaleDto {
  customerId?: string;
  items: SaleItemDto[];
  discount?: number;
  tax?: number;
  notes?: string;
}

interface UpdateSaleDto extends Partial<CreateSaleDto> {}

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, data: CreateSaleDto) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('يجب إضافة صنف واحد على الأقل');
    }

    return this.prisma.$transaction(async (tx) => {
      let totalAmount = new Decimal(0);

      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
          include: {
            inventoryBatches: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
            },
          },
        });

        if (!product) {
          throw new NotFoundException(`المنتج ${item.productId} غير موجود`);
        }

        let batch = null;
        if (item.batchId) {
          batch = await tx.inventoryBatch.findFirst({
            where: { id: item.batchId, tenantId, productId: item.productId },
          });
          if (!batch) {
            throw new NotFoundException(`الدفعة ${item.batchId} غير موجودة`);
          }
        } else {
          batch = product.inventoryBatches[0];
          if (!batch) {
            throw new BadRequestException(`لا يوجد مخزون متاح للمنتج ${product.tradeName}`);
          }
        }

        if (Number(batch.quantity) < item.quantity) {
          throw new BadRequestException(`كمية غير كافية للمنتج ${product.tradeName}. متاح: ${batch.quantity}`);
        }

        totalAmount = totalAmount.plus(new Decimal(item.quantity).mul(item.unitPrice));
      }

      const discount = new Decimal(data.discount || 0);
      const tax = new Decimal(data.tax || 0);
      const finalAmount = totalAmount.minus(discount).plus(tax);

      const sale = await tx.sale.create({
        data: {
          tenantId,
          customerId: data.customerId,
          createdById: userId,
          totalAmount: finalAmount,
          discount,
          tax,
          status: SaleStatus.COMPLETED,
          notes: data.notes,
          items: {
            create: data.items.map((item) => ({
              tenantId,
              productId: item.productId,
              batchId: item.batchId,
              quantity: new Decimal(item.quantity),
              unitPrice: new Decimal(item.unitPrice),
              total: new Decimal(item.quantity).mul(item.unitPrice),
            })),
          },
        },
        include: { items: true },
      });

      for (const item of data.items) {
        const batch = await tx.inventoryBatch.findFirst({
          where: { id: item.batchId || undefined, productId: item.productId, tenantId },
          orderBy: { expiryDate: 'asc' },
        });

        if (batch) {
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { quantity: new Decimal(Number(batch.quantity) - item.quantity) },
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              batchId: batch.id,
              type: StockMovementType.OUT,
              quantity: new Decimal(item.quantity),
              referenceType: 'SALE',
              referenceId: sale.id,
              notes: `مبيعة - فاتورة ${sale.id.slice(0, 8)}`,
            },
          });
        }
      }

      if (data.customerId && finalAmount.gt(0)) {
        await tx.debt.create({
          data: {
            tenantId,
            customerId: data.customerId,
            amount: finalAmount,
            status: DebtStatus.PENDING,
            notes: `دين من فاتورة مبيعات ${sale.id.slice(0, 8)}`,
            saleId: sale.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'SALE_CREATED',
          entityType: 'Sale',
          entityId: sale.id,
          newData: { totalAmount: finalAmount.toString(), itemCount: data.items.length },
        },
      });

      return sale;
    });
  }

  async findAll(tenantId: string, params: { skip?: number; take?: number; customerId?: string; status?: SaleStatus; startDate?: Date; endDate?: Date } = {}) {
    const { skip = 0, take = 20, customerId, status, startDate, endDate } = params;

    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = startDate;
      if (endDate) where.saleDate.lte = endDate;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { saleDate: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          items: { include: { product: { select: { tradeName: true } } } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { data: sales, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, tradeName: true, unitType: true } },
            batch: { select: { id: true, batchNumber: true, expiryDate: true } },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('الفاتورة غير موجودة');
    }

    return sale;
  }

  async returnSale(tenantId: string, userId: string, id: string, data: { items: { saleItemId: string; quantity: number; reason?: string }[]; notes?: string }) {
    const sale = await this.findOne(tenantId, id);

    if (sale.status === SaleStatus.RETURNED || sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('لا يمكن إرجاع فاتورة مرتجعة أو ملغية');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const saleItem = sale.items.find((si) => si.id === item.saleItemId);
        if (!saleItem) {
          throw new NotFoundException(`الصنف ${item.saleItemId} غير موجود في الفاتورة`);
        }

        if (item.quantity > Number(saleItem.quantity)) {
          throw new BadRequestException(`كمية الإرجاع أكبر من الكمية المباعة`);
        }

        if (saleItem.batchId) {
          await tx.inventoryBatch.update({
            where: { id: saleItem.batchId },
            data: { quantity: { increment: new Decimal(item.quantity) } },
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: saleItem.productId,
              batchId: saleItem.batchId,
              type: StockMovementType.RETURN,
              quantity: new Decimal(item.quantity),
              referenceType: 'RETURN',
              referenceId: sale.id,
              notes: `مرتجع - فاتورة ${sale.id.slice(0, 8)}: ${item.reason || ''}`,
            },
          });
        }
      }

      const returnedAmount = data.items.reduce((sum, i) => {
        const si = sale.items.find((s) => s.id === i.saleItemId);
        return sum + Number(si!.unitPrice) * i.quantity;
      }, 0);

      await tx.sale.update({
        where: { id },
        data: {
          status: data.items.length === sale.items.length ? SaleStatus.RETURNED : SaleStatus.COMPLETED,
          updatedById: userId,
          notes: `${sale.notes || ''}\nمرتجع: ${data.notes || ''}`,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'SALE_RETURNED',
          entityType: 'Sale',
          entityId: id,
          newData: { returnedAmount, items: data.items },
        },
      });

      return { success: true, returnedAmount };
    });
  }

  async getDailySummary(tenantId: string, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const [sales, totalAmount, totalItems] = await Promise.all([
      this.prisma.sale.findMany({
        where: { tenantId, saleDate: { gte: start, lte: end }, status: SaleStatus.COMPLETED },
        select: { totalAmount: true, items: { select: { quantity: true } } },
      }),
      this.prisma.sale.aggregate({
        where: { tenantId, saleDate: { gte: start, lte: end }, status: SaleStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      this.prisma.saleItem.aggregate({
        where: { sale: { tenantId, saleDate: { gte: start, lte: end }, status: SaleStatus.COMPLETED } },
        _sum: { quantity: true },
      }),
    ]);

    return {
      date,
      count: sales.length,
      totalAmount: totalAmount._sum.totalAmount || 0,
      totalItems: totalItems._sum.quantity || 0,
      averageOrder: sales.length > 0 ? (Number(totalAmount._sum.totalAmount || 0) / sales.length) : 0,
    };
  }
}