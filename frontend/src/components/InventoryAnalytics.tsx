import React, { useEffect, useState } from 'react';
import type { 
  CategoryBreakdown,
  ProductTrend,
  InventoryAnalyticsSummary,
  AnalysisPeriod
} from '../types';
import { apiService } from '../services/apiService';

interface InventoryAnalytics {
  trends: ProductTrend[];
  summary: InventoryAnalyticsSummary;
  categoryBreakdown: CategoryBreakdown[];
  analysisPeriod: AnalysisPeriod;
}

const InventoryAnalyticsComponent: React.FC = () => {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await apiService.getInventoryTrends(30);
        
        if (response.success) {
          setAnalytics(response.data);
        } else {
          throw new Error(response.message || 'Failed to load analytics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const summaryCards = [
    {
      label: 'Total Products',
      value: analytics.summary.totalProducts,
      type: 'number'
    },
    {
      label: 'Low Stock Items',
      value: analytics.summary.lowStockProducts,
      type: 'number',
      alert: true
    },
    {
      label: 'Out of Stock',
      value: analytics.summary.outOfStockProducts,
      type: 'number',
      alert: true
    },
    {
      label: 'Average Stock',
      value: Math.round(analytics.summary.averageStockLevel),
      type: 'number'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white shadow rounded-lg p-6 ${
              card.alert && card.value > 0 ? 'bg-red-50' : ''
            }`}
          >
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="mt-2 flex items-baseline">
              <div className="text-2xl font-semibold">
                {card.type === 'number'
                  ? card.value.toLocaleString()
                  : card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
        <div className="space-y-4">
          {analytics.categoryBreakdown.map((category: CategoryBreakdown) => (
            <div
              key={category.category}
              className="border rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm text-gray-500">
                    {category.productCount} products
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Avg Stock: {Math.round(category.averageStock)}
                  </div>
                  {category.lowStockCount > 0 && (
                    <div className="text-sm text-red-500">
                      {category.lowStockCount} low stock
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Trends */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Trends</h3>
        <div className="space-y-4">
          {analytics.trends.map((trend) => (
            <div
              key={trend.productId}
              className="border rounded-lg p-4"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{trend.name}</div>
                    <div className="text-sm text-gray-500">{trend.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Current Stock: {trend.currentStock}
                    </div>
                    <div className={`text-sm ${trend.prediction.daysUntilStockOut <= 7 
                      ? 'text-red-500' 
                      : trend.prediction.daysUntilStockOut <= 14 
                        ? 'text-yellow-500' 
                        : 'text-green-500'}`}>
                      {trend.prediction.daysUntilStockOut} days until stock out
                    </div>
                    <div className="text-sm text-gray-500">
                      Sales Velocity: {trend.salesVelocity.toFixed(1)} units/day
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalyticsComponent;
