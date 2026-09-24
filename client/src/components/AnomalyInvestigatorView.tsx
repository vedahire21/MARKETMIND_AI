import React, { useState, useEffect } from 'react';
import { AlertOctagon, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { investigateAnomalies, getAuthToken } from '../services/api';

interface AnomalyReport {
  flag: string;
  detectedAgo: string;
  title: string;
  evidence: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const FALLBACK_ANOMALY: AnomalyReport = {
  flag: 'REFUND_RATE_SPIKE_DETECTED',
  detectedAgo: '14 mins ago',
  title: 'Seller Store #SLR-9812: Refund rate increased from 3.2% to 16.8%',
  evidence: 'AI Evidence Synthesis: 14 out of 18 recent returns cite "damaged package upon delivery" for Product SKU CAM-AI-4K-BLK. The underlying order IDs are linked to Courier Batch #IN-889.',
  severity: 'CRITICAL'
};

function mapAnomaly(data: any): AnomalyReport {
  if (data.anomalies && Array.isArray(data.anomalies) && data.anomalies.length > 0) {
    const a = data.anomalies[0];
    return {
      flag: a.flag || a.type || 'ANOMALY_DETECTED',
      detectedAgo: a.detectedAgo || a.timestamp || 'Recently',
      title: a.title || a.summary || 'Anomaly detected in marketplace metrics',
      evidence: a.evidence || a.explanation || a.details || 'AI evidence synthesis unavailable.',
      severity: a.severity || 'HIGH'
    };
  }
  // If the response has a direct structure
  if (data.flag || data.summary) {
    return {
      flag: data.flag || 'ANOMALY_DETECTED',
      detectedAgo: data.detectedAgo || 'Recently',
      title: data.title || data.summary || 'Anomaly detected',
      evidence: data.evidence || data.explanation || data.details || '',
      severity: data.severity || 'HIGH'
    };
  }
  return FALLBACK_ANOMALY;
}

export const AnomalyInvestigatorView: React.FC = () => {
  const [anomaly, setAnomaly] = useState<AnomalyReport>(FALLBACK_ANOMALY);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      const token = getAuthToken();
      if (!token) {
        setAnomaly(FALLBACK_ANOMALY);
        setDataSource('fallback');
        return;
      }

      try {
        const data = await investigateAnomalies();
        const mapped = mapAnomaly(data);
        setAnomaly(mapped);
        setDataSource('api');
      } catch (err) {
        console.warn('Anomaly investigation API error, using fallback:', err);
        setAnomaly(FALLBACK_ANOMALY);
        setDataSource('fallback');
      }
    }

    load();
  }, []);

  if (dismissed) {
    return (
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        <CheckCircle2 color="var(--accent-emerald)" size={32} style={{ marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Anomaly dismissed. No active flags at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
          <AlertOctagon color="#ef4444" size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Anomaly Investigator Agent (Admin Overview)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Monitors metric standard deviations ({'>'}3x baseline) and compiles evidence graphs without automatic bans.
          </p>
        </div>
      </div>

      {/* Data Source */}
      <div style={{
        fontSize: '0.75rem',
        color: dataSource === 'api' ? 'var(--accent-emerald)' : '#f59e0b',
        marginBottom: '1rem',
        padding: '0.35rem 0.75rem',
        background: dataSource === 'api' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        borderRadius: '4px',
        display: 'inline-block'
      }}>
        {dataSource === 'api' ? '● Live — Data from /api/v1/ai/anomalies/investigate' : '● Demo — Using sample anomaly data'}
      </div>

      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={16} /> FLAG: {anomaly.flag}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected {anomaly.detectedAgo}</span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#f8fafc' }}>
          {anomaly.title}
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>
          {anomaly.evidence}
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}>
            Flag Batch for Courier Review
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-dark)',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Dismiss Anomaly
          </button>
        </div>
      </div>
    </div>
  );
};
