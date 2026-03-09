# Sprint Status (Auto-updated)

Date: 2026-03-07

This file summarizes sprint progress based on repository evidence (code, docs, and tests).

## Sprint 2 — Admin MVP (Cloture)

### Done (confirmed by changelog)
- Student statuses (actif/suspendu/diplome).
- Student attachments (upload/list/download/delete).
- Admin UI: search + status management + student delete.
- Coverage command documented: `npm run test:coverage`.

Source: `CHANGELOG.md`

### Done (confirmed by repo contents)
- Setup script + onboarding checklist exist.
  Evidence: `scripts/setup.sh`, `CHECKLIST_ONBOARDING.md`
- Standardized env examples at root + API.
  Evidence: `.env.example`, `apps/api/.env.example`
- Academic seed script present.
  Evidence: `apps/api/package.json` (`seed:academic`)

### Done (verified locally)
- API e2e tests (minimal) pass with `.env.test`.
  Evidence: `npm run -w apps/api test:e2e` (2026-03-01)

## Test Runs (2026-03-04)

### Coverage
- Command: `npm run test:coverage`
- Result: PASS
- API coverage (statements): 99.34%
- API coverage (branches): 85.15%
- Web coverage (statements): 91.67%
- Web coverage (branches): 68.12%

### API e2e
- Command: `npm run -w apps/api test:e2e`
- Result: PASS (7 tests)
- `apps/api/.env.test` used for MongoDB connection.
  Evidence: `apps/api/test/setup-e2e.ts`, `apps/api/.env.test`

### API unit tests
- Command: `npm run -w apps/api test -- --runInBand`
- Result: PASS (coverage thresholds met)

### Web unit tests
- Command: `npm run -w apps/web test -- --watch=false`
- Result: PASS

## Sprint 3 — Paiements MVP (Planifie)

Window: 2026-04-29 → 2026-05-10 (tests/docs to 2026-05-12)

Planned scope:
- Modele paiements + echeances.
- Enregistrement reglements.
- Tableau impayes.
- Recus PDF simples.
- Notifications email basiques.
- Tests + doc paiements.

Source: `extras/roadmap_gantt.md`, `extras/sprint_3_trello.csv`

### Avancement (2026-03-01)
- API: echeances (installments), impayes, recus PDF, notifications email.
- UI: saisie echeances, liste impayes, lien recu PDF.
- Docs: README + env SMTP.

## Sprint 4 — Planning MVP (Planifie)

Window: 2026-05-13 → 2026-05-25 (tests/docs to 2026-05-26)

Planned scope:
- Gestion des salles (CRUD + capacite).
- Creation EDT basique (seances).
- Consultation EDT par profil.
- Detection conflits simple.
- Tests + doc planning.

Source: `extras/roadmap_gantt.md`, `extras/sprint_4_trello.csv`

### Avancement (2026-03-03)
- API: salles CRUD, seances EDT, conflits simples (salle/enseignant/groupe), consultation par profil.
- API: audit log sur actions sensibles + tags Swagger Planning.
- UI: page Planning (salles + seances) avec refonte visuelle et actions clarifiees.
- Docs: module Planning documente (`docs/planning.md`).

## Sprint 5 — Messagerie MVP (Planifie)

Window: 2026-05-27 → 2026-06-09 (tests/docs to 2026-06-09)

Planned scope:
- Conversations 1-1
- Groupes de discussion
- Pieces jointes simples
- Notifications email
- UI inbox + recherche simple

### Avancement (2026-03-03)
- API: conversations, messages, pieces jointes + audit log.
- UI: page Messagerie (inbox + fil de discussion).
- Docs: module Messagerie documente (`docs/messaging.md`).

### Retrospective (2026-03-03)
- Ce qui a bien fonctionne: livraison bout en bout (API + UI + docs + tests) avec couverture conforme.
- Ce qui a ralenti: ajustements tests unitaires (IDs ObjectId, mocks).
- Actions d'amelioration: ajouter notifications email + recherche avancée + pagination UI sur messages.

## Sprint 6 — Notes MVP (Planifie)

Window: 2026-06-10 → 2026-06-23 (tests/docs to 2026-06-24)

Planned scope:
- Matieres (CRUD) + coefficients.
- Evaluations (DS, examens) par groupe.
- Saisie des notes + exports simples.
- Moyennes par matiere + moyenne generale.
- Tests + doc Notes.

### Avancement (2026-03-03)
- API: module Notes (matieres, evaluations, notes) + calculs de moyennes + audit log.
- UI: page Notes (matieres, evaluations, saisie de notes, moyenne etudiant).
- Docs: module Notes documente (`docs/notes.md`).

## Sprint 7 — Administration MVP Complet (Planifie)

Window: 2026-06-22 → 2026-07-13 (tests/docs to 2026-07-13)

Planned scope:
- Gestion structure academique (annees, programmes, niveaux, offres, groupes).
- Import en masse d'etudiants depuis Excel.
- Parametrage des paiements (frais, modes Mobile Money).
- Gestion utilisateurs et RBAC complet.
- Supervision & rapports admin (dashboard, logs d'audit, alertes).
- Configurations globales (SMTP, URLs, templates).
- Tests + doc Administration.

### Statut (2026-03-09)
- PLAN: `SPRINT_7_PLAN.md` cree avec scope complet (UC-A01 a UC-A06).
- Work breakdown: 4 semaines avec deliverables API + UI + tests.
- Metriques: Coverage API >= 85%, Web >= 75%.
- Definition of Done: audit log, Swagger tags, seed data, doc.

### Avancement (2026-03-09)

#### UC-A01 — Structure académique (✅ 100%)
- API: initializeYear, closeYear, getYearSummary, updateOfferCapacity, calendar events CRUD
- UI: admin-uni onglet "Année académique" — formulaires init année + événements calendrier
- Tests: service spec + controller spec

#### UC-A02 — Import en masse (✅ 100%)
- API: importStudents (JSON), parseXlsxImport (multipart XLSX via exceljs)
  - POST /admin/users/import-students — import direct JSON rows
  - POST /admin/users/parse-xlsx — prévisualisation XLSX avant import
- UI: drawer import avec upload XLSX + prévisualisation + fallback CSV manuel
- Tests: service spec + controller spec

#### UC-A03 — Paramétrage paiements (✅ 100%)
- API: fee-templates CRUD + apply, exemptions CRUD, rapport financier
- UI: admin-uni onglet "Finances" — templates + exonérations + rapport
- Tests: service spec + controller spec

#### UC-A04 — Gestion utilisateurs & RBAC (✅ 100%)
- API: listUsers, suspend/reactivate, resetPassword, assignRole, audit logs, importStudents
- UI: admin-uni onglet "Utilisateurs" — liste + actions + journal d'audit
- Tests: service spec + controller spec

#### UC-A05 — Supervision & rapports (✅ 100%)
- API: dashboard exécutif, rapport MESRS, status système, broadcastAnnouncement
- UI: admin-uni onglet "Dashboard" + "Communication"
- Tests: service spec + controller spec

#### UC-A06 — Configuration globale (✅ 100%)
- API: nouveau module global-config (SuperAdmin uniquement)
  - GET/PATCH /admin/config/smtp
  - GET/POST/DELETE /admin/config/email-templates/:key
  - GET/PATCH /admin/config/system-params
- UI: admin-uni onglet "Configuration" — SMTP + paramètres système + templates email
- Tests: service spec + controller spec (16 tests)
- Schema: SystemConfig (singleton MongoDB) avec markModified pour nested objects

#### Nouveaux modules support (✅)
- applications/ — dossiers candidatures publiques + workflow admin
- assignments/ — travaux + soumissions + correction
- resources/ — ressources pédagogiques avec upload
- document-requests/ — demandes de documents officiels
- announcements/ — annonces par rôle/groupe

#### Couverture tests (2026-03-09)
- API: 354 tests passent (46 suites) — 9 controller specs ajoutées
- Tous les modules ont : service spec + controller spec