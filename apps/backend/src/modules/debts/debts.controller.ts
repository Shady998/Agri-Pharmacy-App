import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, DebtStatus, PaymentMethod } from '@prisma/client';

@ApiTags('debts')
@Controller('debts')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class DebtsController {
  constructor(private debtsService: DebtsService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new debt record' })
  async create(@Body() data: any) {
    const tenantId = (global as any).currentTenantId;
    return this.debtsService.create(tenantId, data);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'List debts with filters' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DebtStatus })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('customerId') customerId?: string,
    @Query('status') status?: DebtStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const tenantId = (global as any).currentTenantId;
    return this.debtsService.findAll(tenantId, { skip, take, customerId, status, sortBy, sortOrder });
  }

  @Get('aging')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get aging report for debts' })
  async getAging() {
    const tenantId = (global as any).currentTenantId;
    return this.debtsService.getAgingReport(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get debt details with payments' })
  async findOne(@Param('id') id: string) {
    const tenantId = (global as any).currentTenantId;
    return this.debtsService.findOne(tenantId, id);
  }

  @Post(':id/payments')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Record payment for debt' })
  async recordPayment(
    @Param('id') id: string,
    @Body() data: { amount: number; method: PaymentMethod; notes?: string },
    @CurrentUser('id') userId: string,
  ) {
    const tenantId = (global as any).currentTenantId;
    return this.debtsService.recordPayment(tenantId, userId, { debtId: id, ...data });
  }
}