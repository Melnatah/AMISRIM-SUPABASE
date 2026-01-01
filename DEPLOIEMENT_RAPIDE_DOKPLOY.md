# 🚀 DÉPLOIEMENT RAPIDE SUR DOKPLOY - GUIDE ÉTAPE PAR ÉTAPE

## ✅ ÉTAPE 1 : PRÉPARER LES FICHIERS

Vous avez déjà tous les fichiers nécessaires :
- ✅ `dokploy-supabase.yml` - Configuration Docker Compose
- ✅ `kong.yml` - Configuration API Gateway
- ✅ `.env.dokploy.example` - Template des variables
- ✅ `migration_to_jadeoffice.sql` - Script de migration de la base de données

## 🔑 ÉTAPE 2 : CLÉS JWT GÉNÉRÉES

Vos clés ont été générées avec succès :

```env
JWT_SECRET=T487BXMBTgOIp4r76mWSu6xtiMPySNPReZ1ZTLW7tew=

ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY3Mjk1ODAyLCJleHAiOjIwODI2NTU4MDJ9.VIsz5QI7uvB0j-hr5oUCgY5KjOat9ybN6ESFMpOv3-4

SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjcyOTU4MDIsImV4cCI6MjA4MjY1NTgwMn0.J3MkQvpuZurqmxB-4LRIHf6hhNpgexYxZtUddrTEU0A
```

⚠️ **IMPORTANT** : Sauvegardez ces clés dans un endroit sûr !

## 📦 ÉTAPE 3 : DÉPLOYER SUPABASE SUR DOKPLOY

### 3.1 Accéder à Dokploy

1. Ouvrez votre navigateur
2. Allez sur votre instance Dokploy (ex: `http://votre-ip-locale:3000`)
3. Connectez-vous

### 3.2 Créer un Nouveau Projet

1. Cliquez sur **"Create Project"**
2. Nom : `amis-rim-togo`
3. Cliquez sur **"Create"**

### 3.3 Ajouter le Service Supabase

1. Dans votre projet, cliquez sur **"Add Service"**
2. Sélectionnez **"Docker Compose"**
3. Nom du service : `supabase`

### 3.4 Copier le Docker Compose

1. Ouvrez le fichier `dokploy-supabase.yml`
2. Copiez tout le contenu
3. Collez dans l'éditeur de Dokploy

### 3.5 Configurer les Variables d'Environnement

Dans Dokploy, ajoutez ces variables :

```env
POSTGRES_PASSWORD=VotreMotDePasseSuperSecurise123!
JWT_SECRET=T487BXMBTgOIp4r76mWSu6xtiMPySNPReZ1ZTLW7tew=
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY3Mjk1ODAyLCJleHAiOjIwODI2NTU4MDJ9.VIsz5QI7uvB0j-hr5oUCgY5KjOat9ybN6ESFMpOv3-4
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjcyOTU4MDIsImV4cCI6MjA4MjY1NTgwMn0.J3MkQvpuZurqmxB-4LRIHf6hhNpgexYxZtUddrTEU0A
```

### 3.6 Ajouter le Fichier kong.yml

1. Dans Dokploy, cherchez l'option pour ajouter des fichiers
2. Créez un fichier `kong.yml`
3. Copiez le contenu du fichier `kong.yml` que j'ai créé
4. Sauvegardez

### 3.7 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 5-10 minutes
3. Vérifiez que tous les conteneurs sont "Running" (vert)

### 3.8 Accéder à Supabase Studio

Une fois déployé :
- **Studio** : `http://votre-ip-locale:3001`
- **API** : `http://votre-ip-locale:8000`

## 🗄️ ÉTAPE 4 : MIGRER LA BASE DE DONNÉES

### 4.1 Accéder au Studio

1. Allez sur `http://votre-ip-locale:3001`
2. Vous devriez voir l'interface Supabase Studio

### 4.2 Exécuter le Script SQL

1. Cliquez sur **"SQL Editor"** dans le menu de gauche
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `migration_to_jadeoffice.sql`
4. Copiez TOUT le contenu
5. Collez dans l'éditeur SQL de Studio
6. Cliquez sur **"Run"** (ou Ctrl+Enter)
7. Attendez 1-2 minutes

### 4.3 Vérifier les Tables

1. Allez dans **"Table Editor"**
2. Vous devriez voir 12 tables :
   - profiles
   - sites
   - modules
   - subjects
   - files
   - contributions
   - messages
   - settings
   - leisure_events
   - leisure_contributions
   - leisure_participants
   - attendance

## 🌐 ÉTAPE 5 : DÉPLOYER L'APPLICATION REACT

### 5.1 Ajouter un Nouveau Service

1. Dans le même projet `amis-rim-togo`
2. Cliquez sur **"Add Service"**
3. Sélectionnez **"Git Repository"**

### 5.2 Configurer le Repository

1. **Repository URL** : `https://github.com/Melnatah/AMISRIM-SUPABASE`
2. **Branch** : `main`
3. **Build Command** : `npm run build`
4. **Start Command** : `npm run preview`
5. **Port** : `4173`

### 5.3 Variables d'Environnement de l'Application

Ajoutez dans Dokploy :

```env
VITE_SUPABASE_URL=http://votre-ip-locale:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY3Mjk1ODAyLCJleHAiOjIwODI2NTU4MDJ9.VIsz5QI7uvB0j-hr5oUCgY5KjOat9ybN6ESFMpOv3-4
```

⚠️ **Remplacez `votre-ip-locale` par votre vraie IP locale** (ex: `192.168.1.100`)

### 5.4 Déployer l'Application

1. Cliquez sur **"Deploy"**
2. Dokploy va :
   - Cloner le repo
   - Installer les dépendances (`npm install`)
   - Builder l'application (`npm run build`)
   - Démarrer le serveur (`npm run preview`)

### 5.5 Accéder à l'Application

- URL : `http://votre-ip-locale:PORT_ASSIGNE_PAR_DOKPLOY`
- Dokploy vous montrera le port exact après le déploiement

## ✅ ÉTAPE 6 : VÉRIFICATION FINALE

### Checklist de Validation

- [ ] Supabase Studio accessible sur port 3001
- [ ] API Supabase accessible sur port 8000
- [ ] 12 tables créées dans la base de données
- [ ] Application React déployée et accessible
- [ ] Connexion entre l'app et Supabase fonctionnelle
- [ ] Possibilité de se connecter à l'application

### Test de Connexion

1. Ouvrez l'application dans votre navigateur
2. Essayez de vous connecter
3. Vérifiez que les données s'affichent

## 🔧 DÉPANNAGE

### Supabase ne démarre pas

```bash
# Vérifier les logs dans Dokploy
# Ou via Docker
docker logs supabase-db
docker logs supabase-studio
docker logs supabase-kong
```

### Application ne se connecte pas

1. Vérifier que `VITE_SUPABASE_URL` pointe vers `http://IP:8000`
2. Vérifier que `ANON_KEY` est correcte
3. Vérifier que Kong (port 8000) est accessible

### Tables non créées

1. Réexécuter le script `migration_to_jadeoffice.sql`
2. Vérifier les logs PostgreSQL

## 📊 RÉSUMÉ DE L'ARCHITECTURE

```
Serveur Local (Dokploy)
│
├── Supabase
│   ├── PostgreSQL → Port 5432
│   ├── Kong API Gateway → Port 8000
│   ├── Studio → Port 3001
│   └── Meta Service → Port 8080
│
└── Application AMIS RIM TOGO
    └── React Frontend → Port 4173
```

## 🎉 FÉLICITATIONS !

Votre application AMIS RIM TOGO est maintenant déployée localement sur Dokploy avec Supabase !

---

**Besoin d'aide ?** Consultez les logs dans Dokploy ou contactez-moi !
