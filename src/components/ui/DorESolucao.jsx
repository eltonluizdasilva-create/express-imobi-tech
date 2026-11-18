import React from 'react';
import { Lightbulb } from 'lucide-react';
import { textoDor, VERSAO_COPY } from '../../lib/copyAbas';

/**
 * DorESolucao — rodapé contextual, discreto.
 * Mobile: 2 linhas compactas (dor + ganho). Desktop: lado a lado.
 */
export default function DorESolucao({ abaAtiva }) {
  const { dor, ganho } = textoDor(abaAtiva);

  return (
    <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#10b981]/12 text-[#10b981] sm:mt-0">
          <Lightbulb size={13} />
        </span>

        <div className="min-w-0 flex-1 text-[11px] leading-snug text-slate-400 sm:flex sm:items-baseline sm:gap-4">
          <p className="m-0 sm:flex-1">
            <span className="mr-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Dor</span>
            <span className="text-slate-300">{dor}</span>
          </p>
          <p className="m-0 mt-0.5 sm:mt-0 sm:flex-1">
            <span className="mr-1 text-[9px] font-black uppercase tracking-widest text-[#10b981]">Ganho</span>
            <span className="text-slate-200">{ganho}</span>
          </p>
        </div>

        <span className="hidden shrink-0 text-[9px] font-mono text-slate-600 sm:inline" title="Versão da comunicação">
          {VERSAO_COPY}
        </span>
      </div>
    </div>
  );
}
