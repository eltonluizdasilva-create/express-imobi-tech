/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "./lib/retornos";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    Zap, AlertTriangle, ArrowRight, Info,
    Thermometer, ShieldCheck, Settings, Wrench, Activity
} from "lucide-react";

const STYLES = {
    accent: 'text-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8',
    input: 'bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono'
};

const StatusSelector = ({ label, value, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-all">
        <span className="text-zinc-300 font-semibold text-sm">{label}</span>
        <div className="flex gap-2 mt-3 md:mt-0">
            {['OK', 'Atenção', 'Trocar'].map((status) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${value === status
                        ? (status === 'OK' ? 'bg-green-600/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
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

export default function HibridoEV({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);
    const [isListening, setIsListening] = useState(false);

    // Estados de Medição e Valores
    const [medicoes, setMedicoes] = useState({ soh: '', bat12v: '', temp: '' });
    const [obsTecnica, setObsTecnica] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');

    // Checklist Completo
    const [checklist, setChecklist] = useState({
        cabosLaranja: 'OK',
        plugServicoMSD: 'OK',
        isolamentoCarcaca: 'OK',
        bateriaTracaoHV: 'OK',
        inversorConversor: 'OK',
        arrefecimentoInversor: 'OK',
        motorCombustao: 'OK',
        vazamentosFluidos: 'OK',
        oleoFiltros: 'OK',
        correiasTensores: 'OK',
        suspensaoGeral: 'OK',
        freioRegenerativo: 'OK',
        pneusEstado: 'OK',
        direcaoEletrica: 'OK'
    });

    useEffect(() => {
        if (osParaEditar) {
            setObsTecnica(osParaEditar.observacaoHibrido || osParaEditar.observacaoEV || '');
            setFotos(osParaEditar.fotosHibrido || osParaEditar.fotosEV || []);
            setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
            setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
            if (osParaEditar.checklistHibrido || osParaEditar.checklistEV) {
                setChecklist(osParaEditar.checklistHibrido || osParaEditar.checklistEV);
            }
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
            rec.onresult = (e) => setObsTecnica(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Limite de 5 fotos atingido!");
        setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 5));
    };

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
            const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
            const vTotal = vPecas + vMao;
            
            const dadosEV = {
                tipoServico: 'hibrido-ev',
                checklistEV: checklist,
                observacaoEV: obsTecnica,
                fotosEV: fotos,
                valorPecas: vPecas,
                valorMaoObra: vMao,
                total: vTotal,
                total_modulo: vTotal,
                data_atualizacao: new Date().toISOString()
            };

            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosEV);
            await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosEV, osBase: osParaEditar });

            setSuccess(true);
            if (onSalvo) onSalvo();
            setTimeout(onCancelar, 1500);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>

            {/* 🛑 MODAL DE BLOQUEIO */}
            {showBlocker && (
                <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
                    <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
                        <AlertTriangle size={60} className="text-emerald-400 mx-auto mb-6" />
                        <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
                        <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
                            O serviço Híbrido/Elétrico precisa de uma O.S.<br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                {/* Header Esmeralda/EV */}
                <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-emerald-600 rounded-[1.5rem] shadow-xl shadow-emerald-600/30">
                            <Zap className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Híbridos & Elétricos</h1>
                            <p className="text-emerald-500 font-bold text-xs tracking-[0.3em] uppercase">Especialista em Alta Tensão e Baterias</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
                </div>

                {/* 📋 CHECKLIST ALTA TENSÃO */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className="text-emerald-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-emerald-500 pl-4">✓ Diagnóstico de Sistema HV</h2>
                    <div className={`bg-zinc-950/40 rounded-[2rem] border ${t?.border || 'border-zinc-800/50'} overflow-hidden shadow-inner`}>
                        <StatusSelector label="Estado da Bateria de Tração (SOH)" value={checklist.bateriaTracaoHV} onChange={v => setChecklist({ ...checklist, bateriaTracaoHV: v })} />
                        <StatusSelector label="Isolamento de Alta Tensão" value={checklist.isolamentoCarcaca} onChange={v => setChecklist({ ...checklist, isolamentoCarcaca: v })} />
                        <StatusSelector label="Inversor / Conversor DC-DC" value={checklist.inversorConversor} onChange={v => setChecklist({ ...checklist, inversorConversor: v })} />
                        <StatusSelector label="Sistema de Arrefecimento (Bateria)" value={checklist.arrefecimentoInversor} onChange={v => setChecklist({ ...checklist, arrefecimentoInversor: v })} />
                        <StatusSelector label="Plug de Serviço (MSD)" value={checklist.plugServicoMSD} onChange={v => setChecklist({ ...checklist, plugServicoMSD: v })} />
                        <StatusSelector label="Cabos de Alta Tensão (Integridade)" value={checklist.cabosLaranja} onChange={v => setChecklist({ ...checklist, cabosLaranja: v })} />
                    </div>
                </div>

                {/* 📝 OBSERVAÇÕES E MICROFONE */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <div className="relative">
                        <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
                            <Mic size={14} className="text-emerald-400" /> Notas Técnicas de Alta Tensão
                        </label>
                        <textarea
                            value={obsTecnica} onChange={e => setObsTecnica(e.target.value)}
                            placeholder="Descreva o estado das células, tensões de isolamento, erros de comunicação CAN..."
                            className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-emerald-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[140px] leading-relaxed pr-16`}
                        />
                        <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-emerald-500 text-white hover:text-black'}`}>
                            <Mic size={24} />
                        </button>
                    </div>
                </div>

                {/* 📸 CARROSSEL DE FOTOS (MÁX 5) */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className={`text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-3`}>
                        <Camera size={18} /> Evidências (Módulos/Bateria) ({fotos.length}/5)
                    </h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 shadow-2xl group">
                                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className={`min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 bg-zinc-900/50 transition-all hover:bg-zinc-800`}>
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 💰 VALORES DO SERVIÇO */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className="text-emerald-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-emerald-500 pl-4">💰 Valores do Serviço</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-3 font-bold uppercase tracking-widest px-2`}>Peças / Módulos (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-emerald-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
                        </div>
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-3 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-emerald-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
                        </div>
                        <div className="bg-emerald-900/10 border border-emerald-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-emerald-400 font-black mb-1 uppercase tracking-widest">Total Especializado</span>
                            <span className="text-3xl font-black text-emerald-400 shadow-emerald-500/50">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all active:scale-[0.98]">
                    {loading ? 'Sincronizando...' : <><Save size={32} /> FINALIZAR SERVIÇO HÍBRIDO</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
                    <CheckCircle size={32} /> Dados Sincronizados!
                </div>
            )}
        </div>
    );
}