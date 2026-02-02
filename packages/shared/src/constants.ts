// Brands
export const BRANDS = [
  'Lancel',
  'Longchamp',
  'Louis Vuitton',
  'Chanel',
  'Hermes',
  'Burberry',
  'Maje',
  'Gerard Darel',
  'See by Chloe',
  'Celine',
  'Balenciaga',
  'Fossil',
  'Sezane',
  'Brigitte Bardot',
  'Dior',
  'Gucci',
  'Prada',
  'Saint Laurent',
  'Fendi',
  'Bottega Veneta',
  'Loewe',
  'Goyard',
  'Autre',
] as const;

// Platforms
export const PLATFORMS = {
  vinted: 'Vinted',
  vestiaire_collectif: 'Vestiaire Collectif',
  leboncoin: 'Le Bon Coin',
  autre: 'Autre',
} as const;

// Conditions
export const CONDITIONS = {
  neuf_etiquette: 'Neuf avec etiquette',
  neuf_sans_etiquette: 'Neuf sans etiquette',
  tres_bon: 'Tres bon etat',
  bon: 'Bon etat',
  correct: 'Etat correct',
} as const;

// Statuses
export const STATUSES = {
  en_commande: 'En commande',
  en_transit: 'En transit',
  recu: 'Recu',
  en_remise_en_etat: 'En remise en etat',
  pret_a_vendre: 'Pret a vendre',
  en_vente: 'En vente',
  vendu: 'Vendu',
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  en_commande: 'bg-yellow-100 text-yellow-800',
  en_transit: 'bg-blue-100 text-blue-800',
  recu: 'bg-purple-100 text-purple-800',
  en_remise_en_etat: 'bg-orange-100 text-orange-800',
  pret_a_vendre: 'bg-green-100 text-green-800',
  en_vente: 'bg-indigo-100 text-indigo-800',
  vendu: 'bg-gray-100 text-gray-800',
} as const;

// Refurbishment providers
export const REFURBISHMENT_PROVIDERS = [
  'Gianni',
  'Autre',
] as const;

// User roles
export const USER_ROLES = {
  admin: 'Administrateur',
  seller: 'Vendeur',
} as const;
