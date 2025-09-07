import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { aiRouter } from '../../../routes/ai';
import { aiService } from '../../../services/aiService';
import { StockPrediction, InventoryAnalytics, CategorySuggestion } from '../../../services/aiService';
import { errorHandler } from '../../../middleware/errorHandler';

// Create test app
const app: Application = express();
app.use(express.json());
app.use('/ai', aiRouter);
app.use(errorHandler);

// Mock the aiService module
jest.mock('../../../services/aiService', () => ({
  aiService: {
    predictLowStock: jest.fn().mockImplementation(async () => ({})),
    getInventoryAnalytics: jest.fn().mockImplementation(async () => ({})),
    suggestCategory: jest.fn().mockImplementation(async () => ({})),
    workerPool: [],
    maxWorkers: 1,
    getWorker: jest.fn(),
    calculatePredictionConfidence: jest.fn()
  }
}));

describe('AI API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ai/predict-low-stock/:productId', () => {
    const mockPrediction: StockPrediction = {
      productId: 1,
      currentStock: 50,
      daysUntilStockOut: 14,
      recommendedReorderQuantity: 100,
      salesVelocity: 3.5,
      confidence: 0.85
    };

    it('should return low stock prediction for a valid product ID', async () => {
      (aiService.predictLowStock as any).mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/ai/predict-low-stock/1')
        .expect(200);

      expect(response.body).toEqual(mockPrediction);
      expect(aiService.predictLowStock).toHaveBeenCalledWith(1, expect.any(String));
    });

    it('should handle invalid product ID', async () => {
      await request(app)
        .post('/ai/predict-low-stock/invalid')
        .expect(400);
    });

    it('should handle service errors', async () => {
      (aiService.predictLowStock as any).mockRejectedValue(new Error('Service error'));

      await request(app)
        .post('/ai/predict-low-stock/1')
        .expect(500);
    });
  });

  describe('GET /ai/inventory-analytics', () => {
    const mockAnalytics: InventoryAnalytics = {
      trends: [],
      summary: {
        totalProducts: 100,
        lowStockProducts: 15,
        outOfStockProducts: 5,
        averageStockLevel: 75.5
      },
      categoryBreakdown: [],
      analysisPeriod: {
        days: 30,
        startDate: '2023-01-01',
        endDate: '2023-01-30'
      }
    };

    it('should return inventory analytics', async () => {
      (aiService.getInventoryAnalytics as any).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/ai/inventory-analytics')
        .expect(200);

      expect(response.body).toEqual(mockAnalytics);
      expect(aiService.getInventoryAnalytics).toHaveBeenCalledWith(expect.any(String), expect.any(Number));
    });

    it('should handle service errors', async () => {
      (aiService.getInventoryAnalytics as any).mockRejectedValue(new Error('Service error'));

      await request(app)
        .get('/ai/inventory-analytics')
        .expect(500);
    });
  });

  describe('POST /ai/suggest-category', () => {
    const mockSuggestion: CategorySuggestion = {
      category: 'Electronics',
      confidence: 0.92,
      keywords: ['digital', 'device', 'electronic']
    };

    it('should return category suggestion for valid product data', async () => {
      (aiService.suggestCategory as any).mockResolvedValue(mockSuggestion);

      const productData = {
        name: 'New Digital Device',
        description: 'An electronic device for everyday use'
      };

      const response = await request(app)
        .post('/ai/suggest-category')
        .send(productData)
        .expect(200);

      expect(response.body).toEqual(mockSuggestion);
      expect(aiService.suggestCategory).toHaveBeenCalledWith(productData.name, productData.description);
    });

    it('should handle missing product data', async () => {
      await request(app)
        .post('/ai/suggest-category')
        .send({})
        .expect(400);
    });

    it('should handle service errors', async () => {
      (aiService.suggestCategory as any).mockRejectedValue(new Error('Service error'));

      await request(app)
        .post('/ai/suggest-category')
        .send({ name: 'Test', description: 'Test' })
        .expect(500);
    });
  });
});

// Mock authentication middleware
jest.mock('../../../middleware/validation', () => ({
  authenticateSeller: (req: any, res: any, next: any) => {
    req.user = { seller_id: 'test-seller' };
    next();
  }
}));

// Mock AI service
jest.mock('../../../services/aiService', () => ({
  aiService: {
    predictLowStock: jest.fn(),
    getInventoryAnalytics: jest.fn(),
    suggestCategory: jest.fn()
  }
}));

describe('AI Routes Integration Tests', () => {
  describe('GET /ai/predictions/low-stock/:productId', () => {
    it('should return low stock prediction', async () => {
      const mockPrediction = {
        productId: 1,
        currentStock: 10,
        daysUntilStockOut: 15,
        recommendedReorderQuantity: 20,
        salesVelocity: 0.67,
        confidence: 0.9
      };

      (aiService.predictLowStock as any).mockResolvedValue(mockPrediction);

      const response = await request(app)
        .get('/ai/predictions/low-stock/1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPrediction);
    });

    it('should handle invalid product ID', async () => {
      const response = await request(app)
        .get('/ai/predictions/low-stock/invalid')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid product ID');
    });
  });

  describe('GET /ai/analytics/inventory-trends', () => {
    it('should return inventory analytics', async () => {
      const mockAnalytics = {
        trends: [],
        summary: {
          totalProducts: 100,
          lowStockProducts: 10,
          outOfStockProducts: 5,
          averageStockLevel: 25.5
        },
        categoryBreakdown: [],
        analysisPeriod: {
          days: 30,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        }
      };

      (aiService.getInventoryAnalytics as any).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/ai/analytics/inventory-trends')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
    });

    it('should handle invalid days parameter', async () => {
      const response = await request(app)
        .get('/ai/analytics/inventory-trends?days=invalid')
        .expect('Content-Type', /json/)
        .expect(200); // Still returns with default 30 days

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /ai/categorize', () => {
    it('should suggest category for product', async () => {
      const mockSuggestion = {
        category: 'Electronics',
        confidence: 0.8,
        keywords: ['phone', 'device']
      };

      (aiService.suggestCategory as any).mockResolvedValue(mockSuggestion);

      const response = await request(app)
        .post('/ai/categorize')
        .send({
          name: 'iPhone 15',
          description: 'Latest smartphone'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSuggestion);
    });

    it('should require product name', async () => {
      const response = await request(app)
        .post('/ai/categorize')
        .send({
          description: 'Some description'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product name is required');
    });
  });
});
