/**
 * BarraEtapas.jsx — indicador das 3 etapas do wizard (D-23.16).
 */

import React from 'react';
import { Check } from 'lucide-react';
import { ETAPAS, tons } from './estilo';

export default function BarraEtapas({ etapa = 1, temaClaro = false, habilitadas = [true, false, false], onIr }) {
  const c = tons(temaClaro);

  return (
    <ol className={`flex flex-col gap-2 rounded-2xl border p-2 sm:flex-row sm:items-center ${c.card}`}>
      {ETAPAS.map((item, indice) => {
        const concluida = etapa > item.id;
        const ativa = etapa === item.id;
        const habilitada = Boolean(habilitadas[indice]);

        return (
          <li key={item.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!habilitada || ativa}
              onClick={() => onIr?.(item.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition disabled:cursor-default ${
                ativa
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_10px_26px_-14px_rgba(16,185,129,0.9)]'
                  : concluida
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                    : `${c.cardSuave} ${c.fraco}`
              } ${habilitada && !ativa ? 'hover:border-emerald-500/50' : ''}`}
              aria-current={ativa ? 'step' : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
                  ativa
                    ? 'bg-white/20 text-white'
                    : concluida
                      ? 'bg-emerald-500 text-white'
                      : temaClaro
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-white/10 text-slate-300'
                }`}
              >
                {concluida ? <Check size={12} /> : item.icone}
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
                  Etapa {item.id}
                </span>
                <span className="block truncate text-[11px] font-bold uppercase tracking-wide">{item.titulo}</span>
              </span>
            </button>

            {indice < ETAPAS.length - 1 ? (
              <span className={`hidden h-px flex-1 sm:block ${temaClaro ? 'bg-slate-200' : 'bg-white/10'}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
