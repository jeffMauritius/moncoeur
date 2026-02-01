export type UserRole = 'admin' | 'seller';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}
