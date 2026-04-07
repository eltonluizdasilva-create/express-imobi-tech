/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    AlertTriangle, ArrowRight, ClipboardCheck, Sparkles,
    Wrench, Thermometer, Disc, Settings2, Car
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border-zinc-800 focus:border-purple-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// Seletor de Status customizado para Revisão (BOM, ATENÇÃO, TROCAR)
const StatusSelector = ({ label, value, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-all">
        <span className="text-zinc-300 font-bold text-xs uppercase tracking-widest">{label}</span>
        <div className="flex gap-2 mt-3 md:mt-0">
            {['BOM', 'ATENÇÃO', 'TROCAR'].map((status) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${value === status
                        ? (status === 'BOM' ? 'bg-green-600/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
                            status === 'ATENÇÃO' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                                'bg-red-600/20 border-red-500 text-red-500')
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
                        }`}
                >
                    {status === 'BOM' && '✓ '} {status.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

export default function RevisaoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    const [relatoMecanico, setRelatoMecanico] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');

    // Checklist Completo Fiel à Imagem
    const [checklist, setChecklist] = useState({
        // MOTOR & ARREFECIMENTO
        correias: 'BOM',
        velasCabos: 'BOM',
        fluidoRadiador: 'BOM',
        vazamentos: 'BOM',
        // FREIOS
        pastilhas: 'BOM',
        discos: 'BOM',
        fluidoFreio: 'BOM',
        // SUSPENSÃO & DIREÇÃO
        amortecedores: 'BOM',
        buchasBandeja: 'BOM',
        bieletasTerminais: 'BOM',
        // GERAL
        filtroCabine: 'BOM',
        filtroAr: 'BOM',
        iluminacao: 'BOM',
        palhetas: 'BOM'
    });

    useEffect(() => {
        if (osParaEditar) {
            setRelatoMecanico(osParaEditar.relatoRevisao || '');
            setFotos(osParaEditar.fotosRevisao || []);
            setPecas(osParaEditar.valorPecas || '0');
            setMaoDeObra(osParaEditar.valorMaoObra || '0');
            if (osParaEditar.checklistRevisao) setChecklist(osParaEditar.checklistRevisao);
        }
    }, [osParaEditar]);

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos para Revisão!");

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
        if (!Recognition) return alert("Microfone não suportado no navegador atual.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening) { rec.stop(); setIsListening(false); }
        else {
            setIsListening(true); rec.start();
            rec.onresult = (e) => setRelatoMecanico(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            const dadosRevisao = {
                tipoServico: 'revisao',
                checklistRevisao: checklist,
                relatoRevisao: relatoMecanico,
                fotosRevisao: fotos,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                totalRevisao: vTotal,
                data_atualizacao: new Date().toISOString()
            };
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosRevisao);
            await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosRevisao, osBase: osParaEditar });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

            {/* 🛑 MODAL DE BLOQUEIO (VAI DIRETO PARA O.S.) */}
            {showBlocker && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <AlertTriangle size={60} className="text-purple-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            Para salvar a Revisão Geral, você precisa:<br />
                            <span className="text-white font-bold underline">1. Iniciar a O.S. (Triagem)</span><br />
                            <span className="text-white font-bold underline">2. Clicar em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">

                {/* Header Roxo Profissional */}
                <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-purple-600 rounded-[1.5rem] shadow-xl shadow-purple-600/30">
                            <ClipboardCheck className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Revisão Geral</h1>
                            <p className="text-purple-400 font-bold text-xs tracking-[0.3em] uppercase">Checklist Preventivo e Corretivo</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
                </div>

                {/* 📸 CARROSSEL DE FOTOS (MÁX 5) */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-3">
                        <Camera size={18} /> Fotos do Veículo / Serviço ({fotos.length}/5)
                    </h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 shadow-2xl group">
                                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className="min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 bg-zinc-900/50 transition-all hover:bg-zinc-800">
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* LAYOUT DE 2 COLUNAS (Checklist vs. Lateral de Ações) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLUNA ESQUERDA: CHECKLIST COMPLETO */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 shadow-xl">
                            <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Thermometer size={14} className="text-purple-500" /> Motor & Arrefecimento</h2>
                            <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                                <StatusSelector label="Correias (Dentada/Poly-V)" value={checklist.correias} onChange={v => setChecklist({ ...checklist, correias: v })} />
                                <StatusSelector label="Velas e Cabos" value={checklist.velasCabos} onChange={v => setChecklist({ ...checklist, velasCabos: v })} />
                                <StatusSelector label="Fluido do Radiador" value={checklist.fluidoRadiador} onChange={v => setChecklist({ ...checklist, fluidoRadiador: v })} />
                                <StatusSelector label="Vazamentos de Óleo/Água" value={checklist.vazamentos} onChange={v => setChecklist({ ...checklist, vazamentos: v })} />
                            </div>

                            <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Disc size={14} className="text-purple-500" /> Freios</h2>
                            <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                                <StatusSelector label="Pastilhas de Freio" value={checklist.pastilhas} onChange={v => setChecklist({ ...checklist, pastilhas: v })} />
                                <StatusSelector label="Discos de Freio" value={checklist.discos} onChange={v => setChecklist({ ...checklist, discos: v })} />
                                <StatusSelector label="Fluido de Freio" value={checklist.fluidoFreio} onChange={v => setChecklist({ ...checklist, fluidoFreio: v })} />
                            </div>

                            <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Wrench size={14} className="text-purple-500" /> Suspensão & Direção</h2>
                            <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                                <StatusSelector label="Amortecedores" value={checklist.amortecedores} onChange={v => setChecklist({ ...checklist, amortecedores: v })} />
                                <StatusSelector label="Buchas da Bandeja" value={checklist.buchasBandeja} onChange={v => setChecklist({ ...checklist, buchasBandeja: v })} />
                                <StatusSelector label="Bieletas / Terminais" value={checklist.bieletasTerminais} onChange={v => setChecklist({ ...checklist, bieletasTerminais: v })} />
                            </div>

                            <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-purple-500" /> Geral</h2>
                            <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden">
                                <StatusSelector label="Filtro de Cabine" value={checklist.filtroCabine} onChange={v => setChecklist({ ...checklist, filtroCabine: v })} />
                                <StatusSelector label="Filtro de Ar" value={checklist.filtroAr} onChange={v => setChecklist({ ...checklist, filtroAr: v })} />
                                <StatusSelector label="Iluminação" value={checklist.iluminacao} onChange={v => setChecklist({ ...checklist, iluminacao: v })} />
                                <StatusSelector label="Palhetas" value={checklist.palhetas} onChange={v => setChecklist({ ...checklist, palhetas: v })} />
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: RELATO, VALORES E BOTÕES (Fiel ao print) */}
                    <div className="lg:col-span-1 space-y-6">

                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                            <label className="text-[10px] text-purple-400 font-black uppercase mb-4 flex items-center gap-2"><Mic size={14} /> Relato do Mecânico</label>
                            <textarea
                                value={relatoMecanico} onChange={e => setRelatoMecanico(e.target.value)}
                                placeholder="Ex: Cliente reclama de barulho na roda direita..."
                                className="bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 p-4 rounded-xl outline-none w-full min-h-[140px] text-sm resize-none mb-4"
                            />
                            <button
                                onClick={toggleMic}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${isListening ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-zinc-950 hover:bg-purple-600 hover:border-purple-500 border-zinc-700 text-zinc-300 hover:text-white'}`}
                            >
                                <Mic size={18} /> {isListening ? 'Gravando...' : 'Ditar por Voz'}
                            </button>
                        </div>

                        {/* Botão de Diagnóstico IA (Estético baseado no print) */}
                        <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] shadow-lg flex items-center justify-center gap-2 transition-all">
                            <Sparkles size={18} className="text-yellow-300" /> GERAR DIAGNÓSTICO PARA O CLIENTE
                        </button>

                        {/* Quadro de Valores */}
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl font-mono">
                            <h2 className="text-yellow-500 font-black mb-6 uppercase text-[10px] tracking-widest">💰 Valor do Serviço</h2>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Peças (R$)</label>
                                    <input value={pecas} onChange={e => setPecas(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Mão de Obra (R$)</label>
                                    <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center" />
                                </div>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">Total:</span>
                                <span className="text-2xl font-black text-green-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* BOTÃO SALVAR O.S. (ROXO) */}
                        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg uppercase italic rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex justify-center items-center gap-2">
                            {loading ? 'Processando...' : <><Plus size={24} /> ADICIONAR À O.S.</>}
                        </button>
                        <p className="text-center text-[9px] text-zinc-600 mt-2">Salva a revisão como nova O.S. no sistema</p>

                    </div>
                </div>

            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl">
                    <CheckCircle size={32} /> Revisão Salva!
                </div>
            )}
        </div>
    );
}