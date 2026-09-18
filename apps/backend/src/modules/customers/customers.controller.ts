import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CustomerType } from '@prisma/client';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Create new customer (farmer/producer)' })
  async create(@Body() data: any) {
    const tenantId = (global as any).currentTenantId;
    return this.customersService.create(tenantId, data);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'List customers with search and sorting' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: CustomerType })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('type') type?: CustomerType,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const tenantId = (global as any).currentTenantId;
    return this.customersService.findAll(tenantId, { skip, take, search, type, sortBy, sortOrder });
  }

  @Get('top-debtors')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get top debtors (most owed)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopDebtors(@Query('limit') limit?: number) {
    const tenantId = (global as any).currentTenantId;
    return this.customersService.getTopDebtors(tenantId, limit);
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get customer details with debts and sales' })
  async findOne(@Param('id') id: string) {
    const tenantId = (global as any).currentTenantId;
    return this.customersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update customer' })
  async update(@Param('id') id: string, @Body() data: any) {
    const tenantId = (global as any).currentTenantId;
    return this.customersService.update(tenantId, id, data);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete customer (only if no debts/sales)' })
  async delete(@Param('id') id: string) {
    const tenantId = (global as any).currentTenantId;
    return this.customersService.delete(tenantId, id);
  }
}