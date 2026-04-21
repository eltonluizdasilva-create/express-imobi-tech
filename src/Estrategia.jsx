import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { MessageCircle, Sparkles, X, Send, Clock, Car, User, Wrench, Zap, TrendingUp, AlertCircle, CheckCircle, Target, Radio } from 'lucide-react';

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
  const texto = checklist.toLowerCase();
  for (const s of SERVICOS_BASE) {
    if (texto.includes(s)) return s;
  }
  return checklist || 'Serviço geral';
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
  if (!dataStr) return null;
  let data;
  try {
    if (typeof dataStr === 'object' && dataStr?.toDate) {
      data = dataStr.toDate();
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
    return null;
  }
  if (isNaN(data.getTime())) return null;

  const agora = new Date();
  const diffMs = agora - data;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMeses = Math.floor(diffDias / 30);

  if (diffDias < 0) return null;
  return { dias: diffDias, meses: diffMeses, texto: diffMeses >= 6 ? `${diffMeses} meses` : `${diffMeses} meses` };
}

export default function AbaEstrategia({ oficinaId }) {
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [modalHistorico, setModalHistorico] = useState(null);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'quente', 'morno', 'frio'
  const [enviadas, setEnviadas] = useState([]);
  const [pilotoAutomatico, setPilotoAutomatico] = useState(false);
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    if (!oficinaId) { setLoading(false); return; }

    const buscarOportunidades = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'oficinas', oficinaId, 'os'), orderBy('data_registro', 'desc'))
        );

        const oportunist = [];

        snap.forEach((doc) => {
          const d = doc.data();

          const info = tempoDecorrido(d.data_registro || d.data);
          if (!info) return;

          const limite = filtro === 6 ? -9999 : -9999;
          if (info.dias < limite) return;

          const servico = detectarServico(d.checklist || d.diagnostico || d.detalhesPecas || '');
          const valor = Number(d.total) || 0;

          oportunist.push({
            id: doc.id,
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
          });
        });

        oportunist.sort((a, b) => b.meses - a.meses);
        setOportunidades(oportunist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    buscarOportunidades();
  }, [oficinaId]);

  // ========== CÁLCULOS DE POTENCIAL FINANCEIRO ==========
  const oportunidadesQuentes = oportunidades.filter(o => o.meses >= 6);
  const oportunidadesMornas = oportunidades.filter(o => o.meses >= 3 && o.meses < 6);
  const oportunidadesFrias = oportunidades.filter(o => o.meses < 3);

  const potencial3Meses = oportunidadesMornas.reduce((acc, o) => acc + (o.valor || 0), 0);
  const potencial6Meses = oportunidadesQuentes.reduce((acc, o) => acc + (o.valor || 0), 0);
  const potencialFrio = oportunidadesFrias.reduce((acc, o) => acc + (o.valor || 0), 0);
  const potencialTotal = potencial3Meses + potencial6Meses + potencialFrio;

  // ========== FILTRO DE STATUS ==========
  const oportunidadesFiltradas = (() => {
    switch (filtro) {
      case 'quente':
        return oportunidadesQuentes;
      case 'morno':
        return oportunidadesMornas;
      case 'frio':
        return oportunidadesFrias;
      default:
        return oportunidades;
    }
  })();

  const abrirModal = (opp) => setModal(opp);
  const fecharModal = () => setModal(null);
  const abrirModalHistorico = (opp) => setModalHistorico(opp);
  const fecharModalHistorico = () => setModalHistorico(null);

  const mensagemIA = (opp) => {
    const texto = gerarMensagem(opp.cliente, opp.veiculo, opp.tempo.meses);
    return texto;
  };

  const enviarWhatsApp = (opp) => {
    const texto = encodeURIComponent(mensagemIA(opp));
    window.open(`https://wa.me/55${(opp.telefone || '').replace(/\D/g, '')}?text=${texto}`, '_blank');
    setEnviadas(prev => [...prev, opp.id]);

    // Simular piloto automático
    if (pilotoAutomatico) {
      setAnimando(true);
      setTimeout(() => setAnimando(false), 2000);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const getStatusColor = (meses) => {
    if (meses >= 6) return { bg: 'bg-red-600/10', border: 'border-red-600/30', text: 'text-red-500', label: '🔴 QUENTE', badge: 'bg-red-600' };
    if (meses >= 3) return { bg: 'bg-yellow-600/10', border: 'border-yellow-600/30', text: 'text-yellow-500', label: '🟡 MORNO', badge: 'bg-yellow-600' };
    return { bg: 'bg-gray-600/10', border: 'border-gray-600/30', text: 'text-gray-500', label: '⚪ FRIO', badge: 'bg-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-6 pb-40 font-sans">

      {/* ========== CABEÇALHO COM PILOTO AUTOMÁTICO ========== */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black mb-2">🚀 MÁQUINA DE RETORNO R$</h1>
          <p className="text-sm text-zinc-400">Identifica e recupera carteira de clientes com ROI automático</p>
        </div>

        {/* TOGGLE PILOTO AUTOMÁTICO */}
        <button
          onClick={() => setPilotoAutomatico(!pilotoAutomatico)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${pilotoAutomatico
            ? 'bg-green-600/20 border border-green-600/50 text-green-400'
            : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-zinc-300'
            }`}
        >
          <Radio size={18} className={pilotoAutomatico ? 'animate-pulse' : ''} />
          {pilotoAutomatico ? 'PILOTO AUTOMÁTICO ATIVO' : 'Ativar Piloto Automático'}
        </button>
      </div>

      {/* ========== PAINEL DE POTENCIAL FINANCEIRO (TOPO) ========== */}
      {oportunidades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* CARD: PRÓXIMOS 3 MESES */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/10 rounded-3xl border border-green-600/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/5 rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-green-400" />
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Próximos 3 Meses</p>
              </div>
              <p className="text-3xl font-black text-white mb-2">{formatarMoeda(potencial3Meses)}</p>
              <p className="text-xs text-green-400/80">{oportunidadesMornas.length} clientes para reativar</p>
            </div>
          </div>

          {/* CARD: PRÓXIMOS 6 MESES */}
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/10 rounded-3xl border border-orange-600/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-orange-400" />
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Próximos 6 Meses</p>
              </div>
              <p className="text-3xl font-black text-white mb-2">{formatarMoeda(potencial6Meses)}</p>
              <p className="text-xs text-orange-400/80">{oportunidadesQuentes.length} clientes QUENTES 🔴</p>
            </div>
          </div>

          {/* CARD: ACIMA DE 12 MESES */}
          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/10 rounded-3xl border border-purple-600/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full -mr-16 -mt-16" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-400" />
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Potencial Total</p>
              </div>
              <p className="text-3xl font-black text-white mb-2">{formatarMoeda(potencialTotal)}</p>
              <p className="text-xs text-purple-400/80">{oportunidades.length} oportunidades na carteira</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== SEMÁFORO DE STATUS INTELIGENTE ========== */}
      {oportunidades.length > 0 && (
        <div className="mb-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Filtro de Prioridade</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setFiltro('todos')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${filtro === 'todos'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
            >
              📊 Todos ({oportunidades.length})
            </button>
            <button
              onClick={() => setFiltro('quente')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${filtro === 'quente'
                ? 'bg-red-600 text-white'
                : 'bg-red-600/10 text-red-400 hover:bg-red-600/20'
                }`}
            >
              🔴 Quente ({oportunidadesQuentes.length})
            </button>
            <button
              onClick={() => setFiltro('morno')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${filtro === 'morno'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-600/10 text-yellow-400 hover:bg-yellow-600/20'
                }`}
            >
              🟡 Morno ({oportunidadesMornas.length})
            </button>
            <button
              onClick={() => setFiltro('frio')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${filtro === 'frio'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-600/10 text-gray-400 hover:bg-gray-600/20'
                }`}
            >
              ⚪ Frio ({oportunidadesFrias.length})
            </button>
          </div>
        </div>
      )}

      {/* ========== CARDS DE CLIENTES ========== */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto animate-spin text-red-500 mb-4" />
            <p className="text-zinc-400">Carregando oportunidades...</p>
          </div>
        </div>
      ) : oportunidadesFiltradas.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 pointer-events-none rounded-3xl" />
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-600/20">
              <Sparkles size={36} className="text-purple-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">
              Seu Cérebro de Retenção está sendo treinado...
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-2xl mx-auto">
              O Oficina IA analisa automaticamente o histórico dos seus clientes para prever quem precisa voltar. Conforme você registra e conclui Ordens de Serviço, nosso sistema identificará serviços (como troca de óleo e revisões) realizados há mais de 3, 6 ou 12 meses.
              <br /><br />
              Quando for o momento exato de chamar o cliente de volta, os cards aparecerão aqui com mensagens de WhatsApp geradas por Inteligência Artificial prontas para envio!
            </p>
            <div className="bg-black/60 border border-zinc-700 rounded-2xl px-5 py-3 inline-flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[11px] text-zinc-400 font-medium">
                Continue cadastrando suas O.S. diariamente na aba <span className="text-red-400 font-bold">Mecânica</span> ou <span className="text-red-400 font-bold">Óleo</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {oportunidadesFiltradas.map((opp) => {
            const jaEnviada = enviadas.includes(opp.id);
            const statusColor = getStatusColor(opp.meses);

            return (
              <div
                key={opp.id}
                className={`${statusColor.bg} border ${statusColor.border} rounded-3xl p-6 hover:border-white/20 transition-all relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:bg-white/10 transition-all" />

                {/* BADGE STATUS */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 rounded-full px-3 py-1 text-xs font-black">
                  <span className={`w-2 h-2 ${statusColor.badge} rounded-full`} />
                  <span className={statusColor.text}>{statusColor.label}</span>
                </div>

                <div className="relative">
                  {/* CLIENTE */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 ${statusColor.bg} rounded-full flex items-center justify-center border ${statusColor.border} flex-shrink-0`}>
                      <User size={18} className={statusColor.text} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black truncate">{opp.cliente}</p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest truncate">{opp.placa}</p>
                    </div>
                  </div>

                  {/* VEÍCULO */}
                  <div className="flex items-center gap-2 mb-3 text-zinc-400">
                    <Car size={14} className="flex-shrink-0" />
                    <p className="text-xs truncate">{opp.veiculo}</p>
                  </div>

                  {/* SERVIÇO */}
                  <div className="flex items-center gap-2 mb-4 text-zinc-500">
                    <Wrench size={14} className="flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest truncate">{opp.servico}</p>
                  </div>

                  {/* TEMPO */}
                  <div className="flex items-center gap-2 mb-5 bg-black/40 rounded-xl px-3 py-2">
                    <Clock size={14} className={statusColor.text} />
                    <p className="text-[10px] text-zinc-400 font-bold">
                      Último contato: <span className={`${statusColor.text} font-black`}>{opp.tempo.texto}</span>
                    </p>
                  </div>

                  {/* VALOR DO ÚLTMO SERVIÇO */}
                  <div className="bg-black/40 rounded-xl px-3 py-2 mb-5">
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Valor do último serviço</p>
                    <p className="text-lg font-black text-white">{formatarMoeda(opp.valor)}</p>
                  </div>

                  {/* BOTÕES */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirModalHistorico(opp)}
                      className="flex-1 py-2 bg-zinc-800/60 hover:bg-zinc-700/60 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors border border-zinc-700/50"
                    >
                      📊 Ver Histórico
                    </button>
                    <button
                      onClick={() => abrirModal(opp)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${statusColor.badge} text-white hover:opacity-90 shadow-lg`}
                    >
                      <Sparkles size={12} />
                      {jaEnviada ? 'Editar' : 'Mensagem IA'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== MODAL: HISTÓRICO RÁPIDO ========== */}
      {modalHistorico && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={fecharModalHistorico}>
          <div
            className="bg-zinc-900 rounded-3xl border border-zinc-800 w-full max-w-md p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={fecharModalHistorico}
              className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <X size={14} />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-black text-white mb-1">📊 Histórico do Cliente</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{modalHistorico.cliente} — {modalHistorico.placa}</p>
            </div>

            {/* FREQUÊNCIA */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-4 mb-4">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Frequência</p>
              <p className="text-2xl font-black text-white">{modalHistorico.frequencia}x</p>
              <p className="text-[9px] text-blue-400/70">visitas na oficina</p>
            </div>

            {/* ÚLTIMO SERVIÇO */}
            <div className="bg-purple-600/10 border border-purple-600/30 rounded-2xl p-4 mb-4">
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-2">Último Serviço</p>
              <p className="text-sm font-black text-white capitalize mb-1">{modalHistorico.servico}</p>
              <p className="text-[9px] text-purple-400/70">
                {typeof modalHistorico.ultimaData === 'object' && modalHistorico.ultimaData.toDate
                  ? modalHistorico.ultimaData.toDate().toLocaleDateString('pt-BR')
                  : String(modalHistorico.ultimaData).substring(0, 10)}
              </p>
            </div>

            {/* LTV (LIFETIME VALUE) */}
            <div className="bg-green-600/10 border border-green-600/30 rounded-2xl p-4 mb-4">
              <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-2">LTV (Valor Total)</p>
              <p className="text-2xl font-black text-white">{formatarMoeda(modalHistorico.ltv)}</p>
              <p className="text-[9px] text-green-400/70">investido na oficina</p>
            </div>

            {/* PRÓXIMA DATA ESTIMADA */}
            <div className="bg-orange-600/10 border border-orange-600/30 rounded-2xl p-4 mb-6">
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-2">Próxima Data Estimada</p>
              <p className="text-lg font-black text-white">
                {modalHistorico.meses >= 6 ? '🔴 AGORA' : modalHistorico.meses >= 3 ? '🟡 Este mês' : '⚪ Próximos dias'}
              </p>
              <p className="text-[9px] text-orange-400/70">baseado no histórico</p>
            </div>

            <button
              onClick={fecharModalHistorico}
              className="w-full py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ========== MODAL: MENSAGEM IA ========== */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={fecharModal}>
          <div
            className="bg-zinc-900 rounded-3xl border border-zinc-800 w-full max-w-lg p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={fecharModal}
              className="absolute top-4 right-4 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <X size={14} />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-black text-red-500 uppercase tracking-tight mb-1">🤖 Sugestão de Mensagem</h3>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{modal.cliente} — {modal.veiculo}</p>
            </div>

            {/* PREVIEW DA MENSAGEM */}
            <div className="bg-black/60 rounded-2xl border border-zinc-800 p-4 mb-5">
              <p className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                {mensagemIA(modal)}
              </p>
            </div>

            {/* STATUS PILOTO AUTOMÁTICO */}
            {pilotoAutomatico && (
              <div className="bg-green-600/10 border border-green-600/30 rounded-2xl p-3 mb-5 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-green-400 font-bold">Piloto Automático enviará para WhatsApp</p>
              </div>
            )}

            <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest mb-5">
              💡 A mensagem é apenas uma sugestão. Personalize antes de enviar.
            </p>

            {/* AÇÕES */}
            <div className="flex gap-3">
              <button
                onClick={fecharModal}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => { enviarWhatsApp(modal); fecharModal(); }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-600/20"
              >
                <Send size={14} />
                Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== EFEITO VISUAL PILOTO AUTOMÁTICO ========== */}
      {animando && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 border-2 border-green-500/30 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-green-500 font-black text-sm">✓ Enviado!</div>
          </div>
        </div>
      )}
    </div>
  );
}
