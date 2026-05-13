/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, Crown, Zap, CheckCircle } from 'lucide-react';

export default function Header({ t, papelLogado, MASTER, MAIN, toggleTema, fazerLogout, isTrial, dataFimTrial }) {
  const [diasRestantes, setDiasRestantes] = useState(null);

  useEffect(() => {
    if (!dataFimTrial) {
      setDiasRestantes(null);
      return;
    }
    const fim = dataFimTrial.toDate ? dataFimTrial.toDate() : new Date(dataFimTrial);
    const diff = fim - new Date();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    setDiasRestantes(dias);
  }, [dataFimTrial]);

  const colorBrand = papelLogado === 'master' ? MASTER : MAIN;
  const isExpirado = diasRestantes !== null && diasRestantes <= 0;
  const isAtivo = !isTrial && !isExpirado;

  return (
    <header 
      className="w-full px-6 py-4 border-b flex items-center justify-between gap-4 sticky top-0 z-50 backdrop-blur-md"
      style={{ 
        background: 'rgba(9, 9, 11, 0.8)', 
        borderColor: `${colorBrand}22`,
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      
      {/* ESQUERDA: LOGO E STATUS */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col cursor-pointer select-none group">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black tracking-tighter text-zinc-300 group-hover:text-white transition-colors uppercase italic">
              Express
            </span>
            <span 
              className="text-lg font-black tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              style={{ 
                background: `linear-gradient(to right, #fff, ${colorBrand})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Auto Tech
            </span>
          </div>
          
          {papelLogado === 'master' && (
            <div className="flex items-center gap-1 mt-0.5">
              <Crown size={10} className="text-amber-400 fill-current" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/90">Painel Master</span>
            </div>
          )}
        </div>

        {/* SEPARADOR */}
        <div className="h-8 w-px bg-zinc-800/50 hidden sm:block" />

        {/* BADGE STATUS */}
        {diasRestantes !== null && (
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border backdrop-blur-sm ${
            isExpirado 
              ? 'bg-red-950/30 text-red-400 border-red-900/50' 
              : isAtivo 
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' 
                : 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50 animate-pulse'
          }`}>
            {isExpirado ? <Zap size={12} /> : isAtivo ? <CheckCircle size={12} /> : <Zap size={12} className="fill-current" />}
            {isExpirado ? 'EXPIRADO' : isAtivo ? 'PLANO ATIVO' : `${diasRestantes} DIAS GRÁTIS`}
          </div>
        )}
      </div>

      {/* DIREITA: CONTROLES */}
      <div className="flex items-center gap-3">
        
        {/* BOTÃO TEMA GLASS */}
        <button 
          onClick={toggleTema}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 font-bold text-xs uppercase tracking-widest shadow-sm"
        >
          {t.labelToggle.includes('Escuro') ? <Moon size={14} /> : <Sun size={14} />}
          <span className="hidden sm:inline">{t.labelToggle}</span>
        </button>

        {/* BOTÃO SAIR PREMIUM */}
        <button 
          onClick={fazerLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-black/30 border"
          style={{
            backgroundColor: `${colorBrand}15`,
            borderColor: `${colorBrand}40`,
            color: colorBrand,
          }}
          onMouseEnter={(e) => {
             e.currentTarget.style.backgroundColor = colorBrand;
             e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
             e.currentTarget.style.backgroundColor = `${colorBrand}15`;
             e.currentTarget.style.color = colorBrand;
          }}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">SAIR</span>
        </button>
      </div>
    </header>
  );
}
