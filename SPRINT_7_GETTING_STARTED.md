# Sprint 7 — Getting Started

## 📋 Avant de commencer

### Accès aux documents
1. Plan détaillé: `SPRINT_7_PLAN.md`
2. Documentation module: `docs/administration.md`
3. Trello/Kanban: `extras/sprint_7_trello.csv`
4. Cas d'usage: `docs/use-cases.md` (UC-A01 à UC-A06)

### Environnement
```bash
# Cloner + setup
git clone <repo>
cd /home/coulibaly/Bureau/Uniconnect
npm install
npm run -w apps/api install

# Copier env
cp apps/api/.env.example apps/api/.env
cp apps/api/.env.example apps/api/.env.test

# Démarrer MongoDB local (ou config cloud)
mongod # or use Atlas connection string

# Seed data
npm run -w apps/api seed
```

## 🏗️ Phases du Sprint

### Phase 1 (2026-06-22 → 2026-06-26) : Structure Académique + Tests
**Objectif**: Endpoints CRUD stables pour années, filières, niveaux, offres, groupes.

#### Tâches prioritaires
1. [ ] Créer schemas MongoDB
   - `src/academic/academic-year.schema.ts` (déjà existe ?)
   - `src/academic/program.schema.ts`
   - `src/academic/level.schema.ts`
   - `src/academic/program-offer.schema.ts`
   - `src/academic/group.schema.ts`

2. [ ] Endpoints API
   - Implémenter services: `AcademicYearService`, `ProgramService`, `LevelService`, `OfferService`, `GroupService`
   - Implémenter controllers avec DTOs
   - Ajouter tags Swagger: `@ApiTags('Administration')`

3. [ ] Tests
   - Tests unitaires services
   - Tests intégration endpoints
   - Validation RBAC (Admin vs SuperAdmin)

#### Commandes de validation
```bash
# Tests
npm run -w apps/api test -- src/academic/academic.service.spec.ts

# Coverage
npm run test:coverage

# Linting
npm run lint
```

---

### Phase 2 (2026-06-29 → 2026-07-03) : Import Excel + Utilisateurs
**Objectif**: Import XLSX fonctionnel avec validation et gestion utilisateurs.

#### Tâches prioritaires
1. [ ] Import Excel
   - `POST /admin/students/import/preview` — Valider fichier, afficher erreurs
   - `POST /admin/students/import/commit` — Confirmer et créer étudiants
   - `GET /admin/students/import/:id` — Télécharger rapport
   - Utiliser lib: `xlsx` (déjà disponible ?)

2. [ ] Gestion Utilisateurs
   - CRUD endpoints: `POST /admin/users`, `GET`, `PATCH`, `DELETE`
   - Assignation rôles: `PATCH /admin/users/:id/roles`
   - Changement statut: `PATCH /admin/users/:id/status`

3. [ ] Tests
   - Parsing XLSX valide/invalide
   - Validation doublons email
   - RBAC (SuperAdmin only pour DELETE)

#### Commandes
```bash
npm run -w apps/api test -- src/admin/
npm run test:coverage -- src/admin/
```

---

### Phase 3 (2026-07-06 → 2026-07-10) : Paiements + Supervision
**Objectif**: Configuration paiements, audit logs, dashboard, rapports.

#### Tâches prioritaires
1. [ ] Paiements API
   - CRUD configurations: `POST /admin/payment-configs`
   - Plans d'échéances: `POST /admin/installment-plans`
   - Modes paiement: `PATCH /admin/payment-methods/:id`

2. [ ] Supervision
   - Dashboard: `GET /admin/dashboard` (KPIs)
   - Audit logs: `GET /admin/audit-logs` + filtres
   - Rapports: `GET /admin/reports/payments`, etc.

3. [ ] Configurations Globales
   - CRUD configs: `PATCH /admin/config/:key`
   - Templates emails: `PATCH /admin/email-templates/:code`

4. [ ] Tests
   - Audit logs loggés correctement
   - Dashboard retourne KPIs
   - Rapports paginés/filtrés

---

### Phase 4 (2026-07-13) : UI + Documentation
**Objectif**: UI complète, tests e2e, documentation finalisée.

#### Tâches prioritaires
1. [ ] UI Components
   - Dashboard: `AdminDashboardComponent`
   - Structure: `AcademicYearComponent`, `ProgramComponent`, etc.
   - Import: `StudentImportComponent` (upload + preview + rapport)
   - Utilisateurs: `UserManagementComponent`
   - Paiements: `PaymentConfigComponent`
   - Rapports: `AuditLogsComponent`, `ReportsComponent`

2. [ ] Tests E2E
   - Création année → offres → groupes
   - Import étudiants → rapport
   - Gestion utilisateurs et permissions

3. [ ] Documentation
   - Compléter `docs/administration.md`
   - Ajouter examples API (curl/Postman)
   - README Admin (quick start)

---

## 🔧 Stack Technique (rappel)

### Backend
- **Framework**: NestJS
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (déjà implémenté)
- **Excel**: `xlsx` library
- **Validation**: `class-validator`
- **API Docs**: Swagger/OpenAPI
- **Logging**: Pino
- **Email**: Nodemailer (configured)

### Frontend
- **Framework**: Angular (Standalone Components)
- **UI**: Tailwind CSS
- **Forms**: Reactive Forms
- **Storage**: LocalStorage (JWT)
- **HTTP**: HttpClient

---

## ✅ Definition of Done (Sprint 7)

### Code
- [ ] Tous endpoints implémentés (UC-A01 à UC-A06)
- [ ] Swagger tags `@ApiTags('Administration')` présents
- [ ] DTOs + validations complètes
- [ ] RBAC correctement appliqué

### Tests
- [ ] Tests unitaires >= 80% couverture
- [ ] Tests intégration e2e passent
- [ ] Coverage API >= 85% (statements + branches)
- [ ] Coverage Web >= 75%

### Audit & Sécurité
- [ ] Audit logs pour actions sensibles
- [ ] Pas de failles critiques
- [ ] Rate limiting activé

### Documentation
- [ ] `docs/administration.md` complète
- [ ] Exemples API (curl/Postman)
- [ ] README Admin section
- [ ] Swagger UI accessible

### Data
- [ ] Seed data admin created
- [ ] Seed data testable

---

## 📊 Checklist de Qualité

- [ ] Linting passe: `npm run lint`
- [ ] Tous tests passent: `npm run test:coverage`
- [ ] Aucun warning console (Dev + E2E)
- [ ] Performance OK (API response < 500ms)
- [ ] UI responsive (mobile + desktop)
- [ ] Documentation lisible et précise

---

## 🚀 Commandes Utiles

```bash
# Development
npm run -w apps/api dev
npm run -w apps/web dev

# Tests
npm run -w apps/api test
npm run -w apps/web test
npm run test:coverage
npm run -w apps/api test:e2e

# Linting & Format
npm run lint
npm run format

# Build
npm run -w apps/api build
npm run -w apps/web build

# Seed data
npm run -w apps/api seed
```

---

## 📞 Support & Escalade

### Questions/Blocages
- **Documentation**: Consulter `docs/administration.md`
- **API Design**: Vérifier `docs/use-cases.md` (UC-A01-A06)
- **Code Review**: Demander review avant merge

### Escalade
- **Bugs critiques**: Créer issue + alerter lead
- **Dépendances externes**: Documenter + demander validation

---

## 🎯 Métriques de Succès (Fin Sprint)

- ✅ Tous endpoints fonctionnels (UC-A01 à UC-A06)
- ✅ Coverage >= 85% API, >= 75% Web
- ✅ Aucun bug critique
- ✅ UI accessible et responsive
- ✅ Audit logs complètes
- ✅ Documentation finalisée

**Bon sprint ! 🚀**

