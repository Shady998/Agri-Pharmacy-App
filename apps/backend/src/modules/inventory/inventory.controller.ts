import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole, StockMovementType } from '@prisma/client';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('summary')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get inventory summary dashboard' })
  async getSummary(@CurrentTenant('id') tenantId: string) {
    return this.inventoryService.getStockSummary(tenantId);
  }

  @Post('batches')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Receive new inventory batch' })
  async createBatch(@CurrentTenant('id') tenantId: string, @Body() data: any) {
    return this.inventoryService.createBatch(tenantId, data);
  }

  @Get('batches')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'List inventory batches' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'expiringSoon', required: false, type: Boolean })
  async getBatches(
    @CurrentTenant('id') tenantId: string,
    @Query('productId') productId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('expiringSoon') expiringSoon?: boolean,
  ) {
    return this.inventoryService.getBatches(tenantId, { productId, skip, take, expiringSoon });
  }

  @Post('adjust')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Adjust stock (IN/OUT/ADJUSTMENT/RETURN/EXPIRED/DAMAGED)' })
  async adjustStock(
    @CurrentTenant('id') tenantId: string,
    @Body() data: any,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.adjustStock(tenantId, userId, data);
  }

  @Get('movements')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List stock movements' })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({ name: 'batchId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: StockMovementType })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getMovements(
    @CurrentTenant('id') tenantId: string,
    @Query('productId') productId?: string,
    @Query('batchId') batchId?: string,
    @Query('type') type?: StockMovementType,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.inventoryService.getMovements(tenantId, { productId, batchId, type, skip, take });
  }
}