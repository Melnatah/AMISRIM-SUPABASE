# AMIS RIM TOGO - Portail des Résidents en Radiologie

![AMIS RIM TOGO](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 📋 Description

Plateforme web complète pour la gestion de l'Association des Médecins Internes et Résidents en Radiologie du Togo (AMIS RIM TOGO). Cette application permet la gestion des formations, stages, cotisations, activités de loisirs et la communication entre résidents.

## ✨ Fonctionnalités

### 🎓 Module Éducation
- Gestion des modules de formation par année
- Bibliothèque de documents (PDF, images, vidéos)
- Organisation par matières et sujets
- Accès sécurisé aux ressources pédagogiques

### 🏥 Gestion des Stages
- Suivi des sites de stage conventionnés
- Affectation des résidents par site
- Visualisation de la répartition géographique
- Gestion des rotations

### 💰 Caisse Commune
- Suivi des cotisations mensuelles
- Historique des contributions
- Statistiques financières en temps réel
- Gestion administrative des paiements

### 🎉 Loisirs & Activités
- Organisation d'événements (voyages, pique-niques, fêtes)
- Système d'inscription et de participation
- Gestion des contributions pour les activités
- Galerie photos des événements

### 💬 Messagerie
- Diffusion de messages officiels par le bureau
- Système de notifications en temps réel
- Gestion des priorités (info, important, critique)
- Suppression réservée aux administrateurs

### 📊 Statistiques
- Tableaux de bord interactifs
- Indicateurs de performance (KPI)
- Graphiques financiers et académiques
- Export des données en CSV

### 👤 Gestion des Profils
- Modification des informations personnelles
- Mise à jour email, téléphone, année de résidence
- Gestion sécurisée des données

### ✅ Système d'Émargement
- Émargement quotidien (Staff, EPU, DIU, Stage)
- Validation par les administrateurs
- Suivi des présences en temps réel

## 🚀 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn
- Compte Supabase

### Configuration

1. **Cloner le dépôt**
```bash
git clone https://github.com/Melnatah/AMISRIM-SUPABASE.git
cd AMISRIM-SUPABASE
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
   
Créer un fichier `.env.local` à la racine du projet :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

4. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🏗️ Architecture Technique

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling responsive
- **React Router** - Navigation
- **Recharts** - Visualisation de données

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Storage pour fichiers

### Build & Dev Tools
- **Vite** - Build tool moderne
- **ESM** - Modules ES natifs

## 🔐 Sécurité

### Authentification
- Système d'authentification Supabase
- Validation manuelle des nouveaux comptes par le bureau
- Gestion des rôles (admin/resident)

### Politiques de Sécurité (RLS)
- Accès aux données basé sur les rôles
- Isolation des données utilisateur
- Validation côté serveur

### Recommandations
⚠️ **Important** : Activer la protection contre les mots de passe compromis dans les paramètres Supabase Auth.

## 📱 Responsive Design

L'application est entièrement optimisée pour :
- 📱 Smartphones (iOS/Android)
- 💻 Tablettes
- 🖥️ Desktop

Fonctionnalités mobiles :
- Navigation tactile optimisée
- Barre de navigation mobile en bas d'écran
- Interface adaptative
- Touch targets optimaux (44px minimum)

## 🎨 Design System

### Couleurs
- **Primary**: `#0d59f2` (Bleu AMIS RIM)
- **Background Dark**: `#101622`
- **Surface Dark**: `#1e232e`

### Typographie
- **Display**: Inter
- **Body**: Plus Jakarta Sans
- **Accent**: Lexend

## 📦 Structure du Projet

```
├── components/          # Composants React
│   ├── Dashboard.tsx   # Tableau de bord principal
│   ├── Education.tsx   # Module éducation
│   ├── Messagerie.tsx  # Système de messagerie
│   ├── Cotisation.tsx  # Gestion des cotisations
│   ├── Loisir.tsx      # Activités de loisirs
│   ├── Statistics.tsx  # Statistiques et KPI
│   └── ...
├── services/           # Services (Supabase client)
├── types.ts           # Définitions TypeScript
├── constants.tsx      # Constantes de l'app
└── App.tsx           # Composant racine
```

## 🔄 Déploiement

### Build de Production
```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`

### Hébergement Recommandé
- **Vercel** (recommandé pour Vite)
- **Netlify**
- **Cloudflare Pages**

### Variables d'Environnement Production
Configurer les variables suivantes sur votre plateforme d'hébergement :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 👥 Rôles et Permissions

### Administrateur
- Gestion complète des utilisateurs
- Validation des inscriptions
- Création/suppression de contenus
- Diffusion de messages
- Validation des émargements
- Accès aux statistiques complètes

### Résident
- Consultation des modules de formation
- Téléchargement de documents
- Émargement quotidien
- Inscription aux activités
- Modification de son profil
- Réception des messages

## 🐛 Problèmes Connus & Optimisations

### Performance
- Quelques clés étrangères non indexées (impact mineur)
- Politiques RLS multiples sur certaines tables (optimisation possible)

### Améliorations Futures
- [ ] Système de chat en temps réel
- [ ] Notifications push
- [ ] Application mobile native
- [ ] Export PDF des statistiques
- [ ] Intégration calendrier

## 📞 Support

Pour toute question ou problème :
- **Email**: contact@amisrimtogo.org
- **GitHub Issues**: [Créer un ticket](https://github.com/Melnatah/AMISRIM-SUPABASE/issues)

## 📄 Licence

Ce projet est la propriété de l'AMIS RIM TOGO. Tous droits réservés.

## 🙏 Remerciements

Développé avec ❤️ pour la communauté des résidents en radiologie du Togo.

---

**Version**: 1.0.0  
**Dernière mise à jour**: Décembre 2024
