/* eslint-disable */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, Snowflake, Wrench, Sparkles,
  Disc, Settings, Box, Search, Wind
} from "lucide-react";

const STYLES = {
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
  input: 'bg-zinc-950 border-zinc-800 focus:border-cyan-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

const GasButton = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} className={`py-3 px-6 rounded-full font-black text-xs uppercase tracking-widest transition-all border ${active ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' : 'bg-zinc-950/50 border-zinc-800 text-zinc-500'}`}>
    {label}
  </button>
);

const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
  <button type="button" onClick={onClick} className={`w-full p-4 rounded-2xl flex flex-col items-start transition-all border ${active ? 'bg-cyan-600/10 border-cyan-500' : 'bg-zinc-950/40 border-zinc-800'}`}>
    <div className="flex items-center gap-2 mb-1">
      <Icon size={16} className={active ? 'text-cyan-400' : 'text-zinc-500'} />
      <span className={`font-black text-xs uppercase ${active ? 'text-cyan-400' : 'text-zinc-300'}`}>{title}</span>
    </div>
    <span className="text-[9px] font-bold text-zinc-500 ml-6">{subtitle}</span>
  </button>
);

export default function ArCondicionadoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [tipoGas, setTipoGas] = useState('R134a');
  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');
  const [isListening, setIsListening] = useState(false);
  const [servicos, setServicos] = useState({
    manutencaoGeral: false, higienizacao: false, recargaGas: false, testeVazamento: false
  });

  const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (osParaEditar) {
      setTipoGas(osParaEditar.tipoGasAr || 'R134a');
      setObsGerais(osParaEditar.observacaoAr || '');
      setFotos(osParaEditar.fotosAr || []);
      setPecas(osParaEditar.valorPecas || '0,00');
      setMaoDeObra(osParaEditar.valorMaoObra || '0,00');
      if (osParaEditar.servicosAr) setServicos(osParaEditar.servicosAr);
    }
  }, [osParaEditar]);

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    const novasFotos = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev) => resolve(ev.target.result);
      });
    }));
    setFotos(prev => [...prev, ...novasFotos]);
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
        tipoServico: 'ar-condicionado',
        tipoGasAr: tipoGas,
        servicosAr: servicos,
        observacaoAr: obsGerais,
        fotosAr: fotos,
        valorPecas: pecas,
        valorMaoObra: maoDeObra,
        totalAr: vTotal,
        data_atualizacao: new Date().toISOString()
      });
      setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">
      {showBlocker && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] text-center">
            <AlertTriangle size={60} className="text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic">O.S. Requerida</h2>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-cyan-500 text-white font-black rounded-2xl">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-cyan-600 rounded-[1.5rem] shadow-xl"><Snowflake className="text-white" size={36} /></div>
            <h1 className="text-4xl font-black text-white uppercase italic">Ar-Condicionado</h1>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800"><X size={28} /></button>
        </div>
        <div className={STYLES.card}>
          <h2 className="text-cyan-500 font-black mb-6 uppercase text-xs flex items-center gap-2"><Wind size={16} /> Gás</h2>
          <div className="flex gap-4">
            <GasButton label="R134a" active={tipoGas === 'R134a'} onClick={() => setTipoGas('R134a')} />
            <GasButton label="R1234yf" active={tipoGas === 'R1234yf'} onClick={() => setTipoGas('R1234yf')} />
          </div>
        </div>
        <div className={STYLES.card}>
          <h2 className="text-cyan-500 font-black mb-6 uppercase text-xs">Serviços</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle icon={Wrench} title="Manutenção" active={servicos.manutencaoGeral} onClick={() => toggleServico('manutencaoGeral')} />
            <ServiceToggle icon={Sparkles} title="Higienização" active={servicos.higienizacao} onClick={() => toggleServico('higienizacao')} />
          </div>
        </div>
        <div className={STYLES.card}>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input} placeholder="Peças" />
            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input} placeholder="Mão de Obra" />
          </div>
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-8 rounded-[1.5rem] text-center">
            <span className="text-4xl font-black text-cyan-400">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
          </div>
        </div>
        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-cyan-500 text-black font-black text-2xl uppercase italic rounded-2xl">
          {loading ? 'Salvando...' : 'SALVAR SERVIÇO NA O.S.'}
        </button>
      </div>
    </div>
  );
}