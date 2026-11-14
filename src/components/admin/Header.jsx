/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, Crown, Zap } from 'lucide-react';

export default function Header({
  t = { labelToggle: 'Modo Claro' },
  papelLogado,
  MASTER = '#FFD700',
  MAIN = '#10b981',
  toggleTema,
  fazerLogout,
  modoPainel,
  alternarModoPainel
}) {
  const [modoAtual, setModoAtual] = useState('completo');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('modo');
      const salvo = localStorage.getItem('modoPainel');
      setModoAtual(p || salvo || 'completo');
    }
  }, []);

  const trocarModo = (modo) => {
    try {
      localStorage.setItem('modoPainel', modo);
    } catch (e) {}
    window.location.href = `/admin?modo=${modo}`;
  };

  return (
    <header style={{ backgroundColor: '#020408' }} className="bg-[#020408] border-b border-zinc-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black tracking-wider text-white">
            EXPRESS <span style={{ color: '#10b981' }} className="text-[#10b981]">IMOBI</span> TECH
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-2xl shadow-inner">
            <button
              type="button"
              onClick={() => trocarModo('gratis')}
              style={modoAtual === 'gratis' || modoAtual === 'lite' ? { backgroundColor: '#10b981' } : undefined}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 ${
                modoAtual === 'gratis' || modoAtual === 'lite'
                  ? 'bg-[#10b981] text-white shadow-md shadow-[#10b981]/20 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Modo Grátis</span>
            </button>

            <button
              type="button"
              onClick={() => trocarModo('completo')}
              style={modoAtual === 'completo' ? { backgroundColor: '#10b981' } : undefined}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 ${
                modoAtual === 'completo'
                  ? 'bg-[#10b981] text-white shadow-md shadow-[#10b981]/30 scale-[1.02]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Modo Completo (PRO)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTema}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>{t?.labelToggle || 'Modo Claro'}</span>
          </button>

          <button
            type="button"
            onClick={fazerLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SAIR</span>
          </button>
        </div>
      </div>
    </header>
  );
}
