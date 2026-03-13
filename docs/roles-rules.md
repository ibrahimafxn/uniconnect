# Règles de gestion par profil utilisateur

## Objectif

Définir les règles de gestion (RBAC) et les limites d’actions pour chaque
profil utilisateur en V1. Toute action sensible doit être tracée (audit log).

## Principes communs

- Toute création, modification ou suppression d’un compte utilisateur est une action sensible.
- Les données personnelles ne sont accessibles que selon le besoin métier (principe de moindre privilège).
- Les exports, suppressions massives, et changements de rôles sont journalisés.
- Les utilisateurs ne peuvent modifier que leurs propres informations non sensibles.
- Les accès sont restreints au périmètre de l’université (multi-tenant non prévu en V1).

## Super Administrateur

- Gère les rôles et permissions de tous les profils.
- Crée et révoque les comptes Administrateur / Scolarité.
- Accède à toutes les données et modules (administration, notes, planning, messagerie).
- Configure les paramètres critiques (sécurité, 2FA, politiques de mots de passe, journaux).
- Peut effectuer des actions de maintenance (archivage, purge, restauration).
- CRUD global sur la configuration, les rôles et les accès (avec audit log).

## Administrateur / Scolarité

Objectif: garantir la fiabilité des données administratives et pédagogiques,
dans un cadre de séparation des tâches inspiré des pratiques des grandes
universités françaises.

Sous-rôles possibles (exemples):
- Gestionnaire scolarité: pilotage global des campagnes IA/IP, validation finale.
- Agent d’inscription: contrôle des pièces et mise à jour des statuts IA.
- Agent examens: suivi des jurys, publication des notes/bulletins.
- Gestionnaire emplois du temps: création/ajustement des plannings.
- Gestionnaire finances: suivi des paiements et éditions de reçus/attestations.

Accès et périmètre:
- Accès aux données administratives et pédagogiques des étudiants de l’établissement.
- Pas d’accès aux paramètres de sécurité globaux ni aux rôles Super Admin.
- Accès aux notes/bulletins uniquement pour validation et publication.

Gestion des inscriptions:
- Valide les inscriptions administratives (IA) et les réinscriptions.
- Ouvre/ferme les campagnes d’inscription avec dates de début/fin.
- Contrôle des pièces justificatives et statuts (complet, incomplet, en attente).
- Historise les changements de statut d’inscription.
- CRUD sur dossiers étudiants administratifs (création limitée aux agents habilités).
- Lecture/édition des pièces justificatives, sans suppression définitive (archivage).

Gestion pédagogique:
- Affecte les étudiants aux formations, niveaux, groupes et parcours.
- Valide les inscriptions pédagogiques (IP) après IA validée.
- Gère les changements de groupe/TD/TP avec traçabilité.
- CRUD sur groupes, affectations, parcours (selon habilitation).

Paiements et documents:
- Suit l’état des paiements (échéances, impayés, régularisations).
- Génère les reçus et attestations administratives.
- Peut suspendre certaines actions (ex: inscription pédagogique) en cas d’impayé.
- CRUD sur plans d’échéances, modes de paiement, statuts de paiement.

Plannings:
- Crée, ajuste et publie les séances et emplois du temps.
- Modifie un planning publié uniquement avec justification et audit log.
- CRUD sur séances, salles, contraintes (conflits salle/enseignant/groupe).

Notes et bulletins:
- Vérifie la complétude des notes avant publication.
- Publie les notes/bulletins selon le calendrier académique.
- Peut rouvrir une saisie de notes avec justification.
- CRUD limité: lecture globale, édition de correction après jury, publication.

Conformité et audit:
- Toute action sensible (création compte, changement statut, publication) est tracée.
- Respecte le principe de moindre privilège et la RGPD (accès au besoin métier).
- Vocabulaire: IA (inscription administrative), IP (inscription pédagogique),
  jury/commission pédagogique, PV de jury, délibérations.

## Enseignant

Sous-rôles possibles (exemples):
- Enseignant titulaire: responsable d’UE, validation pédagogique.
- Responsable de module: supervision des évaluations d’un module.

Accès et périmètre:
- Accès aux cours et séances qui lui sont affectés.
- Accès aux informations pédagogiques nécessaires (listes d’étudiants, groupes, horaires).
- Pas d’accès aux données administratives (paiements, pièces justificatives).

Pédagogie et évaluations:
- Saisit et modifie les notes des étudiants de ses cours avant validation.
- Propose des corrections/ajustements avant jury (avec justification).
- Accède aux documents pédagogiques du module (syllabus, supports).
- CRUD limité sur évaluations de ses cours (création, mise à jour, suppression avant publication).

Messagerie:
- Accède à la messagerie avec les étudiants et l’administration.
- Peut créer des conversations de classe/groupe dans son périmètre.

## Intervenant externe

Sous-rôles possibles (exemples):
- Vacataire: enseignement ponctuel sur un module.
- Professionnel invité: intervention limitée et sans responsabilité d’UE.

Accès et périmètre:
- Accès uniquement aux cours et séances qui lui sont affectés.
- Accès aux listes d’étudiants strictement nécessaires à ses évaluations.
- Aucun accès aux dossiers administratifs et aux notes hors périmètre.

Évaluations:
- Saisit des notes ou évaluations sur son périmètre, si autorisé par la scolarité.
- CRUD limité sur évaluations de ses cours (création, mise à jour, suppression avant publication).
- Pas de publication finale (réservée à la scolarité).

Messagerie:
- Accède à la messagerie pour les échanges liés à ses cours.

## Étudiant

Sous-rôles possibles (exemples):
- Étudiant classique.
- Délégué de classe (droits additionnels validés par scolarité).

Accès et périmètre:
- Consulte son emploi du temps, ses cours et ses documents pédagogiques.
- Consulte ses notes et bulletins après publication.
- Accède à sa messagerie (enseignants, scolarité) dans les limites définies.
- Ne peut pas accéder aux notes ou informations d’autres étudiants.

Profil et données personnelles:
- Met à jour ses informations personnelles non sensibles (ex: téléphone, adresse).
- CRUD limité sur ses informations personnelles non sensibles.

Spécificités délégué (optionnel):
- Accès à des canaux de communication avec la scolarité.
- Pas d’accès aux données individuelles des autres étudiants.

## Matrice des permissions (V1)

Légende: `C`=Create, `R`=Read, `U`=Update, `D`=Delete, `P`=Publish, `A`=Assign/Affecter.

| Ressource | Super Admin | Admin/Scolarité | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|
| Utilisateurs (comptes) | CRUD | CRUD (Étudiant/Enseignant/Intervenant) | R (ses groupes) | R (ses groupes) | R (soi) / U (profil non sensible) |
| Rôles & permissions | CRUD | R | - | - | - |
| Structure académique (années, programmes) | CRUD | CRUD | R | R | R |
| Inscriptions admin (IA) | CRUD | CRUD | R (listes affectées) | R (listes affectées) | R (statut) |
| Inscriptions pédago (IP) | CRUD | CRUD | R (listes affectées) | R (listes affectées) | R (statut) |
| Groupes / affectations | CRUD | CRUD / A | R (ses groupes) | R (ses groupes) | R (son groupe) |
| Planning (séances, EDT) | CRUD | CRUD / P | R (ses séances) | R (ses séances) | R (son EDT) |
| Salles / ressources | CRUD | CRUD | R | R | R |
| Notes (saisie) | CRUD | R / P | CRUD (ses cours, avant P) | CRUD (ses cours, avant P) | R (après P) |
| Bulletins | CRUD / P | R / P | R (ses cours) | R (ses cours) | R (après P) |
| Documents admin (attestations) | CRUD | CRUD | R (selon besoin) | - | R (ses docs) |
| Paiements / échéances | CRUD | CRUD | - | - | R (statut) |
| Messagerie (conv./messages) | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | CRUD (périmètre) |
| Audit logs | CRUD | R | - | - | - |

Notes:
- Les permissions `CRUD` sont toujours limitées au périmètre de l’établissement.
- Toute publication (`P`) est journalisée et horodatée.
- Les suppressions sont logiques (archivage) pour les données sensibles.

## Détail par module (V1)

### Module Administration

| Ressource | Super Admin | Admin/Scolarité | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|
| Dossiers étudiants (admin) | CRUD | CRUD | R (listes affectées) | R (listes affectées) | R (soi) / U (profil non sensible) |
| Campagnes IA/IP | CRUD | CRUD | R | R | R (statut) |
| Pièces justificatives | CRUD | CRUD | R (si autorisé) | - | R (ses pièces) |
| Structure académique | CRUD | CRUD | R | R | R |
| Groupes / affectations | CRUD | CRUD / A | R (ses groupes) | R (ses groupes) | R (son groupe) |
| Utilisateurs (comptes) | CRUD | CRUD (Étudiant/Enseignant/Intervenant) | R (ses groupes) | R (ses groupes) | R (soi) |
| Rôles & permissions | CRUD | R | - | - | - |
| Audit logs | CRUD | R | - | - | - |

### Module Planning

| Ressource | Super Admin | Admin/Scolarité | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|
| Salles / ressources | CRUD | CRUD | R | R | R |
| Séances (EDT) | CRUD | CRUD / P | R (ses séances) | R (ses séances) | R (son EDT) |
| Conflits / contraintes | CRUD | CRUD | R (visualisation) | R (visualisation) | - |
| Publication planning | CRUD / P | CRUD / P | R | R | R |

### Module Notes & Bulletins

| Ressource | Super Admin | Admin/Scolarité | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|
| Matières / coefficients | CRUD | CRUD | R | R | R |
| Évaluations (création) | CRUD | CRUD | CRUD (ses cours) | CRUD (ses cours) | - |
| Notes (saisie) | CRUD | R / P | CRUD (ses cours, avant P) | CRUD (ses cours, avant P) | R (après P) |
| Bulletins | CRUD / P | R / P | R (ses cours) | R (ses cours) | R (après P) |
| Délibérations / PV de jury | CRUD | CRUD / P | R | R | R (résultat final) |

### Module Messagerie

| Ressource | Super Admin | Admin/Scolarité | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|
| Conversations 1-1 | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | CRUD (périmètre) |
| Conversations groupe | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | CRUD (périmètre) |
| Messages / pièces jointes | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | CRUD (périmètre) |
| Modération / signalement | CRUD | CRUD | R (signalement) | R (signalement) | R (signalement) |

### Module Finances

| Ressource | Super Admin | Admin/Scolarité | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|
| Config paiements (plans, modes) | CRUD | CRUD | - | - | - |
| Échéanciers / paiements | CRUD | CRUD | - | - | R (statut) |
| Reçus / attestations | CRUD | CRUD | R (si autorisé) | - | R (ses docs) |

Notes:
- Les opérations `D` sont logiques (archivage) pour étudiants, paiements et notes.
- Les publications (`P`) déclenchent notifications et audit log.
- Les périmètres d’accès sont limités aux groupes/cours affectés.

## Mapping RBAC → Endpoints (V1)

### Planning

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/planning/rooms` | Super Admin, Admin/Scolarité, Enseignant, Intervenant, Étudiant |
| `POST /api/planning/rooms` | Super Admin, Admin/Scolarité |
| `PATCH /api/planning/rooms/:id` | Super Admin, Admin/Scolarité |
| `DELETE /api/planning/rooms/:id` | Super Admin, Admin/Scolarité |
| `GET /api/planning/sessions` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre), Étudiant (son EDT) |
| `POST /api/planning/sessions` | Super Admin, Admin/Scolarité |
| `PATCH /api/planning/sessions/:id` | Super Admin, Admin/Scolarité |
| `DELETE /api/planning/sessions/:id` | Super Admin, Admin/Scolarité |

### Notes

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/notes/subjects` | Super Admin, Admin/Scolarité, Enseignant, Intervenant, Étudiant |
| `POST /api/notes/subjects` | Super Admin, Admin/Scolarité |
| `PATCH /api/notes/subjects/:id` | Super Admin, Admin/Scolarité |
| `DELETE /api/notes/subjects/:id` | Super Admin, Admin/Scolarité |
| `GET /api/notes/evaluations` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre) |
| `POST /api/notes/evaluations` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre) |
| `PATCH /api/notes/evaluations/:id` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre) |
| `GET /api/notes/groups/:id/students` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre) |
| `GET /api/notes/evaluations/:id/grades` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre) |
| `POST /api/notes/grades/bulk` | Super Admin, Admin/Scolarité, Enseignant (périmètre), Intervenant (périmètre) |
| `GET /api/notes/students/:id/summary` | Super Admin, Admin/Scolarité |
| `GET /api/notes/students/me/summary` | Étudiant |

### Messagerie

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/messages/conversations` | Tous (périmètre) |
| `POST /api/messages/conversations/direct` | Tous (périmètre) |
| `POST /api/messages/conversations/group` | Super Admin, Admin/Scolarité, Enseignant, Intervenant |
| `GET /api/messages/conversations/:id/messages` | Participants |
| `POST /api/messages/conversations/:id/messages` | Participants |
| `POST /api/messages/attachments?conversationId=...` | Participants |
| `GET /api/messages/attachments/:id/download` | Participants |

### Finances

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/payments/plans` | Super Admin, Admin/Scolarité |
| `POST /api/payments/plans` | Super Admin, Admin/Scolarité |
| `GET /api/payments` | Super Admin, Admin/Scolarité |
| `POST /api/payments` | Super Admin, Admin/Scolarité |
| `GET /api/payments/unpaid` | Super Admin, Admin/Scolarité |
| `GET /api/payments/:id/receipt` | Super Admin, Admin/Scolarité, Étudiant (son reçu) |

### Administration (Sprint 7)

| Endpoint | Accès recommandé |
|---|---|
| `GET/POST /admin/academic-years` | Super Admin, Admin/Scolarité |
| `GET/POST /admin/programs` | Super Admin, Admin/Scolarité |
| `POST /admin/students/import/preview` | Super Admin, Admin/Scolarité |
| `POST /admin/students/import/commit` | Super Admin, Admin/Scolarité |
| `GET /admin/students/import/:id` | Super Admin, Admin/Scolarité |
| `POST /admin/payment-configs` | Super Admin, Admin/Scolarité |
| `POST /admin/installment-plans` | Super Admin, Admin/Scolarité |
| `PATCH /admin/payment-methods/:id` | Super Admin, Admin/Scolarité |
| `GET/POST /admin/users` | Super Admin, Admin/Scolarité |
| `PATCH /admin/users/:id/roles` | Super Admin |
| `PATCH /admin/users/:id/status` | Super Admin, Admin/Scolarité |
| `GET /admin/dashboard` | Super Admin, Admin/Scolarité |
| `GET /admin/audit-logs` | Super Admin, Admin/Scolarité (R) |
| `GET /admin/reports/{payments,students,attendance}` | Super Admin, Admin/Scolarité |
| `PATCH /admin/config/:key` | Super Admin |
| `PATCH /admin/email-templates/:code` | Super Admin, Admin/Scolarité |

## Actions sensibles (audit log obligatoire)

- Création, suspension, suppression d’un utilisateur.
- Changement de rôle ou de statut d’un utilisateur.
- Publication ou modification de notes/bulletins.
- Modification d’un planning publié.
- Exports de données et opérations massives.

## Matrice de tests RBAC (scénarios V1)

Format: `Rôle` → `Endpoint` → `Attendu` → `Motif`.

### Planning

- Super Admin → `POST /api/planning/rooms` → 201 → Création salle autorisée.
- Enseignant → `POST /api/planning/rooms` → 403 → Création salle réservée admin.
- Étudiant → `GET /api/planning/sessions` → 200 → Accès à son EDT.
- Étudiant → `PATCH /api/planning/sessions/:id` → 403 → Modification planning interdite.

### Notes

- Enseignant → `POST /api/notes/evaluations` → 201 → Création évaluation sur ses cours.
- Enseignant → `PATCH /api/notes/evaluations/:id` (hors périmètre) → 403 → Périmètre restreint.
- Intervenant → `POST /api/notes/grades/bulk` → 201 → Saisie notes autorisée.
- Étudiant → `GET /api/notes/students/:id/summary` → 403 → Accès aux notes d’autrui interdit.
- Étudiant → `GET /api/notes/students/me/summary` → 200 → Accès à ses notes après publication.

### Messagerie

- Étudiant → `POST /api/messages/conversations/direct` → 201 → Création conversation 1-1 autorisée.
- Étudiant → `POST /api/messages/conversations/group` → 403 → Création groupe interdite.
- Enseignant → `POST /api/messages/conversations/group` → 201 → Groupe de classe autorisé.
- Intervenant → `GET /api/messages/conversations/:id/messages` (hors périmètre) → 403 → Accès limité aux participants.

### Finances

- Admin/Scolarité → `GET /api/payments/unpaid` → 200 → Accès impayés autorisé.
- Enseignant → `GET /api/payments` → 403 → Accès finances interdit.
- Étudiant → `GET /api/payments/:id/receipt` (son reçu) → 200 → Accès reçu autorisé.
- Étudiant → `GET /api/payments/:id/receipt` (autrui) → 403 → Accès reçu interdit.

### Administration

- Admin/Scolarité → `POST /admin/users` → 201 → Création comptes autorisée.
- Admin/Scolarité → `PATCH /admin/users/:id/roles` → 403 → Changement de rôle réservé Super Admin.
- Super Admin → `PATCH /admin/config/:key` → 200 → Modification config autorisée.
- Enseignant → `GET /admin/audit-logs` → 403 → Accès audit logs interdit.
