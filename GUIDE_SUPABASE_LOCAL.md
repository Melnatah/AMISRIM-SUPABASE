# 🏠 GUIDE : SUPABASE AUTO-HÉBERGÉ LOCAL + TUNNEL CLOUDFLARE

## 📋 Prérequis

- Docker Desktop installé et en cours d'exécution
- Git installé
- Compte Cloudflare (gratuit)
- Au moins 4GB de RAM disponible

## 🔧 PARTIE 1 : INSTALLATION DE SUPABASE LOCAL

### Étape 1 : Installer Supabase CLI

```bash
# Avec npm (recommandé)
npm install -g supabase

# OU avec Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Étape 2 : Initialiser Supabase Localement

```bash
# Créer un dossier pour Supabase
mkdir C:\supabase-local
cd C:\supabase-local

# Initialiser Supabase
supabase init

# Démarrer Supabase (télécharge les images Docker)
supabase start
```

**⏱️ Temps d'attente** : 5-10 minutes pour le premier démarrage

### Étape 3 : Récupérer les Credentials Locaux

Après `supabase start`, vous verrez :

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**💾 IMPORTANT** : Sauvegardez ces informations !

## 🌐 PARTIE 2 : CONFIGURATION DU TUNNEL CLOUDFLARE

### Étape 1 : Installer Cloudflared

```bash
# Télécharger depuis
# https://github.com/cloudflare/cloudflared/releases

# OU avec winget
winget install --id Cloudflare.cloudflared
```

### Étape 2 : Authentifier Cloudflare

```bash
cloudflared tunnel login
```

Cela ouvrira votre navigateur pour vous connecter à Cloudflare.

### Étape 3 : Créer un Tunnel

```bash
# Créer le tunnel
cloudflared tunnel create supabase-local

# Vous recevrez un UUID, par exemple:
# Created tunnel supabase-local with id: abc123-def456-ghi789
```

### Étape 4 : Configurer le Tunnel

Créer un fichier `config.yml` dans `C:\Users\Mel_natah\.cloudflared\config.yml` :

```yaml
tunnel: abc123-def456-ghi789  # Votre tunnel ID
credentials-file: C:\Users\Mel_natah\.cloudflared\abc123-def456-ghi789.json

ingress:
  # API Supabase
  - hostname: api.supabase.votredomaine.com
    service: http://localhost:54321
  
  # Studio Supabase
  - hostname: studio.supabase.votredomaine.com
    service: http://localhost:54323
  
  # Catch-all rule (requis)
  - service: http_status:404
```

### Étape 5 : Configurer DNS sur Cloudflare

```bash
# Pour l'API
cloudflared tunnel route dns supabase-local api.supabase.votredomaine.com

# Pour le Studio
cloudflared tunnel route dns supabase-local studio.supabase.votredomaine.com
```

### Étape 6 : Démarrer le Tunnel

```bash
cloudflared tunnel run supabase-local
```

**✅ Maintenant accessible via** :
- API : `https://api.supabase.votredomaine.com`
- Studio : `https://studio.supabase.votredomaine.com`

## 📦 PARTIE 3 : MIGRATION DES DONNÉES

### Étape 1 : Appliquer le Schéma

```bash
# Copier le script de migration
cp migration_to_jadeoffice.sql C:\supabase-local\supabase\migrations\20260101_initial_schema.sql

# Appliquer les migrations
supabase db reset
```

### Étape 2 : Vérifier les Tables

```bash
# Accéder au Studio local
# http://localhost:54323

# Ou via le tunnel
# https://studio.supabase.votredomaine.com
```

## 🔧 PARTIE 4 : CONFIGURATION DE L'APPLICATION

### Mettre à Jour .env

```env
# Configuration Supabase Local via Tunnel Cloudflare
VITE_SUPABASE_URL=https://api.supabase.votredomaine.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Votre anon key local
```

### Tester la Connexion

```bash
npm run dev
```

## 🔄 PARTIE 5 : AUTOMATISATION (OPTIONNEL)

### Créer un Service Windows pour le Tunnel

Créer `start-tunnel.bat` :

```batch
@echo off
cloudflared tunnel run supabase-local
```

### Créer un Service Windows pour Supabase

Créer `start-supabase.bat` :

```batch
@echo off
cd C:\supabase-local
supabase start
```

## 📊 ARCHITECTURE FINALE

```
Internet
    ↓
Cloudflare Tunnel (HTTPS)
    ↓
Localhost:54321 (API Supabase)
Localhost:54323 (Studio Supabase)
    ↓
PostgreSQL (Localhost:54322)
```

## ✅ AVANTAGES DE CETTE CONFIGURATION

1. **🔒 Sécurité** : HTTPS automatique via Cloudflare
2. **🌍 Accessible** : De n'importe où via Internet
3. **💰 Gratuit** : Pas de coûts d'hébergement
4. **⚡ Performance** : Données locales = ultra rapide
5. **🔧 Contrôle Total** : Vous gérez tout

## ⚠️ LIMITATIONS

1. **Disponibilité** : Votre PC doit rester allumé
2. **IP Dynamique** : Pas de problème avec Cloudflare Tunnel
3. **Bande Passante** : Limitée par votre connexion Internet
4. **Backup** : À gérer manuellement

## 🔐 SÉCURITÉ RECOMMANDÉE

1. **Activer l'authentification Cloudflare Access**
2. **Configurer des règles de pare-feu**
3. **Sauvegardes régulières** :

```bash
# Backup automatique
supabase db dump -f backup.sql
```

## 🆘 DÉPANNAGE

### Tunnel ne démarre pas
```bash
# Vérifier les logs
cloudflared tunnel info supabase-local
```

### Supabase ne démarre pas
```bash
# Vérifier Docker
docker ps

# Redémarrer Supabase
supabase stop
supabase start
```

### Erreur de connexion
```bash
# Vérifier les ports
netstat -ano | findstr "54321"
```

## 📞 COMMANDES UTILES

```bash
# Arrêter Supabase
supabase stop

# Voir les logs
supabase logs

# Réinitialiser la base de données
supabase db reset

# Créer une migration
supabase migration new nom_migration

# Appliquer les migrations
supabase db push
```

---

**Prêt à commencer ?** Dites-moi si vous voulez que je vous aide à exécuter ces étapes !
