/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Lock, ShoppingCart, X } from 'lucide-react';
import MercadoLivre from '../../Mercadolivre';

const COLORS_CAT = {
  ia: '#FFE600',
  gestao: '#a855f7',
  sistema: '#38bdf8',
};

const BASE_STYLE = {
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

export default function MenuNavegacao({ t, MAIN, MASTER, papelLogado, abaAtiva, setAbaAtiva, moduloLiberado, lidarModuloBloqueado, LABELS_ABAS, dadosOficina }) {
  const [showMLModal, setShowMLModal] = useState(false);
  const isGratuito = dadosOficina?.plano === 'GRATUITO' || dadosOficina?.plano === 'gratis';
  
  // Módulos que ficam desbloqueados no plano GRATUITO
  const MODULOS_GRATUITOS = ['dashboard', 'oleo', 'alinhamento', 'ajuda', 'meuplano', 'config'];

  const makeButton = (aba, category) => {
    const corCat = COLORS_CAT[category];
    const liberado = moduloLiberado(aba);
    const isActive = abaAtiva === aba;
    const ehIscaDeVenda = category === 'ia' || category === 'gestao';
    // Mostrar cadeado: (1) módulo não liberado E não é isca de venda, OU (2) usuário GRATUITO e aba não está na lista grátis
    const mostraCadeadoPadrao = !liberado && !ehIscaDeVenda;
    const mostraCadeadoGratuito = isGratuito && !MODULOS_GRATUITOS.includes(aba);
    const mostraCadeado = mostraCadeadoPadrao || mostraCadeadoGratuito;

    // IDs para o Tour de Onboarding
    let botaoId = undefined;
    if (aba === 'config') botaoId = 'tour-botao-ajustes';
    if (aba === 'ajuda') botaoId = 'tour-botao-ajuda';
    if (aba === 'dashboard') botaoId = 'tour-botao-dashboard';
    if (aba === 'copiloto') botaoId = 'tour-botao-copiloto';
    if (aba === 'secretaria') botaoId = 'tour-botao-secretaria';
    if (aba === 'administrador') botaoId = 'tour-botao-administrador';
    if (aba === 'contador') botaoId = 'tour-botao-contador';
    if (aba === 'estoque') botaoId = 'tour-botao-estoque';
    if (aba === 'financeiro') botaoId = 'tour-botao-financeiro';
    if (aba === 'precificacao') botaoId = 'tour-botao-precificacao';
    if (aba === 'meuplano') botaoId = 'tour-botao-meuplano';
    if (aba === 'equipe') botaoId = 'tour-botao-equipe';
    if (aba === 'retorno') botaoId = 'menu-retorno';
    if (aba === 'clientes') botaoId = 'menu-clientes';

    return (
      <button
        key={aba}
        id={botaoId} // ✅ O ID invisível é injetado no botão aqui!
        data-tour={aba}
        onClick={() => {
          if (!liberado) {
            lidarModuloBloqueado(aba);
          } else {
            window.dispatchEvent(new CustomEvent('ativarModoFoco'));
            setAbaAtiva(aba);
          }
        }}
        style={{
          ...BASE_STYLE,
          border: `2px solid ${corCat}`,
          color: !liberado ? t.textoTer : (isActive ? corCat : t.textoSec),
          background: isActive ? `${corCat}22` : t.bgCard,
          boxShadow: isActive ? `0 0 20px ${corCat}, inset 0 0 10px ${corCat}44` : `0 0 8px ${corCat}33`,
          opacity: isActive ? 1 : 0.8,
          textShadow: isActive ? `0 0 10px ${corCat}` : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.boxShadow = `0 0 20px ${corCat}, inset 0 0 10px ${corCat}44`;
          e.currentTarget.style.textShadow = `0 0 10px ${corCat}`;
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.color = !liberado ? '#999' : '#bbb';
            e.currentTarget.style.boxShadow = `0 0 8px ${corCat}66`;
            e.currentTarget.style.textShadow = 'none';
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
      <div id="menu-navegacao" className="menu-navegacao" style={{ background: t.bgCardAlt, padding: '12px 20px 8px', borderBottom: `1px solid ${t.border}` }}>

        {/* ❌ SEÇÃO "SERVIÇOS E ESTÉTICA" FOI REMOVIDA DAQUI PARA ALIVIAR O SISTEMA ❌ */}

        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>🧠 INTELIGÊNCIA ARTIFICIAL</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['copiloto', 'secretaria', 'administrador', 'contador', 'mercadolivre', 'retorno', 'estrategia', 'precificacao'].map(aba => makeButton(aba, 'ia'))}
        </div>

        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>📋 GESTÃO</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['dashboard', 'estoque', 'financeiro', 'desmanche', 'leads', 'tarefa', 'notafiscal', 'patrimonio', 'fornecedores', 'historico']
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