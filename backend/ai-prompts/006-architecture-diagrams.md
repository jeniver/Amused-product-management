# AI Prompt 006: Architecture Diagrams

**Timestamp**: 2025-09-07T19:39:00Z  
**Phase**: Documentation  
**Type**: AI-Assisted Development

## Prompt

```
Create comprehensive architecture diagrams for the Amused product management system:

1. High-level system architecture
2. Database schema diagram
3. Event flow diagram
4. AI service integration diagram
5. Deployment architecture
6. API flow diagram




## AI Response

### 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Web[Web Application]
        Mobile[Mobile App]
        API_Client[API Client]
    end
    
    subgraph "API Gateway"
        LB[Load Balancer]
        Auth[Authentication]
        RateLimit[Rate Limiting]
    end
    
    subgraph "Application Layer"
        API[Express.js API]
        SSE[Server-Sent Events]
        AI[AI Services]
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
        Files[File Storage]
    end
    
    subgraph "External Services"
        AI_ML[AI/ML Models]
        Email[Email Service]
        SMS[SMS Service]
    end
    
    Web --> LB
    Mobile --> LB
    API_Client --> LB
    
    LB --> Auth
    Auth --> RateLimit
    RateLimit --> API
    
    API --> Products
    API --> Events
    API --> AI
    
    Products --> DB
    Events --> DB
    AI --> DB
    AI --> AI_ML
    
    Events --> SSE
    SSE --> Web
    SSE --> Mobile
    
    Notifications --> Email
    Notifications --> SMS
    
    AI --> Cache
    Products --> Cache
```

### 2. Database Schema Diagram

```mermaid
erDiagram
    PRODUCTS {
        int id PK
        string seller_id
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
        string type
        string seller_id
        int product_id FK
        jsonb payload
        timestamp created_at
    }
    
    AI_RECOMMENDATIONS {
        int id PK
        int product_id FK
        jsonb recommendations
        timestamp expires_at
        timestamp created_at
    }
    
    AI_PREDICTIONS {
        int id PK
        int product_id FK
        string prediction_type
        jsonb prediction_data
        decimal confidence_score
        timestamp created_at
    }
    
    SALES_HISTORY {
        int id PK
        int product_id FK
        int quantity_sold
        date sale_date
        decimal price
        timestamp created_at
    }
    
    PRODUCTS ||--o{ EVENTS : generates
    PRODUCTS ||--o{ AI_RECOMMENDATIONS : has
    PRODUCTS ||--o{ AI_PREDICTIONS : has
    PRODUCTS ||--o{ SALES_HISTORY : tracks
```

### 3. Event Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant SSE
    participant AI
    
    Client->>API: POST /products
    API->>DB: Insert product
    DB-->>API: Product created
    API->>DB: Insert event
    DB-->>API: Event stored
    API->>SSE: Broadcast event
    SSE-->>Client: Real-time notification
    
    Note over AI: AI Processing
    API->>AI: Generate recommendations
    AI->>DB: Store recommendations
    AI-->>API: Recommendations ready
    API->>SSE: Broadcast AI event
    SSE-->>Client: AI notification
    
    Client->>API: GET /products (low stock)
    API->>AI: Check stock predictions
    AI->>DB: Query sales history
    DB-->>AI: Historical data
    AI-->>API: Low stock prediction
    API-->>Client: Stock alert
```

### 4. AI Service Integration

```mermaid
graph LR
    subgraph "AI Service Layer"
        RecEngine[Recommendation Engine]
        PredEngine[Prediction Engine]
        CatEngine[Categorization Engine]
        Cache[AI Cache]
    end
    
    subgraph "Data Sources"
        Products[Product Data]
        Sales[Sales History]
        Events[Event Data]
    end
    
    subgraph "AI Models"
        Similarity[Product Similarity]
        TimeSeries[Time Series Analysis]
        NLP[Natural Language Processing]
    end
    
    subgraph "Outputs"
        Recommendations[Product Recommendations]
        Predictions[Stock Predictions]
        Categories[Auto Categories]
    end
    
    Products --> RecEngine
    Products --> CatEngine
    Sales --> PredEngine
    Events --> RecEngine
    
    RecEngine --> Similarity
    PredEngine --> TimeSeries
    CatEngine --> NLP
    
    Similarity --> Recommendations
    TimeSeries --> Predictions
    NLP --> Categories
    
    RecEngine --> Cache
    PredEngine --> Cache
    CatEngine --> Cache
    
    Cache --> Recommendations
    Cache --> Predictions
    Cache --> Categories
```

### 5. Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer"
            LB[Nginx Load Balancer]
        end
        
        subgraph "Application Servers"
            App1[Node.js App 1]
            App2[Node.js App 2]
            App3[Node.js App 3]
        end
        
        subgraph "Database Cluster"
            Master[(PostgreSQL Master)]
            Slave1[(PostgreSQL Slave 1)]
            Slave2[(PostgreSQL Slave 2)]
        end
        
        subgraph "Cache Layer"
            Redis1[(Redis Primary)]
            Redis2[(Redis Replica)]
        end
        
        subgraph "Monitoring"
            Prometheus[Prometheus]
            Grafana[Grafana]
            Logs[ELK Stack]
        end
    end
    
    subgraph "External Services"
        CDN[CDN]
        AI_API[AI/ML API]
        Email_SVC[Email Service]
    end
    
    CDN --> LB
    LB --> App1
    LB --> App2
    LB --> App3
    
    App1 --> Master
    App2 --> Master
    App3 --> Master
    
    Master --> Slave1
    Master --> Slave2
    
    App1 --> Redis1
    App2 --> Redis1
    App3 --> Redis1
    
    Redis1 --> Redis2
    
    App1 --> AI_API
    App2 --> AI_API
    App3 --> AI_API
    
    App1 --> Email_SVC
    App2 --> Email_SVC
    App3 --> Email_SVC
    
    App1 --> Prometheus
    App2 --> Prometheus
    App3 --> Prometheus
    
    Prometheus --> Grafana
    App1 --> Logs
    App2 --> Logs
    App3 --> Logs
```

### 6. API Flow Diagram

```mermaid
flowchart TD
    Start([Client Request]) --> Auth{Authenticated?}
    Auth -->|No| AuthError[401 Unauthorized]
    Auth -->|Yes| Validate{Valid Request?}
    
    Validate -->|No| ValidationError[400 Bad Request]
    Validate -->|Yes| Route{Route Type}
    
    Route -->|Products| ProductAPI[Product API]
    Route -->|Events| EventAPI[Event API]
    Route -->|AI| AIAPI[AI API]
    
    ProductAPI --> ProductLogic[Product Logic]
    EventAPI --> EventLogic[Event Logic]
    AIAPI --> AILogic[AI Logic]
    
    ProductLogic --> DB[(Database)]
    EventLogic --> DB
    AILogic --> DB
    
    DB --> Response[API Response]
    
    EventLogic --> SSE[SSE Broadcast]
    SSE --> Client[Real-time Client]
    
    AILogic --> Cache[(AI Cache)]
    Cache --> Response
    
    Response --> Log[Logging]
    Log --> End([Response Sent])
    
    AuthError --> End
    ValidationError --> End
```

## Human in the Loop Notes

**Validation**: The diagrams provide comprehensive coverage of the system architecture with clear relationships and data flow.

**Changes Made**:
- Simplified deployment for MVP
- Focused on core components
- Added AI service integration details
- Included monitoring and logging

**Implementation Priority**:
1. Core system architecture
2. Database schema implementation
3. Event flow implementation
4. AI service integration
5. Deployment configuration
