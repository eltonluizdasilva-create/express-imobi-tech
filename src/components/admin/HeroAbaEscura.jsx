import React from 'react';
import { Sparkles } from 'lucide-react';
import { comAlpha } from '../../lib/coresAbas';

/**
 * HeroAbaEscura — mesma estrutura visual do `HeroAba`, para uso DENTRO do
 * `<AnelEscuro>` (shadow root).
 *
 * MOTIVO (Lote 4): o shadow root não enxerga as classes do Tailwind do
 * documento, então `className="flex items-center gap-4"` não tem efeito lá. Aqui
 * o layout vem das classes `anel-*` declaradas em `anel-escuro.css`, que é
 * injetado no próprio shadow root.
 *
 * Contrato de conteúdo: idêntico ao HeroAba (ícone em tile colorido + título em
 * caixa alta com a parte colorida + chip + subtítulo). Se o HeroAba mudar, este
 * muda junto — os dois são a mesma peça, com contextos de estilo diferentes.
 */
export default function HeroAbaEscura({
  icone: Icone = Sparkles,
  titulo = '',
  destaque = '',
  chip = '',
  subtitulo = '',
  cor = '#10b981',
}) {
  return (
    <div className="anel-linha">
      <div
        className="anel-icone"
        style={{
          backgroundColor: cor,
          boxShadow: `0 12px 32px -12px ${comAlpha(cor, 0.95)}`,
        }}
      >
        <Icone size={30} color="#04120c" />
      </div>

      <div className="anel-coluna">
        <h1 className="anel-titulo">
          {titulo}
          {destaque ? (
            <>
              {' '}
              <span style={{ color: cor }}>{destaque}</span>
            </>
          ) : null}
        </h1>

        {chip ? (
          <p className="anel-chip">
            <Sparkles size={13} color={cor} />
            <span>{chip}</span>
          </p>
        ) : null}

        {subtitulo && subtitulo !== chip ? (
          <p className="anel-subtitulo">{subtitulo}</p>
        ) : null}
      </div>
    </div>
  );
}
