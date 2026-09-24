import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Tag, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { fetchProducts } from '../services/api';

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  aiExplanation?: string;
  stock: number;
  variantId?: string;
}

// Fallback products shown when the database is unreachable
const FALLBACK_PRODUCTS: ProductItem[] = [
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
    title: 'Titanium Mechanical Keyboard (Tactile)',
    category: 'Electronics',
    price: 179.00,
    description: 'Gasket-mounted hot-swappable tactile switches with CNC aluminum chassis and programmable RGB.',
    tags: ['keyboard', 'mechanical', 'custom'],
    aiExplanation: 'Top rated in productivity peripherals.',
    stock: 30
  }
];

/**
 * Maps a backend product (with variants/category relations) to our flat ProductItem interface.
 * The backend returns: { items: Product[], pagination: {...} }
 * Each Product has: category: { name }, variants: [{ id, price, inventory: { quantity } }]
 */
function mapBackendProduct(p: any): ProductItem {
  const firstVariant = p.variants?.[0];
  const totalStock = p.variants?.reduce((sum: number, v: any) => {
    const qty = v.inventory?.quantity ?? 0;
    const reserved = v.inventory?.reservedQuantity ?? 0;
    return sum + (qty - reserved);
  }, 0) ?? 0;

  return {
    id: p.id,
    title: p.title,
    category: p.category?.name ?? 'Uncategorized',
    price: firstVariant ? Number(firstVariant.price) : 0,
    description: p.description,
    tags: p.tags ?? [],
    aiExplanation: p.seoDesc ?? undefined,
    stock: totalStock,
    variantId: firstVariant?.id
  };
}

interface CatalogProps {
  onAddToCart: (product: ProductItem) => void;
}

export const ProductCatalog: React.FC<CatalogProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'database' | 'fallback'>('fallback');

  // Fetch products from the backend API on mount
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setIsLoading(true);
      try {
        const data = await fetchProducts({ page: 1, limit: 50 });
        if (!cancelled && data.items && data.items.length > 0) {
          setProducts(data.items.map(mapBackendProduct));
          setDataSource('database');
        } else if (!cancelled) {
          // Database returned empty — use fallback for demo
          setProducts(FALLBACK_PRODUCTS);
          setDataSource('fallback');
        }
      } catch (err) {
        console.warn('ProductCatalog: Backend unreachable, using fallback products.', err);
        if (!cancelled) {
          setProducts(FALLBACK_PRODUCTS);
          setDataSource('fallback');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProducts();
    return () => { cancelled = true; };
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
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
      {/* Data Source Indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        background: dataSource === 'database' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        border: `1px solid ${dataSource === 'database' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
        fontSize: '0.8rem'
      }}>
        <span style={{ color: dataSource === 'database' ? 'var(--accent-emerald)' : '#f59e0b' }}>
          {dataSource === 'database'
            ? '● Live Data — Products loaded from PostgreSQL via Prisma ORM'
            : '● Demo Mode — Using fallback data (PostgreSQL not connected)'}
        </span>
        {dataSource === 'fallback' && (
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Retry Connection
          </button>
        )}
      </div>

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

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading products from PostgreSQL...</p>
        </div>
      )}

      {/* Product Grid */}
      {!isLoading && (
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
      )}
    </div>
  );
};
