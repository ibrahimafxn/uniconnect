# Sprint 7 — Architecture & Schemas

## 📊 Schemas MongoDB (Nouveaux)

### 1. Program (Filière)

```typescript
// src/admin/program.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Program extends Document {
  @Prop({ required: true, unique: true })
  code: string; // Ex: 'INFO', 'MATH'

  @Prop({ required: true })
  name: string; // Ex: 'Informatique'

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);
```

### 2. Level (Niveau)

```typescript
// src/admin/level.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Level extends Document {
  @Prop({ required: true, unique: true })
  code: string; // Ex: 'L1', 'L2', 'M1'

  @Prop({ required: true })
  name: string; // Ex: 'Licence 1'

  @Prop()
  description?: string;

  @Prop({ default: 1 })
  order: number; // Pour tri

  @Prop({ default: true })
  isActive: boolean;
}

export const LevelSchema = SchemaFactory.createForClass(Level);
```

### 3. ProgramOffer (Offre de Formation)

```typescript
// src/admin/program-offer.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'programoffers' })
export class ProgramOffer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Program', required: true })
  programId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Level', required: true })
  levelId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicYear', required: true })
  academicYearId: Types.ObjectId;

  @Prop({ required: true })
  capacity: number; // Capacité maximale

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProgramOfferSchema = SchemaFactory.createForClass(ProgramOffer);
// Créer index composite pour unicité
ProgramOfferSchema.index(
  { programId: 1, levelId: 1, academicYearId: 1 },
  { unique: true }
);
```

### 4. Group (Groupe d'Étudiants)

```typescript
// src/admin/group.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Group extends Document {
  @Prop({ required: true })
  name: string; // Ex: 'Groupe A', 'TP1'

  @Prop({ type: Types.ObjectId, ref: 'ProgramOffer', required: true })
  offerId: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  enrollmentCount: number; // Nombre d'étudiants inscrits

  @Prop({ default: true })
  isActive: boolean;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
```

### 5. ImportLog (Log d'Import)

```typescript
// src/admin/import-log.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ImportLog extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop()
  fileHash?: string; // SHA256 du fichier

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  importedByUserId: Types.ObjectId;

  @Prop({ default: 'PENDING' })
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'PARTIALLY_SUCCESS';

  @Prop()
  totalLines?: number;

  @Prop()
  successCount?: number;

  @Prop()
  errorCount?: number;

  @Prop([
    {
      lineNumber: Number,
      field: String,
      value: String,
      reason: String,
    },
  ])
  errors?: Array<{
    lineNumber: number;
    field: string;
    value: string;
    reason: string;
  }>;

  @Prop()
  reportPath?: string; // Chemin du rapport CSV

  @Prop()
  completedAt?: Date;
}

export const ImportLogSchema = SchemaFactory.createForClass(ImportLog);
```

### 6. PaymentConfig (Configuration Paiements)

```typescript
// src/admin/payment-config.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentConfig extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ProgramOffer', required: false })
  offerId?: Types.ObjectId; // Null = config globale

  @Prop({ type: Types.ObjectId, ref: 'AcademicYear', required: false })
  academicYearId?: Types.ObjectId; // Null = config globale

  @Prop({ required: true })
  totalCost: number; // Montant total (CFA)

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const PaymentConfigSchema = SchemaFactory.createForClass(PaymentConfig);
```

### 7. InstallmentPlan (Plan d'Échéances)

```typescript
// src/admin/installment-plan.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class InstallmentPlan extends Document {
  @Prop({ type: Types.ObjectId, ref: 'PaymentConfig', required: true })
  paymentConfigId: Types.ObjectId;

  @Prop({ required: true })
  numberOfInstallments: number;

  @Prop([
    {
      order: Number,
      amount: Number,
      dueDate: Date,
      description: String,
    },
  ])
  installments: Array<{
    order: number;
    amount: number;
    dueDate: Date;
    description?: string;
  }>;

  @Prop({ default: true })
  isActive: boolean;
}

export const InstallmentPlanSchema = SchemaFactory.createForClass(
  InstallmentPlan
);
```

### 8. SystemConfig (Configuration Système)

```typescript
// src/admin/system-config.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SystemConfig extends Document {
  @Prop({ required: true, unique: true })
  key: string; // Ex: 'SMTP_HOST', 'SUPPORT_EMAIL'

  @Prop({ required: true })
  value: string;

  @Prop()
  description?: string;

  @Prop({ default: 'GLOBAL' })
  scope: 'GLOBAL' | 'INSTANCE';

  @Prop({ required: true })
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

  @Prop({ default: false })
  isEncrypted: boolean; // Pour SMTP_PASSWORD, etc.
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
```

### 9. EmailTemplate (Template d'Email)

```typescript
// src/admin/email-template.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EmailTemplate extends Document {
  @Prop({ required: true, unique: true })
  code: string; // Ex: 'PAYMENT_CONFIRMATION', 'IMPORT_REPORT'

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string; // HTML avec placeholders {{var}}

  @Prop([String])
  variables: string[]; // Ex: ['studentName', 'amount', 'dueDate']

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
```

### 10. AuditLog (Log d'Audit - existant, enrichissement)

```typescript
// src/audit/audit-log.schema.ts (METTRE À JOUR)
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'auditlogs' })
export class AuditLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // Ex: 'admin_created_year', 'admin_imported_students'

  @Prop()
  resource?: string; // Ex: 'AcademicYear', 'StudentImport'

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  details?: Record<string, any>; // Données contextuelles

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ default: 'INFO' })
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

  @Prop({ index: true })
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
```

---

## 🏗️ Modules NestJS

### Structure par module

```
src/
├── admin/
│   ├── admin.module.ts
│   ├── controllers/
│   │   ├── academic-year.controller.ts
│   │   ├── program.controller.ts
│   │   ├── level.controller.ts
│   │   ├── program-offer.controller.ts
│   │   ├── group.controller.ts
│   │   ├── student-import.controller.ts
│   │   ├── payment-config.controller.ts
│   │   ├── user-management.controller.ts
│   │   ├── supervision.controller.ts
│   │   ├── system-config.controller.ts
│   │   └── email-template.controller.ts
│   ├── services/
│   │   ├── academic-year.service.ts
│   │   ├── program.service.ts
│   │   ├── level.service.ts
│   │   ├── program-offer.service.ts
│   │   ├── group.service.ts
│   │   ├── student-import.service.ts
│   │   ├── payment-config.service.ts
│   │   ├── user-management.service.ts
│   │   ├── supervision.service.ts
│   │   ├── system-config.service.ts
│   │   └── email-template.service.ts
│   ├── dto/
│   │   ├── create-academic-year.dto.ts
│   │   ├── update-academic-year.dto.ts
│   │   ├── (autres DTOs...)
│   │   └── import-preview.dto.ts
│   ├── schemas/
│   │   ├── program.schema.ts
│   │   ├── level.schema.ts
│   │   ├── program-offer.schema.ts
│   │   ├── group.schema.ts
│   │   ├── import-log.schema.ts
│   │   ├── payment-config.schema.ts
│   │   ├── installment-plan.schema.ts
│   │   ├── system-config.schema.ts
│   │   └── email-template.schema.ts
│   ├── guards/
│   │   ├── rbac-admin.guard.ts
│   │   └── rbac-superadmin.guard.ts
│   └── admin.module.ts
├── audit/
│   ├── audit.service.ts (service partagé pour logging)
│   ├── audit-log.schema.ts (enrichi)
│   └── audit.module.ts
└── ...
```

---

## 🔐 RBAC Guards

### RbacAdminGuard

```typescript
// src/admin/guards/rbac-admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RbacAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Du JWT

    if (!user || !user.roles) {
      throw new ForbiddenException('No roles found');
    }

    const hasAdminRole = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
    if (!hasAdminRole) {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
```

### RbacSuperAdminGuard

```typescript
// src/admin/guards/rbac-superadmin.guard.ts
@Injectable()
export class RbacSuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.roles?.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('SuperAdmin role required');
    }

    return true;
  }
}
```

---

## 📝 DTOs (Exemples)

### CreateAcademicYearDto

```typescript
// src/admin/dto/create-academic-year.dto.ts
import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty({ example: '2026-2027' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-06-30' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

### StudentImportPreviewDto

```typescript
// src/admin/dto/student-import-preview.dto.ts
import { IsString } from 'class-validator';

export class StudentImportPreviewDto {
  @IsString()
  filename: string; // Base64 ou chemin temporaire
}
```

---

## 🧪 Tests (Structure)

```typescript
// src/admin/services/academic-year.service.spec.ts
describe('AcademicYearService', () => {
  let service: AcademicYearService;
  let model: Model<AcademicYear>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AcademicYearService,
        {
          provide: getModelToken(AcademicYear),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<AcademicYearService>(AcademicYearService);
  });

  describe('create', () => {
    it('should create an academic year', async () => {
      const dto = { name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30' };
      const result = await service.create(dto);
      expect(result).toBeDefined();
    });

    it('should enforce only one active year', async () => {
      // Test que seule une année peut être active
    });
  });

  describe('import validation', () => {
    it('should detect duplicate emails', async () => {
      // Test validation
    });
  });
});
```

---

## ✅ Checklist Implémentation

- [ ] Tous schemas MongoDB créés
- [ ] Tous DTOs créés
- [ ] Tous services implémentés
- [ ] Tous controllers implémentés
- [ ] Guards RBAC implémentés
- [ ] Audit logging intégré
- [ ] Tests unitaires écrits
- [ ] Tests intégration écrits
- [ ] Swagger docs générées
- [ ] Seed data créée

