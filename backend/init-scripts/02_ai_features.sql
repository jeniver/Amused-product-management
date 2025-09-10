-- AI recommendations cache
CREATE TABLE IF NOT EXISTS product_recommendations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    recommended_product_id INTEGER REFERENCES products(id),
    similarity_score DECIMAL(4,3) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(product_id, recommended_product_id)
);

-- Price optimization history
CREATE TABLE IF NOT EXISTS price_optimizations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    suggested_price DECIMAL(12,2) NOT NULL,
    confidence DECIMAL(4,3) NOT NULL,
    reasoning TEXT,
    min_price DECIMAL(12,2) NOT NULL,
    max_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster category-based queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Add index for sales history queries
CREATE INDEX IF NOT EXISTS idx_sales_history_product_date ON sales_history(product_id, sale_date);

-- Add index for price range queries
CREATE INDEX IF NOT EXISTS idx_products_category_price ON products(category, price);

-- Add index for expiring recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_expiry ON product_recommendations(expires_at);
