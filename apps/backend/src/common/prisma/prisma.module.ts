import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { tenantMiddleware } from './prisma.middleware';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: () => {
        const prisma = new PrismaService();
        tenantMiddleware(prisma);
        return prisma;
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}