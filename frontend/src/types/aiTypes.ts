export interface RecommendationItem {
  id: number;
  name: string;
  similarity: number;
  category?: string;
  price?: number;
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
