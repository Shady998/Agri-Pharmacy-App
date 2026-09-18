import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole, TenantStatus } from '@prisma/client';

interface ClerkUser {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  public_metadata: {
    tenantId?: string;
    role?: string;
  };
  private_metadata: {
    tenantId?: string;
    role?: string;
  };
}

@Injectable()
export class ClerkWebhookService {
  constructor(private prisma: PrismaService) {}

  async syncUser(clerkUser: ClerkUser) {
    const email = clerkUser.email_addresses[0]?.email_address;
    const tenantId = clerkUser.public_metadata.tenantId || clerkUser.private_metadata.tenantId;
    const role = (clerkUser.public_metadata.role || clerkUser.private_metadata.role) as UserRole || UserRole.VIEWER;

    if (!email || !tenantId) {
      throw new Error('Missing email or tenantId in Clerk metadata');
    }

    let tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          id: tenantId,
          name: `Tenant ${tenantId.slice(0, 8)}`,
          slug: `tenant-${tenantId.slice(0, 8)}`,
          status: TenantStatus.TRIAL,
        },
      });
    }

    const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || email;

    const user = await this.prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        name,
        role,
        tenantId,
        avatarUrl: clerkUser.image_url,
        isActive: true,
        lastLoginAt: new Date(),
      },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        role,
        tenantId,
        avatarUrl: clerkUser.image_url,
        isActive: true,
      },
    });

    return user;
  }

  async handleUserDeleted(clerkId: string) {
    await this.prisma.user.update({
      where: { clerkId },
      data: { isActive: false },
    });
  }

  async handleOrganizationUpdated(orgId: string, data: { name?: string; slug?: string }) {
    await this.prisma.tenant.update({
      where: { id: orgId },
      data,
    });
  }
}