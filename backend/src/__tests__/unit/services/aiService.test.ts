import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { aiService } from '../../../services/aiService';
import { pool } from '../../../db';
import { Pool, QueryResult } from 'pg';

// Mock database types
interface MockProduct {
  id: number;
  quantity: number;
}

interface MockSales {
  total_sold: string;
  days: string;
}



// Mock the database module with a mock pool
jest.mock('../../../db', () => ({
  pool: {
    query: jest.fn(() => Promise.resolve({
      rows: [],
      command: '',
      rowCount: 0,
      oid: 0,
      fields: []
    }))
  }
}));

// Get typed reference to the mocked pool
const { pool: mockPool } = jest.mocked(require('../../../db'));

// Mock worker_threads
jest.mock('worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    postMessage: jest.fn(),
    on: jest.fn()
  }))
}));

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictLowStock', () => {
    it('should predict low stock based on sales history', async () => {
      const mockProduct: MockProduct = {
        id: 1,
        quantity: 10
      };

      const mockSales: MockSales = {
        total_sold: '20',
        days: '30'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockSales], rowCount: 1 });

      const prediction = await aiService.predictLowStock(1, 'test-seller');

      expect(prediction).toBeDefined();
      expect(prediction?.productId).toBe(1);
      expect(prediction?.currentStock).toBe(10);
      expect(prediction?.salesVelocity).toBe(0.6666666666666666); // 20 sales / 30 days
      expect(prediction?.daysUntilStockOut).toBe(15); // 10 stock / 0.67 sales per day
      expect(prediction?.recommendedReorderQuantity).toBe(20); // 0.67 * 30 days, rounded up
      expect(prediction?.confidence).toBe(0.9); // Max confidence for 30 days
    });

    it('should handle zero sales scenario', async () => {
      const mockProduct = {
        id: 1,
        quantity: 50
      };

      const mockSales = {
        total_sold: '0',
        days: '30'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockProduct], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [mockSales], rowCount: 1 });

      const prediction = await aiService.predictLowStock(1, 'test-seller');

      expect(prediction).toBeDefined();
      expect(prediction?.salesVelocity).toBe(0);
      expect(prediction?.daysUntilStockOut).toBe(999); // Maximum days for zero sales
      expect(prediction?.confidence).toBe(0.4); // Lower confidence for no sales
    });

    it('should handle missing product', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const prediction = await aiService.predictLowStock(1, 'test-seller');

      expect(prediction).toBeNull();
    });
  });

  describe('getInventoryAnalytics', () => {
    it('should return complete inventory analytics', async () => {
      const mockSummary = {
        total_products: '100',
        low_stock_count: '10',
        out_of_stock_count: '5',
        avg_stock_level: '25.5'
      };

      const mockCategories = [{
        category: 'Electronics',
        product_count: '50',
        avg_stock: '30.5',
        low_stock_count: '5'
      }];

      const mockProducts = [{
        id: 1,
        name: 'Test Product',
        category: 'Electronics',
        quantity: 10,
        total_sold: '20'
      }];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockSummary], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockCategories, rowCount: mockCategories.length })
        .mockResolvedValueOnce({ rows: mockProducts, rowCount: mockProducts.length });

      // Mock predictLowStock call
      const mockPrediction = {
        productId: 1,
        currentStock: 10,
        daysUntilStockOut: 15,
        recommendedReorderQuantity: 20,
        salesVelocity: 0.67,
        confidence: 0.9
      };

      jest.spyOn(aiService, 'predictLowStock').mockResolvedValue(mockPrediction);

      const analytics = await aiService.getInventoryAnalytics('test-seller');

      expect(analytics.summary.totalProducts).toBe(100);
      expect(analytics.summary.lowStockProducts).toBe(10);
      expect(analytics.summary.outOfStockProducts).toBe(5);
      expect(analytics.summary.averageStockLevel).toBe(25.5);

      expect(analytics.categoryBreakdown).toHaveLength(1);
      expect(analytics.categoryBreakdown[0].category).toBe('Electronics');
      expect(analytics.categoryBreakdown[0].productCount).toBe(50);

      expect(analytics.trends).toHaveLength(1);
      expect(analytics.trends[0].prediction).toEqual(mockPrediction);
    });

    it('should handle empty inventory', async () => {
      const mockSummary = {
        total_products: '0',
        low_stock_count: '0',
        out_of_stock_count: '0',
        avg_stock_level: '0'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockSummary], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const analytics = await aiService.getInventoryAnalytics('test-seller');

      expect(analytics.summary.totalProducts).toBe(0);
      expect(analytics.categoryBreakdown).toHaveLength(0);
      expect(analytics.trends).toHaveLength(0);
    });
  });

  describe('suggestCategory', () => {
    it('should suggest Electronics category for tech products', async () => {
      const suggestion = await aiService.suggestCategory(
        'iPhone 15 Pro',
        'Latest smartphone with advanced features and A17 chip'
      );

      expect(suggestion.category).toBe('Electronics');
      expect(suggestion.confidence).toBeGreaterThan(0.5);
      expect(suggestion.keywords).toContain('phone');
      expect(suggestion.keywords).toContain('device');
    });

    it('should suggest Clothing category for apparel', async () => {
      const suggestion = await aiService.suggestCategory(
        'Cotton T-Shirt',
        'Comfortable casual wear for everyday use'
      );

      expect(suggestion.category).toBe('Clothing');
      expect(suggestion.confidence).toBeGreaterThan(0.3);
      expect(suggestion.keywords).toContain('wear');
    });

    it('should return Other for ambiguous items', async () => {
      const suggestion = await aiService.suggestCategory(
        'Miscellaneous Item',
        'General purpose product'
      );

      expect(suggestion.category).toBe('Other');
      expect(suggestion.confidence).toBe(0);
      expect(suggestion.keywords).toHaveLength(0);
    });
  });
});
