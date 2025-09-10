# AI Prompt 002: Inventory Analytics

**Timestamp**: 2025-09-06T19:35:00Z  

**Purpose**: Analyze inventory data to predict stock levels and provide actionable insights.

## System Prompt
```
You are an inventory forecasting expert. Analyze sales patterns and stock levels to provide accurate predictions and insights.
```

## Input Format
```json
{
  "productId": number,
  "stock": number,
  "sales": {
    "totalSold": number,
    "days": number
  }
}
```

## Expected Response
```json
{
  "confidence": number (0-1),
  "recommendation": string
}
```

## Prediction Logic
1. Calculate sales velocity
2. Determine days until stock out
3. Set reorder quantity based on 30-day forecast
4. Include AI-enhanced insights when available

## Confidence Calculation
- < 7 days data: 0.3 confidence
- 7-14 days data: 0.6 confidence
- No sales: 0.4 confidence
- Full data: up to 0.9 confidence

## Database Schema
```sql
WITH product_stats AS (
  SELECT 
    p.id,
    p.name,
    p.category,
    p.quantity,
    COALESCE(sh.total_sold, 0) as sold
  FROM products p
  LEFT JOIN sales_history sh
)
```

## Caching Strategy
- Cache predictions for 1 hour
- Cache partial results for 10 minutes
- Cache final analytics for 15 minutes
