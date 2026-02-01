import { Platform } from './bag';

export interface Sale {
  _id: string;
  bagId: string;

  // Sale info
  saleDate: Date;
  salePrice: number;
  salePlatform: Platform;
  platformFees?: number;
  shippingCost?: number;

  // Bank account
  bankAccountId: string;

  // Calculated fields
  margin: number;
  marginPercent: number;

  // Notes
  notes?: string;

  // Metadata
  soldBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSaleDto {
  bagId: string;
  saleDate: Date;
  salePrice: number;
  salePlatform: Platform;
  platformFees?: number;
  shippingCost?: number;
  bankAccountId: string;
  notes?: string;
}

export interface UpdateSaleDto {
  saleDate?: Date;
  salePrice?: number;
  salePlatform?: Platform;
  platformFees?: number;
  shippingCost?: number;
  bankAccountId?: string;
  notes?: string;
}
