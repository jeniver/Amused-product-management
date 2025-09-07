# API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication
All endpoints require seller authentication via header:
```bash
x-seller-id: demo-seller-123
```
## Products API

### GET /products
List all products with pagination

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)
- `search` (string, optional) - Search in name and description
- `category` (string, optional) - Filter by category

**Example Request:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     "http://localhost:4000/products?page=1&limit=5&search=laptop&category=electronics"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "seller_id": "demo-seller-123",
      "name": "Gaming Laptop",
      "description": "High-performance gaming laptop",
      "price": "1299.99",
      "quantity": 10,
      "category": "electronics",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /products
Create a new product

**Request Body:**
```json
{
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "price": 1299.99,
  "quantity": 10,
  "category": "electronics"
}
```

**Example Request:**
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "x-seller-id: demo-seller-123" \
     -d '{"name":"Gaming Laptop","description":"High-performance gaming laptop","price":1299.99,"quantity":10,"category":"electronics"}' \
     http://localhost:4000/products
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "seller_id": "demo-seller-123",
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop",
    "price": "1299.99",
    "quantity": 10,
    "category": "electronics",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /products/:id
Update an existing product

**Path Parameters:**
- `id` (number) - Product ID

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Gaming Laptop",
  "description": "Updated description",
  "price": 1199.99,
  "quantity": 8,
  "category": "electronics"
}
```

**Example Request:**
```bash
curl -X PUT -H "Content-Type: application/json" \
     -H "x-seller-id: demo-seller-123" \
     -d '{"name":"Updated Gaming Laptop","price":1199.99}' \
     http://localhost:4000/products/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "seller_id": "demo-seller-123",
    "name": "Updated Gaming Laptop",
    "description": "High-performance gaming laptop",
    "price": "1199.99",
    "quantity": 8,
    "category": "electronics",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

### DELETE /products/:id
Delete a product

**Path Parameters:**
- `id` (number) - Product ID

**Example Request:**
```bash
curl -X DELETE -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/products/1
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## AI Services API

### GET /ai/recommendations/:productId
Get AI-powered product recommendations

**Path Parameters:**
- `productId` (number) - Product ID to get recommendations for

**Example Request:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/recommendations/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "recommendations": [
      {
        "id": 2,
        "name": "Gaming Mouse",
        "price": "79.99",
        "category": "electronics",
        "reason": "Frequently bought together"
      },
      {
        "id": 3,
        "name": "Gaming Keyboard",
        "price": "129.99",
        "category": "electronics",
        "reason": "Similar category"
      }
    ],
    "cached": true,
    "generatedAt": "2024-01-15T16:00:00Z"
  }
}
```

### GET /ai/predictions/low-stock/:productId
Get low stock predictions for a product

**Path Parameters:**
- `productId` (number) - Product ID to get predictions for

**Example Request:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/predictions/low-stock/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "currentStock": 5,
    "prediction": {
      "daysUntilStockOut": 14,
      "recommendedReorderQuantity": 25,
      "confidence": 0.85,
      "reasoning": "Based on current sales velocity of 0.36 units/day"
    },
    "cached": false,
    "generatedAt": "2024-01-15T16:00:00Z"
  }
}
```

### POST /ai/categorize
Auto-categorize a product based on name and description

**Request Body:**
```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest smartphone with advanced camera"
}
```

**Example Request:**
```bash
curl -X POST -H "Content-Type: application/json" \
     -H "x-seller-id: demo-seller-123" \
     -d '{"name":"iPhone 15 Pro","description":"Latest smartphone with advanced camera"}' \
     http://localhost:4000/ai/categorize
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "electronics",
    "confidence": 0.95,
    "reasoning": "Product name contains 'iPhone' and description mentions 'smartphone'"
  }
}
```

### GET /ai/analytics/inventory-trends
Get inventory trend analysis

**Example Request:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     http://localhost:4000/ai/analytics/inventory-trends
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 25,
    "lowStockProducts": 3,
    "outOfStockProducts": 1,
    "topCategories": [
      {"category": "electronics", "count": 12},
      {"category": "clothing", "count": 8}
    ],
    "trends": {
      "weeklyGrowth": 0.12,
      "monthlyGrowth": 0.45
    }
  }
}
```

### GET /ai/health
Check AI service health

**Example Request:**
```bash
curl http://localhost:4000/ai/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "recommendations": "operational",
      "predictions": "operational",
      "categorization": "operational"
    },
    "uptime": "2h 15m 30s",
    "lastCheck": "2024-01-15T16:00:00Z"
  }
}
```

---

## 📡 Real-time Events API (Server-Sent Events)

### GET /events/stream
Subscribe to real-time events stream

**Headers Required:**
- `x-seller-id: demo-seller-123`
- `Accept: text/event-stream`
- `Cache-Control: no-cache`

**Example Request:**
```bash
curl -H "x-seller-id: demo-seller-123" \
     -H "Accept: text/event-stream" \
     -H "Cache-Control: no-cache" \
     http://localhost:4000/events/stream
```

**Response Stream:**
```
data: {"type":"ProductCreated","sellerId":"demo-seller-123","productId":1,"payload":{"product":{"id":1,"name":"Gaming Laptop"}}}

data: {"type":"LowStockWarning","sellerId":"demo-seller-123","productId":2,"payload":{"currentStock":3,"threshold":5}}

data: {"type":"AIRecommendation","sellerId":"demo-seller-123","productId":1,"payload":{"recommendations":[{"id":2,"name":"Gaming Mouse"}]}}
```

### Event Types
- `ProductCreated` - New product added
- `ProductUpdated` - Product modified
- `ProductDeleted` - Product removed
- `LowStockWarning` - Inventory below threshold
- `AIRecommendation` - New AI recommendations available
- `SystemHealth` - System status updates

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid input data",
  "details": {
    "field": "price",
    "message": "Price must be a positive number"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found or access denied"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Testing APIs

### Using curl
```bash
# Test products endpoint
curl -H "x-seller-id: demo-seller-123" http://localhost:4000/products

# Test AI recommendations
curl -H "x-seller-id: demo-seller-123" http://localhost:4000/ai/recommendations/1

# Test SSE events
curl -H "x-seller-id: demo-seller-123" -H "Accept: text/event-stream" http://localhost:4000/events/stream
```

### Using JavaScript (Frontend)
```javascript
// Fetch products
const response = await fetch('/products', {
  headers: { 'x-seller-id': 'demo-seller-123' }
});
const data = await response.json();

// Subscribe to events
const eventSource = new EventSource('/events/stream', {
  headers: { 'x-seller-id': 'demo-seller-123' }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event received:', data);
};
```

---

## Rate Limits

- **Products API**: 100 requests per minute per seller
- **AI Services**: 50 requests per minute per seller
- **Events Stream**: 1 connection per seller

## Security Notes

- All endpoints require seller authentication
- Data is automatically scoped to the authenticated seller
- Input validation using Zod schemas
- SQL injection protection with parameterized queries
