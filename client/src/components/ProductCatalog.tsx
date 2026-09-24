import React, { useState } from 'react';
import { Search, Sparkles, Tag, ShoppingCart, Check } from 'lucide-react';

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  aiExplanation?: string;
  stock: number;
}

const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: 'p-1',
    title: 'Smart AI Security Camera 4K',
    category: 'Electronics',
    price: 199.99,
    description: 'Ultra HD 4K night vision security camera with built-in Bedrock computer vision threat detection.',
    tags: ['ai', 'security', 'camera'],
    aiExplanation: 'Recommended based on top user ratings in Smart Home & Electronics.',
    stock: 24
  },
  {
    id: 'p-2',
    title: 'Noise Cancelling Wireless Earbuds',
    category: 'Electronics',
    price: 129.50,
    description: '40-hour battery life with active ANC acoustic cancellation and wireless charging case.',
    tags: ['audio', 'wireless', 'anc'],
    aiExplanation: 'Frequently co-purchased with Smart AI Security Camera.',
    stock: 45
  },
  {
    id: 'p-3',
    title: 'Ergonomic Mesh Executive Chair',
    category: 'Office',
    price: 349.00,
    description: '3D lumbar support, breathable mesh structure, and adjustable armrests for all-day comfort.',
    tags: ['office', 'furniture', 'ergonomic'],
    aiExplanation: 'Popular choice among verified work-from-home professionals.',
    stock: 12
  },
  {
    id: 'p-4',
    title: 'High Performance Thunderbolt Dock',
    category: 'Electronics',
    price: 249.99,
    description: '12-in-1 docking station with 100W Power Delivery and dual 4K 60Hz display outputs.',
    tags: ['dock', 'thunderbolt', 'macbook'],
    aiExplanation: 'Top rated in productivity peripherals.',
    stock: 8
  }
];

interface CatalogProps {
  onAddToCart: (product: ProductItem) => void;
}

export const ProductCatalog: React.FC<CatalogProps> = ({ onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const categories = ['All', 'Electronics', 'Office'];

  const filteredProducts = SAMPLE_PRODUCTS.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = (product: ProductItem) => {
    onAddToCart(product);
    setAddedIds(prev => [...prev, product.id]);
    setTimeout(() => {
      setAddedIds(prev => prev.filter(id => id !== product.id));
    }, 1500);
  };

  return (
    <div>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search products by title, feature, or AI tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '12px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="glass-card"
              style={{
                padding: '0.5rem 1rem',
                border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.85rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {filteredProducts.map(product => {
          const isAdded = addedIds.includes(product.id);
          return (
            <div key={product.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', color: 'var(--accent-cyan)' }}>
                    {product.category}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: product.stock > 10 ? 'var(--accent-emerald)' : '#f59e0b', fontWeight: 600 }}>
                    {product.stock} in stock
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {product.title}
                </h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {product.description}
                </p>

                {/* AI Rationale Badge */}
                {product.aiExplanation && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#c084fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <Sparkles size={14} color="#c084fc" />
                    <span>{product.aiExplanation}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${product.price.toFixed(2)}
                </span>

                <button
                  onClick={() => handleAdd(product)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isAdded ? 'var(--accent-emerald)' : 'var(--primary)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isAdded ? <Check size={16} /> : <ShoppingCart size={16} />}
                  {isAdded ? 'Added' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
