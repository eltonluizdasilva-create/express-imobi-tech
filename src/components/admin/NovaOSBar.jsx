/* eslint-disable react/prop-types */

export default function NovaOSBar({ t, tema, MAIN, abaAtiva, setAbaAtiva, listaCarros, busca, setBusca, normalizarPlaca, irParaNovaOS }) {
  // Filtra as ordens que estão pendentes no banco de dados
  const pendentes = listaCarros.filter(o => o.statusPagamento === 'pendente').length;

  return (
    <div 
      id="nova-os-bar" 
      style={{ 
        padding: '15px 20px', 
        background: 'transparent',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        id="tour-botao-nova-os"
        onClick={() => {
          if (irParaNovaOS) {
            irParaNovaOS();
          } else {
            window.dispatchEvent(new CustomEvent('ativarModoFoco'));
            setAbaAtiva('os');
          }
        }}
        style={{
          background: (abaAtiva === 'os' || abaAtiva === 'lista') 
            ? `${MAIN}22` 
            : (tema === 'escuro' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'),
          backdropFilter: 'blur(12px)',
          border: (abaAtiva === 'os' || abaAtiva === 'lista') 
            ? `1.5px solid ${MAIN}` 
            : `1px solid ${tema === 'escuro' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '20px',
          padding: '14px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: (abaAtiva === 'os' || abaAtiva === 'lista') 
            ? `0 10px 40px ${MAIN}33` 
            : (tema === 'escuro' ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.05)'),
          width: 'fit-content',
          minWidth: '280px'
        }}
      >
        <span style={{ fontSize: '22px', filter: (abaAtiva === 'os' || abaAtiva === 'lista') ? `drop-shadow(0 0 8px ${MAIN})` : 'none' }}>📝</span>
        <span style={{ 
          color: t.text, 
          fontWeight: '900', 
          letterSpacing: '1.5px', 
          fontSize: '13px',
          textTransform: 'uppercase'
        }}>
          ABRIR NOVA ORDEM DE SERVIÇO
        </span>
        
        {pendentes > 0 && (
          <div style={{
            background: MAIN,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '900',
            boxShadow: `0 0 15px ${MAIN}88`
          }}>
            {pendentes} {pendentes === 1 ? 'PENDENTE' : 'PENDENTES'}
          </div>
        )}
      </div>
    </div>
  );
}