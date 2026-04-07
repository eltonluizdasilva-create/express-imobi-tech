/* eslint-disable react/prop-types */

export default function Header({ t, papelLogado, MASTER, MAIN, toggleTema, fazerLogout }) {
  return (
    <div style={{ background: t.bgCard, padding: '15px 20px', borderBottom: `2px solid ${papelLogado === 'master' ? MASTER : MAIN}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '16px', lineHeight: '1.2' }}>
          EXPRESS<br />
          <span style={{ color: papelLogado === 'master' ? MASTER : MAIN }}>AUTO<br />TECH</span>
        </h1>
        {papelLogado === 'master' && <span style={{ color: MASTER, fontSize: '11px', fontWeight: 'bold' }}>👑 MASTER</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button onClick={toggleTema} style={{ background: t.bgCardAlt, color: t.texto, border: `2px solid ${t.border}`, padding: '8px 16px', borderRadius: '30px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
          {t.iconeToggle} {t.labelToggle}
        </button>
        <button onClick={fazerLogout} style={{ background: 'transparent', color: papelLogado === 'master' ? MASTER : MAIN, border: `2px solid ${papelLogado === 'master' ? MASTER : MAIN}`, padding: '8px 20px', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', boxShadow: `0 0 10px ${papelLogado === 'master' ? MASTER : MAIN}44`, transition: 'all 0.2s' }}>SAIR</button>
      </div>
    </div>
  );
}
