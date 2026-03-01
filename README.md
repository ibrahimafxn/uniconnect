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

## Couverture (fin de sprint)

```bash
npm run test:coverage
```

## Onboarding rapide

```bash
./scripts/setup.sh
```
