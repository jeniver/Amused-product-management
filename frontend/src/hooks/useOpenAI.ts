import { useState } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { AIAnalysisRequest, AIAnalysisResponse, ProductDescriptionResponse } from '../types/aiTypes';
import { AIRecommendation } from '../types';
import apiService from '../services/apiService';

export const useOpenAI = () => {
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);

  const analyzeProduct = async (productData: AIAnalysisRequest): Promise<AIAnalysisResponse | null> => {
    setIsLoading(true);
    try {
      const response = await apiService.analyzeWithAI(productData);
      return response;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateDescription = async (productName: string, category: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await apiService.generateProductDescription({
        productName,
        category
      });
      
      if (response.success && response.data) {
        // Handle both response formats (description or analysis)
        return response.data.description || response.data.analysis || null;
      }
      return null;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getSalesPrediction = async (productId: number): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await apiService.getAIStockPrediction(productId);
      return response.data.analysis || null;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getMarketInsights = async (category: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const response = await apiService.getAIMarketInsights({
        category
      });
      return response.data.analysis || null;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendations = async (productId: number): Promise<AIRecommendation[] | null> => {
    setIsLoading(true);
    try {
      const response = await apiService.getAIRecommendations(productId);
      return response;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    analyzeProduct,
    generateDescription,
    getSalesPrediction,
    getMarketInsights,
    getRecommendations
  };
};
