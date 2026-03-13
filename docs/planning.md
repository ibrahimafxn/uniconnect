# Module Planning (MVP)

## Objectif
Gestion des salles et des seances (EDT) avec detection de conflits simples.
Acces differencie par profil (admin/enseignant/etudiant).

## Fonctionnalites
- CRUD salles (admin/super admin).
- Creation/edition/suppression de seances (admin/super admin).
- Consultation des seances:
  - Admin: tous les filtres.
  - Enseignant/Intervenant: uniquement ses seances.
  - Etudiant: seances du groupe associe.
- Detection des conflits: salle, enseignant ou groupe sur une plage horaire.

## RBAC (reference)
Voir les regles detaillees et la matrice des permissions: `roles-rules.md`.

## Endpoints (API)
- `GET /api/planning/rooms`
- `POST /api/planning/rooms`
- `PATCH /api/planning/rooms/:id`
- `DELETE /api/planning/rooms/:id`
- `GET /api/planning/sessions`
- `POST /api/planning/sessions`
- `PATCH /api/planning/sessions/:id`
- `DELETE /api/planning/sessions/:id`

Query params `GET /sessions`:
- `dateFrom`, `dateTo`
- `groupId`, `teacherId`, `roomId`

## Regles de conflits
Conflit si chevauchement temporel sur une meme date pour:
- la meme salle
- le meme enseignant
- le meme groupe

## Audit log
Actions sensibles journalisees:
- `planning.room.create|update|delete`
- `planning.session.create|update|delete`

Champs principaux:
- acteur (`actorId`, `actorRole`, `actorEmail`)
- entite (`entity`, `entityId`)
- metadata (details utiles)
- `ip`, `userAgent`, `createdAt`

## Tests
- Unitaires service Planning + API.
- e2e minimal dans `apps/api/test/app.e2e-spec.ts`.
