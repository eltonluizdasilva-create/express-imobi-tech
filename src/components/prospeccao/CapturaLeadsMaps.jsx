import React, { Suspense, lazy, memo, useCallback, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * CapturaLeadsMaps — botao discreto que abre a varredura por regiao.
 *
 * PERFORMANCE
 *   • O modal entra por `React.lazy`: o chunk so e baixado no primeiro clique.
 *   • O componente e `memo` e guarda apenas um booleano de estado, entao
 *     digitar/clicar no modal nao re-renderiza a aba de prospeccao.
 */

const ModalCapturaLeads = lazy(() => import('./ModalCapturaLeads'));

function CapturaLeadsMaps({ oficinaId, cor = '#10b981' }) {
  const [aberto, setAberto] = useState(false);
  const abrir = useCallback(() => setAberto(true), []);
  const fechar = useCallback(() => setAberto(false), []);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="group inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#020408] px-3 py-2 text-[11px] font-bold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
        title="Varredura de estabelecimentos por endereço e raio"
      >
        <span
          className="grid h-6 w-6 place-items-center rounded-lg border transition-colors"
          style={{ borderColor: `${cor}44`, backgroundColor: `${cor}14`, color: cor }}
        >
          <MapPin size={12} />
        </span>
        Capturar leads
        <span className="rounded-md border border-slate-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500 group-hover:text-slate-300">
          Maps
        </span>
      </button>

      {aberto && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 text-[12px] text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Abrindo varredura…
              </span>
            </div>
          }
        >
          <ModalCapturaLeads oficinaId={oficinaId} cor={cor} onFechar={fechar} />
        </Suspense>
      )}
    </>
  );
}

export default memo(CapturaLeadsMaps);
