# CLAUDE.md — UniConnect Codebase Guide

This file provides AI assistants with the context needed to work effectively in this repository.

---

## Project Overview

**UniConnect** is a full-stack Educational Institution Management Platform (ENT MVP). It manages university operations including student enrollment, academic structure, payments, scheduling, messaging, grades, attendance, and administration.

**Tech Stack**:
- **Backend**: NestJS 11 + MongoDB (Mongoose 9) — `apps/api/`
- **Frontend**: Angular 19 (Standalone Components) — `apps/web/`
- **Auth**: JWT + Passport (access + refresh tokens)
- **API Docs**: Swagger at `http://localhost:3000/api/docs`
- **Testing**: Jest (backend), Karma + Jasmine (frontend)

---

## Repository Structure

```
uniconnect/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── academic/       # Academic years, programs, levels, groups
│   │       ├── admin/          # Admin module (Sprint 7, planned)
│   │       ├── attendance/     # Attendance tracking
│   │       ├── audit/          # Centralized audit logging
│   │       ├── auth/           # JWT auth, Passport, guards
│   │       ├── common/         # Roles enum/guard/decorator, email service
│   │       ├── messages/       # Conversations & messaging
│   │       ├── migrations/     # Database migration scripts
│   │       ├── notes/          # Grades, evaluations, subjects
│   │       ├── payments/       # Payment plans & receipts
│   │       ├── planning/       # Rooms & sessions scheduling
│   │       ├── students/       # Student profiles, enrollment, documents
│   │       ├── teacher-profile/ # Teacher info
│   │       ├── users/          # User accounts
│   │       ├── app.module.ts
│   │       ├── main.ts
│   │       ├── seed.ts         # Seed superadmin + basic data
│   │       └── seed-academic.ts
│   └── web/                    # Angular frontend
│       └── src/app/
│           ├── core/           # Auth service, guards, interceptors, API clients
│           ├── pages/          # Page components (dashboard, admin, planning, etc.)
│           └── shared/         # Reusable components (header, confirm modal)
├── docs/                       # Module documentation (use-cases, specs)
├── .env.example                # Environment variable template
├── package.json                # Root workspace config
├── CHANGELOG.md
└── README.md                   # Quick start (French)
```

---

## Development Workflow

### Starting the App

```bash
# Terminal 1 — API (port 3000)
npm run -w apps/api start:dev

# Terminal 2 — Frontend (port 4200)
npm run -w apps/web start
```

### Building

```bash
npm run -w apps/api build       # Compile API to dist/
npm run -w apps/web build       # Production Angular build
```

### Database Seeding

```bash
npm run -w apps/api seed            # Superadmin + basic data
npm run -w apps/api seed:academic   # Academic structure data
```

### Database Migrations

```bash
npm run -w apps/api migrate:groups-program
npm run -w apps/api migrate:students-program
npm run -w apps/api migrate:offers-link-groups
npm run -w apps/api export:groups-program-map
```

### Linting & Formatting

```bash
npm run -w apps/api lint        # ESLint with auto-fix
npm run -w apps/api format      # Prettier format
```

---

## Testing

### Commands

```bash
# Backend
npm run -w apps/api test            # Jest watch mode
npm run -w apps/api test:cov        # Coverage report
npm run -w apps/api test:e2e        # End-to-end tests

# Frontend
npm run -w apps/web test            # Karma watch mode
npm run -w apps/web test:coverage   # Coverage report

# Combined
npm run test:coverage               # API + Web coverage
```

### Coverage Thresholds

- **API**: 85% branches, 90% functions, 90% lines, 90% statements
- **Web**: 75% target

### Test File Conventions

- All test files: `*.spec.ts` alongside the file they test
- Backend: Jest with `@nestjs/testing`, mock external dependencies
- Frontend: Jasmine + Karma, 22 spec files
- E2E: `apps/api/test/` using supertest

---

## Environment Variables

Copy `.env.example` to `apps/api/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | API server port |
| `MONGO_URI` | `mongodb://localhost:27017/uniconnect` | MongoDB connection |
| `JWT_ACCESS_SECRET` | `dev_access_secret` | Access token secret |
| `JWT_REFRESH_SECRET` | `dev_refresh_secret` | Refresh token secret |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token TTL |
| `SEED_SUPERADMIN_EMAIL` | `admin@uniconnect.local` | Initial superadmin |
| `SEED_SUPERADMIN_PASSWORD` | `change_this_admin_password` | Initial superadmin password |
| `SMTP_HOST` | — | Email SMTP host |
| `SMTP_PORT` | `587` | Email SMTP port |
| `SMTP_USER` | — | Email SMTP user |
| `SMTP_PASS` | — | Email SMTP password |
| `SMTP_FROM` | `no-reply@uniconnect.local` | Email from address |
| `CORS_ORIGIN` | auto | Comma-separated allowed origins |

**Default CORS origins** (when `CORS_ORIGIN` not set): `http://localhost:4200`, `http://localhost:5173`, `http://localhost:3000`

**Frontend**: API base URL is hard-coded as `http://localhost:3000/api` in `auth.service.ts`.

---

## Backend Conventions (NestJS)

### Module Structure

Each feature module follows this layout:

```
feature/
├── feature.schema.ts         # Mongoose schema(s)
├── feature.service.ts        # Business logic
├── feature.service.spec.ts   # Unit tests
├── feature.controller.ts     # REST endpoints
├── feature.controller.spec.ts
├── feature.module.ts         # NestJS module declaration
└── dto/
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Classes | PascalCase | `StudentProfile`, `PaymentPlan` |
| Methods | camelCase | `listStudents`, `createPayment` |
| Files | kebab-case | `student-profile.schema.ts` |
| DTOs | PascalCase + `Dto` suffix | `CreateStudentDto` |
| Enums | PascalCase values | `EnrollmentStatus.Active` |

### Service Patterns

- Inject Mongoose models via `@InjectModel(ModelName.name)`
- Method prefixes: `list*`, `create*`, `update*`, `delete*`, `get*`
- All async methods use `async/await`
- Throw NestJS exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`

### Controller Patterns

- Decorate with `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` for Swagger
- Use `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.Admin)` for protected routes
- Validate request bodies with DTOs via `ValidationPipe`

### Authentication & RBAC

Roles (defined in `src/common/roles.enum.ts`):
- `SuperAdmin`, `Admin`, `Teacher`, `External`, `Student`

Auth flow:
1. Login → access token (15m) + refresh token (7d, hash stored in DB)
2. `JwtAuthGuard` validates Bearer token on protected routes
3. `RolesGuard` + `@Roles()` decorator enforces RBAC
4. `POST /api/auth/refresh` issues new tokens using refresh token

### Audit Logging

Use `AuditLogService` (from `src/audit/`) to log sensitive actions:

```typescript
await this.auditLogService.log({
  action: 'CREATE_STUDENT',
  entity: 'Student',
  entityId: student._id.toString(),
  actor: { userId, role, email, ip, userAgent },
  metadata: { ... },
});
```

---

## Frontend Conventions (Angular)

### Architecture

- **Standalone components** throughout — no NgModules
- **Reactive Forms** for all forms
- Services are `providedIn: 'root'` (singleton)
- Lazy-loaded route groups: general routes and `teacher/` routes

### Route Guards

- `authGuard` — protects all general routes (checks JWT in localStorage)
- `teacherGuard` — role-specific guard for `/teacher/*` routes

### HTTP Interceptors

- `auth.interceptor.ts` — attaches `Authorization: Bearer <token>` to all requests
- `refresh.interceptor.ts` — handles 401 by refreshing tokens transparently

### API Services (`src/app/core/api/`)

One service per backend module, all following the same pattern:

```typescript
// Example: students.api.ts
@Injectable({ providedIn: 'root' })
export class StudentsApiService {
  private base = 'http://localhost:3000/api/students';
  constructor(private http: HttpClient) {}
  list() { return this.http.get<Student[]>(this.base); }
  create(dto: CreateStudentDto) { return this.http.post(this.base, dto); }
}
```

### State Management

No global state management library. State is local to components or held in services. Tokens are stored in `localStorage`.

---

## Database (MongoDB + Mongoose)

### Key Collections

| Collection | Schema | Key Fields |
|---|---|---|
| `users` | `User` | email (unique), role, refreshTokenHash |
| `studentprofiles` | `StudentProfile` | studentNumber, groupId, offerId |
| `enrollments` | `Enrollment` | studentId, offerId, status |
| `academicyears` | `AcademicYear` | name, isActive |
| `programs` | `Program` | code, name |
| `programoffers` | `ProgramOffer` | programId + levelId + academicYearId (unique) |
| `groups` | `Group` | name, offerId |
| `paymentplans` | `PaymentPlan` | studentId, installments[] |
| `payments` | `Payment` | studentId, planId, paidAt |
| `sessions` | `Session` | roomId, groupId, teacherId, startTime, endTime |
| `conversations` | `Conversation` | participantIds[], type |
| `grades` | `Grade` | evaluationId, studentId, score |
| `auditlogs` | `AuditLog` | action, entity, actorId, createdAt |

### Connection

Set `MONGO_URI` in your `.env`. For Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/uniconnect`

---

## Project Status

| Sprint | Feature | Status |
|---|---|---|
| 2 | Admin MVP, student CRUD, documents | ✅ Done |
| 3 | Payment plans, receipts | ✅ Done |
| 4 | Planning (rooms, sessions, conflicts) | ✅ Done |
| 5 | Messaging (direct & group, attachments) | ✅ Done |
| 6 | Grades (subjects, evaluations, summaries) | ✅ Done |
| 7 | Full admin module, bulk import, KPI dashboard | 🔜 Planned |

Sprint 7 is planned for June 22 – July 13, 2026. See `SPRINT_7_PLAN.md`, `SPRINT_7_ARCHITECTURE.md`, and `docs/administration.md` for full specs.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `apps/api/src/main.ts` | API bootstrap, CORS, Swagger setup, global pipes |
| `apps/api/src/app.module.ts` | Root NestJS module — imports all feature modules |
| `apps/api/src/common/roles.enum.ts` | Role definitions |
| `apps/api/src/common/roles.guard.ts` | RBAC guard |
| `apps/api/src/audit/audit-log.service.ts` | Audit logging |
| `apps/api/src/auth/jwt.strategy.ts` | JWT Passport strategy |
| `apps/web/src/app/app.routes.ts` | All frontend routes |
| `apps/web/src/app/core/auth.service.ts` | Token management (localStorage) |
| `apps/web/src/app/core/auth.interceptor.ts` | Adds Bearer token to HTTP requests |
| `.env.example` | Environment variable template |
| `docs/` | Module-level specifications and use cases |
