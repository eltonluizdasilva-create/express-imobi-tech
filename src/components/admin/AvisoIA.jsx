/* eslint-disable react/prop-types */

export default function AvisoIA({ abaAtiva }) {
  if (!['copiloto', 'revisao', 'alinhamento', 'oleo'].includes(abaAtiva)) return null;

  return (
    <div style={{ background: '#1a1000', border: '1px solid #f59e0b44', borderRadius: '8px', padding: '10px 14px', margin: '14px 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '18px' }}>🤖</span>
      <p style={{ margin: 0, color: '#f59e0b', fontSize: '11px', lineHeight: '1.5' }}>
        <strong>AVISO:</strong> A Inteligência Artificial pode cometer erros. Use sempre como <strong>assistente de apoio</strong> - a decisão técnica final é sempre do mecânico qualificado.
      </p>
    </div>
  );
}
