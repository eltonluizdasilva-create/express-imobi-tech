/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, where, deleteDoc, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth";
import { useGemini } from '../hooks/useGemini';
import { useOficina } from '../components/OficinaContext';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Financeiro from './Financeiro';
import Estoque from './Estoque';
import LeadsPage from './LeadsPage';

const MAIN_COLOR = "#FF0033";
const GREEN_MONEY = "#00E676";
const KM_COLOR = "#eab308";
const MASTER_COLOR = "#D4AF37";
const ALINHAMENTO_COLOR = "#06b6d4";
const COPILOTO_COLOR = "#a855f7"; 
const WARN_YELLOW = '#f59e0b';
const WARN_RED = '#ef4444';
const VENCIDO_COLOR = '#FF0033';

// Remove traços, espaços e especiais - aceita "WWW-0000", "WWW 0000", "WWW0000" como a mesma placa
const normalizarPlaca = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Cor de cada aba - usada nos botões do menu E na aba Ajuda para sincronizar
const TAB_COLORS = {
  dashboard: '#00E676',
  os:        '#FF0033',
  oleo:      '#eab308',
  alinhamento: '#06b6d4',
  revisao:   '#3b82f6',
  pneus:     '#00E676',
  copiloto:  '#a855f7',
  retorno:   '#f97316',
  estoque:   '#ec4899',
  financeiro:'#10b981',
  equipe:    '#6366f1',
  oficina:   '#8b5cf6',
  leads:     '#25D366',
  assinatura:'#00E676',
  config:    '#94a3b8',
  ajuda:     '#3b82f6',
  estrategia: '#f59e0b',
  marketing:  '#a855f7',
  desmanche:  '#ef4444',
  fornecedores: '#f97316',
  injecao:   '#8b5cf6',
  master:    '#D4AF37',
};
const BLUE_INFO = '#3b82f6';

// === ESTRUTURA PADRÃO DE PREÇOS DA EXPRESS AI ===
const DEFAULT_PLANOS = {
  mensal: { base: 89, clientes: 25, estoque: 25, retorno: 15, alinhamento: 30, pneus: 30, revisaoIa: 30, copiloto: 15, oficina: 35, injecao: 20, desmanche: 49 },
  anual:  { base: 890, clientes: 250, estoque: 250, retorno: 150, alinhamento: 300, pneus: 300, revisaoIa: 300, copiloto: 150, oficina: 350, injecao: 200, desmanche: 490 },
  whatsapp: "5534999999999",
  descricaoBase: "Abertura de O.S. Geral e Controle Financeiro."
};

// ============================================================
// ========== GESTÃO DE RETORNO - HELPERS =====================
// ============================================================
const _hoje = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const diasParaVencer = (dataVencimento) => {
  if (!dataVencimento) return null;
  const venc = dataVencimento?.toDate ? dataVencimento.toDate() : new Date(dataVencimento);
  venc.setHours(0,0,0,0);
  return Math.ceil((venc - _hoje()) / (1000 * 60 * 60 * 24));
};
const formatarDataRetorno = (d) => {
  if (!d) return '-';
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return dt.toLocaleDateString('pt-BR');
};
const classificarRetorno = (os) => {
  if (os.statusRetorno === 'agendado') return 'agendado';
  if (os.statusRetorno === 'concluido') return 'concluido';
  const dias = diasParaVencer(os.dataVencimento);
  if (dias === null) return 'ok';
  if (dias < 0)  return 'vencido';
  if (dias <= 7)  return 'urgente';
  if (dias <= 15) return 'aviso';
  return 'ok';
};
const gerarMensagemRetorno = (os, tipo, nomeOficina) => {
  const nome    = os.nomeCliente ? ` ${os.nomeCliente}` : '';
  const veiculo = `${os.modelo || 'seu veículo'} (Placa: ${os.placa || '-'})`;
  const dias    = diasParaVencer(os.dataVencimento);
  if (tipo === 'vencido') return `Olá${nome}! 👋 Aqui é da *${nomeOficina}*.\nPercebemos que o serviço do seu ${veiculo} já está com o prazo vencido! ⚠️\nManter a manutenção em dia protege seu veículo. Qual horário fica melhor: *manhã ou tarde*? 🚗`;
  if (tipo === 'urgente') return `Olá${nome}! 👋 Aqui é da *${nomeOficina}*.\nFalta apenas *1 semana* para o vencimento da revisão do seu ${veiculo}! ⏰\nJá preparamos tudo aqui. Qual horário fica melhor para você: *manhã ou tarde*? 🔧`;
  if (tipo === 'aviso')   return `Olá${nome}! 👋 Aqui é da *${nomeOficina}*.\nPassando para avisar que a manutenção do seu ${veiculo} vence em *${dias} dias*. 📅\nDeseja verificar a disponibilidade para a próxima semana?`;
  return `Olá${nome}! 👋 Aqui é da *${nomeOficina}*. Tudo bem com o seu ${veiculo}?`;
};

// ============================================================
// ========== CARD DE RETORNO =================================
// ============================================================
function CardRetorno({ os, tipo, nomeOficina, onAbrirWhatsApp, onAgendar, onConcluir, onDesfazer }) {
  const [expandido, setExpandido] = useState(false);
  const dias = diasParaVencer(os.dataVencimento);
  const paleta = {
    vencido:  { borda: VENCIDO_COLOR, bg: '#1a0000', badge: VENCIDO_COLOR, badgeBg: '#FF003322', emoji: '🔴', label: 'VENCIDO',       textDias: `Venceu há ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}` },
    urgente:  { borda: WARN_RED,      bg: '#1a0500', badge: WARN_RED,      badgeBg: '#ef444422', emoji: '🚨', label: 'URGENTE',       textDias: `Vence em ${dias} dia${dias !== 1 ? 's' : ''}` },
    aviso:    { borda: WARN_YELLOW,   bg: '#1a1500', badge: WARN_YELLOW,   badgeBg: '#f59e0b22', emoji: '⚠️', label: 'AVISO PRÓXIMO', textDias: `Vence em ${dias} dias` },
    agendado: { borda: BLUE_INFO,     bg: '#00051a', badge: BLUE_INFO,     badgeBg: '#3b82f622', emoji: '📅', label: 'AGENDADO',      textDias: os.dataAgendamento ? `Agend: ${os.dataAgendamento}` : '' },
    ok:       { borda: '#333',        bg: '#111',    badge: '#555',        badgeBg: '#33333322', emoji: '✅', label: 'EM DIA',        textDias: dias !== null ? `Vence em ${dias} dias` : '' },
  };
  const p = paleta[tipo] || paleta.ok;
  return (
    <div style={{ background: p.bg, border: `1px solid ${p.borda}`, borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', whiteSpace: 'nowrap' }}>
              {os.nomeCliente || 'Cliente'}
            </span>
            <span style={{ background: p.badgeBg, color: p.badge, border: `1px solid ${p.badge}`, padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: '800', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              {p.emoji} {p.label}
            </span>
          </div>
          <p style={{ color: '#aaa', fontSize: '12px', margin: '2px 0' }}>🚗 {os.placa || '-'} - {os.modelo || '-'}</p>
          {p.textDias && <p style={{ color: p.badge, fontSize: '12px', fontWeight: '700', margin: '2px 0' }}>⏱ {p.textDias}</p>}
          {os.kmAtual && <p style={{ color: KM_COLOR, fontSize: '11px', margin: '2px 0' }}>📍 KM: {Number(os.kmAtual).toLocaleString()} → próx: {Number(os.kmProxima || 0).toLocaleString()}</p>}
          <p style={{ color: GREEN_MONEY, fontSize: '14px', fontWeight: '700', margin: '4px 0 0 0' }}>
            {Number(os.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {formatarDataRetorno(os.data_registro)}
          </p>
        </div>
        <button onClick={() => setExpandido(v => !v)} style={{ background: '#222', color: '#888', border: '1px solid #333', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>
          {expandido ? '▲' : '▼'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
        {tipo !== 'concluido' && (
          <button onClick={() => onAbrirWhatsApp(os, tipo)} style={{ flex: 1, minWidth: '100px', padding: '10px 8px', background: '#25D366', color: 'black', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
            💬 Enviar Msg
          </button>
        )}
        {tipo !== 'agendado' && tipo !== 'concluido' && (
          <button onClick={() => onAgendar(os)} style={{ flex: 1, minWidth: '100px', padding: '10px 8px', background: BLUE_INFO, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
            📅 Agendar
          </button>
        )}
        {tipo === 'agendado' && (
          <button onClick={() => onConcluir(os)} style={{ flex: 1, minWidth: '100px', padding: '10px 8px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
            ✅ Concluído
          </button>
        )}
        {tipo === 'agendado' && (
          <button onClick={() => onDesfazer(os)} style={{ padding: '10px 10px', background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
            ↩
          </button>
        )}
      </div>
      {expandido && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #333', paddingTop: '12px', fontSize: '12px', color: '#888', lineHeight: '1.6' }}>
          {os.checklist    && <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: '#ccc' }}>Serviço:</strong> {os.checklist}</p>}
          {os.detalhesPecas && <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: '#ccc' }}>Peças/Laudo:</strong> {os.detalhesPecas}</p>}
          <p style={{ margin: '0 0 4px 0' }}><strong style={{ color: '#ccc' }}>Vencimento:</strong> {formatarDataRetorno(os.dataVencimento)}</p>
          {os.dataAgendamento && <p style={{ margin: 0 }}><strong style={{ color: BLUE_INFO }}>Agendado para:</strong> {os.dataAgendamento}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ========== MODAL AGENDAMENTO ================================
// ============================================================
function ModalAgendar({ os, nomeOficina, onConfirmar, onFechar }) {
  const [dataHora, setDataHora] = useState('');
  const [enviando, setEnviando] = useState(false);
  const minDate = new Date().toISOString().slice(0, 16);
  const dataFormatada = dataHora ? new Date(dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
  const confirmar = async () => {
    if (!dataHora) { alert('Escolha a data e hora do agendamento.'); return; }
    setEnviando(true);
    await onConfirmar(os, dataHora, dataFormatada);
    setEnviando(false);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#111', border: `1px solid ${BLUE_INFO}`, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: `0 0 40px ${BLUE_INFO}33` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: BLUE_INFO, fontSize: '18px' }}>📅 Agendar Retorno</h3>
          <button onClick={onFechar} style={{ background: 'transparent', color: '#888', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ background: '#0a0a0a', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '14px' }}>{os.nomeCliente || 'Cliente'}</p>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>🚗 {os.placa} - {os.modelo}</p>
        </div>
        <label style={{ color: '#888', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>DATA E HORA DO AGENDAMENTO</label>
        <input
          type="datetime-local"
          value={dataHora}
          min={minDate}
          onChange={e => setDataHora(e.target.value)}
          style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: `1px solid ${BLUE_INFO}`, color: 'white', borderRadius: '8px', fontSize: '15px', marginBottom: '16px', colorScheme: 'dark' }}
        />
        {dataFormatada && (
          <div style={{ background: '#001a05', border: '1px solid #25D36644', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 4px', color: '#25D366', fontSize: '10px', fontWeight: '700' }}>PRÉ-VIA DA MENSAGEM:</p>
            <p style={{ margin: 0, color: '#aaa', fontSize: '11px', lineHeight: '1.6' }}>
              Olá {os.nomeCliente || ''}! ✅ Horário confirmado para <strong style={{ color: 'white' }}>{dataFormatada}</strong>! Nos vemos lá. 🔧 - <em>{nomeOficina}</em>
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '14px', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={confirmar} disabled={enviando || !dataHora} style={{ flex: 2, padding: '14px', background: enviando || !dataHora ? '#222' : BLUE_INFO, color: enviando || !dataHora ? '#444' : 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '14px', cursor: enviando || !dataHora ? 'not-allowed' : 'pointer' }}>
            {enviando ? '⏳ Salvando...' : '✅ Confirmar & Notificar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ========== ABA GESTÃO DE RETORNO ===========================
// ============================================================
function GestaoRetorno({ listaCarros, setListaCarros, nomeOficina, oficinaId, abrirWhatsAppFn }) {
  const [osSelecionada, setOsSelecionada] = useState(null);
  const [filtroStatus, setFiltroStatus]   = useState('todos');
  const [busca, setBusca]                 = useState('');
  const ORDEM = { vencido: 0, urgente: 1, aviso: 2, agendado: 3, ok: 4 };
  const osComVencimento = useMemo(() => {
    return listaCarros.filter(os => {
      if (os.statusRetorno === 'concluido') return false;
      const temOleoOuAlinhamento = ['óleo','oleo','oil', 'alinhamento', 'balanceamento', 'pneu', 'revisão', 'revisao'].some(t =>
        (os.checklist || '').toLowerCase().includes(t) ||
        (os.detalhesPecas || '').toLowerCase().includes(t) ||
        (os.tipoServico || '').toLowerCase().includes(t)
      );
      return temOleoOuAlinhamento || os.dataVencimento;
    });
  }, [listaCarros]);
  const osEnriquecidas = useMemo(() => {
    return osComVencimento.map(os => {
      let dataVencimento = os.dataVencimento;
      if (!dataVencimento && os.data_registro) {
        const base = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro);
        const calc = new Date(base);
        calc.setDate(calc.getDate() + 180);
        dataVencimento = calc;
      }
      const tipo = classificarRetorno({ ...os, dataVencimento });
      return { ...os, dataVencimento, _tipo: tipo };
    });
  }, [osComVencimento]);
  const osOrdenadas = useMemo(() =>
    [...osEnriquecidas].sort((a, b) => (ORDEM[a._tipo] ?? 5) - (ORDEM[b._tipo] ?? 5)),
    [osEnriquecidas]);
  const osFiltradas = useMemo(() => {
    return osOrdenadas.filter(os => {
      const matchStatus = filtroStatus === 'todos' || os._tipo === filtroStatus;
      const term = busca.toLowerCase();
      const matchBusca = !busca ||
        (os.nomeCliente || '').toLowerCase().includes(term) ||
        (os.placa || '').toLowerCase().includes(term) ||
        (os.modelo || '').toLowerCase().includes(term);
      return matchStatus && matchBusca;
    });
  }, [osOrdenadas, filtroStatus, busca]);
  const contadores = useMemo(() => {
    const c = { vencido: 0, urgente: 0, aviso: 0, agendado: 0, ok: 0 };
    osOrdenadas.forEach(os => { if (c[os._tipo] !== undefined) c[os._tipo]++; });
    return c;
  }, [osOrdenadas]);
  const faturamentoPrevisto = useMemo(() =>
    osOrdenadas.filter(os => ['vencido','urgente','aviso'].includes(os._tipo))
      .reduce((acc, os) => acc + (Number(os.total) || 0), 0),
    [osOrdenadas]);
  const totalAtencao = contadores.vencido + contadores.urgente + contadores.aviso;
  const fmtMoeda = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const handleAgendar = async (os, dataHora, dataFormatada) => {
    try {
      if (oficinaId) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'os', os.id), {
          statusRetorno: 'agendado',
          dataAgendamento: dataFormatada,
        });
      }
      setListaCarros(prev => prev.map(x =>
        x.id === os.id ? { ...x, statusRetorno: 'agendado', dataAgendamento: dataFormatada } : x
      ));
      const msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! ✅ Horário confirmado para *${dataFormatada}*!\nNos vemos lá. 🔧 - ${nomeOficina}`;
      abrirWhatsAppFn(`https://wa.me/55${(os.telefone || '').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
      setOsSelecionada(null);
    } catch (e) { alert('Erro ao agendar: ' + e.message); }
  };
  const handleConcluir = async (os) => {
    if (!confirm(`Confirmar que ${os.nomeCliente || 'o cliente'} compareceu para a manutenção?`)) return;
    try {
      if (oficinaId) await updateDoc(doc(db, 'oficinas', oficinaId, 'os', os.id), { statusRetorno: 'concluido' });
      setListaCarros(prev => prev.map(x => x.id === os.id ? { ...x, statusRetorno: 'concluido' } : x));
    } catch (e) { alert('Erro: ' + e.message); }
  };
  const handleDesfazer = async (os) => {
    if (!confirm('Remover o agendamento deste cliente?')) return;
    try {
      if (oficinaId) await updateDoc(doc(db, 'oficinas', oficinaId, 'os', os.id), { statusRetorno: 'pendente', dataAgendamento: null });
      setListaCarros(prev => prev.map(x => x.id === os.id ? { ...x, statusRetorno: 'pendente', dataAgendamento: null } : x));
    } catch (e) { alert('Erro: ' + e.message); }
  };
  const handleAbrirWhatsApp = (os, tipo) => {
    const msg = gerarMensagemRetorno(os, tipo, nomeOficina);
    const num  = (os.telefone || '').replace(/\D/g, '');
    if (!num) { alert('Este cliente não tem telefone cadastrado.'); return; }
    abrirWhatsAppFn(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`);
  };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: MAIN_COLOR, margin: 0, fontSize: '22px' }}>🔄 Gestão de Retorno</h2>
          <p style={{ color: '#555', fontSize: '12px', margin: '4px 0 0' }}>Rastreamento automático de vencimentos e manutenções</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div style={{ gridColumn: 'span 2', background: '#001a0a', border: `1px solid ${GREEN_MONEY}44`, borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#888', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px', margin: '0 0 4px' }}>💰 FATURAMENTO PREVISTO</p>
          <p style={{ color: GREEN_MONEY, fontSize: '26px', fontWeight: '900', margin: 0 }}>{fmtMoeda(faturamentoPrevisto)}</p>
          <p style={{ color: '#555', fontSize: '10px', margin: '4px 0 0' }}>em {totalAtencao} cliente{totalAtencao !== 1 ? 's' : ''} com vencimento iminente</p>
        </div>
        {[
          { key: 'vencido',  cor: VENCIDO_COLOR, label: '🔴 VENCIDOS' },
          { key: 'urgente',  cor: WARN_RED,      label: '🚨 URGENTES' },
          { key: 'aviso',    cor: WARN_YELLOW,   label: '⚠️ AVISOS' },
          { key: 'agendado', cor: BLUE_INFO,      label: '📅 AGENDADOS' },
        ].map(({ key, cor, label }) => (
          <div key={key}
            onClick={() => setFiltroStatus(f => f === key ? 'todos' : key)}
            style={{ background: filtroStatus === key ? '#0d0d0d' : '#0a0a0a', border: `1px solid ${filtroStatus === key ? cor : '#222'}`, borderRadius: '12px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <p style={{ color: '#888', fontSize: '10px', fontWeight: '700', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color: cor, fontSize: '28px', fontWeight: '900', margin: 0 }}>{contadores[key]}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por nome, placa ou modelo..."
          style={{ flex: 1, minWidth: '180px', padding: '12px 14px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px' }}
        />
        <button
          onClick={() => setFiltroStatus('todos')}
          style={{ padding: '10px 14px', background: filtroStatus === 'todos' ? MAIN_COLOR : '#1a1a1a', color: filtroStatus === 'todos' ? 'white' : '#666', border: `1px solid ${filtroStatus === 'todos' ? MAIN_COLOR : '#333'}`, borderRadius: '8px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
        >
          TODOS ({osOrdenadas.length})
        </button>
      </div>
      {osFiltradas.length > 0 && filtroStatus === 'todos' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[{ cor: VENCIDO_COLOR, label: 'Vencido' }, { cor: WARN_RED, label: '≤ 7 dias' }, { cor: WARN_YELLOW, label: '≤ 15 dias' }, { cor: BLUE_INFO, label: 'Agendado' }].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.cor }} />
              <span style={{ color: '#666', fontSize: '10px' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {osFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>{filtroStatus === 'todos' ? '✅' : '🔍'}</div>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
            {filtroStatus === 'todos'
              ? 'Nenhum vencimento encontrado. Salve O.S. com Óleo ou Alinhamento para ativar o rastreamento.'
              : `Nenhum cliente no filtro "${filtroStatus}".`}
          </p>
        </div>
      ) : (
        osFiltradas.map(os => (
          <CardRetorno
            key={os.id}
            os={os}
            tipo={os._tipo}
            nomeOficina={nomeOficina}
            onAbrirWhatsApp={handleAbrirWhatsApp}
            onAgendar={setOsSelecionada}
            onConcluir={handleConcluir}
            onDesfazer={handleDesfazer}
          />
        ))
      )}
      {osSelecionada && (
        <ModalAgendar
          os={osSelecionada}
          nomeOficina={nomeOficina}
          onConfirmar={handleAgendar}
          onFechar={() => setOsSelecionada(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// ========== MASTER PANEL (Configuração de Preços) ===========
// ============================================================
function MasterPanel({ setPlanosGlobais }) {
  const [oficinas, setOficinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState(DEFAULT_PLANOS);
  const [salvandoPlanos, setSalvandoPlanos] = useState(false);
  const [videosAjuda, setVideosAjuda] = useState({});
  const [salvandoVideos, setSalvandoVideos] = useState(false);

  const SERVICOS_MARKETING_DEFAULT = [
    { key: 'trafego_pago',   icon: '🎯', nome: 'Tráfego Pago',             desc: 'Anúncios no Google e Meta (Facebook/Instagram) para atrair clientes novos todos os dias. Você define o orçamento de mídia, nós cuidamos de tudo.',  preco: '' },
    { key: 'google_negocio', icon: '📍', nome: 'Google Meu Negócio',       desc: 'Otimização do seu perfil no Google Maps. Quando alguém pesquisar "oficina perto de mim", sua oficina aparece em destaque.',                         preco: '' },
    { key: 'site',           icon: '🌐', nome: 'Criação de Site',           desc: 'Site profissional com domínio, hospedagem e integração com WhatsApp. Passa credibilidade e funciona como vendedor 24h.',                              preco: '' },
    { key: 'whatsapp_bot',   icon: '🤖', nome: 'Automação de Atendimento', desc: 'Bot inteligente no WhatsApp que responde clientes automaticamente, agenda serviços e reativa clientes inativos - sem você fazer nada.',              preco: '' },
    { key: 'redes_sociais',  icon: '📱', nome: 'Gestão de Redes Sociais',  desc: 'Criação e publicação de posts no Instagram e Facebook. Conteúdo profissional que gera confiança e atrai clientes locais.',                            preco: '' },
    { key: 'conteudo',       icon: '🎨', nome: 'Criação de Conteúdo',      desc: 'Artes, vídeos curtos e stories prontos para você publicar. Sua oficina com visual profissional sem precisar entender de design.',                       preco: '' },
    { key: 'seo_local',      icon: '🔍', nome: 'SEO Local',                desc: 'Posicionamento orgânico nos buscadores. Apareça no Google quando clientes da sua cidade pesquisarem serviços que você oferece.',                        preco: '' },
    { key: 'relatorio',      icon: '📊', nome: 'Relatório Mensal',         desc: 'Relatório completo de resultados: quantos clientes vieram do Google, do Instagram, quantos retornaram. Transparência total do investimento.',           preco: '' },
  ];

  const [servicosMarketing, setServicosMarketing] = useState(SERVICOS_MARKETING_DEFAULT);
  const [salvandoMarketing, setSalvandoMarketing] = useState(false);

  const ABAS_VIDEOS = [
    { key: 'visao_geral', label: '📊 Visão Geral' },
    { key: 'os', label: '🔧 O.S.' },
    { key: 'mecanica', label: '🏢 Mecânica' },
    { key: 'injecao', label: '⚡ Injeção' },
    { key: 'oleo', label: '🛢️ Óleo' },
    { key: 'alinhamento', label: '⚙️ Alinhamento' },
    { key: 'revisao', label: '🛡️ Revisão' },
    { key: 'pneus', label: '🛞 Pneus' },
    { key: 'copiloto', label: '🤖 Copiloto IA' },
    { key: 'retorno', label: '🔄 Retorno' },
    { key: 'estoque', label: '📦 Estoque' },
    { key: 'financeiro', label: '💰 Financeiro' },
    { key: 'equipe', label: '👥 Equipe' },
    { key: 'patrimonio', label: '🏢 Patrimônio' },
    { key: 'leads', label: '👥 Clientes' },
    { key: 'config', label: '⚙️ Config' },
    { key: 'estrategia', label: '🚀 Estratégia' },
    { key: 'portal_cliente', label: '📱 Portal do Cliente' },
    { key: 'marketing',      label: '📣 Marketing' },
  ];
  
  useEffect(() => {
    let isMounted = true;
    const fetchDados = async () => {
      setLoading(true);
      try {
        const s = await getDocs(collection(db, 'oficinas'));
        if (isMounted) setOficinas(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(o => o.id !== 'MASTER'));
        const snap = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'planos'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setPlanos({
            mensal: { ...DEFAULT_PLANOS.mensal, ...(data.mensal || {}) },
            anual: { ...DEFAULT_PLANOS.anual, ...(data.anual || {}) },
            whatsapp: data.whatsapp || DEFAULT_PLANOS.whatsapp,
            descricaoBase: data.descricaoBase || DEFAULT_PLANOS.descricaoBase
          });
        }
        const snapVideos = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'videos_ajuda'));
        if (snapVideos.exists() && isMounted) setVideosAjuda(snapVideos.data());
        const snapMkt = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'marketing'));
        if (snapMkt.exists() && isMounted) {
          const mktData = snapMkt.data().servicos;
          if (mktData) setServicosMarketing(prev => prev.map(s => ({ ...s, ...(mktData.find(m => m.key === s.key) || {}) })));
        }
      } catch (e) { console.error(e); }
      finally { if (isMounted) setLoading(false); }
    };
    fetchDados();
    return () => { isMounted = false; };
  }, []);

  const salvarPlanos = async () => {
    setSalvandoPlanos(true);
    try {
      await setDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'planos'), { ...planos, descricaoBase: planos.descricaoBase || '' }, { merge: true });
      if (setPlanosGlobais) setPlanosGlobais(planos);
      alert('✅ Planos e preços atualizados em todo o sistema na hora!');
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoPlanos(false); }
  };

  const salvarVideos = async () => {
    setSalvandoVideos(true);
    try {
      await setDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'videos_ajuda'), videosAjuda, { merge: true });
      alert('✅ Links salvos! Já aparecem na aba Ajuda de todos os mecânicos.');
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoVideos(false); }
  };

  const salvarMarketing = async () => {
    setSalvandoMarketing(true);
    try {
      await setDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'marketing'), { servicos: servicosMarketing }, { merge: true });
      alert('✅ Serviços e preços de marketing salvos! Já aparecem na aba Marketing de todas as oficinas.');
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoMarketing(false); }
  };

  const toggleAtivo = async (oficina) => {
    try {
      const novoStatus = oficina.ativo === false ? true : false;
      await updateDoc(doc(db, 'oficinas', oficina.id), { ativo: novoStatus });
      setOficinas(prev => prev.map(o => o.id === oficina.id ? { ...o, ativo: novoStatus } : o));
      alert(`✅ Sucesso! A oficina foi ${novoStatus ? 'ATIVADA' : 'BLOQUEADA'}.`);
    } catch (error) {
      alert("❌ ERRO NO FIREBASE: Não foi possível alterar o status.");
    }
  };

  const aprovarPagamento = async (oficina) => {
    if(!confirm(`Confirma que recebeu o pagamento e quer liberar o acesso de ${oficina.nomeOficina}?`)) return;
    try {
      await updateDoc(doc(db, 'oficinas', oficina.id), { plano: 'pago', ativo: true });
      setOficinas(prev => prev.map(o => o.id === oficina.id ? { ...o, plano: 'pago', ativo: true } : o));
      alert(`🎉 Sucesso! Assinatura de ${oficina.nomeOficina} foi liberada!`);
    } catch (error) {
      alert("❌ Erro ao liberar: " + error.message);
    }
  };

  const diasRestantes = (trialFim) => {
    if (!trialFim) return null;
    const fim = trialFim.toDate ? trialFim.toDate() : new Date(trialFim);
    return Math.ceil((fim - new Date()) / (1000 * 60 * 60 * 24));
  };

  if (loading) return <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>A carregar Painel Master...</p>;
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: MASTER_COLOR }}>👑 Painel Master</h2>
        <span style={{ background: `${MASTER_COLOR}22`, border: `1px solid ${MASTER_COLOR}`, padding: '5px 12px', borderRadius: '20px', color: MASTER_COLOR, fontSize: '12px', fontWeight: 'bold' }}>{oficinas.length} OFICINAS</span>
      </div>

      {/* NOVO CMS DE PREÇOS MODULARES */}
      <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: `1px solid ${MASTER_COLOR}`, marginBottom: '30px' }}>
        <h3 style={{ color: MASTER_COLOR, margin: '0 0 15px 0' }}>💲 Tabela de Preços A La Carte</h3>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>Defina o preço de cada módulo. Eles serão atualizados automaticamente na aba "Meu Plano" de todos os clientes.</p>
        
        <div style={{ marginBottom: '20px', background: '#0a0a0a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
          <label style={{ color: '#00E676', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>📲 WHATSAPP DE VENDAS DA EXPRESS AI (Com DDD):</label>
          <input type="text" value={planos.whatsapp} onChange={e => setPlanos({...planos, whatsapp: e.target.value.replace(/\D/g, '')})} placeholder="Ex: 5534999999999" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '5px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px', color: '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          <div>Módulo do Sistema</div>
          <div>Mensal (R$)</div>
          <div>Anual (R$)</div>
        </div>
        
        {[
            { key: 'base', label: 'Plano Base (O.S. + Financeiro)' },
            { key: 'clientes', label: 'Gestão de Clientes' },
            { key: 'estoque', label: 'Controle de Estoque' },
            { key: 'retorno', label: 'Retorno Automático (Vendas)' },
            { key: 'alinhamento', label: 'Alinhamento 3D' },
            { key: 'pneus', label: 'Pneus & Borracharia' },
            { key: 'revisaoIa', label: 'Revisão Preventiva (IA)' },
            { key: 'copiloto', label: 'Copiloto Técnico (IA)' },
            { key: 'oficina', label: 'Módulo Oficina Mecânica' },
            { key: 'injecao', label: 'Módulo Injeção Eletrônica' },
            { key: 'desmanche', label: 'Módulo Desmanche' }
        ].map(mod => (
          <div key={mod.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '8px' }}>
            <div style={{ background: '#0a0a0a', padding: '12px', borderRadius: '5px', border: '1px solid #333', fontSize: '12px', color: 'white', display: 'flex', alignItems: 'center' }}>
              {mod.label}
            </div>
            <input type="number" value={planos.mensal[mod.key]} onChange={e => setPlanos(p => ({...p, mensal: {...p.mensal, [mod.key]: Number(e.target.value)}}))} style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: GREEN_MONEY, borderRadius: '5px', fontWeight: 'bold' }} />
            <input type="number" value={planos.anual[mod.key]} onChange={e => setPlanos(p => ({...p, anual: {...p.anual, [mod.key]: Number(e.target.value)}}))} style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: GREEN_MONEY, borderRadius: '5px', fontWeight: 'bold' }} />
          </div>
        ))}

        <div style={{ marginTop: '20px', padding: '16px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }}>
          <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>📝 DESCRIÇÃO DO SISTEMA BASE (aparece no MEU PLANO para o cliente)</label>
          <textarea value={planos.descricaoBase || 'Abertura de O.S. Geral e Controle Financeiro.'} onChange={e => setPlanos(p => ({ ...p, descricaoBase: e.target.value }))} rows={3} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }} placeholder="Ex: O.S. Geral, Financeiro e módulos inclusos no plano base..." />
          <p style={{ color: '#444', fontSize: '11px', margin: '6px 0 0 0' }}>Use esse campo para definir o que está incluído no plano base.</p>
        </div>
        <button onClick={salvarPlanos} disabled={salvandoPlanos} style={{ width: '100%', padding: '18px', background: MASTER_COLOR, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', marginTop: '15px' }}>
          {salvandoPlanos ? 'A SALVAR NO BANCO...' : '💾 ATUALIZAR TODOS OS PREÇOS'}
        </button>
      </div>

      <h3 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>🎬 Vídeos da Aba Ajuda</h3>
      <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: `1px solid ${MASTER_COLOR}`, marginBottom: '30px' }}>
        <div style={{ background: '#1a1000', border: '1px solid #f59e0b44', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <p style={{ color: '#f59e0b', fontSize: '12px', margin: '0 0 6px 0', fontWeight: 'bold' }}>📹 Como adicionar vídeos (não pesa, não ocupa espaço)</p>
          <p style={{ color: '#888', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
            1. Grave o vídeo no celular<br/>
            2. Suba no YouTube como <strong>"Não listado"</strong> (só quem tiver o link vê)<br/>
            3. Copie o link e cole aqui → o sistema armazena só o link, não o vídeo<br/>
            <strong style={{ color: '#f59e0b' }}>Resultado:</strong> O mecânico vê um botão ▶ Ver Vídeo ao lado de cada aba na Ajuda
          </p>
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {ABAS_VIDEOS.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '13px', minWidth: '160px' }}>{label}</span>
              <input
                type="text"
                value={videosAjuda[key] || ''}
                onChange={e => setVideosAjuda(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder="https://youtu.be/..."
                style={{ flex: 1, padding: '10px 14px', background: '#0a0a0a', border: `1px solid ${videosAjuda[key] ? MASTER_COLOR : '#333'}`, color: 'white', borderRadius: '8px', fontSize: '13px' }}
              />
              {videosAjuda[key] && (
                <a href={videosAjuda[key]} target="_blank" rel="noreferrer" style={{ color: MASTER_COLOR, fontSize: '18px', textDecoration: 'none' }}>▶</a>
              )}
            </div>
          ))}
        </div>
        <button onClick={salvarVideos} disabled={salvandoVideos} style={{ width: '100%', padding: '16px', background: salvandoVideos ? '#333' : MASTER_COLOR, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', marginTop: '20px', fontSize: '14px' }}>
          {salvandoVideos ? '⏳ SALVANDO...' : '💾 SALVAR LINKS DE VÍDEOS'}
        </button>
      </div>

      {/* ===== MARKETING - GESTÃO DE SERVIÇOS E PREÇOS ===== */}
      <h3 style={{ color: '#a855f7', borderBottom: '1px solid #a855f733', paddingBottom: '10px', marginBottom: '20px' }}>📣 Serviços de Marketing - Precos e Descricoes</h3>
      <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #a855f733', marginBottom: '30px' }}>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px', lineHeight: '1.6' }}>
          Defina o preço de cada serviço de marketing. Aparecem na aba <strong style={{ color: '#a855f7' }}>📣 MARKETING</strong> de todas as oficinas. Deixe o preço em branco para exibir <em>"Sob consulta"</em>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {servicosMarketing.map((s, i) => (
            <div key={s.key} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <span style={{ color: '#a855f7', fontWeight: 'bold', fontSize: '14px' }}>{s.nome}</span>
              </div>
              <textarea
                value={s.desc}
                onChange={e => setServicosMarketing(prev => prev.map((x, idx) => idx === i ? { ...x, desc: e.target.value } : x))}
                rows={2}
                style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#aaa', borderRadius: '6px', fontSize: '12px', resize: 'none', marginBottom: '8px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#555', fontSize: '12px' }}>R$</span>
                <input
                  type="text"
                  value={s.preco}
                  onChange={e => setServicosMarketing(prev => prev.map((x, idx) => idx === i ? { ...x, preco: e.target.value } : x))}
                  placeholder="Ex: 497 ou deixe vazio para Sob consulta"
                  style={{ flex: 1, padding: '10px', background: '#111', border: `1px solid ${s.preco ? '#a855f7' : '#333'}`, color: 'white', borderRadius: '6px', fontSize: '13px' }}
                />
                {s.preco && <span style={{ color: '#a855f7', fontSize: '13px', fontWeight: 'bold' }}>R$ {s.preco}/mês</span>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={salvarMarketing} disabled={salvandoMarketing} style={{ width: '100%', padding: '16px', background: salvandoMarketing ? '#333' : '#a855f7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', marginTop: '20px', fontSize: '14px' }}>
          {salvandoMarketing ? '⏳ SALVANDO...' : '💾 SALVAR SERVIÇOS DE MARKETING'}
        </button>
      </div>

      <h3 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>📋 Lista de Clientes</h3>
      {oficinas.length === 0 ? (
        <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Nenhuma oficina cadastrada ainda.</p>
      ) : oficinas.map(oficina => {
        const dias = diasRestantes(oficina.trialFim);
        const trialVencido = dias !== null && dias < 0;
        return (
          <div key={oficina.id} style={{ background: '#111', padding: '20px', marginBottom: '15px', borderRadius: '10px', border: `1px solid ${!oficina.ativo ? '#FF003344' : '#333'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: oficina.ativo ? 'white' : '#555' }}>{oficina.nomeOficina}</h3>
                <p style={{ color: '#666', margin: '2px 0', fontSize: '12px' }}>📍 {oficina.cidade} | 📱 {oficina.telefone}</p>
                <p style={{ color: '#666', margin: '2px 0', fontSize: '11px' }}>📧 {oficina.email}</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {oficina.plano === 'trial' ? (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: trialVencido ? '#FF003322' : '#00E67622', border: `1px solid ${trialVencido ? '#FF0033' : '#00E676'}` }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>TRIAL</div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: trialVencido ? '#FF0033' : '#00E676' }}>
                      {trialVencido ? `Bloqueado (Venceu há ${Math.abs(dias)}d)` : `${dias} dias restantes`}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#D4AF3722', border: `1px solid ${MASTER_COLOR}` }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: MASTER_COLOR }}>⭐ PLANO ATIVO</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {oficina.plano === 'trial' && (
                    <button onClick={() => aprovarPagamento(oficina)} style={{ padding: '10px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                      💸 APROVAR ASSINATURA
                    </button>
                  )}
                  <button onClick={() => toggleAtivo(oficina)} style={{ padding: '10px', background: oficina.ativo ? '#FF003322' : '#555', color: oficina.ativo ? '#FF0033' : 'white', border: `1px solid ${oficina.ativo ? '#FF0033' : '#555'}`, borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                    {oficina.ativo ? '🔴 SUSPENDER CONTA' : '🟢 REATIVAR'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// ========== MÓDULO DE REVISÃO PREVENTIVA (IA) ===============
// ============================================================
const ModuloRevisao = ({ dadosOficina, papelLogado, oficinaId, osParaEditar, onCancelarEdicao, onSalvo }) => {
  const { analyzeImage } = useGemini();
  const [loadingIA, setLoadingIA] = useState(false);
  const [laudoFinal, setLaudoFinal] = useState('');
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [salvoOS, setSalvoOS] = useState(false);

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [kmAtual, setKmAtual] = useState('');
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');

  // ===== CAMPOS DE VALOR =====
  const [valorPecasRevisao, setValorPecasRevisao] = useState('');
  const [valorMaoObraRevisao, setValorMaoObraRevisao] = useState('');

  const [obsVoz, setObsVoz] = useState('');
  const [escutando, setEscutando] = useState(false);
  const recognitionRef = useRef(null);

  // Preenche campos quando recebe uma O.S. para editar
  useEffect(() => {
    if (osParaEditar) {
      setPlaca(normalizarPlaca(osParaEditar.placa));
      setModelo(osParaEditar.modelo || '');
      setKmAtual(osParaEditar.km || osParaEditar.kmAtual || '');
      setCliente(osParaEditar.nomeCliente || '');
      setTelefone(osParaEditar.telefone || '');
      setValorPecasRevisao(String(osParaEditar.valorPecas || ''));
      setValorMaoObraRevisao(String(osParaEditar.valorMaoObra || ''));
      setObsVoz(osParaEditar.diagnostico || '');
    }
  }, [osParaEditar]);

  // TUDO LIBERADO NO TRIAL OU NO PLANO PAGO (E NO MASTER/DONO)
  const temAcesso = papelLogado === 'master' || papelLogado === 'dono' || dadosOficina?.plano === 'pago' || dadosOficina?.plano === 'trial';

  const [checklist, setChecklist] = useState({
    motor_correia: 'ok', motor_velas: 'ok', motor_fluido: 'ok', motor_vazamento: 'ok',
    freio_pastilha: 'ok', freio_disco: 'ok', freio_fluido: 'ok',
    susp_amortecedor: 'ok', susp_buchas: 'ok', susp_bieleta: 'ok',
    geral_filtro_cabine: 'ok', geral_filtro_ar: 'ok', geral_iluminacao: 'ok', geral_palhetas: 'ok'
  });

  const atualizarItem = (item, valor) => { setChecklist(prev => ({ ...prev, [item]: valor })); setSalvoOS(false); };

  const ouvirVoz = () => {
    if (!('webkitSpeechRecognition' in window)) return alert("Navegador não suporta voz.");
    if (escutando) { recognitionRef.current?.stop(); setEscutando(false); return; }
    const rec = new window.webkitSpeechRecognition();
    rec.lang = 'pt-BR'; recognitionRef.current = rec;
    rec.onstart = () => setEscutando(true);
    rec.onresult = (e) => setObsVoz(prev => prev + " " + e.results[0][0].transcript);
    rec.onend = () => setEscutando(false);
    rec.start();
  };

  const gerarLaudoIA = async () => {
    if (!kmAtual) return alert("Por favor, insira a Quilometragem para a IA calcular o desgaste.");
    setLoadingIA(true);
    setSalvoOS(false);
    const problemasEncontrados = Object.entries(checklist).filter(([_, status]) => status !== 'ok')
      .map(([key, status]) => `${key.split('_').join(' ').toUpperCase()}: ${status === 'atencao' ? 'Atenção' : 'Troca'}`).join(', ');
    try {
      setLaudoFinal("🤖 Gerando diagnóstico detalhado...");
      setTimeout(() => {
        setLaudoFinal(`Olá! Concluímos a revisão do seu ${modelo || 'veículo'} (${kmAtual} km).\n\nItens que exigem cuidado: ${problemasEncontrados || 'Tudo 100% OK!'}. ${obsVoz ? `\nObs do Mecânico: ${obsVoz}` : ''}\n\nPodemos enviar o orçamento das peças preventivas?`);
        setLoadingIA(false);
      }, 2000);
    } catch (e) { setLaudoFinal('Erro.'); setLoadingIA(false); }
  };

  // ✅ NOVO: Salva a revisão como O.S. no Firebase
  const adicionarNaOS = async () => {
    if (!placa) return alert("⚠️ Preencha a PLACA para adicionar à O.S.!");
    if (!oficinaId) return alert("⚠️ Erro: oficina não identificada.");
    setSalvandoOS(true);
    try {
      const itensProblema = Object.entries(checklist)
        .filter(([_, s]) => s !== 'ok')
        .map(([k, s]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${s === 'atencao' ? '⚠️ Atenção' : '🚨 Trocar'}`)
        .join('\n');
      const itensOk = Object.entries(checklist).filter(([_, s]) => s === 'ok').map(([k]) => `✅ ${k.replace(/_/g, ' ')}`).join(', ');
      const checklistTexto = (itensProblema ? `ITENS QUE PRECISAM DE ATENÇÃO:\n${itensProblema}\n\n` : '') + `ITENS OK: ${itensOk}` + (obsVoz ? `\n\nOBS DO MECÂNICO: ${obsVoz}` : '');
      const totalRevisao = (Number(valorPecasRevisao) || 0) + (Number(valorMaoObraRevisao) || 0);
      const dadosRevisao = {
        placa: normalizarPlaca(placa), modelo: modelo || '', km: kmAtual || '',
        nomeCliente: cliente || '', telefone: telefone || '',
        checklist: checklistTexto, diagnostico: laudoFinal || obsVoz || '',
        status: 'Pendente',
        total: totalRevisao,
        valorPecas: valorPecasRevisao || 0,
        valorMaoObra: valorMaoObraRevisao || 0,
        detalhesPecas: '', fotos: [], origem: 'revisao_preventiva',
        data_atualizacao: new Date().toISOString(),
        statusPagamento: 'pendente', statusRetorno: 'pendente',
      };

      if (osParaEditar) {
        // MODO EDIÇÃO
        await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosRevisao);
        if (onSalvo) onSalvo(osParaEditar.id, dadosRevisao);
        alert(`✅ Revisão atualizada para ${normalizarPlaca(placa)}!`);
        if (onCancelarEdicao) onCancelarEdicao();
      } else {
        // MODO NOVO
        if (!laudoFinal || laudoFinal.includes('Gerando')) return alert("⚠️ Gere o diagnóstico primeiro!");
        await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
          ...dadosRevisao,
          data: new Date().toLocaleDateString('pt-BR'),
          data_registro: new Date(),
        });
        setSalvoOS(true);
        alert(`✅ O.S. criada com sucesso para ${placa.toUpperCase()}!`);
      }

      setTimeout(() => {
        setPlaca(''); setModelo(''); setKmAtual(''); setCliente(''); setTelefone('');
        setObsVoz(''); setLaudoFinal(''); setSalvoOS(false);
        setValorPecasRevisao(''); setValorMaoObraRevisao('');
        setChecklist({ motor_correia: 'ok', motor_velas: 'ok', motor_fluido: 'ok', motor_vazamento: 'ok', freio_pastilha: 'ok', freio_disco: 'ok', freio_fluido: 'ok', susp_amortecedor: 'ok', susp_buchas: 'ok', susp_bieleta: 'ok', geral_filtro_cabine: 'ok', geral_filtro_ar: 'ok', geral_iluminacao: 'ok', geral_palhetas: 'ok' });
      }, 1500);
      alert(`✅ O.S. criada com sucesso para ${placa.toUpperCase()}!`);
      setTimeout(() => {
        setPlaca(''); setModelo(''); setKmAtual(''); setCliente(''); setTelefone('');
        setObsVoz(''); setLaudoFinal(''); setSalvoOS(false);
        setValorPecasRevisao(''); setValorMaoObraRevisao('');
        setChecklist({ motor_correia: 'ok', motor_velas: 'ok', motor_fluido: 'ok', motor_vazamento: 'ok', freio_pastilha: 'ok', freio_disco: 'ok', freio_fluido: 'ok', susp_amortecedor: 'ok', susp_buchas: 'ok', susp_bieleta: 'ok', geral_filtro_cabine: 'ok', geral_filtro_ar: 'ok', geral_iluminacao: 'ok', geral_palhetas: 'ok' });
      }, 2000);
    } catch (e) { console.error("Erro ao salvar O.S.:", e); alert("❌ Erro ao salvar! Verifique o console."); }
    setSalvandoOS(false);
  };

  if (!temAcesso) return (<div style={{ background: '#1a0000', border: '1px solid #ef4444', padding: '30px', borderRadius: '15px', textAlign: 'center' }}><h3 style={{ color: '#ef4444' }}>🔒 Módulo Premium</h3><p style={{ color: '#888' }}>A Revisão Preventiva (IA) é exclusiva para assinantes.</p></div>);


  const RenderSelect = ({ id, label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px 15px', borderRadius: '8px', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', color: '#ccc' }}>{label}</span>
      <select value={checklist[id]} onChange={e => atualizarItem(id, e.target.value)} style={{ background: checklist[id] === 'ok' ? '#001a05' : checklist[id] === 'atencao' ? '#332b00' : '#330000', color: checklist[id] === 'ok' ? '#00E676' : checklist[id] === 'atencao' ? '#eab308' : '#FF0033', border: '1px solid #333', padding: '5px', borderRadius: '5px', fontWeight: 'bold' }}>
        <option value="ok">✅ BOM</option><option value="atencao">⚠️ ATENÇÃO</option><option value="trocar">🚨 TROCAR</option>
      </select>
    </div>
  );

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
      <h2 style={{ color: '#3b82f6', marginBottom: '20px' }}>🛡️ Check-up Preventivo IA</h2>
      {osParaEditar && (
        <div style={{ background: '#00001a', border: '2px solid #3b82f6', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }}>✏️ EDITANDO REVISÃO - {osParaEditar.placa}</span>
          <button onClick={() => { if (onCancelarEdicao) onCancelarEdicao(); setPlaca(''); setModelo(''); setKmAtual(''); setCliente(''); setTelefone(''); setValorPecasRevisao(''); setValorMaoObraRevisao(''); setObsVoz(''); }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar Edição</button>
        </div>
      )}
      {/* LINHA 1: PLACA, MODELO, KM */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <input type="text" value={placa} onChange={e => { setPlaca(normalizarPlaca(e.target.value)); setSalvoOS(false); }} placeholder="PLACA *" style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
        <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="MODELO" style={{ flex: 2, minWidth: '150px', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
        <input type="number" value={kmAtual} onChange={e => setKmAtual(e.target.value)} placeholder="KM ATUAL *" style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#001a05', border: '1px solid #00E676', color: '#00E676', borderRadius: '8px', fontWeight: 'bold' }} />
      </div>
      {/* LINHA 2: CLIENTE, TELEFONE */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="NOME DO CLIENTE" style={{ flex: 2, minWidth: '150px', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="TELEFONE / WHATSAPP" style={{ flex: 1, minWidth: '120px', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* CHECKLIST */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h5 style={{ color: '#888', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>MOTOR & ARREFECIMENTO</h5>
          <RenderSelect id="motor_correia" label="Correias (Dentada/Poly-V)" /><RenderSelect id="motor_velas" label="Velas e Cabos" /><RenderSelect id="motor_fluido" label="Fluído do Radiador" /><RenderSelect id="motor_vazamento" label="Vazamentos de Óleo/Água" />
          <h5 style={{ color: '#888', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '15px' }}>FREIOS</h5>
          <RenderSelect id="freio_pastilha" label="Pastilhas de Freio" /><RenderSelect id="freio_disco" label="Discos de Freio" /><RenderSelect id="freio_fluido" label="Fluído de Freio" />
          <h5 style={{ color: '#888', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '15px' }}>SUSPENSÃO & DIREÇÃO</h5>
          <RenderSelect id="susp_amortecedor" label="Amortecedores" /><RenderSelect id="susp_buchas" label="Buchas da Bandeja" /><RenderSelect id="susp_bieleta" label="Bieletas / Terminais" />
          <h5 style={{ color: '#888', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: '15px' }}>GERAL</h5>
          <RenderSelect id="geral_filtro_cabine" label="Filtro de Cabine" /><RenderSelect id="geral_filtro_ar" label="Filtro de Ar" /><RenderSelect id="geral_iluminacao" label="Iluminação" /><RenderSelect id="geral_palhetas" label="Palhetas" />
        </div>
        {/* PAINEL DIREITO */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #3b82f644' }}>
            <h5 style={{ color: '#3b82f6', marginBottom: '15px' }}>🎙️ Relato do Mecânico</h5>
            <textarea value={obsVoz} onChange={e => setObsVoz(e.target.value)} placeholder="Ex: Cliente reclama de barulho na roda direita..." rows={4} style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: 'white', border: '1px solid #333', borderRadius: '8px', marginBottom: '10px', resize: 'none' }} />
            <button onClick={ouvirVoz} style={{ width: '100%', padding: '15px', background: escutando ? '#ef4444' : '#222', color: escutando ? 'white' : '#3b82f6', border: `1px solid ${escutando ? '#ef4444' : '#3b82f6'}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>{escutando ? '🔴 GRAVANDO... (Clique para parar)' : '🎙️ Ditar por Voz'}</button>
            <button onClick={gerarLaudoIA} disabled={loadingIA} style={{ width: '100%', padding: '18px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px #3b82f644', marginBottom: '10px' }}>{loadingIA ? '⏳ PROCESSANDO IA...' : '✨ GERAR DIAGNÓSTICO PARA O CLIENTE'}</button>
            {/* ===== VALOR DO SERVIÇO - REVISÃO ===== */}
            <div style={{ background: '#0a0a0a', padding: '12px', borderRadius: '8px', border: '1px solid #3b82f644', marginBottom: '10px' }}>
              <label style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💰 VALOR DO SERVIÇO</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#666', fontSize: '10px' }}>PEÇAS (R$)</label>
                  <input type="number" value={valorPecasRevisao} onChange={e => setValorPecasRevisao(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '6px', fontSize: '14px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#666', fontSize: '10px' }}>MÃO DE OBRA (R$)</label>
                  <input type="number" value={valorMaoObraRevisao} onChange={e => setValorMaoObraRevisao(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '6px', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#888', fontSize: '11px' }}>TOTAL: </span>
                <strong style={{ color: '#00E676', fontSize: '18px' }}>R$ {((Number(valorPecasRevisao) || 0) + (Number(valorMaoObraRevisao) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
            {/* ✅ BOTÃO NOVO: ADICIONAR À O.S. */}
            <button
              onClick={adicionarNaOS}
              disabled={salvandoOS || salvoOS || !laudoFinal || loadingIA}
              style={{
                width: '100%', padding: '18px',
                background: salvoOS ? '#00E676' : salvandoOS ? '#333' : (!laudoFinal || loadingIA) ? '#1a1a1a' : '#FF6600',
                color: salvoOS ? 'black' : (!laudoFinal || loadingIA) ? '#555' : 'white',
                border: `2px solid ${salvoOS ? '#00E676' : (!laudoFinal || loadingIA) ? '#333' : '#FF6600'}`,
                borderRadius: '8px', fontWeight: '900', fontSize: '14px',
                cursor: (salvandoOS || salvoOS || !laudoFinal || loadingIA) ? 'not-allowed' : 'pointer',
                boxShadow: (!laudoFinal || loadingIA) ? 'none' : '0 4px 15px rgba(255,102,0,0.3)',
              }}
            >
              {salvoOS ? '✅ ADICIONADO À O.S.!' : salvandoOS ? '⏳ SALVANDO...' : '📋 ADICIONAR À O.S.'}
            </button>
            <p style={{ color: '#555', fontSize: '11px', textAlign: 'center', marginTop: '6px', marginBottom: '10px' }}>
              {!laudoFinal ? 'Gere o diagnóstico primeiro para habilitar' : 'Salva a revisão como nova O.S. no sistema'}
            </p>
            {laudoFinal && !laudoFinal.includes('Gerando') && (
              <div style={{ marginTop: '10px', background: '#001a05', border: '1px solid #00E676', padding: '15px', borderRadius: '8px' }}>
                <p style={{ color: '#00E676', fontSize: '11px', fontWeight: 'bold', margin: '0 0 10px 0' }}>✅ TEXTO PRONTO PARA WHATSAPP:</p>
                <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>{laudoFinal}</p>
                <button onClick={() => window.open(`https://wa.me/${telefone ? telefone.replace(/\D/g, '') : ''}?text=${encodeURIComponent(laudoFinal)}`, '_blank')} style={{ width: '100%', padding: '10px', background: '#25D366', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '5px', marginTop: '15px', cursor: 'pointer' }}>📲 Enviar via WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ========== CARROSSEL 5 FOTOS DE PNEUS ======================
// ============================================================
const TIRE_LABELS = ['DE Diant. Esq.', 'DD Diant. Dir.', 'TE Tras. Esq.', 'TD Tras. Dir.', 'Pneu Novo'];
const TirePhotoCarousel = () => {
  const [fotos, setFotos] = useState([null,null,null,null,null]);
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
      {fotos.map((foto, idx) => (
        <div key={idx} style={{ flexShrink: 0, width: '90px' }}>
          {foto ? (
            <div style={{ position: 'relative' }}>
              <img src={foto} style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #00E676' }} />
              <button onClick={() => { const n=[...fotos]; n[idx]=null; setFotos(n); }} style={{ position: 'absolute', top: '2px', right: '2px', background: '#FF0033', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>×</button>
              <div style={{ fontSize: '8px', color: '#00E676', textAlign: 'center', marginTop: '3px' }}>{TIRE_LABELS[idx]}</div>
            </div>
          ) : (
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{ width: '90px', height: '70px', border: '2px dashed #00E67666', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
                <div style={{ fontSize: '16px' }}>📷</div>
                <div style={{ fontSize: '8px', color: '#00E676', textAlign: 'center', marginTop: '2px', padding: '0 3px' }}>{TIRE_LABELS[idx]}</div>
              </div>
              <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={e => { if (!e.target.files[0]) return; const r = new FileReader(); r.onloadend = () => { const n=[...fotos]; n[idx]=r.result; setFotos(n); }; r.readAsDataURL(e.target.files[0]); }} />
            </label>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// ========== MÓDULO DE PNEUS E BORRACHARIA (VENDAS/CONSERTOS) 
// ============================================================
const ModuloPneus = ({ dadosOficina, papelLogado, oficinaId, osParaEditar, onCancelarEdicao, onSalvo }) => {
  const { analyzeImage } = useGemini();
  const [loading, setLoading] = useState(false);
  const [laudoPneu, setLaudoPneu] = useState('');
  const [fotoPneu, setFotoPneu] = useState(null);
  
  // Dados do Cliente/Veículo
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [salvoOS, setSalvoOS] = useState(false);

  // Consertos
  const [servicosBorracharia, setServicosBorracharia] = useState([]);
  
  // Vendas
  const [pneuVenda, setPneuVenda] = useState('');
  const [qtdPneu, setQtdPneu] = useState('1');
  const [valorPneu, setValorPneu] = useState('');
  const [obsPneu, setObsPneu] = useState('');
  const [campoOuvindoPneu, setCampoOuvindoPneu] = useState(false);
  const recPneuRef = useRef(null);

  // Valor do serviço de conserto (remendo, etc.)
  const [valorServico, setValorServico] = useState('');

  // Preenche campos quando recebe uma O.S. para editar
  useEffect(() => {
    if (osParaEditar) {
      // Se placa tem menos de 5 chars E modelo parece ser o resto da placa (só números/letras curto)
      // tenta reconstruir a placa completa juntando os dois
      const placaBruta = osParaEditar.placa || '';
      const modeloBruto = osParaEditar.modelo || '';
      const placaPareceParcial = placaBruta.length < 5 && modeloBruto.length <= 4 && /^[A-Z0-9\s\-]+$/i.test(modeloBruto);
      
      if (placaPareceParcial) {
        setPlaca(normalizarPlaca(placaBruta + modeloBruto));
        setModelo(''); // modelo estava errado, limpa
      } else {
        setPlaca(normalizarPlaca(placaBruta));
        setModelo(modeloBruto);
      }
      setCliente(osParaEditar.nomeCliente || '');
      setTelefone(osParaEditar.telefone || '');
      // Tenta extrair serviços do checklist salvo
      const checklistSalvo = osParaEditar.checklist || '';
      if (checklistSalvo.includes('Serviços:')) {
        const match = checklistSalvo.match(/Serviços: ([^|]+)/);
        if (match) setServicosBorracharia(match[1].trim().split(', '));
      }
      if (checklistSalvo.includes('Pneus Novos:')) {
        const match = checklistSalvo.match(/(\d+)x (.+)/);
        if (match) { setQtdPneu(match[1]); setPneuVenda(match[2]); }
        setValorPneu(String(osParaEditar.valorPecas || ''));
      }
    }
  }, [osParaEditar]);

  const temAcesso = papelLogado === 'master' || papelLogado === 'dono' || dadosOficina?.plano === 'pago' || dadosOficina?.plano === 'trial';

  const analisarPneu = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setFotoPneu(reader.result); setLoading(true); setLaudoPneu('🤖 Analisando sulcos e TWI da foto...');
      try {
        const res = await analyzeImage('Atue como um borracheiro especialista. Analise o desgaste deste pneu na foto através do TWI ou sulcos. Diga se está Bom, Meia-vida ou Careca (necessita troca urgente). Seja direto e responda em até 2 linhas.', reader.result);
        setLaudoPneu(res);
      } catch { setLaudoPneu('Erro na análise da foto pela IA.'); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // ✅ FUNÇÃO NOVA: Salvar Vendas/Consertos na O.S.
  const adicionarNaOS = async () => {
    if (!placa) return alert("⚠️ Preencha a PLACA do veículo!");
    if (!oficinaId) return alert("⚠️ Erro de conexão com o banco de dados.");
    
    setSalvandoOS(true);
    try {
      const txtServicos = servicosBorracharia.length > 0 ? `Serviços: ${servicosBorracharia.join(', ')}` : '';
      const txtPneus = pneuVenda ? `Pneus Novos: ${qtdPneu}x ${pneuVenda}` : '';
      const checklistTexto = [txtServicos, txtPneus].filter(Boolean).join(' | ');

      const totalPneus = pneuVenda ? (Number(qtdPneu) || 0) * (Number(valorPneu) || 0) : 0;
      const totalServico = Number(valorServico) || 0;
      const totalGeral = totalPneus + totalServico;

      const dadosPneu = {
        placa: normalizarPlaca(placa),
        modelo: modelo || '',
        nomeCliente: cliente || '',
        telefone: telefone || '',
        checklist: checklistTexto || 'Serviço de Borracharia',
        diagnostico: laudoPneu ? `Laudo IA: ${laudoPneu}` : '',
        status: 'Pendente',
        statusPagamento: 'pendente',
        statusRetorno: 'pendente',
        total: totalGeral,
        valorPecas: totalPneus.toString(),
        valorMaoObra: totalServico.toString(),
        detalhesPecas: [txtPneus, obsPneu].filter(Boolean).join(' | '),
        observacoes: obsPneu || '',
        fotos: fotoPneu ? [{ foto: fotoPneu, legenda: 'Foto do Pneu (Desgaste)' }] : [],
        origem: 'borracharia_pneus',
        tipoServico: 'borracharia'
      };

      if (osParaEditar) {
        // MODO EDIÇÃO
        await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosPneu);
        if (onSalvo) onSalvo(osParaEditar.id, dadosPneu); // atualiza lista local
        alert(`✅ O.S. de Pneus atualizada para ${normalizarPlaca(placa)}!`);
        if (onCancelarEdicao) onCancelarEdicao();
      } else {
        // MODO NOVO
        await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
          ...dadosPneu,
          data: new Date().toLocaleDateString('pt-BR'),
          data_registro: new Date().toISOString(),
        });
        setSalvoOS(true);
        alert(`✅ Pneus/Serviços adicionados à O.S. da placa ${normalizarPlaca(placa)}!`);
        // Limpa os campos
        setTimeout(() => {
          setPlaca(''); setModelo(''); setCliente(''); setTelefone('');
          setServicosBorracharia([]); setPneuVenda(''); setQtdPneu('1'); setValorPneu('');
          setFotoPneu(null); setLaudoPneu(''); setSalvoOS(false); setValorServico(''); setObsPneu('');
        }, 2000);
      }
    } catch (e) {
      console.error(e);
      alert("❌ Erro ao salvar. Verifique sua conexão.");
    }
    setSalvandoOS(false);
  };

  if (!temAcesso) return (<div style={{ background: '#1a0000', border: '1px solid #ef4444', padding: '30px', borderRadius: '15px', textAlign: 'center' }}><h3 style={{ color: '#ef4444' }}>🔒 Módulo Premium</h3><p style={{ color: '#888' }}>A Borracharia IA é exclusiva para assinantes.</p></div>);

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: '1px solid #333' }}>
      <h2 style={{ color: '#00E676', marginBottom: '20px' }}>🛞 Pneus, Borracharia e Vendas</h2>
      {osParaEditar && (
        <div style={{ background: '#001a00', border: '2px solid #00E676', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#00E676', fontWeight: 'bold', fontSize: '14px' }}>✏️ EDITANDO O.S. PNEUS - {osParaEditar.placa}</span>
          <button onClick={() => { if (onCancelarEdicao) onCancelarEdicao(); setPlaca(''); setModelo(''); setCliente(''); setTelefone(''); setServicosBorracharia([]); setPneuVenda(''); setValorPneu(''); }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar Edição</button>
        </div>
      )}
      
      {/* CAMPOS DO CLIENTE ADICIONADOS AQUI */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="text" value={placa} onChange={e => setPlaca(normalizarPlaca(e.target.value))} placeholder="PLACA *" style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '8px', fontWeight: 'bold' }} />
        <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="MODELO" style={{ flex: 2, minWidth: '150px', padding: '12px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
        <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="NOME DO CLIENTE" style={{ flex: 2, minWidth: '150px', padding: '12px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
        <input type="text" value={telefone} onChange={e => setTelefone(e.target.value.replace(/\D/g, ''))} placeholder="WHATSAPP" style={{ flex: 1, minWidth: '120px', padding: '12px', background: '#111', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* LADO ESQUERDO: CONSERTOS E VENDAS */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h5 style={{ color: '#888', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🛠️ SERVIÇOS DE CONSERTO (BORRACHARIA)</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '25px' }}>
            {['Remendo Furo (Macarrão)', 'Remendo Frio (Interno)', 'Vulcanização', 'Montagem / Desmontagem', 'Troca de Válvula / Bico', 'Rodízio de Pneus'].map(item => (
              <button key={item} onClick={() => setServicosBorracharia(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item])} style={{ padding: '12px', background: servicosBorracharia.includes(item) ? '#001a05' : '#111', color: servicosBorracharia.includes(item) ? '#00E676' : '#888', border: `1px solid ${servicosBorracharia.includes(item) ? '#00E676' : '#333'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                {item}
              </button>
            ))}
          </div>

          {/* VALOR DO SERVIÇO - aparece sempre, cobre remendo e qualquer conserto */}
          <div style={{ background: '#001a05', border: '2px solid #00E676', borderRadius: '10px', padding: '15px', margin: '15px 0' }}>
            <label style={{ color: '#00E676', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💰 VALOR DO SERVIÇO (R$)</label>
            <input
              type="number"
              value={valorServico}
              onChange={e => setValorServico(e.target.value)}
              placeholder="Ex: 25,00"
              style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #00E676', color: '#00E676', borderRadius: '8px', fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}
            />
            <p style={{ color: '#555', fontSize: '11px', margin: '6px 0 0 0' }}>Remendo, mão de obra, conserto, balanceamento avulso...</p>
          </div>

          <h5 style={{ color: '#888', fontSize: '14px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>🛒 VENDA DE PNEUS NOVOS</h5>
          <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
            <input type="text" value={pneuVenda} onChange={e => setPneuVenda(e.target.value)} placeholder="Modelo / Medida (Ex: Pirelli 175/70 R14)" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '5px', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#888' }}>QTD</label>
                <input type="number" value={qtdPneu} onChange={e => setQtdPneu(e.target.value)} min="1" max="4" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '5px', textAlign: 'center' }} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '10px', color: '#888' }}>VALOR UNITÁRIO (R$)</label>
                <input type="number" value={valorPneu} onChange={e => setValorPneu(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: '#00E676', borderRadius: '5px', fontWeight: 'bold' }} />
              </div>
            </div>

            {/* TOTAL EM DESTAQUE */}
            {((Number(valorServico) || 0) + (pneuVenda ? (Number(qtdPneu) || 0) * (Number(valorPneu) || 0) : 0)) > 0 && (
              <div style={{ background: '#1a1a00', border: '2px solid #eab308', borderRadius: '10px', padding: '12px', marginTop: '12px', textAlign: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>VALOR TOTAL DA O.S.: </span>
                <strong style={{ color: '#eab308', fontSize: '24px' }}>
                  R$ {((Number(valorServico) || 0) + (pneuVenda ? (Number(qtdPneu) || 0) * (Number(valorPneu) || 0) : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}

            {/* OBSERVAÇÕES COM MICROFONE */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>📝 OBSERVAÇÕES / INFORMAÇÕES ADICIONAIS</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={obsPneu}
                  onChange={e => setObsPneu(e.target.value)}
                  placeholder="Ex: pneu com bolha, desgaste irregular, cliente solicitou retorno..."
                  rows={3}
                  style={{ flex: 1, padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '13px', resize: 'none' }}
                />
                <button
                  onClick={() => {
                    if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
                    if (campoOuvindoPneu) { recPneuRef.current?.stop(); setCampoOuvindoPneu(false); return; }
                    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                    rec.lang = 'pt-BR'; rec.interimResults = false; recPneuRef.current = rec;
                    rec.onstart = () => setCampoOuvindoPneu(true);
                    rec.onresult = e => { setObsPneu(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript); setCampoOuvindoPneu(false); };
                    rec.onerror = () => setCampoOuvindoPneu(false);
                    rec.onend = () => setCampoOuvindoPneu(false);
                    rec.start();
                  }}
                  style={{ background: campoOuvindoPneu ? '#ef4444' : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }}
                >
                  {campoOuvindoPneu ? '🔴' : '🎤'}
                </button>
              </div>
            </div>
            
            <button 
              onClick={adicionarNaOS}
              disabled={salvandoOS || salvoOS}
              style={{ width: '100%', padding: '15px', background: salvoOS ? '#00E676' : salvandoOS ? '#333' : '#00E676', color: salvandoOS ? 'white' : 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: (salvandoOS || salvoOS) ? 'not-allowed' : 'pointer', marginTop: '15px' }}
            >
              {salvoOS ? '✅ ADICIONADO À O.S.' : salvandoOS ? '⏳ SALVANDO...' : osParaEditar ? '💾 SALVAR EDIÇÃO' : '➕ ADICIONAR À O.S.'}
            </button>
          </div>
        </div>

        {/* LADO DIREITO: IA SCANNER */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #00E67644', height: '100%' }}>
            <h5 style={{ color: '#00E676', marginBottom: '15px' }}>🤖 Scanner de Desgaste (IA)</h5>
            <p style={{ color: '#aaa', fontSize: '12px' }}>Tire uma foto pegando o sulco do pneu. A IA dirá se precisa vender um novo para o cliente.</p>
            
            <label style={{ display: 'block', padding: '30px', background: '#001a05', border: '2px dashed #00E676', textAlign: 'center', cursor: 'pointer', borderRadius: '10px', marginBottom: '15px' }}>
              <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>📷</span>
              <strong style={{ color: '#00E676' }}>{loading ? 'ANALISANDO IMAGEM...' : 'FOTOGRAFAR SULCO DO PNEU'}</strong>
              <input type="file" accept="image/*" capture="environment" onChange={analisarPneu} style={{ display: 'none' }} disabled={loading} />
            </label>

            {fotoPneu && (
              <div style={{ textAlign: 'center' }}>
                <img src={fotoPneu} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333', marginBottom: '10px' }} />
              </div>
            )}

            {laudoPneu && (
              <div style={{ background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '15px' }}>
                <p style={{ color: '#eab308', fontSize: '11px', fontWeight: 'bold', margin: '0 0 5px 0' }}>RESULTADO DA INTELIGÊNCIA ARTIFICIAL:</p>
                <p style={{ color: 'white', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>"{laudoPneu}"</p>
              </div>
            )}

            {/* CARROSSEL 5 FOTOS DOS PNEUS */}
            <div style={{ background: '#0a0a0a', border: '1px solid #00E67633', borderRadius: '10px', padding: '12px' }}>
              <p style={{ color: '#00E676', fontSize: '11px', fontWeight: 'bold', margin: '0 0 10px 0' }}>📸 FOTOS DOS PNEUS (máx. 5 - instalados e novos)</p>
              <TirePhotoCarousel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// ============================================================
// ========== MÓDULO DE COPILOTO TÉCNICO (IA) =================
// ============================================================
const CopilotoIA = ({ papelLogado, dadosOficina }) => {
  const { analyzeImage } = useGemini();
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState('');
  const [pensando, setPensando] = useState(false);
  const [escutando, setEscutando] = useState(false);
  const [fotoAnexada, setFotoAnexada] = useState(null);
  const [modoAtivo, setModoAtivo] = useState('texto'); // 'texto' | 'foto' | 'video'
  const recognitionRef = useRef(null);

  const temAcesso = papelLogado === 'master' || papelLogado === 'dono' || dadosOficina?.plano === 'pago' || dadosOficina?.plano === 'trial';

  const ouvirVoz = () => {
    if (!('webkitSpeechRecognition' in window)) return alert("Navegador não suporta voz.");
    if (escutando) { recognitionRef.current?.stop(); setEscutando(false); return; }
    const rec = new window.webkitSpeechRecognition();
    rec.lang = 'pt-BR'; recognitionRef.current = rec;
    rec.onstart = () => setEscutando(true);
    rec.onresult = (e) => setPergunta(prev => prev + " " + e.results[0][0].transcript);
    rec.onend = () => setEscutando(false);
    rec.start();
  };

  const anexarFoto = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFotoAnexada(reader.result);
    reader.readAsDataURL(file);
  };

  const perguntar = async () => {
    if (!pergunta && !fotoAnexada) return;
    setPensando(true);
    setResposta('👨‍🔧 Analisando com IA...');
    try {
      const promptBase = `Você é um mecânico automotivo especialista sênior com 20 anos de experiência. Responda em português do Brasil de forma técnica, prática e direta. Use tópicos numerados quando útil. Se mencionar torques, especificações ou procedimentos, seja preciso.`;
      const perguntaFinal = pergunta || 'Analise esta imagem e diga o que está errado no veículo.';
      const res = await analyzeImage(`${promptBase}\n\nPERGUNTA DO MECÂNICO: ${perguntaFinal}`, fotoAnexada || null);
      setResposta(res);
    } catch (e) {
      setResposta('❌ Erro ao consultar a IA. Verifique sua conexão e tente novamente.');
    }
    setPensando(false);
  };

  const EXEMPLOS = [
    { label: '🔴 Erro P0420', q: 'Qual o significado do código OBD2 P0420 e como diagnosticar passo a passo com multímetro?' },
    { label: '🔩 Torque EA111', q: 'Qual a ordem e o torque de aperto do cabeçote do motor VW EA111 1.0/1.6?' },
    { label: '⚙️ Ponto GM 1.4', q: 'Como marcar o ponto do sincronismo da correia dentada do motor GM 1.4 SPE/4? Quais as marcas de referência?' },
    { label: '🔋 Bateria fraca', q: 'Carro não pega, bateria carregada. Quais os passos para diagnosticar o problema?' },
    { label: '💨 Motor falhando', q: 'Motor falhando na lenta com código P0301. Qual o passo a passo para diagnosticar?' },
  ];

  if (!temAcesso) return (<div style={{ background: '#1a0000', border: '1px solid #ef4444', padding: '30px', borderRadius: '15px', textAlign: 'center' }}><h3 style={{ color: '#ef4444' }}>🔒 Módulo Premium</h3><p style={{ color: '#888' }}>O Copiloto Técnico IA é exclusivo para assinantes.</p></div>);

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${COPILOTO_COLOR}` }}>
      <h2 style={{ color: COPILOTO_COLOR, marginBottom: '5px' }}>👨‍🔧 Copiloto Técnico IA</h2>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>Assistente mecânico com IA real. Tire foto do defeito, grave um vídeo no Gemini ou digite sua dúvida técnica.</p>

      {/* SELETOR DE MODO */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'texto', icon: '⌨️', label: 'Digitar / Voz' },
          { id: 'foto', icon: '📸', label: 'Foto do Defeito' },
          { id: 'video', icon: '🎥', label: 'Vídeo no Gemini' },
        ].map(m => (
          <button key={m.id} onClick={() => setModoAtivo(m.id)} style={{ flex: 1, minWidth: '120px', padding: '12px', background: modoAtivo === m.id ? COPILOTO_COLOR : '#111', color: modoAtivo === m.id ? 'black' : COPILOTO_COLOR, border: `1px solid ${COPILOTO_COLOR}`, borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* MODO VÍDEO: instruções para usar o Gemini */}
      {modoAtivo === 'video' && (
        <div style={{ background: '#0d0020', border: `2px solid ${COPILOTO_COLOR}`, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h4 style={{ color: COPILOTO_COLOR, margin: '0 0 15px 0' }}>🎥 Como diagnosticar pelo Vídeo com Gemini</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              '1️⃣ Abra o app Gemini no celular (ou gemini.google.com no PC)',
              '2️⃣ Toque no ícone de câmera 📹 para iniciar análise ao vivo',
              '3️⃣ Aponte a câmera para o defeito: barulho, vazamento, fumaça, peça vibrando...',
              '4️⃣ Diga ao Gemini: "Você é um mecânico especialista. O que está errado neste veículo?"',
              '5️⃣ O Gemini analisa em tempo real e responde pelo áudio!',
            ].map((p, i) => (
              <p key={i} style={{ color: '#ccc', fontSize: '13px', margin: 0, padding: '8px 12px', background: '#1a0030', borderRadius: '8px', borderLeft: `3px solid ${COPILOTO_COLOR}` }}>{p}</p>
            ))}
          </div>
          <div style={{ marginTop: '15px', background: '#1a1a00', border: '1px solid #eab308', borderRadius: '8px', padding: '12px' }}>
            <p style={{ color: '#eab308', fontSize: '12px', margin: 0 }}>💡 <strong>Dica pro:</strong> Funciona muito bem para: barulho na suspensão, motor falhando ao vivo, vazamentos, freios riscando. Já diagnosticamos vários defeitos difíceis assim!</p>
          </div>
          <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '15px', padding: '12px', background: COPILOTO_COLOR, color: 'black', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'none' }}>
            🚀 Abrir Gemini agora
          </a>
        </div>
      )}

      {/* MODO FOTO */}
      {modoAtivo === 'foto' && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', padding: '20px', background: fotoAnexada ? '#0d0020' : '#111', border: `2px dashed ${COPILOTO_COLOR}`, borderRadius: '10px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            {fotoAnexada ? (
              <img src={fotoAnexada} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} />
            ) : (
              <>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📸</div>
                <strong style={{ color: COPILOTO_COLOR }}>Tire foto do defeito</strong>
                <p style={{ color: '#555', fontSize: '12px', margin: '5px 0 0 0' }}>Peça com problema, código no scanner, vazamento, etc.</p>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" onChange={anexarFoto} style={{ display: 'none' }} />
          </label>
          {fotoAnexada && (
            <button onClick={() => setFotoAnexada(null)} style={{ width: '100%', padding: '8px', background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Remover foto</button>
          )}
        </div>
      )}

      {/* CAMPO DE PERGUNTA (texto + voz) - aparece em texto e foto */}
      {modoAtivo !== 'video' && (
        <>
          {/* Exemplos rápidos */}
          {modoAtivo === 'texto' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
              {EXEMPLOS.map((ex, i) => (
                <button key={i} onClick={() => setPergunta(ex.q)} style={{ background: '#111', color: COPILOTO_COLOR, border: `1px solid ${COPILOTO_COLOR}44`, padding: '6px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer' }}>{ex.label}</button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <textarea
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder={modoAtivo === 'foto' ? 'Descreva o que vê na foto (opcional - a IA analisa mesmo sem texto)...' : 'Digite a dúvida ou código de erro (Ex: Palio falhando na lenta)...'}
              rows={3}
              style={{ flex: 1, padding: '12px', background: '#111', border: `1px solid ${COPILOTO_COLOR}44`, color: 'white', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
            />
            <button onClick={ouvirVoz} style={{ padding: '0 16px', background: escutando ? '#ef4444' : '#222', color: escutando ? 'white' : COPILOTO_COLOR, border: `1px solid ${escutando ? '#ef4444' : '#333'}`, borderRadius: '8px', fontSize: '22px', cursor: 'pointer', alignSelf: 'stretch' }}>
              {escutando ? '🔴' : '🎤'}
            </button>
          </div>

          <button onClick={perguntar} disabled={pensando || (!pergunta && !fotoAnexada)} style={{ width: '100%', padding: '15px', background: pensando ? '#333' : COPILOTO_COLOR, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: pensando ? 'not-allowed' : 'pointer', marginBottom: '20px' }}>
            {pensando ? '⏳ ANALISANDO COM IA...' : fotoAnexada ? '🔍 ANALISAR FOTO COM IA' : '🔍 PERGUNTAR AO COPILOTO'}
          </button>
        </>
      )}

      {/* RESPOSTA */}
      {resposta && (
        <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: `1px solid ${COPILOTO_COLOR}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ color: COPILOTO_COLOR, fontSize: '12px', fontWeight: 'bold', margin: 0 }}>RESPOSTA TÉCNICA DA IA:</p>
            <button onClick={() => { setPergunta(''); setFotoAnexada(null); setResposta(''); }} style={{ background: 'transparent', color: '#555', border: '1px solid #333', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}>🗑️ Limpar</button>
          </div>
          <p style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{resposta}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ========== MÓDULO: MEU PLANO (MONTADOR DE PACOTES) =========
// ============================================================
const ModuloMeuPlano = ({ dadosOficina, planosSistema }) => {
  const [ciclo, setCiclo] = useState('mensal'); // 'mensal' ou 'anual'
  
  // Base Plano é apenas OS + Financeiro (Obrigatório)
  const [modulos, setModulos] = useState({
    base: true,
    clientes: false,
    estoque: false,
    retorno: false,
    alinhamento: false,
    pneus: false,
    revisaoIa: false,
    copiloto: false,
    oficina: false,
    injecao: false,
    desmanche: false,
  });

  // Se o banco não carregar, usa o DEFAULT_PLANOS configurado no topo
  const precos = (planosSistema && planosSistema.mensal) ? planosSistema : DEFAULT_PLANOS;

  const toggleModulo = (mod) => {
    if (mod === 'base') return; // Base não pode ser desmarcado
    setModulos(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const somaMensal = Object.keys(modulos).reduce((acc, key) => {
    if (modulos[key]) return acc + (precos.mensal[key] || 0);
    return acc;
  }, 0);
  const totalMensal = somaMensal;
  const totalAnual = Math.round(somaMensal * 12 * 0.85); // 12 meses com 15% OFF
  const total = ciclo === 'anual' ? totalAnual : totalMensal;

  const enviarWhatsAppDeVenda = () => {
    const nomesMods = [];
    if (modulos.base) nomesMods.push('Sistema Base (O.S. + Financeiro)');
    if (modulos.clientes) nomesMods.push('Gestão de Clientes');
    if (modulos.estoque) nomesMods.push('Estoque');
    if (modulos.retorno) nomesMods.push('Retorno Automático');
    if (modulos.alinhamento) nomesMods.push('Alinhamento 3D');
    if (modulos.pneus) nomesMods.push('Pneus & Borracharia');
    if (modulos.revisaoIa) nomesMods.push('Revisão Preventiva IA');
    if (modulos.copiloto) nomesMods.push('Copiloto Técnico IA');
    if (modulos.oficina) nomesMods.push('Módulo Oficina (O.S. Mecânica)');
    if (modulos.desmanche) nomesMods.push('Módulo Desmanche');

    const pacoteStr = nomesMods.join('\n- ');
    const msg = `Olá, Elton! Meu período de teste está acabando. Quero assinar o *Oficina IA*.\n\n🔄 *Ciclo:* ${ciclo.toUpperCase()}\n\n📦 *Módulos Escolhidos:*\n- ${pacoteStr}\n\n💰 *Valor Total:* R$ ${total},00\n\nPode me enviar a chave PIX para liberação?`;
    
    const numeroExpressAI = precos.whatsapp || "5534999999999"; 
    window.open(`https://wa.me/${numeroExpressAI}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${GREEN_MONEY}` }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: GREEN_MONEY, margin: '0 0 10px 0' }}>💎 Monte a sua Oficina IA</h2>
        <p style={{ color: '#888', fontSize: '14px' }}>Seu teste grátis está acabando. Escolha apenas os módulos que a sua oficina vai usar e pague menos!</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <div style={{ background: '#111', borderRadius: '30px', border: '1px solid #333', display: 'flex', padding: '5px' }}>
          <button onClick={() => setCiclo('mensal')} style={{ padding: '10px 30px', borderRadius: '25px', border: 'none', background: ciclo === 'mensal' ? GREEN_MONEY : 'transparent', color: ciclo === 'mensal' ? 'black' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>MENSAL</button>
          <button onClick={() => setCiclo('anual')} style={{ padding: '10px 30px', borderRadius: '25px', border: 'none', background: ciclo === 'anual' ? GREEN_MONEY : 'transparent', color: ciclo === 'anual' ? 'black' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', position: 'relative' }}>
            ANUAL<span style={{ position: 'absolute', top: '-10px', right: '-10px', background: MAIN_COLOR, color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '10px' }}>15% OFF</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        
        {/* BASE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><input type="checkbox" checked={true} readOnly style={{ transform: 'scale(1.5)' }} />Sistema Base (Obrigatório)</h4>
            <p style={{ margin: 0, color: '#888', fontSize: '12px', paddingLeft: '25px' }}>{precos.descricaoBase || 'Abertura de O.S. Geral e Controle Financeiro.'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: GREEN_MONEY, fontSize: '18px' }}>R$ {precos.mensal.base},00<span style={{fontSize:'12px',color:'#888'}}>/mês</span></div>
            {ciclo === 'anual' && <div style={{fontSize:'11px',color:'#f59e0b'}}>💰 R$ {Math.round(precos.mensal.base * 12 * 0.85).toLocaleString('pt-BR')}/ano (15% OFF)</div>}
          </div>
        </div>

        {/* ADD ONS */}
        {[
          { id: 'clientes', label: '+ Gestão de Clientes', desc: 'Captura rápida de leads e histórico.' },
          { id: 'estoque', label: '+ Controle de Estoque', desc: 'Alertas de peças em nível crítico.' },
          { id: 'retorno', label: '+ Módulo de Retorno (Vendas)', desc: 'Avisa clientes com manutenções vencidas.' },
          { id: 'alinhamento', label: '+ Módulo Alinhamento 3D', desc: 'Checklist de geometria e laudo.' },
          { id: 'pneus', label: '+ Módulo Pneus & Borracharia', desc: 'Scanner de desgaste TWI e venda direta.' },
          { id: 'revisaoIa', label: '+ Revisão Preventiva (IA)', desc: 'Gere laudos persuasivos usando voz e Inteligência Artificial.' },
          { id: 'copiloto', label: '+ Copiloto Técnico (IA)', desc: 'Consulte códigos de erro e manuais mecânicos na hora.' },
          { id: 'oficina', label: '+ Módulo Oficina Mecânica', desc: 'O.S. por serviço: Mecânica, Injeção, Motos, Lataria, Amortecedores.' },
          { id: 'injecao', label: '+ Módulo Injeção Eletrônica', desc: 'Diagnóstico e limpeza de injetores com checklist e fotos.' },
          { id: 'desmanche', label: '+ Módulo Desmanche', desc: 'Gestão de pátio, peças, clientes e rede de parceiros B2B.' },
        ].map(item => (
          <div key={item.id} onClick={() => toggleModulo(item.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: modulos[item.id] ? '#001a05' : '#111', padding: '15px 20px', borderRadius: '10px', border: `1px solid ${modulos[item.id] ? GREEN_MONEY : '#333'}`, cursor: 'pointer', transition: '0.2s' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: modulos[item.id] ? GREEN_MONEY : 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><input type="checkbox" checked={modulos[item.id]} readOnly style={{ transform: 'scale(1.5)' }} />{item.label}</h4>
              <p style={{ margin: 0, color: '#888', fontSize: '12px', paddingLeft: '25px' }}>{item.desc}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: modulos[item.id] ? GREEN_MONEY : '#888', fontSize: '16px' }}>+ R$ {precos.mensal[item.id]},00<span style={{fontSize:'11px',color:'#888'}}>/mês</span></div>
              {ciclo === 'anual' && <div style={{fontSize:'11px',color:'#f59e0b'}}>💰 R$ {Math.round(precos.mensal[item.id] * 12 * 0.85).toLocaleString('pt-BR')}/ano</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1a00', border: `2px dashed ${GREEN_MONEY}`, padding: '25px', borderRadius: '10px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>Total do Seu Plano ({ciclo === 'mensal' ? 'mensal' : 'anual - 15% OFF'})</p>
        {ciclo === 'anual' && (
          <p style={{ color: '#888', fontSize: '12px', margin: '0 0 5px 0' }}>
            <s style={{ color: '#555' }}>R$ {(somaMensal * 12).toLocaleString('pt-BR')}/ano</s>
            {' '}→ com 15% de desconto
          </p>
        )}
        <h1 style={{ margin: '0 0 20px 0', color: GREEN_MONEY, fontSize: '40px' }}>R$ {total.toLocaleString('pt-BR')},00 <span style={{fontSize:'16px'}}>{ciclo === 'mensal' ? '/mês' : '/ano'}</span></h1>
        <button onClick={enviarWhatsAppDeVenda} style={{ width: '100%', padding: '20px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: `0 5px 20px ${GREEN_MONEY}44` }}>
          💬 CHAMAR EXPRESS AI PARA ASSINAR
        </button>
      </div>
    </div>
  );
};
// ============================================================
// ========== ABA ESTRATÉGIA ==================================
// ============================================================
const ABA_ESTRATEGIA_SECOES = [
  { icon: '🔴', titulo: 'O Segredo da Fidelização: Valor de Revenda', intro: 'O maior medo de quem tem um carro é perder dinheiro na hora da venda.', itens: [
    { bold: 'O Prontuário de Ouro:', texto: 'Quando você registra tudo no sistema, entrega ao cliente uma "Certidão de Nascimento" do carro.' },
    { bold: 'Ativo do Veículo:', texto: 'O histórico acompanha o carro, não apenas o dono. Se o cliente vender o veículo, o Prontuário de Ouro é o maior argumento de venda dele.' },
    { bold: 'Máquina de Novos Clientes:', texto: 'O novo dono, ao ver que o carro tem um histórico digital impecável na sua oficina, terá todo o interesse em continuar sendo seu cliente.' },
    { bold: 'Troca de Titularidade:', texto: 'Para você, é simples: atualize os dados do novo proprietário e gere uma nova senha. O carro continua na sua base e você ganhou um novo cliente fiel.' },
  ]},
  { icon: '🛡️', titulo: 'Segurança na Palma da Mão do Cliente', intro: 'Diferencie-se oferecendo ao seu cliente controle total sobre o serviço:', itens: [
    { bold: 'App do Cliente:', texto: 'Seu cliente acompanha tudo pelo celular.' },
    { bold: 'Acesso Seguro (Placa e Senha):', texto: 'A oficina cadastra uma senha para o cliente. Ele acessa o portal com a Placa do Carro + Senha - privacidade e segurança garantidas.' },
    { bold: 'Evolução em Tempo Real:', texto: 'O cliente acompanha a barra de progresso do conserto. Isso elimina a ansiedade e as ligações constantes.' },
  ]},
  { icon: '👩‍🔧', titulo: 'Foco Estratégico: O Público Feminino', intro: 'As mulheres representam 45% dos motoristas e decidem 80% das compras das famílias.', itens: [
    { bold: 'Transparência Total:', texto: 'Ao oferecer fotos, laudos claros e acompanhamento pelo App, você remove a barreira do medo de ser enganada.' },
    { bold: 'Fidelidade Imbatível:', texto: 'Uma mulher que encontra segurança e transparência nunca mais troca de mecânico. O Oficina IA é a sua ferramenta para dominar esse mercado.' },
  ]},
  { icon: '📸', titulo: 'Fotos: Sua Proteção e Prova Real', intro: 'O sistema permite tirar fotos assim que o carro chega. Isso elimina 90% dos problemas de balcão:', itens: [
    { bold: '1. Problemas Externos:', texto: 'Registre riscos ou batidas que já estavam no carro para evitar reclamações injustas.' },
    { bold: '2. Prova do Serviço:', texto: 'Tire foto da peça velha ao lado da nova. Isso prova que o serviço foi feito.' },
    { bold: '3. Histórico Inviolável:', texto: 'A foto é o seu seguro jurídico e a prova da sua excelência.' },
  ]},
  { icon: '💰', titulo: 'Dados são Ouro (Mesmo sem fechar serviço)', intro: 'Cada pessoa que entra na sua oficina é uma oportunidade.', itens: [
    { bold: 'Cadastre sempre:', texto: 'Mesmo que o cliente venha apenas para um orçamento, pegue os dados. Ter o contato e o carro no sistema é o ativo mais valioso da sua empresa. Com um botão, você faz marketing para quem não fechou.' },
  ]},
];
const ABA_ESTRATEGIA_FUNC = [
  { icon: '📲', titulo: 'Orçamentos e Recibos (WhatsApp em 1 Clique)', itens: [
    { bold: 'Agilidade Máxima:', texto: 'Envie orçamentos e recibos profissionais instantaneamente.' },
    { bold: 'Tudo Anexado:', texto: 'O sistema anexa as fotos do serviço automaticamente.' },
    { bold: 'Pagamento Facilitado:', texto: 'O seu PIX já vai configurado na mensagem.' },
  ]},
  { icon: '📊', titulo: 'Financeiro e Comissões', itens: [
    { bold: 'Visão Estratégica:', texto: 'Acompanhe as entradas por dia, semana e mês.' },
    { bold: 'Gestão de Equipe:', texto: 'Facilite o cálculo de comissões com relatórios de faturamento precisos.' },
  ]},
  { icon: '⚙️', titulo: 'Flexibilidade de Planos', itens: [
    { bold: 'Serviços Sob Medida:', texto: 'Escolha os serviços que melhor atendem à sua realidade na opção de planos.' },
  ]},
  { icon: '🤖', titulo: 'Copiloto IA', itens: [
    { bold: 'Conhecimento Instantâneo:', texto: 'Manuais técnicos e diagnósticos por voz e foto para acelerar o pátio.' },
  ]},
];
const ABA_ESTRATEGIA_PASSOS = [
  { num: '1', label: 'Chegada', desc: 'Tire fotos do estado geral. Proteja-se.' },
  { num: '2', label: 'Cadastro', desc: 'Pegue os dados. Dados são lucro futuro.' },
  { num: '3', label: 'Acompanhamento', desc: 'Cadastre a senha para o cliente seguir o progresso no App.' },
  { num: '4', label: 'Prontuário de Ouro', desc: 'O cliente sai sabendo que o carro vale mais e que o histórico está seguro com você.' },
];
const AbaEstrategia = () => {
  const COR = TAB_COLORS.estrategia;
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #1a1000, #0a0a0a)', border: `2px solid ${COR}`, borderRadius: '12px', padding: '25px', marginBottom: '25px' }}>
        <h2 style={{ color: COR, margin: '0 0 8px 0', fontSize: '20px' }}>🛠️ Oficina IA: O Seu Guia de Alta Performance</h2>
        <p style={{ color: '#bbb', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          Este guia não é apenas um manual - é a <strong style={{ color: COR }}>estratégia para transformar sua oficina na mais confiável da região</strong>. Use o software para proteger seu trabalho e fidelizar seus clientes.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
        {ABA_ESTRATEGIA_SECOES.map((s, i) => (
          <details key={i} open={i === 0} style={{ background: '#111', borderRadius: '10px', border: `1px solid ${COR}33`, padding: '16px', cursor: 'pointer' }}>
            <summary style={{ color: COR, fontWeight: 'bold', fontSize: '15px', outline: 'none' }}>{s.icon} {s.titulo}</summary>
            <p style={{ color: '#aaa', fontSize: '13px', margin: '12px 0 10px 0', fontStyle: 'italic' }}>{s.intro}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {s.itens.map((item, j) => (
                <div key={j} style={{ paddingLeft: '12px', borderLeft: `3px solid ${COR}55`, paddingTop: '4px', paddingBottom: '4px' }}>
                  <strong style={{ color: '#eee', fontSize: '13px' }}>{item.bold}</strong>
                  <span style={{ color: '#aaa', fontSize: '13px' }}> {item.texto}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
      <h3 style={{ color: COR, borderBottom: `1px solid ${COR}33`, paddingBottom: '10px', marginBottom: '15px' }}>📋 Guia de Funcionalidades (Vantagens Reais)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '25px' }}>
        {ABA_ESTRATEGIA_FUNC.map((f, i) => (
          <div key={i} style={{ background: '#111', borderRadius: '10px', border: `1px solid ${COR}22`, padding: '16px' }}>
            <h4 style={{ color: COR, margin: '0 0 12px 0', fontSize: '14px' }}>{f.icon} {f.titulo}</h4>
            {f.itens.map((item, j) => (
              <p key={j} style={{ color: '#aaa', fontSize: '13px', margin: '0 0 6px 0' }}>
                <strong style={{ color: '#ddd' }}>{item.bold}</strong> {item.texto}
              </p>
            ))}
          </div>
        ))}
      </div>
      <h3 style={{ color: COR, borderBottom: `1px solid ${COR}33`, paddingBottom: '10px', marginBottom: '15px' }}>🚀 Passo a Passo para o Sucesso</h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {ABA_ESTRATEGIA_PASSOS.map((p, i) => (
          <div key={i} style={{ flex: '1', minWidth: '200px', background: '#111', border: `2px solid ${COR}44`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: COR, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>{p.num}</div>
            <strong style={{ color: COR, display: 'block', marginBottom: '6px', fontSize: '14px' }}>{p.label}</strong>
            <p style={{ color: '#aaa', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// ========== ADMIN PRINCIPAL =================================
// ============================================================
export default function Admin() {
  const { oficinaId } = useOficina() || {};
  const [logado, setLogado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [bloqueado, setBloqueado] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [permissoesLogado, setPermissoesLogado] = useState(null);
  const [papelLogado, setPapelLogado] = useState(null);
  const [dadosOficina, setDadosOficina] = useState(null);
  const [config, setConfig] = useState({ nome: "OFICINA IA", cnpj: "", endereco: "", telefone: "", pixKey: "", garantia: "Garantia de 90 dias.", logoUrl: "" });
  const [subindoLogo, setSubindoLogo] = useState(false);
  const [videosAjudaAdmin, setVideosAjudaAdmin] = useState({});
  const [servicosMarketingAdmin, setServicosMarketingAdmin] = useState([]);
  const [contratandoMkt, setContratandoMkt] = useState(null);

  // DESMANCHE
  const [subAbaDesmanche, setSubAbaDesmanche] = useState('veiculos'); // veiculos | pecas | clientes | parceiros | busca_pecas
  const [buscaPecaVoz, setBuscaPecaVoz] = useState('');
  const [ouvindoBuscaPeca, setOuvindoBuscaPeca] = useState(false);
  const [patioSel, setPatioSel] = useState('Todos');
  const [veiculosDesmanche, setVeiculosDesmanche] = useState([]);
  const [pecasDesmanche, setPecasDesmanche] = useState([]);
  const [carregandoDesmanche, setCarregandoDesmanche] = useState(false);
  // Form veículo
  const [formVeiculo, setFormVeiculo] = useState({ modelo: '', ano: '', cor: '', valorLeilao: '', procedencia: '', obs: '', foto: null, status: 'em_desmonte' });
  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
  const [editandoVeiculo, setEditandoVeiculo] = useState(null);
  // Form peça
  const [formPeca, setFormPeca] = useState({ nome: '', veiculoId: '', veiculoNome: '', preco: '', condicao: 'otima', codigo: '', prateleira: '', foto: null, status: 'disponivel' });
  const [salvandoPeca, setSalvandoPeca] = useState(false);
  const [editandoPeca, setEditandoPeca] = useState(null);
  const [mostrarFormVeiculo, setMostrarFormVeiculo] = useState(false);
  const [mostrarFormPeca, setMostrarFormPeca] = useState(false);
  const [buscaPeca, setBuscaPeca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ouvindoObsVeiculo, setOuvindoObsVeiculo] = useState(false);
  const recDesRef = useRef(null);

  // Clientes do Desmanche
  const [clientesDes, setClientesDes] = useState([]);
  const [formClienteDes, setFormClienteDes] = useState({ nome: '', telefone: '', interesse: '' });
  const [salvandoClienteDes, setSalvandoClienteDes] = useState(false);
  const [mostrarFormClienteDes, setMostrarFormClienteDes] = useState(false);
  const [carroSelecionado, setCarroSelecionado] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // Parceiros do Desmanche
  const [parceiros, setParceiros] = useState([]);
  const [formParc, setFormParc] = useState({ nome: '', telefone: '', cidade: '', responsavel: '' });
  const [salvandoParc, setSalvandoParc] = useState(false);
  const [mostrarFormParc, setMostrarFormParc] = useState(false);

  // FORNECEDORES (visão da oficina - lê dados públicos dos desmanches parceiros)
  const [feedFornecedores, setFeedFornecedores] = useState([]);
  const [pecasFornecedores, setPecasFornecedores] = useState([]);
  const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);
  const [notifDesmanche, setNotifDesmanche] = useState(0);
  const [subAbaFornecedores, setSubAbaFornecedores] = useState('feed');
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('todos');
  
  // Estado para carrossel de fotos da Oficina (movido para o topo para respeitar Rules of Hooks)
  const [fotoAtiva, setFotoAtiva] = useState(0);

  // Armazena os planos configurados pelo Master
  const [planosSistema, setPlanosSistema] = useState(DEFAULT_PLANOS);

  // NOVO USEEFFECT PARA FORÇAR ATUALIZAÇÃO DOS PLANOS GLOBAIS
  useEffect(() => {
    const fetchPlanosGlobais = async () => {
      try {
        const snap = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'planos'));
        if (snap.exists()) {
          const data = snap.data();
          setPlanosSistema({
            mensal: { ...DEFAULT_PLANOS.mensal, ...(data.mensal || {}) },
            anual: { ...DEFAULT_PLANOS.anual, ...(data.anual || {}) },
            whatsapp: data.whatsapp || DEFAULT_PLANOS.whatsapp
          });
        }
      } catch (e) {}
    };
    fetchPlanosGlobais();
  }, []);

  // Campos da OS
  const [nomeCliente, setNomeCliente] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [modelo, setModelo] = useState('');
  const [checklist, setChecklist] = useState('');
  const [detalhesPecas, setDetalhesPecas] = useState('');
  const [valorPecas, setValorPecas] = useState('');
  const [valorMaoObra, setValorMaoObra] = useState('');
  const [senhaPortal, setSenhaPortal] = useState('');
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [listaFotosOS, setListaFotosOS] = useState([]);
  const [legendaFoto, setLegendaFoto] = useState('');
  const [fotoPainel, setFotoPainel] = useState(null);
  const [kmAtual, setKmAtual] = useState('');
  const [kmProxima, setKmProxima] = useState('');
  const [lendoKm, setLendoKm] = useState(false);

  // ===== ESTADOS ABA ÓLEO =====
  const [categoriaOleo, setCategoriaOleo] = useState('carro');
  const [kitOleo, setKitOleo] = useState('normal');
  const [extrasOleo, setExtrasOleo] = useState([]);
  const [fotoPainelOleo, setFotoPainelOleo] = useState(null);
  const [kmAtualOleo, setKmAtualOleo] = useState('');
  const [kmProximaOleo, setKmProximaOleo] = useState('');
  const [lendoKmOleo, setLendoKmOleo] = useState(false);
  const [tipoOleoOleo, setTipoOleoOleo] = useState('5W30 Sintético');
  const [litrosOleo, setLitrosOleo] = useState('');
  const [placaOleo, setPlacaOleo] = useState('');
  const [nomeClienteOleo, setNomeClienteOleo] = useState('');
  const [telefoneOleo, setTelefoneOleo] = useState('');
  const [modeloOleo, setModeloOleo] = useState('');
  const [valorPecasOleo, setValorPecasOleo] = useState('');
  const [valorMaoObraOleo, setValorMaoObraOleo] = useState('');
  const [obsOleo, setObsOleo] = useState('');
  const [campoOuvindoOleo, setCampoOuvindoOleo] = useState(false);
  const recOleoRef = useRef(null);
  const [salvandoOleo, setSalvandoOleo] = useState(false);
  const [salvoOleo, setSalvoOleo] = useState(false);
  // Carrossel de 4 fotos do óleo (painel, câmbio, filtro, etc.)
  const [fotosCarrosselOleo, setFotosCarrosselOleo] = useState([null, null, null, null]);
  const [legendasCarrosselOleo] = useState(['📷 Painel/KM', '📷 Óleo Câmbio', '📷 Filtro', '📷 Extra']);
  const fotosCarrosselOleoRef = useRef(null);
  const [fotoCarrosselIdx, setFotoCarrosselIdx] = useState(0);
  
  // ===== ESTADOS ABA ALINHAMENTO =====
  const [servicosAlinhamento, setServicosAlinhamento] = useState([]);
  const [extrasAlinhamento, setExtrasAlinhamento] = useState([]);
  const [estadoPneus, setEstadoPneus] = useState('bons');
  const [fotoAlinhamento, setFotoAlinhamento] = useState(null);
  const [lendoFotoAlinhamento, setLendoFotoAlinhamento] = useState(false);
  const [laudoAlinhamento, setLaudoAlinhamento] = useState('');
  const [obsAlinhamento, setObsAlinhamento] = useState('');
  const [fotosPneus, setFotosPneus] = useState([]);
  const [legendaPneu, setLegendaPneu] = useState('');
  const [placaAlinhamento, setPlacaAlinhamento] = useState('');
  const [nomeClienteAlinhamento, setNomeClienteAlinhamento] = useState('');
  const [telefoneAlinhamento, setTelefoneAlinhamento] = useState('');
  const [modeloAlinhamento, setModeloAlinhamento] = useState('');
  const [valorPecasAlinhamento, setValorPecasAlinhamento] = useState('');
  const [valorMaoObraAlinhamento, setValorMaoObraAlinhamento] = useState('');
  const [salvandoAlinhamento, setSalvandoAlinhamento] = useState(false);
  const [salvoAlinhamento, setSalvoAlinhamento] = useState(false);

  const [categoriaVeiculo, setCategoriaVeiculo] = useState('CARRO');
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const recognitionRef = useRef(null);

  // ✅ MODAL CLIENTE RÁPIDO
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [leadNome, setLeadNome] = useState('');
  const [leadTelefone, setLeadTelefone] = useState('');
  const [leadCarro, setLeadCarro] = useState('');
  const [leadProblema, setLeadProblema] = useState('');
  const [leadSalvando, setLeadSalvando] = useState(false);
  const [leadCampoOuvindo, setLeadCampoOuvindo] = useState(null);
  const leadRecognitionRef = useRef(null);

  // ✅ MODAL FINANCEIRO RÁPIDO
  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [finDesc, setFinDesc] = useState('');
  const [finValor, setFinValor] = useState('');
  const [finTipo, setFinTipo] = useState('entrada');
  const [finPagamento, setFinPagamento] = useState('PIX');
  const [finSalvando, setFinSalvando] = useState(false);
  const [finCampoOuvindo, setFinCampoOuvindo] = useState(false);
  const finRecognitionRef = useRef(null);

  const [busca, setBusca] = useState('');
  const [reciboParaImprimir, setReciboParaImprimir] = useState(null);

  // ===== ESTADOS ABA REVISÃO - agendamento e fotos de defeito =====
  const [fotosDefeitoRevisao, setFotosDefeitoRevisao] = useState([]);
  const fotosDefeitoRevisaoRef = useRef(null);
  const [dataAgendamentoRevisao, setDataAgendamentoRevisao] = useState('');
  const [lembreteRevisao, setLembreteRevisao] = useState('7');

  // ===== ESTADOS ABA INJEÇÃO =====
  const [subAbaInjecao, setSubAbaInjecao] = useState('injecao');
  const [placaInjecao, setPlacaInjecao] = useState('');
  const [modeloInjecao, setModeloInjecao] = useState('');
  const [kmInjecao, setKmInjecao] = useState('');
  const [clienteInjecao, setClienteInjecao] = useState('');
  const [telefoneInjecao, setTelefoneInjecao] = useState('');
  const [dtcCodes, setDtcCodes] = useState('');
  const [dtcResultado, setDtcResultado] = useState('');
  const [checkInjecao, setCheckInjecao] = useState({});
  const [fotosInjecao, setFotosInjecao] = useState([]);
  const fotosInjecaoRef = useRef(null);
  const [valorPecasInjecao, setValorPecasInjecao] = useState('');
  const [valorMaoObraInjecao, setValorMaoObraInjecao] = useState('');
  const [salvandoInjecao, setSalvandoInjecao] = useState(false);
  const [salvoInjecao, setSalvoInjecao] = useState(false);

  // ===== LIGHTBOX para zoom nas fotos do Desmanche =====
  const [lightboxFotos, setLightboxFotos] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxAberto, setLightboxAberto] = useState(false);

  // Campos de Edição
  const [osEditando, setOsEditando] = useState(null);
  const [editNomeCliente, setEditNomeCliente] = useState('');
  const [editChecklist, setEditChecklist] = useState('');
  const [editDetalhesPecas, setEditDetalhesPecas] = useState('');
  const [editValorPecas, setEditValorPecas] = useState('');
  const [editValorMaoObra, setEditValorMaoObra] = useState('');
  const [editPlaca, setEditPlaca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editFotos, setEditFotos] = useState([]);
  const [editLegendaFoto, setEditLegendaFoto] = useState('');
  const [editFotoPainel, setEditFotoPainel] = useState(null);
  const [editKmAtual, setEditKmAtual] = useState('');
  const [editKmProxima, setEditKmProxima] = useState('');

  // Listas
  const [listaFinanceiro, setListaFinanceiro] = useState([]);
  const [listaEstoque, setListaEstoque] = useState([]);
  // Aba OFICINA - sub-abas
  const [subAbaOficina, setSubAbaOficina] = useState('mecanica');
  // Vistoria / OS da oficina
  const [listaVistorias, setListaVistorias] = useState([]);
  const [mostrarFormVistoria, setMostrarFormVistoria] = useState(false);
  const [editandoVistoria, setEditandoVistoria] = useState(null);
  const [salvandoVistoria, setSalvandoVistoria] = useState(false);
  const [ouvindoVistoria, setOuvindoVistoria] = useState(null);
  const [formVistoria, setFormVistoria] = useState({ placa: '', modelo: '', ano: '', cor: '', km: '', cliente: '', telefone: '', fotos: [], tipoServico: 'mecanica', obs: '', campos: {} });
  // Fornecedores - lojas de peças novas
  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [mostrarFormFornecedor, setMostrarFormFornecedor] = useState(false);
  const [salvandoFornecedor, setSalvandoFornecedor] = useState(false);
  const [formFornecedor, setFormFornecedor] = useState({ nome: '', telefone: '', especialidade: '', cidade: '', contato: '', obs: '' });
  const [listaEquipamentos, setListaEquipamentos] = useState([]);
  const [listaCarros, setListaCarros] = useState([]);

  // Equipamentos
  const [equipamentoNome, setEquipamentoNome] = useState('');
  const [equipamentoFoto, setEquipamentoFoto] = useState(null);
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [novoUsuarioEmail, setNovoUsuarioEmail] = useState('');
  const [novoUsuarioNome, setNovoUsuarioNome] = useState('');
  const [novoUsuarioSenha, setNovoUsuarioSenha] = useState('');
  const [novoUsuarioCargo, setNovoUsuarioCargo] = useState('Mecânico');
  const [novoUsuarioFoto, setNovoUsuarioFoto] = useState(null);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [permissoesNovoUsuario, setPermissoesNovoUsuario] = useState({ os: true, estoque: false, financeiro: false, equipe: false, oficina: false, config: false });
  const [membroAuditando, setMembroAuditando] = useState(null);
  const [fotoMaleta, setFotoMaleta] = useState(null);
  const [resultadoAuditoriaIA, setResultadoAuditoriaIA] = useState('');
  
  const { analyzeImage } = useGemini();

  const abrirWhatsApp = (link) => {
    const novaAba = window.open(link, '_blank');
    if (!novaAba) window.location.href = link;
  };

  const ouvirCampoLead = (campo, setFn) => {
    if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para usar voz.');
    if (leadCampoOuvindo === campo) {
      if (leadRecognitionRef.current) leadRecognitionRef.current.stop();
      setLeadCampoOuvindo(null);
      return;
    }
    if (leadRecognitionRef.current) leadRecognitionRef.current.stop();
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'pt-BR'; rec.interimResults = false; leadRecognitionRef.current = rec;
    rec.onstart = () => setLeadCampoOuvindo(campo);
    rec.onresult = (e) => {
      const texto = e.results[0][0].transcript;
      if (campo === 'telefone') setFn(texto.replace(/\D/g, ''));
      else if (campo === 'problema') setFn(prev => prev ? prev + ', ' + texto : texto);
      else setFn(texto);
    };
    rec.onerror = () => setLeadCampoOuvindo(null);
    rec.onend = () => setLeadCampoOuvindo(null);
    rec.start();
  };

  const salvarLeadRapido = async () => {
    if (!leadNome || !leadTelefone) return alert('Preencha pelo menos Nome e WhatsApp!');
    if (!oficinaId) return;
    setLeadSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'leads'), {
        nome: leadNome, telefone: leadTelefone.replace(/\D/g, ''),
        carro: leadCarro, problema: leadProblema,
        status: 'novo', data_criacao: new Date(),
      });
      alert('✅ Cliente salvo!');
      setLeadNome(''); setLeadTelefone(''); setLeadCarro(''); setLeadProblema('');
      setModalClienteAberto(false);
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setLeadSalvando(false); }
  };

  // ===== FINANCEIRO RÁPIDO - voz e salvar =====
  const ouvirFinDesc = () => {
    if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para usar voz.');
    if (finCampoOuvindo) {
      if (finRecognitionRef.current) finRecognitionRef.current.stop();
      setFinCampoOuvindo(false); return;
    }
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'pt-BR'; rec.interimResults = false;
    finRecognitionRef.current = rec;
    rec.onstart = () => setFinCampoOuvindo(true);
    rec.onresult = (e) => { setFinDesc(e.results[0][0].transcript); setFinCampoOuvindo(false); };
    rec.onerror = () => setFinCampoOuvindo(false);
    rec.onend = () => setFinCampoOuvindo(false);
    rec.start();
  };

  const salvarFinanceiroRapido = async () => {
    if (!finDesc || !finValor) return alert('Preencha a descrição e o valor!');
    if (!oficinaId) return;
    setFinSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        descricao: finDesc, valor: Number(finValor),
        pagamento: finPagamento, tipo: finTipo,
        data: new Date().toISOString(),
      });
      await carregarFinanceiro();
      setFinDesc(''); setFinValor(''); setFinTipo('entrada'); setFinPagamento('PIX');
      setModalFinanceiroAberto(false);
      alert('✅ Lançamento registrado!');
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setFinSalvando(false); }
  };

  const ouvirCampo = (nomeCampo, setFuncaoEstado, modo = 'substituir') => {
    if (!('webkitSpeechRecognition' in window)) return alert("O seu navegador não suporta voz. Use o Chrome.");
    if (campoOuvindo === nomeCampo) { if (recognitionRef.current) recognitionRef.current.stop(); setCampoOuvindo(null); return; }
    if (recognitionRef.current) recognitionRef.current.stop();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; recognition.interimResults = false; recognitionRef.current = recognition;
    let escutando = true;
    recognition.onstart = () => { if (escutando) setCampoOuvindo(nomeCampo); };
    recognition.onresult = (event) => {
      if (!escutando) return;
      const texto = event.results[0][0].transcript;
      if (modo === 'substituir') {
        if (nomeCampo === 'placa' || nomeCampo === 'placaOleo' || nomeCampo === 'placaAlinhamento') setFuncaoEstado(normalizarPlaca(texto));
        else if (nomeCampo === 'telefone' || nomeCampo === 'telefoneOleo' || nomeCampo === 'telefoneAlinhamento') setFuncaoEstado(texto.replace(/\D/g, ''));
        else setFuncaoEstado(texto);
      } else setFuncaoEstado(prev => prev ? prev + " " + texto : texto);
    };
    recognition.onerror = () => { if (escutando) setCampoOuvindo(null); };
    recognition.onend   = () => { if (escutando) setCampoOuvindo(null); };
    recognition.start();
    return () => { escutando = false; recognition.stop(); };
  };

  const comprimirFoto = (base64, qualidade = 0.5) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas'); const maxW = 800;
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      }; img.src = base64;
    });
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file || !oficinaId) return;
    setSubindoLogo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Logo = await comprimirFoto(reader.result, 0.6);
        const novaConfig = { ...config, logoUrl: base64Logo };
        await setDoc(doc(db, "oficinas", oficinaId, "configuracoes", "geral"), novaConfig, { merge: true });
        setConfig(novaConfig);
        alert("✅ Logotipo salvo com sucesso!");
        setSubindoLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("❌ Erro ao salvar logo: " + error.message);
      setSubindoLogo(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === import.meta.env.VITE_SU) {
          if(isMounted) { setPapelLogado('master'); setPermissoesLogado(null); setLogado(true); setCarregandoAuth(false); }
          return;
        }
        try {
          const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
          if (docSnap.exists() && isMounted) {
            const dados = docSnap.data();
            const userOficinaId = dados.papel === 'dono' ? user.uid : dados.oficinaId;
            if (userOficinaId) {
              const oficinaSnap = await getDoc(doc(db, 'oficinas', userOficinaId));
              if (oficinaSnap.exists() && isMounted) {
                const oficina = oficinaSnap.data(); setDadosOficina(oficina);
                if (oficina.ativo === false) { setBloqueado('bloqueado'); return; }
                if (oficina.plano === 'trial') {
                  const fim = oficina.trialFim?.toDate ? oficina.trialFim.toDate() : new Date(oficina.trialFim);
                  if (fim < new Date()) { setBloqueado('trial'); return; }
                }
              }
            }
            if (isMounted) { setPermissoesLogado(dados.permissoes || null); setPapelLogado(dados.papel || 'dono'); }
          } else if (isMounted) { setPermissoesLogado(null); setPapelLogado('dono'); }
        } catch { if (isMounted) { setPermissoesLogado(null); setPapelLogado('dono'); } }
        if (isMounted) setLogado(true);
      } else {
        if (isMounted) { setLogado(false); setPermissoesLogado(null); setPapelLogado(null); setDadosOficina(null); setBloqueado(null); }
      }
      if (isMounted) setCarregandoAuth(false);
    });
    return () => { isMounted = false; unsubscribe(); };
  }, []);

  useEffect(() => { if (logado && oficinaId) carregarTudo(); }, [logado, oficinaId]);

  const temPermissao = (aba) => {
    if (papelLogado === 'master') return true;
    if (papelLogado === 'dono') return true;
    if (!permissoesLogado) return true;
    if (aba === 'dashboard' || aba === 'ajuda' || aba === 'estrategia' || aba === 'revisao' || aba === 'pneus' || aba === 'copiloto' || aba === 'assinatura' || aba === 'marketing' || aba === 'desmanche' || aba === 'fornecedores' || aba === 'injecao') return true;
    return permissoesLogado[aba] === true;
  };

  const verificarSenha = async () => {
    try { await signInWithEmailAndPassword(getAuth(), emailInput, senhaInput); }
    catch { alert("❌ E-mail ou senha incorretos."); }
  };

  const fazerLogout = () => {
    signOut(getAuth()).then(() => { setLogado(false); setPermissoesLogado(null); setPapelLogado(null); setBloqueado(null); setDadosOficina(null); });
  };

  const carregarTudo = () => { carregarOS(); carregarEstoque(); carregarEquipamentos(); carregarVistorias(); carregarFornecedoresLoja(); carregarFinanceiro(); carregarConfig(); carregarUsuarios(); carregarVideosAjuda(); carregarDesmanche(); };
  const carregarVideosAjuda = async () => {
    try {
      const d = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'videos_ajuda'));
      if (d.exists()) setVideosAjudaAdmin(d.data());
      const m = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'marketing'));
      if (m.exists() && m.data().servicos) setServicosMarketingAdmin(m.data().servicos);
    } catch { }
  };

  const carregarDesmanche = async () => {
    if (!oficinaId) return;
    setCarregandoDesmanche(true);
    try {
      const [vsSnap, psSnap, csSnap, parcSnap] = await Promise.all([
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_pecas')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_clientes')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros')),
      ]);
      setVeiculosDesmanche(vsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPecasDesmanche(psSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setClientesDes(csSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setParceiros(parcSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setCarregandoDesmanche(false); }
  };

  const salvarClienteDes = async () => {
    if (!formClienteDes.nome) return alert('⚠️ Preencha o nome!');
    setSalvandoClienteDes(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_clientes'), { ...formClienteDes, data_registro: new Date().toISOString() });
      setFormClienteDes({ nome: '', telefone: '', interesse: '' });
      setMostrarFormClienteDes(false);
      await carregarDesmanche();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoClienteDes(false); }
  };

  const salvarParceiro = async () => {
    if (!formParc.nome) return alert('⚠️ Preencha o nome da oficina!');
    setSalvandoParc(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'), { ...formParc, data_registro: new Date().toISOString() });
      setFormParc({ nome: '', telefone: '', cidade: '', responsavel: '' });
      setMostrarFormParc(false);
      await carregarDesmanche();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoParc(false); }
  };

  const salvarVeiculo = async () => {
    if (!formVeiculo.modelo) return alert('⚠️ Preencha o modelo do veículo!');
    setSalvandoVeiculo(true);
    try {
      const dados = { ...formVeiculo, data_entrada: new Date().toISOString(), oficina: dadosOficina?.nomeOficina || '' };
      if (editandoVeiculo) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', editandoVeiculo), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos'), { ...dados, data_registro: new Date().toISOString() });
      }
      setFormVeiculo({ modelo: '', ano: '', cor: '', valorLeilao: '', procedencia: '', patio: '', detalhes: '', fotos: [], status: 'em_desmonte' });
      setEditandoVeiculo(null); setMostrarFormVeiculo(false);
      await carregarDesmanche();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoVeiculo(false); }
  };

  const salvarPeca = async () => {
    if (!formPeca.nome) return alert('⚠️ Preencha o nome da peça!');
    setSalvandoPeca(true);
    try {
      const dados = { ...formPeca, data_registro: new Date().toISOString() };
      if (editandoPeca) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', editandoPeca), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), dados);
      }
      setFormPeca({ nome: '', veiculoId: '', veiculoNome: '', preco: '', condicao: 'otima', codigo: '', prateleira: '', fotos: [], status: 'disponivel' });
      setEditandoPeca(null); setMostrarFormPeca(false);
      await carregarDesmanche();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoPeca(false); }
  };

  const venderPeca = async (peca) => {
    if (!window.confirm(`Marcar "${peca.nome}" como VENDIDA por R$ ${peca.preco}?`)) return;
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', peca.id), { status: 'vendida', data_venda: new Date().toISOString() });
      await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        tipo: 'entrada',
        descricao: `🚗 Venda peça desmanche: ${peca.nome}${peca.veiculoNome ? ` (${peca.veiculoNome})` : ''}`,
        valor: Number(peca.preco) || 0,
        formaPagamento: 'desmanche',
        data: new Date().toISOString(),
        data_registro: new Date().toISOString(),
      });
      await carregarDesmanche();
      await carregarFinanceiro();
      alert(`✅ Peça vendida! Valor lançado automaticamente no Financeiro.`);
    } catch (e) { alert('Erro: ' + e.message); }
  };

  // Carrega feed de desmanches parceiros - lê da coleção global pública
  const carregarFornecedores = async () => {
    if (!oficinaId) return;
    setCarregandoFornecedores(true);
    try {
      // Notificações não lidas
      try {
        const notifSnap = await getDocs(query(
          collection(db, 'oficinas', oficinaId, 'notificacoes_desmanche'),
          where('lida', '==', false)
        ));
        setNotifDesmanche(notifSnap.size);
      } catch { }

      // Busca desmanches autorizados
      const globalSnap = await getDocs(collection(db, 'desmanche_global'));
      const todos = globalSnap.docs.map(d => ({ desmanchemId: d.id, ...d.data() }));
      const autorizados = todos.filter(d =>
        Array.isArray(d.parceiros_ids) && d.parceiros_ids.includes(oficinaId)
      );
      setFeedFornecedores(autorizados);

      // Busca peças disponíveis desses desmanches
      const todasPecas = [];
      for (const des of autorizados) {
        const pecasSnap = await getDocs(
          query(collection(db, 'oficinas', des.desmanchemId, 'desmanche_pecas'),
            where('status', '==', 'disponivel'))
        );
        pecasSnap.docs.forEach(d => todasPecas.push({
          id: d.id, ...d.data(),
          desmanchemNome: des.nomeOficina || 'Desmanche',
          desmanchemTel: des.telefone || '',
          desmanchemId: des.desmanchemId
        }));
      }
      setPecasFornecedores(todasPecas);
    } catch (e) { console.warn('carregarFornecedores:', e.message); }
    finally { setCarregandoFornecedores(false); }
  };

  const marcarNotifLidas = async () => {
    if (!oficinaId) return;
    try {
      const notifSnap = await getDocs(query(
        collection(db, 'oficinas', oficinaId, 'notificacoes_desmanche'),
        where('lida', '==', false)
      ));
      for (const d of notifSnap.docs) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'notificacoes_desmanche', d.id), { lida: true });
      }
      setNotifDesmanche(0);
    } catch { }
  };
  const carregarConfig = async () => {
    if (!oficinaId) return;
    try { const d = await getDoc(doc(db, "oficinas", oficinaId, "configuracoes", "geral")); if (d.exists()) setConfig(d.data()); } catch { }
  };
  const handleSalvarConfig = async () => {
    if (!oficinaId) return;
    await setDoc(doc(db, "oficinas", oficinaId, "configuracoes", "geral"), config, { merge: true });
    alert("Configurações salvas com sucesso!");
  };
  const carregarOS = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, "oficinas", oficinaId, "os"), orderBy("data_registro", "desc")));
      setListaCarros(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarOS:', e.message); }
  };
  const carregarEstoque = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(collection(db, "oficinas", oficinaId, "estoque"));
      setListaEstoque(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarEstoque:', e.message); }
  };
  const carregarVistorias = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(collection(db, 'oficinas', oficinaId, 'vistorias'));
      setListaVistorias(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.data_registro || '').localeCompare(a.data_registro || '')));
    } catch { }
  };
  const salvarVistoria = async () => {
    if (!formVistoria.placa) return alert('⚠️ Preencha a placa!');
    setSalvandoVistoria(true);
    try {
      const dados = { ...formVistoria, data_registro: new Date().toISOString() };
      if (editandoVistoria) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'vistorias', editandoVistoria), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'vistorias'), dados);
      }
      setMostrarFormVistoria(false); setEditandoVistoria(null);
      await carregarVistorias();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoVistoria(false); }
  };
  const carregarFornecedoresLoja = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(collection(db, 'oficinas', oficinaId, 'fornecedores'));
      setListaFornecedores(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { }
  };
  const salvarFornecedor = async () => {
    if (!formFornecedor.nome) return alert('⚠️ Preencha o nome da loja!');
    setSalvandoFornecedor(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'fornecedores'), { ...formFornecedor, data_registro: new Date().toISOString() });
      setMostrarFormFornecedor(false);
      setFormFornecedor({ nome: '', telefone: '', especialidade: '', cidade: '', contato: '', obs: '' });
      await carregarFornecedoresLoja();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvandoFornecedor(false); }
  };
  const excluirFornecedor = async (id) => {
    if (!window.confirm('Remover este fornecedor?')) return;
    try { await deleteDoc(doc(db, 'oficinas', oficinaId, 'fornecedores', id)); await carregarFornecedoresLoja(); } catch (e) { alert('Erro: ' + e.message); }
  };
  const carregarEquipamentos = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(collection(db, "oficinas", oficinaId, "oficina_equipamentos"));
      setListaEquipamentos(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarEquipamentos:', e.message); }
  };
  const carregarFinanceiro = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, "oficinas", oficinaId, "financeiro"), orderBy("data", "desc")));
      setListaFinanceiro(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarFinanceiro:', e.message); }
  };
  const carregarUsuarios = async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, 'usuarios'), where('oficinaId', '==', oficinaId)));
      setListaUsuarios(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.papel !== 'dono'));
    } catch { }
  };
  const deletarDoc = async (col, id, reload) => {
    if (!oficinaId) return;
    if (confirm("Deseja realmente apagar permanentemente?")) { await deleteDoc(doc(db, "oficinas", oficinaId, col, id)); reload(); }
  };
  const financeiro = (() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const incSem = new Date(hoje); incSem.setDate(hoje.getDate() - hoje.getDay()); incSem.setHours(0, 0, 0, 0);
    let fDia = 0, fSem = 0, fMes = 0;
    [...listaFinanceiro].forEach(item => {
      const multiplicador = item.tipo === 'saida' ? -1 : 1;
      const v = (Number(item.total || item.valor) || 0) * multiplicador;
      let d = item.data_registro?.toDate ? item.data_registro.toDate() : new Date(item.data_registro || item.data);
      if (d && !isNaN(d.getDate())) {
        if (d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) fDia += v;
        if (d >= incSem) fSem += v;
        if (d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) fMes += v;
      }
    });
    return { fDia, fSem, fMes };
  })();
  const formatarMoeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dadosGrafico = useMemo(() => {
    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      ultimos7Dias.push({ data: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), valor: 0 });
    }
    [...listaFinanceiro].forEach(item => {
      const multiplicador = item.tipo === 'saida' ? -1 : 1;
      const v = (Number(item.total || item.valor) || 0) * multiplicador;
      const d = item.data_registro?.toDate ? item.data_registro.toDate() : new Date(item.data_registro || item.data);
      if (d && !isNaN(d.getDate())) {
        const dataStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const diaEncontrado = ultimos7Dias.find(x => x.data === dataStr);
        if (diaEncontrado) diaEncontrado.valor += v;
      }
    });
    return ultimos7Dias;
  }, [listaFinanceiro]);
  const lembretesDeOleo = useMemo(() => {
    const hoje = new Date();
    return listaCarros.filter(os => {
      const temOleo = (os.checklist || '').toLowerCase().includes('óleo') || (os.detalhesPecas || '').toLowerCase().includes('óleo');
      if (!temOleo || !os.data_registro) return false;
      const dataOS = os.data_registro.toDate ? os.data_registro.toDate() : new Date(os.data_registro);
      const diffDias = Math.ceil(Math.abs(hoje - dataOS) / (1000 * 60 * 60 * 24));
      return diffDias >= 150 && diffDias <= 210;
    });
  }, [listaCarros]);
  const estoqueCritico = useMemo(() => listaEstoque.filter(item => Number(item.qtd) <= 3 && Number(item.qtd) >= 0), [listaEstoque]);
  const dispararLembreteOleo = (os) => {
    const msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋 Aqui é da oficina ${config.nome}.\nPassando para avisar que já faz cerca de 6 meses desde a última manutenção do seu *${os.modelo}* (Placa: ${os.placa}).\nManter os serviços em dia evita danos ao veículo. Vamos agendar? 🚗`;
    abrirWhatsApp(`https://wa.me/55${os.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
  };
  const adicionarFotoGaleria = (e) => {
    const f = e.target.files[0];
    if (f) { const r = new FileReader(); r.onloadend = async () => { const c = await comprimirFoto(r.result); const dataHora = new Date().toLocaleString('pt-BR'); setListaFotosOS(prev => [...prev, { foto: c, legenda: legendaFoto, dataEnvio: dataHora }]); setLegendaFoto(''); }; r.readAsDataURL(f); }
  };
  const adicionarFotoEdicao = (e) => {
    const f = e.target.files[0];
    if (f) { const r = new FileReader(); r.onloadend = async () => { const c = await comprimirFoto(r.result); const dataHora = new Date().toLocaleString('pt-BR'); setEditFotos(prev => [...prev, { foto: c, legenda: editLegendaFoto, dataEnvio: dataHora }]); setEditLegendaFoto(''); }; r.readAsDataURL(f); }
  };
  const handleFotoPainel = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFoto(reader.result);
      setFotoPainel(comprimida); setLendoKm(true); setKmAtual('🤖 Lendo...');
      try {
        const kmLido = await analyzeImage('Leia o odômetro/quilometragem mostrado neste painel de veículo. Responda APENAS com o número. Exemplo: 54321', comprimida);
        const numero = kmLido.replace(/\D/g, '');
        setKmAtual(numero || '');
        if (numero) setKmProxima(String(Number(numero) + 10000));
      } catch { setKmAtual(''); } finally { setLendoKm(false); }
    };
    reader.readAsDataURL(file);
  };

  // ===== FUNÇÕES ABA ALINHAMENTO =====
  const handleFotoAlinhamento = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFoto(reader.result);
      setFotoAlinhamento(comprimida); setLendoFotoAlinhamento(true); setLaudoAlinhamento('🤖 Lendo laudo...');
      try {
        const laudo = await analyzeImage('Analise esta tela de alinhamento 3D ou laudo impresso. Crie um resumo simples e amigável (1 ou 2 linhas no máximo) para o cliente no WhatsApp, dizendo se estava fora do padrão e que agora está corrigido e seguro.', comprimida);
        setLaudoAlinhamento(laudo);
      } catch { setLaudoAlinhamento('Erro ao ler a imagem.'); } finally { setLendoFotoAlinhamento(false); }
    };
    reader.readAsDataURL(file);
  };
  
  const adicionarFotoPneu = (e) => {
    const f = e.target.files[0];
    if (f) { const r = new FileReader(); r.onloadend = async () => { const c = await comprimirFoto(r.result); setFotosPneus(prev => [...prev, { foto: c, legenda: legendaPneu }]); setLegendaPneu(''); }; r.readAsDataURL(f); }
  };

  const handleSalvarAlinhamento = async () => {
    if (!oficinaId) return;
    if (!placaAlinhamento) return alert('Placa é obrigatória!');
    setSalvandoAlinhamento(true);
    try {
      const diasVencimento = 180; // 6 meses
      const dataVenc = new Date(); dataVenc.setDate(dataVenc.getDate() + diasVencimento);
      const checklistTexto = [...servicosAlinhamento, ...extrasAlinhamento, `Pneus: ${estadoPneus}`].filter(Boolean).join(', ');
      const detPecas = [
        laudoAlinhamento ? `Laudo IA: ${laudoAlinhamento}` : '',
        obsAlinhamento ? `Obs: ${obsAlinhamento}` : ''
      ].filter(Boolean).join('\n');
      
      const todasFotos = [];
      if (fotoAlinhamento) todasFotos.push({ foto: fotoAlinhamento, legenda: 'Laudo de Alinhamento 3D' });
      todasFotos.push(...fotosPneus);

      const dadosAlinhamento = {
        nomeCliente: nomeClienteAlinhamento || 'Cliente', placa: normalizarPlaca(placaAlinhamento), telefone: telefoneAlinhamento, modelo: modeloAlinhamento,
        checklist: checklistTexto || osEditando?.checklist || '', 
        detalhesPecas: detPecas || osEditando?.detalhesPecas || '',
        fotos: todasFotos.length > 0 ? todasFotos : (osEditando?.fotos || []),
        valorPecas: valorPecasAlinhamento || 0,
        valorMaoObra: valorMaoObraAlinhamento || 0,
        total: (Number(valorPecasAlinhamento) || 0) + (Number(valorMaoObraAlinhamento) || 0),
        tipoServico: 'alinhamento',
      };

      if (osEditando && osEditando.tipoServico === 'alinhamento') {
        // ===== MODO EDIÇÃO: atualiza doc existente =====
        await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osEditando.id), dadosAlinhamento);
        setListaCarros(prev => prev.map(o => o.id === osEditando.id ? { ...o, ...dadosAlinhamento } : o));
        setOsEditando(null);
        alert('✅ O.S. de Alinhamento atualizada!');
      } else {
        // ===== MODO NOVO: cria doc novo =====
        await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
          ...dadosAlinhamento,
          fotoPainel: null, kmAtual: '', kmProxima: '',
          statusPagamento: 'pendente', categoriaVeiculo: 'CARRO', data: dataVenc.toISOString().split('T')[0],
          data_registro: new Date().toISOString(), diasRetorno: diasVencimento, dataVencimento: dataVenc, statusRetorno: 'pendente'
        });
        setSalvoAlinhamento(true);
      }

      setTimeout(() => {
        setSalvoAlinhamento(false); setPlacaAlinhamento(''); setNomeClienteAlinhamento(''); setTelefoneAlinhamento(''); setModeloAlinhamento('');
        setValorPecasAlinhamento(''); setValorMaoObraAlinhamento('');
        setFotoAlinhamento(null); setLaudoAlinhamento(''); setExtrasAlinhamento([]); setEstadoPneus('bons');
        setServicosAlinhamento([]); setObsAlinhamento(''); setFotosPneus([]);
      }, 3000);
      carregarOS();
    } catch (err) { alert('Erro: ' + err.message); }
    finally { setSalvandoAlinhamento(false); }
  };

  // ===== FUNÇÕES ABA ÓLEO =====
  const handleFotoPainelOleo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFoto(reader.result);
      setFotoPainelOleo(comprimida); setLendoKmOleo(true); setKmAtualOleo('🤖 Lendo...');
      try {
        const kmLido = await analyzeImage('Leia o odômetro/quilometragem mostrado neste painel de veículo. Responda APENAS com o número. Exemplo: 54321', comprimida);
        const numero = kmLido.replace(/\D/g, '');
        setKmAtualOleo(numero || '');
        if (numero) {
          const intervalo = categoriaOleo === 'moto' ? 5000 : kitOleo === 'severo' ? 7500 : 10000;
          setKmProximaOleo(String(Number(numero) + intervalo));
        }
      } catch { setKmAtualOleo(''); } finally { setLendoKmOleo(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSalvarOleo = async () => {
    if (!oficinaId) return;
    if (!placaOleo) return alert('Placa é obrigatória!');
    if (salvandoOleo) return;
    setSalvandoOleo(true);
    try {
      const diasVencimento = categoriaOleo === 'moto' ? 90 : 180;
      const dataVenc = new Date();
      dataVenc.setDate(dataVenc.getDate() + diasVencimento);
      const checklistTexto = [
        kitOleo === 'normal' ? 'TROCA DE ÓLEO SINTÉTICO + FILTRO' : 'TROCA DE ÓLEO (USO SEVERO) + FILTROS',
        tipoOleoOleo,
        litrosOleo ? `${litrosOleo}L` : '',
        ...extrasOleo
      ].filter(Boolean).join(', ');
      const osData = {
        nomeCliente: nomeClienteOleo || 'Cliente',
        placa: normalizarPlaca(placaOleo),
        telefone: telefoneOleo,
        modelo: modeloOleo,
        checklist: checklistTexto,
        detalhesPecas: obsOleo || '',
        observacoes: obsOleo || '',
        fotos: [],
        fotoPainel: fotoPainelOleo || null,
        kmAtual: kmAtualOleo || '',
        kmProxima: kmProximaOleo || '',
        valorPecas: valorPecasOleo || 0,
        valorMaoObra: valorMaoObraOleo || 0,
        total: (Number(valorPecasOleo) || 0) + (Number(valorMaoObraOleo) || 0),
        categoriaVeiculo: categoriaOleo.toUpperCase(),
        tipoServico: 'oleo',
        kitOleo, extrasOleo, litrosOleo, tipoOleo: tipoOleoOleo,
        diasRetorno: diasVencimento,
      };

      if (osEditando && osEditando.tipoServico === 'oleo') {
        // ===== MODO EDIÇÃO: atualiza doc existente =====
        await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osEditando.id), osData);
        setListaCarros(prev => prev.map(o => o.id === osEditando.id ? { ...o, ...osData } : o));
        setOsEditando(null);
        alert('✅ O.S. de Óleo atualizada!');
      } else {
        // ===== MODO NOVO: cria doc novo =====
        await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
          ...osData,
          statusPagamento: 'pendente',
          data: dataVenc.toISOString().split('T')[0],
          data_registro: new Date().toISOString(),
        });
        setSalvoOleo(true);
      }
      setTimeout(() => {
        setSalvoOleo(false);
        setPlacaOleo(''); setNomeClienteOleo(''); setTelefoneOleo(''); setModeloOleo('');
        setFotoPainelOleo(null); setKmAtualOleo(''); setKmProximaOleo('');
        setExtrasOleo([]); setLitrosOleo(''); setKitOleo('normal'); setCategoriaOleo('carro');
        setValorPecasOleo(''); setValorMaoObraOleo(''); setObsOleo('');
      }, 3000);
      carregarOS();
    } catch (err) { alert('Erro ao salvar: ' + err.message); }
    finally { setSalvandoOleo(false); }
  };

  const aplicarKitOleo = (tipo) => {
    const kmAdicional = categoriaVeiculo === 'MOTO' ? 3000 : (tipo === 'normal' ? 10000 : 5000);
    setChecklist(tipo === 'normal' ? "TROCA DE ÓLEO SINTÉTICO + FILTRO" : "TROCA DE ÓLEO (USO SEVERO) + FILTROS");
    if (kmAtual) setKmProxima(String(Number(kmAtual) + kmAdicional));
  };
  const adicionarItemChecklist = (item) => {
    setChecklist(prev => prev.includes(item) ? prev : prev + (prev ? ', ' : '') + item);
  };

  const handleSalvarOS = async () => {
    if (!oficinaId) return;
    if (!placa || !telefone) return alert('Placa e WhatsApp do cliente são obrigatórios!');
    if (salvandoOS) return;
    setSalvandoOS(true);
    try {
      const diasVencimento = categoriaVeiculo === 'MOTO' ? 90 : 180;
      const dataVenc = new Date();
      dataVenc.setDate(dataVenc.getDate() + diasVencimento);

      const os = {
        nomeCliente,
        placa: normalizarPlaca(placa), telefone, modelo, checklist, detalhesPecas,
        fotos: listaFotosOS, fotoPainel: fotoPainel || null,
        kmAtual: kmAtual || '', kmProxima: kmProxima || '',
        valorPecas: valorPecas || 0, valorMaoObra: valorMaoObra || 0,
        total: (Number(valorPecas) || 0) + (Number(valorMaoObra) || 0),
        senhaPortal: senhaPortal || '',
        data: new Date().toLocaleString('pt-BR'), data_registro: new Date(),
        statusPagamento: 'pendente',
        dataVencimento: dataVenc,
        statusRetorno: 'pendente',
        categoria: categoriaVeiculo,
      };
      const ref = await addDoc(collection(db, "oficinas", oficinaId, "os"), os);
      setSalvo(true); setTimeout(() => setSalvo(false), 3000);
      setReciboParaImprimir({ id: ref.id, ...os });

      // ===== DISPARA WHATSAPP SE TIVER SENHA E TELEFONE =====
      if (senhaPortal.length === 4 && telefone) {
        const telLimpo = String(telefone).replace(/\D/g, '');
        const nomeOficina = config.nome || 'Oficina IA';
        const placaFinal = normalizarPlaca(placa);
        const msg =
          `Olá${nomeCliente ? ' *' + nomeCliente + '*' : ''}! 👋\n\n` +
          `Seu *${modelo || 'veículo'}* (Placa *${placaFinal}*) foi registrado no nosso sistema com prontuário digital exclusivo.\n\n` +
          `🔑 *Seu acesso ao Portal do Cliente:*\n` +
          `🔗 Link: https://oficina-express-ia.netlify.app/clientes\n` +
          `📋 Placa: *${placaFinal}*\n` +
          `🔐 Senha: *${senhaPortal}*\n\n` +
          `*Por que vale guardar esse acesso?*\n\n` +
          `📜 *Histórico completo* - todo serviço fica registrado com fotos e laudos digitais\n` +
          `💰 *Valoriza na revenda* - compradores confiam mais em carros com histórico documentado\n` +
          `🔒 *Segurança* - você sabe exatamente o que foi feito no seu veículo\n` +
          `🏪 *Portabilidade* - leve seu histórico para qualquer oficina que use o app\n\n` +
          `_${nomeOficina}_ ✅`;
        const url = `https://wa.me/55${telLimpo}?text=${encodeURIComponent(msg)}`;
        setTimeout(() => window.open(url, '_blank'), 500);
      }

      setNomeCliente(''); setPlaca(''); setTelefone(''); setModelo(''); setChecklist(''); setDetalhesPecas('');
      setListaFotosOS([]); setValorPecas(''); setValorMaoObra(''); setSenhaPortal('');
      setFotoPainel(null); setKmAtual(''); setKmProxima('');
      carregarOS();
    } catch (error) {
      alert("Erro ao salvar a O.S.: " + error.message);
    } finally {
      setSalvandoOS(false);
    }
  };
  const abrirEdicao = (os) => {
    const tipo = os.tipoServico || '';
    const origem = os.origem || '';

    if (tipo === 'oleo') {
      // ===== PREENCHE ABA ÓLEO =====
      setPlacaOleo(normalizarPlaca(os.placa));
      setNomeClienteOleo(os.nomeCliente || '');
      setTelefoneOleo(os.telefone || '');
      setModeloOleo(os.modelo || '');
      setCategoriaOleo(os.categoriaVeiculo?.toLowerCase() || 'carro');
      setKitOleo(os.kitOleo || 'normal');
      setExtrasOleo(os.extrasOleo || []);
      setLitrosOleo(os.litrosOleo || '');
      setTipoOleoOleo(os.tipoOleo || '5W30 Sintético');
      setKmAtualOleo(os.kmAtual || '');
      setKmProximaOleo(os.kmProxima || '');
      setFotoPainelOleo(os.fotoPainel || null);
      setValorPecasOleo(String(os.valorPecas || ''));
      setValorMaoObraOleo(String(os.valorMaoObra || ''));
      setOsEditando(os); // guarda referência para salvar por cima
      setAbaAtiva('oleo');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

    } else if (tipo === 'alinhamento') {
      // ===== PREENCHE ABA ALINHAMENTO =====
      setPlacaAlinhamento(normalizarPlaca(os.placa));
      setNomeClienteAlinhamento(os.nomeCliente || '');
      setTelefoneAlinhamento(os.telefone || '');
      setModeloAlinhamento(os.modelo || '');
      setObsAlinhamento(os.detalhesPecas || '');
      setFotosPneus(os.fotos || []);
      setValorPecasAlinhamento(String(os.valorPecas || ''));
      setValorMaoObraAlinhamento(String(os.valorMaoObra || ''));
      setOsEditando(os);
      setAbaAtiva('alinhamento');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

    } else if (origem === 'revisao_preventiva') {
      // ===== REVISÃO =====
      setOsEditando(os);
      setAbaAtiva('revisao');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

    } else if (tipo === 'borracharia' || tipo === 'pneus') {
      // ===== PNEUS / BORRACHARIA =====
      setOsEditando(os);
      setAbaAtiva('pneus');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);

    } else {
      // ===== FORMULÁRIO GENÉRICO (O.S. normal) =====
      setOsEditando(os);
      setEditNomeCliente(os.nomeCliente || '');
      setEditPlaca(normalizarPlaca(os.placa)); setEditModelo(os.modelo || '');
      setEditChecklist(os.checklist || ''); setEditDetalhesPecas(os.detalhesPecas || '');
      setEditValorPecas(String(os.valorPecas || '')); setEditValorMaoObra(String(os.valorMaoObra || ''));
      setEditFotos(os.fotos || []); setEditFotoPainel(os.fotoPainel || null);
      setEditKmAtual(os.kmAtual || ''); setEditKmProxima(os.kmProxima || '');
    }
  };
  const salvarEdicao = async () => {
    if (!osEditando || !oficinaId) return;
    try {
      const novoTotal = (Number(editValorPecas) || 0) + (Number(editValorMaoObra) || 0);
      const dadosAtualizados = {
        nomeCliente: editNomeCliente,
        placa: normalizarPlaca(editPlaca), modelo: editModelo, checklist: editChecklist,
        detalhesPecas: editDetalhesPecas, valorPecas: editValorPecas, valorMaoObra: editValorMaoObra,
        total: novoTotal, fotos: editFotos, fotoPainel: editFotoPainel || null,
        kmAtual: editKmAtual || '', kmProxima: editKmProxima || '',
      };
      await updateDoc(doc(db, "oficinas", oficinaId, "os", osEditando.id), dadosAtualizados);
      setListaCarros(prev => prev.map(os => os.id === osEditando.id ? { ...os, ...dadosAtualizados } : os));
      setOsEditando(null); alert("✅ O.S. atualizada!");
    } catch (e) { alert("❌ Erro: " + e.message); }
  };
  const abrirRecibo = (os) => setReciboParaImprimir(os);
  const auditarMaleta = async () => {
    if (!fotoMaleta) return alert("📸 Tire a foto da caixa de ferramentas primeiro!");
    setResultadoAuditoriaIA("🤖 Inspecionando...");
    try {
      const res = await analyzeImage(`Você é um inspetor de ferramentas. Analise esta caixa de ferramentas do mecânico ${membroAuditando.nome}. Liste as chaves visíveis. AVISO CRÍTICO: Procure espaços vazios que indicam ferramentas FALTANDO. Se achar, alerte em CAIXA ALTA.`, fotoMaleta);
      setResultadoAuditoriaIA(res);
    } catch { setResultadoAuditoriaIA("❌ Erro na análise."); }
  };
  const fecharAuditoria = () => { setMembroAuditando(null); setFotoMaleta(null); setResultadoAuditoriaIA(''); };
  const handleSalvarEquipamento = async () => {
    if (!equipamentoNome || !oficinaId) return alert("Digite o nome do equipamento!");
    try {
      await addDoc(collection(db, "oficinas", oficinaId, "oficina_equipamentos"), { nome: equipamentoNome, foto: equipamentoFoto || null, data_registro: new Date() });
      setEquipamentoNome(''); setEquipamentoFoto(null); carregarEquipamentos();
    } catch (e) { alert("Erro ao adicionar patrimônio."); }
  };
  const enviarAppFuncionario = (usuario) => {
    const tel = prompt(`WhatsApp do(a) ${usuario.nome}? (Com DDD, Ex: 5534999999999)`, "55");
    if (!tel || tel === "55" || tel.length < 10) return;
    const msg = `Olá, *${usuario.nome}*! 👋\nAcesse o sistema: ${window.location.origin}\n🔐 *SEU ACESSO:*\n📧 Login: ${usuario.email}\n🔑 Senha: (a senha que o patrão criou)\n📲 *COMO INSTALAR NO CELULAR:* Abra o link, clique nos 3 pontinhos no topo da tela e escolha "Adicionar à tela inicial"`;
    abrirWhatsApp(`https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
  };
  const enviarWhatsApp = async (os, tipo = 'link') => {
    let msg = "";
    const linkStatus = `${window.location.origin}/status/${oficinaId}/${os.id}`;
    if (tipo === 'link') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋 Aqui é da oficina *${config.nome || 'Oficina IA'}*.\nRegistramos a entrada do seu *${os.modelo}* (Placa: ${os.placa}).\n🛠️ *Serviço:* ${os.checklist || 'Avaliação'}\n💰 *Valor Atual:* ${formatarMoeda(os.total)}\n📸 *Veja todas as FOTOS das peças e acompanhe o serviço no seu Portal Exclusivo:* 👇\n🔗 ${linkStatus}`;
    } else if (tipo === 'orcamento') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋 O orçamento do seu *${os.modelo}* ficou em *${formatarMoeda(os.total)}*.\nVeja os detalhes completos e as fotos das peças aqui:\n🔗 ${linkStatus}\nPodemos iniciar o serviço?`;
    } else if (tipo === 'pagamento') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋 O serviço no seu *${os.modelo}* está concluído!\nValor Total: *${formatarMoeda(os.total)}*\n💳 Nossa Chave PIX é:\n${config.pixKey || '(Não configurada)'}\nAcesse seu portal para ver o recibo final: ${linkStatus}`;
    }
    if (tipo === 'pagamento') {
      const confirmar = window.confirm(`💰 O cliente fez o pagamento de ${formatarMoeda(os.total)}?\nDeseja dar baixa na O.S. e lançar este valor automaticamente no Caixa (Financeiro)?`);
      if (confirmar) {
        try {
          await addDoc(collection(db, "oficinas", oficinaId, "financeiro"), {
            descricao: `O.S. Paga - ${os.placa} (${os.modelo})`, valor: Number(os.total), pagamento: 'PIX', tipo: 'entrada', data: new Date().toISOString()
          });
          await updateDoc(doc(db, "oficinas", oficinaId, "os", os.id), { statusPagamento: 'pago' });
          alert("✅ O.S. finalizada e dinheiro lançado no Caixa com sucesso!"); carregarOS(); carregarFinanceiro();
        } catch { alert("❌ Erro ao lançar no caixa."); }
      }
    }
    abrirWhatsApp(`https://wa.me/55${os.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
  };
  const enviarTrabalhoParaFuncionario = (usuario, osId, e) => {
    if (!osId) return; const os = listaCarros.find(x => x.id === osId); if (!os) return; if (e) e.target.value = "";
    let mensagem = "";
    if (usuario.cargo === "Secretária" || usuario.cargo === "ADM") {
      mensagem = `📋 *COBRANÇA - ${usuario.nome.toUpperCase()}*\n🚗 ${os.modelo} (${os.placa})\n💰 Peças: R$ ${os.valorPecas || '0'}\n🛠️ M.O.: R$ ${os.valorMaoObra || '0'}\n💵 TOTAL: R$ ${Number(os.valorPecas || 0) + Number(os.valorMaoObra || 0)}\n📱 Cliente: https://wa.me/55${os.telefone?.replace(/\D/g, '')}`;
    } else if (usuario.cargo === "Estoque/Peças") {
      mensagem = `📦 *PEÇAS - ${usuario.nome.toUpperCase()}*\n🚗 ${os.modelo} (${os.placa})\n📋 Peças a separar: ${os.detalhesPecas || 'Verificar com mecânico'}`;
    } else {
      mensagem = `🔧 *SERVIÇO - ${usuario.nome.toUpperCase()}*\n🚗 ${os.modelo} (${os.placa})\n📝 O que fazer: ${os.checklist}\n📦 Peças: ${os.detalhesPecas || 'Verificar no estoque'}`;
    }
    const tel = prompt(`WhatsApp do(a) ${usuario.nome}?`, "55");
    if (!tel || tel === "55" || tel.length < 10) return;
    abrirWhatsApp(`https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`);
  };
  const handleCriarFuncionario = async () => {
    if (!novoUsuarioEmail || !novoUsuarioNome || !novoUsuarioSenha) return alert('Preencha nome, e-mail e senha!');
    setSalvandoUsuario(true);
    try {
      const cred = await createUserWithEmailAndPassword(getAuth(), novoUsuarioEmail, novoUsuarioSenha);
      const f = document.getElementById('fotoEquipeInput')?.files[0];
      let comp = null;
      if (f) { const r = new FileReader(); comp = await new Promise(res => { r.onloadend = async () => res(await comprimirFoto(r.result)); r.readAsDataURL(f); }); }
      await setDoc(doc(db, 'usuarios', cred.user.uid), {
        uid: cred.user.uid, oficinaId, nome: novoUsuarioNome, email: novoUsuarioEmail,
        papel: 'funcionario', cargo: novoUsuarioCargo, foto: comp, permissoes: permissoesNovoUsuario
      });
      setNovoUsuarioEmail(''); setNovoUsuarioNome(''); setNovoUsuarioSenha(''); setNovoUsuarioFoto(null);
      setPermissoesNovoUsuario({ os: true, estoque: false, financeiro: false, equipe: false, oficina: false, config: false });
      await carregarUsuarios();
      alert('✅ Funcionário e Acesso criados!');
    } catch (e) {
      alert('❌ Erro: ' + (e.code === 'auth/email-already-in-use' ? 'E-mail já está em uso.' : e.message));
    } finally { setSalvandoUsuario(false); }
  };
  const salvarPermissoes = async (usuarioId, novasPermissoes) => {
    await updateDoc(doc(db, 'usuarios', usuarioId), { permissoes: novasPermissoes });
    setListaUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, permissoes: novasPermissoes } : u));
  };
  const deletarFuncionario = async (usuarioId) => {
    if (!confirm('Remover o acesso deste funcionário?')) return;
    await deleteDoc(doc(db, 'usuarios', usuarioId));
    setListaUsuarios(prev => prev.filter(u => u.id !== usuarioId));
  };
  const osFiltradas = listaCarros.filter(os =>
    (os.placa || '').toLowerCase().includes(busca.toLowerCase()) ||
    (os.modelo || '').toLowerCase().includes(busca.toLowerCase()) ||
    (os.nomeCliente || '').toLowerCase().includes(busca.toLowerCase())
  );

  // ✅ ABAS DISPONÍVEIS
  const ABAS_DISPONIVEIS = [
    'dashboard', 'os', 'oficina', 'oleo', 'alinhamento', 'revisao', 'pneus', 'injecao', 'copiloto', 'retorno', 'estoque', 'financeiro', 'equipe',
    'leads', 'assinatura', ...(papelLogado === 'master' ? ['master'] : []), 'config', 'estrategia', 'marketing', 'desmanche', 'fornecedores', 'ajuda'
  ].filter(aba => temPermissao(aba));

  const LABELS_ABAS = {
    dashboard: '📊 VISÃO GERAL', os: '🔧 O.S.', oleo: '🛢️ ÓLEO', alinhamento: '⚙️ ALINHAMENTO',
    revisao: '🛡️ REVISÃO', pneus: '🛞 PNEUS', injecao: '⚡ INJEÇÃO', copiloto: '👨‍🔧 COPILOTO', assinatura: '💎 MEU PLANO',
    retorno: '🔄 RETORNO', estoque: 'ESTOQUE', financeiro: 'FINANCEIRO', equipe: '👥 EQUIPE',
    oficina: '🏢 MECÂNICA', leads: '👥 CLIENTES', config: 'CONFIG', master: '👑 MASTER',
    estrategia: '🚀 ESTRATÉGIA', marketing: '📣 MARKETING', desmanche: '🚗 DESMANCHE',
    fornecedores: '🔩 FORNECEDORES', ajuda: '💡 AJUDA'
  };

  if (carregandoAuth) return <div style={{ minHeight: '100vh', background: 'black', color: '#FF0033', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>⏳ INICIANDO SISTEMA...</div>;

  if (bloqueado) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '450px', width: '100%', background: '#111', padding: '40px', borderRadius: '15px', border: `1px solid ${MAIN_COLOR}`, textAlign: 'center', boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>{bloqueado === 'trial' ? '⏰' : '🔒'}</div>
          <h2 style={{ color: MAIN_COLOR, margin: '0 0 10px 0' }}>{bloqueado === 'trial' ? 'TEMPO DE TESTE TERMINADO' : 'ACESSO SUSPENSO'}</h2>
          <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
            {bloqueado === 'trial' ? 'Esperamos que tenha gostado do Oficina IA! Escolha o seu plano abaixo para não perder os seus dados e continuar com acesso total:' : 'A sua conta foi temporariamente suspensa pelo administrador.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            <button onClick={() => window.open(planosSistema.linkMensal || '#', '_blank')} style={{ width: '100%', padding: '15px', background: '#222', color: 'white', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              💳 PLANO MENSAL (R$ {planosSistema.precoMensal || '97,00'})
            </button>
            <button onClick={() => window.open(planosSistema.linkAnual || '#', '_blank')} style={{ width: '100%', padding: '15px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '15px' }}>
              💳 PLANO ANUAL (R$ {planosSistema.precoAnual || '970,00'}) - COM DESCONTO
            </button>
          </div>
          <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '10px' }}>
            <button onClick={() => {
              const msg = `Olá, Suporte! Acabei de realizar o pagamento da minha assinatura do Oficina IA.\nMeu E-mail de cadastro é: *${dadosOficina?.email || emailInput}*.\nSegue o comprovante para liberar o meu acesso.`;
              const num = import.meta.env.VITE_SU_WPP ? import.meta.env.VITE_SU_WPP.replace(/\D/g, '') : '5534988273194';
              abrirWhatsApp(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
            }} style={{ width: '100%', padding: '15px', background: '#25D366', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
              📲 ENVIAR COMPROVANTE P/ SUPORTE
            </button>
            <button onClick={fazerLogout} style={{ background: 'transparent', color: '#555', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Sair da conta</button>
          </div>
        </div>
      </div>
    );
  }

  if (!logado) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: '#111', padding: '40px', borderRadius: '10px', border: `1px solid ${MAIN_COLOR}` }}>
          <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>ADMIN <span style={{ color: MAIN_COLOR }}>IA</span></h2>
          <input type="email" placeholder="E-MAIL" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={{ width: '100%', padding: '15px', background: 'black', border: '1px solid #333', color: 'white', marginBottom: '10px', textAlign: 'center' }} />
          <input type="password" placeholder="SENHA" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verificarSenha()} style={{ width: '100%', padding: '15px', background: 'black', border: '1px solid #333', color: 'white', marginBottom: '20px', textAlign: 'center' }} />
          <button onClick={verificarSenha} style={{ width: '100%', padding: '15px', background: MAIN_COLOR, color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '13px' }}>
            Não tem conta? <a href="/cadastro" style={{ color: MAIN_COLOR, textDecoration: 'none', fontWeight: 'bold' }}>Cadastre sua oficina grátis</a>
          </p>
        </div>
      </div>
    );
  }

  if (osEditando && !osEditando.tipoServico && osEditando.origem !== 'revisao_preventiva' && osEditando.origem !== 'borracharia_pneus') {
    return (
      <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${MAIN_COLOR}`, paddingBottom: '15px' }}>
            <h2 style={{ margin: 0, color: MAIN_COLOR }}>✏️ Editando O.S. - {osEditando.placa}</h2>
            <button onClick={() => setOsEditando(null)} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>✕ Cancelar</button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#888', fontSize: '12px' }}>CLIENTE / EMPRESA</label>
              <input value={editNomeCliente} onChange={(e) => setEditNomeCliente(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '12px' }}>PLACA</label><input value={editPlaca} onChange={(e) => setEditPlaca(normalizarPlaca(e.target.value))} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
            <div style={{ flex: 2 }}><label style={{ color: '#888', fontSize: '12px' }}>MODELO</label><input value={editModelo} onChange={(e) => setEditModelo(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '12px' }}>DEFEITO / CHECKLIST / SERVIÇO EXECUTADO</label>
            <textarea value={editChecklist} onChange={(e) => setEditChecklist(e.target.value)} rows={5} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '12px' }}>PEÇAS UTILIZADAS</label>
            <textarea value={editDetalhesPecas} onChange={(e) => setEditDetalhesPecas(e.target.value)} rows={3} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '12px' }}>VALOR PEÇAS (R$)</label><input type="number" value={editValorPecas} onChange={(e) => setEditValorPecas(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
            <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '12px' }}>MÃO DE OBRA (R$)</label><input type="number" value={editValorMaoObra} onChange={(e) => setEditValorMaoObra(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
          </div>
          <div style={{ background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: `1px solid ${KM_COLOR}44` }}>
            <label style={{ color: KM_COLOR, fontSize: '12px', fontWeight: 'bold' }}>📸 KM / FOTO DO PAINEL</label>
            {editFotoPainel ? (
              <div style={{ marginTop: '10px' }}>
                <img src={editFotoPainel} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                <button onClick={() => setEditFotoPainel(null)} style={{ width: '100%', marginTop: '8px', padding: '8px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️ REMOVER FOTO</button>
              </div>
            ) : (
              <label style={{ display: 'block', marginTop: '10px', padding: '15px', border: `2px dashed ${KM_COLOR}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '24px' }}>📸</div>
                <div style={{ color: KM_COLOR, fontSize: '12px' }}>ADICIONAR FOTO</div>
                <input type="file" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onloadend = async () => setEditFotoPainel(await comprimirFoto(r.result)); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
              </label>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '11px' }}>KM ATUAL</label><input type="number" value={editKmAtual} onChange={(e) => setEditKmAtual(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: `1px solid ${KM_COLOR}`, color: KM_COLOR, borderRadius: '5px', textAlign: 'center' }} /></div>
              <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '11px' }}>PRÓXIMA TROCA</label><input type="number" value={editKmProxima} onChange={(e) => setEditKmProxima(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: `1px solid ${MAIN_COLOR}`, color: MAIN_COLOR, borderRadius: '5px', textAlign: 'center' }} /></div>
            </div>
          </div>
          <div style={{ background: '#111', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '12px' }}>FOTOS DO SERVIÇO / VEÍCULO</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '15px' }}>
              <input type="text" value={editLegendaFoto} onChange={(e) => setEditLegendaFoto(e.target.value)} placeholder="1º Escreva a legenda aqui..." style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
              <label style={{ padding: '10px 20px', background: '#333', color: 'white', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
                📷 2º FOTO <input type="file" accept="image/*" onChange={adicionarFotoEdicao} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {editFotos.map((f, i) => (
                <div key={i} style={{ position: 'relative', width: '100px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #333' }}>
                  <img src={f.foto} style={{ width: '100px', height: '100px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '10px', padding: '4px', textAlign: 'center' }}>{f.legenda || 'Sem legenda'}</div>
                  <button onClick={() => setEditFotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#1a1a00', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <span style={{ color: '#888', fontSize: '12px' }}>VALOR TOTAL: </span>
            <strong style={{ color: GREEN_MONEY, fontSize: '20px' }}>{formatarMoeda((Number(editValorPecas) || 0) + (Number(editValorMaoObra) || 0))}</strong>
          </div>
          <button onClick={salvarEdicao} style={{ width: '100%', padding: '18px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>💾 SALVAR EDIÇÃO</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', paddingBottom: '40px' }}>
      <div style={{ background: '#111', padding: '20px', borderBottom: `1px solid ${papelLogado === 'master' ? MASTER_COLOR : MAIN_COLOR}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>OFICINA <span style={{ color: papelLogado === 'master' ? MASTER_COLOR : MAIN_COLOR }}>IA</span></h1>
          {papelLogado === 'master' && <span style={{ color: MASTER_COLOR, fontSize: '11px', fontWeight: 'bold' }}>👑 MASTER</span>}
          {papelLogado === 'funcionario' && <span style={{ color: '#666', fontSize: '11px' }}>FUNCIONÁRIO</span>}
        </div>
        <button onClick={fazerLogout} style={{ background: 'transparent', color: papelLogado === 'master' ? MASTER_COLOR : MAIN_COLOR, border: `1px solid ${papelLogado === 'master' ? MASTER_COLOR : MAIN_COLOR}`, padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>SAIR</button>
      </div>
      <div className="scrollbar-hide" style={{ display: 'flex', gap: '10px', padding: '20px', background: '#0a0a0a', overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        {ABAS_DISPONIVEIS.map(aba => (
          <button key={aba} onClick={() => { setAbaAtiva(aba); if (aba === 'fornecedores') { carregarFornecedores(); marcarNotifLidas(); } }} style={{ minWidth: '120px', padding: '15px', background: abaAtiva === aba ? (TAB_COLORS[aba] || MAIN_COLOR) : '#222', color: abaAtiva === aba ? 'black' : 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', fontSize: '11px', position: 'relative' }}>
            {LABELS_ABAS[aba]}
            {aba === 'fornecedores' && notifDesmanche > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {notifDesmanche > 9 ? '9+' : notifDesmanche}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

        {/* ── AVISO DE IA ── aparece nas abas que usam IA */}
        {['copiloto', 'revisao', 'pneus', 'alinhamento', 'oleo', 'injecao'].includes(abaAtiva) && (
          <div style={{ background: '#1a1000', border: '1px solid #f59e0b44', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <p style={{ margin: 0, color: '#f59e0b', fontSize: '11px', lineHeight: '1.5' }}>
              <strong>AVISO:</strong> A Inteligência Artificial pode cometer erros. Use sempre como <strong>assistente de apoio</strong> - a decisão técnica final é sempre do mecânico qualificado.
            </p>
          </div>
        )}

        {/* ===== VISÃO GERAL ===== */}
        {abaAtiva === 'dashboard' && (
          <div>
            <h2 style={{ color: '#00E676', marginBottom: '20px' }}>📊 Visão Geral</h2>

            {/* ── RELATÓRIO SEMANAL AUTOMÁTICO ── */}
            <div style={{ background: 'linear-gradient(135deg, #001a05, #0a0a0a)', border: `1px solid ${GREEN_MONEY}44`, borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ color: GREEN_MONEY, margin: '0 0 3px 0', fontSize: '15px' }}>📊 Relatório Semanal - Envio Automático</h3>
                  <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>Resumo de vendas, novos clientes e serviços para enviar todo sábado</p>
                </div>
                <button onClick={() => {
                  const totalSemana = listaCarros
                    .filter(os => { const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || os.data || ''); const diff = (new Date() - d) / 86400000; return diff <= 7; })
                    .reduce((s, os) => s + (Number(os.total) || 0), 0);
                  const novosClientes = [...new Set(listaCarros.filter(os => { const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || os.data || ''); return (new Date() - d) / 86400000 <= 7; }).map(os => os.placa))].length;
                  const osAbertas = listaCarros.filter(os => os.statusPagamento !== 'pago').length;
                  const osFechadas = listaCarros.filter(os => os.statusPagamento === 'pago' && (() => { const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || ''); return (new Date() - d) / 86400000 <= 7; })()).length;
                  const nomeOf = dadosOficina?.nomeOficina || config?.nome || 'Oficina IA';
                  const hoje = new Date().toLocaleDateString('pt-BR');
                  const msg = encodeURIComponent(
                    `📊 *RELATÓRIO SEMANAL - ${nomeOf}*\n📅 ${hoje}\n\n` +
                    `💰 *Faturamento da semana:* R$ ${totalSemana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                    `🆕 *Veículos atendidos:* ${novosClientes}\n` +
                    `✅ *O.S. fechadas:* ${osFechadas}\n` +
                    `⏳ *O.S. em aberto:* ${osAbertas}\n\n` +
                    `🔧 *Serviços realizados esta semana:*\n` +
                    listaCarros
                      .filter(os => { const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || os.data || ''); return (new Date() - d) / 86400000 <= 7; })
                      .slice(0, 5)
                      .map(os => `  • ${os.placa || '-'} ${os.modelo || ''} - ${os.tipoServico || 'O.S.'} - R$ ${Number(os.total||0).toLocaleString('pt-BR')}`)
                      .join('\n') +
                    `\n\n_Gerado pelo Oficina IA_ 🤖`
                  );
                  const tel = (dadosOficina?.telefone || '').replace(/\D/g,'');
                  if (tel) window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
                  else { const blob = new Blob([decodeURIComponent(msg)], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'relatorio-semanal.txt'; a.click(); }
                }} style={{ padding: '10px 18px', background: '#25D366', color: 'black', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>
                  📲 ENVIAR RELATÓRIO NO ZAP
                </button>
              </div>
              {/* Mini cards do relatório */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {[
                  { label: 'Atendidos (7 dias)', valor: [...new Set(listaCarros.filter(os => { const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || ''); return (new Date()-d)/86400000 <= 7; }).map(os => os.placa))].length, cor: GREEN_MONEY },
                  { label: 'O.S. Fechadas', valor: listaCarros.filter(os => os.statusPagamento === 'pago').length, cor: '#3b82f6' },
                  { label: 'O.S. Abertas', valor: listaCarros.filter(os => os.statusPagamento !== 'pago').length, cor: KM_COLOR },
                  { label: 'Total no Mês', valor: formatarMoeda(listaCarros.filter(os => { const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || ''); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, os) => s + (Number(os.total)||0), 0)), cor: GREEN_MONEY },
                ].map(({ label, valor, cor }) => (
                  <div key={label} style={{ background: '#111', border: `1px solid ${cor}22`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#555', fontSize: '10px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{label}</p>
                    <p style={{ color: cor, fontSize: '18px', fontWeight: '900', margin: 0 }}>{valor}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>FATURAMENTO DO MÊS</p>
                <h3 style={{ color: GREEN_MONEY, margin: 0, fontSize: '22px' }}>{temPermissao('financeiro') ? formatarMoeda(financeiro.fMes) : '🔒'}</h3>
              </div>
              <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #1a3a1a' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>A RECEBER (OS ABERTAS)</p>
                <h3 style={{ color: '#facc15', margin: 0, fontSize: '22px' }}>
                  {formatarMoeda(listaCarros.filter(os => os.statusPagamento !== 'pago').reduce((acc, os) => acc + (Number(os.total) || 0), 0))}
                </h3>
                <p style={{ color: '#555', margin: '4px 0 0 0', fontSize: '11px' }}>
                  {listaCarros.filter(os => os.statusPagamento !== 'pago').length} O.S. pendentes
                </p>
              </div>
              <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>O.S. NO SISTEMA</p>
                <h3 style={{ color: '#3b82f6', margin: 0, fontSize: '22px' }}>{listaCarros.length}</h3>
              </div>
              <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>ITENS EM ESTOQUE</p>
                <h3 style={{ color: '#eab308', margin: 0, fontSize: '22px' }}>{listaEstoque.reduce((acc, item) => acc + (Number(item.qtd) || 0), 0)}</h3>
              </div>
            </div>
            {estoqueCritico.length > 0 && (
              <div style={{ background: '#1a0000', border: `1px solid ${MAIN_COLOR}`, padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
                <h3 style={{ color: MAIN_COLOR, margin: '0 0 10px 0' }}>⚠️ ESTOQUE CRÍTICO ({estoqueCritico.length} items)</h3>
                <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>Estas peças estão acabando. Faça a reposição para não atrasar serviços!</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {estoqueCritico.map(item => (
                    <div key={item.id} style={{ background: '#FF003311', border: `1px solid ${MAIN_COLOR}`, padding: '8px 12px', borderRadius: '8px' }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>{item.nome}</span>
                      <span style={{ color: MAIN_COLOR, fontWeight: 'bold', fontSize: '13px', marginLeft: '8px' }}>{item.qtd === 0 ? '🚫 ZERADO' : `${item.qtd} un`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lembretesDeOleo.length > 0 && (
              <div style={{ background: '#1a1a1a', border: `1px solid ${MASTER_COLOR}`, padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
                <h3 style={{ color: MASTER_COLOR, margin: '0 0 10px 0' }}>🔔 LEMBRETE: SERVIÇOS ({lembretesDeOleo.length})</h3>
                <p style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>Clientes com serviços prestes a vencer. Envie uma mensagem e agende um retorno!</p>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }} className="scrollbar-hide">
                  {lembretesDeOleo.map(os => (
                    <div key={os.id} style={{ background: 'black', border: '1px solid #333', padding: '15px', borderRadius: '8px', minWidth: '200px' }}>
                      <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '13px' }}>{os.modelo}</p>
                      <p style={{ color: '#888', margin: '0 0 10px 0', fontSize: '11px' }}>Placa: {os.placa}</p>
                      <button onClick={() => dispararLembreteOleo(os)} style={{ width: '100%', padding: '10px', background: '#25D366', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>💬 AVISAR NO ZAP</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {temPermissao('financeiro') && (
              <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px' }}>Receita dos Últimos 7 Dias</h3>
                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico}>
                      <XAxis dataKey="data" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#222' }} contentStyle={{ background: '#000', border: '1px solid #333', borderRadius: '8px' }} formatter={(value) => [formatarMoeda(value), "Receita"]} />
                      <Bar dataKey="valor" fill={GREEN_MONEY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── AUTOMAÇÕES INTELIGENTES ── */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#a855f7', margin: '0 0 14px 0', fontSize: '15px' }}>🤖 Automações Inteligentes - Próximas Funcionalidades</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    icon: '🌟', cor: '#f59e0b',
                    titulo: 'Máquina de Avaliações Google',
                    desc: '24h após finalizar uma O.S., o sistema dispara automaticamente um WhatsApp pedindo avaliação no Google Meu Negócio. Suba nas buscas locais sem precisar pedir manualmente.',
                    gatilho: 'Gatilho: O.S. marcada como "Pago"',
                    status: 'Em desenvolvimento'
                  },
                  {
                    icon: '🛒', cor: '#3b82f6',
                    titulo: 'Recuperação de Orçamento Abandonado',
                    desc: 'Se um orçamento ficar parado por 48h sem resposta, o sistema manda um WhatsApp automático oferecendo parcelamento para fechar o negócio.',
                    gatilho: 'Gatilho: O.S. parada em "Orçamento" por 48h',
                    status: 'Em desenvolvimento'
                  },
                  {
                    icon: '🚦', cor: GREEN_MONEY,
                    titulo: 'Rastreamento em Tempo Real (Zero Ligações)',
                    desc: 'Cada vez que o mecânico muda o status do serviço (Ex: "Em Manutenção" → "Pronto"), o cliente recebe um WhatsApp automático. Experiência de Uber para o carro.',
                    gatilho: 'Gatilho: Mudança de status da O.S.',
                    status: 'Em desenvolvimento'
                  },
                ].map(({ icon, cor, titulo, desc, gatilho, status }) => (
                  <div key={titulo} style={{ background: '#0d0d0d', border: `1px solid ${cor}33`, borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: cor, fontSize: '14px' }}>{icon} {titulo}</h4>
                      <span style={{ background: `${cor}22`, color: cor, fontSize: '9px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px', whiteSpace: 'nowrap' }}>{status}</span>
                    </div>
                    <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 6px 0', lineHeight: '1.5' }}>{desc}</p>
                    <p style={{ color: '#555', fontSize: '10px', margin: 0, fontStyle: 'italic' }}>{gatilho}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== ABA OS ===== */}
        {abaAtiva === 'os' && temPermissao('os') && (
          <div>
            <h2 style={{ color: MAIN_COLOR, marginBottom: '12px' }}>🔧 Nova Ordem de Serviço</h2>
            {/* Botões de ação rápida */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => setAbaAtiva('ajuda')} style={{ padding: '8px 14px', background: '#00001a', color: '#3b82f6', border: '1px solid #3b82f644', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>❓ AJUDA</button>
              {papelLogado === 'master' && <button onClick={() => setAbaAtiva('master')} style={{ padding: '8px 14px', background: `${MASTER_COLOR}22`, color: MASTER_COLOR, border: `1px solid ${MASTER_COLOR}44`, borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>👑 MASTER</button>}
              <button onClick={() => setAbaAtiva('assinatura')} style={{ padding: '8px 14px', background: '#00E67622', color: GREEN_MONEY, border: `1px solid ${GREEN_MONEY}44`, borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>💎 PLANO</button>
            </div>
            <div style={{ marginBottom: '20px', background: '#1a1a00', padding: '15px', borderRadius: '10px', border: `1px solid ${KM_COLOR}44`, textAlign: 'center' }}>
              <p style={{ color: KM_COLOR, fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px' }}>🛢️ VAI TROCAR O ÓLEO OU ALINHAR?</p>
              <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>Use as abas específicas no menu acima! Lá a IA automatiza os processos.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="NOME DO CLIENTE / EMPRESA" style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #333', color: 'white', fontSize: '18px', borderRadius: '5px' }} />
              <button onClick={() => ouvirCampo('nome', setNomeCliente)} style={{ background: campoOuvindo === 'nome' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '5px', padding: '0 20px', fontSize: '20px', cursor: 'pointer' }}>{campoOuvindo === 'nome' ? '🔴' : '🎤'}</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={placa} onChange={(e) => setPlaca(normalizarPlaca(e.target.value))} placeholder="PLACA (ABC1234)" style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #333', color: 'white', fontSize: '18px', borderRadius: '5px' }} />
              <button onClick={() => ouvirCampo('placa', setPlaca)} style={{ background: campoOuvindo === 'placa' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '5px', padding: '0 20px', fontSize: '20px', cursor: 'pointer' }}>{campoOuvindo === 'placa' ? '🔴' : '🎤'}</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))} placeholder="WHATSAPP DO CLIENTE" style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #333', color: 'white', fontSize: '18px', borderRadius: '5px' }} />
              <button onClick={() => ouvirCampo('telefone', setTelefone)} style={{ background: campoOuvindo === 'telefone' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '5px', padding: '0 20px', fontSize: '20px', cursor: 'pointer' }}>{campoOuvindo === 'telefone' ? '🔴' : '🎤'}</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="MODELO DO VEÍCULO (Ex: Gol 2019)" style={{ flex: 1, padding: '15px', background: '#111', border: '1px solid #333', color: 'white', fontSize: '18px', borderRadius: '5px' }} />
              <button onClick={() => ouvirCampo('modelo', setModelo)} style={{ background: campoOuvindo === 'modelo' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '5px', padding: '0 20px', fontSize: '20px', cursor: 'pointer' }}>{campoOuvindo === 'modelo' ? '🔴' : '🎤'}</button>
            </div>

            {/* ===== SENHA DO PORTAL DO CLIENTE ===== */}
            <div style={{ background: '#0a001a', border: '2px solid #a855f7', borderRadius: '10px', padding: '16px', marginBottom: '15px' }}>
              <label style={{ color: '#a855f7', fontSize: '12px', fontWeight: '900', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                🔑 SENHA DO PORTAL DO CLIENTE (4 dígitos)
              </label>
              <p style={{ color: '#888', fontSize: '11px', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                Defina uma senha de 4 dígitos. Ao salvar, o WhatsApp abre automaticamente com o link do portal e as vantagens para o cliente.
              </p>
              <input
                type="text"
                value={senhaPortal}
                onChange={(e) => setSenhaPortal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ex: 1234"
                maxLength={4}
                style={{ width: '100%', padding: '16px', background: '#111', border: `2px solid ${senhaPortal.length === 4 ? '#a855f7' : '#444'}`, color: '#a855f7', borderRadius: '8px', fontSize: '28px', fontWeight: '900', textAlign: 'center', letterSpacing: '12px' }}
              />
              {senhaPortal.length === 4 && (
                <p style={{ color: '#a855f7', fontSize: '11px', margin: '8px 0 0 0', textAlign: 'center' }}>
                  ✅ Senha <strong>{senhaPortal}</strong> definida - ao salvar, WhatsApp abre com o convite para o cliente! 📲
                </p>
              )}
              {senhaPortal.length === 0 && (
                <p style={{ color: '#555', fontSize: '11px', margin: '8px 0 0 0', textAlign: 'center' }}>
                  ⚠️ Sem senha - cliente não conseguirá acessar o portal e não receberá o convite.
                </p>
              )}
            </div>
            <div style={{ background: '#FF003322', border: '1px solid #FF0033', padding: '15px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>
              <p style={{ color: '#FF0033', fontSize: '13px', fontWeight: 'bold', margin: 0 }}>⚠️ ATENÇÃO: Verifique os dados antes de salvar.</p>
              <p style={{ color: '#FF0033', fontSize: '11px', margin: '5px 0 0 0' }}>Por questões de segurança e auditoria, recomendamos não alterar valores estruturais após a criação.</p>
            </div>
            <button onClick={handleSalvarOS} disabled={salvandoOS} style={{ width: '100%', padding: '20px', background: salvandoOS ? '#333' : MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              {salvandoOS ? '⏳ SALVANDO...' : salvo ? '✅ SALVA COM SUCESSO!' : '💾 GERAR O.S.'}
            </button>

            <h3 style={{ color: MAIN_COLOR, marginTop: '40px', marginBottom: '15px' }}>📋 O.S. Recentes (Histórico)</h3>
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="🔍 Procurar por Placa, Modelo ou Cliente..." style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #333', color: 'white', marginBottom: '15px', borderRadius: '5px' }} />
            {osFiltradas.map(os => (
              <div key={os.id} style={{ background: '#111', padding: '20px', marginBottom: '10px', borderRadius: '10px', border: `1px solid ${os.statusPagamento === 'pago' ? '#00E67633' : '#333'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '16px' }}>{os.nomeCliente || 'Cliente Padrão'}</h4>
                      {os.statusPagamento === 'pago'
                        ? <span style={{ background: '#00E67622', color: GREEN_MONEY, border: `1px solid ${GREEN_MONEY}`, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>✅ PAGO</span>
                        : <span style={{ background: '#FF003311', color: MAIN_COLOR, border: `1px solid ${MAIN_COLOR}`, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>⏳ PENDENTE</span>
                      }
                    </div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#ccc' }}>🚗 {os.placa} - {os.modelo}</p>
                    <p style={{ color: '#888', fontSize: '11px', margin: '0 0 5px 0' }}>Data: {typeof os.data === 'string' ? os.data.split(',')[0] : ''}</p>
                    {os.kmAtual && <p style={{ color: KM_COLOR, margin: '0 0 5px 0', fontSize: '11px' }}>📍 {Number(os.kmAtual).toLocaleString()} km → próx: {Number(os.kmProxima).toLocaleString()} km</p>}
                    <p style={{ color: GREEN_MONEY, fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{formatarMoeda(os.total)}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button onClick={() => enviarWhatsApp(os, 'link')} style={{ padding: '8px 12px', background: '#25D366', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>💬 ENVIAR PORTAL AO CLIENTE</button>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => enviarWhatsApp(os, 'orcamento')} style={{ flex: 1, padding: '6px', background: '#128C7E', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>💰 Orçamento</button>
                      {os.statusPagamento === 'pago'
                        ? <button disabled style={{ flex: 1, padding: '6px', background: '#0a0a0a', color: GREEN_MONEY, border: `1px solid ${GREEN_MONEY}`, borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' }}>✅ Recebido</button>
                        : <button onClick={() => enviarWhatsApp(os, 'pagamento')} style={{ flex: 1, padding: '6px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>💳 Cobrar PIX</button>
                      }
                    </div>
                    <button onClick={() => {
                      const link = `${window.location.origin}/status/${oficinaId}/${os.id}`;
                      const msg = encodeURIComponent(`📋 *Laudo da O.S.*\n🚗 ${os.modelo} (Placa: ${os.placa})\n🛠️ Serviço: ${os.checklist || 'Avaliação'}\n💰 Valor: ${formatarMoeda(os.total)}\n\n🔗 Acesse o laudo completo com fotos:\n${link}`);
                      const tel = (os.telefone || '').replace(/\D/g, '');
                      if (tel) window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
                      else { navigator.clipboard.writeText(link); alert('📋 Link copiado! (sem telefone na O.S.)'); }
                    }} style={{ padding: '6px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold', width: '100%' }}>📋 COMPARTILHAR LAUDO</button>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {os.statusPagamento === 'pago' ? (
                        <button disabled style={{ flex: 1, padding: '6px', background: '#222', color: '#666', border: 'none', borderRadius: '5px', fontSize: '13px', cursor: 'not-allowed' }}>🔒 Bloqueado</button>
                      ) : (() => {
                        const tipo = os.tipoServico || '';
                        const origem = os.origem || '';
                        if (tipo === 'oleo') return (
                          <button onClick={() => abrirEdicao(os)} style={{ flex: 1, padding: '6px', background: '#332200', color: '#eab308', border: '1px solid #eab308', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🛢️ Editar Óleo</button>
                        );
                        if (tipo === 'alinhamento') return (
                          <button onClick={() => abrirEdicao(os)} style={{ flex: 1, padding: '6px', background: '#001a22', color: '#06b6d4', border: '1px solid #06b6d4', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>⚙️ Editar Alin.</button>
                        );
                        if (tipo === 'borracharia' || tipo === 'pneus') return (
                          <button onClick={() => abrirEdicao(os)} style={{ flex: 1, padding: '6px', background: '#001a00', color: '#00E676', border: '1px solid #00E676', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🛞 Editar Pneu</button>
                        );
                        if (origem === 'revisao_preventiva') return (
                          <button onClick={() => abrirEdicao(os)} style={{ flex: 1, padding: '6px', background: '#00001a', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🛡️ Editar Rev.</button>
                        );
                        return (
                          <button onClick={() => abrirEdicao(os)} style={{ flex: 1, padding: '6px', background: '#444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>✏️ Editar O.S.</button>
                        );
                      })()}
                      <button onClick={() => abrirRecibo(os)} style={{ flex: 1, padding: '6px', background: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>🧾 Recibo PDF</button>
                      <button onClick={() => deletarDoc("os", os.id, carregarOS)} style={{ flex: 1, padding: '6px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}>🗑️ Apagar</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== ABA ALINHAMENTO ===== */}
        {abaAtiva === 'alinhamento' && temPermissao('os') && (
          <div>
            <h2 style={{ color: ALINHAMENTO_COLOR, marginBottom: '20px' }}>⚙️ Alinhamento e Balanceamento</h2>
            {osEditando && osEditando.tipoServico === 'alinhamento' && (
              <div style={{ background: '#1a1500', border: `2px solid ${ALINHAMENTO_COLOR}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: ALINHAMENTO_COLOR, fontWeight: 'bold', fontSize: '14px' }}>✏️ EDITANDO O.S. - {osEditando.placa}</span>
                <button onClick={() => { setOsEditando(null); setPlacaAlinhamento(''); setNomeClienteAlinhamento(''); setTelefoneAlinhamento(''); setModeloAlinhamento(''); setValorPecasAlinhamento(''); setValorMaoObraAlinhamento(''); setObsAlinhamento(''); setFotosPneus([]); }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar Edição</button>
              </div>
            )}
            
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>SERVIÇOS PRINCIPAIS</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {['Alinhamento Dianteiro', 'Alinhamento D/T', 'Balanceamento (2 Rodas)', 'Balanceamento (4 Rodas)'].map(item => (
                <button key={item} onClick={() => setServicosAlinhamento(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item])} style={{ padding: '15px', border: `2px solid ${servicosAlinhamento.includes(item) ? ALINHAMENTO_COLOR : '#333'}`, background: servicosAlinhamento.includes(item) ? '#06b6d422' : '#111', color: servicosAlinhamento.includes(item) ? ALINHAMENTO_COLOR : '#888', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>{item}</button>
              ))}
            </div>

            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>➕ SERVIÇOS ADICIONAIS</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {['Cambagem Esq.', 'Cambagem Dir.', 'Cáster', 'Desempeno Roda', 'Troca de Válvula', 'Rodízio'].map(item => (
                <button key={item} onClick={() => setExtrasAlinhamento(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item])} style={{ padding: '10px 5px', border: `1px solid ${extrasAlinhamento.includes(item) ? ALINHAMENTO_COLOR : '#333'}`, background: extrasAlinhamento.includes(item) ? '#06b6d422' : '#111', color: extrasAlinhamento.includes(item) ? ALINHAMENTO_COLOR : '#888', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{item}</button>
              ))}
            </div>

            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🛞 ESTADO DOS PNEUS (Para gerar retorno automático)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }} className="scrollbar-hide">
              {[{id:'bons',l:'✅ Bons'},{id:'meia',l:'⚠️ Meia-vida'},{id:'aviso',l:'🚨 Avisar Troca'},{id:'careca',l:'☠️ Carecas'}].map(p => (
                <button key={p.id} onClick={() => setEstadoPneus(p.id)} style={{ minWidth: '100px', padding: '10px', border: `1px solid ${estadoPneus === p.id ? ALINHAMENTO_COLOR : '#333'}`, background: estadoPneus === p.id ? '#06b6d422' : '#111', color: estadoPneus === p.id ? ALINHAMENTO_COLOR : '#888', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>{p.l}</button>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
               <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📝 OBSERVAÇÕES EXTRAS</label>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea value={obsAlinhamento} onChange={e => setObsAlinhamento(e.target.value)} placeholder="Detalhes do serviço, peças com folga..." rows={2} style={{ flex: 1, padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'none' }} />
                  <button onClick={() => ouvirCampo('obsAlinhamento', setObsAlinhamento, 'adicionar')} style={{ background: campoOuvindo === 'obsAlinhamento' ? ALINHAMENTO_COLOR : '#333', color: campoOuvindo === 'obsAlinhamento' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }}>{campoOuvindo === 'obsAlinhamento' ? '🔴' : '🎤'}</button>
               </div>
            </div>

            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid #06b6d444`, marginBottom: '20px' }}>
              <label style={{ color: ALINHAMENTO_COLOR, fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTO DO LAUDO (A IA lê a tela 3D ou papel)</label>
              {fotoAlinhamento ? (
                <div><img src={fotoAlinhamento} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} /><button onClick={() => {setFotoAlinhamento(null); setLaudoAlinhamento('');}} style={{ width: '100%', padding: '10px', marginTop: '10px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '8px' }}>Remover Foto</button></div>
              ) : (
                <label style={{ display: 'block', padding: '25px', border: `2px dashed ${ALINHAMENTO_COLOR}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: '30px' }}>📷</div><div style={{ color: ALINHAMENTO_COLOR, fontWeight: 'bold', marginTop: '10px' }}>{lendoFotoAlinhamento ? '🤖 Lendo Laudo...' : 'FOTOGRAFAR TELA / PAPEL'}</div>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFotoAlinhamento} style={{ display: 'none' }} />
                </label>
              )}
              {laudoAlinhamento && <p style={{ marginTop: '15px', padding: '10px', background: '#000', color: ALINHAMENTO_COLOR, border: `1px solid ${ALINHAMENTO_COLOR}`, borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>{laudoAlinhamento}</p>}
            </div>

            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>📸 FOTOS DOS PNEUS / VEÍCULO</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '15px' }}>
                <input type="text" value={legendaPneu} onChange={(e) => setLegendaPneu(e.target.value)} placeholder="Legenda (Ex: Pneu Dir. Diant.)" style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                <label style={{ padding: '10px 15px', background: '#333', color: 'white', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                  📷 ADD FOTO <input type="file" accept="image/*" onChange={adicionarFotoPneu} style={{ display: 'none' }} />
                </label>
              </div>
              {fotosPneus.length > 0 && (
                <div className="scrollbar-hide" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {fotosPneus.map((f, i) => (
                    <div key={i} style={{ position: 'relative', minWidth: '100px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #333' }}>
                      <img src={f.foto} style={{ width: '100px', height: '100px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '9px', padding: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.legenda || 'Anexada'}</div>
                      <button onClick={() => setFotosPneus(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>DADOS DO VEÍCULO / CLIENTE</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="text" value={placaAlinhamento} onChange={e => setPlacaAlinhamento(normalizarPlaca(e.target.value))} placeholder="PLACA *" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }} />
                  <button onClick={() => ouvirCampo('placaAlinhamento', setPlacaAlinhamento)} style={{ background: campoOuvindo === 'placaAlinhamento' ? ALINHAMENTO_COLOR : '#333', color: campoOuvindo === 'placaAlinhamento' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'placaAlinhamento' ? '🔴' : '🎤'}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="text" value={nomeClienteAlinhamento} onChange={e => setNomeClienteAlinhamento(e.target.value)} placeholder="Nome do Cliente" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                  <button onClick={() => ouvirCampo('nomeClienteAlinhamento', setNomeClienteAlinhamento)} style={{ background: campoOuvindo === 'nomeClienteAlinhamento' ? ALINHAMENTO_COLOR : '#333', color: campoOuvindo === 'nomeClienteAlinhamento' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'nomeClienteAlinhamento' ? '🔴' : '🎤'}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="tel" value={telefoneAlinhamento} onChange={e => setTelefoneAlinhamento(e.target.value.replace(/\D/g, ''))} placeholder="WhatsApp" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                  <button onClick={() => ouvirCampo('telefoneAlinhamento', setTelefoneAlinhamento)} style={{ background: campoOuvindo === 'telefoneAlinhamento' ? ALINHAMENTO_COLOR : '#333', color: campoOuvindo === 'telefoneAlinhamento' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'telefoneAlinhamento' ? '🔴' : '🎤'}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={modeloAlinhamento} onChange={e => setModeloAlinhamento(e.target.value)} placeholder="Modelo" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                  <button onClick={() => ouvirCampo('modeloAlinhamento', setModeloAlinhamento)} style={{ background: campoOuvindo === 'modeloAlinhamento' ? ALINHAMENTO_COLOR : '#333', color: campoOuvindo === 'modeloAlinhamento' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'modeloAlinhamento' ? '🔴' : '🎤'}</button>
              </div>
            </div>

            {/* ===== VALOR DO SERVIÇO - ALINHAMENTO ===== */}
            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid ${ALINHAMENTO_COLOR}44`, marginBottom: '15px' }}>
              <label style={{ color: ALINHAMENTO_COLOR, fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>💰 VALOR DO SERVIÇO</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#888', fontSize: '11px' }}>VALOR PEÇAS (R$)</label>
                  <input type="number" value={valorPecasAlinhamento} onChange={e => setValorPecasAlinhamento(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#888', fontSize: '11px' }}>MÃO DE OBRA (R$)</label>
                  <input type="number" value={valorMaoObraAlinhamento} onChange={e => setValorMaoObraAlinhamento(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '16px' }} />
                </div>
              </div>
              <div style={{ background: '#1a1a00', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>VALOR TOTAL: </span>
                <strong style={{ color: GREEN_MONEY, fontSize: '22px' }}>{formatarMoeda((Number(valorPecasAlinhamento) || 0) + (Number(valorMaoObraAlinhamento) || 0))}</strong>
              </div>
            </div>

            <button onClick={handleSalvarAlinhamento} disabled={salvandoAlinhamento} style={{ width: '100%', padding: '20px', background: salvandoAlinhamento ? '#333' : salvoAlinhamento ? '#00E676' : ALINHAMENTO_COLOR, color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              {salvandoAlinhamento ? '⏳ SALVANDO...' : salvoAlinhamento ? '✅ SALVO NA O.S.!' : osEditando?.tipoServico === 'alinhamento' ? '💾 SALVAR EDIÇÃO' : '💾 SALVAR SERVIÇO NA O.S.'}
            </button>
          </div>
        )}

        {/* ===== ABA ÓLEO (COMPLETA E INTEGRADA) ===== */}
        {abaAtiva === 'oleo' && temPermissao('os') && (
          <div>
            <h2 style={{ color: KM_COLOR, marginBottom: '20px' }}>🛢️ Nova Troca de Óleo</h2>
            {osEditando && osEditando.tipoServico === 'oleo' && (
              <div style={{ background: '#1a1500', border: `2px solid ${KM_COLOR}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: KM_COLOR, fontWeight: 'bold', fontSize: '14px' }}>✏️ EDITANDO O.S. - {osEditando.placa}</span>
                <button onClick={() => { setOsEditando(null); setPlacaOleo(''); setNomeClienteOleo(''); setTelefoneOleo(''); setModeloOleo(''); setValorPecasOleo(''); setValorMaoObraOleo(''); setKmAtualOleo(''); setKmProximaOleo(''); setFotoPainelOleo(null); setExtrasOleo([]); setLitrosOleo(''); }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar Edição</button>
              </div>
            )}
            
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>TIPO DE VEÍCULO</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[{id:'carro',l:'🚗 CARRO',d:180},{id:'moto',l:'🏍️ MOTO',d:90},{id:'pesado',l:'🚛 PESADO',d:180}].map(c => (
                <button key={c.id} onClick={() => setCategoriaOleo(c.id)} style={{ padding: '15px', border: `2px solid ${categoriaOleo === c.id ? KM_COLOR : '#333'}`, background: categoriaOleo === c.id ? `${KM_COLOR}22` : '#111', color: categoriaOleo === c.id ? KM_COLOR : '#888', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {c.l}<div style={{ fontSize: '10px', marginTop: '4px' }}>{c.d} dias</div>
                </button>
              ))}
            </div>

            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>KIT</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setKitOleo('normal')} style={{ padding: '15px', border: `2px solid ${kitOleo === 'normal' ? '#00E676' : '#333'}`, background: kitOleo === 'normal' ? '#00E67622' : '#111', color: kitOleo === 'normal' ? '#00E676' : '#888', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🟢 KIT NORMAL<br/><span style={{fontSize:'10px'}}>10.000 km</span></button>
              <button onClick={() => setKitOleo('severo')} style={{ padding: '15px', border: `2px solid ${kitOleo === 'severo' ? KM_COLOR : '#333'}`, background: kitOleo === 'severo' ? `${KM_COLOR}22` : '#111', color: kitOleo === 'severo' ? KM_COLOR : '#888', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>🚥 KIT SEVERO<br/><span style={{fontSize:'10px'}}>7.500 km</span></button>
            </div>

            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>➕ SERVIÇOS ADICIONAIS</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {['Óleo Câmbio', 'Filtro Ar', 'Filtro Cabine', 'Filtro Comb.', 'Higienização', 'Revisão Geral'].map(item => (
                <button key={item} onClick={() => setExtrasOleo(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item])} style={{ padding: '10px 5px', border: `1px solid ${extrasOleo.includes(item) ? KM_COLOR : '#333'}`, background: extrasOleo.includes(item) ? `${KM_COLOR}22` : '#111', color: extrasOleo.includes(item) ? KM_COLOR : '#888', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>{item}</button>
              ))}
            </div>

            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid ${KM_COLOR}44`, marginBottom: '20px' }}>
              <label style={{ color: KM_COLOR, fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTOS DO SERVIÇO - CARROSSEL (até 4 fotos: painel, câmbio, filtro, extra)</label>
              {/* Carrossel de 4 fotos */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                {fotosCarrosselOleo.map((foto, idx) => (
                  <div key={idx} style={{ flexShrink: 0, width: '130px' }}>
                    {foto ? (
                      <div style={{ position: 'relative' }}>
                        <img src={foto} style={{ width: '130px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${KM_COLOR}` }} />
                        <button onClick={() => {
                          const novas = [...fotosCarrosselOleo]; novas[idx] = null; setFotosCarrosselOleo(novas);
                          if (idx === 0) { setFotoPainelOleo(null); setKmAtualOleo(''); setKmProximaOleo(''); }
                        }} style={{ position: 'absolute', top: '4px', right: '4px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>×</button>
                        <div style={{ fontSize: '9px', color: KM_COLOR, textAlign: 'center', marginTop: '4px', fontWeight: 'bold' }}>{legendasCarrosselOleo[idx]}</div>
                      </div>
                    ) : (
                      <label style={{ display: 'block', cursor: 'pointer' }}>
                        <div style={{ width: '130px', height: '100px', border: `2px dashed ${KM_COLOR}88`, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
                          <div style={{ fontSize: '22px' }}>📷</div>
                          <div style={{ fontSize: '9px', color: KM_COLOR, textAlign: 'center', marginTop: '4px', padding: '0 4px' }}>{lendoKmOleo && idx === 0 ? '🤖 Lendo...' : legendasCarrosselOleo[idx]}</div>
                        </div>
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={async (e) => {
                          if (!e.target.files[0]) return;
                          const r = new FileReader();
                          r.onloadend = async () => {
                            const compressed = await comprimirFoto(r.result);
                            const novas = [...fotosCarrosselOleo]; novas[idx] = compressed; setFotosCarrosselOleo(novas);
                            if (idx === 0) { setFotoPainelOleo(compressed); handleFotoPainelOleo({ target: { files: [e.target.files[0]] } }); }
                          };
                          r.readAsDataURL(e.target.files[0]);
                        }} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '10px', color: '#888' }}>KM ATUAL</label><input type="number" value={kmAtualOleo} onChange={e => { setKmAtualOleo(e.target.value); setKmProximaOleo(String(Number(e.target.value) + (categoriaOleo==='moto'?5000:kitOleo==='severo'?7500:10000))); }} style={{ width: '100%', padding: '10px', background: '#000', border: `1px solid ${KM_COLOR}`, color: KM_COLOR, borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '10px', color: '#888' }}>PRÓXIMA TROCA</label><input type="number" value={kmProximaOleo} onChange={e => setKmProximaOleo(e.target.value)} style={{ width: '100%', padding: '10px', background: '#000', border: `1px solid ${MAIN_COLOR}`, color: MAIN_COLOR, borderRadius: '5px', textAlign: 'center', fontWeight: 'bold' }} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '10px', color: '#888' }}>TIPO DE ÓLEO</label>
                <select value={tipoOleoOleo} onChange={e => setTipoOleoOleo(e.target.value)} style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #333', color: GREEN_MONEY, borderRadius: '8px', fontWeight: 'bold' }}>
                  {['5W30 Sintético', '5W40 Sintético', '10W40 Semi-sintético', '15W40 Mineral', '0W20 Sintético', '20W50 Mineral'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#888' }}>LITROS</label>
                <input type="number" step="0.5" value={litrosOleo} onChange={e => setLitrosOleo(e.target.value)} placeholder="4.5" style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', textAlign: 'center' }} />
              </div>
            </div>

            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>DADOS DO VEÍCULO / CLIENTE</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="text" value={placaOleo} onChange={e => setPlacaOleo(normalizarPlaca(e.target.value))} placeholder="PLACA *" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px' }} />
                  <button onClick={() => ouvirCampo('placaOleo', setPlacaOleo)} style={{ background: campoOuvindo === 'placaOleo' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'placaOleo' ? '🔴' : '🎤'}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="text" value={nomeClienteOleo} onChange={e => setNomeClienteOleo(e.target.value)} placeholder="Nome do Cliente" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                  <button onClick={() => ouvirCampo('nomeClienteOleo', setNomeClienteOleo)} style={{ background: campoOuvindo === 'nomeClienteOleo' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'nomeClienteOleo' ? '🔴' : '🎤'}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input type="tel" value={telefoneOleo} onChange={e => setTelefoneOleo(e.target.value.replace(/\D/g, ''))} placeholder="WhatsApp" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                  <button onClick={() => ouvirCampo('telefoneOleo', setTelefoneOleo)} style={{ background: campoOuvindo === 'telefoneOleo' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'telefoneOleo' ? '🔴' : '🎤'}</button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={modeloOleo} onChange={e => setModeloOleo(e.target.value)} placeholder="Modelo" style={{ flex: 1, padding: '15px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                  <button onClick={() => ouvirCampo('modeloOleo', setModeloOleo)} style={{ background: campoOuvindo === 'modeloOleo' ? MAIN_COLOR : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 15px' }}>{campoOuvindo === 'modeloOleo' ? '🔴' : '🎤'}</button>
              </div>
            </div>

            {/* ===== VALOR DO SERVIÇO - ÓLEO ===== */}
            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid ${KM_COLOR}44`, marginBottom: '15px' }}>
              <label style={{ color: KM_COLOR, fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>💰 VALOR DO SERVIÇO</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#888', fontSize: '11px' }}>VALOR PEÇAS (R$)</label>
                  <input type="number" value={valorPecasOleo} onChange={e => setValorPecasOleo(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '16px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#888', fontSize: '11px' }}>MÃO DE OBRA (R$)</label>
                  <input type="number" value={valorMaoObraOleo} onChange={e => setValorMaoObraOleo(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '16px' }} />
                </div>
              </div>
              <div style={{ background: '#1a1a00', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>VALOR TOTAL: </span>
                <strong style={{ color: GREEN_MONEY, fontSize: '22px' }}>{formatarMoeda((Number(valorPecasOleo) || 0) + (Number(valorMaoObraOleo) || 0))}</strong>
              </div>
            </div>

            {/* OBSERVAÇÕES COM MICROFONE */}
            <div style={{ marginTop: '16px', marginBottom: '12px' }}>
              <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>📝 OBSERVAÇÕES / INFORMAÇÕES ADICIONAIS</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={obsOleo}
                  onChange={e => setObsOleo(e.target.value)}
                  placeholder="Ex: óleo usado, recomendações ao cliente, próxima revisão..."
                  rows={3}
                  style={{ flex: 1, padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '13px', resize: 'none' }}
                />
                <button
                  onClick={() => {
                    if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
                    if (campoOuvindoOleo) { recOleoRef.current?.stop(); setCampoOuvindoOleo(false); return; }
                    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                    rec.lang = 'pt-BR'; rec.interimResults = false; recOleoRef.current = rec;
                    rec.onstart = () => setCampoOuvindoOleo(true);
                    rec.onresult = e => { setObsOleo(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript); setCampoOuvindoOleo(false); };
                    rec.onerror = () => setCampoOuvindoOleo(false);
                    rec.onend = () => setCampoOuvindoOleo(false);
                    rec.start();
                  }}
                  style={{ background: campoOuvindoOleo ? '#ef4444' : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }}
                >
                  {campoOuvindoOleo ? '🔴' : '🎤'}
                </button>
              </div>
            </div>

            <button onClick={handleSalvarOleo} disabled={salvandoOleo} style={{ width: '100%', padding: '20px', background: salvandoOleo ? '#333' : salvoOleo ? '#00E676' : KM_COLOR, color: 'black', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              {salvandoOleo ? '⏳ SALVANDO...' : salvoOleo ? '✅ SALVO NA O.S.!' : osEditando?.tipoServico === 'oleo' ? '💾 SALVAR EDIÇÃO' : '💾 SALVAR SERVIÇO NA O.S.'}
            </button>
          </div>
        )}

        {/* ===== MÓDULO REVISÃO PREVENTIVA ===== */}
        {abaAtiva === 'revisao' && temPermissao('os') && (
          <div>
            {/* Banner de lembrete automático */}
            <div style={{ background: '#1a1500', border: `1px solid ${KM_COLOR}44`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: KM_COLOR }}>
              🔔 Lembrete automático será enviado ao cliente antes do agendamento
            </div>
            <ModuloRevisao dadosOficina={dadosOficina} papelLogado={papelLogado} oficinaId={oficinaId} osParaEditar={osEditando?.origem === 'revisao_preventiva' ? osEditando : null} onCancelarEdicao={() => setOsEditando(null)} onSalvo={(id, dados) => { setListaCarros(prev => prev.map(o => o.id === id ? { ...o, ...dados } : o)); setOsEditando(null); carregarOS(); }} />
            {/* CALENDÁRIO DE AGENDAMENTO */}
            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid #3b82f644`, marginBottom: '16px', marginTop: '16px' }}>
              <label style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📅 AGENDAR PRÓXIMA REVISÃO</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <label style={{ color: '#888', fontSize: '10px' }}>DATA DA PRÓXIMA REVISÃO</label>
                  <input type="date" value={dataAgendamentoRevisao} onChange={e => setDataAgendamentoRevisao(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: `1px solid ${dataAgendamentoRevisao ? '#3b82f6' : '#444'}`, color: 'white', borderRadius: '8px', colorScheme: 'dark' }} />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label style={{ color: '#888', fontSize: '10px' }}>LEMBRETE AUTOMÁTICO</label>
                  <select value={lembreteRevisao} onChange={e => setLembreteRevisao(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px' }}>
                    <option value="7">7 dias antes</option>
                    <option value="3">3 dias antes</option>
                    <option value="1">1 dia antes</option>
                    <option value="0">No dia</option>
                  </select>
                </div>
              </div>
              {dataAgendamentoRevisao && (
                <p style={{ color: '#3b82f6', fontSize: '11px', margin: '8px 0 0', textAlign: 'center' }}>
                  ✅ Revisão agendada para {new Date(dataAgendamentoRevisao + 'T12:00').toLocaleDateString('pt-BR')} - lembrete {lembreteRevisao === '0' ? 'no dia' : `${lembreteRevisao} dia(s) antes`}
                </p>
              )}
            </div>
            {/* FOTOS DE DEFEITOS */}
            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTOS DOS DEFEITOS ENCONTRADOS</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {fotosDefeitoRevisao.map((foto, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={foto} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #444' }} />
                    <button onClick={() => setFotosDefeitoRevisao(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>×</button>
                  </div>
                ))}
                <label style={{ width: '90px', height: '90px', border: `2px dashed #3b82f6`, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#0a0a0a' }}>
                  <div style={{ fontSize: '22px' }}>📷</div>
                  <div style={{ fontSize: '9px', color: '#3b82f6', marginTop: '4px' }}>Defeito</div>
                  <input type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }}
                    onChange={async e => {
                      const files = Array.from(e.target.files);
                      const b64s = await Promise.all(files.map(f => new Promise((res) => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(f); })));
                      setFotosDefeitoRevisao(prev => [...prev, ...b64s].slice(0, 6));
                    }} />
                </label>
              </div>
              <p style={{ color: '#555', fontSize: '10px', marginTop: '6px' }}>Máximo 6 fotos de defeitos para incluir na O.S.</p>
            </div>
          </div>
        )}

        {/* ===== MÓDULO PNEUS E BORRACHARIA ===== */}
        {abaAtiva === 'pneus' && temPermissao('os') && (
          <ModuloPneus dadosOficina={dadosOficina} papelLogado={papelLogado} oficinaId={oficinaId} osParaEditar={(osEditando?.tipoServico === 'borracharia' || osEditando?.tipoServico === 'pneus') ? osEditando : null} onCancelarEdicao={() => setOsEditando(null)} onSalvo={(id, dados) => { setListaCarros(prev => prev.map(o => o.id === id ? { ...o, ...dados } : o)); setOsEditando(null); carregarOS(); }} />
        )}

        {/* ===== ABA INJEÇÃO ELETRÔNICA ===== */}
        {abaAtiva === 'injecao' && temPermissao('os') && (
          <div>
            <h2 style={{ color: '#8b5cf6', marginBottom: '6px' }}>⚡ Diagnóstico de Injeção Eletrônica</h2>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px' }}>Checklist profissional para scanner, sensores e ECU.</p>

            {/* Sub-abas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { key: 'injecao', label: '⚡ Injeção Eletrônica', cor: '#8b5cf6' },
                { key: 'mecanica', label: '🔧 Mecânica', cor: GREEN_MONEY },
                { key: 'motos', label: '🏍 Motos', cor: '#f97316' },
              ].map(({ key, label, cor }) => (
                <button key={key} onClick={() => setSubAbaInjecao(key)}
                  style={{ padding: '10px 18px', background: subAbaInjecao === key ? cor + '22' : '#1a1a1a', color: subAbaInjecao === key ? cor : '#888', border: `2px solid ${subAbaInjecao === key ? cor : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Dados do veículo */}
            <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>DADOS DO VEÍCULO / CLIENTE</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <input value={placaInjecao} onChange={e => setPlacaInjecao(normalizarPlaca(e.target.value))} placeholder="PLACA *" style={{ flex: 1, minWidth: '100px', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontWeight: 'bold' }} />
                <input value={modeloInjecao} onChange={e => setModeloInjecao(e.target.value)} placeholder="Modelo" style={{ flex: 2, minWidth: '120px', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                <input value={kmInjecao} onChange={e => setKmInjecao(e.target.value)} placeholder="KM Atual" type="number" style={{ flex: 1, minWidth: '80px', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: KM_COLOR, borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input value={clienteInjecao} onChange={e => setClienteInjecao(e.target.value)} placeholder="Nome do Cliente" style={{ flex: 2, minWidth: '140px', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
                <input value={telefoneInjecao} onChange={e => setTelefoneInjecao(e.target.value.replace(/\D/g,''))} placeholder="WhatsApp" type="tel" style={{ flex: 1, minWidth: '120px', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px' }} />
              </div>
            </div>

            {subAbaInjecao === 'injecao' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  {/* Scanner DTC */}
                  <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '12px' }}>
                    <label style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🔌 SCANNER & DIAGNÓSTICO (DTC)</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input value={dtcCodes} onChange={e => setDtcCodes(e.target.value.toUpperCase())} placeholder="Ex: P0300, P0171"
                        style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px', fontSize: '13px' }} />
                      <button onClick={() => {
                        const db2 = { P0300:'Falha de ignição múltipla. Verificar velas, cabos e injetores.', P0171:'Mistura pobre banco 1. Verificar sensor lambda, válvula IAC e vazamentos no coletor.', P0420:'Catalisador abaixo do limite. Verificar catalisador e sensores lambda.', P0113:'Sinal alto sensor IAT. Verificar sensor de temperatura do ar.', P0101:'Sensor MAF fora da faixa. Limpar ou substituir.', P0335:'Sensor CKP com falha. Verificar fiação e sensor.' };
                        const codes = dtcCodes.split(',').map(c => c.trim());
                        const result = codes.map(c => db2[c] ? `${c}: ${db2[c]}` : `${c}: Consulte o Copiloto para análise avançada.`).join('\n');
                        setDtcResultado(result);
                      }} style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', fontSize: '14px' }}>🔍</button>
                    </div>
                    {dtcResultado && (
                      <div style={{ background: '#0a0018', border: '1px solid #8b5cf644', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#c4b5fd', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                        {dtcResultado}
                      </div>
                    )}
                    {[
                      { key: 'ecu_comunicacao', label: 'Comunicação com ECU' },
                      { key: 'sensores_tempo_real', label: 'Leitura de Sensores em Tempo Real' },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>{label}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {['OK','FALHA'].map(s => <button key={s} onClick={() => setCheckInjecao(p => ({...p,[key]:s}))} style={{ padding: '3px 10px', borderRadius: '4px', border: `1px solid ${checkInjecao[key]===s?(s==='OK'?GREEN_MONEY:MAIN_COLOR):'#333'}`, background: checkInjecao[key]===s?(s==='OK'?`${GREEN_MONEY}22`:`${MAIN_COLOR}22`):'#1a1a1a', color: checkInjecao[key]===s?(s==='OK'?GREEN_MONEY:MAIN_COLOR):'#666', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>{s}</button>)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alimentação & Sensores */}
                  <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '12px' }}>
                    <label style={{ color: '#f97316', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🔥 ALIMENTAÇÃO & SENSORES</label>
                    {[
                      { key: 'bomba_combustivel', label: 'Pressão da Bomba de Combustível', opts: ['OK','BAIXA','FALHA'] },
                      { key: 'injetores', label: 'Injetores (Resistência/Vazão)', opts: ['OK','ATENÇÃO','RUIM'] },
                      { key: 'sensor_map', label: 'Sensor MAP / MAF', opts: ['OK','FALHA'] },
                      { key: 'sensor_tps', label: 'Sensor TPS (Borboleta)', opts: ['OK','FALHA'] },
                      { key: 'sensor_lambda', label: 'Sensor de Oxigênio (Lambda)', opts: ['OK','DESGASTADO','FALHA'] },
                      { key: 'sensor_cts', label: 'Sensor de Temperatura (CTS)', opts: ['OK','FALHA'] },
                      { key: 'sensor_ckp', label: 'Sensor de Rotação (CKP)', opts: ['OK','FALHA'] },
                    ].map(({ key, label, opts }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#bbb', flex: 1, minWidth: '100px' }}>{label}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {opts.map(s => <button key={s} onClick={() => setCheckInjecao(p => ({...p,[key]:s}))} style={{ padding: '3px 8px', borderRadius: '4px', border: `1px solid ${checkInjecao[key]===s?'#8b5cf6':'#333'}`, background: checkInjecao[key]===s?'#8b5cf622':'#1a1a1a', color: checkInjecao[key]===s?'#c4b5fd':'#666', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>{s}</button>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {/* ECU + IA */}
                  <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '12px' }}>
                    <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💾 CENTRAL ELETRÔNICA (ECU)</label>
                    <div style={{ background: '#0a0018', border: '1px solid #8b5cf644', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
                      <p style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold', margin: '0 0 6px' }}>🤖 IA Assistente Técnico</p>
                      <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 10px' }}>Não sabe o significado de um código? Pergunte ao Copiloto.</p>
                      <button onClick={() => setAbaAtiva('copiloto')} style={{ width: '100%', padding: '10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Consultar Código de Falha</button>
                    </div>
                    {[
                      { key: 'tensao_bateria', label: 'Tensão da Bateria', opts: ['OK','BAIXA'] },
                      { key: 'aterramento_ecu', label: 'Aterramento da ECU', opts: ['OK','FALHA'] },
                      { key: 'firmware', label: 'Atualização de Firmware', opts: ['OK','PENDENTE'] },
                    ].map(({ key, label, opts }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>{label}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {opts.map(s => <button key={s} onClick={() => setCheckInjecao(p => ({...p,[key]:s}))} style={{ padding: '3px 10px', borderRadius: '4px', border: `1px solid ${checkInjecao[key]===s?'#8b5cf6':'#333'}`, background: checkInjecao[key]===s?'#8b5cf622':'#1a1a1a', color: checkInjecao[key]===s?'#c4b5fd':'#666', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>{s}</button>)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fotos do scanner */}
                  <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '12px' }}>
                    <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📸 FOTOS DO SCANNER / EVIDÊNCIAS</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {fotosInjecao.map((foto, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={foto} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #444' }} />
                          <button onClick={() => setFotosInjecao(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: '-6px', right: '-6px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>×</button>
                        </div>
                      ))}
                      <label style={{ width: '80px', height: '80px', border: `2px dashed #8b5cf6`, borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#0a0a0a' }}>
                        <div style={{ fontSize: '20px' }}>📷</div>
                        <div style={{ fontSize: '9px', color: '#8b5cf6', marginTop: '3px' }}>+ Foto</div>
                        <input type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }}
                          onChange={async e => {
                            const files = Array.from(e.target.files);
                            const b64s = await Promise.all(files.map(f => new Promise(res => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(f); })));
                            setFotosInjecao(prev => [...prev, ...b64s].slice(0, 6));
                          }} />
                      </label>
                    </div>
                  </div>

                  {/* Valor e botão gerar OS */}
                  <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                    <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>💰 VALOR DO SERVIÇO</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '10px' }}>PEÇAS (R$)</label><input type="number" value={valorPecasInjecao} onChange={e => setValorPecasInjecao(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px' }} /></div>
                      <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '10px' }}>MÃO DE OBRA (R$)</label><input type="number" value={valorMaoObraInjecao} onChange={e => setValorMaoObraInjecao(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '8px' }} /></div>
                    </div>
                    <div style={{ background: '#0a0018', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                      <span style={{ color: '#888', fontSize: '11px' }}>TOTAL: </span>
                      <strong style={{ color: '#8b5cf6', fontSize: '20px' }}>{formatarMoeda((Number(valorPecasInjecao)||0)+(Number(valorMaoObraInjecao)||0))}</strong>
                    </div>
                    <button onClick={async () => {
                      if (!placaInjecao) { alert('⚠️ Informe a placa!'); return; }
                      setSalvandoInjecao(true);
                      try {
                        const checklistTexto = Object.entries(checkInjecao).map(([k,v]) => `${k.replace(/_/g,' ')}: ${v}`).join(' | ');
                        const total = (Number(valorPecasInjecao)||0)+(Number(valorMaoObraInjecao)||0);
                        await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
                          nomeCliente: clienteInjecao, placa: placaInjecao, modelo: modeloInjecao,
                          kmAtual: kmInjecao, telefone: telefoneInjecao,
                          checklist: `Injeção Eletrônica - DTC: ${dtcCodes || 'N/A'} | ${checklistTexto}`,
                          tipoServico: 'injecao', fotos: fotosInjecao,
                          valorPecas: valorPecasInjecao, valorMaoObra: valorMaoObraInjecao, total,
                          status: 'pendente', data_registro: new Date(), data: new Date().toLocaleString('pt-BR'),
                        });
                        setSalvoInjecao(true); setTimeout(() => setSalvoInjecao(false), 3000);
                        setPlacaInjecao(''); setModeloInjecao(''); setKmInjecao(''); setClienteInjecao(''); setTelefoneInjecao('');
                        setDtcCodes(''); setDtcResultado(''); setCheckInjecao({}); setFotosInjecao([]);
                        setValorPecasInjecao(''); setValorMaoObraInjecao('');
                        carregarOS();
                      } catch(e) { alert('Erro: '+e.message); }
                      setSalvandoInjecao(false);
                    }} disabled={salvandoInjecao}
                      style={{ width: '100%', padding: '16px', background: salvandoInjecao ? '#333' : salvoInjecao ? GREEN_MONEY : '#8b5cf6', color: salvoInjecao ? 'black' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                      {salvandoInjecao ? '⏳ SALVANDO...' : salvoInjecao ? '✅ SALVO NA O.S.!' : '💾 GERAR O.S. DE INJEÇÃO'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {subAbaInjecao === 'mecanica' && (
              <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                <label style={{ color: GREEN_MONEY, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🔧 CHECKLIST MECÂNICO GERAL</label>
                {[
                  { key: 'motor_ruidos', label: 'Motor - Ruídos e Vazamentos' },
                  { key: 'cambio', label: 'Transmissão / Câmbio' },
                  { key: 'susp_dianteira', label: 'Suspensão Dianteira' },
                  { key: 'susp_traseira', label: 'Suspensão Traseira' },
                  { key: 'freios_mec', label: 'Sistema de Freios' },
                  { key: 'escapamento', label: 'Escapamento' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: '13px', color: '#bbb' }}>{label}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {['BOM','ATENÇÃO','RUIM'].map(s => <button key={s} onClick={() => setCheckInjecao(p=>({...p,[key]:s}))} style={{ padding: '4px 10px', borderRadius: '4px', border: `1px solid ${checkInjecao[key]===s?(s==='BOM'?GREEN_MONEY:s==='ATENÇÃO'?KM_COLOR:MAIN_COLOR):'#333'}`, background: checkInjecao[key]===s?'#1a1a1a':'#111', color: checkInjecao[key]===s?(s==='BOM'?GREEN_MONEY:s==='ATENÇÃO'?KM_COLOR:MAIN_COLOR):'#666', cursor:'pointer', fontSize:'11px', fontWeight:'bold' }}>{s}</button>)}
                    </div>
                  </div>
                ))}
                <button onClick={() => alert('✅ Checklist mecânico salvo na O.S.')} style={{ marginTop: '14px', width: '100%', padding: '14px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✅ GERAR O.S. MECÂNICA</button>
              </div>
            )}

            {subAbaInjecao === 'motos' && (
              <div style={{ background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                <label style={{ color: '#f97316', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>🏍 DIAGNÓSTICO MOTO</label>
                {[
                  { key: 'cdi', label: 'CDI / Módulo de Ignição', opts: ['OK','FALHA'] },
                  { key: 'carburador', label: 'Carburador / Injetor', opts: ['OK','ENTUPIDO','FALHA'] },
                  { key: 'vela', label: 'Vela de Ignição', opts: ['OK','DESGASTADA','RUIM'] },
                  { key: 'cabo_acelerador', label: 'Cabo do Acelerador', opts: ['OK','RUIM'] },
                  { key: 'corrente', label: 'Corrente / Relação', opts: ['OK','FOLGA','TROCAR'] },
                ].map(({ key, label, opts }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#bbb', flex: 1, minWidth: '120px' }}>{label}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {opts.map(s => <button key={s} onClick={() => setCheckInjecao(p=>({...p,[key]:s}))} style={{ padding: '4px 9px', borderRadius: '4px', border: `1px solid ${checkInjecao[key]===s?'#f97316':'#333'}`, background: checkInjecao[key]===s?'#f9731622':'#1a1a1a', color: checkInjecao[key]===s?'#f97316':'#666', cursor:'pointer', fontSize:'10px', fontWeight:'bold' }}>{s}</button>)}
                    </div>
                  </div>
                ))}
                <button onClick={() => alert('✅ Diagnóstico de moto salvo na O.S.')} style={{ marginTop: '14px', width: '100%', padding: '14px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✅ GERAR O.S. MOTO</button>
              </div>
            )}
          </div>
        )}
      

        {/* ===== MÓDULO COPILOTO IA ===== */}
        {abaAtiva === 'copiloto' && temPermissao('os') && (
          <CopilotoIA dadosOficina={dadosOficina} papelLogado={papelLogado} />
        )}

        {/* ===== MÓDULO ASSINATURA (MEU PLANO) ===== */}
        {abaAtiva === 'assinatura' && (
          <ModuloMeuPlano dadosOficina={dadosOficina} planosSistema={planosSistema} />
        )}

        {abaAtiva === 'retorno' && temPermissao('os') && (
          <GestaoRetorno
            listaCarros={listaCarros}
            setListaCarros={setListaCarros}
            nomeOficina={config.nome || 'Oficina IA'}
            oficinaId={oficinaId}
            abrirWhatsAppFn={abrirWhatsApp}
          />
        )}

        {/* ===== ESTOQUE ===== */}
        {abaAtiva === 'estoque' && temPermissao('estoque') && <Estoque />}

        {/* ===== FINANCEIRO ===== */}
        {abaAtiva === 'financeiro' && temPermissao('financeiro') && <Financeiro />}

        {/* ===== EQUIPE ===== */}
        {abaAtiva === 'equipe' && (papelLogado === 'dono' || papelLogado === 'master') && !membroAuditando && (
          <div>
            <h2 style={{ color: MAIN_COLOR, marginBottom: '10px' }}>👥 Controle de Equipe & Acessos</h2>
            <div style={{ background: '#111', padding: '20px', marginBottom: '30px', borderRadius: '10px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#aaa' }}>CADASTRAR NOVO FUNCIONÁRIO</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input type="text" value={novoUsuarioNome} onChange={e => setNovoUsuarioNome(e.target.value)} placeholder="Nome do Funcionário" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                <select value={novoUsuarioCargo} onChange={(e) => setNovoUsuarioCargo(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#00E676', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>
                  <option value="Mecânico">🔧 Mecânico</option>
                  <option value="Secretária">👩‍💻 Secretária / ADM</option>
                  <option value="Estoque/Peças">📦 Responsável por Estoque / Peças</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <input type="email" value={novoUsuarioEmail} onChange={e => setNovoUsuarioEmail(e.target.value)} placeholder="E-mail de Login do Funcionário" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                <input type="password" value={novoUsuarioSenha} onChange={e => setNovoUsuarioSenha(e.target.value)} placeholder="Crie uma Senha (mínimo 6 letras/números)" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
              </div>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '5px', fontWeight: 'bold' }}>QUAIS ABAS ESTE FUNCIONÁRIO PODE VER E EDITAR?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '15px' }}>
                {[{ key: 'os', label: '🔧 O.S.' }, { key: 'estoque', label: '📦 Estoque' }, { key: 'financeiro', label: '💰 Financeiro' }, { key: 'equipe', label: '👥 Equipe' }, { key: 'oficina', label: '🏢 Patrimônio' }, { key: 'config', label: '⚙️ Configurações' }].map(item => (
                  <button key={item.key} onClick={() => setPermissoesNovoUsuario(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    style={{ padding: '10px', background: permissoesNovoUsuario[item.key] ? GREEN_MONEY : '#222', color: permissoesNovoUsuario[item.key] ? 'black' : '#666', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                    {item.label} {permissoesNovoUsuario[item.key] ? '✅' : ''}
                  </button>
                ))}
              </div>
              <label style={{ display: 'block', padding: '12px', background: '#222', textAlign: 'center', cursor: 'pointer', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
                📷 ADICIONAR FOTO DE PERFIL (Opcional)
                <input type="file" id="fotoEquipeInput" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onload = () => setNovoUsuarioFoto(r.result); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
              </label>
              {novoUsuarioFoto && <img src={novoUsuarioFoto} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 15px', display: 'block' }} />}
              <button onClick={handleCriarFuncionario} disabled={salvandoUsuario} style={{ width: '100%', padding: '15px', background: salvandoUsuario ? '#333' : MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                {salvandoUsuario ? 'SALVANDO...' : '➕ SALVAR FUNCIONÁRIO E GERAR ACESSO'}
              </button>
            </div>
            <h3 style={{ color: MAIN_COLOR, marginBottom: '15px' }}>Funcionários Cadastrados</h3>
            {listaUsuarios.length === 0 ? (
              <p style={{ color: '#555', textAlign: 'center', padding: '20px' }}>Nenhum funcionário cadastrado ainda.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {listaUsuarios.map(usuario => (
                  <div key={usuario.id} style={{ background: '#111', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333', position: 'relative' }}>
                    <button onClick={() => deletarFuncionario(usuario.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: MAIN_COLOR, border: 'none', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    {usuario.foto ? <img src={usuario.foto} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 10px' }} /> : <div style={{ fontSize: '40px', marginBottom: '10px' }}>{usuario.cargo === 'Secretária' ? '👩‍💻' : usuario.cargo === 'Estoque/Peças' ? '📦' : '👨‍🔧'}</div>}
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{usuario.nome}</h4>
                    <p style={{ margin: '0 0 5px 0', color: GREEN_MONEY, fontSize: '11px', fontWeight: 'bold' }}>{usuario.cargo || 'Funcionário'}</p>
                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '11px' }}>Login: {usuario.email}</p>
                    <button onClick={() => enviarAppFuncionario(usuario)} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>📲 ENVIAR APP E SENHA (ZAP)</button>
                    <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: '1px solid #222', marginBottom: '10px' }}>
                      <p style={{ fontSize: '10px', color: '#888', margin: '0 0 5px 0' }}>DESPACHAR TAREFA (O.S.):</p>
                      <select onChange={(e) => enviarTrabalhoParaFuncionario(usuario, e.target.value, e)} style={{ width: '100%', padding: '8px', background: '#222', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer' }}>
                        <option value="">Selecione o veículo...</option>
                        {listaCarros.map(os => <option key={os.id} value={os.id}>{os.placa} - {os.modelo}</option>)}
                      </select>
                    </div>
                    {usuario.cargo === 'Mecânico' && (
                      <button onClick={() => setMembroAuditando(usuario)} style={{ width: '100%', padding: '10px', background: '#D4AF37', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px' }}>🧰 AUDITAR MALA (IA)</button>
                    )}
                    <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                      <p style={{ fontSize: '10px', color: '#888', margin: '0 0 8px 0' }}>PERMISSÕES ATIVAS:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                        {[{ key: 'os', label: 'OS' }, { key: 'estoque', label: 'Estoque' }, { key: 'financeiro', label: 'Finanças' }, { key: 'equipe', label: 'Equipe' }, { key: 'oficina', label: 'Patrimônio' }].map(item => {
                          const ativo = usuario.permissoes?.[item.key] || false;
                          return <button key={item.key} onClick={() => salvarPermissoes(usuario.id, { ...usuario.permissoes, [item.key]: !ativo })} style={{ padding: '4px 8px', background: ativo ? GREEN_MONEY : '#222', color: ativo ? 'black' : '#666', border: 'none', borderRadius: '3px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }}>{item.label}</button>;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {abaAtiva === 'equipe' && membroAuditando && (
          <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: `2px solid #D4AF37` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#D4AF37' }}>🧰 Auditoria da Mala: {membroAuditando.nome}</h3>
              <button onClick={fecharAuditoria} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            <label style={{ display: 'block', padding: '30px', background: '#0a0a0a', border: '2px dashed #D4AF37', textAlign: 'center', cursor: 'pointer', borderRadius: '10px', marginBottom: '15px' }}>
              <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>📸</span>
              FOTOGRAFAR MALA DO MECÂNICO
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const r = new FileReader(); r.onload = () => setFotoMaleta(r.result); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
            </label>
            {fotoMaleta && (
              <div style={{ marginBottom: '15px' }}>
                <img src={fotoMaleta} style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '10px', border: `2px solid #D4AF37` }} />
                <button onClick={auditarMaleta} style={{ width: '100%', padding: '15px', background: '#D4AF37', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', marginTop: '15px' }}>🔍 INICIAR VARREDURA COM INTELIGÊNCIA ARTIFICIAL</button>
              </div>
            )}
            {resultadoAuditoriaIA && (
              <div style={{ background: '#000', padding: '15px', borderRadius: '5px', border: '1px solid #333', marginTop: '15px' }}>
                <h4 style={{ color: '#D4AF37', margin: '0 0 10px 0' }}>📋 Relatório de Ferramentas:</h4>
                <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{resultadoAuditoriaIA}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== OFICINA ===== */}
        {abaAtiva === 'oficina' && temPermissao('oficina') && (() => {
          const COR = TAB_COLORS.oficina || '#8b5cf6';
          const toBase64Of = file => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });

          // ──────────────────────────────────────────────
          // CONFIGURAÇÃO DE CADA SUB-ABA
          // ──────────────────────────────────────────────
          const CONFIGS_OFICINA = {
            mecanica: {
              icon: '🔧', label: 'Mecânica Geral', cor: '#8b5cf6',
              secoes: [
                { titulo: '🔧 MOTOR & ARREFECIMENTO', itens: [
                  { key: 'motor_estado',    label: 'Estado geral do motor',        tipo: 'check' },
                  { key: 'motor_vazamento', label: 'Vazamentos de óleo/água',       tipo: 'check' },
                  { key: 'motor_ruido',     label: 'Ruídos / batidas anormais',     tipo: 'check' },
                  { key: 'motor_correia',   label: 'Correia dentada / Poly-V',      tipo: 'check' },
                  { key: 'radiador',        label: 'Radiador / mangueiras',         tipo: 'check' },
                  { key: 'motor_obs',       label: '📝 Observações do motor',       tipo: 'texto', ph: 'Detalhes, peças a trocar...' },
                ]},
                { titulo: '⚙️ CÂMBIO & TRANSMISSÃO', itens: [
                  { key: 'cambio_troca',    label: 'Troca de marcha / funcionamento', tipo: 'check' },
                  { key: 'cambio_vazamento',label: 'Vazamento câmbio/diferencial',  tipo: 'check' },
                  { key: 'cambio_ruido',    label: 'Ruídos na transmissão',         tipo: 'check' },
                  { key: 'cambio_obs',      label: '📝 Observações câmbio',         tipo: 'texto', ph: 'Detalhe o problema...' },
                ]},
                { titulo: '🔴 FREIOS', itens: [
                  { key: 'freio_pastilha',  label: 'Pastilhas / lonas',             tipo: 'check' },
                  { key: 'freio_disco',     label: 'Discos / tambores',             tipo: 'check' },
                  { key: 'freio_fluido',    label: 'Fluido de freio',               tipo: 'check' },
                  { key: 'freio_abs',       label: 'ABS / freio de mão',            tipo: 'check' },
                  { key: 'freio_obs',       label: '📝 Observações freios',         tipo: 'texto', ph: 'Barulho, pulsação, frenagem...' },
                ]},
                { titulo: '🛞 SUSPENSÃO & DIREÇÃO', itens: [
                  { key: 'susp_amortecedor',label: 'Amortecedores',                 tipo: 'check' },
                  { key: 'susp_bucha',      label: 'Buchas / bandejas / barras',    tipo: 'check' },
                  { key: 'susp_rolamento',  label: 'Rolamentos de roda',            tipo: 'check' },
                  { key: 'dir_folga',       label: 'Folga / peso da direção',       tipo: 'check' },
                  { key: 'dir_cremalheira', label: 'Cremalheira / terminais',       tipo: 'check' },
                  { key: 'susp_obs',        label: '📝 Observações suspensão',      tipo: 'texto', ph: 'Barulhos, batidas, desgastes...' },
                ]},
                { titulo: '⚡ ELÉTRICO & ESCAPAMENTO', itens: [
                  { key: 'elet_bateria',    label: 'Bateria / alternador',          tipo: 'check' },
                  { key: 'elet_luzes',      label: 'Luzes / lanternas / faróis',    tipo: 'check' },
                  { key: 'elet_fusivel',    label: 'Fusíveis / chicote',            tipo: 'check' },
                  { key: 'esc_vazamento',   label: 'Vazamento / ruído escapamento', tipo: 'check' },
                  { key: 'elet_obs',        label: '📝 Observações elétr./escap.',  tipo: 'texto', ph: 'Falta de potência, luz no painel...' },
                ]},
              ]
            },
            motos: {
              icon: '🏍️', label: 'Motos', cor: '#f97316',
              secoes: [
                { titulo: '🔧 MOTOR MOTO', itens: [
                  { key: 'moto_compressao', label: 'Compressão do motor',           tipo: 'check' },
                  { key: 'moto_vazamento',  label: 'Vazamentos de óleo',            tipo: 'check' },
                  { key: 'moto_carburador', label: 'Carburador / injeção',          tipo: 'check' },
                  { key: 'moto_motor_obs',  label: '📝 Observações motor',          tipo: 'texto', ph: 'Detalhes...' },
                ]},
                { titulo: '⛓️ TRANSMISSÃO & RODAS', itens: [
                  { key: 'moto_corrente',   label: 'Corrente / relação',            tipo: 'check' },
                  { key: 'moto_pneus',      label: 'Pneus / calibragem',            tipo: 'check' },
                  { key: 'moto_rolamento',  label: 'Rolamentos de roda',            tipo: 'check' },
                ]},
                { titulo: '🔴 FREIOS & SUSPENSÃO MOTO', itens: [
                  { key: 'moto_freio_d',    label: 'Freio dianteiro',               tipo: 'check' },
                  { key: 'moto_freio_t',    label: 'Freio traseiro',                tipo: 'check' },
                  { key: 'moto_garfo',      label: 'Garfo / óleo do garfo',         tipo: 'check' },
                  { key: 'moto_amortecedor',label: 'Amortecedor traseiro',          tipo: 'check' },
                  { key: 'moto_obs',        label: '📝 Observações gerais moto',    tipo: 'texto', ph: 'Particularidades...' },
                ]},
              ]
            },
            lataria: {
              icon: '🚗', label: 'Lataria & Acabamento', cor: '#ec4899',
              secoes: [
                { titulo: '🔨 FUNILARIA & PINTURA', itens: [
                  { key: 'lat_amassados',   label: 'Amassados / cortes',            tipo: 'check' },
                  { key: 'lat_oxidacao',    label: 'Oxidação / ferrugem',           tipo: 'check' },
                  { key: 'lat_pintura',     label: 'Estado da pintura',             tipo: 'check' },
                  { key: 'lat_repintura',   label: 'Área de repintura / bolhas',    tipo: 'check' },
                  { key: 'lat_pintura_obs', label: '📝 Observações pintura',        tipo: 'texto', ph: 'Cor, textura, área afetada...' },
                ]},
                { titulo: '🪟 VIDROS & ACABAMENTO', itens: [
                  { key: 'lat_vidro_para',  label: 'Para-brisa / vidros laterais',  tipo: 'check' },
                  { key: 'lat_retrovisor',  label: 'Retrovisores',                  tipo: 'check' },
                  { key: 'lat_para_choque', label: 'Para-choques / spoilers',       tipo: 'check' },
                  { key: 'lat_borrachas',   label: 'Borrachas / vedações',          tipo: 'check' },
                ]},
                { titulo: '🛋️ INTERIOR', itens: [
                  { key: 'int_bancos',      label: 'Bancos / estofamento',          tipo: 'check' },
                  { key: 'int_painel',      label: 'Painel / air bag',              tipo: 'check' },
                  { key: 'int_tapete',      label: 'Tapetes / forros',              tipo: 'check' },
                  { key: 'int_obs',         label: '📝 Observações interior',       tipo: 'texto', ph: 'Rasgos, manchas, peças faltando...' },
                ]},
              ]
            },
            amortecedor: {
              icon: '🛢️', label: 'Amortecedores', cor: '#eab308',
              secoes: [
                { titulo: '🔍 DIAGNÓSTICO POR POSIÇÃO', itens: [
                  { key: 'amor_diant_esq',  label: 'Dianteiro Esquerdo',            tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '❌ Trocar'] },
                  { key: 'amor_diant_dir',  label: 'Dianteiro Direito',             tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '❌ Trocar'] },
                  { key: 'amor_tras_esq',   label: 'Traseiro Esquerdo',             tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '❌ Trocar'] },
                  { key: 'amor_tras_dir',   label: 'Traseiro Direito',              tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '❌ Trocar'] },
                ]},
                { titulo: '🌀 COMPONENTES ADICIONAIS', itens: [
                  { key: 'amor_mola_de',    label: 'Molas dianteiras',              tipo: 'check' },
                  { key: 'amor_mola_tr',    label: 'Molas traseiras',               tipo: 'check' },
                  { key: 'amor_bucha_barra',label: 'Buchas barra estabilizadora',   tipo: 'check' },
                  { key: 'amor_ponta_barra',label: 'Pontas de barra',               tipo: 'check' },
                  { key: 'amor_teste',      label: '📝 Resultado do teste ressalto', tipo: 'texto', ph: 'Ex: Dianteiro direito com 3 oscilações...' },
                  { key: 'amor_obs',        label: '📝 Observações gerais',         tipo: 'texto', ph: 'Diagnóstico completo, peças necessárias...' },
                ]},
              ]
            },
          };

          const cfg = CONFIGS_OFICINA[subAbaOficina] || CONFIGS_OFICINA.mecanica;

          const iniciarVozOficina = (fieldKey) => {
            if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
            const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            rec.lang = 'pt-BR'; rec.interimResults = false;
            setOuvindoVistoria(fieldKey);
            rec.onresult = e => setFormVistoria(p => ({ ...p, campos: { ...p.campos, [fieldKey]: ((p.campos?.[fieldKey] || '') + ' ' + e.results[0][0].transcript).trim() } }));
            rec.onerror = () => setOuvindoVistoria(null);
            rec.onend = () => setOuvindoVistoria(null);
            rec.start();
          };

          const salvarOSOficina = async () => {
            if (!formVistoria.placa) return alert('⚠️ Preencha a placa!');
            setSalvandoVistoria(true);
            try {
              const dados = { ...formVistoria, tipoServico: subAbaOficina, labelServico: cfg.label, data_registro: new Date().toISOString() };
              if (editandoVistoria) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'vistorias', editandoVistoria), dados);
              } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'vistorias'), dados);
                const total = (parseFloat(formVistoria.valorPecas||0) + parseFloat(formVistoria.valorMaoObra||0));
                if (total > 0) await addDoc(collection(db,'oficinas',oficinaId,'financeiro'), { tipo:'entrada', descricao:`${cfg.label} - ${formVistoria.placa} ${formVistoria.modelo}`, valor:total, data:new Date().toISOString(), categoria:'servico' });
              }
              setMostrarFormVistoria(false); setEditandoVistoria(null);
              setFormVistoria({ placa:'', modelo:'', ano:'', cor:'', km:'', cliente:'', telefone:'', fotos:[], tipoServico:subAbaOficina, obs:'', campos:{}, valorPecas:'', valorMaoObra:'' });
              await carregarVistorias();
              if (formVistoria.telefone && !editandoVistoria) {
                const total = (parseFloat(formVistoria.valorPecas||0) + parseFloat(formVistoria.valorMaoObra||0));
                const msg = encodeURIComponent(`Olá *${formVistoria.cliente||'Cliente'}*! 👋\n\n✅ Serviço de *${cfg.label}* registrado!\n🚗 Veículo: *${formVistoria.placa} - ${formVistoria.modelo}*\n${total>0?`💰 Total: *R$ ${total.toFixed(2).replace('.',',')}*\n`:''}\n_${dadosOficina?.nomeOficina||'Oficina IA'}_`);
                setTimeout(()=>window.open(`https://wa.me/55${String(formVistoria.telefone).replace(/\D/g,'')}?text=${msg}`,'_blank'),300);
              }
            } catch(e) { alert('Erro: '+e.message); }
            finally { setSalvandoVistoria(false); }
          };

          const getStatusColor = (val) => {
            if (!val || val.includes('OK')) return '#00E676';
            if (val.includes('Atenção')) return '#eab308';
            return '#ef4444';
          };

          return (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

              {/* ─── HEADER com sub-abas ─── */}
              <div style={{ background: 'linear-gradient(135deg, #0d0020, #0d0d0d)', border: `1px solid ${COR}44`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', background: `${COR}22`, border: `2px solid ${COR}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏢</div>
                  <div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>Oficina <span style={{ color: COR }}>Mecânica</span></h2>
                    <p style={{ color: '#555', margin: 0, fontSize: '12px' }}>Ordens de Serviço com checklist profissional</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(CONFIGS_OFICINA).map(([key, c]) => (
                    <button key={key} onClick={() => { setSubAbaOficina(key); setMostrarFormVistoria(false); }}
                      style={{ padding: '8px 16px', background: subAbaOficina === key ? c.cor : '#111', color: subAbaOficina === key ? 'white' : '#666', border: `1px solid ${subAbaOficina === key ? c.cor : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s' }}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── BOTÃO + lista header ─── */}
              {!mostrarFormVistoria && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ color: cfg.cor, margin: '0 0 2px 0', fontSize: '15px' }}>{cfg.icon} {cfg.label}</h3>
                    <p style={{ color: '#444', margin: 0, fontSize: '11px' }}>
                      {listaVistorias.filter(v=>(v.tipoServico||'mecanica')===subAbaOficina).length} O.S. registradas
                    </p>
                  </div>
                  <button onClick={() => {
                    setMostrarFormVistoria(true); setEditandoVistoria(null);
                    setFormVistoria({ placa:'', modelo:'', ano:'', cor:'', km:'', cliente:'', telefone:'', fotos:[], tipoServico:subAbaOficina, obs:'', campos:{}, valorPecas:'', valorMaoObra:'' });
                  }} style={{ background: cfg.cor, color: 'white', border: 'none', borderRadius: '10px', padding: '12px 20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: `0 4px 14px ${cfg.cor}44` }}>
                    + Nova O.S.
                  </button>
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* FORMULÁRIO COMPLETO                     */}
              {/* ═══════════════════════════════════════ */}
              {mostrarFormVistoria && (
                <div style={{ background: '#0a0a0a', border: `1px solid ${cfg.cor}55`, borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>

                  {/* Header form */}
                  <div style={{ background: `linear-gradient(135deg, ${cfg.cor}22, #111)`, padding: '18px 20px', borderBottom: `1px solid ${cfg.cor}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: cfg.cor, margin: '0 0 3px 0', fontSize: '16px', fontWeight: '900' }}>{editandoVistoria ? '✏️ Editar' : '📋 Nova'} O.S. - {cfg.icon} {cfg.label}</h4>
                      <p style={{ color: '#555', margin: 0, fontSize: '11px' }}>Preencha os dados do veículo e o diagnóstico técnico</p>
                    </div>
                    <button onClick={() => setMostrarFormVistoria(false)} style={{ background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  </div>

                  <div style={{ padding: '20px' }}>
                    {/* DADOS DO VEÍCULO */}
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ color: cfg.cor, fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '3px', height: '12px', background: cfg.cor, borderRadius: '2px' }} />
                        DADOS DO VEÍCULO & CLIENTE
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                        {[
                          { key: 'placa',    label: 'PLACA *',       ph: 'ABC1234' },
                          { key: 'modelo',   label: 'MODELO',        ph: 'Ex: Gol 1.0 2019' },
                          { key: 'cor',      label: 'COR',           ph: 'Ex: Prata' },
                          { key: 'ano',      label: 'ANO',           ph: '2019' },
                          { key: 'km',       label: 'KM ATUAL',      ph: '0', type: 'number' },
                          { key: 'cliente',  label: 'CLIENTE',       ph: 'Nome completo' },
                          { key: 'telefone', label: '📲 WHATSAPP',   ph: '(49) 99999-9999' },
                        ].map(({ key, label, ph, type }) => (
                          <div key={key}>
                            <label style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>{label}</label>
                            <input type={type||'text'} value={formVistoria[key]||''} onChange={e => setFormVistoria(p => ({...p, [key]: e.target.value}))}
                              placeholder={ph} style={{ width: '100%', padding: '10px 12px', background: '#111', border: `1px solid ${key==='placa'?cfg.cor+'55':'#222'}`, color: 'white', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', fontWeight: key==='placa'?'bold':'normal', textTransform: key==='placa'?'uppercase':'none' }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FOTOS - CARROSSEL GRANDE */}
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ color: cfg.cor, fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '3px', height: '12px', background: cfg.cor, borderRadius: '2px' }} />
                        📸 FOTOS DO VEÍCULO / SERVIÇO ({(formVistoria.fotos||[]).length}/10)
                      </p>

                      {/* Foto principal grande */}
                      {(formVistoria.fotos||[]).length > 0 && (
                        <div style={{ position: 'relative', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden', background: '#111', aspectRatio: '16/9', maxHeight: '280px' }}>
                          <img src={(formVistoria.fotos||[])[fotoAtiva]} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          {/* Navegação */}
                          {(formVistoria.fotos||[]).length > 1 && (
                            <>
                              <button onClick={() => setFotoAtiva(a => Math.max(0,a-1))} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', background:'#000000bb', color:'white', border:'none', borderRadius:'50%', width:'36px', height:'36px', cursor:'pointer', fontSize:'16px' }}>‹</button>
                              <button onClick={() => setFotoAtiva(a => Math.min((formVistoria.fotos||[]).length-1,a+1))} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'#000000bb', color:'white', border:'none', borderRadius:'50%', width:'36px', height:'36px', cursor:'pointer', fontSize:'16px' }}>›</button>
                              <div style={{ position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)', background:'#000000aa', borderRadius:'20px', padding:'4px 12px', color:'white', fontSize:'12px' }}>
                                {fotoAtiva+1} / {(formVistoria.fotos||[]).length}
                              </div>
                            </>
                          )}
                          <button onClick={() => { setFormVistoria(p=>({...p, fotos:p.fotos.filter((_,i)=>i!==fotoAtiva)})); setFotoAtiva(a=>Math.max(0,a-1)); }}
                            style={{ position:'absolute', top:'10px', right:'10px', background:'#ef4444cc', color:'white', border:'none', borderRadius:'8px', padding:'4px 10px', cursor:'pointer', fontSize:'12px', fontWeight:'bold' }}>🗑️ Remover</button>
                        </div>
                      )}

                      {/* Thumbnails */}
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                        {(formVistoria.fotos||[]).map((foto,i) => (
                          <div key={i} onClick={()=>setFotoAtiva(i)}
                            style={{ width:'60px', height:'60px', borderRadius:'8px', overflow:'hidden', border:`2px solid ${i===fotoAtiva?cfg.cor:'#333'}`, cursor:'pointer', flexShrink:0, transition:'0.2s' }}>
                            <img src={foto} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          </div>
                        ))}
                        {(formVistoria.fotos||[]).length < 10 && (
                          <label style={{ width:'60px', height:'60px', background:'#111', border:`2px dashed ${cfg.cor}`, borderRadius:'8px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:cfg.cor, fontSize:'20px', flexShrink:0 }}>
                            +<span style={{ fontSize:'9px', marginTop:'1px', color:'#555' }}>Foto</span>
                            <input type="file" accept="image/*" multiple style={{ display:'none' }} onChange={async e => {
                              const files = Array.from(e.target.files).slice(0,10-(formVistoria.fotos||[]).length);
                              const b64s = await Promise.all(files.map(toBase64Of));
                              setFormVistoria(p=>({...p, fotos:[...(p.fotos||[]),...b64s]}));
                              setFotoAtiva((formVistoria.fotos||[]).length);
                            }} />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* CHECKLIST TÉCNICO POR SEÇÃO */}
                    <div style={{ marginBottom: '24px' }}>
                      <p style={{ color: cfg.cor, fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '3px', height: '12px', background: cfg.cor, borderRadius: '2px' }} />
                        🔍 DIAGNÓSTICO TÉCNICO - {cfg.label.toUpperCase()}
                      </p>

                      {cfg.secoes.map((sec, si) => (
                        <div key={si} style={{ marginBottom: '16px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ background: '#161616', padding: '10px 16px', borderBottom: '1px solid #1a1a1a' }}>
                            <p style={{ color: '#888', margin: 0, fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' }}>{sec.titulo}</p>
                          </div>
                          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {sec.itens.map(({ key, label, tipo, ph, opcoes }) => (
                              <div key={key}>
                                {tipo === 'check' && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
                                    <span style={{ color: '#bbb', fontSize: '12px' }}>{label}</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {['✅ OK', '⚠️ Atenção', '❌ Trocar'].map(opt => (
                                        <button key={opt} onClick={() => setFormVistoria(p=>({...p, campos:{...p.campos, [key]: formVistoria.campos?.[key]===opt?'':opt}}))}
                                          style={{ padding: '4px 10px', background: formVistoria.campos?.[key]===opt ? (opt.includes('OK')?'#00E676':(opt.includes('Atenção')?'#eab308':'#ef4444')) : '#1a1a1a', color: formVistoria.campos?.[key]===opt ? 'black' : '#555', border: `1px solid ${formVistoria.campos?.[key]===opt?(opt.includes('OK')?'#00E676':(opt.includes('Atenção')?'#eab308':'#ef4444')):'#333'}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {tipo === 'status' && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#0a0a0a', borderRadius: '8px', border: `1px solid ${getStatusColor(formVistoria.campos?.[key])}22` }}>
                                    <span style={{ color: '#bbb', fontSize: '12px' }}>{label}</span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {(opcoes||[]).map(opt => (
                                        <button key={opt} onClick={() => setFormVistoria(p=>({...p, campos:{...p.campos, [key]: p.campos?.[key]===opt?'':opt}}))}
                                          style={{ padding: '4px 10px', background: formVistoria.campos?.[key]===opt ? getStatusColor(opt) : '#1a1a1a', color: formVistoria.campos?.[key]===opt ? 'black' : '#555', border: `1px solid ${formVistoria.campos?.[key]===opt?getStatusColor(opt):'#333'}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {tipo === 'texto' && (
                                  <div>
                                    <label style={{ color: '#555', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <textarea value={formVistoria.campos?.[key]||''} onChange={e => setFormVistoria(p=>({...p, campos:{...p.campos, [key]:e.target.value}}))}
                                        placeholder={ph} rows={2} style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #222', color: 'white', borderRadius: '8px', fontSize: '12px', resize: 'none' }} />
                                      <button onClick={() => iniciarVozOficina(key)}
                                        style={{ background: ouvindoVistoria===key?'#ef4444':'#1a1a1a', color: 'white', border: `1px solid ${ouvindoVistoria===key?'#ef4444':'#333'}`, borderRadius: '8px', padding: '0 12px', fontSize: '18px', cursor: 'pointer', alignSelf: 'flex-start', height: '40px', minWidth: '42px' }}>
                                        {ouvindoVistoria===key?'🔴':'🎤'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* VALORES */}
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ color: cfg.cor, fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '3px', height: '12px', background: cfg.cor, borderRadius: '2px' }} />
                        💰 VALORES DO SERVIÇO
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>PEÇAS (R$)</label>
                          <input type="number" value={formVistoria.valorPecas||''} onChange={e => setFormVistoria(p=>({...p,valorPecas:e.target.value}))}
                            placeholder="0,00" style={{ width:'100%', padding:'10px', background:'#111', border:'1px solid #222', color:'white', borderRadius:'8px', fontSize:'13px', boxSizing:'border-box' }} />
                        </div>
                        <div>
                          <label style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>MÃO DE OBRA (R$)</label>
                          <input type="number" value={formVistoria.valorMaoObra||''} onChange={e => setFormVistoria(p=>({...p,valorMaoObra:e.target.value}))}
                            placeholder="0,00" style={{ width:'100%', padding:'10px', background:'#111', border:'1px solid #222', color:'white', borderRadius:'8px', fontSize:'13px', boxSizing:'border-box' }} />
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-end' }}>
                          <div style={{ width:'100%', padding:'10px', background:'#0a1a0a', border:`1px solid #00E67633`, borderRadius:'8px' }}>
                            <p style={{ color:'#444', fontSize:'10px', fontWeight:'bold', margin:'0 0 2px 0' }}>TOTAL</p>
                            <p style={{ color:'#00E676', fontWeight:'bold', margin:0, fontSize:'14px' }}>
                              R$ {(parseFloat(formVistoria.valorPecas||0)+parseFloat(formVistoria.valorMaoObra||0)).toFixed(2).replace('.',',')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BOTÕES */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={salvarOSOficina} disabled={salvandoVistoria}
                        style={{ flex: 1, padding: '16px', background: salvandoVistoria?'#333':cfg.cor, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxShadow: salvandoVistoria?'none':`0 4px 14px ${cfg.cor}44` }}>
                        {salvandoVistoria ? '⏳ Salvando...' : '💾 Salvar O.S.'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* LISTA DE O.S.                           */}
              {/* ═══════════════════════════════════════ */}
              {listaVistorias.filter(v=>(v.tipoServico||'mecanica')===subAbaOficina).length === 0 && !mostrarFormVistoria ? (
                <div style={{ background: '#0a0a0a', border: `1px dashed ${cfg.cor}33`, borderRadius: '16px', padding: '50px', textAlign: 'center' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>{cfg.icon}</p>
                  <p style={{ color: '#333', margin: '0 0 16px 0', fontSize: '14px' }}>Nenhuma O.S. de {cfg.label} ainda.</p>
                  <button onClick={() => { setMostrarFormVistoria(true); setEditandoVistoria(null); setFormVistoria({ placa:'', modelo:'', ano:'', cor:'', km:'', cliente:'', telefone:'', fotos:[], tipoServico:subAbaOficina, obs:'', campos:{}, valorPecas:'', valorMaoObra:'' }); }}
                    style={{ background: cfg.cor, color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    + Criar primeira O.S.
                  </button>
                </div>
              ) : listaVistorias.filter(v=>(v.tipoServico||'mecanica')===subAbaOficina).map(vis => {
                const vcfg = CONFIGS_OFICINA[vis.tipoServico||'mecanica'] || CONFIGS_OFICINA.mecanica;
                const totalV = (parseFloat(vis.valorPecas||0)+parseFloat(vis.valorMaoObra||0));
                const campos = vis.campos || {};
                const problemasCount = Object.values(campos).filter(v => typeof v === 'string' && (v.includes('Atenção') || v.includes('Trocar'))).length;
                return (
                  <div key={vis.id} style={{ background: '#0a0a0a', border: `1px solid ${vcfg.cor}33`, borderRadius: '16px', marginBottom: '14px', overflow: 'hidden' }}>
                    {/* Carrossel de fotos no card */}
                    {(vis.fotos||[]).length > 0 && (
                      <div style={{ position: 'relative', background: '#000', height: '180px' }}>
                        <img src={(vis.fotos||[])[0]} style={{ width:'100%', height:'100%', objectFit:'cover', opacity: 0.85 }} />
                        {(vis.fotos||[]).length > 1 && (
                          <div style={{ position:'absolute', bottom:'8px', right:'10px', background:'#000000bb', borderRadius:'12px', padding:'3px 10px', color:'white', fontSize:'11px' }}>
                            📸 {(vis.fotos||[]).length} fotos
                          </div>
                        )}
                        <div style={{ position:'absolute', top:'10px', left:'10px', background:`${vcfg.cor}cc`, borderRadius:'8px', padding:'4px 10px', color:'white', fontSize:'11px', fontWeight:'bold' }}>
                          {vcfg.icon} {vcfg.label}
                        </div>
                      </div>
                    )}
                    <div style={{ padding: '16px' }}>
                      {/* Linha 1: placa + ações */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px', gap:'8px', flexWrap:'wrap' }}>
                        <div>
                          <p style={{ color:'white', fontWeight:'900', margin:'0 0 2px 0', fontSize:'18px', letterSpacing:'1px' }}>{vis.placa}</p>
                          <p style={{ color:'#666', fontSize:'12px', margin:0 }}>{vis.modelo}{vis.ano&&` · ${vis.ano}`}{vis.cor&&` · ${vis.cor}`}{vis.km&&` · ${Number(vis.km).toLocaleString('pt-BR')} km`}</p>
                          {vis.cliente && <p style={{ color:'#888', fontSize:'12px', margin:'4px 0 0 0' }}>👤 {vis.cliente}{vis.telefone&&` · 📱 ${vis.telefone}`}</p>}
                        </div>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button onClick={() => { setEditandoVistoria(vis.id); setFormVistoria({...vis, campos:vis.campos||{}}); setMostrarFormVistoria(true); setFotoAtiva(0); }}
                            style={{ padding:'7px 12px', background:'#111', color:'#aaa', border:'1px solid #333', borderRadius:'8px', fontSize:'12px', cursor:'pointer' }}>✏️</button>
                          {vis.telefone && (
                            <a href={`https://wa.me/55${String(vis.telefone).replace(/\D/g,'')}?text=${encodeURIComponent('*Relatório de Serviço - '+vis.placa+'*\n\n'+vcfg.icon+' *'+vcfg.label+'*\nVeículo: '+vis.modelo+'\n\n'+(totalV>0?'💰 Total: R$ '+totalV.toFixed(2).replace('.',',')+'\n\n':'')+'_'+( dadosOficina?.nomeOficina||'')+'_')}`}
                              target="_blank" rel="noreferrer"
                              style={{ padding:'7px 12px', background:'#25D366', color:'black', borderRadius:'8px', fontWeight:'bold', fontSize:'11px', textDecoration:'none' }}>📲</a>
                          )}
                          <button onClick={async()=>{ if(window.confirm('Apagar esta O.S.?')){ await deleteDoc(doc(db,'oficinas',oficinaId,'vistorias',vis.id)); carregarVistorias(); }}}
                            style={{ padding:'7px 12px', background:'transparent', color:'#333', border:'1px solid #222', borderRadius:'8px', fontSize:'12px', cursor:'pointer' }}>🗑️</button>
                        </div>
                      </div>

                      {/* Badges de status */}
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px' }}>
                        {totalV > 0 && <span style={{ background:'#0a1a0a', border:'1px solid #00E67633', borderRadius:'6px', padding:'3px 10px', color:'#00E676', fontSize:'11px', fontWeight:'bold' }}>💰 R$ {totalV.toFixed(2).replace('.',',')}</span>}
                        {problemasCount > 0 && <span style={{ background:'#1a0000', border:'1px solid #ef444433', borderRadius:'6px', padding:'3px 10px', color:'#ef4444', fontSize:'11px', fontWeight:'bold' }}>⚠️ {problemasCount} item(ns) a atenção</span>}
                        {vis.data_registro && <span style={{ background:'#111', border:'1px solid #1a1a1a', borderRadius:'6px', padding:'3px 10px', color:'#444', fontSize:'11px' }}>📅 {new Date(vis.data_registro).toLocaleDateString('pt-BR')}</span>}
                      </div>

                      {/* Itens com problemas */}
                      {problemasCount > 0 && (
                        <div style={{ background:'#0d0000', border:'1px solid #ef444422', borderRadius:'8px', padding:'10px 12px' }}>
                          <p style={{ color:'#ef4444', fontSize:'10px', fontWeight:'bold', margin:'0 0 6px 0', letterSpacing:'1px' }}>⚠️ ITENS QUE PRECISAM DE ATENÇÃO</p>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                            {Object.entries(campos).filter(([,v])=>typeof v==='string'&&(v.includes('Atenção')||v.includes('Trocar'))).map(([k, v]) => {
                              const allItens = vcfg.secoes.flatMap(s=>s.itens);
                              const itemLabel = allItens.find(it=>it.key===k)?.label || k;
                              return <span key={k} style={{ background:'#1a0000', border:'1px solid #ef444433', borderRadius:'5px', padding:'3px 8px', color:'#ef4444', fontSize:'11px' }}>{itemLabel}: {v}</span>;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* PATRIMÔNIO compacto */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #111', paddingTop: '18px' }}>
                <h4 style={{ color: '#333', margin: '0 0 12px 0', fontSize: '11px', letterSpacing: '2px' }}>🏢 PATRIMÔNIO / EQUIPAMENTOS</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <input type="text" value={equipamentoNome} onChange={e => setEquipamentoNome(e.target.value)} placeholder="Nome do Equipamento..." style={{ flex: 1, minWidth: '180px', padding: '10px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: 'white', borderRadius: '8px', fontSize: '12px' }} />
                  <label style={{ display:'flex', alignItems:'center', padding:'0 14px', background:'#0a0a0a', color:'#00E676', border:'1px dashed #00E67633', cursor:'pointer', borderRadius:'8px', fontWeight:'bold', fontSize:'11px' }}>
                    📸<input type="file" accept="image/*" capture="environment" onChange={e=>{ const r=new FileReader(); r.onload=async()=>setEquipamentoFoto(await comprimirFoto(r.result,0.5)); r.readAsDataURL(e.target.files[0]); }} style={{ display:'none' }} />
                  </label>
                  <button onClick={handleSalvarEquipamento} style={{ padding:'10px 16px', background:'#111', color:'#666', border:'1px solid #222', fontWeight:'bold', borderRadius:'8px', cursor:'pointer', fontSize:'12px' }}>+ Salvar</button>
                </div>
                {equipamentoFoto && <div style={{ marginBottom:'10px', display:'flex', gap:'8px', alignItems:'center' }}><img src={equipamentoFoto} style={{ height:'50px', width:'50px', objectFit:'cover', borderRadius:'6px' }} /><button onClick={()=>setEquipamentoFoto(null)} style={{ background:'transparent', color:'#ef4444', border:'none', cursor:'pointer', fontSize:'11px' }}>Remover</button></div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                  {listaEquipamentos.map(eq => (
                    <div key={eq.id} style={{ background:'#0a0a0a', borderRadius:'8px', position:'relative', textAlign:'center', overflow:'hidden', border:'1px solid #111' }}>
                      {eq.foto?<img src={eq.foto} style={{ width:'100%', height:'70px', objectFit:'cover' }} />:<div style={{ height:'70px', display:'flex', alignItems:'center', justifyContent:'center', color:'#222', fontSize:'10px' }}>Sem foto</div>}
                      <p style={{ margin:'5px', fontWeight:'bold', fontSize:'10px', color:'#444' }}>{eq.nome}</p>
                      <button onClick={()=>deletarDoc('oficina_equipamentos',eq.id,carregarEquipamentos)} style={{ position:'absolute', top:'3px', right:'3px', background:'#ef444422', color:'#ef4444', border:'none', borderRadius:'50%', width:'18px', height:'18px', cursor:'pointer', fontSize:'10px' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== LEADS / CLIENTES ===== */}
        {abaAtiva === 'leads' && temPermissao('os') && (() => {
          const hoje = new Date();

          // Agrupa O.S. por placa - pega a mais recente de cada cliente
          const clientesMap = {};
          listaCarros.forEach(os => {
            const placa = os.placa || 'SEM_PLACA';
            const dataOS = os.data_registro?.toDate
              ? os.data_registro.toDate()
              : new Date(os.data_registro || os.data || 0);
            if (!clientesMap[placa] || dataOS > clientesMap[placa].dataOS) {
              clientesMap[placa] = { ...os, dataOS };
            }
          });

          const clientes = Object.values(clientesMap).sort((a, b) => a.dataOS - b.dataOS); // mais antigos primeiro

          const getSemaforo = (dataOS) => {
            const dias = Math.floor((hoje - dataOS) / (1000 * 60 * 60 * 24));
            if (dias <= 30)  return { cor: '#00E676', bg: '#00E67611', label: 'RECENTE',  dias, emoji: '🟢' };
            if (dias <= 90)  return { cor: '#facc15', bg: '#facc1511', label: 'ATENÇÃO',  dias, emoji: '🟡' };
            if (dias <= 180) return { cor: '#f97316', bg: '#f9731611', label: 'RISCO',    dias, emoji: '🟠' };
            return              { cor: '#ef4444', bg: '#ef444411', label: 'CRÍTICO',  dias, emoji: '🔴' };
          };

          const msgWhatsApp = (os, dias) => {
            const nome = os.nomeCliente ? ` *${os.nomeCliente}*` : '';
            return encodeURIComponent(
              `Olá${nome}! 👋 Aqui é da *${config.nome || 'Oficina IA'}*.\n` +
              `Faz um tempinho que não vemos seu *${os.modelo || 'veículo'}* (Placa: ${os.placa}) por aqui. 🚗\n\n` +
              `Manutenção em dia evita dores de cabeça! Que tal agendarmos uma revisão rápida?\n\n` +
              `Qualquer dúvida, é só chamar! 😊`
            );
          };

          const totais = { recente: 0, atencao: 0, risco: 0, critico: 0 };
          clientes.forEach(c => {
            const s = getSemaforo(c.dataOS);
            if (s.dias <= 30) totais.recente++;
            else if (s.dias <= 90) totais.atencao++;
            else if (s.dias <= 180) totais.risco++;
            else totais.critico++;
          });

          return (
            <div>
              <h2 style={{ color: TAB_COLORS.leads, marginBottom: '20px' }}>👥 Relacionamento com Clientes</h2>

              {/* PAINEL RESUMO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                {[
                  { label: 'Recentes', valor: totais.recente, cor: '#00E676', emoji: '🟢', desc: '≤ 30 dias' },
                  { label: 'Atenção', valor: totais.atencao, cor: '#facc15', emoji: '🟡', desc: '31-90 dias' },
                  { label: 'Risco', valor: totais.risco, cor: '#f97316', emoji: '🟠', desc: '91-180 dias' },
                  { label: 'Crítico', valor: totais.critico, cor: '#ef4444', emoji: '🔴', desc: '+180 dias' },
                ].map(({ label, valor, cor, emoji, desc }) => (
                  <div key={label} style={{ background: '#111', border: `1px solid ${cor}33`, borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', margin: 0 }}>{emoji}</p>
                    <p style={{ color: cor, fontSize: '22px', fontWeight: '900', margin: '4px 0 0 0' }}>{valor}</p>
                    <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0 0', fontWeight: 'bold' }}>{label}</p>
                    <p style={{ color: '#555', fontSize: '10px', margin: '2px 0 0 0' }}>{desc}</p>
                  </div>
                ))}
              </div>

              {/* LEGENDA */}
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: '#555', fontSize: '11px', fontWeight: 'bold' }}>SEMÁFORO:</span>
                {[
                  { emoji: '🟢', label: 'Recente (≤30 dias)' },
                  { emoji: '🟡', label: 'Atenção (31-90 dias)' },
                  { emoji: '🟠', label: 'Risco (91-180 dias)' },
                  { emoji: '🔴', label: 'Crítico (+180 dias)' },
                ].map(({ emoji, label }) => (
                  <span key={label} style={{ color: '#888', fontSize: '11px' }}>{emoji} {label}</span>
                ))}
              </div>

              {/* LISTA DE CLIENTES */}
              {clientes.length === 0 ? (
                <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Nenhuma O.S. registrada ainda.</p>
              ) : clientes.map(os => {
                const s = getSemaforo(os.dataOS);
                const tel = String(os.telefone || '').replace(/\D/g, '');
                return (
                  <div key={os.placa} style={{ background: s.bg, border: `1px solid ${s.cor}44`, borderRadius: '12px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px' }}>{s.emoji}</span>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{os.nomeCliente || 'Cliente'}</span>
                        <span style={{ background: `${s.cor}22`, color: s.cor, border: `1px solid ${s.cor}44`, padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{s.label}</span>
                      </div>
                      <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                        🚗 {os.modelo || '-'} · 🔡 {os.placa} · ⏱️ {s.dias} dias sem contato
                      </p>
                    </div>
                    {tel && (
                      <a
                        href={`https://wa.me/55${tel}?text=${msgWhatsApp(os, s.dias)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        📲 WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}

              {/* LEADS (componente original) */}
              <div style={{ marginTop: '30px', borderTop: '1px solid #222', paddingTop: '20px' }}>
                <LeadsPage />
              </div>
            </div>
          );
        })()}

        {/* ===== CONFIG ===== */}
        {abaAtiva === 'config' && temPermissao('config') && (
          <div>
            <h2 style={{ color: MAIN_COLOR, marginBottom: '20px' }}>⚙️ Configurações da Empresa</h2>
            <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333', marginBottom: '20px', textAlign: 'center' }}>
              <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>LOGOTIPO DA OFICINA</label>
              {config.logoUrl ? <img src={config.logoUrl} alt="Logo" style={{ height: '80px', objectFit: 'contain', marginBottom: '15px' }} /> : <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', border: '1px dashed #333', marginBottom: '15px', borderRadius: '5px' }}>Sem Logo</div>}
              <label style={{ display: 'inline-block', padding: '10px 20px', background: '#222', color: 'white', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', border: '1px solid #444' }}>
                {subindoLogo ? '⏳ PROCESSANDO E SALVANDO...' : '📷 SELECIONAR E SALVAR LOGO'}
                <input type="file" accept="image/*" onChange={handleUploadLogo} style={{ display: 'none' }} disabled={subindoLogo} />
              </label>
            </div>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>Os dados abaixo aparecem no Recibo e no Portal do Cliente.</p>
            <div style={{ background: '#111', padding: '20px', borderRadius: '5px' }}>
              {Object.keys(config).map(key => (
                key !== 'logoUrl' && (
                  <div key={key} style={{ marginBottom: '15px' }}>
                    <label style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>{key === 'pixKey' ? 'CHAVE PIX' : key}</label>
                    <input type="text" value={config[key] || ''} onChange={(e) => setConfig({ ...config, [key]: e.target.value })} style={{ width: '100%', padding: '15px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                  </div>
                )
              ))}
              <button onClick={handleSalvarConfig} style={{ width: '100%', padding: '15px', background: MAIN_COLOR, color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px' }}>💾 SALVAR DADOS</button>
            </div>
          </div>
        )}

        {/* ===== MASTER ===== */}
        {abaAtiva === 'master' && papelLogado === 'master' && <MasterPanel setPlanosGlobais={setPlanosSistema} />}

        {/* ===== ESTRATÉGIA ===== */}
        {abaAtiva === 'estrategia' && <AbaEstrategia />}

        {/* ===== MARKETING ===== */}
        {abaAtiva === 'marketing' && (() => {
          const MKT_COLOR = '#a855f7';
          const contratarServico = async (servico) => {
            setContratandoMkt(servico.key);
            try {
              await addDoc(collection(db, 'oficinas', oficinaId, 'marketing_contratos'), {
                servico: servico.key,
                nomeServico: servico.nome,
                preco: servico.preco,
                nomeOficina: dadosOficina?.nomeOficina || '',
                telefone: dadosOficina?.telefone || '',
                status: 'solicitado',
                data: new Date().toISOString(),
              });
              // Abre WhatsApp para o Master
              const tel = '5549999999999'; // número do master - pode ser configurado
              const msg = encodeURIComponent(
                `🎯 *NOVA CONTRATAÇÃO DE MARKETING*\n\n` +
                `Oficina: *${dadosOficina?.nomeOficina || 'Não identificada'}*\n` +
                `Serviço: *${servico.icon} ${servico.nome}*\n` +
                `Valor: *${servico.preco ? `R$ ${servico.preco}/mês` : 'Sob consulta'}*\n\n` +
                `Por favor, entrar em contato para dar continuidade! ✅`
              );
              window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
              alert(`✅ Solicitação enviada! Entraremos em contato em breve.`);
            } catch (e) { alert('Erro ao registrar: ' + e.message); }
            finally { setContratandoMkt(null); }
          };

          return (
            <div>
              {/* HERO */}
              <div style={{ background: 'linear-gradient(135deg, #1a0a2e, #0d0d1a)', border: `1px solid ${MKT_COLOR}44`, borderRadius: '16px', padding: '30px', marginBottom: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📣</div>
                <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '24px' }}>Oficina IA <span style={{ color: MKT_COLOR }}>Marketing</span></h2>
                <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 6px 0', lineHeight: '1.6' }}>
                  Mais clientes. Mais retornos. Mais faturamento.
                </p>
                <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                  Serviços de marketing digital especializados para oficinas mecânicas.
                </p>
              </div>

              {/* CARDS À LA CARTE */}
              <h3 style={{ color: MKT_COLOR, marginBottom: '16px', fontSize: '16px' }}>🛒 Serviços Disponíveis - Contrate o que você precisa</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '30px' }}>
                {(servicosMarketingAdmin.length > 0 ? servicosMarketingAdmin : [
                  { key: 'trafego_pago',   icon: '🎯', nome: 'Tráfego Pago',             desc: 'Anúncios no Google e Meta para atrair clientes novos todos os dias.',            preco: '' },
                  { key: 'google_negocio', icon: '📍', nome: 'Google Meu Negócio',        desc: 'Apareça em destaque quando alguém pesquisar "oficina perto de mim".',            preco: '' },
                  { key: 'site',           icon: '🌐', nome: 'Criação de Site',            desc: 'Site profissional que funciona como vendedor 24h.',                              preco: '' },
                  { key: 'whatsapp_bot',   icon: '🤖', nome: 'Automação de Atendimento',  desc: 'Bot inteligente que responde e agenda clientes automaticamente.',                 preco: '' },
                  { key: 'redes_sociais',  icon: '📱', nome: 'Gestão de Redes Sociais',   desc: 'Posts profissionais no Instagram e Facebook da sua oficina.',                    preco: '' },
                  { key: 'conteudo',       icon: '🎨', nome: 'Criação de Conteúdo',       desc: 'Artes, vídeos e stories prontos para publicar.',                                 preco: '' },
                  { key: 'seo_local',      icon: '🔍', nome: 'SEO Local',                 desc: 'Apareça no Google organicamente para clientes da sua cidade.',                   preco: '' },
                  { key: 'relatorio',      icon: '📊', nome: 'Relatório Mensal',          desc: 'Resultados completos do seu investimento em marketing.',                         preco: '' },
                ]).map(servico => (
                  <div key={servico.key} style={{ background: '#0f0f1a', border: `1px solid ${MKT_COLOR}33`, borderRadius: '14px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{servico.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '16px' }}>{servico.nome}</h4>
                      <p style={{ color: '#888', fontSize: '13px', margin: '0 0 14px 0', lineHeight: '1.5' }}>{servico.desc}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          {servico.preco
                            ? <span style={{ color: MKT_COLOR, fontSize: '20px', fontWeight: '900' }}>R$ {servico.preco}<span style={{ color: '#666', fontSize: '12px', fontWeight: 'normal' }}>/mês</span></span>
                            : <span style={{ color: '#666', fontSize: '13px', fontStyle: 'italic' }}>Sob consulta</span>
                          }
                        </div>
                        <button
                          onClick={() => contratarServico(servico)}
                          disabled={contratandoMkt === servico.key}
                          style={{ background: contratandoMkt === servico.key ? '#333' : MKT_COLOR, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                        >
                          {contratandoMkt === servico.key ? '⏳ Enviando...' : '🚀 Contratar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* RODAPÉ */}
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
                  Ao clicar em <strong style={{ color: MKT_COLOR }}>Contratar</strong>, sua solicitação é registrada e entraremos em contato pelo WhatsApp em até 24h úteis para iniciar o serviço. 🚀
                </p>
              </div>
            </div>
          );
        })()}


        {/* ===== LIGHTBOX ZOOM FOTOS ===== */}
        {lightboxAberto && (
          <div onClick={() => setLightboxAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <button onClick={() => setLightboxAberto(false)} style={{ position: 'absolute', top: '16px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', zIndex: 1 }}>✕</button>
            <img src={lightboxFotos[lightboxIdx]} alt="" style={{ maxWidth: '92vw', maxHeight: '78vh', borderRadius: '10px', objectFit: 'contain', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()} />
            {lightboxFotos.length > 1 && (
              <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setLightboxIdx(i => (i - 1 + lightboxFotos.length) % lightboxFotos.length)} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>◀ Anterior</button>
                <span style={{ color: '#888', alignSelf: 'center', fontSize: '13px' }}>{lightboxIdx + 1} / {lightboxFotos.length}</span>
                <button onClick={() => setLightboxIdx(i => (i + 1) % lightboxFotos.length)} style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Próxima ▶</button>
              </div>
            )}
            <p style={{ color: '#555', fontSize: '11px', marginTop: '10px' }}>Clique fora da foto para fechar</p>
          </div>
        )}

        {/* ===== DESMANCHE ===== */}
        {abaAtiva === 'desmanche' && (() => {
          const COR = '#ef4444';
          const COR2 = '#f97316';

          // ---- helpers de imagem ----
          const toBase64 = file => new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsDataURL(file);
          });

          const tirarFotosDesmanche = async (setter, fotoKey) => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
            input.onchange = async e => {
              const files = Array.from(e.target.files);
              const b64s = await Promise.all(files.map(toBase64));
              setter(prev => ({ ...prev, [fotoKey]: [...(prev[fotoKey] || []), ...b64s] }));
            };
            input.click();
          };

          // ---- voz ----
          const iniciarVozDesmanche = (setter, fieldKey, setOuvindo) => {
            if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
            const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            rec.lang = 'pt-BR'; rec.interimResults = false;
            recDesRef.current = rec;
            rec.onstart = () => setOuvindo(true);
            rec.onresult = e => setter(prev => ({ ...prev, [fieldKey]: (prev[fieldKey] ? prev[fieldKey] + ' ' : '') + e.results[0][0].transcript }));
            rec.onerror = () => setOuvindo(false);
            rec.onend = () => setOuvindo(false);
            rec.start();
          };

          // ---- publicar e avisar oficinas ----
          const publicarChegada = async (carro) => {
            if (!window.confirm(`Publicar "${carro.modelo}" e avisar oficinas parceiras?`)) return;
            try {
              // Busca parceiros cadastrados
              const parcSnap = await getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'));
              const parceiros = parcSnap.docs.map(d => d.data());
              const parceiros_ids = parcSnap.docs.map(d => d.data().oficinaId).filter(Boolean);

              // Busca peças do carro
              const pecasDoCarroSnap = await getDocs(query(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), where('veiculoId', '==', carro.id)));
              const pecasNomes = pecasDoCarroSnap.docs.map(d => d.data().nome).join(', ');

              // Busca veículos já publicados para não sobrescrever
              const globalSnap = await getDoc(doc(db, 'desmanche_global', oficinaId));
              const jaPublicados = globalSnap.exists() ? (globalSnap.data().veiculos_publicados || []) : [];
              const jaExiste = jaPublicados.find(v => v.id === carro.id);
              const carroPublicado = {
                id: carro.id, modelo: carro.modelo, ano: carro.ano, cor: carro.cor,
                patio: carro.patio, detalhes: carro.detalhes, fotos: (carro.fotos || []).slice(0, 10),
                data_publicacao: new Date().toISOString(),
              };
              const novosVeiculos = jaExiste
                ? jaPublicados.map(v => v.id === carro.id ? carroPublicado : v)
                : [...jaPublicados, carroPublicado];

              // Salva no desmanche_global - feed público para oficinas parceiras
              await setDoc(doc(db, 'desmanche_global', oficinaId), {
                nomeOficina: dadosOficina?.nomeOficina || 'Desmanche',
                telefone: dadosOficina?.telefone || '',
                parceiros_ids,
                veiculos_publicados: novosVeiculos,
                ultima_atualizacao: new Date().toISOString(),
              }, { merge: false });

              // Cria notificação para cada oficina parceira no Firebase
              for (const parc of parcSnap.docs) {
                const parcData = parc.data();
                if (parcData.oficinaId) {
                  await addDoc(collection(db, 'oficinas', parcData.oficinaId, 'notificacoes_desmanche'), {
                    tipo: 'nova_chegada',
                    desmanchemId: oficinaId,
                    desmanchemNome: dadosOficina?.nomeOficina || 'Desmanche',
                    modelo: carro.modelo, ano: carro.ano, fotos: (carro.fotos || []).slice(0, 1),
                    lida: false,
                    data: new Date().toISOString(),
                  });
                }
              }

              // Marca carro como publicado
              await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', carro.id), {
                publicado: true, data_publicacao: new Date().toISOString()
              });

              // Avisa parceiros por WhatsApp
              const msg = encodeURIComponent(
                `🚗 *NOVA CHEGADA - ${dadosOficina?.nomeOficina || 'Desmanche'}*\n\n` +
                `Carro: *${carro.modelo} ${carro.ano || ''}* - ${carro.cor || ''}\n` +
                `Pátio: ${carro.patio || 'A definir'}\n` +
                `Peças disponíveis: ${pecasNomes || 'Ver no app'}\n\n` +
                `${carro.detalhes ? `📝 ${carro.detalhes}\n\n` : ''}` +
                `Acesse o app Oficina IA → aba 🔩 FORNECEDORES para ver fotos e catálogo completo!\n` +
                `Interesse? Responda esta mensagem! ✅`
              );
              let enviados = 0;
              for (const p of parceiros) {
                const tel = String(p.telefone || '').replace(/\D/g, '');
                if (tel) { window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank'); enviados++; await new Promise(r => setTimeout(r, 800)); }
              }
              await carregarDesmanche();
              alert(`✅ Publicado no feed das oficinas parceiras! WhatsApp aberto para ${enviados} oficina(s).`);
            } catch (e) { alert('Erro: ' + e.message); }
          };

          // ---- compartilhar com cliente ----
          const compartilharCliente = (carro, cliente) => {
            const pecasDoCarroLocal = pecasDesmanche.filter(p => p.veiculoId === carro.id && p.status === 'disponivel');
            const listaPecas = pecasDoCarroLocal.map(p => `  • ${p.nome}${p.preco ? ` - R$ ${p.preco}` : ''}`).join('\n');
            const msg = encodeURIComponent(
              `Olá *${cliente.nome}*! 👋\n\n` +
              `Temos um carro que pode te interessar:\n\n` +
              `🚗 *${carro.modelo} ${carro.ano || ''}* - ${carro.cor || ''}\n` +
              `📍 Pátio: ${carro.patio || 'Consultar'}\n\n` +
              `🔩 *Peças disponíveis:*\n${listaPecas || 'Consultar disponibilidade'}\n\n` +
              `${carro.detalhes ? `📝 ${carro.detalhes}\n\n` : ''}` +
              `Interesse? É só responder! ✅\n_${dadosOficina?.nomeOficina || 'Desmanche'}_`
            );
            const tel = String(cliente.telefone || '').replace(/\D/g, '');
            if (tel) window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
          };

          // ---- resumo financeiro ----
          const totalInvestido = veiculosDesmanche.reduce((s, v) => s + (Number(v.valorLeilao) || 0), 0);
          const totalVendas = pecasDesmanche.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
          const pecasDisponiveis = pecasDesmanche.filter(p => p.status === 'disponivel').length;
          const pecasVendidas = pecasDesmanche.filter(p => p.status === 'vendida').length;

          const pecasFiltradas = pecasDesmanche.filter(p => {
            const buscaOk = !buscaPeca || p.nome?.toLowerCase().includes(buscaPeca.toLowerCase()) || p.veiculoNome?.toLowerCase().includes(buscaPeca.toLowerCase()) || p.codigo?.toLowerCase().includes(buscaPeca.toLowerCase());
            const statusOk = filtroStatus === 'todos' || p.status === filtroStatus;
            return buscaOk && statusOk;
          });

          return (
            <div>
              {/* HEADER */}
              <div style={{ background: `linear-gradient(135deg, #1a0000, #0d0d0d)`, border: `1px solid ${COR}44`, borderRadius: '16px', padding: '25px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '22px' }}>🚗 <span style={{ color: COR }}>Desmanche</span></h2>
                    <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Gestão de veículos, peças e clientes</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Investido', valor: `R$ ${totalInvestido.toLocaleString('pt-BR')}`, cor: '#ef4444' },
                      { label: 'Vendido', valor: `R$ ${totalVendas.toLocaleString('pt-BR')}`, cor: '#00E676' },
                      { label: 'Lucro', valor: `R$ ${(totalVendas - totalInvestido).toLocaleString('pt-BR')}`, cor: totalVendas >= totalInvestido ? '#00E676' : '#ef4444' },
                    ].map(({ label, valor, cor }) => (
                      <div key={label} style={{ background: '#111', border: `1px solid ${cor}33`, borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
                        <p style={{ color: '#666', fontSize: '10px', margin: '0 0 2px 0', fontWeight: 'bold' }}>{label}</p>
                        <p style={{ color: cor, fontSize: '16px', fontWeight: '900', margin: 0 }}>{valor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SUB-ABAS */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { key: 'veiculos', label: '🚗 Veículos', count: veiculosDesmanche.length },
                  { key: 'pecas', label: '🔩 Peças', count: pecasDisponiveis },
                  { key: 'busca_pecas', label: '🔍 Buscar Peças', count: null },
                  { key: 'clientes', label: '👥 Clientes', count: null },
                  { key: 'parceiros', label: '🔧 Oficinas Parceiras', count: null },
                ].map(({ key, label, count }) => (
                  <button key={key} onClick={() => setSubAbaDesmanche(key)}
                    style={{ padding: '10px 18px', background: subAbaDesmanche === key ? COR : '#1a1a1a', color: subAbaDesmanche === key ? 'white' : '#888', border: `1px solid ${subAbaDesmanche === key ? COR : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {label}{count !== null ? ` (${count})` : ''}
                  </button>
                ))}
              </div>

              {/* ===== SUB-ABA: VEÍCULOS ===== */}
              {subAbaDesmanche === 'veiculos' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: COR, margin: 0 }}>🚗 Veículos no Desmanche</h3>
                    <button onClick={() => { setMostrarFormVeiculo(true); setEditandoVeiculo(null); setFormVeiculo({ modelo: '', ano: '', cor: '', valorLeilao: '', procedencia: '', patio: '', detalhes: '', fotos: [], status: 'em_desmonte' }); }}
                      style={{ background: COR, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                      + Novo Veículo
                    </button>
                  </div>

                  {/* FORM VEÍCULO */}
                  {mostrarFormVeiculo && (
                    <div style={{ background: '#111', border: `1px solid ${COR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                      <h4 style={{ color: COR, margin: '0 0 16px 0' }}>{editandoVeiculo ? '✏️ Editar Veículo' : '➕ Novo Veículo'}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        {[
                          { key: 'modelo', placeholder: 'Modelo (Ex: Gol 1.0)', label: 'MODELO *' },
                          { key: 'ano', placeholder: 'Ex: 2018', label: 'ANO' },
                          { key: 'cor', placeholder: 'Ex: Prata', label: 'COR' },
                          { key: 'valorLeilao', placeholder: '0,00', label: 'VALOR PAGO (R$)', type: 'number' },
                          { key: 'procedencia', placeholder: 'Ex: Leilão Detran SP', label: 'PROCEDÊNCIA' },
                          { key: 'patio', placeholder: 'Selecionar', label: 'PÁTIO', tipo: 'patio' },
                        ].map(({ key, placeholder, label, type, tipo }) => (
                          <div key={key}>
                            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                            {tipo === 'patio' ? (
                              <select value={formVeiculo[key] || ''} onChange={e => setFormVeiculo(prev => ({ ...prev, [key]: e.target.value }))}
                                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: formVeiculo[key] ? 'white' : '#555', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
                                <option value="">Selecionar pátio...</option>
                                <option value="Pátio 1">📍 Pátio 1</option>
                                <option value="Pátio 2">📍 Pátio 2</option>
                                <option value="Pátio 3">📍 Pátio 3</option>
                                <option value="Pátio 4">📍 Pátio 4</option>
                                <option value="Pátio 5">📍 Pátio 5</option>
                              </select>
                            ) : (
                              <input type={type || 'text'} value={formVeiculo[key] || ''} onChange={e => setFormVeiculo(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={placeholder} style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* DETALHES + MIC */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 DETALHES / ESTADO DO VEÍCULO</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <textarea value={formVeiculo.detalhes || ''} onChange={e => setFormVeiculo(prev => ({ ...prev, detalhes: e.target.value }))}
                            placeholder="Descreva o estado geral, peças disponíveis, observações..." rows={3}
                            style={{ flex: 1, padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', resize: 'none' }} />
                          <button onClick={() => iniciarVozDesmanche(setFormVeiculo, 'detalhes', setOuvindoObsVeiculo)}
                            style={{ background: ouvindoObsVeiculo ? '#ef4444' : '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '20px', cursor: 'pointer' }}>
                            {ouvindoObsVeiculo ? '🔴' : '🎤'}
                          </button>
                        </div>
                      </div>

                      {/* FOTOS CARROSSEL */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📸 FOTOS DO VEÍCULO</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {(formVeiculo.fotos || []).map((foto, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                              <img src={foto} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }} />
                              <button onClick={() => setFormVeiculo(prev => ({ ...prev, fotos: prev.fotos.filter((_, idx) => idx !== i) }))}
                                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>×</button>
                            </div>
                          ))}
                          <button onClick={() => tirarFotosDesmanche(setFormVeiculo, 'fotos')}
                            style={{ width: '80px', height: '80px', background: '#1a1a1a', border: `2px dashed ${COR}`, borderRadius: '8px', color: COR, fontSize: '24px', cursor: 'pointer' }}>+</button>
                        </div>
                        <p style={{ color: '#555', fontSize: '11px', margin: '6px 0 0 0' }}>Selecione várias fotos de uma vez. Deslize para ver todas.</p>
                      </div>

                      {/* STATUS */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>STATUS</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[{ key: 'em_desmonte', label: '🔧 Em desmonte' }, { key: 'desmontado', label: '✅ Desmontado' }, { key: 'encerrado', label: '📦 Encerrado' }].map(s => (
                            <button key={s.key} onClick={() => setFormVeiculo(prev => ({ ...prev, status: s.key }))}
                              style={{ padding: '8px 14px', background: formVeiculo.status === s.key ? COR : '#1a1a1a', color: formVeiculo.status === s.key ? 'white' : '#888', border: `1px solid ${formVeiculo.status === s.key ? COR : '#333'}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={salvarVeiculo} disabled={salvandoVeiculo}
                          style={{ flex: 1, padding: '14px', background: salvandoVeiculo ? '#333' : COR, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {salvandoVeiculo ? '⏳ Salvando...' : '💾 Salvar Veículo'}
                        </button>
                        <button onClick={() => setMostrarFormVeiculo(false)}
                          style={{ padding: '14px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* LISTA DE VEÍCULOS */}
                  {carregandoDesmanche ? (
                    <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>⏳ Carregando...</p>
                  ) : veiculosDesmanche.length === 0 ? (
                    <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                      <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🚗</p>
                      <p style={{ color: '#555', margin: 0 }}>Nenhum veículo cadastrado ainda.<br />Clique em "+ Novo Veículo" para começar.</p>
                    </div>
                  ) : veiculosDesmanche.map(carro => {
                    const pecasCarro = pecasDesmanche.filter(p => p.veiculoId === carro.id);
                    const disponiveis = pecasCarro.filter(p => p.status === 'disponivel').length;
                    const vendidas = pecasCarro.filter(p => p.status === 'vendida').length;
                    const faturado = pecasCarro.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
                    const statusCor = { em_desmonte: '#f97316', desmontado: '#00E676', encerrado: '#666' };
                    return (
                      <div key={carro.id} style={{ background: '#111', border: `1px solid ${carro.publicado ? '#00E67644' : '#333'}`, borderRadius: '14px', marginBottom: '14px', overflow: 'hidden' }}>
                        {/* CARROSSEL DE FOTOS com ZOOM */}
                        {(carro.fotos || []).length > 0 && (
                          <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '4px', background: '#0a0a0a' }}>
                              {carro.fotos.map((foto, i) => (
                                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                                  <img src={foto} style={{ height: '160px', width: '220px', objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in', transition: 'opacity 0.15s' }}
                                    onClick={() => { setLightboxFotos(carro.fotos); setLightboxIdx(i); setLightboxAberto(true); }}
                                    onMouseOver={e => e.target.style.opacity='0.85'}
                                    onMouseOut={e => e.target.style.opacity='1'}
                                  />
                                  <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', color: 'white', pointerEvents: 'none' }}>🔍</div>
                                </div>
                              ))}
                            </div>
                            <p style={{ color: '#555', fontSize: '10px', padding: '4px 8px', background: '#0a0a0a', margin: 0 }}>Clique nas fotos para ampliar com zoom</p>
                          </div>
                        )}
                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                            <div>
                              <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '17px' }}>{carro.modelo} {carro.ano}</h4>
                              <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>🎨 {carro.cor} · 📍 {carro.patio || 'Pátio não definido'} · 🏷️ {carro.procedencia || '-'}</p>
                            </div>
                            <span style={{ background: statusCor[carro.status] + '22', color: statusCor[carro.status], border: `1px solid ${statusCor[carro.status]}44`, padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                              {carro.status === 'em_desmonte' ? '🔧 Em desmonte' : carro.status === 'desmontado' ? '✅ Desmontado' : '📦 Encerrado'}
                            </span>
                          </div>

                          {carro.detalhes && (
                            <p style={{ color: '#aaa', fontSize: '13px', background: '#0a0a0a', padding: '10px', borderRadius: '8px', margin: '0 0 12px 0', lineHeight: '1.5' }}>📝 {carro.detalhes}</p>
                          )}

                          {/* STATS DE PEÇAS */}
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            {[
                              { label: 'Pago', valor: `R$ ${Number(carro.valorLeilao || 0).toLocaleString('pt-BR')}`, cor: '#ef4444' },
                              { label: 'Peças disp.', valor: disponiveis, cor: '#00E676' },
                              { label: 'Vendidas', valor: vendidas, cor: '#f97316' },
                              { label: 'Faturado', valor: `R$ ${faturado.toLocaleString('pt-BR')}`, cor: '#00E676' },
                            ].map(({ label, valor, cor }) => (
                              <div key={label} style={{ background: '#0a0a0a', border: `1px solid ${cor}22`, borderRadius: '8px', padding: '8px 12px', textAlign: 'center' }}>
                                <p style={{ color: '#555', fontSize: '10px', margin: '0 0 2px 0' }}>{label}</p>
                                <p style={{ color: cor, fontSize: '14px', fontWeight: '900', margin: 0 }}>{valor}</p>
                              </div>
                            ))}
                          </div>

                          {/* AÇÕES */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button onClick={() => { setSubAbaDesmanche('pecas'); setFormPeca(prev => ({ ...prev, veiculoId: carro.id, veiculoNome: `${carro.modelo} ${carro.ano}` })); setMostrarFormPeca(true); }}
                              style={{ padding: '8px 14px', background: '#1a1a1a', color: '#00E676', border: '1px solid #00E67644', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                              + Peça
                            </button>
                            <button onClick={() => publicarChegada(carro)}
                              style={{ padding: '8px 14px', background: carro.publicado ? '#1a3a1a' : '#1a1a1a', color: carro.publicado ? '#00E676' : '#25D366', border: `1px solid ${carro.publicado ? '#00E67644' : '#25D36644'}`, borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                              {carro.publicado ? '✅ Publicado' : '📣 Avisar Oficinas'}
                            </button>
                            <button onClick={() => { setEditandoVeiculo(carro.id); setFormVeiculo({ ...carro }); setMostrarFormVeiculo(true); }}
                              style={{ padding: '8px 14px', background: '#1a1a1a', color: '#888', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                              ✏️ Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== SUB-ABA: PEÇAS ===== */}
              {subAbaDesmanche === 'pecas' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ color: COR2, margin: 0 }}>🔩 Peças Cadastradas</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ background: '#00E67622', color: '#00E676', border: '1px solid #00E67644', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                        {pecasDisponiveis} disponíveis
                      </span>
                      <span style={{ background: '#66666622', color: '#888', border: '1px solid #33333344', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                        {pecasVendidas} vendidas
                      </span>
                      <button onClick={() => { setMostrarFormPeca(true); setEditandoPeca(null); setFormPeca({ nome: '', veiculoId: '', veiculoNome: '', preco: '', condicao: 'otima', codigo: '', prateleira: '', fotos: [], status: 'disponivel' }); }}
                        style={{ background: COR2, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                        + Nova Peça
                      </button>
                    </div>
                  </div>

                  {/* BUSCA + FILTRO */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <input value={buscaPeca} onChange={e => setBuscaPeca(e.target.value)} placeholder="🔍 Buscar peça, veículo ou código..."
                      style={{ flex: 1, padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', minWidth: '200px' }} />
                    <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                      style={{ padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px' }}>
                      <option value="todos">Todos</option>
                      <option value="disponivel">Disponíveis</option>
                      <option value="reservada">Reservadas</option>
                      <option value="vendida">Vendidas</option>
                    </select>
                  </div>

                  {/* FORM PEÇA */}
                  {mostrarFormPeca && (
                    <div style={{ background: '#111', border: `1px solid ${COR2}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                      <h4 style={{ color: COR2, margin: '0 0 16px 0' }}>{editandoPeca ? '✏️ Editar Peça' : '➕ Nova Peça'}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        {[
                          { key: 'nome', placeholder: 'Ex: Motor 1.0 completo', label: 'NOME DA PEÇA *' },
                          { key: 'preco', placeholder: '0,00', label: 'PREÇO DE VENDA (R$)', type: 'number' },
                          { key: 'codigo', placeholder: 'Ex: MOT-001', label: 'CÓDIGO / REFERÊNCIA' },
                          { key: 'prateleira', placeholder: 'Ex: Galpão A, Prateleira 3', label: 'LOCALIZAÇÃO NO ESTOQUE' },
                        ].map(({ key, placeholder, label, type }) => (
                          <div key={key}>
                            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                            <input type={type || 'text'} value={formPeca[key] || ''} onChange={e => setFormPeca(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder} style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        ))}
                      </div>

                      {/* VEÍCULO DE ORIGEM */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>VEÍCULO DE ORIGEM</label>
                        <select value={formPeca.veiculoId} onChange={e => { const v = veiculosDesmanche.find(v => v.id === e.target.value); setFormPeca(prev => ({ ...prev, veiculoId: e.target.value, veiculoNome: v ? `${v.modelo} ${v.ano}` : '' })); }}
                          style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px' }}>
                          <option value="">Selecionar veículo...</option>
                          {veiculosDesmanche.map(v => <option key={v.id} value={v.id}>{v.modelo} {v.ano} - {v.cor}</option>)}
                        </select>
                      </div>

                      {/* CONDIÇÃO */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>CONDIÇÃO</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[{ key: 'otima', label: '⭐ Ótima', cor: '#00E676' }, { key: 'boa', label: '👍 Boa', cor: '#f97316' }, { key: 'regular', label: '⚠️ Regular', cor: '#ef4444' }].map(c => (
                            <button key={c.key} onClick={() => setFormPeca(prev => ({ ...prev, condicao: c.key }))}
                              style={{ padding: '8px 14px', background: formPeca.condicao === c.key ? c.cor + '33' : '#1a1a1a', color: formPeca.condicao === c.key ? c.cor : '#888', border: `1px solid ${formPeca.condicao === c.key ? c.cor : '#333'}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* FOTOS DA PEÇA */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📸 FOTOS DA PEÇA</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {(formPeca.fotos || []).map((foto, i) => (
                            <div key={i} style={{ position: 'relative' }}>
                              <img src={foto} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }} />
                              <button onClick={() => setFormPeca(prev => ({ ...prev, fotos: prev.fotos.filter((_, idx) => idx !== i) }))}
                                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>×</button>
                            </div>
                          ))}
                          <button onClick={() => tirarFotosDesmanche(setFormPeca, 'fotos')}
                            style={{ width: '80px', height: '80px', background: '#1a1a1a', border: `2px dashed ${COR2}`, borderRadius: '8px', color: COR2, fontSize: '24px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={salvarPeca} disabled={salvandoPeca}
                          style={{ flex: 1, padding: '14px', background: salvandoPeca ? '#333' : COR2, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {salvandoPeca ? '⏳ Salvando...' : '💾 Salvar Peça'}
                        </button>
                        <button onClick={() => setMostrarFormPeca(false)}
                          style={{ padding: '14px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* LISTA DE PEÇAS */}
                  {pecasFiltradas.length === 0 ? (
                    <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                      <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🔩</p>
                      <p style={{ color: '#555', margin: 0 }}>Nenhuma peça encontrada.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                      {pecasFiltradas.map(peca => {
                        const condCor = { otima: '#00E676', boa: '#f97316', regular: '#ef4444' };
                        const statCor = { disponivel: '#00E676', reservada: '#f97316', vendida: '#666' };
                        return (
                          <div key={peca.id} style={{ background: '#111', border: `1px solid ${statCor[peca.status]}33`, borderRadius: '12px', overflow: 'hidden' }}>
                            {/* CARROSSEL MINI com zoom */}
                            {(peca.fotos || []).length > 0 && (
                              <div style={{ display: 'flex', overflowX: 'auto', background: '#0a0a0a' }}>
                                {peca.fotos.map((foto, i) => (
                                  <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                                    <img src={foto} style={{ height: '130px', width: '180px', objectFit: 'cover', cursor: 'zoom-in' }}
                                      onClick={() => { setLightboxFotos(peca.fotos); setLightboxIdx(i); setLightboxAberto(true); }}
                                    />
                                    <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', color: 'white', pointerEvents: 'none' }}>🔍</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div style={{ padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <h5 style={{ color: 'white', margin: 0, fontSize: '15px' }}>{peca.nome}</h5>
                                <span style={{ background: statCor[peca.status] + '22', color: statCor[peca.status], border: `1px solid ${statCor[peca.status]}44`, padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                  {peca.status === 'disponivel' ? '✅ Disponível' : peca.status === 'reservada' ? '⏳ Reservada' : '📦 Vendida'}
                                </span>
                              </div>
                              <p style={{ color: '#666', fontSize: '11px', margin: '0 0 6px 0' }}>
                                🚗 {peca.veiculoNome || '-'} · <span style={{ color: condCor[peca.condicao] }}>{'⭐ boa regular'.split(' ')[['otima','boa','regular'].indexOf(peca.condicao)]} {peca.condicao}</span>
                              </p>
                              {peca.prateleira && <p style={{ color: '#555', fontSize: '11px', margin: '0 0 6px 0' }}>📦 {peca.prateleira}</p>}
                              {peca.codigo && <p style={{ color: '#555', fontSize: '11px', margin: '0 0 10px 0' }}>🏷️ {peca.codigo}</p>}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ color: '#00E676', fontSize: '20px', fontWeight: '900' }}>
                                  {peca.preco ? `R$ ${Number(peca.preco).toLocaleString('pt-BR')}` : 'Sob consulta'}
                                </span>
                                {peca.status === 'disponivel' && (
                                  <button onClick={() => venderPeca(peca)}
                                    style={{ background: '#00E676', color: 'black', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                                    ✅ Vender
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===== SUB-ABA: CLIENTES ===== */}
              {subAbaDesmanche === 'clientes' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: '#25D366', margin: 0 }}>👥 Clientes do Desmanche</h3>
                    <button onClick={() => setMostrarFormClienteDes(true)}
                      style={{ background: '#25D366', color: 'black', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                      + Novo Cliente
                    </button>
                  </div>

                  {mostrarFormClienteDes && (
                    <div style={{ background: '#111', border: '1px solid #25D36644', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                      <h4 style={{ color: '#25D366', margin: '0 0 16px 0' }}>➕ Novo Cliente</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        {[
                          { key: 'nome', placeholder: 'Nome completo', label: 'NOME *' },
                          { key: 'telefone', placeholder: '(49) 99999-9999', label: 'WHATSAPP' },
                          { key: 'veiculo', placeholder: 'Ex: Gol 2015, Civic 2018...', label: 'VEÍCULO' },
                          { key: 'interesse', placeholder: 'Ex: Motor 1.0, Câmbio...', label: 'PEÇAS QUE BUSCA' },
                        ].map(({ key, placeholder, label }) => (
                          <div key={key}>
                            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                            <input value={formClienteDes[key] || ''} onChange={e => setFormClienteDes(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder} style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        ))}
                      </div>
                      {/* OBSERVAÇÕES + MICROFONE */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📝 OBSERVAÇÕES</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <textarea value={formClienteDes.observacoes || ''} onChange={e => setFormClienteDes(prev => ({ ...prev, observacoes: e.target.value }))}
                            placeholder="Anotações sobre o cliente, urgência, preferências..." rows={3}
                            style={{ flex: 1, padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', resize: 'none' }} />
                          <button onClick={() => {
                            if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
                            const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                            rec.lang = 'pt-BR'; rec.interimResults = false;
                            rec.onresult = e => setFormClienteDes(prev => ({ ...prev, observacoes: (prev.observacoes ? prev.observacoes + ' ' : '') + e.results[0][0].transcript }));
                            rec.start();
                          }} style={{ background: '#333', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '20px', cursor: 'pointer' }}>🎤</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={salvarClienteDes} disabled={salvandoClienteDes}
                          style={{ flex: 1, padding: '14px', background: salvandoClienteDes ? '#333' : '#25D366', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {salvandoClienteDes ? '⏳...' : '💾 Salvar'}
                        </button>
                        <button onClick={() => setMostrarFormClienteDes(false)}
                          style={{ padding: '14px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  {/* ENVIAR CARRO PARA CLIENTE */}
                  {clientesDes.length > 0 && veiculosDesmanche.length > 0 && (
                    <div style={{ background: '#0a1a0a', border: '1px solid #25D36633', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                      <p style={{ color: '#25D366', fontWeight: 'bold', fontSize: '13px', margin: '0 0 12px 0' }}>📲 Enviar chegada para cliente</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <select value={clienteSelecionado?.id || ''} onChange={e => setClienteSelecionado(clientesDes.find(c => c.id === e.target.value) || null)}
                          style={{ flex: 1, padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px' }}>
                          <option value="">Selecionar cliente...</option>
                          {clientesDes.map(c => <option key={c.id} value={c.id}>{c.nome} - {c.interesse || 'sem interesse cadastrado'}</option>)}
                        </select>
                        <select value={carroSelecionado} onChange={e => setCarroSelecionado(e.target.value)}
                          style={{ flex: 1, padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px' }}>
                          <option value="">Selecionar carro...</option>
                          {veiculosDesmanche.map(v => <option key={v.id} value={v.id}>{v.modelo} {v.ano}</option>)}
                        </select>
                        <button
                          onClick={() => {
                            const carro = veiculosDesmanche.find(v => v.id === carroSelecionado);
                            if (carro && clienteSelecionado) {
                              const pecasDoCarroLocal = pecasDesmanche.filter(p => p.veiculoId === carro.id && p.status === 'disponivel');
                              const listaPecas = pecasDoCarroLocal.map(p => `  • ${p.nome}${p.preco ? ` - R$ ${p.preco}` : ''}`).join('\n');
                              const msg = encodeURIComponent(
                                `Olá *${clienteSelecionado.nome}*! 👋\n\n` +
                                `Temos um carro que pode te interessar:\n\n` +
                                `🚗 *${carro.modelo} ${carro.ano || ''}* - ${carro.cor || ''}\n` +
                                `📍 Pátio: ${carro.patio || 'Consultar'}\n\n` +
                                `🔩 *Peças disponíveis:*\n${listaPecas || 'Consultar disponibilidade'}\n\n` +
                                `${carro.detalhes ? `📝 ${carro.detalhes}\n\n` : ''}` +
                                `Interesse? É só responder! ✅\n_${dadosOficina?.nomeOficina || 'Desmanche'}_`
                              );
                              const tel = String(clienteSelecionado.telefone || '').replace(/\D/g, '');
                              if (tel) window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
                            } else { alert('Selecione cliente e carro!'); }
                          }}
                          style={{ background: '#25D366', color: 'black', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          📲 Enviar
                        </button>
                      </div>
                    </div>
                  )}

                  {clientesDes.length === 0 ? (
                    <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                      <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>👥</p>
                      <p style={{ color: '#555', margin: 0 }}>Nenhum cliente cadastrado ainda.</p>
                    </div>
                  ) : clientesDes.map(c => (
                    <div key={c.id} style={{ background: '#111', border: '1px solid #25D36622', borderRadius: '12px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 4px 0' }}>{c.nome}</p>
                        <p style={{ color: '#666', fontSize: '12px', margin: '0 0 2px 0' }}>📱 {c.telefone} {c.veiculo ? `· 🚗 ${c.veiculo}` : ''}</p>
                        {c.interesse && <p style={{ color: '#555', fontSize: '11px', margin: '0 0 2px 0' }}>🔍 {c.interesse}</p>}
                        {c.observacoes && <p style={{ color: '#555', fontSize: '11px', margin: 0, fontStyle: 'italic' }}>📝 {c.observacoes}</p>}
                      </div>
                      {c.telefone && (
                        <a href={`https://wa.me/55${String(c.telefone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          style={{ background: '#25D366', color: 'black', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none' }}>
                          📲 WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

                            {/* ===== SUB-ABA: PARCEIROS ===== */}
              {subAbaDesmanche === 'parceiros' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: '#06b6d4', margin: 0 }}>🔧 Oficinas Parceiras</h3>
                    <button onClick={() => setMostrarFormParc(true)}
                      style={{ background: '#06b6d4', color: 'black', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                      + Nova Oficina
                    </button>
                  </div>
                  <div style={{ background: '#0a1a1a', border: '1px solid #06b6d433', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                    <p style={{ color: '#06b6d4', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                      🔧 As oficinas cadastradas aqui recebem WhatsApp automático toda vez que você publicar uma nova chegada de veículo.
                    </p>
                  </div>

                  {mostrarFormParc && (
                    <div style={{ background: '#111', border: '1px solid #06b6d444', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                      <h4 style={{ color: '#06b6d4', margin: '0 0 16px 0' }}>➕ Nova Oficina Parceira</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                        {[{ key: 'nome', placeholder: 'Nome da Oficina', label: 'OFICINA *' }, { key: 'telefone', placeholder: '(49) 99999-9999', label: 'WHATSAPP' }, { key: 'cidade', placeholder: 'Ex: Chapecó - SC', label: 'CIDADE' }, { key: 'responsavel', placeholder: 'Nome do contato', label: 'RESPONSÁVEL' }].map(({ key, placeholder, label }) => (
                          <div key={key}>
                            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                            <input value={formParc[key]} onChange={e => setFormParc(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={placeholder} style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={salvarParceiro} disabled={salvandoParc}
                          style={{ flex: 1, padding: '14px', background: salvandoParc ? '#333' : '#06b6d4', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {salvandoParc ? '⏳...' : '💾 Salvar Parceiro'}
                        </button>
                        <button onClick={() => setMostrarFormParc(false)}
                          style={{ padding: '14px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  {parceiros.length === 0 ? (
                    <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                      <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🔧</p>
                      <p style={{ color: '#555', margin: 0 }}>Nenhuma oficina parceira ainda.<br />Adicione as oficinas que devem receber alertas de novas chegadas.</p>
                    </div>
                  ) : parceiros.map(p => (
                    <div key={p.id} style={{ background: '#111', border: '1px solid #06b6d422', borderRadius: '12px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 4px 0' }}>🔧 {p.nome}</p>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>📱 {p.telefone} · 📍 {p.cidade} {p.responsavel ? `· 👤 ${p.responsavel}` : ''}</p>
                      </div>
                      {p.telefone && (
                        <a href={`https://wa.me/55${String(p.telefone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          style={{ background: '#25D366', color: 'black', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none' }}>
                          📲 WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ===== SUB-ABA: BUSCAR PEÇAS ===== */}
              {subAbaDesmanche === 'busca_pecas' && (() => {
                const iniciarVozBusca = () => {
                  if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
                  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                  rec.lang = 'pt-BR'; rec.interimResults = false;
                  setOuvindoBuscaPeca(true);
                  rec.onresult = e => setBuscaPecaVoz(prev => (prev + ' ' + e.results[0][0].transcript).trim());
                  rec.onerror = () => setOuvindoBuscaPeca(false);
                  rec.onend = () => setOuvindoBuscaPeca(false);
                  rec.start();
                };

                const termoBusca = (buscaPecaVoz || '').toLowerCase().trim();
                const pecasFiltradas = pecasDesmanche.filter(p => {
                  if (!termoBusca) return true;
                  return (
                    p.nome?.toLowerCase().includes(termoBusca) ||
                    p.codigo?.toLowerCase().includes(termoBusca) ||
                    p.veiculoNome?.toLowerCase().includes(termoBusca) ||
                    p.prateleira?.toLowerCase().includes(termoBusca) ||
                    p.condicao?.toLowerCase().includes(termoBusca)
                  );
                });

                const patioFiltro = ['Todos', 'Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'];
                const pecasPorPatio = pecasFiltradas.filter(p => {
                  if (patioSel === 'Todos') return true;
                  const veiculo = veiculosDesmanche.find(v => v.id === p.veiculoId);
                  return veiculo?.patio === patioSel;
                });

                return (
                  <div>
                    <h3 style={{ color: COR, margin: '0 0 16px 0' }}>🔍 Buscar Peças no Desmanche</h3>

                    {/* Campo de busca + voz */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input
                        value={buscaPecaVoz}
                        onChange={e => setBuscaPecaVoz(e.target.value)}
                        placeholder="Digite o nome da peça, código, veículo..."
                        style={{ flex: 1, padding: '14px', background: '#111', border: `2px solid ${COR}55`, color: 'white', borderRadius: '10px', fontSize: '14px' }}
                      />
                      <button onClick={iniciarVozBusca}
                        style={{ background: ouvindoBuscaPeca ? '#ef4444' : '#1a1a1a', color: 'white', border: `1px solid ${ouvindoBuscaPeca ? '#ef4444' : '#333'}`, borderRadius: '10px', padding: '0 18px', fontSize: '22px', cursor: 'pointer', minWidth: '56px' }}>
                        {ouvindoBuscaPeca ? '🔴' : '🎤'}
                      </button>
                      {buscaPecaVoz && (
                        <button onClick={() => setBuscaPecaVoz('')}
                          style={{ background: '#1a1a1a', color: '#888', border: '1px solid #333', borderRadius: '10px', padding: '0 14px', fontSize: '13px', cursor: 'pointer' }}>
                          ✕ Limpar
                        </button>
                      )}
                    </div>

                    {/* Filtro por pátio */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {patioFiltro.map(p => (
                        <button key={p} onClick={() => setPatioSel(p)}
                          style={{ padding: '6px 12px', background: patioSel === p ? COR : '#111', color: patioSel === p ? 'white' : '#666', border: `1px solid ${patioSel === p ? COR : '#333'}`, borderRadius: '16px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                          {p === 'Todos' ? '📦 Todos' : `📍 ${p}`}
                        </button>
                      ))}
                    </div>

                    {/* Resultado */}
                    <p style={{ color: '#444', fontSize: '11px', margin: '0 0 12px 0' }}>
                      {termoBusca || patioSel !== 'Todos'
                        ? `${pecasPorPatio.length} peça(s) encontrada(s)${termoBusca ? ` para "${buscaPecaVoz}"` : ''}${patioSel !== 'Todos' ? ` no ${patioSel}` : ''}`
                        : `Total: ${pecasDesmanche.length} peça(s) cadastrada(s)`}
                    </p>

                    {pecasPorPatio.length === 0 ? (
                      <div style={{ background: '#111', border: '1px dashed #222', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
                        <p style={{ fontSize: '36px', margin: '0 0 8px 0' }}>🔍</p>
                        <p style={{ color: '#444', margin: 0, fontSize: '13px' }}>
                          {termoBusca ? `Nenhuma peça encontrada para "${buscaPecaVoz}".` : 'Nenhuma peça cadastrada ainda.'}<br />
                          {!termoBusca && 'Cadastre peças na sub-aba 🔩 Peças.'}
                        </p>
                      </div>
                    ) : pecasPorPatio.map(p => {
                      const veic = veiculosDesmanche.find(v => v.id === p.veiculoId);
                      const corCond = p.condicao === 'otima' ? '#00E676' : p.condicao === 'boa' ? '#eab308' : p.condicao === 'regular' ? '#f97316' : '#ef4444';
                      return (
                        <div key={p.id} style={{ background: '#111', border: `1px solid ${COR}22`, borderRadius: '12px', marginBottom: '10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', gap: '0' }}>
                            {/* Foto */}
                            {(p.fotos || p.foto) ? (
                              <img src={(p.fotos && p.fotos[0]) || p.foto} style={{ width: '90px', height: '90px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '90px', height: '90px', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#333', fontSize: '28px' }}>🔩</div>
                            )}
                            <div style={{ padding: '10px 14px', flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div>
                                  <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 3px 0', fontSize: '14px' }}>{p.nome}</p>
                                  {p.veiculoNome && <p style={{ color: '#666', fontSize: '11px', margin: '0 0 3px 0' }}>🚗 {p.veiculoNome}</p>}
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {p.codigo && <span style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '2px 7px', borderRadius: '5px', fontSize: '10px' }}>#{p.codigo}</span>}
                                    {p.prateleira && <span style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', padding: '2px 7px', borderRadius: '5px', fontSize: '10px' }}>📦 {p.prateleira}</span>}
                                    {veic?.patio && <span style={{ background: '#1a0000', border: `1px solid ${COR}33`, color: COR, padding: '2px 7px', borderRadius: '5px', fontSize: '10px' }}>📍 {veic.patio}</span>}
                                    <span style={{ background: corCond + '22', border: `1px solid ${corCond}44`, color: corCond, padding: '2px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', textTransform: 'capitalize' }}>{p.condicao || 'ótima'}</span>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <p style={{ color: '#00E676', fontWeight: 'bold', margin: '0 0 6px 0', fontSize: '15px' }}>R$ {parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}</p>
                                  <span style={{ background: p.status === 'vendida' ? '#1a1a1a' : '#0a1a0a', border: `1px solid ${p.status === 'vendida' ? '#333' : '#00E67644'}`, color: p.status === 'vendida' ? '#555' : '#00E676', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' }}>
                                    {p.status === 'vendida' ? 'VENDIDA' : 'DISPONÍVEL'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          );
        })()}

        {/* ===== FORNECEDORES - visão da oficina ===== */}
        {abaAtiva === 'fornecedores' && (() => {
          const COR = '#f97316';
          return (
            <div>
              <div style={{ background: 'linear-gradient(135deg, #1a0d00, #0d0d0d)', border: `1px solid ${COR}44`, borderRadius: '16px', padding: '22px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ color: 'white', margin: '0 0 4px 0' }}>🏪 <span style={{ color: COR }}>Fornecedores</span> - Lojas de Peças</h2>
                    <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Lojas parceiras para pedido de peças novas via WhatsApp</p>
                  </div>
                  <button onClick={() => { setMostrarFormFornecedor(true); setFormFornecedor({ nome: '', telefone: '', especialidade: '', cidade: '', contato: '', obs: '' }); }}
                    style={{ background: COR, color: 'white', border: 'none', borderRadius: '8px', padding: '12px 20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                    + Novo Fornecedor
                  </button>
                </div>
              </div>
              {mostrarFormFornecedor && (
                <div style={{ background: '#111', border: `1px solid ${COR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ color: COR, margin: '0 0 16px 0' }}>➕ Novo Fornecedor</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    {[
                      { key: 'nome', label: 'NOME DA LOJA *', placeholder: 'Ex: Peças Boa Vista' },
                      { key: 'telefone', label: 'WHATSAPP / TELEFONE', placeholder: '(49) 99999-9999' },
                      { key: 'especialidade', label: 'ESPECIALIDADE', placeholder: 'Ex: Elétrica, Suspensão, Geral...' },
                      { key: 'cidade', label: 'CIDADE', placeholder: 'Ex: Chapecó - SC' },
                      { key: 'contato', label: 'NOME DO CONTATO', placeholder: 'Ex: João' },
                      { key: 'obs', label: 'OBSERVAÇÕES', placeholder: 'Prazo, desconto, condições...' },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                        <input value={formFornecedor[key] || ''} onChange={e => setFormFornecedor(p => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={salvarFornecedor} disabled={salvandoFornecedor}
                      style={{ flex: 1, padding: '14px', background: salvandoFornecedor ? '#333' : COR, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {salvandoFornecedor ? '⏳ Salvando...' : '💾 Salvar'}
                    </button>
                    <button onClick={() => setMostrarFormFornecedor(false)}
                      style={{ padding: '14px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </div>
              )}
              <input value={buscaFornecedor} onChange={e => setBuscaFornecedor(e.target.value)}
                placeholder="🔍 Buscar fornecedor, especialidade ou cidade..."
                style={{ width: '100%', padding: '12px', background: '#111', border: `1px solid ${COR}33`, color: 'white', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box' }} />
              {listaFornecedores.length === 0 ? (
                <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '50px', textAlign: 'center' }}>
                  <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🏪</p>
                  <p style={{ color: '#555', margin: 0 }}>Nenhum fornecedor cadastrado ainda.<br />Adicione as lojas de peças que você compra.</p>
                </div>
              ) : listaFornecedores
                  .filter(f => !buscaFornecedor || f.nome?.toLowerCase().includes(buscaFornecedor.toLowerCase()) || f.especialidade?.toLowerCase().includes(buscaFornecedor.toLowerCase()) || f.cidade?.toLowerCase().includes(buscaFornecedor.toLowerCase()))
                  .map(f => (
                <div key={f.id} style={{ background: '#111', border: `1px solid ${COR}22`, borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '16px' }}>🏪 {f.nome}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                        {f.especialidade && <span style={{ background: COR + '22', color: COR, border: `1px solid ${COR}44`, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>{f.especialidade}</span>}
                        {f.cidade && <span style={{ color: '#666', fontSize: '12px' }}>📍 {f.cidade}</span>}
                        {f.contato && <span style={{ color: '#666', fontSize: '12px' }}>👤 {f.contato}</span>}
                      </div>
                      {f.telefone && <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px 0' }}>📱 <strong style={{ color: 'white' }}>{f.telefone}</strong></p>}
                      {f.obs && <p style={{ color: '#555', fontSize: '11px', margin: 0, fontStyle: 'italic' }}>📝 {f.obs}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {f.telefone && (
                        <>
                          <a href={`https://wa.me/55${String(f.telefone).replace(/\D/g, '')}?text=${encodeURIComponent('Olá *' + (f.contato||f.nome) + '*! 🔧\n\nSou da *' + (dadosOficina?.nomeOficina||'Oficina') + '* e preciso de um orçamento:\n\nPeça: \nVeículo: \nQuantidade: \n\nAguardo retorno! ✅')}`}
                            target="_blank" rel="noreferrer"
                            style={{ background: '#25D366', color: 'black', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none', textAlign: 'center' }}>
                            📲 Pedir Orçamento
                          </a>
                          <a href={`tel:${String(f.telefone).replace(/\D/g, '')}`}
                            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none', textAlign: 'center' }}>
                            📞 Ligar
                          </a>
                        </>
                      )}
                      <button onClick={() => excluirFornecedor(f.id)}
                        style={{ background: 'transparent', color: '#444', border: '1px solid #333', borderRadius: '8px', padding: '6px', fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ===== AJUDA ===== */}
        {abaAtiva === 'ajuda' && (
          <div>
            <div style={{ background: 'linear-gradient(145deg, #111, #1a1a1a)', padding: '25px', borderRadius: '10px', border: `1px solid ${TAB_COLORS.ajuda}`, marginBottom: '30px', boxShadow: `0px 10px 20px ${TAB_COLORS.ajuda}22` }}>
              <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '22px' }}>O Futuro da sua Oficina chegou! 🚀</h2>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                O <strong>Oficina IA</strong> é o seu gestor inteligente. Cada aba tem uma cor - clique abaixo para entender o que cada uma faz.
              </p>
            </div>
            <h2 style={{ color: TAB_COLORS.ajuda, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>📚 Manual Completo - Clique para expandir</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>

              {[
                { aba: 'dashboard', icon: '📊', titulo: 'VISÃO GERAL - O resumo do seu dia', conteudo: [
                  '👉 Primeira tela ao entrar. Mostra tudo de relance.',
                  '💰 Caixa de ganhos: total do dia/semana/mês.',
                  '🔴 Alerta vermelho: peça no estoque abaixo de 3 unidades.',
                  '🏅 Caixa dourada: clientes com óleo vencendo nos próximos dias.',
                  '📋 Histórico de O.S.: todas as ordens de serviço recentes com botões de ação.',
                ]},
                { aba: 'os', icon: '🔧', titulo: 'O.S. - Nova Ordem de Serviço', conteudo: [
                  '👉 Use para qualquer serviço que NÃO seja óleo, alinhamento, pneu ou revisão.',
                  '📝 Preencha: cliente, placa, modelo e defeito relatado.',
                  '🎤 Todos os campos aceitam ditado por voz (botão do microfone).',
                  '💾 Ao salvar, a O.S. entra no histórico e pode ser enviada ao cliente.',
                  '🔑 SENHA DO PORTAL DO CLIENTE: ao criar a O.S., defina uma senha de 4 dígitos para o cliente acompanhar o serviço.',
                  '📱 O cliente acessa em oficina-express-ia.netlify.app → Portal Cliente → digita a Placa + a senha que você definiu.',
                  '⚠️ Dica: para óleo use ÓLEO, para alinhamento use ALINHAMENTO. Cada aba tem checklist específico!',
                ]},
                { aba: 'oficina', icon: '🏢', titulo: 'MECÂNICA - Checklist Profissional por Especialidade', conteudo: [
                  '👉 Módulo completo para registrar O.S. com checklist visual profissional.',
                  '🔧 Mecânica Geral: motor, câmbio, freios, suspensão e elétrico.',
                  '🏍️ Motos: checklist específico para motocicletas.',
                  '🚗 Lataria & Acabamento: funilaria, pintura, vidros e interior.',
                  '🛢️ Amortecedores: diagnóstico por posição (DE, DD, TE, TD) com status visual.',
                  '📷 Adicione fotos em cada O.S. para documentar o defeito.',
                  '💰 Campo de valor do serviço integrado com total automático.',
                  '✏️ Para editar uma O.S. já salva, clique em "✏️ Editar" na lista.',
                ]},
                { aba: 'injecao', icon: '⚡', titulo: 'INJEÇÃO - Diagnóstico Eletrônico Completo', conteudo: [
                  '👉 Módulo exclusivo para diagnóstico de injeção eletrônica.',
                  '🔌 Scanner & DTC: consulte códigos de falha (P0300, P0171, etc) com explicação automática.',
                  '⛽ Alimentação & Sensores: checklist completo de bomba, injetores, TBI, sensor lambda, MAP/MAF/TPS.',
                  '🧠 Central Eletrônica: estado da ECU, aterramento, atualização de firmware.',
                  '🏍️ Motos: diagnóstico específico para motocicletas com CDI, carburador, vela e relação.',
                  '🔧 Mecânica Geral: complemento mecânico integrado ao diagnóstico eletrônico.',
                  '📸 Fotos do scanner: documente os códigos e evidências.',
                  '🤖 IA Assistente: botão direto para o Copiloto consultar qualquer código de falha.',
                  '💾 Ao salvar, a O.S. de injeção entra no histórico com todos os dados do diagnóstico.',
                ]},
                { aba: 'oleo', icon: '🛢️', titulo: 'ÓLEO - Troca de Óleo Inteligente', conteudo: [
                  '👉 Registra troca de óleo E já agenda o retorno automático.',
                  '🚗 CARRO / 🚛 PESADO: vencimento em 180 dias.',
                  '🏍️ MOTO: vencimento em 90 dias.',
                  '✅ KIT NORMAL: óleo sintético + filtro, próxima KM +10.000km.',
                  '⚠️ KIT SEVERO: uso intenso, próxima KM +7.500km.',
                  '➕ Serviços adicionais: Óleo Câmbio, Filtro Ar, Filtro Cabine, etc - cada extra aumenta o ticket!',
                  '📸 Foto do painel: tire foto do odômetro, a IA lê o KM automaticamente.',
                  '🔄 Após salvar, o cliente aparece na aba RETORNO para controle de vencimento.',
                  '🔑 SENHA DO PORTAL: defina uma senha de 4 dígitos na O.S. para o cliente acompanhar o serviço e o histórico pelo portal.',
                ]},
                { aba: 'alinhamento', icon: '⚙️', titulo: 'ALINHAMENTO - Geometria e Balanceamento', conteudo: [
                  '👉 Registre serviços de suspensão e geometria com agilidade.',
                  '🖱️ Selecione os serviços com um clique (Alinhamento, Balanceamento, Caster, etc).',
                  '🛞 Marque o estado dos pneus do cliente.',
                  '🤖 IA do Laudo: tire foto da tela do computador de alinhamento 3D ou do laudo impresso. O Gemini lê os ângulos e gera um resumo técnico para WhatsApp!',
                  '💰 Valor Peças + Mão de Obra com total em destaque.',
                  '✏️ Para editar, clique em "⚙️ Editar Alin." na lista de O.S.',
                ]},
                { aba: 'revisao', icon: '🛡️', titulo: 'REVISÃO PREVENTIVA - Check-up com IA', conteudo: [
                  '👉 Faça um check-up completo do veículo com checklist visual.',
                  '✅ / ⚠️ / 🚨 Marque cada item como Bom, Atenção ou Trocar.',
                  '🎤 Relato do Mecânico: dite o que encontrou por voz.',
                  '🤖 Gerar Diagnóstico: a IA cruza o checklist + KM + relato e cria um texto persuasivo para enviar ao cliente.',
                  '💰 Campo de valor do serviço integrado.',
                  '✏️ Para editar, clique em "🛡️ Editar Rev." na lista de O.S.',
                ]},
                { aba: 'pneus', icon: '🛞', titulo: 'PNEUS E BORRACHARIA - Consertos e Vendas', conteudo: [
                  '👉 Módulo focado em reparos rápidos e venda de pneus.',
                  '🔧 Borracharia: selecione os serviços (Remendo, Vulcanização, Válvula, etc) com um clique.',
                  '💰 VALOR DO SERVIÇO: campo em destaque para cobrar o remendo/conserto.',
                  '🛒 Venda de Pneus: informe modelo, quantidade e valor unitário. O total é calculado automaticamente.',
                  '📸 Scanner IA: tire foto do sulco do pneu, a IA analisa o desgaste (TWI) e avisa se precisa trocar.',
                  '✏️ Para editar, clique em "🛞 Editar Pneu" na lista de O.S.',
                ]},
                { aba: 'copiloto', icon: '👨‍🔧', titulo: 'COPILOTO TÉCNICO - IA para Mecânica', conteudo: [
                  '👉 Assistente mecânico com IA real - não é um chatbot genérico, é treinado para mecânica.',
                  '⌨️ Modo Digitar/Voz: escreva ou dite sua dúvida (código OBD, torque, ponto de ignição, etc).',
                  '📸 Modo Foto: tire foto de uma peça, código no scanner, etiqueta, fusível ou defeito visível. A IA analisa e responde.',
                  '🎥 Modo Vídeo (Gemini ao vivo): abra o Gemini no celular, ative a câmera e aponte para o defeito em tempo real - barulho na suspensão, vazamento, motor falhando. A IA vê e responde pelo áudio!',
                  '💡 Exemplos rápidos: clique nos botões P0420, Torque EA111, Ponto GM 1.4 para preencher automaticamente.',
                  '⚡ Dica pro: para barulhos difíceis, use o Modo Vídeo. Já diagnosticamos vários defeitos que o scanner não pegava!',
                ]},
                { aba: 'retorno', icon: '🔄', titulo: 'RETORNO - Gestão de Vencimentos', conteudo: [
                  '👉 Fidelização automática. O sistema monitora todos os clientes.',
                  '🔴 VENCIDO: prazo passou. Envie mensagem urgente.',
                  '🚨 URGENTE (≤7 dias): falta menos de 1 semana. Mensagem com kit pronta.',
                  '⚠️ AVISO (≤15 dias): contato preventivo para agendar.',
                  '📅 AGENDADO: horário marcado, confirmação enviada.',
                  '💵 Faturamento Previsto: mostra quanto dinheiro está "na mesa" para converter.',
                ]},
                { aba: 'estoque', icon: '📦', titulo: 'ESTOQUE - Peças e Produtos', conteudo: [
                  '👉 Cadastre peças de alto giro.',
                  '[-] Botão para descontar do estoque a cada uso.',
                  '🔴 Alerta automático na Visão Geral quando estoque chega a 3 unidades ou menos.',
                  '📊 Controle por categoria e valor de custo.',
                ]},
                { aba: 'financeiro', icon: '💰', titulo: 'FINANCEIRO - O Caixa', conteudo: [
                  '👉 Controle completo de entradas e saídas.',
                  '✅ Entradas: geradas automaticamente ao finalizar O.S. com "Cobrar PIX".',
                  '➖ Saídas/Despesas: cadastradas manualmente (aluguel, peças, etc).',
                  '📊 Gráfico de lucro líquido por período.',
                  '💰 LANÇAMENTO RÁPIDO: toque no botão amarelo 💰 CAIXA no canto inferior esquerdo da tela - funciona em qualquer aba, sem precisar navegar.',
                  '🎤 O campo de descrição tem microfone: fale o nome do serviço ou despesa em vez de digitar.',
                  '📋 Escolha o tipo (Entrada ou Despesa), valor e forma de pagamento e lance em segundos.',
                  '📊 VISÃO GERAL: o card amarelo "A RECEBER" mostra o total das O.S. pendentes. O "FATURAMENTO DO MÊS" mostra só o dinheiro já confirmado como pago.',
                ]},
                { aba: 'leads', icon: '👥', titulo: 'CLIENTES - Leads e Funil de Vendas', conteudo: [
                  '👉 Transforme contatos em clientes com funil de vendas visual.',
                  '📋 Cole uma lista de clientes em texto OU use a câmera. A IA extrai nome e telefone automaticamente.',
                  '🟢 Botão flutuante 👥 na tela: captura novo cliente rapidamente a qualquer momento.',
                  '📱 Mova os cards entre as etapas do funil (Lead → Contato → Fechado).',
                  '🚦 SEMÁFORO DE RELACIONAMENTO: cada cliente tem uma cor baseada no tempo desde a última O.S.',
                  '🟢 Verde - último serviço há menos de 30 dias. Cliente ativo, tudo bem.',
                  '🟡 Amarelo - 31 a 90 dias sem contato. Vale mandar um "oi".',
                  '🟠 Laranja - 91 a 180 dias. Cliente em risco de ir para a concorrência.',
                  '🔴 Vermelho - mais de 180 dias. Contato urgente! Use o botão 📲 WhatsApp na linha do cliente - a mensagem já vem pronta.',
                  '💡 Dica: comece pelos vermelhos toda semana. Reativar um cliente antigo é mais barato do que conquistar um novo.',
                ]},
                { aba: 'equipe', icon: '👥', titulo: 'EQUIPE - Funcionários e Acessos', conteudo: [
                  '👉 Cadastre funcionários com e-mail e senha próprios.',
                  '🔐 Defina quais abas cada um pode acessar (controle de permissões).',
                  '📲 "Despachar Tarefa": envia a O.S. do cliente direto para o WhatsApp do mecânico.',
                  '🧰 Auditar Mala (IA): foto da caixa de ferramentas → IA verifica se está completa.',
                ]},
                { aba: 'patrimonio', icon: '🏢', titulo: 'PATRIMÔNIO - Bens e Equipamentos', conteudo: [
                  '👉 Registro visual do patrimônio da oficina.',
                  '📸 Cadastre equipamentos com foto (elevador, compressor, scanner, etc).',
                  '💼 Controle de investimento: valor e data de aquisição.',
                  '🛡️ Evita perdas e ajuda no controle do seu ativo.',
                ]},
                { aba: 'config', icon: '⚙️', titulo: 'CONFIG - Configurações da Oficina', conteudo: [
                  '👉 Personalize o sistema com as informações da sua oficina.',
                  '🏢 Nome e logo: coloque o nome e o logotipo da sua empresa - aparece no topo do sistema e no recibo.',
                  '📍 Endereço e telefone: exibidos automaticamente no rodapé do recibo impresso.',
                  '🔑 CNPJ / NIF: aparece no recibo para identificação fiscal.',
                  '💰 Chave PIX: a chave que aparece no botão "Cobrar PIX" ao finalizar uma O.S. Configure aqui para não precisar digitar sempre.',
                  '🛡️ Tempo de Garantia: defina quantos dias de garantia a oficina oferece. Esse texto aparece no rodapé do recibo automaticamente.',
                  '🎨 Dica: mantenha essas informações sempre atualizadas - elas aparecem em tudo que o cliente recebe!',
                ]},
                { aba: 'assinatura', icon: '💎', titulo: 'MEU PLANO - Assinatura', conteudo: [
                  '👉 Escolha como usar o Oficina IA.',
                  '🆓 Trial: primeiros dias com acesso livre a tudo.',
                  '☑️ Marque os módulos que quer manter (ex: Pneus, IA, Revisão).',
                  '💲 Valor calculado automaticamente conforme módulos selecionados.',
                  '📅 ANUAL: ganhe 2 meses grátis!',
                ]},
                { aba: 'marketing', icon: '📣', titulo: 'MARKETING - Cresça com Inteligência', conteudo: [
                  '👉 Serviços de marketing digital especializados para oficinas mecânicas. Contrate o que precisar, quando precisar.',
                  '🎯 Tráfego Pago: anúncios no Google e Instagram que trazem clientes novos todos os dias. Você define o orçamento de mídia - nós cuidamos de criar, testar e otimizar tudo.',
                  '📍 Google Meu Negócio: apareça em destaque quando alguém pesquisar "oficina perto de mim". É o marketing mais barato e eficiente para negócios locais.',
                  '🌐 Criação de Site: site profissional com domínio, hospedagem e integração com WhatsApp. Funciona como vendedor 24h - mesmo quando você está dormindo.',
                  '🤖 Automação de Atendimento: bot inteligente no WhatsApp que responde clientes automaticamente, manda orçamentos, agenda serviços e reativa clientes inativos - sem você fazer nada.',
                  '📱 Gestão de Redes Sociais: posts profissionais no Instagram e Facebook. Conteúdo que gera confiança local e mantém sua oficina sempre presente na mente dos clientes.',
                  '🎨 Criação de Conteúdo: artes, vídeos curtos e stories prontos. Sua oficina com visual profissional sem precisar entender de design.',
                  '🔍 SEO Local: apareça no Google organicamente para buscas da sua cidade - resultado de longo prazo que não depende de anúncios.',
                  '📊 Relatório Mensal: transparência total - quantos clientes vieram de cada canal, quanto custou cada um, o que está funcionando. Você sabe exatamente onde seu dinheiro está indo.',
                  '💡 Dica: comece pelo Google Meu Negócio + Tráfego Pago. É a combinação que mais traz resultado rápido para oficinas.',
                ]},
                { aba: 'desmanche', icon: '🚗', titulo: 'DESMANCHE - Gestão de Veículos e Peças', conteudo: [
                  '⚠️ MÓDULO INDEPENDENTE: o Desmanche é um negócio completamente separado da oficina. Tem seus próprios clientes, peças, financeiro e parceiros - nenhum dado aparece nas O.S. normais. São dois negócios no mesmo app, sem misturar nada.',
                  '🚗 Veículos: cadastre cada carro chegado com fotos em carrossel (várias de uma vez), modelo, ano, cor, valor do leilão, procedência, pátio e detalhes por 🎤 microfone ou texto.',
                  '🔩 Peças: cadastre com foto, código, prateleira, condição (ótima/boa/regular) e veículo de origem. Busca rápida por nome, veículo ou código.',
                  '📣 Publicar Chegada: ao publicar, avisa por WhatsApp todas as oficinas parceiras E publica no feed delas dentro do app (aba 🔩 FORNECEDORES). Elas veem fotos, peças e entram em contato.',
                  '👥 Clientes próprios: cadastro de clientes do desmanche com campo de interesse. Envio rápido - seleciona cliente + carro → WhatsApp com mensagem completa.',
                  '🔧 Oficinas Parceiras: você controla quem tem acesso ao seu catálogo. Nome, telefone, cidade e responsável.',
                  '💰 Financeiro integrado: venda de peça lança automaticamente no Financeiro com valor e descrição.',
                ]},
                { aba: 'fornecedores', icon: '🔩', titulo: 'FORNECEDORES - Peças de Desmanche (visão da oficina)', conteudo: [
                  '👉 Esta aba é EXCLUSIVA da oficina mecânica. Aqui você vê os carros e peças disponíveis dos desmanches que te cadastraram como parceiro.',
                  '🔴 Badge vermelho: quando aparecer um número vermelho no botão FORNECEDORES, significa que chegou uma nova publicação de algum desmanche parceiro.',
                  '🔒 100% separado: os dados aqui pertencem aos desmanches parceiros. Nenhuma informação sua (clientes, O.S., financeiro) é compartilhada com eles automaticamente.',
                  '📢 Feed de Chegadas: veja os carros publicados com fotos em carrossel, modelo, pátio, data de chegada e peças disponíveis.',
                  '🔩 Catálogo de Peças: aba com todas as peças disponíveis de todos os desmanches parceiros. Busque por nome, carro ou código.',
                  '📲 Tenho Interesse / Quero essa: clique e o WhatsApp abre com mensagem formatada direto para o desmanche.',
                  '💡 Como aparecer aqui: entre em contato com um desmanche que usa o Oficina IA e peça para te cadastrar como oficina parceira.',
                ]},
              ].map(({ aba, icon, titulo, conteudo }) => (
                <details key={aba} style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid ${TAB_COLORS[aba] || '#333'}22`, cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 'bold', color: TAB_COLORS[aba] || 'white', fontSize: '15px', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: (TAB_COLORS[aba] || '#333') + '22', padding: '3px 8px', borderRadius: '5px', fontSize: '13px' }}>{icon}</span>
                    {titulo}
                    {videosAjudaAdmin[aba] && (
                      <a
                        href={videosAjudaAdmin[aba]}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ marginLeft: 'auto', background: '#ff0000', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                      >
                        ▶ Ver Vídeo
                      </a>
                    )}
                  </summary>
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {conteudo.map((linha, i) => (
                      <p key={i} style={{ color: '#bbb', fontSize: '13px', lineHeight: '1.6', margin: 0, paddingLeft: '10px', borderLeft: `2px solid ${TAB_COLORS[aba] || '#333'}44` }}>{linha}</p>
                    ))}
                  </div>
                </details>
              ))}

            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL RECIBO ===== */}
      {reciboParaImprimir && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', color: 'black', width: '100%', maxWidth: '380px', padding: '30px', fontFamily: 'monospace', boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '15px', marginBottom: '15px' }}>
              {config.logoUrl && <img src={config.logoUrl} style={{ maxWidth: '140px', maxHeight: '70px', marginBottom: '10px', filter: 'grayscale(1)' }} />}
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{config.nome || 'OFICINA IA'}</h2>
              {config.cnpj && <p style={{ margin: '2px 0', fontSize: '11px' }}>CNPJ/NIF: {config.cnpj}</p>}
              <p style={{ margin: '2px 0', fontSize: '11px' }}>{config.endereco || ''}</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}>TEL: {config.telefone || ''}</p>
            </div>
            <h3 style={{ textAlign: 'center', fontSize: '14px', margin: '0 0 15px 0' }}>*** ORDEM DE SERVIÇO ***</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DATA:</span><strong>{String(reciboParaImprimir.data || '').split(',')[0]}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>O.S Nº:</span><strong>#{reciboParaImprimir.id?.slice(-5).toUpperCase()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', padding: '5px 0', borderTop: '1px dotted #ccc', borderBottom: '1px dotted #ccc' }}>
                <span>CLIENTE:</span><strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>{reciboParaImprimir.nomeCliente || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PLACA:</span><strong style={{ fontSize: '16px' }}>{reciboParaImprimir.placa}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VEÍCULO:</span><strong>{reciboParaImprimir.modelo}</strong></div>
              {reciboParaImprimir.kmAtual && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>KM:</span><strong>{Number(reciboParaImprimir.kmAtual).toLocaleString()} km</strong></div>}
            </div>
            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', marginBottom: '15px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '11px' }}>SERVIÇO:</p>
              <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{reciboParaImprimir.checklist || 'Nenhum'}</p>
              {reciboParaImprimir.detalhesPecas && <><p style={{ fontWeight: 'bold', margin: '10px 0 5px 0', fontSize: '11px' }}>PEÇAS:</p><p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{reciboParaImprimir.detalhesPecas}</p></>}
            </div>
            {reciboParaImprimir.fotos?.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '11px', textAlign: 'center' }}>FOTOS DO SERVIÇO</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {reciboParaImprimir.fotos.map((f, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <img src={f.foto} style={{ width: '100%', height: '80px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '4px' }} />
                      {f.legenda && <p style={{ margin: '4px 0 0 0', fontSize: '9px', lineHeight: '1.2', fontWeight: 'bold', color: '#333' }}>{f.legenda}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', marginTop: '15px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>TOTAL:</span>
              <span style={{ fontSize: '22px', fontWeight: '900' }}>{formatarMoeda(reciboParaImprimir.total)}</span>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '15px' }}>
              <p style={{ fontSize: '10px', margin: '0 0 10px 0' }}>{config.garantia || 'Garantia de 90 dias.'}</p>
              {config.pixKey && (
                <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 4px 0' }}>PAGAMENTO VIA PIX</p>
                  <p style={{ fontSize: '13px', margin: 0, wordBreak: 'break-all' }}><strong>{config.pixKey}</strong></p>
                </div>
              )}
              <p style={{ fontSize: '11px', marginTop: '5px', letterSpacing: '4px', fontWeight: 'bold' }}>* OBRIGADO *</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '15px', background: 'black', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ IMPRIMIR RECIBO</button>
              <button onClick={() => setReciboParaImprimir(null)} style={{ padding: '15px 20px', background: 'white', color: 'black', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}>FECHAR</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ BOTÃO FLUTUANTE FINANCEIRO - lado esquerdo */}
      <div style={{ position: 'fixed', bottom: '130px', left: '20px', zIndex: 99999 }}>
        <button
          onClick={() => setModalFinanceiroAberto(true)}
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#f59e0b', color: 'black', border: 'none',
            boxShadow: '0 4px 20px #f59e0b66',
            fontSize: '11px', fontWeight: '900', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            lineHeight: '1.2'
          }}
        >
          <span style={{ fontSize: '20px' }}>💰</span>
          <span style={{ fontSize: '8px', marginTop: '2px' }}>CAIXA</span>
        </button>
      </div>

      {/* ✅ MODAL FINANCEIRO RÁPIDO */}
      {modalFinanceiroAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '25px', border: '2px solid #f59e0b', position: 'relative' }}>
            <button onClick={() => setModalFinanceiroAberto(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            <h3 style={{ margin: '0 0 20px 0', color: '#f59e0b', textAlign: 'center' }}>💰 Lançamento Rápido</h3>

            {/* TIPO - ENTRADA / DESPESA */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['entrada', 'despesa'].map(t => (
                <button key={t} onClick={() => setFinTipo(t)} style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '900',
                  fontSize: '13px', cursor: 'pointer', letterSpacing: '1px',
                  background: finTipo === t ? (t === 'entrada' ? '#00E676' : '#ef4444') : '#222',
                  color: finTipo === t ? (t === 'entrada' ? 'black' : 'white') : '#666',
                }}>
                  {t === 'entrada' ? '+ ENTRADA' : '- DESPESA'}
                </button>
              ))}
            </div>

            {/* DESCRIÇÃO COM VOZ */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={finDesc}
                onChange={e => setFinDesc(e.target.value)}
                placeholder="Ex: Troca de óleo, Peça avulsa..."
                style={{ flex: 1, padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '14px' }}
              />
              <button onClick={ouvirFinDesc} style={{
                background: finCampoOuvindo ? '#ef4444' : '#333',
                color: 'white', border: 'none', borderRadius: '8px',
                padding: '0 14px', fontSize: '18px', cursor: 'pointer'
              }}>
                {finCampoOuvindo ? '🔴' : '🎤'}
              </button>
            </div>

            {/* VALOR */}
            <input
              type="number"
              value={finValor}
              onChange={e => setFinValor(e.target.value)}
              placeholder="Valor R$"
              style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: '#f59e0b', borderRadius: '8px', fontSize: '20px', fontWeight: '900', marginBottom: '12px', textAlign: 'center' }}
            />

            {/* PAGAMENTO */}
            <select
              value={finPagamento}
              onChange={e => setFinPagamento(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}
            >
              {['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Outro'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              onClick={salvarFinanceiroRapido}
              disabled={finSalvando || !finDesc || !finValor}
              style={{
                width: '100%', padding: '16px', borderRadius: '10px', border: 'none',
                background: finSalvando || !finDesc || !finValor ? '#222' : '#f59e0b',
                color: finSalvando || !finDesc || !finValor ? '#444' : 'black',
                fontWeight: '900', fontSize: '15px', cursor: finSalvando || !finDesc || !finValor ? 'not-allowed' : 'pointer',
                letterSpacing: '1px'
              }}
            >
              {finSalvando ? '⏳ SALVANDO...' : '💾 LANÇAR NO CAIXA'}
            </button>
          </div>
        </div>
      )}

      {/* ✅ BOTÃO FLUTUANTE DE CLIENTES - abre modal de voz */}
      <div style={{ position: 'fixed', bottom: '130px', right: '20px', zIndex: 99999 }}>
        <button
          onClick={() => setModalClienteAberto(true)}
          title="Cadastrar novo cliente/lead rapidamente"
          style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: GREEN_MONEY, color: 'black', border: 'none',
            boxShadow: `0 4px 20px ${GREEN_MONEY}66`,
            fontSize: '11px', fontWeight: '900', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            lineHeight: '1.2'
          }}
        >
          <span style={{ fontSize: '20px' }}>👥</span>
          <span style={{ fontSize: '8px', marginTop: '2px' }}>LEAD</span>
        </button>
      </div>

      {/* ✅ MODAL CLIENTE RÁPIDO COM VOZ */}
      {modalClienteAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111', width: '100%', maxWidth: '420px', borderRadius: '16px', padding: '25px', border: `2px solid ${GREEN_MONEY}`, position: 'relative' }}>
            <button onClick={() => setModalClienteAberto(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            <h3 style={{ margin: '0 0 20px 0', color: GREEN_MONEY, textAlign: 'center' }}>⚡ Novo Lead Rápido</h3>

            {[
              { label: 'Nome do Cliente *', val: leadNome, set: setLeadNome, campo: 'nome', type: 'text' },
              { label: 'WhatsApp (só números) *', val: leadTelefone, set: setLeadTelefone, campo: 'telefone', type: 'tel' },
              { label: 'Modelo do Veículo', val: leadCarro, set: setLeadCarro, campo: 'carro', type: 'text' },
            ].map(({ label, val, set, campo, type }) => (
              <div key={campo} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type={type}
                  value={val}
                  onChange={(e) => set(type === 'tel' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                  placeholder={label}
                  style={{ flex: 1, padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }}
                />
                <button onClick={() => ouvirCampoLead(campo, set)} style={{ background: leadCampoOuvindo === campo ? GREEN_MONEY : '#333', color: leadCampoOuvindo === campo ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }}>
                  {leadCampoOuvindo === campo ? '🔴' : '🎤'}
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <textarea
                value={leadProblema}
                onChange={(e) => setLeadProblema(e.target.value)}
                placeholder="Defeito / Serviço desejado..."
                rows={3}
                style={{ flex: 1, padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '14px', resize: 'none' }}
              />
              <button onClick={() => ouvirCampoLead('problema', setLeadProblema)} style={{ background: leadCampoOuvindo === 'problema' ? GREEN_MONEY : '#333', color: leadCampoOuvindo === 'problema' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 14px', fontSize: '18px', cursor: 'pointer' }}>
                {leadCampoOuvindo === 'problema' ? '🔴' : '🎤'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setLeadNome(''); setLeadTelefone(''); setLeadCarro(''); setLeadProblema(''); }} style={{ flex: 1, padding: '14px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>LIMPAR</button>
              <button onClick={salvarLeadRapido} disabled={leadSalvando || !leadTelefone} style={{ flex: 2, padding: '14px', background: leadSalvando || !leadTelefone ? '#222' : GREEN_MONEY, color: leadSalvando || !leadTelefone ? '#444' : 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: leadSalvando || !leadTelefone ? 'not-allowed' : 'pointer' }}>
                {leadSalvando ? '⏳ SALVANDO...' : '💾 SALVAR CLIENTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
// Garanta que esta é a última chave que fecha o export default function Admin() {
}
