import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

const TAREFA_COLOR = '#10b981';
const WARN_RED = '#ef4444';
const WARN_YELLOW = '#f59e0b';
const GREEN_MONEY = '#00E676';
const BLUE_INFO = '#3b82f6';
const MAIN = '#FF0033';

function useVoz() {
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const ouvirCampo = (nomeCampo, setFn) => {
    if (!('webkitSpeechRecognition' in window)) { alert('Use Chrome para usar o microfone.'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    setCampoOuvindo(nomeCampo);
    recognition.onresult = (event) => {
      let texto = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        texto += event.results[i][0].transcript;
      }
      setFn(prev => prev ? prev + ' ' + texto : texto);
    };
    recognition.onend = () => setCampoOuvindo(null);
    recognition.onerror = () => setCampoOuvindo(null);
    recognition.start();
    setTimeout(() => { recognition.stop(); setCampoOuvindo(null); }, 8000);
  };
  return { campoOuvindo, ouvirCampo };
}

export default function TarefaTab({ oficinaId }) {
  const [tarefas, setTarefas] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [expandidos, setExpandidos] = useState({});
  const { campoOuvindo, ouvirCampo } = useVoz();

  useEffect(() => {
    carregarTarefas();
    const intervalo = setInterval(carregarTarefas, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarTarefas = async () => {
    try {
      if (!oficinaId) return;
      const q = query(collection(db, 'oficinas', oficinaId, 'tarefas'), orderBy('dataCriacao', 'desc'));
      const snapshot = await getDocs(q);
      setTarefas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (erro) { console.error('Erro ao carregar tarefas:', erro); }
  };

  const adicionarTarefa = async () => {
    if (!novoTitulo.trim()) { alert('Digite um título para a tarefa'); return; }
    setCarregando(true);
    try {
      let dataHora = null;
      if (novaData && novaHora) {
        dataHora = new Date(`${novaData}T${novaHora}:00`);
      } else if (novaData) {
        dataHora = new Date(`${novaData}T23:59:00`);
      }
      const novaTarefa = {
        titulo: novoTitulo.trim(),
        descricao: novaDescricao.trim(),
        dataHora: dataHora ? Timestamp.fromDate(dataHora) : null,
        status: 'pendente',
        dataCriacao: Timestamp.now(),
      };
      if (!oficinaId) return;
      await addDoc(collection(db, 'oficinas', oficinaId, 'tarefas'), novaTarefa);
      setNovoTitulo('');
      setNovaDescricao('');
      setNovaData('');
      setNovaHora('');
      carregarTarefas();
    } catch (erro) { console.error('Erro ao adicionar tarefa:', erro); alert('Erro ao adicionar tarefa'); }
    finally { setCarregando(false); }
  };

  const atualizarStatusTarefa = async (tarefaId, novoStatus) => {
    try {
      if (!oficinaId) return;
      await updateDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tarefaId), { status: novoStatus });
      carregarTarefas();
    } catch (erro) { console.error(erro); }
  };

  const deletarTarefa = async (tarefaId) => {
    if (!window.confirm('Deletar esta tarefa?')) return;
    try {
      if (!oficinaId) return;
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tarefaId));
      carregarTarefas();
    } catch (erro) { console.error(erro); }
  };

  const calcularStatusTarefa = (dataHora) => {
    if (!dataHora) return 'sem_data';
    const agora = new Date();
    const dataHoraObj = dataHora?.toDate ? dataHora.toDate() : new Date(dataHora);
    const diffHoras = (dataHoraObj - agora) / (1000 * 60 * 60);
    if (diffHoras < 0) return 'vencida';
    if (diffHoras <= 1) return 'urgente';
    if (diffHoras <= 24) return 'aviso';
    return 'ok';
  };

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return '-';
    const data = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} ${hora}:${minuto}`;
  };

  const tarefasFiltradas = tarefas.filter(t => {
    if (filtroStatus === 'pendentes') return t.status === 'pendente';
    if (filtroStatus === 'concluidas') return t.status === 'concluida';
    return true;
  });

  const paletaStatus = {
    vencida: { borda: WARN_RED, bg: '#1a0000', badge: WARN_RED, emoji: '🔴', label: 'VENCIDA' },
    urgente: { borda: WARN_RED, bg: '#1a0500', badge: WARN_RED, emoji: '🚨', label: 'URGENTE' },
    aviso: { borda: WARN_YELLOW, bg: '#1a1500', badge: WARN_YELLOW, emoji: '⚠️', label: 'PRÓXIMA' },
    ok: { borda: '#333', bg: '#111', badge: '#555', emoji: '✅', label: 'OK' },
    sem_data: { borda: BLUE_INFO, bg: '#00051a', badge: BLUE_INFO, emoji: '📝', label: 'SEM DATA' },
  };

  const micBtn = (campo, setter) => (
    <button
      onClick={() => ouvirCampo(campo, setter)}
      title="Gravar voz"
      style={{
        background: campoOuvindo === campo ? MAIN : '#222',
        border: 'none', borderRadius: '8px',
        color: campoOuvindo === campo ? 'white' : '#888',
        padding: '0 12px', fontSize: '16px', cursor: 'pointer',
        flexShrink: 0, transition: 'all 0.2s',
      }}
    >
      {campoOuvindo === campo ? '🔴' : '🎤'}
    </button>
  );

  return (
    <div style={{ padding: '20px', background: '#0a0a0a', borderRadius: '12px', color: 'white' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0', color: TAREFA_COLOR }}>
          📋 TAREFAS
        </h1>
        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Gerencie suas tarefas e avisos</p>
      </div>

      {/* FORMULÁRIO */}
      <div style={{ background: '#111', border: `1px solid ${TAREFA_COLOR}22`, borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 14px 0', color: TAREFA_COLOR, textTransform: 'uppercase' }}>
          ➕ Nova Tarefa
        </h2>

        {/* TÍTULO */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>
            📌 Título
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Ex: Reunião com cliente, Revisar peças..."
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && adicionarTarefa()}
              style={{ flex: 1, padding: '10px 12px', background: '#0a0a0a', border: `1px solid ${TAREFA_COLOR}44`, borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }}
            />
            {micBtn('tituloTarefa', setNovoTitulo)}
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>
            📝 Descrição (opcional)
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <textarea
              placeholder="Detalhes adicionais..."
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', background: '#0a0a0a', border: `1px solid ${TAREFA_COLOR}44`, borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', minHeight: '60px', resize: 'vertical' }}
            />
            {micBtn('descTarefa', setNovaDescricao)}
          </div>
        </div>

        {/* DATA E HORA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>
              📅 Data
            </label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0a0a0a', border: `1px solid ${TAREFA_COLOR}44`, borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }}>
              🕐 Hora
            </label>
            <input
              type="time"
              value={novaHora}
              onChange={(e) => setNovaHora(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#0a0a0a', border: `1px solid ${TAREFA_COLOR}44`, borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <button
          onClick={adicionarTarefa}
          disabled={carregando}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            background: carregando ? '#0a4a2a' : TAREFA_COLOR,
            color: 'black', border: 'none',
            fontWeight: '900', fontSize: '13px', textTransform: 'uppercase',
            cursor: carregando ? 'not-allowed' : 'pointer',
            opacity: carregando ? 0.6 : 1,
            boxShadow: `0 4px 16px ${TAREFA_COLOR}33`,
          }}
        >
          {carregando ? '⏳ Salvando...' : '💾 Salvar Tarefa'}
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['todas', '📋', TAREFA_COLOR], ['pendentes', '⏳', WARN_YELLOW], ['concluidas', '✅', GREEN_MONEY]].map(([f, icon, cor]) => (
          <button key={f} onClick={() => setFiltroStatus(f)}
            style={{
              padding: '7px 14px', borderRadius: '20px',
              background: filtroStatus === f ? cor : '#1a1a1a',
              color: filtroStatus === f ? 'black' : '#666',
              border: `1px solid ${filtroStatus === f ? cor : '#333'}`,
              fontWeight: '700', fontSize: '11px', cursor: 'pointer',
            }}>
            {icon} {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'todas' ? tarefas.length : tarefas.filter(t => f === 'pendentes' ? t.status === 'pendente' : t.status === 'concluida').length})
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tarefasFiltradas.length === 0 && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#444' }}>
            <p style={{ fontSize: '16px', margin: 0 }}>📭 Nenhuma tarefa</p>
          </div>
        )}
        {tarefasFiltradas.map(tarefa => {
          const statusTarefa = calcularStatusTarefa(tarefa.dataHora);
          const paleta = paletaStatus[statusTarefa];
          const expandida = expandidos[tarefa.id];
          return (
            <div key={tarefa.id} style={{ background: paleta.bg, border: `1px solid ${paleta.borda}`, borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'white', textDecoration: tarefa.status === 'concluida' ? 'line-through' : 'none' }}>
                      {tarefa.titulo}
                    </span>
                    <span style={{ background: `${paleta.badge}22`, color: paleta.badge, border: `1px solid ${paleta.badge}44`, padding: '2px 8px', borderRadius: '20px', fontSize: '8px', fontWeight: '800', textTransform: 'uppercase' }}>
                      {paleta.emoji} {paleta.label}
                    </span>
                  </div>
                  {tarefa.dataHora && <p style={{ color: paleta.badge, fontSize: '11px', fontWeight: '700', margin: 0 }}>🕐 {formatarDataHora(tarefa.dataHora)}</p>}
                  {tarefa.descricao && <p style={{ color: '#555', fontSize: '11px', margin: '4px 0 0', lineHeight: '1.4' }}>{tarefa.descricao.substring(0, 80)}{tarefa.descricao.length > 80 ? '...' : ''}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => setExpandidos(prev => ({ ...prev, [tarefa.id]: !prev[tarefa.id] }))}
                    style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: '6px', color: '#666', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
                    {expandida ? '▲' : '▼'}
                  </button>
                  <button onClick={() => deletarTarefa(tarefa.id)}
                    style={{ background: '#1a0000', border: '1px solid #3a0000', borderRadius: '6px', color: '#ef4444', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>

              {expandida && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #222' }}>
                  {tarefa.descricao && <p style={{ color: '#888', fontSize: '12px', margin: '0 0 6px', lineHeight: '1.5' }}>{tarefa.descricao}</p>}
                  <p style={{ color: '#555', fontSize: '11px', margin: '0 0 8px' }}>Status: {tarefa.status === 'concluida' ? '✅ Concluída' : '⏳ Pendente'}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {tarefa.status === 'pendente' ? (
                      <button onClick={() => atualizarStatusTarefa(tarefa.id, 'concluida')}
                        style={{ flex: 1, padding: '8px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
                        ✅ Concluir
                      </button>
                    ) : (
                      <button onClick={() => atualizarStatusTarefa(tarefa.id, 'pendente')}
                        style={{ flex: 1, padding: '8px', background: WARN_YELLOW, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>
                        ⏳ Reabrir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ESTATÍSTICAS */}
      {tarefas.length > 0 && (
        <div style={{ marginTop: '24px', background: '#111', border: `1px solid #222`, borderRadius: '12px', padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            ['Total', tarefas.length, TAREFA_COLOR],
            ['Pendentes', tarefas.filter(t => t.status === 'pendente').length, WARN_YELLOW],
            ['Concluídas', tarefas.filter(t => t.status === 'concluida').length, GREEN_MONEY],
            ['Urgentes', tarefas.filter(t => { const s = calcularStatusTarefa(t.dataHora); return (s === 'urgente' || s === 'vencida') && t.status === 'pendente'; }).length, WARN_RED],
          ].map(([label, val, cor]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ color: '#555', fontSize: '10px', margin: '0 0 2px', textTransform: 'uppercase' }}>{label}</p>
              <p style={{ color: cor, fontSize: '18px', fontWeight: '900', margin: 0 }}>{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
