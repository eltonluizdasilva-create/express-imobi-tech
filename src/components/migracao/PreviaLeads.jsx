/**
 * PreviaLeads.jsx — tabela de leads da Etapa 2 (D-23.16).
 * Tag de temperatura editável em 1 clique + mensagem de WhatsApp por linha.
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import CelulaMensagem from './CelulaMensagem';
import { tons } from './estilo';

const moeda = (valor) =>
  Number(valor) > 0
    ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';

const CORES_TEMPERATURA = { quente: '#f97316', morno: '#0284c7', frio: '#64748b' };

function rotuloOrigem(lead) {
  if (lead.temperaturaOrigem === 'status' && lead.statusOriginal) return `status: ${lead.statusOriginal}`;
  if (lead.temperaturaOrigem === 'manual') return 'ajustado por você';
  if (!lead.dataContatoISO) return 'sem data';
  if (Number.isFinite(lead.diasSemContato)) {
    if (lead.diasSemContato === 0) return 'contato hoje';
    if (lead.diasSemContato === 1) return 'há 1 dia';
    return `há ${lead.diasSemContato} dias`;
  }
  return 'data informada';
}

function BotaoTemperatura({ lead, onAlternarTemperatura }) {
  const temperatura = lead?.temperatura || 'frio';
  const cor = CORES_TEMPERATURA[temperatura] || CORES_TEMPERATURA.frio;
  const emoji = temperatura === 'quente' ? '🔥' : temperatura === 'morno' ? '🌤️' : '❄️';
  const label = temperatura === 'quente' ? 'Quente' : temperatura === 'morno' ? 'Morno' : 'Frio';

  return (
    <button
      type="button"
      onClick={() => onAlternarTemperatura(lead.id)}
      title="Clique para alternar a temperatura"
      aria-label={`Temperatura: ${label}. Clique para alternar.`}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110"
      style={{ backgroundColor: cor, boxShadow: `0 6px 18px -10px ${cor}` }}
    >
      <span aria-hidden="true">{emoji}</span>
      {label}
      <span className="text-[9px] font-bold text-white/75">↻</span>
    </button>
  );
}

export default function PreviaLeads({
  temaClaro = false,
  leads,
  onAlternarTemperatura,
  onAlternarSelecaoLead,
  onSelecionarTodosLeads,
  onRemoverLead,
  onCopiar,
  copiadoId,
}) {
  const c = tons(temaClaro);
  const selecionaveis = leads.filter((lead) => lead.valido);
  const todosMarcados = selecionaveis.length > 0 && selecionaveis.every((lead) => lead.selecionado);

  return (
    <div className={`overflow-hidden rounded-2xl border ${c.card}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${c.linha}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelecionarTodosLeads(!todosMarcados)}
            className={`flex h-5 w-5 items-center justify-center rounded border transition ${
              todosMarcados ? 'border-emerald-500 bg-emerald-500 text-white' : c.input
            }`}
            aria-label={todosMarcados ? 'Desmarcar todos os leads' : 'Marcar todos os leads'}
          >
            {todosMarcados ? <Check size={12} /> : null}
          </button>
          <h3 className={`text-sm font-black uppercase tracking-wide ${c.titulo}`}>
            Leads para o CRM <span className={`text-[11px] font-bold ${c.fraco}`}>({selecionaveis.length})</span>
          </h3>
        </div>
        <p className={`text-[11px] ${c.fraco}`}>
          Clique na tag para alternar 🔥 · 🌤️ · ❄️. Telefone e mensagem vão junto para o Funil.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-xs">
          <thead className={`${c.cabecalhoTabela} text-[10px] uppercase tracking-widest`}>
            <tr>
              <th className="w-10 px-3 py-2.5" aria-label="Seleção" />
              <th className="px-3 py-2.5">Contato</th>
              <th className="px-3 py-2.5">Interesse</th>
              <th className="px-3 py-2.5">Temperatura</th>
              <th className="px-3 py-2.5">Mensagem de WhatsApp</th>
              <th className="w-10 px-3 py-2.5" aria-label="Remover" />
            </tr>
          </thead>
          <tbody className={`divide-y ${c.linha}`}>
            {leads.map((lead) => (
              <tr key={lead.id} className={`${c.linhaTabela} ${lead.valido ? '' : 'opacity-60'}`}>
                <td className="px-3 py-2.5 align-top">
                  <button
                    type="button"
                    disabled={!lead.valido}
                    onClick={() => onAlternarSelecaoLead(lead.id)}
                    className={`flex h-5 w-5 items-center justify-center rounded border transition disabled:cursor-not-allowed ${
                      lead.selecionado ? 'border-emerald-500 bg-emerald-500 text-white' : c.input
                    }`}
                    aria-label={`${lead.selecionado ? 'Desmarcar' : 'Marcar'} ${lead.nome || lead.telefone}`}
                  >
                    {lead.selecionado ? <Check size={12} /> : null}
                  </button>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <p className={`font-bold ${c.titulo}`}>{lead.nome || 'Contato sem nome'}</p>
                  <p className={c.fraco}>{lead.telefoneExibicao || 'sem telefone válido'}</p>
                  {!lead.valido ? (
                    <p className="mt-1 text-[10px] font-bold text-amber-600">
                      {lead.motivo === 'duplicado' ? 'já existe no CRM' : 'não entra sem telefone'}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <p className={c.texto}>{lead.interesse || '—'}</p>
                  <p className={c.fraco}>{[lead.bairro, lead.cidade].filter(Boolean).join(' · ') || 'sem bairro'}</p>
                  {lead.orcamento > 0 ? (
                    <p className={`text-[11px] font-bold ${c.texto}`}>{moeda(lead.orcamento)}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <BotaoTemperatura lead={lead} onAlternarTemperatura={onAlternarTemperatura} />
                  <p className={`mt-1 text-[10px] ${c.fraco}`}>{rotuloOrigem(lead)}</p>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <CelulaMensagem
                    lead={lead}
                    temaClaro={temaClaro}
                    onCopiar={onCopiar}
                    copiado={copiadoId === lead.id}
                  />
                </td>
                <td className="px-3 py-2.5 align-top">
                  <button
                    type="button"
                    onClick={() => onRemoverLead(lead.id)}
                    className={`rounded-lg p-1.5 transition hover:bg-rose-500/10 hover:text-rose-500 ${c.fraco}`}
                    aria-label={`Remover ${lead.nome || lead.telefone} da importação`}
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
