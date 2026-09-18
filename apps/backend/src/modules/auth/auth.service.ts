import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ClerkWebhookService } from './clerk-webhook.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private clerkWebhook: ClerkWebhookService,
  ) {}

  async validateUser(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });
  }

  async login(user: { id: string; clerkId: string; email: string; role: string; tenantId: string }) {
    const payload = { sub: user.clerkId, email: user.email, tenantId: user.tenantId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }

  async syncClerkUser(clerkUser: any) {
    return this.clerkWebhook.syncUser(clerkUser);
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
  }
}