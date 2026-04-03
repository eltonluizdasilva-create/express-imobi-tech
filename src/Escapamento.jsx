
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, Wind, Wrench, Settings,
  Activity, Flame, Settings2, Disc
} from "lucide-react";

const STYLES = {
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
  input: 'bg-zinc-950 border-zinc-800 focus:border-gray-400 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// Botão de Serviço Toggle (Fiel ao print)
const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-2xl flex flex-col items-start justify-center transition-all border text-left ${active
      ? 'bg-gray-600/20 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.2)]'
      : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-800/60'
      }`}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon size={16} className={active ? 'text-gray-300' : 'text-zinc-500'} />
      <span className={`font-black text-xs uppercase tracking-widest ${active ? 'text-gray-300' : 'text-zinc-400'}`}>
        {title}
      </span>
    </div>
    <span className="text-[9px] font-bold text-zinc-500 ml-6">{subtitle}</span>
  </button>
);

export default function EscapamentoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotos, setFotos] = useState([]);

  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');

  // Serviços de Escapamento (Fiel à imagem 43632a)
  const [servicos, setServicos] = useState({
    reparoGeral: false,
    trocaSilencioso: false,
    trocaCatalisador: false,
    trocaFlex: false,
    trocaColetor: false,
    reparoVazamento: false,
    trocaJunta: false,
    escEsportivo: false
  });

  const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (osParaEditar) {
      setObsGerais(osParaEditar.observacaoEscapamento || '');
      setFotos(osParaEditar.fotosEscapamento || []);
      setPecas(osParaEditar.valorPecas || '0,00');
      setMaoDeObra(osParaEditar.valorMaoObra || '0,00');
      if (osParaEditar.servicosEscapamento) setServicos(osParaEditar.servicosEscapamento);
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
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
        tipoServico: 'escapamento',
        servicosEscapamento: servicos,
        observacaoEscapamento: obsGerais,
        fotosEscapamento: fotos,
        valorPecas: pecas,
        valorMaoObra: maoDeObra,
        totalEscapamento: vTotal,
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
            <AlertTriangle size={60} className="text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
            <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
              O serviço de Escapamento precisa de uma O.S.<br />
              <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
              <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-gray-600 hover:bg-gray-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gray-500/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">

        {/* Header Cinza / Titanium */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-gray-700 rounded-[1.5rem] shadow-xl shadow-gray-600/30">
              <Wind className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Escapamento</h1>
              <p className="text-gray-400 font-bold text-xs tracking-[0.3em] uppercase">Reparo, troca de silencioso, catalisador e flex</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
        </div>

        {/* ⚙️ SERVIÇOS TIPO GRID (Fiel à Imagem 43632a) */}
        <div className={STYLES.card}>
          <h2 className="text-gray-400 font-black mb-6 uppercase text-xs tracking-widest border-l-4 border-gray-500 pl-4">
            ✓ Serviços Realizados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceToggle
              icon={Wrench} title="Reparo Geral" subtitle="Solda, remendo e reparos"
              active={servicos.reparoGeral} onClick={() => toggleServico('reparoGeral')}
            />
            <ServiceToggle
              icon={Settings2} title="Troca de Silencioso" subtitle="Silencioso traseiro ou intermediário"
              active={servicos.trocaSilencioso} onClick={() => toggleServico('trocaSilencioso')}
            />
            <ServiceToggle
              icon={Activity} title="Troca de Catalisador" subtitle="Catalisador danificado ou entupido"
              active={servicos.trocaCatalisador} onClick={() => toggleServico('trocaCatalisador')}
            />
            <ServiceToggle
              icon={Settings} title="Troca de Flex" subtitle="Flexível de escapamento"
              active={servicos.trocaFlex} onClick={() => toggleServico('trocaFlex')}
            />
            <ServiceToggle
              icon={Wind} title="Troca de Coletor" subtitle="Coletor de escape"
              active={servicos.trocaColetor} onClick={() => toggleServico('trocaColetor')}
            />
            <ServiceToggle
              icon={Flame} title="Reparo de Vazamento" subtitle="Solda e vedação de vazamentos"
              active={servicos.reparoVazamento} onClick={() => toggleServico('reparoVazamento')}
            />
            <ServiceToggle
              icon={Disc} title="Troca de Junta" subtitle="Junta do coletor ou intermediária"
              active={servicos.trocaJunta} onClick={() => toggleServico('trocaJunta')}
            />
            <ServiceToggle
              icon={Activity} title="Esc. Esportivo" subtitle="Instalação de sistema esportivo"
              active={servicos.escEsportivo} onClick={() => toggleServico('escEsportivo')}
            />
          </div>
        </div>

        {/* 💰 VALORES DO SERVIÇO */}
        <div className={STYLES.card}>
          <h2 className="text-yellow-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">💰 Valor Total (R$)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-2">Peças (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase tracking-widest px-2">Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className={STYLES.input + " text-center text-xl"} />
            </div>
          </div>
          <div className="bg-gray-900/40 border border-gray-600/30 p-8 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg">
            <span className="text-4xl font-black text-gray-300 shadow-gray-500/50 text-shadow-lg">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* 📝 OBSERVAÇÕES E MICROFONE */}
        <div className={STYLES.card}>
          <div className="relative">
            <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2">
              <Mic size={14} className="text-gray-400" /> Observações Gerais
            </label>
            <textarea
              value={obsGerais} onChange={e => setObsGerais(e.target.value)}
              placeholder="Ex: catalisador entupido, silencioso furado..."
              className={STYLES.input + " min-h-[140px] leading-relaxed pr-16 resize-none"}
            />
            <button onClick={toggleMic} className={`absolute right-5 bottom-5 p-4 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-gray-500 hover:text-white text-gray-400'}`}>
              <Mic size={24} />
            </button>
          </div>
        </div>

        {/* 📷 CARROSSEL DE FOTOS (MÁX 10) */}
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
              <label className="min-w-[200px] h-[140px] rounded-[1.5rem] border-2 border-dashed border-gray-600/50 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 bg-gray-900/20 transition-all text-gray-500">
                <Camera size={32} className="mb-2" />
                <span className="font-black text-xs uppercase tracking-widest">Tirar Foto</span>
                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-6 bg-gray-600 hover:bg-gray-500 text-white font-black text-2xl uppercase italic rounded-2xl shadow-[0_0_25px_rgba(156,163,175,0.3)] transition-all flex items-center justify-center gap-3">
          {loading ? 'Processando Serviço...' : <><Save size={28} /> SALVAR NA O.S.</>}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl text-white">
          <CheckCircle size={32} /> Serviço de Escapamento Salvo!

          /* eslint-disable no-unused-vars */
          import React, {useState, useEffect, useMemo} from 'react';
          import {db} from './lib/firebase';
          import {collection, addDoc, getDocs, updateDoc, doc} from 'firebase/firestore';
          import {useOficina} from './components/OficinaContext';

          const COR = '#f97316';
          const GREEN = '#00E676';

const normalizarPlaca = (v) => (v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const formatarMoeda = (v) => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const comprimirFoto = (b,q=0.5) => new Promise(res=>{
  const img=new Image(); img.onload=()=>{
    const c=document.createElement('canvas'),MAX=800,sc=img.width>MAX?MAX/img.width:1;
          c.width=img.width*sc;c.height=img.height*sc;
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          res(c.toDataURL('image/jpeg',q));
  };img.src=b;
});

          const SERVICOS_ESC = [
          {key:'reparo_geral',       label:'🪛 Reparo Geral',             desc:'Solda, remendo e reparos'},
          {key:'troca_silencioso',   label:'🔇 Troca de Silencioso',      desc:'Silencioso traseiro ou intermediário'},
          {key:'troca_catalisador',  label:'⚗️ Troca de Catalisador',     desc:'Catalisador danificado ou entupido'},
          {key:'troca_flex',         label:'🌀 Troca de Flex',            desc:'Flexível de escapamento'},
          {key:'troca_coletor',      label:'🔩 Troca de Coletor',         desc:'Coletor de escape'},
          {key:'reparo_vazamento',   label:'💨 Reparo de Vazamento',      desc:'Solda e vedação de vazamentos'},
          {key:'troca_junta',        label:'🔧 Troca de Junta',           desc:'Junta do coletor ou intermediária'},
          {key:'escapamento_esportivo', label:'🏎️ Esc. Esportivo',       desc:'Instalação de sistema esportivo'},
          ];

          const FORM_VAZIO = {
            placa:'',nomeCliente:'',telefone:'',modelo:'',
          servicos:[],valorTotal:'',obs:'',fotos:[],status:'aberta',
};

          export default function Escapamento({osParaEditar, onCancelarEdicao, onSalvo, buscarPorPlaca, carregarOS}) {
  const {oficinaId} = useOficina() || { };
          const [lista, setLista] = useState([]);
          const [form, setForm] = useState(FORM_VAZIO);
          const [salvando, setSalvando] = useState(false);
          const [salvo, setSalvo] = useState(false);
          const [editandoId, setEditandoId] = useState(null);
          const [subAba, setSubAba] = useState('novo');
          const [legendaFoto, setLegendaFoto] = useState('');
          const [autoFill, setAutoFill] = useState(false);

  useEffect(()=>{carregarLista();},[oficinaId]);

  useEffect(()=>{
    if(!osParaEditar||osParaEditar.tipoServico!=='escapamento') return;
          setForm({...FORM_VAZIO,...osParaEditar});
          setEditandoId(osParaEditar.id);
          setSubAba('novo');
  },[osParaEditar]);

  const carregarLista = async () => {
    if(!oficinaId) return;
          try {
      const snap = await getDocs(collection(db,'oficinas',oficinaId,'os'));
      setLista(snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(o=>o.tipoServico==='escapamento')
        .sort((a,b)=>new Date(b.data_registro||0)-new Date(a.data_registro||0)));
    } catch(e){console.error(e);}
  };

  const buscaPlaca = (p) => {
    if(buscarPorPlaca) buscarPorPlaca(p,{
            setNome:v=>setForm(prev=>({...prev, nomeCliente:prev.nomeCliente||v})),
      setTelefone:v=>setForm(prev=>({...prev, telefone:prev.telefone||v})),
      setModelo:v=>setForm(prev=>({...prev, modelo:prev.modelo||v})),
      onFound:()=>{setAutoFill(true);setTimeout(()=>setAutoFill(false),3000);},
    });
  };

  const salvar = async () => {
    if(!form.placa&&!form.nomeCliente) return alert('⚠️ Informe Placa ou Nome!');
          if(form.servicos.length===0) return alert('⚠️ Selecione ao menos 1 serviço!');
          setSalvando(true);
          try {
      const servicosTexto=form.servicos.map(k=>SERVICOS_ESC.find(s=>s.key===k)?.label||k).join(', ');
          const dados={
            ...form, placa:normalizarPlaca(form.placa),
          servicosTexto, tipoServico:'escapamento',
          checklist:servicosTexto, valorPecas:0,
          valorMaoObra:Number(form.valorTotal)||0,
          total:Number(form.valorTotal)||0,
          detalhesPecas:form.obs,
          data_registro:editandoId?form.data_registro:new Date().toISOString(),
      };
          if(editandoId){
            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', editandoId), dados);
          if(onSalvo) onSalvo(editandoId,dados);
      } else {
        const ref=await addDoc(collection(db,'oficinas',oficinaId,'os'),dados);
          if(onSalvo) onSalvo(ref.id,dados);
      }
      setSalvo(true); setTimeout(()=>setSalvo(false),3000);
          setForm(FORM_VAZIO); setEditandoId(null);
          if(carregarOS) carregarOS();
          carregarLista(); setSubAba('historico');
    } catch(e){alert('Erro: ' + e.message);}
          finally{setSalvando(false);}
  };

  const adicionarFoto = async (e) => {
    const f=e.target.files[0]; if(!f) return;
          const r=new FileReader();
    r.onloadend=async()=>{
      const c=await comprimirFoto(r.result);
      setForm(p=>({...p, fotos:[...(p.fotos||[]),{foto:c,legenda:legendaFoto,dataEnvio:new Date().toLocaleString('pt-BR')}]}));
          setLegendaFoto('');
    };
          r.readAsDataURL(f);
  };

  const totalMes = useMemo(()=>{
    const mes=new Date().getMonth(),ano=new Date().getFullYear();
    return lista.filter(o=>{const d=new Date(o.data_registro||0);return d.getMonth()===mes&&d.getFullYear()===ano;})
      .reduce((acc,o)=>acc+Number(o.valorTotal||0),0);
  },[lista]);

          return (
          <div style={{ color: 'white', fontFamily: 'sans-serif' }}>

            {autoFill && (
              <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: GREEN, color: 'black', padding: '12px 24px', borderRadius: '30px', fontWeight: '900', fontSize: '13px', zIndex: 9999, boxShadow: `0 4px 20px ${GREEN}66`, whiteSpace: 'nowrap' }}>
                ✅ Cliente encontrado! Dados preenchidos.
              </div>
            )}

            {/* Header */}
            <div style={{ background: `linear-gradient(135deg,${COR}22,transparent)`, border: `1px solid ${COR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, color: COR, fontSize: '22px', fontWeight: '900' }}>🪛 Escapamento</h2>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>Reparo, troca de silencioso, catalisador e flex</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { label: '📋 No mês', val: lista.filter(o => { const d = new Date(o.data_registro || 0); return d.getMonth() === new Date().getMonth(); }).length, cor: COR },
                  { label: '💰 Receita mês', val: formatarMoeda(totalMes), cor: GREEN },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#111', border: `1px solid ${s.cor}33`, borderRadius: '10px', padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
                    <p style={{ margin: 0, color: s.cor, fontWeight: '900', fontSize: '18px' }}>{s.val}</p>
                    <p style={{ margin: '2px 0 0', color: '#666', fontSize: '10px' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-abas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { key: 'novo', label: editandoId ? '✏️ Editando' : '➕ Novo Serviço' },
                { key: 'historico', label: `📋 Histórico (${lista.length})` },
              ].map(s => (
                <button key={s.key} onClick={() => { setSubAba(s.key); if (s.key !== 'novo') { setForm(FORM_VAZIO); setEditandoId(null); if (onCancelarEdicao) onCancelarEdicao(); } }}
                  style={{ padding: '10px 20px', background: subAba === s.key ? COR : '#1a1a1a', color: subAba === s.key ? 'black' : '#888', border: `1px solid ${subAba === s.key ? COR : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>

            {subAba === 'novo' && (
              <div>
                {editandoId && (
                  <div style={{ background: '#1a0800', border: `2px solid ${COR}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: COR, fontWeight: 'bold', fontSize: '13px' }}>✏️ EDITANDO — {form.placa || form.nomeCliente}</span>
                    <button onClick={() => { setForm(FORM_VAZIO); setEditandoId(null); if (onCancelarEdicao) onCancelarEdicao(); }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar</button>
                  </div>
                )}

                <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
                  <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '12px', letterSpacing: '1px' }}>👤 DADOS DO CLIENTE</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'placa', ph: 'PLACA', fn: v => { const p = normalizarPlaca(v); buscaPlaca(p); return p; } },
                      { key: 'nomeCliente', ph: 'NOME' },
                      { key: 'telefone', ph: 'WHATSAPP', type: 'tel' },
                      { key: 'modelo', ph: 'MODELO' },
                    ].map(({ key, ph, fn, type }) => (
                      <input key={key} type={type || 'text'} value={form[key]} placeholder={ph}
                        onChange={e => setForm(p => ({ ...p, [key]: fn ? fn(e.target.value) : e.target.value }))}
                        style={{ padding: '12px', background: '#0a0a0a', border: `1px solid ${key === 'placa' ? COR + '55' : '#333'}`, color: key === 'placa' ? COR : 'white', borderRadius: '8px', boxSizing: 'border-box', width: '100%', fontWeight: key === 'placa' ? 'bold' : 'normal' }} />
                    ))}
                  </div>
                </div>

                <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
                  <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px', letterSpacing: '1px' }}>🪛 SERVIÇOS</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {SERVICOS_ESC.map(s => {
                      const ativo = form.servicos.includes(s.key);
                      return (
                        <button key={s.key} onClick={() => setForm(p => ({ ...p, servicos: ativo ? p.servicos.filter(k => k !== s.key) : [...p.servicos, s.key] }))}
                          style={{ padding: '12px 10px', background: ativo ? COR + '22' : '#0a0a0a', border: `2px solid ${ativo ? COR : '#333'}`, color: ativo ? COR : '#666', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
                          <span style={{ display: 'block' }}>{ativo ? '✅ ' : ''}{s.label}</span>
                          <span style={{ color: ativo ? COR + 'aa' : '#444', fontSize: '10px', fontWeight: 'normal' }}>{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
                  <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💰 VALOR TOTAL (R$)</label>
                  <input type="number" value={form.valorTotal} placeholder="0,00"
                    onChange={e => setForm(p => ({ ...p, valorTotal: e.target.value }))}
                    style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: `1px solid ${GREEN}44`, color: GREEN, borderRadius: '8px', fontSize: '24px', fontWeight: '900', textAlign: 'center', boxSizing: 'border-box' }} />
                </div>

                <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
                  <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📝 OBSERVAÇÕES</label>
                  <textarea value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))}
                    rows={3} placeholder="Ex: catalisador entupido, silencioso furado..."
                    style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', fontSize: '13px' }} />
                </div>

                <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '20px' }}>
                  <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTOS ({(form.fotos || []).length}/10)</label>
                  <input value={legendaFoto} onChange={e => setLegendaFoto(e.target.value)} placeholder="Legenda..."
                    style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', marginBottom: '8px', boxSizing: 'border-box' }} />
                  <label style={{ display: 'block', padding: '12px', background: (form.fotos || []).length >= 10 ? '#222' : '#1a0800', border: `1px dashed ${(form.fotos || []).length >= 10 ? '#444' : COR}`, borderRadius: '8px', textAlign: 'center', cursor: (form.fotos || []).length >= 10 ? 'not-allowed' : 'pointer', color: (form.fotos || []).length >= 10 ? '#555' : 'white', fontWeight: 'bold' }}>
                    📷 {(form.fotos || []).length >= 10 ? 'LIMITE' : 'TIRAR FOTO'}
                    <input type="file" accept="image/*" capture="environment" disabled={(form.fotos || []).length >= 10} onChange={adicionarFoto} style={{ display: 'none' }} />
                  </label>
                  {(form.fotos || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {form.fotos.map((f, i) => (
                        <div key={i} style={{ position: 'relative', width: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                          <img src={f.foto} alt={f.legenda} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                          <div style={{ background: 'rgba(0,0,0,0.85)', color: '#aaa', fontSize: '9px', padding: '3px', textAlign: 'center' }}>{f.legenda || 'Foto'}</div>
                          <button onClick={() => setForm(p => ({ ...p, fotos: p.fotos.filter((_, idx) => idx !== i) }))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', lineHeight: '18px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={salvar} disabled={salvando}
                  style={{ width: '100%', padding: '20px', background: salvando ? '#333' : COR, color: 'black', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: '900', cursor: 'pointer' }}>
                  {salvando ? '⏳ SALVANDO...' : salvo ? '✅ SALVO!' : editandoId ? '💾 SALVAR EDIÇÃO' : '🪛 SALVAR NA O.S.'}
                </button>
              </div>
            )}

            {subAba === 'historico' && (
              <div>
                {lista.length === 0 ? (
                  <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '50px', textAlign: 'center' }}>
                    <p style={{ fontSize: '40px', margin: '0 0 10px' }}>🪛</p>
                    <p style={{ color: '#555', margin: 0 }}>Nenhum serviço de escapamento registrado.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lista.map(item => (
                      <div key={item.id} style={{ background: '#111', border: `1px solid ${COR}22`, borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <p style={{ margin: '0 0 2px', fontWeight: 'bold', fontSize: '14px' }}>{item.nomeCliente || 'Cliente'}</p>
                            <p style={{ margin: '0 0 2px', color: COR, fontWeight: '900', fontSize: '16px' }}>{item.placa}</p>
                            <p style={{ margin: '0 0 4px', color: '#666', fontSize: '11px' }}>{item.modelo}</p>
                            <p style={{ margin: 0, color: '#555', fontSize: '11px' }}>{item.servicosTexto}</p>
                            {item.data_registro && (<p style={{ margin: '4px 0 0', color: '#444', fontSize: '10px' }}>📅 {new Date(item.data_registro).toLocaleDateString('pt-BR')}</p>)}
                          </div>
                          <p style={{ margin: 0, color: GREEN, fontWeight: '900', fontSize: '18px' }}>{formatarMoeda(item.valorTotal)}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => { setForm({ ...FORM_VAZIO, ...item }); setEditandoId(item.id); setSubAba('novo'); }}
                            style={{ padding: '7px 12px', background: '#1a1a1a', color: '#888', border: '1px solid #444', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>✏️ Editar</button>
                          {item.telefone && (
                            <button onClick={() => {
                              const msg = `🪛 *Escapamento — ${item.nomeCliente || 'Cliente'}*\n\n🚗 ${item.modelo || ''} | Placa: *${item.placa}*\n✅ ${item.servicosTexto}\n💰 Total: *${formatarMoeda(item.valorTotal)}*\n\nServiço concluído! ✅`;
                              window.open(`https://wa.me/55${item.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }} style={{ padding: '7px 12px', background: '#25D36622', color: '#25D366', border: '1px solid #25D366', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>💬 WhatsApp</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
          );

}

}

