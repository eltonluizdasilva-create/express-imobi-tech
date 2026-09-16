import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from "./lib/firebase";
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Componentes de Interface e Admin
import { COLORS, normalizarPlaca, formatarMoeda } from './components/admin/constants';
import Dashboard, { TEMAS } from './DashboardTab';
import TorreDeControle360 from './components/TorreDeControle360';
import { TelaTrialExpirou, TelaBloqueado, TelaLogin } from './components/admin/TelasDeAcesso';
import TelaEdicaoOS from './components/admin/TelaEdicaoOS';
import Header from './components/admin/Header';
import NovaOSBar from './components/admin/NovaOSBar';
import MenuNavegacaoCompleto from './components/admin/MenuNavegacao';
import MenuNavegacaoLite from './components/admin/MenuNavegacaoLite';
import AvisoIA from './components/admin/AvisoIA';
import ModuloBloqueado from './components/admin/ModuloBloqueado';
import ModaisExtras from './components/admin/ModaisExtras';
import TelaMaestro from './components/admin/TelaMaestro';
import OnboardingTour from './components/admin/OnboardingTour';
import SpeechTextarea from './components/admin/SpeechTextarea';
import FloatingButtons from './components/FloatingButtons';
import { ShoppingCart, X } from 'lucide-react';

import { useAuth } from './contexts/AuthContext';
import useCarregamentoInicial from './hooks/useCarregamentoInicial.jsx';
import useQuickActions from './hooks/useQuickActions';
import { resolverTipoOS, resolverAbaDestino, buscarDadosPorPlaca as buscarDadosPorPlacaHelper, abrirMercado as abrirMercadoHelper, TIPO_TITULOS, TIPO_EXPLICACOES } from './helpers/osHelpers';
import { sincronizarRetornosAutomaticos } from './lib/retornos';

// Módulos (importados para passar ao GerenciadorDeModulos)
import Mecanica from './components/Mecanica';
import FunilariaModulo from './components/Funilaria';
import AmortecedorModulo from './components/Amortecedor';
import MotoModulo from './components/Motos';
import PneusModulo from './components/pneus';
import OleoModulo from './components/Oleo';
import InjecaoModulo from './components/Injecao';
import AlinhamentoModulo from './components/Alinhamento';
import RevisaoModulo from './components/ModuloRevisao';
import RevisaoPremium from './pages/admin/RevisaoPremium';
import CopilotoModulo from './components/copiloto';
import Secretaria from './components/Secretaria';
import Administrador from './components/Administrador';
import Contador from './components/Contador';
import GestaoRetorno from './components/GestaoRetorno';
import OficinaPatrimonio from './components/OficinaPatrimonio';
import Fornecedores from './components/Fornecedores';
import Ajuda from './components/admin/Ajuda.jsx';
import MasterPanel from './components/MasterPanel';
import QuickActions from './components/QuickActions';
import EletricaModulo from './Eletrica';
import ArCondicionado from './ArCondicionado';
import Escapamento from './Escapamento';
import Estetica from './Estetica';
import LavaJato from './LavaJato';
import Desmanche from "./components/desmanche/Desmanche";
import VeiculoEletrico from './VeiculoEletrico';
import HibridoEV from './HibridoEV';
import MarketingModulo from './Marketing';
import Financeiro from './Financeiro';
import Estoque from './Estoque';
import LeadsPage from './LeadsPage';
import Historico from './Historico';
import Equipe from './Equipe';
import ConfiguracoesPage from './Configuracoes';
import ModuloMeuPlano from './components/Meuplano';
import MercadoLivre from './Mercadolivre';
import TarefaTab from './Tarefas';
import NotaFiscal from './NotaFiscal';
import AbaEstrategia from './Estrategia';
import OSModulo from './components/admin/OS';
import ListaOS from './components/admin/ListaOS';
import Precificacao from './components/admin/Precificacao';
import AbaAjudaIA from './components/AbaAjudaIA';
import FechamentoCaixa from './FechamentoCaixa';
import PagamentosEquipe from './PagamentosEquipe';
import MigracaoDados from './components/MigracaoDados';
import Especialista from './components/Especialista';
import Burocracias from './components/Burocracias';

// Novo componente de gerenciamento de módulos
import GerenciadorDeModulos from './components/admin/GerenciadorDeModulos';

// ─── Constantes ────────────────────────────────────────────────────────────────

const { MAIN, GREEN, MASTER } = COLORS;
const APP_BASE_URL = 'https://oficina.expresstech.com.br';
const MODULOS_GRATIS_VITALICIOS = [
  'meuplano', 'config', 'equipe', 'marketing', 'ajuda', 'dashboard', 'os', 'lista', 'migracao', 'especialista', 'burocracias'
];

const SERVICOS_ESTETICA_ABAS = [
  'mecanica', 'hibrido', 'eletrico', 'moto', 'funilaria', 'amortecedor',
  'injecao', 'eletrica', 'alinhamento', 'oleo', 'ar_condicionado',
  'pneus', 'escapamento', 'lavajato', 'estetica'
  // 'desmanche' movido para Gestão
  // 'revisao' removido - agora é página independente /admin/revisao-premium
];

const MAPA_MODULOS_SERVICOS = {
  mecanica: ['mecanica', 'MECÂNICA', 'MECANICA'],
  hibrido: ['hibrido', 'HÍBRIDOS', 'HIBRIDOS'],
  eletrico: ['eletrico', '100% ELÉTRICOS', '100% ELETRICOS'],
  moto: ['moto', 'motos', 'MOTOS'],
  funilaria: ['funilaria', 'FUNILARIA'],
  amortecedor: ['amortecedor', 'AMORTECEDOR'],
  injecao: ['injecao', 'INJEÇÃO', 'INJECAO'],
  eletrica: ['eletrica', 'ELÉTRICA'],
  alinhamento: ['alinhamento', 'ALINHAMENTO'],
  oleo: ['oleo', 'ÓLEO', 'OLEO'],
   // revisao removido - agora é revisão premium independente
   ar_condicionado: ['ar_condicionado', 'AR-CONDICIONADO'],
  pneus: ['pneus', 'PNEUS'],
  // desmanche removido daqui — agora é aba de Gestão
  escapamento: ['escapamento', 'ESCAPAMENTO'],
  lavajato: ['lavajato', 'LAVA JATO'],
  estetica: ['estetica', 'ESTÉTICA', 'ESTETICA'],
};

const LABELS_ABAS = {
  dashboard: '📊 VISÃO GERAL', os: '🔧 O.S.',
  mecanica: '🔧 MECÂNICA', clientes: '👥 CLIENTES', hibrido: '🔋 HÍBRIDOS',
  moto: '🏍️ MOTOS', eletrico: '🔌 100% ELÉTRICOS', funilaria: '🚗 FUNILARIA',
  amortecedor: '🧰 AMORTECEDOR', injecao: '🛠️ INJEÇÃO',
  oleo: '🛢️ ÓLEO', alinhamento: '⚙️ ALINHAMENTO',
  eletrica: '⚡ ELÉTRICA', ar_condicionado: '❄️ AR-COND.', pneus: '🛞 PNEUS',
  revisaopremium: '📋 REVISÃO', // NOVO: Revisão Premium
  escapamento: '🪛 ESCAPAMENTO', estetica: '✨ ESTÉTICA',
  lavajato: '🚿 LAVA JATO',
  copiloto: '👨‍🔧 COPILOTO', secretaria: '👩‍💼 SECRETÁRIA',
  administrador: '👔 ADMINISTRADOR', contador: '📋 ASSIST. FISCAL',
  mercadolivre: '📦 COMPRAS', mercado_livre: '📦 COMPRAS',
  financeiro: '📊 FINANCEIRO', estoque: '📦 ESTOQUE',
  leads: '👥 CLIENTES', historico: '📋 HISTÓRICO',
  tarefa: '📋 TAREFA', notafiscal: '📄 NOTA FISCAL',
  retorno: '📅 RETORNO', patrimonio: '📊 PATRIMÔNIO',
  fornecedores: '🤝 FORNECEDORES', precificacao: '💰 PRECIFICAÇÃO',
  desmanche: '🏗️ DESMANCHE', // MANTER APENAS ESTA ENTRADA
  equipe: '👥 EQUIPE', config: '⚙️ AJUSTES',
  marketing: '📣 MARKETING', estrategia: '🚀 ESTRATÉGIA',
  ajuda: '❓ AJUDA', master: '👑 MASTER', meuplano: '💰 MEU PLANO',
  migracao: '👑 MIGRAÇÃO DE DADOS',
  especialista: '🛠️ ESPECIALISTA',
  burocracias: '🛡️ BUROCRACIAS',
};

const LABELS_ABAS_MODAL = {
  mecanica: 'Mecânica', clientes: 'Clientes', hibrido: 'Híbridos/Elétricos',
  moto: 'Motos', funilaria: 'Funilaria', amortecedor: 'Amortecedor',
  injecao: 'Injeção', eletrica: 'Elétrica', alinhamento: 'Alinhamento',
  oleo: 'Óleo', ar_condicionado: 'Ar-Condicionado',
  pneus: 'Pneus', desmanche: 'Desmanche', escapamento: 'Escapamento',
  lavajato: 'Lava Jato', estetica: 'Estética',
  copiloto: 'Copiloto IA', secretaria: 'Secretária IA',
  administrador: 'Administrador IA', contador: 'Assistente Fiscal IA',
  mercadolivre: 'Compras',
};

// Mapa de módulos passado ao GerenciadorDeModulos
// Componente auxiliar para renderizar a Triagem (O.S. + Lista)
const TriagemWrapper = (props) => (
  <div className="flex flex-col w-full gap-8">
    <OSModulo {...props} />
    <ListaOS {...props} />
  </div>
);

const MODULOS_MAP = {
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
   revisaopremium: RevisaoPremium, // Nova página /admin/revisao-premium
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
  mercadolivre: MercadoLivre,
  mercado_livre: MercadoLivre,
  ajuda: Ajuda,
  config: ConfiguracoesPage,
  ConfiguracoesPage: ConfiguracoesPage, // Suporte para ambos os nomes
  meuplano: ModuloMeuPlano,
  master: MasterPanel,
  fechamento_caixa: FechamentoCaixa,
  pagamentos_equipe: PagamentosEquipe,
  migracao: MigracaoDados,
  especialista: Especialista,
  burocracias: Burocracias,
};


// ─── Componente Principal ──────────────────────────────────────────────────────

export default function Admin() {
  const urlParamModo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('modo') : null;
  const storageModo = typeof localStorage !== 'undefined' ? localStorage.getItem('modoPainel') : null;
  const isLiteAtivo = urlParamModo === 'lite' || (!urlParamModo && storageModo === 'lite');
  const MenuNavegacao = isLiteAtivo ? MenuNavegacaoLite : MenuNavegacaoCompleto;
  const urlParamModo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('modo') : null;
  const storageModo = typeof localStorage !== 'undefined' ? localStorage.getItem('modoPainel') : null;
  const isLiteAtivo = urlParamModo === 'lite' || (!urlParamModo && storageModo === 'lite');
  const MenuNavegacao = isLiteAtivo ? MenuNavegacaoLite : MenuNavegacaoCompleto;
  // ── Auth Context ──────────────────────────────────────────────────────────
  const auth = useAuth();
  const {
    logado, carregandoAuth, papelLogado, permissoesLogado,
    dadosOficina, bloqueado,
    emailInput, setEmailInput,
    senhaInput, setSenhaInput,
    erroLogin, setErroLogin,
    fazerLogin, fazerLogout,
    currentUserId,
    modulosOperacionais,
    dataFimTrial,
    mostrarOnboarding,
    setDadosOficina,
    setBloqueado,
    setModulosOperacionais,
    setDataFimTrial,
    setMostrarOnboarding,
  } = auth || {};

  // ── Estado Global da O.S. (preservado entre abas) ─────────────────────────
  const [dadosOSGlobal, setDadosOSGlobal] = useState({
    placa: '', cliente: '', telefone: '',
    modelo: '', veiculo: '', oficinaId: '', km: '', senha_web: ''
  });

  // ── Navegação e UI ────────────────────────────────────────────────────────
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [setupConcluido, setSetupConcluido] = useState(false);
  const [showMLModal, setShowMLModal] = useState(false);
  const [tema, setTema] = useState('escuro');
  const [modoFoco, setModoFoco] = useState(false);

  // ── Listas de dados ───────────────────────────────────────────────────────
  const [listaCarros, setListaCarros] = useState([]);
  const [listaFinanceiro, setListaFinanceiro] = useState([]);
  const [listaEstoque, setListaEstoque] = useState([]);
  const [config, setConfig] = useState({});
  const [planosSistema, setPlanosSistema] = useState({});

  // ── Estado da O.S. em edição ──────────────────────────────────────────────
  const [osEditando, setOsEditando] = useState(null);
  const [osEmEdicao, setOsEmEdicao] = useState(null);

  // ── Formulário triagem ────────────────────────────────────────────────────
  const [nomeCliente, setNomeCliente] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [modelo, setModelo] = useState('');
  const [senhaPortal, setSenhaPortal] = useState('');
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaMercado, setBuscaMercado] = useState('');

  // ── Sub-estados de módulos ────────────────────────────────────────────────
  const [servicosAlinhamento, setServicosAlinhamento] = useState([]);
  const [extrasAlinhamento, setExtrasAlinhamento] = useState([]);
  const [estadoPneus, setEstadoPneus] = useState('bons');
  const [subAbaEletrica, setSubAbaEletrica] = useState('bateria');

  // ── Speech / Quick ────────────────────────────────────────────────────────
  const [finCampoOuvindo, setFinCampoOuvindo] = useState(false);
  const [leadCampoOuvindo, setLeadCampoOuvindo] = useState(null);

  // ── Modais e bloqueios ────────────────────────────────────────────────────
  const [toastModuloBloqueado, setToastModuloBloqueado] = useState(null);
  const [modalUpgradeAba, setModalUpgradeAba] = useState(null);
  const [modalRecuperacaoAberto, setModalRecuperacaoAberto] = useState(false);

  // ── Trial ─────────────────────────────────────────────────────────────────
  const [trialExpirou, setTrialExpirou] = useState(false);
  const trialExpiraouRef = useRef(false);

  // 🚀 GATILHO AUTOMÁTICO DO TOUR (Abre de primeira!)
  useEffect(() => {
    // Se o cliente estiver logado, o perfil estiver carregado e ele NÃO for master nem funcionário
    if (logado && dadosOficina && papelLogado !== 'master' && papelLogado !== 'funcionario') {
      // Verifica na memória se ele já terminou o tour antes
      const tourFeito = localStorage.getItem('driver_tour_finished');

      // Se ainda não fez, abre a tela do Passo 1 imediatamente
      if (tourFeito !== 'true') {
        setMostrarOnboarding(true);
      }
    }
  }, [logado, dadosOficina, papelLogado, setMostrarOnboarding]);

  useEffect(() => {
    if (currentUserId && dadosOSGlobal.oficinaId !== currentUserId) {
      localStorage.setItem('oficinaId', currentUserId);
      setDadosOSGlobal(prev => ({ ...prev, oficinaId: currentUserId }));
    }
  }, [currentUserId, dadosOSGlobal.oficinaId]);

  // Verificação de Trava de Setup Inicial (Logo, PIX e Nome)
  useEffect(() => {
    // Se dadosOficina ainda não carregou, não fazemos nada para evitar saltos
    if (!dadosOficina) return;

    const isSetupOk = !!(dadosOficina?.logo && dadosOficina?.pix && dadosOficina?.nome);
    setSetupConcluido(isSetupOk);

    // Redirecionamento automático desativado para permitir navegação livre
    // O cliente pode clicar em Visão Geral e permanecer lá mesmo sem preencher nome ou logo da oficina

  }, [dadosOficina, abaAtiva]);

  const toggleTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  // ── Modo Foco ─────────────────────────────────────────────────────────────
  const entrarModoFoco = () => { setModoFoco(true); window.scrollTo(0, 0); };
  const sairModoFoco = () => { setModoFoco(false); window.scrollTo(0, 0); };

  // ── Event Listeners globais ───────────────────────────────────────────────
  useEffect(() => {
    const handleAbrirML = () => setShowMLModal(true);
    const handleMudarAba = (e) => { setAbaAtiva(e.detail); window.scrollTo(0, 0); };
    const handleModoFoco = () => { setModoFoco(true); window.scrollTo(0, 0); };

    window.addEventListener('abrirMercadoLivreModal', handleAbrirML);
    window.addEventListener('mudarAba', handleMudarAba);
    window.addEventListener('ativarModoFoco', handleModoFoco);

    return () => {
      window.removeEventListener('abrirMercadoLivreModal', handleAbrirML);
      window.removeEventListener('mudarAba', handleMudarAba);
      window.removeEventListener('ativarModoFoco', handleModoFoco);
    };
  }, []);

  // 🧹 LIMPEZA DE CACHE - Forçar sistema a sair do loop
  useEffect(() => {
    if (!dadosOficina || dadosOficina?.papel === 'master') return;
    if (logado && currentUserId && localStorage.getItem('oficina_ia_tour_feito')) {
      console.log('🧹 Limpeza de Cache de Onboarding...');
      localStorage.removeItem('oficina_ia_tour_feito');
    }
  }, [logado, currentUserId, dadosOficina]);


  // ── Trial ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!logado || !currentUserId || !dataFimTrial) return;
    if (trialExpiraouRef.current) return;
    const fim = dataFimTrial?.toDate ? dataFimTrial.toDate() : new Date(dataFimTrial);
    if (fim >= new Date()) return;
    trialExpiraouRef.current = true;
    setTrialExpirou(true);
    updateDoc(doc(db, 'usuarios', currentUserId), {
      modulosPermitidos: null,
      dataFimTrial: null,
      plano: 'GRATUITO',
      modulosOperacionais: MODULOS_GRATIS_VITALICIOS,
    }, { merge: true }).catch(err => console.error('Erro ao expirar trial:', err));
  }, [dataFimTrial, logado, currentUserId]);

  const isTrial = useMemo(() => {
    return dadosOficina?.plano === 'trial' || !dadosOficina?.plano || dadosOficina?.plano === 'GRATUITO';
  }, [dadosOficina?.plano]);

  const isLicencaAtiva = useMemo(() => {
    // Se for master, está sempre ativo
    if (dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master') return true;

    // Se não tiver data de fim de trial e for trial/gratuito, então expirou (ou nem começou)
    if (!dataFimTrial) {
      return dadosOficina?.plano !== 'GRATUITO' && dadosOficina?.plano !== 'trial' && !!dadosOficina?.plano;
    }

    const fim = dataFimTrial?.toDate ? dataFimTrial.toDate() : new Date(dataFimTrial);
    return fim >= new Date();
  }, [dataFimTrial, dadosOficina?.plano, dadosOficina?.papel]);

  const verificarLicenca = (acao = 'esta ação') => {
    if (trialExpirou) {
      alert(`⛔ Sua assinatura expirou! Para continuar usando o sistema e ${acao}, renove agora em 💎 MEU PLANO.`);
      setAbaAtiva('meuplano');
      return false;
    }
    return true;
  };

  // ── Módulos visíveis ──────────────────────────────────────────────────────
  const modulosUsuario = useMemo(() => {
    return modulosOperacionais.length > 0
      ? modulosOperacionais
      : (dadosOficina?.modulosOperacionais || []);
  }, [modulosOperacionais, dadosOficina?.modulosOperacionais]);

  const servicosVisiveis = useMemo(() => {
    // Retorna a lista completa sem filtros para que o cliente veja todo o potencial do sistema
    return SERVICOS_ESTETICA_ABAS;
  }, []);
  // ── IDs e carga de dados ──────────────────────────────────────────────────
  const oficinaId = useMemo(() => {
    return dadosOficina?.id || currentUserId || localStorage.getItem('oficinaId');
  }, [dadosOficina, currentUserId]);


  const { carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos } =
    useCarregamentoInicial(oficinaId, {
      setListaCarros, setListaFinanceiro, setListaEstoque,
      setConfig, setPlanosSistema, logado,
    });

  // ── Sincronização em Tempo Real (O.S.) ────────────────────────────────────
  useEffect(() => {
    if (!oficinaId || !logado) return;

    const q = query(
      collection(db, 'oficinas', oficinaId, 'os'),
      orderBy('data_registro', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const novaLista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListaCarros(novaLista);
      console.log("🛠️ O.S. Sincronizadas:", novaLista.length);
    }, (error) => {
      console.error("Erro na sincronização de O.S.:", error);
    });

    return () => unsubscribe();
  }, [oficinaId, logado]);

  // ── Sincronização em Tempo Real (Financeiro) ──────────────────────────────
  useEffect(() => {
    if (!oficinaId || !logado) return;
    const q = query(collection(db, 'oficinas', oficinaId, 'financeiro'), orderBy('data', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListaFinanceiro(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [oficinaId, logado]);

  // ── Sincronização em Tempo Real (Estoque) ─────────────────────────────────
  useEffect(() => {
    if (!oficinaId || !logado) return;
    const q = query(collection(db, 'oficinas', oficinaId, 'estoque'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListaEstoque(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [oficinaId, logado]);

  useEffect(() => {
    carregarPlanos();
  }, [carregarPlanos]);

  // ── Quick Actions ─────────────────────────────────────────────────────────
  const {
    modalTarefaAberto, setModalTarefaAberto,
    tarefaRapidaTitulo, setTarefaRapidaTitulo,
    tarefaRapidaDesc, setTarefaRapidaDesc,
    tarefaRapidaData, setTarefaRapidaData,
    tarefaRapidaHora, setTarefaRapidaHora,
    salvarTarefaRapida, salvandoTarefaRapida,
    modalFinanceiroAberto, setModalFinanceiroAberto,
    finTipo, setFinTipo,
    finDesc, setFinDesc,
    finValor, setFinValor,
    finPagamento, setFinPagamento,
    salvarFinanceiroRapido, finSalvando,
    modalClienteAberto, setModalClienteAberto,
    leadNome, setLeadNome,
    leadTelefone, setLeadTelefone,
    leadProblema, setLeadProblema,
    salvarLeadRapido, leadSalvando,
  } = useQuickActions({ oficinaId, setAbaAtiva });

  // ── Helpers de O.S. ───────────────────────────────────────────────────────
  const ouvirCampo = (campo) => { setCampoOuvindo(campo); setTimeout(() => setCampoOuvindo(null), 3000); };
  const ouvirFinDesc = () => { setFinCampoOuvindo(true); setTimeout(() => setFinCampoOuvindo(false), 3000); };
  const ouvirCampoLead = (campo) => { setLeadCampoOuvindo(campo); setTimeout(() => setLeadCampoOuvindo(null), 3000); };

  const irParaNovaOS = () => {
    setOsEditando(null); setPlaca(''); setNomeCliente('');
    setTelefone(''); setModelo(''); setAbaAtiva('os');
    entrarModoFoco();
  };

  const handleSalvarOS = async () => {
    if (!verificarLicenca('salvar ordens de serviço')) return;
    setSalvandoOS(true);
    try { setSalvo(true); } catch (err) { console.error(err); } finally { setSalvandoOS(false); }
  };

  function abrirWhatsApp(url) { window.open(url, '_blank'); }

  const buscarDadosPorPlaca = async (placaDigitada, callbacks) =>
    buscarDadosPorPlacaHelper(listaCarros, placaDigitada, normalizarPlaca, callbacks);

  async function enviarWhatsApp(os, tipo = 'link') {
    let msg = '';
    const linkStatus = `${APP_BASE_URL}/status/${oficinaId}/${os.id}`;
    const valorReal = Number(os?.total || 0);
    const pixKey = config?.pixKey || '(Não configurada)';

    if (tipo === 'link') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋\nRegistramos a entrada do seu *${os.modelo}* (Placa: ${os.placa}).\n🛠️ *Serviço:* ${os.checklist || 'Avaliação'}\n💰 *Valor:* ${formatarMoeda(valorReal)}\n📸 Acompanhe aqui: ${linkStatus}`;
    } else if (tipo === 'orcamento') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋 O orçamento do seu *${os.modelo}* ficou em *${formatarMoeda(valorReal)}*.\nVeja os detalhes completos e as fotos das peças aqui:\n🔗 ${linkStatus}\nPodemos iniciar o serviço?`;
    } else if (tipo === 'pagamento') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋\nServiço concluído!\nValor: *${formatarMoeda(valorReal)}*\n💳 Chave PIX: ${pixKey}\nRecibo: ${linkStatus}`;
      const confirmar = window.confirm(`Confirmar pagamento de ${formatarMoeda(valorReal)}?`);
      if (confirmar) {
        try {
          await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
            descricao: `O.S. Paga - ${os.placa}`,
            valor: valorReal, pagamento: 'PIX',
            tipo: 'entrada', data: new Date().toISOString()
          });
          await updateDoc(doc(db, 'oficinas', oficinaId, 'os', os.id), { statusPagamento: 'pago' });
          await sincronizarRetornosAutomaticos({ oficinaId, osId: os.id, osData: { statusPagamento: 'pago' }, osBase: os });
          carregarOS(); carregarFinanceiro();
        } catch { alert('Erro ao lançar no caixa.'); }
      }
    }
    if (os.telefone) {
      abrirWhatsApp(`https://wa.me/55${os.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
    }
  }

  const abrirMercado = (os) => {
    setBuscaMercado(abrirMercadoHelper(os));
    setAbaAtiva('mercadolivre');
  };

  const iniciarEdicao = (os) => {
    const tipo = resolverTipoOS(os);
    const abaDestino = resolverAbaDestino(tipo);
    setOsEditando(os); setOsEmEdicao(os); setAbaAtiva(abaDestino);
  };

  const handleOSCriada = (setor, novaOS) => {
    const setorSeguro = setor || 'mecanica';
    const tipo = resolverTipoOS({ tipo: setorSeguro, tipoServico: setorSeguro });
    const abaDestino = resolverAbaDestino(tipo);
    setListaCarros(prev => [novaOS, ...prev]);
    setOsEditando(novaOS); setOsEmEdicao(novaOS); setAbaAtiva(abaDestino);
    setDadosOSGlobal({
      placa: novaOS.placa || '',
      veiculo: novaOS.modelo || novaOS.veiculo || '',
      cliente: novaOS.nomeCliente || novaOS.cliente || '',
      telefone: novaOS.telefone || novaOS.whatsapp || '',
      km: novaOS.km?.toString() || '',
      senha_web: novaOS.senha_web || novaOS.senha || '', // Garante compatibilidade
      data: novaOS.data || new Date().toISOString(), // Resolve o Invalid Date
      oficinaId: oficinaId || ''
    });
  };

  const fecharEdicao = () => {
    setOsEmEdicao(null); setOsEditando(null); setAbaAtiva('lista');
  };

  const salvarEdicao = async () => {
    if (!osEditando || !oficinaId) return;
    try {
      const dadosAtualizados = {
        nomeCliente: osEditando.nomeCliente,
        placa: normalizarPlaca(osEditando.placa),
        modelo: osEditando.modelo || '',
        ano: osEditando.ano || '',
        motor: osEditando.motor || '',
        checklist: osEditando.checklist,
        detalhesPecas: osEditando.detalhesPecas,
        valorPecas: osEditando.valorPecas,
        valorMaoObra: osEditando.valorMaoObra,
        total: (Number(osEditando.valorPecas) || 0) + (Number(osEditando.valorMaoObra) || 0),
        custoPecas: osEditando.custoPecas || 0,
        horasTecnicas: osEditando.horasTecnicas || 0,
        valorHoraTecnica: osEditando.valorHoraTecnica || 120,
        taxasImpostos: osEditando.taxasImpostos || 6,
        lucroLimpo: osEditando.lucroLimpo || 0,
        margemLucro: osEditando.margemLucro || 0,
        fotos: osEditando.fotos || [],
        kmAtual: osEditando.kmAtual || '',
        kmProxima: osEditando.kmProxima || '',
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osEditando.id), dadosAtualizados);
      await sincronizarRetornosAutomaticos({ oficinaId, osId: osEditando.id, osData: dadosAtualizados, osBase: osEditando });
      setListaCarros(prev => prev.map(o => o.id === osEditando.id ? { ...o, ...dadosAtualizados } : o));
      setOsEditando(null);
      alert('O.S. atualizada!');
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const deletarOS = async (id) => {
    if (!confirm('Apagar esta O.S. permanentemente?')) return;
    await deleteDoc(doc(db, 'oficinas', oficinaId, 'os', id));
    setListaCarros(prev => prev.filter(o => o.id !== id));
  };

  const moduloLiberado = (idAba) => {
    const aba = idAba?.toLowerCase();
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Se for Master, acesso total vitalício
    if (dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master' || papelLogado === 'master') return true;

    // 2. Se estiver desenvolvendo (localhost), libera TUDO para teste
    if (isLocalhost) return true;

    // 3. Abas básicas que nunca devem ser bloqueadas
    if (MODULOS_GRATIS_VITALICIOS.includes(aba)) return true;

    // 4. VERIFICAÇÃO ESTRITA PARA FUNCIONÁRIOS
    // Um funcionário NÃO PODE acessar todos os módulos premium da oficina indiscriminadamente.
    // Ele SÓ tem acesso se a sua permissão INDIVIDUAL estiver habilitada para esta aba.
    if (papelLogado === 'funcionario') {
      return permissoesLogado?.[aba] === true;
    }

    // 5. Daqui para baixo é apenas para DONOS da Oficina
    if (isTrial && isLicencaAtiva) return true;

    // 6. Verifica se é plano Premium
    if (dadosOficina?.plano === 'premium') return true;

    // 7. Verifica permissões específicas da Oficina
    const permissaoObjeto = dadosOficina?.modulos?.[aba] === true || dadosOficina?.permissoes?.[aba] === true;
    const permissaoArray = (dadosOficina?.modulosOperacionais || []).includes(aba);

    if (permissaoObjeto || permissaoArray) return true;

    // 8. Se não se encaixar em nada, bloqueia
    return false;
  };

  const lidarModuloBloqueado = (idAba) => {
    // Se estiver no período de trial com licença ativa, não bloqueia nada
    if (isTrial && isLicencaAtiva) return;

    // Se for uma aba de acesso livre, não bloqueia
    if (['dashboard', 'config', 'ajuda', 'meuplano'].includes(idAba)) return;

    // Caso contrário, mostra o modal (o componente ModuloBloqueado decidirá qual versão mostrar)
    setModalUpgradeAba(idAba);
    setToastModuloBloqueado({ tipo: 'bloqueado', aba: idAba });
  };

  const abrirRecuperacaoFinanceira = () => {
    // Fonte de dados principal (sincronizada com Firebase)
    const fonteDeDados = listaCarros || [];

    // Filtra apenas O.S. que estão pendentes (verificando múltiplos campos possíveis) e com valor maior que zero
    const devedores = fonteDeDados.filter(os => {
      const statusValue = (os.statusPagamento || os.status || os.situacao || '').toString().trim().toUpperCase();
      return statusValue === 'PENDENTE' && Number(os.total) > 0;
    });

    console.log("DEBUG RECUPERAÇÃO:", {
      totalOS: fonteDeDados.length,
      devedoresEncontrados: devedores.length,
      listaCompleta: fonteDeDados
    });

    if (devedores.length === 0) {
      alert("🎉 Ótima notícia! Não existem orçamentos pendentes com valor para recuperar no momento.");
      return;
    }

    setModalRecuperacaoAberto(true);
  };

  // ── Resumo da O.S. em edição (Maestro) ───────────────────────────────────
  const resumoEdicaoAtiva = useMemo(() => {
    if (!osEmEdicao) return null;
    const tipo = resolverTipoOS(osEmEdicao);
    const map = {
      mecanica: Mecanica, hibrido: HibridoEV, eletrico: VeiculoEletrico,
      moto: MotoModulo, funilaria: FunilariaModulo, amortecedor: AmortecedorModulo,
      injecao: InjecaoModulo, eletrica: EletricaModulo, oleo: OleoModulo,
      alinhamento: AlinhamentoModulo, revisao: RevisaoModulo, lavajato: LavaJato,
      ar_condicionado: ArCondicionado, pneus: PneusModulo, escapamento: Escapamento,
      estetica: Estetica, desmanche: Desmanche,
    };
    return { tipo, titulo: TIPO_TITULOS[tipo] || 'Mecânica', editor: map[tipo] || Mecanica };
  }, [osEmEdicao]);

  const explicacaoTriagemAtiva = useMemo(() =>
    TIPO_EXPLICACOES[resumoEdicaoAtiva?.tipo || 'mecanica'] || TIPO_EXPLICACOES.mecanica,
    [resumoEdicaoAtiva]);

  // ── Telas de estado especial ──────────────────────────────────────────────
  // Adicionado loading de segurança para identificar o papel do usuário
  if (carregandoAuth || (logado && !dadosOficina)) return (
    <div style={{ minHeight: '100vh', background: 'black', color: MAIN, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', gap: '20px' }}>
      <div style={{ width: '40px', height: '40px', border: `4px solid ${MAIN}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} className="animate-spin" />
      <div style={{ textAlign: 'center' }}>
        <p>⏳ IDENTIFICANDO PERFIL...</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Se travar aqui, verifique sua conexão ou permissões do Firebase.</p>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button
          onClick={() => {
            console.log("Forçando entrada via bypass...");
            setDadosOficina({ id: currentUserId, papel: 'master', plano: 'master', nome: 'Bypass Admin' });
          }}
          style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          🚀 ENTRAR À FORÇA (Bypass)
        </button>
        <button
          onClick={fazerLogout}
          style={{ background: 'transparent', color: MAIN, border: `1px solid ${MAIN}`, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          Sair do Sistema
        </button>
      </div>
    </div>
  );

  if (trialExpirou)
    return <TelaTrialExpirou setTrialExpirou={setTrialExpirou} />;

  if (bloqueado)
    return <TelaBloqueado bloqueado={bloqueado} MAIN={MAIN} planosSistema={planosSistema} fazerLogout={fazerLogout} />;

  if (!logado)
    return (
      <TelaLogin
        emailInput={emailInput} setEmailInput={setEmailInput}
        senhaInput={senhaInput} setSenhaInput={setSenhaInput}
        erroLogin={erroLogin} setErroLogin={setErroLogin}
        fazerLogin={fazerLogin} MAIN={MAIN} fazerLogout={fazerLogout}
      />
    );

  if (osEmEdicao) return (
    <TelaMaestro
      osEmEdicao={osEmEdicao} osEditando={osEditando}
      resumoEdicaoAtiva={resumoEdicaoAtiva}
      explicacaoTriagemAtiva={explicacaoTriagemAtiva}
      fecharEdicao={fecharEdicao} oficinaId={oficinaId}
      listaCarros={listaCarros} carregarOS={carregarOS}
      buscarDadosPorPlaca={buscarDadosPorPlaca} config={config}
      setOsEmEdicao={setOsEmEdicao} setAbaAtiva={setAbaAtiva}
      abrirWhatsApp={abrirWhatsApp}
      subAbaEletrica={subAbaEletrica} setSubAbaEletrica={setSubAbaEletrica}
      dadosOficina={dadosOficina} papelLogado={papelLogado}
      permissoesLogado={permissoesLogado} Mecanica={Mecanica}
    />
  );

  if (osEditando && !osEmEdicao) return (
    <TelaEdicaoOS
      osEditando={osEditando} setOsEditando={setOsEditando}
      fecharEdicao={fecharEdicao} salvarEdicao={salvarEdicao}
      normalizarPlaca={normalizarPlaca} SpeechTextarea={SpeechTextarea}
      GREEN={GREEN} MAIN={MAIN} oficinaId={oficinaId}
    />
  );

  // ── Render principal (Layout Shell) ───────────────────────────────────────
  const t = TEMAS[tema];

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.texto, paddingBottom: '100px', transition: 'background 0.3s' }}>

      <Header
        t={t} papelLogado={papelLogado} MASTER={MASTER} MAIN={MAIN}
        toggleTema={toggleTema} fazerLogout={fazerLogout} oficinaId={oficinaId}
        dataFimTrial={dataFimTrial} isTrial={isTrial}
      />

      <NovaOSBar
        t={t} tema={tema} MAIN={MAIN} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
        listaCarros={listaCarros} busca={busca} setBusca={setBusca}
        normalizarPlaca={normalizarPlaca}
        irParaNovaOS={irParaNovaOS}
        entrarModoFoco={entrarModoFoco}
      />
      {/* Barra de Modo Foco - Agora apenas com o indicador visual à direita */}
      {modoFoco && (
        <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-end">
          <span className="text-neutral-500 text-[10px]">MODO FOCO ATIVADO</span>
        </div>
      )}

      {/* Menu de Navegação estilo pílula - AGORA SEMPRE VISÍVEL (Removida a condição !modoFoco) */}
      <MenuNavegacao
        t={t} servicosVisiveis={servicosVisiveis}
        MAIN={MAIN} MASTER={MASTER} papelLogado={papelLogado}
        abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
        moduloLiberado={moduloLiberado}
        lidarModuloBloqueado={lidarModuloBloqueado}
        LABELS_ABAS={LABELS_ABAS}
        dadosOficina={dadosOficina}
        osEmEdicao={osEmEdicao}
      />

      <AvisoIA abaAtiva={abaAtiva} />

      {/* Gerenciador de Módulos — renderiza o conteúdo da aba ativa */}
      <GerenciadorDeModulos
        t={t}
        tema={tema}
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        setupConcluido={setupConcluido}
        dadosOSGlobal={dadosOSGlobal}
        setDadosOSGlobal={setDadosOSGlobal}
        modulos={MODULOS_MAP}
        /* Dados */
        listaCarros={listaCarros}
        listaFinanceiro={listaFinanceiro}
        listaEstoque={listaEstoque}
        config={config}
        dadosOficina={dadosOficina}
        oficinaId={oficinaId}
        papelLogado={papelLogado}
        permissoesLogado={permissoesLogado}
        dataFimTrial={dataFimTrial}
        isTrial={isTrial}
        /* Callbacks de O.S. */
        handleSalvarOS={handleSalvarOS}
        salvandoOS={salvandoOS}
        salvo={salvo}
        onSalvo={carregarOS}
        osEmEdicao={osEmEdicao}
        osParaEditar={osEditando}
        onCancelar={fecharEdicao}
        iniciarEdicao={iniciarEdicao}
        deletarOS={deletarOS}
        enviarWhatsApp={enviarWhatsApp}
        abrirWhatsApp={abrirWhatsApp}
        abrirMercado={abrirMercado}
        buscarDadosPorPlaca={buscarDadosPorPlaca}
        handleOSCriada={handleOSCriada}
        /* Formulário */
        nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
        placa={placa} setPlaca={setPlaca}
        telefone={telefone} setTelefone={setTelefone}
        modelo={modelo} setModelo={setModelo}
        senhaPortal={senhaPortal} setSenhaPortal={setSenhaPortal}
        ouvirCampo={ouvirCampo} campoOuvindo={campoOuvindo}
        normalizarPlaca={normalizarPlaca}
        formatarMoeda={formatarMoeda}
        /* Mercado */
        buscaMercado={buscaMercado}
        /* Módulos extras */
        servicosAlinhamento={servicosAlinhamento} setServicosAlinhamento={setServicosAlinhamento}
        extrasAlinhamento={extrasAlinhamento} setExtrasAlinhamento={setExtrasAlinhamento}
        estadoPneus={estadoPneus} setEstadoPneus={setEstadoPneus}
        subAbaEletrica={subAbaEletrica} setSubAbaEletrica={setSubAbaEletrica}
        toggleTema={toggleTema}
        modulosOperacionais={modulosOperacionais}
        irParaNovaOS={irParaNovaOS}
        verificarLicenca={verificarLicenca}
        abrirRecuperacaoFinanceira={abrirRecuperacaoFinanceira}
      />

      <ModuloBloqueado
        toastModuloBloqueado={toastModuloBloqueado}
        modalUpgradeAba={modalUpgradeAba}
        setToastModuloBloqueado={setToastModuloBloqueado}
        setModalUpgradeAba={setModalUpgradeAba}
        setAbaAtiva={setAbaAtiva}
        MAIN={MAIN}
        planosSistema={planosSistema}
        LABELS_ABAS_MODAL={LABELS_ABAS_MODAL}
        papelLogado={papelLogado}
      />

      <ModaisExtras
        t={t}
        tema={tema}
        QuickActions={QuickActions}
        oficinaId={oficinaId}
        GREEN={GREEN}
        modalTarefaAberto={modalTarefaAberto} setModalTarefaAberto={setModalTarefaAberto}
        tarefaRapidaTitulo={tarefaRapidaTitulo} setTarefaRapidaTitulo={setTarefaRapidaTitulo}
        tarefaRapidaDesc={tarefaRapidaDesc} setTarefaRapidaDesc={setTarefaRapidaDesc}
        tarefaRapidaData={tarefaRapidaData} setTarefaRapidaData={setTarefaRapidaData}
        tarefaRapidaHora={tarefaRapidaHora} setTarefaRapidaHora={setTarefaRapidaHora}
        salvarTarefaRapida={salvarTarefaRapida} salvandoTarefaRapida={salvandoTarefaRapida}
        modalFinanceiroAberto={modalFinanceiroAberto} setModalFinanceiroAberto={setModalFinanceiroAberto}
        finTipo={finTipo} setFinTipo={setFinTipo}
        finDesc={finDesc} setFinDesc={setFinDesc}
        finValor={finValor} setFinValor={setFinValor}
        finPagamento={finPagamento} setFinPagamento={setFinPagamento}
        salvarFinanceiroRapido={salvarFinanceiroRapido} finSalvando={finSalvando}
        modalClienteAberto={modalClienteAberto} setModalClienteAberto={setModalClienteAberto}
        leadNome={leadNome} setLeadNome={setLeadNome}
        leadTelefone={leadTelefone} setLeadTelefone={setLeadTelefone}
        leadProblema={leadProblema} setLeadProblema={setLeadProblema}
        salvarLeadRapido={salvarLeadRapido} leadSalvando={leadSalvando}
        ouvirFinDesc={ouvirFinDesc} finCampoOuvindo={finCampoOuvindo}
        ouvirCampoLead={ouvirCampoLead} leadCampoOuvindo={leadCampoOuvindo}
        carregarFinanceiro={carregarFinanceiro}
        setAbaAtiva={setAbaAtiva}
        moduloLiberado={moduloLiberado}
        lidarModuloBloqueado={lidarModuloBloqueado}
        mostrarOnboarding={mostrarOnboarding}
        setMostrarOnboarding={setMostrarOnboarding}
        setModulosOperacionais={setModulosOperacionais}
        planosSistema={planosSistema}
      />

      {/* Modal Mercado Livre */}
      {showMLModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 backdrop-blur-sm bg-black/60">
          <div className="bg-zinc-950 border-2 border-yellow-500 w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(255,230,0,0.2)] flex flex-col relative">
            <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFE600] p-2 rounded-lg">
                  <ShoppingCart size={20} color="#FFE600" />
                </div>
                <span className="font-black text-yellow-500 uppercase tracking-tighter">Central de Suprimentos IA</span>
              </div>
              <button
                onClick={() => setShowMLModal(false)}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MercadoLivre />
            </div>
            <div className={`bg-zinc-900 p-3 text-center ${tema === 'claro' ? 'text-zinc-900' : 'text-zinc-500'}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest">Tecnologia Express Auto Tech &copy; 2026</p>
            </div>
          </div>
        </div>
      )}

      <FloatingButtons
        t={t}
        abaAtiva={abaAtiva}
        moduloLiberado={moduloLiberado}
        lidarModuloBloqueado={lidarModuloBloqueado}
        setAbaAtiva={setAbaAtiva}
      />

      {/* O React SÓ vai desenhar o Tour na tela se o papel do usuário logado for estritamente 'dono' */}
      {papelLogado === 'dono' && (
        <OnboardingTour
          setAbaAtiva={setAbaAtiva}
          setMostrarOnboarding={setMostrarOnboarding}
        />
      )}
      {modalRecuperacaoAberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0f172a', border: `2px solid ${MAIN}`, borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 0 50px ${MAIN}44` }}>

            {/* Cabeçalho */}
            <div style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', margin: 0, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>💰 Recuperação de Orçamentos</h3>
              <button onClick={() => setModalRecuperacaoAberto(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            {/* Lista de Devedores */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {listaCarros
                .filter(os => {
                  const s = (os.statusPagamento || os.status || os.situacao || '').toString().trim().toUpperCase();
                  return s === 'PENDENTE' && Number(os.total) > 0;
                })
                .map(os => (
                  <div key={os.id} style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #334155' }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: 'bold', margin: '0 0 4px 0' }}>{os.nomeCliente || 'Cliente s/ nome'}</p>
                      <p style={{ color: MAIN, fontSize: '12px', fontWeight: '900', margin: 0 }}>{os.placa} • R$ {Number(os.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button
                      onClick={() => enviarWhatsApp(os, 'orcamento')}
                      style={{ background: '#22c55e', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: 'all 0.2s shadow-lg' }}
                    >
                      Recontatar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






