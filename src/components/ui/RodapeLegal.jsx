import React from 'react';

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
    </footer>
  );
}
