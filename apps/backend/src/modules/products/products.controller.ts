import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole, PesticideType } from '@prisma/client';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new product' })
  async create(@CurrentTenant('id') tenantId: string, @Body() data: any) {
    return this.productsService.create(tenantId, data);
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'List products with filters' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'pesticideType', required: false, enum: PesticideType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('pesticideType') pesticideType?: PesticideType,
    @Query('isActive') isActive?: boolean,
    @Query('lowStock') lowStock?: boolean,
  ) {
    return this.productsService.findAll(tenantId, {
      skip,
      take,
      filters: { search, pesticideType, isActive, lowStock },
    });
  }

  @Get('search')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Search products by name or ingredient' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async search(@CurrentTenant('id') tenantId: string, @Query('q') query: string) {
    return this.productsService.search(tenantId, query);
  }

  @Get('low-stock')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get products with low stock' })
  async getLowStock(@CurrentTenant('id') tenantId: string) {
    return this.productsService.getLowStock(tenantId);
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get product details' })
  async findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.productsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update product' })
  async update(@CurrentTenant('id') tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.productsService.update(tenantId, id, data);
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Delete or deactivate product' })
  async delete(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.productsService.delete(tenantId, id);
  }
}