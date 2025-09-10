# Product Management API

A Node.js/TypeScript backend API for managing products with AI-powered recommendations and real-time notifications. Built as a full-stack engineering assignment demonstrating modern development practices.

## Quick Start

```bash
# Install dependencies
npm install

# Start PostgreSQL (Docker)
docker run --name amused-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=amused -p 5432:5432 -d postgres:13

# Initialize database
npm run db:up

# Start development server
npm run dev
```

API available at `http://localhost:4000`

## API Endpoints

### Products
- `GET /products` - List products (with pagination, search, filtering)
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### AI Services
- `GET /ai/recommendations/:productId` - Get product 

### Recommendations
- `GET /ai/predictions/:productId` - Get sales predictions
- `POST /ai/categorize` - Auto-categorize products

### Real-time
- `GET /events/stream` - Server-Sent Events for live updates

## Tech Stack

- **Node.js + TypeScript** - Runtime and type safety
- **Express.js** - Web framework
- **PostgreSQL** - Database with connection pooling
- **Zod** - Input validation
- **Jest** - Testing
- **Server-Sent Events** - Real-time notifications

## Architecture

### Key Design Decisions
- **Clean Architecture** - Separated concerns with controllers, services, and data layers
- **Event-Driven** - Real-time updates using PostgreSQL LISTEN/NOTIFY
- **Type Safety** - Full TypeScript coverage with proper error handling
- **AI Integration** - Smart recommendations with caching and fallback strategies

### Database Schema
```sql
-- Core tables
products (id, seller_id, name, description, price, quantity, category, created_at, updated_at)
events (id, seller_id, product_id, type, payload, created_at)

-- AI tables
ai_recommendations (product_id, recommendations, expires_at)
ai_predictions (product_id, prediction_type, prediction_data, confidence_score)
sales_history (product_id, quantity_sold, sale_date, price)
```


### Production Strategy
- **JWT-based authentication** with seller context
- **Seller isolation** - all queries filtered by seller_id
- **Resource ownership** - products can only be accessed by their owner
- **Event scoping** - real-time events filtered by seller

## AI Features

### Product Recommendations
- Similar products based on category and keywords
- Trending items analysis
- Cross-selling suggestions
- 1-hour caching for performance

### Sales Predictions
- Demand forecasting using historical data
- Seasonal pattern recognition
- Confidence scoring for predictions
- 24-hour caching

### Auto-Categorization
- Keyword-based product categorization
- Confidence levels for categorization
- Extensible category system

## Project Structure

```
src/
├── index.ts              # App entry point
├── server.ts             # Express configuration
├── db.ts                # Database setup
├── config/              # Configuration
├── types/               # TypeScript definitions
├── middleware/          # Auth, validation, error handling
├── services/            # Business logic (AI service)
├── routes/              # API endpoints
├── sse/                 # Real-time events
└── __tests__/           # Unit and integration tests
```

## Testing

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
```

Test coverage includes:
- AI service business logic
- API endpoint integration tests
- Error handling scenarios

## Real-time Events

Events are automatically scoped to the authenticated seller:
- `ProductCreated` - New product added
- `ProductUpdated` - Product modified
- `LowStockWarning` - Inventory alerts
- `AIRecommendation` - AI suggestions

## Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Production server
- `npm test` - Run tests
- `npm run db:up` - Start PostgreSQL
- `npm run db:down` - Stop PostgreSQL

## Performance

- **Connection pooling** for database efficiency
- **Query optimization** with proper indexing
- **AI response caching** (1-24 hours)
- **Event-driven architecture** for real-time updates

