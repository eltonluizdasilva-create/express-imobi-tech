import React from 'react';
import { textoDor, VERSAO_COPY } from '../../lib/copyAbas';

/**
 * DorESolucao — faixa contextual no TOPO da aba.
 * Desktop: 1 linha (Dor · Ganho). Mobile: 2 linhas empilhadas.
 * Espaçamento vem de `gap` + chip `shrink-0`, nunca de margem no texto —
 * era isso que fazia o texto encostar no rótulo ("GanhoEm 5 segundos...").
 */
function Chip({ children, tom }) {
  const base =
    'shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest';
  const cores =
    tom === 'ganho'
      ? 'bg-[#10b981]/12 text-[#10b981] border border-[#10b981]/25'
      : 'bg-slate-700/30 text-slate-400 border border-slate-600/30';
  return <span className={`${base} ${cores}`}>{children}</span>;
}

export default function DorESolucao({ abaAtiva }) {
  if (abaAtiva === 'mapa_inteligencia') {
    return null;
  }

  const { dor, ganho } = textoDor(abaAtiva);

  return (
    <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 md:mb-4 md:px-4 md:py-2.5">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-5">
        <div className="flex min-w-0 items-start gap-2 md:flex-1 md:items-center">
          <Chip>Dor</Chip>
          <span className="min-w-0 flex-1 text-[11px] leading-snug text-slate-400 md:truncate" title={dor}>
            {dor}
          </span>
        </div>

        <div className="flex min-w-0 items-start gap-2 md:flex-1 md:items-center">
          <Chip tom="ganho">Ganho</Chip>
          <span className="min-w-0 flex-1 text-[11px] leading-snug text-slate-200 md:truncate" title={ganho}>
            {ganho}
          </span>
        </div>

        <span
          className="hidden shrink-0 font-mono text-[9px] text-slate-600 lg:inline"
          title="Versão da comunicação"
        >
          {VERSAO_COPY}
        </span>
      </div>
    </div>
  );
}
