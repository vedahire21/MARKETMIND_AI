import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';

interface ForecastItem {
  sku: string;
  name: string;
  currentQuantity: number;
  reorderPoint: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedReorder: number;
  aiAdvice: string;
}

const MOCK_FORECAST: ForecastItem[] = [
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

export const InventoryIntelligenceView: React.FC = () => {
  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
          <TrendingUp color="var(--accent-emerald)" size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Inventory Intelligence & Reorder Forecasting</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Combines statistical moving average demand models with Bedrock LLM stockout risk explanations.
          </p>
        </div>
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
            {MOCK_FORECAST.map((item) => (
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
