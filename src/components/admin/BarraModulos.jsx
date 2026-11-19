import React from 'react';

/**
 * BarraModulos — linha horizontal de navegação no padrão do painel de referência:
 * rótulo micro em maiúsculas com ponto colorido + pílulas compactas.
 * A pílula ativa fica branca com texto escuro (leitura imediata);
 * as demais mantêm borda neutra, com halo na cor da seção ao passar o mouse.
 */

const TONS = {
  esmeralda: { cor: '#34d399', base: '16,185,129' },
  teal: { cor: '#2dd4bf', base: '20,184,166' },
  roxo: { cor: '#c4b5fd', base: '139,92,246' },
  ambar: { cor: '#fbbf24', base: '245,158,11' },
};

export default function BarraModulos({
  titulo = '',
  subtitulo = '',
  tom = 'esmeralda',
  itens = [],
  abaAtiva,
  setAbaAtiva,
  detalhes = {},
  destaque = false,
  linhaUnica = false,
  dataTour,
}) {
  const t = TONS[tom] || TONS.esmeralda;

  return (
    <div
      data-tour={dataTour}
      className={`relative rounded-2xl border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 ${
        destaque ? 'shadow-[0_0_30px_-16px_rgba(245,158,11,0.55)]' : ''
      }`}
    >
      <div
        className={`flex ${
          linhaUnica ? 'flex-row items-center gap-3' : 'flex-col gap-2 md:flex-row md:items-center md:gap-3'
        }`}
      >
        <div className="flex shrink-0 flex-col gap-0.5 md:w-56">
          <span
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.20em] md:text-[10px]"
            style={{ color: t.cor }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.cor }} />
            {titulo}
          </span>
          {subtitulo && (
            <span className="hidden text-[9px] uppercase tracking-[0.14em] text-slate-600 md:block">
              {subtitulo}
            </span>
          )}
        </div>

        <div
          className={`min-w-0 ${
            linhaUnica
              ? 'flex flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0'
              : 'flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(itens || []).map((btn) => {
            const ativo = abaAtiva === btn.id;
            const det = detalhes[btn.id];
            return (
              <button
                key={btn.id}
                type="button"
                data-tour={btn.tour}
                onClick={() => setAbaAtiva(btn.id)}
                title={det ? `${det.tituloCard || det.tituloLimpo || btn.label}: ${det.descricao}` : btn.label}
                aria-current={ativo ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 ${
                  ativo
                    ? 'border-white bg-white text-slate-900 shadow-[0_2px_12px_rgba(255,255,255,0.18)]'
                    : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:-translate-y-px hover:text-white'
                }`}
                onMouseEnter={(e) => {
                  if (ativo) return;
                  e.currentTarget.style.borderColor = `rgba(${t.base},0.55)`;
                  e.currentTarget.style.boxShadow = `0 0 14px rgba(${t.base},0.30)`;
                }}
                onMouseLeave={(e) => {
                  if (ativo) return;
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <span className="text-[12px] leading-none">{btn.icone}</span>
                <span className="whitespace-nowrap">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
