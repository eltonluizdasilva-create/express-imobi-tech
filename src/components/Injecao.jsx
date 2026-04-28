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
    oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    const [dtcCodigo, setDtcCodigo] = useState('');
    const [obsInjecao, setObsInjecao] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');
    const [isListening, setIsListening] = useState(false);

    const [checklist, setChecklist] = useState({
        comunicacaoECU: 'OK', leituraSensores: 'OK',
        tensaoBateria: 'OK', aterramentoECU: 'OK', atualizacaoFirmware: 'OK',
        pressaoBomba: 'OK', injetores: 'OK', sensorMapMaf: 'OK',
        sensorTps: 'OK', sensorLambda: 'OK', sensorCts: 'OK', sensorCkp: 'OK'
    });

    useEffect(() => {
        if (osParaEditar) {
            setDtcCodigo(osParaEditar.dtcCodigo || '');
            setObsInjecao(osParaEditar.observacaoInjecao || '');
            setFotos(osParaEditar.fotosInjecao || []);
            setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
            setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
            if (osParaEditar.checklistInjecao) setChecklist(osParaEditar.checklistInjecao);
        }
    }, [osParaEditar]);

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

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos!");
        setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 5));
    };

    const handleSalvarTentativa = async () => {
        if (!oficinaId) return;
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
            const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
            const vTotal = vPecas + vMao;
            
            const dadosInjecao = {
                tipoServico: 'injecao',
                dtcCodigo,
                checklistInjecao: checklist,
                observacaoInjecao: obsInjecao,
                fotosInjecao: fotos,
                valorPecas: vPecas,
                valorMaoObra: vMao,
                total: vTotal,
                total_modulo: vTotal,
                data_atualizacao: new Date().toISOString()
            };
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosInjecao);
            await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosInjecao, osBase: osParaEditar });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>

            {/* 🛑 MODAL DE BLOQUEIO */}
            {showBlocker && (
                <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
                    <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
                        <AlertTriangle size={60} className="text-pink-500 mx-auto mb-6" />
                        <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
                        <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
                            O diagnóstico de Injeção precisa de uma O.S.<br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-pink-600 hover:bg-pink-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-pink-600/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-pink-600 rounded-[1.5rem] shadow-xl shadow-pink-600/30">
                            <Cpu className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Injeção Eletrônica</h1>
                            <p className="text-pink-500 font-bold text-xs tracking-[0.3em] uppercase">Scanner e Diagnóstico Avançado</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8`}>
                        <h2 className="text-pink-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Search size={16} /> Scanner (DTC)</h2>
                        <input value={dtcCodigo} onChange={e => setDtcCodigo(e.target.value)} placeholder="Ex: P0300, P0171..." className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-pink-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm py-3 uppercase mb-6`} />
                        <div className={`bg-zinc-950/40 rounded-2xl border ${t?.border || 'border-zinc-800/50'} overflow-hidden`}>
                            <StatusSelector label="Comunicação ECU" options={['OK', 'FALHA']} value={checklist.comunicacaoECU} onChange={v => setChecklist({ ...checklist, comunicacaoECU: v })} />
                            <StatusSelector label="Leitura Sensores" options={['OK', 'FALHA']} value={checklist.leituraSensores} onChange={v => setChecklist({ ...checklist, leituraSensores: v })} />
                        </div>
                    </div>
                    <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8`}>
                        <h2 className="text-pink-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Gauge size={16} /> Alimentação</h2>
                        <div className={`bg-zinc-950/40 rounded-2xl border ${t?.border || 'border-zinc-800/50'} overflow-hidden`}>
                            <StatusSelector label="Pressão Bomba" options={['OK', 'BAIXA', 'FALHA']} value={checklist.pressaoBomba} onChange={v => setChecklist({ ...checklist, pressaoBomba: v })} />
                            <StatusSelector label="Injetores" options={['OK', 'ATENÇÃO', 'RUIM']} value={checklist.injetores} onChange={v => setChecklist({ ...checklist, injetores: v })} />
                        </div>
                    </div>
                </div>

                {/* 📋 CHECKLIST TÉCNICO */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className="text-pink-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-pink-500 pl-4">🔍 Checklist de Sensores</h2>
                    <div className={`bg-zinc-950/40 rounded-[2rem] border ${t?.border || 'border-zinc-800/50'} overflow-hidden`}>
                        <StatusSelector label="Sensor MAP/MAF" value={checklist.sensorMapMaf} onChange={v => setChecklist({ ...checklist, sensorMapMaf: v })} />
                        <StatusSelector label="Sensor TPS" value={checklist.sensorTps} onChange={v => setChecklist({ ...checklist, sensorTps: v })} />
                        <StatusSelector label="Sonda Lambda" value={checklist.sensorLambda} onChange={v => setChecklist({ ...checklist, sensorLambda: v })} />
                        <StatusSelector label="Sensor CTS" value={checklist.sensorCts} onChange={v => setChecklist({ ...checklist, sensorCts: v })} />
                        <StatusSelector label="Sensor CKP" value={checklist.sensorCkp} onChange={v => setChecklist({ ...checklist, sensorCkp: v })} />
                    </div>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <div className="relative">
                        <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
                            <Mic size={14} className="text-pink-400" /> Observações Técnicas
                        </label>
                        <textarea value={obsInjecao} onChange={e => setObsInjecao(e.target.value)} placeholder="Descreva falhas, diagnósticos do osciloscópio..." className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-pink-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[140px] leading-relaxed pr-16`} />
                        <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-pink-600 text-white'}`}><Mic size={24} /></button>
                    </div>
                </div>

                {/* 📸 FOTOS */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className={`text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-3`}><Camera size={18} /> Evidências ({fotos.length}/5)</h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 shadow-2xl group">
                                <img src={f} className="w-full h-full object-cover" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className={`min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 bg-zinc-900/50 transition-all`}>
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 💰 VALORES */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className="text-pink-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-pink-500 pl-4">💰 Orçamento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-3 font-bold uppercase tracking-widest px-2`}>Peças (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-pink-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
                        </div>
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-3 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-pink-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
                        </div>
                        <div className="bg-pink-950/30 border border-pink-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-pink-400 font-black mb-1 uppercase tracking-widest">Total Injeção</span>
                            <span className="text-3xl font-black text-pink-400">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-pink-600 hover:bg-pink-700 text-white font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all">
                    {loading ? 'Salvando...' : <><Save size={32} /> SALVAR LAUDO DE INJEÇÃO</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
                    <CheckCircle size={32} /> Diagnóstico Salvo!
                </div>
            )}
        </div>
    );
}