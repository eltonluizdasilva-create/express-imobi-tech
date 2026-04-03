/* eslint-disable react/prop-types */
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

// Botão de Seleção de Gás (Pílulas)
const GasButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-3 px-6 rounded-full font-black text-xs uppercase tracking-widest transition-all border ${active
        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
        : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
      }`}
  >
    {label}
  </button>
);

// Botão de Serviço Toggle (Fiel ao print)
const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-2xl flex flex-col items-start justify-center transition-all border text-left ${active
        ? 'bg-cyan-600/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
        : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-800/60'
      }`}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon size={16} className={active ? 'text-cyan-400' : 'text-zinc-500'} />
      <span className={`font-black text-xs uppercase tracking-widest ${active ? 'text-cyan-400' : 'text-zinc-300'}`}>
        {title}
      </span>
    </div>
    <span className="text-[9px] font-bold text-zinc-500 ml-6">{subtitle}</span>
  </button>
);

export default function ArCondicionadoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);

  // Estados do Ar-Condicionado
  const [tipoGas, setTipoGas] = useState('R134a');
  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');

  const [servicos, setServicos] = useState({
    manutencaoGeral: false,
    higienizacao: false,
    recargaGas: false,
    trocaFiltro: false,
    trocaCorreia: false,
    trocaCompressor: false,
    trocaCondensador: false,
    testeVazamento: false
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
    if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos para Ar-Condicionado!");

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

      {/* 🛑 MODAL DE BLOQUEIO (VAI DIRETO PARA O.S.) */}
      {showBlocker && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
            <AlertTriangle size={60} className="text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
            <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
              O serviço de Ar-Condicionado precisa de uma O.S.<br />
              <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
              <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-cyan-500 hover:bg-cyan-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header Ice Blue */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-cyan-600 rounded-[1.5rem] shadow-xl shadow-cyan-600/30">
              <Snowflake className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Ar-Condicionado</h1>
              <p className="text-cyan-500 font-bold text-xs tracking-[0.3em] uppercase">Manutenção, higienização e recarga de gás</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
        </div>

        {/* ❄️ TIPO DE GÁS */}
        <div className={STYLES.card}>
          <h2 className="text-cyan-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
            <Wind size={16} /> Tipo de Gás
          </h2>
          <div className="flex flex-wrap gap-4">
            <GasButton label="R134a" active={tipoGas === 'R134a'} onClick={() => setTipoGas('R134a')} />
            <GasButton label="R1234yf" active={tipoGas === 'R1234yf'} onClick={() => setTipoGas('R1234yf')} />
            <GasButton label="R12 (antigo)" active={tipoGas === 'R12'} onClick={() => setTipoGas('R12')} />
          </div>
        </div>

        {/* ⚙️ SERVIÇOS TIPO GRID (Fiel à Imagem 428608) */}
        <div className={STYLES.card}>
          <h2 className="text-cyan-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-cyan-500 pl-4">
            ✓ Serviços Realizados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle
              icon={Wrench} title="Manutenção Geral" subtitle="Verificação completa do sistema"
              active={servicos.manutencaoGeral} onClick={() => toggleServico('manutencaoGeral')}
            />
            <ServiceToggle
              icon={Sparkles} title="Higienização" subtitle="Limpeza interna do sistema"
              active={servicos.higienizacao} onClick={() => toggleServico('higienizacao')}
            />
            <ServiceToggle
              icon={Snowflake} title="Recarga de Gás" subtitle="Recarga com gás R134a ou R1234yf"
              active={servicos.recargaGas} onClick={() => toggleServico('recargaGas')}
            />
            <ServiceToggle
              icon={Disc} title="Troca de Filtro" subtitle="Cabine e de ar do compressor"
              active={servicos.trocaFiltro} onClick={() => toggleServico('trocaFiltro')}
            />
            <ServiceToggle
              icon={Settings} title="Troca de Correia" subtitle="Correia do compressor"
              active={servicos.trocaCorreia} onClick={() => toggleServico('trocaCorreia')}
            />
            <ServiceToggle
              icon={Box} title="Troca de Compressor" subtitle="Compressor danificado"
              active={servicos.trocaCompressor} onClick={() => toggleServico('trocaCompressor')}
            />
            <ServiceToggle
              icon={ArrowRight} title="Troca de Condensador" subtitle="Condensador com vazamento"
              active={servicos.trocaCondensador} onClick={() => toggleServico('trocaCondensador')}
            />
            <ServiceToggle
              icon={Search} title="Teste de Vazamento" subtitle="Localizar vazamentos no sistema"
              active={servicos.testeVazamento} onClick={() => toggleServico('testeVazamento')}
            />
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={STYLES.card}>
          <h2 className="text-yellow-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valor Total (R$)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-2">Peças / Gás (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-2">Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
          </div>
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-8 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
            <span className="text-4xl font-black text-cyan-400 shadow-cyan-500/50 text-shadow-lg">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* 📝 OBSERVAÇÕES E MICROFONE */}
        <div className={STYLES.card}>
          <div className="relative">
            <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
              <Mic size={14} className="text-cyan-400" /> Observações Gerais
            </label>
            <textarea
              value={obsGerais} onChange={e => setObsGerais(e.target.value)}
              placeholder="Ex: compressor com barulho, filtro entupido, gás com vazamento..."
              className={STYLES.input + " min-h-[140px] leading-relaxed pr-16 resize-none"}
            />
            <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-cyan-500 hover:text-black text-white'}`}>
              <Mic size={24} />
            </button>
          </div>
        </div>

        {/* 📷 CARROSSEL DE FOTOS (MÁX 10) - Igual a imagem 428628 */}
        <div className={STYLES.card}>
          <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
            <Camera size={16} /> Fotos ({fotos.length}/10)
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[200px] h-[140px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl group">
                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full"><Trash2 size={14} /></button>
              </div>
            ))}
            {fotos.length < 10 && (
              <label className="min-w-[200px] h-[140px] rounded-[1.5rem] border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 bg-cyan-900/10 transition-all text-cyan-500">
                <Camera size={32} className="mb-2" />
                <span className="font-black text-xs uppercase tracking-widest">Tirar Foto</span>
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-3">
          {loading ? 'Processando Serviço...' : <><Snowflake size={28} /> SALVAR SERVIÇO NA O.S.</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Serviço de Ar Salvo!
        </div>
      )}
    </div>
  );
}