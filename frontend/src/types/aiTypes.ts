export interface AIAnalysisRequest {
  text?: string;
  productName?: string;
  productId?: number;
  category?: string;
  prompt?: string;
}

export interface ProductDescriptionResponse {
  success: boolean;
  data: {
    description: string;
  };
  message?: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  data: {
    analysis?: string | null;
    description?: string | null;
    confidence?: number;
    suggestions?: string[] | null;
    keywords?: string[] | null;
  };
  message?: string;
}

export interface RecommendationItem {
  id: number;
  name: string;
  similarity: number;
  category?: string;
  price?: number;
  aiInsights?: string;
  confidence: number;
}

export interface StockPrediction {
  productId: number;
  currentStock: number;
  daysUntilStockOut: number;
  recommendedReorderQuantity: number;
  salesVelocity: number;
  confidence: number;
}

export interface InventoryAnalytics {
  trends: ProductTrend[];
  summary: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    averageStockLevel: number;
  };
  categoryBreakdown: CategoryStat[];
  analysisPeriod: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export interface ProductTrend {
  productId: number;
  name: string;
  category: string;
  currentStock: number;
  salesVelocity: number;
  reorderPoint: number;
  prediction: StockPrediction;
}

export interface CategoryStat {
  category: string;
  productCount: number;
  averageStock: number;
  lowStockCount: number;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  keywords: string[];
}
