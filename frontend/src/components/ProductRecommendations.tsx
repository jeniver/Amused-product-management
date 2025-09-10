import React, { useEffect, useState } from 'react';
import { useOpenAI } from '../hooks/useOpenAI';
import LoadingSpinner from './common/LoadingSpinner';

import { AIRecommendation } from '../types';

interface Recommendation {
  productId: number;
  name: string;
  price: number;
  category: string;
  reason: string;
  similarity: number;
}

interface ProductRecommendationsProps {
  productId?: number;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ productId }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getRecommendations } = useOpenAI();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        const result = await getRecommendations(productId);
        if (result) {
          const transformedRecommendations: Recommendation[] = result.map(rec => ({
            productId: rec.id,
            name: rec.name,
            price: rec.price,
            category: rec.category,
            reason: rec.reason,
            similarity: rec.similarity, // Convert to percentage
          }));
          setRecommendations(transformedRecommendations);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId]);

  if (!productId || (!isLoading && recommendations.length === 0)) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <h3 className="text-lg font-medium text-blue-900 mb-2">
        AI-Powered Recommendations
      </h3>
      {isLoading ? (
        <div className="flex justify-center p-4">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.productId}
              className="bg-white p-3 rounded-md shadow-sm border border-blue-100"
            >
              <div className="font-medium text-blue-800">{rec.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                Confidence: {(rec.similarity * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">{rec.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductRecommendations;
