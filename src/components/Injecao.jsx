/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    AlertTriangle, ArrowRight, Cpu, Activity, Gauge, Search
} from "lucide-react";

const STYLES = {
    accent: 'text-pink-500',
    button: 'bg-pink-600 hover:bg-pink-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8',
    input: 'bg-zinc-950 border-zinc-800 focus:border-pink-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// NOVO SELETOR INTELIGENTE (Aceita termos variados baseados na imagem)
const StatusSelector = ({ label, options = ['OK', 'Atenção', 'Trocar'], value, onChange }) => {
    const getColorClass = (status, isSelected) => {
        if (!isSelected) return 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700';
        const s = status.toUpperCase();
        if (['OK'].includes(s)) return 'bg-green-600/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
        if (['ATENÇÃO', 'BAIXA', 'PENDENTE', 'DESGASTADO'].includes(s)) return 'bg-yellow-600/20 border-yellow-500 text-yellow-500';
        if (['TROCAR', 'FALHA', 'RUIM'].includes(s)) return 'bg-red-600/20 border-red-500 text-red-500';
        return 'bg-pink-600/20 border-pink-500 text-pink-500';
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-all">
            <span className="text-zinc-300 font-bold text-xs uppercase tracking-widest">{label}</span>
            <div className="flex gap-2 mt-3 md:mt-0">
                {options.map((status) => (
                    <button
                        key={status}
                        onClick={() => onChange(status)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${getColorClass(status, value === status)}`}
                    >
                        {value === status && status === 'OK' && '✓ '} {status.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default function Injecao({
    oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    const [dtcCodigo, setDtcCodigo] = useState('');
    const [obsInjecao, setObsInjecao] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');

    const [checklist, setChecklist] = useState({
        // SCANNER E ECU
        comunicacaoECU: 'OK', leituraSensores: 'OK',
        tensaoBateria: 'OK', aterramentoECU: 'OK', atualizacaoFirmware: 'OK',
        // ALIMENTAÇÃO E SENSORES
        pressaoBomba: 'OK', injetores: 'OK', sensorMapMaf: 'OK',
        sensorTps: 'OK', sensorLambda: 'OK', sensorCts: 'OK', sensorCkp: 'OK'
    });

    useEffect(() => {
        if (osParaEditar) {
            setDtcCodigo(osParaEditar.dtcCodigo || '');
            setObsInjecao(osParaEditar.observacaoInjecao || '');
            setFotos(osParaEditar.fotosInjecao || []);
            setPecas(osParaEditar.valorPecas || '0');
            setMaoDeObra(osParaEditar.valorMaoObra || '0');
            if (osParaEditar.checklistInjecao) setChecklist(osParaEditar.checklistInjecao);
        }
    }, [osParaEditar]);

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos para Evidências do Scanner!");

        const novasFotos = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (ev) => {
                    const img = new Image();
                    img.src = ev.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 800;
                        canvas.height = img.height * (800 / img.width);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.6));
                    };
                };
            });
        }));
        setFotos(prev => [...prev, ...novasFotos]);
    };

    const [isListening, setIsListening] = useState(false);
    const toggleMic = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert("Microfone não suportado.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening) { rec.stop(); setIsListening(false); }
        else {
            setIsListening(true); rec.start();
            rec.onresult = (e) => setObsInjecao(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            const dadosInjecao = {
                tipoServico: 'injecao',
                dtcCodigo,
                checklistInjecao: checklist,
                observacaoInjecao: obsInjecao,
                fotosInjecao: fotos,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                totalInjecao: vTotal,
                data_atualizacao: new Date().toISOString()
            };
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosInjecao);
            await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosInjecao, osBase: osParaEditar });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

            {/* 🛑 MODAL DE BLOQUEIO */}
            {showBlocker && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <AlertTriangle size={60} className="text-pink-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            O diagnóstico de Injeção precisa de uma O.S.<br />
                            <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
                            <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-pink-600/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">

                {/* Header Rosa */}
                <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-pink-600 rounded-[1.5rem] shadow-xl shadow-pink-600/30">
                            <Cpu className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Injeção Eletrônica</h1>
                            <p className="text-pink-500 font-bold text-xs tracking-[0.3em] uppercase">Scanner e Diagnóstico Avançado</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
                </div>

                {/* 📸 CARROSSEL DE FOTOS EVIDÊNCIAS SCANNER (MÁX 5) */}
                <div className={STYLES.card}>
                    <h2 className="text-pink-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-3">
                        <Camera size={18} /> Fotos do Scanner / Evidências ({fotos.length}/5)
                    </h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 shadow-2xl group">
                                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className="min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 bg-zinc-900/50 transition-all hover:bg-zinc-800">
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 🖥️ BLOCOS SUPERIORES: SCANNER E ECU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                        <h2 className="text-pink-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Search size={16} /> Scanner e Diagnóstico (DTC)</h2>
                        <div className="flex gap-3 mb-6">
                            <input value={dtcCodigo} onChange={e => setDtcCodigo(e.target.value)} placeholder="Ex: P0300, P0171..." className={STYLES.input + " py-3 uppercase"} />
                            <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 rounded-xl transition-all">Buscar</button>
                        </div>
                        <div className="bg-zinc-950/40 rounded-2xl border border-zinc-800/50 overflow-hidden">
                            <StatusSelector label="Comunicação com ECU" options={['OK', 'FALHA']} value={checklist.comunicacaoECU} onChange={v => setChecklist({ ...checklist, comunicacaoECU: v })} />
                            <StatusSelector label="Leitura de Sensores Tempo Real" options={['OK', 'FALHA']} value={checklist.leituraSensores} onChange={v => setChecklist({ ...checklist, leituraSensores: v })} />
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8">
                        <h2 className="text-pink-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Cpu size={16} /> Central Eletrônica (ECU)</h2>
                        <div className="bg-zinc-950/40 rounded-2xl border border-zinc-800/50 overflow-hidden h-full">
                            <StatusSelector label="Tensão da Bateria" options={['OK', 'BAIXA']} value={checklist.tensaoBateria} onChange={v => setChecklist({ ...checklist, tensaoBateria: v })} />
                            <StatusSelector label="Aterramento da ECU" options={['OK', 'FALHA']} value={checklist.aterramentoECU} onChange={v => setChecklist({ ...checklist, aterramentoECU: v })} />
                            <StatusSelector label="Atualização de Firmware" options={['OK', 'PENDENTE']} value={checklist.atualizacaoFirmware} onChange={v => setChecklist({ ...checklist, atualizacaoFirmware: v })} />
                        </div>
                    </div>

                </div>

                {/* ⚙️ ALIMENTAÇÃO E SENSORES */}
                <div className={STYLES.card}>
                    <h2 className="text-pink-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-pink-500 pl-4">⚙️ Alimentação e Sensores</h2>
                    <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-10 shadow-inner">
                        <StatusSelector label="Pressão da Bomba de Combustível" options={['OK', 'BAIXA', 'FALHA']} value={checklist.pressaoBomba} onChange={v => setChecklist({ ...checklist, pressaoBomba: v })} />
                        <StatusSelector label="Injetores (Resistência/Vazão)" options={['OK', 'ATENÇÃO', 'RUIM']} value={checklist.injetores} onChange={v => setChecklist({ ...checklist, injetores: v })} />
                        <StatusSelector label="Sensor MAP / MAF" options={['OK', 'FALHA']} value={checklist.sensorMapMaf} onChange={v => setChecklist({ ...checklist, sensorMapMaf: v })} />
                        <StatusSelector label="Sensor TPS (Borboleta)" options={['OK', 'FALHA']} value={checklist.sensorTps} onChange={v => setChecklist({ ...checklist, sensorTps: v })} />
                        <StatusSelector label="Sensor de Oxigênio (Lambda)" options={['OK', 'DESGASTADO', 'FALHA']} value={checklist.sensorLambda} onChange={v => setChecklist({ ...checklist, sensorLambda: v })} />
                        <StatusSelector label="Sensor de Temperatura (CTS)" options={['OK', 'FALHA']} value={checklist.sensorCts} onChange={v => setChecklist({ ...checklist, sensorCts: v })} />
                        <StatusSelector label="Sensor de Rotação (CKP)" options={['OK', 'FALHA']} value={checklist.sensorCkp} onChange={v => setChecklist({ ...checklist, sensorCkp: v })} />
                    </div>

                    <div className="relative pt-4">
                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
                            <Mic size={14} className="text-pink-400" /> Observações Técnicas (Microfone)
                        </label>
                        <textarea
                            value={obsInjecao} onChange={e => setObsInjecao(e.target.value)}
                            placeholder="Descreva análises do osciloscópio, falhas de combustão, etc..."
                            className={STYLES.input + " min-h-[140px] leading-relaxed pr-16"}
                        />
                        <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-pink-600'}`}>
                            <Mic size={24} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* 💰 VALORES DO SERVIÇO */}
                <div className={STYLES.card}>
                    <h2 className="text-pink-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-pink-500 pl-4">💰 Valores do Serviço</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2 text-shadow-sm">Peças (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2 text-shadow-sm">Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div className="bg-pink-950/30 border border-pink-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-pink-400 font-black mb-1 uppercase tracking-widest">Total Injeção</span>
                            <span className="text-3xl font-black text-pink-500 shadow-pink-500/50">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-pink-600 hover:bg-pink-700 text-white font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all">
                    {loading ? 'Processando Diagnóstico...' : <><Save size={32} /> Salvar Laudo de Injeção</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl">
                    <CheckCircle size={32} /> Diagnóstico Salvo!
                </div>
            )}
        </div>
    );
}