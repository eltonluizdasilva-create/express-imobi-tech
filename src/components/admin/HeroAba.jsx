import React from 'react';
import { Sparkles } from 'lucide-react';
import { comAlpha } from '../../lib/coresAbas';

/**
 * HeroAba — BASE ÚNICA dos cabeçalhos do painel (referência: aba Secretaria).
 *
 * Estrutura fixa:
 *   [ícone em tile colorido]  TÍTULO GRANDE EM CAIXA ALTA (parte colorida)
 *                              ✦ linha micro em maiúsculas
 *                                                    [ações à direita]
 *
 * Só a cor muda por aba. Nada de layout alternativo.
 */
export default function HeroAba({
  icone: Icone = Sparkles,
  titulo = '',
  destaque = '',
  chip = '',
  subtitulo = '',
  cor = '#10b981',
  stats = [],
  acao = null,
  acoes = null,
  flat = false,
}) {
  const acoesFinais = acoes || acao;

  const conteudo = (
    <div className="z-10 flex min-w-0 items-center gap-4 md:gap-5">
      <div
        className="shrink-0 rounded-2xl p-3 md:p-4"
        style={{
          backgroundColor: cor,
          boxShadow: `0 12px 32px -12px ${comAlpha(cor, 0.95)}`,
        }}
      >
        <Icone size={30} color="#04120c" />
      </div>

      <div className="min-w-0">
        <h1 className="text-xl font-black uppercase leading-none tracking-tight text-white md:text-3xl">
          {titulo}
          {destaque ? (
            <>
              {' '}
              <span className="hero-destaque" style={{ color: cor }}>{destaque}</span>
            </>
          ) : null}
        </h1>

        {chip ? (
          <p className="mt-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 md:text-xs">
            <Sparkles size={13} color={cor} />
            <span className="min-w-0">{chip}</span>
          </p>
        ) : null}

        {subtitulo && subtitulo !== chip ? (
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400 md:text-sm">
            {subtitulo}
          </p>
        ) : null}
      </div>
    </div>
  );

  const ladoDireito = acoesFinais || (stats?.length ? (
    <div className="flex flex-wrap gap-2.5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="hero-aba-stat min-w-[112px] rounded-2xl border px-3.5 py-2.5"
          style={{ borderColor: comAlpha(cor, 0.25) }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
          <p className="mt-0.5 text-base font-black leading-none text-white">{s.valor}</p>
          {s.detalhe && <p className="mt-0.5 text-[9px] text-slate-500">{s.detalhe}</p>}
        </div>
      ))}
    </div>
  ) : null);

  const inner = (
    <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-6">
      {conteudo}
      {ladoDireito && <div className="z-10 shrink-0 self-stretch md:self-auto">{ladoDireito}</div>}
    </div>
  );

  if (flat) return inner;

  return (
    <section
      className="hero-aba relative mb-6 overflow-hidden rounded-[2rem] border p-5 shadow-2xl md:p-7"
      style={{
        borderColor: comAlpha(cor, 0.40),
        '--hero-cor': comAlpha(cor, 0.16),
        // Cor cheia do acento da aba: o modo claro escurece o `destaque` por
        // `color-mix` sobre esta variável (D-22.03), preservando a tonalidade.
        '--hero-acento': cor,
      }}
    >
      {inner}
    </section>
  );
}
