/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Lock, ShoppingCart, X } from 'lucide-react';
import MercadoLivre from '../../Mercadolivre';

const COLORS_CAT = {
  servicos: '#00E676',
  ia: '#FFE600',
  gestao: '#a855f7',
  sistema: '#38bdf8',
};

const BASE_STYLE = {
  background: '#0a0a0a',
  borderRadius: '12px',
  padding: '0 14px',
  height: '32px',
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function MenuNavegacao({ t, servicosVisiveis, MAIN, MASTER, papelLogado, abaAtiva, setAbaAtiva, moduloLiberado, lidarModuloBloqueado, LABELS_ABAS }) {
  const [showMLModal, setShowMLModal] = useState(false);

  const makeButton = (aba, category) => {
    const corCat = COLORS_CAT[category];
    const liberado = moduloLiberado(aba);
    const isActive = abaAtiva === aba;
    const ehIscaDeVenda = category === 'ia' || category === 'gestao';
    const mostraCadeado = !liberado && !ehIscaDeVenda;

    return (
      <button
        key={aba}
        onClick={() => !liberado ? lidarModuloBloqueado(aba) : setAbaAtiva(aba)}
        style={{
          ...BASE_STYLE,
          border: `1px solid ${corCat}`,
          color: !liberado ? '#999' : (isActive ? 'white' : '#ddd'),
          boxShadow: `0 0 10px ${corCat}`,
          opacity: isActive ? 1 : 0.7,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.color = !liberado ? '#999' : '#ddd';
          }
        }}
      >
        {mostraCadeado && <Lock size={10} style={{ display: 'inline', marginRight: '4px', opacity: 0.6 }} />}
        {LABELS_ABAS[aba]}
      </button>
    );
  };

  return (
    <>
      <div style={{ background: t.bgCardAlt, padding: '12px 20px 8px', borderBottom: `1px solid ${t.border}` }}>

        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>⚙️ SERVIÇOS E ESTÉTICA</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {servicosVisiveis.map(aba => makeButton(aba, 'servicos'))}
        </div>

        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>🧠 INTELIGÊNCIA ARTIFICIAL</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['copiloto', 'secretaria', 'administrador', 'contador', 'mercadolivre', 'retorno', 'estrategia'].map(aba => makeButton(aba, 'ia'))}
        </div>

        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>📋 GESTÃO</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['dashboard', 'estoque', 'financeiro', 'leads', 'tarefa', 'notafiscal', 'patrimonio', 'fornecedores', 'historico', 'precificacao']
            .filter(aba => aba !== 'dashboard' || papelLogado === 'dono' || papelLogado === 'master')
            .map(aba => makeButton(aba, 'gestao'))}
        </div>

        {(papelLogado === 'dono' || papelLogado === 'master') && (
          <>
            <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>⚙️ SISTEMA</p>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
              {['meuplano', 'config', 'equipe', 'marketing', 'ajuda', 'master']
                .filter(aba => aba !== 'master' || papelLogado === 'master')
                .map(aba => makeButton(aba, 'sistema'))}
            </div>
          </>
        )}
      </div>

      {/* 🚀 BOTÃO FLUTUANTE PREMIUM - MERCADO LIVRE */}
      {abaAtiva !== 'mercadolivre' && (
        <div className="fixed bottom-10 left-10 z-[9999] flex items-center group cursor-pointer" onClick={() => setShowMLModal(true)}>
          {/* O Botão Redondo Pulsante */}
          <div className="relative w-12 h-12 bg-[#FFE600] border-4 border-yellow-600 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(255,230,0,0.4)] transition-all active:scale-90 group-hover:scale-110">
            <ShoppingCart size={20} color="#2d3277" strokeWidth={3} />
            {/* Selo ML */}
            <span className="absolute -top-1 -right-1 bg-[#2d3277] text-[#FFE600] text-[8px] font-black px-1 py-0.5 rounded-md border border-[#FFE600] shadow-md z-10">
              ML
            </span>
            {/* Efeito Ping */}
            <span className="absolute inset-0 rounded-full animate-ping bg-[#FFE600] opacity-40 pointer-events-none"></span>
          </div>

          {/* Balão de Texto Hover */}
          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 pointer-events-none">
            <div className="bg-[#2d3277] text-white py-2 px-4 rounded-2xl shadow-2xl border-l-4 border-[#FFE600] flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-[#FFE600]">
                Mercado Livre
              </span>
              <span className="text-[9px] font-bold text-zinc-100 whitespace-nowrap">
                Catálogo Inteligente de Peças
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mercado Livre */}
      {showMLModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#111',
            width: '100%',
            maxWidth: '1200px',
            height: '90vh',
            borderRadius: '16px',
            border: '2px solid #FFE600',
            boxShadow: '0 0 30px rgba(255, 230, 0, 0.4)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowMLModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#222',
                border: '1px solid #444',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#222';
                e.currentTarget.style.borderColor = '#444';
              }}
            >
              <X size={20} />
            </button>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <MercadoLivre />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
