import { useCallback, useState, useEffect } from 'react';
import { useErrorHandler } from './useErrorHandler';
import apiService from '../services/apiService';
import { InventoryAnalyticsResponse } from '../types';

export const useAI = () => {
  const { handleError } = useErrorHandler();
  const [isCategorizing, setIsCategorizing] = useState(false);

  // Get AI recommendations for a product
  const useRecommendations = (productId?: number) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      if (productId) {
        setIsLoading(true);
        setError(null);
        apiService.getAIRecommendations(productId)
          .then(setData)
          .catch(err => setError(err))
          .finally(() => setIsLoading(false));
      }
    }, [productId]);

    return { data, isLoading, error };
  };

  // Get stock predictions for a product
  const useStockPredictions = (productId?: number) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      if (productId) {
        setIsLoading(true);
        setError(null);
        apiService.getStockPredictions(productId)
          .then(setData)
          .catch(err => setError(err))
          .finally(() => setIsLoading(false));
      }
    }, [productId]);

    return { data, isLoading, error };
  };

  // Get inventory trends
  const useInventoryTrends = (days?: number) => {
    const [data, setData] = useState<InventoryAnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiService.getInventoryTrends(days);
        setData(response);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }, [days]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
  };

  // Get AI health status
  const useAIHealth = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      setIsLoading(true);
      setError(null);
      apiService.getAIHealth()
        .then(setData)
        .catch(err => setError(err))
        .finally(() => setIsLoading(false));
    }, []);

    return { data, isLoading, error };
  };

  // Auto-categorize a product
  const handleCategorizeProduct = useCallback(async (productData: { name: string; description?: string }) => {
    try {
      setIsCategorizing(true);
      const result = await apiService.categorizeProduct(productData);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = handleError(error, {
        showNotification: false,
        fallbackMessage: 'Failed to categorize product',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsCategorizing(false);
    }
  }, [handleError]);

  return {
    // Hooks
    useRecommendations,
    useStockPredictions,
    useInventoryTrends,
    useAIHealth,
    
    // Actions
    handleCategorizeProduct,
    
    // Loading states
    isCategorizing,
  };
};
