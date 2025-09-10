# AI Prompt 003: Product Description Generation

**Timestamp**: 2025-09-07T19:35:00Z  

**Purpose**: Generate engaging and accurate product descriptions using AI.

## System Prompt
```
You are an e-commerce copywriter. Create concise, informative product descriptions that highlight key features and benefits.
```

## Input Format
```json
{
  "product": string,
  "category": string
}
```

## Expected Response
```json
{
  "desc": string
}
```

## Guidelines
1. Keep descriptions under 200 words
2. Focus on key product features
3. Include category-specific benefits
4. Use engaging, professional tone
5. Include relevant keywords

## Caching Strategy
- Cache successful AI descriptions for 7 days
- Cache raw responses for 1 day
- Cache fallback descriptions for 1 hour

## Fallback Response
```
{product} - A quality product in {category}.
```

## Cache Key Generation
```typescript
const normalizedName = name.toLowerCase().trim();
const normalizedCategory = category.toLowerCase().trim();
const cacheKey = `product:description:${Buffer.from(normalizedName.substring(0, 50)).toString('base64')}:${Buffer.from(normalizedCategory.substring(0, 30)).toString('base64')}`;
```
