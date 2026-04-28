import React from 'react';
import { Wallet, Users, Lock } from 'lucide-react';

const QuickActions = ({
    oficinaId, GREEN_MONEY,
    modalTarefaAberto, setModalTarefaAberto,
    tarefaRapidaTitulo, setTarefaRapidaTitulo,
    tarefaRapidaDesc, setTarefaRapidaDesc,
    tarefaRapidaData, setTarefaRapidaData,
    tarefaRapidaHora, setTarefaRapidaHora,
    salvarTarefaRapida, salvandoTarefaRapida,
    modalFinanceiroAberto, setModalFinanceiroAberto,
    finTipo, setFinTipo,
    finDesc, setFinDesc,
    finValor, setFinValor,
    finPagamento, setFinPagamento,
    salvarFinanceiroRapido, finSalvando,
    modalClienteAberto, setModalClienteAberto,
    leadNome, setLeadNome,
    leadTelefone, setLeadTelefone,
    leadProblema, setLeadProblema,
    salvarLeadRapido, leadSalvando,
    ouvirFinDesc, finCampoOuvindo,
    ouvirCampoLead, leadCampoOuvindo,
    moduloLiberado, lidarModuloBloqueado,
    tema = 'escuro', t = { card: '#111', bg: '#000', text: '#fff', stroke: '#333', textSoft: '#888' }
}) => {
    
    const BTN_SIZE = '44px'; // Aumentado levemente para acomodar o cadeado se necessário
    const BTN_RADIUS = '12px';

    const renderActionBtn = (aba, icon, color, onClick, title) => {
        const liberado = moduloLiberado ? moduloLiberado(aba) : true;
        
        return (
            <button
                onClick={() => {
                    if (!liberado && lidarModuloBloqueado) {
                        lidarModuloBloqueado(aba);
                    } else {
                        onClick();
                    }
                }}
                className="nav-button-premium animate-pulse"
                title={title}
                style={{
                    width: BTN_SIZE, height: BTN_SIZE, borderRadius: '50%',
                    background: liberado ? color : t.card, color: liberado ? (color === '#3b82f6' ? 'white' : 'black') : t.textSoft, border: `1px solid ${t.stroke}`,
                    boxShadow: liberado ? `0 4px 15px ${color}66` : 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    '--glow-color': color, position: 'relative'
                }}
            >
                {icon}
                {!liberado && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#FF0033', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid black' }}>
                        <Lock size={10} color="white" />
                    </div>
                )}
            </button>
        );
    };

    return (
        <>
            {/* BOTÕES FLUTUANTES CONSOLIDADOS - LADO DIREITO */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'flex-end'
            }}>
                {/* BOTÃO TAREFA RÁPIDA (Sempre livre por ser utilitário básico) */}
                {renderActionBtn('tarefa', <span style={{ fontSize: '18px' }}>📝</span>, '#8b5cf6', () => setModalTarefaAberto(true), "Nova Tarefa Rápida")}

                {/* CLIENTES */}
                {renderActionBtn('clientes', <Users size={20} />, GREEN_MONEY, () => setModalClienteAberto(true), "CLIENTES")}

                {/* FINANCEIRO RÁPIDO */}
                {renderActionBtn('financeiro', <Wallet size={20} />, '#3b82f6', () => setModalFinanceiroAberto(true), "Finanças")}
            </div>

            {/* ✅ MODAL TAREFA RÁPIDA */}
            {modalTarefaAberto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: t.card, width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '30px', border: `1px solid ${t.stroke}`, position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <button onClick={() => setModalTarefaAberto(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: t.card, border: `1px solid ${t.stroke}`, color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>
                        <h3 style={{ margin: '0 0 25px', color: '#10b981', textAlign: 'center', fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>📝 NOVA TAREFA RÁPIDA</h3>

                        <label style={{ color: '#666', fontSize: '10px', fontWeight: '900', display: 'block', marginBottom: '8px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Título da Tarefa</label>
                        <input
                            type="text"
                            value={tarefaRapidaTitulo}
                            onChange={e => setTarefaRapidaTitulo(e.target.value)}
                            placeholder="Ex: Comprar filtros..."
                            autoFocus
                            style={{ width: '100%', padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' }}
                        />

                        <label style={{ color: '#666', fontSize: '10px', fontWeight: '900', display: 'block', marginBottom: '8px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Detalhes / Observações</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <textarea
                                value={tarefaRapidaDesc}
                                onChange={e => setTarefaRapidaDesc(e.target.value)}
                                placeholder="Anotações..."
                                rows={3}
                                style={{ flex: 1, padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', fontSize: '15px', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
                            />
                            <button style={{ width: '50px', background: t.bg, border: `1px solid ${t.stroke}`, borderRadius: '12px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎙️</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ color: '#666', fontSize: '10px', fontWeight: '900', display: 'block', marginBottom: '6px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>📅 Data</label>
                                <input
                                    type="date"
                                    value={tarefaRapidaData}
                                    onChange={e => setTarefaRapidaData(e.target.value)}
                                    style={{ width: '100%', padding: '12px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ color: '#666', fontSize: '10px', fontWeight: '900', display: 'block', marginBottom: '6px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>⏰ Hora</label>
                                <input
                                    type="time"
                                    value={tarefaRapidaHora}
                                    onChange={e => setTarefaRapidaHora(e.target.value)}
                                    style={{ width: '100%', padding: '12px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '10px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={salvarTarefaRapida}
                            disabled={salvandoTarefaRapida || !tarefaRapidaTitulo.trim()}
                            className="nav-button-premium animate-pulse"
                            style={{ width: '100%', padding: '18px', background: '#10b981', color: 'black', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', letterSpacing: '1px', '--glow-color': '#10b981' }}
                        >
                            {salvandoTarefaRapida ? 'SALVANDO...' : '+ CRIAR TAREFA'}
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ MODAL FINANCEIRO RÁPIDO */}
            {modalFinanceiroAberto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: t.card, width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '30px', border: `1px solid ${t.stroke}`, position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <button onClick={() => setModalFinanceiroAberto(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: t.card, border: `1px solid ${t.stroke}`, color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>
                        <h3 style={{ margin: '0 0 25px', color: '#f59e0b', textAlign: 'center', fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>💰 Finanças</h3>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button onClick={() => setFinTipo('entrada')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '12px', background: finTipo === 'entrada' ? '#00E676' : '#222', color: finTipo === 'entrada' ? 'black' : '#666', cursor: 'pointer' }}>+ ENTRADA</button>
                            <button onClick={() => setFinTipo('despesa')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '12px', background: finTipo === 'despesa' ? '#ef4444' : '#222', color: finTipo === 'despesa' ? 'white' : '#666', cursor: 'pointer' }}>- DESPESA</button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <input
                                type="text"
                                value={finDesc}
                                onChange={e => setFinDesc(e.target.value)}
                                placeholder="Descrição do lançamento..."
                                style={{ flex: 1, padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', fontSize: '15px', outline: 'none' }}
                            />
                            <button onClick={ouvirFinDesc} style={{ width: '50px', background: finCampoOuvindo ? '#ef4444' : t.bg, border: `1px solid ${t.stroke}`, borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {finCampoOuvindo ? '🔴' : '🎙️'}
                            </button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', fontWeight: '900' }}>R$</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={finValor}
                                onChange={e => { console.log('[FinValor onChange]', e.target.value); setFinValor(e.target.value); }}
                                placeholder="0"
                                style={{ width: '100%', padding: '20px 20px 20px 50px', background: t.bg, border: `1px solid ${t.stroke}`, color: '#f59e0b', borderRadius: '12px', fontSize: '32px', fontWeight: '900', boxSizing: 'border-box', outline: 'none' }}
                            />
                        </div>

                        <select
                            value={finPagamento}
                            onChange={e => setFinPagamento(e.target.value)}
                            style={{ width: '100%', padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', marginBottom: '25px', fontSize: '14px', outline: 'none' }}
                        >
                            {['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Outro'].map(p => <option key={p} value={p} style={{ background: t.card }}>{p}</option>)}
                        </select>

                        <button
                            onClick={() => {
                                console.log('[QA Fin] Clicou salvar! finSalvando:', finSalvando, 'finDesc:', finDesc, 'finValor:', finValor, 'finTipo:', finTipo);
                                if (!finDesc || !finValor) { alert('Preencha descrição e valor!'); return; }
                                salvarFinanceiroRapido();
                            }}
                            disabled={finSalvando || !finDesc || !finValor}
                            className="nav-button-premium animate-pulse"
                            style={{ width: '100%', padding: '18px', background: '#f59e0b', color: 'black', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', letterSpacing: '1px', '--glow-color': '#f59e0b' }}
                        >
                            {finSalvando ? 'SALVANDO...' : '💵 LANÇAR NO CAIXA'}
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ MODAL CLIENTE RÁPIDO */}
            {modalClienteAberto && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: t.card, width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '30px', border: `1px solid ${t.stroke}`, position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <button onClick={() => setModalClienteAberto(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: t.card, border: `1px solid ${t.stroke}`, color: '#ef4444', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>✕</button>
                        <h3 style={{ margin: '0 0 25px', color: GREEN_MONEY, textAlign: 'center', fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>🎯 Clientes</h3>

                        <input
                            type="text"
                            value={leadNome}
                            onChange={e => setLeadNome(e.target.value)}
                            placeholder="Nome do Cliente *"
                            style={{ width: '100%', padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }}
                        />
 
                        <input
                            type="tel"
                            value={leadTelefone}
                            onChange={e => setLeadTelefone(e.target.value)}
                            placeholder="WhatsApp (DDD + Número) *"
                            style={{ width: '100%', padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', fontSize: '15px', marginBottom: '15px', boxSizing: 'border-box', outline: 'none' }}
                        />

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                            <textarea
                                value={leadProblema}
                                onChange={e => setLeadProblema(e.target.value)}
                                placeholder="Defeito / Serviço / Observação..."
                                rows={3}
                                style={{ flex: 1, padding: '16px', background: t.bg, border: `1px solid ${t.stroke}`, color: t.text, borderRadius: '12px', fontSize: '15px', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
                            />
                            <button onClick={() => ouvirCampoLead('problema')} style={{ width: '50px', background: leadCampoOuvindo === 'problema' ? GREEN_MONEY : t.bg, border: `1px solid ${t.stroke}`, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {leadCampoOuvindo === 'problema' ? '🔴' : '🎙️'}
                            </button>
                        </div>

                        <button
                            onClick={salvarLeadRapido}
                            disabled={leadSalvando || !leadTelefone}
                            className="nav-button-premium animate-pulse"
                            style={{ width: '100%', padding: '18px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', letterSpacing: '1px', '--glow-color': GREEN_MONEY }}
                        >
                            {leadSalvando ? 'SALVANDO...' : '+ SALVAR LEAD'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuickActions;