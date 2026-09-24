import React from 'react';
import { ShoppingBag, Bot, ShieldCheck, Zap, UserCheck, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalog' | 'seller' | 'admin' | 'orders';
  setActiveTab: (tab: 'catalog' | 'seller' | 'admin' | 'orders') => void;
  cartCount: number;
  openCart: () => void;
  openSupportBot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  openSupportBot
}) => {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(10, 13, 20, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('catalog')}>
          <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            MarketMind AI
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
            ENTERPRISE COMMERCE & AI PLATFORM
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'catalog' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'catalog' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            Catalog & Shop
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'seller' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'seller' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            Seller Copilot & Forecast
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'admin' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'admin' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            Admin Anomaly Investigator
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={openSupportBot}
          className="glass-card"
          style={{
            padding: '0.5rem 1rem',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            fontSize: '0.85rem'
          }}
        >
          <Bot size={18} /> Support AI Bot
        </button>

        <button
          onClick={openCart}
          className="glass-card"
          style={{
            padding: '0.5rem 1rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            position: 'relative'
          }}
        >
          <ShoppingBag size={18} /> Cart
          {cartCount > 0 && (
            <span style={{
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '0.75rem',
              borderRadius: '50%',
              padding: '0.1rem 0.4rem',
              fontWeight: 700
            }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
