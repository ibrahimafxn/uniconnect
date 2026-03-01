# Sprint 3 Plan — Paiements MVP

Date: 2026-03-01

Sprint window (Gantt): 2026-04-29 → 2026-05-10 (tests/docs to 2026-05-12)

## Objectifs
- Mettre en production un module de paiements MVP: plans, echeances, reglements, impayes, recus, notifications.
- Fournir UI + API + tests + docs conformes aux seuils existants.

## Scope (fonctionnel)
- Modele paiements + echeances (plans simples).
- Enregistrement reglements (CRUD + validations).
- Tableau impayes (par etudiant).
- Recus PDF simples (generation basique).
- Notifications email basiques (confirmation paiement).

## Livrables
- UI admin Paiements (CRUD plans/reglements, impayes, recus).
- API REST Paiements (OpenAPI/Swagger).
- Tests unitaires + integration + e2e minimal.
- Documentation technique + fonctionnelle (README + doc module).

## Work Breakdown (aligned Gantt)
1. Modele paiements + echeances (2026-04-29 → 2026-05-01)
2. Enregistrement reglements (2026-05-02 → 2026-05-04)
3. Tableau impayes (2026-05-05 → 2026-05-06)
4. Recus PDF simples (2026-05-07 → 2026-05-08)
5. Notifications email basiques (2026-05-09 → 2026-05-10)
6. Tests + doc paiements (2026-05-11 → 2026-05-12)

## Contraintes & Qualite
- Respect RBAC et audit log pour actions sensibles.
- Respect RGPD, TLS, securite des donnees.
- Couverture: seuils existants (voir Definition of Done).

## Risques/Dependances
- Generation PDF: lib a choisir, temps d'integration.
- Envoi email: SMTP/service externe requis (config env).
- Donnees de seed coherentes pour tests e2e.

## Definition of Done (rappel)
- Fonctionnalite conforme aux specs V1.
- Tests unitaires + integration >= 80% couverture.
- Aucune faille critique/majeure.
- Documentation technique + fonctionnelle mise a jour.
