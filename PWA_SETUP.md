# Configuration PWA - Uniconnect

## Vue d'ensemble

Uniconnect est maintenant configurée en tant que **Progressive Web App (PWA)**, ce qui signifie que l'application peut :

✅ **Être installée** sur l'écran d'accueil (mobile et desktop)  
✅ **Fonctionner hors ligne** avec mise en cache intelligente  
✅ **Bénéficier de performances améliorées** via le service worker  
✅ **Envoyer des notifications** (implémentation future)  
✅ **Synchroniser les données** en arrière-plan (implémentation future)  

---

## Architecture PWA

### 1. **Manifest Web (`public/manifest.webmanifest`)**

Définit les métadonnées de l'application :
- Nom complet : "Uniconnect - Plateforme Académique"
- Nom court : "Uniconnect"
- Icônes multi-formats (72px à 512px)
- Couleurs thème (#2c3e50) et fond blanc
- Mode standalone (pas de barre d'URL)

### 2. **Service Worker (`ngsw-config.json`)**

Configure la mise en cache intelligente selon le type de contenu :

#### **Asset Groups**
- **app** : Précharge les assets statiques (HTML, CSS, JS)
- **assets** : Cache lazy les images et polices

#### **Data Groups** (cache API)

| Groupe | URLs | Stratégie | Durée | Taille |
|--------|------|-----------|-------|--------|
| **api-authentication** | `/api/auth/**` | Fraîcheur (réseau d'abord) | 1h | 100 KB |
| **api-user-data** | `/api/users/**`, `/api/students/**`, `/api/teachers/**` | Fraîcheur | 24h | 500 KB |
| **api-courses** | `/api/courses/**`, `/api/planning/**` | Performance (cache d'abord) | 7j | 1000 KB |
| **api-documents** | `/api/documents/**`, `/api/grades/**` | Performance | 30j | 2000 KB |

**Stratégies** :
- **Fraîcheur** : Vérifier le réseau en premier, utiliser le cache en cas d'erreur
- **Performance** : Utiliser le cache d'abord, synchroniser en arrière-plan

### 3. **Meta Tags PWA** (`src/index.html`)**

Optimisation pour iOS et Android :
- `theme-color` : Couleur de la barre de statut
- `apple-mobile-web-app-capable` : Permet la mise en plein écran sur iOS
- `apple-mobile-web-app-title` : Nom de l'application iOS
- `apple-touch-icon` : Icône pour la mise en cache iOS

---

## Activation et Génération

### Build Production

```bash
cd apps/web
npm run build
```

Cela génère :
- `dist/uniconnect-web/browser/ngsw-worker.js` - Service worker compilé
- `dist/uniconnect-web/browser/ngsw.json` - Configuration de cache (générée)
- `dist/uniconnect-web/browser/manifest.webmanifest` - Manifest de l'application
- `dist/uniconnect-web/browser/icons/` - Icônes PWA

### Déploiement

Le service worker se déploie automatiquement avec le build.  
Activation en production quand :
- L'utilisateur visite l'app
- La configuration est stable pendant 30 secondes (`registrationStrategy: 'registerWhenStable:30000'`)

### Développement

En mode développement (`ng serve`), le service worker est **désactivé** :
```typescript
enabled: !isDevMode()  // Fichier: src/app/app.config.ts
```

---

## Fonctionnalités Implémentées

### ✅ Installation
L'utilisateur peut installer Uniconnect depuis :
- **Android Chrome** : "Installer l'application"
- **iOS Safari** : "Partager" → "Sur l'écran d'accueil"
- **Desktop (Chrome, Edge)** : Icône d'installation dans la barre

### ✅ Fonctionnement Hors Ligne
- Les pages statiques se chargent hors ligne (après première visite)
- Les données en cache restent accessibles sans réseau
- L'authentification se met en cache pendant 1 heure
- Les notes et documents restent accessibles pendant 30 jours

### ✅ Mise à Jour Automatique
- Le service worker détecte les mises à jour du server
- Les assets hachés garantissent des versions fraîches
- Les utilisateurs sont notifiés des nouvelles versions

---

## Évolutions Futures

### 🔄 Synchronisation en Arrière-Plan
```typescript
// À implémenter : Synchroniser les modifications hors ligne
// quand la connexion est rétablie
```

### 🔔 Notifications Push
```typescript
// À implémenter : Notifications pour les messages, les notes, etc.
```

### 📥 Téléchargement de Fichiers
```typescript
// À implémenter : Télécharger les documents pour accès hors ligne
```

### 🔐 Stockage Sécurisé
```typescript
// À implémenter : IndexedDB pour les données sensibles (avec chiffrement)
```

---

## Vérification PWA

### Lighthouse Audit (Chrome DevTools)

1. Ouvrir Chrome DevTools (`F12`)
2. Aller à l'onglet **Lighthouse**
3. Cliquer **Analyze page load**
4. Vérifier le score **PWA** (objectif : 90+)

### Test d'Installation

**Chrome/Edge/Android** :
- F12 → Application → Manifest
- Vérifier que le manifest s'affiche
- Cliquer "Add to home screen"

**iOS** :
- Safari → Partager → Sur l'écran d'accueil
- Vérifier l'icône et le nom

### Test Hors Ligne

1. Visiter l'app en ligne (première fois)
2. F12 → Network → **Offline** (cocher)
3. Recharger la page
4. Vérifier que l'app reste fonctionnelle

---

## Configuration pour la Production

### Headers Recommandés (serveur web)

```
Cache-Control: no-cache, max-age=0  # index.html
Cache-Control: max-age=31536000     # *.js, *.css (avec hash)
Service-Worker-Allowed: /           # Scope du service worker
```

### HTTPS Obligatoire
Le service worker ne fonctionne qu'en HTTPS (sauf localhost pour développement).

---

## Troubleshooting

### Le service worker ne s'enregistre pas
- Vérifier que l'app est en HTTPS
- F12 → Application → Service Workers
- Vérifier les messages d'erreur

### L'app ne se met en cache hors ligne
- Vérifier la limite de taille du cache (navigateur : 50MB max)
- F12 → Application → Cache Storage

### Les icônes ne s'affichent pas
- Vérifier que `public/icons/*.png` existent
- Vérifier les URLs relatives dans `manifest.webmanifest`

---

## Références

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Angular Service Worker](https://angular.io/guide/service-worker-intro)
- [Web App Manifest](https://web.dev/add-manifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
