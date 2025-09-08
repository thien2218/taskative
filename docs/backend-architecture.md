## Taskative Backend Architecture Document

### Introduction

This document outlines the backend architecture for Taskative, used by developers and AI agents as the blueprint for the MVP on Cloudflare Workers.

#### Starter Template or Existing Project

N/A

#### Change Log

| Date       | Version | Description                                                                                                                           | Author |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2025-09-08 | 0.3     | Align to template v2; add External APIs (none), Test Strategy (mock-first, 90% coverage), infra/security; clarify multi-Worker plan B | PM     |
| 2025-09-07 | 0.2     | Introduced DI patterns (DatabaseService, CacheService, lightweight container); updated components and diagrams                        | PM     |

### High Level Architecture

#### Technical Summary

Multiple Cloudflare Workers (API, Auth, Cron) backed by Cloudflare D1 and a short-TTL cache on KV. Hono handles routing, Prisma defines schema and migrations, and Kysely (with prisma-kysely types) provides type-safe DB access. Bcrypt runs in a dedicated Auth Worker; a single Cron Worker processes reminders. A lightweight DI container builds service instances per request/environment, injecting a `DatabaseService` (typed Kysely/Prisma access) and a `CacheService` (KV wrapper with TTL and namespacing) into application services.

#### High Level Overview

1. Style: Serverless Workers with shared relational store (D1)
2. Repo: Single backend package for MVP
3. Services: API Worker (REST), Auth Worker (bcrypt), Cron Worker (reminders)
4. Flow: Client → API → D1/KV; API → Auth Worker for password ops; Cron scans reminders
5. Decisions: Prisma-first schema, typed Kysely, KV only as cache, device-scoped sessions

#### High Level Project Diagram

```mermaid
graph TD
  U[User] -->|HTTPS| API[API Worker (Hono)]
  API -->|JWT cookie| Auth[Auth Service Worker]
  API --> D1[(Cloudflare D1)]
  API <-->|cache| KV[(Cloudflare KV)]
  Cron[Cron Worker] -->|due reminders| U
  Cron --> D1
```

#### Architectural and Design Patterns

-  **Serverless on Workers:** Low-latency, global edge – Rationale: simplicity and scale
-  **Repository/Query Builder (Kysely):** Typed SQL – Rationale: safety and portability
-  **Cache-aside with KV:** Short TTLs only – Rationale: D1 remains source of truth
-  **Session-backed Auth:** Server-side sessions – Rationale: revocation and device scope
-  **Dependency Injection (constructor-based):** Services receive their dependencies (`DatabaseService`, `CacheService`, config) via constructor injection. Avoid global singletons; prefer per-request/per-env instances from a lightweight container/factory.
-  **Infrastructure Service Wrappers:** Centralize access to DB and KV via `DatabaseService` and `CacheService` interfaces to improve testability and decouple infra from domain logic.

### Tech Stack

#### Cloud Infrastructure

-  **Provider:** Cloudflare
-  **Key Services:** Workers, D1, KV, Cron Triggers, (Future) R2
-  **Deployment Regions:** Global edge

#### Technology Stack Table

| Category      | Technology         | Version           | Purpose               | Rationale                    |
| ------------- | ------------------ | ----------------- | --------------------- | ---------------------------- |
| Language      | TypeScript         | unspecified       | Primary language      | Strong typing, Workers-ready |
| Runtime       | Cloudflare Workers | ^4.4.0 (wrangler) | Runtime               | Global edge                  |
| API Framework | Hono               | ^4.9.0            | Routing               | Lightweight, Workers-first   |
| ORM/Types     | prisma-kysely      | ^1.8.0            | Generate Kysely types | Schema-first typing          |
| Query Builder | Kysely             | ^0.28.4           | Type-safe SQL         | Safety                       |
| DB            | Cloudflare D1      | managed           | Relational store      | Simple on Workers            |
| Cache         | Cloudflare KV      | managed           | Short TTL cache       | Faster reads                 |
| Auth Crypto   | bcryptjs           | ^3.0.2            | Password hashing      | Isolated worker              |
| Tests         | Vitest             | ^3.2.4            | Testing               | Fast TS support              |
| Schema        | Prisma             | ^6.13.0           | Schema & migrations   | Prisma-first workflow        |

### Data Models

#### User

-  Purpose: Identity and profile
-  Columns:
   -  id: TEXT (primary key)
   -  email: TEXT (unique, not null)
   -  password_hash: TEXT (not null)
   -  first_name: TEXT (nullable)
   -  last_name: TEXT (nullable)
   -  username: TEXT (unique, nullable)
   -  profile_image_url: TEXT (nullable)
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
   -  updated_at: DATETIME (auto-updated)
-  Relationships: Sessions, Groups, Tasks, Reminders, PasswordResetTokens

#### Session

-  Purpose: Server-side sessions backing short-lived JWT cookies; device-scoped revocation
-  Columns:
   -  id: TEXT (primary key)
   -  user_id: TEXT (not null, references users.id, on delete CASCADE)
   -  status: TEXT (default 'active')
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
   -  expires_at: DATETIME (not null)
   -  revoked_at: DATETIME (nullable)
   -  device_id: TEXT (not null)
   -  device_name: TEXT (not null)
-  Indexes: (user_id), (expires_at)
-  Relationships: N:1 User

#### Group

-  Purpose: Grouping of tasks
-  Columns:
   -  id: TEXT (primary key)
   -  user_id: TEXT (not null, references users.id, on delete CASCADE)
   -  name: TEXT (not null)
   -  color: TEXT (nullable)
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
   -  updated_at: DATETIME (auto-updated)
-  Relationships: N:1 User; 1:N Tasks

#### Task

-  Purpose: User tasks
-  Columns:
   -  id: TEXT (primary key)
   -  user_id: TEXT (not null, references users.id, on delete CASCADE)
   -  group_id: TEXT (nullable, references groups.id, on delete SET NULL)
   -  title: TEXT (not null)
   -  note: TEXT (nullable)
   -  priority: INTEGER (nullable)
   -  effort: INTEGER (nullable)
   -  deadline: DATETIME (nullable)
   -  repeat_interval: TEXT (nullable)
   -  remind_at: DATETIME (nullable)
   -  status: TEXT (default 'pending')
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
   -  updated_at: DATETIME (auto-updated)
-  Indexes: (user_id, status, deadline), (user_id, priority, deadline), (title)
-  Relationships: N:1 User; N:1 Group; 1:N Subtasks; 1:N Reminders

#### Subtask

-  Purpose: Child items
-  Columns:
   -  id: TEXT (primary key)
   -  task_id: TEXT (not null, references tasks.id, on delete CASCADE)
   -  title: TEXT (not null)
   -  status: TEXT (default 'pending')
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
   -  updated_at: DATETIME (auto-updated)
-  Relationships: N:1 Task

#### Reminder

-  Purpose: Scheduled notifications
-  Columns:
   -  id: TEXT (primary key)
   -  task_id: TEXT (not null, references tasks.id, on delete CASCADE)
   -  user_id: TEXT (not null, references users.id, on delete CASCADE)
   -  remind_at: DATETIME (not null)
   -  repeat_interval: TEXT (nullable)
   -  last_sent_at: DATETIME (nullable)
   -  status: TEXT (default 'scheduled')
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
-  Indexes: (user_id, remind_at)
-  Relationships: N:1 Task; N:1 User

#### PasswordResetToken

-  Purpose: Password reset flows
-  Columns:
   -  id: TEXT (primary key)
   -  user_id: TEXT (not null, references users.id, on delete CASCADE)
   -  token: TEXT (unique, not null)
   -  expires_at: DATETIME (not null)
   -  used_at: DATETIME (nullable)
   -  created_at: DATETIME (default CURRENT_TIMESTAMP)
-  Indexes: (token), (user_id)
-  Relationships: N:1 User

### Components

#### API Worker (Hono)

-  Responsibility: REST endpoints, validation, orchestration
-  Interfaces: /v1/\*
-  Dependencies: DatabaseService, CacheService, Auth Worker (D1 and KV are bound to these via infra adapters). Instances are provided by a lightweight DI container per request or per environment.

#### Auth Service Worker

-  Responsibility: bcrypt password hashing/verify
-  Interfaces: Internal RPC/HTTP
-  Dependencies: none

#### Cron Worker (Reminders)

-  Responsibility: Scan due reminders and send notifications
-  Interfaces: Scheduled trigger
-  Dependencies: D1

#### Component Diagrams

```mermaid
graph TD
  U[User] -->|HTTPS| API[API Worker (Hono)]
  API --> D1[(Cloudflare D1)]
  API <-->|cache| KV[(Cloudflare KV)]
  API -->|password ops (planned)| AUTH[Auth Worker]
  CRON[Cron Worker] --> D1
  CRON -->|due reminders| U
```

### Dependency Injection and Infrastructure Services

The application uses a lightweight container/factory to wire services with shared infrastructure dependencies and configuration.

-  Interfaces

   -  `DatabaseService`: strongly-typed access over generated Kysely `DB` types, transaction helpers, and optional raw SQL execution when necessary.
   -  `CacheService`: minimal KV API with namespaced key helpers; supports `get`, `set` (with TTL), `delete`, and batch delete.

-  Container/Factory

   -  `createContainer(env) -> { db: DatabaseService, cache: CacheService, ... }` where `env` carries Worker bindings (D1, KV, config).
   -  Lifetime: per request or per Worker environment; no global mutable singletons.

-  Testing Guidance
   -  Provide in-memory/mocked adapters for `DatabaseService` and `CacheService` to enable unit tests without external dependencies.
   -  Services are constructed via the same factory in tests, substituting in-memory adapters.

```mermaid
graph LR
  A[API/Domain Services] --> DBsvc[DatabaseService]
  A --> Csvc[CacheService]
  DBsvc --> D1[(Cloudflare D1)]
  Csvc --> KV[(Cloudflare KV)]
```

Rationale: Decouple infra concerns from domain logic; improve testability and consistency of access patterns.

### External APIs

N/A

### Core Workflows

```mermaid
sequenceDiagram
  autonumber
  participant C as Client
  participant API as API Worker
  participant AUTH as Auth Worker
  participant DB as D1
  C->>API: POST /v1/auth/login
  API->>AUTH: verify password (bcrypt)
  AUTH-->>API: ok
  API->>DB: insert session
  DB-->>API: session id
  API-->>C: Set-Cookie: session; 200 OK
```

### API Specification

Deferred. API docs will be generated via framework-integrated OpenAPI tooling; this section will be populated once that is in place.

### Database Schema

Prisma-first schema located at backend/src/db/schema.prisma with migrations under backend/src/db/migrations. Key points:

-  IMPORTANT constraints (from schema): table models map to plural, snake_case table names; all model fields are snake_case.
-  Core tables: users, sessions, groups, tasks, subtasks, reminders, password_reset_tokens.
-  Representative indexes and constraints:
   -  users: unique(email), unique(username); timestamps.
   -  sessions: indexes on user_id and expires_at; status, device_id, device_name; FK to users(id) with CASCADE; no ip_address (removed in later migration).
   -  tasks: FKs to users(id) CASCADE and groups(id) SET NULL; indexes on (user_id, status, deadline), (user_id, priority, deadline), (title).
   -  reminders: FKs to tasks(id) and users(id) CASCADE; index on (user_id, remind_at).
-  Migrations live in backend/src/db/migrations; see files for exact DDL evolution.
-  Kysely types generated via prisma-kysely to backend/src/db/types.ts.

### Source Tree

```text
backend/
  src/               # application source
    routes/          # HTTP route handlers (Hono)
    services/        # business/domain services
    di/              # dependency injection container and factories
    validators/      # zod schemas for request validation
    types/           # shared types and Worker bindings
    db/              # Prisma schema, Kysely types, migrations
      migrations/    # Prisma-generated migration files
    __tests__/       # unit tests (mock-first, 90% coverage target)
      __mocks__/     # reusable mocks for services/libs/env
      data/          # shared payloads, fixtures, request options
      routes/        # route-level tests
      services/      # service unit tests
```

### Infrastructure and Deployment

-  Infrastructure as Code:
   -  Tool: Wrangler (config in backend/wrangler.jsonc)
   -  Approach: platform-managed resources with config-as-code; bindings for DB (D1), KV (CACHE), ratelimiter (AUTH_RATE_LIMITER), ENVIRONMENT, SESSION_NAME
-  Deployment Strategy:
  -  Strategy: Workers deploy via wrangler (manual/local for now); production deploys remain manual for now
  -  CI/CD Platform: GitHub Actions (workflow: .github/workflows/ci.yml)
  -  Pipeline Configuration: jobs: lint, typecheck, test (unit); triggers: push and pull_request; Node.js 20.x; working-directory: backend; cache installs (pnpm or npm). A deploy job can be added later with manual approval.
-  Environments:
   -  test: local dev via wrangler; ENVIRONMENT=test; cookies not secure
   -  production: ENVIRONMENT=production; cookies secure=true
-  Environment Promotion Flow:

```text
dev (local wrangler) -> production (wrangler deploy)
```

-  Rollback Strategy:
   -  Primary Method: redeploy previous known-good version via wrangler
   -  Trigger Conditions: failed health checks, elevated errors, or regression
   -  Recovery Time Objective: minutes

### Error Handling Strategy

-  General Approach:
   -  Validate all external inputs at API boundary with zod; return 400 on validation errors
   -  Use consistent error envelope: { error: string }
   -  Propagate unexpected errors as 500 with generic messages
-  Logging Standards:
   -  Use console.log/console.error for now
   -  Do not log secrets or PII; include minimal context (route, userId if available)
-  Error Handling Patterns:
   -  Platform/Infra errors (D1, KV): apply simple retries in code paths where added later; currently fail closed and log
   -  Business logic errors: map to 4xx with safe messages
   -  Data consistency: use DB constraints and transactions where necessary (see password reset flow)

### Coding Standards

-  Never log or echo JWT_SECRET or session tokens
-  All routes must validate input with zod schemas
-  Session cookies must use getSessionCookieConfig(); secure=true in production
-  Use CacheService for KV access; do not store PII in KV beyond session payloads

### Test Strategy and Standards

-  Testing Philosophy:
   -  Unit tests only for now; 90% coverage target
   -  Mock-first: vi.mock external dependencies (bcryptjs, hono/cookie, hono/jwt, services) to isolate units
   -  Follow AAA pattern (Arrange, Act, Assert); cover success paths and error/edge cases
-  Test Types and Organization:
   -  Location: backend/src/**tests**/
   -  Folder roles:
      -  **mocks**: reusable mocks (AuthService, SessionService, DatabaseService/Kysely, CacheService, env, middlewares; third-party libs)
      -  data: shared payloads, constants, and request options
      -  routes: API route tests (e.g., auth endpoints) exercising Hono handlers with initContainerMiddleware and mock env
      -  services: unit tests for service classes via DI container or direct constructor injection
      -  middlewares.spec.ts: middleware behavior and renewal/ratelimit branches
   -  Vitest config: globals=true; environment=node; @ alias to ./src
   -  Polyfills: add as needed in tests (e.g., atob)
-  Test Data Management:
   -  Use inline fixtures in data/; avoid hitting real D1/KV
   -  Seed script is for demo/data dev; not used in unit tests
-  Continuous Testing:
   -  Run tests via npm run test; CI to be added later

### Security

-  Input Validation:
   -  Validate all external inputs at API boundary with zod; whitelist approach preferred
-  Authentication & Authorization:
   -  Session-backed JWT cookies; server-side revocation flows
   -  Modes for logout: current, others, all, byIds (see auth route)
-  Secrets Management:
   -  JWT_SECRET provided via bindings; never hardcode; never log
-  API Security:
   -  Rate limiting via AUTH_RATE_LIMITER for unauth routes
   -  CSRF and CORS middleware enabled
   -  Security headers and HTTPS enforcement are handled by platform/Workers; add headers as needed later
-  Data Protection:
   -  Passwords hashed with bcryptjs
   -  No sensitive data in logs; avoid PII in KV beyond session payloads
-  Dependency Security:
   -  Keep dependencies up to date; adopt automated updates later
-  Security Testing:
   -  Add SAST/DAST in CI later

### Checklist Results Report

Pending. Populate after running the architect checklist.

### Next Steps

-  Implement Auth Worker (Epic 1) and route password hashing/verify to it
-  Implement Cron Worker (Epic 2) to scan reminders and deliver notifications
-  Adopt a structured logger for Workers (enhancement epic)
-  Generate REST API docs via framework-integrated OpenAPI and link here
-  Introduce minimal CI (lint, typecheck, test) and then integration/E2E tests in later phases
