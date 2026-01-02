# 🎯 API Node.js - Remplacement de Supabase

## ✅ Votre API est Prête !

Une **API Node.js complète** a été créée dans le dossier `api-backend/` pour remplacer Supabase dans votre application AMIS RIM TOGO.

## 📦 Ce qui a été créé

```
api-backend/
├── 📁 prisma/              # Schéma de base de données
├── 📁 src/                 # Code source TypeScript
│   ├── middleware/         # Auth, sécurité, rate limiting
│   ├── routes/             # 12 modules de routes API
│   ├── websocket/          # Temps réel avec Socket.IO
│   └── server.ts           # Point d'entrée
├── 📄 Dockerfile           # Image Docker optimisée
├── 📄 docker-compose.yml   # PostgreSQL + API
├── 📄 README.md            # Documentation complète
├── 📄 QUICK_START.md       # Démarrage en 5 minutes ⭐
├── 📄 MIGRATION_GUIDE.md   # Guide de migration Supabase → API
├── 📄 ARCHITECTURE.md      # Architecture technique
├── 📄 SUMMARY.md           # Récapitulatif complet
└── 📄 postman_collection.json  # Tests API
```

## 🚀 Démarrage Rapide (5 minutes)

### 1. Installer les dépendances

```bash
cd api-backend
npm install
```

### 2. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
# Minimum requis : DATABASE_URL, JWT_SECRET, CORS_ORIGIN
```

### 3. Initialiser la base de données

```bash
# Tout en une commande !
npm run setup
```

Cette commande va :
- ✅ Générer le client Prisma
- ✅ Créer les tables
- ✅ Créer un admin par défaut
- ✅ Initialiser les paramètres

### 4. Démarrer le serveur

```bash
npm run dev
```

✅ **L'API est maintenant disponible sur `http://localhost:3001`**

### 5. Tester

```bash
# Test de santé
curl http://localhost:3001/health

# Login admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amisrim.tg","password":"ChangeThisPassword123!"}'
```

## 📚 Documentation Complète

| Fichier | Description |
|---------|-------------|
| **[QUICK_START.md](api-backend/QUICK_START.md)** | ⭐ Démarrage en 5 minutes |
| **[README.md](api-backend/README.md)** | Documentation complète de l'API |
| **[MIGRATION_GUIDE.md](api-backend/MIGRATION_GUIDE.md)** | Migration Supabase → API |
| **[ARCHITECTURE.md](api-backend/ARCHITECTURE.md)** | Architecture technique |
| **[SUMMARY.md](api-backend/SUMMARY.md)** | Récapitulatif complet |

## 🎯 Fonctionnalités

### ✅ Authentification & Sécurité
- JWT avec expiration et refresh tokens
- Hachage bcrypt des mots de passe
- Gestion des rôles (Admin/Resident)
- Rate limiting anti-DDoS
- CORS et Helmet configurés

### ✅ Base de Données
- PostgreSQL avec Prisma ORM
- 12 tables complètes
- Migrations automatiques
- Indexes optimisés

### ✅ API REST
- 50+ endpoints RESTful
- Validation Zod
- Gestion d'erreurs centralisée
- Documentation Postman

### ✅ Fichiers
- Upload avec Multer
- Validation types et tailles
- Stockage local (extensible S3)

### ✅ Temps Réel
- WebSocket avec Socket.IO
- Authentification JWT
- Événements en temps réel

### ✅ DevOps
- Docker & Docker Compose
- Health checks
- Scripts npm pratiques
- Hot reload en dev

## 🔄 Migration depuis Supabase

### Frontend - Avant/Après

**Avant (Supabase) :**
```typescript
import { supabase } from './services/supabase';

const { data } = await supabase
  .from('profiles')
  .select('*');
```

**Après (API Node.js) :**
```typescript
import api from './services/api';

const { data } = await api.get('/profiles');
```

Consultez [MIGRATION_GUIDE.md](api-backend/MIGRATION_GUIDE.md) pour le guide complet.

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Développement avec hot reload
npm run build        # Compiler TypeScript
npm start            # Production
npm run setup        # Installation complète (DB + seed)
npm run check        # Vérifier l'installation
npm run prisma:studio    # Interface graphique DB
```

## 🐳 Docker (Alternative)

```bash
# Démarrer API + PostgreSQL
cd api-backend
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

## 📊 Endpoints Principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/signup` | POST | Créer un compte |
| `/api/auth/login` | POST | Se connecter |
| `/api/profiles` | GET | Liste des profils |
| `/api/sites` | GET/POST | Sites de stage |
| `/api/modules` | GET/POST | Modules éducatifs |
| `/api/contributions` | GET/POST | Cotisations |
| `/api/messages` | GET/POST | Messages |
| `/api/leisure/events` | GET/POST | Événements loisirs |
| `/api/storage/upload` | POST | Upload fichiers |

Voir [README.md](api-backend/README.md) pour la liste complète.

## ⚠️ Important - Sécurité

Avant la production :

1. **Changez JWT_SECRET** :
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Changez le mot de passe admin**

3. **Configurez HTTPS**

4. **Mettez à jour CORS_ORIGIN**

## 🎓 Prochaines Étapes

1. ✅ Lisez [QUICK_START.md](api-backend/QUICK_START.md)
2. ✅ Installez et testez l'API
3. ✅ Migrez votre frontend (voir [MIGRATION_GUIDE.md](api-backend/MIGRATION_GUIDE.md))
4. ✅ Testez toutes les fonctionnalités
5. ✅ Déployez en production

## 💡 Avantages vs Supabase

| Critère | Supabase | API Node.js |
|---------|----------|-------------|
| Coût | Payant après limite | Gratuit (auto-hébergé) |
| Contrôle | Limité | Total |
| Personnalisation | Limitée | Illimitée |
| Vendor Lock-in | Oui | Non |
| Performance | Dépend du plan | Optimisable |

## 🆘 Besoin d'Aide ?

1. Consultez la documentation dans `api-backend/`
2. Exécutez `npm run check` pour vérifier l'installation
3. Testez avec Prisma Studio : `npm run prisma:studio`
4. Importez `postman_collection.json` dans Postman

## 📞 Support

Pour toute question, consultez :
- [QUICK_START.md](api-backend/QUICK_START.md) - Démarrage rapide
- [README.md](api-backend/README.md) - Documentation complète
- [MIGRATION_GUIDE.md](api-backend/MIGRATION_GUIDE.md) - Migration

---

**🎉 Félicitations ! Vous avez maintenant une API complète, sécurisée et performante !**

*Créé pour AMIS RIM TOGO 🇹🇬 - Portail des Résidents en Radiologie*
