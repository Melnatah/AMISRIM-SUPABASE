# API Node.js - AMIS RIM TOGO

API complète pour remplacer Supabase dans l'application AMIS RIM TOGO.

## 🚀 Fonctionnalités

- ✅ **Authentification JWT** - Signup, Login, Refresh Token
- ✅ **Base de données PostgreSQL** avec Prisma ORM
- ✅ **Upload de fichiers** avec Multer
- ✅ **WebSocket** pour les mises à jour en temps réel
- ✅ **API REST complète** pour toutes les ressources
- ✅ **Sécurité** - Helmet, CORS, Rate Limiting
- ✅ **Gestion des rôles** - Admin et Resident

## 📋 Prérequis

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## 🔧 Installation

### 1. Installer les dépendances

```bash
cd api-backend
npm install
```

### 2. Configuration de l'environnement

Copiez le fichier `.env.example` vers `.env` et configurez vos variables :

```bash
cp .env.example .env
```

Modifiez `.env` avec vos paramètres :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/amisrim"
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

### 3. Configuration de la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer la base de données et appliquer les migrations
npm run prisma:push

# Ou utiliser les migrations
npm run prisma:migrate
```

### 4. Démarrer le serveur

```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm run build
npm start
```

Le serveur démarre sur `http://localhost:3001`

## 📚 API Endpoints

### Authentication

- `POST /api/auth/signup` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/refresh` - Rafraîchir le token

### Profiles

- `GET /api/profiles` - Liste des profils (auth)
- `GET /api/profiles/me` - Mon profil (auth)
- `GET /api/profiles/:id` - Profil par ID (auth)
- `PUT /api/profiles/me` - Modifier mon profil (auth)
- `PUT /api/profiles/:id` - Modifier un profil (admin)
- `DELETE /api/profiles/:id` - Supprimer un profil (admin)

### Sites

- `GET /api/sites` - Liste des sites (auth)
- `POST /api/sites` - Créer un site (admin)
- `PUT /api/sites/:id` - Modifier un site (admin)
- `DELETE /api/sites/:id` - Supprimer un site (admin)

### Modules

- `GET /api/modules` - Liste des modules (auth)
- `POST /api/modules` - Créer un module (admin)
- `PUT /api/modules/:id` - Modifier un module (admin)
- `DELETE /api/modules/:id` - Supprimer un module (admin)

### Subjects

- `GET /api/subjects` - Liste des sujets (auth)
- `POST /api/subjects` - Créer un sujet (admin)
- `DELETE /api/subjects/:id` - Supprimer un sujet (admin)

### Files

- `GET /api/files` - Liste des fichiers (auth)
- `POST /api/files` - Créer un fichier (admin)
- `DELETE /api/files/:id` - Supprimer un fichier (admin)

### Contributions

- `GET /api/contributions` - Liste des cotisations (auth)
- `POST /api/contributions` - Créer une cotisation (admin)
- `PUT /api/contributions/:id` - Modifier une cotisation (admin)
- `DELETE /api/contributions/:id` - Supprimer une cotisation (admin)

### Messages

- `GET /api/messages` - Liste des messages (auth)
- `POST /api/messages` - Créer un message (admin)
- `DELETE /api/messages/:id` - Supprimer un message (admin)

### Settings

- `GET /api/settings` - Paramètres de l'application
- `PUT /api/settings/:key` - Modifier un paramètre (admin)

### Leisure (Loisirs)

- `GET /api/leisure/events` - Liste des événements (auth)
- `POST /api/leisure/events` - Créer un événement (admin)
- `PUT /api/leisure/events/:id` - Modifier un événement (admin)
- `DELETE /api/leisure/events/:id` - Supprimer un événement (admin)
- `GET /api/leisure/participants` - Liste des participants (auth)
- `POST /api/leisure/participants` - S'inscrire à un événement (auth)
- `PUT /api/leisure/participants/:id` - Modifier le statut (admin)
- `DELETE /api/leisure/participants/:id` - Supprimer un participant (admin)
- `GET /api/leisure/contributions` - Liste des contributions (auth)
- `POST /api/leisure/contributions` - Créer une contribution (admin)
- `DELETE /api/leisure/contributions/:id` - Supprimer une contribution (admin)

### Attendance

- `GET /api/attendance` - Liste des présences (auth)
- `POST /api/attendance` - Créer une présence (auth)
- `DELETE /api/attendance/:id` - Supprimer une présence (admin)

### Storage

- `POST /api/storage/upload` - Upload un fichier (auth)
- `POST /api/storage/upload-multiple` - Upload plusieurs fichiers (auth)
- `DELETE /api/storage/:filename` - Supprimer un fichier (auth)

## 🔌 WebSocket Events

### Client → Server

- `message:send` - Envoyer un message
- `typing:start` - Commencer à taper
- `typing:stop` - Arrêter de taper
- `presence:online` - Marquer comme en ligne

### Server → Client

- `message:new` - Nouveau message
- `message:deleted` - Message supprimé
- `typing:user` - Un utilisateur tape
- `typing:stop` - Un utilisateur arrête de taper
- `presence:user-online` - Un utilisateur est en ligne
- `presence:user-offline` - Un utilisateur est hors ligne
- `event:updated` - Événement mis à jour
- `contribution:updated` - Cotisation mise à jour
- `profile:updated` - Profil mis à jour

## 🔐 Authentification

Toutes les routes protégées nécessitent un header `Authorization` :

```
Authorization: Bearer <votre-token-jwt>
```

## 📦 Structure du projet

```
api-backend/
├── prisma/
│   └── schema.prisma          # Schéma de la base de données
├── src/
│   ├── middleware/
│   │   ├── auth.ts            # Middleware d'authentification
│   │   ├── errorHandler.ts   # Gestionnaire d'erreurs
│   │   └── rateLimiter.ts    # Limitation de taux
│   ├── routes/
│   │   ├── auth.routes.ts     # Routes d'authentification
│   │   ├── profile.routes.ts  # Routes des profils
│   │   ├── site.routes.ts     # Routes des sites
│   │   ├── module.routes.ts   # Routes des modules
│   │   ├── subject.routes.ts  # Routes des sujets
│   │   ├── file.routes.ts     # Routes des fichiers
│   │   ├── contribution.routes.ts
│   │   ├── message.routes.ts
│   │   ├── setting.routes.ts
│   │   ├── leisure.routes.ts
│   │   ├── attendance.routes.ts
│   │   └── storage.routes.ts
│   ├── websocket/
│   │   └── index.ts           # Gestionnaire WebSocket
│   ├── lib/
│   │   └── prisma.ts          # Client Prisma
│   └── server.ts              # Point d'entrée
├── uploads/                   # Fichiers uploadés
├── .env                       # Variables d'environnement
├── .env.example              # Exemple de configuration
├── package.json
└── tsconfig.json
```

## 🚀 Déploiement

### Avec Docker

```bash
# Build l'image
docker build -t amisrim-api .

# Run le container
docker run -p 3001:3001 --env-file .env amisrim-api
```

### Avec Dokploy

1. Créez un nouveau service
2. Configurez les variables d'environnement
3. Déployez depuis Git

## 🔧 Scripts disponibles

- `npm run dev` - Démarrer en mode développement
- `npm run build` - Compiler TypeScript
- `npm start` - Démarrer en production
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Appliquer les migrations
- `npm run prisma:studio` - Ouvrir Prisma Studio
- `npm run prisma:push` - Push le schéma vers la DB

## 📝 Notes

- Les fichiers uploadés sont stockés dans le dossier `uploads/`
- Les tokens JWT expirent après 7 jours par défaut
- Le rate limiting est configuré à 100 requêtes par 15 minutes
- La taille maximale des fichiers est de 10MB par défaut

## 🆘 Support

Pour toute question ou problème, contactez l'équipe AMIS RIM TOGO.
