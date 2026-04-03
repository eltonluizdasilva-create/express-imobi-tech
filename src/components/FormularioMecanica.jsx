import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { normalizarPlaca } from '../lib/utils';
import { TEMAS } from './DashboardTab';

const FormularioMecanica = ({
    tema, abaAtiva, subAbaOficina, setSubAbaOficina,
    formVistoria, setFormVistoria, buscarDadosPorPlaca,
    editandoVistoria, setEditandoVistoria, carregarOS,
    oficinaId, dadosOficina, setAbaAtiva
}) => {
    const [fotoAtiva, setFotoAtiva] = useState(0);
    const [salvandoVistoria, setSalvandoVistoria] = useState(false);
    const [ouvindoVistoria, setOuvindoVistoria] = useState(null);
    const [mostrarFormVistoria, setMostrarFormVistoria] = useState(false);

    const toBase64Of = file => new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
    });

    const CONFIGS_OFICINA = {
        mecanica: {
            icon: '🔧', label: 'Mecânica Geral', cor: '#8b5cf6', secoes: [
                {
                    titulo: '🔧 MOTOR & ARREFECIMENTO', itens: [
                        { key: 'motor_estado', label: 'Estado geral do motor', tipo: 'check' },
                        { key: 'motor_vazamento', label: 'Vazamentos de óleo/água', tipo: 'check' },
                        { key: 'motor_correia', label: 'Correia Dentada / Alternador', tipo: 'check' },
                        { key: 'motor_vela', label: 'Velas e Cabos de Ignição', tipo: 'check' },
                        { key: 'motor_arrefecimento', label: 'Líquido de Arrefecimento', tipo: 'check' },
                        { key: 'motor_obs', label: '📝 Observações do motor', tipo: 'texto', ph: 'Detalhes...' }
                    ]
                },
                {
                    titulo: '🛑 FREIOS & SUSPENSÃO', itens: [
                        { key: 'freio_pastilha', label: 'Pastilhas de Freio', tipo: 'check' },
                        { key: 'freio_disco', label: 'Discos de Freio', tipo: 'check' },
                        { key: 'susp_amortecedor', label: 'Amortecedores', tipo: 'check' },
                        { key: 'susp_buchas', label: 'Buchas e Batentes', tipo: 'check' },
                        { key: 'susp_pneu', label: 'Estado dos Pneus', tipo: 'check' },
                    ]
                }
            ]
        },
        motos: {
            icon: '🏍️', label: 'Motos', cor: '#f97316', secoes: [
                {
                    titulo: '🏍️ MOTOR & TRANSMISSÃO', itens: [
                        { key: 'moto_motor_estado', label: 'Estado do motor', tipo: 'check' },
                        { key: 'moto_corrente', label: 'Corrente / Relação', tipo: 'check' },
                        { key: 'moto_embreagem', label: 'Embreagem / Cabos', tipo: 'check' },
                        { key: 'moto_obs', label: '📝 Observações', tipo: 'texto', ph: 'Detalhes...' }
                    ]
                },
                {
                    titulo: '🛡️ SEGURANÇA & RODAS', itens: [
                        { key: 'moto_freio_diant', label: 'Freio Dianteiro', tipo: 'check' },
                        { key: 'moto_freio_tras', label: 'Freio Traseiro', tipo: 'check' },
                        { key: 'moto_pneu_diant', label: 'Pneu Dianteiro', tipo: 'check' },
                        { key: 'moto_pneu_tras', label: 'Pneu Traseiro', tipo: 'check' },
                    ]
                }
            ]
        },
        lataria: {
            icon: '🎨', label: 'Lataria & Pintura', cor: '#ef4444', secoes: [
                {
                    titulo: '🚗 ESTADO EXTERNO', itens: [
                        { key: 'lat_amassado', label: 'Amassados / Riscos', tipo: 'check' },
                        { key: 'lat_oxidacao', label: 'Oxidação / Ferrugem', tipo: 'check' },
                        { key: 'lat_pintura', label: 'Estado da pintura', tipo: 'check' },
                        { key: 'lat_pintura_obs', label: '📝 Observações pintura', tipo: 'texto', ph: 'Cor, textura...' },
                    ]
                },
                {
                    titulo: '🪟 VIDROS & ACABAMENTO', itens: [
                        { key: 'lat_vidro', label: 'Para-brisa / Vidros', tipo: 'check' },
                        { key: 'lat_retrovisor', label: 'Retrovisores', tipo: 'check' },
                        { key: 'lat_para_choque', label: 'Para-choques', tipo: 'check' },
                    ]
                }
            ]
        },
        amortecedor: {
            icon: '🧰', label: 'Amortecedores', cor: '#eab308', secoes: [
                {
                    titulo: '🔍 DIAGNÓSTICO POR POSIÇÃO', itens: [
                        { key: 'amor_diant_esq', label: 'Dianteiro Esquerdo', tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '🚫 Trocar'] },
                        { key: 'amor_diant_dir', label: 'Dianteiro Direito', tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '🚫 Trocar'] },
                        { key: 'amor_tras_esq', label: 'Traseiro Esquerdo', tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '🚫 Trocar'] },
                        { key: 'amor_tras_dir', label: 'Traseiro Direito', tipo: 'status', opcoes: ['✅ OK', '⚠️ Atenção', '🚫 Trocar'] },
                    ]
                },
                {
                    titulo: '🔄 COMPONENTES', itens: [
                        { key: 'amor_mola', label: 'Molas', tipo: 'check' },
                        { key: 'amor_bucha', label: 'Buchas / Batentes', tipo: 'check' },
                        { key: 'amor_obs', label: '📝 Observações gerais', tipo: 'texto', ph: 'Diagnóstico completo...' },
                    ]
                }
            ]
        }
    };

    const cfg = CONFIGS_OFICINA[subAbaOficina] || CONFIGS_OFICINA.mecanica;
    const cfgCores = TEMAS[tema || 'escuro'];

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
            const total = (parseFloat(formVistoria.valorPecas || 0) + parseFloat(formVistoria.valorMaoObra || 0));
            const osData = {
                nomeCliente: formVistoria.cliente || '',
                placa: normalizarPlaca(formVistoria.placa),
                modelo: formVistoria.modelo || '',
                telefone: formVistoria.telefone || '',
                kmAtual: formVistoria.km || '',
                checklist: cfg.label,
                detalhesPecas: formVistoria.obs || '',
                fotos: formVistoria.fotos || [],
                valorPecas: parseFloat(formVistoria.valorPecas) || 0,
                valorMaoObra: parseFloat(formVistoria.valorMaoObra) || 0,
                total,
                tipoServico: subAbaOficina,
                origem: 'oficina',
                camposChecklist: formVistoria.campos || {},
            };

            if (editandoVistoria) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'os', editandoVistoria), osData);
            } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
                    ...osData,
                    statusPagamento: 'pendente',
                    data: new Date().toISOString().split('T')[0],
                    data_registro: new Date().toISOString(),
                });
            }
            alert('✅ O.S. Salva com sucesso!');
            setMostrarFormVistoria(false);
            setAbaAtiva('os');
            carregarOS();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoVistoria(false); }
    };

    const getStatusColor = (val) => {
        if (!val || val.includes('OK')) return '#00E676';
        if (val.includes('Atenção')) return '#eab308';
        return '#ef4444';
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* HEADER com sub-abas */}
            <div style={{ background: 'linear-gradient(135deg, #0d0020, #0d0d0d)', border: `1px solid ${cfg.cor}44`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '42px', height: '42px', background: `${cfg.cor}22`, border: `2px solid ${cfg.cor}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{cfg.icon}</div>
                    <div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>Oficina <span style={{ color: cfg.cor }}>{cfg.label}</span></h2>
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

            {/* BOTÃO Nova O.S. */}
            {!mostrarFormVistoria && (
                <div style={{ marginBottom: '16px' }}>
                    <button onClick={() => {
                        setMostrarFormVistoria(true);
                        setEditandoVistoria(null);
                        setFormVistoria({ placa: '', modelo: '', km: '', cliente: '', telefone: '', fotos: [], campos: {}, valorPecas: '', valorMaoObra: '' });
                    }} style={{ width: '100%', background: cfg.cor, color: 'white', border: 'none', borderRadius: '10px', padding: '16px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: `0 4px 14px ${cfg.cor}44` }}>
                        + Nova O.S. de {cfg.label}
                    </button>
                </div>
            )}

            {mostrarFormVistoria && (
                <div style={{ background: '#0a0a0a', border: `1px solid ${cfg.cor}55`, borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ background: `linear-gradient(135deg, ${cfg.cor}22, #111)`, padding: '18px 20px', borderBottom: `1px solid ${cfg.cor}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ color: cfg.cor, margin: '0 0 3px 0', fontSize: '16px', fontWeight: '900' }}>{editandoVistoria ? '📝 Editar' : '📋 Nova'} O.S. - {cfg.label}</h4>
                            <p style={{ color: '#555', margin: 0, fontSize: '11px' }}>Preencha os dados e o diagnóstico</p>
                        </div>
                        <button onClick={() => setMostrarFormVistoria(false)} style={{ background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '18px' }}>×</button>
                    </div>

                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                                {[
                                    { key: 'placa', label: 'PLACA *', ph: 'ABC1234' },
                                    { key: 'modelo', label: 'MODELO', ph: 'Ex: Gol 2019' },
                                    { key: 'km', label: 'KM ATUAL', ph: '0', type: 'number' },
                                    { key: 'cliente', label: 'CLIENTE', ph: 'Nome' },
                                    { key: 'telefone', label: 'WHATSAPP', ph: '(49) 99999-9999' },
                                ].map(({ key, label, ph, type }) => (
                                    <div key={key}>
                                        <label style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>{label}</label>
                                        <input type={type || 'text'} value={formVistoria[key] || ''}
                                            onChange={e => {
                                                const val = key === 'placa' ? normalizarPlaca(e.target.value) : e.target.value;
                                                setFormVistoria(p => ({ ...p, [key]: val }));
                                            }}
                                            placeholder={ph} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #222', color: 'white', borderRadius: '8px', fontSize: '13px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Checklist */}
                        <div style={{ marginBottom: '24px' }}>
                            {cfg.secoes.map((sec, si) => (
                                <div key={si} style={{ marginBottom: '16px', background: '#111', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div style={{ background: '#161616', padding: '10px 16px', borderBottom: '1px solid #1a1a1a' }}>
                                        <p style={{ color: '#888', margin: 0, fontSize: '11px', fontWeight: 'bold' }}>{sec.titulo}</p>
                                    </div>
                                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {sec.itens.map(({ key, label, tipo, ph, opcoes }) => (
                                            <div key={key}>
                                                {(tipo === 'check' || tipo === 'status') && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#0a0a0a', borderRadius: '8px' }}>
                                                        <span style={{ color: '#bbb', fontSize: '12px' }}>{label}</span>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            {(opcoes || ['✅ OK', '⚠️ Atenção', '🚫 Trocar']).map(opt => (
                                                                <button key={opt} onClick={() => setFormVistoria(p => ({ ...p, campos: { ...p.campos, [key]: p.campos?.[key] === opt ? '' : opt } }))}
                                                                    style={{ padding: '4px 8px', background: formVistoria.campos?.[key] === opt ? getStatusColor(opt) : '#1a1a1a', color: formVistoria.campos?.[key] === opt ? 'black' : '#555', border: 'none', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
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
                                                            <textarea value={formVistoria.campos?.[key] || ''} onChange={e => setFormVistoria(p => ({ ...p, campos: { ...p.campos, [key]: e.target.value } }))}
                                                                placeholder={ph} rows={2} style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #222', color: 'white', borderRadius: '8px', fontSize: '12px', resize: 'none' }} />
                                                            <button onClick={() => iniciarVozOficina(key)} style={{ background: ouvindoVistoria === key ? '#ef4444' : '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer' }}>{ouvindoVistoria === key ? '🛑' : '🎤'}</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Valores e Fotos seriam adicionados aqui conforme necessário */}
                        {/* Simplificando para restaurar a funcionalidade básica primeiro */}

                        <button onClick={salvarOSOficina} disabled={salvandoVistoria} style={{ width: '100%', padding: '16px', background: salvandoVistoria ? '#333' : cfg.cor, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {salvandoVistoria ? '⌛ Salvando...' : '💾 Salvar O.S.'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormularioMecanica;