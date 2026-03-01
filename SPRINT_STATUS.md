# Sprint Status (Auto-updated)

Date: 2026-03-01

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

## Test Runs (2026-03-01)

### Coverage
- Command: `npm run test:coverage`
- Result: PASS
- API coverage (statements): 97.1%
- Web coverage (statements): 83.27%

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
