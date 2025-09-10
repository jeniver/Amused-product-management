import { describe, expect, it, jest, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { productsRouter } from './../routes/products';
import { pool } from './../db';
import { mockProduct } from './mocks/product';

const app = express();
app.use(express.json());
app.use('/products', productsRouter);

describe('Products API Integration Tests', () => {
  beforeEach(async () => {
    // Clear related tables before each test
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM sales_history');
      await client.query('DELETE FROM ai_recommendations');
      await client.query('DELETE FROM events');
      await client.query('DELETE FROM products');
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /products', () => {
    it('should return empty array when no products exist', async () => {
      const response = await request(app).get('/products');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return products with pagination', async () => {
      // Insert test products
      const testProducts = [mockProduct(), mockProduct(), mockProduct()];
      const sellerId = 'test_seller_123';
      
      for (const product of testProducts) {
        await pool.query(
          'INSERT INTO products (name, description, price, category, quantity, seller_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [product.name, product.description, product.price, product.category, product.quantity, sellerId]
        );
      }

      const response = await request(app)
        .get('/products')
        .set('X-Seller-ID', sellerId)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('POST /products', () => {
    it('should create a new product', async () => {
      const newProduct = mockProduct();

      const sellerId = 'test_seller_123';
      const response = await request(app)
        .post('/products')
        .set('X-Seller-ID', sellerId)
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(newProduct.name);
      expect(response.body.data.description).toBe(newProduct.description);
      expect(Number(response.body.data.price)).toBe(newProduct.price);
      expect(response.body.data.category).toBe(newProduct.category);
      expect(Number(response.body.data.quantity)).toBe(newProduct.quantity);
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        // Missing required fields: name, price, quantity
        description: 'Test Description',
        category: 'Test Category'
      };

      const sellerId = 'test_seller_123';
      const response = await request(app)
        .post('/products')
        .set('X-Seller-ID', sellerId)
        .send(invalidProduct);

      expect(response.status).toBe(400);
      // Just verify that we get a 400 status code for invalid input
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update an existing product', async () => {
      // First create a product
      const product = mockProduct();
      const sellerId = 'test_seller_123';
      const result = await pool.query(
        'INSERT INTO products (name, description, price, category, quantity, seller_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [product.name, product.description, product.price, product.category, product.quantity, sellerId]
      );
      const createdProduct = result.rows[0];

      const updates = {
        name: 'Updated Name',
        price: 29.99
      };

      const response = await request(app)
        .put(`/products/${createdProduct.id}`)
        .set('X-Seller-ID', sellerId)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updates.name);
      expect(Number(response.body.data.price)).toBe(updates.price);
      expect(response.body.data.description).toBe(product.description);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/products/999999')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete an existing product', async () => {
      // First create a product
      const product = mockProduct();
      const sellerId = 'test_seller_123';
      const result = await pool.query(
        'INSERT INTO products (name, description, price, category, quantity, seller_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [product.name, product.description, product.price, product.category, product.quantity, sellerId]
      );
      const createdProduct = result.rows[0];

      const response = await request(app)
        .delete(`/products/${createdProduct.id}`)
        .set('X-Seller-ID', sellerId);

      expect(response.status).toBe(200);

      // Verify product is deleted
      const checkResult = await pool.query('SELECT * FROM products WHERE id = $1', [createdProduct.id]);
      expect(checkResult.rows).toHaveLength(0);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/products/999999');

      expect(response.status).toBe(404);
    });
  });
});
