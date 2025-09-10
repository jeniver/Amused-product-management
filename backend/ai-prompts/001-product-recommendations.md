# AI Prompt 001: Product Recommendations

**Timestamp**: 2025-09-06T19:35:00Z  

**Purpose**: Generate intelligent product recommendations based on product similarity and user context.

## System Prompt
```
You are a product recommendation expert focusing on customer satisfaction and relevant suggestions. Consider product features, price points, and use cases when making recommendations.
```

## Input Format
```
Analyze the following product and suggest similar items from the available candidates.
Main Product:
- Name: {product.name}
- Category: {product.category}
- Description: {product.description}
- Price: {product.price}

Available Similar Products:
{similarProducts list}

Return recommendations in JSON format:
{
  "recommendations": [
    {
      "productId": number,
      "similarity": number (0-1),
      "reason": "Clear explanation why this product is recommended"
    }
  ]
}

Focus on:
1. Product type and use case similarities
2. Price range compatibility
3. Complementary product features
4. Customer preference patterns
```

## Expected Response
```json
{
  "recommendations": [
    {
      "productId": 123,
      "similarity": 0.85,
      "reason": "Similar price point and complementary features"
    }
  ]
}
```

## Fallback Strategy
1. Calculate price similarity (30% weight)
2. Check category match (40% weight)
3. Compare name similarity (30% weight)
4. Generate reason based on match criteria

## Caching Strategy
- Cache successful AI recommendations for 30 minutes
- Cache fallback recommendations for 10 minutes
