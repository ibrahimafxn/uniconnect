# Sprint 7 — Pre-Launch Checklist

**Date de création**: 7 mars 2026  
**Date de démarrage prévue**: 22 juin 2026

---

## ✅ Documentation Complète

- [x] Plan de sprint créé (`SPRINT_7_PLAN.md`)
- [x] Résumé exécutif créé (`SPRINT_7_EXECUTIVE_SUMMARY.md`)
- [x] Guide de démarrage créé (`SPRINT_7_GETTING_STARTED.md`)
- [x] Architecture & schemas créés (`SPRINT_7_ARCHITECTURE.md`)
- [x] Doc module Administration créée (`docs/administration.md`)
- [x] Cas d'usage documentés (UC-A01 à A06 dans `docs/use-cases.md`)
- [ ] README principal mis à jour (Sprint 7 section)
- [ ] Trello board créé (`extras/sprint_7_trello.csv`)
- [ ] Swagger examples documentés

---

## 🏗️ Infrastructure & Environnement

### MongoDB
- [ ] MongoDB local installé (ou Atlas URI configurée)
- [ ] Connexion testée (`mongosh` ou compass)
- [ ] Collections précédentes fonctionnelles

### API (NestJS)
- [ ] Dernière version NestJS installée
- [ ] Dépendances à jour: `npm audit` clean
- [ ] `apps/api/.env.test` configuré
- [ ] `apps/api/.env` prêt (MONGO_URI, JWT, etc.)

### Frontend (Angular)
- [ ] Dernière version Angular installée
- [ ] Dépendances à jour
- [ ] `apps/web` prêt à démarrer

### Email (optionnel, mais recommandé pour tester)
- [ ] SMTP credentials prêts (Gmail, SendGrid, etc.)
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` documentés
- [ ] Variables dans `apps/api/.env`

---

## 🧪 Tests & Quality

- [ ] Derniers tests passent: `npm run test:coverage`
- [ ] Coverage actuel documenté (API: 99.34%, Web: 91.67%)
- [ ] Jest configuré correctement
- [ ] Mocks users/tokens prêts pour tests admin

---

## 📦 Dépendances Requis

### Backend
- [x] `@nestjs/*` (core, common, jwt, passport, swagger, mongoose)
- [ ] `xlsx` — Vérifier version et disponibilité
- [ ] `nodemailer` — Pour emails (déjà?)
- [ ] `pino` — Logging (déjà?)
- [ ] `class-validator` — DTOs (déjà?)
- [ ] `class-transformer` — DTOs (déjà?)

### Frontend
- [x] `@angular/*` (core, common, forms, http)
- [ ] `tailwindcss` — Styles (déjà?)
- [ ] `@ng-bootstrap/ng-bootstrap` — Optionnel pour modales

---

## 🔐 Sécurité & RBAC

- [ ] JWT tokens validés pour tous endpoints
- [ ] Guards RBAC implémentés (`RbacAdminGuard`, `RbacSuperAdminGuard`)
- [ ] SuperAdmin + Admin users créés en seed
- [ ] Rate limiting configuré (100 req/min par user)
- [ ] Helmet headers activés (si pas déjà)

---

## 📊 Data & Seeds

- [ ] Seed data académique prêt (years, programs, levels, offers, groups)
- [ ] Seed data admin users prêt (superadmin@uni.fr, admin@uni.fr)
- [ ] Seed data test prêt (pour tests e2e)
- [ ] Script: `npm run -w apps/api seed` fonctionnel
- [ ] Script: `npm run -w apps/api seed:admin` prêt (ou ajouter)

---

## 🔗 Integration avec Existant

### Modules existants à réutiliser
- [x] `AcademicModule` — Schemas déjà là ? (academic-year.schema.ts)
- [x] `UsersModule` — Pour User, Role, RBAC
- [x] `AuthModule` — JWT, Guards
- [x] `AuditModule` — AuditLog (à enrichir)
- [ ] `AcademicYear` model existant — Vérifier si compatible

### Migration
- [ ] Vérifier compatibilité schemas existants
- [ ] Pas de breaking changes prévus
- [ ] Migrations MongoDB si nécessaire

---

## 📝 Équipe & Rôles

- [ ] **Lead** assigné (architecture decisions)
- [ ] **Backend Dev(s)** assigné(s) (API, services, tests)
- [ ] **Frontend Dev(s)** assigné(s) (UI components, tests)
- [ ] **QA** assigné (tests e2e, validation)
- [ ] **Product Owner** assigné (clarifications métier)
- [ ] **Scrum Master** assigné (tracking, removals blocages)

---

## 📅 Calendar & Milestones

- [ ] Dates sprint verrouillées (22 juin → 13 juillet)
- [ ] Dates review/retrospective fixées
- [ ] Vacances de l'équipe documentées
- [ ] Buffer temps prévu pour imprévu

---

## 🚀 Go-Live Readiness

### Avant le lancement (15 juin)
- [ ] Toutes docs finalisées
- [ ] Environnements prêts
- [ ] Équipe en place
- [ ] Backlog ordonnancé (priorité UC-A01 > UC-A02 > UC-A03+)
- [ ] Stand-up daily configuré (heure, lieu/zoom)

### Jour 1 (22 juin)
- [ ] Sprint kick-off meeting
- [ ] Team capacités finalisées
- [ ] Premiers tickets en cours ("In Progress")
- [ ] Daily standup n°1

---

## 📞 Communication & Escalade

- [ ] Canal Slack dédié: `#sprint-7-admin`
- [ ] Adresses email support documentées
- [ ] Escalade process défini (blocage → lead → PO)
- [ ] Weekly demo meeting fixé (ex: vendredi 15h)

---

## 🎯 Success Criteria (Final)

Au bout des 4 semaines (13 juillet), on valide:

- [ ] **Coverage API >= 85%**
- [ ] **Coverage Web >= 75%**
- [ ] **Tous 30+ endpoints fonctionnels**
- [ ] **Tous tests e2e passent**
- [ ] **Aucun bug critique trouvé**
- [ ] **Docs complètes avec exemples**
- [ ] **Seed data fonctionnelle**
- [ ] **UI responsive (mobile + desktop)**

---

## 📋 Sign-Off

| Rôle | Nom | Date | Signature |
|---|---|---|---|
| Lead Dev | `_____` | `_____` | ✓ / ✗ |
| Product Owner | `_____` | `_____` | ✓ / ✗ |
| QA Lead | `_____` | `_____` | ✓ / ✗ |
| Scrum Master | `_____` | `_____` | ✓ / ✗ |

---

## 🔄 Reviews Ultérieures

- [ ] **1 jour avant launch** (21 juin): Review finale checklist
- [ ] **End of Sprint** (13 juillet): Validation Definition of Done
- [ ] **Post-Sprint** (20 juillet): Retrospective + améliorations

---

**Note**: Cette checklist est complétée progressivement. Remettre à jour le 20 juin 2026.

