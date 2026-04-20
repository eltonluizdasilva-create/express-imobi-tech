import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { AlertTriangle, ArrowRight, Save, X, Camera, Trash2, Plus } from "lucide-react";
import { db } from './lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
    oficinaId,
    osParaEditar,
    onCancelar,
    onSalvo,
    subAbaEletrica,
    setSubAbaEletrica,
    irParaNovaOS,
}) {
    const [showBlocker, setShowBlocker] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    const [marcaBateria, setMarcaBateria] = useState('');
    const [amperagemBateria, setAmperagemBateria] = useState('');
    const [dataInstalacaoBateria, setDataInstalacaoBateria] = useState('');
    const [garantiaMesesBateria, setGarantiaMesesBateria] = useState('12');
    const [lampadas, setLampadas] = useState([]);
    const [trechoFiacao, setTrechoFiacao] = useState('');
    const [tipoFiacao, setTipoFiacao] = useState([]);
    const [fusiveisTrocados, setFusiveisTrocados] = useState([]);
    const [novoFusivel, setNovoFusivel] = useState({ local: '', amperagem: '', motivo: '' });
    const [servicosEletrica, setServicosEletrica] = useState([]);
    const [obsEletrica, setObsEletrica] = useState('');
    const [fotosEletrica, setFotosEletrica] = useState([]);
    const [legendaFotoEletrica, setLegendaFotoEletrica] = useState('');
    const [valorPecasEletrica, setValorPecasEletrica] = useState('');
    const [valorMaoObraEletrica, setValorMaoObraEletrica] = useState('');

    useEffect(() => {
        console.log('Eletrica: osParaEditar prop changed', osParaEditar);
        if (!osParaEditar) return;

        const d = osParaEditar.dadosEletrica || {};
        setMarcaBateria(d.marcaBateria || '');
        setAmperagemBateria(d.amperagemBateria || '');
        setDataInstalacaoBateria(d.dataInstalacaoBateria || '');
        setGarantiaMesesBateria(d.garantiaMesesBateria || '12');
        setLampadas(d.lampadas || []);
        setTrechoFiacao(d.trechoFiacao || '');
        setTipoFiacao(d.tipoFiacao || []);
        setFusiveisTrocados(d.fusiveisTrocados || []);
        setServicosEletrica(d.servicosEletrica || []);

        setObsEletrica(osParaEditar.obsEletrica || osParaEditar.checklist || '');
        setFotosEletrica(osParaEditar.fotos || []);
        setValorPecasEletrica(osParaEditar.valorPecas?.toString() || '');
        setValorMaoObraEletrica(osParaEditar.valorMaoObra?.toString() || '');
    }, [osParaEditar]);

    const totalEletrica = useMemo(
        () => (Number(valorPecasEletrica) || 0) + (Number(valorMaoObraEletrica) || 0),
        [valorPecasEletrica, valorMaoObraEletrica]
    );

    const previewVencBateria = useMemo(() => {
        if (!dataInstalacaoBateria || !garantiaMesesBateria) return null;
        const d = new Date(dataInstalacaoBateria);
        if (isNaN(d.getTime())) return null;
        d.setMonth(d.getMonth() + Number(garantiaMesesBateria));
        return d.toLocaleDateString('pt-BR');
    }, [dataInstalacaoBateria, garantiaMesesBateria]);

    const handleSalvarTentativa = useCallback(async () => {
        if (!osParaEditar) {
            setShowBlocker(true);
            return;
        }

        setSalvando(true);
        try {
            const payload = {
                tipoServico: 'eletrica',
                valorPecas: Number(valorPecasEletrica) || 0,
                valorMaoObra: Number(valorMaoObraEletrica) || 0,
                total: totalEletrica,
                fotos: fotosEletrica,
                obsEletrica: obsEletrica,
                checklist: obsEletrica, // Compatibilidade com ListaOS
                dadosEletrica: {
                    marcaBateria,
                    amperagemBateria,
                    dataInstalacaoBateria,
                    garantiaMesesBateria,
                    lampadas,
                    trechoFiacao,
                    tipoFiacao,
                    fusiveisTrocados,
                    servicosEletrica
                },
                data_atualizacao: new Date().toISOString()
            };
            console.log('Eletrica: Payload before updateDoc', payload);

            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), payload);

            const retornoSincronizacao = await sincronizarRetornosAutomaticos({
                oficinaId,
                osId: osParaEditar.id,
                osData: payload,
                osBase: osParaEditar,
            });
            console.log('Eletrica: sincronizarRetornosAutomaticos result', retornoSincronizacao);

            setSucesso(true);
            if (onSalvo) onSalvo();
            setTimeout(() => {
                setSucesso(false);
                if (onCancelar) onCancelar();
            }, 1500);
        } catch (error) {
            console.error("Erro ao salvar elétrica:", error);
            alert("Erro ao salvar: " + error.message);
        } finally {
            setSalvando(false);
        }
    }, [oficinaId, osParaEditar, valorPecasEletrica, valorMaoObraEletrica, totalEletrica, fotosEletrica, obsEletrica, marcaBateria, amperagemBateria, dataInstalacaoBateria, garantiaMesesBateria, lampadas, trechoFiacao, tipoFiacao, fusiveisTrocados, servicosEletrica, onSalvo, onCancelar]);

    const comprimirFoto = async (base64) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    };

    return (
        <div style={{ position: 'relative', color: '#eee', paddingBottom: '40px' }}>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: COR, margin: 0 }}>⚡ Elétrica</h2>
                {onCancelar && (
                    <button onClick={onCancelar} style={{ background: '#222', color: '#888', border: '1px solid #333', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {osParaEditar && (
                <div style={{ background: '#1a1500', border: `2px solid ${COR}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: COR, fontWeight: 'bold', fontSize: '14px' }}>✏️ EDITANDO O.S. — {osParaEditar.placa}</span>
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
                        <div>
                            <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>MARCA</label>
                            <input value={marcaBateria} onChange={e => setMarcaBateria(e.target.value)} placeholder="Ex: Heliar, Moura..." style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>AMPERAGEM (Ah)</label>
                            <input value={amperagemBateria} onChange={e => setAmperagemBateria(e.target.value)} placeholder="Ex: 60, 70, 90..." style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>📅 DATA DE INSTALAÇÃO</label>
                            <input type="date" value={dataInstalacaoBateria} onChange={e => setDataInstalacaoBateria(e.target.value)} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>🛡️ GARANTIA</label>
                            <select value={garantiaMesesBateria} onChange={e => setGarantiaMesesBateria(e.target.value)} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }}>
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
                            const item = lampadas.find(l => l.local === loc);
                            return (
                                <button key={loc} onClick={() => {
                                    item ? setLampadas(p => p.filter(l => l.local !== loc)) : setLampadas(p => [...p, { local: loc, tipo: 'LED' }])
                                }}
                                    style={{ padding: '10px 8px', border: `2px solid ${item ? COR : '#333'}`, background: item ? `${COR}22` : '#0a0a0a', color: item ? COR : '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                                    {item ? '✅ ' : ''}{loc}
                                </button>
                            );
                        })}
                    </div>
                    {lampadas.length > 0 && lampadas.map((l, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: COR, fontSize: '12px', flex: 1 }}>{l.local}</span>
                            <select value={l.tipo} onChange={e => setLampadas(p => p.map((x, idx) => idx === i ? { ...x, tipo: e.target.value } : x))} style={{ padding: '6px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }}>
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
                            <button key={tipo} onClick={() => { setTipoFiacao(p => p.includes(tipo) ? p.filter(x => x !== tipo) : [...p, tipo]) }}
                                style={{ padding: '10px 8px', border: `2px solid ${tipoFiacao.includes(tipo) ? COR : '#333'}`, background: tipoFiacao.includes(tipo) ? `${COR}22` : '#0a0a0a', color: tipoFiacao.includes(tipo) ? COR : '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                                {tipoFiacao.includes(tipo) ? '✅ ' : ''}{tipo}
                            </button>
                        ))}
                    </div>
                    <textarea value={trechoFiacao} onChange={e => setTrechoFiacao(e.target.value)} rows={3} placeholder="Descreva o trecho, problema e solução..." style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
            )}

            {subAbaEletrica === 'fusiveis' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>⚡ FUSÍVEIS TROCADOS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <input value={novoFusivel.local} onChange={e => setNovoFusivel(p => ({ ...p, local: e.target.value }))} placeholder="Local/Circuito" style={{ padding: '10px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        <input value={novoFusivel.amperagem} onChange={e => setNovoFusivel(p => ({ ...p, amperagem: e.target.value }))} placeholder="Amperagem" style={{ padding: '10px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                        <input value={novoFusivel.motivo} onChange={e => setNovoFusivel(p => ({ ...p, motivo: e.target.value }))} placeholder="Motivo" style={{ padding: '10px', background: '#0a0a0a', border: '1px solid #444', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                    </div>
                    <button onClick={() => { if (!novoFusivel.local) return; setFusiveisTrocados(p => [...p, { ...novoFusivel }]); setNovoFusivel({ local: '', amperagem: '', motivo: '' }); }}
                        style={{ width: '100%', padding: '10px', background: `${COR}33`, color: COR, border: `1px solid ${COR}`, borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>+ Adicionar Fusível</button>
                    {fusiveisTrocados.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0a0a0a', borderRadius: '6px', marginBottom: '6px', border: '1px solid #222' }}>
                            <span style={{ color: COR, fontSize: '12px' }}>⚡ {f.local} {f.amperagem ? `— ${f.amperagem}A` : ''} {f.motivo ? `— ${f.motivo}` : ''}</span>
                            <button onClick={() => { setFusiveisTrocados(p => p.filter((_, idx) => idx !== i)) }} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                        </div>
                    ))}
                </div>
            )}

            {subAbaEletrica === 'geral' && (
                <div style={{ background: '#111', padding: '16px', borderRadius: '10px', marginBottom: '15px' }}>
                    <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px' }}>🔧 SERVIÇOS ELÉTRICOS GERAIS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {['Alternador', 'Motor de Arranque', 'Regulador de Tensão', 'Sensor de O² (Sonda)', 'Sensor MAP/MAF', 'Injetor Elétrico', 'Bobina de Ignição', 'Módulo ECU', 'Alarme/Rastreador', 'Vidro Elétrico', 'Trava Elétrica', 'Ar Cond. Elétrico', 'Sonorização', 'Outro'].map(s => (
                            <button key={s} onClick={() => { setServicosEletrica(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]) }}
                                style={{ padding: '10px 8px', border: `2px solid ${servicosEletrica.includes(s) ? COR : '#333'}`, background: servicosEletrica.includes(s) ? `${COR}22` : '#0a0a0a', color: servicosEletrica.includes(s) ? COR : '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', textAlign: 'left' }}>
                                {servicosEletrica.includes(s) ? '✅ ' : ''}{s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: '#111', padding: '14px', borderRadius: '10px', marginBottom: '15px' }}>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📝 OBSERVAÇÕES / DIAGNÓSTICO</label>
                <textarea value={obsEletrica} onChange={e => setObsEletrica(e.target.value)} rows={3} placeholder="Diagnóstico, peças usadas, observações técnicas..." style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ background: '#111', padding: '14px', borderRadius: '10px', marginBottom: '15px' }}>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTOS ({fotosEletrica.length}/10)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input value={legendaFotoEletrica} onChange={e => setLegendaFotoEletrica(e.target.value)} placeholder="Legenda da foto..." style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <label style={{ display: 'block', padding: '12px', background: fotosEletrica.length >= 10 ? '#222' : '#1a1a00', border: `1px dashed ${fotosEletrica.length >= 10 ? '#444' : COR}`, borderRadius: '6px', textAlign: 'center', cursor: fotosEletrica.length >= 10 ? 'not-allowed' : 'pointer', color: fotosEletrica.length >= 10 ? '#555' : 'white', fontWeight: 'bold' }}>
                    📷 {fotosEletrica.length >= 10 ? 'LIMITE ATINGIDO' : 'TIRAR FOTO'}
                    <input type="file" accept="image/*" capture="environment" disabled={fotosEletrica.length >= 10} onChange={async e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onloadend = async () => {
                            const c = await comprimirFoto(r.result);
                            setFotosEletrica(p => [...p, { foto: c, legenda: legendaFotoEletrica || '', dataEnvio: new Date().toLocaleString('pt-BR') }]);
                            setLegendaFotoEletrica('');
                        };
                        r.readAsDataURL(f);
                    }} style={{ display: 'none' }} />
                </label>
                {fotosEletrica.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {fotosEletrica.map((f, i) => (
                            <div key={i} className="relative group" style={{ width: '90px', height: '110px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={f.foto} alt={f.legenda} style={{ width: '90px', height: '90px', objectFit: 'cover' }} />
                                <div style={{ background: 'rgba(0,0,0,0.85)', color: 'white', fontSize: '9px', padding: '3px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.legenda || 'Sem legenda'}</div>
                                <button onClick={() => setFotosEletrica(p => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div style={{ background: '#111', padding: '14px', borderRadius: '10px' }}>
                    <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '6px' }}>💰 PEÇAS (R$)</label>
                    <input type="number" value={valorPecasEletrica} onChange={e => setValorPecasEletrica(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: `1px solid ${COR}44`, color: COR, borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }} />
                </div>
                <div style={{ background: '#111', padding: '14px', borderRadius: '10px' }}>
                    <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '6px' }}>🔧 MÃO DE OBRA (R$)</label>
                    <input type="number" value={valorMaoObraEletrica} onChange={e => setValorMaoObraEletrica(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: `1px solid ${COR}44`, color: COR, borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxSizing: 'border-box' }} />
                </div>
            </div>

            <div style={{ background: '#1a1500', border: `1px solid ${COR}44`, padding: '14px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>TOTAL: </span>
                <strong style={{ color: COR, fontSize: '22px' }}>{totalEletrica.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </div>

            <button onClick={handleSalvarTentativa} disabled={salvando}
                style={{ width: '100%', padding: '20px', background: salvando ? '#333' : COR, color: 'black', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '900', cursor: 'pointer', display: 'flex', items: 'center', justifyContent: 'center', gap: '10px', boxShadow: `0 4px 20px ${COR}33` }}>
                {salvando ? '⏳ SALVANDO...' : sucesso ? '✅ O.S. ATUALIZADA!' : <><Save size={24} /> GERAR LAUDO ELÉTRICO</>}
            </button>
        </div>
    );
}
