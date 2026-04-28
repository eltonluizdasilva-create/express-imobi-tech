/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { sincronizarRetornosAutomaticos } from '../lib/retornos';
import { Mic, Palette, Save, X, CheckCircle, AlertTriangle, ArrowRight, Paintbrush, Hammer, Activity, Shield, Zap, Camera, Trash2 } from 'lucide-react';

const STYLES = {
  accent: 'text-red-500',
  buttonRed: 'bg-red-600 hover:bg-red-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
  buttonGray: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold py-5 px-8 rounded-2xl border border-zinc-700 transition-all flex items-center justify-center gap-3',
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-6',
  input: 'bg-zinc-900/50 border-zinc-800 focus:border-red-500 text-zinc-100 p-4 rounded-xl outline-none w-full'
};

const StatusSelector = ({ label, value, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/10 transition-all">
    <span className="text-zinc-300 font-medium">{label}</span>
    <div className="flex gap-2 mt-2 md:mt-0">
      {['OK', 'Atenção', 'Trocar'].map((status) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${value === status
            ? (status === 'OK' ? 'bg-green-600/20 border-green-500 text-green-500' :
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

const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${active ? 'bg-amber-600/20 border-amber-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}
  >
    <div className={`p-3 rounded-xl ${active ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
      <Icon size={20} />
    </div>
    <div>
      <div className={`font-black uppercase text-xs ${active ? 'text-amber-500' : 'text-zinc-300'}`}>{title}</div>
      <div className="text-[10px] text-zinc-500">{subtitle}</div>
    </div>
  </button>
);

export default function FunilariaModulo({
  oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);

  const [pecas, setPecas] = useState('0');
  const [maoDeObra, setMaoDeObra] = useState('0');
  const [obsGerais, setObsGerais] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [servicos, setServicos] = useState({
    funilariaLeve: false, funilariaPesada: false, pinturaPeca: false,
    pinturaGeral: false, micropintura: false, martelinhoOuro: false
  });

  useEffect(() => {
    if (osParaEditar) {
      setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
      setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
      setObsGerais(osParaEditar.observacaoFunilaria || '');
      if (osParaEditar.servicos) setServicos(osParaEditar.servicos);
      setFotos(osParaEditar.fotosFunilaria || []);
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

  const handleUploadFoto = (e) => {
    const files = Array.from(e.target.files);
    setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 10));
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
      const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
      const vTotal = vPecas + vMao;
      
      const dadosFunilaria = {
        tipoServico: 'funilaria',
        valorPecas: vPecas,
        valorMaoObra: vMao,
        total: vTotal,
        total_modulo: vTotal,
        observacaoFunilaria: obsGerais,
        servicos,
        fotosFunilaria: fotos,
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosFunilaria);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosFunilaria, osBase: osParaEditar });
      setSuccess(true);
      if (onSalvo) onSalvo();
      setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>

      {showBlocker && (
        <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
          <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
            <AlertTriangle size={60} className="text-amber-400 mx-auto mb-6" />
            <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
            <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
              O serviço de Funilaria e Pintura precisa de uma O.S.<br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
          <div className="flex items-center gap-6">
            <div className="p-5 bg-amber-600 rounded-[1.5rem] shadow-xl shadow-amber-600/30">
              <Paintbrush className="text-white" size={36} />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Funilaria & Pintura</h1>
              <p className="text-amber-500 font-bold text-xs tracking-[0.3em] uppercase">Restauração e Acabamento Automotivo</p>
            </div>
          </div>
          <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
        </div>

        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-amber-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-amber-500 pl-4">✓ Serviços Realizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle icon={Hammer} title="Funilaria Leve" subtitle="Pequenos amassados" active={servicos.funilariaLeve} onClick={() => toggleServico('funilariaLeve')} />
            <ServiceToggle icon={Activity} title="Funilaria Pesada" subtitle="Alinhamento de chassi" active={servicos.funilariaPesada} onClick={() => toggleServico('funilariaPesada')} />
            <ServiceToggle icon={Palette} title="Pintura por Peça" subtitle="Pintura localizada" active={servicos.pinturaPeca} onClick={() => toggleServico('pinturaPeca')} />
            <ServiceToggle icon={Paintbrush} title="Pintura Geral" subtitle="Renovação completa" active={servicos.pinturaGeral} onClick={() => toggleServico('pinturaGeral')} />
            <ServiceToggle icon={Shield} title="Micropintura" subtitle="Correção de lascados" active={servicos.micropintura} onClick={() => toggleServico('micropintura')} />
            <ServiceToggle icon={Zap} title="Martelinho de Ouro" subtitle="Remoção de mossas" active={servicos.martelinhoOuro} onClick={() => toggleServico('martelinhoOuro')} />
          </div>
        </div>

        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-amber-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Orçamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Peças / Tintas (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-amber-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
            </div>
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-amber-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all text-center text-xl`} />
            </div>
          </div>
          <div className="bg-amber-950/20 border border-amber-500/30 p-8 rounded-[1.5rem] flex flex-col items-center shadow-lg">
            <span className="text-5xl font-black text-amber-400">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <div className="relative">
            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
              <Mic size={14} className="text-amber-400" /> Observações de Reparo
            </label>
            <textarea value={obsGerais} onChange={e => setObsGerais(e.target.value)} placeholder="Descreva os detalhes técnicos do reparo..." className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-amber-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all min-h-[140px] pr-16`} />
            <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-amber-500 text-white'}`}><Mic size={24} /></button>
          </div>
        </div>

        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className={`text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2`}><Camera size={16} /> Fotos ({fotos.length}/10)</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[200px] h-[140px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl group">
                <img src={f} className="w-full h-full object-cover" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full"><Trash2 size={14} /></button>
              </div>
            ))}
            {fotos.length < 10 && (
              <label className={`min-w-[200px] h-[140px] rounded-[1.5rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 bg-amber-900/10 transition-all`}>
                <Camera size={32} className="text-amber-500" />
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-black font-black text-2xl uppercase italic rounded-2xl shadow-xl transition-all">
          {loading ? 'Salvando...' : <><Paintbrush size={28} /> ATUALIZAR O.S. FUNILARIA</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Funilaria Atualizada!
        </div>
      )}
    </div>
  );
}