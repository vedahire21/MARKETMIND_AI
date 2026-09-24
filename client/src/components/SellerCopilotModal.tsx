import React, { useState } from 'react';
import { Bot, Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { generateSellerListing, approveSellerListing, getAuthToken } from '../services/api';

export const SellerCopilotModal: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [roughNotes, setRoughNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !roughNotes) return;

    setIsGenerating(true);
    setIsPublished(false);
    setError(null);

    // Check if user is authenticated (seller copilot requires SELLER/ADMIN JWT)
    const token = getAuthToken();

    if (!token) {
      // Graceful fallback: simulate Bedrock Claude 3.5 Sonnet response for demo
      setTimeout(() => {
        setGeneratedDraft({
          id: `prod-draft-${Date.now()}`,
          title: `${productName} - Professional Edition`,
          description: `Introducing the next-generation ${productName}. ${roughNotes} Precision-engineered to deliver seamless performance, ultra-fast charging, and long-term durability.`,
          tags: [category.toLowerCase(), 'ai-enhanced', 'pro-series', 'top-rated'],
          seoTitle: `${productName} | Official MarketMind Store`,
          seoDesc: `Shop the official ${productName}. High quality ${category} backed by 1-year warranty and fast shipping.`,
          status: 'DRAFT',
          _simulated: true
        });
        setIsGenerating(false);
      }, 1200);
      return;
    }

    try {
      const result = await generateSellerListing({
        productName,
        category,
        roughNotes
      });

      setGeneratedDraft({
        id: result.product?.id || result.id || `prod-${Date.now()}`,
        title: result.product?.title || result.title || `${productName} - Professional Edition`,
        description: result.product?.description || result.description || '',
        tags: result.product?.tags || result.tags || [category.toLowerCase()],
        seoTitle: result.product?.seoTitle || result.seoTitle || '',
        seoDesc: result.product?.seoDesc || result.seoDesc || '',
        status: result.product?.status || 'DRAFT',
        _simulated: false
      });
    } catch (err: any) {
      console.error('Seller Copilot generation error:', err);
      setError(err.message || 'Generation failed. Using simulated response.');
      // Fallback to simulated response
      setGeneratedDraft({
        id: `prod-draft-${Date.now()}`,
        title: `${productName} - Professional Edition`,
        description: `Introducing the next-generation ${productName}. ${roughNotes} Precision-engineered to deliver seamless performance, ultra-fast charging, and long-term durability.`,
        tags: [category.toLowerCase(), 'ai-enhanced', 'pro-series', 'top-rated'],
        seoTitle: `${productName} | Official MarketMind Store`,
        seoDesc: `Shop the official ${productName}. High quality ${category} backed by 1-year warranty and fast shipping.`,
        status: 'DRAFT',
        _simulated: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedDraft) return;

    const token = getAuthToken();

    if (!token || generatedDraft._simulated) {
      // Simulated approval for demo
      setIsPublished(true);
      setGeneratedDraft((prev: any) => ({ ...prev, status: 'ACTIVE' }));
      return;
    }

    try {
      await approveSellerListing(generatedDraft.id);
      setIsPublished(true);
      setGeneratedDraft((prev: any) => ({ ...prev, status: 'ACTIVE' }));
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Approval failed');
      // Still update UI for demo
      setIsPublished(true);
      setGeneratedDraft((prev: any) => ({ ...prev, status: 'ACTIVE' }));
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
          <Bot color="var(--primary)" size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Seller Copilot (Bedrock Agent)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Enter minimal rough notes. Claude 3.5 Sonnet generates enriched titles, descriptions, and SEO metadata.
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#f59e0b'
        }}>
          <AlertCircle size={16} />
          {error} — Using simulated Bedrock response for demo.
        </div>
      )}

      <form onSubmit={handleGenerate} style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Product Name
            </label>
            <input
              type="text"
              placeholder="e.g. UltraFit Wireless Earbuds"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-dark)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-dark)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            >
              <option value="Electronics">Electronics</option>
              <option value="Office">Office</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            Rough Notes / Feature Bullet Points
          </label>
          <textarea
            placeholder="e.g. Active noise cancellation, 40 hour battery, waterproof IPX7, bluetooth 5.3..."
            value={roughNotes}
            onChange={(e) => setRoughNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-dark)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'inherit'
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: 'fit-content'
          }}
        >
          <Sparkles size={18} />
          {isGenerating ? 'Generating Listing with Claude 3.5 Sonnet...' : 'Generate AI Listing Draft'}
        </button>
      </form>

      {/* Generated Draft Output with Human-in-the-loop Approval */}
      {generatedDraft && (
        <div style={{
          background: 'rgba(18, 24, 38, 0.9)',
          border: '1px dashed var(--primary)',
          padding: '1.5rem',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                background: isPublished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isPublished ? 'var(--accent-emerald)' : '#f59e0b',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                STATUS: {generatedDraft.status} (Human-in-the-Loop)
              </span>
              {generatedDraft._simulated && (
                <span style={{
                  fontSize: '0.65rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '3px'
                }}>
                  SIMULATED
                </span>
              )}
            </div>

            {!isPublished ? (
              <button
                onClick={handleApprove}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent-emerald)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={16} /> Approve & Publish Listing
              </button>
            ) : (
              <span style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={16} /> Published to Active Catalog
              </span>
            )}
          </div>

          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {generatedDraft.title}
          </h4>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.6' }}>
            {generatedDraft.description}
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {generatedDraft.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#c084fc', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                #{tag}
              </span>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div><strong>SEO Meta Title:</strong> {generatedDraft.seoTitle}</div>
            <div><strong>SEO Meta Description:</strong> {generatedDraft.seoDesc}</div>
          </div>
        </div>
      )}
    </div>
  );
};
