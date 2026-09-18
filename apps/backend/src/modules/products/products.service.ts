import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PesticideType, UnitType } from '@prisma/client';

interface CreateProductDto {
  tradeName: string;
  activeIngredient: string;
  pesticideType: PesticideType;
  usageNotes?: string;
  unitType?: UnitType;
  minThreshold?: number;
  barcode?: string;
}

interface UpdateProductDto extends Partial<CreateProductDto> {}

interface ProductFilters {
  search?: string;
  pesticideType?: PesticideType;
  isActive?: boolean;
  lowStock?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { tenantId, tradeName: data.tradeName, activeIngredient: data.activeIngredient },
    });

    if (existing) {
      throw new ConflictException('منتج بنفس الاسم التجاري والمادة الفعالة موجود بالفعل');
    }

    return this.prisma.product.create({
      data: {
        ...data,
        minThreshold: data.minThreshold || 0,
        unitType: data.unitType || UnitType.KG,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, params: { skip?: number; take?: number; filters?: ProductFilters } = {}) {
    const { skip = 0, take = 20, filters = {} } = params;

    const where: any = { tenantId };

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.pesticideType) where.pesticideType = filters.pesticideType;

    if (filters.search) {
      where.OR = [
        { tradeName: { contains: filters.search, mode: 'insensitive' } },
        { activeIngredient: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.lowStock) {
      where.inventoryBatches = {
        some: { quantity: { lte: { minThreshold: true } } },
      };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { tradeName: 'asc' },
        include: {
          _count: { select: { inventoryBatches: true } },
          inventoryBatches: {
            where: { quantity: { gt: 0 } },
            select: { id: true, quantity: true, expiryDate: true },
            orderBy: { expiryDate: 'asc' },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: products, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        inventoryBatches: {
          where: { quantity: { gt: 0 } },
          orderBy: { expiryDate: 'asc' },
        },
        _count: { select: { stockMovements: true, saleItems: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    return product;
  }

  async update(tenantId: string, id: string, data: UpdateProductDto) {
    await this.findOne(tenantId, id);

    if (data.tradeName || data.activeIngredient) {
      const existing = await this.prisma.product.findFirst({
        where: {
          tenantId,
          tradeName: data.tradeName,
          activeIngredient: data.activeIngredient,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException('منتج بنفس الاسم التجاري والمادة الفعالة موجود بالفعل');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const hasRelations = await this.prisma.product.findFirst({
      where: { id },
      select: {
        _count: { select: { inventoryBatches: true, saleItems: true, stockMovements: true } },
      },
    });

    if (hasRelations!._count.inventoryBatches > 0 || hasRelations!._count.saleItems > 0) {
      return this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.product.delete({ where: { id } });
  }

  async search(tenantId: string, query: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { tradeName: { contains: query, mode: 'insensitive' } },
          { activeIngredient: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { tradeName: 'asc' },
      select: { id: true, tradeName: true, activeIngredient: true, pesticideType: true, unitType: true },
    });
  }

  async getLowStock(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        inventoryBatches: {
          where: { quantity: { gt: 0 } },
          select: { id: true, quantity: true, expiryDate: true },
        },
      },
    });

    return products
      .map((p) => ({
        ...p,
        totalStock: p.inventoryBatches.reduce((sum: number, b: any) => sum + Number(b.quantity), 0),
        isLowStock: p.inventoryBatches.some((b: any) => Number(b.quantity) <= Number(p.minThreshold)),
      }))
      .filter((p) => p.isLowStock);
  }
}