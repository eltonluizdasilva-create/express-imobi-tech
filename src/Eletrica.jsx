import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight } from "lucide-react";
import { sincronizarRetornosAutomaticos } from './lib/retornos';

const COR = '#facc15';
const SUB_ABAS = [
    { key: 'bateria', label: '🔋 Bateria' },
    { key: 'iluminacao', label: '💡 Iluminação' },
    { key: 'fiacao', label: '🔌 Fiação' },
    { key: 'fusiveis', label: '⚡ Fusíveis' },
    { key: 'geral', label: '🔧 Geral' },
];

export default function Eletrica({
    osEditando,
    setOsEditando,
    subAbaEletrica,
    setSubAbaEletrica,
    nomeClienteEletrica,
    setNomeClienteEletrica,
    placaEletrica,
    setPlacaEletrica,
    telefoneEletrica,
    setTelefoneEletrica,
    modeloEletrica,
    setModeloEletrica,
    valorPecasEletrica,
    setValorPecasEletrica,
    valorMaoObraEletrica,
    setValorMaoObraEletrica,
    obsEletrica,
    setObsEletrica,
    salvandoEletrica,
    salvoEletrica,
    fotosEletrica,
    setFotosEletrica,
    legendaFotoEletrica,
    setLegendaFotoEletrica,
    marcaBateria,
    setMarcaBateria,
    amperagemBateria,
    setAmperagemBateria,
    dataInstalacaoBateria,
    setDataInstalacaoBateria,
    garantiaMesesBateria,
    setGarantiaMesesBateria,
    lampadas,
    setLampadas,
    trechoFiacao,
    setTrechoFiacao,
    tipoFiacao,
    setTipoFiacao,
    fusiveisTrocados,
    setFusiveisTrocados,
    novoFusivel,
    setNovoFusivel,
    servicosEletrica,
    setServicosEletrica,
    normalizarPlaca,
    buscarDadosPorPlaca,
    comprimirFoto,
    salvarEletrica,
    irParaNovaOS
}) {
    const [showBlocker, setShowBlocker] = useState(false);

    // Proteção de Arrays para evitar undefined/null
    const fotosSeguras = useMemo(() => Array.isArray(fotosEletrica) ? fotosEletrica : [], [fotosEletrica]);
    const lampadasSeguras = useMemo(() => Array.isArray(lampadas) ? lampadas : [], [lampadas]);
    const tipoFiacaoSeguro = useMemo(() => Array.isArray(tipoFiacao) ? tipoFiacao : [], [tipoFiacao]);
    const fusiveisSeguras = useMemo(() => Array.isArray(fusiveisTrocados) ? fusiveisTrocados : [], [fusiveisTrocados]);
    const servicosSeguras = useMemo(() => Array.isArray(servicosEletrica) ? servicosEletrica : [], [servicosEletrica]);

    // Proteção de Objeto para evitar undefined/null
    const novoFusivelSeguro = useMemo(
        () => (novoFusivel && typeof novoFusivel === 'object') ? novoFusivel : { local: '', amperagem: '', motivo: '' },
        [novoFusivel]
    );

    const totalEletrica = useMemo(
        () => (Number(valorPecasEletrica) || 0) + (Number(valorMaoObraEletrica) || 0),
        [valorPecasEletrica, valorMaoObraEletrica]
    );

    const previewVencBateria = useMemo(() => {
        if (!dataInstalacaoBateria || !garantiaMesesBateria) return null;
        const d = new Date(dataInstalacaoBateria);
        d.setMonth(d.getMonth() + Number(garantiaMesesBateria));
        return d.toLocaleDateString('pt-BR');
    }, [dataInstalacaoBateria, garantiaMesesBateria]);

    const handleSalvarTentativa = useCallback(async () => {
        if (!osEditando) {
            setShowBlocker(true);
            return;
        }
        if (salvarEletrica) {
            const resultado = await salvarEletrica();
            if (resultado?.oficinaId && resultado?.osId && resultado?.osData) {
                await sincronizarRetornosAutomaticos({
                    oficinaId: resultado.oficinaId,
                    osId: resultado.osId,
                    osData: resultado.osData,
                    osBase: resultado.osBase || {},
                });
            }
        } else {
            console.error("Função salvarEletrica não foi passada para o componente!");
        }
    }, [osEditando, salvarEletrica]);

    const cancelarEdicao = useCallback(() => {
        if (setOsEditando) setOsEditando(null);
        if (setNomeClienteEletrica) setNomeClienteEletrica('');
        if (setPlacaEletrica) setPlacaEletrica('');
        if (setTelefoneEletrica) setTelefoneEletrica('');
        if (setModeloEletrica) setModeloEletrica('');
        if (setValorPecasEletrica) setValorPecasEletrica('');
        if (setValorMaoObraEletrica) setValorMaoObraEletrica('');
        if (setObsEletrica) setObsEletrica('');
        if (setFotosEletrica) setFotosEletrica([]);
        if (setMarcaBateria) setMarcaBateria('');
        if (setAmperagemBateria) setAmperagemBateria('');
        if (setDataInstalacaoBateria) setDataInstalacaoBateria('');
        if (setGarantiaMesesBateria) setGarantiaMesesBateria('12');
        if (setLampadas) setLampadas([]);
        if (setTrechoFiacao) setTrechoFiacao('');
        if (setTipoFiacao) setTipoFiacao([]);
        if (setFusiveisTrocados) setFusiveisTrocados([]);
        if (setServicosEletrica) setServicosEletrica([]);
    }, [
        setAmperagemBateria, setDataInstalacaoBateria, setFotosEletrica, setFusiveisTrocados,
        setGarantiaMesesBateria, setLampadas, setMarcaBateria, setModeloEletrica,
        setNomeClienteEletrica, setObsEletrica, setOsEditando, setPlacaEletrica,
        setServicosEletrica, setTelefoneEletrica, setTipoFiacao, setTrechoFiacao,
        setValorMaoObraEletrica, setValorPecasEletrica
    ]);

    return (
        <div style={{ position: 'relative' }}>
            {showBlocker && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <AlertTriangle size={60} className="text-yellow-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            O laudo de Elétrica precisa de uma O.S.<br />
                            <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
                            <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-yellow-500 hover:bg-yellow-600 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all uppercase">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <h2 style={{ color: COR, marginBottom: '12px' }}>⚡ Elétrica</h2>

            {osEditando && osEditando.tipoServico === 'eletrica' && (
                <div style={{ background: '#1a1500', border: `2px solid ${COR}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: COR, fontWeight: 'bold', fontSize: '14px' }}>✏️ EDITANDO O.S. — {osEditando.placa}</span>
                    <button onClick={cancelarEdicao} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar</button>
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {SUB_ABAS.map((s) => (
                    <button
                        key={s.key}
                        onClick={() => { if (setSubAbaEletrica) setSubAbaEletrica(s.key) }}
                        style={{ padding: '10px 16px', background: subAbaEletrica === s.key ? COR : '#222', color: subAbaEletrica === s.key ? 'black' : '#888', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {subAbaEletrica === 'bateria' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>🔋 DADOS DA BATERIA</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        {[
                            { label: 'MARCA', val: marcaBateria, fn: setMarcaBateria, ph: 'Ex: Heliar, Moura...' },
                            { label: 'AMPERAGEM (Ah)', val: amperagemBateria, fn: setAmperagemBateria, ph: 'Ex: 60, 70, 90...' },
                        ].map(({ label, val, fn, ph }, i) => (
                            <div key={i}>
                                <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>{label}</label>
                                <input value={val || ''} onChange={e => { if (fn) fn(e.target.value) }} placeholder={ph} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                            </div>
                        ))}
                        <div>
                            <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>📅 DATA DE INSTALAÇÃO</label>
                            <input type="date" value={dataInstalacaoBateria || ''} onChange={e => { if (setDataInstalacaoBateria) setDataInstalacaoBateria(e.target.value) }} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>🛡️ GARANTIA</label>
                            <select value={garantiaMesesBateria || '12'} onChange={e => { if (setGarantiaMesesBateria) setGarantiaMesesBateria(e.target.value) }} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }}>
                                {[6, 12, 18, 24, 30, 36, 48].map(m => <option key={m} value={m}>{m} meses</option>)}
                            </select>
                        </div>
                    </div>
                    {previewVencBateria && (
                        <div style={{ background: '#1a1a00', border: `1px solid ${COR}44`, borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '22px' }}>⏰</span>
                            <div>
                                <p style={{ color: COR, fontWeight: 'bold', margin: 0, fontSize: '13px' }}>Garantia vence em: {previewVencBateria}</p>
                                <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0 0' }}>Lembrete automático no Dashboard quando próximo ao vencimento</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {subAbaEletrica === 'iluminacao' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>💡 LÂMPADAS TROCADAS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        {['Farol Direito', 'Farol Esquerdo', 'Milha Direita', 'Milha Esquerda', 'Lanterna Traseira D', 'Lanterna Traseira E', 'Luz de Placa', 'Luz de Freio', 'Luz de Ré', 'Luz Interna', 'Pisca Dianteiro D', 'Pisca Dianteiro E'].map(loc => {
                            const item = lampadasSeguras.find(l => l.local === loc);
                            return (
                                <button key={loc} onClick={() => {
                                    if (!setLampadas) return;
                                    item ? setLampadas(p => (Array.isArray(p) ? p : []).filter(l => l.local !== loc)) : setLampadas(p => [...(Array.isArray(p) ? p : []), { local: loc, tipo: 'LED' }])
                                }}
                                    style={{ padding: '10px 8px', border: `2px solid ${item ? COR : '#333'}`, background: item ? `${COR}22` : '#0a0a0a', color: item ? COR : '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                                    {item ? '✅ ' : ''}{loc}
                                </button>
                            );
                        })}
                    </div>
                    {lampadasSeguras.length > 0 && lampadasSeguras.map((l, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: COR, fontSize: '12px', flex: 1 }}>{l.local}</span>
                            <select value={l.tipo} onChange={e => { if (setLampadas) setLampadas(p => (Array.isArray(p) ? p : []).map((x, idx) => idx === i ? { ...x, tipo: e.target.value } : x)) }} style={{ padding: '6px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }}>
                                {['LED', 'Halógena', 'Xenon', 'HID', 'Outra'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            )}

            {subAbaEletrica === 'fiacao' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>🔌 FIAÇÃO ELÉTRICA</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                        {['Chicote Motor', 'Chicote Painel', 'Alternador', 'Bateria/Cabos', 'Porta/Vidro Elétrico', 'Travas Elétricas', 'Som/Central', 'Sensor de Estacionamento', 'Outro'].map(tipo => (
                            <button key={tipo} onClick={() => { if (setTipoFiacao) setTipoFiacao(p => (Array.isArray(p) ? p : []).includes(tipo) ? (Array.isArray(p) ? p : []).filter(x => x !== tipo) : [...(Array.isArray(p) ? p : []), tipo]) }}
                                style={{ padding: '10px 8px', border: `2px solid ${tipoFiacaoSeguro.includes(tipo) ? COR : '#333'}`, background: tipoFiacaoSeguro.includes(tipo) ? `${COR}22` : '#0a0a0a', color: tipoFiacaoSeguro.includes(tipo) ? COR : '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                                {tipoFiacaoSeguro.includes(tipo) ? '✅ ' : ''}{tipo}
                            </button>
                        ))}
                    </div>
                    <textarea value={trechoFiacao || ''} onChange={e => { if (setTrechoFiacao) setTrechoFiacao(e.target.value) }} rows={3} placeholder="Descreva o trecho, problema e solução..." style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
            )}

            {subAbaEletrica === 'fusiveis' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>⚡ FUSÍVEIS TROCADOS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        {[['local', 'Local/Circuito'], ['amperagem', 'Amperagem'], ['motivo', 'Motivo']].map(([key, ph]) => (
                            <input key={key} value={novoFusivelSeguro[key] || ''} onChange={e => { if (setNovoFusivel) setNovoFusivel(p => ({ ...((p && typeof p === 'object') ? p : {}), [key]: e.target.value })) }} placeholder={ph}
                                style={{ padding: '10px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        ))}
                    </div>
                    <button onClick={() => { if (!(novoFusivelSeguro.local || '').length) return; if (setFusiveisTrocados) setFusiveisTrocados(p => [...(Array.isArray(p) ? p : []), { ...novoFusivelSeguro }]); if (setNovoFusivel) setNovoFusivel({ local: '', amperagem: '', motivo: '' }); }}
                        style={{ width: '100%', padding: '10px', background: `${COR}33`, color: COR, border: `1px solid ${COR}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>+ Adicionar Fusível</button>
                    {fusiveisSeguras.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0a', borderRadius: '6px', marginBottom: '6px', border: '1px solid #222' }}>
                            <span style={{ color: COR, fontSize: '12px' }}>⚡ {f.local} {f.amperagem ? `— ${f.amperagem}A` : ''} {f.motivo ? `— ${f.motivo}` : ''}</span>
                            <button onClick={() => { if (setFusiveisTrocados) setFusiveisTrocados(p => (Array.isArray(p) ? p : []).filter((_, idx) => idx !== i)) }} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                        </div>
                    ))}
                </div>
            )}

            {subAbaEletrica === 'geral' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>🔧 SERVIÇOS ELÉTRICOS GERAIS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {['Alternador', 'Motor de Arranque', 'Regulador de Tensão', 'Sensor de O² (Sonda)', 'Sensor MAP/MAF', 'Injetor Elétrico', 'Bobina de Ignição', 'Módulo ECU', 'Alarme/Rastreador', 'Vidro Elétrico', 'Trava Elétrica', 'Ar Cond. Elétrico', 'Sonorização', 'Outro'].map(s => (
                            <button key={s} onClick={() => { if (setServicosEletrica) setServicosEletrica(p => (Array.isArray(p) ? p : []).includes(s) ? (Array.isArray(p) ? p : []).filter(x => x !== s) : [...(Array.isArray(p) ? p : []), s]) }}
                                style={{ padding: '10px 8px', border: `2px solid ${servicosSeguras.includes(s) ? COR : '#333'}`, background: servicosSeguras.includes(s) ? `${COR}22` : '#0a0a0a', color: servicosSeguras.includes(s) ? COR : '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}>
                                {servicosSeguras.includes(s) ? '✅ ' : ''}{s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: '#111', padding: '14px', borderRadius: '10px', marginBottom: '15px' }}>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📝 OBSERVAÇÕES / DIAGNÓSTICO</label>
                <textarea value={obsEletrica || ''} onChange={e => { if (setObsEletrica) setObsEletrica(e.target.value) }} rows={3} placeholder="Diagnóstico, peças usadas, observações técnicas..." style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ background: '#111', padding: '14px', borderRadius: '10px', marginBottom: '15px' }}>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTOS ({fotosSeguras.length}/10)</label>
                <input value={legendaFotoEletrica || ''} onChange={e => { if (setLegendaFotoEletrica) setLegendaFotoEletrica(e.target.value) }} placeholder="Legenda da foto..." style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <label style={{ display: 'block', padding: '12px', background: fotosSeguras.length >= 10 ? '#222' : '#1a1a00', border: `1px dashed ${fotosSeguras.length >= 10 ? '#444' : COR}`, borderRadius: '6px', textAlign: 'center', cursor: fotosSeguras.length >= 10 ? 'not-allowed' : 'pointer', color: fotosSeguras.length >= 10 ? '#555' : 'white', fontWeight: 'bold' }}>
                    📷 {fotosSeguras.length >= 10 ? 'LIMITE ATINGIDO' : 'TIRAR FOTO'}
                    <input type="file" accept="image/*" capture="environment" disabled={fotosSeguras.length >= 10} onChange={async e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onloadend = async () => {
                            if (comprimirFoto && setFotosEletrica && setLegendaFotoEletrica) {
                                const c = await comprimirFoto(r.result);
                                setFotosEletrica(p => [...(Array.isArray(p) ? p : []), { foto: c, legenda: legendaFotoEletrica || '', dataEnvio: new Date().toLocaleString('pt-BR') }]);
                                setLegendaFotoEletrica('');
                            }
                        };
                        r.readAsDataURL(f);
                    }} style={{ display: 'none' }} />
                </label>
                {fotosSeguras.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {fotosSeguras.map((f, i) => (
                            <div key={i} style={{ position: 'relative', width: '90px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={f.foto} alt={f.legenda} style={{ width: '90px', height: '90px', objectFit: 'cover' }} />
                                <div style={{ background: 'rgba(0,0,0,0.85)', color: 'white', fontSize: '9px', padding: '3px', textAlign: 'center' }}>{f.legenda || 'Sem legenda'}</div>
                                <button onClick={() => { if (setFotosEletrica) setFotosEletrica(p => (Array.isArray(p) ? p : []).filter((_, idx) => idx !== i)) }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                {[['💰 PEÇAS (R$)', valorPecasEletrica, setValorPecasEletrica], ['🔧 MÃO DE OBRA (R$)', valorMaoObraEletrica, setValorMaoObraEletrica]].map(([label, val, fn], i) => (
                    <div key={i} style={{ background: '#111', padding: '14px', borderRadius: '10px' }}>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '6px' }}>{label}</label>
                        <input type="number" value={val || ''} onChange={e => { if (fn) fn(e.target.value) }} placeholder="0" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: `1px solid ${COR}44`, color: COR, borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }} />
                    </div>
                ))}
            </div>

            <div style={{ background: '#1a1500', border: `1px solid ${COR}44`, padding: '14px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>TOTAL: </span>
                <strong style={{ color: COR, fontSize: '22px' }}>{totalEletrica.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>

            <button onClick={handleSalvarTentativa} disabled={salvandoEletrica}
                style={{ width: '100%', padding: '20px', background: salvandoEletrica ? '#333' : COR, color: 'black', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '900', cursor: 'pointer' }}>
                {salvandoEletrica ? '⏳ SALVANDO...' : salvoEletrica ? '✅ SALVO NA O.S.!' : '💾 GERAR O.S. ELÉTRICA'}
            </button>
        </div>
    );
}
