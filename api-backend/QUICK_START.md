# 🚀 Démarrage Rapide - API AMIS RIM TOGO

Guide ultra-rapide pour démarrer l'API en 5 minutes.

## ⚡ Installation Express (5 minutes)

### 1. Prérequis

Assurez-vous d'avoir :
- ✅ Node.js 18+ installé
- ✅ PostgreSQL 14+ en cours d'exécution
- ✅ Git installé

### 2. Installation

```bash
# Aller dans le dossier de l'API
cd api-backend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

### 3. Configuration

Éditez le fichier `.env` :

```env
# Base de données (IMPORTANT : Changez ces valeurs)
DATABASE_URL="postgresql://postgres:votreMotDePasse@localhost:5432/amisrim"

# JWT Secret (Générez une clé aléatoire sécurisée)
JWT_SECRET=changez-cette-cle-par-une-valeur-aleatoire-tres-longue

# CORS (URL de votre frontend)
CORS_ORIGIN=http://localhost:5173

# Admin par défaut
ADMIN_EMAIL=admin@amisrim.tg
ADMIN_PASSWORD=ChangeThisPassword123!
```

### 4. Initialisation de la Base de Données

```bash
# Tout en une commande !
npm run setup
```

Cette commande va :
- ✅ Générer le client Prisma
- ✅ Créer les tables dans la base de données
- ✅ Créer un utilisateur admin
- ✅ Initialiser les paramètres par défaut

### 5. Démarrer le Serveur

```bash
npm run dev
```

✅ **C'est tout !** L'API est maintenant disponible sur `http://localhost:3001`

## 🧪 Tester l'API

### Test de Santé

```bash
curl http://localhost:3001/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T00:00:00.000Z",
  "uptime": 1.234
}
```

### Test de Connexion Admin

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@amisrim.tg",
    "password": "ChangeThisPassword123!"
  }'
```

Réponse attendue :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@amisrim.tg",
    "firstName": "Admin",
    "lastName": "AMIS RIM",
    "role": "admin"
  }
}
```

### Test avec Postman ou Thunder Client

Importez cette collection :

```json
{
  "name": "AMIS RIM API",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "http://localhost:3001/api/auth/login",
      "body": {
        "email": "admin@amisrim.tg",
        "password": "ChangeThisPassword123!"
      }
    },
    {
      "name": "Get Profiles",
      "method": "GET",
      "url": "http://localhost:3001/api/profiles",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  ]
}
```

## 🔧 Commandes Utiles

```bash
# Développement avec hot reload
npm run dev

# Voir la base de données (interface graphique)
npm run prisma:studio

# Réinitialiser la base de données
npm run prisma:push
npm run prisma:seed

# Compiler pour la production
npm run build

# Démarrer en production
npm start
```

## 🐳 Démarrage avec Docker (Alternative)

Si vous préférez utiliser Docker :

```bash
# Démarrer tout (API + PostgreSQL)
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

## 📱 Intégration Frontend

### Installation des dépendances

```bash
# Dans votre projet React
npm install axios socket.io-client
```

### Configuration

Créez `.env.local` dans votre projet React :

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

### Exemple d'utilisation

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Login
const { data } = await api.post('/auth/login', {
  email: 'admin@amisrim.tg',
  password: 'ChangeThisPassword123!',
});

// Sauvegarder le token
localStorage.setItem('auth_token', data.token);

// Utiliser le token
api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

// Récupérer les profils
const profiles = await api.get('/profiles');
console.log(profiles.data);
```

## 🔐 Sécurité

### ⚠️ IMPORTANT - Avant la Production

1. **Changez le JWT_SECRET** :
   ```bash
   # Générez une clé aléatoire
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Changez le mot de passe admin** :
   - Connectez-vous avec le compte admin
   - Changez le mot de passe via l'interface

3. **Configurez CORS** :
   ```env
   CORS_ORIGIN=https://votre-domaine.com
   ```

4. **Utilisez HTTPS** en production

## 🆘 Problèmes Courants

### Erreur : "Cannot connect to database"

```bash
# Vérifiez que PostgreSQL est démarré
# Windows :
net start postgresql-x64-14

# Linux/Mac :
sudo systemctl start postgresql
```

### Erreur : "Port 3001 already in use"

```bash
# Changez le port dans .env
PORT=3002
```

### Erreur : "Prisma Client not generated"

```bash
npm run prisma:generate
```

## 📚 Documentation Complète

- [README.md](./README.md) - Documentation complète de l'API
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Guide de migration depuis Supabase

## ✅ Checklist de Démarrage

- [ ] Node.js et PostgreSQL installés
- [ ] Dépendances installées (`npm install`)
- [ ] Fichier `.env` configuré
- [ ] Base de données initialisée (`npm run setup`)
- [ ] Serveur démarré (`npm run dev`)
- [ ] Test de santé réussi
- [ ] Login admin réussi
- [ ] Frontend configuré (si applicable)

## 🎉 Prochaines Étapes

1. Lisez la [documentation complète](./README.md)
2. Explorez l'API avec Prisma Studio : `npm run prisma:studio`
3. Testez tous les endpoints
4. Intégrez avec votre frontend React
5. Déployez en production

---

**Besoin d'aide ?** Consultez la documentation complète ou contactez l'équipe AMIS RIM TOGO.
