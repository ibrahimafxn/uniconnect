# Changelog (Interne)

## 2026-03-08
Sprint 7 (Module Étudiant V1)
- API: dossiers d'inscription publics + upload pièces.
- API: ressources pédagogiques, travaux & rendus, justificatifs d'absence.
- API: demandes de documents + annonces / vie universitaire.
- API: endpoints étudiant (profil, documents, paiements Mobile Money, export planning).
- Web: nouvel espace étudiant (dashboard, planning, ressources, travaux, notes, présence, finances, documents, vie univ.).
- Web: page publique d'inscription + suivi dossier.

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

## 2026-03-07
Note (Backlog)
- Admin: ajouter un filtre "semestre" global pour retrouver notes, paiements, inscriptions, planning, messages, documents, presence.

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

Sprint 6 (Notes MVP)
- API: module Notes (matieres, evaluations, notes) + calculs de moyennes + audit log.
- UI: page Notes (matieres, evaluations, saisie notes, moyenne etudiant).
- Docs: `docs/notes.md`.
- Tests: `npm run test:coverage` OK (API 99.34% statements, 85.15% branches; Web 91.67% statements, 68.12% branches).
