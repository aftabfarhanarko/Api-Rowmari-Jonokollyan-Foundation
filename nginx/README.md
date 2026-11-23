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
   - Logs `$upstream_addr`, `$upstream_response_time`, and `$upstream_status` in structured Nginx access logs. Internal backend addresses are not exposed to API clients.

---

## 🚀 How to Run

### Production TLS files
The production Compose file requires `TLS_CERTIFICATE_FILE` and
`TLS_PRIVATE_KEY_FILE` to point to an existing full-chain certificate and its
private key on the deployment host. Keep the private key outside the repository
and restrict its file permissions. The self-signed files in `nginx/ssl` are for
local development only.

HTTP requests are redirected to HTTPS. Configure the production certificate for
the public API hostname before publishing ports 80 and 443.

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

### 3. Scaling API Replicas
The current Compose files define three distinct services (`api-1`, `api-2`, and `api-3`) and the Nginx upstream lists those exact names. `docker compose --scale api=5` does not work because there is no `api` service. To add capacity, add another API service and its name to the upstream, or move to an orchestrator with service discovery and autoscaling.

For the current fixed three-replica cluster:
```bash
docker compose up -d --build api-1 api-2 api-3
```

### 4. Verifying Load Balancing
Use Nginx access logs to confirm which backend handled each request:
```bash
docker compose logs nginx
```
Each access record includes `upstream_addr`, `upstream_response_time`, and `upstream_status`.
