import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { tenantMiddleware, setTenantContext } from './prisma.middleware';
import { TenantContextService } from '../tenant-context/tenant-context.service';

@Global()
@Module({
  providers: [
    TenantContextService,
    {
      provide: PrismaService,
      useFactory: (tenantContext: TenantContextService) => {
        setTenantContext(tenantContext);
        const prisma = new PrismaService();
        tenantMiddleware(prisma);
        return prisma;
      },
      inject: [TenantContextService],
    },
  ],
  exports: [PrismaService, TenantContextService],
})
export class PrismaModule {}