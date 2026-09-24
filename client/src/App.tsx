import React from 'react';
import { Bot, ShoppingBag, ShieldCheck, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

export default function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.25rem', fontWeight: 700 }}>
            MarketMind AI
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Enterprise AI-Powered Marketplace & Business Operations Platform
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span className="glass-card" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} /> Bedrock Guardrails Active
          </span>
          <span className="glass-card" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} /> SQS Async Outbox Active
          </span>
        </div>
      </header>

      {/* Grid Features Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Capability 1 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Bot color="var(--primary)" size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Seller Copilot</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Generates high-converting product listings with human-in-the-loop approval state.
          </p>
          <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            Claude 3.5 Sonnet
          </span>
        </div>

        {/* Capability 2 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <ShoppingBag color="var(--accent-cyan)" size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Customer Support RAG</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Vector search over policy Knowledge Bases + allowlisted tool execution (`getOrderStatus`).
          </p>
          <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            Bedrock KB Vector Search
          </span>
        </div>

        {/* Capability 3 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <TrendingUp color="var(--accent-emerald)" size={24} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Inventory Intelligence</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Holt-Winters statistical sales forecasting combined with LLM stockout explanations.
          </p>
          <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            Statistical + AI Advice
          </span>
        </div>

      </div>

      {/* Architecture & Payment Callout */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle color="#f59e0b" size={20} /> Production Payment & Outbox Guarantees
        </h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.25rem', fontSize: '0.95rem', lineHeight: '1.8' }}>
          <li><strong>Razorpay HMAC Verification:</strong> Server-side SHA256 timing-safe signature checking.</li>
          <li><strong>Asynchronous Webhooks:</strong> Eventual consistency with Redis/Postgres idempotency locks.</li>
          <li><strong>Transactional Outbox:</strong> Zero lost events between PostgreSQL state mutations and AWS SQS queues.</li>
          <li><strong>PostgreSQL 16:</strong> Strict ACID compliance, composite B-Tree indexes, decimal precision for currency.</li>
        </ul>
      </div>
    </div>
  );
}
