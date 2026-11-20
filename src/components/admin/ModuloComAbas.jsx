import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * ModuloComAbas — contêiner de abas internas de um módulo.
 *
 * MOTIVO (Lote 3, 2026-11-20): a barra `PRO · ASSINANTES` tinha botões soltos
 * para telas que são, na prática, sub-telas de um mesmo assunto:
 *   • `Roleta de Leads`  → pertence ao Diretor Comercial IA (`administrador`)
 *   • `Repasses & NF`    → pertence ao Assistente Fiscal (`contador`)
 *
 * Este componente reúne as telas por dentro de um módulo, sem remover rota:
 *   • As chaves recebidas em `abas` renderizam aqui.
 *   • As rotas antigas (`roleta_imobi`, `notafiscal`) continuam existindo em
 *     `AdminNovo.jsx` e seguem funcionando em links diretos e no tour.
 *   • O módulo hospedeiro (`administrador` / `contador`) abre na aba principal
 *     por padrão; `abaInicial` permite abrir direto em uma sub-aba.
 *
 * Não contém lógica de negócio: só desenha o seletor e devolve o nó recebido.
 */
export default function ModuloComAbas({
  abas = [],
  abaInicial = null,
  childrenMap = {},
  titulo = null,
}) {
  const chaveInicial =
    abaInicial && childrenMap[abaInicial] ? abaInicial : abas[0]?.key;

  const [subAba, setSubAba] = useState(chaveInicial);

  const conteudo = childrenMap[subAba];

  return (
    <div className="space-y-5">
      {titulo && (
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          <ChevronRight size={13} className="text-emerald-500" />
          {titulo}
        </div>
      )}

      <div
        role="tablist"
        aria-label={titulo || 'Abas do módulo'}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-2"
      >
        {abas.map(({ key, label, icone: Icone, descricao }) => {
          const ativo = subAba === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setSubAba(key)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                ativo
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
              }`}
            >
              {Icone && (
                <Icone size={15} className={ativo ? 'text-emerald-400' : 'text-slate-500'} />
              )}
              <span className="min-w-0">
                <span
                  className={`block truncate text-[11px] font-black uppercase tracking-[0.12em] ${
                    ativo ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
                {descricao && (
                  <span className="block truncate text-[10px] text-slate-500">{descricao}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {conteudo || (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-xs text-slate-500">
          Módulo indisponível nesta visão.
        </div>
      )}
    </div>
  );
}
