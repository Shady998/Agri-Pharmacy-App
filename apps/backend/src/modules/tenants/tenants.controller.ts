import { Controller, Get, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, TenantStatus, SubscriptionPlan } from '@prisma/client';

@ApiTags('tenants')
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants (SuperAdmin only)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: TenantStatus,
    @Query('search') search?: string,
  ) {
    return this.tenantsService.findAll({ skip, take, status, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tenant statistics' })
  async getStats() {
    return this.tenantsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant details' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Update tenant subscription plan' })
  async updatePlan(
    @Param('id') id: string,
    @Body('plan') plan: SubscriptionPlan,
    @Request() req: any,
  ) {
    return this.tenantsService.updatePlan(id, plan, req.user.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update tenant status (activate/suspend)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
    @Request() req: any,
  ) {
    return this.tenantsService.updateStatus(id, status, req.user.role);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update tenant settings' })
  async updateSettings(@Param('id') id: string, @Body() settings: Record<string, any>) {
    return this.tenantsService.updateSettings(id, settings);
  }
}