/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, Activity, Settings2,
  Link2, Shield, Disc, Wrench
} from "lucide-react";

const STYLES = {
  accent: 'text-sky-400',
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

const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
  <button onClick={onClick} className={`p-4 rounded-2xl border ${active ? 'bg-sky-600/20 border-sky-500' : 'bg-zinc-950 border-zinc-800'} flex items-center gap-4 transition-all text-left`}>
    <div className={`p-3 rounded-xl ${active ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}><Icon size={20} /></div>
    <div className="flex-1">
      <p className={`font-black text-sm ${active ? 'text-white' : 'text-zinc-400'}`}>{title}</p>
      <p className="text-[10px] text-zinc-500">{subtitle}</p>
    </div>
  </button>
);

export default function AmortecedorModulo({
  oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS, t, tema
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0');
  const [maoDeObra, setMaoDeObra] = useState('0');
  const [testeRessalto, setTesteRessalto] = useState('');
  const [servicos, setServicos] = useState({
    amortecedoresDianteiros: false,
    amortecedoresTraseiros: false,
    bandejas: false,
    bieletas: false,
    terminaisDirecao: false,
    rolamentos: false
  });

  const [checklist, setChecklist] = useState({
    dianteiroEsquerdo: 'OK', dianteiroDireito: 'OK',
    traseiroEsquerdo: 'OK', traseiroDireito: 'OK',
    molasDianteiras: 'OK', molasTraseiras: 'OK',
    buchasBarraEstabilizadora: 'OK', pontasDeBarra: 'OK'
  });

  useEffect(() => {
    if (osParaEditar) {
      setObsGerais(osParaEditar.observacaoSuspensao || '');
      setFotos(osParaEditar.fotosSuspensao || []);
      setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
      setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
      setTesteRessalto(osParaEditar.testeRessalto || '');
      if (osParaEditar.servicosSuspensao) setServicos(osParaEditar.servicosSuspensao);
      if (osParaEditar.checklistSuspensao) setChecklist(osParaEditar.checklistSuspensao);
    }
  }, [osParaEditar]);

  const toggleServico = (campo) => setServicos(prev => ({ ...prev, [campo]: !prev[campo] }));

  const toggleMic = (target = 'geral') => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return alert("Microfone não suportado.");
    const rec = new Recognition();
    rec.lang = 'pt-BR';
    if (isListening) { rec.stop(); setIsListening(false); }
    else {
      setIsListening(true); rec.start();
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (target === 'ressalto') setTesteRessalto(prev => prev + " " + text);
        else setObsGerais(prev => prev + " " + text);
      };
      rec.onend = () => setIsListening(false);
    }
  };

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 10) return alert("Máximo de 10 fotos!");
    setFotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 10));
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
      const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
      const vTotal = vPecas + vMao;
      
      const dadosSuspensao = {
        tipoServico: 'amortecedor',
        servicosSuspensao: servicos,
        checklistSuspensao: checklist,
        observacaoSuspensao: obsGerais,
        testeRessalto: testeRessalto,
        fotosSuspensao: fotos,
        valorPecas: vPecas,
        valorMaoObra: vMao,
        total: vTotal,
        total_modulo: vTotal,
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosSuspensao);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosSuspensao, osBase: osParaEditar });
      setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className={`${t?.bg || 'bg-black'} min-h-screen ${t?.text || 'text-zinc-100'} p-4 md:p-8 pb-40 relative transition-all duration-300`}>
      {showBlocker && (
        <div className={`fixed inset-0 ${tema === 'light' ? 'bg-white/95' : 'bg-black/95'} backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center`}>
          <div className={`${t?.card || 'bg-zinc-900'} border ${t?.border || 'border-zinc-800'} p-10 rounded-[3rem] max-w-sm shadow-2xl`}>
            <AlertTriangle size={60} className="text-sky-400 mx-auto mb-6" />
            <h2 className={`text-2xl font-black ${t?.text || 'text-white'} mb-4 uppercase italic tracking-tighter`}>O.S. Requerida</h2>
            <p className={`${t?.textMuted || 'text-zinc-400'} text-sm mb-10 leading-relaxed font-medium`}>
              O serviço de Suspensão precisa de uma O.S.<br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>1. Inicie a O.S. (Triagem)</span><br />
              <span className={`${t?.text || 'text-white'} font-bold underline`}>2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { if (irParaNovaOS) irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-sky-600/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header Sky/Suspensão */}
        <div className={`flex justify-between items-center mb-12 border-b ${t?.border || 'border-zinc-800'} pb-8`}>
          <div className="flex items-center gap-6">
            <div className="p-5 bg-sky-600 rounded-[1.5rem] shadow-xl shadow-sky-600/30">
              <Activity className="text-white" size={36} />
            </div>
            <div>
              <h1 className={`text-4xl font-black ${t?.text || 'text-white'} uppercase italic tracking-tighter`}>Suspensão & Amortecedores</h1>
              <p className="text-sky-500 font-bold text-xs tracking-[0.3em] uppercase">Estabilidade, Conforto e Segurança</p>
            </div>
          </div>
          <button onClick={onCancelar} className={`p-3 ${t?.card || 'bg-zinc-900'} rounded-2xl border ${t?.border || 'border-zinc-800'} hover:opacity-80 transition-all`}><X size={28} /></button>
        </div>

        {/* ⚙️ SERVIÇOS TIPO GRID */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-sky-500 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-sky-500 pl-4">✓ Componentes Substituídos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle icon={Activity} title="Amortecedores Dianteiros" subtitle="Par de amortecedores + batentes" active={servicos.amortecedoresDianteiros} onClick={() => toggleServico('amortecedoresDianteiros')} />
            <ServiceToggle icon={Activity} title="Amortecedores Traseiros" subtitle="Par traseiro completo" active={servicos.amortecedoresTraseiros} onClick={() => toggleServico('amortecedoresTraseiros')} />
            <ServiceToggle icon={Settings2} title="Bandejas / Braços" subtitle="Buchas e pivôs" active={servicos.bandejas} onClick={() => toggleServico('bandejas')} />
            <ServiceToggle icon={Link2} title="Bieletas / Estabilizadora" subtitle="Eliminação de ruídos" active={servicos.bieletas} onClick={() => toggleServico('bieletas')} />
            <ServiceToggle icon={Shield} title="Terminais de Direção" subtitle="Precisão no volante" active={servicos.terminaisDirecao} onClick={() => toggleServico('terminaisDirecao')} />
            <ServiceToggle icon={Disc} title="Rolamentos de Roda" subtitle="Segurança em alta velocidade" active={servicos.rolamentos} onClick={() => toggleServico('rolamentos')} />
          </div>
        </div>

        {/* 🔍 CHECKLIST TÉCNICO */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
            <h2 className="text-sky-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">🔍 Inspeção de Componentes</h2>
            <div className={`bg-zinc-950/40 rounded-3xl border ${t?.border || 'border-zinc-800'} overflow-hidden`}>
                <StatusSelector label="Amortecedor D.E." value={checklist.dianteiroEsquerdo} onChange={v => setChecklist({ ...checklist, dianteiroEsquerdo: v })} />
                <StatusSelector label="Amortecedor D.D." value={checklist.dianteiroDireito} onChange={v => setChecklist({ ...checklist, dianteiroDireito: v })} />
                <StatusSelector label="Amortecedor T.E." value={checklist.traseiroEsquerdo} onChange={v => setChecklist({ ...checklist, traseiroEsquerdo: v })} />
                <StatusSelector label="Amortecedor T.D." value={checklist.traseiroDireito} onChange={v => setChecklist({ ...checklist, traseiroDireito: v })} />
                <StatusSelector label="Molas Dianteiras" value={checklist.molasDianteiras} onChange={v => setChecklist({ ...checklist, molasDianteiras: v })} />
                <StatusSelector label="Molas Traseiras" value={checklist.molasTraseiras} onChange={v => setChecklist({ ...checklist, molasTraseiras: v })} />
            </div>
        </div>

        {/* 📝 TESTE DE RESSALTO E OBS */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <div className="grid grid-cols-1 gap-8">
            <div className="relative">
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
                <Mic size={14} className="text-sky-400" /> Resultado Teste de Ressalto
              </label>
              <textarea
                value={testeRessalto} onChange={e => setTesteRessalto(e.target.value)}
                placeholder="Ex: Dianteiro direito com 3 oscilações, indicando fadiga..."
                className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-sky-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[100px] leading-relaxed pr-16`}
              />
              <button onClick={() => toggleMic('ressalto')} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-sky-500 text-white'}`}>
                <Mic size={24} />
              </button>
            </div>

            <div className="relative">
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} font-black uppercase mb-4 flex items-center gap-2 ml-2`}>
                <Mic size={14} className="text-sky-400" /> Observações Gerais
              </label>
              <textarea
                value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                placeholder="Diagnóstico completo da suspensão..."
                className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-sky-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm min-h-[100px] leading-relaxed pr-16`}
              />
              <button onClick={() => toggleMic('geral')} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-sky-500 text-white'}`}>
                <Mic size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* 📸 CARROSSEL DE FOTOS */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className={`text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2`}>
            <Camera size={16} /> Evidências do Serviço ({fotos.length}/10)
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[200px] h-[140px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl group">
                <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full"><Trash2 size={14} /></button>
              </div>
            ))}
            {fotos.length < 10 && (
              <label className={`min-w-[200px] h-[140px] rounded-[1.5rem] border-2 border-dashed ${t?.border || 'border-zinc-800'} flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 bg-sky-900/10 transition-all text-sky-500`}>
                <Camera size={32} className="mb-2" />
                <span className="font-black text-xs uppercase tracking-widest text-center">Tirar Foto</span>
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={`${t?.card || 'bg-zinc-900/40'} border ${t?.border || 'border-zinc-800'} rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl`}>
          <h2 className="text-sky-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valores do Serviço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end font-mono">
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Peças (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-sky-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
            </div>
            <div>
              <label className={`text-[10px] ${t?.textMuted || 'text-zinc-500'} block mb-2 font-bold uppercase tracking-widest px-2`}>Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={`bg-zinc-950 border ${t?.border || 'border-zinc-800'} focus:border-sky-500 ${t?.text || 'text-zinc-100'} p-4 rounded-xl outline-none w-full transition-all font-mono text-sm text-center text-xl`} />
            </div>
            <div className="bg-sky-950/20 border border-sky-500/30 p-6 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
                <span className="text-[10px] text-sky-400 font-black mb-1 uppercase tracking-widest">Total Suspensão</span>
                <span className="text-3xl font-black text-sky-400">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-sky-500 hover:bg-sky-600 text-white font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all active:scale-[0.98]">
          {loading ? 'Sincronizando...' : <><Save size={28} /> FINALIZAR SERVIÇO SUSPENSÃO</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Suspensão Atualizada!
        </div>
      )}
    </div>
  );
}
