# 🐘 PostgreSQL avec Dokploy - Guide Complet

## 🎯 Vous avez 2 Options Simples

### ✅ Option 1 : PostgreSQL via Dokploy (RECOMMANDÉ)
**Le plus simple - Dokploy gère tout pour vous**

### ✅ Option 2 : Docker Compose Local
**Bon pour le développement local**

---

## 🚀 OPTION 1 : PostgreSQL via Dokploy (RECOMMANDÉ)

### Étape 1 : Créer une Base de Données dans Dokploy

1. **Connectez-vous à Dokploy** : `http://votre-serveur:3000`

2. **Créez une nouvelle base de données** :
   - Cliquez sur **"Databases"** dans le menu
   - Cliquez sur **"Create Database"**
   - Choisissez **"PostgreSQL"**

3. **Configurez la base de données** :
   ```
   Name: amisrim-db
   PostgreSQL Version: 16 (ou la dernière)
   Database Name: amisrim
   Username: postgres
   Password: [Générez un mot de passe fort]
   ```

4. **Notez les informations de connexion** :
   Dokploy vous donnera quelque chose comme :
   ```
   Host: postgres-amisrim-db
   Port: 5432
   Database: amisrim
   Username: postgres
   Password: votre_mot_de_passe
   ```

### Étape 2 : Configurer votre API pour utiliser cette DB

Dans votre fichier `.env` de l'API :

```env
# Format de connexion Dokploy
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@postgres-amisrim-db:5432/amisrim?schema=public"

# Ou si vous utilisez l'IP du serveur
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@IP_SERVEUR:5432/amisrim?schema=public"
```

### Étape 3 : Déployer l'API sur Dokploy

1. **Créez un nouveau service** dans Dokploy :
   - Type : **Application**
   - Source : **Git** (votre repo)
   - Build Type : **Dockerfile**

2. **Configurez les variables d'environnement** :
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://postgres:votre_mot_de_passe@postgres-amisrim-db:5432/amisrim?schema=public
   JWT_SECRET=votre-secret-jwt-tres-long-et-aleatoire
   CORS_ORIGIN=https://votre-domaine.com
   ```

3. **Déployez** :
   - Dokploy va build et démarrer votre API
   - L'API se connectera automatiquement à PostgreSQL

### Étape 4 : Initialiser la Base de Données

**Via Dokploy Console** :

1. Allez dans votre service API
2. Ouvrez le **Terminal/Console**
3. Exécutez :
   ```bash
   npm run setup
   ```

Cela va :
- ✅ Générer le client Prisma
- ✅ Créer toutes les tables
- ✅ Créer l'admin par défaut
- ✅ Initialiser les paramètres

---

## 🐳 OPTION 2 : Docker Compose Local (Développement)

### Pour tester en local avant Dokploy

#### Étape 1 : Créer le fichier docker-compose.yml

Le fichier existe déjà dans `api-backend/docker-compose.yml` !

#### Étape 2 : Démarrer PostgreSQL

```bash
cd api-backend
docker-compose up -d postgres
```

Cela démarre PostgreSQL sur votre machine locale.

#### Étape 3 : Configurer .env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amisrim?schema=public"
```

#### Étape 4 : Initialiser la DB

```bash
npm run setup
```

#### Étape 5 : Démarrer l'API

```bash
npm run dev
```

---

## 📋 Checklist de Configuration

### Pour Dokploy (Production)

- [ ] Base de données PostgreSQL créée dans Dokploy
- [ ] Informations de connexion notées
- [ ] Service API créé dans Dokploy
- [ ] Variables d'environnement configurées
- [ ] API déployée
- [ ] Base de données initialisée (`npm run setup`)
- [ ] Test de connexion réussi

### Pour Local (Développement)

- [ ] Docker installé
- [ ] `docker-compose up -d` exécuté
- [ ] `.env` configuré
- [ ] `npm install` exécuté
- [ ] `npm run setup` exécuté
- [ ] `npm run dev` démarré
- [ ] Test sur `http://localhost:3001/health`

---

## 🔧 Configuration Détaillée Dokploy

### 1. Créer la Base de Données PostgreSQL

**Via l'interface Dokploy :**

```
┌─────────────────────────────────────────┐
│  Dokploy > Databases > Create Database  │
├─────────────────────────────────────────┤
│  Type: PostgreSQL                       │
│  Name: amisrim-db                       │
│  Version: 16                            │
│  Database Name: amisrim                 │
│  Username: postgres                     │
│  Password: [Générer]                    │
│  Port: 5432 (défaut)                    │
└─────────────────────────────────────────┘
```

### 2. Créer le Service API

**Via l'interface Dokploy :**

```
┌─────────────────────────────────────────┐
│  Dokploy > Applications > Create App    │
├─────────────────────────────────────────┤
│  Name: amisrim-api                      │
│  Source: Git Repository                 │
│  Repository: [Votre repo Git]           │
│  Branch: main                           │
│  Build Type: Dockerfile                 │
│  Dockerfile Path: api-backend/Dockerfile│
│  Port: 3001                             │
└─────────────────────────────────────────┘
```

### 3. Variables d'Environnement

Dans Dokploy, section **Environment Variables** :

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:MOT_DE_PASSE@postgres-amisrim-db:5432/amisrim?schema=public
JWT_SECRET=GENERER_UNE_CLE_ALEATOIRE_64_CARACTERES
CORS_ORIGIN=https://votre-domaine.com
ADMIN_EMAIL=admin@amisrim.tg
ADMIN_PASSWORD=ChangezCeMotDePasse123!
```

**Pour générer JWT_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Réseau Dokploy

Dokploy crée automatiquement un réseau Docker. Vos services peuvent se parler par leur nom :

```
API → postgres-amisrim-db:5432
```

Pas besoin d'IP, juste le nom du service !

---

## 🧪 Tester la Connexion

### 1. Via Dokploy Console

Dans votre service API, ouvrez le terminal et testez :

```bash
# Test de connexion
npx prisma db pull

# Voir les tables
npx prisma studio
```

### 2. Via l'API

```bash
curl https://votre-api.com/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T00:52:00.000Z",
  "uptime": 123.45
}
```

---

## 🔐 Sécurité PostgreSQL

### Bonnes Pratiques

1. **Mot de passe fort** :
   ```bash
   # Générer un mot de passe sécurisé
   openssl rand -base64 32
   ```

2. **Pas d'exposition publique** :
   - PostgreSQL doit rester dans le réseau privé Dokploy
   - Seule l'API doit y accéder

3. **Backups réguliers** :
   - Dokploy peut faire des backups automatiques
   - Configurez-les dans les paramètres de la DB

4. **SSL/TLS** (optionnel mais recommandé) :
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```

---

## 📊 Architecture Finale avec Dokploy

```
┌─────────────────────────────────────────────────────┐
│                    INTERNET                          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Dokploy Reverse Proxy                   │
│           (Traefik avec SSL/HTTPS)                   │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│  Frontend    │         │  API Node.js │
│  React App   │◄────────│  (Port 3001) │
│              │         │              │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                    ┌───────────────────┐
                    │   PostgreSQL 16   │
                    │  (Port 5432)      │
                    │  Réseau Privé     │
                    └───────────────────┘
```

---

## 🚀 Déploiement Complet - Étapes Finales

### 1. Préparer le Code

```bash
# Dans votre projet local
cd api-backend

# Créer .env pour production
cp .env.example .env.production

# Éditer .env.production avec les vraies valeurs
```

### 2. Push vers Git

```bash
git add .
git commit -m "Add Node.js API"
git push origin main
```

### 3. Dans Dokploy

1. **Créer PostgreSQL** (comme décrit ci-dessus)
2. **Créer le service API** (pointer vers votre repo)
3. **Configurer les variables d'environnement**
4. **Déployer**

### 4. Initialiser la DB

Dans le terminal Dokploy de l'API :

```bash
npm run setup
```

### 5. Tester

```bash
# Health check
curl https://votre-api.com/health

# Login admin
curl -X POST https://votre-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amisrim.tg","password":"ChangeThisPassword123!"}'
```

---

## 🆘 Dépannage

### Erreur : "Cannot connect to database"

**Solution 1 - Vérifier le nom du service** :
```env
# Assurez-vous d'utiliser le bon nom
DATABASE_URL="postgresql://postgres:pass@postgres-amisrim-db:5432/amisrim"
```

**Solution 2 - Vérifier que PostgreSQL est démarré** :
Dans Dokploy, vérifiez que la DB est "Running" (vert)

**Solution 3 - Vérifier les credentials** :
```bash
# Dans le terminal de l'API
echo $DATABASE_URL
```

### Erreur : "Prisma Client not generated"

```bash
# Dans le terminal Dokploy
npm run prisma:generate
```

### Erreur : "Port already in use"

Changez le port dans Dokploy ou dans `.env` :
```env
PORT=3002
```

---

## 📚 Ressources Utiles

- [Documentation Dokploy](https://docs.dokploy.com/)
- [Prisma avec PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ Checklist Finale

- [ ] PostgreSQL créé dans Dokploy
- [ ] Mot de passe sécurisé généré
- [ ] DATABASE_URL configurée
- [ ] Service API créé dans Dokploy
- [ ] Variables d'environnement configurées
- [ ] Code pushé sur Git
- [ ] API déployée
- [ ] `npm run setup` exécuté
- [ ] Health check OK
- [ ] Login admin OK
- [ ] Frontend connecté à l'API

---

## 🎉 Vous êtes Prêt !

Avec Dokploy, PostgreSQL est **super simple** :
1. ✅ Cliquez pour créer la DB
2. ✅ Copiez l'URL de connexion
3. ✅ Collez dans les variables d'environnement
4. ✅ Déployez !

**Besoin d'aide ? Consultez les autres guides dans `api-backend/` !**
