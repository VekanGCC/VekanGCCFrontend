export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  requirementId?: string;
  resourceId?: string;
  vendorId?: string;
  clientId?: string;
  skills?: string | string[];
  skillLogic?: 'AND' | 'OR';
  minExperience?: string;
  maxExperience?: string;
  minRate?: string;
  maxRate?: string;
  minBudget?: string;
  maxBudget?: string;
  minDuration?: string;
  maxDuration?: string;
  approvedVendorsOnly?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  meta?: PaginationMeta;
  pagination?: PaginationMeta;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} 