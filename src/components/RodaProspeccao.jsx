import React, { useMemo, useState } from 'react';
import {
  MessageCircle, Check, CalendarClock, RefreshCw, Users, UserPlus,
  PauseCircle, HeartHandshake, TrendingUp, Wallet, ArrowRight,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { Timestamp } from 'firebase/firestore';
import {
  calcularRodaProspeccao, registrarEventoLead, TIPOS_EVENTO,
} from '../services/girardEngine';

const ACCENT = '#10b981';
const cardCls = 'rounded-3xl border border-slate-800 bg-[#020408]';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const CARDS = [
  { key: 'acompanhar', contador: 'acompanhar', label: 'Contatos para acompanhar', icone: Users, cor: '#38bdf8' },
  { key: 'novosProspectos', contador: 'novosProspectos', label: 'Novos prospectos', icone: UserPlus, cor: '#8b5cf6' },
  { key: 'negociacoesParadas', contador: 'negociacoesParadas', label: 'Negociações paradas', icone: PauseCircle, cor: '#f59e0b' },
  { key: 'posVendasPendentes', contador: 'posVendasPendentes', label: 'Pós-vendas pendentes', icone: HeartHandshake, cor: '#f43f5e' },
];

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function RodaProspeccao({
  leads = [],
  visitas = [],
  propostas = [],
  tarefas = [],
  oficinaId = null,
  papelLogado = '',
  usuarioNome = '',
  vgv = 0,
  comissao = 0,
  onAbrirAba,
}) {
  const [modo, setModo] = useState('minha');
  const [filtro, setFiltro] = useState(null);
  const [feitos, setFeitos] = useState([]);
  const [processando, setProcessando] = useState(null);

  const ehGestor = ['master', 'admin', 'gestor', 'proprietario'].includes(String(papelLogado || '').toLowerCase());

  const roda = useMemo(() => calcularRodaProspeccao({
    leads,
    visitas,
    propostas,
    tarefas,
    corretorFiltro: modo === 'minha' && usuarioNome ? usuarioNome : null,
  }), [leads, visitas, propostas, tarefas, modo, usuarioNome]);

  const idsDoFiltro = filtro ? new Set(roda.detalhe.idsPorCategoria[filtro] || []) : null;

  const lista = useMemo(
    () => roda.prioridades.filter((p) => !feitos.includes(p.leadId) && (!idsDoFiltro || idsDoFiltro.has(p.leadId))),
    [roda.prioridades, feitos, idsDoFiltro],
  );

  function alternarFiltro(key) {
    setFiltro((atual) => (atual === key ? null : key));
  }

  async function abrirWhatsApp(item) {
    const tel = String(item.telefone || '').replace(/\D/g, '');
    if (!tel) return;
    setProcessando(item.leadId);
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(item.mensagemSugeridaWhatsapp || '')}`, '_blank', 'noopener');
    await registrarEventoLead(db, oficinaId, {
      leadId: item.leadId,
      telefone: tel,
      tipo: TIPOS_EVENTO.CONTATO_WHATSAPP,
      canal: 'whatsapp',
      descricao: item.fraseAcao,
      metadados: { categoria: item.categoria },
    });
    setFeitos((f) => [...f, item.leadId]);
    setProcessando(null);
  }

  async function concluir(item) {
    setProcessando(item.leadId);
    await registrarEventoLead(db, oficinaId, {
      leadId: item.leadId,
      telefone: item.telefone,
      tipo: TIPOS_EVENTO.CONTATO,
      canal: 'painel',
      descricao: `Acao concluida: ${item.fraseAcao}`,
      metadados: { categoria: item.categoria },
    });
    setFeitos((f) => [...f, item.leadId]);
    setProcessando(null);
  }

  async function agendar(item, dias) {
    setProcessando(item.leadId);
    const alvo = new Date();
    alvo.setDate(alvo.getDate() + dias);
    alvo.setHours(9, 0, 0, 0);
    await registrarEventoLead(db, oficinaId, {
      leadId: item.leadId,
      telefone: item.telefone,
      tipo: TIPOS_EVENTO.FOLLOWUP_AGENDADO,
      canal: 'painel',
      descricao: `Follow-up agendado para ${alvo.toLocaleDateString('pt-BR')}`,
      proximoFollowUpEm: Timestamp.fromDate(alvo),
      metadados: { categoria: item.categoria },
    });
    setFeitos((f) => [...f, item.leadId]);
    setProcessando(null);
  }

  const totalPrioridades = roda.prioridades.length;

  return (
    <div className="space-y-5">
      {/* Cabeçalho operacional */}
      <div className={`${cardCls} p-5 md:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
              Roda de Prospecção · Método Girard
            </p>
            <h1 className="mt-1 text-2xl font-black text-white md:text-3xl">
              {saudacao()}{usuarioNome ? `, ${String(usuarioNome).split(' ')[0]}` : ''}.
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-400">
              {totalPrioridades === 0
                ? 'Nenhuma pendência na sua carteira agora — a roda está limpa.'
                : `${totalPrioridades} ação(ões) recomendada(s) hoje, ordenadas por urgência real do histórico do lead.`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {ehGestor && (
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 p-1">
                {[
                  { key: 'minha', label: 'Minha Operação' },
                  { key: 'toda', label: 'Toda Imobiliária' },
                ].map((op) => (
                  <button
                    key={op.key}
                    onClick={() => setModo(op.key)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                      modo === op.key ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <TrendingUp size={12} /> VGV {brl(vgv)}
              </span>
              <span className="h-3 w-px bg-slate-800" />
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Wallet size={12} /> Comissão {brl(comissao)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 cards clicáveis */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map((c) => {
          const Icone = c.icone;
          const ativo = filtro === c.key;
          const valor = roda.contadores[c.contador] || 0;
          return (
            <button
              key={c.key}
              onClick={() => alternarFiltro(c.key)}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                ativo ? 'border-white/40 bg-white/[0.06]' : 'border-slate-800 bg-[#020408] hover:border-slate-600'
              }`}
            >
              <span className="flex items-center justify-between">
                <Icone size={16} style={{ color: c.cor }} />
                {ativo && <span className="text-[9px] font-black uppercase tracking-widest text-white">filtrando</span>}
              </span>
              <p className="mt-2 text-2xl font-black text-white">{valor}</p>
              <p className="text-[10px] font-bold uppercase leading-tight tracking-wider text-slate-400">{c.label}</p>
            </button>
          );
        })}
      </div>

      {/* Lista priorizada */}
      <div className={`${cardCls} p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <RefreshCw size={12} /> Prioridades recomendadas
            {filtro && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white">
                {CARDS.find((c) => c.key === filtro)?.label}
              </span>
            )}
          </p>
          {onAbrirAba && (
            <button
              onClick={() => onAbrirAba('funil_leads')}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300"
            >
              Abrir funil completo <ArrowRight size={11} />
            </button>
          )}
        </div>

        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center">
            <Check size={18} className="mx-auto text-[#10b981]" />
            <p className="mt-2 text-xs text-slate-400">
              {filtro ? 'Nada nesta categoria agora.' : 'Roda limpa. Nenhuma ação pendente hoje.'}
            </p>
          </div>
        ) : (
          <ol className="space-y-2">
            {lista.map((item, i) => {
              const ocupado = processando === item.leadId;
              return (
                <li key={item.id} className="rounded-2xl border border-slate-800 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-black text-white">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold leading-snug text-white">{item.fraseAcao}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          <span className="rounded-full border border-slate-700 px-2 py-0.5 font-black uppercase tracking-wider">
                            {item.tagUrgencia}
                          </span>
                          <span>score {item.score}</span>
                          {item.estagio && <span>· {item.estagio}</span>}
                          {item.telefone && <span>· {item.telefone}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => abrirWhatsApp(item)}
                        disabled={ocupado || !item.telefone}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#10b981]/50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#10b981] transition hover:border-[#10b981] disabled:opacity-40"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </button>
                      <button
                        onClick={() => concluir(item)}
                        disabled={ocupado}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300 transition hover:border-slate-500 disabled:opacity-40"
                      >
                        <Check size={12} /> Concluir
                      </button>
                      <button
                        onClick={() => agendar(item, 1)}
                        disabled={ocupado}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:border-slate-600 disabled:opacity-40"
                        title="Agendar follow-up para amanhã"
                      >
                        <CalendarClock size={12} /> Amanhã
                      </button>
                      <button
                        onClick={() => agendar(item, 7)}
                        disabled={ocupado}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:border-slate-600 disabled:opacity-40"
                        title="Agendar follow-up para daqui a 7 dias"
                      >
                        7 dias
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <p className="mt-3 text-[10px] text-slate-600">
          Ranking calculado a partir do histórico real do lead (visitas, propostas, estágio e último contato).
          Ações registram evento em <code className="text-slate-500">eventos_lead</code> e atualizam o lead.
        </p>
      </div>
    </div>
  );
}
