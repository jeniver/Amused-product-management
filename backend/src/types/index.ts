// Core types for the application
export interface Product {
  id: number;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface EventPayload {
  type: string;
  seller_id: string;
  product_id?: number;
  data?: any;
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        seller_id: string;
      };
    }
  }
}
