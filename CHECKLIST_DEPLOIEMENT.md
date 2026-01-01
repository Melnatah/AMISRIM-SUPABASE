# 📋 CHECKLIST DE DÉPLOIEMENT - AMIS RIM TOGO SUR DOKPLOY

## ✅ PHASE 1 : PRÉPARATION (TERMINÉ)
- [x] Fichiers de configuration créés
- [x] Clés JWT générées
- [x] Script de migration prêt
- [x] Documentation complète
- [x] Tout committé sur GitHub

## 🔄 PHASE 2 : DÉPLOIEMENT SUPABASE (EN COURS)

### Étape 2.1 : Créer le Projet
- [ ] Accéder à Dokploy
- [ ] Créer projet "amis-rim-togo"

### Étape 2.2 : Déployer Supabase
- [ ] Ajouter service Docker Compose
- [ ] Copier dokploy-supabase.yml
- [ ] Configurer variables d'environnement :
  ```
  POSTGRES_PASSWORD=VotreMotDePasseSuperSecurise123!
  JWT_SECRET=T487BXMBTgOIp4r76mWSu6xtiMPySNPReZ1ZTLW7tew=
  ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY3Mjk1ODAyLCJleHAiOjIwODI2NTU4MDJ9.VIsz5QI7uvB0j-hr5oUCgY5KjOat9ybN6ESFMpOv3-4
  SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjcyOTU4MDIsImV4cCI6MjA4MjY1NTgwMn0.J3MkQvpuZurqmxB-4LRIHf6hhNpgexYxZtUddrTEU0A
  ```
- [ ] Uploader kong.yml
- [ ] Cliquer sur Deploy
- [ ] Attendre 5-10 minutes

### Étape 2.3 : Vérifier Supabase
- [ ] Vérifier que tous les conteneurs sont "Running"
- [ ] Accéder à Studio (http://IP:3001)
- [ ] Vérifier que l'interface s'affiche

## 🗄️ PHASE 3 : MIGRATION BASE DE DONNÉES

### Étape 3.1 : Accéder au SQL Editor
- [ ] Ouvrir Supabase Studio
- [ ] Cliquer sur "SQL Editor"
- [ ] Cliquer sur "New query"

### Étape 3.2 : Exécuter la Migration
- [ ] Copier migration_to_jadeoffice.sql
- [ ] Coller dans l'éditeur
- [ ] Cliquer sur "Run"
- [ ] Attendre la fin de l'exécution

### Étape 3.3 : Vérifier les Tables
- [ ] Aller dans "Table Editor"
- [ ] Vérifier les 12 tables :
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

## 🌐 PHASE 4 : DÉPLOIEMENT APPLICATION

### Étape 4.1 : Ajouter Service Git
- [ ] Retour au projet Dokploy
- [ ] Add Service → Git Repository
- [ ] Nom : "amis-rim-app"

### Étape 4.2 : Configuration Repository
- [ ] Repository URL : https://github.com/Melnatah/AMISRIM-SUPABASE
- [ ] Branch : main
- [ ] Build Command : npm run build
- [ ] Start Command : npm run preview
- [ ] Port : 4173

### Étape 4.3 : Variables d'Environnement
- [ ] Ajouter VITE_SUPABASE_URL=http://VOTRE_IP:8000
- [ ] Ajouter VITE_SUPABASE_ANON_KEY=[la clé générée]

### Étape 4.4 : Déployer
- [ ] Cliquer sur Deploy
- [ ] Attendre le build (3-5 minutes)
- [ ] Vérifier que le service est "Running"

## ✅ PHASE 5 : TESTS FINAUX

### Étape 5.1 : Accéder à l'Application
- [ ] Ouvrir http://VOTRE_IP:PORT_ASSIGNE
- [ ] Vérifier que la page de connexion s'affiche

### Étape 5.2 : Tester la Connexion
- [ ] Essayer de se connecter
- [ ] Vérifier que le dashboard s'affiche
- [ ] Vérifier que les données se chargent

### Étape 5.3 : Vérifier les Fonctionnalités
- [ ] Navigation entre les pages
- [ ] Chargement des modules
- [ ] Messagerie
- [ ] Profil utilisateur

## 🎉 DÉPLOIEMENT TERMINÉ !

---

**Temps estimé total** : 30-45 minutes
**Difficulté** : Moyenne

**En cas de problème** :
1. Vérifier les logs dans Dokploy
2. Vérifier que Docker a assez de ressources
3. Consulter GUIDE_DOKPLOY_DEPLOYMENT.md
4. Me contacter avec le message d'erreur exact
