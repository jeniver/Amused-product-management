import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductsQueryParams,
  ProductsResponse,
  AIRecommendation,
  StockPrediction,
  CategorySuggestion,
  InventoryAnalyticsResponse,
  AIHealthStatus
} from '../types';
import { config } from '../config';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.API_BASE_URL,
    timeout: config.API_TIMEOUT,
    prepareHeaders: (headers) => {
      // Add seller ID header
      headers.set('x-seller-id', config.DEFAULT_SELLER_ID);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Product', 'AIRecommendation', 'StockPrediction'],
  endpoints: (builder) => ({
    // Get all products with enhanced filtering and pagination
    getProducts: builder.query<ProductsResponse, ProductsQueryParams | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params && typeof params === 'object' && params !== null) {
          const paramEntries = Object.entries(params as Record<string, any>);
          paramEntries.forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              searchParams.append(key, String(value));
            }
          });
        }
        return `/products?${searchParams.toString()}`;
      },
      providesTags: ['Product'],
    }),

    // Get products (legacy endpoint for backward compatibility)
    getAllProducts: builder.query<Product[], void>({
      query: () => '/products?limit=1000',
      transformResponse: (response: any) => {
        // Handle both array response and object with products property
        if (Array.isArray(response)) {
          return response;
        }
        return response.products || [];
      },
      providesTags: ['Product'],
      // Add retry logic
      keepUnusedDataFor: 30, // Keep data for 30 seconds
      // Transform error to be more user-friendly
      transformErrorResponse: (response: any) => {
        return {
          status: response.status,
          data: response.data || 'Failed to fetch products',
          message: 'Unable to connect to the server. Please check your connection.'
        };
      },
    }),
    
    // Create a new product
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (newProduct) => ({
        url: '/products',
        method: 'POST',
        body: newProduct,
      }),
      invalidatesTags: ['Product'],
    }),
    
    // Update an existing product
    updateProduct: builder.mutation<Product, { id: number; updates: UpdateProductRequest }>({
      query: ({ id, updates }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Product'],
    }),
    
    // Delete a product
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // AI Services
    // Get AI recommendations for a product
    getAIRecommendations: builder.query<AIRecommendation[], number>({
      query: (productId) => `/ai/recommendations/${productId}`,
      providesTags: ['AIRecommendation'],
    }),

    // Get stock predictions for a product
    getStockPredictions: builder.query<StockPrediction, number>({
      query: (productId) => `/ai/predictions/low-stock/${productId}`,
      providesTags: ['StockPrediction'],
    }),

    // Auto-categorize a product
    categorizeProduct: builder.mutation<CategorySuggestion, { name: string; description?: string }>({
      query: (productData) => ({
        url: '/ai/categorize',
        method: 'POST',
        body: productData,
      }),
    }),

    // Get inventory analytics trends
    getInventoryTrends: builder.query<InventoryAnalyticsResponse, { days?: number }>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.days) searchParams.append('days', String(params.days));
        return `/ai/analytics/inventory-trends?${searchParams.toString()}`;
      },
    }),

    // Get AI service health status
    getAIHealth: builder.query<AIHealthStatus, void>({
      query: () => '/ai/health',
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetAllProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAIRecommendationsQuery,
  useGetStockPredictionsQuery,
  useCategorizeProductMutation,
  useGetInventoryTrendsQuery,
  useGetAIHealthQuery,
} = productsApi;
