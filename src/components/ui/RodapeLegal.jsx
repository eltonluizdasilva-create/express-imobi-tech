import React from 'react';
import { Link } from 'react-router-dom';
import { EMAIL_INSTITUCIONAL, SITE_INSTITUCIONAL } from '../../lib/appUrl';
import { abrirPreferenciasCookies } from '../../lib/consentimentoCookies';

/**
 * RodapeLegal — aviso discreto no fim do conteúdo principal do painel.
 * Deliberadamente pequeno e de baixo contraste: informa sem competir com a tela.
 *
 * D-22.04: identificação da empresa, canal de contato, acesso aos três
 * documentos legais, pedido de exclusão de dados e reabertura das preferências
 * de cookies ficam VISÍVEIS em toda tela do painel.
 */
export default function RodapeLegal() {
  return (
    <footer className="w-full px-4 pt-2 pb-6">
      <p className="mx-auto max-w-3xl text-center text-[10px] leading-relaxed text-neutral-600">
        © {new Date().getFullYear()} Express Tech · Express Imobi Tech. A Inteligência
        Artificial otimiza seu tempo, mas não substitui sua expertise. A conferência final das informações e o
        relacionamento humano são os verdadeiros diferenciais do corretor.
      </p>

      <p className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] text-neutral-600">
        <Link to="/termos" className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300">
          Termos de Uso
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacidade" className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300">
          Política de Privacidade
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/reembolso" className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300">
          Política de Reembolso
        </Link>
      </p>

      <p className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] text-neutral-600">
        <a
          href={`mailto:${EMAIL_INSTITUCIONAL}?subject=${encodeURIComponent('LGPD - Exclusão de dados')}`}
          className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300"
        >
          Excluir meus dados
        </a>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => abrirPreferenciasCookies()}
          className="cursor-pointer underline decoration-dotted underline-offset-2 transition hover:text-neutral-300"
        >
          Preferências de cookies
        </button>
        <span aria-hidden="true">·</span>
        <a
          href={`mailto:${EMAIL_INSTITUCIONAL}`}
          className="underline decoration-dotted underline-offset-2 transition hover:text-neutral-300"
        >
          {EMAIL_INSTITUCIONAL}
        </a>
        <span aria-hidden="true">·</span>
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
