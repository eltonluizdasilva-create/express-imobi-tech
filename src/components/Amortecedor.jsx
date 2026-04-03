/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; // Caminho ajustado para pasta components
import { doc, updateDoc } from "firebase/firestore";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, MoveVertical, Settings,
  Car, Wrench
} from "lucide-react";

const STYLES = {
  accent: 'text-sky-400', // Azul Céu
  button: 'bg-sky-500 hover:bg-sky-600 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-8',
  input: 'bg-zinc-950 border-zinc-800 focus:border-sky-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
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

export default function Amortecedor({
  oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);

  const [testeRessalto, setTesteRessalto] = useState('');
  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');

  // Checklist Fiel aos Prints (image_36c768.png e image_36c789.png)
  const [checklist, setChecklist] = useState({
    // DIAGNÓSTICO POR POSIÇÃO
    dianteiroEsquerdo: 'OK',
    dianteiroDireito: 'OK',
    traseiroEsquerdo: 'OK',
    traseiroDireito: 'OK',
    // COMPONENTES ADICIONAIS
    molasDianteiras: 'OK',
    molasTraseiras: 'OK',
    buchasBarraEstabilizadora: 'OK',
    pontasDeBarra: 'OK'
  });

  useEffect(() => {
    if (osParaEditar) {
      setTesteRessalto(osParaEditar.testeRessalto || '');
      setObsGerais(osParaEditar.observacaoAmortecedor || '');
      setFotos(osParaEditar.fotosAmortecedor || []);
      setPecas(osParaEditar.valorPecas || '0,00');
      setMaoDeObra(osParaEditar.valorMaoObra || '0,00');
      if (osParaEditar.checklistAmortecedor) setChecklist(osParaEditar.checklistAmortecedor);
    }
  }, [osParaEditar]);

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos para Suspensão!");

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

  // Duplo Microfone Independente
  const [isListening, setIsListening] = useState(null);
  const toggleMic = (campo) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return alert("Microfone não suportado neste navegador.");
    const rec = new Recognition();
    rec.lang = 'pt-BR';

    if (isListening === campo) {
      rec.stop();
      setIsListening(null);
    } else {
      setIsListening(campo);
      rec.start();
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (campo === 'ressalto') setTesteRessalto(prev => prev + " " + text);
        if (campo === 'geral') setObsGerais(prev => prev + " " + text);
      };
      rec.onend = () => setIsListening(null);
    }
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
        tipoServico: 'amortecedor',
        checklistAmortecedor: checklist,
        testeRessalto: testeRessalto,
        observacaoAmortecedor: obsGerais,
        fotosAmortecedor: fotos,
        valorPecas: pecas,
        valorMaoObra: maoDeObra,
        totalAmortecedor: vTotal,
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
            <AlertTriangle size={60} className="text-sky-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
            <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
              O laudo de Suspensão precisa de uma O.S.<br />
              <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
              <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header Azul Céu */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-sky-500 rounded-[1.5rem] shadow-xl shadow-sky-500/30">
              <MoveVertical className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Módulo Amortecedor</h1>
              <p className="text-sky-400 font-bold text-xs tracking-[0.3em] uppercase">Especialista em Suspensão e Geometria</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800"><X size={28} /></button>
        </div>

        {/* 📷 CARROSSEL DE FOTOS (MÁX 10) */}
        <div className={STYLES.card}>
          <h2 className="text-sky-400 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-3">
            <Camera size={18} /> Fotos do Veículo / Serviço ({fotos.length}/10)
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[240px] h-[160px] rounded-[2rem] overflow-hidden border border-zinc-700 shadow-2xl group">
                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
              </div>
            ))}
            {fotos.length < 10 && (
              <label className="min-w-[240px] h-[160px] rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 bg-zinc-900/50 transition-all hover:bg-zinc-800">
                <Plus size={40} className="text-zinc-700" />
                <span className="text-[10px] text-zinc-500 font-black mt-2 uppercase tracking-widest">Foto</span>
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 🛠️ DIAGNÓSTICO TÉCNICO - AMORTECEDORES */}
        <div className={STYLES.card}>
          <h2 className="text-sky-400 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-sky-500 pl-4">🔍 Diagnóstico Técnico - Amortecedores</h2>

          <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Car size={14} className="text-sky-500" /> Diagnóstico por Posição</h3>
          <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-10 shadow-inner">
            <StatusSelector label="Dianteiro Esquerdo" value={checklist.dianteiroEsquerdo} onChange={v => setChecklist({ ...checklist, dianteiroEsquerdo: v })} />
            <StatusSelector label="Dianteiro Direito" value={checklist.dianteiroDireito} onChange={v => setChecklist({ ...checklist, dianteiroDireito: v })} />
            <StatusSelector label="Traseiro Esquerdo" value={checklist.traseiroEsquerdo} onChange={v => setChecklist({ ...checklist, traseiroEsquerdo: v })} />
            <StatusSelector label="Traseiro Direito" value={checklist.traseiroDireito} onChange={v => setChecklist({ ...checklist, traseiroDireito: v })} />
          </div>

          <h3 className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Wrench size={14} className="text-sky-500" /> Componentes Adicionais</h3>
          <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-12 shadow-inner">
            <StatusSelector label="Molas dianteiras" value={checklist.molasDianteiras} onChange={v => setChecklist({ ...checklist, molasDianteiras: v })} />
            <StatusSelector label="Molas traseiras" value={checklist.molasTraseiras} onChange={v => setChecklist({ ...checklist, molasTraseiras: v })} />
            <StatusSelector label="Buchas barra estabilizadora" value={checklist.buchasBarraEstabilizadora} onChange={v => setChecklist({ ...checklist, buchasBarraEstabilizadora: v })} />
            <StatusSelector label="Pontas de barra" value={checklist.pontasDeBarra} onChange={v => setChecklist({ ...checklist, pontasDeBarra: v })} />
          </div>

          {/* DUPLO MICROFONE */}
          <div className="grid grid-cols-1 gap-6 pt-4">
            <div className="relative">
              <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
                <Mic size={14} className="text-sky-400" /> Resultado do teste ressalto
              </label>
              <textarea
                value={testeRessalto} onChange={e => setTesteRessalto(e.target.value)}
                placeholder="Ex: Dianteiro direito com 3 oscilações..."
                className={STYLES.input + " min-h-[100px] leading-relaxed pr-16"}
              />
              <button onClick={() => toggleMic('ressalto')} className={`absolute right-4 bottom-4 p-3 rounded-full transition-all shadow-lg active:scale-90 ${isListening === 'ressalto' ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-sky-500'}`}>
                <Mic size={20} className="text-white" />
              </button>
            </div>

            <div className="relative">
              <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
                <Mic size={14} className="text-sky-400" /> Observações gerais
              </label>
              <textarea
                value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                placeholder="Diagnóstico completo, peças necessárias..."
                className={STYLES.input + " min-h-[100px] leading-relaxed pr-16"}
              />
              <button onClick={() => toggleMic('geral')} className={`absolute right-4 bottom-4 p-3 rounded-full transition-all shadow-lg active:scale-90 ${isListening === 'geral' ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-sky-500'}`}>
                <Mic size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={STYLES.card}>
          <h2 className="text-sky-400 font-black mb-8 uppercase text-xs tracking-widest border-l-4 border-sky-500 pl-4">💰 Valores do Serviço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end font-mono">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2 text-shadow-sm">Peças (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase tracking-widest px-2 text-shadow-sm">Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
            <div className="bg-sky-950/30 border border-sky-500/30 p-6 rounded-[1.5rem] flex flex-col items-center shadow-lg">
              <span className="text-[10px] text-sky-400 font-black mb-1 uppercase tracking-widest">Total</span>
              <span className="text-3xl font-black text-sky-400 shadow-sky-500/50">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all">
          {loading ? 'Processando...' : <><Save size={32} /> Salvar O.S.</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl">
          <CheckCircle size={32} /> Salvo com Sucesso!
        </div>
      )}
    </div>
  );
}