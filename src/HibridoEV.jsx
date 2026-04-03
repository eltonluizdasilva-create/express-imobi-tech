/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
// Importação de todos os ícones necessários para não dar erro de "not defined"
import {
    Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
    BatteryCharging, Zap, AlertTriangle, ArrowRight, Info,
    Thermometer, ShieldCheck, Settings, Wrench, Activity
} from "lucide-react";

const STYLES = {
    accent: 'text-green-500',
    button: 'bg-green-600 hover:bg-green-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8',
    input: 'bg-zinc-950 border-zinc-800 focus:border-green-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono'
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

export default function HibridoEV({ oficinaId, osParaEditar, onCancelar, onSalvo, setAbaAtiva, placa, irParaNovaOS }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showBlocker, setShowBlocker] = useState(false);
    const [fotos, setFotos] = useState([]);

    // Estados de Medição e Valores
    const [medicoes, setMedicoes] = useState({ soh: '', bat12v: '', temp: '' });
    const [obsTecnica, setObsTecnica] = useState('');
    const [pecas, setPecas] = useState('0,00');
    const [maoDeObra, setMaoDeObra] = useState('0,00');

    // Checklist Completo e Sem Cortes
    const [checklist, setChecklist] = useState({
        // ALTA TENSÃO
        cabosLaranja: 'OK',
        plugServicoMSD: 'OK',
        isolamentoCarcaca: 'OK',
        bateriaTracaoHV: 'OK',
        inversorConversor: 'OK',
        arrefecimentoInversor: 'OK',
        // MECÂNICA E MOTOR
        motorCombustao: 'OK',
        vazamentosFluidos: 'OK',
        oleoFiltros: 'OK',
        correiasTensores: 'OK',
        // CHASSIS
        suspensaoGeral: 'OK',
        freioRegenerativo: 'OK',
        pneusEstado: 'OK',
        direcaoEletrica: 'OK'
    });

    useEffect(() => {
        if (osParaEditar) {
            setMedicoes({
                soh: osParaEditar.soh || '',
                bat12v: osParaEditar.bat12v || '',
                temp: osParaEditar.temp || ''
            });
            setObsTecnica(osParaEditar.observacaoHibrido || '');
            setFotos(osParaEditar.fotosHibrido || []);
            setPecas(osParaEditar.valorPecas || '0,00');
            setMaoDeObra(osParaEditar.valorMaoObra || '0,00');
            if (osParaEditar.checklistHibrido) setChecklist(osParaEditar.checklistHibrido);
        }
    }, [osParaEditar]);

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Limite de 5 fotos atingido!");

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

    const handleSalvarTentativa = async () => {
        if (!osParaEditar) {
            setShowBlocker(true);
            return;
        }
        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
                tipoServico: 'hibrido',
                checklistHibrido: checklist,
                observacaoHibrido: obsTecnica,
                fotosHibrido: fotos,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                totalMódulo: vTotal,
                ...medicoes,
                data_atualizacao: new Date().toISOString()
            });
            setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

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
                                // Tenta usar a função do Admin, se não tiver, apenas troca a aba
                                if (irParaNovaOS) {
                                    irParaNovaOS();
                                } else {
                                    if (setAbaAtiva) setAbaAtiva('os');
                                }
                                setShowBlocker(false);
                            }}
                            className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-green-600/20 transition-all uppercase tracking-tighter"
                        >
                            INICIAR NOVA O.S. AGORA <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )
            }

            <div className="max-w-5xl mx-auto">
                {/* Header Profissional */}
                <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-green-600 rounded-[1.5rem] shadow-xl shadow-green-600/30">
                            <BatteryCharging className="text-white" size={36} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Híbridos HEV / PHEV</h1>
                            <p className="text-green-500 font-bold text-xs tracking-[0.3em] uppercase">Tecnologia e Performance</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* 📷 CARROSSEL DE FOTOS PREMIUM */}
                <div className={STYLES.card}>
                    <h2 className="text-green-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-3">
                        <Camera size={18} /> Evidências do Sistema ({fotos.length}/5)
                    </h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 group shadow-2xl">
                                <img src={f} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-md p-2 rounded-full hover:bg-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {fotos.length < 5 && (
                            <label className="min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 bg-zinc-900/50 transition-all hover:bg-zinc-800">
                                <Plus size={40} className="text-zinc-700" />
                                <span className="text-xs text-zinc-600 font-black mt-3 uppercase">Adicionar</span>
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* ⚡ DIAGNÓSTICO TÉCNICO COMPLETO */}
                <div className={STYLES.card}>
                    <h2 className="text-green-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-green-600 pl-4">🛡️ Laudo de Alta Tensão</h2>
                    <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                        <StatusSelector label="Cabos de Alta Tensão (Integridade Laranja)" value={checklist.cabosLaranja} onChange={v => setChecklist({ ...checklist, cabosLaranja: v })} />
                        <StatusSelector label="Plug de Serviço (Trava MSD)" value={checklist.plugServicoMSD} onChange={v => setChecklist({ ...checklist, plugServicoMSD: v })} />
                        <StatusSelector label="Teste de Isolamento da Carcaça" value={checklist.isolamentoCarcaca} onChange={v => setChecklist({ ...checklist, isolamentoCarcaca: v })} />
                        <StatusSelector label="Bateria de Tração (HV) / SOH" value={checklist.bateriaTracaoHV} onChange={v => setChecklist({ ...checklist, bateriaTracaoHV: v })} />
                        <StatusSelector label="Inversor / Conversor DC-DC" value={checklist.inversorConversor} onChange={v => setChecklist({ ...checklist, inversorConversor: v })} />
                        <StatusSelector label="Arrefecimento do Sistema HV" value={checklist.arrefecimentoInversor} onChange={v => setChecklist({ ...checklist, arrefecimentoInversor: v })} />
                    </div>

                    <h2 className="text-green-500 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-green-600 pl-4 mt-12">⚙️ Mecânica Convencional</h2>
                    <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-10">
                        <StatusSelector label="Motor a Combustão (Ciclo Atkinson)" value={checklist.motorCombustao} onChange={v => setChecklist({ ...checklist, motorCombustao: v })} />
                        <StatusSelector label="Vazamentos e Níveis de Fluidos" value={checklist.vazamentosFluidos} onChange={v => setChecklist({ ...checklist, vazamentosFluidos: v })} />
                        <StatusSelector label="Suspensão, Amortecedores e Buchas" value={checklist.suspensaoGeral} onChange={v => setChecklist({ ...checklist, suspensaoGeral: v })} />
                        <StatusSelector label="Frenagem Regenerativa e Pastilhas" value={checklist.freioRegenerativo} onChange={v => setChecklist({ ...checklist, freioRegenerativo: v })} />
                    </div>

                    <div className="relative pt-4">
                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
                            <Mic size={14} className="text-green-500" /> Observações Técnicas Detalhadas
                        </label>
                        <textarea
                            value={obsTecnica} onChange={e => setObsTecnica(e.target.value)}
                            placeholder="Digite ou use o microfone para relatar o diagnóstico da IA e do mecânico..."
                            className={STYLES.input + " min-h-[160px] text-sm leading-relaxed"}
                        />
                        <button className="absolute right-5 bottom-5 p-4 bg-zinc-800 rounded-full hover:bg-red-600 transition-all shadow-lg active:scale-90">
                            <Mic size={24} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* 💰 FINANCEIRO DO MÓDULO */}
                <div className={STYLES.card}>
                    <h2 className="text-green-500 font-black mb-8 uppercase text-xs tracking-widest">💰 Orçamento do Módulo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-tighter">Peças (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-tighter">Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
                        </div>
                        <div className="bg-green-950 border border-green-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
                            <span className="text-[10px] text-green-500 font-black mb-1 uppercase tracking-widest">Total Híbrido</span>
                            <span className="text-3xl font-black text-green-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* BOTÃO FINAL */}
                <button onClick={handleSalvarTentativa} disabled={loading} className={STYLES.button + " w-full py-6 uppercase text-2xl italic tracking-tighter"}>
                    {loading ? 'Sincronizando Dados...' : <><Save size={32} /> Finalizar e Atualizar O.S.</>}
                </button>
            </div>

            {
                success && (
                    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl">
                        <CheckCircle size={32} /> Sincronizado com Sucesso!
                    </div>
                )
            }
        </div >
    );
}