import { pool } from '../db';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function checkAndEmitLowStockWarning(
  product: { id: number; name: string; quantity: number; category: string; price: number },
  sellerId: string
) {
  try {
    if (product.quantity <= config.LOW_STOCK_THRESHOLD) {
      logger.info('Processing low stock warning for product:', {
        productId: product.id,
        name: product.name,
        quantity: product.quantity,
        threshold: config.LOW_STOCK_THRESHOLD
      });

      // Prepare notification message
      const message = {
        type: 'LowStockWarning',
        event: 'LowStockWarning',
        seller_id: sellerId,
        product_id: product.id,
        timestamp: new Date().toISOString(),
        payload: {
          id: product.id,
          name: product.name,
          product_name: product.name,
          current_quantity: product.quantity,
          threshold: config.LOW_STOCK_THRESHOLD,
          category: product.category || 'N/A',
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price)
        }
      };

      logger.info('Emitting low stock warning:', message);

      // Store in events table and let the trigger handle notification
      await pool.query(
        'INSERT INTO events (type, seller_id, product_id, payload) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          message.type,
          message.seller_id,
          message.product_id,
          JSON.stringify(message.payload)
        ]
      );

      // Query to verify the notification was stored
      const verification = await pool.query(
        'SELECT * FROM events WHERE type = $1 AND product_id = $2 ORDER BY created_at DESC LIMIT 1',
        ['LowStockWarning', product.id]
      );

      logger.info(
        `Low stock warning processed for "${product.name}"`,
        {
          productId: product.id,
          quantity: product.quantity,
          threshold: config.LOW_STOCK_THRESHOLD,
          storedEvent: verification.rows[0],
          notificationSent: true
        }
      );
    }
  } catch (error) {
    logger.error('Failed to emit low stock warning', { 
      error, 
      productId: product.id,
      productName: product.name,
      quantity: product.quantity 
    });
    // Rethrow the error to handle it in the caller
    throw error;
  }
}
