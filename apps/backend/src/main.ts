import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Agri-Pharmacy API')
    .setDescription('Multi-tenant Agricultural Pharmacy Management API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Clerk sync')
    .addTag('tenants', 'SuperAdmin: Tenant management')
    .addTag('users', 'User management within tenant')
    .addTag('products', 'Product catalog')
    .addTag('inventory', 'Stock management')
    .addTag('customers', 'Farmers & producers')
    .addTag('debts', 'Debt ledger & payments')
    .addTag('sales', 'POS & invoices')
    .addTag('expenses', 'Expense tracking')
    .addTag('reports', 'Analytics & reports')
    .addTag('settings', 'Tenant settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();