import { Worker } from 'worker_threads';
import path from 'path';
import { pool } from '../db';
import { logger } from '../utils/logger';
import { cpus } from 'os';

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

class AIService {
  private workerPool: Worker[] = [];
  private readonly maxWorkers: number;

  constructor() {
    this.maxWorkers = Math.max(1, Math.min(cpus().length - 1, 4)); // Use max 4 workers or CPU count - 1
  }

  private async getWorker() {
    // Create worker if pool not initialized
    if (this.workerPool.length === 0) {
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker(
          path.join(__dirname, '../workers/analyticsWorker.js')
        );
        this.workerPool.push(worker);
      }
    }

    // Round-robin worker selection
    const worker = this.workerPool.shift()!;
    this.workerPool.push(worker);
    return worker;
  }

  async predictLowStock(productId: number, sellerId: string): Promise<StockPrediction | null> {
    try {
      // Get product details
      const { rows: [product] } = await pool.query(
        'SELECT id, quantity FROM products WHERE id = $1 AND seller_id = $2',
        [productId, sellerId]
      );

      if (!product) return null;

      // Get last 30 days of sales
      const { rows: sales } = await pool.query(
        `SELECT SUM(quantity_sold) as total_sold, 
         COUNT(DISTINCT date_trunc('day', sale_date)) as days
         FROM sales_history 
         WHERE product_id = $1 
         AND sale_date >= NOW() - INTERVAL '30 days'`,
        [productId]
      );

      const totalSold = parseInt(sales[0]?.total_sold || '0');
      const days = parseInt(sales[0]?.days || '30');
      const salesVelocity = totalSold / days;

      const currentStock = product.quantity;
      const daysUntilStockOut = salesVelocity > 0 
        ? Math.floor(currentStock / salesVelocity)
        : 999;

      const recommendedReorderQuantity = Math.ceil(salesVelocity * 30); // 30 days supply
      const confidence = this.calculatePredictionConfidence(totalSold, days);

      return {
        productId,
        currentStock,
        daysUntilStockOut,
        recommendedReorderQuantity,
        salesVelocity,
        confidence
      };
    } catch (error) {
      logger.error('Stock prediction failed', { error, productId });
      return null;
    }
  }

  async getInventoryAnalytics(sellerId: string, days: number = 30): Promise<InventoryAnalytics> {
    try {
      // Get overall summary
      const { rows: [summary] } = await pool.query(
        `SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN quantity <= 5 THEN 1 END) as low_stock_count,
          COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_count,
          AVG(quantity) as avg_stock_level
         FROM products 
         WHERE seller_id = $1`,
        [sellerId]
      );

      // Get category breakdown
      const { rows: categories } = await pool.query(
        `SELECT 
          category,
          COUNT(*) as product_count,
          AVG(quantity) as avg_stock,
          COUNT(CASE WHEN quantity <= 5 THEN 1 END) as low_stock_count
         FROM products
         WHERE seller_id = $1
         GROUP BY category`,
        [sellerId]
      );

      // Get product trends
      const { rows: products } = await pool.query(
        `SELECT id, name, category, quantity, 
         (SELECT COALESCE(SUM(quantity_sold), 0) 
          FROM sales_history 
          WHERE product_id = p.id 
          AND sale_date >= NOW() - INTERVAL '${days} days') as total_sold
         FROM products p
         WHERE seller_id = $1
         ORDER BY quantity ASC
         LIMIT 20`,
        [sellerId]
      );

      // Generate trends with predictions
      const trends = await Promise.all(products.map(async (product) => {
        const prediction = await this.predictLowStock(product.id, sellerId);
        return {
          productId: product.id,
          name: product.name,
          category: product.category,
          currentStock: product.quantity,
          salesVelocity: product.total_sold / days,
          reorderPoint: Math.ceil((product.total_sold / days) * 7), // 7 days safety stock
          prediction: prediction || {
            productId: product.id,
            currentStock: product.quantity,
            daysUntilStockOut: 999,
            recommendedReorderQuantity: 0,
            salesVelocity: 0,
            confidence: 0
          }
        };
      }));

      return {
        trends,
        summary: {
          totalProducts: parseInt(summary.total_products),
          lowStockProducts: parseInt(summary.low_stock_count),
          outOfStockProducts: parseInt(summary.out_of_stock_count),
          averageStockLevel: parseFloat(summary.avg_stock_level)
        },
        categoryBreakdown: categories.map(cat => ({
          category: cat.category,
          productCount: parseInt(cat.product_count),
          averageStock: parseFloat(cat.avg_stock),
          lowStockCount: parseInt(cat.low_stock_count)
        })),
        analysisPeriod: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Inventory analytics failed', { error, sellerId });
      throw error;
    }
  }

  async suggestCategory(name: string, description: string): Promise<CategorySuggestion> {
    try {
      // Define category keywords
      const categoryKeywords: Record<string, string[]> = {
        'Electronics': ['electronic', 'device', 'gadget', 'tech', 'computer', 'phone', 'laptop', 'digital'],
        'Clothing': ['shirt', 'dress', 'pants', 'jacket', 'wear', 'apparel', 'fashion', 'clothing'],
        'Home & Garden': ['furniture', 'decor', 'kitchen', 'garden', 'home', 'indoor', 'outdoor', 'living'],
        'Sports': ['sport', 'fitness', 'exercise', 'gym', 'training', 'athletic', 'outdoor'],
        'Books': ['book', 'novel', 'textbook', 'reading', 'literature', 'educational'],
        'Toys': ['toy', 'game', 'play', 'children', 'kids', 'educational', 'entertainment']
      };

      const text = `${name} ${description}`.toLowerCase();
      let bestMatch = {
        category: 'Other',
        confidence: 0,
        keywords: [] as string[]
      };

      // Find best matching category
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const matchingKeywords = keywords.filter(keyword => text.includes(keyword));
        const confidence = matchingKeywords.length / keywords.length;

        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category,
            confidence,
            keywords: matchingKeywords
          };
        }
      }

      return bestMatch;
    } catch (error) {
      logger.error('Category suggestion failed', { error, name });
      return {
        category: 'Other',
        confidence: 0,
        keywords: []
      };
    }
  }

  private calculatePredictionConfidence(totalSold: number, days: number): number {
    if (days < 7) return 0.3;
    if (days < 14) return 0.6;
    if (totalSold === 0) return 0.4;
    return Math.min(0.9, days / 30);
  }
}

export const aiService = new AIService();
