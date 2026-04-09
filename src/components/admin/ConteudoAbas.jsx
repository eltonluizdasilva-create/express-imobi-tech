/* eslint-disable react/prop-types */
import Historico from '../../Historico';
import Equipe from '../../Equipe';
import ConfiguracoesPage from '../../Configuracoes';
import ModuloMeuPlano from '../../ModuloMeuPlano';
import MasterPanel from '../MasterPanel';
import TarefaTab from '../../Tarefas';
import NotaFiscal from '../../NotaFiscal';
import GestaoRetorno from '../../components/GestaoRetorno';
import OficinaPatrimonio from '../../components/OficinaPatrimonio';
import Fornecedores from '../../components/Fornecedores';
import Ajuda from '../../components/Ajuda';
import AbaEstrategia from '../../Estrategia';
import Precificacao from './Precificacao';

export default function ConteudoAbas(props) {
  const { abaAtiva, dataFimTrial, listaCarros, listaFinanceiro, listaEstoque, config, dadosOficina, oficinaId, papelLogado, permissoesLogado, handleSalvarOS, salvandoOS, salvo, onSalvo, osEmEdicao, osParaEditar, onCancelar, iniciarEdicao, deletarOS, enviarWhatsApp, abrirWhatsApp, abrirMercado, buscarDadosPorPlaca, handleOSCriada, nomeCliente, setNomeCliente, placa, setPlaca, telefone, setTelefone, modelo, setModelo, senhaPortal, setSenhaPortal, ouvirCampo, campoOuvindo, normalizarPlaca, formatarMoeda, Dashboard, OSModulo, ListaOS, Mecanica, HibridoEV, VeiculoEletrico, MotoModulo, FunilariaModulo, AmortecedorModulo, InjecaoModulo, OleoModulo, AlinhamentoModulo, EletricaModulo, RevisaoModulo, ArCondicionado, PneusModulo, Escapamento, Estetica, LavaJato, Desmanche, CopilotoModulo, Secretaria, Administrador, Contador, MarketingModulo, MercadoLivre, Financeiro, Estoque, LeadsPage, Historico, Equipe, ConfiguracoesPage, ModuloMeuPlano, MasterPanel, TarefaTab, NotaFiscal, GestaoRetorno, OficinaPatrimonio, Fornecedores, Ajuda, AbaEstrategia, servicosAlinhamento, setServicosAlinhamento, extrasAlinhamento, setExtrasAlinhamento, estadoPneus, setEstadoPneus, subAbaEletrica, setSubAbaEletrica, tema, toggleTema, buscaMercado, isTrial, modulosOperacionais, irParaNovaOS } = props;


  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

      {abaAtiva === 'dashboard' && (
        <Dashboard
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          onAbrirWhatsApp={abrirWhatsApp}
          onLembreteOleo={() => { }}
          tema={tema}
          onToggleTema={toggleTema}
          onNovaOS={irParaNovaOS}
          onBuscarCliente={() => { }}
          onFinanceiro={() => { }}
          onEstoque={() => { }}
          onLancarDespesa={() => { }}
          onAgendarRevisao={() => { }}
          oficinaId={oficinaId}
        />
      )}

      {abaAtiva === 'os' && (
        <>
          <OSModulo
            oficinaId={oficinaId}
            dadosOficina={dadosOficina}
            listaCarros={listaCarros}
            onSalvo={onSalvo}
            onRedirecionar={handleOSCriada}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            config={config}
            editarOS={osParaEditar}
            onAbrirWhatsApp={abrirWhatsApp}
            isTrial={isTrial}
            modulosOperacionais={modulosOperacionais}
          />
          <div style={{ marginTop: '20px' }}>
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

      {abaAtiva === 'mecanica' && (
        <Mecanica
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'hibrido' && (
        <HibridoEV
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'eletrico' && (
        <VeiculoEletrico
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'moto' && (
        <MotoModulo
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'funilaria' && (
        <FunilariaModulo
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'amortecedor' && (
        <AmortecedorModulo
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'injecao' && (
        <InjecaoModulo
          abaAtiva={abaAtiva} setAbaAtiva={() => { }}
          irParaNovaOS={irParaNovaOS}
          papelLogado={papelLogado}
          oficinaId={oficinaId}
          nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
          placa={placa} setPlaca={setPlaca}
          telefone={telefone} setTelefone={setTelefone}
          modelo={modelo} setModelo={setModelo}
          senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
          ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
          normalizarPlaca={normalizarPlaca}
          handleSalvarOS={handleSalvarOS}
          salvandoOS={salvandoOS} salvo={salvo}
          onSalvo={onSalvo}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          permissoesLogado={permissoesLogado}
          listaCarros={listaCarros}
          listaFinanceiro={listaFinanceiro}
          listaEstoque={listaEstoque}
          config={config}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
        />
      )}

      {abaAtiva === 'oleo' && (
        <OleoModulo
          oficinaId={oficinaId}
          onSalvo={onSalvo}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          permissoesLogado={permissoesLogado}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'alinhamento' && (
        <AlinhamentoModulo
          oficinaId={oficinaId}
          onSalvo={onSalvo}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          permissoesLogado={permissoesLogado}
          formatarMoeda={formatarMoeda}
          servicosAlinhamento={servicosAlinhamento}
          setServicosAlinhamento={setServicosAlinhamento}
          extrasAlinhamento={extrasAlinhamento}
          setExtrasAlinhamento={setExtrasAlinhamento}
          estadoPneus={estadoPneus}
          setEstadoPneus={setEstadoPneus}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'eletrica' && (
        <EletricaModulo
          oficinaId={oficinaId}
          onSalvo={onSalvo}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
          osEmEdicao={osEmEdicao}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          subAbaEletrica={subAbaEletrica}
          setSubAbaEletrica={setSubAbaEletrica}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          permissoesLogado={permissoesLogado}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'revisao' && (
        <RevisaoModulo
          oficinaId={oficinaId}
          onSalvo={onSalvo}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          permissoesLogado={permissoesLogado}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'ar_condicionado' && (
        <ArCondicionado
          oficinaId={oficinaId}
          onSalvo={onSalvo}
          buscarDadosPorPlaca={buscarDadosPorPlaca}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          permissoesLogado={permissoesLogado}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'pneus' && (
        <PneusModulo
          oficinaId={oficinaId}
          onSalvo={onSalvo}
          buscarPorPlaca={buscarDadosPorPlaca}
          osParaEditar={osParaEditar}
          onCancelar={onCancelar}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'escapamento' && (
        <Escapamento
          oficinaId={oficinaId}
          osParaEditar={osEmEdicao || osParaEditar}
          onCancelar={onCancelar}
          onSalvo={onSalvo}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'estetica' && (
        <Estetica
          oficinaId={oficinaId}
          osParaEditar={osEmEdicao || osParaEditar}
          onCancelar={onCancelar}
          onSalvo={onSalvo}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'lavajato' && (
        <LavaJato
          oficinaId={oficinaId}
          osParaEditar={osEmEdicao || osParaEditar}
          onCancelar={onCancelar}
          onSalvo={onSalvo}
          irParaNovaOS={irParaNovaOS}
        />
      )}

      {abaAtiva === 'desmanche' && (
        <Desmanche
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          carregarFinanceiro={() => { }}
          config={config}
          permissoesLogado={permissoesLogado}
        />
      )}

      {abaAtiva === 'copiloto' && (
        <CopilotoModulo
          papelLogado={papelLogado}
          dadosOficina={dadosOficina}
          setAbaAtiva={() => { }}
          listaCarros={listaCarros}
        />
      )}

      {abaAtiva === 'secretaria' && <Secretaria />}
      {abaAtiva === 'administrador' && <Administrador />}
      {abaAtiva === 'contador' && <Contador />}

      {abaAtiva === 'marketing' && <MarketingModulo />}

      {abaAtiva === 'mercadolivre' && (
        <MercadoLivre termoBuscaInicial={buscaMercado} />
      )}

      {abaAtiva === 'financeiro' && (
        <Financeiro
          oficinaId={oficinaId}
          listaFinanceiro={listaFinanceiro}
          onSalvo={() => { }}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
        />
      )}

      {abaAtiva === 'estoque' && (
        <Estoque
          oficinaId={oficinaId}
          listaEstoque={listaEstoque}
          onSalvo={() => { }}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
        />
      )}

      {abaAtiva === 'leads' && (
        <LeadsPage
          oficinaId={oficinaId}
          listaCarros={listaCarros}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
        />
      )}

      {abaAtiva === 'historico' && (
        <Historico
          oficinaId={oficinaId}
          listaCarros={listaCarros}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
        />
      )}

      {abaAtiva === 'equipe' && (
        <Equipe
          oficinaId={oficinaId}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
          dataFimTrial={dataFimTrial}
        />
      )}

      {abaAtiva === 'config' && (
        <ConfiguracoesPage
          oficinaId={oficinaId}
          onSalvo={() => { }}
          dadosOficina={dadosOficina}
          papelLogado={papelLogado}
        />
      )}

      {abaAtiva === 'meuplano' && (
        <ModuloMeuPlano
          dadosOficina={dadosOficina}
          planosSistema={{}}
          onModulosChange={() => { }}
        />
      )}

      {abaAtiva === 'master' && (
        <MasterPanel setPlanosGlobais={() => { }} />
      )}

      {abaAtiva === 'tarefa' && (
        <TarefaTab oficinaId={oficinaId} />
      )}

      {abaAtiva === 'notafiscal' && (
        <NotaFiscal
          oficinaId={oficinaId}
          papelLogado={papelLogado}
          dadosOficina={dadosOficina}
        />
      )}

      {abaAtiva === 'retorno' && (
        <GestaoRetorno
          oficinaId={oficinaId}
          listaCarros={listaCarros}
          setListaCarros={() => { }}
          nomeOficina={dadosOficina?.nome}
          abrirWhatsAppFn={abrirWhatsApp}
        />
      )}

      {abaAtiva === 'patrimonio' && (
        <OficinaPatrimonio oficinaId={oficinaId} />
      )}

      {abaAtiva === 'fornecedores' && (
        <Fornecedores oficinaId={oficinaId} db={{}} />
      )}

      {abaAtiva === 'estrategia' && (
        <AbaEstrategia oficinaId={oficinaId} />
      )}

      {abaAtiva === 'ajuda' && <Ajuda />}

      {abaAtiva === 'precificacao' && (
        <Precificacao oficinaId={oficinaId} config={config} verificarLicenca={props.verificarLicenca} />
      )}

    </div>
  );
}
