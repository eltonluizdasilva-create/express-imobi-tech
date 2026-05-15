import React, { useState } from 'react';
import { Wallet, Users, Lock, Sparkles, Mic } from 'lucide-react';
import { useGroq } from '../hooks/useGroq';

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
    const { analyzeText } = useGroq(oficinaId);
    const [preenchendoVoz, setPreenchendoVoz] = useState(false);

    const ouvirEPreencherTudo = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        
        rec.onstart = () => {
            setPreenchendoVoz('ouvindo');
        };
        
        rec.onresult = async (e) => {
            const transcricao = e.results[0][0].transcript;
            if (!transcricao.trim()) {
                setPreenchendoVoz(false);
                return;
            }
            
            setPreenchendoVoz('processando');
            
            try {
                const prompt = `Aja como um extrator de dados JSON estruturado. Analise a seguinte fala transcrita de um dono de oficina mecânica descrevendo a chegada de um cliente. Extraia exatamente e APENAS as informações solicitadas abaixo, retornando SEMPRE um objeto JSON no seguinte formato, sem textos adicionais, sem explicações, sem blocos de código:
{
  "nome": "Nome do cliente extraído (capitalize as primeiras letras)",
  "telefone": "Apenas os números do telefone celular contendo DDD, ex: 34999998888 (converta números falados por extenso para algarismos se necessário)",
  "problema": "O problema do carro, o serviço solicitado ou modelo do veículo citado"
}

Fala transcrita: "${transcricao}"`;

                const response = await analyzeText(prompt);
                const cleanJson = response.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                
                if (parsed.nome) setLeadNome(parsed.nome);
                if (parsed.telefone) setLeadTelefone(parsed.telefone);
                if (parsed.problema) setLeadProblema(parsed.problema);
            } catch (err) {
                console.error('[Voz IA] Erro:', err);
                alert('Não foi possível decifrar o áudio. Tente falar mais pausadamente.');
            } finally {
                setPreenchendoVoz(false);
            }
        };
        
        rec.onend = () => {
            setTimeout(() => setPreenchendoVoz(p => p === 'ouvindo' ? false : p), 500);
        };
        
        rec.start();
    };

    const ouvirERegistrarTarefa = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        
        rec.onstart = () => {
            setPreenchendoVoz('ouvindo_tarefa');
        };
        
        rec.onresult = async (e) => {
            const transcricao = e.results[0][0].transcript;
            if (!transcricao.trim()) {
                setPreenchendoVoz(false);
                return;
            }
            
            setPreenchendoVoz('processando');
            
            try {
                const hoje = new Date();
                const hojeIso = hoje.toISOString().split('T')[0];
                const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
                const diaSemana = dias[hoje.getDay()];

                const prompt = `Aja como um extrator inteligente para um painel de tarefas rápidas de oficina. Hoje é dia ${hojeIso} (${diaSemana}). Analise a frase ditada pelo mecânico e extraia o título, detalhes da tarefa, a data e a hora. ATENÇÃO: Converta datas relativas citadas (ex: amanhã, hoje de tarde, próxima terça às 14h, daqui a dois dias) para os formatos AAAA-MM-DD e HH:MM de forma precisa baseado na data de hoje (${hojeIso}).
Retorne APENAS um objeto JSON estruturado seguindo exatamente este formato:
{
  "titulo": "Resumo da tarefa (máx 5 palavras, ex: Comprar Óleo, Ligar para Seguradora)",
  "detalhes": "Explicação complementar da tarefa caso exista",
  "data": "AAAA-MM-DD (A data exata calculada. IMPORTANTE: Se nenhuma data for citada, use a data de hoje ${hojeIso})",
  "hora": "HH:MM (A hora exata citada. Se não for citada, deixe vazio)"
}

Fala do mecânico: "${transcricao}"`;

                const response = await analyzeText(prompt);
                const cleanJson = response.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                
                if (parsed.titulo) setTarefaRapidaTitulo(parsed.titulo);
                if (parsed.detalhes) setTarefaRapidaDesc(parsed.detalhes);
                if (parsed.data) setTarefaRapidaData(parsed.data);
                if (parsed.hora) setTarefaRapidaHora(parsed.hora);
            } catch (err) {
                console.error('[Voz Tarefa] Erro:', err);
                alert('Não consegui capturar os detalhes da tarefa. Fale mais pausadamente.');
            } finally {
                setPreenchendoVoz(false);
            }
        };
        
        rec.onend = () => {
            setTimeout(() => setPreenchendoVoz(p => p === 'ouvindo_tarefa' ? false : p), 500);
        };
        
        rec.start();
    };

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
                        <h3 style={{ margin: '0 0 15px', color: '#10b981', textAlign: 'center', fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>📝 NOVA TAREFA RÁPIDA</h3>

                        {/* 🧠 PREENCHIMENTO INTELIGENTE POR VOZ */}
                        <div style={{ marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={ouvirERegistrarTarefa}
                                disabled={preenchendoVoz === 'processando'}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    border: preenchendoVoz === 'ouvindo_tarefa' ? '2px solid #ef4444' : '1px solid rgba(16, 185, 129, 0.3)',
                                    background: preenchendoVoz === 'ouvindo_tarefa' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                                    color: preenchendoVoz === 'ouvindo_tarefa' ? '#ef4444' : '#10b981',
                                    fontWeight: '900',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: preenchendoVoz === 'processando' ? 'wait' : 'pointer',
                                    boxShadow: preenchendoVoz === 'ouvindo_tarefa' ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                className={preenchendoVoz === 'ouvindo_tarefa' ? 'animate-pulse' : ''}
                            >
                                {preenchendoVoz === 'processando' ? (
                                    <>⏳ PROCESSANDO TAREFA...</>
                                ) : preenchendoVoz === 'ouvindo_tarefa' ? (
                                    <>🔴 PODE FALAR AGORA...</>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        <Mic size={14} />
                                        Criar Tarefa por Voz (IA)
                                    </>
                                )}
                            </button>
                            <p style={{ margin: '6px 0 0', fontSize: '9px', color: '#777', textAlign: 'center', lineHeight: '1.3' }}>
                                💡 Clique e diga: <i>"Comprar pastilhas de freio amanhã às duas da tarde."</i>
                            </p>
                        </div>

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
                        <h3 style={{ margin: '0 0 15px', color: GREEN_MONEY, textAlign: 'center', fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>🎯 Clientes</h3>

                        {/* 🧠 PREENCHIMENTO INTELIGENTE POR VOZ */}
                        <div style={{ marginBottom: '20px' }}>
                            <button
                                type="button"
                                onClick={ouvirEPreencherTudo}
                                disabled={preenchendoVoz === 'processando'}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    border: preenchendoVoz === 'ouvindo' ? '2px solid #ef4444' : `1px solid ${GREEN_MONEY}44`,
                                    background: preenchendoVoz === 'ouvindo' ? 'rgba(239, 68, 68, 0.1)' : `${GREEN_MONEY}11`,
                                    color: preenchendoVoz === 'ouvindo' ? '#ef4444' : '#00E676',
                                    fontWeight: '900',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: preenchendoVoz === 'processando' ? 'wait' : 'pointer',
                                    boxShadow: preenchendoVoz === 'ouvindo' ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                className={preenchendoVoz === 'ouvindo' ? 'animate-pulse' : ''}
                            >
                                {preenchendoVoz === 'processando' ? (
                                    <>⏳ PROCESSANDO FALA...</>
                                ) : preenchendoVoz === 'ouvindo' ? (
                                    <>🔴 PODE FALAR AGORA...</>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        <Mic size={14} />
                                        Preenchimento Rápido por Voz
                                    </>
                                )}
                            </button>
                            <p style={{ margin: '6px 0 0', fontSize: '9px', color: '#777', textAlign: 'center', lineHeight: '1.3' }}>
                                💡 Clique e diga: <i>"Cadastra o Antônio, ZAP trinta e quatro nove nove nove e nove, trocar radiador do Celta."</i>
                            </p>
                        </div>

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