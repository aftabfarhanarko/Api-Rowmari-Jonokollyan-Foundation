# Romonijon Kallyan Foundation - Enterprise Backend API

[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB_Cloud-336791?style=flat&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Nginx](https://img.shields.io/badge/Nginx-Load_Balancer-009639?style=flat&logo=nginx&logoColor=white)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

An enterprise-grade, secure, modular REST API and high-throughput background processing cluster built for the **Romonijon Kallyan Foundation (RKF)**. It orchestrates humanitarian financial assistance, voluntary blood donor networks, rural medical outreach camps, welfare fundraising campaigns, volunteer deployment, and financial accountability with an immutable audit trail.

---

## 🏗 High-Availability Architecture

```mermaid
flowchart TD
    Client["Client Applications<br/>(Web / Mobile / Public Portal)"]
    
    subgraph Edge ["Edge & Reverse Proxy Layer"]
        Nginx["Nginx Reverse Proxy & Load Balancer<br/>(Least Connections • Dual 80/443 • HTTP/2 • Leaky-Bucket Rate Limiter)"]
    end

    subgraph Cluster ["Application Cluster (NestJS Replicas)"]
        API1["API Replica 1<br/>(Port 4000)"]
        API2["API Replica 2<br/>(Port 4000)"]
        API3["API Replica 3<br/>(Port 4000)"]
    end

    subgraph Security ["Security & Interceptor Pipeline"]
        Guards["JwtAuthGuard (Default Deny)<br/>RolesGuard • PermissionsGuard"]
        Audit["AuditLoggerInterceptor<br/>(Extracts Client IP via X-Forwarded-For • Immutable Trail)"]
    end

    subgraph DataLayer ["Data & Messaging Tier"]
        Postgres[("NeonDB Cloud PostgreSQL<br/>(Pooled • SSL Enforced • UTC Timestamps • numeric(12,2))")]
        Redis[("Redis 7 In-Memory Cache<br/>(Throttler Store • Token Blacklist • BullMQ Transport)")]
        Worker["BullMQ Background Worker<br/>(SMS Dispatch • Email Adapters • Exponential Backoff)"]
    end

    Client -->|HTTPS / Port 443| Nginx
    Nginx -->|Least-Conn Upstream| API1
    Nginx -->|Least-Conn Upstream| API2
    Nginx -->|Least-Conn Upstream| API3
    
    API1 & API2 & API3 --> Guards
    Guards --> Audit
    Audit --> Postgres
    API1 & API2 & API3 --> Redis
    Redis --> Worker
    Worker --> Postgres
```

---

## 🛡️ Enterprise Security Model

The RKF backend is built from the ground up following zero-trust principles:

1. **Default-Deny Authentication (`JwtAuthGuard`)**:
   - Every API endpoint is globally guarded by default.
   - Only intentionally public routes (e.g. login, registration, public tracking, health check) are bypassed via `@Public()`.

2. **Secure Token Lifecycle & Rotation**:
   - Short-lived 15-minute access tokens (`HS256`).
   - 7-day cryptographic refresh tokens delivered in **`HttpOnly`**, **`Secure`**, **`SameSite=Lax`**, **`Path=/api/v1/auth`** cookies to prevent XSS and CSRF.
   - Tokens stored exclusively as SHA-256 hashes in NeonDB.
   - **Reuse Detection**: Replaying an expired or revoked token immediately revokes all active sessions for that account.

3. **Super Admin Exclusive Role Control**:
   - Only `SUPER_ADMIN` can assign or alter user roles via `PUT /api/v1/users/:id/roles`.
   - The user controller explicitly checks `currentUser.roles?.includes(RoleName.SUPER_ADMIN)` and throws `403 Forbidden` for any other role attempt.
   - Every role assignment is captured in the immutable audit log with client IP and actor details.

4. **Client IP Logging & Audit Interceptor**:
   - `AuditLoggerInterceptor` runs on all state-altering requests (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Client IP is extracted safely from `X-Forwarded-For` using Express `trust proxy`.
   - Sensitive payload keys (`password`, `passwordHash`, `token`, `secret`) are scrubbed before storage.

5. **Multi-Tier Rate Limiting (DDoS & Brute Force Defense)**:
   - **Nginx Leaky Bucket**:
     - `api_auth`: `5 req/s` (burst 10) for `/api/v1/auth/*`
     - `api_strict`: `10 req/m` (burst 5) for `/api/v1/assistance-applications`
     - `api_general`: `50 req/s` (burst 30) across all remaining endpoints
   - **NestJS Throttler**: Application-level defense using `ThrottlerBehindProxyGuard`.

6. **Strict Privacy Masking (Blood Donors)**:
   - Public searches (`GET /api/v1/blood/donors/search`) return only blood group, district, and availability. Donor names and phone numbers are completely stripped.
   - Only authenticated coordinators with `donors.view_private` permission can view unmasked contact details.

7. **Cryptographic Hashing**:
   - User passwords are encrypted with memory-hard **Argon2id**.
   - Database entities configure `select: false` on password hashes by default.

---

## 👥 Role-Based Access Control (RBAC) Matrix

The system includes 10 predefined roles configured in NeonDB:

| Role Name | Authority Scope | Primary Functions |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | System Owner | Complete system access. **Exclusive authority to update user roles.** |
| **`ADMIN`** | System Operations | User accounts, audit trail review, system configuration. |
| **`BLOOD_COORDINATOR`** | Blood Network | Unmasked donor access, matching emergency blood requests, outcome logging. |
| **`MEDICAL_COORDINATOR`** | Healthcare & Camps | Medical camp scheduling, doctor/staff assignment, attendance summaries. |
| **`EDUCATION_COORDINATOR`** | Education Welfare | Student assistance review, scholarship campaigns. |
| **`VOLUNTEER_MANAGER`** | Field Operations | Volunteer application approval, event assignments, field task tracking. |
| **`CONTENT_MANAGER`** | Public Communications | CMS dynamic pages, news, field updates, emergency announcements. |
| **`FINANCE_MANAGER`** | Financial Oversight | Expense review & approval, sequential receipt validation, financial KPI reports. |
| **`CASE_WORKER`** | Field Investigation | Application document verification, field inquiry notes, status advancement. |
| **`COMMUNITY_MEMBER`** | Registered Citizen | Profile management, public application submission, donation records. |

---

## 📁 Repository Structure

```
├── docs/
│   └── API_DOCUMENTATION.md      # Comprehensive API reference with cURL examples
├── nginx/
│   ├── nginx.conf                # Master Nginx configuration (epoll, 8192 connections)
│   ├── conf.d/
│   │   ├── upstream.conf         # Least-connections upstream cluster with keepalive 64
│   │   ├── rate-limiting.conf    # Leaky-bucket multi-tier rate limiting zones
│   │   ├── compression.conf      # Optimized Gzip compression rules
│   │   ├── default.conf          # Dual HTTP/HTTPS server block, HTTP/2, custom JSON error pages
│   │   └── ssl.conf.example      # Production TLS/SSL server configuration template
│   ├── snippets/
│   │   ├── proxy-params.conf     # Standardized proxy headers & upstream failover
│   │   └── security-headers.conf # OWASP security headers (HSTS, nosniff, DENY)
│   ├── ssl/                      # TLS certificates directory
│   └── README.md                 # Detailed load balancer operations guide
├── src/
│   ├── main.ts                   # API bootstrap (trust proxy, cookies, pipes, filters, Swagger)
│   ├── worker.main.ts            # BullMQ standalone background processor entrypoint
│   ├── app.module.ts             # Modular monolith root composition
│   ├── config/                   # Typed environment configuration & class-validator rules
│   ├── common/
│   │   ├── constants/            # Enums (Roles, Permissions, Statuses, BloodGroups)
│   │   ├── decorators/           # @CurrentUser, @Roles, @RequirePermissions, @Public, @AuditLog
│   │   ├── dto/                  # ApiResponse, ApiErrorResponse, PaginationQueryDto
│   │   ├── entities/             # BaseEntity with UUID PK, timestamps
│   │   ├── filters/              # AllExceptionsFilter with standardized JSON envelopes
│   │   ├── guards/               # JwtAuthGuard, RolesGuard, PermissionsGuard, Throttler
│   │   ├── interceptors/         # AuditLoggerInterceptor, TransformResponse, Logging
│   │   ├── middleware/           # RequestIdMiddleware (X-Request-ID)
│   │   └── utils/                # Client IP extraction with proxy support
│   ├── database/
│   │   ├── data-source.ts        # TypeORM CLI DataSource configuration
│   │   └── seeds/seed.ts         # Initial roles, permissions, and Super Admin seeder
│   └── modules/                  # 17 focused domain modules
│       ├── access-control/       # Roles & permissions system
│       ├── users/                # User accounts & Super Admin role management
│       ├── auth/                 # Passport Local & JWT, Refresh token rotation
│       ├── applications/         # Humanitarian assistance & public tracking
│       ├── donors/               # Blood donors registry with privacy masking
│       ├── blood-requests/       # Emergency blood requests & donor matching
│       ├── volunteers/           # Volunteer profiles & event assignments
│       ├── campaigns/            # Fundraising campaigns with progress tracking
│       ├── activities/           # Field activities & beneficiary reports
│       ├── medical-camps/        # Medical camps, doctors, attendance summaries
│       ├── donations/            # Financial contributions & sequential receipts
│       ├── expenses/             # Operational expenses & multi-stage approvals
│       ├── content/              # CMS pages, news, events, announcements
│       ├── notifications/        # BullMQ dispatch, SMS & Email adapters
│       ├── audit/                # Immutable audit log queries
│       ├── reports/              # Real-time executive dashboard KPIs
│       ├── redis/                # Redis connection provider
│       └── health/               # Terminus health checks (Postgres, memory)
├── test/
│   ├── app.e2e-spec.ts           # End-to-end security, JWT, cookie, & API tests
│   └── jest-e2e.json             # E2E test configuration
├── Dockerfile                    # Multi-stage production container build
├── docker-compose.yml            # Local clustered setup (3 API replicas + Nginx + Redis)
├── docker-compose.prod.yml       # Production deployment with persistent volumes
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file with the environment values below. Do not commit it. The repository does not currently include an `.env.example` file.

```bash
# Create and edit .env locally.
```

### Critical Environment Variables

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `production` / `development` |
| `PORT` | API server listen port | `4000` |
| `API_PREFIX` | Global routing prefix | `api/v1` |
| `DATABASE_URL` | NeonDB Cloud PostgreSQL connection URL | `postgresql://user:pass@ep-host.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_SSL` | Enforce SSL connection to database | `true` |
| `REDIS_HOST` | Redis cache & queue host | `127.0.0.1` (or `redis` in Docker) |
| `REDIS_PORT` | Redis server port | `6379` |
| `JWT_ACCESS_SECRET` | 256-bit secret key for access tokens | *(Generate with `openssl rand -hex 32`)* |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_SECRET` | 256-bit secret key for refresh tokens | *(Generate with `openssl rand -hex 32`)* |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token lifespan | `7d` |
| `COOKIE_SECRET` | Secret key for signed cookies | *(Generate with `openssl rand -hex 32`)* |
| `WEB_ORIGIN` | Allowed CORS frontend origins | `https://romonijon.org,https://admin.romonijon.org` |

---

## 🚀 Quick Start & Deployment

### 1. Running with Docker Compose (Recommended Cluster)

Spins up the full stack: Nginx Load Balancer (Port 80/443), 3 replicated API instances (`api-1`, `api-2`, `api-3`), BullMQ background worker, and Redis 7:

```bash
# Build and start the cluster
docker compose up -d --build

# View real-time cluster logs
docker compose logs -f nginx api-1
```

* **API Gateway**: `https://localhost/api/v1` (local self-signed certificate)
* **Interactive Swagger UI**: `https://localhost/api/v1/docs`
* **Health Check**: `https://localhost/api/v1/health`
* **Nginx Load Balancer Metrics**: `https://localhost/nginx_status` (local certificate)

### 2. Production Deployment

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Local Bare-Metal Execution

If running directly on host machine with Node.js 24+:

```bash
# 1. Install dependencies
npm install

# 2. Apply migrations and seed roles plus the initial administrator.
npm run migration:run
# Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PHONE, and a unique
# BOOTSTRAP_ADMIN_PASSWORD (at least 12 characters) in the environment.
npm run seed

# 3. Start API development server
npm run start:dev

# 4. Start background queue processor (separate terminal)
npm run start:worker
```

> The seeder requires administrator credentials through environment variables and never prints the password. Keep these values outside source control.

---

## 🧪 Testing & Quality Assurance

The codebase includes comprehensive test coverage:

```bash
# Run type checking
npx tsc --noEmit

# Run unit tests (10 suites, 32 tests)
npm test

# Run end-to-end integration tests (JWT, cookies, RBAC, throttler)
npm run test:e2e

# Run production build
npm run build
```

---

## 📖 API Documentation Reference

For the complete API reference with exhaustive schema definitions, sample request bodies, response envelopes, error structures, and cURL workflows, read:

👉 **[Complete Advanced API Documentation](file:///home/aftab-farhan/projects/Roumari_Public_Welfare_Foundation/API/docs/API_DOCUMENTATION.md)**

Or access the live interactive Swagger UI in your browser at:
`http://localhost/api/v1/docs` (or `http://localhost:4000/api/v1/docs`).
