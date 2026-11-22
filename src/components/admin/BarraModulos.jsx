import React from 'react';
import { Lock } from 'lucide-react';
import { precoNoCiclo } from '../../lib/planos';

const PRECO_PRO = precoNoCiclo('pro');

/**
 * BarraModulos — linha horizontal de navegação no padrão do painel de referência:
 * rótulo micro em maiúsculas com ponto colorido + pílulas compactas.
 * A pílula ativa fica branca com texto escuro (leitura imediata);
 * as demais mantêm borda neutra, com halo na cor da seção ao passar o mouse.
 *
 * `item.bloqueado`: a pílula mostra cadeado, fica âmbar e o clique chama
 * `onBloqueado(item)` em vez de trocar de aba.
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
  temaClaro = false,
  onBloqueado = null,
}) {
  const t = TONS[tom] || TONS.esmeralda;

  return (
    <div
      data-tour={dataTour}
      className={`relative rounded-2xl border px-3 py-2.5 ${
        temaClaro ? 'border-slate-200 bg-slate-50' : 'border-white/[0.06] bg-white/[0.015]'
      } ${
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
            const bloqueado = btn.bloqueado === true;
            const det = detalhes[btn.id];
            return (
              <button
                key={btn.id}
                type="button"
                data-tour={`tab-${btn.id}`}
                aria-disabled={bloqueado || undefined}
                onClick={() => {
                  if (bloqueado) {
                    if (typeof onBloqueado === 'function') onBloqueado(btn);
                    return;
                  }
                  setAbaAtiva(btn.id);
                }}
                title={
                  bloqueado
                    ? `${btn.label}: exclusivo do PRO (${PRECO_PRO}/mês) — teste de 10 dias encerrado`
                    : det
                      ? `${det.tituloCard || det.tituloLimpo || btn.label}: ${det.descricao}`
                      : btn.label
                }
                aria-current={ativo ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 ${
                  bloqueado
                    ? 'cursor-pointer border-amber-500/45 bg-amber-500/[0.10] text-amber-200 hover:-translate-y-px hover:border-amber-400 hover:bg-amber-500/20'
                    : ativo
                    ? (temaClaro
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_2px_12px_rgba(15,23,42,0.25)]'
                        : 'border-white bg-white text-slate-900 shadow-[0_2px_12px_rgba(255,255,255,0.18)]')
                    : (temaClaro
                        ? 'border-slate-300 bg-white text-slate-800 hover:-translate-y-px hover:bg-slate-200 hover:text-slate-900'
                        : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:-translate-y-px hover:text-white')
                }`}
                onMouseEnter={(e) => {
                  if (ativo || temaClaro || bloqueado) return;
                  e.currentTarget.style.borderColor = `rgba(${t.base},0.55)`;
                  e.currentTarget.style.boxShadow = `0 0 14px rgba(${t.base},0.30)`;
                }}
                onMouseLeave={(e) => {
                  if (ativo || temaClaro || bloqueado) return;
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <span className="text-[12px] leading-none">{btn.icone}</span>
                <span className="whitespace-nowrap">{btn.label}</span>
                {bloqueado && <Lock size={10} className="shrink-0" aria-hidden="true" />}
                {/* Badge para indicar o nível comercial do módulo. */}
                {btn.badge && (
                  <span
                    className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-[0.10em] ${
                      bloqueado
                        ? 'border border-amber-400/50 bg-amber-400/15 text-amber-100'
                        : ativo
                          ? 'bg-emerald-500 text-slate-950'
                          : 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {btn.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
