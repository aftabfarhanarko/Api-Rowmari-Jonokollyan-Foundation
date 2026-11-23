import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('Romonijon Kallyan Foundation API (e2e)', () => {
  let app: INestApplication;
  jest.setTimeout(15000);

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockImplementation((options) => {
      if (options?.where?.id) {
        return Promise.resolve({ id: options.where.id, amount: 500, status: 'COMPLETED' });
      }
      return Promise.resolve(null);
    }),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((dto) => dto),
    save: jest.fn((dto) =>
      Promise.resolve(
        Array.isArray(dto)
          ? dto.map((item, idx) => ({ ...item, id: `mock-uuid-${idx}`, createdAt: new Date() }))
          : { ...dto, id: 'mock-uuid', createdAt: new Date() },
      ),
    ),
    createQueryBuilder: () => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getOne: jest.fn().mockResolvedValue(null),
    }),
  };

  const mockDataSource = {
    isInitialized: true,
    options: { type: 'postgres' },
    entityMetadatas: [],
    destroy: jest.fn(),
    query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    getRepository: () => mockRepository,
    createQueryRunner: () => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn().mockResolvedValue({ id: 'mock-donation', amount: 500, status: 'INITIATED' }),
        save: jest.fn((entityOrClass, maybeDto) =>
          Promise.resolve({ id: 'mock-donation-id', ...(maybeDto || entityOrClass) }),
        ),
        create: jest.fn((_, dto) => dto),
      },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .overrideProvider(getDataSourceToken())
      .useValue(mockDataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Global Response Envelope & Security', () => {
    it('should return 404 with structured error envelope for non-existent route', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.requestId).toBeDefined();
    });

    it('should reject malformed validation with 400 and validation details', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/assistance-applications')
        .send({
          category: 'INVALID_CATEGORY',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('Public API endpoints', () => {
    it('GET /api/v1/health should return system and database health status', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      } else {
        expect(res.body.success).toBe(false);
      }
    });

    it('POST /api/v1/auth/register should register a user and return tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('x-forwarded-for', '103.205.10.25, 172.68.1.1')
        .send({
          fullName: 'Anisur Rahman',
          email: 'anisur@example.com',
          phone: '+8801712345678',
          password: 'SecurePassword2026!',
          district: 'Kurigram',
          upazila: 'Roumari',
          address: 'Bamondanga, Roumari',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('anisur@example.com');
    });

    it('POST /api/v1/donations/record should record a donation contribution', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/donations/record')
        .send({
          donorName: 'Generous Contributor',
          donorPhone: '+8801712345678',
          amount: 1000,
          paymentMethod: 'BKASH',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Super Admin Role Management', () => {
    it('PUT /api/v1/users/:id/roles should reject unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/v1/users/123e4567-e89b-12d3-a456-426614174000/roles')
        .send({
          roles: ['BLOOD_COORDINATOR'],
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('JWT Authentication & Endpoint Protection', () => {
    it('GET /api/v1/auth/me should reject requests without Bearer token with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/admin/audit-logs should reject unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/audit-logs');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/auth/me should reject forged or invalid Bearer tokens with 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Rate Limiting (Throttler Protection)', () => {
    it('should include rate limit headers on requests', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/content/announcements');
      expect([200, 429]).toContain(res.status);
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
    });

    it('should protect sensitive endpoints with rate limits and 429 envelope', async () => {
      let hitRateLimit = false;
      for (let i = 0; i < 8; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/assistance-applications')
          .send({ category: 'INVALID_CATEGORY' });

        if (res.status === 429) {
          hitRateLimit = true;
          expect(res.body.success).toBe(false);
          expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
          break;
        }
      }
      expect(hitRateLimit).toBe(true);
    });
  });
});
