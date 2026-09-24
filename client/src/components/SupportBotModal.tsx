import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, X } from 'lucide-react';

interface SupportBotProps {
  onClose: () => void;
}

export const SupportBotModal: React.FC<SupportBotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; toolData?: any }>>([
    {
      sender: 'bot',
      text: 'Hello! I am MarketMind AI Support. I can help you check order status, answer return policy questions, or create support tickets.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputQuery('');
    setIsTyping(true);

    // Simulate RAG + Allowlisted Tool Calling (`getOrderStatus` / `getStorePolicy`)
    setTimeout(() => {
      let botResponse = '';
      let toolData = null;

      if (userText.toLowerCase().includes('order') || userText.toLowerCase().includes('track')) {
        toolData = { orderNumber: 'ORD-982F-4812', status: 'CONFIRMED', total: '$199.99' };
        botResponse = `Verified Order #${toolData.orderNumber}: Current Status is '${toolData.status}'. Payment verified via Razorpay HMAC SHA256.`;
      } else if (userText.toLowerCase().includes('return') || userText.toLowerCase().includes('refund')) {
        botResponse = 'MarketMind Policy: Items can be returned within 30 days of delivery. Refunds are processed to the original payment method within 5-7 business days.';
      } else {
        botResponse = 'Thank you for your question. I have searched our Bedrock Knowledge Base vector policy store. You can track orders or initiate returns anytime from your account.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponse, toolData }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      width: '380px',
      height: '520px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }} className="glass-card">
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(99, 102, 241, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bot color="var(--accent-cyan)" size={20} />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Support RAG Bot</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} /> Guardrails Active
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            background: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Bedrock Agent querying tools...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Ask order status or policies..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            background: 'var(--bg-dark)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-cyan)',
            color: '#000',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
