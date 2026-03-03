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

## Couverture (fin de sprint)

```bash
npm run test:coverage
```

## Onboarding rapide

```bash
./scripts/setup.sh
```
