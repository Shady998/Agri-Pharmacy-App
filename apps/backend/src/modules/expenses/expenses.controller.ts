import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole, ExpenseCategory } from '@prisma/client';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new expense' })
  async create(@CurrentTenant('id') tenantId: string, @Body() data: any) {
    return this.expensesService.create(tenantId, data);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List expenses with filters' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('category') category?: ExpenseCategory,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expensesService.findAll(tenantId, {
      skip,
      take,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('summary')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get expenses summary by category' })
  @ApiQuery({ name: 'startDate', required: true, type: Date })
  @ApiQuery({ name: 'endDate', required: true, type: Date })
  async getSummary(
    @CurrentTenant('id') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.expensesService.getSummary(tenantId, new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get expense details' })
  async findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.expensesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update expense' })
  async update(@CurrentTenant('id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.expensesService.update(tenantId, id, data);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete expense' })
  async delete(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.expensesService.delete(tenantId, id);
  }
}