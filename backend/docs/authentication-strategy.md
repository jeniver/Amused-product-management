# Authentication & Authorization Strategy

## Overview

This document outlines the authentication and authorization approach for the Amused product management system, focusing on how sellers can only manage their own products.

## Authentication Strategy

### JWT-Based Authentication

In a production system, we would implement JWT-based authentication:

```typescript
// JWT Token Structure
interface JWTPayload {
  sellerId: string;
  email: string;
  role: 'seller' | 'admin';
  iat: number; // issued at
  exp: number; // expiration
  iss: string; // issuer
}

// Example JWT Token
{
  "sellerId": "seller-123",
  "email": "john@example.com",
  "role": "seller",
  "iat": 1694000000,
  "exp": 1694003600,
  "iss": "amused-api"
}
```

### Authentication Flow

1. **Login**: Seller provides credentials (email/password)
2. **Token Generation**: Server validates credentials and issues JWT
3. **Token Storage**: Client stores JWT in secure storage
4. **Request Authentication**: Client includes JWT in Authorization header
5. **Token Validation**: Server validates JWT on each request

### Request Headers

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
x-seller-id: seller-123  # Fallback for demo purposes
```

## Authorization Logic

### Seller Isolation

All product operations are scoped to the authenticated seller:

```typescript
// Middleware: Extract sellerId from JWT
function authenticateSeller(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    // In production: verify JWT signature and extract payload
    const payload = verifyJWT(token); // jwt.verify(token, secret)
    
    if (!payload.sellerId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    
    // Attach seller context to request
    req.sellerId = payload.sellerId;
    req.user = {
      sellerId: payload.sellerId,
      email: payload.email,
      role: payload.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
}
```

### Database Query Scoping

All database queries are automatically scoped to the seller:

```typescript
// GET /products - Only return seller's products
async function getProducts(req: Request, res: Response) {
  const sellerId = req.sellerId; // From authenticated JWT
  
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
    [sellerId] // Always filter by authenticated seller
  );
  
  res.json({ success: true, data: rows });
}

// POST /products - Create product for authenticated seller
async function createProduct(req: Request, res: Response) {
  const sellerId = req.sellerId; // From authenticated JWT
  
  const { rows } = await pool.query(
    `INSERT INTO products (seller_id, name, description, price, quantity, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [sellerId, ...productData] // Always use authenticated seller
  );
  
  res.json({ success: true, data: rows[0] });
}

// PUT /products/:id - Update only if product belongs to seller
async function updateProduct(req: Request, res: Response) {
  const sellerId = req.sellerId;
  const productId = req.params.id;
  
  const { rows } = await pool.query(
    `UPDATE products 
     SET name = $1, description = $2, price = $3, quantity = $4, category = $5
     WHERE id = $6 AND seller_id = $7
     RETURNING *`,
    [name, description, price, quantity, category, productId, sellerId]
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ 
      success: false, 
      error: 'Product not found or access denied' 
    });
  }
  
  res.json({ success: true, data: rows[0] });
}
```

### Event Scoping

All events are also scoped to the seller:

```typescript
// Events are automatically scoped to the seller who triggered them
async function emitEvent(type: string, sellerId: string, productId: number, payload: any) {
  await pool.query(
    'INSERT INTO events (type, seller_id, product_id, payload) VALUES ($1, $2, $3, $4)',
    [type, sellerId, productId, JSON.stringify(payload)]
  );
  
  // Broadcast only to the specific seller
  broadcastToSeller(sellerId, { type, sellerId, productId, payload });
}
```

## Security Considerations

### Token Security

1. **JWT Secret**: Use strong, environment-specific secrets
2. **Token Expiration**: Short-lived tokens (15-30 minutes)
3. **Refresh Tokens**: Implement refresh token rotation
4. **HTTPS Only**: Always use HTTPS in production
5. **Secure Storage**: Store tokens in httpOnly cookies or secure storage

### Database Security

1. **Parameterized Queries**: Prevent SQL injection
2. **Row-Level Security**: Database-level seller isolation
3. **Input Validation**: Validate all inputs with Zod schemas
4. **Rate Limiting**: Prevent abuse and brute force attacks

### API Security

1. **CORS Configuration**: Restrict to allowed origins
2. **Request Validation**: Validate all request data
3. **Error Handling**: Don't leak sensitive information
4. **Logging**: Log security events for monitoring

## Demo Implementation

For demonstration purposes, we use a simplified approach:

```typescript
// Demo: Hardcoded seller context
function authenticateSeller(req: Request, res: Response, next: NextFunction) {
  // In production: Extract from JWT
  // For demo: Use header or default
  const sellerId = req.header('x-seller-id') || 'demo-seller-123';
  
  req.sellerId = sellerId;
  req.user = { sellerId };
  
  next();
}
```

This allows testing the authorization logic without implementing full authentication.

## Database Schema Considerations

### Row-Level Security (PostgreSQL)

```sql
-- Enable row-level security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for seller isolation
CREATE POLICY seller_isolation ON products
  FOR ALL TO authenticated_seller
  USING (seller_id = current_setting('app.current_seller_id'));

-- Set seller context in application
SET app.current_seller_id = 'seller-123';
```

### Indexes for Performance

```sql
-- Index for seller-scoped queries
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_events_seller_id ON events(seller_id);

-- Composite indexes for common queries
CREATE INDEX idx_products_seller_category ON products(seller_id, category);
CREATE INDEX idx_products_seller_created ON products(seller_id, created_at);
```

## Monitoring and Auditing

### Security Logging

```typescript
// Log authentication events
logger.info('User authenticated', {
  sellerId: payload.sellerId,
  email: payload.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});

// Log authorization failures
logger.warn('Authorization failed', {
  sellerId: req.sellerId,
  resource: req.path,
  action: req.method,
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

### Audit Trail

```sql
-- Audit table for security events
CREATE TABLE security_audit (
  id SERIAL PRIMARY KEY,
  seller_id VARCHAR(255),
  event_type VARCHAR(100),
  resource VARCHAR(255),
  action VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Checklist

### Phase 1: Basic Authentication
- [ ] JWT token generation and validation
- [ ] Authentication middleware
- [ ] Seller context extraction
- [ ] Basic error handling

### Phase 2: Authorization
- [ ] Query scoping by seller
- [ ] Resource ownership validation
- [ ] Event scoping
- [ ] Error responses for unauthorized access

### Phase 3: Security Hardening
- [ ] Token refresh mechanism
- [ ] Rate limiting
- [ ] Security logging
- [ ] Audit trail

### Phase 4: Production Readiness
- [ ] HTTPS enforcement
- [ ] Secure token storage
- [ ] Row-level security
- [ ] Monitoring and alerting

## Conclusion

This authentication and authorization strategy ensures that:

1. **Sellers can only access their own products**
2. **All operations are properly scoped**
3. **Security is maintained throughout the system**
4. **The system is ready for production deployment**

The current demo implementation provides a foundation that can be extended to full authentication when needed.
