import { AlertOctagon, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AnomalyInvestigatorView: React.FC = () => {
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

      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldAlert size={16} /> FLAG: REFUND_RATE_SPIKE_DETECTED
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected 14 mins ago</span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#f8fafc' }}>
          Seller Store #SLR-9812: Refund rate increased from 3.2% to 16.8%
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>
          AI Evidence Synthesis: 14 out of 18 recent returns cite "damaged package upon delivery" for Product SKU <code>CAM-AI-4K-BLK</code>. The underlying order IDs are linked to Courier Batch #IN-889.
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
          <button style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-dark)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}>
            Dismiss Anomaly
          </button>
        </div>
      </div>
    </div>
  );
};
