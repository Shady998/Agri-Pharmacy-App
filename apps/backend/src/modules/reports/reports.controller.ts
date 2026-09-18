import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get dashboard KPIs and recent activity' })
  async getDashboard(@CurrentTenant('id') tenantId: string) {
    return this.reportsService.getDashboard(tenantId);
  }

  @Get('sales')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get sales report for period' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', '6months', 'yearly'] })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async getSalesReport(
    @CurrentTenant('id') tenantId: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | '6months' | 'yearly',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    return this.reportsService.getSalesReport(tenantId, period || 'monthly', startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
  }

  @Get('inventory')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get inventory report' })
  async getInventoryReport(@CurrentTenant('id') tenantId: string): Promise<any> {
    return this.reportsService.getInventoryReport(tenantId);
  }

  @Get('profit-loss')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get profit & loss report' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', '6months', 'yearly'] })
  async getProfitLoss(
    @CurrentTenant('id') tenantId: string,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly' | '6months' | 'yearly',
  ): Promise<any> {
    return this.reportsService.getProfitLoss(tenantId, period || 'monthly');
  }
}