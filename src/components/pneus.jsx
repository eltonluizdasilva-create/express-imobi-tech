/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sincronizarRetornosAutomaticos } from "../lib/retornos";
import {
  Mic, Save, X, CheckCircle, Camera, Plus, Trash2,
  AlertTriangle, ArrowRight, Disc, Wrench, ShoppingCart,
  ScanLine, Focus
} from "lucide-react";

const STYLES = {
  card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
  input: 'bg-zinc-950 border-zinc-800 focus:border-violet-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// Botão de Serviço Toggle (Borracharia)
const ToggleButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full py-4 px-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border text-center ${active
      ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
      : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
      }`}
  >
    {label}
  </button>
);

export default function PneusModulo({ oficinaId, osParaEditar, onCancelar, onSalvo, irParaNovaOS }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBlocker, setShowBlocker] = useState(false);

  // Imagens
  const [fotoSulco, setFotoSulco] = useState(null);
  const [fotos, setFotos] = useState([]);

  // Serviços de Borracharia
  const [servicos, setServicos] = useState({
    macarrao: false,
    remendoFrio: false,
    vulcanizacao: false,
    montagem: false,
    trocaValvula: false,
    rodizio: false
  });

  // Financeiro e Vendas
  const [valorServico, setValorServico] = useState('');
  const [pneuNovo, setPneuNovo] = useState({ modelo: '', qtd: '1', valorUnitario: '' });
  const [obsGerais, setObsGerais] = useState('');

  const toggleServico = (key) => setServicos(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (osParaEditar) {
      setFotoSulco(osParaEditar.fotoSulco || null);
      setFotos(osParaEditar.fotosPneus || []);
      setValorServico(osParaEditar.valorServicoPneu || '');
      setObsGerais(osParaEditar.observacaoPneus || '');
      if (osParaEditar.servicosPneus) setServicos(osParaEditar.servicosPneus);
      if (osParaEditar.pneuNovo) setPneuNovo(osParaEditar.pneuNovo);
    }
  }, [osParaEditar]);

  // Compressão de Imagens
  const processarImagem = (file) => {
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
  };

  const handleUploadSulco = async (e) => {
    if (e.target.files[0]) {
      const imgBase64 = await processarImagem(e.target.files[0]);
      setFotoSulco(imgBase64);
    }
  };

  const handleUploadFotos = async (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos dos pneus!");
    const novasFotos = await Promise.all(files.map(file => processarImagem(file)));
    setFotos(prev => [...prev, ...novasFotos]);
  };

  const [isListening, setIsListening] = useState(false);
  const toggleMic = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return alert("Microfone não suportado no navegador.");
    const rec = new Recognition();
    rec.lang = 'pt-BR';
    if (isListening) { rec.stop(); setIsListening(false); }
    else {
      setIsListening(true); rec.start();
      rec.onresult = (e) => setObsGerais(prev => prev + " " + e.results[0][0].transcript);
      rec.onend = () => setIsListening(false);
    }
  };

  const calcularTotal = () => {
    const vServico = parseFloat(valorServico.replace(',', '.')) || 0;
    const vUnitario = parseFloat(pneuNovo.valorUnitario.replace(',', '.')) || 0;
    const qtd = parseInt(pneuNovo.qtd) || 0;
    return vServico + (vUnitario * qtd);
  };

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) { setShowBlocker(true); return; }
    setLoading(true);
    try {
      const dadosPneus = {
        tipoServico: 'pneus',
        servicosPneus: servicos,
        valorServicoPneu: valorServico,
        pneuNovo: pneuNovo,
        fotoSulco: fotoSulco,
        fotosPneus: fotos,
        observacaoPneus: obsGerais,
        totalPneus: calcularTotal(),
        data_atualizacao: new Date().toISOString()
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), dadosPneus);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osParaEditar.id, osData: dadosPneus, osBase: osParaEditar });
      setSuccess(true); if (onSalvo) onSalvo(); setTimeout(onCancelar, 1500);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

      {/* 🛑 MODAL DE BLOQUEIO */}
      {showBlocker && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
            <AlertTriangle size={60} className="text-violet-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">O.S. Requerida</h2>
            <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
              A venda ou serviço de pneus precisa de uma O.S.<br />
              <span className="text-white font-bold underline">1. Inicie a O.S. (Triagem)</span><br />
              <span className="text-white font-bold underline">2. Clique em Editar para voltar</span>
            </p>
            <button onClick={() => { irParaNovaOS(); setShowBlocker(false); }} className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-violet-600/20 transition-all">
              INICIAR O.S. AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">

        {/* Header Lilás (Violet) */}
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-violet-600 rounded-[1.5rem] shadow-xl shadow-violet-600/30">
              <Disc className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Pneus & Borracharia</h1>
              <p className="text-violet-400 font-bold text-xs tracking-[0.3em] uppercase">Consertos, Montagem e Vendas</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"><X size={28} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* COLUNA ESQUERDA: SERVIÇOS E VENDAS */}
          <div className="space-y-8">

            {/* Serviços de Conserto */}
            <div className={STYLES.card + " mb-0"}>
              <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><Wrench size={16} /> Serviços de Conserto</h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <ToggleButton label="Remendo Furo (Macarrão)" active={servicos.macarrao} onClick={() => toggleServico('macarrao')} />
                <ToggleButton label="Remendo Frio (Interno)" active={servicos.remendoFrio} onClick={() => toggleServico('remendoFrio')} />
                <ToggleButton label="Vulcanização" active={servicos.vulcanizacao} onClick={() => toggleServico('vulcanizacao')} />
                <ToggleButton label="Montagem / Desmontagem" active={servicos.montagem} onClick={() => toggleServico('montagem')} />
                <ToggleButton label="Troca de Válvula / Bico" active={servicos.trocaValvula} onClick={() => toggleServico('trocaValvula')} />
                <ToggleButton label="Rodízio de Pneus" active={servicos.rodizio} onClick={() => toggleServico('rodizio')} />
              </div>

              {/* Caixa de Valor do Serviço Isolado */}
              <div className="bg-violet-950/20 border-2 border-violet-500/50 rounded-2xl p-6 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <label className="text-[10px] text-violet-400 font-black uppercase mb-2 flex items-center gap-2"><Disc size={14} /> Valor do Serviço (R$)</label>
                <input value={valorServico} onChange={e => setValorServico(e.target.value)} placeholder="Ex: 25,00" className="bg-transparent text-3xl font-black text-white outline-none w-full border-b border-violet-500/30 pb-2 mb-2" />
                <span className="text-[9px] text-zinc-500">Remendo, mão de obra, conserto, balanceamento avulso...</span>
              </div>
            </div>

            {/* Venda de Pneus Novos */}
            <div className={STYLES.card + " mb-0"}>
              <h2 className="text-zinc-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2"><ShoppingCart size={16} /> Venda de Pneus Novos</h2>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase px-2">Modelo / Medida</label>
                  <input value={pneuNovo.modelo} onChange={e => setPneuNovo({ ...pneuNovo, modelo: e.target.value })} placeholder="Ex: Pirelli 175/70 R14" className={STYLES.input} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase px-2">QTD</label>
                    <input value={pneuNovo.qtd} onChange={e => setPneuNovo({ ...pneuNovo, qtd: e.target.value })} type="number" className={STYLES.input + " text-center"} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-zinc-500 block mb-2 font-bold uppercase px-2">Valor Unitário (R$)</label>
                    <input value={pneuNovo.valorUnitario} onChange={e => setPneuNovo({ ...pneuNovo, valorUnitario: e.target.value })} placeholder="0" className={STYLES.input} />
                  </div>
                </div>
              </div>
            </div>

            {/* Observações e Microfone */}
            <div className={STYLES.card + " mb-0"}>
              <div className="relative">
                <label className="text-[10px] text-zinc-500 font-black uppercase mb-4 flex items-center gap-2 ml-2"><Mic size={14} className="text-violet-400" /> Observações Adicionais</label>
                <textarea
                  value={obsGerais} onChange={e => setObsGerais(e.target.value)}
                  placeholder="Ex: pneu com bolha, desgaste irregular, cliente solicitou retorno..."
                  className={STYLES.input + " min-h-[100px] leading-relaxed pr-16"}
                />
                <button onClick={toggleMic} className={`absolute right-4 bottom-4 p-3 rounded-full transition-all shadow-lg active:scale-90 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 hover:bg-violet-500'}`}>
                  <Mic size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: IA E CARROSSEL */}
          <div className="space-y-8">

            {/* Scanner de Desgaste (IA) */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl">
              <h2 className="text-violet-400 font-black mb-2 uppercase text-xs tracking-widest flex items-center gap-2"><ScanLine size={18} /> Scanner de Desgaste (IA)</h2>
              <p className="text-[11px] text-zinc-400 mb-6">Tire uma foto pegando o sulco do pneu. A IA dirá se precisa vender um novo para o cliente.</p>

              {fotoSulco ? (
                <div className="relative w-full h-56 rounded-3xl overflow-hidden border-2 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <img src={fotoSulco} className="w-full h-full object-cover" />
                  <button onClick={() => setFotoSulco(null)} className="absolute top-3 right-3 bg-red-600 p-2 rounded-full"><Trash2 size={16} /></button>
                </div>
              ) : (
                <label className="w-full h-56 rounded-3xl border-2 border-dashed border-violet-500/50 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 bg-violet-500/5 transition-all group">
                  <Focus size={48} className="text-violet-500 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-violet-400 font-black uppercase tracking-widest">Fotografar Sulco</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleUploadSulco} className="hidden" />
                </label>
              )}
            </div>

            {/* Carrossel de Fotos (Máx 5) */}
            <div className={STYLES.card + " mb-0"}>
              <h2 className="text-zinc-500 font-black mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2"><Camera size={14} /> Fotos dos Pneus ({fotos.length}/5)</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {fotos.map((f, i) => (
                  <div key={i} className="relative min-w-[160px] h-[120px] rounded-[1.5rem] overflow-hidden border border-zinc-700 shadow-xl group">
                    <img src={f} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full"><Trash2 size={12} /></button>
                  </div>
                ))}
                {fotos.length < 5 && (
                  <label className="min-w-[160px] h-[120px] rounded-[1.5rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 bg-zinc-900/50 transition-all">
                    <Camera size={28} className="text-zinc-600 mb-2" />
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Nova Foto</span>
                    <input type="file" multiple accept="image/*" onChange={handleUploadFotos} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Resumo Final e Botão */}
            <div className="bg-violet-950/20 border border-violet-500/30 rounded-[2rem] p-6 text-center shadow-xl">
              <span className="text-[10px] text-violet-400 font-black uppercase tracking-widest block mb-2">Total do Orçamento</span>
              <span className="text-4xl font-black text-violet-500 block mb-6">R$ {calcularTotal().toFixed(2)}</span>
              <button onClick={handleSalvarTentativa} disabled={loading} className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xl uppercase italic rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2">
                {loading ? 'Salvando...' : <><Save size={24} /> Salvar Serviço na O.S.</>}
              </button>
            </div>

          </div>
        </div>
      </div>

      {success && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-12 py-6 rounded-full shadow-2xl animate-bounce flex items-center gap-4 z-[210] font-black uppercase text-xl">
          <CheckCircle size={32} /> Borracharia Atualizada!
        </div>
      )}
    </div>
  );
}