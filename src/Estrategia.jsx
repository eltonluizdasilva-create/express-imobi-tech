import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { MessageCircle, Sparkles, X, Send, Clock, Car, User, Wrench } from 'lucide-react';

const SERVICOS_BASE = [
  'troca de óleo', 'óleo', 'oleo', 'revisão', 'revisao', 'freio', 'suspensão', 'suspensao',
  'alinhar', 'alinhamento', 'filtro', 'correia', 'embreagem', 'embreagem', 'escapamento',
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
  const [filtro, setFiltro] = useState(3);
  const [enviadas, setEnviadas] = useState([]);

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
          console.log('OS lida:', doc.id, '| Campo data_registro:', d.data_registro, '| Campo data:', d.data, '| Info:', info);
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
  }, [oficinaId, filtro]);

  const potencialTotal = oportunidades.reduce((acc, o) => acc + (o.valor || 0), 0);
  const totalMensagens = oportunidades.length;

  const abrirModal = (opp) => setModal(opp);
  const fecharModal = () => setModal(null);

  const mensagemIA = (opp) => {
    const texto = gerarMensagem(opp.cliente, opp.veiculo, opp.tempo.meses);
    return texto;
  };

  const enviarWhatsApp = (opp) => {
    const texto = encodeURIComponent(mensagemIA(opp));
    window.open(`https://wa.me/55${(opp.telefone || '').replace(/\D/g, '')}?text=${texto}`, '_blank');
    setEnviadas(prev => [...prev, opp.id]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-40 font-sans">
      {/* CABEÇALHO */}
      <div className="bg-zinc-900 rounded-[40px] border border-zinc-800 p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-red-500 mb-1">
              🎯 Cérebro de Retenção — IA
            </h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Máquina Preditiva de Oportunidades
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-black/60 rounded-2xl px-6 py-4 border border-zinc-800 text-center">
              <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Oportunidades</p>
              <p className="text-2xl font-black text-red-500">{totalMensagens}</p>
            </div>
            <div className="bg-black/60 rounded-2xl px-6 py-4 border border-zinc-800 text-center">
              <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Receita Potencial</p>
              <p className="text-2xl font-black text-green-400">R$ {potencialTotal.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* FILTRO DE TEMPO */}
        <div className="flex gap-3 mt-6">
          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest flex items-center">Filtrar:</span>
          {[3, 6, 12].map((mes) => (
            <button
              key={mes}
              onClick={() => setFiltro(mes)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                filtro === mes
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              +{mes} meses
            </button>
          ))}
        </div>
      </div>

      {/* ALERTA DE POTENCIAL */}
      {totalMensagens > 0 && (
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-600/20 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">⚠️ Oportunidades identificadas</p>
            <p className="text-zinc-400 text-[10px] mt-0.5">
              {totalMensagens} clientes não retornam há mais de {filtro} meses. Potencial de receita: <strong className="text-green-400">R$ {potencialTotal.toLocaleString('pt-BR')}</strong>
            </p>
          </div>
        </div>
      )}

      {/* GRID DE CARDS */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Sincronizando dados com IA...</p>
          </div>
        </div>
      ) : oportunidades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-zinc-900 rounded-[40px] border border-zinc-800 p-10 text-center max-w-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-orange-600/5 pointer-events-none rounded-[40px]" />
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/20">
                <Sparkles size={36} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-3">
                Seu Cérebro de Retenção está sendo treinado...
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                O Oficina IA analisa automaticamente o histórico dos seus clientes para prever quem precisa voltar. Conforme você registra e conclui Ordens de Serviço, nosso sistema identificará serviços (como troca de óleo e revisões) realizados há mais de 3, 6 ou 12 meses.
                <br /><br />
                Quando for o momento exato de chamar o cliente de volta, os cards aparecerão aqui com mensagens de WhatsApp geradas por Inteligência Artificial prontas para envio, ajudando você a vender mais no piloto automático!
              </p>
              <div className="bg-black/60 border border-zinc-700 rounded-2xl px-5 py-3 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                <p className="text-[11px] text-zinc-400 font-medium">
                  Continue cadastrando suas O.S. diariamente na aba <span className="text-red-400 font-bold">Mecânica</span> ou <span className="text-red-400 font-bold">Óleo</span> para alimentar a IA
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {oportunidades.map((opp) => {
            const jaEnviada = enviadas.includes(opp.id);
            return (
              <div
                key={opp.id}
                className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-6 hover:border-red-600/30 transition-all relative"
              >
                {/* BADGE URGÊNCIA */}
                {opp.meses >= 6 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                    🔴 URGENTE
                  </div>
                )}
                {opp.meses >= 3 && opp.meses < 6 && (
                  <div className="absolute top-4 right-4 bg-yellow-600 text-black text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                    🟡 ALERTA
                  </div>
                )}

                {/* CLIENTE */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-600/10 rounded-full flex items-center justify-center border border-red-600/20 flex-shrink-0">
                    <User size={16} className="text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black truncate">{opp.cliente}</p>
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest truncate">{opp.placa}</p>
                  </div>
                </div>

                {/* VEÍCULO */}
                <div className="flex items-center gap-2 mb-3">
                  <Car size={14} className="text-zinc-600 flex-shrink-0" />
                  <p className="text-xs text-zinc-400 truncate">{opp.veiculo}</p>
                </div>

                {/* SERVIÇO */}
                <div className="flex items-center gap-2 mb-4">
                  <Wrench size={14} className="text-zinc-600 flex-shrink-0" />
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                    {opp.servico}
                  </p>
                </div>

                {/* TEMPO */}
                <div className="flex items-center gap-2 mb-5 bg-black/40 rounded-xl px-3 py-2">
                  <Clock size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-[10px] text-zinc-400 font-bold">
                    Último contato há <span className="text-red-400 font-black">{opp.tempo.texto}</span>
                  </p>
                </div>

                {/* BOTÃO IA */}
                <button
                  onClick={() => abrirModal(opp)}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  <Sparkles size={14} />
                  {jaEnviada ? '✏️ Editar Mensagem' : '🤖 Gerar Mensagem IA'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE MENSAGEM IA */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={fecharModal}>
          <div
            className="bg-zinc-900 rounded-[40px] border border-zinc-800 w-full max-w-lg p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER MODAL */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-red-500 uppercase tracking-tight">🤖 Sugestão de Mensagem</h3>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{modal.cliente} — {modal.veiculo}</p>
              </div>
              <button
                onClick={fecharModal}
                className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* preview da mensagem */}
            <div className="bg-black/60 rounded-2xl border border-zinc-800 p-4 mb-5">
              <p className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                {mensagemIA(modal)}
              </p>
            </div>

            {/* NOTA */}
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
    </div>
  );
}
