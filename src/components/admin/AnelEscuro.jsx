import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// CSS que roda DENTRO do shadow root (o shadow não enxerga o CSS do documento).
// O `?inline` faz o Vite devolver o texto processado em vez de injetar no <head>.
import estilosAnel from './anel-escuro.css?inline';

/**
 * AnelEscuro — moldura que continua ESCURA nos dois temas.
 *
 * MOTIVO (Lote 4): os cabeçalhos de IA viviam em `bg-slate-900`/`bg-zinc-950`.
 * O tema claro (`src/index.css`) converte essas superfícies em branco E
 * escurece `text-white` — resultado: texto escuro sobre banner escuro.
 *
 * POR QUE SHADOW ROOT, e não uma regra CSS nova: as regras do tema claro são
 * `!important` e a principal traz 22 classes de especificidade (cadeias
 * `:not()`). Medido no navegador: `.tema-claro .escopo *` perde mesmo com a
 * mesma contagem de classes — a única saída é NÃO SER ALCANÇADO. Conteúdo em
 * `shadowRoot` fica fora do escopo das folhas de estilo do documento pai, então
 * o cabeçalho mantém fundo escuro e texto claro por construção.
 *
 * O React segue dono do conteúdo: `createPortal` renderiza os filhos de verdade
 * (eventos, estado, contexto) dentro do shadow root.
 *
 * Regra de uso: cabeçalho/banner de IA sobre fundo escuro fixo → `AnelEscuro`.
 */
export default function AnelEscuro({ children, className = '' }) {
  const hostRef = useRef(null);
  const [raiz, setRaiz] = useState(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });

    // Cria o miolo UMA vez. `innerHTML` não pode rodar de novo depois que o
    // portal já montou os filhos — isso apagaria o conteúdo do React.
    if (!shadow.querySelector('.faixa')) {
      const tag = document.createElement('style');
      tag.dataset.anelEscuro = 'true';
      tag.textContent = estilosAnel;
      const faixa = document.createElement('div');
      faixa.className = 'faixa';
      shadow.append(tag, faixa);
    }

    setRaiz(shadow.querySelector('.faixa'));
  }, []);

  return (
    <section ref={hostRef} className={`block overflow-hidden rounded-3xl ${className}`}>
      {raiz ? createPortal(children, raiz) : null}
    </section>
  );
}
