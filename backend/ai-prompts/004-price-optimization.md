# AI Prompt 004: Price Optimization

**Timestamp**: 2025-09-07T19:35:00Z  

**Purpose**: Provide intelligent price optimization suggestions based on market data and sales history.

## System Prompt
```
You are a pricing strategy expert. Analyze product data and market conditions to suggest optimal pricing.
```

## Input Format
```json
{
  "product": {
    "id": number,
    "name": string,
    "price": number,
    "category": string,
    "avg_sale_price": number,
    "total_sales": number
  },
  "categoryRange": {
    "min": number,
    "max": number,
    "avg": number
  }
}
```

## Expected Response
```json
{
  "suggestedPrice": number,
  "confidence": number (0-1),
  "reasoning": string,
  "competitivePriceRange": {
    "min": number,
    "max": number
  }
}
```

## Analysis Factors
1. Historical sales data
2. Category price range
3. Market positioning
4. Sales volume impact
5. Competition analysis

## Fallback Strategy
```typescript
return {
  suggestedPrice: categoryStats.avg,
  confidence: 0.5,
  reasoning: "Fallback: category average",
  competitivePriceRange: {
    min: categoryStats.min,
    max: categoryStats.max
  }
};
```

## SQL Query
```sql
SELECT p.*, 
  (SELECT AVG(price) FROM sales_history WHERE product_id=p.id) as avg_sale_price,
  (SELECT COUNT(*) FROM sales_history WHERE product_id=p.id) as total_sales
FROM products p 
WHERE p.id=$1 AND p.seller_id=$2
```
