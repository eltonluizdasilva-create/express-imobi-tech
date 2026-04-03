/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    AlertTriangle, ArrowRight, Disc, Target, Gauge,
    Settings2
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border-zinc-800 focus:border-blue-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// COMPONENTE DE BOTÃO LIGA/DESLIGA PARA OS SERVIÇOS (Fiel à sua imagem)
const ToggleButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full py-4 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border ${active
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
    >
        {label}
    </button>
);

export default function Alinhamento({
    oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    const [obsAlinhamento, setObsAlinhamento] = useState('');
    const [pecas, setPecas] = useState('0,00');
    const [maoDeObra, setMaoDeObra] = useState('0,00');

    // Estado dos Serviços (Botões de Liga/Desliga da sua imagem)
    const [servicos, setServicos] = useState({
        alinhamentoDianteiro: false,
        alinhamentoDT: false,
        balanceamento2: false,
        balanceamento4: false,
        cambagemEsq: false,
        cambagemDir: false,
        caster: false,
        desempenoRoda: false,
        trocaValvula: false,
        rodizio: false
    });

    // Estado dos Pneus
    const [estadoPneus, setEstadoPneus] = useState('Bons');

    const toggleServico = (key) => {
        setServicos(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        if (osParaEditar) {
            setObsAlinhamento(osParaEditar.observacaoAlinhamento || '');
            setFotos(osParaEditar.fotosAlinhamento || []);
            setPecas(osParaEditar.valorPecas || '0,00');
            setMaoDeObra(osParaEditar.valorMaoObra || '0,00');
            setEstadoPneus(osParaEditar.estadoPneus || 'Bons');
            if (osParaEditar.servicosAlinhamento) {
                setServicos(osParaEditar.servicosAlinhamento);
            }
        }
    }, [osParaEditar]);

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos para Evidências!");

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
            rec.onresult = (e) => setObsAlinhamento(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
                tipoServico: 'alinhamento',
                servicosAlinhamento: servicos,
                estadoPneus: estadoPneus,
                observacaoAlinhamento: obsAlinhamento,
                fotosAlinhamento: fotos,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                totalAlinhamento: vTotal,
                data_atualizacao: new Date().toISOString()
            });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

            {/* 🛑 MODAL DE BLOQUEIO */}
            {showBlocker && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <AlertTriangle size={60} className="text-blue-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            O laudo de Alinhamento precisa de uma O.S.<br />
                            <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
                            <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">

                {/* Header Azul Profissional */}
                <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-blue-600 rounded-[1.5rem] shadow-xl shadow-blue-600/30">
                            <Target className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Alinhamento e Balanceamento</h1>
                            <p className="text-blue-500 font-bold text-xs tracking-[0.3em] uppercase">Geometria e Dinâmica de Rodas</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
                </div>

                {/* 📷 CARROSSEL DE FOTOS (MÁX 5) */}
                <div className={STYLES.card}>
                    <h2 className="text-blue-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-3">
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
                            <label className="min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-zinc-900/50 transition-all hover:bg-zinc-800">
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* ⚙️ SERVIÇOS EXECUTADOS (Fiel à imagem 37abea) */}
                <div className={STYLES.card}>
                    <h2 className="text-blue-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-blue-500 pl-4"><Disc size={16} className="inline mr-2" /> Serviços Principais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <ToggleButton label="Alinhamento Dianteiro" active={servicos.alinhamentoDianteiro} onClick={() => toggleServico('alinhamentoDianteiro')} />
                        <ToggleButton label="Alinhamento D/T" active={servicos.alinhamentoDT} onClick={() => toggleServico('alinhamentoDT')} />
                        <ToggleButton label="Balanceamento (2 Rodas)" active={servicos.balanceamento2} onClick={() => toggleServico('balanceamento2')} />
                        <ToggleButton label="Balanceamento (4 Rodas)" active={servicos.balanceamento4} onClick={() => toggleServico('balanceamento4')} />
                    </div>

                    <h2 className="text-blue-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-blue-500 pl-4"><Settings2 size={16} className="inline mr-2" /> Serviços Adicionais</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                        <ToggleButton label="Cambagem Esq." active={servicos.cambagemEsq} onClick={() => toggleServico('cambagemEsq')} />
                        <ToggleButton label="Cambagem Dir." active={servicos.cambagemDir} onClick={() => toggleServico('cambagemDir')} />
                        <ToggleButton label="Caster" active={servicos.caster} onClick={() => toggleServico('caster')} />
                        <ToggleButton label="Desempeno Roda" active={servicos.desempenoRoda} onClick={() => toggleServico('desempenoRoda')} />
                        <ToggleButton label="Troca de Válvula" active={servicos.trocaValvula} onClick={() => toggleServico('trocaValvula')} />
                        <ToggleButton label="Rodízio" active={servicos.rodizio} onClick={() => toggleServico('rodizio')} />
                    </div>

                    <h2 className="text-blue-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-blue-500 pl-4"><Gauge size={16} className="inline mr-2" /> Estado dos Pneus</h2>
                    <div className="flex flex-wrap gap-4 mb-10">
                        {['Bons', 'Meia-vida', 'Avisar Troca', 'Carecas'].map(estado => (
                            <button
                                key={estado}
                                onClick={() => setEstadoPneus(estado)}
                                className={`py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${estadoPneus === estado
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                        : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
                                    }`}
                            >
                                {estado}
                            </button>
                        ))}
                    </div>

                    <div className="relative pt-2">
                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
                            <Mic size={14} className="text-blue-400" /> Observações Extras
                        </label>
                        <textarea
                            value={obsAlinhamento} onChange={e => setObsAlinhamento(e.target.value)}
                            placeholder="Detalhes do serviço, peças com folga detectadas na rampa..."
                            className={STYLES.input + " min-h-[140px] leading-relaxed pr-16"}
                        />
                        <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-blue-600'}`}>
                            <Mic size={24} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* 💰 VALORES DO SERVIÇO */}
                <div className={STYLES.card}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2 text-shadow-sm">Peças (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2 text-shadow-sm">Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div className="bg-blue-950/30 border border-blue-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest">Total</span>
                            <span className="text-3xl font-black text-blue-500 shadow-blue-500/50">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">
                    {loading ? 'Processando Serviço...' : <><Save size={32} /> Salvar O.S. de Alinhamento</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl">
                    <CheckCircle size={32} /> Laudo de Geometria Salvo!
                </div>
            )}
        </div>
    );
}