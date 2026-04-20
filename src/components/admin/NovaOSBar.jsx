/* eslint-disable react/prop-types */

export default function NovaOSBar({ t, MAIN, abaAtiva, setAbaAtiva, listaCarros, busca, setBusca, normalizarPlaca, irParaNovaOS }) {
  // Filtra as ordens que estão pendentes no banco de dados
  const pendentes = listaCarros.filter(o => o.statusPagamento === 'pendente').length;

  return (
    <div id="nova-os-bar" style={{ padding: '12px 20px', background: t.bgCardAlt, borderBottom: `1px solid ${t.border}` }}>
      <button
        id="tour-botao-nova-os"
        onClick={() => {
          // Agora o botão apenas obedece: limpa tudo, entra no Modo Foco e abre a Recepção!
          if (irParaNovaOS) {
            irParaNovaOS();
          } else {
            // Fallback caso a função demore a carregar
            window.dispatchEvent(new CustomEvent('ativarModoFoco'));
            setAbaAtiva('os');
          }
        }}
        style={{
          width: '100%', padding: '16px 24px',
          // O botão fica destacado se estiver na aba de O.S. ou na Listagem
          background: (abaAtiva === 'os' || abaAtiva === 'lista') ? MAIN : 'transparent',
          color: (abaAtiva === 'os' || abaAtiva === 'lista') ? 'white' : MAIN,
          border: `2px solid ${MAIN}`,
          borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          letterSpacing: '1px', transition: 'all 0.2s',
          boxShadow: (abaAtiva === 'os' || abaAtiva === 'lista') ? `0 0 20px ${MAIN}66` : `0 0 15px ${MAIN}33`,
        }}>
        📋 NOVA ORDEM DE SERVIÇO

        {pendentes > 0 && (
          <span style={{
            background: abaAtiva === 'lista' ? 'white' : MAIN,
            color: abaAtiva === 'lista' ? MAIN : 'white',
            borderRadius: '12px',
            padding: '2px 10px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: abaAtiva === 'lista' ? `1px solid ${MAIN}` : 'none'
          }}>
            {pendentes} pendentes
          </span>
        )}
      </button>
    </div>
  );
}