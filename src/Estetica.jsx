<<<<<<< HEAD
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, Sparkles, Diamond, Palette,
  Layers, Shield, Brush, Droplet, Sun, Eraser, Car,
  ShieldCheck, Share2, MessageCircle, PenTool, Award
} from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';

const STYLES = {
  card: 'bg-zinc-900/60 border border-zinc-800 rounded-[3.5rem] p-10 mb-10 shadow-2xl backdrop-blur-xl relative overflow-hidden',
  input: 'bg-zinc-950 border-zinc-800 focus:border-fuchsia-500 text-zinc-100 p-6 rounded-2xl outline-none w-full transition-all font-mono text-lg shadow-inner'
};

const ServiceToggle = ({ icon: Icon, title, subtitle, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-6 rounded-[2.5rem] flex flex-col items-start justify-center transition-all border text-left group hover:scale-[1.02] ${active
      ? 'bg-fuchsia-600/20 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.2)]'
      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-500'
      }`}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-xl ${active ? 'bg-fuchsia-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
        <Icon size={20} />
      </div>
      <span className={`font-black text-xs uppercase tracking-tighter ${active ? 'text-fuchsia-400' : 'text-zinc-400'}`}>
        {title}
      </span>
    </div>
    <span className="text-[11px] font-bold text-zinc-600 ml-1 leading-tight">{subtitle}</span>
  </button>
);

export default function EsteticaModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);
  const [fotoTab, setFotoTab] = useState('antes');
  const [fotosAntes, setFotosAntes] = useState([]);
  const [fotosDepois, setFotosDepois] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const sigPad = useRef({});

  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');
  const [garantiaMeses, setGarantiaMeses] = useState('6');

  const [servicos, setServicos] = useState({
    polimentoSimples: false, polimentoCompleto: false, cristalizacao: false,
    envelopamentoTotal: false, envelopamentoParcial: false, peliculaPPF: false,
    coatingCeramico: false, higienizacaoInterna: false, lavagemTecnica: false,
    vitrificacao: false, restauracaoFarois: false, polimentoTeto: false
  });

  const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (osParaEditar) {
      setObsGerais(osParaEditar.observacaoEstetica || '');
      setFotosAntes(osParaEditar.fotosAntesEstetica || []);
      setFotosDepois(osParaEditar.fotosDepoisEstetica || []);
      setPecas(osParaEditar.valorInsumosEstetica || '0,00');
      setMaoDeObra(osParaEditar.valorMaoObraEstetica || '0,00');
      setGarantiaMeses(osParaEditar.garantiaEstetica || '6');
      if (osParaEditar.servicosEstetica) setServicos(osParaEditar.servicosEstetica);
    }
  }, [osParaEditar]);

  const enviarWppCertificado = () => {
    const nome = osParaEditar?.clienteNome || "Cliente";
    const msg = `✨ *CERTIFICADO DE ESTÉTICA* ✨\n\nOlá ${nome}, seu veículo está finalizado! Aplicamos proteção com garantia de ${garantiaMeses} meses. Confira o brilho: https://expautotech.com.br/status/${osParaEditar?.id}`;
    window.open(`https://api.whatsapp.com/send?phone=55${osParaEditar?.clienteWpp}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSalvarFinal = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
        moduloAtivo: 'estetica',
        servicosEstetica: servicos,
        observacaoEstetica: obsGerais,
        fotosAntesEstetica: fotosAntes,
        fotosDepoisEstetica: fotosDepois,
        assinaturaEstetica: assinatura,
        valorInsumosEstetica: pecas,
        valorMaoObraEstetica: maoDeObra,
        garantiaEstetica: garantiaMeses,
        totalEstetica: vTotal,
        data_entrega_estetica: new Date().toISOString()
      });
      setSuccess(true);
      if (onSalvo) onSalvo();
      setTimeout(onCancelar, 2000);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-6 md:p-12 pb-60 relative selection:bg-fuchsia-500 selection:text-white">

      {/* 💎 HEADER DESIGNER */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:row justify-between items-start md:items-center mb-20 gap-10">
          <div className="flex items-center gap-10">
            <div className="p-8 bg-fuchsia-600 rounded-[2.5rem] shadow-[0_0_60px_rgba(192,38,211,0.4)] animate-pulse rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <Sparkles className="text-white" size={50} />
            </div>
            <div>
              <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">Detalhamento <span className="text-fuchsia-500">Premium</span></h1>
              <p className="text-fuchsia-500 font-black text-xs tracking-[0.5em] uppercase flex items-center gap-2">
                <ShieldCheck size={14} /> Proteção Cerâmica e Estética Automotiva
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={enviarWppCertificado} className="p-5 bg-green-600/10 border border-green-600 text-green-500 rounded-[2rem] hover:bg-green-600 hover:text-white transition-all shadow-xl shadow-green-600/10">
              <MessageCircle size={30} />
            </button>
            <button onClick={onCancelar} className="p-5 bg-zinc-900 rounded-[2rem] border border-zinc-800 hover:border-red-600 transition-all">
              <X size={30} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

          {/* 🛠️ COLUNA DE SERVIÇOS TÉCNICOS */}
          <div className="xl:col-span-2 space-y-10">
            <div className={STYLES.card}>
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <Diamond size={200} />
              </div>
              <h2 className="text-2xl font-black uppercase italic text-fuchsia-500 mb-10 flex items-center gap-4">
                <Award /> Protocolos Realizados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <ServiceToggle icon={Sparkles} title="Polimento Comercial" subtitle="Remoção de micro-riscos" active={servicos.polimentoSimples} onClick={() => toggleServico('polimentoSimples')} />
                <ServiceToggle icon={Diamond} title="Polimento Técnico" subtitle="Correção total de pintura" active={servicos.polimentoCompleto} onClick={() => toggleServico('polimentoCompleto')} />
                <ServiceToggle icon={Shield} title="Vitrificação 9H" subtitle="Proteção cerâmica extrema" active={servicos.vitrificacao} onClick={() => toggleServico('vitrificacao')} />
                <ServiceToggle icon={Layers} title="PPF Stealth" subtitle="Película auto-regenerativa" active={servicos.peliculaPPF} onClick={() => toggleServico('peliculaPPF')} />
                <ServiceToggle icon={Palette} title="Envelopamento" subtitle="Mudança de cor premium" active={servicos.envelopamentoTotal} onClick={() => toggleServico('envelopamentoTotal')} />
                <ServiceToggle icon={Eraser} title="Detalhamento Interno" subtitle="Higienização com vapor" active={servicos.higienizacaoInterna} onClick={() => toggleServico('higienizacaoInterna')} />
              </div>
            </div>

            {/* 📸 GALERIA COMPARATIVA (A MÁGICA DA VENDA) */}
            <div className={STYLES.card}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-zinc-400 font-black uppercase text-xs tracking-widest flex items-center gap-3">
                  <Camera size={20} className="text-fuchsia-500" /> Registro de Qualidade
                </h2>
                <div className="flex bg-black p-1 rounded-2xl border border-zinc-800">
                  <button onClick={() => setFotoTab('antes')} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${fotoTab === 'antes' ? 'bg-fuchsia-600 text-white' : 'text-zinc-600'}`}>Antes</button>
                  <button onClick={() => setFotoTab('depois')} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${fotoTab === 'depois' ? 'bg-fuchsia-600 text-white' : 'text-zinc-600'}`}>Depois</button>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {(fotoTab === 'antes' ? fotosAntes : fotosDepois).map((f, i) => (
                  <div key={i} className="relative min-w-[280px] h-48 rounded-[2.5rem] overflow-hidden border border-zinc-800 group shadow-2xl">
                    <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-125 duration-700" />
                    <button onClick={() => {
                      if (fotoTab === 'antes') setFotosAntes(fotosAntes.filter((_, idx) => idx !== i));
                      else setFotosDepois(fotosDepois.filter((_, idx) => idx !== i));
                    }} className="absolute top-4 right-4 bg-red-600/80 p-3 rounded-full backdrop-blur-md transition-opacity opacity-0 group-hover:opacity-100"><X size={16} /></button>
                  </div>
                ))}
                <label className={`min-w-[280px] h-48 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${fotoTab === 'antes' ? 'border-zinc-800 bg-zinc-950/40 hover:border-fuchsia-500' : 'border-fuchsia-500/30 bg-fuchsia-500/5 hover:border-fuchsia-500'}`}>
                  <Plus size={40} className="text-zinc-700 group-hover:text-fuchsia-500" />
                  <span className="text-[10px] font-black uppercase mt-2 text-zinc-500">Adicionar {fotoTab}</span>
                  <input type="file" multiple accept="image/*" className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* 💰 FINANCEIRO E GARANTIA (LADO DIREITO) */}
          <div className="space-y-10">
            <div className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-900 rounded-[3.5rem] p-12 shadow-2xl shadow-fuchsia-900/30">
              <span className="text-[11px] font-black uppercase text-fuchsia-200 tracking-widest block mb-4">Investimento Total</span>
              <h3 className="text-7xl font-black text-white italic tracking-tighter">
                R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}
              </h3>
              <div className="mt-12 space-y-5">
                <div className="relative group">
                  <input value={pecas} onChange={e => setPecas(e.target.value)} placeholder="Insumos Premium R$" className="w-full bg-black/30 border border-white/10 p-5 rounded-2xl text-center font-black text-white placeholder:text-white/30 outline-none focus:border-white/50 transition-all" />
                </div>
                <div className="relative group">
                  <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} placeholder="Mão de Obra Técnica R$" className="w-full bg-black/30 border border-white/10 p-5 rounded-2xl text-center font-black text-white placeholder:text-white/30 outline-none focus:border-white/50 transition-all" />
                </div>
                <div className="relative group pt-4 border-t border-white/10">
                  <label className="text-[10px] font-black uppercase text-fuchsia-200 mb-2 block">Meses de Garantia</label>
                  <input type="number" value={garantiaMeses} onChange={e => setGarantiaMeses(e.target.value)} className="w-full bg-white text-fuchsia-900 p-5 rounded-2xl text-center font-black text-2xl outline-none" />
                </div>
              </div>
            </div>

            {/* 📝 OBS E VOZ */}
            <div className={STYLES.card}>
              <div className="relative">
                <textarea
                  value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                  placeholder="Relatório de inspeção visual..."
                  className={STYLES.input + " min-h-[200px] text-sm resize-none pr-20"}
                />
                <button onClick={() => { }} className="absolute right-6 bottom-6 p-5 bg-zinc-800 rounded-full hover:bg-fuchsia-500 text-white transition-all shadow-xl active:scale-90">
                  <Mic size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 BOTÃO FINAL (SEÇÃO INFERIOR) */}
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6">
          <button
            onClick={handleSalvarFinal}
            disabled={loading}
            className="w-full py-8 bg-fuchsia-600 hover:bg-white text-white hover:text-black font-black text-4xl uppercase italic rounded-[3rem] shadow-[0_30px_70px_rgba(192,38,211,0.4)] transition-all flex items-center justify-center gap-6 group"
          >
            {loading ? 'Sincronizando Cloud...' : <><Sparkles size={45} className="group-hover:rotate-12 transition-transform" /> ENTREGAR COM BRILHO</>}
          </button>
        </div>
      </div>

      {/* BLOQUEIO DE SEGURANÇA */}
      {showBlocker && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[400] flex items-center justify-center p-10">
          <div className="bg-zinc-900 border border-zinc-800 p-16 rounded-[5rem] max-w-xl text-center shadow-3xl">
            <AlertTriangle size={100} className="text-fuchsia-500 mx-auto mb-10" />
            <h2 className="text-4xl font-black text-white mb-8 uppercase italic">Protocolo Necessário</h2>
            <p className="text-zinc-500 text-xl mb-12 font-medium leading-relaxed">Não é possível iniciar a estética sem uma O.S. ativa. Vá para o módulo de **Abertura de O.S.** para registrar a entrada do veículo primeiro.</p>
            <button onClick={() => { irParaNovaOS(); setShowBlocker(false); }} className="w-full py-7 bg-fuchsia-600 text-white font-black rounded-3xl flex items-center justify-center gap-4 text-2xl hover:scale-105 transition-all shadow-2xl shadow-fuchsia-600/30">
              CRIAR O.S. AGORA <ArrowRight size={30} />
            </button>
          </div>
=======
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useOficina } from './components/OficinaContext';

const COR = '#a855f7';
const COR2 = '#9333ea';
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

const SERVICOS_EST = [
  {key:'polimento_simples',    label:'✨ Polimento Simples',      desc:'1 passo, remove riscos leves',           cor:'#c084fc'},
  {key:'polimento_completo',   label:'💎 Polimento Completo',     desc:'3 passos, brilho profissional',           cor:'#a855f7'},
  {key:'cristalizacao',        label:'🔮 Cristalização',          desc:'Proteção de longa duração',               cor:'#818cf8'},
  {key:'envelopamento_total',  label:'🎨 Envelopamento Total',    desc:'Mudança completa de cor',                 cor:'#e879f9'},
  {key:'envelopamento_parcial',label:'🖌️ Envelopamento Parcial', desc:'Capô, teto, retrovisores',                cor:'#d946ef'},
  {key:'ppf',                  label:'🛡️ Película PPF',           desc:'Proteção da pintura anti-risco',          cor:'#7c3aed'},
  {key:'coating_ceramico',     label:'🏺 Coating Cerâmico',       desc:'Proteção semi-permanente 2-5 anos',       cor:'#6d28d9'},
  {key:'higienizacao_interna', label:'🪑 Higienização Interna',   desc:'Bancos, teto, carpete e painel',          cor:'#34d399'},
  {key:'lavagem_tecnica',      label:'🚿 Lavagem Técnica',        desc:'Descontaminação ferrosa + clay bar',      cor:'#22d3ee'},
  {key:'vitrificacao',         label:'💧 Vitrificação',           desc:'Vitrificação de pintura e plásticos',     cor:'#f0abfc'},
  {key:'restaura_farol',       label:'💡 Restauração de Faróis',  desc:'Polidora + verniz protetor',              cor:'#fbbf24'},
  {key:'teto_solar',           label:'🌞 Polimento Teto Solar',   desc:'Limpeza e proteção do teto solar',        cor:'#fb923c'},
];

const FORM_VAZIO = {
  placa:'',nomeCliente:'',telefone:'',modelo:'',cor:'',
  servicos:[],valorTotal:'',obs:'',fotosAntes:[],fotosDepois:[],status:'aberta',
};

export default function Estetica({ osParaEditar, onCancelarEdicao, onSalvo, buscarPorPlaca, carregarOS }) {
  const { oficinaId } = useOficina() || {};
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [subAba, setSubAba] = useState('novo');
  const [tipoFoto, setTipoFoto] = useState('antes');
  const [legendaFoto, setLegendaFoto] = useState('');
  const [autoFill, setAutoFill] = useState(false);
  const [verFotos, setVerFotos] = useState(null);

  useEffect(()=>{carregarLista();},[oficinaId]);

  useEffect(()=>{
    if(!osParaEditar||osParaEditar.tipoServico!=='estetica') return;
    setForm({...FORM_VAZIO,...osParaEditar});
    setEditandoId(osParaEditar.id);
    setSubAba('novo');
  },[osParaEditar]);

  const carregarLista = async () => {
    if(!oficinaId) return;
    try {
      const snap=await getDocs(collection(db,'oficinas',oficinaId,'os'));
      setLista(snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(o=>o.tipoServico==='estetica')
        .sort((a,b)=>new Date(b.data_registro||0)-new Date(a.data_registro||0)));
    } catch(e){console.error(e);}
  };

  const buscaPlaca = (p) => {
    if(buscarPorPlaca) buscarPorPlaca(p,{
      setNome:v=>setForm(prev=>({...prev,nomeCliente:prev.nomeCliente||v})),
      setTelefone:v=>setForm(prev=>({...prev,telefone:prev.telefone||v})),
      setModelo:v=>setForm(prev=>({...prev,modelo:prev.modelo||v})),
      onFound:()=>{setAutoFill(true);setTimeout(()=>setAutoFill(false),3000);},
    });
  };

  const salvar = async () => {
    if(!form.placa&&!form.nomeCliente) return alert('⚠️ Informe Placa ou Nome!');
    if(form.servicos.length===0) return alert('⚠️ Selecione ao menos 1 serviço!');
    setSalvando(true);
    try {
      const servicosTexto=form.servicos.map(k=>SERVICOS_EST.find(s=>s.key===k)?.label||k).join(', ');
      const dados={
        ...form, placa:normalizarPlaca(form.placa),
        servicosTexto, tipoServico:'estetica',
        checklist:servicosTexto, valorPecas:0,
        valorMaoObra:Number(form.valorTotal)||0,
        total:Number(form.valorTotal)||0,
        detalhesPecas:form.obs,
        data_registro:editandoId?form.data_registro:new Date().toISOString(),
      };
      if(editandoId){
        await updateDoc(doc(db,'oficinas',oficinaId,'os',editandoId),dados);
        if(onSalvo) onSalvo(editandoId,dados);
      } else {
        const ref=await addDoc(collection(db,'oficinas',oficinaId,'os'),dados);
        if(onSalvo) onSalvo(ref.id,dados);
      }
      setSalvo(true); setTimeout(()=>setSalvo(false),3000);
      setForm(FORM_VAZIO); setEditandoId(null);
      if(carregarOS) carregarOS();
      carregarLista(); setSubAba('historico');
    } catch(e){alert('Erro: '+e.message);}
    finally{setSalvando(false);}
  };

  const adicionarFoto = async (e) => {
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onloadend=async()=>{
      const c=await comprimirFoto(r.result);
      const campo=tipoFoto==='antes'?'fotosAntes':'fotosDepois';
      setForm(p=>({...p,[campo]:[...(p[campo]||[]),{foto:c,legenda:legendaFoto||tipoFoto,dataEnvio:new Date().toLocaleString('pt-BR')}]}));
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
    <div style={{color:'white',fontFamily:'sans-serif'}}>

      {autoFill&&(
        <div style={{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',background:GREEN,color:'black',padding:'12px 24px',borderRadius:'30px',fontWeight:'900',fontSize:'13px',zIndex:9999,boxShadow:`0 4px 20px ${GREEN}66`,whiteSpace:'nowrap'}}>
          ✅ Cliente encontrado! Dados preenchidos.
        </div>
      )}

      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${COR}22,transparent)`,border:`1px solid ${COR}44`,borderRadius:'14px',padding:'20px',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h2 style={{margin:0,color:COR,fontSize:'22px',fontWeight:'900'}}>🧴 Estética Automotiva</h2>
          <p style={{margin:'4px 0 0',color:'#666',fontSize:'13px'}}>Polimento, cristalização, envelopamento, PPF, coating e higienização</p>
        </div>
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          {[
            {label:'📋 No mês',val:lista.filter(o=>{const d=new Date(o.data_registro||0);return d.getMonth()===new Date().getMonth();}).length,cor:COR},
            {label:'💰 Receita mês',val:formatarMoeda(totalMes),cor:GREEN},
          ].map((s,i)=>(
            <div key={i} style={{background:'#111',border:`1px solid ${s.cor}33`,borderRadius:'10px',padding:'10px 16px',textAlign:'center',minWidth:'80px'}}>
              <p style={{margin:0,color:s.cor,fontWeight:'900',fontSize:'18px'}}>{s.val}</p>
              <p style={{margin:'2px 0 0',color:'#666',fontSize:'10px'}}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-abas */}
      <div style={{display:'flex',gap:'8px',marginBottom:'20px',flexWrap:'wrap'}}>
        {[
          {key:'novo',label:editandoId?'✏️ Editando':'➕ Novo Serviço'},
          {key:'historico',label:`📋 Histórico (${lista.length})`},
        ].map(s=>(
          <button key={s.key} onClick={()=>{setSubAba(s.key);if(s.key!=='novo'){setForm(FORM_VAZIO);setEditandoId(null);if(onCancelarEdicao)onCancelarEdicao();}}}
            style={{padding:'10px 20px',background:subAba===s.key?COR:'#1a1a1a',color:subAba===s.key?'white':'#888',border:`1px solid ${subAba===s.key?COR:'#333'}`,borderRadius:'20px',fontWeight:'bold',fontSize:'13px',cursor:'pointer'}}>
            {s.label}
          </button>
        ))}
      </div>

      {subAba==='novo'&&(
        <div>
          {editandoId&&(
            <div style={{background:'#110022',border:`2px solid ${COR}`,borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:COR,fontWeight:'bold',fontSize:'13px'}}>✏️ EDITANDO — {form.placa||form.nomeCliente}</span>
              <button onClick={()=>{setForm(FORM_VAZIO);setEditandoId(null);if(onCancelarEdicao)onCancelarEdicao();}} style={{background:'transparent',color:'#888',border:'1px solid #444',padding:'5px 12px',borderRadius:'5px',cursor:'pointer',fontSize:'12px'}}>✕ Cancelar</button>
            </div>
          )}

          <div style={{background:'#111',padding:'16px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:COR,fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'12px',letterSpacing:'1px'}}>👤 DADOS DO CLIENTE</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {[
                {key:'placa',ph:'PLACA',fn:v=>{const p=normalizarPlaca(v);buscaPlaca(p);return p;}},
                {key:'nomeCliente',ph:'NOME'},
                {key:'telefone',ph:'WHATSAPP',type:'tel'},
                {key:'modelo',ph:'MODELO'},
                {key:'cor',ph:'COR DO VEÍCULO'},
              ].map(({key,ph,fn,type})=>(
                <input key={key} type={type||'text'} value={form[key]||''} placeholder={ph}
                  onChange={e=>setForm(p=>({...p,[key]:fn?fn(e.target.value):e.target.value}))}
                  style={{padding:'12px',background:'#0a0a0a',border:`1px solid ${key==='placa'?COR+'55':'#333'}`,color:key==='placa'?COR:'white',borderRadius:'8px',boxSizing:'border-box',width:'100%',fontWeight:key==='placa'?'bold':'normal'}} />
              ))}
            </div>
          </div>

          <div style={{background:'#111',padding:'16px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:COR,fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'14px',letterSpacing:'1px'}}>🧴 SERVIÇOS</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {SERVICOS_EST.map(s=>{
                const ativo=form.servicos.includes(s.key);
                return(
                  <button key={s.key} onClick={()=>setForm(p=>({...p,servicos:ativo?p.servicos.filter(k=>k!==s.key):[...p.servicos,s.key]}))}
                    style={{padding:'12px 10px',background:ativo?s.cor+'22':'#0a0a0a',border:`2px solid ${ativo?s.cor:'#333'}`,color:ativo?s.cor:'#666',borderRadius:'10px',fontWeight:'bold',cursor:'pointer',textAlign:'left',fontSize:'12px'}}>
                    <span style={{display:'block'}}>{ativo?'✅ ':''}{s.label}</span>
                    <span style={{color:ativo?s.cor+'aa':'#444',fontSize:'10px',fontWeight:'normal'}}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:'#666',fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'8px'}}>💰 VALOR TOTAL (R$)</label>
            <input type="number" value={form.valorTotal} placeholder="0,00"
              onChange={e=>setForm(p=>({...p,valorTotal:e.target.value}))}
              style={{width:'100%',padding:'14px',background:'#0a0a0a',border:`1px solid ${GREEN}44`,color:GREEN,borderRadius:'8px',fontSize:'24px',fontWeight:'900',textAlign:'center',boxSizing:'border-box'}} />
          </div>

          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'14px'}}>
            <label style={{color:'#666',fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'8px'}}>📝 OBSERVAÇÕES</label>
            <textarea value={form.obs} onChange={e=>setForm(p=>({...p,obs:e.target.value}))}
              rows={3} placeholder="Ex: riscos profundos no capô, cliente quer envelopamento preto fosco..."
              style={{width:'100%',padding:'12px',background:'#0a0a0a',border:'1px solid #333',color:'white',borderRadius:'8px',resize:'vertical',boxSizing:'border-box',fontSize:'13px'}} />
          </div>

          {/* Fotos ANTES / DEPOIS */}
          <div style={{background:'#111',padding:'14px',borderRadius:'12px',marginBottom:'20px'}}>
            <label style={{color:COR,fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'12px',letterSpacing:'1px'}}>📸 FOTOS ANTES / DEPOIS</label>
            <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
              {['antes','depois'].map(t=>(
                <button key={t} onClick={()=>setTipoFoto(t)}
                  style={{flex:1,padding:'10px',background:tipoFoto===t?(t==='antes'?'#1a0505':'#001a0a'):'#0a0a0a',color:tipoFoto===t?(t==='antes'?'#ef4444':GREEN):'#555',border:`2px solid ${tipoFoto===t?(t==='antes'?'#ef4444':GREEN):'#333'}`,borderRadius:'8px',fontWeight:'bold',cursor:'pointer',fontSize:'13px'}}>
                  {t==='antes'?`📸 ANTES (${(form.fotosAntes||[]).length})`:`✨ DEPOIS (${(form.fotosDepois||[]).length})`}
                </button>
              ))}
            </div>
            <input value={legendaFoto} onChange={e=>setLegendaFoto(e.target.value)} placeholder="Legenda..."
              style={{width:'100%',padding:'10px',background:'#0a0a0a',border:'1px solid #333',color:'white',borderRadius:'8px',marginBottom:'8px',boxSizing:'border-box'}} />
            <label style={{display:'block',padding:'12px',background:'#0a0a0a',border:`1px dashed ${tipoFoto==='antes'?'#ef4444':COR}`,borderRadius:'8px',textAlign:'center',cursor:'pointer',color:'white',fontWeight:'bold'}}>
              📷 ADICIONAR FOTO {tipoFoto.toUpperCase()}
              <input type="file" accept="image/*" capture="environment" onChange={adicionarFoto} style={{display:'none'}} />
            </label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'10px'}}>
              {[...(form.fotosAntes||[]).map(f=>({...f,tipo:'antes'})),...(form.fotosDepois||[]).map(f=>({...f,tipo:'depois'}))].map((f,i)=>(
                <div key={i} style={{position:'relative',width:'80px',borderRadius:'8px',overflow:'hidden',border:`2px solid ${f.tipo==='antes'?'#ef4444':GREEN}`}}>
                  <img src={f.foto} alt={f.legenda} style={{width:'80px',height:'80px',objectFit:'cover'}} />
                  <div style={{background:'rgba(0,0,0,0.85)',color:f.tipo==='antes'?'#ef4444':GREEN,fontSize:'8px',padding:'2px',textAlign:'center',fontWeight:'bold'}}>{f.tipo.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={salvar} disabled={salvando}
            style={{width:'100%',padding:'20px',background:salvando?'#333':COR,color:'white',border:'none',borderRadius:'10px',fontSize:'18px',fontWeight:'900',cursor:'pointer'}}>
            {salvando?'⏳ SALVANDO...':salvo?'✅ SALVO!':editandoId?'💾 SALVAR EDIÇÃO':'🧴 SALVAR SERVIÇO NA O.S.'}
          </button>
        </div>
      )}

      {subAba==='historico'&&(
        <div>
          {lista.length===0?(
            <div style={{background:'#111',border:'1px dashed #333',borderRadius:'14px',padding:'50px',textAlign:'center'}}>
              <p style={{fontSize:'40px',margin:'0 0 10px'}}>🧴</p>
              <p style={{color:'#555',margin:0}}>Nenhum serviço de estética registrado ainda.</p>
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {lista.map(item=>(
                <div key={item.id} style={{background:'#111',border:`1px solid ${COR}22`,borderRadius:'12px',padding:'14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px',marginBottom:'10px'}}>
                    <div>
                      <p style={{margin:'0 0 2px',fontWeight:'bold',fontSize:'14px'}}>{item.nomeCliente||'Cliente'}</p>
                      <p style={{margin:'0 0 2px',color:COR,fontWeight:'900',fontSize:'16px'}}>{item.placa} {item.cor?`· ${item.cor}`:''}</p>
                      <p style={{margin:'0 0 4px',color:'#666',fontSize:'11px'}}>{item.modelo}</p>
                      <p style={{margin:0,color:'#555',fontSize:'11px'}}>{item.servicosTexto}</p>
                      {item.data_registro&&(<p style={{margin:'4px 0 0',color:'#444',fontSize:'10px'}}>📅 {new Date(item.data_registro).toLocaleDateString('pt-BR')}</p>)}
                    </div>
                    <p style={{margin:0,color:GREEN,fontWeight:'900',fontSize:'18px'}}>{formatarMoeda(item.valorTotal)}</p>
                  </div>
                  {/* Fotos antes/depois */}
                  {((item.fotosAntes||[]).length>0||(item.fotosDepois||[]).length>0)&&(
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
                      {[...(item.fotosAntes||[]).map(f=>({...f,tipo:'antes'})),...(item.fotosDepois||[]).map(f=>({...f,tipo:'depois'}))].slice(0,6).map((f,i)=>(
                        <div key={i} style={{position:'relative',width:'60px',borderRadius:'6px',overflow:'hidden',border:`2px solid ${f.tipo==='antes'?'#ef4444':GREEN}`}}>
                          <img src={f.foto} alt="" style={{width:'60px',height:'60px',objectFit:'cover'}} />
                          <div style={{background:'rgba(0,0,0,0.85)',color:f.tipo==='antes'?'#ef4444':GREEN,fontSize:'7px',padding:'1px',textAlign:'center',fontWeight:'bold'}}>{f.tipo==='antes'?'ANTES':'DEPOIS'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    <button onClick={()=>{setForm({...FORM_VAZIO,...item});setEditandoId(item.id);setSubAba('novo');}}
                      style={{padding:'7px 12px',background:'#1a1a1a',color:'#888',border:'1px solid #444',borderRadius:'8px',fontSize:'11px',cursor:'pointer'}}>✏️ Editar</button>
                    {item.telefone&&(
                      <button onClick={()=>{
                        const msg=`🧴 *Estética Automotiva — ${item.nomeCliente||'Cliente'}*\n\n🚗 ${item.modelo||''} ${item.cor?`| Cor: ${item.cor}`:''} | Placa: *${item.placa}*\n✅ ${item.servicosTexto}\n💰 Total: *${formatarMoeda(item.valorTotal)}*\n\nServiço finalizado com excelência! ✨`;
                        window.open(`https://wa.me/55${item.telefone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`,'_blank');
                      }} style={{padding:'7px 12px',background:'#25D36622',color:'#25D366',border:'1px solid #25D366',borderRadius:'8px',fontSize:'11px',fontWeight:'bold',cursor:'pointer'}}>💬 WhatsApp</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
