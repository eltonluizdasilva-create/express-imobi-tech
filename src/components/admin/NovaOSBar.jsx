/* eslint-disable react/prop-types */

export default function NovaOSBar({ t, MAIN, abaAtiva, setAbaAtiva, listaCarros, busca, setBusca, normalizarPlaca }) {
  const pendentes = listaCarros.filter(o => o.statusPagamento === 'pendente').length;

  return (
    <div style={{ padding: '12px 20px', background: t.bgCardAlt, borderBottom: `1px solid ${t.border}` }}>
      <button
        onClick={() => setAbaAtiva('os')}
        style={{
          width: '100%', padding: '16px 24px',
          background: abaAtiva === 'os' ? MAIN : 'transparent',
          color: abaAtiva === 'os' ? 'white' : MAIN,
          border: `2px solid ${MAIN}`,
          borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          letterSpacing: '1px', transition: 'all 0.2s',
          boxShadow: abaAtiva === 'os' ? `0 0 20px ${MAIN}66` : `0 0 15px ${MAIN}33`,
        }}>
        📋 NOVA ORDEM DE SERVIÇO
        {pendentes > 0 && (
          <span style={{ background: MAIN, color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 'bold' }}>
            {pendentes} pendentes
          </span>
        )}
      </button>

      <div style={{ marginTop: '12px', position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Busca Rápida (Placa)..."
          value={busca}
          onChange={(e) => {
            const val = normalizarPlaca(e.target.value);
            setBusca(val);
            if (val.length >= 7) {
              setAbaAtiva('os');
            }
          }}
          style={{
            width: '100%', padding: '14px 20px', background: t.bgCard, border: `2px solid ${t.border}`,
            borderRadius: '12px', color: t.texto, fontSize: '14px', outline: 'none'
          }}
        />
      </div>
    </div>
  );
}
