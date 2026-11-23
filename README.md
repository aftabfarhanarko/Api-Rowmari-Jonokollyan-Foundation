# Romonijon Kallyan Foundation - Official Backend API

Enterprise-grade, secure, modular REST API and background worker system for the **Romonijon Kallyan Foundation (RKF)**, powering humanitarian assistance, voluntary blood donation coordination, medical camps, campaigns, volunteers, donations, and financial audit.

---

## 🛠 Confirmed Technology Stack

- **Backend Framework**: [NestJS](https://nestjs.com/) (Modular Monolith)
- **Language**: TypeScript (Strict typing for entities, DTOs, services, and workers)
- **Database**: PostgreSQL (Relational source of truth, transactional updates, UTC timestamps, `numeric(12,2)` precision for all financial data)
- **ORM**: TypeORM (Entities, relations, migrations, query builders, transactions)
- **Cache & Ephemeral Store**: Redis via `ioredis` (Rate limiting, OTP challenges with TTL, short-lived cache, BullMQ transport)
- **Queue & Background Jobs**: BullMQ (`@nestjs/bullmq`)
- **Authentication**: Passport.js via `@nestjs/passport`
  - **Passport Local Strategy**: Phone + password login with Argon2id hashing
  - **Passport JWT Strategy**: Short-lived (15 min) bearer access tokens
  - **Refresh Token Engine**: Cryptographically random 256-bit hashes stored in DB, rotated atomically on refresh, full revocation on compromise
  - **OTP Verification Engine**: 6-digit cryptographically secure challenges with 5-minute TTL and 60-second rate-limiting
- **Authorization**: Granular RBAC (`@RequirePermissions(...)`, `@Roles(...)`, `PermissionsGuard`, `RolesGuard`)
- **API Standard**: Versioned REST (`/api/v1`) with Swagger / OpenAPI 3.0 at `/api/v1/docs`
- **Security**: Helmet, HttpOnly Secure SameSite cookies, CORS, Input validation pipes (`whitelist`, `forbidNonWhitelisted`), Global error and response envelopment
- **Containerization**: Docker & Docker Compose (Multi-stage build, Postgres 16, Redis 7, API replica, Worker replica)

---

## 📁 Architecture & Module Structure

```
romonijon-foundation-backend/
├── src/
│   ├── main.ts                          # API bootstrap with Swagger, Helmet, global pipes & filters
│   ├── worker.main.ts                   # Standalone BullMQ background worker bootstrap
│   ├── app.module.ts                    # Main application modular composition
│   ├── config/                          # Typed configuration, validation, TypeORM options
│   ├── common/
│   │   ├── constants/                   # Enums (BloodGroup, ApplicationStatus, Roles, PERMISSION_KEYS)
│   │   ├── decorators/                  # @CurrentUser(), @Roles(), @RequirePermissions(), @Public()
│   │   ├── dto/                         # ApiResponseDto, ApiErrorResponseDto, PaginationQueryDto
│   │   ├── entities/                    # BaseEntity with UUID PK, created_at, updated_at
│   │   ├── filters/                     # AllExceptionsFilter with structured error response & requestId
│   │   ├── guards/                      # JwtAuthGuard, LocalAuthGuard, RolesGuard, PermissionsGuard
│   │   ├── interceptors/                # TransformResponseInterceptor, LoggingInterceptor
│   │   └── middleware/                  # RequestIdMiddleware (x-request-id)
│   ├── database/
│   │   ├── data-source.ts               # TypeORM CLI DataSource configuration
│   │   └── seeds/seed.ts                # Database seeder (Roles, Permissions, Super Admin, Campaigns)
│   ├── modules/
│   │   ├── access-control/              # Roles, Permissions, Role-Permission relations
│   │   ├── users/                       # User entities, profile management, status transitions
│   │   ├── auth/                        # Local & JWT strategies, Refresh token rotation, OTP service
│   │   ├── applications/                # Public assistance submission, documents, status history, tracking
│   │   ├── donors/                      # Voluntary blood donor registry with STRICT PRIVACY MASKING
│   │   ├── blood-requests/              # Blood requirements, matching engine, donation outcomes
│   │   ├── volunteers/                  # Volunteer profiles, approvals, event/camp assignments
│   │   ├── campaigns/                   # Welfare campaigns, target vs raised, progress updates
│   │   ├── activities/                  # Foundation news, field activities, impact reports
│   │   ├── medical-camps/               # Medical camps schedule, doctor/staff assignments, patient attendance
│   │   ├── donations/                   # Donation intents, campaign linking, receipt generation
│   │   ├── expenses/                    # Operational expense tracking, receipts, multi-stage approval workflow
│   │   ├── content/                     # CMS pages, news, events, gallery items, announcements
│   │   ├── notifications/               # BullMQ dispatch, SMS adapter, Email adapter
│   │   ├── audit/                       # Immutable audit trail of sensitive actions
│   │   ├── reports/                     # Executive dashboard & read-model metrics
│   │   └── redis/                       # Redis connection & in-memory fallback provider
│   └── worker/
│       └── worker.module.ts             # Worker module for background processing
├── test/
│   ├── app.e2e-spec.ts                  # End-to-end integration tests
│   └── jest-e2e.json                    # E2E test configuration
├── Dockerfile                           # Multi-stage production container build
├── docker-compose.yml                   # Postgres, Redis, API, and Worker orchestration
├── package.json
└── tsconfig.json
```

---

## 🔒 Security & Privacy Implementations

1. **Strict Donor Privacy Control**:
   - `GET /api/v1/blood/donors/search`: Public searches **NEVER** expose donor full names or phone numbers. Only blood group, district, upazila, and availability are returned.
   - `GET /api/v1/blood/donors/admin/list`: Restricted to coordinators with `donors.view_private` permission.
2. **Assistance Application Reference Flow**:
   - Public submissions (`POST /api/v1/assistance-applications`) generate human-readable reference codes (e.g. `RKF-2026-000001`).
   - Tracking endpoint (`POST /api/v1/application-tracking/verify`) requires both reference code and phone number, with optional OTP verification for sensitive financial details.
3. **Password Security**:
   - Passwords hashed using memory-hard **Argon2id**.
   - Password hashes are excluded from TypeORM queries by default (`select: false`).
4. **Token Security & Rotation**:
   - Refresh tokens are stored only as SHA-256 hashes with expiry and user agent metadata.
   - Rotated atomically on every `/api/v1/auth/refresh` request. Reused or revoked tokens immediately invalidate all sessions for that user.
5. **Direct Donation & Receipt Generation**:
   - Direct record submission (`POST /api/v1/donations/record`) generates official sequential foundation receipt numbers (e.g. `RKF-REC-2026-000001`) with automatic campaign progress updates.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ or v24+)
- Docker & Docker Compose (or local PostgreSQL 16 & Redis 7)

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Running with Docker Compose (Recommended)
Spins up PostgreSQL, Redis, API server, and Worker service:
```bash
docker compose up -d
```
The API will be available at `http://localhost:4000/api/v1`.
Interactive Swagger documentation: `http://localhost:4000/api/v1/docs`.

### 3. Running Locally

Install dependencies:
```bash
npm install
```

Start the PostgreSQL and Redis containers:
```bash
docker compose up -d postgres redis
```

Run database seeds:
```bash
npm run seed
```
> Default Super Admin created:
> - **Phone**: `+8801700000000`
> - **Password**: `SuperAdmin2026!`

Run the API development server:
```bash
npm run start:dev
```

Run the background worker process:
```bash
npm run start:worker
```

---

## 🧪 Testing

Run unit tests:
```bash
npm test
```

Run end-to-end (e2e) tests:
```bash
npm run test:e2e
```

Run production build:
```bash
npm run build
```

---

## 📄 API Documentation

When the server is running, visit:
**`http://localhost:4000/api/v1/docs`**
for full Swagger OpenAPI 3.0 documentation with interactive try-it-out capabilities.
# Api-Roumari-Jonokollyan-Foundation
