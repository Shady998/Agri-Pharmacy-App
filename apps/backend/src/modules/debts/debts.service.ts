import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DebtStatus, PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateDebtDto {
  customerId: string;
  amount: number;
  dueDate?: Date;
  notes?: string;
  saleId?: string;
}

interface RecordPaymentDto {
  debtId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateDebtDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: data.customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('العميل غير موجود');
    }

    return this.prisma.$transaction(async (tx) => {
      const debt = await tx.debt.create({
        data: {
          tenantId,
          customerId: data.customerId,
          amount: new Decimal(data.amount),
          status: DebtStatus.PENDING,
          dueDate: data.dueDate,
          notes: data.notes,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: 'DEBT_CREATED',
          entityType: 'Debt',
          entityId: debt.id,
          newData: { amount: data.amount, customerId: data.customerId },
        },
      });

      return debt;
    });
  }

  async findAll(tenantId: string, params: { skip?: number; take?: number; customerId?: string; status?: DebtStatus; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const { skip = 0, take = 20, customerId, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const [debts, total] = await Promise.all([
      this.prisma.debt.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          payments: { orderBy: { paidAt: 'desc' } },
        },
      }),
      this.prisma.debt.count({ where }),
    ]);

    return { data: debts, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(tenantId: string, id: string) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        payments: { orderBy: { paidAt: 'desc' } },
        sale: { select: { id: true, saleDate: true, totalAmount: true } },
      },
    });

    if (!debt) {
      throw new NotFoundException('الدين غير موجود');
    }

    const paidAmount = debt.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(debt.amount) - paidAmount;

    return { ...debt, paidAmount, remaining };
  }

  async recordPayment(tenantId: string, userId: string, data: RecordPaymentDto) {
    const debt = await this.prisma.debt.findFirst({
      where: { id: data.debtId, tenantId },
      include: { payments: true },
    });

    if (!debt) {
      throw new NotFoundException('الدين غير موجود');
    }

    const paidAmount = debt.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(debt.amount) - paidAmount;

    if (data.amount > remaining) {
      throw new BadRequestException(`المبلغ المدفوع (${data.amount}) أكبر من المتبقي (${remaining})`);
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.debtPayment.create({
        data: {
          tenantId,
          debtId: data.debtId,
          amount: new Decimal(data.amount),
          method: data.method,
          notes: data.notes,
        },
      });

      const newPaidAmount = paidAmount + data.amount;
      const newStatus = newPaidAmount >= Number(debt.amount) ? DebtStatus.PAID : DebtStatus.PARTIAL;

      await tx.debt.update({
        where: { id: data.debtId },
        data: { status: newStatus },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'DEBT_PAYMENT',
          entityType: 'Debt',
          entityId: data.debtId,
          newData: { paymentAmount: data.amount, newStatus },
        },
      });

      return { payment, debt: { ...debt, status: newStatus, paidAmount: newPaidAmount } };
    });
  }

  async getAgingReport(tenantId: string) {
    const now = new Date();
    const debts = await this.prisma.debt.findMany({
      where: { tenantId, status: { in: [DebtStatus.PENDING, DebtStatus.PARTIAL, DebtStatus.OVERDUE] } },
      include: { 
        customer: { select: { name: true, phone: true } },
        payments: true,
      },
    });

    const aging = {
      current: { count: 0, amount: 0 },
      '1-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    for (const debt of debts) {
      const paidAmount = debt.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const remaining = Number(debt.amount) - paidAmount;
      if (remaining <= 0) continue;

      let bucket = 'current';
      if (debt.dueDate) {
        const daysOverdue = Math.floor((now.getTime() - debt.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 90) bucket = '90+';
        else if (daysOverdue > 60) bucket = '61-90';
        else if (daysOverdue > 30) bucket = '31-60';
        else if (daysOverdue > 0) bucket = '1-30';
      }

      aging[bucket as keyof typeof aging].count++;
      aging[bucket as keyof typeof aging].amount += remaining;
    }

    return aging;
  }
}