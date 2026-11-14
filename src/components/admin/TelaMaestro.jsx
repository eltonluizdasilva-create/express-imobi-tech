/* eslint-disable react/prop-types */

export default function TelaMaestro({
  osEmEdicao,
  osEditando,
  resumoEdicaoAtiva,
  explicacaoTriagemAtiva,
  fecharEdicao,
  oficinaId,
  listaCarros,
  carregarOS,
  buscarDadosPorPlaca,
  config,
  setOsEmEdicao,
  setAbaAtiva,
  abrirWhatsApp,
  subAbaEletrica,
  setSubAbaEletrica,
  dadosOficina,
  papelLogado,
  permissoesLogado,
  Mecanica,
}) {
  if (!osEmEdicao) return null;

  const Editor = resumoEdicaoAtiva?.editor || Mecanica;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '12px', color: '#888', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
        TRIAGEM ATIVA: {resumoEdicaoAtiva?.titulo || 'Mecânica'}
      </div>
      <div style={{ marginBottom: '12px', color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
        {explicacaoTriagemAtiva}
      </div>
      <button onClick={fecharEdicao} style={{ padding: '8px 12px', marginBottom: '12px', background: '#222', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' }}>
        ← Voltar / Cancelar
      </button>
      {Editor && (
        <Editor
          oficinaId={oficinaId}
          listaCarros={listaCarros}
          onSalvo={carregarOS}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
          config={config}
          osEmEdicao={osEmEdicao}
          osParaEditar={osEditando}
          onRedirecionar={(t, os) => { setOsEmEdicao(os); setAbaAtiva(t); }}
          onAbrirWhatsApp={abrirWhatsApp}
          onCancelar={fecharEdicao}
          subAbaEletrica={subAbaEletrica}
          setSubAbaEletrica={setSubAbaEletrica}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          permissoesLogado={permissoesLogado}
        />
      )}
    </div>
  );
}
