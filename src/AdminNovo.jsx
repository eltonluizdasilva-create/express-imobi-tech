import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from "./lib/firebase";
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

// Componentes de Interface e Admin
import { COLORS, normalizarPlaca, formatarMoeda } from './components/admin/constants';
import Dashboard, { TEMAS } from './DashboardTab';
import { TelaTrialExpirou, TelaBloqueado, TelaLogin } from './components/admin/TelasDeAcesso';
import TelaEdicaoOS from './components/admin/TelaEdicaoOS';
import Header from './components/admin/Header';
import NovaOSBar from './components/admin/NovaOSBar';
import MenuNavegacao from './components/admin/MenuNavegacao';
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
import CopilotoModulo from './components/copiloto';
import Secretaria from './components/Secretaria';
import Administrador from './components/Administrador';
import Contador from './components/Contador';
import GestaoRetorno from './components/GestaoRetorno';
import OficinaPatrimonio from './components/OficinaPatrimonio';
import Fornecedores from './components/Fornecedores';
import Ajuda from './components/Ajuda';
import MasterPanel from './components/MasterPanel';
import QuickActions from './components/QuickActions';
import ModalOnboarding from './components/ModalOnboarding';
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
import ModuloMeuPlano from './ModuloMeuPlano';
import MercadoLivre from './Mercadolivre';
import TarefaTab from './Tarefas';
import NotaFiscal from './NotaFiscal';
import AbaEstrategia from './Estrategia';
import OSModulo from './components/admin/OS';
import ListaOS from './components/admin/ListaOS';
import Precificacao from './components/admin/Precificacao';
import AbaAjudaIA from './AbaAjudaIA';

// Novo componente de gerenciamento de módulos
import GerenciadorDeModulos from './components/admin/GerenciadorDeModulos';

// ─── Constantes ────────────────────────────────────────────────────────────────

const { MAIN, GREEN, MASTER } = COLORS;
const isTrial = true;
const APP_BASE_URL = 'https://oficina.expresstech.com.br';

const SERVICOS_ESTETICA_ABAS = [
  'mecanica', 'hibrido', 'eletrico', 'moto', 'funilaria', 'amortecedor',
  'injecao', 'eletrica', 'alinhamento', 'oleo', 'revisao', 'ar_condicionado',
  'pneus', 'escapamento', 'lavajato', 'estetica'
  // 'desmanche' movido para Gestão
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
  revisao: ['revisao', 'REVISÃO', 'REVISAO'],
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
  oleo: '🛢️ ÓLEO', alinhamento: '⚙️ ALINHAMENTO', revisao: '🛡️ REVISÃO',
  eletrica: '⚡ ELÉTRICA', ar_condicionado: '❄️ AR-COND.', pneus: '🛞 PNEUS',
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
};

const LABELS_ABAS_MODAL = {
  mecanica: 'Mecânica', clientes: 'Clientes', hibrido: 'Híbridos/Elétricos',
  moto: 'Motos', funilaria: 'Funilaria', amortecedor: 'Amortecedor',
  injecao: 'Injeção', eletrica: 'Elétrica', alinhamento: 'Alinhamento',
  oleo: 'Óleo', revisao: 'Revisão', ar_condicionado: 'Ar-Condicionado',
  pneus: 'Pneus', desmanche: 'Desmanche', escapamento: 'Escapamento',
  lavajato: 'Lava Jato', estetica: 'Estética',
  copiloto: 'Copiloto IA', secretaria: 'Secretária IA',
  administrador: 'Administrador IA', contador: 'Assistente Fiscal IA',
  mercadolivre: 'Compras',
};

// Mapa de módulos passado ao GerenciadorDeModulos
const MODULOS_MAP = {
  Mecanica, HibridoEV, VeiculoEletrico, MotoModulo, FunilariaModulo,
  AmortecedorModulo, InjecaoModulo, EletricaModulo, OleoModulo,
  AlinhamentoModulo, RevisaoModulo, ArCondicionado, PneusModulo,
  Escapamento, Estetica, LavaJato, Desmanche, CopilotoModulo,
  Secretaria, Administrador, Contador, MarketingModulo, MercadoLivre,
  Financeiro, Estoque, LeadsPage, Historico, Equipe,
  ConfiguracoesPage, ModuloMeuPlano, MasterPanel, Dashboard,
  OSModulo, ListaOS, Precificacao, GestaoRetorno, OficinaPatrimonio,
  Fornecedores, Ajuda, AbaEstrategia, TarefaTab, NotaFiscal, AbaAjudaIA,
};

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function Admin() {
  // ── Cleanup Onboarding ──────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('driver_tour_finished', 'true');
    console.log("Limpeza de Cache de Onboarding executada com sucesso.");
  }, []);

  // ── Auth Context ──────────────────────────────────────────────────────────
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
  } = useAuth();

  // ── Estado Global da O.S. (preservado entre abas) ─────────────────────────
  const [dadosOSGlobal, setDadosOSGlobal] = useState({
    placa: '', cliente: '', telefone: '',
    modelo: '', veiculo: '', oficinaId: '', km: '', senha_web: ''
  });

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('oficinaId', currentUserId);
      setDadosOSGlobal(prev => ({ ...prev, oficinaId: currentUserId }));
    }
  }, [currentUserId]);

  // ── Navegação e UI ────────────────────────────────────────────────────────
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [showMLModal, setShowMLModal] = useState(false);
  const [tema, setTema] = useState('escuro');
  const toggleTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');

  // ── Modo Foco ─────────────────────────────────────────────────────────────
  const [modoFoco, setModoFoco] = useState(false);
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
    if (logado && currentUserId) {
      console.log('🧹 Limpeza de Cache de Onboarding...');
      localStorage.removeItem('oficina_ia_tour_feito');
      // localStorage.removeItem(`onboarding_complete_${currentUserId}`); // O banco agora é o mestre com ramoAtuacao
    }
  }, [logado, currentUserId]);

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

  // ── Trial ─────────────────────────────────────────────────────────────────
  const [trialExpirou, setTrialExpirou] = useState(false);
  const trialExpiraouRef = useRef(false);

  useEffect(() => {
    if (!logado || !currentUserId || !dataFimTrial) return;
    if (trialExpiraouRef.current) return;
    const fim = dataFimTrial instanceof Date ? dataFimTrial : new Date(dataFimTrial);
    if (fim >= new Date()) return;
    trialExpiraouRef.current = true;
    setTrialExpirou(true);
    updateDoc(doc(db, 'usuarios', currentUserId), {
      modulosPermitidos: null, dataFimTrial: null,
    }, { merge: true }).catch(err => console.error('Erro ao expirar trial:', err));
  }, [dataFimTrial, logado, currentUserId]);

  const isLicencaAtiva = useMemo(() => {
    if (!dataFimTrial) return true;
    const fim = dataFimTrial instanceof Date ? dataFimTrial : new Date(dataFimTrial);
    return fim >= new Date();
  }, [dataFimTrial]);

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
    const modulosNormalizados = new Set(
      modulosUsuario.filter(Boolean).map(m => String(m).trim().toLowerCase())
    );
    return SERVICOS_ESTETICA_ABAS.filter(aba =>
      (MAPA_MODULOS_SERVICOS[aba] || [aba]).some(nome =>
        modulosNormalizados.has(String(nome).trim().toLowerCase())
      )
    );
  }, [modulosUsuario]);

  // ── IDs e carga de dados ──────────────────────────────────────────────────
  const oficinaId = useMemo(() => {
    return dadosOficina?.id || localStorage.getItem('oficinaId');
  }, [dadosOficina]);

  const { carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos } =
    useCarregamentoInicial(oficinaId, {
      setListaCarros, setListaFinanceiro, setListaEstoque,
      setConfig, setPlanosSistema, logado,
    });

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
      modelo: novaOS.modelo || novaOS.veiculo || '',
      cliente: novaOS.nomeCliente || novaOS.cliente || '',
      telefone: novaOS.telefone || novaOS.whatsapp || '',
      km: novaOS.km?.toString() || novaOS.kmAtual?.toString() || '',
      senha_web: novaOS.senha_web || novaOS.senhaConsulta || '',
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
    if (isTrial) return true;
    if (dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master') return true;
    if (dadosOficina?.modulosPermitidos === 'ALL') return true;

    // Lógica para Plano Gratuito
    if (dadosOficina?.plano === 'GRATUITO') {
      const modulosGratis = ['dashboard', 'clientes', 'os', 'oleo', 'alinhamento'];
      if (modulosGratis.includes(idAba)) return true;
      return false;
    }

    const abasVitais = ['dashboard', 'mecanica', 'clientes', 'ajuda', 'meuplano', 'config'];
    if (abasVitais.includes(idAba)) return true;
    if ((dadosOficina?.modulosOperacionais || []).includes(idAba)) return true;
    return false;
  };

  const lidarModuloBloqueado = (aba) => {
    if (isTrial) return;
    if (dadosOficina?.plano === 'master' || dadosOficina?.plano === 'prime') return;
    setModalUpgradeAba(aba);
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
  if (carregandoAuth) return (
    <div style={{ minHeight: '100vh', background: 'black', color: MAIN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
      ⏳ INICIANDO SISTEMA...
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
      />

      <NovaOSBar
        t={t} MAIN={MAIN} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva}
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
      />

      <AvisoIA abaAtiva={abaAtiva} />

      {/* Gerenciador de Módulos — renderiza o conteúdo da aba ativa */}
      <GerenciadorDeModulos
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
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
        tema={tema} toggleTema={toggleTema}
        modulosOperacionais={modulosOperacionais}
        irParaNovaOS={irParaNovaOS}
        verificarLicenca={verificarLicenca}
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
      />

      <ModaisExtras
        QuickActions={QuickActions}
        ModalOnboarding={ModalOnboarding}
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
            <div className="bg-zinc-900 p-3 text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tecnologia Express Auto Tech &copy; 2026</p>
            </div>
          </div>
        </div>
      )}

      <FloatingButtons abaAtiva={abaAtiva} />

      <OnboardingTour
        setAbaAtiva={setAbaAtiva}
        setMostrarOnboarding={setMostrarOnboarding}
        modalBemVindoAberto={mostrarOnboarding}
      />
    </div>
  );
}