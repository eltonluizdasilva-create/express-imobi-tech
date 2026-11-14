import React, { useEffect, useState } from 'react';
import { HelpCircle, X, Lightbulb, ChevronRight } from 'lucide-react';
import { manualDaAba } from '../../lib/manualAbas';

const E = '#10b981';

/**
 * AjudaFlutuante — botão discreto + modal com o mini-manual da aba atual.
 * O botão é renderizado dentro da pilha de botões flutuantes (FloatingButtons),
 * como primeiro item, para ficar sempre ACIMA deles e nunca sobreposto.
 */
export default function AjudaFlutuante({ abaAtiva, infoAba }) {
  const [aberto, setAberto] = useState(false);
  const manual = manualDaAba(abaAtiva, infoAba);

  useEffect(() => {
    if (!aberto) return undefined;
    const onKey = (ev) => { if (ev.key === 'Escape') setAberto(false); };
    window.addEventListener('keydown', onKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Ajuda / Manual da aba atual"
        title="Ajuda / Manual"
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
          border: '2px solid #fde68a',
          boxShadow: '0 0 20px rgba(251,191,36,0.55)',
        }}
      >
        <HelpCircle size={18} color="#451a03" />
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Manual: ${manual.titulo}`}
        >
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl border p-5 shadow-[0_0_50px_rgba(16,185,129,0.25)]"
            style={{ background: '#020408', borderColor: 'rgba(16,185,129,0.35)' }}
          >
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)' }}
                >
                  <HelpCircle size={18} color={E} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-500">
                    Como funciona
                  </p>
                  <h2 className="text-base font-black text-white leading-tight">{manual.titulo}</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar manual"
                className="text-neutral-500 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumo */}
            {manual.resumo && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-300">{manual.resumo}</p>
            )}

            {/* Passos */}
            {manual.passos?.length > 0 && (
              <ol className="mt-4 space-y-2.5">
                {manual.passos.map((passo, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
                      style={{ background: 'rgba(16,185,129,0.15)', color: E, border: '1px solid rgba(16,185,129,0.35)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-neutral-300">{passo}</p>
                  </li>
                ))}
              </ol>
            )}

            {/* Dica */}
            {manual.dica && (
              <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-3 flex items-start gap-2">
                <Lightbulb size={14} className="mt-0.5 shrink-0" color={E} />
                <p className="text-xs leading-relaxed text-emerald-100/80">{manual.dica}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAberto(false)}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-black uppercase tracking-widest text-slate-950 hover:brightness-110 transition-all"
              style={{ backgroundColor: E }}
            >
              Entendi <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
