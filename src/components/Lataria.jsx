/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Mic, Palette, Save, X, CheckCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';

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

export default function LatariaModulo({
  oficinaId, osParaEditar, onCancelar, onSalvo, setAbaAtiva, irParaNovaOS
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [pecas, setPecas] = useState('0,00');
  const [maoDeObra, setMaoDeObra] = useState('0,00');
  const [obsLataria, setObsLataria] = useState('');
  const [checklist, setChecklist] = useState({
    // Lataria
    amassados: 'OK', oxidacao: 'OK', pintura: 'OK', repintura: 'OK',
    // Acabamento
    vidros: 'OK', retrovisores: 'OK', parachoques: 'OK', borrachas: 'OK',
    // Interior
    bancos: 'OK', painel: 'OK', tapetes: 'OK'
  });

  useEffect(() => {
    if (osParaEditar) {
      setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0,00');
      setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0,00');
      setObsLataria(osParaEditar.observacaoLataria || '');
      if (osParaEditar.checklistLataria) setChecklist(osParaEditar.checklistLataria);
    }
  }, [osParaEditar]);

  const handleSalvarTentativa = async () => {
    if (!osParaEditar) {
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const vPecas = parseFloat(pecas.replace(',', '.')) || 0;
      const vMao = parseFloat(maoDeObra.replace(',', '.')) || 0;
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), {
        tipoServico: 'lataria',
        valorPecas: vPecas,
        valorMaoObra: vMao,
        total: vPecas + vMao,
        observacaoLataria: obsLataria,
        checklistLataria: checklist,
        data_atualizacao: new Date().toISOString()
      });
      setSuccess(true);
      if (onSalvo) onSalvo();
      setTimeout(onCancelar, 1500);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-32 relative">

      {/* MODAL DE INSTRUÇÃO */}
      {showAlert && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-sm text-center shadow-2xl">
            <div className="bg-red-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/20">
              <Info size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Atenção!</h2>
            <div className="text-zinc-400 text-sm mb-8 space-y-4 text-left">
              <p>Para salvar este laudo técnico, siga os passos:</p>
              <div className="flex gap-3 items-center bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                <span>Crie a O.S. na aba <strong>Triagem</strong></span>
              </div>
              <div className="flex gap-3 items-center bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                <span>Clique em <strong>Editar O.S.</strong> e volte aqui</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { 
                    if (irParaNovaOS) irParaNovaOS(); 
                    else if (setAbaAtiva) setAbaAtiva('os'); 
                    setShowAlert(false); 
                }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 uppercase"
              >
                INICIAR O.S. AGORA <ArrowRight size={18} />
              </button>
              <button onClick={() => setShowAlert(false)} className="py-2 text-zinc-500 text-xs hover:text-zinc-300">
                Vou criar a O.S. depois
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header Profissional */}
        <div className="mb-10 flex justify-between items-center border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-red-600 rounded-2xl">
              <Palette className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Laudo de Lataria</h1>
              <p className="text-zinc-500 text-sm">Inspeção detalhada de chaparia e acabamento</p>
            </div>
          </div>
          <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800"><X size={24} /></button>
        </div>

        {/* 1. Diagnóstico Lataria */}
        <div className={STYLES.card}>
          <h2 className="text-red-600 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-red-600 pl-3">🛠️ Lataria & Pintura</h2>
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden mb-6">
            <StatusSelector label="Amassados / Cortes / Lanternagem" value={checklist.amassados} onChange={v => setChecklist({ ...checklist, amassados: v })} />
            <StatusSelector label="Oxidação / Ferrugem / Corrosão" value={checklist.oxidacao} onChange={v => setChecklist({ ...checklist, oxidacao: v })} />
            <StatusSelector label="Estado da Pintura (Queimada/Fosca)" value={checklist.pintura} onChange={v => setChecklist({ ...checklist, pintura: v })} />
            <StatusSelector label="Área de Repintura / Massa / Bolhas" value={checklist.repintura} onChange={v => setChecklist({ ...checklist, repintura: v })} />
          </div>
          <textarea value={obsLataria} onChange={e => setObsLataria(e.target.value)} placeholder="Detalhes técnicos da lataria..." className={STYLES.input + " min-h-[100px]"} />
        </div>

        {/* 2. Acabamento (Restaurado) */}
        <div className={STYLES.card}>
          <h2 className="text-red-600 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-red-600 pl-3">💎 Vidros & Acabamento</h2>
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden">
            <StatusSelector label="Para-brisa / Vidros Laterais / Vigia" value={checklist.vidros} onChange={v => setChecklist({ ...checklist, vidros: v })} />
            <StatusSelector label="Retrovisores (Lentes e Carcaças)" value={checklist.retrovisores} onChange={v => setChecklist({ ...checklist, retrovisores: v })} />
            <StatusSelector label="Para-choques / Grades / Spoilers" value={checklist.parachoques} onChange={v => setChecklist({ ...checklist, parachoques: v })} />
            <StatusSelector label="Borrachas de Vedação / Canaletas" value={checklist.borrachas} onChange={v => setChecklist({ ...checklist, borrachas: v })} />
          </div>
        </div>

        {/* 3. Interior (Restaurado) */}
        <div className={STYLES.card}>
          <h2 className="text-red-600 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-red-600 pl-3">💺 Interior</h2>
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden">
            <StatusSelector label="Bancos / Estofamento / Couro" value={checklist.bancos} onChange={v => setChecklist({ ...checklist, bancos: v })} />
            <StatusSelector label="Painel / Tabelier / Airbags" value={checklist.painel} onChange={v => setChecklist({ ...checklist, painel: v })} />
            <StatusSelector label="Tapetes / Forros de Porta / Teto" value={checklist.tapetes} onChange={v => setChecklist({ ...checklist, tapetes: v })} />
          </div>
        </div>

        {/* Orçamento */}
        <div className={STYLES.card}>
          <h2 className="text-red-600 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-red-600 pl-3">💰 Orçamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div>
              <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase">Peças (R$)</label>
              <input value={pecas} onChange={e => setPecas(e.target.value)} className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl outline-none text-center font-mono text-xl text-white" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase">Mão de Obra (R$)</label>
              <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl outline-none text-center font-mono text-xl text-white" />
            </div>
            <div className="bg-green-950/20 border border-green-500/30 p-5 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] text-green-500 font-bold mb-2 uppercase">Total Lataria</span>
              <span className="text-3xl font-black text-green-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* BOTÃO DE AÇÃO */}
        <button
          onClick={handleSalvarTentativa}
          className={osParaEditar ? STYLES.buttonRed + " w-full" : STYLES.buttonGray + " w-full"}
        >
          {loading ? 'Sincronizando...' : (
            osParaEditar
              ? <><Save size={28} /> ATUALIZAR DADOS NA O.S.</>
              : <><AlertTriangle size={24} /> 1. CRIE A O.S. -{">"} 2. CLIQUE EM EDITAR</>
          )}
        </button>
      </div>

      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-5 rounded-full shadow-2xl animate-bounce flex items-center gap-3 z-[110] font-black uppercase">
          <CheckCircle size={24} /> O.S. ATUALIZADA!
        </div>
      )}
    </div>
  );
}