/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

const TAREFA_COLOR = '#10b981';
const WARN_RED = '#ef4444';
const WARN_YELLOW = '#f59e0b';
const GREEN_MONEY = '#00E676';
const BLUE_INFO = '#3b82f6';

/**
 * TarefaTab - Componente independente para gerenciar tarefas
 */
function TarefaTab() {
    const [tarefas, setTarefas] = useState([]);
    const [novoTitulo, setNovoTitulo] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [novaDataHora, setNovaDataHora] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [filtroStatus, setFiltroStatus] = useState('todas'); // 'todas', 'pendentes', 'concluidas'
    const [expandidos, setExpandidos] = useState({});

    // Carregar tarefas do Firebase
    useEffect(() => {
        carregarTarefas();
        const intervalo = setInterval(carregarTarefas, 5000); // Atualiza a cada 5 segundos
        return () => clearInterval(intervalo);
    }, []); // <-- Deixamos vazio para carregar sempre

    const carregarTarefas = async () => {
        try {
            const q = query(
                collection(db, 'tarefas'),
                orderBy('dataCriacao', 'desc')
            );
            const snapshot = await getDocs(q);
            const tarefasCarregadas = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTarefas(tarefasCarregadas);
        } catch (erro) {
            console.error('Erro ao carregar tarefas:', erro);
        }
    };

    const adicionarTarefa = async () => {
        if (!novoTitulo.trim()) {
            alert('Digite um título para a tarefa');
            return;
        }

        setCarregando(true);
        try {
            const dataParsed = novaDataHora ? new Date(novaDataHora) : null;
            const novaTarefa = {
                titulo: novoTitulo.trim(),
                descricao: novaDescricao.trim(),
                dataHora: dataParsed ? Timestamp.fromDate(dataParsed) : null,
                status: 'pendente',
                dataCriacao: Timestamp.now()
            }; // <-- Removemos o usuarioId daqui

            await addDoc(collection(db, 'tarefas'), novaTarefa);
            setNovoTitulo('');
            setNovaDescricao('');
            setNovaDataHora('');
            carregarTarefas();
        } catch (erro) {
            console.error('Erro ao adicionar tarefa:', erro);
            alert('Erro ao adicionar tarefa');
        } finally {
            setCarregando(false);
        }
    };

    const atualizarStatusTarefa = async (tarefaId, novoStatus) => {
        try {
            const docRef = doc(db, 'tarefas', tarefaId);
            await updateDoc(docRef, { status: novoStatus });
            carregarTarefas();
        } catch (erro) {
            console.error('Erro ao atualizar tarefa:', erro);
        }
    };

    const deletarTarefa = async (tarefaId) => {
        if (!window.confirm('Tem certeza que deseja deletar esta tarefa?')) return;
        try {
            await deleteDoc(doc(db, 'tarefas', tarefaId));
            carregarTarefas();
        } catch (erro) {
            console.error('Erro ao deletar tarefa:', erro);
        }
    };

    // Calcular status da tarefa (vencida, urgente, ok)
    const calcularStatusTarefa = (dataHora) => {
        if (!dataHora) return 'sem_data';
        const agora = new Date();
        const dataHoraObj = dataHora?.toDate ? dataHora.toDate() : new Date(dataHora);
        const diffMs = dataHoraObj - agora;
        const diffHoras = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) return 'vencida';
        if (diffHoras <= 1) return 'urgente';
        if (diffHoras <= 24) return 'aviso';
        return 'ok';
    };

    // Formatar data e hora
    const formatarDataHora = (timestamp) => {
        if (!timestamp) return '-';
        const data = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const hora = String(data.getHours()).padStart(2, '0');
        const minuto = String(data.getMinutes()).padStart(2, '0');
        return `${dia}/${mes} ${hora}:${minuto}`;
    };

    // Filtrar tarefas
    const tarefasFiltradas = tarefas.filter(tarefa => {
        if (filtroStatus === 'pendentes') return tarefa.status === 'pendente';
        if (filtroStatus === 'concluidas') return tarefa.status === 'concluida';
        return true;
    });

    // Paleta de cores para status
    const paletaStatus = {
        vencida: { borda: WARN_RED, bg: '#1a0000', badge: WARN_RED, badgeBg: '#FF003322', emoji: '🔴', label: 'VENCIDA' },
        urgente: { borda: WARN_RED, bg: '#1a0500', badge: WARN_RED, badgeBg: '#ef444422', emoji: '🚨', label: 'URGENTE' },
        aviso: { borda: WARN_YELLOW, bg: '#1a1500', badge: WARN_YELLOW, badgeBg: '#f59e0b22', emoji: '⚠️', label: 'PRÓXIMA' },
        ok: { borda: '#333', bg: '#111', badge: '#555', badgeBg: '#33333322', emoji: '✅', label: 'OK' },
        sem_data: { borda: BLUE_INFO, bg: '#00051a', badge: BLUE_INFO, badgeBg: '#3b82f622', emoji: '📝', label: 'SEM DATA' },
    };

    return (
        <div style={{ padding: '20px', background: '#0a0a0a', borderRadius: '12px', color: 'white', minHeight: '100vh' }}>
            {/* ===== CABEÇALHO ===== */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0', color: TAREFA_COLOR }}>
                    📋 TAREFAS
                </h1>
                <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Gerencie suas tarefas e avisos importantes</p>
            </div>

            {/* ===== FORMULÁRIO DE NOVA TAREFA ===== */}
            <div style={{ background: '#111', border: `2px solid ${TAREFA_COLOR}22`, borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 15px 0', color: TAREFA_COLOR }}>
                    ➕ NOVA TAREFA
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Título */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', marginBottom: '6px' }}>
                            📌 Título da Tarefa
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Reunião com cliente, Revisar peças, etc..."
                            value={novoTitulo}
                            onChange={(e) => setNovoTitulo(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0a0a',
                                border: `1px solid ${TAREFA_COLOR}44`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && adicionarTarefa()}
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', marginBottom: '6px' }}>
                            📝 Descrição (opcional)
                        </label>
                        <textarea
                            placeholder="Detalhes adicionais da tarefa..."
                            value={novaDescricao}
                            onChange={(e) => setNovaDescricao(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0a0a',
                                border: `1px solid ${TAREFA_COLOR}44`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                                minHeight: '80px',
                                resize: 'vertical',
                            }}
                        />
                    </div>

                    {/* Data e Hora */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#aaa', marginBottom: '6px' }}>
                            🕐 Data e Hora (opcional)
                        </label>
                        <input
                            type="datetime-local"
                            value={novaDataHora}
                            onChange={(e) => setNovaDataHora(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#0a0a0a',
                                border: `1px solid ${TAREFA_COLOR}44`,
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Botão Adicionar */}
                    <button
                        onClick={adicionarTarefa}
                        disabled={carregando}
                        style={{
                            padding: '12px 20px',
                            background: TAREFA_COLOR,
                            color: 'black',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: carregando ? 'not-allowed' : 'pointer',
                            opacity: carregando ? 0.6 : 1,
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {carregando ? '⏳ Adicionando...' : '✅ Adicionar Tarefa'}
                    </button>
                </div>
            </div>

            {/* ===== FILTROS ===== */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFiltroStatus('todas')}
                    style={{
                        padding: '8px 16px',
                        background: filtroStatus === 'todas' ? TAREFA_COLOR : '#222',
                        color: filtroStatus === 'todas' ? 'black' : '#aaa',
                        border: `1px solid ${filtroStatus === 'todas' ? TAREFA_COLOR : '#333'}`,
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                >
                    📋 Todas ({tarefas.length})
                </button>
                <button
                    onClick={() => setFiltroStatus('pendentes')}
                    style={{
                        padding: '8px 16px',
                        background: filtroStatus === 'pendentes' ? WARN_YELLOW : '#222',
                        color: filtroStatus === 'pendentes' ? 'black' : '#aaa',
                        border: `1px solid ${filtroStatus === 'pendentes' ? WARN_YELLOW : '#333'}`,
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                >
                    ⏳ Pendentes ({tarefas.filter(t => t.status === 'pendente').length})
                </button>
                <button
                    onClick={() => setFiltroStatus('concluidas')}
                    style={{
                        padding: '8px 16px',
                        background: filtroStatus === 'concluidas' ? GREEN_MONEY : '#222',
                        color: filtroStatus === 'concluidas' ? 'black' : '#aaa',
                        border: `1px solid ${filtroStatus === 'concluidas' ? GREEN_MONEY : '#333'}`,
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                >
                    ✅ Concluídas ({tarefas.filter(t => t.status === 'concluida').length})
                </button>
            </div>

            {/* ===== LISTA DE TAREFAS ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tarefasFiltradas.length === 0 ? (
                    <div style={{
                        background: '#111',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#666',
                    }}>
                        <p style={{ fontSize: '16px', margin: 0 }}>📭 Nenhuma tarefa {filtroStatus !== 'todas' ? `${filtroStatus}` : ''}</p>
                    </div>
                ) : (
                    tarefasFiltradas.map((tarefa) => {
                        const statusTarefa = calcularStatusTarefa(tarefa.dataHora);
                        const paleta = paletaStatus[statusTarefa] || paletaStatus.ok;
                        const estaExpandida = expandidos[tarefa.id];

                        return (
                            <div
                                key={tarefa.id}
                                style={{
                                    background: paleta.bg,
                                    border: `1px solid ${paleta.borda}`,
                                    borderRadius: '12px',
                                    padding: '16px',
                                    transition: 'all 0.3s ease',
                                    opacity: tarefa.status === 'concluida' ? 0.6 : 1,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                    {/* Conteúdo Principal */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '16px',
                                                fontWeight: '900',
                                                color: 'white',
                                                textDecoration: tarefa.status === 'concluida' ? 'line-through' : 'none',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '200px',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {tarefa.titulo}
                                            </span>
                                            <span style={{
                                                background: paleta.badgeBg,
                                                color: paleta.badge,
                                                border: `1px solid ${paleta.badge}`,
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                fontSize: '9px',
                                                fontWeight: '800',
                                                letterSpacing: '0.5px',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {paleta.emoji} {paleta.label}
                                            </span>
                                        </div>

                                        {/* Data e Hora */}
                                        {tarefa.dataHora && (
                                            <p style={{ color: paleta.badge, fontSize: '12px', fontWeight: '700', margin: '4px 0' }}>
                                                🕐 {formatarDataHora(tarefa.dataHora)}
                                            </p>
                                        )}

                                        {/* Descrição (resumida) */}
                                        {tarefa.descricao && (
                                            <p style={{ color: '#aaa', fontSize: '12px', margin: '4px 0', lineHeight: '1.4' }}>
                                                {tarefa.descricao.length > 100 ? `${tarefa.descricao.substring(0, 100)}...` : tarefa.descricao}
                                            </p>
                                        )}
                                    </div>

                                    {/* Botão Expandir */}
                                    <button
                                        onClick={() => setExpandidos(prev => ({ ...prev, [tarefa.id]: !prev[tarefa.id] }))}
                                        style={{
                                            background: '#222',
                                            color: '#888',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {estaExpandida ? '▲' : '▼'}
                                    </button>
                                </div>

                                {/* Botões de Ação */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    {tarefa.status === 'pendente' ? (
                                        <button
                                            onClick={() => atualizarStatusTarefa(tarefa.id, 'concluida')}
                                            style={{
                                                flex: 1,
                                                minWidth: '100px',
                                                padding: '10px 8px',
                                                background: GREEN_MONEY,
                                                color: 'black',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: '800',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ✅ Concluir
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => atualizarStatusTarefa(tarefa.id, 'pendente')}
                                            style={{
                                                flex: 1,
                                                minWidth: '100px',
                                                padding: '10px 8px',
                                                background: WARN_YELLOW,
                                                color: 'black',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: '800',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ⏳ Reabrir
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deletarTarefa(tarefa.id)}
                                        style={{
                                            padding: '10px 10px',
                                            background: 'transparent',
                                            color: '#555',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                            fontWeight: '700',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {/* Conteúdo Expandido */}
                                {estaExpandida && (
                                    <div style={{
                                        marginTop: '12px',
                                        borderTop: '1px solid #333',
                                        paddingTop: '12px',
                                        fontSize: '12px',
                                        color: '#888',
                                        lineHeight: '1.6',
                                    }}>
                                        {tarefa.descricao && (
                                            <p style={{ margin: '0 0 8px 0' }}>
                                                <strong style={{ color: '#ccc' }}>Descrição Completa:</strong><br />
                                                {tarefa.descricao}
                                            </p>
                                        )}
                                        <p style={{ margin: '0 0 8px 0' }}>
                                            <strong style={{ color: '#ccc' }}>Status:</strong> {tarefa.status === 'concluida' ? '✅ Concluída' : '⏳ Pendente'}
                                        </p>
                                        {tarefa.dataHora && (
                                            <p style={{ margin: 0 }}>
                                                <strong style={{ color: '#ccc' }}>Data e Hora:</strong> {formatarDataHora(tarefa.dataHora)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ===== RESUMO ESTATÍSTICO ===== */}
            {tarefas.length > 0 && (
                <div style={{
                    marginTop: '30px',
                    background: '#111',
                    border: `1px solid ${TAREFA_COLOR}44`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px 0' }}>Total</p>
                        <p style={{ color: TAREFA_COLOR, fontSize: '20px', fontWeight: '900', margin: 0 }}>{tarefas.length}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px 0' }}>Pendentes</p>
                        <p style={{ color: WARN_YELLOW, fontSize: '20px', fontWeight: '900', margin: 0 }}>
                            {tarefas.filter(t => t.status === 'pendente').length}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px 0' }}>Concluídas</p>
                        <p style={{ color: GREEN_MONEY, fontSize: '20px', fontWeight: '900', margin: 0 }}>
                            {tarefas.filter(t => t.status === 'concluida').length}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px 0' }}>Urgentes</p>
                        <p style={{ color: WARN_RED, fontSize: '20px', fontWeight: '900', margin: 0 }}>
                            {tarefas.filter(t => {
                                const status = calcularStatusTarefa(t.dataHora);
                                return (status === 'urgente' || status === 'vencida') && t.status === 'pendente';
                            }).length}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TarefaTab;