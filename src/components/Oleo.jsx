/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    AlertTriangle, ArrowRight, Droplet, Gauge, CheckSquare
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border-zinc-800 focus:border-rose-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

const ToggleButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full py-3 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${active
            ? 'bg-rose-600/20 border-rose-500 text-rose-400'
            : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
    >
        <CheckSquare size={14} className={active ? 'text-rose-500' : 'text-zinc-600'} />
        {label}
    </button>
);

export default function OleoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);
    const [obsGerais, setObsGerais] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');
    const [isListening, setIsListening] = useState(false);

    const [checklist, setChecklist] = useState({
        oleoMotor: false, filtroOleo: false, filtroAr: false, filtroCombustivel: false,
        filtroCabine: false, arrefecimento: false, fluidoFreio: false
    });

    useEffect(() => {
        if (osParaEditar) {
            if (osParaEditar.checklistOleo) setChecklist(osParaEditar.checklistOleo);
            setFotos(osParaEditar.fotosOleo || []);
            setObsGerais(osParaEditar.observacaoOleo || '');
            setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
            setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
        }
    }, [osParaEditar]);

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos!");
        setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 5));
    };

    const toggleMic = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert("Microfone não suportado.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening) { rec.stop(); setIsListening(false); }
        else {
            setIsListening(true); rec.start();
            rec.onresult = (e) => setObsGerais(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const toggleCheck = (campo) => setChecklist(prev => ({ ...prev, [campo]: !prev[campo] }));

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
            const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
            const vTotal = vPecas + vMao;
            
            const dadosOleo = {
                tipoServico: 'oleo',
                checklistOleo: checklist,
                observacaoOleo: obsGerais,
                fotosOleo: fotos,
                valorPecas: vPecas,
                valorMaoObra: vMao,
                total: vTotal,
                total_modulo: vTotal,
                data_atualizacao: new Date().toISOString()
            };
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosOleo);
            await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosOleo, osBase: osParaEditar });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>

            {showBlocker && (
                <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
                    <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
                        <AlertTriangle size={60} className="text-rose-400 mx-auto mb-6" />
                        <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
                        <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
                            O serviço de Troca de Óleo precisa de uma O.S.<br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-rose-600 rounded-[1.5rem] shadow-xl shadow-rose-600/30">
                            <Droplet className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Troca de Óleo & Filtros</h1>
                            <p className="text-rose-500 font-bold text-xs tracking-[0.3em] uppercase">Lubrificação e Proteção do Motor</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className="text-rose-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-rose-500 pl-4">✓ Itens Verificados</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ToggleButton label="Óleo do Motor" active={checklist.oleoMotor} onClick={() => toggleCheck('oleoMotor')} />
                        <ToggleButton label="Filtro de Óleo" active={checklist.filtroOleo} onClick={() => toggleCheck('filtroOleo')} />
                        <ToggleButton label="Filtro de Ar" active={checklist.filtroAr} onClick={() => toggleCheck('filtroAr')} />
                        <ToggleButton label="Filtro Comb." active={checklist.filtroCombustivel} onClick={() => toggleCheck('filtroCombustivel')} />
                        <ToggleButton label="Filtro Cabine" active={checklist.filtroCabine} onClick={() => toggleCheck('filtroCabine')} />
                        <ToggleButton label="Arrefecimento" active={checklist.arrefecimento} onClick={() => toggleCheck('arrefecimento')} />
                    </div>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <div className="relative">
                        <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
                            <Mic size={14} className="text-rose-400" /> Observações Técnicas
                        </label>
                        <textarea
                            value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                            placeholder="Descreva o estado do óleo, vazamentos no bujão, km da próxima troca..."
                            className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-rose-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[140px] leading-relaxed pr-16`}
                        />
                        <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-rose-600 text-white'}`}>
                            <Mic size={24} />
                        </button>
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
                            <label className={`min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 bg-zinc-900/50 transition-all`}>
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 💰 VALORES */}
                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-8 mb-8 shadow-xl`}>
                    <h2 className="text-rose-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-rose-500 pl-4">💰 Orçamento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-3 font-bold uppercase tracking-widest px-2`}>Peças (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-rose-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
                        </div>
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-3 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-rose-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
                        </div>
                        <div className="bg-rose-950/30 border border-rose-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-rose-400 font-black mb-1 uppercase tracking-widest">Total Óleo</span>
                            <span className="text-3xl font-black text-rose-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all">
                    {loading ? 'Salvando...' : <><Save size={32} /> SALVAR SERVIÇO ÓLEO</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
                    <CheckCircle size={32} /> Troca de Óleo Salva!
                </div>
            )}
        </div>
    );
}