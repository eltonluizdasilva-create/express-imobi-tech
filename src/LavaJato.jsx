/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { db } from "./lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  Mic, Save, X, CheckCircle, Clock, Users, Calendar,
  MessageCircle, ArrowRight, Droplets, Sparkles, AlertTriangle,
  Camera, Trash2, Plus, PenTool, Smartphone, ShieldCheck
} from "lucide-react";
import SignatureCanvas from 'react-signature-canvas';

const STYLES = {
  card: 'bg-zinc-900/60 border border-zinc-800 rounded-[3rem] p-8 mb-8 shadow-2xl backdrop-blur-md',
  input: 'bg-zinc-950 border-zinc-800 focus:border-cyan-500 text-zinc-100 p-5 rounded-2xl outline-none w-full transition-all font-mono text-lg shadow-inner'
};

export default function LavaJatoModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filaCount, setFilaCount] = useState(0);
  const [tempoEsperaFila, setTempoEsperaFila] = useState(0);
  const [fotos, setFotos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const sigPad = useRef({});

  const [agendamento, setAgendamento] = useState({ data: '', hora: '' });
  const [obsGerais, setObsGerais] = useState('');
  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');

  const [servicos, setServicos] = useState({
    lavagemSimples: { active: false, time: 45, preco: 50, icon: Droplets },
    lavagemCompleta: { active: false, time: 90, preco: 120, icon: Sparkles },
    polimento: { active: false, time: 240, preco: 450, icon: ShieldCheck },
    higienizacao: { active: false, time: 150, preco: 280, icon: Smartphone },
    vitrificacao: { active: false, time: 360, preco: 1200, icon: ShieldCheck },
    motor: { active: false, time: 60, preco: 100, icon: Droplets }
  });

  // 1. INTELIGÊNCIA DE FILA (BUSCA REAL NO FIRESTORE)
  useEffect(() => {
    const carregarFila = async () => {
      try {
        const q = query(collection(db, 'oficinas', oficinaId, 'os'), where('statusLavaJato', '==', 'na_fila'));
        const snap = await getDocs(q);
        setFilaCount(snap.size);
        let acumulado = 0;
        snap.forEach(d => { acumulado += (d.data().tempoEstimado || 30); });
        setTempoEsperaFila(acumulado);
      } catch (e) { console.error("Erro na fila:", e); }
    };
    carregarFila();
    if (osParaEditar) {
      setObsGerais(osParaEditar.observacaoLavaJato || '');
      setFotos(osParaEditar.fotosLavaJato || []);
      if (osParaEditar.servicosLavaJato) setServicos(osParaEditar.servicosLavaJato);
    }
  }, [oficinaId, osParaEditar]);

  const tempoServicoAtual = Object.values(servicos).filter(s => s.active).reduce((acc, curr) => acc + curr.time, 0);

  const previsaoEntrega = () => {
    if (tempoServicoAtual === 0) return "--:--";
    const data = new Date();
    data.setMinutes(data.getMinutes() + tempoEsperaFila + tempoServicoAtual);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleFinalizar = async () => {
    if (!osParaEditar) return alert("Inicie a O.S. primeiro!");
    setLoading(true);
    try {
      const total = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
      const canvas = sigPad.current?.getTrimmedCanvas();
      const assBase64 = canvas ? canvas.toDataURL() : null;

      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
        statusLavaJato: 'na_fila',
        tempoEstimado: tempoServicoAtual,
        previsaoSaida: previsaoEntrega(),
        servicosLavaJato: servicos,
        fotosLavaJato: fotos,
        assinaturaCliente: assBase64,
        totalLavaJato: total,
        dataEntrada: new Date().toISOString(),
        agendamento: agendamento
      });
      setSuccess(true);
      setTimeout(onSalvo, 2000);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen text-white p-4 md:p-8 pb-60">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-cyan-600 rounded-3xl shadow-xl shadow-cyan-600/20"><Droplets size={32} /></div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Lava Jato <span className="text-cyan-500">Express</span></h1>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl hover:bg-red-600 transition-all shadow-lg"><X size={24} /></button>
        </div>

        {/* DASHBOARD DE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 p-6 rounded-[2.5rem] border border-zinc-800 flex items-center gap-4 shadow-xl">
            <Users className="text-cyan-500" size={32} />
            <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Carros na Fila</p><h4 className="text-2xl font-black">{filaCount} Veículos</h4></div>
          </div>
          <div className="bg-zinc-900/60 p-6 rounded-[2.5rem] border border-zinc-800 flex items-center gap-4 shadow-xl">
            <Clock className="text-yellow-500" size={32} />
            <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tempo de Espera</p><h4 className="text-2xl font-black">{tempoEsperaFila} min</h4></div>
          </div>
          <div className="bg-cyan-600 p-6 rounded-[2.5rem] flex items-center gap-4 shadow-2xl shadow-cyan-600/20">
            <Calendar className="text-white" size={32} />
            <div><p className="text-[10px] font-black text-cyan-200 uppercase tracking-widest">Pronto às:</p><h4 className="text-2xl font-black">{previsaoEntrega()}</h4></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={STYLES.card}>
            <h2 className="text-cyan-500 font-black mb-6 uppercase text-xs tracking-widest italic border-l-4 border-cyan-500 pl-4">Protocolo de Serviços</h2>
            <div className="space-y-3">
              {Object.keys(servicos).map(s => (
                <button key={s} onClick={() => setServicos({ ...servicos, [s]: { ...servicos[s], active: !servicos[s].active } })}
                  className={`w-full p-5 rounded-3xl border flex justify-between items-center transition-all ${servicos[s].active ? 'bg-cyan-600/20 border-cyan-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                  <div className="flex items-center gap-3">
                    {React.createElement(servicos[s].icon, { size: 20, className: servicos[s].active ? 'text-cyan-400' : 'text-zinc-600' })}
                    <span className="font-black text-[11px] uppercase tracking-tighter">{s.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold opacity-60">{servicos[s].time} min</p>
                    <p className="text-xs font-black">R$ {servicos[s].preco}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className={STYLES.card}>
              <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2">Agendar Execução</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={agendamento.data} onChange={e => setAgendamento({ ...agendamento, data: e.target.value })} className="bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-cyan-500 text-xs text-white" />
                <input type="time" value={agendamento.hora} onChange={e => setAgendamento({ ...agendamento, hora: e.target.value })} className="bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-cyan-500 text-xs text-white" />
              </div>
            </div>

            <div className={STYLES.card}>
              <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><PenTool size={16} /> Autorização do Cliente</h2>
              {!assinatura ? (
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                  <SignatureCanvas ref={sigPad} penColor='black' canvasProps={{ className: "w-full h-40 cursor-crosshair" }} />
                  <div className="bg-zinc-100 p-3 flex justify-between border-t border-zinc-200">
                    <button onClick={() => sigPad.current.clear()} className="text-[10px] font-black text-zinc-400 uppercase hover:text-red-500 transition-colors">Limpar Painel</button>
                    <button onClick={() => setAssinatura(sigPad.current.getTrimmedCanvas().toDataURL())} className="bg-black text-white px-6 py-1 rounded-xl text-[10px] font-black uppercase hover:bg-cyan-600 transition-all">Confirmar Assinatura</button>
                  </div>
                </div>
              ) : (
                <div className="relative bg-zinc-800 p-6 rounded-3xl border border-dashed border-cyan-500/50 text-center shadow-inner">
                  <img src={assinatura} className="h-24 mx-auto invert opacity-90" alt="Assinatura" />
                  <button onClick={() => setAssinatura(null)} className="absolute top-4 right-4 bg-red-600/20 p-2 rounded-full text-red-500 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARROSSEL DE FOTOS */}
        <div className={STYLES.card}>
          <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Camera size={16} /> Checklist de Entrada ({fotos.length}/10)</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {fotos.map((f, i) => (
              <div key={i} className="relative min-w-[220px] aspect-video rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl group">
                <img src={f} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full shadow-lg transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
              </div>
            ))}
            {fotos.length < 10 && (
              <label className="min-w-[220px] aspect-video rounded-3xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 bg-zinc-950 text-zinc-700 transition-all hover:bg-zinc-900">
                <Plus size={32} />
                <span className="text-[10px] font-black uppercase mt-2 tracking-widest">Tirar Foto</span>
                <input type="file" multiple accept="image/*" onChange={(e) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(e.target.files[0]);
                  reader.onload = (ev) => setFotos(prev => [...prev, ev.target.result]);
                }} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* BOTÃO FINAL GIGANTE */}
        <button onClick={handleFinalizar} disabled={loading} className="w-full py-8 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-3xl uppercase italic rounded-[2.5rem] shadow-[0_20px_60px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-6 overflow-hidden relative group">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          {loading ? (
            <div className="flex items-center gap-4">
              <Clock className="animate-spin" size={32} />
              <span>SINCRONIZANDO COM A FILA...</span>
            </div>
          ) : (
            <div className="flex items-center gap-4 relative z-10">
              <MessageCircle size={40} className="group-hover:rotate-12 transition-transform" />
              <span>START NA FILA PÚBLICA & WHATSAPP</span>
            </div>
          )}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-600 px-16 py-8 rounded-full shadow-[0_0_50px_rgba(22,163,74,0.5)] animate-bounce flex items-center gap-6 z-[600] font-black uppercase text-2xl text-white border-4 border-white/30">
          <CheckCircle size={45} /> CARRO NA FILA COM SUCESSO!
        </div>
      )}
    </div>
  );
}