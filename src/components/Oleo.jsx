/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    AlertTriangle, ArrowRight, Droplet, Car, Bike, Truck,
    CheckSquare, Gauge
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border-zinc-800 focus:border-rose-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// Botão de Seleção Única (Veículo e Kit)
const SelectButton = ({ label, sublabel, active, onClick, icon: Icon, activeColor = 'bg-rose-600/20 border-rose-500 text-rose-500' }) => (
    <button
        onClick={onClick}
        className={`w-full py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${active ? `${activeColor} shadow-lg` : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'
            }`}
    >
        {Icon && <Icon size={20} className={active ? '' : 'opacity-50'} />}
        <span className="font-black text-[11px] uppercase tracking-widest mt-1">{label}</span>
        {sublabel && <span className="text-[9px] font-bold opacity-70">{sublabel}</span>}
    </button>
);

// Botão de Checklist Adicional
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

export default function OleoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);

    // Imagens
    const [fotoPainel, setFotoPainel] = useState(null);
    const [fotos, setFotos] = useState([]);

    // Categorias (Fiel à imagem 381906)
    const [tipoVeiculo, setTipoVeiculo] = useState('carro'); // carro, moto, pesado
    const [kitServico, setKitServico] = useState('normal'); // normal, severo

    // Adicionais
    const [adicionais, setAdicionais] = useState({
        oleoCambio: false, filtroAr: false, filtroCabine: false,
        filtroComb: false, higienizacao: false, revisaoGeral: false
    });

    // Dados Técnicos (Fiel à imagem 38193c)
    const [kmAtual, setKmAtual] = useState('');
    const [proximaTroca, setProximaTroca] = useState('');
    const [tipoOleo, setTipoOleo] = useState('5W30 Sintético');
    const [litros, setLitros] = useState('');

    const [obsGerais, setObsGerais] = useState('');
    const [pecas, setPecas] = useState('0,00');
    const [maoDeObra, setMaoDeObra] = useState('0,00');

    // Cálculo Automático de KM
    useEffect(() => {
        if (kmAtual && !isNaN(kmAtual)) {
            const soma = kitServico === 'normal' ? 10000 : 5000;
            setProximaTroca(String(parseInt(kmAtual) + soma));
        } else {
            setProximaTroca('');
        }
    }, [kmAtual, kitServico]);

    useEffect(() => {
        if (osParaEditar) {
            setTipoVeiculo(osParaEditar.tipoVeiculoOleo || 'carro');
            setKitServico(osParaEditar.kitServicoOleo || 'normal');
            if (osParaEditar.adicionaisOleo) setAdicionais(osParaEditar.adicionaisOleo);
            setFotoPainel(osParaEditar.fotoPainel || null);
            setFotos(osParaEditar.fotosOleo || []);
            setKmAtual(osParaEditar.kmAtualOleo || '');
            setProximaTroca(osParaEditar.proximaTrocaOleo || '');
            setTipoOleo(osParaEditar.tipoOleo || '5W30 Sintético');
            setLitros(osParaEditar.litrosOleo || '');
            setObsGerais(osParaEditar.observacaoOleo || '');
            setPecas(osParaEditar.valorPecas || '0,00');
            setMaoDeObra(osParaEditar.valorMaoObra || '0,00');
        }
    }, [osParaEditar]);

    const toggleAdicional = (key) => setAdicionais(prev => ({ ...prev, [key]: !prev[key] }));

    // Compressão de Fotos Genérica
    const processarImagem = (file) => {
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
    };

    const handleUploadFotoPainel = async (e) => {
        if (e.target.files[0]) {
            const imgBase64 = await processarImagem(e.target.files[0]);
            setFotoPainel(imgBase64);
        }
    };

    const handleUploadFotosExtras = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos de evidência!");
        const novasFotos = await Promise.all(files.map(file => processarImagem(file)));
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
            rec.onresult = (e) => setObsGerais(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
                tipoServico: 'oleo',
                tipoVeiculoOleo: tipoVeiculo,
                kitServicoOleo: kitServico,
                adicionaisOleo: adicionais,
                fotoPainel: fotoPainel,
                fotosOleo: fotos,
                kmAtualOleo: kmAtual,
                proximaTrocaOleo: proximaTroca,
                tipoOleo: tipoOleo,
                litrosOleo: litros,
                observacaoOleo: obsGerais,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                totalOleo: vTotal,
                data_atualizacao: new Date().toISOString()
            });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

            {/* 🛑 MODAL DE BLOQUEIO (DIRETO PARA O.S.) */}
            {showBlocker && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <AlertTriangle size={60} className="text-rose-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            O serviço de óleo precisa estar vinculado a uma O.S.<br />
                            <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
                            <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
                        </p>
                        <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">

                {/* Header Rosa Escuro (Rose) */}
                <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-rose-600 rounded-[1.5rem] shadow-xl shadow-rose-600/30">
                            <Droplet className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Troca de Óleo</h1>
                            <p className="text-rose-500 font-bold text-xs tracking-[0.3em] uppercase">Lubrificantes e Filtros</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
                </div>

                {/* 🚗 CONFIGURAÇÃO DO SERVIÇO (Fiel à Imagem 381906) */}
                <div className={STYLES.card}>
                    <h2 className="text-zinc-500 font-black mb-4 uppercase text-[10px] tracking-widest">Tipo de Veículo</h2>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <SelectButton label="Carro" sublabel="180 dias" icon={Car} active={tipoVeiculo === 'carro'} onClick={() => setTipoVeiculo('carro')} />
                        <SelectButton label="Moto" sublabel="90 dias" icon={Bike} active={tipoVeiculo === 'moto'} onClick={() => setTipoVeiculo('moto')} />
                        <SelectButton label="Pesado" sublabel="180 dias" icon={Truck} active={tipoVeiculo === 'pesado'} onClick={() => setTipoVeiculo('pesado')} />
                    </div>

                    <h2 className="text-zinc-500 font-black mb-4 uppercase text-[10px] tracking-widest">Kit de Serviço</h2>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <SelectButton label="Kit Normal" sublabel="Sintético + Filtro" active={kitServico === 'normal'} onClick={() => setKitServico('normal')} activeColor="bg-green-600/20 border-green-500 text-green-500" />
                        <SelectButton label="Kit Severo" sublabel="Uso intenso + Filtros" active={kitServico === 'severo'} onClick={() => setKitServico('severo')} activeColor="bg-yellow-600/20 border-yellow-500 text-yellow-500" />
                    </div>

                    <h2 className="text-zinc-500 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Plus size={14} /> Adicionar ao Checklist:</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <ToggleButton label="Óleo Câmbio" active={adicionais.oleoCambio} onClick={() => toggleAdicional('oleoCambio')} />
                        <ToggleButton label="Filtro Ar" active={adicionais.filtroAr} onClick={() => toggleAdicional('filtroAr')} />
                        <ToggleButton label="Filtro Cabine" active={adicionais.filtroCabine} onClick={() => toggleAdicional('filtroCabine')} />
                        <ToggleButton label="Filtro Comb." active={adicionais.filtroComb} onClick={() => toggleAdicional('filtroComb')} />
                        <ToggleButton label="Higienização" active={adicionais.higienizacao} onClick={() => toggleAdicional('higienizacao')} />
                        <ToggleButton label="Revisão Geral" active={adicionais.revisaoGeral} onClick={() => toggleAdicional('revisaoGeral')} />
                    </div>
                </div>

                {/* 📸 FOTO DO PAINEL E KM (Fiel à imagem 381906 e 38193c) */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8 shadow-xl">
                    <h2 className="text-yellow-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Gauge size={16} /> Foto do Painel (KM)</h2>

                    {/* Caixa de Foto Específica do Painel */}
                    <div className="mb-8">
                        {fotoPainel ? (
                            <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                <img src={fotoPainel} className="w-full h-full object-cover" />
                                <button onClick={() => setFotoPainel(null)} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ) : (
                            <label className="w-full h-48 rounded-2xl border-2 border-dashed border-yellow-500/50 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 bg-yellow-500/5 transition-all">
                                <Camera size={40} className="text-yellow-500 mb-2" />
                                <span className="text-sm text-yellow-500 font-black uppercase tracking-widest">Fotografar Painel Agora</span>
                                <span className="text-[10px] text-zinc-500 mt-1">A Inteligência Artificial lê a quilometragem sozinha</span>
                                <input type="file" accept="image/*" capture="environment" onChange={handleUploadFotoPainel} className="hidden" />
                            </label>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">KM Atual</label>
                            <input value={kmAtual} onChange={e => setKmAtual(e.target.value)} type="number" placeholder="Ex: 54321" className={STYLES.input + " border-yellow-500/50 focus:border-yellow-500"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Próxima Troca</label>
                            <input value={proximaTroca} readOnly placeholder="Automático" className={STYLES.input + " bg-zinc-900 text-yellow-500 font-black opacity-80"} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Tipo de Óleo</label>
                            <select value={tipoOleo} onChange={e => setTipoOleo(e.target.value)} className={STYLES.input}>
                                <option value="5W30 Sintético">5W30 Sintético</option>
                                <option value="5W40 Sintético">5W40 Sintético</option>
                                <option value="10W40 Semi-sintético">10W40 Semi-sintético</option>
                                <option value="15W40 Mineral">15W40 Mineral</option>
                                <option value="0W20 Sintético">0W20 Sintético</option>
                                <option value="20W50 Mineral">20W50 Mineral</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Litros</label>
                            <input value={litros} onChange={e => setLitros(e.target.value)} placeholder="Ex: 4.5" className={STYLES.input} />
                        </div>
                    </div>
                </div>

                {/* 📷 CARROSSEL DE FOTOS GERAIS (MÁX 5) */}
                <div className={STYLES.card}>
                    <h2 className="text-rose-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-3">
                        <Camera size={18} /> Evidências do Serviço ({fotos.length}/5)
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[180px] h-[120px] rounded-2xl overflow-hidden border border-zinc-700 shadow-xl group">
                                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full"><Trash2 size={12} /></button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className="min-w-[180px] h-[120px] rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500 bg-zinc-900/50 transition-all">
                                <Plus size={32} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFotosExtras} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 🎙️ OBSERVAÇÕES E MICROFONE */}
                <div className={STYLES.card}>
                    <div className="relative">
                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
                            <Mic size={14} className="text-rose-400" /> Observações Extras
                        </label>
                        <textarea
                            value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                            placeholder="Vazamentos notados no cárter, rosca do bujão espanada..."
                            className={STYLES.input + " min-h-[120px] leading-relaxed pr-16"}
                        />
                        <button onClick={toggleMic} className={`absolute right-4 bottom-4 p-3 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-rose-600'}`}>
                            <Mic size={20} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* 💰 VALORES DO SERVIÇO */}
                <div className={STYLES.card}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2">Peças/Óleo (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2">Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div className="bg-rose-950/30 border border-rose-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-rose-400 font-black mb-1 uppercase tracking-widest">Total</span>
                            <span className="text-3xl font-black text-rose-500 shadow-rose-500/50">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all">
                    {loading ? 'Sincronizando...' : <><Save size={32} /> SALVAR SERVIÇO NA O.S.</>}
                </button>
            </div>
        </div>
    );
}