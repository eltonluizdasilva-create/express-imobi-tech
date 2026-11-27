import React from 'react';
import { Shuffle, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { registrarEventoLead, TIPOS_EVENTO } from '../../services/girardEngine';

const COLUNAS_FUNIL = [
  { titulo: 'Novo Lead', equivalentes: ['Novo Lead'] },
  { titulo: 'Em Atendimento', equivalentes: ['Em Atendimento', 'Qualificado IA'] },
  { titulo: 'Visita Agendada', equivalentes: ['Visita Agendada'] },
  { titulo: 'Fechado', equivalentes: ['Fechado', 'Proposta / Fechamento'] },
];

export default function AbaFunilLeads({
  listaLeads = [],
  vgvLeadsCRM = 0,
  comissaoLeadsCRM = 0,
  statusRoletaMsg = '',
  onLimparStatusRoleta,
  onRedistribuirFila,
  onAbrirRoleta,
  onAbrirNovoLead,
  onRepassarLead,
  onSimularCredito,
  onAbrirWhatsApp,
  onExcluirLead,
  imobiliariaId,
  fmtBRL,
  atualizarEstagioLead: atualizarEstagioLeadProp,
}) {
  const formatarMoeda = fmtBRL || ((val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

  const handleAtualizarEstagio = async (leadId, novoEstagio) => {
    if (atualizarEstagioLeadProp) {
      return atualizarEstagioLeadProp(leadId, novoEstagio);
    }
    if (!imobiliariaId || !leadId) return;
    try {
      await updateDoc(doc(db, 'oficinas', imobiliariaId, 'leads_imobi', leadId), {
        estagio: novoEstagio,
        etapaAlteradaEm: serverTimestamp(),
        ...(novoEstagio === 'Fechado' ? { posVendaStatus: 'pendente' } : {}),
      });
      const eventoEstagio = await registrarEventoLead(db, imobiliariaId, {
        leadId,
        tipo: TIPOS_EVENTO.MUDANCA_ETAPA,
        canal: 'painel',
        descricao: `Estagio alterado para ${novoEstagio}`,
        metadados: { estagioNovo: novoEstagio },
        chaveIdempotencia: `${TIPOS_EVENTO.MUDANCA_ETAPA}:${leadId}:${novoEstagio}:${new Date().toISOString().slice(0, 13)}`,
      });
      if (!eventoEstagio.ok) {
        console.error('Falha ao registrar evento de mudanca de estagio:', eventoEstagio.error);
      }
    } catch (err) {
      console.error('Erro ao mover lead no funil:', err);
    }
  };

  const leadsArray = Array.isArray(listaLeads) ? listaLeads : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            👥 FUNIL DE <span style={{ color: '#10b981' }}>VENDAS & CRM</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Nenhum lead esfria por falta de retorno: cada cliente tem dono, etapa e prazo — e o card mostra quem está parado há mais tempo.
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            VGV no Funil: <span className="text-[#10b981] font-bold">{formatarMoeda(vgvLeadsCRM)}</span> • Comissão Prevista (6%):{' '}
            <span className="text-[#10b981] font-bold">{formatarMoeda(comissaoLeadsCRM)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onRedistribuirFila && (
            <button
              onClick={onRedistribuirFila}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-200 hover:text-[#10b981] font-bold text-xs cursor-pointer transition"
            >
              <Shuffle size={15} className="text-[#10b981]" /> Redistribuir Fila (Roleta)
            </button>
          )}
          {onAbrirRoleta && (
            <button
              onClick={onAbrirRoleta}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-300 font-bold text-xs cursor-pointer transition"
            >
              ⚙️ Controlos da Roleta
            </button>
          )}
          <button
            onClick={onAbrirNovoLead}
            style={{ backgroundColor: '#10b981' }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 text-white font-bold text-sm cursor-pointer"
          >
            <Plus size={18} /> Adicionar Lead
          </button>
        </div>
      </div>

      {statusRoletaMsg && (
        <div className="bg-[#020408] border border-[#10b981] rounded-xl px-4 py-3 text-xs font-bold text-[#10b981] flex items-center justify-between">
          <span>{statusRoletaMsg}</span>
          <button
            onClick={onLimparStatusRoleta}
            aria-label="Fechar o aviso da roleta"
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUNAS_FUNIL.map((colInfo) => {
          const coluna = colInfo.titulo;
          const leadsColuna = leadsArray.filter((l) =>
            colInfo.equivalentes.includes(l?.estagio || 'Novo Lead')
          );
          return (
            <div key={coluna} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-h-[360px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">{coluna}</h3>
                <span style={{ color: '#10b981' }} className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-[#10b981]">
                  {leadsColuna.length}
                </span>
              </div>

              <div className="space-y-3">
                {leadsColuna.map((lead) => (
                  <div key={lead.id} className="bg-[#020408] border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{lead.nome}</span>
                      <button
                        onClick={() => onExcluirLead?.('leads_imobi', lead.id)}
                        className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      🎯 {lead.interesse} • 📍 {lead.bairro || 'A definir'}
                    </p>
                    <p style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">
                      💰 Orçamento: {formatarMoeda(lead.orcamento)} • 6%: {formatarMoeda((Number(lead.orcamento) || 0) * 0.06)}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-300 truncate">👔 {lead.corretorResponsavel || 'Plantão'}</p>
                      {onSimularCredito && (
                        <button
                          onClick={() => onSimularCredito(lead)}
                          title="Abrir o correspondente com este lead pré-carregado"
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-[#10b981] cursor-pointer transition"
                        >
                          🏦 Simular
                        </button>
                      )}
                      {onRepassarLead && (
                        <button
                          onClick={() => onRepassarLead(lead)}
                          title="Repassar para o próximo corretor ativo na roleta"
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-[#10b981] cursor-pointer transition"
                        >
                          🔀 Repassar
                        </button>
                      )}
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      <button
                        onClick={() =>
                          onAbrirWhatsApp?.(
                            lead.telefone,
                            `Olá ${lead.nome}! Aqui é da imobiliária. Separei excelentes opções de ${lead.interesse} em ${lead.bairro || 'sua região'}!`
                          )
                        }
                        style={{ backgroundColor: '#10b981' }}
                        className="flex-1 py-1.5 px-2 rounded-lg text-white hover:opacity-90 text-[11px] font-bold cursor-pointer"
                      >
                        💬 Chamar Zap
                      </button>
                      <select
                        value={
                          lead.estagio === 'Qualificado IA'
                            ? 'Em Atendimento'
                            : lead.estagio === 'Proposta / Fechamento'
                            ? 'Fechado'
                            : lead.estagio || 'Novo Lead'
                        }
                        onChange={(e) => handleAtualizarEstagio(lead.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1"
                      >
                        <option value="Novo Lead">Novo Lead</option>
                        <option value="Em Atendimento">Em Atendimento</option>
                        <option value="Visita Agendada">Visita Agendada</option>
                        <option value="Fechado">Fechado</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
