# 🚀 GUIDE DE DÉPLOIEMENT - AMIS RIM TOGO

## 📦 Déploiement sur Dokploy avec Nginx

### Prérequis
- Serveur avec Docker et Dokploy installés
- Accès SSH au serveur
- Domaine configuré (ex: amisrim.jadeoffice.cloud)

### Étapes de Déploiement

#### 1. Cloner le Repository

```bash
cd /opt
git clone https://github.com/Melnatah/AMISRIM-SUPABASE.git
cd AMISRIM-SUPABASE
```

#### 2. Builder l'Image Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://supabase.jadeoffice.cloud \
  --build-arg VITE_SUPABASE_ANON_KEY=VOTRE_ANON_KEY \
  -t amis-rim-app:latest .
```

#### 3. Lancer le Conteneur

```bash
docker run -d \
  --name amis-rim-app \
  --network dokploy-network \
  -p 4173:4173 \
  --restart unless-stopped \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.amis-rim-app.rule=Host(\`amisrim.jadeoffice.cloud\`)" \
  --label "traefik.http.routers.amis-rim-app.entrypoints=websecure" \
  --label "traefik.http.routers.amis-rim-app.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.amis-rim-app.loadbalancer.server.port=4173" \
  amis-rim-app:latest
```

#### 4. Vérifier le Déploiement

```bash
# Voir les logs
docker logs -f amis-rim-app

# Tester localement
curl http://localhost:4173

# Accéder via le navigateur
# https://amisrim.jadeoffice.cloud
```

## 🔧 Configuration

### Variables d'Environnement

Les variables suivantes doivent être passées au moment du build :

- `VITE_SUPABASE_URL` : URL de votre instance Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé anonyme Supabase

### Ports

- **4173** : Port de l'application (Nginx)

### Réseau

L'application doit être sur le réseau `dokploy-network` pour être accessible via Traefik.

## 📊 Architecture

```
Application (Nginx)
├── Stage 1: Build (Node.js)
│   ├── npm ci (installer dépendances)
│   ├── npm run build (compiler React)
│   └── Générer dist/
│
└── Stage 2: Production (Nginx)
    ├── Copier dist/ → /usr/share/nginx/html
    ├── Configuration Nginx
    └── Servir sur port 4173
```

## 🔄 Mise à Jour

Pour mettre à jour l'application :

```bash
cd /opt/AMISRIM-SUPABASE
git pull origin main

docker stop amis-rim-app
docker rm amis-rim-app

docker build \
  --build-arg VITE_SUPABASE_URL=https://supabase.jadeoffice.cloud \
  --build-arg VITE_SUPABASE_ANON_KEY=VOTRE_ANON_KEY \
  -t amis-rim-app:latest .

# Relancer avec la même commande docker run
```

## 🆘 Dépannage

### Le conteneur ne démarre pas

```bash
docker logs amis-rim-app
```

### L'application n'est pas accessible

```bash
# Vérifier que le conteneur tourne
docker ps | grep amis-rim-app

# Vérifier le réseau
docker inspect amis-rim-app | grep -A 10 Networks

# Vérifier Traefik
docker logs dokploy-traefik
```

### Erreur de build

```bash
# Nettoyer le cache Docker
docker system prune -a

# Rebuilder
docker build --no-cache -t amis-rim-app:latest .
```

## ✅ Production Checklist

- [ ] Supabase déployé et accessible
- [ ] Base de données migrée (12 tables)
- [ ] Variables d'environnement configurées
- [ ] Application buildée avec succès
- [ ] Conteneur démarré et en état "Running"
- [ ] HTTPS fonctionnel (certificat Let's Encrypt)
- [ ] Application accessible via le domaine
- [ ] Compte admin créé dans Supabase
- [ ] Toutes les fonctionnalités testées

---

**Déploiement réussi !** 🎉
