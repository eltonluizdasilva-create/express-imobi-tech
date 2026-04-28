/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "./lib/retornos";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, Droplets, Droplet, Sparkles,
  Shield, SprayCan, Settings, Star, Snowflake, Eraser, ShieldCheck
} from "lucide-react";

const STYLES = {
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
  input: 'bg-zinc-950 border-zinc-800 focus:border-cyan-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// Botão de Serviço Toggle (Fiel ao print 43d45b)
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

export default function LavaJatoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);

  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0');
  const [maoDeObra, setMaoDeObra] = useState('0');

  // Serviços de Lava Jato e Estética
  const [servicos, setServicos] = useState({
    lavagemSimples: false,
    lavagemCompleta: false,
    polimento: false,
    cristalizacao: false,
    higienizacaoInterna: false,
    lavagemMotor: false,
    enceramento: false,
    higienizacaoAC: false,
    descontaminacao: false,
    peliculaPPF: false
  });

  const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (osParaEditar) {
      setObsGerais(osParaEditar.observacaoLavaJato || '');
      setFotos(osParaEditar.fotosLavaJato || []);
      setPecas(osParaEditar.valorPecas || osParaEditar.valorProdutosLavaJato || '0');
      setMaoDeObra(osParaEditar.valorMaoObra || osParaEditar.valorMaoObraLavaJato || '0');
      if (osParaEditar.servicosLavaJato) setServicos(osParaEditar.servicosLavaJato);
    }
  }, [osParaEditar]);

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos para o serviço!");

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
      const dadosLavaJato = {
        tipoServico: 'lavajato',
        servicosLavaJato: servicos,
        observacaoLavaJato: obsGerais,
        fotosLavaJato: fotos,
        valorPecas: pecas,
        valorMaoObra: maoDeObra,
        totalLavaJato: vTotal,
        total: vTotal,
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosLavaJato);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosLavaJato, osBase: osParaEditar });
      setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative`}>

      {/* 🛑 MODAL DE BLOQUEIO */}
      {showBlocker && (
        <div className={`fixed inset-0 ${tema === 'dark' ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
          <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
            <AlertTriangle size={60} className="text-blue-400 mx-auto mb-6" />
            <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
            <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
              O serviço de lavagem precisa de uma O.S.<br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-blue-500 hover:bg-blue-600 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header Azul/Mar */}
        <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-600 rounded-[1.5rem] shadow-xl shadow-blue-600/30">
              <Droplets className="text-white" size={36} />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Lava-Jato Premium</h1>
              <p className="text-blue-500 font-bold text-xs tracking-[0.3em] uppercase">Limpeza e Cuidados Especiais</p>
            </div>
          </div>
          <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80`}><X size={28} /></button>
        </div>

        {/* ⚙️ SERVIÇOS TIPO GRID */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-blue-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-blue-500 pl-4">
            ✓ Serviços Realizados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle
              icon={Droplets} title="Lavagem Simples" subtitle="Externa + Aspirado básico"
              active={servicos.lavagemSimples} onClick={() => toggleServico('lavagemSimples')}
            />
            <ServiceToggle
              icon={Sparkles} title="Lavagem Completa" subtitle="Cera, silicone e aspirado profundo"
              active={servicos.lavagemCompleta} onClick={() => toggleServico('lavagemCompleta')}
            />
            <ServiceToggle
              icon={Wind} title="Limpeza de Motor" subtitle="Lavagem detalhada a seco"
              active={servicos.lavagemMotor} onClick={() => toggleServico('lavagemMotor')}
            />
            <ServiceToggle
              icon={Disc} title="Lavagem de Chassi" subtitle="Limpeza inferior do veículo"
              active={servicos.lavagemChassi} onClick={() => toggleServico('lavagemChassi')}
            />
            <ServiceToggle
              icon={Shield} title="Enceramento" subtitle="Proteção e brilho extra"
              active={servicos.enceramento} onClick={() => toggleServico('enceramento')}
            />
            <ServiceToggle
              icon={Eraser} title="Higienização" subtitle="Bancos e carpetes (extra)"
              active={servicos.higienizacaoInterna} onClick={() => toggleServico('higienizacaoInterna')}
            />
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-blue-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valor do Serviço (R$)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Produtos (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-blue-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
            </div>
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-blue-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
            </div>
          </div>
          <div className="bg-blue-950/20 border border-blue-500/30 p-8 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
            <span className="text-5xl font-black text-blue-400 shadow-blue-500/50 text-shadow-lg">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* 📝 OBSERVAÇÕES E MICROFONE */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <div className="relative">
            <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
              <Mic size={14} className="text-blue-400" /> Observações Gerais (Microfone)
            </label>
            <textarea
              value={obsGerais} onChange={e => setObsGerais(e.target.value)}
              placeholder="Ex: veículo com muita lama, cuidado com estofamento em couro..."
              className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-blue-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[140px] leading-relaxed pr-16`}
            />
            <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-blue-500 hover:text-black text-white'}`}>
              <Mic size={24} />
            </button>
          </div>
        </div>

        {/* 📸 CARROSSEL DE FOTOS (MÁX 10) */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className={`text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2`}>
            <Camera size={16} /> Fotos do Veículo ({fotos.length}/10)
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[200px] h-[140px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl group">
                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full"><Trash2 size={14} /></button>
              </div>
            ))}
            {fotos.length < 10 && (
              <label className={`min-w-[200px] h-[140px] rounded-[1.5rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-blue-900/10 transition-all text-blue-500`}>
                <Camera size={32} className="mb-2" />
                <span className="font-black text-xs uppercase tracking-widest">Tirar Foto</span>
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* BOTÃO FINAL - Fiel à imagem 43d463 */}
        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-blue-500 hover:bg-blue-400 text-black font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-3">
          {loading ? 'Processando Serviço...' : <><Droplets size={28} /> ATUALIZAR O.S. LAVAGEM</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Serviço de Lavagem Salvo!
        </div>
      )}
    </div>
  );
}