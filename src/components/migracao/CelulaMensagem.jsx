/**
 * CelulaMensagem.jsx — mensagem pronta de WhatsApp por lead (D-23.16).
 * Botão "Ver mensagem" (expande o texto), "Copiar" e "Abrir WhatsApp".
 */

import React, { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { linkWhatsApp } from '../../lib/importacao/temperatura';
import { tons } from './estilo';

export default function CelulaMensagem({ lead, temaClaro = false, onCopiar, copiado = false }) {
  const c = tons(temaClaro);
  const [aberta, setAberta] = useState(false);
  const link = linkWhatsApp(lead?.telefone, lead?.mensagem);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setAberta((valor) => !valor)}
          className={`rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition ${c.cardSuave} ${c.texto}`}
          aria-expanded={aberta}
        >
          {aberta ? 'Ocultar' : 'Ver mensagem'}
        </button>
        <button
          type="button"
          onClick={() => onCopiar(lead.id, lead.mensagem)}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 transition hover:bg-emerald-500/20"
        >
          {copiado ? <Check size={11} /> : <Copy size={11} />} {copiado ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={link || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!link}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition ${
            link ? 'bg-[#25D366] hover:brightness-110' : 'pointer-events-none bg-slate-500/40'
          }`}
        >
          <MessageCircle size={11} /> WhatsApp
        </a>
      </div>
      {aberta ? (
        <p className={`mt-2 max-w-md rounded-xl border px-3 py-2 text-[11px] leading-snug ${c.cardSuave} ${c.texto}`}>
          {lead?.mensagem}
        </p>
      ) : null}
    </>
  );
}
