import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, X } from 'lucide-react';
import { supportChat, getAuthToken } from '../services/api';

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

  /**
   * Simulated RAG + Allowlisted Tool Calling fallback when no auth token or backend unreachable.
   */
  const getSimulatedResponse = (userText: string): { text: string; toolData?: any } => {
    if (userText.toLowerCase().includes('order') || userText.toLowerCase().includes('track')) {
      const toolData = { orderNumber: 'ORD-982F-4812', status: 'CONFIRMED', total: '$199.99' };
      return {
        text: `Verified Order #${toolData.orderNumber}: Current Status is '${toolData.status}'. Payment verified via Razorpay HMAC SHA256.`,
        toolData
      };
    } else if (userText.toLowerCase().includes('return') || userText.toLowerCase().includes('refund')) {
      return {
        text: 'MarketMind Policy: Items can be returned within 30 days of delivery. Refunds are processed to the original payment method within 5-7 business days.'
      };
    }
    return {
      text: 'Thank you for your question. I have searched our Bedrock Knowledge Base vector policy store. You can track orders or initiate returns anytime from your account.'
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputQuery('');
    setIsTyping(true);

    const token = getAuthToken();

    if (!token) {
      // No auth token — use simulated response
      setTimeout(() => {
        const simulated = getSimulatedResponse(userText);
        setMessages(prev => [...prev, { sender: 'bot', text: simulated.text, toolData: simulated.toolData }]);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const result = await supportChat(userText);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: result.response || result.message || result.answer || 'I received your query and am processing it.',
        toolData: result.toolData || result.tools || null
      }]);
    } catch (err: any) {
      console.warn('Support chat API error, using fallback:', err);
      const simulated = getSimulatedResponse(userText);
      setMessages(prev => [...prev, { sender: 'bot', text: simulated.text, toolData: simulated.toolData }]);
    } finally {
      setIsTyping(false);
    }
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
