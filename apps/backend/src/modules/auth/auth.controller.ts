import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/guards/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('sync')
  @ApiOperation({ summary: 'Sync Clerk user (webhook endpoint)' })
  async syncUser(@Body() clerkUser: any) {
    const user = await this.authService.syncClerkUser(clerkUser);
    return { success: true, user };
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Clerk webhook handler' })
  async handleWebhook(@Body() payload: any) {
    const { type, data } = payload;

    switch (type) {
      case 'user.created':
      case 'user.updated':
        await this.authService.syncClerkUser(data);
        break;
      case 'user.deleted':
        await this.authService.syncClerkUser(data);
        break;
      case 'organization.updated':
        await this.authService['clerkWebhook'].handleOrganizationUpdated(data.id, data);
        break;
    }

    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}