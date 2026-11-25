import * as net from 'net';
if (typeof (net as any).setDefaultAutoSelectFamily === 'function') {
  (net as any).setDefaultAutoSelectFamily(false);
}

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TrimStringsPipe } from './common/pipes/trim-strings.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust reverse proxy (Nginx load balancer) headers (X-Forwarded-For, X-Forwarded-Proto)
  // Trust only the edge proxy hop. Trusting arbitrary forwarded headers permits
  // clients to spoof their IP and bypass IP based throttling/audit controls.
  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Security Middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());

  const explicitOrigins = (process.env.WEB_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const allowedOrigins = new Set([
    'https://rjf-iota.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    ...explicitOrigins,
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, cron jobs, Render keep-alive pings)
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.has(cleanOrigin)) {
        return callback(null, true);
      }

      // Allow any Vercel preview or production deployment (*.vercel.app)
      if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/i.test(cleanOrigin)) {
        return callback(null, true);
      }

      // Allow local IP addresses for testing on mobile device in local network
      if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/i.test(cleanOrigin)) {
        return callback(null, true);
      }

      // If wildcard specified in env
      if (process.env.WEB_ORIGIN === '*') {
        return callback(null, true);
      }

      logger.warn(`CORS rejected origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Client-Timestamp',
      'sentry-trace',
      'baggage',
      'rjf_session',
      'rjf_auth_role',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  // Global Interceptors & Filters
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new TrimStringsPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Romonijon Kallyan Foundation - Official API')
    .setDescription(
      'Robust, modular REST API blueprint for humanitarian assistance, campaigns, medical camps, volunteer management, and financial accountability.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Bearer Access Token',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`🚀 RKF Backend API running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Swagger Documentation available at http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`=======================================================`);
}

void bootstrap();
