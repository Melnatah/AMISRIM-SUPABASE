# Améliorations de Sécurité Implémentées

## ✅ Changements Appliqués

### 1. Health Check Amélioré (`api-backend/src/server.ts`)
- **Avant** : Simple vérification d'uptime
- **Après** : 
  - Test de connectivité base de données
  - Métriques mémoire (heap used/total)
  - Code HTTP 503 si DB déconnectée
  - Utile pour monitoring Uptime Robot / Grafana

### 2. Middleware requireAdmin (`api-backend/src/middleware/requireAdmin.ts`)
- **Nouveau fichier** créé
- Middleware réutilisable pour protéger les routes admin
- Retourne 403 Forbidden si non-admin
- À utiliser après `authenticate` middleware

**Exemple d'utilisation :**
```typescript
import { requireAdmin } from '../middleware/requireAdmin.js';
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);
```

### 3. Rate Limiting Strict sur Auth (`api-backend/src/middleware/rateLimiter.ts`)
- **Nouveau** : `authRateLimiter` fonction
- **Limites** : 5 tentatives par 15 minutes (vs 1000/min général)
- **Appliqué sur** :
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- **Protection** : Brute force attacks

### 4. Validation Upload Renforcée (`api-backend/src/routes/profile.routes.ts`)
- **Avant** : Regex sur MIME types
- **Après** : Whitelist explicite
  ```typescript
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  ```
- **Limite** : 5MB max (déjà en place)
- **Protection** : Fichiers malveillants

### 5. Logging HTTP avec Morgan (`api-backend/src/server.ts`)
- **Nouveau** : morgan middleware
- **Format** :
  - Production : `combined` (Apache-style)
  - Development : `dev` (coloré, concis)
- **Logs** : Toutes les requêtes HTTP (méthode, URL, status, temps)

### 6. .gitignore Renforcé
- **Ajouts critiques** :
  - `*.env` (tous les fichiers env)
  - `api-backend/.env` (explicite)
  - `uploads/` (fichiers utilisateurs)
  - `*.jpg`, `*.png`, etc. (sauf public/)
  - Certificats : `*.pem`, `*.key`, `*.p12`, `*.pfx`
  - Backups : `*.backup`, `*.bak`
  - Coverage : `coverage/`, `*.lcov`

---

## 🔧 Actions Recommandées (À Faire Manuellement)

### 1. Vérifier .env n'est PAS dans Git
```bash
# Sur votre machine locale
git log --all --full-history -- "*/.env"
# Si des résultats apparaissent, contactez-moi pour purger l'historique
```

### 2. Générer un JWT_SECRET Fort
```bash
# Sur le serveur
openssl rand -base64 64
```
Puis mettez à jour `api-backend/.env` :
```env
JWT_SECRET=<votre_nouvelle_clé_très_longue>
```

### 3. Configurer Backups Automatiques PostgreSQL
```bash
# Créer un script de backup
sudo nano /usr/local/bin/backup-db.sh
```

Contenu du script :
```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR
docker exec <postgres_container_name> pg_dump -U <user> <database> | gzip > $BACKUP_DIR/db_$(date +\%Y\%m\%d_\%H\%M).sql.gz
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
```

Puis :
```bash
chmod +x /usr/local/bin/backup-db.sh
crontab -e
# Ajouter : 0 2 * * * /usr/local/bin/backup-db.sh
```

### 4. Vérifier Cloudflare SSL
- Aller sur Cloudflare Dashboard
- SSL/TLS → **Full (strict)** (pas Flexible)
- Always Use HTTPS → **ON**
- Minimum TLS Version → **1.2** ou 1.3

### 5. Monitoring (Optionnel mais Recommandé)
**Uptime Robot** (gratuit) :
1. Créer un compte sur uptimerobot.com
2. Ajouter un monitor HTTP(S)
3. URL : `https://api-amisrim.jadeoffice.cloud/health`
4. Intervalle : 5 minutes
5. Alertes : Email

**Sentry** (gratuit jusqu'à 5k events/mois) :
1. Créer un compte sur sentry.io
2. Créer un projet Node.js
3. Installer : `npm install @sentry/node`
4. Ajouter dans `server.ts` :
```typescript
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: "votre_dsn" });
app.use(Sentry.Handlers.requestHandler());
// ... vos routes ...
app.use(Sentry.Handlers.errorHandler());
```

---

## 📊 Résultats Attendus

### Sécurité
- ✅ Brute force attacks bloqués (5 tentatives max)
- ✅ Fichiers malveillants rejetés (whitelist MIME)
- ✅ Secrets protégés (.gitignore renforcé)
- ✅ Health check pour monitoring

### Performance
- ✅ Compression HTTP active
- ✅ Cache headers sur uploads (30 jours)
- ✅ Logs structurés pour debugging

### Monitoring
- ✅ Logs HTTP détaillés (morgan)
- ✅ Health endpoint avec métriques
- ✅ Prêt pour Uptime Robot / Sentry

---

## 🚀 Commande de Déploiement

```bash
cd /etc/dokploy/applications/amisrim-frontendamisrim-amoo4r/code && \
git reset --hard && \
git pull origin main && \
echo "✅ Code mis à jour" && \
cd api-backend && \
docker build --no-cache -t amisrim-api:latest . && \
docker service update --image amisrim-api:latest --force amisrim-amisrimapi-wuxoni && \
echo "🔐 API (Sécurité Renforcée)"
```

---

## 📝 Checklist Post-Déploiement

```bash
# Après déploiement, vérifiez :
□ Health check fonctionne : curl https://api-amisrim.jadeoffice.cloud/health
□ Rate limiting actif : tester 6 logins échoués (doit bloquer au 6ème)
□ Logs HTTP visibles : docker logs <container> --tail 50
□ Upload avatar fonctionne (MIME validation)
□ .env n'est PAS dans Git
□ JWT_SECRET changé (64+ caractères)
□ Backups configurés
□ Cloudflare SSL = Full (strict)
```

---

## 🆘 En Cas de Problème

### Rate Limiting trop strict ?
Modifier `api-backend/src/middleware/rateLimiter.ts` :
```typescript
const AUTH_MAX_REQUESTS = 10; // Au lieu de 5
```

### Logs trop verbeux ?
Modifier `api-backend/src/server.ts` :
```typescript
// Désactiver morgan temporairement
// app.use(morgan(...));
```

### Health check échoue ?
Vérifier connexion DB :
```bash
docker exec <postgres_container> psql -U <user> -d <database> -c "SELECT 1;"
```

---

**Date de mise à jour** : 2026-01-05
**Version** : 1.0.0
