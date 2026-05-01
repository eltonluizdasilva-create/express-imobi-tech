/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import {
  MessageCircle,
  Sparkles,
  X,
  Send,
  Clock,
  Car,
  User,
  Wrench,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Target,
  Radio,
  Rocket,
  Brain,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Gauge,
  Filter,
  History,
  MessageSquare,
  Info
} from 'lucide-react';

const SERVICOS_BASE = [
  'troca de óleo', 'óleo', 'oleo', 'revisão', 'revisao', 'freio', 'suspensão', 'suspensao',
  'alinhar', 'alinhamento', 'filtro', 'correia', 'embreagem', 'escapamento',
  'motor', 'câmbio', 'cambio', 'radiador', 'bateria', 'pneus', 'borracharia'
];

const TEMPLATE_MENSAGENS = {
  oleo: (c, v, t) => `Olá ${c}! 👋 Notamos que faz *${t}* desde a última troca de óleo do seu *${v}*. \n\nManter a troca em dia é essencial para proteger o motor e evitar gastos maiores no futuro. 💧\n\nQuer que a gente agende uma avaliação gratuita?`,
  revisao: (c, v, t) => `Olá ${c}! 👋 Seu *${v}* está há *${t}* sem uma revisão completa. \n\nRevisões preventivas evitam surpresas e garantem segurança. 🔧\n\nPodemos agendar uma inspeção?`,
  freio: (c, v, t) => `Olá ${c}! 👋 Notamos que faz *${t}* da última verificação de freios do *${v}*. \n\nO sistema de freio é critical para sua segurança. 🛑\n\nVamos fazer uma checagem gratuita?`,
  default: (c, v, t) => `Olá ${c}! 👋 Faz *${t}* desde a última visita do seu *${v}*. \n\nSua satisfação é nossa prioridade. Estamos à disposição para o que precisar! 🚗\n\nPosso ajudar com algo?`
};

function detectarServico(checklist = '') {
  const texto = String(checklist || '').toLowerCase();
  for (const s of SERVICOS_BASE) {
    if (texto.includes(s)) return s;
  }
  return String(checklist || '') || 'Serviço geral';
}

function gerarMensagem(cliente, veiculo, meses) {
  const tempo = meses >= 6 ? '6 meses' : '3 meses';
  const servico = detectarServico('');

  if (servico.includes('óleo') || servico.includes('oleo')) return TEMPLATE_MENSAGENS.oleo(cliente, veiculo, tempo);
  if (servico.includes('revisão') || servico.includes('revisao')) return TEMPLATE_MENSAGENS.revisao(cliente, veiculo, tempo);
  if (servico.includes('freio')) return TEMPLATE_MENSAGENS.freio(cliente, veiculo, tempo);
  return TEMPLATE_MENSAGENS.default(cliente, veiculo, tempo);
}

function tempoDecorrido(dataStr) {
  if (!dataStr) return { dias: 1, meses: 0, texto: `0 meses` };
  let data;
  try {
    if (typeof dataStr === 'object' && dataStr?.toDate) {
      data = dataStr.toDate();
    } else if (dataStr?.seconds) {
      data = new Date(dataStr.seconds * 1000);
    } else if (typeof dataStr === 'string') {
      const brazilMatch = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (brazilMatch) {
        const [, dia, mes, ano] = brazilMatch;
        data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      } else {
        data = new Date(dataStr);
      }
    } else {
      data = new Date(dataStr);
    }
  } catch {
    return { dias: 1, meses: 0, texto: `0 meses` };
  }
  if (isNaN(data.getTime())) {
    return { dias: 1, meses: 0, texto: `0 meses` };
  }

  const agora = new Date();
  const diffMs = agora - data;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = Math.floor(diffDias / 30);

  return { dias: diffDias || 1, meses: diffMeses || 0, texto: `${diffMeses || 0} meses` };
}

export default function AbaEstrategia({ oficinaId, listaCarros }) {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalHistorico, setModalHistorico] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [enviadas, setEnviadas] = useState([]);
  const [pilotoAutomatico, setPilotoAutomatico] = useState(false);
  const [animando, setAnimando] = useState(false);

  const oportunidades = useMemo(() => {
    const base = Array.isArray(listaCarros) ? listaCarros : [];
    if (base.length === 0) return [];

    const oportunist = [];
    base.forEach((d) => {
      const info = tempoDecorrido(d.data_registro || d.data);
      if (!info) return;

      const servico = detectarServico(d.checklist || d.diagnostico || d.detalhesPecas || '');
      const valor = Number(d.total) || Number(d.valor) || 0;

      oportunist.push({
        id: d.id,
        cliente: d.nomeCliente || 'Cliente',
        veiculo: d.modelo || d.veiculo || 'Veículo',
        placa: d.placa || '',
        servico,
        ultimaData: d.data_registro || d.data,
        tempo: info,
        meses: info.meses,
        valor,
        telefone: d.telefone || '',
        frequencia: d.frequencia || 1,
        ltv: d.ltv || valor,
        status: (d.status || '').toLowerCase(),
      });
    });

    oportunist.sort((a, b) => b.meses - a.meses);
    return oportunist;
  }, [listaCarros]);

  const oportunidadesQuentes = oportunidades.filter(o => o.meses >= 6);
  const oportunidadesMornas = oportunidades.filter(o => o.meses >= 3 && o.meses < 6);
  const oportunidadesFrias = oportunidades.filter(o => o.meses < 3);

  const potencial3Meses = oportunidadesMornas.reduce((acc, o) => acc + (o.valor || 0), 0);
  const potencial6Meses = oportunidadesQuentes.reduce((acc, o) => acc + (o.valor || 0), 0);
  const potencialTotal = oportunidades.reduce((acc, o) => acc + (o.valor || 0), 0);

  // ANÁLISE DE PENDENTES
  const osPendentes = useMemo(() => {
    const base = Array.isArray(listaCarros) ? listaCarros : [];
    return base.filter(d => (d.status || '').toLowerCase() !== 'finalizado');
  }, [listaCarros]);

  const potencialPendentes = useMemo(() => {
    return osPendentes.reduce((acc, o) => acc + (Number(o.total) || Number(o.valor) || 0), 0);
  }, [osPendentes]);

  const oportunidadesFiltradas = (() => {
    switch (filtro) {
      case 'quente': return oportunidadesQuentes;
      case 'morno': return oportunidadesMornas;
      case 'frio': return oportunidadesFrias;
      default: return oportunidades;
    }
  })();

  const enviarWhatsApp = (opp) => {
    const texto = encodeURIComponent(gerarMensagem(opp.cliente, opp.veiculo, opp.tempo.meses));
    window.open(`https://wa.me/55${(opp.telefone || '').replace(/\D/g, '')}?text=${texto}`, '_blank');
    setEnviadas(prev => [...prev, opp.id]);
    if (pilotoAutomatico) {
      setAnimando(true);
      setTimeout(() => setAnimando(false), 2000);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const getStatusInfo = (meses) => {
    if (meses >= 6) return { color: 'rose', label: 'Quente', icon: '🔴', tone: 'danger' };
    if (meses >= 3) return { color: 'amber', label: 'Morno', icon: '🟡', tone: 'warning' };
    return { color: 'slate', label: 'Frio', icon: '⚪', tone: 'info' };
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">

      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-indigo-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(79,70,229,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
              <Rocket size={14} />
              Motor de Retenção Ativo
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl uppercase italic">
              Máquina de <span className="text-indigo-500 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Retorno R$</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Identifique automaticamente clientes que precisam voltar e aumente seu faturamento com mensagens IA personalizadas.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPilotoAutomatico(!pilotoAutomatico)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-6 py-3 transition-all duration-300 ${pilotoAutomatico
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-slate-800 bg-slate-900/50 text-slate-400'
                }`}
            >
              <div className={`absolute inset-0 bg-emerald-500/5 transition-opacity ${pilotoAutomatico ? 'opacity-100' : 'opacity-0'}`} />
              <Radio size={18} className={pilotoAutomatico ? 'animate-pulse' : ''} />
              <span className="relative text-xs font-black uppercase tracking-widest">
                {pilotoAutomatico ? 'Piloto Automático Ativo' : 'Ativar Piloto Automático'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* GROWTH METRICS */}
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Próximos 3 Meses" value={formatarMoeda(potencial3Meses)} detail={`${oportunidadesMornas.length} clientes mornos`} icon={<Gauge size={20} />} tone="warning" />
        <MetricCard title="Próximos 6 Meses" value={formatarMoeda(potencial6Meses)} detail={`${oportunidadesQuentes.length} clientes quentes`} icon={<AlertCircle size={20} />} tone="danger" />
        <MetricCard title="Potencial Total" value={formatarMoeda(potencialTotal)} detail="Carteira de oportunidades" icon={<TrendingUp size={20} />} tone="success" />
        <MetricCard title="Potencial Pendente" value={formatarMoeda(potencialPendentes)} detail={`${osPendentes.length} O.S. pendentes`} icon={<Gauge size={20} />} tone="info" />
      </section>

      {/* FILTER BAR */}
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/50 p-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3 px-3 text-slate-500">
          <Filter size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Prioridade:</span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 md:flex">
          <FilterButton label="Todos" count={oportunidades.length} active={filtro === 'todos'} onClick={() => setFiltro('todos')} color="indigo" />
          <FilterButton label="Quente" count={oportunidadesQuentes.length} active={filtro === 'quente'} onClick={() => setFiltro('quente')} color="rose" />
          <FilterButton label="Morno" count={oportunidadesMornas.length} active={filtro === 'morno'} onClick={() => setFiltro('morno')} color="amber" />
          <FilterButton label="Frio" count={oportunidadesFrias.length} active={filtro === 'frio'} onClick={() => setFiltro('frio')} color="slate" />
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Calculando Oportunidades...</p>
        </div>
      ) : oportunidades.length === 0 ? (
        <section className="group relative overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 p-12 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.08),_transparent_70%)]" />
          <div className="relative space-y-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.15)] group-hover:scale-110 transition-transform duration-500">
              <Brain size={48} className="text-indigo-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white md:text-3xl">Seu Cérebro de Retenção está sendo treinado...</h3>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
                O Express Auto Tech analisa automaticamente o histórico dos seus clientes para prever quem precisa voltar.
                Quando houver dados suficientes de Ordens de Serviço finalizadas, as oportunidades aparecerão aqui.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-6 py-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Aguardando mais Ordens de Serviço</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {oportunidadesFiltradas.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              info={getStatusInfo(opp.meses)}
              jaEnviada={enviadas.includes(opp.id)}
              onAction={() => setModal(opp)}
              onHistory={() => setModalHistorico(opp)}
              formatarMoeda={formatarMoeda}
            />
          ))}
        </section>
      )}

      {/* MODAL: HISTÓRICO RÁPIDO */}
      {modalHistorico && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setModalHistorico(null)}>
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Auditoria de Retenção</p>
                <h3 className="mt-1 text-2xl font-black text-white">{modalHistorico.cliente}</h3>
              </div>
              <button onClick={() => setModalHistorico(null)} className="rounded-full bg-slate-900 p-2 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <HistoryRow label="Frequência" value={`${modalHistorico.frequencia}x visitas`} icon={<ArrowUpRight size={14} />} color="indigo" />
              <HistoryRow label="LTV Total" value={formatarMoeda(modalHistorico.ltv)} icon={<TrendingUp size={14} />} color="emerald" />
              <HistoryRow label="Último Serviço" value={modalHistorico.servico} icon={<Wrench size={14} />} color="amber" />
              <HistoryRow label="Próxima Data" value={modalHistorico.meses >= 6 ? 'IMEDIATO' : 'Em breve'} icon={<Gauge size={14} />} color={modalHistorico.meses >= 6 ? 'rose' : 'slate'} />
            </div>

            <button onClick={() => setModalHistorico(null)} className="mt-8 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-slate-800">
              Fechar Auditoria
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MENSAGEM IA */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setModal(null)}>
          <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Sugestão Gerada por IA</p>
                <h3 className="mt-1 text-2xl font-black text-white">Reativar {modal.cliente}</h3>
              </div>
              <button onClick={() => setModal(null)} className="rounded-full bg-slate-900 p-2 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-black/50 p-6 shadow-inner">
              <p className="text-sm font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                {gerarMensagem(modal.cliente, modal.veiculo, modal.tempo.meses)}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-[10px] font-bold text-indigo-400">
              <Info size={16} />
              A IA gerou esta mensagem baseada no serviço de {modal.servico} realizado há {modal.tempo.texto}.
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all">Cancelar</button>
              <button onClick={() => { enviarWhatsApp(modal); setModal(null); }} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                <Send size={16} /> Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-PILOT OVERLAY ANIMATION */}
      {animando && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-600/10 backdrop-blur-md animate-in fade-in duration-500">
          <div className="text-center space-y-6">
            <div className="relative mx-auto h-32 w-32">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30"></div>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.5)]">
                <CheckCircle size={48} className="text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-white uppercase italic tracking-tighter">Missão Cumprida!</p>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 mt-2">Mensagem enviada com sucesso</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SHARED COMPONENTS

function MetricCard({ title, value, detail, icon, tone }) {
  const tones = {
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-emerald-500/10',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-300 shadow-rose-500/10',
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-300 shadow-amber-500/10',
    info: 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300 shadow-indigo-500/10'
  };

  return (
    <div className={`rounded-[28px] border bg-slate-950/80 p-6 shadow-2xl transition-all hover:scale-[1.02] ${tones[tone]}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{title}</span>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">{icon}</div>
      </div>
      <h3 className="text-3xl font-black tracking-tight text-white">{value}</h3>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest opacity-50">{detail}</p>
    </div>
  );
}

function FilterButton({ label, count, active, onClick, color }) {
  const colors = {
    indigo: 'border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 active:bg-indigo-500 text-white',
    rose: 'border-rose-500/20 text-rose-400 hover:bg-rose-500/10 active:bg-rose-500 text-white',
    amber: 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10 active:bg-amber-500 text-white',
    slate: 'border-slate-800 text-slate-500 hover:bg-slate-800 active:bg-slate-700 text-white'
  };

  const activeStyles = {
    indigo: 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/30',
    rose: 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30',
    amber: 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30',
    slate: 'bg-slate-700 text-white border-slate-600'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${active ? activeStyles[color] : colors[color]}`}
    >
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[8px] ${active ? 'bg-white/20' : 'bg-slate-900 border border-white/5'}`}>{count}</span>
    </button>
  );
}

function OpportunityCard({ opp, info, jaEnviada, onAction, onHistory, formatarMoeda }) {
  const colors = {
    rose: 'hover:border-rose-500/40 border-rose-500/10 bg-rose-500/5 shadow-rose-500/5',
    amber: 'hover:border-amber-500/40 border-amber-500/10 bg-amber-500/5 shadow-amber-500/5',
    slate: 'hover:border-slate-700 border-slate-800 bg-slate-900/40 shadow-slate-950'
  };

  const textColors = { rose: 'text-rose-500', amber: 'text-amber-500', slate: 'text-slate-400' };

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-[32px] border p-6 transition-all duration-300 hover:scale-[1.03] shadow-2xl ${colors[info.color]}`}>
      <div className={`absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-${info.color}-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-slate-950 text-xl`}>{info.icon}</div>
            <div>
              <h4 className="text-sm font-black text-white">{opp.cliente}</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{opp.placa}</p>
            </div>
          </div>
          <div className={`rounded-full border border-white/5 bg-black/40 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] ${textColors[info.color]}`}>
            {info.label}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Car size={14} className="opacity-50" />
            <span className="text-xs font-bold truncate">{opp.veiculo}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Wrench size={14} className="opacity-50" />
            <span className="text-[10px] font-black uppercase tracking-widest truncate">{opp.servico}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Ausência</p>
            <p className={`text-sm font-black ${textColors[info.color]}`}>{opp.tempo.texto}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Último Ticket</p>
            <p className="text-sm font-black text-white">{formatarMoeda(opp.valor)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onHistory} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <History size={14} /> Histórico
          </button>
          <button onClick={onAction} className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg ${jaEnviada ? 'bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}>
            <MessageSquare size={14} /> {jaEnviada ? 'Editar' : 'Mensagem IA'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ label, value, icon, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  };

  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
      </div>
      <span className="text-xs font-black uppercase tracking-tighter text-white">{value}</span>
    </div>
  );
}
