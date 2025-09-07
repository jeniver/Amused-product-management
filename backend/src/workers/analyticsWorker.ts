import { parentPort, workerData } from 'worker_threads';
import { pool } from '../db';
import { logger } from '../utils/logger';

interface WorkerInput {
  sellerId: string;
  days: number;
  productBatch: any[];
}

async function calculateProductTrends(products: any[], sellerId: string, days: number) {
  try {
    const trends = await Promise.all(products.map(async (product) => {
      const prediction = await predictLowStock(product.id, sellerId);
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        currentStock: product.quantity,
        salesVelocity: product.total_sold / days,
        reorderPoint: Math.ceil((product.total_sold / days) * 7),
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

    return trends;
  } catch (error) {
    logger.error('Worker trend calculation failed', { error });
    throw error;
  }
}

async function predictLowStock(productId: number, sellerId: string) {
  try {
    const { rows: [product] } = await pool.query(
      'SELECT id, quantity FROM products WHERE id = $1 AND seller_id = $2',
      [productId, sellerId]
    );

    if (!product) return null;

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

    const recommendedReorderQuantity = Math.ceil(salesVelocity * 30);
    const confidence = calculatePredictionConfidence(totalSold, days);

    return {
      productId,
      currentStock,
      daysUntilStockOut,
      recommendedReorderQuantity,
      salesVelocity,
      confidence
    };
  } catch (error) {
    logger.error('Worker stock prediction failed', { error, productId });
    return null;
  }
}

function calculatePredictionConfidence(totalSold: number, days: number): number {
  if (days < 7) return 0.3;
  if (days < 14) return 0.6;
  if (totalSold === 0) return 0.4;
  return Math.min(0.9, days / 30);
}

// Handle worker messages
if (parentPort) {
  parentPort.on('message', async (data: WorkerInput) => {
    try {
      const trends = await calculateProductTrends(
        data.productBatch,
        data.sellerId,
        data.days
      );
      parentPort!.postMessage({ success: true, trends });
    } catch (error) {
      parentPort!.postMessage({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}
