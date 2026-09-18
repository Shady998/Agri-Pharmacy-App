import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SaleStatus, StockMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type Period = 'daily' | 'weekly' | 'monthly' | '6months' | 'yearly';

interface DateRange {
  start: Date;
  end: Date;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  getPeriodRange(period: Period, referenceDate = new Date()): DateRange {
    const end = new Date(referenceDate);
    end.setHours(23, 59, 59, 999);

    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'daily':
        break;
      case 'weekly':
        start.setDate(start.getDate() - start.getDay());
        break;
      case 'monthly':
        start.setDate(1);
        break;
      case '6months':
        start.setMonth(start.getMonth() - 5);
        start.setDate(1);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        break;
    }

    return { start, end };
  }

  async getDashboard(tenantId: string) {
    const todayRange = this.getPeriodRange('daily');
    const weekRange = this.getPeriodRange('weekly');
    const monthRange = this.getPeriodRange('monthly');

    const [
      todaySales,
      weekSales,
      monthSales,
      totalProducts,
      products,
      pendingDebts,
      expiringSoon,
      recentSales,
      topProducts,
    ] = await Promise.all([
      this.getSalesSummary(tenantId, todayRange),
      this.getSalesSummary(tenantId, weekRange),
      this.getSalesSummary(tenantId, monthRange),
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        include: {
          inventoryBatches: { where: { quantity: { gt: 0 } }, select: { quantity: true } },
        },
      }),
      this.prisma.debt.aggregate({
        where: { tenantId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
        _sum: { amount: true },
      }),
      this.prisma.inventoryBatch.count({
        where: {
          tenantId,
          quantity: { gt: 0 },
          expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
        },
      }),
      this.prisma.sale.findMany({
        where: { tenantId, status: SaleStatus.COMPLETED },
        orderBy: { saleDate: 'desc' },
        take: 5,
        include: { customer: { select: { name: true } }, items: { select: { quantity: true } } },
      }),
      this.getTopSellingProducts(tenantId, monthRange, 5),
    ]);

    const lowStockCount = products.filter((p: any) => {
      const totalStock = p.inventoryBatches.reduce((sum: number, b: any) => sum + Number(b.quantity), 0);
      return totalStock <= Number(p.minThreshold);
    }).length;

    return {
      kpis: {
        todayRevenue: todaySales.totalAmount,
        weekRevenue: weekSales.totalAmount,
        monthRevenue: monthSales.totalAmount,
        totalProducts,
        lowStockCount,
        pendingDebts: Number(pendingDebts._sum.amount || 0),
        expiringSoon,
      },
      recentSales: recentSales.map((s: any) => ({
        id: s.id,
        date: s.saleDate,
        customer: s.customer?.name,
        total: s.totalAmount,
        itemsCount: s.items.reduce((sum: number, i: any) => sum + Number(i.quantity), 0),
      })),
      topProducts,
    };
  }

  async getSalesReport(tenantId: string, period: Period, customStart?: Date, customEnd?: Date) {
    const range = customStart && customEnd ? { start: customStart, end: customEnd } : this.getPeriodRange(period);

    const [summary, byDay, byCategory, paymentMethods] = await Promise.all([
      this.getSalesSummary(tenantId, range),
      this.getSalesByDay(tenantId, range),
      this.getSalesByCategory(tenantId, range),
      this.getPaymentMethods(tenantId, range),
    ]);

    return { period, range, summary, byDay, byCategory, paymentMethods };
  }

  async getInventoryReport(tenantId: string) {
    const [valuation, byCategory, movements, expiring] = await Promise.all([
      this.getInventoryValuation(tenantId),
      this.getInventoryByCategory(tenantId),
      this.getRecentMovements(tenantId, 50),
      this.getExpiringProducts(tenantId),
    ]);

    return { valuation, byCategory, movements, expiring };
  }

  async getProfitLoss(tenantId: string, period: Period) {
    const range = this.getPeriodRange(period);

    const [revenue, cogs, expenses] = await Promise.all([
      this.getRevenue(tenantId, range),
      this.getCOGS(tenantId, range),
      this.getExpenses(tenantId, range),
    ]);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    return {
      period,
      range,
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    };
  }

  private async getSalesSummary(tenantId: string, range: DateRange) {
    const sales = await this.prisma.sale.findMany({
      where: { tenantId, saleDate: { gte: range.start, lte: range.end }, status: SaleStatus.COMPLETED },
      select: { totalAmount: true, discount: true, tax: true, items: { select: { quantity: true } } },
    });

    return {
      count: sales.length,
      totalAmount: sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      totalDiscount: sales.reduce((sum, s) => sum + Number(s.discount), 0),
      totalTax: sales.reduce((sum, s) => sum + Number(s.tax), 0),
      totalItems: sales.reduce((sum, s) => sum + s.items.reduce((s2, i) => s2 + Number(i.quantity), 0), 0),
    };
  }

  private async getSalesByDay(tenantId: string, range: DateRange) {
    const sales = await this.prisma.sale.findMany({
      where: { tenantId, saleDate: { gte: range.start, lte: range.end }, status: SaleStatus.COMPLETED },
      select: { saleDate: true, totalAmount: true },
    });

    const byDay: Record<string, { count: number; total: number }> = {};

    for (const sale of sales) {
      const key = sale.saleDate.toISOString().split('T')[0];
      if (!byDay[key]) byDay[key] = { count: 0, total: 0 };
      byDay[key].count++;
      byDay[key].total += Number(sale.totalAmount);
    }

    return Object.entries(byDay).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getSalesByCategory(tenantId: string, range: DateRange) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: { tenantId, saleDate: { gte: range.start, lte: range.end }, status: SaleStatus.COMPLETED },
      },
      include: { product: { select: { pesticideType: true } } },
    });

    const byCategory: Record<string, { count: number; total: number; quantity: number }> = {};

    for (const item of items) {
      const cat = item.product.pesticideType;
      if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0, quantity: 0 };
      byCategory[cat].count++;
      byCategory[cat].total += Number(item.total);
      byCategory[cat].quantity += Number(item.quantity);
    }

    return Object.entries(byCategory).map(([category, data]) => ({ category, ...data }));
  }

  private async getPaymentMethods(tenantId: string, range: DateRange) {
    const debts = await this.prisma.debtPayment.findMany({
      where: { tenantId, paidAt: { gte: range.start, lte: range.end } },
      select: { method: true, amount: true },
    });

    const byMethod: Record<string, { count: number; total: number }> = {};

    for (const payment of debts) {
      const method = payment.method;
      if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
      byMethod[method].count++;
      byMethod[method].total += Number(payment.amount);
    }

    return Object.entries(byMethod).map(([method, data]) => ({ method, ...data }));
  }

  private async getInventoryValuation(tenantId: string) {
    const batches = await this.prisma.inventoryBatch.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      select: { quantity: true, unitCost: true, product: { select: { tradeName: true } } },
    });

    let totalValue = 0;
    let totalQuantity = 0;

    for (const batch of batches) {
      const value = Number(batch.quantity) * Number(batch.unitCost);
      totalValue += value;
      totalQuantity += Number(batch.quantity);
    }

    return { totalValue, totalQuantity, averageCost: totalQuantity > 0 ? totalValue / totalQuantity : 0 };
  }

  private async getInventoryByCategory(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      include: {
        inventoryBatches: { where: { quantity: { gt: 0 } }, select: { quantity: true, unitCost: true } },
      },
    });

    const byCategory: Record<string, { products: number; quantity: number; value: number }> = {};

    for (const product of products) {
      const cat = product.pesticideType;
      if (!byCategory[cat]) byCategory[cat] = { products: 0, quantity: 0, value: 0 };
      byCategory[cat].products++;

      for (const batch of product.inventoryBatches) {
        const qty = Number(batch.quantity);
        const value = qty * Number(batch.unitCost);
        byCategory[cat].quantity += qty;
        byCategory[cat].value += value;
      }
    }

    return Object.entries(byCategory).map(([category, data]) => ({ category, ...data }));
  }

  private async getRecentMovements(tenantId: string, limit: number) {
    return this.prisma.stockMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { product: { select: { tradeName: true } }, batch: { select: { batchNumber: true } } },
    });
  }

  private async getExpiringProducts(tenantId: string) {
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    return this.prisma.inventoryBatch.findMany({
      where: {
        tenantId,
        quantity: { gt: 0 },
        expiryDate: { lte: thirtyDaysLater, gte: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
      include: { product: { select: { tradeName: true, unitType: true } } },
      take: 20,
    });
  }

  private async getTopSellingProducts(tenantId: string, range: DateRange, limit: number) {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: { tenantId, saleDate: { gte: range.start, lte: range.end }, status: SaleStatus.COMPLETED } },
      include: { product: { select: { tradeName: true, unitType: true } } },
    });

    const byProduct: Record<string, { name: string; unit: string; quantity: number; revenue: number; count: number }> = {};

    for (const item of items) {
      const key = item.productId;
      if (!byProduct[key]) byProduct[key] = { name: item.product.tradeName, unit: item.product.unitType, quantity: 0, revenue: 0, count: 0 };
      byProduct[key].quantity += Number(item.quantity);
      byProduct[key].revenue += Number(item.total);
      byProduct[key].count++;
    }

    return Object.values(byProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private async getRevenue(tenantId: string, range: DateRange): Promise<number> {
    const result = await this.prisma.sale.aggregate({
      where: { tenantId, saleDate: { gte: range.start, lte: range.end }, status: SaleStatus.COMPLETED },
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount || 0);
  }

  private async getCOGS(tenantId: string, range: DateRange): Promise<number> {
    const items = await this.prisma.saleItem.findMany({
      where: { sale: { tenantId, saleDate: { gte: range.start, lte: range.end }, status: SaleStatus.COMPLETED } },
      include: { batch: { select: { unitCost: true } } },
    });

    return items.reduce((sum, item) => sum + Number(item.batch?.unitCost || 0) * Number(item.quantity), 0);
  }

  private async getExpenses(tenantId: string, range: DateRange): Promise<number> {
    const result = await this.prisma.expense.aggregate({
      where: { tenantId, expenseDate: { gte: range.start, lte: range.end } },
      _sum: { amount: true },
    });
    return Number(result._sum.amount || 0);
  }
}