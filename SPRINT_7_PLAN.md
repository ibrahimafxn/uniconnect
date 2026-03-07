# Sprint 7 Plan — Administration MVP Complet

Date: 2026-03-07

Sprint window: 2026-06-22 → 2026-07-12 (tests/docs to 2026-07-13)

## Objectifs
- Livrer un module d'Administration universitaire MVP complet et robuste.
- Couvrir la gestion de la structure académique, des étudiants, des configurations et de la supervision.
- Fournir UI + API + tests + docs conformes aux seuils existants.

## Scope (fonctionnel)

### 1. Gestion de la Structure Académique (UC-A01)
- Création/modification années académiques (avec statut actif unique).
- Gestion des filières, niveaux, offres de formation.
- Création et organisation des groupes d'étudiants.
- Configuration des semestres.

### 2. Import en Masse des Étudiants (UC-A02)
- Import XLSX avec validation ligne par ligne.
- Prévisualisation des données avant confirmation.
- Rapport d'import avec erreurs et statuts.
- Rattachement automatique aux offres et groupes.

### 3. Paramétrage des Paiements (UC-A03)
- Configuration des frais par année/offre.
- Gestion des plans d'échéances et modes Mobile Money.
- Modes de paiement activables/désactivables.
- Audits des modifications.

### 4. Gestion des Utilisateurs & RBAC
- Création/modification des comptes admin, enseignants, étudiants.
- Attribution des rôles et permissions.
- Gestion des statuts utilisateurs (actif/suspendu/supprimé).
- Audit log des actions sensibles.

### 5. Supervision & Rapports
- Dashboard d'administration (KPIs rapides).
- Rapports d'activité par module (paiements, notes, présences).
- Logs d'audit consultables et filtres.
- Alertes/notifications admin (incidents, statuts critiques).

### 6. Gestion des Configurations Globales
- Variables d'environnement UI (SMTP, URLs, contacts support).
- Paramètres système (délais, seuils, politiques).
- Templates d'emails configurables.
- Gestion des sauvegardes et maintenances.

## Livrables
- UI Admin complète (dashboard, structure, utilisateurs, paiements, rapports, config).
- API REST Administration (OpenAPI/Swagger tags "Administration").
- Tests unitaires + intégration + e2e minimal (>80% couverture).
- Documentation technique + fonctionnelle (README + doc module).
- Scripts de seed et migration pour données admin.

## Work Breakdown (aligned Gantt)

### Semaine 1 (2026-06-22 → 2026-06-26)
1. Structure académique API (années, filières, niveaux, offres, groupes) — 4j
2. Tests unitaires + intégration pour structure académique — 1j

### Semaine 2 (2026-06-29 → 2026-07-03)
3. Import XLSX (API + upload, prévisualisation, validation, rapport) — 3j
4. Gestion utilisateurs API (CRUD, RBAC, statuts) — 2j

### Semaine 3 (2026-07-06 → 2026-07-10)
5. Paramétrage paiements API — 2j
6. Supervision & rapports API (dashboard, logs, alertes) — 2j
7. Tests unitaires + intégration complets — 1j

### Semaine 4 (2026-07-13)
8. UI Admin (tous modules) — 3j
9. Tests e2e + doc administration — 1j

## Contraintes & Qualité
- Respect strict RBAC: AdminRole peut créer/modifier structure, SuperAdmin seul peut supprimer.
- Audit log systématique pour: création année, import étudiants, modification paiements, changements utilisateurs.
- Sécurité: validation inputs, sanitization fichiers Excel, protection endpoints.
- Respect RGPD: masquage données sensibles en logs, consentements, droit à l'oubli.
- TLS + encryption données à repos (MongoDB encryption).
- Couverture tests: >80% (API statements + branches).

## Risques/Dépendances
- Qualité/format des fichiers Excel pour imports (=> validation stricte + doc).
- Taille des imports (optimisation requêtes, pagination).
- Permissions croisées (admin vs scolarité) — à clarifier.
- Rapports volumineux (cache + pagination).

## Definition of Done
- ✓ Fonctionnalité conforme aux specs (UC-A01 à UC-A06).
- ✓ Tests unitaires + intégration >= 80% couverture.
- ✓ Aucune faille critique/majeure.
- ✓ Documentation technique + fonctionnelle à jour.
- ✓ Audit log activé et testé.
- ✓ API Swagger tags "Administration" présents.
- ✓ Seed data d'administration crée + testée.

## Métriques de Succès
- Coverage global: API >= 85%, Web >= 75%.
- Tous tests e2e passent.
- Aucun bug critique trouvé en recette.
- Documentation lisible + complète.

