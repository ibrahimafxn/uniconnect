# UniConnect — ENT MVP

## Demarrage rapide

### 1) API (NestJS)

```bash
cd apps/api

# Option A: .env local
cp .env.example .env
# Mettre MONGO_URI et JWT_* dans .env

npm run start
```

Swagger: `http://localhost:3000/api/docs`

### 2) Front (Angular)

```bash
cd apps/web
npm run start
```

Front: `http://localhost:4200`

## Seeds

### SuperAdmin
```bash
MONGO_URI="<your_uri>" npm run -w apps/api seed
```

### Donnees academiques
```bash
MONGO_URI="<your_uri>" npm run -w apps/api seed:academic
```

## Environnements
Variables principales:
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Fichiers:
- `apps/api/.env` (utilise par l'API)
- `.env.example` (reference racine)

## Tests

```bash
npm run -w apps/api test
```

Couverture fin de sprint:
```bash
npm run test:coverage
```
Derniere mesure (2026-03-03): 83.99% statements, 58.54% branches, 80.43% functions, 84.6% lines.

## Sprint 2 (Admin MVP)

Fonctionnel:
- CRUD et recherche des etudiants, statut (actif/suspendu/diplome).
- Inscriptions simples (enrollments).
- Upload pieces jointes et gestion (liste / download / suppression).
- UI admin basique avec recherche, changement de statut, suppression.
 - Seeds academiques (filieres / niveaux / groupes).
 - Setup script + checklist onboarding.
 - Standardisation des `.env` (racine + API).

Pieces jointes:
- Stockage local: `uploads/students/`
- Types autorises: PDF, PNG, JPEG
- Taille max: 10 MB

## Sprint 3 (Paiements MVP)

Fonctionnel:
- Plans de paiement avec echeances (optionnelles).
- Enregistrement des reglements.
- Tableau des impayes (montant du/verse).
- Recus PDF simples.
- Notifications email basiques (confirmation paiement).

API:
- `GET /api/payments/plans`
- `POST /api/payments/plans`
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/payments/unpaid`
- `GET /api/payments/:id/receipt`

Email (optionnel):
- Configurer `SMTP_*` dans `apps/api/.env`.

## Sprint 4 (Planning MVP)

Fonctionnel:
- Gestion des salles (CRUD + capacité).
- Création des séances (EDT) avec conflits salle/enseignant/groupe.
- Consultation par profil (admin, enseignant, étudiant).
 - Audit log pour actions sensibles.

API:
- `GET /api/planning/rooms`
- `POST /api/planning/rooms`
- `PATCH /api/planning/rooms/:id`
- `DELETE /api/planning/rooms/:id`
- `GET /api/planning/sessions`
- `POST /api/planning/sessions`
- `PATCH /api/planning/sessions/:id`
- `DELETE /api/planning/sessions/:id`

Doc module:
- `docs/planning.md`

## Sprint 5 (Messagerie MVP)

Fonctionnel:
- Conversations 1-1.
- Groupes de discussion.
- Pieces jointes simples.
- Notifications email (optionnel).
- UI inbox + recherche simple.

API:
- `GET /api/messages/conversations`
- `POST /api/messages/conversations/direct`
- `POST /api/messages/conversations/group`
- `GET /api/messages/conversations/:id/messages`
- `POST /api/messages/conversations/:id/messages`
- `POST /api/messages/attachments?conversationId=...`
- `GET /api/messages/attachments/:id/download`

Doc module:
- `docs/messaging.md`

## Module transverse (Aide & Support)

Fonctionnel:
- Point d’entrée unique vers le support depuis le header.
- Contact support par email (V1).

Doc module:
- `docs/support.md`
- `docs/roles-rules.md`

## Sprint 6 (Notes + Stabilisation)

Fonctionnel:
- CRUD matieres + coefficients.
- Saisie notes par groupe.
- Consultation etudiant + moyennes.

API:
- `GET /api/notes/subjects`
- `POST /api/notes/subjects`
- `PATCH /api/notes/subjects/:id`
- `DELETE /api/notes/subjects/:id`
- `GET /api/notes/evaluations`
- `POST /api/notes/evaluations`
- `PATCH /api/notes/evaluations/:id`
- `GET /api/notes/groups/:id/students`
- `GET /api/notes/evaluations/:id/grades`
- `POST /api/notes/grades/bulk`
- `GET /api/notes/students/:id/summary`
- `GET /api/notes/students/me/summary`

Doc module:
- `docs/notes.md`

## Sprint 7 (Administration MVP Complet)

**Statut**: Planifié (2026-06-22 → 2026-07-13)

Fonctionnel:
- Gestion structure académique (années, programmes, niveaux, offres, groupes).
- Import en masse d'étudiants (XLSX avec validation et rapport).
- Paramétrage des paiements (frais, plans d'échéances, modes Mobile Money).
- Gestion utilisateurs complets et RBAC détaillé.
- Supervision & rapports (dashboard, audit logs, alertes).
- Configurations globales (SMTP, templates, paramètres système).

API (tous endpoints taggés `@ApiTags('Administration')`):
- Structure: `GET/POST /admin/academic-years`, `GET/POST /admin/programs`, etc.
- Import: `POST /admin/students/import/preview`, `POST /admin/students/import/commit`, `GET /admin/students/import/:id`
- Paiements: `POST /admin/payment-configs`, `POST /admin/installment-plans`, `PATCH /admin/payment-methods/:id`
- Utilisateurs: `GET/POST /admin/users`, `PATCH /admin/users/:id/roles`, `PATCH /admin/users/:id/status`
- Supervision: `GET /admin/dashboard`, `GET /admin/audit-logs`, `GET /admin/reports/{payments,students,attendance}`
- Config: `PATCH /admin/config/:key`, `PATCH /admin/email-templates/:code`

UI Admin:
- Dashboard avec KPIs rapides.
- Gestion structure académique (CRUD visuelle).
- Import d'étudiants (upload + preview + rapport).
- Gestion utilisateurs (CRUD + permissions).
- Configuration paiements.
- Audit logs et rapports.
- Configurations globales.

Doc module:
- `docs/administration.md`
- `SPRINT_7_PLAN.md`
- `SPRINT_7_GETTING_STARTED.md`

## Couverture (fin de sprint)

```bash
npm run test:coverage
```
