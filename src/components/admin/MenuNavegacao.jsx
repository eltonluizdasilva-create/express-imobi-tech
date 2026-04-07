/* eslint-disable react/prop-types */

import { Lock } from 'lucide-react';

export default function MenuNavegacao({ t, servicosVisiveis, TAB_COLORS, MAIN, MASTER, papelLogado, abaAtiva, setAbaAtiva, moduloLiberado, lidarModuloBloqueado, LABELS_ABAS }) {
  return (
    <div style={{ background: t.bgCardAlt, padding: '12px 20px 8px', borderBottom: `1px solid ${t.border}` }}>

      <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>⚙️ SERVIÇOS E ESTÉTICA</p>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
        {servicosVisiveis.map(aba => {
          const corAba = TAB_COLORS[aba] || MAIN;
          const liberado = moduloLiberado(aba);
          return (
            <button key={aba} onClick={() => !liberado ? lidarModuloBloqueado(aba) : setAbaAtiva(aba)}
              className="nav-button-premium"
              style={{
                flexShrink: 0, padding: '8px 14px',
                background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                color: !liberado ? '#555' : (abaAtiva === aba ? corAba : `${corAba}aa`),
                border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                borderRadius: '20px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap',
                '--glow-color': corAba
              }}>
              {!liberado && <Lock size={10} style={{ display: 'inline', marginRight: '4px', opacity: 0.6 }} />}
              {LABELS_ABAS[aba]}
            </button>
          );
        })}
      </div>

      <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>🤖 INTELIGÊNCIA ARTIFICIAL</p>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
        {['copiloto', 'secretaria', 'administrador', 'contador', 'mercadolivre']
          .map(aba => {
            const corAba = TAB_COLORS[aba] || MAIN;
            const liberado = moduloLiberado(aba);
            return (
              <button key={aba} onClick={() => !liberado ? lidarModuloBloqueado(aba) : setAbaAtiva(aba)}
                className="nav-button-premium"
                style={{
                  flexShrink: 0, padding: '10px 18px',
                  background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                  color: !liberado ? '#555' : (abaAtiva === aba ? corAba : `${corAba}aa`),
                  border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                  borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                  '--glow-color': corAba
                }}>
                {!liberado && <Lock size={10} style={{ display: 'inline', marginRight: '4px', opacity: 0.6 }} />}
                {LABELS_ABAS[aba]}
              </button>
            );
          })}
      </div>

      <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>📋 GESTÃO</p>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
        {['dashboard', 'estoque', 'financeiro', 'leads', 'tarefa', 'notafiscal', 'retorno', 'patrimonio', 'fornecedores', 'historico']
          .filter(aba => aba !== 'dashboard' || papelLogado === 'dono' || papelLogado === 'master')
          .map(aba => {
            const corAba = TAB_COLORS[aba] || MAIN;
            const liberado = moduloLiberado(aba);
            return (
              <button key={aba} onClick={() => !liberado ? lidarModuloBloqueado(aba) : setAbaAtiva(aba)}
                className="nav-button-premium"
                style={{
                  flexShrink: 0, padding: '10px 18px',
                  background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                  color: !liberado ? '#555' : (abaAtiva === aba ? corAba : `${corAba}aa`),
                  border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                  borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                  '--glow-color': corAba
                }}>
                {!liberado && <Lock size={10} style={{ display: 'inline', marginRight: '4px', opacity: 0.6 }} />}
                {LABELS_ABAS[aba]}
              </button>
            );
          })}
      </div>

      {(papelLogado === 'dono' || papelLogado === 'master') && (
        <>
          <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>⚙️ SISTEMA</p>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
            {['meuplano', 'config', 'equipe', 'marketing', 'estrategia', 'ajuda', 'master']
              .filter(aba => aba !== 'master' || papelLogado === 'master')
              .map(aba => {
                const corAba = TAB_COLORS[aba] || MASTER;
                const liberado = moduloLiberado(aba);
                return (
                  <button key={aba} onClick={() => !liberado ? lidarModuloBloqueado(aba) : setAbaAtiva(aba)}
                    className="nav-button-premium"
                    style={{
                      flexShrink: 0, padding: '10px 18px',
                      background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                      color: !liberado ? '#555' : (abaAtiva === aba ? corAba : `${corAba}aa`),
                      border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                      borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                      '--glow-color': corAba
                    }}>
                    {!liberado && <Lock size={10} style={{ display: 'inline', marginRight: '4px', opacity: 0.6 }} />}
                    {LABELS_ABAS[aba]}
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
