import React, { useEffect } from 'react';
import { HelpCircle, X, Compass, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';
import { manualDaAba } from '../../lib/manualAbas';

export default function ModalAjudaAba({
  abaAtiva,
  nomeAba,
  onFechar,
  onRefazerTour,
  children,
}) {
  const manual = manualDaAba(abaAtiva);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-ajuda"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onFechar}
    >
      <div
        style={{ backgroundColor: '#020408' }}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700/80 shadow-2xl p-5 sm:p-6 space-y-5 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 id="titulo-modal-ajuda" className="text-sm sm:text-base font-black text-white">
                Ajuda & Manual Prático
              </h2>
              <p className="text-[11px] text-slate-400">
                Instruções operacionais da aba <strong className="text-emerald-400">{nomeAba || manual.titulo}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="h-8 w-8 rounded-full border border-slate-800 bg-[#05080c] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar ajuda"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Card de DOR & GANHO (DorESolucao) */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <BookOpen size={12} className="text-emerald-400" />
            Objetivo Comercial da Aba
          </span>
          <div className="rounded-2xl border border-slate-800 bg-[#04070d] p-3.5">
            {children}
          </div>
        </div>

        {/* 2. Manual Prático da Aba */}
        {manual && (
          <div className="space-y-3">
            {manual.resumo && (
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {manual.resumo}
              </p>
            )}

            {Array.isArray(manual.passos) && manual.passos.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Passo a Passo Rápido:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {manual.passos.map((passo, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#05080f] border border-slate-800/80 rounded-xl p-2.5">
                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] leading-relaxed">{passo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {manual.dica && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-amber-300 block">
                    Dica de Campo:
                  </span>
                  <p className="text-[11px] text-amber-100/90 leading-relaxed">{manual.dica}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rodapé com Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
          {onRefazerTour && (
            <button
              type="button"
              onClick={onRefazerTour}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#05080c] cursor-pointer"
            >
              <Compass size={13} className="text-emerald-400" />
              Refazer Tour Interativo
            </button>
          )}
          <button
            type="button"
            onClick={onFechar}
            style={{ backgroundColor: '#10b981' }}
            className="ml-auto px-4 py-2 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 transition cursor-pointer"
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
}
