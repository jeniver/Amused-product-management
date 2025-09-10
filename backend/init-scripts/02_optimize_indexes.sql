-- Add composite indexes for inventory analytics queries
CREATE INDEX IF NOT EXISTS idx_products_seller_quantity ON products(seller_id, quantity);
CREATE INDEX IF NOT EXISTS idx_products_seller_category ON products(seller_id, category);
CREATE INDEX IF NOT EXISTS idx_sales_history_composite ON sales_history(product_id, sale_date);

-- Add partial index for low stock items
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(seller_id) 
WHERE quantity <= 5;

-- Add index for category analytics
CREATE INDEX IF NOT EXISTS idx_products_category_stats ON products(seller_id, category, quantity);

-- Add index for sales date range queries
CREATE INDEX IF NOT EXISTS idx_sales_history_date_range ON sales_history USING btree (sale_date DESC);

-- Update table statistics
ANALYZE products;
ANALYZE sales_history;
ANALYZE events;
