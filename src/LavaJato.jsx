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

export default function LavaJatoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
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
      setPecas(osParaEditar.valorProdutosLavaJato || '0'); // Peças = Produtos no Lava Jato
      setMaoDeObra(osParaEditar.valorMaoObraLavaJato || '0');
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
        valorProdutosLavaJato: pecas,
        valorMaoObraLavaJato: maoDeObra,
        totalLavaJato: vTotal,
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosLavaJato);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosLavaJato, osBase: osParaEditar });
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
              O serviço de estética automotiva precisa de uma O.S.<br />
              <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
              <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-cyan-500 hover:bg-cyan-600 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header Azul/Cyan */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-cyan-600 rounded-[1.5rem] shadow-xl shadow-cyan-600/30">
              <Droplets className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Lava Jato & Estética</h1>
              <p className="text-cyan-500 font-bold text-xs tracking-[0.3em] uppercase">Limpeza, Polimento e Proteção</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
        </div>

        {/* 🧽 SERVIÇOS TIPO GRID (Fiel à Imagem 43d45b) */}
        <div className={STYLES.card}>
          <h2 className="text-cyan-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-cyan-500 pl-4">
            ✓ Serviços Realizados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle
              icon={Droplets} title="Lavagem Simples" subtitle="Externa + rodas + enxágue"
              active={servicos.lavagemSimples} onClick={() => toggleServico('lavagemSimples')}
            />
            <ServiceToggle
              icon={Droplet} title="Lavagem Completa" subtitle="Externa + interna + aspiração"
              active={servicos.lavagemCompleta} onClick={() => toggleServico('lavagemCompleta')}
            />
            <ServiceToggle
              icon={Sparkles} title="Polimento" subtitle="Remove riscos e oxidação"
              active={servicos.polimento} onClick={() => toggleServico('polimento')}
            />
            <ServiceToggle
              icon={Shield} title="Cristalização" subtitle="Proteção e brilho duradouro"
              active={servicos.cristalizacao} onClick={() => toggleServico('cristalizacao')}
            />
            <ServiceToggle
              icon={SprayCan} title="Higienização Interna" subtitle="Bancos, tapetes, teto e painel"
              active={servicos.higienizacaoInterna} onClick={() => toggleServico('higienizacaoInterna')}
            />
            <ServiceToggle
              icon={Settings} title="Lavagem de Motor" subtitle="Desengordurante + jato de pressão"
              active={servicos.lavagemMotor} onClick={() => toggleServico('lavagemMotor')}
            />
            <ServiceToggle
              icon={Star} title="Enceramento / Cera" subtitle="Proteção da pintura"
              active={servicos.enceramento} onClick={() => toggleServico('enceramento')}
            />
            <ServiceToggle
              icon={Snowflake} title="Higienização do AC" subtitle="Limpeza do sistema de ar"
              active={servicos.higienizacaoAC} onClick={() => toggleServico('higienizacaoAC')}
            />
            <ServiceToggle
              icon={Eraser} title="Descontaminação" subtitle="Remove ferrugem e contaminantes"
              active={servicos.descontaminacao} onClick={() => toggleServico('descontaminacao')}
            />
            <ServiceToggle
              icon={ShieldCheck} title="Película PPF" subtitle="Proteção de pintura em película"
              active={servicos.peliculaPPF} onClick={() => toggleServico('peliculaPPF')}
            />
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={STYLES.card}>
          <h2 className="text-yellow-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valor Total (R$)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-2">Produtos / Insumos (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-2">Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
          </div>
          <div className="bg-cyan-900/10 border border-cyan-500/30 p-8 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
            <span className="text-5xl font-black text-cyan-400 shadow-cyan-500/50 text-shadow-lg">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
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
              placeholder="Ex: carro muito sujo, riscos na lateral, cliente deixou chave..."
              className={STYLES.input + " min-h-[140px] leading-relaxed pr-16 resize-none"}
            />
            <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-cyan-500 hover:text-black text-white'}`}>
              <Mic size={24} />
            </button>
          </div>
        </div>

        {/* 📸 CARROSSEL DE FOTOS (MÁX 10) */}
        <div className={STYLES.card}>
          <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
            <Camera size={16} /> Fotos do Antes/Depois ({fotos.length}/10)
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

        {/* BOTÃO FINAL - Fiel à imagem 43d463 */}
        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-3">
          {loading ? 'Processando Serviço...' : <><Droplets size={28} /> ADICIONAR À FILA E GERAR O.S.</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Serviço de Estética Salvo!
        </div>
      )}
    </div>
  );
}