import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CustomerType } from '@prisma/client';

interface CreateCustomerDto {
  name: string;
  type: CustomerType;
  phone?: string;
  address?: string;
  notes?: string;
}

interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { ...data, tenantId },
    });
  }

  async findAll(tenantId: string, params: { skip?: number; take?: number; search?: string; type?: CustomerType; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const { skip = 0, take = 20, search, type, sortBy = 'name', sortOrder = 'asc' } = params;

    const where: any = { tenantId };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { debts: true, sales: true } },
          debts: {
            where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
            select: { amount: true, status: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const customersWithDebt = customers.map((c) => ({
      ...c,
      totalDebt: c.debts.reduce((sum, d) => sum + Number(d.amount), 0),
      pendingDebts: c.debts.filter((d) => d.status !== 'PAID').length,
    }));

    return { data: customersWithDebt, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        debts: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
        sales: { orderBy: { saleDate: 'desc' }, take: 10 },
        _count: { select: { debts: true, sales: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    const totalDebt = customer.debts
      .filter((d) => d.status !== 'PAID' && d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const paidAmount = customer.debts
      .filter((d) => d.status === 'PAID')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    return { ...customer, totalDebt, paidAmount };
  }

  async update(tenantId: string, id: string, data: UpdateCustomerDto) {
    await this.findOne(tenantId, id);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const hasRelations = await this.prisma.customer.findFirst({
      where: { id },
      select: { _count: { select: { debts: true, sales: true } } },
    });

    if (hasRelations!._count.debts > 0 || hasRelations!._count.sales > 0) {
      throw new ConflictException('لا يمكن حذف عميل له ديون أو مبيعات. عطله بدلاً من ذلك.');
    }

    return this.prisma.customer.delete({ where: { id } });
  }

  async getTopDebtors(tenantId: string, limit = 10) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        debts: {
          where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
          select: { amount: true, status: true },
        },
      },
      take: limit,
    }).then((customers) =>
      customers
        .map((c) => ({
          ...c,
          totalDebt: c.debts.reduce((sum, d) => sum + Number(d.amount), 0),
        }))
        .filter((c) => c.totalDebt > 0)
        .sort((a, b) => b.totalDebt - a.totalDebt)
        .slice(0, limit)
    );
  }
}