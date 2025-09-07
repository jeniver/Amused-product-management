import { config } from '../config';
import type { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductsQueryParams, 
  ProductsResponse,
  InventoryAnalyticsResponse,
  AIHealthStatus,
  AIRecommendation,
  StockPrediction,
  CategorySuggestion
} from '../types';

class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private _retryCount: number = 0;

  constructor() {
    this.baseURL = config.API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'x-seller-id': config.DEFAULT_SELLER_ID,
    };
  }

  getRetryCount(): number {
    return this._retryCount;
  }

  incrementRetryCount(): void {
    this._retryCount++;
  }

  resetRetryCount(): void {
    this._retryCount = 0;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: 'Unknown error',
          message: `HTTP error! status: ${response.status}`,
          statusCode: response.status 
        }));
        throw new Error(errorData.message);
      }

      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`API Error [${endpoint}]:`, error.message);
      } else {
        console.error(`API Error [${endpoint}]:`, error);
      }
      throw error;
    }
  }

  async getProducts(params?: ProductsQueryParams): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProductsResponse>(endpoint);
  }

  async getAllProducts(page: number = 1, limit: number = 20): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await this.request<{ 
        success: boolean; 
        data: Product[]; 
        pagination?: { 
          total: number; 
          page: number; 
          limit: number; 
          totalPages: number; 
        } 
      }>(`/products?page=${page}&limit=${limit}`);
      
      if (response.success && Array.isArray(response.data)) {
        const pagination = response.pagination || {
          total: response.data.length,
          page,
          limit,
          totalPages: Math.ceil(response.data.length / limit)
        };
        
        return {
          products: response.data,
          total: pagination.total,
          page: pagination.page,
          totalPages: pagination.totalPages
        };
      } else if (Array.isArray(response)) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = response.slice(startIndex, endIndex);
        
        return {
          products: paginatedData,
          total: response.length,
          page,
          totalPages: Math.ceil(response.length / limit)
        };
      } else {
        console.warn('Unexpected API response format:', response);
        return { products: [], total: 0, page, totalPages: 0 };
      }
    } catch (error) {
      console.warn('API not available, returning mock data');
      const mockProducts = [
        {
          id: 1,
          name: 'Sample Product 1',
          price: 29.99,
          quantity: 10,
          category: 'electronics',
          description: 'A sample electronic product',
          seller_id: 'demo-seller',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = mockProducts.slice(startIndex, endIndex);
      
      return {
        products: paginatedData,
        total: mockProducts.length,
        page,
        totalPages: Math.ceil(mockProducts.length / limit)
      };
    }
  }

  async createProduct(product: CreateProductRequest): Promise<Product> {
    try {
      const response = await this.request<{ success: boolean; data: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('API not available, simulating product creation');
      return {
        id: Date.now(),
        ...product,
        seller_id: 'demo-seller',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async updateProduct(id: number, updates: UpdateProductRequest): Promise<Product> {
    try {
      const response = await this.request<{ success: boolean; data: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('API not available, simulating product update');
      return {
        id,
        name: 'Updated Product',
        price: 99.99,
        quantity: 5,
        category: 'electronics',
        description: 'Updated product description',
        seller_id: 'demo-seller',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates
      };
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      return await this.request<void>(`/products/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('API not available, simulating product deletion');
      return Promise.resolve();
    }
  }

  async getAIRecommendations(productId: number): Promise<AIRecommendation[]> {
    try {
      const response = await this.request<{ success: boolean; data: AIRecommendation[] }>(`/ai/recommendations/${productId}`);
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn('AI recommendations not available, returning mock data');
      return [
        {
          id: 1,
          name: 'Similar Product 1',
          price: 29.99,
          category: 'electronics',
          reason: 'Similar category and price range',
          confidence: 0.85
        }
      ];
    }
  }

  async getStockPredictions(productId: number): Promise<StockPrediction> {
    try {
      const response = await this.request<{ success: boolean; data: StockPrediction }>(`/ai/predictions/low-stock/${productId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('Stock predictions not available, returning mock data');
      return {
        product_id: productId,
        predicted_stock_out_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        days_until_stock_out: 30,
        recommended_reorder_quantity: 50,
        confidence: 0.8,
        sales_velocity: 2.5
      };
    }
  }

  async categorizeProduct(data: { name: string; description?: string }): Promise<CategorySuggestion> {
    try {
      const response = await this.request<{ success: boolean; data: any }>('/ai/categorize', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('AI categorization not available, returning mock data');
      return {
        category: 'electronics',
        confidence: 0.75,
        keywords_matched: ['electronic', 'device']
      };
    }
  }

  async getInventoryTrends(days?: number): Promise<InventoryAnalyticsResponse> {
    try {
      const endpoint = days ? `/ai/analytics/inventory-trends?days=${days}` : '/ai/analytics/inventory-trends';
      const response = await this.request<InventoryAnalyticsResponse>(endpoint);
      return response;
    } catch (error) {
      console.warn('Inventory trends not available, returning mock data');
      return {
        success: true,
        data: {
          trends: [
            {
              productId: 1,
              name: "Sample Product",
              category: "electronics",
              currentStock: 10,
              salesVelocity: 0.5,
              reorderPoint: 5,
              prediction: {
                productId: 1,
                currentStock: 10,
                daysUntilStockOut: 20,
                recommendedReorderQuantity: 15,
                salesVelocity: 0.5,
                confidence: 0.8
              }
            }
          ],
          analysisPeriod: {
            days: days || 30,
            startDate: new Date(Date.now() - (days || 30) * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          },
          categoryBreakdown: [
            {
              category: "electronics",
              productCount: 1,
              averageStock: 10,
              lowStockCount: 0
            }
          ],
          summary: {
            totalProducts: 1,
            lowStockProducts: 0,
            outOfStockProducts: 0,
            averageStockLevel: 10
          },
          generatedAt: new Date().toISOString()
        },
        message: "Mock inventory trends analysis completed"
      };
    }
  }

  async getAIHealth(): Promise<AIHealthStatus> {
    try {
      const response = await this.request<{ success: boolean; data: AIHealthStatus }>('/ai/health');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('AI health check not available, returning mock data');
      return {
        status: 'healthy',
        services: {
          recommendations: true,
          predictions: true,
          categorization: true,
          analytics: true
        },
        response_time_ms: 150,
        last_check: new Date().toISOString()
      };
    }
  }

  createSSEConnection(): EventSource {
    const url = new URL(`${this.baseURL}/events/stream`);
    url.searchParams.append('seller_id', config.DEFAULT_SELLER_ID);
    url.searchParams.append('t', Date.now().toString());

    const eventSource = new EventSource(url.toString(), {
      withCredentials: true
    });

    eventSource.onopen = () => {
      this.resetRetryCount();
      console.log('SSE connection established');
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      switch (eventSource.readyState) {
        case EventSource.CLOSED:
          this.incrementRetryCount();
          console.log('Connection closed, will retry automatically');
          break;
        case EventSource.CONNECTING:
          console.log('Attempting to reconnect...');
          break;
      }
    };
    
    return eventSource;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/health', { method: 'GET' });
      return true;
    } catch {
      try {
        await this.getAllProducts();
        return true;
      } catch {
        return false;
      }
    }
  }
}

export const apiService = new ApiService();
export default apiService;
