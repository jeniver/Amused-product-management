# Products Dashboard - React Frontend

A modern, responsive React application for managing product inventory with real-time notifications. Built with TypeScript, Redux Toolkit, and Tailwind CSS.

## Features

- **Products Management**: Full CRUD operations for products with pagination, search, and filtering
- **AI-Powered Insights**: 
  - Smart product recommendations based on category and price similarity
  - Stock predictions with sales velocity analysis
  - Auto-categorization using AI for new products
  - Inventory analytics with trend visualization
  - AI health monitoring
- **Real-time Notifications**: Server-Sent Events (SSE) for live updates with heartbeat mechanism
- **Advanced Search & Filtering**: Pagination, category filtering, price range, stock status
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **State Management**: Redux Toolkit with RTK Query for API management
- **Custom Hooks**: Reusable hooks for API calls, AI services, and SSE connection
- **Modern UI**: Clean, accessible interface with loading states and comprehensive error handling
- **Error Boundary**: Comprehensive error handling with graceful fallbacks

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **RTK Query** - API data fetching and caching
- **Tailwind CSS** - Styling
- **Server-Sent Events** - Real-time notifications

## Project Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── ConfirmationDialog.tsx
│   ├── ProductForm.tsx   # Product creation/editing form
│   ├── ProductsTable.tsx # Products display table
│   ├── ProductsDashboard.tsx # Main dashboard component
│   ├── NotificationsPanel.tsx # Real-time notifications
│   └── NotificationBell.tsx # Notification trigger
├── hooks/
│   ├── useProducts.ts    # Product management hook
│   ├── useNotifications.ts # Notification management hook
│   └── useSSE.ts        # Server-Sent Events hook
├── store/
│   ├── api.ts           # RTK Query API configuration
│   ├── index.ts         # Store configuration
│   └── slices/          # Redux slices
│       ├── notificationsSlice.ts
│       └── modalSlice.ts
├── types/
│   └── index.ts         # TypeScript type definitions
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
└── index.css            # Global styles
```

## API Integration

The application integrates with the following backend APIs:

### Products Management APIs

#### GET /products
- **Purpose**: List products with pagination, search, and filtering
- **Method**: GET
- **URL**: `http://localhost:4000/products`
- **Headers**: `x-seller-id` (optional, defaults to 'demo-seller')
- **Query Parameters**: 
  - `page` (number): Page number for pagination
  - `limit` (number): Items per page
  - `search` (string): Search term for product name/description
  - `category` (string): Filter by category
  - `minPrice` (number): Minimum price filter
  - `maxPrice` (number): Maximum price filter
  - `inStock` (boolean): Filter by stock availability
  - `sortBy` (string): Sort field
  - `sortOrder` (asc|desc): Sort direction
- **Response**: Paginated Product objects with metadata

#### POST /products
- **Purpose**: Create a new product
- **Method**: POST
- **URL**: `http://localhost:4000/products`
- **Headers**: `x-seller-id`, `Content-Type: application/json`
- **Request Body**: Product creation data
- **Response**: Created Product object (HTTP 201)

#### PUT /products/{id}
- **Purpose**: Update an existing product
- **Method**: PUT
- **URL**: `http://localhost:4000/products/{id}`
- **Headers**: `x-seller-id`, `Content-Type: application/json`
- **Request Body**: Partial Product object
- **Response**: Updated Product object (HTTP 200)

#### DELETE /products/{id}
- **Purpose**: Delete a product
- **Method**: DELETE
- **URL**: `http://localhost:4000/products/{id}`
- **Headers**: `x-seller-id`
- **Response**: No content (HTTP 204)

### AI Services APIs

#### GET /ai/recommendations/{productId}
- **Purpose**: Get AI-powered product recommendations
- **Method**: GET
- **URL**: `http://localhost:4000/ai/recommendations/{productId}`
- **Response**: Array of recommended products with confidence scores

#### GET /ai/predictions/low-stock/{productId}
- **Purpose**: Get stock predictions and reorder recommendations
- **Method**: GET
- **URL**: `http://localhost:4000/ai/predictions/low-stock/{productId}`
- **Response**: Stock prediction data with sales velocity analysis

#### POST /ai/categorize
- **Purpose**: Auto-categorize products using AI
- **Method**: POST
- **URL**: `http://localhost:4000/ai/categorize`
- **Request Body**: `{ name: string, description?: string }`
- **Response**: Category suggestions with confidence scores

#### GET /ai/analytics/inventory-trends
- **Purpose**: Get inventory analytics and trends
- **Method**: GET
- **URL**: `http://localhost:4000/ai/analytics/inventory-trends`
- **Query Parameters**: `days` (number): Number of days for trend analysis
- **Response**: Historical inventory trend data

#### GET /ai/health
- **Purpose**: Check AI services health status
- **Method**: GET
- **URL**: `http://localhost:4000/ai/health`
- **Response**: AI services status and performance metrics

### Real-time Events API (Server-Sent Events)

#### GET /events/stream
- **Purpose**: Real-time event stream for notifications
- **Method**: GET
- **URL**: `http://localhost:4000/events/stream`
- **Headers**: `x-seller-id` (optional, defaults to 'demo-seller')
- **Response Type**: `text/event-stream`
- **Event Types**:
  - `Connected` - Connection established
  - `ProductCreated` - New product added
  - `ProductUpdated` - Product modified
  - `ProductDeleted` - Product removed
  - `LowStockWarning` - Stock level below threshold

## Data Models

### Product Schema
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

### Notification Schema
```typescript
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  product_id?: number;
}
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running on `http://localhost:4000`

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit the .env file with your configuration
   # The default values should work for local development
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Features Overview

### Products Dashboard

- **Product Table**: Displays all products with sorting capabilities
- **Add Product**: Modal form for creating new products
- **Edit Product**: Modal form for updating existing products
- **Delete Product**: Confirmation dialog for product removal
- **Stock Status**: Visual indicators for stock levels (In Stock, Low Stock, Out of Stock)
- **Statistics Cards**: Overview of total products, in-stock items, low-stock alerts, and out-of-stock items

### Real-time Notifications

- **Live Updates**: Server-Sent Events for real-time notifications
- **Notification Types**: Info, warning, error, and success notifications
- **Filtering**: Filter notifications by type (All, Unread, Warnings)
- **Actions**: Mark as read, mark all as read, remove individual notifications, clear all
- **Connection Status**: Visual indicator for SSE connection status
- **Unread Counter**: Badge showing number of unread notifications

### User Experience

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Loading States**: Visual feedback during API operations
- **Error Handling**: Graceful error handling with user-friendly messages
- **Accessibility**: Keyboard navigation and screen reader support
- **Modern UI**: Clean, professional interface with smooth animations

## Custom Hooks

### useProducts
Manages product-related operations including CRUD actions and modal state.

```typescript
const {
  products,
  isLoading,
  handleCreateProduct,
  handleEditProduct,
  handleDelete,
  // ... other methods
} = useProducts();
```

### useNotifications
Manages notification state and operations.

```typescript
const {
  notifications,
  unreadCount,
  isConnected,
  handleMarkAsRead,
  handleClearAllNotifications,
  // ... other methods
} = useNotifications();
```

### useSSE
Handles Server-Sent Events connection and event processing.

```typescript
const { isConnected } = useSSE();
```

## State Management

The application uses Redux Toolkit for state management with the following slices:

- **productsApi**: RTK Query slice for API operations
- **notifications**: Notification state and SSE event handling
- **modal**: Modal state management for product forms

## Styling

The application uses Tailwind CSS for styling with:

- **Responsive Design**: Mobile-first approach
- **Component Variants**: Consistent button, input, and modal styles
- **Color System**: Semantic color usage for different states
- **Animations**: Smooth transitions and loading states

## Environment Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_SSE_URL=http://localhost:4000/events/stream

# Default Seller ID
REACT_APP_DEFAULT_SELLER_ID=demo-seller

# Low Stock Threshold
REACT_APP_LOW_STOCK_THRESHOLD=5

# Environment
REACT_APP_ENV=development

# Feature Flags
REACT_APP_ENABLE_SSE=true
REACT_APP_ENABLE_NOTIFICATIONS=true

# API Timeouts (in milliseconds)
REACT_APP_API_TIMEOUT=10000
REACT_APP_SSE_RECONNECT_INTERVAL=5000
```

### Environment Variables Explained:

- **REACT_APP_API_BASE_URL**: Base URL for the backend API
- **REACT_APP_SSE_URL**: URL for Server-Sent Events stream
- **REACT_APP_DEFAULT_SELLER_ID**: Default seller identifier for API calls
- **REACT_APP_LOW_STOCK_THRESHOLD**: Threshold for low stock warnings
- **REACT_APP_ENV**: Environment (development/production)
- **REACT_APP_ENABLE_SSE**: Enable/disable real-time notifications
- **REACT_APP_ENABLE_NOTIFICATIONS**: Enable/disable notification system
- **REACT_APP_API_TIMEOUT**: API request timeout in milliseconds
- **REACT_APP_SSE_RECONNECT_INTERVAL**: SSE reconnection interval in milliseconds

## Error Handling

- **API Errors**: Graceful handling of network and server errors
- **Form Validation**: Client-side validation with error messages
- **SSE Connection**: Automatic reconnection on connection loss
- **User Feedback**: Clear error messages and loading states

## Performance Optimizations

- **RTK Query Caching**: Automatic caching and background updates
- **Component Memoization**: Optimized re-renders
- **Lazy Loading**: Efficient component loading
- **Bundle Optimization**: Code splitting and tree shaking

