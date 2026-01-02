# 🏗️ Architecture de l'API - Guide Développeur

Ce document explique l'architecture technique de l'API Node.js AMIS RIM TOGO.

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React App)                    │
│              HTTP REST + WebSocket (Socket.IO)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API SERVER (Express)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Middleware Layer                     │  │
│  │  - CORS                                          │  │
│  │  - Helmet (Security)                             │  │
│  │  - Rate Limiter                                  │  │
│  │  - JWT Authentication                            │  │
│  │  - Error Handler                                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Routes Layer                         │  │
│  │  - Auth Routes                                   │  │
│  │  - Profile Routes                                │  │
│  │  - Site Routes                                   │  │
│  │  - Module/Subject/File Routes                   │  │
│  │  - Contribution Routes                           │  │
│  │  - Message Routes                                │  │
│  │  - Leisure Routes                                │  │
│  │  - Storage Routes                                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Business Logic Layer                    │  │
│  │  - Validation (Zod)                              │  │
│  │  - Authorization                                 │  │
│  │  - Data Transformation                           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Data Access Layer                    │  │
│  │  - Prisma ORM                                    │  │
│  │  - Database Queries                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  - Users & Profiles                                      │
│  - Sites, Modules, Subjects, Files                      │
│  - Contributions, Messages, Settings                    │
│  - Leisure Events, Participants, Contributions          │
│  - Attendance                                            │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Flow d'Authentification

```
1. Client → POST /api/auth/signup
   ↓
2. API valide les données (Zod)
   ↓
3. Hash du mot de passe (bcrypt)
   ↓
4. Création User + Profile (Prisma transaction)
   ↓
5. Génération JWT token
   ↓
6. Retour token + user data
   ↓
7. Client stocke token (localStorage)
   ↓
8. Requêtes suivantes → Header: Authorization: Bearer <token>
   ↓
9. Middleware auth.ts vérifie token
   ↓
10. Extraction user info → req.user
    ↓
11. Route handler accède à req.user
```

## 🛣️ Structure des Routes

### Pattern Standard

Chaque route suit ce pattern :

```typescript
// 1. Imports
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

// 2. Router instance
const router = Router();

// 3. Validation schemas
const createSchema = z.object({
  field1: z.string(),
  field2: z.number(),
});

// 4. GET endpoint
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = await prisma.model.findMany();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// 5. POST endpoint (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const validated = createSchema.parse(req.body);
    const created = await prisma.model.create({ data: validated });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    next(error);
  }
});

// 6. Export
export default router;
```

## 🔒 Middleware Chain

### Ordre d'Exécution

```
Request
  ↓
1. helmet() - Sécurité headers
  ↓
2. cors() - CORS policy
  ↓
3. express.json() - Parse JSON body
  ↓
4. rateLimiter - Limite requêtes
  ↓
5. authenticate - Vérifie JWT (si route protégée)
  ↓
6. requireAdmin - Vérifie rôle admin (si route admin)
  ↓
7. Route Handler - Logique métier
  ↓
8. Response
  ↓
9. errorHandler - Gestion erreurs (si erreur)
```

## 🗄️ Modèle de Données Prisma

### Relations Principales

```
User (1) ←→ (1) Profile
              ↓
              ├─→ (N) Contributions
              ├─→ (N) Files (uploaded)
              ├─→ (N) LeisureEvents (created)
              ├─→ (N) LeisureParticipants
              ├─→ (N) LeisureContributions
              └─→ (N) Attendance

Module (1) ←→ (N) Subjects
  ↓              ↓
  └─→ (N) Files ←┘

LeisureEvent (1) ←→ (N) LeisureParticipants
                 └→ (N) LeisureContributions
```

### Exemple de Requête Complexe

```typescript
// Récupérer un événement avec tous ses participants et contributions
const event = await prisma.leisureEvent.findUnique({
  where: { id: eventId },
  include: {
    participants: {
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    contributions: {
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    },
    creator: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
  },
});
```

## 🔌 WebSocket Architecture

### Connection Flow

```
1. Client se connecte avec token JWT
   ↓
2. Middleware WebSocket vérifie token
   ↓
3. Socket rejoint room user:${userId}
   ↓
4. Écoute des événements
   ↓
5. Émission d'événements vers clients
```

### Événements Disponibles

```typescript
// Client → Server
socket.emit('message:send', data);
socket.emit('typing:start', data);
socket.emit('typing:stop');
socket.emit('presence:online');

// Server → Client
socket.on('message:new', (data) => {});
socket.on('message:deleted', (data) => {});
socket.on('typing:user', (data) => {});
socket.on('presence:user-online', (data) => {});
socket.on('presence:user-offline', (data) => {});
```

## 📁 Upload de Fichiers

### Flow d'Upload

```
1. Client → FormData avec fichier
   ↓
2. Multer middleware intercepte
   ↓
3. Validation type + taille
   ↓
4. Génération nom unique (UUID)
   ↓
5. Sauvegarde dans /uploads
   ↓
6. Retour URL du fichier
   ↓
7. Client sauvegarde URL en DB via /api/files
```

### Configuration Multer

```typescript
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx|ppt|pptx/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, valid);
  },
});
```

## 🛡️ Sécurité

### Mesures Implémentées

1. **JWT Authentication**
   - Tokens signés avec secret
   - Expiration après 7 jours
   - Refresh tokens disponibles

2. **Password Hashing**
   - bcrypt avec salt rounds = 10
   - Jamais de mots de passe en clair

3. **Rate Limiting**
   - 100 requêtes / 15 minutes par IP
   - Protection contre brute force

4. **Input Validation**
   - Zod schemas pour toutes les entrées
   - Validation stricte des types

5. **CORS**
   - Origine configurée
   - Credentials autorisés

6. **Helmet**
   - Headers de sécurité HTTP
   - Protection XSS, clickjacking, etc.

7. **SQL Injection**
   - Prisma utilise des requêtes préparées
   - Pas de SQL brut

## 🔄 Gestion des Erreurs

### Hiérarchie des Erreurs

```
Error
  ↓
AppError (custom)
  ↓
├─ ValidationError (400)
├─ AuthenticationError (401)
├─ AuthorizationError (403)
├─ NotFoundError (404)
└─ ServerError (500)
```

### Flow de Gestion

```
1. Erreur lancée dans route handler
   ↓
2. Capturée par try/catch
   ↓
3. Passée à next(error)
   ↓
4. Middleware errorHandler
   ↓
5. Log de l'erreur
   ↓
6. Réponse JSON formatée
   ↓
7. Stack trace (dev only)
```

## 📊 Performance

### Optimisations Implémentées

1. **Database Indexes**
   ```prisma
   @@index([email])
   @@index([role])
   @@index([moduleId])
   ```

2. **Connection Pooling**
   - Prisma gère automatiquement
   - Réutilisation des connexions

3. **Selective Queries**
   ```typescript
   // Seulement les champs nécessaires
   select: {
     id: true,
     firstName: true,
     lastName: true,
   }
   ```

4. **Pagination** (à implémenter)
   ```typescript
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 20;
   const skip = (page - 1) * limit;

   const data = await prisma.model.findMany({
     skip,
     take: limit,
   });
   ```

## 🧪 Testing (à implémenter)

### Structure Recommandée

```
tests/
├── unit/
│   ├── middleware/
│   │   ├── auth.test.ts
│   │   └── rateLimiter.test.ts
│   └── routes/
│       ├── auth.test.ts
│       └── profile.test.ts
├── integration/
│   ├── api.test.ts
│   └── database.test.ts
└── e2e/
    └── user-flow.test.ts
```

### Outils Recommandés

- **Jest** - Framework de test
- **Supertest** - Test HTTP
- **@faker-js/faker** - Données de test

## 🚀 Déploiement

### Variables d'Environnement Requises

```env
# Production
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<64-char-random-string>
CORS_ORIGIN=https://app.amisrim.tg

# Optionnel
PORT=3001
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
```

### Checklist Déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] JWT_SECRET changé
- [ ] CORS_ORIGIN configuré
- [ ] HTTPS activé
- [ ] Logs configurés
- [ ] Backups DB configurés
- [ ] Monitoring activé

## 📚 Ressources Utiles

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Production](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Maintenu par l'équipe AMIS RIM TOGO**
