# Changelog (Interne)

## 2026-02-25
Sprint 2 (Admin MVP)
- Statuts etudiants: actif / suspendu / diplome.
- Pieces jointes etudiants: upload, liste, download, suppression.
- UI admin: recherche et gestion des statuts, suppression etudiants.
- Tests: `npm run test:coverage`.

## 2026-03-01
Sprint 2 (Admin MVP) — Cloture
- Setup script + checklist onboarding.
- Standardisation des fichiers `.env` (racine + API).
- Seed academique complet.
- Tests e2e API minimal: `npm run -w apps/api test:e2e`.

## 2026-03-03
Maintenance dependances (API)
- `npm audit fix` execute dans `apps/api` (suppression/maj mineures, sans `--force`).
- Vulnerabilites restantes: 7 (6 moderees, 1 elevee) liees a `ajv` et `nodemailer`, correctifs disponibles uniquement via breaking changes.
- Avertissement `EBADENGINE` sur `coffee-script-redux@2.0.0-beta8` (attend Node 0.8/0.10, environnements actuels en Node 24).
- `npm audit` confirme les issues restantes:
  - `ajv` (ReDoS via option `$data`) via `@nestjs/cli` / `@angular-devkit/*`.
  - `nodemailer` (Interpretation Conflict + DoS addressparser).
Fin de sprint
- `npm run test:coverage` (API + Web). Couverture globale: 83.99% statements, 58.54% branches, 80.43% functions, 84.6% lines.
- Ajout de tests front (APIs + pages Admin/Planning + Auth) pour atteindre le seuil 80%.
Sprint 4 (Planning MVP)
- API: audit log des actions sensibles + tags Swagger Planning.
- UI Planning: refonte visuelle + stats rapides + listes plus lisibles.
- Doc module: `docs/planning.md`.
- Tests: `npm run test:coverage` OK (API 98.62% statements, Web 81.95% statements).

Sprint 5 (Messagerie MVP)
- API: conversations, messages, pieces jointes + audit log.
- UI: page Messagerie (inbox + fil de discussion).
- Docs: `docs/messaging.md`.
- Tests: `npm run test:coverage` OK (API 99.2% statements, Web 82.93% statements).
