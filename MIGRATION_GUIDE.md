# 🔄 GUIDE DE MIGRATION VERS JADEOFFICE.CLOUD

## 📋 Informations de la Nouvelle Instance

- **URL API**: `https://supabase.jadeoffice.cloud`
- **Studio**: `http://studio.jadeoffice.cloud`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🚀 ÉTAPES DE MIGRATION

### Étape 1: Exécuter le Script SQL

1. **Ouvrir Supabase Studio**
   - Aller sur: `http://studio.jadeoffice.cloud`
   - Se connecter avec vos identifiants

2. **Accéder au SQL Editor**
   - Dans le menu de gauche, cliquer sur "SQL Editor"
   - Cliquer sur "New query"

3. **Copier-Coller le Script**
   - Ouvrir le fichier `migration_to_jadeoffice.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL

4. **Exécuter le Script**
   - Cliquer sur "Run" (ou Ctrl+Enter)
   - Attendre la fin de l'exécution (peut prendre 1-2 minutes)
   - Vérifier qu'il n'y a pas d'erreurs

### Étape 2: Mettre à Jour les Variables d'Environnement

1. **Modifier `.env.local`**

```env
# Ancienne configuration (à remplacer)
# VITE_SUPABASE_URL=https://xwnnvnmzpzekoubrmrfg.supabase.co
# VITE_SUPABASE_ANON_KEY=ancienne_clé

# Nouvelle configuration JadeOffice
VITE_SUPABASE_URL=https://supabase.jadeoffice.cloud
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.9u8ayd2jUQt7R6G6cUl2YZLWwFoW2F26zTfRCDt3ewU
```

2. **Sauvegarder le fichier**

### Étape 3: Tester l'Application

1. **Redémarrer le serveur de développement**
```bash
# Arrêter le serveur actuel (Ctrl+C)
# Relancer
npm run dev
```

2. **Vérifier la connexion**
   - Ouvrir `http://localhost:3000`
   - Essayer de se connecter
   - Vérifier que les données s'affichent

### Étape 4: Migrer les Données (Optionnel)

Si vous voulez migrer les données existantes :

#### Option A: Export/Import Manuel

1. **Exporter depuis l'ancienne instance**
   - Aller sur l'ancien Supabase Studio
   - Pour chaque table: Table Editor > Export > CSV

2. **Importer dans la nouvelle instance**
   - Aller sur `http://studio.jadeoffice.cloud`
   - Pour chaque table: Table Editor > Import > CSV

#### Option B: Script SQL de Migration de Données

Je peux créer un script pour copier automatiquement les données si vous le souhaitez.

### Étape 5: Configuration de l'Authentification

1. **Configurer les Providers**
   - Aller dans Authentication > Providers
   - Configurer Email (activé par défaut)
   - Désactiver les providers non utilisés

2. **Paramètres de Sécurité**
   - Authentication > Policies
   - Activer "Leaked Password Protection"
   - Configurer les règles de mot de passe

### Étape 6: Configuration du Storage (Si utilisé)

Si vous utilisez le Storage Supabase pour les fichiers:

1. **Créer les buckets**
   - Aller dans Storage
   - Créer un bucket "files" (ou selon votre configuration)
   - Configurer les politiques d'accès

2. **Migrer les fichiers**
   - Télécharger depuis l'ancien Storage
   - Uploader vers le nouveau Storage

## ✅ VÉRIFICATIONS POST-MIGRATION

### Checklist de Validation

- [ ] Toutes les tables sont créées
- [ ] Les politiques RLS sont actives
- [ ] Les fonctions et triggers fonctionnent
- [ ] L'application se connecte à la nouvelle instance
- [ ] La connexion utilisateur fonctionne
- [ ] Les données s'affichent correctement
- [ ] Les opérations CRUD fonctionnent
- [ ] Les temps réels (real-time) fonctionnent

### Tests à Effectuer

1. **Authentification**
   - [ ] Connexion
   - [ ] Déconnexion
   - [ ] Inscription (si activée)

2. **Modules**
   - [ ] Dashboard s'affiche
   - [ ] Éducation: voir les modules
   - [ ] Messagerie: voir les messages
   - [ ] Cotisation: voir les contributions
   - [ ] Loisirs: voir les événements

3. **Permissions**
   - [ ] Admin peut créer/modifier/supprimer
   - [ ] Résident a accès en lecture
   - [ ] Les politiques RLS fonctionnent

## 🔧 DÉPANNAGE

### Erreur: "Failed to fetch"
- Vérifier que l'URL dans `.env.local` est correcte
- Vérifier que la clé anon est correcte
- Redémarrer le serveur de dev

### Erreur: "Row Level Security policy violation"
- Vérifier que toutes les politiques RLS sont créées
- Vérifier que l'utilisateur a le bon rôle

### Erreur: "relation does not exist"
- Vérifier que le script SQL s'est exécuté complètement
- Réexécuter le script si nécessaire

## 📞 SUPPORT

Si vous rencontrez des problèmes:
1. Vérifier les logs dans la console du navigateur (F12)
2. Vérifier les logs Supabase dans le Studio
3. Me contacter avec le message d'erreur exact

## 🎯 PROCHAINES ÉTAPES

Une fois la migration réussie:

1. **Mettre à jour la production**
   - Déployer sur Vercel/Netlify
   - Configurer les variables d'environnement de production

2. **Sauvegardes**
   - Configurer les sauvegardes automatiques
   - Tester la restauration

3. **Monitoring**
   - Surveiller les performances
   - Vérifier les logs régulièrement

---

**Date de migration**: 2026-01-01  
**Version**: 1.0.0  
**Status**: Prêt pour migration
