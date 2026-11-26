/**
 * ReguaTemperatura.jsx — quadro informativo da régua de leads (D-23.16).
 * Aparece na Etapa 1 (antes de importar) e como legenda na Etapa 2.
 */

import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import { REGUA_TEMPERATURA } from '../../lib/importacao/temperatura';
import { tons } from './estilo';

export default function ReguaTemperatura({ temaClaro = false, compacto = false }) {
  const c = tons(temaClaro);

  return (
    <section
      className={`rounded-2xl border p-4 md:p-5 ${c.card}`}
      aria-label="Régua de classificação automática de leads"
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <Info size={16} />
          </span>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-wide ${c.titulo}`}>
              Régua de classificação automática
            </h3>
            <p className={`text-[11px] ${c.fraco}`}>
              A temperatura é calculada pela data do último contato — e a tag pode ser trocada em 1 clique na prévia.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-500">
          <ShieldCheck size={11} /> Aplicada sozinha
        </span>
      </header>

      <div className={`grid gap-2.5 ${compacto ? 'sm:grid-cols-3' : 'sm:grid-cols-3'}`}>
        {REGUA_TEMPERATURA.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-3 ${c.cardSuave}`}
            style={{ borderLeft: `3px solid ${item.cor}` }}
          >
            <p className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${c.titulo}`}>
              <span aria-hidden="true">{item.emoji}</span> {item.label}
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white"
                style={{ backgroundColor: item.cor }}
              >
                {item.janela}
              </span>
            </p>
            <p className={`mt-1 text-[11px] font-bold ${c.texto}`}>{item.resumo}</p>
            <p className={`mt-0.5 text-[11px] leading-snug ${c.fraco}`}>{item.descricao}</p>
          </article>
        ))}
      </div>

      <p className={`mt-3 flex items-start gap-2 rounded-xl border border-dashed px-3 py-2 text-[11px] leading-snug ${c.cardSuave} ${c.texto}`}>
        <Info size={13} className="mt-0.5 shrink-0 text-emerald-500" />
        <span>
          <strong>Status explícito manda:</strong> se a planilha já traz “Proposta”, “Visita” ou “Negociação”, o lead
          entra como <strong>🔥 Quente</strong> mesmo com data antiga. “Perdido”, “Sem interesse” e “Inativo” entram
          como <strong>❄️ Frio</strong>. Sem data informada, a base vai para reativação inteligente.
        </span>
      </p>
    </section>
  );
}
