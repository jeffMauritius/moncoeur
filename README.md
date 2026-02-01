# MonCoeur

Application de gestion de vente de sacs de luxe d'occasion.

## Stack Technique

- **Frontend**: Next.js 14 (App Router) + shadcn/ui + Tailwind CSS
- **Backend**: NestJS (API routes integrees dans Next.js)
- **Database**: MongoDB Atlas
- **Storage**: Vercel Blob
- **Auth**: NextAuth.js v5
- **Email**: ZeptoMail
- **Video**: WebRTC (simple-peer)
- **Hosting**: Vercel

## Fonctionnalites

- **Authentification**: Connexion securisee avec NextAuth (email/mot de passe)
- **Gestion du stock**: CRUD complet des sacs avec photos, statuts et QR codes
- **Gestion des ventes**: Enregistrement des ventes avec calcul automatique des marges
- **Dashboard**: KPIs, graphiques, performances par plateforme et marque
- **Comptes bancaires**: Categorisation des achats/ventes par compte
- **Gestion utilisateurs**: Roles admin et vendeur
- **QR Codes**: Generation et scan pour acces rapide aux fiches produits
- **Export CSV**: Export des donnees de ventes et de stock
- **Import Excel**: Import initial des donnees depuis fichier Excel
- **Video Chat**: Appels video entre membres de l'equipe
- **Notifications email**: Alertes automatiques (nouveau sac, vente realisee)

## Documentation

- [PRD (Product Requirements Document)](./docs/PRD.md)

## Getting Started

### Prerequis

- Node.js 18+
- pnpm
- MongoDB Atlas account
- Vercel account (pour Blob storage)

### Installation

```bash
# Clone du projet
git clone <repo-url>
cd moncoeur

# Installation des dependances
pnpm install

# Configuration des variables d'environnement
cp .env.example .env.local
# Editer .env.local avec vos valeurs

# Developpement
pnpm dev

# Build
pnpm build
```

### Variables d'environnement

Copier `.env.example` vers `.env.local` et configurer:

- `MONGODB_URI`: URI de connexion MongoDB Atlas
- `NEXTAUTH_SECRET`: Secret pour NextAuth (generer avec `openssl rand -base64 32`)
- `NEXTAUTH_URL`: URL de l'application
- `BLOB_READ_WRITE_TOKEN`: Token Vercel Blob pour upload des photos
- `ZEPTOMAIL_API_KEY`: Cle API ZeptoMail pour les emails
- `ZEPTOMAIL_FROM_EMAIL`: Email d'envoi des notifications

### Premier lancement

1. Configurer les variables d'environnement
2. Lancer `pnpm dev`
3. Acceder a `/api/seed` pour creer les utilisateurs initiaux:
   - nadia@moncoeur.app / password (admin)
   - jeff@moncoeur.app / password (admin)
   - jeannette@moncoeur.app / password (vendeur)
4. Se connecter sur `/login`

## Structure du Projet

```
moncoeur/
├── apps/
│   ├── web/                  # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/          # Pages et API routes
│   │   │   ├── components/   # Composants UI
│   │   │   └── lib/          # Utilitaires, auth, DB
│   └── api/                  # Backend NestJS (reserve pour futures extensions)
├── packages/
│   └── shared/               # Types et constantes partages
└── docs/                     # Documentation
```

## Pages disponibles

- `/` - Dashboard avec KPIs et graphiques
- `/stock` - Liste des sacs en stock
- `/stock/new` - Ajouter un nouveau sac
- `/stock/[id]` - Detail d'un sac
- `/stock/[id]/edit` - Modifier un sac
- `/stock/scan` - Scanner un QR code
- `/sales` - Liste des ventes
- `/sales/new` - Enregistrer une vente
- `/sales/[id]` - Detail d'une vente
- `/bank-accounts` - Gestion des comptes bancaires (admin)
- `/users` - Gestion des utilisateurs (admin)
- `/import` - Import Excel (admin)
- `/video-chat` - Video chat
- `/settings` - Parametres

## Deploiement

1. Push sur GitHub
2. Connecter le repo a Vercel
3. Configurer les variables d'environnement dans Vercel
4. Deployer

## Licence

Prive - Tous droits reserves
