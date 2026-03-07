# Sprint 7 — API Examples & Postman Collection

## 🔑 Authentication

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uni.fr",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@uni.fr",
    "roles": ["ADMIN"]
  }
}
```

### Headers pour appels authentifiés
```
Authorization: Bearer eyJhbGc...
Content-Type: application/json
```

---

## 📚 UC-A01 — Structure Académique

### 1.1 Créer une Année Académique
```bash
curl -X POST http://localhost:3000/api/admin/academic-years \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2026-2027",
    "startDate": "2026-09-01",
    "endDate": "2027-06-30",
    "isActive": true
  }'
```

**Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "name": "2026-2027",
  "startDate": "2026-09-01T00:00:00Z",
  "endDate": "2027-06-30T00:00:00Z",
  "isActive": true,
  "createdAt": "2026-06-22T10:30:00Z"
}
```

### 1.2 Lister les Années Académiques
```bash
curl -X GET "http://localhost:3000/api/admin/academic-years?isActive=true&limit=10&offset=0" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "2026-2027",
      "isActive": true,
      "startDate": "2026-09-01T00:00:00Z",
      "endDate": "2027-06-30T00:00:00Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### 1.3 Créer une Filière
```bash
curl -X POST http://localhost:3000/api/admin/programs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "INFO",
    "name": "Informatique",
    "description": "Filière Informatique - Système et Réseaux"
  }'
```

### 1.4 Créer un Niveau
```bash
curl -X POST http://localhost:3000/api/admin/levels \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "L1",
    "name": "Licence 1",
    "order": 1
  }'
```

### 1.5 Créer une Offre de Formation
```bash
curl -X POST http://localhost:3000/api/admin/program-offers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "507f1f77bcf86cd799439013",
    "levelId": "507f1f77bcf86cd799439014",
    "academicYearId": "507f1f77bcf86cd799439012",
    "capacity": 50,
    "description": "Informatique L1 - Année 2026-2027"
  }'
```

### 1.6 Créer un Groupe
```bash
curl -X POST http://localhost:3000/api/admin/groups \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Groupe A",
    "offerId": "507f1f77bcf86cd799439015",
    "description": "Groupe A - Informatique L1"
  }'
```

---

## 👥 UC-A02 — Import Étudiants

### 2.1 Prévisualisation Import (Upload fichier)
```bash
curl -X POST http://localhost:3000/api/admin/students/import/preview \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@students_list.xlsx"
```

**Response (200):**
```json
{
  "importId": "import_2026_06_22_001",
  "filename": "students_list.xlsx",
  "totalLines": 150,
  "preview": [
    {
      "lineNumber": 1,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@etu.uni",
      "phoneNumber": "+225123456789",
      "groupId": "507f1f77bcf86cd799439015",
      "status": "OK"
    },
    {
      "lineNumber": 2,
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie.martin@etu.uni",
      "phoneNumber": "+225987654321",
      "groupId": "507f1f77bcf86cd799439015",
      "status": "ERROR",
      "reason": "Email format invalide"
    }
  ],
  "successCount": 148,
  "errorCount": 2,
  "errors": [
    {
      "lineNumber": 2,
      "field": "email",
      "value": "invalid_email",
      "reason": "Format email invalide"
    },
    {
      "lineNumber": 15,
      "field": "email",
      "value": "duplicate@uni.fr",
      "reason": "Email déjà existant en base"
    }
  ]
}
```

### 2.2 Confirmer Import
```bash
curl -X POST http://localhost:3000/api/admin/students/import/commit \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "importId": "import_2026_06_22_001"
  }'
```

**Response (200):**
```json
{
  "importId": "import_2026_06_22_001",
  "status": "SUCCESS",
  "totalLines": 150,
  "successCount": 148,
  "errorCount": 2,
  "createdStudentCount": 148,
  "skippedCount": 2,
  "reportPath": "/reports/import_2026_06_22_001.csv",
  "completedAt": "2026-06-22T10:45:00Z"
}
```

### 2.3 Télécharger Rapport
```bash
curl -X GET http://localhost:3000/api/admin/students/import/import_2026_06_22_001/report \
  -H "Authorization: Bearer TOKEN" \
  -o report.csv
```

**Contenu rapport (CSV):**
```
lineNumber,firstName,lastName,email,phoneNumber,status,reason
1,Jean,Dupont,jean.dupont@etu.uni,+225123456789,SUCCESS,
2,Marie,Martin,marie.martin@etu.uni,+225987654321,ERROR,"Email format invalide"
3,Paul,Durand,paul.durand@etu.uni,+225111111111,SUCCESS,
...
```

---

## 💰 UC-A03 — Paramétrage Paiements

### 3.1 Créer Configuration Paiements
```bash
curl -X POST http://localhost:3000/api/admin/payment-configs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "507f1f77bcf86cd799439015",
    "academicYearId": "507f1f77bcf86cd799439012",
    "totalCost": 500000,
    "description": "Frais d\'inscription et scolarité 2026-2027",
    "isActive": true
  }'
```

### 3.2 Créer Plan d'Échéances
```bash
curl -X POST http://localhost:3000/api/admin/installment-plans \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentConfigId": "507f1f77bcf86cd799439020",
    "numberOfInstallments": 4,
    "installments": [
      {
        "order": 1,
        "amount": 200000,
        "dueDate": "2026-09-01",
        "description": "1ère échéance - Inscription"
      },
      {
        "order": 2,
        "amount": 150000,
        "dueDate": "2026-11-01",
        "description": "2ème échéance"
      },
      {
        "order": 3,
        "amount": 100000,
        "dueDate": "2027-01-01",
        "description": "3ème échéance"
      },
      {
        "order": 4,
        "amount": 50000,
        "dueDate": "2027-03-01",
        "description": "4ème échéance (solde)"
      }
    ]
  }'
```

### 3.3 Activer/Désactiver Mode Paiement
```bash
curl -X PATCH http://localhost:3000/api/admin/payment-methods/ORANGE_MONEY \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'
```

---

## 👤 UC-A04 — Gestion Utilisateurs

### 4.1 Créer Utilisateur
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "enseignant@uni.fr",
    "firstName": "Jean",
    "lastName": "Dupont",
    "password": "SecurePass123!",
    "roles": ["TEACHER"]
  }'
```

### 4.2 Assigner Rôles
```bash
curl -X PATCH http://localhost:3000/api/admin/users/507f1f77bcf86cd799439025/roles \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roles": ["TEACHER", "SCOLARITE"]
  }'
```

**Rôles disponibles:**
- `SUPER_ADMIN` — Accès total
- `ADMIN` — Gestion structure, utilisateurs (pas de suppression)
- `SCOLARITE` — Gestion inscriptions, validations
- `TEACHER` — Consultation cours, saisie notes
- `STUDENT` — Consultation personnelle

### 4.3 Changer Statut Utilisateur
```bash
curl -X PATCH http://localhost:3000/api/admin/users/507f1f77bcf86cd799439025/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUSPENDED"
  }'
```

**Statuts:** `ACTIVE`, `SUSPENDED`, `DELETED`

### 4.4 Lister Utilisateurs
```bash
curl -X GET "http://localhost:3000/api/admin/users?status=ACTIVE&role=TEACHER&limit=20&offset=0" \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 UC-A05 — Supervision & Rapports

### 5.1 Dashboard KPIs
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "stats": {
    "totalStudents": 450,
    "totalPayments": 225000000,
    "paidPayments": 180000000,
    "pendingPayments": 45000000,
    "overduePayments": 15000000,
    "totalTeachers": 25,
    "totalClasses": 18,
    "activeYears": 1
  },
  "recentActivity": [
    {
      "date": "2026-06-22T10:45:00Z",
      "action": "import_completed",
      "description": "Import 148 étudiants",
      "actor": "admin@uni.fr"
    }
  ],
  "alerts": [
    {
      "severity": "WARNING",
      "message": "15 paiements en retard (>30 jours)"
    },
    {
      "severity": "INFO",
      "message": "Backup système réalisé avec succès"
    }
  ]
}
```

### 5.2 Lister Audit Logs (avec filtres)
```bash
curl -X GET "http://localhost:3000/api/admin/audit-logs?action=admin_imported_students&startDate=2026-06-01&endDate=2026-06-30&limit=50&offset=0" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439030",
      "actor": "admin@uni.fr",
      "action": "admin_imported_students",
      "resource": "StudentImport",
      "resourceId": "import_2026_06_22_001",
      "details": {
        "filename": "students_list.xlsx",
        "successCount": 148,
        "errorCount": 2
      },
      "severity": "INFO",
      "timestamp": "2026-06-22T10:45:00Z",
      "ipAddress": "192.168.1.100"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 5.3 Exporter Audit Logs
```bash
curl -X GET "http://localhost:3000/api/admin/audit-logs/export?format=csv&startDate=2026-06-01&endDate=2026-06-30" \
  -H "Authorization: Bearer TOKEN" \
  -o audit_logs.csv
```

### 5.4 Rapport Paiements
```bash
curl -X GET "http://localhost:3000/api/admin/reports/payments?academicYearId=507f1f77bcf86cd799439012&status=UNPAID" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "year": "2026-2027",
  "reportDate": "2026-06-22T11:00:00Z",
  "filters": {
    "status": "UNPAID"
  },
  "summary": {
    "totalStudents": 450,
    "totalDue": 45000000,
    "averageDue": 100000,
    "overdueCount": 15,
    "overdueDue": 15000000
  },
  "details": [
    {
      "studentId": "507f1f77bcf86cd799439031",
      "studentName": "Jean Dupont",
      "email": "jean.dupont@etu.uni",
      "groupName": "Groupe A",
      "totalDue": 250000,
      "paid": 0,
      "remaining": 250000,
      "dueDate": "2026-09-01",
      "status": "OVERDUE"
    }
  ]
}
```

---

## ⚙️ UC-A06 — Configurations

### 6.1 Lister Configurations
```bash
curl -X GET http://localhost:3000/api/admin/config \
  -H "Authorization: Bearer TOKEN"
```

### 6.2 Modifier Configuration
```bash
curl -X PATCH http://localhost:3000/api/admin/config/SUPPORT_EMAIL \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "support@universite.edu.ci"
  }'
```

### 6.3 Créer Template Email
```bash
curl -X POST http://localhost:3000/api/admin/email-templates \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PAYMENT_REMINDER",
    "subject": "Rappel de paiement - {{academicYear}}",
    "body": "<h1>Bonjour {{studentName}}</h1><p>Vous devez {{amount}} CFA avant {{dueDate}}</p>",
    "variables": ["studentName", "amount", "dueDate", "academicYear"],
    "description": "Email de rappel de paiement en retard"
  }'
```

---

## 🔒 Erreurs Courantes

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```
**Solution**: Fournir un JWT valide dans le header `Authorization: Bearer TOKEN`

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Admin role required"
}
```
**Solution**: Utiliser un compte avec le rôle `ADMIN` ou `SUPER_ADMIN`

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email format is invalid"
    }
  ]
}
```
**Solution**: Valider les inputs selon les DTOs spécifiés

---

## 📥 Import Postman Collection

Créer une collection Postman avec:
1. Folder: **Auth** (Login)
2. Folder: **UC-A01** (Structure) → 6 requêtes
3. Folder: **UC-A02** (Import) → 3 requêtes
4. Folder: **UC-A03** (Paiements) → 3 requêtes
5. Folder: **UC-A04** (Utilisateurs) → 4 requêtes
6. Folder: **UC-A05** (Supervision) → 4 requêtes
7. Folder: **UC-A06** (Config) → 3 requêtes

**Total: 23 requêtes testées**

---

## 🧪 Environnement Postman

```json
{
  "name": "Uniconnect Admin",
  "values": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:3000/api",
      "enabled": true
    },
    {
      "key": "TOKEN",
      "value": "{{access_token}}",
      "enabled": true
    },
    {
      "key": "ADMIN_EMAIL",
      "value": "admin@uni.fr",
      "enabled": true
    },
    {
      "key": "ADMIN_PASSWORD",
      "value": "password123",
      "enabled": true
    }
  ]
}
```

---

**Tous les exemples ci-dessus sont fonctionnels dès le démarrage du Sprint 7!**

