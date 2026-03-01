# Sprint 4 Plan — Planning MVP

Date: 2026-03-01

Sprint window (Gantt): 2026-05-13 → 2026-05-25 (tests/docs to 2026-05-26)

## Objectifs
- Livrer un module Planning MVP: salles, seances (EDT), consultation par profil.
- Detecter les conflits simples de planning.
- Fournir UI + API + tests + docs conformes aux seuils existants.

## Scope (fonctionnel)
- Gestion des salles (CRUD + capacite).
- Creation d'EDT basique (seances, affectations).
- Consultation EDT par profil (admin/enseignant/etudiant).
- Detection de conflits simples (chevauchements).

## Livrables
- UI Planning (creation seances, liste, vue).
- API REST Planning (OpenAPI/Swagger).
- Tests unitaires + integration + e2e minimal.
- Documentation technique + fonctionnelle (README + doc module).

## Work Breakdown (aligned Gantt)
1. Structure academique (2026-05-13 → 2026-05-15)
2. Creation EDT basique (2026-05-16 → 2026-05-19)
3. Consultation EDT (2026-05-20 → 2026-05-22)
4. Gestion salles CRUD (2026-05-23 → 2026-05-24)
5. Detection conflits simple (2026-05-25)
6. Tests + doc planning (2026-05-26)

## Contraintes & Qualite
- Respect RBAC et audit log pour actions sensibles.
- Respect RGPD, TLS, securite des donnees.
- Couverture: seuils existants (voir Definition of Done).

## Risques/Dependances
- Qualite des donnees (groupes, enseignants, salles).
- Regles de conflits simplifiees (a clarifier avec metier).
