import React from 'react';

// ✅ O "export default" no início da função resolve o erro da tela branca
export default function ConteudoAbas(props) {
  const {
    abaAtiva,
    oficinaId,
    dadosOficina,
    listaCarros,
    onSalvo,
    handleOSCriada,
    buscarDadosPorPlaca,
    config,
    osParaEditar,
    abrirWhatsApp,
    isTrial,
    modulosOperacionais,
    iniciarEdicao,
    deletarOS,
    enviarWhatsApp,
    abrirMercado,
    osEmEdicao,
    onCancelar,
    // Componentes recebidos como Props
    Dashboard,
    OSModulo,
    ListaOS,
    Mecanica,
    LavaJato,
    Estetica,
    InjecaoModulo,
    EletricaModulo,
    AlinhamentoModulo,
    OleoModulo,
    RevisaoModulo,
    Financeiro,
    Estoque,
    Historico,
    ConfiguracoesPage,
    ModuloMeuPlano,
    // ... adicione outros componentes aqui se necessário
  } = props;

  return (
    <div className="conteudo-abas-container" style={{ padding: '20px' }}>

      {/* 📊 ABA DASHBOARD / VISÃO GERAL */}
      {abaAtiva === 'dashboard' && Dashboard && (
        <Dashboard
          listaCarros={listaCarros}
          oficinaId={oficinaId}
          dadosOficina={dadosOficina}
        />
      )}

      {/* 🔧 ABA ORDEM DE SERVIÇO (O CORAÇÃO DO SISTEMA) */}
      {abaAtiva === 'os' && (
        <>
          <OSModulo
            oficinaId={oficinaId}
            dadosOficina={dadosOficina}
            listaCarros={listaCarros}
            onSalvo={onSalvo}
            onRedirecionar={handleOSCriada} // ✅ GATILHO PARA REDIRECIONAR APÓS GERAR
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            config={config}
            editarOS={osParaEditar}
            onAbrirWhatsApp={abrirWhatsApp}
            isTrial={isTrial}
            modulosOperacionais={modulosOperacionais}
          />
          <div id="lista-os" style={{ marginTop: '20px' }}>
            <ListaOS
              listaCarros={listaCarros}
              oficinaId={oficinaId}
              onEditar={iniciarEdicao}
              onDeletar={deletarOS}
              onWhatsApp={enviarWhatsApp}
              onBaixar={(os) => enviarWhatsApp(os, 'pagamento')}
              iniciarEdicao={iniciarEdicao}
              onMercadoClick={abrirMercado}
              osEmEdicao={osEmEdicao}
            />
          </div>
        </>
      )}

      {/* 🚿 MÓDULO LAVA JATO */}
      {abaAtiva === 'lavajato' && LavaJato && (
        <LavaJato
          osEmEdicao={osEmEdicao}
          onCancelar={onCancelar}
          oficinaId={oficinaId}
        />
      )}

      {/* 🔧 MÓDULO MECÂNICA */}
      {abaAtiva === 'mecanica' && Mecanica && (
        <Mecanica
          osEmEdicao={osEmEdicao}
          onCancelar={onCancelar}
          oficinaId={oficinaId}
        />
      )}

      {/* 🛠️ MÓDULO INJEÇÃO */}
      {abaAtiva === 'injecao' && InjecaoModulo && (
        <InjecaoModulo
          osEmEdicao={osEmEdicao}
          onCancelar={onCancelar}
          oficinaId={oficinaId}
        />
      )}

      {/* ⚡ MÓDULO ELÉTRICA */}
      {abaAtiva === 'eletrica' && EletricaModulo && (
        <EletricaModulo
          osEmEdicao={osEmEdicao}
          onCancelar={onCancelar}
          oficinaId={oficinaId}
        />
      )}

      {/* 💰 FINANCEIRO */}
      {abaAtiva === 'financeiro' && Financeiro && (
        <Financeiro oficinaId={oficinaId} />
      )}

      {/* 📦 ESTOQUE */}
      {abaAtiva === 'estoque' && Estoque && (
        <Estoque oficinaId={oficinaId} />
      )}

      {/* 📋 HISTÓRICO */}
      {abaAtiva === 'historico' && Historico && (
        <Historico oficinaId={oficinaId} />
      )}

      {/* 💰 MEU PLANO */}
      {abaAtiva === 'meuplano' && ModuloMeuPlano && (
        <ModuloMeuPlano dadosOficina={dadosOficina} />
      )}

      {/* ⚙️ AJUSTES */}
      {abaAtiva === 'config' && ConfiguracoesPage && (
        <ConfiguracoesPage oficinaId={oficinaId} config={config} />
      )}

    </div>
  );
}