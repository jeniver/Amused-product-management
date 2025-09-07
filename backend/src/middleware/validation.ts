import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './errorHandler';

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
});

export const updateProductSchema = createProductSchema.partial();

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  category: z.string().optional(),
});

// Validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(message, 400);
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new AppError(message, 400);
      }
      next(error);
    }
  };
};

// Seller authentication middleware (mock for demo)
// In production: This would validate JWT tokens and extract sellerId
export const authenticateSeller = (req: Request, res: Response, next: NextFunction): void => {
  // Demo: Extract sellerId from header or use default
  // Production: Extract from JWT token in Authorization header
  const sellerId = req.header('x-seller-id') || 'demo-seller';
  
  // Attach seller context to request for authorization
  req.user = { seller_id: sellerId };
  
  // In production: Validate JWT token
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // const payload = jwt.verify(token, process.env.JWT_SECRET);
  // req.user = { seller_id: payload.sellerId, email: payload.email };
  
  next();
};
