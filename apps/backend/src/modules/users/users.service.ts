import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params: { skip?: number; take?: number; search?: string; role?: UserRole }) {
    const { skip = 0, take = 20, search, role } = params;

    const where: any = { tenantId };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          clerkId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, plan: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async inviteUser(tenantId: string, data: { email: string; name: string; role: UserRole }, inviterId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email, tenantId },
    });

    if (existing) {
      throw new ConflictException('المستخدم موجود بالفعل');
    }

    return this.prisma.user.create({
      data: {
        clerkId: `pending_${Date.now()}`,
        email: data.email,
        name: data.name,
        role: data.role,
        tenantId,
        isActive: false,
      },
    });
  }

  async updateRole(tenantId: string, id: string, role: UserRole, requesterRole: UserRole) {
    if (requesterRole === UserRole.VIEWER || requesterRole === UserRole.SALESPERSON) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل الأدوار');
    }

    const targetUser = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!targetUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('لا يمكن تعديل دور المشرف العام');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async deactivateUser(tenantId: string, id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('لا يمكنك إلغاء تفعيل نفسك');
    }

    const targetUser = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!targetUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('لا يمكن إلغاء تفعيل المشرف العام');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, isActive: true },
    });
  }

  async activateUser(tenantId: string, id: string) {
    return this.prisma.user.update({
      where: { id, tenantId },
      data: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
    });
  }
}