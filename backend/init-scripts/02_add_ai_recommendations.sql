-- Drop existing ai_recommendations table if it exists
DROP TABLE IF EXISTS ai_recommendations;

-- Create ai_recommendations table with ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_product ON ai_recommendations(product_id);
