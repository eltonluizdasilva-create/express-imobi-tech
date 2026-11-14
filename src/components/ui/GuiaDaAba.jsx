import React, { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * GuiaDaAba — explicação curta e opcional no topo do card da aba.
 * Fechado por padrão: no mobile a tela fica limpa e o texto aparece só se o
 * corretor pedir. O gatilho fica alinhado à direita, no topo.
 */
export default function GuiaDaAba({ titulo = '', descricao = '' }) {
  const [aberto, setAberto] = useState(false);
  if (!descricao) return null;

  return (
    <div className="w-full">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-green-500 transition-colors"
        >
          <Info size={13} />
          <span>{aberto ? 'Ocultar' : 'Como funciona'}</span>
        </button>
      </div>

      {aberto && (
        <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
          {titulo && (
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-300 mb-1">
              {titulo}
            </p>
          )}
          <p className="text-xs leading-relaxed text-neutral-400">{descricao}</p>
        </div>
      )}
    </div>
  );
}
