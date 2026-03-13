# Règles de gestion par profil utilisateur

## Objectif

Définir les règles de gestion (RBAC) et les limites d'actions pour chaque
profil utilisateur en V1. Toute action sensible doit être tracée (audit log).

## Principes communs

- Toute création, modification ou suppression d'un compte utilisateur est une action sensible.
- Les données personnelles ne sont accessibles que selon le besoin métier (principe de moindre privilège).
- Les exports, suppressions massives, et changements de rôles sont journalisés.
- Les utilisateurs ne peuvent modifier que leurs propres informations non sensibles.
- Les accès sont restreints au périmètre de l'université (multi-tenant non prévu en V1).
- Les données administratives (statut IA, paiements, pièces) sont strictement séparées des données pédagogiques.

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
- Agent d'inscription: contrôle des pièces et mise à jour des statuts IA.
- Agent examens: réception des PV de jury, publication officielle des notes/bulletins.
- Gestionnaire emplois du temps: création/ajustement des plannings.
- Gestionnaire finances: suivi des paiements et éditions de reçus/attestations.

Accès et périmètre:
- Accès aux données administratives et pédagogiques des étudiants de l'établissement.
- Pas d'accès aux paramètres de sécurité globaux ni aux rôles Super Admin.
- Accès aux notes/bulletins uniquement pour publication après réception du PV de jury validé.

Gestion des inscriptions:
- Valide les inscriptions administratives (IA) et les réinscriptions.
- Ouvre/ferme les campagnes d'inscription avec dates de début/fin.
- Contrôle des pièces justificatives et statuts (complet, incomplet, en attente).
- Historise les changements de statut d'inscription.
- CRUD sur dossiers étudiants administratifs (création limitée aux agents habilités).
- Lecture/édition des pièces justificatives, sans suppression définitive (archivage).

Gestion pédagogique:
- Affecte les étudiants aux formations, niveaux, groupes et parcours.
- Valide les inscriptions pédagogiques (IP) après IA validée.
- Gère les changements de groupe/TD/TP avec traçabilité.
- CRUD sur groupes, affectations, parcours (selon habilitation).

Paiements et documents:
- Suit l'état des paiements (échéances, impayés, régularisations).
- Génère les reçus et attestations administratives.
- Peut suspendre certaines actions (ex: inscription pédagogique) en cas d'impayé.
- CRUD sur plans d'échéances, modes de paiement, statuts de paiement.

Plannings:
- Crée, ajuste et publie les séances et emplois du temps.
- Modifie un planning publié uniquement avec justification et audit log.
- CRUD sur séances, salles, contraintes (conflits salle/enseignant/groupe).

Notes et bulletins:
- Publie officiellement les notes/bulletins après validation par le jury (PV reçu).
- Peut rouvrir une saisie de notes sur demande du Responsable de formation avec justification.
- Lecture globale des notes pour contrôle de complétude avant jury.
- Ne modifie pas directement les notes — rôle de publication uniquement.

Conformité et audit:
- Toute action sensible (création compte, changement statut, publication) est tracée.
- Respecte le principe de moindre privilège et la RGPD (accès au besoin métier).
- Vocabulaire: IA (inscription administrative), IP (inscription pédagogique),
  jury/commission pédagogique, PV de jury, délibérations.

## Responsable de formation

Objectif: piloter pédagogiquement une formation (licence, master, parcours).
Rôle distinct de la scolarité — responsabilité pédagogique et juridique sur les résultats.

Sous-rôles possibles (exemples):
- Directeur des études: pilotage global d'un département ou d'une UFR.
- Responsable de licence / master: validation des résultats d'une formation.
- Président de jury: arrête officiellement les résultats lors des délibérations.

Accès et périmètre:
- Accès aux données pédagogiques (notes, évaluations, bulletins) de sa formation.
- Accès aux listes d'étudiants de sa formation (pas aux données administratives sensibles).
- Pas d'accès aux données financières (paiements, pièces justificatives).

Gestion pédagogique:
- Valide les notes saisies par les enseignants avant délibération.
- Préside et anime les jurys de délibération.
- Arrête les résultats et produit (ou valide) le PV de jury.
- Peut rouvrir une saisie de notes avec justification (soumis à accord scolarité).
- CRUD sur évaluations de sa formation (supervision globale).

Plannings:
- Lecture du planning de sa formation.
- Peut demander des ajustements à la scolarité (pas de modification directe).

Messagerie:
- Accède à la messagerie avec les enseignants, intervenants et la scolarité.
- Peut créer des conversations de groupe dans le périmètre de sa formation.

## Enseignant

Sous-rôles possibles (exemples):
- Enseignant titulaire: responsable d'UE, validation pédagogique.
- Responsable de module: supervision des évaluations d'un module.

Accès et périmètre:
- Accès aux cours et séances qui lui sont affectés.
- Accès aux listes d'étudiants (noms, prénoms, emails) de ses groupes uniquement.
- Pas d'accès aux données administratives (paiements, statut IA, pièces justificatives).
- Ne voit pas le statut d'inscription administrative d'un étudiant.

Pédagogie et évaluations:
- Saisit et modifie les notes des étudiants de ses cours avant validation par le jury.
- Propose des corrections/ajustements avant délibération (avec justification).
- Accède aux documents pédagogiques du module (syllabus, supports).
- CRUD limité sur évaluations de ses cours (création, mise à jour, suppression avant jury).

Messagerie:
- Accède à la messagerie avec les étudiants de ses groupes et l'administration.
- Peut créer des conversations de classe/groupe dans son périmètre.

## Intervenant externe

Sous-rôles possibles (exemples):
- Vacataire: enseignement ponctuel sur un module, sous supervision d'un titulaire.
- Professionnel invité: intervention limitée et sans responsabilité d'UE.

Accès et périmètre:
- Accès uniquement aux cours et séances qui lui sont affectés.
- Accès aux listes d'étudiants (noms uniquement, pas d'emails ni de données personnelles)
  strictement nécessaires à ses évaluations, si autorisé par la scolarité.
- Aucun accès aux dossiers administratifs, paiements et notes hors périmètre.

Évaluations:
- Peut saisir des notes sur son périmètre uniquement si explicitement autorisé par
  le Responsable de formation ou la scolarité.
- Création et mise à jour de notes uniquement — pas de suppression, pas de publication.
- Toute saisie est supervisée par l'enseignant titulaire responsable de l'UE.

Messagerie:
- Accède à la messagerie pour les échanges liés à ses cours (enseignant titulaire, scolarité).
- Pas de création de conversations de groupe.

## Étudiant

Sous-rôles possibles (exemples):
- Étudiant classique.
- Délégué de classe (droits additionnels validés par scolarité).

Accès et périmètre:
- Consulte son emploi du temps, ses cours et ses documents pédagogiques.
- Consulte ses notes et bulletins uniquement après publication officielle par la scolarité.
- Accède à sa messagerie dans les limites définies (enseignants de ses cours, scolarité).
- Ne peut pas accéder aux notes ou informations d'autres étudiants.

Profil et données personnelles:
- Met à jour ses informations personnelles non sensibles (ex: téléphone, adresse).
- CRUD limité sur ses informations personnelles non sensibles.

Messagerie:
- Peut contacter un enseignant de son cours (conversation 1-1 uniquement).
- Peut contacter la scolarité.
- Ne peut pas créer de conversations de groupe.

Spécificités délégué:
- Peut créer des conversations de groupe avec la scolarité pour sa promotion.
- Accès à des canaux officiels de communication avec la scolarité et le Responsable de formation.
- Pas d'accès aux données individuelles des autres étudiants.

## Matrice des permissions (V1)

Légende: `C`=Create, `R`=Read, `U`=Update, `D`=Delete, `P`=Publish, `A`=Assign/Affecter, `V`=Valider.

| Ressource | Super Admin | Admin/Scolarité | Resp. Formation | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|---|
| Utilisateurs (comptes) | CRUD | CRUD (Étudiant/Enseignant/Intervenant) | R (sa formation) | R (ses groupes — noms) | R (ses séances — noms) | R (soi) / U (profil non sensible) |
| Rôles & permissions | CRUD | R | - | - | - | - |
| Structure académique (années, programmes) | CRUD | CRUD | R | R | R | R |
| Inscriptions admin (IA) | CRUD | CRUD | - | - | - | R (statut) |
| Inscriptions pédago (IP) | CRUD | CRUD | R (sa formation) | R (ses groupes) | - | R (statut) |
| Groupes / affectations | CRUD | CRUD / A | R (sa formation) | R (ses groupes) | R (ses séances) | R (son groupe) |
| Planning (séances, EDT) | CRUD | CRUD / P | R (sa formation) | R (ses séances) | R (ses séances) | R (son EDT) |
| Salles / ressources | CRUD | CRUD | R | R | R | R |
| Notes (saisie) | CRUD | R / P | CRUD / V (sa formation) | CRUD (ses cours, avant jury) | CU (ses cours, si autorisé) | R (après P) |
| Jury / délibérations | CRUD | R / P | CRUD / V / P (sa formation) | R (ses cours) | - | R (résultat final) |
| Bulletins | CRUD / P | P (après PV jury) | V / R (sa formation) | R (ses cours) | - | R (après P) |
| Documents admin (attestations) | CRUD | CRUD | - | - | - | R (ses docs) |
| Paiements / échéances | CRUD | CRUD | - | - | - | R (statut) |
| Messagerie (conv./messages) | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | R / C 1-1 (périmètre) | C 1-1 / R (périmètre) |
| Audit logs | CRUD | R | - | - | - | - |

Notes:
- Les permissions `CRUD` sont toujours limitées au périmètre de l'établissement.
- Toute publication (`P`) est journalisée et horodatée.
- Les suppressions sont logiques (archivage) pour les données sensibles.
- L'accès aux données administratives (IA, paiements) est strictement interdit aux enseignants et intervenants.

## Flux de validation des notes (conforme universités françaises)

```
1. Enseignant / Intervenant autorisé
   → saisit les notes (CRUD avant jury)

2. Responsable de formation
   → vérifie la complétude et la cohérence
   → valide les notes avant délibération

3. Jury (présidé par le Responsable de formation)
   → délibère et arrête officiellement les résultats
   → produit le PV de jury signé

4. Scolarité (Admin/Scolarité)
   → réceptionne le PV de jury
   → publie officiellement les notes et bulletins
   → notifie les étudiants

5. Étudiant
   → consulte ses résultats après publication officielle
```

## Détail par module (V1)

### Module Administration

| Ressource | Super Admin | Admin/Scolarité | Resp. Formation | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|---|
| Dossiers étudiants (admin) | CRUD | CRUD | - | - | - | R (soi) / U (profil non sensible) |
| Campagnes IA/IP | CRUD | CRUD | R (IP sa formation) | - | - | R (statut) |
| Pièces justificatives | CRUD | CRUD | - | - | - | R (ses pièces) |
| Structure académique | CRUD | CRUD | R | R | R | R |
| Groupes / affectations | CRUD | CRUD / A | R (sa formation) | R (ses groupes) | R (ses séances) | R (son groupe) |
| Utilisateurs (comptes) | CRUD | CRUD (Étudiant/Enseignant/Intervenant) | R (sa formation) | R (ses groupes — noms) | - | R (soi) |
| Rôles & permissions | CRUD | R | - | - | - | - |
| Audit logs | CRUD | R | - | - | - | - |

### Module Planning

| Ressource | Super Admin | Admin/Scolarité | Resp. Formation | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|---|
| Salles / ressources | CRUD | CRUD | R | R | R | R |
| Séances (EDT) | CRUD | CRUD / P | R (sa formation) | R (ses séances) | R (ses séances) | R (son EDT) |
| Conflits / contraintes | CRUD | CRUD | R (visualisation) | R (visualisation) | - | - |
| Publication planning | CRUD / P | CRUD / P | R | R | R | R |

### Module Notes & Bulletins

| Ressource | Super Admin | Admin/Scolarité | Resp. Formation | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|---|
| Matières / coefficients | CRUD | CRUD | R | R | R | R |
| Évaluations (création) | CRUD | CRUD | CRUD (sa formation) | CRUD (ses cours) | CU (si autorisé) | - |
| Notes (saisie) | CRUD | R | CRUD / V (sa formation) | CRUD (ses cours, avant jury) | CU (si autorisé) | R (après P) |
| Jury / délibérations | CRUD | R / P | CRUD / V / P | R (ses cours) | - | R (résultat final) |
| Bulletins | CRUD / P | P (après PV jury) | V / R | R (ses cours) | - | R (après P) |
| PV de jury | CRUD | R / archive | CRUD / P | R | - | - |

### Module Messagerie

| Ressource | Super Admin | Admin/Scolarité | Resp. Formation | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|---|
| Conversations 1-1 | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | C/R (périmètre) | C/R (périmètre) |
| Conversations groupe | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | - | R / C (délégué uniquement) |
| Messages / pièces jointes | CRUD | CRUD | CRUD (périmètre) | CRUD (périmètre) | CRUD (périmètre) | CRUD (périmètre) |
| Modération / signalement | CRUD | CRUD | R (signalement) | R (signalement) | R (signalement) | R (signalement) |

### Module Finances

| Ressource | Super Admin | Admin/Scolarité | Resp. Formation | Enseignant | Intervenant | Étudiant |
|---|---|---|---|---|---|---|
| Config paiements (plans, modes) | CRUD | CRUD | - | - | - | - |
| Échéanciers / paiements | CRUD | CRUD | - | - | - | R (statut) |
| Reçus / attestations | CRUD | CRUD | - | - | - | R (ses docs) |

Notes:
- Les opérations `D` sont logiques (archivage) pour étudiants, paiements et notes.
- Les publications (`P`) déclenchent notifications et audit log.
- Les périmètres d'accès sont limités aux groupes/cours affectés.

## Mapping RBAC → Endpoints (V1)

### Planning

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/planning/rooms` | Tous les rôles |
| `POST /api/planning/rooms` | Super Admin, Admin/Scolarité |
| `PATCH /api/planning/rooms/:id` | Super Admin, Admin/Scolarité |
| `DELETE /api/planning/rooms/:id` | Super Admin, Admin/Scolarité |
| `GET /api/planning/sessions` | Tous (filtré par périmètre) |
| `POST /api/planning/sessions` | Super Admin, Admin/Scolarité |
| `PATCH /api/planning/sessions/:id` | Super Admin, Admin/Scolarité |
| `DELETE /api/planning/sessions/:id` | Super Admin, Admin/Scolarité |

### Notes

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/notes/subjects` | Tous les rôles |
| `POST /api/notes/subjects` | Super Admin, Admin/Scolarité |
| `PATCH /api/notes/subjects/:id` | Super Admin, Admin/Scolarité |
| `DELETE /api/notes/subjects/:id` | Super Admin, Admin/Scolarité |
| `GET /api/notes/evaluations` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant (périmètre), Intervenant (périmètre) |
| `POST /api/notes/evaluations` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant (périmètre), Intervenant (si autorisé) |
| `PATCH /api/notes/evaluations/:id` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant (périmètre), Intervenant (si autorisé) |
| `GET /api/notes/groups/:id/students` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant (périmètre), Intervenant (périmètre) |
| `GET /api/notes/evaluations/:id/grades` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant (périmètre) |
| `POST /api/notes/grades/bulk` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant (périmètre), Intervenant (si autorisé) |
| `GET /api/notes/students/:id/summary` | Super Admin, Admin/Scolarité, Resp. Formation |
| `GET /api/notes/students/me/summary` | Étudiant (après publication) |

### Messagerie

| Endpoint | Accès recommandé |
|---|---|
| `GET /api/messages/conversations` | Tous (périmètre) |
| `POST /api/messages/conversations/direct` | Tous (périmètre restreint selon rôle) |
| `POST /api/messages/conversations/group` | Super Admin, Admin/Scolarité, Resp. Formation, Enseignant, Délégué de classe |
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

- Création, suspension, suppression d'un utilisateur.
- Changement de rôle ou de statut d'un utilisateur.
- Validation et publication des notes/bulletins (chaque étape du flux jury).
- Arrêté de jury et signature du PV.
- Modification d'un planning publié.
- Exports de données et opérations massives.
- Réouverture d'une saisie de notes après validation.

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
- Intervenant → `POST /api/notes/grades/bulk` → 201 → Saisie notes autorisée (si autorisé par resp. formation).
- Intervenant → `POST /api/notes/grades/bulk` (sans autorisation) → 403 → Saisie non autorisée.
- Responsable formation → `POST /api/notes/grades/bulk` (validation) → 200 → Validation jury autorisée.
- Étudiant → `GET /api/notes/students/:id/summary` → 403 → Accès aux notes d'autrui interdit.
- Étudiant → `GET /api/notes/students/me/summary` → 200 → Accès à ses notes après publication.
- Enseignant → `GET /api/notes/students/:id/summary` (hors périmètre) → 403 → Données admin réservées.

### Messagerie

- Étudiant → `POST /api/messages/conversations/direct` → 201 → Conversation 1-1 avec enseignant de son cours.
- Étudiant → `POST /api/messages/conversations/group` → 403 → Création groupe interdite (sauf délégué).
- Enseignant → `POST /api/messages/conversations/group` → 201 → Groupe de classe autorisé.
- Intervenant → `POST /api/messages/conversations/group` → 403 → Création groupe interdite.
- Intervenant → `GET /api/messages/conversations/:id/messages` (hors périmètre) → 403 → Accès limité aux participants.

### Finances

- Admin/Scolarité → `GET /api/payments/unpaid` → 200 → Accès impayés autorisé.
- Enseignant → `GET /api/payments` → 403 → Accès finances interdit.
- Responsable formation → `GET /api/payments` → 403 → Accès finances interdit.
- Étudiant → `GET /api/payments/:id/receipt` (son reçu) → 200 → Accès reçu autorisé.
- Étudiant → `GET /api/payments/:id/receipt` (autrui) → 403 → Accès reçu interdit.

### Administration

- Admin/Scolarité → `POST /admin/users` → 201 → Création comptes autorisée.
- Admin/Scolarité → `PATCH /admin/users/:id/roles` → 403 → Changement de rôle réservé Super Admin.
- Super Admin → `PATCH /admin/config/:key` → 200 → Modification config autorisée.
- Enseignant → `GET /admin/audit-logs` → 403 → Accès audit logs interdit.
- Responsable formation → `GET /admin/audit-logs` → 403 → Accès audit logs interdit.
