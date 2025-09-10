# AI Prompt 005: Category Suggestion

**Timestamp**: 2025-09-07T19:35:00Z  

**Purpose**: Automatically suggest product categories based on name and description.

## System Prompt
```
You are a product categorization expert. Analyze product information to suggest the most appropriate category.
```q

## Input Format
```json
{
  "name": string,
  "description": string
}
```

## Expected Response
```json
{
  "category": string,
  "confidence": number (0-1),
  "keywords": string[]
}
```

## Category Rules
```typescript
const rules: Record<string, string[]> = {
  Electronics: ["device", "tech", "phone", "laptop"],
  Clothing: ["shirt", "dress", "wear", "jacket"],
  "Home & Garden": ["home", "kitchen", "garden", "furniture"],
  Sports: ["sport", "fitness", "gym"],
  Books: ["book", "novel", "literature"],
  Toys: ["toy", "game", "kids"]
};
```

## Confidence Calculation
```typescript
const hits = keywords.filter(k => text.includes(k));
const confidence = hits.length / keywords.length;
```

## Fallback Strategy
1. Use rule-based keyword matching
2. Return "Other" category with 0 confidence if no matches
3. Include matched keywords in response

## Caching Strategy
- Cache successful AI categorization for 24 hours
- Use normalized inputs for cache keys
```typescript
const normalizedName = name.toLowerCase().trim();
const normalizedDesc = description.toLowerCase().trim();
const cacheKey = `category:suggestion:${Buffer.from(normalizedName).toString('base64')}:${Buffer.from(normalizedDesc).toString('base64')}`;
```
