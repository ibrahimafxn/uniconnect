# Documentation — Module Administration

## Vue d'ensemble

Le module Administration fournit les fonctionnalités de gestion et de supervision de la plateforme Uniconnect. Il est réservé aux administrateurs (SuperAdmin, Admin) et structure la plateforme autour de :
- Structure académique (années, programmes, niveaux, offres, groupes).
- Gestion des utilisateurs et RBAC.
- Paiements et configurations.
- Supervision via audit logs et rapports.

## RBAC (reference)
Voir les regles detaillees et la matrice des permissions: `roles-rules.md`.

## Cas d'usage (UC-A01 à UC-A06)

### UC-A01 — Initialisation de l'année académique
**Acteur**: SuperAdmin, Admin  
**Objectif**: Créer et configurer une année académique avec ses filières, niveaux, offres et groupes.

#### Flux principal
1. Admin accède à **Admin > Structure Académique**.
2. Crée une **Année académique** (nom, dates début/fin).
3. Crée les **Filières** et **Niveaux**.
4. Crée les **Offres de formation** (Filière + Niveau + Année + capacité).
5. Crée les **Groupes** associés à chaque offre.
6. Active l'année (une seule active à la fois).

#### Données principales
```json
{
  "AcademicYear": {
    "name": "2026-2027",
    "startDate": "2026-09-01",
    "endDate": "2027-06-30",
    "isActive": true
  },
  "Program": {
    "name": "Informatique",
    "code": "INFO"
  },
  "Level": {
    "name": "Licence 1"
  },
  "ProgramOffer": {
    "programId": "...",
    "levelId": "...",
    "academicYearId": "...",
    "capacity": 50
  },
  "Group": {
    "name": "Groupe A",
    "offerId": "..."
  }
}
```

#### Endpoints API
- `POST /admin/academic-years` — Créer une année.
- `GET /admin/academic-years` — Lister années.
- `PATCH /admin/academic-years/:id` — Modifier année.
- `DELETE /admin/academic-years/:id` — Supprimer année (SuperAdmin only).
- `POST /admin/programs` — Créer filière.
- `GET /admin/programs` — Lister filières.
- `POST /admin/levels` — Créer niveau.
- `GET /admin/levels` — Lister niveaux.
- `POST /admin/offers` — Créer offre.
- `GET /admin/offers` — Lister offres.
- `POST /admin/groups` — Créer groupe.
- `GET /admin/groups` — Lister groupes.

#### RBAC
- **SuperAdmin**: CRUD complet + suppression + archivage.
- **Admin**: CRUD créations, modification, visualisation. Pas de suppression.

#### Audit
- `admin_created_academic_year`
- `admin_created_offer`
- `admin_activated_academic_year`

---

### UC-A02 — Import en masse d'étudiants
**Acteur**: SuperAdmin, Admin  
**Objectif**: Importer rapidement une liste d'étudiants depuis un fichier Excel.

#### Flux principal
1. Admin accède à **Admin > Étudiants > Import**.
2. Upload un fichier XLSX.
3. Système valide et affiche **aperçu + erreurs**.
4. Admin clique **Importer** pour confirmation.
5. Rapport d'import généré et téléchargeable.

#### Format fichier XLSX
```
| firstName | lastName | email | phoneNumber | groupId | dateOfBirth |
| Jean | Dupont | jean.dupont@etu.uni | +225123456 | GROUP_ID | 2005-06-15 |
| Marie | Martin | marie.martin@etu.uni | +225654321 | GROUP_ID | 2004-05-10 |
```

#### Endpoints API
- `POST /admin/students/import/preview` — Valider et afficher aperçu.
- `POST /admin/students/import/commit` — Confirmer import.
- `GET /admin/students/import/:id` — Télécharger rapport.
- `GET /admin/students/import/logs` — Historique imports.

#### Rapport d'import
```json
{
  "importId": "...",
  "totalLines": 150,
  "successCount": 145,
  "errorCount": 5,
  "errors": [
    { "lineNumber": 5, "email": "invalid@email", "reason": "Email invalide" },
    { "lineNumber": 12, "email": "duplicate@email", "reason": "Email déjà existant" }
  ],
  "generatedAt": "2026-06-22T10:30:00Z"
}
```

#### RBAC
- **SuperAdmin**: Import + modification + suppression.
- **Admin**: Import + modification. Pas de suppression.

#### Audit
- `admin_imported_students` (avec nombre et fichier hash)
- `admin_import_failed` (avec erreurs)

---

### UC-A03 — Paramétrage des paiements
**Acteur**: SuperAdmin, Admin  
**Objectif**: Configurer les frais, les modes et les plans de paiement.

#### Données principales
```json
{
  "PaymentConfig": {
    "offerId": "...",
    "academicYearId": "...",
    "totalCost": 500000, // CFA
    "description": "Frais d'inscription et scolarité"
  },
  "InstallmentPlan": {
    "paymentConfigId": "...",
    "numberOfInstallments": 4,
    "installments": [
      { "order": 1, "amount": 200000, "dueDate": "2026-09-01" },
      { "order": 2, "amount": 150000, "dueDate": "2026-11-01" },
      { "order": 3, "amount": 100000, "dueDate": "2027-01-01" },
      { "order": 4, "amount": 50000, "dueDate": "2027-03-01" }
    ]
  },
  "PaymentMethod": {
    "name": "Orange Money",
    "code": "ORANGE_MONEY",
    "isActive": true
  }
}
```

#### Endpoints API
- `POST /admin/payment-configs` — Créer config.
- `GET /admin/payment-configs` — Lister configs.
- `PATCH /admin/payment-configs/:id` — Modifier config.
- `POST /admin/installment-plans` — Créer plan.
- `PATCH /admin/installment-plans/:id` — Modifier plan.
- `GET /admin/payment-methods` — Lister modes.
- `PATCH /admin/payment-methods/:id` — Activer/désactiver.

#### RBAC
- **SuperAdmin**: CRUD complet.
- **Admin**: Lecture + modification. Pas de suppression de configs.

#### Audit
- `admin_created_payment_config`
- `admin_modified_installment_plan`
- `admin_toggled_payment_method`

---

### UC-A04 — Gestion des utilisateurs et RBAC
**Acteur**: SuperAdmin, Admin  
**Objectif**: Créer et gérer les comptes utilisateurs avec leurs rôles et permissions.

#### Données principales
```json
{
  "User": {
    "email": "john.doe@uni.fr",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["ADMIN", "TEACHER"],
    "status": "ACTIVE", // ACTIVE, SUSPENDED, DELETED
    "createdAt": "2026-03-07T10:00:00Z",
    "updatedAt": "2026-03-07T10:00:00Z"
  },
  "Role": {
    "code": "ADMIN",
    "permissions": [
      "admin:create_year",
      "admin:create_student",
      "admin:view_reports",
      "payments:configure"
    ]
  }
}
```

#### Endpoints API
- `POST /admin/users` — Créer utilisateur.
- `GET /admin/users` — Lister utilisateurs.
- `PATCH /admin/users/:id` — Modifier utilisateur.
- `PATCH /admin/users/:id/roles` — Assigner rôles.
- `PATCH /admin/users/:id/status` — Modifier statut (ACTIVE/SUSPENDED).
- `DELETE /admin/users/:id` — Supprimer (SuperAdmin only).
- `GET /admin/roles` — Lister rôles disponibles.

#### Rôles & Permissions
```
SUPER_ADMIN: Tous les droits
ADMIN: Gestion structure, utilisateurs, paiements (sauf suppression)
TEACHER: Consultation cours, saisie notes
STUDENT: Consultation personnelle
SCOLARITE: Gestion administrative (inscriptions, validations)
```

#### RBAC
- **SuperAdmin**: CRUD complet + suppression + modification rôles.
- **Admin**: CRUD utilisateurs (sauf suppression) + assignation rôles limités.

#### Audit
- `admin_created_user`
- `admin_modified_user_status`
- `admin_assigned_role_to_user`
- `admin_deleted_user`

---

### UC-A05 — Supervision & Rapports
**Acteur**: SuperAdmin, Admin  
**Objectif**: Monitorer l'activité et générer des rapports.

#### Dashboard Admin
- **KPIs rapides**: Nombre d'étudiants, paiements, taux de complétude, alertes.
- **Activités récentes**: Derniers imports, changements de statuts.
- **État de santé**: Erreurs, logs critiques, volumes de données.

#### Endpoints API
- `GET /admin/dashboard` — Récupérer KPIs.
- `GET /admin/audit-logs` — Lister logs d'audit (filtres: type, utilisateur, date).
- `GET /admin/audit-logs/export` — Exporter logs (CSV/JSON).
- `GET /admin/reports/payments` — Rapport paiements (par année, offre, statut).
- `GET /admin/reports/students` — Rapport étudiants (inscriptions, statuts).
- `GET /admin/reports/attendance` — Rapport assiduité (par groupe, module).
- `GET /admin/alerts` — Lister alertes actuelles.

#### Logs d'audit (exemples)
```json
{
  "id": "...",
  "actor": "admin@uni.fr",
  "action": "admin_imported_students",
  "resource": "StudentImport",
  "resourceId": "import_2026_06_22_01",
  "details": {
    "filename": "students_2026.xlsx",
    "successCount": 145,
    "errorCount": 5
  },
  "timestamp": "2026-06-22T10:30:00Z",
  "ipAddress": "192.168.1.100"
}
```

#### RBAC
- **SuperAdmin**: Tous logs + suppression + export.
- **Admin**: Lecture logs (filtrés par ses actions) + export.

---

### UC-A06 — Configurations globales
**Acteur**: SuperAdmin  
**Objectif**: Configurer les paramètres système et templates.

#### Données principales
```json
{
  "SystemConfig": {
    "key": "SMTP_HOST",
    "value": "smtp.gmail.com",
    "description": "Serveur SMTP pour envoi emails",
    "scope": "GLOBAL"
  },
  "EmailTemplate": {
    "code": "PAYMENT_CONFIRMATION",
    "subject": "Confirmation de paiement - {{academicYear}}",
    "body": "Cher {{studentName}}, votre paiement de {{amount}} CFA a été confirmé.",
    "variables": ["academicYear", "studentName", "amount"]
  }
}
```

#### Endpoints API
- `GET /admin/config` — Récupérer toutes configs.
- `PATCH /admin/config/:key` — Modifier config.
- `GET /admin/email-templates` — Lister templates.
- `PATCH /admin/email-templates/:code` — Modifier template.

#### Configurations clés
```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: notifications@uni.fr
SMTP_PASSWORD: ***
SUPPORT_EMAIL: support@uni.fr
PAYMENT_DEADLINE_WARNING_DAYS: 7
PAYMENT_OVERDUE_ALERT_DAYS: 30
```

#### RBAC
- **SuperAdmin**: CRUD complet.
- **Admin**: Lecture seule.

---

## Contraintes de Sécurité

### Authentication & Authorization
- Tous les endpoints requièrent un JWT valide.
- Vérification des rôles/permissions sur chaque requête.
- Sessions limitées à 24h, refresh token à 7 jours.

### Audit & Compliance
- Chaque action sensible loggée avec: utilisateur, action, ressource, timestamp, IP.
- Logs conservés 2 ans minimum (configurable).
- Export logs conformes RGPD (CSV/JSON chiffré).

### Data Protection
- Données sensibles (email, téléphone) masquées en logs.
- Uploads Excel validés (format, virus scan si possible).
- Suppression logique (soft delete) par défaut.

### API Rate Limiting
- 100 requêtes/minute par utilisateur.
- 1000 requêtes/heure par IP.
- Burst allowed: 200/10s (pour imports).

---

## Tests

### Tests Unitaires
- Validation inputs (formats, longueurs, obligatoires).
- Calculs (sommes, moyennes, totaux).
- Permissions (RBAC par endpoint).

### Tests d'Intégration
- Flux complets (création année → offres → groupes).
- Import Excel avec données réelles.
- Audit logs correctement enregistrés.

### Tests E2E
- Création d'une année + import d'étudiants + génération rapports.
- Gestion utilisateurs (CRUD + permissions).

### Coverage Target
- **API**: >= 85% (statements + branches).
- **Web**: >= 75% (statements + branches).

---

## Évolutions futures (V2+)

- Support des calendriers académiques personnalisés.
- Import multi-fichiers avec validation XSD.
- Webhooks pour notifications en temps réel.
- API webhooks for third-party integrations.
- Advanced reporting (BI, dashboards temps réel).
- Gestion des absences avec alertes parents.
- Sanctions/mesures disciplinaires.
