import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as methodOverride from 'method-override';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // parse HTML form bodies
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // allow HTML forms to use PUT/DELETE via _method
  app.use(methodOverride('_method'));

  // static assets (css/js/images)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // EJS views
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
