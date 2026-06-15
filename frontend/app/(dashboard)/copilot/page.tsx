'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { safeInsights, safeProfitabilityReport, safeMRP, safeInventory, safeForecast } from '../../../lib/mock';
import { AIInsight } from '../../../lib/types';
import { Bot, Send, Sparkles, User, BarChart3, DollarSign, Truck } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PRESET_QUESTIONS: Record<string, { icon: React.ElementType; label: string; questions: string[] }> = {
  operations: {
    icon: BarChart3,
    label: 'Ask Operations',
    questions: [
      'Produk mana yang harus saya restock minggu ini?',
      'Berapa total target produksi bulan ini?',
      'Produk mana yang berisiko stockout?',
    ]
  },
  finance: {
    icon: DollarSign,
    label: 'Ask Finance',
    questions: [
      'Bagaimana dampak kenaikan bahan baku 10%?',
      'Produk mana yang memiliki margin tertinggi?',
      'Berapa estimasi total revenue minggu depan?',
    ]
  },
  supply_chain: {
    icon: Truck,
    label: 'Ask Supply Chain',
    questions: [
      'Apa yang terjadi jika supplier terlambat 7 hari?',
      'Material mana yang mengalami shortage?',
      'Berapa lead time rata-rata supplier?',
    ]
  }
};

function CopilotContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya adalah AI Copilot untuk Business Planning Automation System. Saya bisa menjawab pertanyaan tentang **Operations**, **Finance**, dan **Supply Chain**. Silakan tanya atau pilih salah satu pertanyaan di bawah.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('operations');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: insights } = useQuery({ queryKey: ['insights', 'Base'], queryFn: () => safeInsights('Base') });
  const { data: profReport } = useQuery({ queryKey: ['profitability-report', 'Base'], queryFn: () => safeProfitabilityReport('Base') });
  const { data: mrpData } = useQuery({ queryKey: ['mrp', 'Base'], queryFn: () => safeMRP('Base') });
  const { data: inventoryData } = useQuery({ queryKey: ['inventory', 'Base'], queryFn: () => safeInventory('Base') });
  const { data: forecastData } = useQuery({ queryKey: ['forecast', 'Base'], queryFn: () => safeForecast('Base') });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();

    // ── Operations answers ──
    if (q.includes('restock') || q.includes('stock') && q.includes('minggu')) {
      const critical = inventoryData?.filter(i => i.status.toLowerCase() !== 'healthy') || [];
      if (critical.length === 0) return 'Semua produk saat ini berada di level stok aman. Tidak ada restock mendesak yang diperlukan minggu ini.';
      const list = critical.map(i => `• **${i.product_name}**: stok ${i.current_stock.toLocaleString('id-ID')} unit (SS: ${i.safety_stock.toLocaleString('id-ID')}, ROP: ${i.reorder_point.toLocaleString('id-ID')}). Rekomendasi order: **${i.recommended_order.toLocaleString('id-ID')} unit**`).join('\n');
      return `🔴 **${critical.length} produk perlu restock minggu ini:**\n\n${list}\n\nDisarankan segera membuat Purchase Order untuk mengamankan jadwal produksi.`;
    }

    if (q.includes('target produksi') || q.includes('produksi')) {
      const total = forecastData?.reduce((s, f) => s + f.forecast_next_week, 0) || 0;
      return `📊 **Target produksi minggu depan:** ${total.toLocaleString('id-ID')} unit\n\nBreakdown:\n${forecastData?.map(f => `• ${f.product_name}: **${f.forecast_next_week.toLocaleString('id-ID')}** unit`).join('\n') || 'Data tidak tersedia'}`;
    }

    if (q.includes('stockout') || q.includes('risiko')) {
      const risks = insights?.filter(i => i.type === 'risk') || [];
      if (risks.length === 0) return '✅ Tidak ada produk yang terdeteksi berisiko stockout saat ini.';
      return `⚠️ **${risks.length} risiko stockout terdeteksi:**\n\n${risks.map(r => `• **${r.title}**\n  ${r.description}`).join('\n\n')}`;
    }

    // ── Finance answers ──
    if (q.includes('bahan baku') && (q.includes('10%') || q.includes('naik'))) {
      const base = profReport?.scenarios?.find(s => s.name === 'Base');
      const rawUp = profReport?.scenarios?.find(s => s.name === 'Raw Material +10%');
      if (base && rawUp) {
        const profitDrop = base.gross_profit - rawUp.gross_profit;
        const marginDrop = base.margin_pct - rawUp.margin_pct;
        return `💰 **Dampak kenaikan bahan baku +10%:**\n\n• Gross Profit turun: **Rp ${profitDrop.toLocaleString('id-ID')}** (dari Rp ${base.gross_profit.toLocaleString('id-ID')} → Rp ${rawUp.gross_profit.toLocaleString('id-ID')})\n• Margin turun: **${marginDrop.toFixed(1)}%** (dari ${base.margin_pct}% → ${rawUp.margin_pct}%)\n• Service Level tetap: **${rawUp.service_level}%**\n\n📋 Rekomendasi: negosiasi kontrak jangka panjang dengan supplier utama atau cari alternatif bahan baku.`;
      }
    }

    if (q.includes('margin') && q.includes('tinggi')) {
      const products = [...(profReport?.by_product || [])].sort((a, b) => b.margin_pct - a.margin_pct);
      if (products.length === 0) return 'Data profitabilitas belum tersedia.';
      const top = products[0];
      return `🏆 **Produk dengan margin tertinggi:** ${top.product_name}\n\n• Margin: **${top.margin_pct}%**\n• Revenue: Rp ${top.revenue.toLocaleString('id-ID')}\n• Gross Profit: **Rp ${top.gross_profit.toLocaleString('id-ID')}**\n\n📊 Ranking margin seluruh produk:\n${products.map((p, i) => `${i + 1}. ${p.product_name}: **${p.margin_pct}%**`).join('\n')}`;
    }

    if (q.includes('revenue') || q.includes('pendapatan')) {
      const base = profReport?.scenarios?.find(s => s.name === 'Base');
      return `💵 **Estimasi total revenue:** Rp ${(base?.total_revenue || 0).toLocaleString('id-ID')}\n\n• Total COGS: Rp ${(base?.total_cogs || 0).toLocaleString('id-ID')}\n• Gross Profit: **Rp ${(base?.gross_profit || 0).toLocaleString('id-ID')}**\n• Margin: **${base?.margin_pct || 0}%**`;
    }

    // ── Supply Chain answers ──
    if (q.includes('supplier') && (q.includes('terlambat') || q.includes('delay'))) {
      const base = profReport?.scenarios?.find(s => s.name === 'Base');
      const delay = profReport?.scenarios?.find(s => s.name === 'Supplier Delay +5 hari');
      if (base && delay) {
        const profitDrop = base.gross_profit - delay.gross_profit;
        return `🚚 **Dampak keterlambatan supplier +5 hari:**\n\n• Service Level: **${base.service_level}% → ${delay.service_level}%** (turun ${base.service_level - delay.service_level}%)\n• Gross Profit: turun **Rp ${profitDrop.toLocaleString('id-ID')}**\n• Holding Cost: naik **Rp ${(delay.holding_cost - base.holding_cost).toLocaleString('id-ID')}**\n\n📋 Rekomendasi:\n• Tingkatkan safety stock untuk produk dengan lead time > 4 hari\n• Negosiasi penalty clause dengan supplier\n• Pertimbangkan dual-sourcing untuk material kritis`;
      }
    }

    if (q.includes('shortage') || q.includes('material') && q.includes('kurang')) {
      const shortages: string[] = [];
      mrpData?.forEach(prod => {
        prod.materials.forEach(mat => {
          if (mat.shortage > 0) {
            shortages.push(`• **${mat.material_name}** (${mat.material_id}): shortage ${mat.shortage.toLocaleString('id-ID')} ${mat.unit} — Supplier: ${mat.supplier} (Lead Time: ${mat.lead_time} hari)`);
          }
        });
      });
      if (shortages.length === 0) return '✅ Tidak ada material yang mengalami shortage saat ini.';
      return `📦 **Material yang mengalami shortage:**\n\n${shortages.join('\n')}\n\nDisarankan segera mengirimkan Purchase Order ke supplier terkait.`;
    }

    if (q.includes('lead time') || q.includes('rata-rata')) {
      const leadTimes: number[] = [];
      mrpData?.forEach(prod => {
        prod.materials.forEach(mat => {
          leadTimes.push(mat.lead_time);
        });
      });
      if (leadTimes.length === 0) return 'Data lead time belum tersedia.';
      const avg = leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length;
      const max = Math.max(...leadTimes);
      const min = Math.min(...leadTimes);
      return `⏱️ **Statistik Lead Time Supplier:**\n\n• Rata-rata: **${avg.toFixed(1)} hari**\n• Minimum: **${min} hari**\n• Maximum: **${max} hari**\n\n⚠️ Material dengan lead time > 4 hari memerlukan safety stock lebih tinggi.`;
    }

    // ── Fallback ──
    const relevantInsights = insights?.slice(0, 3) || [];
    if (relevantInsights.length > 0) {
      return `🤖 Saya belum memiliki jawaban spesifik untuk pertanyaan tersebut, tetapi berikut insight terkini:\n\n${relevantInsights.map(i => `• **${i.title}**: ${i.description}`).join('\n\n')}\n\nCoba tanyakan tentang stok, revenue, margin, supplier, atau material shortage.`;
    }

    return '🤖 Maaf, saya belum dapat menjawab pertanyaan tersebut. Coba tanyakan tentang:\n• Produk yang perlu restock\n• Dampak kenaikan bahan baku\n• Risiko keterlambatan supplier\n• Material shortage';
  };

  const handleSend = (question?: string) => {
    const q = question || input.trim();
    if (!q) return;

    const userMsg: ChatMessage = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate 800ms thinking delay
    setTimeout(() => {
      const response = generateResponse(q);
      const assistantMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 800);
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
      <div className="flex flex-col mb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#185FA5]" />
          AI Copilot
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Tanya apapun tentang operasi, keuangan, dan rantai pasok bisnis Anda</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-4">
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
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tab.questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 px-3 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-[#185FA5]/5 hover:border-[#185FA5]/20 hover:text-[#185FA5] transition-all duration-150"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white border border-slate-100 rounded-[20px] shadow-sm overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant'
                  ? 'bg-[#185FA5]/10 text-[#185FA5]'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                msg.role === 'assistant'
                  ? 'bg-slate-50 text-slate-700 rounded-tl-md'
                  : 'bg-[#185FA5] text-white rounded-tr-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#185FA5]/10 text-[#185FA5]">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none focus:border-[#185FA5]/30 focus:ring-2 focus:ring-[#185FA5]/10 transition-all"
          />
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
