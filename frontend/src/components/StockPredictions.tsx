import React, { useEffect, useState } from 'react';
import type { StockPrediction } from '../types/aiTypes';

// Define component props
export interface StockPredictionsProps {
  productId: number;
}

// Create the component
const StockPredictions: React.FC<StockPredictionsProps> = ({ productId }) => {
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/ai/predictions/low-stock/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch prediction');
        
        const data = await response.json();
        if (data.success) {
          setPrediction(data.data);
        } else {
          throw new Error(data.error || 'Failed to load prediction');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prediction');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchPrediction();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Predictions</h3>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Predictions</h3>
        <p className="text-gray-500">No prediction data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Predictions</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className={`border rounded-lg p-4 ${
            prediction.daysUntilStockOut <= 7 ? 'bg-red-50 border-red-200' :
            prediction.daysUntilStockOut <= 14 ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
            <div className="text-sm text-gray-500">Days Until Stock Out</div>
            <div className="text-2xl font-semibold">
              {prediction.daysUntilStockOut} days
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Current Stock</div>
            <div className="text-2xl font-semibold">{prediction.currentStock} units</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Recommended Reorder Quantity</div>
            <div className="text-2xl font-semibold">
              {prediction.recommendedReorderQuantity} units
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">Sales Velocity</div>
            <div className="text-2xl font-semibold">
              {prediction.salesVelocity.toFixed(1)} units/day
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center">
          Prediction Confidence: {(prediction.confidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

export default StockPredictions;
