import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule, ObserveInstrument } from './app.module.js';
import { CSRF_HEADER } from './common/constants.js';
import { AppConfig } from './config/app-config.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
  const config = app.get(AppConfig);

  // Number of reverse proxies in front of the API (Next.js rewrite, load balancer, ...),
  // so req.ip is the real client IP for rate limiting and the session list.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '256kb' });
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', CSRF_HEADER],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.enableShutdownHooks();

  if (!config.isProduction || process.env.SWAGGER_ENABLED === 'true') {
    const doc = new DocumentBuilder()
      .setTitle('Kardify API')
      .setDescription('Digital business card platform API. Auth uses an HTTP-only session cookie; '
        + `state-changing requests must send the "${CSRF_HEADER}: 1" header.`)
      .setVersion('1.0')
      .addCookieAuth('kardify_session')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  await app.listen(config.port);
}
await bootstrap();
