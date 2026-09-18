import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List tenant users' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(tenantId, { skip, take, search, role });
  }

  @Get(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get user details' })
  async findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Post('invite')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Invite new user to tenant' })
  async inviteUser(
    @CurrentTenant('id') tenantId: string,
    @Body() data: { email: string; name: string; role: UserRole },
    @CurrentUser('id') inviterId: string,
  ) {
    return this.usersService.inviteUser(tenantId, data, inviterId);
  }

  @Patch(':id/role')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @CurrentUser('role') requesterRole: UserRole,
  ) {
    return this.usersService.updateRole(tenantId, id, role, requesterRole);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  async deactivateUser(@CurrentTenant('id') tenantId: string, @Param('id') id: string, @CurrentUser('id') requesterId: string) {
    return this.usersService.deactivateUser(tenantId, id, requesterId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.TENANT_ADMIN)
  @ApiOperation({ summary: 'Activate user' })
  async activateUser(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.usersService.activateUser(tenantId, id);
  }
}