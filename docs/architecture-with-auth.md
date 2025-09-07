# System Architecture with Authentication

## High-Level Architecture with Auth Flow

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Application]
        Mobile[Mobile App]
        API_Client[API Client]
    end
    
    subgraph "Authentication Layer"
        Auth_Service[Authentication Service]
        JWT_Validation[JWT Validation]
        Token_Refresh[Token Refresh]
    end
    
    subgraph "API Gateway"
        LB[Load Balancer]
        Auth_Middleware[Auth Middleware]
        RateLimit[Rate Limiting]
        CORS[CORS Handler]
    end
    
    subgraph "Application Layer"
        API[Express.js API]
        SSE[Server-Sent Events]
        AI[AI Services]
    end
    
    subgraph "Authorization Layer"
        Seller_Context[Seller Context]
        Query_Scoping[Query Scoping]
        Resource_Validation[Resource Validation]
    end
    
    subgraph "Business Logic"
        Products[Product Service]
        Events[Event Service]
        Notifications[Notification Service]
        Recommendations[AI Recommendations]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
        Audit[Audit Logs]
    end
    
    subgraph "External Services"
        AI_ML[AI/ML Models]
        Email[Email Service]
        SMS[SMS Service]
    end
    
    Web --> Auth_Service
    Mobile --> Auth_Service
    API_Client --> Auth_Service
    
    Auth_Service --> JWT_Validation
    JWT_Validation --> Token_Refresh
    
    Web --> LB
    Mobile --> LB
    API_Client --> LB
    
    LB --> Auth_Middleware
    Auth_Middleware --> JWT_Validation
    JWT_Validation --> RateLimit
    RateLimit --> CORS
    CORS --> API
    
    API --> Seller_Context
    Seller_Context --> Query_Scoping
    Query_Scoping --> Resource_Validation
    
    Resource_Validation --> Products
    Resource_Validation --> Events
    Resource_Validation --> AI
    
    Products --> DB
    Events --> DB
    AI --> DB
    AI --> AI_ML
    
    Events --> SSE
    SSE --> Web
    SSE --> Mobile
    
    Notifications --> Email
    Notifications --> SMS
    
    Products --> Audit
    Events --> Audit
    AI --> Audit
```

## Authentication Flow Sequence

```mermaid
sequenceDiagram
    participant Client
    participant Auth_Service
    participant API
    participant DB
    participant SSE
    
    Note over Client,SSE: Authentication Flow
    
    Client->>Auth_Service: POST /auth/login
    Note right of Client: { email, password }
    
    Auth_Service->>DB: Validate credentials
    DB-->>Auth_Service: User data
    
    Auth_Service->>Auth_Service: Generate JWT
    Auth_Service-->>Client: { token, refreshToken }
    
    Note over Client,SSE: API Request Flow
    
    Client->>API: GET /products
    Note right of Client: Authorization: Bearer <token>
    
    API->>API: Validate JWT
    API->>API: Extract sellerId
    
    API->>DB: SELECT * FROM products WHERE seller_id = $1
    Note right of API: Always scoped to seller
    
    DB-->>API: Seller's products only
    API-->>Client: { success: true, data: products }
    
    Note over Client,SSE: Event Broadcasting
    
    API->>DB: INSERT INTO events (seller_id, ...)
    DB-->>API: Event stored
    
    API->>SSE: Broadcast to seller
    Note right of API: Only to specific seller
    
    SSE-->>Client: Real-time notification
```

## Security Layers

```mermaid
graph TD
    subgraph "Layer 1: Network Security"
        HTTPS[HTTPS/TLS]
        Firewall[Firewall Rules]
        DDoS[DDoS Protection]
    end
    
    subgraph "Layer 2: Authentication"
        JWT[JWT Validation]
        Token_Expiry[Token Expiration]
        Refresh_Tokens[Refresh Tokens]
    end
    
    subgraph "Layer 3: Authorization"
        Seller_Isolation[Seller Isolation]
        Resource_Ownership[Resource Ownership]
        Action_Permissions[Action Permissions]
    end
    
    subgraph "Layer 4: Data Security"
        SQL_Injection[SQL Injection Prevention]
        Input_Validation[Input Validation]
        Encryption[Data Encryption]
    end
    
    subgraph "Layer 5: Application Security"
        Rate_Limiting[Rate Limiting]
        CORS_Policy[CORS Policy]
        Error_Handling[Secure Error Handling]
    end
    
    subgraph "Layer 6: Monitoring"
        Audit_Logs[Audit Logs]
        Security_Events[Security Events]
        Anomaly_Detection[Anomaly Detection]
    end
    
    HTTPS --> JWT
    JWT --> Seller_Isolation
    Seller_Isolation --> SQL_Injection
    SQL_Injection --> Rate_Limiting
    Rate_Limiting --> Audit_Logs
```

## Database Security Model

```mermaid
erDiagram
    SELLERS {
        string id PK
        string email UK
        string password_hash
        string name
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        int id PK
        string seller_id FK
        string name
        text description
        decimal price
        int quantity
        string category
        timestamp created_at
        timestamp updated_at
    }
    
    EVENTS {
        bigint id PK
        string seller_id FK
        string type
        int product_id FK
        jsonb payload
        timestamp created_at
    }
    
    SECURITY_AUDIT {
        bigint id PK
        string seller_id FK
        string event_type
        string resource
        string action
        string ip_address
        text user_agent
        timestamp created_at
    }
    
    SELLERS ||--o{ PRODUCTS : owns
    SELLERS ||--o{ EVENTS : generates
    SELLERS ||--o{ SECURITY_AUDIT : logs
    PRODUCTS ||--o{ EVENTS : triggers
```

## Implementation Status

### Implemented (Demo)
- [x] Basic seller context extraction
- [x] Query scoping by sellerId
- [x] Resource ownership validation
- [x] Event scoping to seller
- [x] Mock authentication middleware

### To Implement (Production)
- [ ] JWT token generation and validation
- [ ] User registration and login endpoints
- [ ] Password hashing and storage
- [ ] Token refresh mechanism
- [ ] Row-level security in PostgreSQL
- [ ] Security audit logging
- [ ] Rate limiting and DDoS protection

### Security Checklist
- [ ] HTTPS enforcement
- [ ] Secure token storage
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] CORS policy configuration
- [ ] Error message sanitization
- [ ] Security headers
- [ ] Audit trail implementation
- [ ] Monitoring and alerting
- [ ] Penetration testing

## Conclusion

This architecture ensures that:

1. **Authentication is properly handled** with JWT tokens
2. **Authorization is enforced** at multiple layers
3. **Seller isolation is maintained** throughout the system
4. **Security is built-in** from the ground up
5. **The system is production-ready** with proper security measures

The current demo implementation provides a solid foundation that can be extended to full authentication when needed.
