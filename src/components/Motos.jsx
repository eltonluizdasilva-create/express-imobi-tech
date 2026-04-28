/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  Bike, AlertTriangle, ArrowRight, Settings, Disc,
  Droplets, Activity, Zap, RotateCcw, Shield
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

const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${active ? 'bg-orange-600/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'}`}
    >
        <div className={`p-3 rounded-xl ${active ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
            <Icon size={20} />
        </div>
        <div className="flex-1">
            <h3 className={`text-xs font-black uppercase tracking-tight ${active ? 'text-white' : 'text-zinc-400'}`}>{title}</h3>
            <p className="text-[10px] text-zinc-500 font-bold leading-tight">{subtitle}</p>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-700'}`}>
            {active && <CheckCircle size={14} />}
        </div>
    </button>
);

export default function MotosModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0');
  const [maoDeObra, setMaoDeObra] = useState('0');
  const [servicos, setServicos] = useState({ oleo: false, relacao: false, freios: false, pneus: false, injecao: false, revisaoGeral: false });

  const [checklist, setChecklist] = useState({
    compressao: 'OK', vazamentos: 'OK', injecao: 'OK',
    corrente: 'OK', pneus: 'OK', rolamentos: 'OK',
    freioD: 'OK', freioT: 'OK', garfo: 'OK', amortecedorT: 'OK'
  });

  useEffect(() => {
    if (osParaEditar) {
      setObsGerais(osParaEditar.obsGeral || '');
      setFotos(osParaEditar.fotosMoto || []);
      setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
      setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
      if (osParaEditar.checklistMoto) setChecklist(osParaEditar.checklistMoto);
      if (osParaEditar.servicosMoto) setServicos(osParaEditar.servicosMoto);
    }
  }, [osParaEditar]);

  const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));
  
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

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos!");
    // Simplificado para o exemplo, ideal usar compressão como nos outros
    setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 10));
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
      const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
      const vTotal = vPecas + vMao;
      
      const dadosMoto = {
        tipoServico: 'moto',
        checklistMoto: checklist,
        servicosMoto: servicos,
        obsGeral: obsGerais, 
        fotosMoto: fotos,
        valorPecas: vPecas,
        valorMaoObra: vMao,
        total: vTotal,
        total_modulo: vTotal,
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosMoto);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosMoto, osBase: osParaEditar });
      setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>

      {/* 🛑 MODAL DE BLOQUEIO */}
      {showBlocker && (
        <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
          <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
            <AlertTriangle size={60} className="text-orange-500 mx-auto mb-6" />
            <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
            <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
              O serviço de Motos precisa de uma O.S.<br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-600/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header Laranja/Moto */}
        <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
          <div className="flex items-center gap-6">
            <div className="p-5 bg-orange-600 rounded-[1.5rem] shadow-xl shadow-orange-600/30">
              <Bike className="text-white" size={36} />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Centro de Motos</h1>
              <p className="text-orange-500 font-bold text-xs tracking-[0.3em] uppercase">Especialista em Duas Rodas</p>
            </div>
          </div>
          <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
        </div>

        {/* 📋 SERVIÇOS TIPO GRID */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-orange-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-orange-500 pl-4">✓ Serviços Realizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle icon={Droplets} title="Troca de Óleo" subtitle="Óleo + Filtro + Vedação" active={servicos.oleo} onClick={() => toggleServico('oleo')} />
            <ServiceToggle icon={Activity} title="Relação / Corrente" subtitle="Ajuste, limpeza e lubrificação" active={servicos.relacao} onClick={() => toggleServico('relacao')} />
            <ServiceToggle icon={Disc} title="Freios (Pastilha/Lona)" subtitle="Revisão de segurança" active={servicos.freios} onClick={() => toggleServico('freios')} />
            <ServiceToggle icon={Shield} title="Pneus / Rodas" subtitle="Montagem e balanceamento" active={servicos.pneus} onClick={() => toggleServico('pneus')} />
            <ServiceToggle icon={Zap} title="Injeção / Carburador" subtitle="Limpeza e diagnóstico" active={servicos.injecao} onClick={() => toggleServico('injecao')} />
            <ServiceToggle icon={RotateCcw} title="Revisão Geral" subtitle="Checklist completo" active={servicos.revisaoGeral} onClick={() => toggleServico('revisaoGeral')} />
          </div>
        </div>

        {/* 📋 CHECKLIST TÉCNICO */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
            <h2 className="text-orange-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">🔍 Checklist de Inspeção</h2>
            <div className={`bg-zinc-950/40 rounded-3xl border ${t?.border || 'border-zinc-800'} overflow-hidden`}>
                <StatusSelector label="Compressão do Motor" value={checklist.compressao} onChange={v => setChecklist({ ...checklist, compressao: v })} />
                <StatusSelector label="Vazamentos de Óleo/Fluido" value={checklist.vazamentos} onChange={v => setChecklist({ ...checklist, vazamentos: v })} />
                <StatusSelector label="Sistema de Injeção" value={checklist.injecao} onChange={v => setChecklist({ ...checklist, injecao: v })} />
                <StatusSelector label="Corrente (Folga/Estado)" value={checklist.corrente} onChange={v => setChecklist({ ...checklist, corrente: v })} />
                <StatusSelector label="Pneus (Sulco/Calibragem)" value={checklist.pneus} onChange={v => setChecklist({ ...checklist, pneus: v })} />
                <StatusSelector label="Rolamentos de Roda" value={checklist.rolamentos} onChange={v => setChecklist({ ...checklist, rolamentos: v })} />
                <StatusSelector label="Freio Dianteiro" value={checklist.freioD} onChange={v => setChecklist({ ...checklist, freioD: v })} />
                <StatusSelector label="Freio Traseiro" value={checklist.freioT} onChange={v => setChecklist({ ...checklist, freioT: v })} />
            </div>
        </div>

        {/* 📝 OBSERVAÇÕES E MICROFONE */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <div className="relative">
            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
              <Mic size={14} className="text-orange-400" /> Notas Técnicas da Moto (Microfone)
            </label>
            <textarea
              value={obsGerais} onChange={e => setObsGerais(e.target.value)}
              placeholder="Ex: folga no pedal de câmbio, vazamento no retentor da bengala..."
              className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-orange-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[140px] leading-relaxed pr-16`}
            />
            <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-orange-500 hover:text-black text-white'}`}>
              <Mic size={24} />
            </button>
          </div>
        </div>

        {/* 📸 CARROSSEL DE FOTOS */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className={`text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2`}>
            <Camera size={16} /> Fotos do Serviço ({fotos.length}/10)
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
                <span className="font-black text-xs uppercase tracking-widest text-center">Tirar Foto</span>
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-orange-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valores do Serviço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end font-mono">
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Peças (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-orange-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
            </div>
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-orange-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
            </div>
            <div className="bg-orange-950/20 border border-orange-500/30 p-6 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
                <span className="text-[10px] text-orange-500 font-black mb-1 uppercase tracking-widest">Total Moto</span>
                <span className="text-3xl font-black text-orange-400">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all active:scale-[0.98]">
          {loading ? 'Sincronizando...' : <><Save size={28} /> FINALIZAR SERVIÇO MOTO</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Moto Atualizada!
        </div>
      )}
    </div>
  );
}
