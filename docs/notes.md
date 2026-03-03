# Module Notes (MVP)

## Objectif
Saisie des notes par groupe et consultation des moyennes par etudiant.

## Fonctionnalites
- CRUD des matieres (admin).
- Creation des evaluations par groupe/matiere.
- Saisie des notes (bulk) par evaluation.
- Vue resume etudiant (moyenne par matiere + moyenne generale).

## Endpoints (API)
- `GET /api/notes/subjects?levelId=...`
- `POST /api/notes/subjects`
- `PATCH /api/notes/subjects/:id`
- `DELETE /api/notes/subjects/:id`
- `GET /api/notes/evaluations?groupId=...&subjectId=...`
- `POST /api/notes/evaluations`
- `PATCH /api/notes/evaluations/:id`
- `GET /api/notes/groups/:id/students`
- `GET /api/notes/evaluations/:id/grades`
- `POST /api/notes/grades/bulk`
- `GET /api/notes/students/:id/summary`
- `GET /api/notes/students/me/summary`

## Regles d'acces
- Admin/SuperAdmin: tout.
- Enseignant/Intervenant: evaluations + notes + consultation.
- Etudiant: resume personnel uniquement.

## Calcul moyenne
- Moyenne matiere: moyenne des notes normalisees sur 20.
- Moyenne generale: moyenne ponderee par coefficient.

## Tests
- Unitaires NotesService.
- E2E: creation matiere/evaluation + saisie notes + resume.
