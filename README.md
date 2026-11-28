# Rowmari Janakalyan Foundation — Backend API (`API`)

Production NestJS 10 REST API, RBAC authorization engine, and BullMQ background worker powering the **Rowmari Janakalyan Foundation (RJF)** web platform and Super Admin portal.

---

## Tech Stack

- **Framework:** NestJS `10.4` + TypeScript `5.7`
- **Database & ORM:** PostgreSQL (`pg`) + TypeORM `0.3.20` (migrations & seeds)
- **Cache & Queues:** Redis (`ioredis`) + BullMQ (`@nestjs/bullmq`)
- **Auth & Security:** JWT (`@nestjs/jwt`, `passport-jwt`), Argon2 password hashing, Cookie Parser, Helmet, `@nestjs/throttler`
- **Validation & Docs:** `class-validator`, `class-transformer`, Swagger (`@nestjs/swagger`)
- **Health Checks:** `@nestjs/terminus`

---

## Directory Structure

```text
API/
├── src/
│   ├── app.module.ts               # Root NestJS module
│   ├── main.ts                     # HTTP server bootstrap (API prefix, Swagger, pipes, CORS)
│   ├── worker.main.ts              # BullMQ background worker entrypoint
│   ├── worker/                     # Worker module registration
│   ├── common/
│   │   ├── constants/              # Permission keys, roles & system constants
│   │   ├── decorators/             # @Public, @Roles, @RequirePermissions, @CurrentUser, @AuditLog
│   │   ├── dto/                    # Standardized API response & pagination DTOs
│   │   ├── entities/               # BaseEntity (UUID, createdAt, updatedAt)
│   │   ├── filters/                # Global AllExceptionsFilter
│   │   ├── guards/                 # JwtAuthGuard, RolesGuard, PermissionsGuard, SuperAdminGuard, Throttler
│   │   ├── interceptors/           # TransformResponseInterceptor, AuditLoggerInterceptor, LoggingInterceptor
│   │   ├── interfaces/             # AuthenticatedUser & JWT payload types
│   │   ├── middleware/             # RequestIdMiddleware
│   │   ├── pipes/                  # TrimStringsPipe
│   │   └── utils/                  # Client IP extraction & helpers
│   ├── database/
│   │   ├── data-source.ts          # TypeORM CLI data-source configuration
│   │   ├── migrations/             # Versioned SQL/TypeORM migrations
│   │   └── seeds/                  # Database seed scripts (`npm run seed`)
│   └── modules/
│       ├── access-control/         # Roles & permissions management
│       ├── activities/             # Foundation field activities & projects
│       ├── admin/                  # Super Admin dashboard overview, CMS pages & settings
│       ├── applications/           # Aid applications (medical, education, relief) & tracking
│       ├── audit/                  # System activity & audit logs
│       ├── auth/                   # Login, register, JWT refresh, logout
│       ├── blood-requests/         # Emergency blood donor requests
│       ├── campaigns/              # Fundraising campaigns & progress
│       ├── committees/             # Committees, designations, RJF members & verification
│       ├── contact/                # Public contact messages
│       ├── content/                # Hero slides, notice modals, news/events, gallery, footer
│       ├── donations/              # Donations recording, approval & receipts
│       ├── donors/                 # Donor profiles & history
│       ├── expenses/               # Operational expense tracking
│       ├── health/                 # Liveness/readiness & keep-alive service
│       ├── medical-camps/          # Medical camp schedules & records
│       ├── notifications/          # Notification adapters, queue processors & inbox
│       ├── redis/                  # Redis client module
│       ├── reports/                # Financial & operational summary reports
│       ├── roumari/                # Amader Roumari directory & local portal data
│       ├── users/                  # User accounts & status management
│       └── volunteers/             # Volunteer registration & approvals
└── test/                           # Jest E2E & unit tests
```

---

## Environment Setup

Configure `.env` inside `API/`:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
FRONTEND_URL=http://localhost:3000
```

---

## Available Scripts

Run inside `API/`:

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run start:dev

# Build TypeScript output (dist/)
npm run build

# Run production API & worker
npm run start:prod
npm run start:worker

# TypeORM migrations & seeding
npm run migration:run
npm run migration:revert
npm run seed

# Tests & formatting
npm test
npm run test:e2e
npm run format
```
