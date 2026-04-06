import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MAIN = '#FF0033';
const MODULOS_PADRAO_OCULTOS = ['Clientes', 'Copiloto IA'];
const OPCOES_OFICINA = [
  { nome: 'MECÂNICA', cor: MAIN },
  { nome: 'HÍBRIDOS', cor: '#a855f7' },
  { nome: 'MOTOS', cor: '#f97316' },
  { nome: 'FUNILARIA', cor: '#ec4899' },
  { nome: 'AMORTECEDOR', cor: '#f59e0b' },
  { nome: 'INJEÇÃO', cor: '#06b6d4' },
  { nome: 'ELÉTRICOS', cor: '#eab308' },
  { nome: 'ALINHAMENTO', cor: '#6366f1' },
  { nome: 'ÓLEO', cor: '#84cc16' },
  { nome: 'REVISÃO', cor: '#14b8a6' },
  { nome: 'AR-CONDICIONADO', cor: '#3b82f6' },
  { nome: 'PNEUS', cor: '#78716c' },
  { nome: 'DESMANCHE', cor: '#92400e' },
  { nome: 'ESCAPAMENTO', cor: '#6b7280' },
  { nome: 'LAVA JATO', cor: '#0ea5e9' },
  { nome: 'ESTÉTICA', cor: '#f43f5e' },
];

export default function ModalOnboarding({ onComplete, onClose }) {
  const [modulosSelecionados, setModulosSelecionados] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const toggleModulo = (nomeDoModulo) => {
    setModulosSelecionados((prev) =>
      prev.includes(nomeDoModulo)
        ? prev.filter((modulo) => modulo !== nomeDoModulo)
        : [...prev, nomeDoModulo]
    );
  };

  const handleFechar = () => {
    if (onClose) { onClose(); return; }
    if (onComplete) onComplete(modulosSelecionados);
  };

  const salvarEContinuar = async (modulosFinais, comTrial) => {
    if (salvando) return;
    setSalvando(true);
    const modulosComPadrao = [...new Set([...modulosFinais, ...MODULOS_PADRAO_OCULTOS])];

    try {
      const uid = getAuth().currentUser?.uid;
      const payload = {
        modulosOperacionais: modulosComPadrao,
        modulosPermitidos: comTrial ? 'ALL' : null,
        dataFimTrial: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        onboardingFeito: true,
      };

      if (uid) {
        await setDoc(doc(db, 'usuarios', uid), payload, { merge: true });
      }

      if (onComplete) onComplete(modulosComPadrao);
    } catch (err) {
      console.error('Erro ao salvar onboarding:', err);
      if (onComplete) onComplete(modulosComPadrao);
    } finally {
      setSalvando(false);
    }
  };

  const handleSimples = (e) => {
    e.preventDefault();
    if (modulosSelecionados.length === 0) {
      alert('Selecione pelo menos um módulo.');
      return;
    }
    salvarEContinuar(modulosSelecionados, true);
  };

  const handleTeste = (e) => {
    e.preventDefault();
    const todos = OPCOES_OFICINA.map((modulo) => modulo.nome);
    salvarEContinuar(todos, true);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 40 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleFechar(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[30px] border border-zinc-800"
        style={{ background: '#111111', zIndex: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-8 pb-4" style={{ background: '#111111', borderBottom: '1px solid #222' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#FF003322' }}>
              <Sparkles size={20} color="#FF0033" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight m-0">Bem-vindo!</h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest m-0">O que você faz de melhor?</p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors cursor-pointer relative"
            style={{ zIndex: 51 }}
          >
            <X size={14} color="#888" />
          </button>
        </div>

        {/* CORPO */}
        <form onSubmit={(e) => e.preventDefault()} className="p-8 pt-6">

          {/* CONTADOR */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Selecione os módulos que você oferece na sua oficina
            </p>
            <div style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid #22c55e',
              borderRadius: '20px', padding: '4px 12px'
            }}>
              <span style={{ color: '#22c55e', fontSize: '11px', fontWeight: '800' }}>
                {modulosSelecionados.length} selecionado{modulosSelecionados.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <>
            {/* CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {OPCOES_OFICINA.map((mod) => {
                const ativo = modulosSelecionados.includes(mod.nome);
                const cor = mod.cor || '#666';

                return (
                  <button
                    type="button"
                    key={mod.nome}
                    onClick={() => toggleModulo(mod.nome)}
                    className="relative text-left py-4 px-4 rounded-2xl border transition-all"
                    style={{
                      background: ativo ? `${cor}15` : '#0a0a0a',
                      borderColor: ativo ? cor : '#222',
                      borderWidth: '1px', borderStyle: 'solid',
                      boxShadow: ativo ? `0 0 15px ${cor}30` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: ativo ? cor : '#555', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {mod.nome}
                      </span>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        border: `2px solid ${ativo ? cor : '#333'}`,
                        background: ativo ? cor : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.2s'
                      }}>
                        {ativo && (
                          <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* INFO */}
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest text-center mb-5">
              {modulosSelecionados.length} módulo{modulosSelecionados.length !== 1 ? 's' : ''} selecionado{modulosSelecionados.length !== 1 ? 's' : ''}
            </p>

            {/* BOTÕES */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSimples}
                disabled={salvando}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', fontWeight: '800',
                  fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: 'transparent', color: '#555', border: '1px solid #333',
                  cursor: salvando ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  position: 'relative', zIndex: 51
                }}
              >
                {salvando ? 'Salvando...' : '🚀 Ativar módulos selecionados + 10 dias de teste grátis'}
              </button>
              <button
                type="button"
                onClick={handleTeste}
                disabled={salvando}
                style={{
                  width: '100%', padding: '18px', borderRadius: '16px', fontWeight: '800',
                  fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: salvando ? '#881111' : 'linear-gradient(135deg, #FF0033, #ff3366)',
                  color: 'white', border: 'none',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 30px #FF003366', transition: 'all 0.2s',
                  position: 'relative', zIndex: 51
                }}
              >
                🚀 Testar TODAS as ferramentas + 🧠 IA (10 Dias Grátis)
              </button>
            </div>
          </>
        </form>
      </div>
    </div>
  );
}
