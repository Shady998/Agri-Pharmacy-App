import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get tenant settings' })
  async getSettings() {
    const tenantId = (global as any).currentTenantId;
    return this.settingsService.getTenantSettings(tenantId);
  }

  @Patch()
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update tenant settings' })
  async updateSettings(@Body() settings: Record<string, any>) {
    const tenantId = (global as any).currentTenantId;
    return this.settingsService.updateTenantSettings(tenantId, settings);
  }

  @Get('units')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get available units of measure' })
  async getUnits() {
    const tenantId = (global as any).currentTenantId;
    return this.settingsService.getUnits(tenantId);
  }

  @Get('categories')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get system categories/enums' })
  async getCategories() {
    const tenantId = (global as any).currentTenantId;
    return this.settingsService.getCategories(tenantId);
  }
}