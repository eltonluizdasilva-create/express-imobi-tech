/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    AlertTriangle, ArrowRight, Disc, Target, Gauge,
    Settings2, Compass, RotateCcw, Shield
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border-zinc-800 focus:border-blue-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

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

const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl border ${active ? 'bg-orange-600/10 border-orange-500' : 'bg-zinc-900 border-zinc-800'} transition-all`}>
        <div className={`p-3 rounded-xl ${active ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}><Icon size={20} /></div>
        <div className="text-left flex-1">
            <div className={`font-black text-sm ${active ? 'text-white' : 'text-zinc-300'}`}>{title}</div>
            <div className="text-[10px] text-zinc-500">{subtitle}</div>
        </div>
    </button>
);

export default function AlinhamentoModulo({
    oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    const [obsGerais, setObsGerais] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');
    const [isListening, setIsListening] = useState(false);
    const [estadoPneus, setEstadoPneus] = useState('Bons');

    const [servicos, setServicos] = useState({
        alinhamento3DDianteiro: false,
        alinhamentoTraseiro: false,
        balanceamento: false,
        rodizioPneus: false,
        camberCaster: false,
        convergencia: false
    });

    useEffect(() => {
        if (osParaEditar) {
            setObsGerais(osParaEditar.observacaoAlinhamento || '');
            setFotos(osParaEditar.fotosAlinhamento || []);
            setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
            setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
            setEstadoPneus(osParaEditar.estadoPneus || 'Bons');
            if (osParaEditar.servicosAlinhamento) {
                setServicos(osParaEditar.servicosAlinhamento);
            }
        }
    }, [osParaEditar]);

    const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos!");
        setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 10));
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

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
            const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
            const vTotal = vPecas + vMao;

            const dadosAlinhamento = {
                tipoServico: 'alinhamento',
                servicosAlinhamento: servicos,
                observacaoAlinhamento: obsGerais,
                estadoPneus: estadoPneus,
                fotosAlinhamento: fotos,
                valorPecas: vPecas,
                valorMaoObra: vMao,
                total: vTotal,
                total_modulo: vTotal,
                data_atualizacao: new Date().toISOString()
            };
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosAlinhamento);
            await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosAlinhamento, osBase: osParaEditar });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>

            {showBlocker && (
                <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
                    <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
                        <AlertTriangle size={60} className="text-orange-400 mx-auto mb-6" />
                        <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
                        <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
                            O serviço de Alinhamento e Balanceamento precisa de uma O.S.<br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
                            <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-orange-600 rounded-[1.5rem] shadow-xl shadow-orange-600/30">
                            <Compass className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Geometria 3D & Balanceamento</h1>
                            <p className="text-orange-500 font-bold text-xs tracking-[0.3em] uppercase">Estabilidade e Segurança na Direção</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
                    <h2 className="text-orange-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-orange-500 pl-4">✓ Serviços Realizados</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ServiceToggle icon={Compass} title="Alinhamento 3D Dianteiro" subtitle="Convergência e Divergência" active={servicos.alinhamento3DDianteiro} onClick={() => toggleServico('alinhamento3DDianteiro')} />
                        <ServiceToggle icon={Compass} title="Alinhamento Traseiro" subtitle="Ajuste de eixo traseiro" active={servicos.alinhamentoTraseiro} onClick={() => toggleServico('alinhamentoTraseiro')} />
                        <ServiceToggle icon={Disc} title="Balanceamento de Rodas" subtitle="Remoção de vibrações" active={servicos.balanceamento} onClick={() => toggleServico('balanceamento')} />
                        <ServiceToggle icon={RotateCcw} title="Rodízio de Pneus" subtitle="Desgaste uniforme" active={servicos.rodizioPneus} onClick={() => toggleServico('rodizioPneus')} />
                        <ServiceToggle icon={Shield} title="Camber / Caster" subtitle="Ajustes especiais de ângulo" active={servicos.camberCaster} onClick={() => toggleServico('camberCaster')} />
                        <ServiceToggle icon={ArrowRight} title="Convergência / Divergência" subtitle="Ajuste fino de barras" active={servicos.convergencia} onClick={() => toggleServico('convergencia')} />
                    </div>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
                    <h2 className="text-orange-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valor do Serviço (R$)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Peças / Chumbos (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-orange-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
                        </div>
                        <div>
                            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-orange-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
                        </div>
                    </div>
                    <div className="bg-orange-950/20 border border-orange-500/30 p-8 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
                        <span className="text-5xl font-black text-orange-400">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
                    <div className="relative">
                        <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
                            <Mic size={14} className="text-orange-400" /> Observações Geometria
                        </label>
                        <textarea
                            value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                            placeholder="Ex: folga na bucha da bandeja direita, camber fora do padrão..."
                            className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-orange-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[140px] leading-relaxed pr-16`}
                        />
                        <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-orange-500 hover:text-black text-white'}`}>
                            <Mic size={24} />
                        </button>
                    </div>
                </div>

                <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
                    <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Camera size={16} /> Fotos do Laudo ({fotos.length}/10)
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[200px] h-[140px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl group">
                                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full"><Trash2 size={14} /></button>
                            </div>
                        ))}
                        {fotos.length < 10 && (
                            <label className={`min-w-[200px] h-[140px] rounded-[1.5rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 bg-orange-900/10 transition-all text-orange-500`}>
                                <Camera size={32} className="mb-2" />
                                <span className="font-black text-xs uppercase tracking-widest">Tirar Foto</span>
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-orange-500 hover:bg-orange-600 text-black font-black text-2xl uppercase italic rounded-2xl shadow-xl transition-all">
                    {loading ? 'Processando...' : <><Save size={32} /> SALVAR O.S. ALINHAMENTO</>}
                </button>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
                    <CheckCircle size={32} /> Alinhamento Atualizado!
                </div>
            )}
        </div>
    );
}