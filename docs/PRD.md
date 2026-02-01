# PRD - MonCoeur
## Application de Gestion de Vente de Sacs de Luxe

**Version:** 1.0
**Date:** 1er Février 2026
**Projet:** MonCoeur
**Client:** Nadia

---

## 1. Vision du Produit

### 1.1 Contexte
MonCoeur est une application de gestion destinee a optimiser l'activite de revente de sacs de luxe d'occasion. L'activite consiste a :
1. Acheter des sacs de luxe sur des plateformes (Vinted, Vestiaire Collectif, etc.)
2. Remettre les sacs en etat (via prestataire "Gianni" ou autre)
3. Revendre sur les memes plateformes avec une marge

### 1.2 Objectifs
- Centraliser la gestion du stock de sacs
- Suivre les achats, remises en etat et ventes
- Calculer les marges et performances par plateforme
- Faciliter la communication entre vendeurs via video chat
- Automatiser les taches repetitives (etiquetage QR, notifications email)

---

## 2. Utilisateurs

### 2.1 Roles

| Role | Utilisateurs | Permissions |
|------|-------------|-------------|
| **Administrateur** | Nadia, Jeff | Acces complet : gestion utilisateurs, comptes bancaires, configuration, toutes les operations |
| **Vendeur** | Jeannette | Gestion stock, ventes, consultation dashboard, video chat |

### 2.2 Nombre d'utilisateurs
- Phase initiale : 3 utilisateurs
- Evolutivite prevue : jusqu'a 10 utilisateurs

---

## 3. Stack Technique

### 3.1 Architecture

```
+-------------------------------------------------------------+
|                         VERCEL                               |
+-------------------------------------------------------------+
|  +------------------+    +------------------+                |
|  |   Frontend       |    |    Backend       |                |
|  |   Next.js 14     |<-->|    NestJS        |                |
|  |   App Router     |    |    API REST      |                |
|  |   shadcn/ui      |    |    WebSocket     |                |
|  |   Tailwind CSS   |    |                  |                |
|  +------------------+    +--------+---------+                |
|                                   |                          |
|  +------------------+    +--------v---------+                |
|  |  Vercel Blob     |    |  MongoDB Atlas   |                |
|  |  (Photos)        |    |  (Database)      |                |
|  +------------------+    +------------------+                |
|                                                              |
|  +------------------+    +------------------+                |
|  |   ZeptoMail      |    |   WebRTC         |                |
|  |   (Emails)       |    |   (Video Chat)   |                |
|  +------------------+    +------------------+                |
+-------------------------------------------------------------+
```

### 3.2 Technologies

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Frontend | Next.js (App Router) | 14.x |
| UI Components | shadcn/ui | latest |
| Styling | Tailwind CSS | 3.x |
| Backend | NestJS | 10.x |
| Database | MongoDB Atlas | 7.x |
| File Storage | Vercel Blob | latest |
| Authentication | NextAuth.js | 5.x |
| Email | ZeptoMail | API v1.1 |
| Video Chat | WebRTC (simple-peer) | latest |
| QR Code | qrcode.react | latest |
| Hosting | Vercel | - |
| Version Control | GitHub | - |

---

## 4. Modele de Donnees

### 4.1 User (Utilisateur)

```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string; // hashed
  name: string;
  role: 'admin' | 'seller';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 BankAccount (Compte Bancaire)

> Note: Base sur les feuilles Excel (beatrice, tiziana, goergio, jenacha)

```typescript
interface BankAccount {
  _id: ObjectId;
  label: string; // ex: "Beatrice", "Tiziana", "Goergio", "Jenacha"
  description?: string;
  isActive: boolean;
  createdBy: ObjectId; // ref User
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Bag (Sac)

```typescript
interface Bag {
  _id: ObjectId;
  reference: string; // auto-genere: MC-2026-00001

  // Informations produit
  brand: string; // Marque
  model: string; // Modele
  description: string; // Description detaillee
  color?: string;
  size?: string;
  condition: 'neuf_etiquette' | 'neuf_sans_etiquette' | 'tres_bon' | 'bon' | 'correct';

  // Achat
  purchaseDate: Date;
  purchasePrice: number;
  purchasePlatform: 'vinted' | 'vestiaire_collectif' | 'autre';
  purchaseBankAccountId: ObjectId; // ref BankAccount

  // Remise en etat
  refurbishmentCost: number; // Frais Gianni ou autre
  refurbishmentProvider?: string; // ex: "Gianni"
  refurbishmentNotes?: string;

  // Photos
  photos: string[]; // URLs Vercel Blob

  // Statut
  status: 'en_commande' | 'en_transit' | 'recu' | 'en_remise_en_etat' | 'pret_a_vendre' | 'en_vente' | 'vendu';

  // QR Code
  qrCodeUrl?: string;

  // Metadata
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.4 Sale (Vente)

```typescript
interface Sale {
  _id: ObjectId;
  bagId: ObjectId; // ref Bag

  // Vente
  saleDate: Date;
  salePrice: number;
  salePlatform: 'vinted' | 'vestiaire_collectif' | 'autre';
  platformFees?: number;
  shippingCost?: number;

  // Compte bancaire
  bankAccountId: ObjectId; // ref BankAccount

  // Calculs automatiques
  margin: number; // salePrice - purchasePrice - refurbishmentCost - platformFees - shippingCost
  marginPercent: number; // (margin / purchasePrice) * 100

  // Notes
  notes?: string;

  // Metadata
  soldBy: ObjectId; // ref User
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. Modules Fonctionnels

### 5.1 Module Authentification

#### Fonctionnalites
- Connexion securisee via NextAuth (email/password)
- Gestion des sessions
- Protection des routes selon les roles
- Deconnexion

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| AUTH-01 | En tant qu'utilisateur, je peux me connecter avec mon email/mot de passe | Haute |
| AUTH-02 | En tant qu'admin, je peux creer/modifier/supprimer des utilisateurs | Haute |
| AUTH-03 | En tant qu'utilisateur, je suis redirige selon mon role apres connexion | Haute |
| AUTH-04 | En tant qu'utilisateur, ma session expire apres inactivite | Moyenne |

---

### 5.2 Module Gestion de Stock

#### Fonctionnalites
- Enregistrement des sacs avec reference unique auto-generee
- Upload de photos multiples (Vercel Blob)
- Suivi des statuts
- Generation et impression de QR codes
- Filtrage et recherche avancee

#### Statuts d'un sac
```
EN_COMMANDE -> EN_TRANSIT -> RECU -> EN_REMISE_EN_ETAT -> PRET_A_VENDRE -> EN_VENTE -> VENDU
```

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| STOCK-01 | En tant que vendeur, je peux enregistrer un nouveau sac avec toutes ses informations | Haute |
| STOCK-02 | En tant que vendeur, je peux uploader plusieurs photos pour un sac | Haute |
| STOCK-03 | En tant que vendeur, je peux modifier le statut d'un sac | Haute |
| STOCK-04 | En tant que vendeur, je peux generer un QR code pour un sac | Haute |
| STOCK-05 | En tant que vendeur, je peux scanner un QR code pour acceder a la fiche produit | Haute |
| STOCK-06 | En tant que vendeur, je peux rechercher/filtrer les sacs par criteres | Moyenne |
| STOCK-07 | En tant que vendeur, je peux voir l'historique des modifications d'un sac | Basse |

---

### 5.3 Module Gestion des Ventes

#### Fonctionnalites
- Mise en vente d'un sac (changement de statut)
- Enregistrement de la vente finale
- Calcul automatique de la marge
- Attribution a un compte bancaire

#### Calcul de la marge
```
Marge = Prix de vente - Prix d'achat - Frais remise en etat - Frais plateforme - Frais expedition
Marge % = (Marge / Prix d'achat) x 100
```

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| SALE-01 | En tant que vendeur, je peux mettre un sac en vente sur une plateforme | Haute |
| SALE-02 | En tant que vendeur, je peux enregistrer une vente avec tous les details | Haute |
| SALE-03 | En tant que vendeur, je vois la marge calculee automatiquement | Haute |
| SALE-04 | En tant que vendeur, je peux attribuer une vente a un compte bancaire | Haute |
| SALE-05 | En tant que vendeur, je peux annuler une vente | Moyenne |

---

### 5.4 Module Comptes Bancaires

#### Fonctionnalites
- CRUD des comptes bancaires (libelles uniquement, pas d'integration bancaire)
- Association aux achats et ventes
- Vue des transactions par compte

#### Comptes a creer (basees sur Excel)
- Beatrice
- Tiziana
- Goergio
- Jenacha

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| BANK-01 | En tant qu'admin, je peux creer un compte bancaire | Haute |
| BANK-02 | En tant qu'admin, je peux modifier/supprimer un compte bancaire | Haute |
| BANK-03 | En tant que vendeur, je peux voir la liste des comptes disponibles | Haute |
| BANK-04 | En tant qu'admin, je peux voir les transactions par compte | Moyenne |

---

### 5.5 Module Dashboard & Analytics

#### Fonctionnalites
- Vue d'ensemble des KPIs
- Graphiques de performance
- Filtres par periode
- Export des donnees (CSV, Excel)

#### KPIs a afficher
- Chiffre d'affaires total
- Marge totale et moyenne
- Nombre de sacs en stock par statut
- Nombre de ventes
- Performance par plateforme (CA, marge, volume)
- Performance par marque
- Top 5 des ventes

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| DASH-01 | En tant que vendeur, je vois un dashboard avec les KPIs principaux | Haute |
| DASH-02 | En tant que vendeur, je peux filtrer par periode | Moyenne |
| DASH-03 | En tant que vendeur, je peux exporter les donnees en CSV/Excel | Moyenne |
| DASH-04 | En tant que vendeur, je vois des graphiques de tendance | Basse |

---

### 5.6 Module QR Code

#### Fonctionnalites
- Generation automatique a la creation du sac
- Affichage sur la fiche produit
- Telechargement/impression
- Scan depuis mobile pour acces rapide

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| QR-01 | En tant que vendeur, un QR code est genere pour chaque sac | Haute |
| QR-02 | En tant que vendeur, je peux telecharger le QR code en PNG | Haute |
| QR-03 | En tant que vendeur, je peux scanner un QR code pour voir la fiche | Haute |

---

### 5.7 Module Email (ZeptoMail)

#### Fonctionnalites
- Notifications automatiques
- Emails transactionnels

#### Emails a envoyer
| Evenement | Destinataire | Contenu |
|-----------|--------------|---------|
| Nouveau sac enregistre | Admins | Notification avec details |
| Sac vendu | Admins + Vendeur | Recapitulatif de la vente |
| Rapport hebdomadaire | Admins | Synthese des performances |

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| EMAIL-01 | En tant qu'admin, je recois une notification quand un sac est enregistre | Moyenne |
| EMAIL-02 | En tant qu'admin, je recois une notification quand une vente est realisee | Moyenne |
| EMAIL-03 | En tant qu'admin, je recois un rapport hebdomadaire | Basse |

---

### 5.8 Module Video Chat

#### Fonctionnalites
- Appels video entre 2 a 4 utilisateurs
- Pas d'enregistrement
- Interface simple et intuitive
- Indicateur de disponibilite

#### Architecture technique
- WebRTC via simple-peer pour connexions P2P
- Signaling server leger integre au backend NestJS (WebSocket)

#### User Stories
| ID | Story | Priorite |
|----|-------|----------|
| VIDEO-01 | En tant que vendeur, je peux demarrer un appel video avec un autre utilisateur | Haute |
| VIDEO-02 | En tant que vendeur, je peux inviter jusqu'a 3 autres personnes | Haute |
| VIDEO-03 | En tant que vendeur, je vois qui est en ligne | Moyenne |
| VIDEO-04 | En tant que vendeur, je peux couper ma camera/micro | Moyenne |

---

## 6. Import de Donnees Excel

### 6.1 Structure du fichier source

Le fichier Excel `Copie de nadia perso.xlsx` contient 6 feuilles :

| Feuille | Colonnes | Description |
|---------|----------|-------------|
| achats | date, descriptif, prix | 467 achats |
| beatrice | descriptif, prix achat, prix vente, frais gianni, marge | 44 ventes |
| tiziana | descriptif | 10 sacs |
| goergio | descriptif, prix achat, prix vente, frais, marge | 35 ventes |
| jenacha | - | Vide |
| historique | date, achats libelle, prix achats, prix vente, marge | 160 ventes |

### 6.2 Mapping d'import

```
Excel                    ->  MongoDB
-------------------------------------------
achats.date             ->  Bag.purchaseDate
achats.descriptif       ->  Bag.description (extraction marque/modele)
achats.prix             ->  Bag.purchasePrice

beatrice/goergio.prix achat     ->  Bag.purchasePrice
beatrice/goergio.prix vente     ->  Sale.salePrice
beatrice/goergio.frais gianni   ->  Bag.refurbishmentCost
beatrice/goergio.marge          ->  Sale.margin (verification)
```

### 6.3 Fonctionnalite d'import
- Import one-shot pour migration initiale
- Validation des donnees
- Rapport d'erreurs
- Creation automatique des comptes bancaires

---

## 7. Interfaces Utilisateur

### 7.1 Pages principales

```
/                       -> Dashboard (apres connexion)
/login                  -> Page de connexion
/stock                  -> Liste des sacs en stock
/stock/new              -> Formulaire nouveau sac
/stock/[id]             -> Fiche detaillee d'un sac
/stock/[id]/edit        -> Modification d'un sac
/stock/scan             -> Scanner QR code
/sales                  -> Liste des ventes
/sales/new?bagId=xxx    -> Formulaire nouvelle vente
/sales/[id]             -> Detail d'une vente
/bank-accounts          -> Gestion des comptes bancaires (admin)
/users                  -> Gestion des utilisateurs (admin)
/settings               -> Parametres
/video-chat             -> Interface video chat
/import                 -> Import Excel (admin, one-shot)
```

### 7.2 Wireframes simplifies

#### Dashboard
```
+------------------------------------------------------------+
|  MonCoeur                           [Nadia] [Video] [Logout]|
+------------------------------------------------------------+
|  +----------+ +----------+ +----------+ +----------+       |
|  | CA Mois  | | Marge    | | En Stock | | Ventes   |       |
|  | 12 450EUR| | 3 200EUR | | 24 sacs  | | 8 ce mois|       |
|  +----------+ +----------+ +----------+ +----------+       |
|                                                             |
|  +-----------------------------+ +---------------------+    |
|  |  Graphique CA/Marge         | | Dernieres ventes    |    |
|  |  [========]                 | | - Chanel - 850EUR   |    |
|  |                             | | - LV - 620EUR       |    |
|  +-----------------------------+ +---------------------+    |
+------------------------------------------------------------+
```

#### Liste Stock
```
+------------------------------------------------------------+
|  Stock                    [Filtres] [+ Nouveau] [Scanner]   |
+------------------------------------------------------------+
|  +-----+---------------------------------------+------+    |
|  |Photo| Reference    Marque    Statut   Prix |Action|    |
|  +-----+---------------------------------------+------+    |
|  | IMG | MC-2026-001  Chanel    Pret     450EUR|  ... |    |
|  | IMG | MC-2026-002  Hermes    En vente 1200EUR| ... |    |
|  +-----+---------------------------------------+------+    |
+------------------------------------------------------------+
```

---

## 8. Securite

### 8.1 Authentification
- Sessions securisees via NextAuth
- Mots de passe hashes (bcrypt)
- Protection CSRF
- Rate limiting sur les endpoints sensibles

### 8.2 Autorisation
- Middleware de verification des roles
- Protection des routes admin
- Validation des permissions cote API

### 8.3 Donnees
- Validation des entrees (class-validator NestJS)
- Sanitization des donnees
- HTTPS obligatoire

---

## 9. Variables d'Environnement

```env
# Database
MONGODB_URI=mongodb+srv://...

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://moncoeur.vercel.app

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# ZeptoMail
ZEPTOMAIL_API_KEY=
ZEPTOMAIL_FROM_EMAIL=noreply@moncoeur.app

# App
NEXT_PUBLIC_APP_URL=https://moncoeur.vercel.app
```

---

## 10. Plan de Developpement pour Ralph

### Phase 1 - Fondations
- [ ] Setup monorepo (Next.js frontend + NestJS backend)
- [ ] Configuration MongoDB Atlas
- [ ] Configuration Vercel Blob
- [ ] Module Authentification NextAuth complet
- [ ] CRUD Utilisateurs (admin)
- [ ] CRUD Comptes Bancaires
- [ ] Structure de base UI (layout, navigation, shadcn/ui)

### Phase 2 - Gestion Stock
- [ ] CRUD Sacs complet
- [ ] Upload photos vers Vercel Blob
- [ ] Generation reference unique
- [ ] Gestion des statuts
- [ ] Generation QR Code
- [ ] Page scan QR Code (camera mobile)
- [ ] Filtres et recherche

### Phase 3 - Gestion Ventes
- [ ] CRUD Ventes
- [ ] Calcul automatique des marges
- [ ] Liaison avec comptes bancaires
- [ ] Changement statut sac -> VENDU

### Phase 4 - Dashboard & Communication
- [ ] Dashboard avec KPIs
- [ ] Graphiques (recharts ou chart.js)
- [ ] Export donnees CSV/Excel
- [ ] Integration ZeptoMail
- [ ] Module Video Chat WebRTC

### Phase 5 - Finalisation
- [ ] Import donnees Excel
- [ ] Tests et corrections
- [ ] Optimisations performance
- [ ] Deploiement production

---

## 11. Annexes

### A. Liste des marques suggeres (basees sur Excel)
- Lancel (1er Flirt, Charlie, Ninon, Le 8, Espiegle)
- Longchamp (Pliage, Roseau, Amazone)
- Louis Vuitton (Neverfull, Sarah)
- Chanel
- Hermes
- Burberry
- Maje
- Gerard Darel
- See by Chloe
- Celine (Trio)
- Balenciaga
- Fossil
- Sezane
- Brigitte Bardot
- Autre

### B. Plateformes
- Vinted
- Vestiaire Collectif
- Autre

### C. Etats des sacs
- Neuf avec etiquette
- Neuf sans etiquette
- Tres bon etat
- Bon etat
- Etat correct

### D. Prestataires remise en etat
- Gianni (principal)
- Autre

---

**Document prepare pour utilisation avec Ralph Wiggum Agent**

*Pret pour le developpement*
