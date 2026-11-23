# Production-Ready Nginx Load Balancing Setup
**Romonijon Kallyan Foundation - Official API**

This directory contains the production-grade reverse proxy and load balancing setup for the Romonijon Kallyan Foundation backend architecture.

---

## 🏗️ Architecture Overview

```
                         [ Internet / Client Traffic ]
                                      │
                                      ▼ (Port 80 / 443)
                  ┌──────────────────────────────────────┐
                  │       Nginx Load Balancer            │
                  │  (Least Connections, SSL, Rate-Limit)│
                  └──────────────────┬───────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
   │ API Replica 1 │         │ API Replica 2 │         │ API Replica 3 │
   │ (Port 4000)   │         │ (Port 4000)   │         │ (Port 4000)   │
   └───────┬───────┘         └───────┬───────┘         └───────┬───────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         [ PostgreSQL (NeonDB) ]              [ Redis 7 Cluster ]
                    │                                 │
                    └───────────────┬─────────────────┘
                                    ▼
                         [ BullMQ Background Worker ]
```

---

## ⚙️ Key Architectural Features

1. **Load Balancing Algorithm**:
   - Uses `least_conn` to dynamically route requests to the replica with the lowest active connection count.
   - Ideal for REST APIs with variable response times (e.g., complex reporting queries vs fast token verifications).

2. **Connection Pooling (`keepalive 64`)**:
   - Maintains persistent HTTP/1.1 connections between Nginx and the NestJS backend instances.
   - Eliminates TCP three-way handshake and SSL renegotiation overhead on internal traffic.

3. **High Availability & Zero-Downtime Failover**:
   - `proxy_next_upstream error timeout http_502 http_503 http_504;`
   - If an API instance crashes or fails during deployment, Nginx instantly retries another healthy replica without failing the client request.

4. **Multi-Tier Rate Limiting (DDoS & Brute-Force Defense)**:
   - `api_auth`: 5 req/s (burst 10) for login and registration.
   - `api_strict`: 10 req/m (burst 5) for assistance application submissions.
   - `api_general`: 50 req/s (burst 30) for standard endpoints.
   - `/api/v1/health`: Rate limits bypassed for monitoring systems.

5. **Hardened OWASP Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

6. **Observability & Request Tracing**:
   - Injects and forwards `$request_id` (`X-Request-ID`).
   - Surfaces `X-Upstream-Server` and `X-Upstream-Response-Time` in response headers for real-time load distribution verification.

---

## 🚀 How to Run

### 1. Development / Testing Cluster
Runs 3 replicated API instances behind the Nginx load balancer:
```bash
docker compose up --build
```

### 2. Production Deployment
Runs optimized multi-stage production containers with background worker and persistent Redis:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Scaling API Replicas Dynamically
To scale to 5 or more API workers:
```bash
docker compose up -d --scale api=5
```

### 4. Verifying Load Balancing
Run multiple curl requests to see traffic distributed across the backend nodes:
```bash
curl -I http://localhost/api/v1/health
```
Look for the `X-Upstream-Server` header:
```http
HTTP/1.1 200 OK
X-Request-ID: 8a7c2934e8d193f...
X-Upstream-Server: 172.18.0.4:4000
X-Upstream-Response-Time: 0.008
```
