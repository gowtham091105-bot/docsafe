export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  ownerUserId?: string;
  issueDate: string;
  expiryDate: string;
  renewalDueDate?: string;
  status: string;
  fileAssetId?: string;
  category?: Category;
  owner?: User;
}

export interface ComplianceItem {
  id: string;
  name: string;
  categoryId?: string;
  linkedDocumentId?: string;
  dueDate?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'COMPLIANT' | 'PENDING' | 'MISSING' | 'EXPIRED' | 'UNDER_REVIEW';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
