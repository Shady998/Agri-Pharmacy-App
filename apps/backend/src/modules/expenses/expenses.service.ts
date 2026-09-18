import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ExpenseCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateExpenseDto {
  category: ExpenseCategory;
  amount: number;
  expenseDate: Date;
  description?: string;
  receiptUrl?: string;
}

interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { ...data, tenantId, amount: new Decimal(data.amount) },
    });
  }

  async findAll(tenantId: string, params: { skip?: number; take?: number; category?: ExpenseCategory; startDate?: Date; endDate?: Date } = {}) {
    const { skip = 0, take = 20, category, startDate, endDate } = params;

    const where: any = { tenantId };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data: expenses, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(tenantId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!expense) {
      throw new NotFoundException('المصروف غير موجود');
    }

    return expense;
  }

  async update(tenantId: string, id: string, data: UpdateExpenseDto) {
    await this.findOne(tenantId, id);

    const updateData: any = { ...data };
    if (data.amount !== undefined) {
      updateData.amount = new Decimal(data.amount);
    }

    return this.prisma.expense.update({ where: { id }, data: updateData });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(tenantId: string, startDate: Date, endDate: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: { tenantId, expenseDate: { gte: startDate, lte: endDate } },
      select: { category: true, amount: true },
    });

    const byCategory = expenses.reduce((acc, e) => {
      const cat = e.category;
      if (!acc[cat]) acc[cat] = { category: cat, total: 0, count: 0 };
      acc[cat].total += Number(e.amount);
      acc[cat].count++;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      period: { start: startDate, end: endDate },
      total,
      byCategory: Object.values(byCategory),
    };
  }
}