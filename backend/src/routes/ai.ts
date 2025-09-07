import { Router } from 'express';
import { aiService } from '../services/aiService';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import { authenticateSeller } from '../middleware/validation';

export const aiRouter = Router();

// Apply authentication to all AI routes
aiRouter.use(authenticateSeller);

// GET /ai/predictions/low-stock/:productId - Get low stock prediction
aiRouter.get('/predictions/low-stock/:productId', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const sellerId = req.user!.seller_id;

    if (isNaN(productId)) {
      throw new AppError('Invalid product ID', 400);
    }

    const prediction = await aiService.predictLowStock(productId, sellerId);

    if (!prediction) {
      throw new AppError('Unable to generate prediction', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: prediction,
      message: 'Low stock prediction generated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /ai/analytics/inventory-trends - Get inventory trend analysis
aiRouter.get('/analytics/inventory-trends', async (req, res, next) => {
  try {
    const sellerId = req.user!.seller_id;
    const days = Math.min(365, Math.max(1, parseInt(req.query.days as string) || 30));

    const analytics = await aiService.getInventoryAnalytics(sellerId, days);

    const response: ApiResponse = {
      success: true,
      data: analytics,
      message: `Inventory trends analysis completed for ${days} days`
    };

    res.json(response);
  } catch (error) {
    logger.error('Inventory trends analysis failed', { error, sellerId: req.user?.seller_id });
    next(error);
  }
});

// POST /ai/categorize - Auto-categorize a product
aiRouter.post('/categorize', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Product name is required', 400);
    }

    const suggestion = await aiService.suggestCategory(name, description || '');

    const response: ApiResponse = {
      success: true,
      data: suggestion,
      message: 'Category suggestion generated successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});
