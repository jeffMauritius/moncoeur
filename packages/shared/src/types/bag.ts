export type BagCondition =
  | 'neuf_etiquette'
  | 'neuf_sans_etiquette'
  | 'tres_bon'
  | 'bon'
  | 'correct';

export type BagStatus =
  | 'en_commande'
  | 'en_transit'
  | 'recu'
  | 'en_remise_en_etat'
  | 'pret_a_vendre'
  | 'en_vente'
  | 'vendu';

export type Platform = 'vinted' | 'vestiaire_collectif' | 'autre';

export interface Bag {
  _id: string;
  reference: string;

  // Product info
  brand: string;
  model: string;
  description: string;
  color?: string;
  size?: string;
  condition: BagCondition;

  // Purchase
  purchaseDate: Date;
  purchasePrice: number;
  purchasePlatform: Platform;
  purchaseBankAccountId: string;

  // Refurbishment
  refurbishmentCost: number;
  refurbishmentProvider?: string;
  refurbishmentNotes?: string;

  // Photos
  photos: string[];

  // Sale info
  saleDate?: Date;
  salePrice?: number;
  salePlatform?: Platform;
  saleNotes?: string;

  // Status
  status: BagStatus;

  // QR Code
  qrCodeUrl?: string;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBagDto {
  brand: string;
  model: string;
  description: string;
  color?: string;
  size?: string;
  condition: BagCondition;
  purchaseDate: Date;
  purchasePrice: number;
  purchasePlatform: Platform;
  purchaseBankAccountId: string;
  refurbishmentCost?: number;
  refurbishmentProvider?: string;
  refurbishmentNotes?: string;
  photos?: string[];
  status?: BagStatus;
}

export interface UpdateBagDto {
  brand?: string;
  model?: string;
  description?: string;
  color?: string;
  size?: string;
  condition?: BagCondition;
  purchaseDate?: Date;
  purchasePrice?: number;
  purchasePlatform?: Platform;
  purchaseBankAccountId?: string;
  refurbishmentCost?: number;
  refurbishmentProvider?: string;
  refurbishmentNotes?: string;
  photos?: string[];
  status?: BagStatus;
  saleDate?: Date;
  salePrice?: number;
  salePlatform?: Platform;
  saleNotes?: string;
}
