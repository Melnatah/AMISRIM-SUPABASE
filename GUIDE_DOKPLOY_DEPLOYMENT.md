# 🚀 GUIDE : DÉPLOIEMENT COMPLET SUR DOKPLOY

## 📋 Vue d'Ensemble

Dokploy va héberger :
1. ✅ **Supabase** (Base de données PostgreSQL + API + Studio)
2. ✅ **Application AMIS RIM TOGO** (Frontend React)
3. ✅ **Tout sur le même serveur local**

## 🏗️ PARTIE 1 : DÉPLOYER SUPABASE SUR DOKPLOY

### Étape 1 : Accéder à Dokploy

1. Ouvrez votre navigateur
2. Allez sur votre instance Dokploy (ex: `http://localhost:3000` ou votre IP locale)
3. Connectez-vous

### Étape 2 : Créer un Nouveau Projet

1. Cliquez sur **"Create Project"**
2. Nom du projet : `amis-rim-togo`
3. Cliquez sur **"Create"**

### Étape 3 : Déployer Supabase via Docker Compose

1. Dans votre projet, cliquez sur **"Add Service"**
2. Sélectionnez **"Docker Compose"**
3. Nom du service : `supabase`

4. **Créer le fichier docker-compose.yml** :

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: supabase/postgres:15.1.0.147
    container_name: supabase-db
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Supabase Studio (Interface d'administration)
  studio:
    image: supabase/studio:20231123-64a766a
    container_name: supabase-studio
    environment:
      SUPABASE_URL: http://kong:8000
      STUDIO_PG_META_URL: http://meta:8080
      SUPABASE_ANON_KEY: ${ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SERVICE_ROLE_KEY}
    ports:
      - "3001:3000"
    depends_on:
      - kong
    restart: unless-stopped

  # Kong API Gateway
  kong:
    image: kong:2.8.1
    container_name: supabase-kong
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl
    volumes:
      - ./volumes/api/kong.yml:/var/lib/kong/kong.yml:ro
    ports:
      - "8000:8000"
      - "8443:8443"
    restart: unless-stopped

  # Auth Service
  auth:
    image: supabase/gotrue:v2.99.0
    container_name: supabase-auth
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: ${API_EXTERNAL_URL}
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_URI_ALLOW_LIST: ${ADDITIONAL_REDIRECT_URLS}
      GOTRUE_DISABLE_SIGNUP: ${DISABLE_SIGNUP}
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: ${JWT_EXPIRY}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: ${ENABLE_EMAIL_SIGNUP}
      GOTRUE_MAILER_AUTOCONFIRM: ${ENABLE_EMAIL_AUTOCONFIRM}
    depends_on:
      - db
    restart: unless-stopped

  # REST API
  rest:
    image: postgrest/postgrest:v11.2.0
    container_name: supabase-rest
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMAS: ${PGRST_DB_SCHEMAS}
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_USE_LEGACY_GUCS: "false"
    depends_on:
      - db
    restart: unless-stopped

  # Realtime Service
  realtime:
    image: supabase/realtime:v2.25.35
    container_name: supabase-realtime
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: postgres
      DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime'
      DB_ENC_KEY: supabaserealtime
      API_JWT_SECRET: ${JWT_SECRET}
      FLY_ALLOC_ID: fly123
      FLY_APP_NAME: realtime
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      ERL_AFLAGS: -proto_dist inet_tcp
      ENABLE_TAILSCALE: "false"
      DNS_NODES: "''"
    command: >
      sh -c "/app/bin/migrate && /app/bin/realtime eval 'Realtime.Release.seeds(Realtime.Repo)' && /app/bin/server"
    depends_on:
      - db
    restart: unless-stopped

  # Storage Service
  storage:
    image: supabase/storage-api:v0.40.4
    container_name: supabase-storage
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
    volumes:
      - storage-data:/var/lib/storage
    depends_on:
      - db
      - rest
    restart: unless-stopped

  # Meta Service
  meta:
    image: supabase/postgres-meta:v0.68.0
    container_name: supabase-meta
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: postgres
      PG_META_DB_USER: supabase
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      - db
    restart: unless-stopped

volumes:
  db-data:
  storage-data:
```

### Étape 4 : Créer le Fichier .env

Dans Dokploy, ajoutez les variables d'environnement :

```env
# PostgreSQL
POSTGRES_PASSWORD=votre_mot_de_passe_super_securise

# JWT Secret (générer avec: openssl rand -base64 32)
JWT_SECRET=votre_jwt_secret_super_long_et_securise

# Anon Key (JWT avec role: anon)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.VOTRE_SIGNATURE

# Service Role Key (JWT avec role: service_role)
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.VOTRE_SIGNATURE

# URLs
API_EXTERNAL_URL=http://votre-ip-locale:8000
SITE_URL=http://votre-ip-locale:3001
ADDITIONAL_REDIRECT_URLS=

# Auth
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
JWT_EXPIRY=3600

# Database
PGRST_DB_SCHEMAS=public,storage,graphql_public

# Realtime
SECRET_KEY_BASE=votre_secret_key_base_super_long
```

### Étape 5 : Générer les JWT Keys

Utilisez cet outil en ligne : https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

Ou utilisez ce script :

```javascript
// Générer les clés JWT
const jwt = require('jsonwebtoken');

const secret = 'votre_jwt_secret_super_long_et_securise';

// Anon Key
const anonKey = jwt.sign(
  { role: 'anon', iss: 'supabase' },
  secret,
  { expiresIn: '10y' }
);

// Service Role Key
const serviceKey = jwt.sign(
  { role: 'service_role', iss: 'supabase' },
  secret,
  { expiresIn: '10y' }
);

console.log('ANON_KEY:', anonKey);
console.log('SERVICE_ROLE_KEY:', serviceKey);
```

### Étape 6 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 5-10 minutes
3. Vérifiez que tous les conteneurs sont "Running"

### Étape 7 : Accéder à Supabase Studio

- URL : `http://votre-ip-locale:3001`
- Connectez-vous avec vos credentials

## 🌐 PARTIE 2 : DÉPLOYER L'APPLICATION REACT

### Étape 1 : Créer un Nouveau Service

1. Dans le même projet `amis-rim-togo`
2. Cliquez sur **"Add Service"**
3. Sélectionnez **"Git Repository"** ou **"GitHub"**

### Étape 2 : Configurer le Repository

1. **Repository URL** : `https://github.com/Melnatah/AMISRIM-SUPABASE`
2. **Branch** : `main`
3. **Build Command** : `npm run build`
4. **Start Command** : `npm run preview`
5. **Port** : `4173` (port par défaut de Vite preview)

### Étape 3 : Variables d'Environnement

Ajoutez dans Dokploy :

```env
VITE_SUPABASE_URL=http://votre-ip-locale:8000
VITE_SUPABASE_ANON_KEY=votre_anon_key_generee
```

### Étape 4 : Déployer

1. Cliquez sur **"Deploy"**
2. Dokploy va :
   - Cloner le repo
   - Installer les dépendances
   - Builder l'application
   - Démarrer le serveur

### Étape 5 : Accéder à l'Application

- URL : `http://votre-ip-locale:PORT_ASSIGNE_PAR_DOKPLOY`

## 🔧 PARTIE 3 : MIGRATION DES DONNÉES

### Étape 1 : Accéder au Studio

1. Allez sur `http://votre-ip-locale:3001`
2. Cliquez sur **"SQL Editor"**

### Étape 2 : Exécuter le Script de Migration

1. Copiez le contenu de `migration_to_jadeoffice.sql`
2. Collez dans l'éditeur SQL
3. Cliquez sur **"Run"**

### Étape 3 : Vérifier les Tables

1. Allez dans **"Table Editor"**
2. Vérifiez que toutes les tables sont créées

## 📊 ARCHITECTURE FINALE

```
Serveur Local (Dokploy)
├── Supabase
│   ├── PostgreSQL (Port 5432)
│   ├── API Gateway (Port 8000)
│   ├── Studio (Port 3001)
│   ├── Auth Service
│   ├── Storage Service
│   └── Realtime Service
│
└── Application AMIS RIM TOGO
    └── Frontend React (Port 4173)
```

## ✅ AVANTAGES

1. **🎯 Tout au même endroit** : Supabase + App sur le même serveur
2. **🔧 Gestion simplifiée** : Interface Dokploy pour tout gérer
3. **🚀 Déploiement automatique** : Push sur GitHub = déploiement auto
4. **💰 Gratuit** : Hébergement local = 0€
5. **⚡ Performance** : Tout est local = ultra rapide

## 🔐 SÉCURITÉ

1. **Configurer un reverse proxy** (Nginx/Traefik) pour HTTPS
2. **Activer l'authentification** sur Dokploy
3. **Sauvegardes régulières** de PostgreSQL
4. **Firewall** : N'exposer que les ports nécessaires

## 📞 COMMANDES UTILES DOKPLOY

```bash
# Voir les logs d'un service
docker logs -f supabase-db

# Redémarrer un service
docker restart supabase-studio

# Backup de la base de données
docker exec supabase-db pg_dump -U postgres postgres > backup.sql

# Restaurer la base de données
docker exec -i supabase-db psql -U postgres postgres < backup.sql
```

## 🆘 DÉPANNAGE

### Service ne démarre pas
1. Vérifier les logs dans Dokploy
2. Vérifier que Docker a assez de ressources
3. Vérifier les variables d'environnement

### Application ne se connecte pas à Supabase
1. Vérifier l'URL dans `.env`
2. Vérifier que l'ANON_KEY est correcte
3. Vérifier que Kong (port 8000) est accessible

---

**Prêt à déployer sur Dokploy ?** Dites-moi où vous en êtes !
