/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  Bike, AlertTriangle, ArrowRight, Settings, Disc
} from "lucide-react";

const STYLES = {
  accent: 'text-orange-500',
  button: 'bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 mb-6',
  input: 'bg-zinc-950 border-zinc-800 focus:border-orange-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

const StatusSelector = ({ label, value, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/40 hover:bg-zinc-800/10 transition-all">
    <span className="text-zinc-300 font-bold text-[11px] uppercase tracking-tighter">{label}</span>
    <div className="flex gap-2 mt-2 md:mt-0">
      {['OK', 'Atenção', 'Trocar'].map((status) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${value === status
            ? (status === 'OK' ? 'bg-green-600/20 border-green-500 text-green-500' :
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

export default function MotosModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);

  const [obsMotor, setObsMotor] = useState('');
  const [obsGeral, setObsGeral] = useState('');
  const [pecas, setPecas] = useState('0');
  const [maoDeObra, setMaoDeObra] = useState('0');

  const [checklist, setChecklist] = useState({
    compressao: 'OK', vazamentos: 'OK', injecao: 'OK',
    corrente: 'OK', pneus: 'OK', rolamentos: 'OK',
    freioD: 'OK', freioT: 'OK', garfo: 'OK', amortecedorT: 'OK'
  });

  useEffect(() => {
    if (osParaEditar) {
      setObsMotor(osParaEditar.obsMotor || '');
      setObsGeral(osParaEditar.obsGeral || '');
      setFotos(osParaEditar.fotosMoto || []);
      if (osParaEditar.checklistMoto) setChecklist(osParaEditar.checklistMoto);
    }
  }, [osParaEditar]);

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos!");
    // Lógica de compressão aqui...
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
      const dadosMoto = {
        tipoServico: 'moto',
        checklistMoto: checklist,
        obsMotor, obsGeral, fotosMoto: fotos,
        valorPecas: pecas, valorMaoObra: maoDeObra, total: vTotal,
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosMoto);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosMoto, osBase: osParaEditar });
      setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-32 relative">

      {/* MODAL DE BLOQUEIO */}
      {showBlocker && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
            <AlertTriangle size={60} className="text-yellow-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic">O.S. Requerida</h2>
            <p className="text-zinc-400 text-sm mb-10 leading-relaxed">
              Para salvar este laudo de Moto:<br />
              <span className="text-white font-bold">1. Crie a O.S. → 2. Clique em Editar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl flex items-center justify-center gap-2">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header Laranja */}
        <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-600/20"><Bike className="text-white" /></div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter text-orange-500">Checklist Moto Especializado</h1>
          </div>
          <button onClick={onCancelar} className="p-2 bg-zinc-900 rounded-xl border border-zinc-800"><X size={24} /></button>
        </div>

        {/* CARROSSEL DE FOTOS */}
        <div className={STYLES.card}>
          <h2 className="text-orange-500 font-black mb-6 uppercase text-[10px] flex items-center gap-2 tracking-widest"><Camera size={14} /> Evidências (Máx 5)</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[200px] h-[130px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl">
                <img src={f} className="w-full h-full object-cover" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full"><Trash2 size={12} /></button>
              </div>
            ))}
            {fotos.length < 5 && (
              <label className="min-w-[200px] h-[130px] rounded-[1.5rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 bg-zinc-900/50">
                <Plus size={32} className="text-zinc-700" />
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* MOTOR MOTO */}
        <div className={STYLES.card}>
          <h2 className="text-orange-500 font-black mb-6 uppercase text-[10px] border-l-2 border-orange-500 pl-3 tracking-widest">⚙️ Motor Moto</h2>
          <div className="bg-zinc-950/40 rounded-2xl border border-zinc-800/50 overflow-hidden mb-6">
            <StatusSelector label="Compressão do Motor" value={checklist.compressao} onChange={v => setChecklist({ ...checklist, compressao: v })} />
            <StatusSelector label="Vazamentos de Óleo" value={checklist.vazamentos} onChange={v => setChecklist({ ...checklist, vazamentos: v })} />
            <StatusSelector label="Carburador / Injeção" value={checklist.injecao} onChange={v => setChecklist({ ...checklist, injecao: v })} />
          </div>
          <div className="relative">
            <textarea value={obsMotor} onChange={e => setObsMotor(e.target.value)} placeholder="Detalhes do motor..." className={STYLES.input + " min-h-[80px]"} />
            <button className="absolute right-4 bottom-4 p-2 bg-zinc-800 rounded-full"><Mic size={18} /></button>
          </div>
        </div>

        {/* TRANSMISSÃO E RODAS */}
        <div className={STYLES.card}>
          <h2 className="text-orange-500 font-black mb-6 uppercase text-[10px] border-l-2 border-orange-500 pl-3 tracking-widest">⛓️ Transmissão & Rodas</h2>
          <div className="bg-zinc-950/40 rounded-2xl border border-zinc-800/50 overflow-hidden">
            <StatusSelector label="Corrente / Relação" value={checklist.corrente} onChange={v => setChecklist({ ...checklist, corrente: v })} />
            <StatusSelector label="Pneus / Calibragem" value={checklist.pneus} onChange={v => setChecklist({ ...checklist, pneus: v })} />
            <StatusSelector label="Rolamentos de Roda" value={checklist.rolamentos} onChange={v => setChecklist({ ...checklist, rolamentos: v })} />
          </div>
        </div>

        {/* FREIOS E SUSPENSÃO */}
        <div className={STYLES.card}>
          <h2 className="text-orange-500 font-black mb-6 uppercase text-[10px] border-l-2 border-orange-500 pl-3 tracking-widest">🛑 Freios & Suspensão Moto</h2>
          <div className="bg-zinc-950/40 rounded-2xl border border-zinc-800/50 overflow-hidden mb-6">
            <StatusSelector label="Freio Dianteiro" value={checklist.freioD} onChange={v => setChecklist({ ...checklist, freioD: v })} />
            <StatusSelector label="Freio Traseiro" value={checklist.freioT} onChange={v => setChecklist({ ...checklist, freioT: v })} />
            <StatusSelector label="Garfo / Óleo do Garfo" value={checklist.garfo} onChange={v => setChecklist({ ...checklist, garfo: v })} />
            <StatusSelector label="Amortecedor Traseiro" value={checklist.amortecedorT} onChange={v => setChecklist({ ...checklist, amortecedorT: v })} />
          </div>
          <div className="relative">
            <textarea value={obsGeral} onChange={e => setObsGeral(e.target.value)} placeholder="Particularidades..." className={STYLES.input + " min-h-[80px]"} />
            <button className="absolute right-4 bottom-4 p-2 bg-zinc-800 rounded-full"><Mic size={18} /></button>
          </div>
        </div>

        {/* FINANCEIRO */}
        <div className={STYLES.card}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end font-mono">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-1">Peças (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-lg"} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-1">Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-lg"} />
            </div>
            <div className="bg-orange-950/30 border border-orange-500/30 p-4 rounded-xl text-center">
              <span className="text-[10px] text-orange-500 font-black mb-1 uppercase tracking-widest block">Total Moto</span>
              <span className="text-2xl font-black text-orange-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white font-black text-2xl uppercase italic rounded-2xl shadow-xl transition-all">
          {loading ? 'Sincronizando...' : <><Save size={28} /> Finalizar O.S. Moto</>}
        </button>
      </div>
    </div>
  );
}
