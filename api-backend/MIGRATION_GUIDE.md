# Guide de Migration : Supabase → API Node.js

Ce guide vous aide à migrer votre application React de Supabase vers l'API Node.js personnalisée.

## 📋 Étapes de Migration

### 1. Installation de l'API

```bash
cd api-backend
npm install
cp .env.example .env
```

Configurez votre `.env` :

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/amisrim"
JWT_SECRET=votre-secret-jwt-tres-securise
CORS_ORIGIN=http://localhost:5173
```

### 2. Migration de la Base de Données

#### Option A : Nouvelle base de données

```bash
npm run prisma:push
```

#### Option B : Migration depuis Supabase existant

1. Exportez vos données depuis Supabase
2. Importez dans votre nouvelle base PostgreSQL
3. Appliquez le schéma Prisma :

```bash
npm run prisma:migrate
```

### 3. Démarrer l'API

```bash
npm run dev
```

L'API sera disponible sur `http://localhost:3001`

### 4. Mise à Jour du Frontend

#### A. Créer un nouveau service API

Créez `services/api.ts` dans votre projet React :

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### B. Créer un service d'authentification

Créez `services/auth.ts` :

```typescript
import api from './api';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  year?: string;
  hospital?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async signup(data: SignupData) {
    const response = await api.post('/auth/signup', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  logout() {
    localStorage.removeItem('auth_token');
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
```

#### C. Créer un hook WebSocket

Créez `hooks/useWebSocket.ts` :

```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/auth';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string) => {
    socketRef.current?.off(event);
  };

  return { socket: socketRef.current, isConnected, emit, on, off };
};
```

#### D. Remplacer les appels Supabase

**Avant (Supabase) :**

```typescript
import { supabase } from './services/supabase';

// Get profiles
const { data, error } = await supabase
  .from('profiles')
  .select('*');

// Insert
const { data, error } = await supabase
  .from('profiles')
  .insert({ firstName: 'John', lastName: 'Doe' });

// Update
const { data, error } = await supabase
  .from('profiles')
  .update({ firstName: 'Jane' })
  .eq('id', userId);

// Delete
const { data, error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', userId);

// Auth
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { firstName, lastName } }
});
```

**Après (API Node.js) :**

```typescript
import api from './services/api';

// Get profiles
const { data } = await api.get('/profiles');

// Insert
const { data } = await api.post('/profiles', {
  firstName: 'John',
  lastName: 'Doe'
});

// Update
const { data } = await api.put(`/profiles/${userId}`, {
  firstName: 'Jane'
});

// Delete
await api.delete(`/profiles/${userId}`);

// Auth
const { data } = await api.post('/auth/signup', {
  email,
  password,
  firstName,
  lastName
});
```

#### E. Remplacer le Storage

**Avant (Supabase Storage) :**

```typescript
const { data, error } = await supabase.storage
  .from('files')
  .upload('path/file.pdf', file);
```

**Après (API Node.js) :**

```typescript
const formData = new FormData();
formData.append('file', file);

const { data } = await api.post('/storage/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

#### F. Remplacer Realtime

**Avant (Supabase Realtime) :**

```typescript
supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => {
      console.log('New message:', payload);
    }
  )
  .subscribe();
```

**Après (WebSocket) :**

```typescript
import { useWebSocket } from './hooks/useWebSocket';

function MyComponent() {
  const { on, off } = useWebSocket();

  useEffect(() => {
    on('message:new', (message) => {
      console.log('New message:', message);
    });

    return () => {
      off('message:new');
    };
  }, []);
}
```

### 5. Variables d'Environnement Frontend

Mettez à jour votre `.env.local` :

```env
# Avant
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Après
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

### 6. Installer les dépendances Frontend

```bash
npm install axios socket.io-client
npm uninstall @supabase/supabase-js
```

### 7. Tester la Migration

1. Démarrez l'API : `cd api-backend && npm run dev`
2. Démarrez le frontend : `npm run dev`
3. Testez toutes les fonctionnalités :
   - ✅ Inscription / Connexion
   - ✅ CRUD sur toutes les ressources
   - ✅ Upload de fichiers
   - ✅ Messages en temps réel

## 🔄 Mapping des Tables

| Supabase Table | API Endpoint | Méthodes |
|----------------|--------------|----------|
| profiles | /api/profiles | GET, POST, PUT, DELETE |
| sites | /api/sites | GET, POST, PUT, DELETE |
| modules | /api/modules | GET, POST, PUT, DELETE |
| subjects | /api/subjects | GET, POST, DELETE |
| files | /api/files | GET, POST, DELETE |
| contributions | /api/contributions | GET, POST, PUT, DELETE |
| messages | /api/messages | GET, POST, DELETE |
| settings | /api/settings | GET, PUT |
| leisure_events | /api/leisure/events | GET, POST, PUT, DELETE |
| leisure_participants | /api/leisure/participants | GET, POST, PUT, DELETE |
| leisure_contributions | /api/leisure/contributions | GET, POST, DELETE |
| attendance | /api/attendance | GET, POST, DELETE |

## 🚀 Déploiement

### Production

1. Configurez votre base de données PostgreSQL en production
2. Déployez l'API sur votre serveur (Dokploy, VPS, etc.)
3. Mettez à jour les variables d'environnement du frontend :

```env
VITE_API_URL=https://api.amisrim.tg/api
VITE_WS_URL=https://api.amisrim.tg
```

## ✅ Checklist de Migration

- [ ] API installée et configurée
- [ ] Base de données migrée
- [ ] Service API créé dans le frontend
- [ ] Service d'authentification créé
- [ ] Hook WebSocket créé
- [ ] Tous les appels Supabase remplacés
- [ ] Upload de fichiers migré
- [ ] Realtime migré vers WebSocket
- [ ] Variables d'environnement mises à jour
- [ ] Tests effectués
- [ ] Déploiement en production

## 🆘 Problèmes Courants

### CORS Error

Vérifiez que `CORS_ORIGIN` dans `.env` correspond à l'URL de votre frontend.

### Token Expired

Le token JWT expire après 7 jours. Implémentez un refresh automatique ou demandez à l'utilisateur de se reconnecter.

### WebSocket ne se connecte pas

Vérifiez que le token est bien passé dans `auth` lors de la connexion WebSocket.

### Upload de fichiers échoue

Vérifiez que le dossier `uploads/` existe et a les bonnes permissions.

## 📞 Support

Pour toute question, contactez l'équipe de développement AMIS RIM TOGO.
