/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    Zap, AlertTriangle, ArrowRight, Battery,
    Gauge, Activity, LifeBuoy, ShieldCheck,
    Unplug, Thermometer, Radio
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8',
    input: 'bg-zinc-950 border-zinc-800 focus:border-cyan-500 text-zinc-100 p-4 rounded-xl outline-none w-full font-mono text-sm shadow-inner'
};

const StatusSelector = ({ label, value, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-all">
        <span className="text-zinc-300 font-bold text-xs uppercase tracking-widest">{label}</span>
        <div className="flex gap-2 mt-3 md:mt-0">
            {['OK', 'Atenção', 'Trocar'].map((status) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${value === status
                            ? (status === 'OK' ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' :
                                status === 'Atenção' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                                    'bg-red-600/20 border-red-500 text-red-500')
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
                        }`}
                >
                    {status.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

export default function VeiculoEletrico({
    oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    // Dados Técnicos (image_364464.png)
    const [dadosEV, setDadosEV] = useState({
        soh: '', soc: '', autonomia: '', conector: 'CCS2', defeito: ''
    });

    const [obsGeral, setObsGeral] = useState('');
    const [pecas, setPecas] = useState('0,00');
    const [maoDeObra, setMaoDeObra] = useState('0,00');

    // Checklist BEV Completo (image_36470b.png + Mecânica)
    const [checklist, setChecklist] = useState({
        packBateria: 'OK',
        conectorRecarga: 'OK',
        sistemaAltaTensao: 'OK',
        motorEletrico: 'OK',
        regeneracao: 'OK',
        redutor: 'OK',
        bateria12v: 'OK',
        // Adicionais de Segurança e Chassi
        isolamentoHV: 'OK',
        arrefecimentoBateria: 'OK',
        amortecedores: 'OK',
        freioMecanico: 'OK',
        pneusEV: 'OK'
    });

    useEffect(() => {
        if (osParaEditar) {
            setObsGeral(osParaEditar.observacaoEletrico || '');
            setFotos(osParaEditar.fotosEletrico || []);
            setDadosEV({
                soh: osParaEditar.soh || '',
                soc: osParaEditar.soc || '',
                autonomia: osParaEditar.autonomia || '',
                conector: osParaEditar.conector || 'CCS2',
                defeito: osParaEditar.defeitoQueixa || ''
            });
            if (osParaEditar.checklistEletrico) setChecklist(osParaEditar.checklistEletrico);
        }
    }, [osParaEditar]);

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowBlocker(true); return; }
        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
                tipoServico: 'eletrico',
                ...dadosEV,
                checklistEletrico: checklist,
                observacaoEletrico: obsGeral,
                fotosEletrico: fotos,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                total: vTotal,
                data_atualizacao: new Date().toISOString()
            });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

            {/* MODAL DE BLOQUEIO */}
            {showBlocker && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <AlertTriangle size={60} className="text-yellow-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase">O.S. Requerida</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            Para salvar este laudo 100% Elétrico:<br />
                            <span className="text-white font-bold underline italic">1. Crie a O.S. -> 2. Clique em Editar</span>
                        </p>
                        <button onClick={() => { irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all">
                            INICIAR O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                {/* Header Profissional */}
                <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-cyan-600 rounded-2xl shadow-xl shadow-cyan-600/30">
                            <Zap className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Elétricos BEV</h1>
                            <p className="text-cyan-500 font-bold text-[10px] tracking-[0.3em] uppercase">Módulo High Voltage • Master IA</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800"><X size={28} /></button>
                </div>

                {/* 📷 CARROSSEL DE FOTOS */}
                <div className={STYLES.card}>
                    <h2 className="text-cyan-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-3"><Camera size={18} /> Registros do Sistema ({fotos.length}/5)</h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 shadow-2xl group">
                                <img src={f} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className="min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 bg-zinc-900/50 transition-all">
                                <Plus size={40} className="text-zinc-700" />
                                <input type="file" multiple accept="image/*" onChange={() => { }} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* 📊 DADOS TÉCNICOS (Fiel à image_364464.png) */}
                <div className={STYLES.card}>
                    <h2 className="text-cyan-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-2"><Activity size={18} /> Telemetria de Bateria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">SOH (%)</label>
                                    <input value={dadosEV.soh} onChange={e => setDadosEV({ ...dadosEV, soh: e.target.value })} placeholder="98%" className={STYLES.input} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">SOC (%)</label>
                                    <input value={dadosEV.soc} onChange={e => setDadosEV({ ...dadosEV, soc: e.target.value })} placeholder="80%" className={STYLES.input} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Autonomia (km)</label>
                                <input value={dadosEV.autonomia} onChange={e => setDadosEV({ ...dadosEV, autonomia: e.target.value })} placeholder="450 km" className={STYLES.input} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Conector de Recarga</label>
                                <select value={dadosEV.conector} onChange={e => setDadosEV({ ...dadosEV, conector: e.target.value })} className={STYLES.input}>
                                    <option value="CCS2">CCS2 (Europeu/Brasil)</option>
                                    <option value="Type2">Type 2 (AC)</option>
                                    <option value="CHAdeMO">CHAdeMO</option>
                                    <option value="GB/T">GB/T (Chinês)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Defeito / Queixa</label>
                                <textarea value={dadosEV.defeito} onChange={e => setDadosEV({ ...dadosEV, defeito: e.target.value })} className={STYLES.input + " h-[95px]"} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ⚡ CHECKLIST BEV COMPLETO (Fiel à image_36470b.png) */}
                <div className={STYLES.card}>
                    <h2 className="text-cyan-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-cyan-600 pl-4">🛡️ Diagnóstico de Alta Tensão & Mecânica</h2>
                    <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-12 shadow-2xl">
                        <StatusSelector label="Pack de Bateria (Células/Vedação)" value={checklist.packBateria} onChange={v => setChecklist({ ...checklist, packBateria: v })} />
                        <StatusSelector label="Conector de Recarga (Pinos/Trava)" value={checklist.conectorRecarga} onChange={v => setChecklist({ ...checklist, conectorRecarga: v })} />
                        <StatusSelector label="Sistema de Alta Tensão (Cabos)" value={checklist.sistemaAltaTensao} onChange={v => setChecklist({ ...checklist, sistemaAltaTensao: v })} />
                        <StatusSelector label="Motor Elétrico / MCU" value={checklist.motorEletrico} onChange={v => setChecklist({ ...checklist, motorEletrico: v })} />
                        <StatusSelector label="Sistema de Regeneração" value={checklist.regeneracao} onChange={v => setChecklist({ ...checklist, regeneracao: v })} />
                        <StatusSelector label="Redutor / Transmissão" value={checklist.redutor} onChange={v => setChecklist({ ...checklist, redutor: v })} />
                        <StatusSelector label="Bateria Auxiliar 12V" value={checklist.bateria12v} onChange={v => setChecklist({ ...checklist, bateria12v: v })} />
                        {/* Extras de Chassi (Pneu e Amortecedor) */}
                        <StatusSelector label="Amortecedores e Suspensão" value={checklist.amortecedores} onChange={v => setChecklist({ ...checklist, amortecedores: v })} />
                        <StatusSelector label="Pneus Específicos para EV" value={checklist.pneusEV} onChange={v => setChecklist({ ...checklist, pneusEV: v })} />
                    </div>

                    <div className="relative pt-4">
                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2"><Mic size={14} className="text-cyan-500" /> Observações Gerais (Microfone)</label>
                        <textarea
                            value={obsGeral} onChange={e => setObsGeral(e.target.value)}
                            placeholder="Descreva aqui observações detalhadas sobre o estado do veículo..."
                            className={STYLES.input + " min-h-[160px] leading-relaxed"}
                        />
                        <button className="absolute right-5 bottom-5 p-4 bg-zinc-800 rounded-full hover:bg-red-600 transition-all shadow-lg active:scale-90"><Mic size={24} /></button>
                    </div>
                </div>

                {/* 💰 FINANCEIRO */}
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
                        <div className="bg-cyan-950 border border-cyan-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-cyan-400 font-black mb-1 uppercase tracking-widest">Total Elétrico</span>
                            <span className="text-3xl font-black text-cyan-400 shadow-cyan-500/50">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-2xl uppercase italic rounded-2xl shadow-xl transition-all">
                    {loading ? 'Processando...' : <><Save size={32} /> GERAR O.S. ELÉTRICA</>}
                </button>
            </div>
        </div>
    );
}