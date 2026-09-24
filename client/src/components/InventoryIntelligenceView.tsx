import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react';
import { getInventoryForecast, getAuthToken } from '../services/api';

interface ForecastItem {
  sku: string;
  name: string;
  currentQuantity: number;
  reorderPoint: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedReorder: number;
  aiAdvice: string;
}

const FALLBACK_FORECAST: ForecastItem[] = [
  {
    sku: 'CAM-AI-4K-BLK',
    name: 'Smart AI Security Camera 4K (Black)',
    currentQuantity: 4,
    reorderPoint: 15,
    risk: 'HIGH',
    recommendedReorder: 26,
    aiAdvice: 'High stockout risk! Sales velocity increased 42% this week. Reorder 26 units immediately.'
  },
  {
    sku: 'EAR-ANC-002-WHT',
    name: 'Wireless ANC Earbuds (White)',
    currentQuantity: 45,
    reorderPoint: 20,
    risk: 'LOW',
    recommendedReorder: 0,
    aiAdvice: 'Stock levels healthy. Estimated 32 days of inventory remaining.'
  },
  {
    sku: 'CHR-ERG-009-GRY',
    name: 'Ergonomic Mesh Chair',
    currentQuantity: 12,
    reorderPoint: 10,
    risk: 'MEDIUM',
    recommendedReorder: 15,
    aiAdvice: 'Approaching reorder threshold. Recommend placing order within 5 business days.'
  }
];

/**
 * Maps the backend inventory forecast response to our ForecastItem interface.
 * The backend returns different shapes depending on whether real data or mock fallback is used.
 */
function mapForecastItems(data: any): ForecastItem[] {
  if (data.forecasts && Array.isArray(data.forecasts)) {
    return data.forecasts.map((f: any) => ({
      sku: f.sku || f.variantSku || 'N/A',
      name: f.productName || f.name || 'Unknown Product',
      currentQuantity: f.currentQuantity ?? f.quantity ?? 0,
      reorderPoint: f.reorderPoint ?? 10,
      risk: f.riskLevel || f.risk || 'LOW',
      recommendedReorder: f.recommendedReorder ?? f.suggestedReorder ?? 0,
      aiAdvice: f.aiAdvice || f.explanation || f.advice || 'No AI analysis available.'
    }));
  }
  return FALLBACK_FORECAST;
}

export const InventoryIntelligenceView: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastItem[]>(FALLBACK_FORECAST);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');

  const loadForecast = async () => {
    const token = getAuthToken();
    if (!token) {
      // No auth token - use fallback data
      setForecast(FALLBACK_FORECAST);
      setDataSource('fallback');
      return;
    }

    setIsLoading(true);
    try {
      const data = await getInventoryForecast();
      const items = mapForecastItems(data);
      if (items.length > 0) {
        setForecast(items);
        setDataSource('api');
      } else {
        setForecast(FALLBACK_FORECAST);
        setDataSource('fallback');
      }
    } catch (err) {
      console.warn('Inventory forecast API error, using fallback:', err);
      setForecast(FALLBACK_FORECAST);
      setDataSource('fallback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
          <TrendingUp color="var(--accent-emerald)" size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Inventory Intelligence & Reorder Forecasting</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Combines statistical moving average demand models with Bedrock LLM stockout risk explanations.
          </p>
        </div>
        <button
          onClick={loadForecast}
          disabled={isLoading}
          style={{
            background: 'none',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-secondary)',
            padding: '0.4rem',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          title="Refresh forecast data"
        >
          <RefreshCcw size={16} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Data Source Indicator */}
      <div style={{
        fontSize: '0.75rem',
        color: dataSource === 'api' ? 'var(--accent-emerald)' : '#f59e0b',
        marginBottom: '1rem',
        padding: '0.35rem 0.75rem',
        background: dataSource === 'api' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        {dataSource === 'api' ? '● Live — Data from /api/v1/ai/inventory/forecast' : '● Demo — Using sample forecast data'}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>SKU / Product Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Current Stock</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reorder Threshold</th>
              <th style={{ padding: '0.75rem 1rem' }}>Stockout Risk</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recommended Reorder</th>
              <th style={{ padding: '0.75rem 1rem' }}>AI Actionable Advice</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((item) => (
              <tr key={item.sku} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <div>{item.name}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</span>
                </td>
                <td style={{ padding: '1rem' }}>{item.currentQuantity} units</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.reorderPoint} units</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    background: item.risk === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : item.risk === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: item.risk === 'HIGH' ? '#ef4444' : item.risk === 'MEDIUM' ? '#f59e0b' : 'var(--accent-emerald)'
                  }}>
                    {item.risk} RISK
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: 700, color: item.recommendedReorder > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {item.recommendedReorder > 0 ? `+${item.recommendedReorder} units` : '0 units'}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {item.aiAdvice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
