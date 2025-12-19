import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('iGymCare API')
    .setDescription('API cho hệ thống quản lý thiết bị phòng gym')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Quản lý xác thực và đăng nhập')
    .addTag('Users', 'Quản lý người dùng')
    .addTag('Equipment', 'Quản lý thiết bị')
    .addTag('Tracking', 'Theo dõi sử dụng và bảo trì')
    .addTag('IoT', 'Giám sát cảm biến IoT')
    .addTag('Reports', 'Báo cáo và thống kê')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || Number(process.env.APP_PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Listening on ${port}`);


  console.log(`
  🚀 iGymCare Backend Server đang chạy!

  📍 URL: http://localhost:${port}
  📚 API Docs: http://localhost:${port}/api/docs
  🔧 Environment: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
