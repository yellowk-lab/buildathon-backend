import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  const allowedOrigins = configService
    .get<string>('CORS_WHITELIST_DOMAINS')
    .split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  app.use(cookieParser(configService.get('COOKIES_SECRET')));
  await app.listen(configService.get('PORT'));
}
bootstrap();
