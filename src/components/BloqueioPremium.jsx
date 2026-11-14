/* eslint-disable react/prop-types */
import React from 'react';
import { Lock, Sparkles, Crown, ArrowRight, X, ShieldCheck } from 'lucide-react';

/**
 * Componente <BloqueioPremium>
 * Exibido quando um usuário não-PRO tenta selecionar recursos exclusivos de IA (como o Motor PRO Analítico e Avançado).
 * Segue o Design System do Express Imobi Tech (#020408 e #10b981).
 */
export default function BloqueioPremium({
  aberto = true,
  onFechar,
  onUpgrade,
  setAbaAtiva,
  titulo = 'Motor PRO Exclusivo para Assinantes',
  mensagem = 'O nível "Analítico e Avançado (Motor PRO)" utiliza modelos de raciocínio profundo para negociação imobiliária e contorno de objeções complexas. Faça upgrade para o Plano PRO para desbloquear esta capacidade.',
}) {
  if (!aberto) return null;

  const handleIrParaUpgrade = () => {
    if (typeof onUpgrade === 'function') {
      onUpgrade();
    } else if (typeof setAbaAtiva === 'function') {
      setAbaAtiva('meuplano');
    } else {
      window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'meuplano' }));
    }
    if (typeof onFechar === 'function') {
      onFechar();
    }
  };

  return (
    <div
      style={{ backgroundColor: '#020408' }}
      className="mt-4 border-2 border-[#10b981]/60 rounded-2xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.18)] relative overflow-hidden animate-in fade-in duration-300"
      role="alert"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
            className="w-11 h-11 rounded-xl border border-[#10b981]/40 flex items-center justify-center shrink-0 text-[#10b981]"
          >
            <Lock size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
                <Crown size={11} /> Recurso PRO Bloqueado
              </span>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">
                {titulo}
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
              {mensagem}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-[#10b981] font-bold">
                <ShieldCheck size={13} /> Raciocínio Complexo & Negociação VGV
              </span>
              <span className="inline-flex items-center gap-1 text-[#10b981] font-bold">
                <Sparkles size={13} /> Análise Profunda de Contexto no WhatsApp
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={handleIrParaUpgrade}
            style={{ backgroundColor: '#10b981' }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#020408] font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
          >
            Fazer Upgrade PRO <ArrowRight size={14} />
          </button>
          {typeof onFechar === 'function' && (
            <button
              type="button"
              onClick={onFechar}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Fechar aviso"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
