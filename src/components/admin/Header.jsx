/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Header({ t, papelLogado, MASTER, MAIN, toggleTema, fazerLogout, oficinaId }) {
  const [dadosLicenca, setDadosLicenca] = useState({ diasRestantes: null, tipoPlano: null });

  useEffect(() => {
    const buscarDataVencimento = async () => {
      if (!oficinaId) return;
      try {
        const snap = await getDoc(doc(db, 'usuarios', oficinaId));
        if (snap.exists()) {
          const data = snap.data();
          let diasRestantes = null;
          if (data.dataFimTrial) {
            const fim = data.dataFimTrial.toDate ? data.dataFimTrial.toDate() : new Date(data.dataFimTrial);
            const diff = fim - new Date();
            diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }
          setDadosLicenca({ diasRestantes, tipoPlano: data.tipoPlano || 'trial' });
        }
      } catch (err) {
        console.error('Erro ao buscar vencimento:', err);
      }
    };
    buscarDataVencimento();
  }, [oficinaId]);

  const { diasRestantes, tipoPlano } = dadosLicenca;
  const dias = diasRestantes;
  const isTrial = tipoPlano === 'trial' || !tipoPlano;
  const isUrgente = dias !== null && dias <= 3 && dias > 0;
  const isExpirado = dias !== null && dias <= 0;
  const isAtivo = !isTrial && !isExpirado;

  const getLabel = () => {
    if (isExpirado || !isTrial) return 'EXPIRADO';
    if (isAtivo) return 'PLANO ATIVO';
    return 'DIAS GRÁTIS';
  };

  const getDiasTexto = () => {
    if (isExpirado) return '⛔';
    if (isAtivo) return '✓';
    return `${dias}`;
  };

  return (
    <div style={{ background: t.bgCard, padding: '12px 20px', borderBottom: `2px solid ${papelLogado === 'master' ? MASTER : MAIN}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {dias !== null && (
          <div style={{ 
            background: isExpirado ? '#ff003322' : isAtivo ? '#00e67622' : '#1a1a1a', 
            border: `1px solid ${isExpirado ? '#ff0033' : isAtivo ? '#00e676' : (dias <= 3 ? '#ff0033' : '#00E676')}`,
            padding: '5px 10px', 
            borderRadius: '8px', 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: (!isAtivo && dias <= 3) ? 'pulse 1.5s infinite' : 'none',
            fontSize: '10px',
          }}>
            <span style={{ color: isExpirado ? '#ff0033' : isAtivo ? '#00e676' : (dias <= 3 ? '#ff0033' : '#00E676'), fontWeight: 'bold' }}>
              {isExpirado ? '⛔ EXPIRADO' : isAtivo ? '✓ PLANO ATIVO' : `${dias} DIAS GRÁTIS`}
            </span>
          </div>
        )}
        
        <div>
          <h1 style={{ margin: 0, fontSize: '16px', lineHeight: '1.2' }}>
            EXPRESS<br />
            <span style={{ color: papelLogado === 'master' ? MASTER : MAIN }}>AUTO<br />TECH</span>
          </h1>
          {papelLogado === 'master' && <span style={{ color: MASTER, fontSize: '11px', fontWeight: 'bold' }}>👑 MASTER</span>}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={toggleTema} style={{ background: t.bgCardAlt, color: t.texto, border: `2px solid ${t.border}`, padding: '8px 16px', borderRadius: '30px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
          {t.iconeToggle} {t.labelToggle}
        </button>
        <button onClick={fazerLogout} style={{ background: 'transparent', color: papelLogado === 'master' ? MASTER : MAIN, border: `2px solid ${papelLogado === 'master' ? MASTER : MAIN}`, padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', boxShadow: `0 0 10px ${papelLogado === 'master' ? MASTER : MAIN}44`, transition: 'all 0.2s' }}>SAIR</button>
      </div>
    </div>
  );
}
