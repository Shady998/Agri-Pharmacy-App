import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole, SaleStatus } from '@prisma/client';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Create new sale (POS)' })
  async create(@CurrentTenant('id') tenantId: string, @Body() data: any, @CurrentUser('id') userId: string) {
    return this.salesService.create(tenantId, userId, data);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'List sales with filters' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SaleStatus })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('customerId') customerId?: string,
    @Query('status') status?: SaleStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.findAll(tenantId, {
      skip,
      take,
      customerId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('daily-summary')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get daily sales summary' })
  @ApiQuery({ name: 'date', required: false, type: Date })
  async getDailySummary(@CurrentTenant('id') tenantId: string, @Query('date') date?: string) {
    return this.salesService.getDailySummary(tenantId, date ? new Date(date) : new Date());
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get sale details' })
  async findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.salesService.findOne(tenantId, id);
  }

  @Post(':id/return')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Process sale return' })
  async returnSale(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.salesService.returnSale(tenantId, userId, id, data);
  }
}