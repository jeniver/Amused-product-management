// Product related types
export interface Product {
  id: number;
  name: string;
  price: number | string; // API returns price as string
  quantity: number;
  category: string;
  description?: string;
  seller_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
  description?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// Event types for SSE
export interface BaseEvent {
  type: string;
  timestamp: string;
  seller_id: string;
}

export interface ProductCreatedEvent extends BaseEvent {
  type: 'ProductCreated';
  product_id: number;
  payload: Product;
}

export interface ProductUpdatedEvent extends BaseEvent {
  type: 'ProductUpdated';
  product_id: number;
  payload: Product;
}

export interface ProductDeletedEvent extends BaseEvent {
  type: 'ProductDeleted';
  product_id: number;
}

export interface LowStockWarningEvent extends BaseEvent {
  type: 'LowStockWarning';
  product: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    category: string;
  };
}

export interface ConnectedEvent extends BaseEvent {
  type: 'Connected';
  message: string;
}

export type SSEEvent = 
  | ProductCreatedEvent 
  | ProductUpdatedEvent 
  | ProductDeletedEvent 
  | LowStockWarningEvent 
  | ConnectedEvent;

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  product_id?: number;
  data?: {
    productId: number;
    product_name: string;
    current_quantity: number;
    threshold: number;
    category: string;
    price: number;
  };
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  product?: Product;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// AI Services types
export interface AIRecommendation {
  id: number;
  name: string;
  price: number;
  category: string;
  reason: string;
  similarity: number;
}

export interface StockPrediction {
  product_id: number;
  predicted_stock_out_date: string;
  days_until_stock_out: number;
  recommended_reorder_quantity: number;
  confidence: number;
  sales_velocity: number;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  keywords_matched: string[];
}

export interface CategoryBreakdown {
  category: string;
  productCount: number;
  averageStock: number;
  lowStockCount: number;
}

export interface InventoryAnalyticsSummary {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averageStockLevel: number;
}

export interface AnalysisPeriod {
  days: number;
  startDate: string;
  endDate: string;
}

export interface ProductTrend {
  productId: number;
  name: string;
  category: string;
  currentStock: number;
  salesVelocity: number;
  reorderPoint: number;
  prediction: {
    productId: number;
    currentStock: number;
    daysUntilStockOut: number;
    recommendedReorderQuantity: number;
    salesVelocity: number;
    confidence: number;
  };
}

export interface InventoryAnalyticsResponse {
  success: boolean;
  data: {
    trends: ProductTrend[];
    analysisPeriod: AnalysisPeriod;
    categoryBreakdown: CategoryBreakdown[];
    summary: InventoryAnalyticsSummary;
    generatedAt: string;
  };
  message: string;
}

export interface AIHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    recommendations: boolean;
    predictions: boolean;
    categorization: boolean;
    analytics: boolean;
  };
  response_time_ms: number;
  last_check: string;
}

// Enhanced Product API types
export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: keyof Product;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
