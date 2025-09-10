import { Product, CreateProductInput } from '../../types';

/**
 * Create a mock product for testing
 * @param overrides Optional properties to override in the mock product
 * @returns A mock product object
 */
export const mockProduct = (overrides: Partial<CreateProductInput> = {}): CreateProductInput => {
  const defaultProduct: CreateProductInput = {
    name: `Test Product ${Math.random().toString(36).substring(7)}`,
    description: 'Test Description',
    price: 19.99,
    category: 'Test Category',
    quantity: 100
  };

  return {
    ...defaultProduct,
    ...overrides
  };
};

/**
 * Create a mock full product (including database-generated fields) for testing
 * @param overrides Optional properties to override in the mock product
 * @returns A mock product object with all fields
 */
export const mockFullProduct = (overrides: Partial<Product> = {}): Product => {
  const now = new Date();
  const defaultProduct: Product = {
    id: Math.floor(Math.random() * 1000) + 1,
    seller_id: `seller_${Math.random().toString(36).substring(7)}`,
    name: `Test Product ${Math.random().toString(36).substring(7)}`,
    description: 'Test Description',
    price: 19.99,
    category: 'Test Category',
    quantity: 100,
    created_at: now,
    updated_at: now
  };

  return {
    ...defaultProduct,
    ...overrides
  };
};
