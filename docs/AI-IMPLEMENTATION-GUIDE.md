# AI Implementation Guide

## AI Features Overview

Our product management system includes three main AI services:

1. **Product Recommendations** - Suggest similar/complementary products
2. **Sales Predictions** - Forecast demand and stock levels
3. **Auto-Categorization** - Automatically categorize products
 


## AI Architecture

### Service Layer Design
```
API Routes → AI Service → Database → Cache
     ↓           ↓           ↓         ↓
  Validation → Business Logic → Data → Performance
```

### Key Components
- **aiService.ts** - Core AI business logic
- **Caching Layer** - PostgreSQL-based caching
- **Fallback Strategies** - Rule-based alternatives
- **Error Handling** - Graceful degradation

---

## AI Service Implementation

### 1. Product Recommendations

**How it works:**
```typescript
async function getRecommendations(productId: number, sellerId: string) {
  // 1. Check cache first
  const cached = await getCachedRecommendations(productId);
  if (cached && !isExpired(cached)) return cached;
  
  // 2. Get product details
  const product = await getProduct(productId, sellerId);
  
  // 3. AI Algorithm: Find similar products
  const similar = await findSimilarProducts(product);
  
  // 4. Cache results for 1 hour
  await cacheRecommendations(productId, similar);
  
  return similar;
}
```

**Algorithm Logic:**
1. **Category Matching** - Find products in same category
2. **Price Range** - Products within 50% price range
3. **Keyword Analysis** - Match description keywords
4. **Popularity Scoring** - Consider sales history

**API Usage:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/recommendations/1
```

### 2. Sales Predictions

**How it works:**
```typescript
async function predictLowStock(productId: number, sellerId: string) {
  // 1. Get current stock and sales history
  const product = await getProduct(productId, sellerId);
  const salesHistory = await getSalesHistory(productId);
  
  // 2. Calculate sales velocity
  const dailySales = calculateAverageDailySales(salesHistory);
  
  // 3. Predict stock-out date
  const daysUntilStockOut = product.quantity / dailySales;
  
  // 4. Generate recommendations
  const reorderQuantity = calculateReorderQuantity(dailySales);
  
  return {
    daysUntilStockOut,
    recommendedReorderQuantity: reorderQuantity,
    confidence: calculateConfidence(salesHistory)
  };
}
```

**Prediction Algorithm:**
1. **Sales Velocity** - Average daily sales over 30 days
2. **Seasonal Adjustments** - Account for trends
3. **Confidence Scoring** - Based on data quality
4. **Reorder Recommendations** - Optimal inventory levels

**API Usage:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/predictions/low-stock/1
```

### 3. Auto-Categorization

**How it works:**
```typescript
async function categorizeProduct(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();
  
  // Keyword-based categorization
  const categories = {
    electronics: ['phone', 'laptop', 'computer', 'tablet', 'tv'],
    clothing: ['shirt', 'pants', 'dress', 'shoes', 'jacket'],
    books: ['book', 'novel', 'guide', 'manual', 'textbook'],
    home: ['furniture', 'decor', 'kitchen', 'bedroom', 'bathroom']
  };
  
  let bestMatch = { category: 'other', confidence: 0 };
  
  for (const [category, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(keyword => text.includes(keyword));
    const confidence = matches.length / keywords.length;
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { category, confidence };
    }
  }
  
  return bestMatch;
}
```

**API Usage:**
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "x-seller-id: demo-seller-123" \
     -d '{"name":"iPhone 15","description":"Latest smartphone"}' \
     http://localhost:4000/ai/categorize
```

---

## Running AI Services

### 1. Start the Server
```bash
# Make sure PostgreSQL is running
npm run db:up

# Start development server
npm run dev
```

### 2. Test AI Endpoints

**Create a test product first:**
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "x-seller-id: demo-seller-123" \
     -d '{
       "name": "Gaming Laptop",
       "description": "High-performance laptop for gaming",
       "price": 1299.99,
       "quantity": 10,
       "category": "electronics"
     }' \
     http://localhost:4000/products
```

**Test recommendations:**
```bash
# Replace {productId} with actual product ID from creation response
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/recommendations/{productId}
```

**Test predictions:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/predictions/low-stock/{productId}
```

**Test categorization:**
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "x-seller-id: demo-seller-123" \
     -d '{
       "name": "iPhone 15 Pro",
       "description": "Latest smartphone with advanced camera"
     }' \
     http://localhost:4000/ai/categorize
```

### 3. Check AI Health
```bash
curl http://localhost:4000/ai/health
```

---

## AI Algorithm Details

### Recommendation Algorithm

**Step 1: Data Collection**
```sql
-- Get product details
SELECT * FROM products WHERE id = $1 AND seller_id = $2;

-- Get similar products
SELECT * FROM products 
WHERE seller_id = $1 
  AND category = $2 
  AND price BETWEEN $3 AND $4 
  AND id != $5
ORDER BY created_at DESC
LIMIT 5;
```

**Step 2: Similarity Scoring**
```typescript
function calculateSimilarity(product1, product2) {
  let score = 0;
  
  // Category match (40% weight)
  if (product1.category === product2.category) score += 0.4;
  
  // Price similarity (30% weight)
  const priceDiff = Math.abs(product1.price - product2.price) / product1.price;
  score += (1 - priceDiff) * 0.3;
  
  // Description keywords (30% weight)
  const keywordMatch = calculateKeywordSimilarity(product1.description, product2.description);
  score += keywordMatch * 0.3;
  
  return score;
}
```

### Prediction Algorithm

**Sales Velocity Calculation:**
```typescript
function calculateSalesVelocity(salesHistory) {
  if (salesHistory.length === 0) return 0.1; // Default low velocity
  
  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.quantity_sold, 0);
  const daysCovered = salesHistory.length;
  
  return totalSales / daysCovered;
}
```

**Stock-out Prediction:**
```typescript
function predictStockOut(currentStock, salesVelocity) {
  if (salesVelocity <= 0) return 999; // Very long time
  
  return Math.ceil(currentStock / salesVelocity);
}
```

### Categorization Algorithm

**Keyword Matching:**
```typescript
const categoryKeywords = {
  electronics: [
    'phone', 'smartphone', 'iphone', 'android',
    'laptop', 'computer', 'pc', 'mac',
    'tablet', 'ipad', 'tv', 'television',
    'camera', 'headphones', 'speaker'
  ],
  clothing: [
    'shirt', 't-shirt', 'blouse', 'top',
    'pants', 'jeans', 'trousers', 'shorts',
    'dress', 'skirt', 'jacket', 'coat',
    'shoes', 'sneakers', 'boots', 'sandals'
  ],
  books: [
    'book', 'novel', 'fiction', 'non-fiction',
    'textbook', 'manual', 'guide', 'cookbook',
    'biography', 'history', 'science', 'art'
  ],
  home: [
    'furniture', 'chair', 'table', 'sofa',
    'bed', 'mattress', 'pillow', 'blanket',
    'kitchen', 'cookware', 'dishes', 'utensils',
    'decor', 'lamp', 'mirror', 'picture'
  ]
};
```

---

## Customizing AI Services

### Adding New Categories
```typescript
// In src/services/aiService.ts
const categoryKeywords = {
  // ... existing categories
  sports: ['ball', 'equipment', 'fitness', 'gym', 'exercise'],
  automotive: ['car', 'auto', 'parts', 'tire', 'engine'],
  beauty: ['makeup', 'skincare', 'perfume', 'cosmetics']
};
```

### Improving Recommendations
```typescript
// Add more sophisticated scoring
function calculateSimilarity(product1, product2) {
  let score = 0;
  
  // Category match
  if (product1.category === product2.category) score += 0.3;
  
  // Price similarity
  const priceDiff = Math.abs(product1.price - product2.price) / product1.price;
  score += Math.max(0, 1 - priceDiff) * 0.2;
  
  // Description keywords
  const keywordMatch = calculateKeywordSimilarity(product1.description, product2.description);
  score += keywordMatch * 0.2;
  
  // Popularity (sales history)
  const popularityScore = getPopularityScore(product2.id);
  score += popularityScore * 0.2;
  
  // Recency
  const recencyScore = getRecencyScore(product2.created_at);
  score += recencyScore * 0.1;
  
  return score;
}
```

### Adding Machine Learning
```typescript
// Future enhancement: Use actual ML models
async function getMLRecommendations(productId) {
  // This would call a real ML service
  const response = await fetch(`http://ml-service/recommendations/${productId}`);
  return response.json();
}

// Hybrid approach: ML + rule-based fallback
async function getRecommendations(productId, sellerId) {
  try {
    // Try ML first
    return await getMLRecommendations(productId);
  } catch (error) {
    // Fallback to rule-based
    return await getRuleBasedRecommendations(productId, sellerId);
  }
}
```

---

## AI Performance Monitoring

### Caching Strategy
```sql
-- AI recommendations cache
CREATE TABLE ai_recommendations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  recommendations JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- AI predictions cache
CREATE TABLE ai_predictions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  prediction_type VARCHAR(50) NOT NULL,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Performance Metrics
```typescript
// Track AI service performance
async function trackAIMetrics(service, duration, success) {
  await pool.query(
    'INSERT INTO ai_metrics (service, duration_ms, success, created_at) VALUES ($1, $2, $3, NOW())',
    [service, duration, success]
  );
}

// Usage
const start = Date.now();
try {
  const result = await getRecommendations(productId, sellerId);
  await trackAIMetrics('recommendations', Date.now() - start, true);
  return result;
} catch (error) {
  await trackAIMetrics('recommendations', Date.now() - start, false);
  throw error;
}
```

---

## Testing AI Services

### Unit Tests
```bash
# Run AI service tests
npm test -- aiService.test.ts
```

### Integration Tests
```bash
# Test AI endpoints
npm test -- ai.test.ts
```

### Manual Testing
```bash
# Create test data
curl -X POST -H "Content-Type: application/json" \
     -H "x-seller-id: test-seller" \
     -d '{"name":"Test Product 1","description":"Electronics item","price":100,"quantity":10,"category":"electronics"}' \
     http://localhost:4000/products

# Test recommendations
curl -H "x-seller-id: test-seller" \
     http://localhost:4000/ai/recommendations/1

# Test predictions
curl -H "x-seller-id: test-seller" \
     http://localhost:4000/ai/predictions/low-stock/1
```

---

## AI Implementation Summary


**Sales Predictions** - Stock-out forecasting with confidence  
**Auto-Categorization** - Keyword-based product categorization  
**Caching Layer** - Performance optimization  
**Fallback Strategies** - Graceful error handling  
**Health Monitoring** - Service status tracking  




