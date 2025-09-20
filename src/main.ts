import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as methodOverride from 'method-override';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // parse HTML form bodies
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Enable ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties not in DTO
      whitelist: true,
      // Reject non-DTO properties
      forbidNonWhitelisted: true,
      // Transform payloads to DTO instances
      transform: true,
      // Handle query params and form data
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // allow HTML forms to use PUT/DELETE via _method
  app.use(methodOverride('_method'));

  // static assets (svg images)
  app.useStaticAssets(join(__dirname, '..', 'src', 'db'), { prefix: '/db' });

  // Seeting EJS views and ejs template engine
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
