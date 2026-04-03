/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
// IMPORTAÇÃO CORRIGIDA DE TODOS OS ÍCONES
import { Mic, Save, X, CheckCircle, Camera, Plus, Trash2, Settings, Wrench, Zap, Disc, Activity, AlertTriangle, ArrowRight } from 'lucide-react';

const STYLES = {
    accent: 'text-purple-500',
    button: 'bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-6',
    input: 'bg-zinc-900/50 border-zinc-800 focus:border-purple-500 text-zinc-100 p-4 rounded-xl outline-none w-full'
};

const StatusSelector = ({ label, value, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/10 transition-all">
        <span className="text-zinc-300 font-medium">{label}</span>
        <div className="flex gap-2 mt-2 md:mt-0">
            {['OK', 'Atenção', 'Trocar'].map((status) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${value === status
                            ? (status === 'OK' ? 'bg-green-600/20 border-green-500 text-green-500' :
                                status === 'Atenção' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                                    'bg-red-600/20 border-red-500 text-red-500')
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
                        }`}
                >
                    {status === 'OK' && '✓ '} {status.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

export default function Mecanica({
    oficinaId, osParaEditar, onCancelar, onSalvo, setAbaAtiva, irParaNovaOS,
    placa, nomeCliente, telefone, modelo, kmAtual
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    const [pecas, setPecas] = useState('0,00');
    const [maoDeObra, setMaoDeObra] = useState('0,00');

    // Observações por Seção
    const [obsMotor, setObsMotor] = useState('');
    const [obsCambio, setObsCambio] = useState('');
    const [obsFreios, setObsFreios] = useState('');
    const [obsSuspensao, setObsSuspensao] = useState('');
    const [obsEletrica, setObsEletrica] = useState('');

    const [checklist, setChecklist] = useState({
        // Motor
        motorEstado: 'OK', vazamentos: 'OK', ruidos: 'OK', correia: 'OK', radiador: 'OK',
        // Câmbio
        trocaMarcha: 'OK', vazamentoCambio: 'OK', ruidoTransmissao: 'OK',
        // Freios
        pastilhas: 'OK', discos: 'OK', fluidoFreio: 'OK', abs: 'OK',
        // Suspensão
        amortecedores: 'OK', buchas: 'OK', rolamentos: 'OK', direcao: 'OK', terminais: 'OK',
        // Elétrica
        bateria: 'OK', luzes: 'OK', fusiveis: 'OK', escapamento: 'OK'
    });

    // Compressão de Fotos (Lógica Blindada)
    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos!");

        const novasFotos = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        const scaleSize = MAX_WIDTH / img.width;
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                };
            });
        }));
        setFotos(prev => [...prev, ...novasFotos]);
    };

    const [isListening, setIsListening] = useState(null);
    const toggleMic = (campo) => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return;
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening === campo) { rec.stop(); setIsListening(null); }
        else {
            setIsListening(campo); rec.start();
            rec.onresult = (e) => {
                const text = e.results[0][0].transcript;
                if (campo === 'motor') setObsMotor(prev => prev + " " + text);
                if (campo === 'cambio') setObsCambio(prev => prev + " " + text);
                if (campo === 'freios') setObsFreios(prev => prev + " " + text);
                if (campo === 'suspensao') setObsSuspensao(prev => prev + " " + text);
                if (campo === 'eletrica') setObsEletrica(prev => prev + " " + text);
            };
            rec.onend = () => setIsListening(null);
        }
    };

    const handleSalvar = async () => {
        if (!osParaEditar) {
            setShowBlocker(true);
            return;
        }
        setLoading(true);
        try {
            const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
            const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
            const dados = {
                placa, cliente: nomeCliente, whatsapp: telefone, modelo, km: kmAtual,
                tipoServico: 'mecanica',
                valorPecas: vPecas, valorMaoObra: vMao, total: vPecas + vMao,
                observacoes: { motor: obsMotor, cambio: obsCambio, freios: obsFreios, suspensao: obsSuspensao, eletrica: obsEletrica },
                checklist, fotos, data_atualizacao: new Date().toISOString()
            };
            if (osParaEditar) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dados);
            } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'os'), { ...dados, data_registro: new Date().toISOString() });
            }
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-24 relative">
            {/* MODAL DE AVISO (BLOQUEIO DE SALVAMENTO) */}
            {showBlocker && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm text-center shadow-2xl">
                        <AlertTriangle size={60} className="text-yellow-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-black text-white mb-4 uppercase italic">Ação Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed">
                            Para registrar este laudo:<br />
                            <span className="text-white font-bold">1. Crie a O.S. na Triagem</span><br />
                            <span className="text-white font-bold">2. Clique em Editar para voltar</span>
                        </p>
                        <button
                            onClick={() => {
                                if (irParaNovaOS) {
                                    irParaNovaOS();
                                } else if (setAbaAtiva) {
                                    setAbaAtiva('os');
                                }
                                setShowBlocker(false);
                            }}
                            className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 transition-all uppercase tracking-tighter"
                        >
                            INICIAR NOVA O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold flex items-center gap-3 mb-8">
                    <Settings className="text-purple-500" /> Nova O.S. - <span className="text-purple-500 uppercase italic font-black text-shadow-purple">Mecânica Geral</span>
                </h1>

                {/* FOTOS */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-bold mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2">
                        <Camera size={14} /> Fotos do Veículo ({fotos.length}/10)
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-700">
                                <img src={f} className="w-full h-full object-cover" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"><Trash2 size={12} /></button>
                            </div>
                        ))}
                        {fotos.length < 10 && (
                            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 bg-zinc-900/50">
                                <Plus size={24} className="text-zinc-500" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* CHECKLIST COMPLETO - SEM CORTES */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-bold mb-6 uppercase text-[10px] tracking-widest">⚙️ Motor & Arrefecimento</h2>
                    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden mb-4">
                        <StatusSelector label="Estado geral do motor" value={checklist.motorEstado} onChange={v => setChecklist({ ...checklist, motorEstado: v })} />
                        <StatusSelector label="Vazamentos de óleo / água" value={checklist.vazamentos} onChange={v => setChecklist({ ...checklist, vazamentos: v })} />
                        <StatusSelector label="Ruídos / Batidas anormais" value={checklist.ruidos} onChange={v => setChecklist({ ...checklist, ruidos: v })} />
                        <StatusSelector label="Radiador / Mangueiras" value={checklist.radiador} onChange={v => setChecklist({ ...checklist, radiador: v })} />
                    </div>
                    <div className="relative">
                        <textarea value={obsMotor} onChange={e => setObsMotor(e.target.value)} placeholder="Obs. do motor..." className={STYLES.input + " min-h-[80px] text-xs"} />
                        <button onClick={() => toggleMic('motor')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'motor' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-bold mb-6 uppercase text-[10px] tracking-widest">🛑 Freios & Suspensão</h2>
                    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden mb-4">
                        <StatusSelector label="Pastilhas / Lonas" value={checklist.pastilhas} onChange={v => setChecklist({ ...checklist, pastilhas: v })} />
                        <StatusSelector label="Discos / Tambores" value={checklist.discos} onChange={v => setChecklist({ ...checklist, discos: v })} />
                        <StatusSelector label="Amortecedores" value={checklist.amortecedores} onChange={v => setChecklist({ ...checklist, amortecedores: v })} />
                        <StatusSelector label="Buchas / Bandejas / Barras" value={checklist.buchas} onChange={v => setChecklist({ ...checklist, buchas: v })} />
                    </div>
                    <div className="relative">
                        <textarea value={obsFreios} onChange={e => setObsFreios(e.target.value)} placeholder="Obs. freios/suspensão..." className={STYLES.input + " min-h-[80px] text-xs"} />
                        <button onClick={() => toggleMic('freios')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'freios' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-bold mb-6 uppercase text-[10px] tracking-widest">⚡ Elétrico & Escapamento</h2>
                    <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-hidden mb-4">
                        <StatusSelector label="Bateria / Alternador" value={checklist.bateria} onChange={v => setChecklist({ ...checklist, bateria: v })} />
                        <StatusSelector label="Luzes / Lanternas / Faróis" value={checklist.luzes} onChange={v => setChecklist({ ...checklist, luzes: v })} />
                        <StatusSelector label="Vazamento / Ruído escapamento" value={checklist.escapamento} onChange={v => setChecklist({ ...checklist, escapamento: v })} />
                    </div>
                </div>

                {/* VALORES */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-bold mb-6 uppercase text-[10px] tracking-widest">💰 Valores do Serviço</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center font-mono"} placeholder="Peças (R$)" />
                        <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center font-mono"} placeholder="Mão de Obra (R$)" />
                        <div className="bg-green-950/20 border border-green-500/30 p-4 rounded-xl text-center">
                            <span className="text-[10px] text-green-500 font-bold uppercase block mb-1">Total</span>
                            <span className="text-2xl font-black text-green-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvar} disabled={loading} className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xl shadow-xl flex items-center justify-center gap-3">
                    {loading ? 'Salvando...' : <><Save size={24} /> SALVAR O.S. MECÂNICA</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-5 rounded-full shadow-2xl animate-bounce flex items-center gap-2">
                    <CheckCircle size={20} /> SALVO COM SUCESSO!
                </div>
            )}
        </div>
    );
}