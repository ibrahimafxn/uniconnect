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
- **PDF Generation**: pdfkit (payment receipts)
- **Email**: nodemailer
- **Excel Import**: exceljs (bulk student import)

---

## Repository Structure

```
uniconnect/
├── apps/
│   ├── api/                        # NestJS backend
│   │   └── src/
│   │       ├── academic/           # Academic years, programs, levels, groups, offers
│   │       ├── admin/              # Admin module: academic, finance, users, dashboard
│   │       │   └── schemas/        # fee-template, fee-exemption, bulk-import-job,
│   │       │                       #   academic-calendar-event
│   │       ├── announcements/      # Platform-wide announcements by role/group
│   │       ├── applications/       # Student application submissions & documents
│   │       ├── assignments/        # Assignment management & submissions
│   │       ├── attendance/         # Attendance tracking with justifications
│   │       ├── audit/              # Centralized audit logging
│   │       ├── auth/               # JWT auth, Passport, guards
│   │       ├── common/             # Roles enum/guard/decorator, email service, pagination
│   │       ├── document-requests/  # Student document request handling
│   │       ├── global-config/      # System config (SMTP, email templates, system params)
│   │       ├── messages/           # Conversations & messaging with attachments
│   │       ├── migrations/         # Database migration scripts
│   │       ├── notes/              # Grades, evaluations, subjects
│   │       ├── payments/           # Payment plans, receipts, PDF export
│   │       ├── planning/           # Rooms & sessions scheduling
│   │       ├── resources/          # Shared resource management
│   │       ├── students/           # Student profiles, enrollment, documents
│   │       ├── teacher-documents/  # Teacher document assignments
│   │       ├── teacher-profile/    # Teacher info
│   │       ├── users/              # User accounts
│   │       ├── app.module.ts       # Root module — 21 feature modules imported
│   │       ├── main.ts
│   │       ├── seed.ts             # Seed superadmin + basic data
│   │       └── seed-academic.ts
│   └── web/                        # Angular frontend
│       └── src/app/
│           ├── core/               # Auth service, guards, interceptors, API clients
│           │   ├── api/            # One service file per backend module (16 services)
│           │   └── services/       # Additional core services
│           ├── pages/              # Page components
│           │   ├── admin/          # Admin panel
│           │   ├── admin-uni/      # University admin interface (tabs: Academic, Finance,
│           │   │                   #   Users, Dashboard, Communication, Configuration)
│           │   ├── apply/          # Student application form (public)
│           │   ├── dashboard/      # Main dashboard
│           │   ├── login/          # Authentication (public)
│           │   ├── messages/       # Messaging interface
│           │   ├── notes/          # Grades/notes interface
│           │   ├── planning/       # Scheduling interface
│           │   ├── student/        # Student portal
│           │   ├── support/        # Support/help center
│           │   └── teacher/        # Teacher routes via TeacherShellComponent
│           │       ├── announcements/
│           │       ├── assignments/
│           │       ├── dashboard/
│           │       ├── notes/
│           │       ├── planning/
│           │       ├── presence/
│           │       ├── profile/
│           │       ├── resources/
│           │       ├── shell/      # TeacherShellComponent (navy sidebar + horizontal nav)
│           │       └── stats/
│           └── shared/             # Reusable components (header, confirm modal)
├── docs/                           # Module documentation (use-cases, specs)
│   ├── administration.md           # Full admin module use-cases & API specs
│   ├── messaging.md
│   ├── notes.md
│   ├── planning.md
│   ├── support.md
│   └── use-cases.md
├── SPRINT_7_PLAN.md                # Sprint 7 work breakdown
├── SPRINT_7_ARCHITECTURE.md        # Schemas, DTOs, module structure for Sprint 7
├── SPRINT_7_API_EXAMPLES.md        # Curl/Postman examples
├── SPRINT_7_DASHBOARD_VISUAL.md    # Visual mockups
├── SPRINT_7_CHECKLIST.md           # Pre-launch validation items
├── SPRINT_7_EXECUTIVE_SUMMARY.md   # Stakeholder overview
├── SPRINT_7_GETTING_STARTED.md     # Developer quick start for Sprint 7
├── SPRINT_7_INDEX_DOCUMENTATION.md # Navigation guide for Sprint 7 docs
├── SPRINT_STATUS.md                # Global project status
├── PWA_SETUP.md                    # Progressive Web App configuration
├── .env.example                    # Environment variable template
├── package.json                    # Root workspace config
├── CHANGELOG.md
└── README.md                       # Quick start (French)
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
npm run -w apps/api test:e2e        # End-to-end tests (uses apps/api/.env.test)

# Frontend
npm run -w apps/web test            # Karma watch mode
npm run -w apps/web test:coverage   # Coverage report

# Combined
npm run test:coverage               # API + Web coverage
```

### Coverage Thresholds

- **API**: 69% branches, 85% functions, 85% lines, 85% statements
- **Web**: 75% target
- **Current state** (2026-03-04): API statements 99.34%, branches 85.15%; Web statements 91.67%, branches 68.12%
- **Test count**: 354 tests passing across 46 suites (backend), 23 spec files (frontend)

### Test File Conventions

- All test files: `*.spec.ts` alongside the file they test
- Backend: Jest with `@nestjs/testing`, mock external dependencies (46 spec files)
- Frontend: Jasmine + Karma (23 spec files)
- E2E: `apps/api/test/` using supertest; requires `apps/api/.env.test`

### What Is NOT Covered by Jest

Jest is configured to exclude DTOs, controllers (for thresholds), schemas, modules, JWT strategy, `main.ts`, seed files, and migration files.

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

**Default CORS origins** (when `CORS_ORIGIN` not set): `http://localhost:4200`, `http://localhost:5173`, `http://localhost:3000`, plus any `localhost:<port>` matched via regex.

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

The `admin/` module is larger and uses sub-services per domain:

```
admin/
├── admin-academic.service.ts      # Academic structure operations
├── admin-academic.controller.ts
├── admin-finance.service.ts       # Finance & payment config
├── admin-finance.controller.ts
├── admin-users.service.ts         # User & RBAC management
├── admin-users.controller.ts
├── admin-dashboard.service.ts     # KPI aggregation
├── admin-dashboard.controller.ts
├── admin.module.ts
└── schemas/
    ├── academic-calendar-event.schema.ts
    ├── bulk-import-job.schema.ts
    ├── fee-exemption.schema.ts
    └── fee-template.schema.ts
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
- Validate request bodies with DTOs via `ValidationPipe` (global: whitelist + forbidNonWhitelisted)

### Authentication & RBAC

Roles (defined in `src/common/roles.enum.ts`):

```typescript
export enum Role {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Teacher = 'teacher',
  External = 'external',
  Student = 'student',
}
```

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

### All Backend Modules (21 total in app.module.ts)

`UsersModule`, `AuthModule`, `AcademicModule`, `StudentsModule`, `PaymentsModule`,
`PlanningModule`, `AuditModule`, `MessagesModule`, `NotesModule`, `AttendanceModule`,
`TeacherProfileModule`, `TeacherDocumentsModule`, `AdminModule`, `ApplicationsModule`,
`ResourcesModule`, `AssignmentsModule`, `DocumentRequestsModule`, `AnnouncementsModule`,
`GlobalConfigModule`

---

## Frontend Conventions (Angular)

### Architecture

- **Standalone components** throughout — no NgModules
- **Reactive Forms** for all forms
- Services are `providedIn: 'root'` (singleton)
- Lazy-loaded route groups: general routes and `teacher/` routes
- Teacher section uses `TeacherShellComponent` as layout wrapper (navy sidebar + horizontal navbar)

### Route Guards

- `authGuard` — protects all general routes (checks JWT in localStorage)
- `teacherGuard` — role-specific guard for `/teacher/*` routes
- `role.guard.ts` — additional role-based access control guard

### HTTP Interceptors

- `auth.interceptor.ts` — attaches `Authorization: Bearer <token>` to all requests
- `refresh.interceptor.ts` — handles 401 by refreshing tokens transparently

### Frontend Routes

```
/login          → LoginComponent (public)
/apply          → ApplyComponent (public — student application)
/teacher/*      → Lazy-loaded TEACHER_ROUTES (protected by teacherGuard)
                  Parent: TeacherShellComponent (navy sidebar + horizontal nav)
  /teacher/               → TeacherDashboardComponent
  /teacher/planning       → TeacherPlanningComponent
  /teacher/notes          → TeacherNotesComponent
  /teacher/presence       → TeacherPresenceComponent
  /teacher/announcements  → Teacher announcements view
  /teacher/assignments    → Teacher assignments management
  /teacher/resources      → Teacher resources management
  /teacher/profile        → TeacherProfilePageComponent
  /teacher/stats          → TeacherStatsComponent
/*              → Lazy-loaded GENERAL_ROUTES (protected by authGuard)
  /dashboard    → DashboardComponent
  /student      → StudentComponent
  /admin        → AdminComponent
  /admin-uni    → AdminUniComponent (tabs: Academic Year, Finance, Users,
                                     Dashboard, Communication, Configuration)
  /planning     → PlanningComponent
  /messages     → MessagesComponent
  /notes        → NotesComponent
  /support      → SupportComponent
```

### API Services (`src/app/core/api/`)

One service per backend module:

`academic.api.ts`, `admin.api.ts`, `announcements.api.ts`, `applications.api.ts`,
`assignments.api.ts`, `attendance.api.ts`, `document-requests.api.ts`, `messages.api.ts`,
`notes.api.ts`, `payments.api.ts`, `planning.api.ts`, `resources.api.ts`,
`students.api.ts`, `teacher-documents.api.ts`, `teacher-profile.api.ts`, `users.api.ts`

Pattern:

```typescript
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
| `applications` | `Application` | studentId, offerId, status, documents[] |
| `assignments` | `Assignment` | groupId, teacherId, dueDate |
| `assignmentsubmissions` | `AssignmentSubmission` | assignmentId, studentId, fileUrl |
| `resources` | `Resource` | title, type, url, groupId |
| `documentrequests` | `DocumentRequest` | studentId, type, status |
| `announcements` | `Announcement` | title, content, targetRoles[], publishedAt |
| `feetemplates` | `FeeTemplate` | name, amount, offerId |
| `feeexemptions` | `FeeExemption` | studentId, templateId, reason |
| `bulkimportjobs` | `BulkImportJob` | status, importedCount, errors[] |
| `academiccalendarevents` | `AcademicCalendarEvent` | title, date, type |
| `systemconfigs` | `SystemConfig` | singleton — smtp, emailTemplates, systemParams |

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
| 7 | Full admin module, bulk import, KPI dashboard | ✅ Done |

**Sprint 7 completed use cases** (UC-A01 through UC-A06, all 100%):
- UC-A01: Academic structure (initializeYear, closeYear, calendar events)
- UC-A02: Bulk student import (JSON + XLSX via exceljs with preview)
- UC-A03: Payment configuration (fee templates, exemptions, financial report)
- UC-A04: User & RBAC management (suspend, reset password, assign roles, audit)
- UC-A05: Supervision & reports (executive dashboard, system status, broadcast)
- UC-A06: Global config (SMTP, email templates, system params — SuperAdmin only)

**New modules added in Sprint 7**: `applications`, `assignments`, `resources`,
`document-requests`, `announcements`, `global-config`, `teacher-documents`

---

## Key Files Reference

| File | Purpose |
|---|---|
| `apps/api/src/main.ts` | API bootstrap, CORS, Swagger setup, global pipes |
| `apps/api/src/app.module.ts` | Root NestJS module — imports all 21 feature modules |
| `apps/api/src/common/roles.enum.ts` | Role definitions |
| `apps/api/src/common/roles.guard.ts` | RBAC guard |
| `apps/api/src/audit/audit-log.service.ts` | Audit logging |
| `apps/api/src/auth/jwt.strategy.ts` | JWT Passport strategy |
| `apps/api/src/admin/admin.module.ts` | Admin module with 4 sub-services |
| `apps/api/src/global-config/` | Global system configuration (SuperAdmin only) |
| `apps/web/src/app/app.routes.ts` | All frontend routes |
| `apps/web/src/app/pages/general.routes.ts` | General (non-teacher) routes with authGuard |
| `apps/web/src/app/pages/teacher/teacher.routes.ts` | Teacher routes with teacherGuard |
| `apps/web/src/app/pages/teacher/shell/` | TeacherShellComponent (navy sidebar layout) |
| `apps/web/src/app/core/auth.service.ts` | Token management (localStorage) |
| `apps/web/src/app/core/auth.interceptor.ts` | Adds Bearer token to HTTP requests |
| `apps/web/src/app/core/role.guard.ts` | Role-based access control |
| `.env.example` | Environment variable template |
| `docs/administration.md` | Admin module specs (6 use cases, RBAC, API) |
| `docs/use-cases.md` | Cross-module use case definitions |
| `SPRINT_7_ARCHITECTURE.md` | Sprint 7 MongoDB schemas and DTOs |
| `PWA_SETUP.md` | Progressive Web App configuration guide |
