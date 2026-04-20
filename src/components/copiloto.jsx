// ============================================================
// ========== MÓDULO DE COPILOTO TÉCNICO (IA) =================
// ============================================================

import React, { useState, useRef } from 'react';
import { useGemini } from '../hooks/useGemini'; // Ajuste o caminho se seu hook estiver em outro lugar
import { COPILOTO_COLOR } from '../lib/constants';

const CopilotoIA = ({ papelLogado, dadosOficina, setAbaAtiva, listaCarros }) => {
    const recognitionRef = useRef(null);

    // Puxando o motor Gemini nativo que você já tem!
    const { analyzeText } = useGemini();

    const gerarDiagnosticoNativo = async () => {
        if (!sintoma && !obd) return alert('⚠️ Descreva o sintoma ou informe o código OBD!');

        const veiculo = [marca, modelo, motor, ano].filter(Boolean).join(' ');

        const prompt = `Atue como um mecânico automotivo especialista sênior com 20 anos de experiência. Responda em português do Brasil de forma técnica, prática e direta.
        VEÍCULO: ${veiculo || 'não informado'}
        CÓDIGO OBD/DTC: ${obd || 'Nenhum'}
        SINTOMA / PROBLEMA: ${sintoma}
        
        Por favor, vá direto ao ponto e diga:
        1. As 3 causas mais prováveis.
        2. O que testar primeiro para não perder tempo.`;

        try {
            setPromptGerado("⏳ O Gemini 2.0 Flash está analisando o defeito...");
            setMostrarGuia(null);

            // Chama a SUA função nativa, sem erro de bloqueio!
            const respostaIA = await analyzeText(prompt);

            setPromptGerado("🤖 DIAGNÓSTICO DO MECÂNICO CHEFE (GEMINI):\n\n" + respostaIA);

            // Rola a tela para baixo para ver a resposta
            setTimeout(() => document.getElementById('prompt-resultado')?.scrollIntoView({ behavior: 'smooth' }), 100);

        } catch (erro) {
            console.error("Erro no Gemini:", erro);
            setPromptGerado("❌ Erro ao gerar diagnóstico: " + erro.message);
        }
    };

    // -- Form de diagnóstico --
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [ano, setAno] = useState('');
    const [motor, setMotor] = useState('');
    const [sintoma, setSintoma] = useState('');
    const [obd, setObd] = useState('');
    const [escutando, setEscutando] = useState('');

    // -- Prompt gerado --
    const [promptGerado, setPromptGerado] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [mostrarGuia, setMostrarGuia] = useState(null); // 'camera' | 'foto' | 'texto'

    const temAcesso = papelLogado === 'master' || papelLogado === 'dono' || dadosOficina?.plano === 'pago' || dadosOficina?.plano === 'trial';

    const ouvirCampo = (setter) => {
        if (!('webkitSpeechRecognition' in window)) return alert('Voz não suportada neste navegador.');
        if (escutando) { recognitionRef.current?.stop(); setEscutando(''); return; }
        const rec = new window.webkitSpeechRecognition();
        rec.lang = 'pt-BR'; recognitionRef.current = rec;
        rec.onstart = () => setEscutando(setter.name || 'on');
        rec.onresult = (e) => setter(e.results[0][0].transcript);
        rec.onend = () => setEscutando('');
        rec.start();
    };

    const gerarPrompt = () => {
        if (!sintoma && !obd) return alert('⚠️ Descreva o sintoma ou informe o código OBD!');
        const veiculo = [marca, modelo, motor, ano].filter(Boolean).join(' ');
        const p = `Você é um mecânico automotivo especialista sênior com 20 anos de experiência. Responda em português do Brasil de forma técnica, prática e direta.

VEÍCULO: ${veiculo || 'não informado'}${obd ? `\nCÓDIGO OBD/DTC: ${obd}` : ''}
SINTOMA / PROBLEMA: ${sintoma || 'ver código OBD'}

Por favor, responda com:
1️⃣ POSSÍVEIS CAUSAS (liste do mais ao menos provável)
2️⃣ TESTES RECOMENDADOS (passo a passo prático)
3️⃣ PEÇAS QUE PODEM ESTAR DEFEITUOSAS
4️⃣ TEMPO MÉDIO DE REPARO
5️⃣ VALOR MÉDIO DO SERVIÇO (peças + mão de obra, mercado brasileiro)
6️⃣ ORDEM DE DIAGNÓSTICO (o que verificar primeiro para economizar tempo)

Seja direto e prático. O mecânico está na oficina agora.`;
        setPromptGerado(p);
        setMostrarGuia(null);
        setTimeout(() => document.getElementById('prompt-resultado')?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const [mensagemCliente, setMensagemCliente] = useState('');
    const [copiadoCliente, setCopiadoCliente] = useState(false);

    const copiarPrompt = () => {
        navigator.clipboard.writeText(promptGerado);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    const gerarMensagemCliente = async () => {
        if (!sintoma && !promptGerado) return alert('⚠️ Gere primeiro o diagnóstico técnico!');
        
        const veiculo = [marca, modelo, motor, ano].filter(Boolean).join(' ') || 'veículo';
        
        const promptMensagem = `Transforme o diagnóstico técnico abaixo numa mensagem friendly para enviar ao cliente do veículo. 

VEÍCULO: ${veiculo}
SINTOMA RELATADO: ${sintoma || 'não informado'}
CÓDIGO OBD: ${obd || 'não informado'}

DIAGNÓSTICO TÉCNICO:
${promptGerado}

Crie uma mensagem em português brasileiro que:
1. Comece com saudação amigável
2. Explique o problema em palavras simples (sem术语 técnicos)
3. Mencione as possíveis soluções de forma clara
4. Inclua estimativa de tempo e valor (se mencionado no diagnóstico)
5. Termine com opção de confirmação

Mantenha um tom profissional mas acessível. Use emojis sparingly. máximo 300 palavras.`;

        try {
            const respostaIA = await analyzeText(promptMensagem);
            const msg = `🚗 *Orçamento Express Tech*\n\n${respostaIA}`;
            setMensagemCliente(msg);
            setTimeout(() => document.getElementById('mensagem-cliente')?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (erro) {
            console.error("Erro ao gerar mensagem:", erro);
            alert('❌ Erro ao gerar mensagem: ' + erro.message);
        }
    };

    const copiarMensagemCliente = () => {
        navigator.clipboard.writeText(mensagemCliente);
        setCopiadoCliente(true);
        setTimeout(() => setCopiadoCliente(false), 2500);
    };

    const abrirWhatsApp = () => {
        const msg = encodeURIComponent(mensagemCliente);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    const abrirGeminiComPrompt = () => {
        const url = `https://gemini.google.com/app?hl=pt-BR`;
        window.open(url, '_blank');
        setTimeout(() => copiarPrompt(), 300);
    };

    const criarOS = () => {
        if (setAbaAtiva) setAbaAtiva('os');
    };

    const EXEMPLOS_RAPIDOS = [
        { label: '🔴 Falha na lenta', marca: '', modelo: '', motor: '', ano: '', sintoma: 'Motor falhando em marcha lenta, tremendo e apagando', obd: '' },
        { label: '🔴 P0420', marca: '', modelo: '', motor: '', ano: '', sintoma: 'Luz do motor acesa', obd: 'P0420' },
        { label: '🔴 Não pega', marca: '', modelo: '', motor: '', ano: '', sintoma: 'Carro não pega, motor gira mas não pega', obd: '' },
        { label: '🔴 Superaquecendo', marca: '', modelo: '', motor: '', ano: '', sintoma: 'Temperatura subindo, água sumindo, fumaça branca', obd: '' },
        { label: '🔴 Bateria ok, não pega', marca: '', modelo: '', motor: '', ano: '', sintoma: 'Bateria nova e carregada mas carro não pega', obd: '' },
        { label: '🔴 Barulho suspensão', marca: '', modelo: '', motor: '', ano: '', sintoma: 'Barulho de estalos na suspensão dianteira ao passar em buracos', obd: '' },
    ];

    if (!temAcesso) return (
        <div style={{ background: '#1a0000', border: '1px solid #ef4444', padding: '30px', borderRadius: '15px', textAlign: 'center' }}>
            <h3 style={{ color: '#ef4444' }}>👑 Módulo Premium</h3>
            <p style={{ color: '#888' }}>O Copiloto Técnico IA é exclusivo para assinantes.</p>
        </div>
    );

    return (
        <div style={{ color: 'white', fontFamily: 'sans-serif' }}>

            {/* -- HEADER -- */}
            <div style={{ background: `linear-gradient(135deg, ${COPILOTO_COLOR}22, transparent)`, border: `1px solid ${COPILOTO_COLOR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 4px', color: COPILOTO_COLOR, fontSize: '22px', fontWeight: '900' }}>🤖 Copiloto Técnico IA</h2>
                <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>Descreva o problema ➔ sistema gera o diagnóstico técnico perfeito ➔ abre no Gemini com 1 clique</p>
            </div>

            {/* -- EXEMPLOS RÁPIDOS -- */}
            <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 8px' }}>⚡ EXEMPLOS RÁPIDOS</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {EXEMPLOS_RAPIDOS.map((ex, i) => (
                        <button key={i} onClick={() => { setMarca(ex.marca); setModelo(ex.modelo); setMotor(ex.motor); setAno(ex.ano); setSintoma(ex.sintoma); setObd(ex.obd); setPromptGerado(''); }}
                            style={{ padding: '8px 12px', background: '#111', color: COPILOTO_COLOR, border: `1px solid ${COPILOTO_COLOR}44`, borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {ex.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* -- FORMULÁRIO -- */}
            <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
                <p style={{ color: COPILOTO_COLOR, fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', margin: '0 0 14px' }}>🚘 DADOS DO VEÍCULO (opcional, mas melhora o diagnóstico)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    {[
                        { val: marca, set: setMarca, ph: 'MARCA (ex: Fiat)' },
                        { val: modelo, set: setModelo, ph: 'MODELO (ex: Palio)' },
                        { val: motor, set: setMotor, ph: 'MOTOR (ex: 1.0 Fire)' },
                        { val: ano, set: setAno, ph: 'ANO (ex: 2018)' },
                    ].map(({ val, set, ph }, i) => (
                        <input key={i} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                            style={{ padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', width: '100%' }} />
                    ))}
                </div>

                {/* Código OBD */}
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', margin: '0 0 6px', letterSpacing: '1px' }}>🔌 CÓDIGO OBD/DTC (se tiver scanner)</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {['P0420', 'P0300', 'P0301', 'P0171', 'P0442', 'P0128', 'B1000', 'C0035', 'U0100'].map(c => (
                            <button key={c} onClick={() => setObd(prev => prev ? prev + ', ' + c : c)}
                                style={{ padding: '5px 10px', background: obd.includes(c) ? '#1a0000' : '#0a0a0a', color: obd.includes(c) ? '#ef4444' : '#555', border: `1px solid ${obd.includes(c) ? '#ef4444' : '#2a2a2a'}`, borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {c}
                            </button>
                        ))}
                    </div>
                    <input value={obd} onChange={e => setObd(e.target.value)} placeholder="Ou digite o código manualmente (ex: P0420, P0300)"
                        style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: `1px solid ${obd ? '#ef4444' : '#333'}`, color: '#ef4444', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', boxSizing: 'border-box' }} />
                </div>

                {/* Sintoma — campo principal */}
                <div>
                    <p style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', margin: '0 0 6px', letterSpacing: '1px' }}>⚠️ SINTOMA / PROBLEMA * (obrigatório)</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <textarea value={sintoma} onChange={e => setSintoma(e.target.value)}
                            placeholder="Ex: motor falhando na lenta, tremendo, consumo alto, fumaça preta, barulho ao frear..."
                            rows={3} style={{ flex: 1, padding: '12px', background: '#0a0a0a', border: `1px solid ${sintoma ? COPILOTO_COLOR : '#333'}`, color: 'white', borderRadius: '8px', resize: 'vertical', fontSize: '13px', boxSizing: 'border-box' }} />
                        <button onClick={() => ouvirCampo(setSintoma)}
                            style={{ width: '50px', background: escutando ? '#ff003322' : '#1a0030', color: escutando ? '#ff0033' : COPILOTO_COLOR, border: `1px solid ${escutando ? '#ff0033' : COPILOTO_COLOR}`, borderRadius: '8px', fontSize: '22px', cursor: 'pointer', flexShrink: 0 }}>
                            {escutando ? '🔴' : '🎙️'}
                        </button>
                    </div>
                </div>
            </div>

            {/* -- BOTÃO GERAR NATIVO -- */}
            <button onClick={gerarDiagnosticoNativo}
                style={{ width: '100%', padding: '18px', background: '#00E676', color: 'black', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', marginBottom: '10px', letterSpacing: '0.5px' }}>
                🚀 DIAGNÓSTICO COM GEMINI 2.0 (NATIVO)
            </button>

            {/* -- BOTÃO GERAR -- */}
            <button onClick={gerarPrompt}
                style={{ width: '100%', padding: '18px', background: `linear-gradient(135deg, ${COPILOTO_COLOR}, #7c3aed)`, color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', marginBottom: '20px', letterSpacing: '0.5px' }}>
                🤖 GERAR DIAGNÓSTICO TÉCNICO
            </button>


            {/* -- RESULTADO DO PROMPT -- */}
            {promptGerado && (
                <div id="prompt-resultado" style={{ marginBottom: '20px' }}>
                    <div style={{ background: '#0d0020', border: `2px solid ${COPILOTO_COLOR}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <p style={{ margin: 0, color: COPILOTO_COLOR, fontWeight: '900', fontSize: '14px' }}>✅ Diagnóstico técnico gerado!</p>
                            <button onClick={copiarPrompt} style={{ padding: '6px 14px', background: copiado ? '#00E67622' : '#1a0030', color: copiado ? '#00E676' : COPILOTO_COLOR, border: `1px solid ${copiado ? '#00E676' : COPILOTO_COLOR}`, borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {copiado ? '✅ Copiado!' : '📋 Copiar'}
                            </button>
                        </div>
                        <pre style={{ color: '#ccc', fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: 0, background: '#1a0030', padding: '14px', borderRadius: '8px' }}>
                            {promptGerado}
                        </pre>
                    </div>

                    {/* -- 3 BOTÕES DE AÇÃO -- */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <button onClick={abrirGeminiComPrompt}
                            style={{ padding: '16px 12px', background: `linear-gradient(135deg, ${COPILOTO_COLOR}, #7c3aed)`, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', textAlign: 'center' }}>
                            🌌 Abrir no Gemini<br /><span style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8 }}>prompt já copiado</span>
                        </button>
                        <button onClick={criarOS}
                            style={{ padding: '16px 12px', background: '#1a0000', color: '#FF0033', border: '2px solid #FF0033', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', textAlign: 'center' }}>
                            📋 Criar O.S.<br /><span style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.8 }}>com esses dados</span>
                        </button>
                    </div>

                    {/* -- BOTÃO MENSAGEM CLIENTE -- */}
                    <button onClick={gerarMensagemCliente}
                        style={{ width: '100%', padding: '14px', background: '#25D366', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span>💬</span> Gerar Mensagem p/ Cliente (WhatsApp)
                    </button>

                    {/* -- MENSAGEM CLIENTE -- */}
                    {mensagemCliente && (
                        <div id="mensagem-cliente" style={{ background: '#0a2a10', border: '2px solid #25D366', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <p style={{ margin: 0, color: '#25D366', fontWeight: '900', fontSize: '14px' }}>📱 Mensagem para o Cliente</p>
                                <button onClick={copiarMensagemCliente} style={{ padding: '6px 14px', background: copiadoCliente ? '#25D36622' : '#0a2a10', color: copiadoCliente ? '#25D366' : '#25D366', border: `1px solid ${copiadoCliente ? '#25D366' : '#25D366'}`, borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {copiadoCliente ? '✅ Copiado!' : '📋 Copiar'}
                                </button>
                            </div>
                            <pre style={{ color: '#ccc', fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.5', margin: 0, background: '#0d3520', padding: '12px', borderRadius: '8px' }}>
                                {mensagemCliente}
                            </pre>
                            <button onClick={abrirWhatsApp}
                                style={{ width: '100%', marginTop: '12px', padding: '12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                📱 Abrir no WhatsApp
                            </button>
                        </div>
                    )}

                    {/* -- GUIA DE USO DA CÂMERA -- */}
                    <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '16px' }}>
                        <p style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', margin: '0 0 12px', letterSpacing: '1px' }}>📷 COMO USAR NO GEMINI — ESCOLHA O MODO:</p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                            {[
                                { key: 'camera', label: '🎥 Câmera ao Vivo', desc: 'Melhor opção', cor: '#00E676' },
                                { key: 'foto', label: '📸 Foto', desc: 'Imagem estática', cor: '#38bdf8' },
                                { key: 'texto', label: '📝 Só texto', desc: 'Sem imagem', cor: COPILOTO_COLOR },
                            ].map(opt => (
                                <button key={opt.key} onClick={() => setMostrarGuia(mostrarGuia === opt.key ? null : opt.key)}
                                    style={{ flex: 1, minWidth: '90px', padding: '10px 8px', background: mostrarGuia === opt.key ? opt.cor + '22' : '#0a0a0a', color: mostrarGuia === opt.key ? opt.cor : '#666', border: `1px solid ${mostrarGuia === opt.key ? opt.cor : '#2a2a2a'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontWeight: 'bold', fontSize: '12px' }}>{opt.label}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{opt.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* GUIA CÂMERA AO VIVO */}
                        {mostrarGuia === 'camera' && (
                            <div style={{ background: '#001a0a', border: '1px solid #00E676', borderRadius: '10px', padding: '14px' }}>
                                <p style={{ color: '#00E676', fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🎥 CÂMERA AO VIVO — Modo mais poderoso!</p>
                                {[
                                    '1️⃣ Abra o APP GEMINI no celular (não o site — precisa ser o app)',
                                    '2️⃣ Cole o prompt copiado no campo de texto',
                                    '3️⃣ Toque no icone de câmera 📷 ao lado do microfone',
                                    '4️⃣ Aponte para a peça, código no scanner, barulho ou fumaça',
                                    '5️⃣ O Gemini vê em tempo real e responde por áudio',
                                ].map((p, i) => (
                                    <p key={i} style={{ color: '#ccc', fontSize: '12px', margin: '0 0 6px', padding: '8px 10px', background: '#002a10', borderRadius: '6px', borderLeft: '3px solid #00E676' }}>{p}</p>
                                ))}
                                <div style={{ background: '#001a0a', border: '1px solid #eab308', borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
                                    <p style={{ color: '#eab308', fontSize: '11px', margin: 0 }}>💡 <strong>Dica:</strong> Ideal para barulhos, vibrações, fumaça, vazamentos e peças dificeis de fotografar. O Gemini analisa enquanto você aponta!</p>
                                </div>
                                <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.bard" target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'block', marginTop: '10px', padding: '10px', background: '#00E676', color: 'black', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}>
                                    📥 Baixar App Gemini (Android)
                                </a>
                            </div>
                        )}

                        {/* GUIA FOTO */}
                        {mostrarGuia === 'foto' && (
                            <div style={{ background: '#001a1f', border: '1px solid #38bdf8', borderRadius: '10px', padding: '14px' }}>
                                <p style={{ color: '#38bdf8', fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>📸 DIAGNÓSTICO POR FOTO</p>
                                {[
                                    '1️⃣ Abra gemini.google.com no celular ou PC',
                                    '2️⃣ Cole o prompt copiado no campo de texto',
                                    '3️⃣ Toque em 📎 (clipe/anexar) e selecione a foto',
                                    '4️⃣ Fotos úteis: peça danificada, código no scanner, vazamento, desgaste',
                                    '5️⃣ O Gemini analisa a imagem junto com o diagnóstico',
                                ].map((p, i) => (
                                    <p key={i} style={{ color: '#ccc', fontSize: '12px', margin: '0 0 6px', padding: '8px 10px', background: '#001a22', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>{p}</p>
                                ))}
                                <div style={{ background: '#001a22', border: '1px solid #eab308', borderRadius: '8px', padding: '10px', marginTop: '10px' }}>
                                    <p style={{ color: '#eab308', fontSize: '11px', margin: 0 }}>💡 <strong>Dica:</strong> Fotografe o código que aparece no scanner, a peça desgastada ou o local do vazamento. O Gemini identifica com precisão!</p>
                                </div>
                            </div>
                        )}

                        {/* GUIA TEXTO */}
                        {mostrarGuia === 'texto' && (
                            <div style={{ background: '#0d0020', border: `1px solid ${COPILOTO_COLOR}`, borderRadius: '10px', padding: '14px' }}>
                                <p style={{ color: COPILOTO_COLOR, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>📝 SÓ TEXTO — Simples e eficaz</p>
                                {[
                                    '1️⃣ Abra gemini.google.com ou o app Gemini',
                                    '2️⃣ Cole o prompt que foi copiado automaticamente',
                                    '3️⃣ Envie — o Gemini já responde com o diagnóstico completo',
                                    '4️⃣ Peça mais detalhes: torques, procedimentos, especificações',
                                ].map((p, i) => (
                                    <p key={i} style={{ color: '#ccc', fontSize: '12px', margin: '0 0 6px', padding: '8px 10px', background: '#1a0030', borderRadius: '6px', borderLeft: `3px solid ${COPILOTO_COLOR}` }}>{p}</p>
                                ))}
                            </div>
                        )}

                        {/* Botão direto para Gemini */}
                        <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', marginTop: '14px', padding: '14px', background: `linear-gradient(135deg, ${COPILOTO_COLOR}, #7c3aed)`, color: 'white', borderRadius: '10px', textAlign: 'center', fontWeight: '900', textDecoration: 'none', fontSize: '14px' }}>
                            🌌 Abrir Gemini agora ➔
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CopilotoIA;