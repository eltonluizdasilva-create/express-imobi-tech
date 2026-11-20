import React, { useState } from 'react';
import { MessageCircle, Camera, Zap } from 'lucide-react';

/**
 * SofiaWhatsAppTab — aba única que reúne "Conexão WhatsApp" e "QR Code Sofia".
 *
 * MOTIVO (Lote 2, 2026-11-20): as duas abas faziam a mesma coisa na prática —
 * conectar o WhatsApp da imobiliária e ativar a Sofia. Duas entradas de menu
 * para uma única tarefa confundem o corretor.
 *
 * IMPORTANTE: nenhuma rota foi removida.
 *   • As abas originais (`whatsapp_hub` e `secretaria`) continuam existindo e
 *     continuam renderizando os componentes de origem (`AdminNovo` e `Secretaria`).
 *   • Esta tela apenas alterna entre elas por dentro, com um seletor no topo.
 *   • Links diretos, tour e `setAbaAtiva('secretaria')` seguem funcionando.
 */
export default function SofiaWhatsAppTab({
  abaInicial = 'whatsapp_hub',
  childrenMap = {},
  onAbrirCopiloto = null,
}) {
  const [subAba, setSubAba] = useState(
    abaInicial === 'secretaria' ? 'secretaria' : 'whatsapp_hub'
  );

  const abas = [
    {
      key: 'whatsapp_hub',
      label: 'Conexão WhatsApp',
      icone: MessageCircle,
      descricao: 'Ponte oficial e fluxo de atendimento',
    },
    {
      key: 'secretaria',
      label: 'QR Code Sofia',
      icone: Camera,
      descricao: 'Ativar a Sofia no WhatsApp do corretor',
    },
  ];

  const conteudo = childrenMap[subAba];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-2">
        {abas.map(({ key, label, icone: Icone, descricao }) => {
          const ativo = subAba === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSubAba(key)}
              aria-current={ativo ? 'page' : undefined}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                ativo
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
              }`}
            >
              <Icone size={15} className={ativo ? 'text-emerald-400' : 'text-slate-500'} />
              <span className="min-w-0">
                <span
                  className={`block truncate text-[11px] font-black uppercase tracking-[0.12em] ${
                    ativo ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
                <span className="block truncate text-[10px] text-slate-500">{descricao}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Hermes Copiloto saiu das barras principais (Lote 2); este é o atalho
          interno para não perder o acesso. */}
      {onAbrirCopiloto && (
        <button
          type="button"
          onClick={onAbrirCopiloto}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1.5 text-[10.5px] font-bold text-slate-400 transition-all hover:-translate-y-px hover:text-white"
        >
          <Zap size={12} />
          Abrir Hermes Copiloto
        </button>
      )}

      {conteudo || (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-xs text-slate-500">
          Módulo indisponível nesta visão.
        </div>
      )}
    </div>
  );
}
