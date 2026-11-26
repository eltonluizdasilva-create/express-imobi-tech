import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  MessageCircle,
  Bot,
  Radar,
  Brain,
  Zap,
} from 'lucide-react';
import { linkWhatsApp } from '../../lib/contato';

/**
 * ModalPacoteCompleto — Apresentação do Ecossistema Integrado Express Imobi Tech:
 * PLUS + Tom + Zara + Pólen.
 */
export default function ModalPacoteCompleto({ aberto, onFechar }) {
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const aoTeclar = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const handleConversarWhatsApp = () => {
    const msg =
      'Olá! Gostaria de uma proposta personalizada para ativar o Pacote Completo Imobiliária (PLUS + Tom + Zara + Pólen) na minha operação.';
    window.open(linkWhatsApp(msg), '_blank');
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-500/40 p-6 md:p-8 shadow-2xl space-y-6"
        style={{
          backgroundColor: '#080C10',
          backgroundImage:
            'radial-gradient(900px 320px at 10% -20%, rgba(16, 185, 129, 0.15), transparent 70%), radial-gradient(700px 280px at 90% -10%, rgba(14, 165, 233, 0.12), transparent 60%), linear-gradient(180deg, #080C10 0%, #04070B 100%)',
          color: '#ffffff',
        }}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onFechar}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          aria-label="Fechar modal"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-2 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider text-[#10b981]">
              <Sparkles size={12} /> Ecossistema Integrado de Vendas
            </span>
            <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-black uppercase tracking-wider text-sky-300">
              Operação Comercial Completa
            </span>
          </div>

          <h2
            className="text-xl md:text-3xl font-black uppercase tracking-tight text-white"
            style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            Pacote Completo Imobiliária
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl" style={{ color: '#cbd5e1' }}>
            A máquina comercial definitiva que conecta prospecção no Google Maps, inteligência de abordagem, atendimento 24h no WhatsApp e auditoria de equipe em um único fluxo contínuo.
          </p>
        </div>

        {/* Fluxo Conectado dos 4 Módulos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block" style={{ color: '#94a3b8' }}>
            Como os 4 módulos operam integrados:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* 1. Radar PLUS */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xs">
                  1
                </span>
                <span className="text-xs font-black text-teal-300 flex items-center gap-1">
                  <Radar size={13} /> Radar (PLUS)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Varre proprietários particulares no OLX/Face e empresas por ramo no Google Maps.
              </p>
            </div>

            {/* 2. Tom */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs">
                  2
                </span>
                <span className="text-xs font-black text-sky-300 flex items-center gap-1">
                  <Brain size={13} /> Tom (Cérebro)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cruza o imóvel da campanha com o perfil do lead e define o gancho e resposta a objeções.
              </p>
            </div>

            {/* 3. Pólen */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                  3
                </span>
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                  <Zap size={13} /> Pólen (24h)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Dispara abordagens em cadência segura, responde clientes 24h e agenda visitas.
              </p>
            </div>

            {/* 4. Zara */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                  4
                </span>
                <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <Bot size={13} /> Zara (Rotina)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Distribui na Roleta de Leads, audita às 08:00 e cobra o corretor responsável.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo de Preços "A partir de" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-400 block">IA Pólen · 24H</span>
            <span className="text-base font-black text-emerald-400 mt-1 block">A partir de R$ 450,00</span>
            <span className="text-[10px] text-slate-500">Secretária comercial 24h</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-400 block">IA Tom · Jarvis</span>
            <span className="text-base font-black text-sky-400 mt-1 block">A partir de R$ 197,00</span>
            <span className="text-[10px] text-slate-500">Segundo cérebro e regras</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-400 block">IA Zara · Direção</span>
            <span className="text-base font-black text-amber-400 mt-1 block">A partir de R$ 349,00</span>
            <span className="text-[10px] text-slate-500">Auditoria diária e equipe</span>
          </div>
        </div>

        {/* Aviso Explicativo Obrigatório */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <p>
            <strong>Nota comercial de contratação:</strong> Os valores dos planos de IA são <em>a partir do valor base</em> porque variam conforme a quantidade de disparos/frequência de abordagens, a forma de abordagem, o número de chips/usuários e o nível de automação contratados pela operação da sua imobiliária.
          </p>
        </div>

        {/* Ações */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleConversarWhatsApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-6 py-3.5 text-xs uppercase tracking-wider transition shadow-xl shadow-emerald-500/25 cursor-pointer font-sans"
          >
            <MessageCircle size={15} />
            Montar Proposta no WhatsApp Oficial →
          </button>
        </div>
      </div>
    </div>
  );
}
