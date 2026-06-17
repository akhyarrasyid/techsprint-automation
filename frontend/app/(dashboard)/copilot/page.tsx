'use client';

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { askCopilot, CopilotResponse } from '../../../lib/api';
import { Bot, Send, Sparkles, User, BarChart3, DollarSign, Truck, Copy, Check, RotateCcw, ChevronDown, Zap, Trash2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  model?: string;
  latency_ms?: number;
  cached?: boolean;
}

const PRESET_QUESTIONS: Record<string, { icon: React.ElementType; label: string; questions: string[] }> = {
  operations: {
    icon: BarChart3,
    label: 'Operations',
    questions: [
      'Produk mana yang harus saya restock minggu ini?',
      'Berapa total target produksi bulan ini?',
      'Produk mana yang berisiko stockout?',
    ]
  },
  finance: {
    icon: DollarSign,
    label: 'Finance',
    questions: [
      'Bagaimana dampak kenaikan bahan baku 10%?',
      'Produk mana yang memiliki margin tertinggi?',
      'Berapa estimasi total revenue minggu depan?',
    ]
  },
  supply_chain: {
    icon: Truck,
    label: 'Supply Chain',
    questions: [
      'Apa yang terjadi jika supplier terlambat 7 hari?',
      'Material mana yang mengalami shortage?',
      'Berapa lead time rata-rata supplier?',
    ]
  }
};

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) {
      return <h5 key={i} className="text-xs font-bold text-slate-800 mt-2 mb-1">{line.replace('### ', '')}</h5>;
    }
    if (line.startsWith('## ')) {
      return <h4 key={i} className="text-xs font-bold text-[#185FA5] mt-3 mb-1.5 border-b border-slate-100 pb-1">{line.replace('## ', '')}</h4>;
    }
    if (line.startsWith('# ')) {
      return <h3 key={i} className="text-sm font-black text-slate-800 mt-4 mb-2">{line.replace('# ', '')}</h3>;
    }
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const cleanLine = line.replace(/^[-*•]\s+/, '');
      return (
        <div key={i} className="flex items-start gap-1.5 ml-2 my-1">
          <span className="text-[#185FA5] mt-1 shrink-0">•</span>
          <span className="text-slate-600 text-xs">{parseBold(cleanLine)}</span>
        </div>
      );
    }
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return <p key={i} className="text-slate-600 text-xs mb-1 leading-relaxed">{parseBold(line)}</p>;
  });
}

function CopilotContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya adalah **AI Supply Chain Copilot** yang didukung oleh **Llama 4 Scout + RAG**. Saya menggunakan knowledge base supply chain dan data bisnis real-time untuk menjawab pertanyaan Anda.\n\nSilakan tanya tentang **Operations**, **Finance**, atau **Supply Chain**.',
      timestamp: new Date(),
      model: 'llama-4-scout-17b',
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('operations');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [displayedText, setDisplayedText] = useState<Record<number, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedText]);

  // Typing effect for last assistant message
  const animateTyping = useCallback((idx: number, fullText: string) => {
    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 4; // Fast rendering speed
      if (charIndex >= fullText.length) {
        setDisplayedText(prev => ({ ...prev, [idx]: fullText }));
        clearInterval(interval);
      } else {
        setDisplayedText(prev => ({ ...prev, [idx]: fullText.slice(0, charIndex) }));
      }
    }, 8);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || isThinking) return;

    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const response: CopilotResponse = await askCopilot(q);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
        model: response.model,
        latency_ms: response.latency_ms,
        cached: response.cached,
      };
      setMessages(prev => {
        const newMessages = [...prev, assistantMsg];
        const newIdx = newMessages.length - 1;
        animateTyping(newIdx, response.answer);
        return newMessages;
      });
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: '⚠️ Gagal terhubung ke server. Pastikan backend berjalan dan GROQ_API_KEY dikonfigurasi.',
        timestamp: new Date(),
        model: 'error',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'assistant') {
          newMsgs.pop();
        }
        return newMsgs;
      });
      handleSend(lastUserMsg.content);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Halo! Saya adalah **AI Supply Chain Copilot** yang didukung oleh **Llama 4 Scout + RAG**. Saya menggunakan knowledge base supply chain dan data bisnis real-time untuk menjawab pertanyaan Anda.\n\nSilakan tanya tentang **Operations**, **Finance**, atau **Supply Chain**.',
        timestamp: new Date(),
        model: 'llama-4-scout-17b',
      }
    ]);
    setDisplayedText({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tab = PRESET_QUESTIONS[activeTab];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#185FA5]" />
            AI Copilot
            <span className="ml-2 px-2 py-0.5 bg-[#185FA5]/10 text-[#185FA5] text-[9px] font-black rounded-full uppercase tracking-wider">
              RAG + Llama 4 Scout
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Retrieval-Augmented Generation dengan FAISS knowledge base dan data pipeline real-time
          </p>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-slate-500 text-xs font-bold transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Chat
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-3">
        {Object.entries(PRESET_QUESTIONS).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                activeTab === key
                  ? 'bg-[#185FA5] text-white shadow-md'
                  : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {val.label}
            </button>
          );
        })}
      </div>

      {/* Preset Questions */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {tab.questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isThinking}
            className="shrink-0 px-3 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-[#185FA5]/5 hover:border-[#185FA5]/20 hover:text-[#185FA5] transition-all duration-150 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => {
            const isAssistant = msg.role === 'assistant';
            const showText = isAssistant && displayedText[idx] !== undefined
              ? displayedText[idx]
              : msg.content;

            return (
              <div key={idx} className={`flex gap-3 ${!isAssistant ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isAssistant
                    ? 'bg-[#185FA5]/10 text-[#185FA5]'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="max-w-[78%] flex flex-col gap-1.5">
                  <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium ${
                    isAssistant
                      ? 'bg-slate-50 text-slate-700 rounded-tl-md'
                      : 'bg-[#185FA5] text-white rounded-tr-md'
                  }`}>
                    {isAssistant ? renderMarkdown(showText) : showText}
                  </div>

                  {/* Assistant message metadata */}
                  {isAssistant && msg.model && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Model badge */}
                      <span className="px-1.5 py-0.5 bg-[#185FA5]/8 text-[#185FA5] text-[8px] font-black rounded uppercase tracking-wider flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        {msg.model}
                      </span>
                      {msg.latency_ms && (
                        <span className="text-[8px] text-slate-400 font-bold">{msg.latency_ms}ms</span>
                      )}
                      {msg.cached && (
                        <span className="text-[8px] text-[#1D9E75] font-bold">CACHED</span>
                      )}
                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="p-0.5 hover:bg-slate-100 rounded transition-colors"
                        title="Copy"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-[#1D9E75]" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  )}

                  {/* Sources */}
                  {isAssistant && msg.sources && msg.sources.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-[9px] text-slate-400 font-bold cursor-pointer flex items-center gap-1 hover:text-[#185FA5]">
                        <ChevronDown className="w-3 h-3" />
                        {msg.sources.length} sources used
                      </summary>
                      <div className="mt-1 space-y-1">
                        {msg.sources.map((src, si) => (
                          <div key={si} className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] text-slate-500 font-medium leading-relaxed">
                            {src.slice(0, 200)}{src.length > 200 ? '…' : ''}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#185FA5]/10 text-[#185FA5]">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#185FA5]/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#185FA5]/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[#185FA5]/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold">RAG retrieving + LLM generating...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-100 p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya tentang operasi, keuangan, atau supply chain..."
            disabled={isThinking}
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-[#185FA5]/30 focus:ring-2 focus:ring-[#185FA5]/10 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleRegenerate}
            disabled={isThinking || messages.length < 2}
            className="px-3 py-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-all duration-150"
            title="Regenerate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="px-4 py-3 bg-[#185FA5] text-white rounded-xl hover:bg-[#185FA5]/90 disabled:opacity-40 transition-all duration-150 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Kirim</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs font-semibold">Memuat AI Copilot...</div>}>
      <CopilotContent />
    </Suspense>
  );
}
