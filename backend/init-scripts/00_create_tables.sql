-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales history table for AI predictions
CREATE TABLE IF NOT EXISTS sales_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity_sold INTEGER NOT NULL,
    sale_date DATE NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table for notifications
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    seller_id VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales_history(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_history(sale_date);
CREATE INDEX IF NOT EXISTS idx_events_type_seller ON events(type, seller_id);
CREATE INDEX IF NOT EXISTS idx_events_product ON events(product_id);
