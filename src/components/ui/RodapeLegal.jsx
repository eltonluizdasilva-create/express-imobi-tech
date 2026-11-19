import React from 'react';
import { EMAIL_INSTITUCIONAL, SITE_INSTITUCIONAL } from '../../lib/appUrl';

/**
 * RodapeLegal — aviso discreto no fim do conteúdo principal.
 * Deliberadamente pequeno e de baixo contraste: informa sem competir com a tela.
 */
export default function RodapeLegal() {
  return (
    <footer className="w-full px-4 pt-2 pb-6">
      <p className="mx-auto max-w-3xl text-center text-[10px] leading-relaxed text-neutral-600">
        © 2026 Express Imobi Tech. A Inteligência Artificial otimiza seu tempo, mas não substitui sua
        expertise. A conferência final das informações e o relacionamento humano são os verdadeiros
        diferenciais do corretor.
      </p>
      <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-neutral-600">
        Contato e suporte:{' '}
        <a
          href={`mailto:${EMAIL_INSTITUCIONAL}`}
          className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300"
        >
          {EMAIL_INSTITUCIONAL}
        </a>
        {' · '}
        <a
          href={SITE_INSTITUCIONAL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300"
        >
          expresstech.com.br
        </a>
      </p>
    </footer>
  );
}
