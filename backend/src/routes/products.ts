import { Router } from 'express';
import { pool } from '../db';
import { config } from '../config';
import { logger } from '../utils/logger';
import { checkAndEmitLowStockWarning } from '../services/stockService';
import { ApiResponse, Product, CreateProductInput, UpdateProductInput } from '../types';
import { 
  createProductSchema, 
  updateProductSchema, 
  paginationSchema,
  validateBody, 
  validateQuery,
  authenticateSeller 
} from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';

export const productsRouter = Router();

// Apply authentication to all routes
productsRouter.use(authenticateSeller);

async function emitEvent(type: string, sellerId: string, productId: number | null, payload: unknown) {
  try {
    await pool.query(
      'INSERT INTO events (type, seller_id, product_id, payload) VALUES ($1, $2, $3, $4)',
      [type, sellerId, productId, JSON.stringify(payload)]
    );
  } catch (error) {
    logger.error('Failed to emit event', { error, type, sellerId, productId });
  }
}

// GET /products - List products with pagination and filtering
// Authorization: Only returns products belonging to the authenticated seller
productsRouter.get('/', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    // Extract sellerId from authenticated user context
    // This ensures seller can only access their own products
    const sellerId = req.user!.seller_id;
    const { page = 1, limit = 10, search, category } = req.query as any;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;
    
    // Build base query for counting total records
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE seller_id = $1';
    const countParams: any[] = [sellerId];
    let paramCount = 1;

    // Build main query for fetching data
    let dataQuery = 'SELECT * FROM products WHERE seller_id = $1';
    const dataParams: any[] = [sellerId];

    // Add search filter
    if (search) {
      const searchFilter = ` AND (name ILIKE $${paramCount + 1} OR description ILIKE $${paramCount + 1})`;
      countQuery += searchFilter;
      dataQuery += searchFilter;
      countParams.push(`%${search}%`);
      dataParams.push(`%${search}%`);
      paramCount++;
    }

    // Add category filter
    if (category) {
      const categoryFilter = ` AND category = $${paramCount + 1}`;
      countQuery += categoryFilter;
      dataQuery += categoryFilter;
      countParams.push(category);
      dataParams.push(category);
      paramCount++;
    }

    // Add ordering and pagination to data query
    dataQuery += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    dataParams.push(limitNum, offset);

    // Execute both queries in parallel
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);
    
    const response: ApiResponse<Product[]> = {
      success: true,
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /products - Create product
// Authorization: Product is automatically assigned to the authenticated seller
productsRouter.post('/', validateBody(createProductSchema), async (req, res, next) => {
  try {
    // Extract sellerId from authenticated user context
    // Product will be automatically assigned to this seller
    const sellerId = req.user!.seller_id;
    const productData: CreateProductInput = req.body;

    const { rows } = await pool.query(
      `INSERT INTO products (seller_id, name, description, price, quantity, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sellerId, productData.name, productData.description || '', productData.price, productData.quantity, productData.category]
    );

    const product = rows[0] as Product;
    await emitEvent('ProductCreated', sellerId, product.id, { product });

    // Check for low stock and emit warning if needed
    await checkAndEmitLowStockWarning(product, sellerId);

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Product created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// PUT /products/:id - Update product
// Authorization: Only allows updating products owned by the authenticated seller
productsRouter.put('/:id', validateBody(updateProductSchema), async (req, res, next) => {
  try {
    // Extract sellerId from authenticated user context
    const sellerId = req.user!.seller_id;
    const id = parseInt(req.params.id, 10);
    const updateData: UpdateProductInput = req.body;

    if (isNaN(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const setFragments = fields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = fields.map(field => (updateData as any)[field]);
    
    // Update query includes seller_id check to ensure ownership
    const { rows } = await pool.query(
      `UPDATE products SET ${setFragments}, updated_at = NOW() 
       WHERE id = $1 AND seller_id = $2 
       RETURNING *`,
      [id, sellerId, ...values]
    );

    // If no rows affected, product either doesn't exist or doesn't belong to seller
    if (rows.length === 0) {
      throw new AppError('Product not found or access denied', 404);
    }

    const product = rows[0] as Product;
    await emitEvent('ProductUpdated', sellerId, product.id, { product });

    // Check for low stock and emit warning if needed
    await checkAndEmitLowStockWarning(product, sellerId);

    const response: ApiResponse<Product> = {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// DELETE /products/:id - Delete product
// Authorization: Only allows deleting products owned by the authenticated seller
productsRouter.delete('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const sellerId = req.user!.seller_id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    await client.query('BEGIN');

    // Delete related events first
    await client.query('DELETE FROM events WHERE product_id = $1', [id]);
    // Optionally, also delete from sales_history and ai_recommendations for full integrity:
    await client.query('DELETE FROM sales_history WHERE product_id = $1', [id]);
    await client.query('DELETE FROM ai_recommendations WHERE product_id = $1', [id]);

    // Now delete the product
    const { rows } = await client.query(
      'DELETE FROM products WHERE id = $1 AND seller_id = $2 RETURNING *',
      [id, sellerId]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('Product not found or access denied', 404);
    }

    await client.query('COMMIT');

    await emitEvent('ProductDeleted', sellerId, rows[0].id, { productId: rows[0].id });

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});