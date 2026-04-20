import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { classificarRetorno } from '../lib/utils';
import { MAIN_COLOR, GREEN_MONEY, VENCIDO_COLOR, WARN_RED, WARN_YELLOW, BLUE_INFO } from '../lib/constants';

// ============================================
// 🧠 MOTOR DE REGRAS DE RETORNO HIPER-PERSONALIZADO
// ============================================

const REGRAS_RETORNO = {
  'Óleo': (retorno) => {
    const tipoVeiculo = (retorno.tipoVeiculo || '').toUpperCase();
    const kit = (retorno.kit || '').toUpperCase();
    let dias, badge;
    if (tipoVeiculo === 'MOTO') { dias = 90; badge = '[ÓLEO - MOTO]'; }
    else if (kit === 'SEVERO') { dias = 90; badge = '[ÓLEO - USO SEVERO]'; }
    else { dias = 180; badge = '[ÓLEO - NORMAL]'; }
    const mensagem = `Olá ${retorno.nomeCliente || ''}! O óleo do seu ${retorno.modelo || 'veículo'} está chegando no prazo de troca. Manter o óleo em dia evita a borra no motor e gastos absurdos. Vamos agendar a troca?`;
    return { dias, badge, mensagem, modulo: 'Óleo' };
  },
  'Elétrica': (retorno) => {
    const garantiaMeses = parseInt(retorno.garantiaBateria) || 12;
    const dias = (garantiaMeses * 30) - 30;
    const badge = '[FIM DE GARANTIA BATERIA]';
    const mensagem = `Olá ${retorno.nomeCliente || ''}! A garantia da sua bateria está quase vencendo no próximo mês. Passe aqui na oficina para fazermos um teste gratuito de vida útil e alternador antes que a garantia acabe!`;
    return { dias, badge, mensagem, modulo: 'Elétrica' };
  },
  'Ar-Condicionado': (retorno) => {
    const servicos = retorno.servicosRealizados || [];
    const incluiHigienizacao = servicos.some(s => (s || '').toLowerCase().includes('higienização') || (s || '').toLowerCase().includes('higienizacao'));
    const incluiFiltro = servicos.some(s => (s || '').toLowerCase().includes('filtro de cabine') || (s || '').toLowerCase().includes('filtro cabine'));
    const dias = 180;
    const badge = incluiHigienizacao || incluiFiltro ? '[AR - HIGIENIZAÇÃO]' : '[AR - MANUTENÇÃO]';
    const mensagem = `Olá ${retorno.nomeCliente || ''}! Já faz 6 meses desde a última higienização do ar do seu ${retorno.modelo || 'veículo'}. Respire ar limpo! Vamos agendar a troca do filtro de cabine e uma nova higienização?`;
    return { dias, badge, mensagem, modulo: 'Ar-Condicionado' };
  },
  'Estética': (retorno) => {
    const servicos = retorno.servicosRealizados || [];
    const temCoating = servicos.some(s => (s || '').toLowerCase().includes('coating') || (s || '').toLowerCase().includes('vitrificação') || (s || '').toLowerCase().includes('vitrificacao') || (s || '').toLowerCase().includes('cerâmico') || (s || '').toLowerCase().includes('ceramico'));
    if (temCoating) {
      return { dias: 365, badge: '[COATING - MANUTENÇÃO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! A vitrificação do seu ${retorno.modelo || 'veículo'} está completando 1 ano. Para não perder a proteção, precisamos fazer a manutenção anual. Vamos agendar?`, modulo: 'Estética' };
    }
    return { dias: 30, badge: '[ESTÉTICA - FIDELIZAÇÃO]', mensagem: `Olá ${retorno.nomeCliente || ''}! Que tal dar aquele brilho no seu ${retorno.modelo || 'veículo'} pro final de semana? Tem um horário livre aqui hoje!`, modulo: 'Estética' };
  },
  'Lava Jato': (retorno) => {
    const servicos = retorno.servicosRealizados || [];
    const temCoating = servicos.some(s => (s || '').toLowerCase().includes('coating') || (s || '').toLowerCase().includes('vitrificação') || (s || '').toLowerCase().includes('vitrificacao') || (s || '').toLowerCase().includes('cerâmico') || (s || '').toLowerCase().includes('ceramico'));
    if (temCoating) {
      return { dias: 365, badge: '[COATING - MANUTENÇÃO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! A vitrificação do seu ${retorno.modelo || 'veículo'} está completando 1 ano. Para não perder a proteção, precisamos fazer a manutenção anual. Vamos agendar?`, modulo: 'Lava Jato' };
    }
    return { dias: 30, badge: '[LAVA JATO - FIDELIZAÇÃO]', mensagem: `Olá ${retorno.nomeCliente || ''}! Que tal dar aquele brilho no seu ${retorno.modelo || 'veículo'} pro final de semana? Tem um horário livre aqui hoje!`, modulo: 'Lava Jato' };
  },
  'Injeção': (retorno) => ({ dias: 365, badge: '[INJEÇÃO - PREVENTIVO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Faz 1 ano que passamos o scanner e revisamos a injeção do seu ${retorno.modelo || 'veículo'}. Vamos fazer uma leitura preventiva para garantir economia de combustível?`, modulo: 'Injeção' }),
  'Injeção Eletrônica': (retorno) => ({ dias: 365, badge: '[INJEÇÃO - PREVENTIVO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Faz 1 ano que passamos o scanner e revisamos a injeção do seu ${retorno.modelo || 'veículo'}. Vamos fazer uma leitura preventiva para garantir economia de combustível?`, modulo: 'Injeção Eletrônica' }),
  'Revisão': (retorno) => ({ dias: 365, badge: '[REVISÃO - CHECK-UP ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Já faz 1 ano da sua grande revisão com a gente. A segurança da sua família vem primeiro. Vamos encostar o ${retorno.modelo || 'veículo'} para aquele check-up de 40 itens?`, modulo: 'Revisão' }),
  'ModuloRevisao': (retorno) => ({ dias: 365, badge: '[REVISÃO - CHECK-UP ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Já faz 1 ano da sua grande revisão com a gente. A segurança da sua família vem primeiro. Vamos encostar o ${retorno.modelo || 'veículo'} para aquele check-up de 40 itens?`, modulo: 'Revisão' }),
};

const calcularGatilhoRetorno = (retorno) => {
  const categoria = retorno.categoria || '';
  const servico = retorno.servico || retorno.servicoLabel || '';
  if (REGRAS_RETORNO[categoria]) return REGRAS_RETORNO[categoria](retorno);
  for (const [chave, regra] of Object.entries(REGRAS_RETORNO)) {
    if (categoria.toLowerCase().includes(chave.toLowerCase()) || servico.toLowerCase().includes(chave.toLowerCase())) {
      return regra(retorno);
    }
  }
  return { dias: 180, badge: '[RETORNO PADRÃO]', mensagem: `Olá ${retorno.nomeCliente || ''}! Seu retorno de ${servico || 'manutenção'} está se aproximando. Vamos agendar?`, modulo: 'Geral' };
};

const calcularDataVencimento = (dataServico, dias) => {
  if (!dataServico) return null;
  const data = new Date(dataServico);
  data.setDate(data.getDate() + dias);
  return data.toISOString();
};

// 📊 Helper para classificar retorno com base na data de vencimento REAL
const classificarPorDataReal = (dataVencimento, statusRetorno) => {
  if (statusRetorno === 'agendado' || statusRetorno === 'concluido') return statusRetorno;
  if (!dataVencimento) return 'ok';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return 'vencido';
  if (diffDias <= 7) return 'urgente';
  if (diffDias <= 15) return 'aviso';
  return 'ok';
};

const ICONES_CATEGORIA = {
  'Mecânica': '🔧', 'Óleo': '🛢️', 'Alinhamento': '⚙️',
  'Estética': '✨', 'Lava Jato': '🫧', 'Elétrica': '⚡',
  'Ar-Condicionado': '❄️', 'Funilaria': '🚗', 'Amortecedor': '🧰',
  'Injeção': '🛠️', 'Pneus': '🛞', 'Escapamento': '🪛',
  'Motos': '🏍️', 'Híbridos': '🔋', 'Elétricos': '🔌', 'Revisão': '📋',
};

// 🃏 CardRetorno com Badge do Gatilho
const CardRetorno = ({ retorno, tipo, onAbrirWhatsApp, onAgendar, onConcluir, onDesfazer }) => {
  const CORES = { vencido: VENCIDO_COLOR, urgente: WARN_RED, aviso: WARN_YELLOW, agendado: BLUE_INFO, ok: GREEN_MONEY };
  const cor = CORES[tipo] || '#555';
  const iconeCategoria = ICONES_CATEGORIA[retorno.categoria] || '📅';
  const gatilho = useMemo(() => calcularGatilhoRetorno(retorno), [retorno]);

  return (
    <div style={{ background: '#0a0a0a', borderLeft: `4px solid ${cor}`, borderRadius: '0 8px 8px 0', marginBottom: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <div>
        <p style={{ margin: 0, color: 'white', fontWeight: 'bold' }}>{retorno.nomeCliente || 'Cliente sem nome'}</p>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>{retorno.placa} - {retorno.modelo}</p>
        <p style={{ margin: '6px 0 0', color: '#bbb', fontSize: '11px', fontWeight: 'bold' }}>
          {iconeCategoria} {retorno.categoria || 'Retorno'} · {retorno.servicoLabel || retorno.servico || 'Serviço'}
        </p>
        {gatilho?.badge && (
          <span style={{ display: 'inline-block', background: '#1a1a1a', color: MAIN_COLOR, fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', border: `1px solid ${cor}` }}>{gatilho.badge}</span>
        )}
        {tipo === 'agendado' && retorno.dataAgendamento && (
          <p style={{ margin: '4px 0 0', color: BLUE_INFO, fontSize: '12px', fontWeight: 'bold' }}>Agendado para: {retorno.dataAgendamento}</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {tipo === 'agendado' ? (
          <>
            <button onClick={() => onConcluir(retorno)} style={{ background: GREEN_MONEY, color: 'black', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Concluir</button>
            <button onClick={() => onDesfazer(retorno)} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Desfazer</button>
          </>
        ) : (
          <>
            <button onClick={() => onAbrirWhatsApp(retorno, tipo, gatilho?.mensagem)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>WhatsApp</button>
            <button onClick={() => onAgendar(retorno)} style={{ background: BLUE_INFO, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Agendar</button>
          </>
        )}
      </div>
    </div>
  );
};

const ModalAgendar = ({ retorno, onConfirmar, onFechar }) => {
  const [dataHora, setDataHora] = useState('');
  const formatarDataHora = (valor) => {
    if (!valor) return '';
    const d = new Date(valor);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const handleConfirmar = () => {
    if (!dataHora) return alert('Por favor, selecione uma data e horário.');
    onConfirmar(retorno, dataHora, formatarDataHora(dataHora));
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
        <h3 style={{ color: '#3b82f6', margin: '0 0 8px' }}>Agendar Retorno</h3>
        <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>{retorno?.nomeCliente || 'Cliente'} — {retorno?.placa || ''}</p>
        <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Data e Horário:</label>
        <input type="datetime-local" value={dataHora} onChange={e => setDataHora(e.target.value)} style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleConfirmar} style={{ flex: 1, padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}>Confirmar e enviar WhatsApp</button>
          <button onClick={onFechar} style={{ padding: '14px 18px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>X</button>
        </div>
      </div>
    </div>
  );
};

function GestaoRetorno({ nomeOficina, oficinaId, abrirWhatsAppFn }) {
  const [retornos, setRetornos] = useState([]);
  const [retornoSelecionado, setRetornoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busca, setBusca] = useState('');
  
  // ✅ CORREÇÃO 1: Estado para contadores dinâmicos
  const [contadores, setContadores] = useState({ vencido: 0, urgente: 0, aviso: 0, agendado: 0, ok: 0 });

  useEffect(() => {
    if (!oficinaId) return undefined;
    const unsub = onSnapshot(collection(db, 'oficinas', oficinaId, 'retornos'), (snapshot) => {
      setRetornos(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
    return () => unsub();
  }, [oficinaId]);

  // ✅ CORREÇÃO 1: useEffect que calcula contadores com base na data REAL de vencimento
  useEffect(() => {
    const novosContadores = { vencido: 0, urgente: 0, aviso: 0, agendado: 0, ok: 0 };
    
    retornos.forEach(retorno => {
      const gatilho = calcularGatilhoRetorno(retorno);
      let dataVencimentoCalculada = retorno.dataVencimento;
      
      if (retorno.dataServico && gatilho?.dias && !retorno.dataVencimentoForcada) {
        dataVencimentoCalculada = calcularDataVencimento(retorno.dataServico, gatilho.dias);
      }
      
      // Classificação baseada na data REAL, não apenas no status do banco
      const tipoReal = classificarPorDataReal(dataVencimentoCalculada, retorno.statusRetorno);
      
      if (novosContadores[tipoReal] !== undefined) {
        novosContadores[tipoReal] += 1;
      }
    });
    
    setContadores(novosContadores);
  }, [retornos]); // Recalcula sempre que a lista de retornos mudar

  const ORDEM = { vencido: 0, urgente: 1, aviso: 2, agendado: 3, ok: 4 };

  const retornosComStatus = useMemo(() => {
    return retornos
      .map((retorno) => {
        const gatilho = calcularGatilhoRetorno(retorno);
        let dataVencimentoCalculada = retorno.dataVencimento;
        if (retorno.dataServico && gatilho?.dias && !retorno.dataVencimentoForcada) {
          dataVencimentoCalculada = calcularDataVencimento(retorno.dataServico, gatilho.dias);
        }
        const retornoComVencimento = { ...retorno, dataVencimento: dataVencimentoCalculada, _gatilho: gatilho };
        // Usa a classificação REAL baseada na data
        return { ...retornoComVencimento, _tipo: classificarPorDataReal(dataVencimentoCalculada, retorno.statusRetorno) };
      })
      .sort((a, b) => (ORDEM[a._tipo] ?? 5) - (ORDEM[b._tipo] ?? 5));
  }, [retornos]);

  const categoriasDisponiveis = useMemo(() => 
    [...new Set(retornosComStatus.map((r) => r.categoria).filter(Boolean))], 
  [retornosComStatus]);

  const retornosFiltrados = useMemo(() => {
    return retornosComStatus.filter((retorno) => {
      const matchStatus = filtroStatus === 'todos' || retorno._tipo === filtroStatus;
      const matchCategoria = filtroCategoria === 'todas' || retorno.categoria === filtroCategoria;
      const term = busca.toLowerCase();
      const matchBusca = !busca ||
        (retorno.nomeCliente || '').toLowerCase().includes(term) ||
        (retorno.placa || '').toLowerCase().includes(term) ||
        (retorno.modelo || '').toLowerCase().includes(term) ||
        (retorno.servicoLabel || '').toLowerCase().includes(term);
      return matchStatus && matchCategoria && matchBusca;
    });
  }, [retornosComStatus, filtroStatus, filtroCategoria, busca]);

  const faturamentoPrevisto = useMemo(() =>
    retornosComStatus.filter((r) => ['vencido', 'urgente', 'aviso'].includes(r._tipo))
      .reduce((acc, r) => acc + (Number(r.valorTotal) || 0), 0),
  [retornosComStatus]);

  const fmtMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAgendar = async (retorno, _dataHora, dataFormatada) => {
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'retornos', retorno.id), {
        statusRetorno: 'agendado', dataAgendamento: dataFormatada,
      });
      const msgBase = retorno._gatilho?.mensagem || `Olá${retorno.nomeCliente ? ` ${retorno.nomeCliente}` : ''}! Horário confirmado para *${dataFormatada}*.\nNos vemos lá. - ${nomeOficina}`;
      abrirWhatsAppFn(`https://wa.me/55${(retorno.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgBase)}`);
      setRetornoSelecionado(null);
    } catch (e) { alert('Erro ao agendar: ' + e.message); }
  };

  const handleConcluir = async (retorno) => {
    if (!confirm(`Confirmar que ${retorno.nomeCliente || 'o cliente'} compareceu para a manutenção?`)) return;
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'retornos', retorno.id), {
        statusRetorno: 'concluido', dataConclusao: new Date().toISOString(),
      });
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const handleDesfazer = async (retorno) => {
    if (!confirm('Remover o agendamento deste cliente?')) return;
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'retornos', retorno.id), {
        statusRetorno: 'pendente', dataAgendamento: null,
      });
    } catch (e) { alert('Erro: ' + e.message); }
  };

  // ✅ CORREÇÃO 2: Função WhatsApp com window.open + trava de segurança
  const handleAbrirWhatsApp = (retorno, tipo, mensagemPersonalizada) => {
    const telefoneLimpo = (retorno.telefone || '').replace(/\D/g, '');
    
    // 🔒 Trava de segurança: verifica se há telefone cadastrado
    if (!telefoneLimpo || telefoneLimpo.length < 10) {
      // Toast error (se usar react-toastify) ou fallback com alert
      if (typeof toast !== 'undefined') {
        toast.error('📱 Cliente sem número de WhatsApp cadastrado!', { position: 'top-right', autoClose: 3000 });
      } else {
        alert('⚠️ Cliente sem número de WhatsApp cadastrado!');
      }
      return;
    }
    
    const msg = mensagemPersonalizada || gerarMensagemRetorno(retorno, tipo);
    const link = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(msg)}`;
    
    // ✅ Abre em nova aba com window.open
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const gerarMensagemRetorno = (retorno, tipo) => {
    const nome = retorno.nomeCliente ? ` ${retorno.nomeCliente}` : '';
    const placa = retorno.placa ? ` (${retorno.placa})` : '';
    const servico = retorno.servicoLabel || retorno.categoria || 'manutenção';
    if (tipo === 'vencido') return `Olá${nome}! Seu retorno de *${servico}*${placa} está vencido. Entre em contato para agendar. - ${nomeOficina}`;
    if (tipo === 'urgente') return `Olá${nome}! Seu retorno de *${servico}*${placa} vence em breve. Agende agora. - ${nomeOficina}`;
    return `Olá${nome}! Lembrete do seu retorno de *${servico}*${placa}. Estamos à disposição. - ${nomeOficina}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: MAIN_COLOR, margin: 0, fontSize: '22px' }}>Gestão de Retorno</h2>
          <p style={{ color: '#555', fontSize: '12px', margin: '4px 0 0' }}>Gatilhos automáticos por serviço, categoria e vencimento</p>
        </div>
        <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '12px 16px' }}>
          <p style={{ color: '#666', fontSize: '10px', fontWeight: '700', margin: '0 0 4px' }}>FATURAMENTO PREVISTO</p>
          <p style={{ color: GREEN_MONEY, fontSize: '18px', fontWeight: '900', margin: 0 }}>{fmtMoeda(faturamentoPrevisto)}</p>
        </div>
      </div>

      {/* ✅ CORREÇÃO 1: Painéis agora usam os contadores dinâmicos do estado */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { key: 'vencido', cor: VENCIDO_COLOR, label: 'VENCIDOS' },
          { key: 'urgente', cor: WARN_RED, label: 'URGENTES' },
          { key: 'aviso', cor: WARN_YELLOW, label: 'AVISOS' },
          { key: 'agendado', cor: BLUE_INFO, label: 'AGENDADOS' },
        ].map(({ key, cor, label }) => (
          <div key={key} onClick={() => setFiltroStatus((atual) => (atual === key ? 'todos' : key))}
            style={{ background: filtroStatus === key ? '#0d0d0d' : '#0a0a0a', border: `1px solid ${filtroStatus === key ? cor : '#222'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <p style={{ color: '#888', fontSize: '10px', fontWeight: '700', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color: cor, fontSize: '28px', fontWeight: '900', margin: 0 }}>{contadores[key]}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, placa, modelo ou serviço..."
          style={{ flex: 1, minWidth: '220px', padding: '12px 14px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px' }}
        />
        <button onClick={() => { setFiltroStatus('todos'); setFiltroCategoria('todas'); }}
          style={{ padding: '10px 14px', background: filtroStatus === 'todos' && filtroCategoria === 'todas' ? MAIN_COLOR : '#1a1a1a', color: filtroStatus === 'todos' && filtroCategoria === 'todas' ? 'white' : '#666', border: `1px solid ${filtroStatus === 'todos' && filtroCategoria === 'todas' ? MAIN_COLOR : '#333'}`, borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
          TODOS ({retornosComStatus.length})
        </button>
      </div>

      {categoriasDisponiveis.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {categoriasDisponiveis.map((categoria) => (
            <button key={categoria} onClick={() => setFiltroCategoria((atual) => atual === categoria ? 'todas' : categoria)}
              style={{ padding: '8px 12px', background: filtroCategoria === categoria ? '#111' : '#0a0a0a', color: filtroCategoria === categoria ? 'white' : '#777', border: `1px solid ${filtroCategoria === categoria ? '#444' : '#222'}`, borderRadius: '999px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>
              {ICONES_CATEGORIA[categoria] || '📅'} {categoria}
            </button>
          ))}
        </div>
      )}

      {retornosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Nenhum retorno encontrado. Os novos lembretes aparecem automaticamente ao salvar o serviço na O.S.</p>
        </div>
      ) : (
        retornosFiltrados.map((retorno) => (
          <CardRetorno key={retorno.id} retorno={retorno} tipo={retorno._tipo}
            onAbrirWhatsApp={handleAbrirWhatsApp} onAgendar={setRetornoSelecionado}
            onConcluir={handleConcluir} onDesfazer={handleDesfazer} />
        ))
      )}

      {retornoSelecionado && (
        <ModalAgendar retorno={retornoSelecionado} onConfirmar={handleAgendar} onFechar={() => setRetornoSelecionado(null)} />
      )}
    </div>
  );
}

export default GestaoRetorno;