'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, X, Bot, User, CheckCircle2, CreditCard } from 'lucide-react';
import { Lead } from '@/types/agent';

interface Message {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  estimateCard?: any;
}

export function LiveChatWidget({ onOpenFullModal }: { onOpenFullModal: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'agent',
      text: 'Hello! I am AutonomOps AI, front-office assistant for BluePeak Plumbing. How can I help you today? Please tell me about your project, location ZIP code, and preferred timeline.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const userQuery = input;
    setInput('');
    setIsTyping(true);

    // Call intake agent API
    try {
      const response = await fetch('/api/agent/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Live Visitor',
          email: 'visitor@example.com',
          phone: '555-0188',
          zip_code: userQuery.match(/\b\d{5}\b/)?.[0] || '12202',
          project_type: 'General Service Inquiry',
          preferred_timeline: 'ASAP',
          scope: userQuery
        })
      });

      const data = await response.json();

      setIsTyping(false);

      if (!data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            sender: 'agent',
            text: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        const est = data.assessment.pricingBreakdown;
        let responseText = `Thank you! I have analyzed your project scope against our pricing matrix. Our estimated quote range is $${est.min_quote} to $${est.max_quote} (Base Fee: $${est.base_fee}, Complexity: ${est.complexity_factor}x).`;

        if (data.assessment.dispatchPath === 'AUTO') {
          responseText += ` Your job is pre-approved for automated scheduling! Required deposit: $${est.deposit_amount}.`;
        } else {
          responseText += ` Because this project contains high-complexity or structural parameters, I have flagged it for our master technician to review directly.`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            sender: 'agent',
            text: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            estimateCard: data
          }
        ]);
      }
    } catch (e) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'agent',
          text: 'I parsed your inquiry! You can also complete our structured intake form for instant Stripe invoice generation.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-blue-600/50 hover:bg-blue-500 transition-all active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          <span>Chat with AI Receptionist</span>
        </button>
      ) : (
        <div className="flex h-[520px] w-96 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0b101c] shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#060911] p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-mono text-xs font-bold">
                SP
              </div>
              <div>
                <p className="text-xs font-bold text-white">AutonomOps AI Receptionist</p>
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Discovery Agent Active</span>
                </div>
              </div>
            </div>

            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#060911] border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>

                  {/* Render Estimate Card if attached */}
                  {m.estimateCard && m.estimateCard.stripeInvoice && (
                    <div className="mt-3 rounded border border-blue-500/30 bg-blue-950/40 p-2 text-[11px] space-y-2">
                      <div className="flex justify-between font-mono font-bold text-blue-400">
                        <span>Estimate: ${m.estimateCard.assessment.pricingBreakdown.min_quote}-${m.estimateCard.assessment.pricingBreakdown.max_quote}</span>
                        <span className="text-emerald-400">${m.estimateCard.assessment.pricingBreakdown.deposit_amount} Deposit</span>
                      </div>
                      <a
                        href={m.estimateCard.stripeInvoice.checkout_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center rounded bg-blue-600 py-1.5 font-semibold text-white hover:bg-blue-500"
                      >
                        Pay Deposit via Stripe →
                      </a>
                    </div>
                  )}

                  <span className="mt-1 block text-[9px] text-slate-500 font-mono text-right">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
                <Bot className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                <span>Gemini Pro is evaluating pricing matrix...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Intake Trigger Banner */}
          <div className="border-t border-slate-800/60 bg-[#060911] px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Want a structured estimate form?</span>
            <button
              onClick={onOpenFullModal}
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Open Form
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-slate-800 bg-[#060911] p-3 flex space-x-2">
            <input
              type="text"
              placeholder="Describe your job & ZIP code..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded border border-slate-800 bg-[#0b101c] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
