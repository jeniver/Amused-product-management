import React, { useEffect, useState } from 'react';
import { useAI } from '../hooks/useAI';
import LoadingSpinner from './common/LoadingSpinner';
import { AIRecommendation } from '../types';

interface AIRecommendationsProps {
  productId?: number;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ productId }) => {
  const { data: recommendations, isLoading, error } = useAI().useRecommendations(productId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">Error loading recommendations</div>;
  }

  if (!recommendations?.length) {
    return <div className="text-gray-500">No recommendations available</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">AI Recommendations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec: AIRecommendation) => (
          <div 
            key={rec.id}
            className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="font-medium">{rec.name}</div>
            <div className="text-sm text-gray-600">Category: {rec.category}</div>
            <div className="text-sm text-gray-600">Price: ${rec.price}</div>
            <div className="mt-2 text-sm">
              <span className="text-blue-600">
                Confidence: {(rec.similarity * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;