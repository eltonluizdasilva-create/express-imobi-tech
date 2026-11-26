// modulosMap.jsx
//
// MODULOS_MAP extraído do AdminNovo.jsx para um arquivo próprio.

import React from 'react';
import TorreDeControle360 from './components/TorreDeControle360';
import OSModulo from './components/admin/OS';
import ListaOS from './components/admin/ListaOS';
import Mecanica from './components/Mecanica';
import HibridoEV from './HibridoEV';
import VeiculoEletrico from './VeiculoEletrico';
import MotoModulo from './components/Motos';
import FunilariaModulo from './components/Funilaria';
import AmortecedorModulo from './components/Amortecedor';
import InjecaoModulo from './components/Injecao';
import EletricaModulo from './Eletrica';
import OleoModulo from './components/Oleo';
import AlinhamentoModulo from './components/Alinhamento';
import RevisaoPremium from './pages/admin/RevisaoPremium';
import RevisaoModulo from './components/ModuloRevisao';
import ArCondicionado from './ArCondicionado';
import PneusModulo from './components/pneus';
import Escapamento from './Escapamento';
import Estetica from './Estetica';
import LavaJato from './LavaJato';
import Desmanche from './components/desmanche/Desmanche';
import CopilotoModulo from './components/copiloto';
import Secretaria from './components/Secretaria';
import Administrador from './components/Administrador';
import Contador from './components/Contador';
import Financeiro from './Financeiro';
import Estoque from './Estoque';
import LeadsPage from './LeadsPage';
import Historico from './Historico';
import GestaoRetorno from './components/GestaoRetorno';
import OficinaPatrimonio from './components/OficinaPatrimonio';
import Fornecedores from './components/Fornecedores';
import Equipe from './Equipe';
import MarketingModulo from './Marketing';
import AbaEstrategia from './Estrategia';
import Precificacao from './components/admin/Precificacao';
import TarefaTab from './components/vistoria/VistoriaImobiliaria';
import NotaFiscal from './NotaFiscal';
import Ajuda from './components/admin/Ajuda.jsx';
import ConfiguracoesPage from './Configuracoes';
import ModuloMeuPlano from './components/Meuplano';
import MasterPanel from './components/MasterPanel';
import FechamentoCaixa from './FechamentoCaixa';
import PagamentosEquipe from './PagamentosEquipe';
import MigracaoDados from './components/MigracaoDados';
import Especialista from './components/Especialista';
import Burocracias from './components/Burocracias';
import YoutubeAgent from './components/YoutubeAgent';
import AssistenteJuridicoImobi from './components/AssistenteJuridicoImobi';
import AcompanhamentoCliente from './components/acompanhamento/AcompanhamentoCliente';
import AvaliacaoImovel from './components/imobi/AvaliacaoImovel';
import RadarCaptacao from './components/imobi/RadarCaptacao';
import CorrespondenteCredito from './components/credito/CorrespondenteCredito';
import TriagemCredito from './components/imobi/TriagemCredito';
import PosVendaCarteira from './components/imobi/PosVendaCarteira';
import GuiaCampoGratis from './components/admin/GuiaCampoGratis';

const TriagemWrapper = (props) => (
  <div className="flex flex-col w-full gap-8">
    <OSModulo {...props} />
    <ListaOS {...props} />
  </div>
);

export const MODULOS_MAP = {
  dashboard: TorreDeControle360,
  os: TriagemWrapper,
  lista: ListaOS,
  mecanica: Mecanica,
  hibrido: HibridoEV,
  eletrico: VeiculoEletrico,
  moto: MotoModulo,
  funilaria: FunilariaModulo,
  amortecedor: AmortecedorModulo,
  injecao: InjecaoModulo,
  eletrica: EletricaModulo,
  oleo: OleoModulo,
  alinhamento: AlinhamentoModulo,
  revisaopremium: RevisaoPremium,
  revisao: RevisaoModulo,
  ar_condicionado: ArCondicionado,
  pneus: PneusModulo,
  escapamento: Escapamento,
  estetica: Estetica,
  lavajato: LavaJato,
  desmanche: Desmanche,
  copiloto: CopilotoModulo,
  secretaria: Secretaria,
  administrador: Administrador,
  contador: Contador,
  financeiro: Financeiro,
  estoque: Estoque,
  clientes: LeadsPage,
  leads: LeadsPage,
  historico: Historico,
  retorno: GestaoRetorno,
  patrimonio: OficinaPatrimonio,
  fornecedores: Fornecedores,
  equipe: Equipe,
  marketing: MarketingModulo,
  estrategia: AbaEstrategia,
  precificacao: Precificacao,
  tarefa: TarefaTab,
  notafiscal: NotaFiscal,
  ajuda: Ajuda,
  config: ConfiguracoesPage,
  ConfiguracoesPage: ConfiguracoesPage,
  meuplano: ModuloMeuPlano,
  master: MasterPanel,
  fechamento_caixa: FechamentoCaixa,
  pagamentos_equipe: PagamentosEquipe,
  migracao: MigracaoDados,
  especialista: Especialista,
  burocracias: Burocracias,
  youtube: YoutubeAgent,
  juridico_imobi: AssistenteJuridicoImobi,
  acompanhamento_cliente: AcompanhamentoCliente,
  avaliacao_imovel: AvaliacaoImovel,
  radar_captacao: RadarCaptacao,
  credito: CorrespondenteCredito,
  triagem_credito: TriagemCredito,
  pos_venda: PosVendaCarteira,
  guia_campo_bonus: GuiaCampoGratis,
};
