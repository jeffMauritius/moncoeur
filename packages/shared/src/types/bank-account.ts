export interface BankAccount {
  _id: string;
  label: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBankAccountDto {
  label: string;
  description?: string;
}

export interface UpdateBankAccountDto {
  label?: string;
  description?: string;
  isActive?: boolean;
}
