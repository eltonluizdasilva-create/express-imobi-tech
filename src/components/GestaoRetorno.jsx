import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { classificarRetorno } from '../lib/utils';
import { MAIN_COLOR, GREEN_MONEY, VENCIDO_COLOR, WARN_RED, WARN_YELLOW, BLUE_INFO } from '../lib/constants';

// ============================================================
// ========== CARD DE RETORNO =================================
// ============================================================
const CardRetorno = ({ os, tipo, onAbrirWhatsApp, onAgendar, onConcluir, onDesfazer }) => {
    const CORES = { vencido: VENCIDO_COLOR, urgente: WARN_RED, aviso: WARN_YELLOW, agendado: BLUE_INFO, ok: GREEN_MONEY };
    const cor = CORES[tipo] || '#555';

    return (
        <div style={{ background: '#0a0a0a', borderLeft: `4px solid ${cor}`, borderRadius: '0 8px 8px 0', marginBottom: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
                <p style={{ margin: 0, color: 'white', fontWeight: 'bold' }}>{os.nomeCliente || 'Cliente sem nome'}</p>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>{os.placa} - {os.modelo}</p>
                {tipo === 'agendado' && os.dataAgendamento && <p style={{ margin: '4px 0 0', color: BLUE_INFO, fontSize: '12px', fontWeight: 'bold' }}>Agendado para: {os.dataAgendamento}</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                {tipo === 'agendado' ? (
                    <>
                        <button onClick={() => onConcluir(os)} style={{ background: GREEN_MONEY, color: 'black', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✅ Concluir</button>
                        <button onClick={() => onDesfazer(os)} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Desfazer</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => onAbrirWhatsApp(os, tipo)} style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>WhatsApp</button>
                        <button onClick={() => onAgendar(os)} style={{ background: BLUE_INFO, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Agendar</button>
                    </>
                )}
            </div>
        </div>
    );
};


// ============================================================
// ========== MODAL DE AGENDAMENTO DE RETORNO =================
// ============================================================
const ModalAgendar = ({ os, nomeOficina, onConfirmar, onFechar }) => {
    const [dataHora, setDataHora] = useState('');

    const formatarDataHora = (valor) => {
        if (!valor) return '';
        const d = new Date(valor);
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleConfirmar = () => {
        if (!dataHora) return alert('Por favor, selecione uma data e horário.');
        onConfirmar(os, dataHora, formatarDataHora(dataHora));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
                <h3 style={{ color: '#3b82f6', margin: '0 0 8px' }}>📅 Agendar Retorno</h3>
                <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>
                    {os?.nomeCliente || 'Cliente'} — {os?.placa || ''}
                </p>

                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                    Data e Horário:
                </label>
                <input
                    type="datetime-local"
                    value={dataHora}
                    onChange={e => setDataHora(e.target.value)}
                    style={{
                        width: '100%', padding: '12px', background: '#0a0a0a',
                        border: '1px solid #444', color: 'white', borderRadius: '8px',
                        fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box'
                    }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleConfirmar}
                        style={{
                            flex: 1, padding: '14px', background: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: '900',
                            fontSize: '14px', cursor: 'pointer'
                        }}
                    >
                        ✅ Confirmar e enviar WhatsApp
                    </button>
                    <button
                        onClick={onFechar}
                        style={{
                            padding: '14px 18px', background: 'transparent', color: '#666',
                            border: '1px solid #333', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ❌
                    </button>
                </div>
            </div>
        </div>
    );
};


// ============================================================
// ========== ABA GESTÃO DE RETORNO ===========================
// ============================================================
function GestaoRetorno({ listaCarros, setListaCarros, nomeOficina, oficinaId, abrirWhatsAppFn }) {
    const [osSelecionada, setOsSelecionada] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [busca, setBusca] = useState('');
    const ORDEM = { vencido: 0, urgente: 1, aviso: 2, agendado: 3, ok: 4 };
    const osComVencimento = useMemo(() => {
        return listaCarros.filter(os => {
            if (os.statusRetorno === 'concluido') return false;
            const temOleoOuAlinhamento = ['óleo', 'oleo', 'oil', 'alinhamento', 'balanceamento', 'pneu', 'revisão', 'revisao'].some(t =>
                String(os.checklist || '').toLowerCase().includes(t) ||
                String(os.detalhesPecas || '').toLowerCase().includes(t) ||
                String(os.tipoServico || '').toLowerCase().includes(t)
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
        osOrdenadas.filter(os => ['vencido', 'urgente', 'aviso'].includes(os._tipo))
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
            const msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! ✅ Horário confirmado para *${dataFormatada}*!\nNos vemos lá. 🛠️ - ${nomeOficina}`;
            abrirWhatsAppFn(`https://wa.me/55${(os.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
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
    const gerarMensagemRetorno = (os, tipo, nomeOficina) => {
        const nome = os.nomeCliente ? ` ${os.nomeCliente}` : '';
        const placa = os.placa ? ` (${os.placa})` : '';
        if (tipo === 'vencido') return `Olá${nome}! 🔴 Seu serviço de manutenção${placa} está vencido. Entre em contato para agendar. - ${nomeOficina}`;
        if (tipo === 'urgente') return `Olá${nome}! ⚠️ Seu serviço de manutenção${placa} vence em breve. Agende agora! - ${nomeOficina}`;
        return `Olá${nome}! 🔔 Lembrete de manutenção${placa}. Estamos à disposição. - ${nomeOficina}`;
    };
    const handleAbrirWhatsApp = (os, tipo) => {
        const msg = gerarMensagemRetorno(os, tipo, nomeOficina);
        const num = (os.telefone || '').replace(/\D/g, '');
        if (!num) { alert('Este cliente não tem telefone cadastrado.'); return; }
        abrirWhatsAppFn(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`);
    };
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h2 style={{ color: MAIN_COLOR, margin: 0, fontSize: '22px' }}>Gestão de Retorno</h2>
                    <p style={{ color: '#555', fontSize: '12px', margin: '4px 0 0' }}>Rastreamento automático de vencimentos e manutenções</p>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {[
                    { key: 'vencido', cor: VENCIDO_COLOR, label: '🔴 VENCIDOS' },
                    { key: 'urgente', cor: WARN_RED, label: '⚠️ URGENTES' },
                    { key: 'aviso', cor: WARN_YELLOW, label: '🔔 AVISOS' },
                    { key: 'agendado', cor: BLUE_INFO, label: '📅 AGENDADOS' },
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

export default GestaoRetorno;
