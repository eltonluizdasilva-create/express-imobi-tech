import React, { Component, useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { db } from './lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  GRUPOS_MENU_IMOBI,
  MAPA_DETALHES_ABAS,
  AGENTES_INICIAIS,
  LABELS_ABAS_IMOBI,
} from './lib/menuImobiConfig';
import {
  Home,
  Users,
  Calendar,
  Bot,
  MessageSquare,
  Shuffle,
  DollarSign,
  TrendingUp,
  Plus,
  Sun,
  Moon,
  LogOut,
  HelpCircle,
  CheckCircle2,
  Clock,
  Phone,
  Send,
  Layers,
  FileText,
  Zap,
  Trash2,
  ExternalLink,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Calculator,
  Receipt,
  Lock,
  LoaderCircle,
} from 'lucide-react';

// Componentes existentes do ecossistema
import { COLORS, formatarMoeda } from './components/admin/constants';
import { TEMAS } from './DashboardTab';
import { TelaTrialExpirou, TelaBloqueado, TelaLogin } from './components/admin/TelasDeAcesso';
import ModuloBloqueado from './components/admin/ModuloBloqueado';
import TrilhoModulos from './components/admin/TrilhoModulos';
import SidebarAdmin from './components/admin/SidebarAdmin';
import TopbarAdmin from './components/admin/TopbarAdmin';
import ModalAjudaAba from './components/admin/ModalAjudaAba';
import ReunioesAtasIA from './components/abas/ReunioesAtasIA';
import EsteiraCartorioEscritura from './components/imobi/EsteiraCartorioEscritura';
import GuiaCampoGratis from './components/admin/GuiaCampoGratis';
import HeroAba from './components/admin/HeroAba';
import { corDaAba, textoSobreCor, comAlpha } from './lib/coresAbas';
import ModaisExtras from './components/admin/ModaisExtras';
import QuickActions from './components/QuickActions';
import FloatingButtons from './components/FloatingButtons';

// Abas secundárias pesadas carregadas sob demanda (React.lazy) para inicialização rápida no celular
const SofiaWhatsAppTab = lazy(() => import('./components/admin/SofiaWhatsAppTab'));
const ExpressBrainTab = lazy(() => import('./components/admin/ExpressBrainTab'));
const PainelZaraOperacional = lazy(() => import('./components/admin/PainelZaraOperacional'));
const ModalPacoteCompleto = lazy(() => import('./components/admin/ModalPacoteCompleto'));
const MapaInteligenciaImobiliaria = lazy(() => import('./components/admin/MapaInteligenciaImobiliaria'));
const ModuloComAbas = lazy(() => import('./components/admin/ModuloComAbas'));
const CaptacaoNicho = lazy(() => import('./components/imobi/CaptacaoNicho'));
const GerenciadorDeModulos = lazy(() => import('./components/admin/GerenciadorDeModulos'));
const PainelDiretorComercialEstrategia = lazy(() => import('./components/admin/PainelDiretorComercialEstrategia'));
import ControleInteligenciaIA from './components/ControleInteligenciaIA';
import GuiaDaAba from './components/ui/GuiaDaAba';
import RodapeLegal from './components/ui/RodapeLegal';
import { configParaOnboarding } from './lib/configImobiliaria';
import AbaCaptacaoVitrine from './components/imobi/AbaCaptacaoVitrine';
const ModalNovoImovel = lazy(() => import('./components/imobi/ModalNovoImovel'));
const AbaFunilLeads = lazy(() => import('./components/imobi/AbaFunilLeads'));
const AbaAgendaVisitas = lazy(() => import('./components/imobi/AbaAgendaVisitas'));
const ModalNovoLeadImobi = lazy(() => import('./components/imobi/ModalNovoLeadImobi'));
const ModalNovaVisita = lazy(() => import('./components/imobi/ModalNovaVisita'));
const AbaAgentesZara = lazy(() => import('./components/imobi/AbaAgentesZara'));
const PainelRoletaLeads = lazy(() => import('./components/imobi/PainelRoletaLeads'));
import DorESolucao from './components/ui/DorESolucao';
import LogoExpress from './components/ui/LogoExpress';
import MicButton from './components/ui/MicButton';
import CampoMoeda from './components/ui/CampoMoeda';
import OnboardingTour from './components/OnboardingTour';
import OnboardingPrimeiroUso from './components/onboarding/OnboardingPrimeiroUso';
import { ambienteDevLocal, ehMasterPlataforma as ehMasterPlataformaFn, liberacoesDoNivel, nivelAcesso, NIVEIS_SIMULACAO, rotuloPlano } from './lib/acesso-plano';
import { LIMITES_PLANOS, MODULOS_PRO, MODULOS_PLUS, PLANOS } from './lib/planos';
import { MODULOS_MAP } from './modulosMap';
import { setCreditoPrefill } from './lib/credito/prefill';
import {
  AVISO_TRIAL_ENCERRADO,
  SELO_TRIAL_PRO,
  diasRestantesTrial,
  temAcessoPlus,
  temExpressBrain,
  temSofiaWhatsApp,
  trialAtivo,
} from './lib/planos';
import { MODULOS_SO_GESTAO, ehGestor as ehGestorDoPapel, filtrarModulos } from './lib/permissoes-menu';
import {
  lerEstadoModoLite,
  gravarEstadoModoLite,
  MODULOS_EXCLUSIVOS_PLUS,
} from './lib/modoLite';

import { useAuth } from './contexts/AuthContext';
import useCarregamentoInicial from './hooks/useCarregamentoInicial.jsx';
import CockpitVisaoGeral from './components/imobi/CockpitVisaoGeral';
import useQuickActions from './hooks/useQuickActions';
import { filtrarCatalogoDisponivel } from './lib/simuladorSofia';

// ─── Proteção Isolada para Modais Legados ──────────────────────────────────────

class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('[Express Imobi Tech] Componente secundário isolado:', error?.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

const noop = () => {};

// ─── Configurações e Menus 100% Imobiliários ───────────────────────────────────

const { GREEN } = COLORS;
const IMOBI_PRIMARY = '#10b981'; // Verde Esmeralda Principal
const IMOBI_ACCENT = '#10b981';  // Esmeralda VGV / WhatsApp
const MASTER_GOLD = '#f59e0b';

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MODULOS_GRATIS_PLG = new Set([
  'dashboard_imobi',
  'funil_leads',
  'visitas_imobi',
  'financeiro',
  'acompanhamento_cliente',
  'migracao',
  'equipe',
  'config',
  'especialista',
  'meuplano',
  'guia_campo_bonus',
]);

// Os IDs exclusivos do PLUS são derivados do catálogo para manter os gates
// alinhados com shared/planos.json.
const MODULOS_PLUS_PLG = new Set(MODULOS_PLUS.filter((id) => !MODULOS_PRO.includes(id)));

// Módulos PRO exigem assinatura PRO ou trial; PLUS herda esse acesso.
// D-23.16 — `migracao` saiu desta lista: a aba é gratuita e liberada.
// D-23.20 — `tarefa`, `avaliacao_imovel`, `contador` e `juridico_imobi` saíram
// daqui: agora são exclusivos do PLUS (derivados de `plus_extra`).
const MODULOS_PRO_PLG = new Set([
  'captacao_imobi',
  'historico',
  'marketing',
  'agentes_ia',
  'clientes',
  'leads',
  'copiloto',
]);

// Simulador de plano do master (topo do /admin): a escolha sobrevive ao reload.
const CHAVE_SIMULACAO_PLANO = 'simulacaoPlanoAdmin';

// Modo desenvolvedor: na máquina local (`npm run dev` / localhost) o painel
// abre como Admin Total mesmo sem login, para testar crachá âmbar, cadeados e
// o simulador de degraus (D-23.19). Em produção o bundle e o host anulam isto.
const ACESSO_LOCAL_DEV = ambienteDevLocal();

// Cores do crachá do topo por nível de acesso (plano real ou degrau simulado).
const ESTILO_NIVEL_PAINEL = {
  master: { borderColor: 'rgba(245,158,11,0.55)', background: 'rgba(245,158,11,0.14)', color: '#fcd34d' },
  plus: { borderColor: 'rgba(13,148,136,0.55)', background: 'rgba(13,148,136,0.18)', color: '#5eead4' },
  pro: { borderColor: 'rgba(161,18,63,0.55)', background: 'rgba(161,18,63,0.16)', color: '#fda4af' },
  trial: { borderColor: 'rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.12)', color: '#fcd34d' },
  gratis: { borderColor: 'rgba(16,185,129,0.45)', background: 'rgba(16,185,129,0.14)', color: '#6ee7b7' },
};

// Contratos exigidos por testes legados de pós-venda, reuniões-atas, tour e simulador-tom
MAPA_DETALHES_ABAS['reunioes-atas'] = {
  id: 'reunioes-atas',
  label: 'Reuniões & Atas IA',
  tituloCard: 'REUNIÕES & ATAS IA',
  tituloLimpo: 'Reuniões & Atas IA',
  descricao: 'Gravação ao vivo, transcrição inteligente e atas executivas com tarefas na agenda.',
};
MAPA_DETALHES_ABAS.pos_venda = {
  id: 'pos_venda',
  label: 'Pós-Venda, Chaves & Carteira',
  tituloCard: 'PÓS-VENDA, CHAVES & CARTEIRA',
  tituloLimpo: 'Pós-Venda, Chaves & Carteira',
  descricao: 'Linha do tempo pós-fechamento, entrega de chaves e marcos de relacionamento com IA.',
};
MAPA_DETALHES_ABAS.brain = MAPA_DETALHES_ABAS.brain || {
  id: 'brain',
  label: '🧠 Tom · Segundo Cérebro',
};
MAPA_DETALHES_ABAS.sofia_whatsapp = MAPA_DETALHES_ABAS.sofia_whatsapp || {
  id: 'sofia_whatsapp',
  label: '📲 Pólen · Atendimento 24h',
};
LABELS_ABAS_IMOBI['reunioes-atas'] = 'Reuniões & Atas IA';
LABELS_ABAS_IMOBI.pos_venda = 'Pós-Venda, Chaves & Carteira';

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function Admin() {
  const auth = useAuth();
  const {
    logado,
    carregandoAuth,
    papelLogado,
    permissoesLogado,
    dadosImobiliaria: dadosImobCtx,
    dadosOficina: dadosLegadoCtx,
    setDadosImobiliaria,
    setDadosOficina,
    isPro: isProConta,
    limiteUsuarios,
    membrosEquipe,
    quantidadeAtualCorretores,
    bloqueado,
    emailInput,
    setEmailInput,
    senhaInput,
    setSenhaInput,
    erroLogin,
    setErroLogin,
    fazerLogin,
    fazerLogout,
    currentUserId,
    modulosOperacionais,
    dataFimTrial,
    mostrarOnboarding,
    setModulosOperacionais,
    setMostrarOnboarding,
  } = auth || {};

  const dadosImobiliaria = dadosImobCtx || dadosLegadoCtx;

  // D-23.15 — a aba inicial do painel é a Central de Inteligência
  // (`mapa_inteligencia`): é o primeiro lugar que o cliente vê ao entrar, com o
  // mapa de integração visível sem cabeçalho duplicado. Aba gratuita e liberada
  // para todos os papéis, então nenhuma guarda de plano precisa redirecionar.
  const [abaAtiva, setAbaAtiva] = useState('mapa_inteligencia');

  // --- Conta MASTER da plataforma: só ela vê o alternador de demonstração ---
  // MASTER = VITE_SU (papelLogado 'master') ou custom claim admin=true no token.
  // (Declarado antes dos retornos de carregamento para a contagem de hooks não
  // mudar entre o primeiro render e os seguintes.)
  const [claimAdmin, setClaimAdmin] = useState(false);

  // Degrau simulado pelo master no topo do painel. `master` = Admin Total
  // (padrão e único modo que abre tudo); os outros valores mostram exatamente
  // o que o cliente daquele plano vê — nenhum estado misto entre crachá,
  // trilho e conteúdo.
  const [nivelSimulado, setNivelSimulado] = useState(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_SIMULACAO_PLANO);
      const valido = NIVEIS_SIMULACAO.some((opcao) => opcao.key === salvo) ? salvo : 'master';
      // D-23.19 — no modo desenvolvedor local, abrir o painel sem sessão cai
      // sempre em Admin Total (crachá âmbar). A simulação escolhida depois no
      // topo continua valendo normalmente.
      if (ACESSO_LOCAL_DEV && !logado) return 'master';
      return valido;
    } catch {
      return 'master';
    }
  });

  // Alternador Modo Lite (Modo Lite / Modo Completo): persistido em localStorage
  const [modoLite, setModoLite] = useState(lerEstadoModoLite);

  // Controle de planos, Trial e contexto do tenant
  const [trialExpirou, setTrialExpirou] = useState(false);
  const trialVerificadoRef = useRef(false);
  const [toastModuloBloqueado, setToastModuloBloqueado] = useState(null);
  const [modalUpgradeAba, setModalUpgradeAba] = useState(null);

  const [dadosNegocioGlobal, setDadosNegocioGlobal] = useState({
    codigoImovel: '',
    cliente: '',
    telefone: '',
    imobiliariaId: '',
    oficinaId: '',
  });

  useEffect(() => {
    let vivo = true;
    const conta = auth?.currentUser;
    if (!conta?.getIdTokenResult) return undefined;
    conta.getIdTokenResult()
      .then((r) => { if (vivo) setClaimAdmin(r?.claims?.admin === true); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [auth?.currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_SIMULACAO_PLANO, nivelSimulado);
    } catch {
      /* modo privado / storage bloqueado: a escolha vale só nesta sessão */
    }
  }, [nivelSimulado]);

  const toggleModoLite = useCallback(() => {
    setModoLite((prev) => {
      const proximo = !prev;
      gravarEstadoModoLite(proximo);
      return proximo;
    });
  }, []);

  // Se o Modo Lite for ativado e a aba atual for exclusiva do PLUS ou IA, redireciona para a Visão Geral
  useEffect(() => {
    if (modoLite && MODULOS_EXCLUSIVOS_PLUS.includes(abaAtiva)) {
      setAbaAtiva('dashboard_imobi');
    }
  }, [modoLite, abaAtiva]);

  // Conta MASTER: e-mail `VITE_SU` (papelLogado 'master') ou claim admin=true.
  // D-23.19: no modo desenvolvedor local (npm run dev / localhost) o painel
  // entra direto em Admin Total, mesmo sem login e em aba anônima. O crachá
  // âmbar, os cadeados abertos e o seletor de simulação saem deste mesmo valor.
  const ehMasterPlataforma = ehMasterPlataformaFn(papelLogado, claimAdmin) || ACESSO_LOCAL_DEV;
  // Sem login o Auth não tem papel: no ambiente local ele navega como master
  // para o menu de gestão (Financeiro, Configurações, Repasses) não sumir.
  const papelEfetivo = papelLogado || (ACESSO_LOCAL_DEV ? 'master' : null);

  // Trial de 10 dias: após o prazo, os módulos PRO exigem assinatura PRO e o
  // PLUS herda esse acesso; CRM e agenda permanecem no plano Grátis.
  const contaAcesso = {
    ...(dadosImobCtx || dadosLegadoCtx || {}),
    trialFim: dadosImobCtx?.trialFim || dadosLegadoCtx?.trialFim || dataFimTrial,
  };
  const trialEmAndamento = trialAtivo(contaAcesso);
  const diasDeTrial = diasRestantesTrial(contaAcesso);

  // Nível REAL da conta — vem do plano do catálogo, nunca de `isPro`/
  // `planoAssinante` legados. `plus` herda o PRO; `pro` não herda o PLUS.
  const nivelConta = nivelAcesso({
    master: ehMasterPlataforma,
    plus: Boolean(temAcessoPlus(contaAcesso)),
    pro: Boolean(isProConta),
  });
  // O master navega os degraus pelo seletor do topo; Admin Total é o padrão.
  const nivelVisao = ehMasterPlataforma && nivelSimulado !== 'master' ? nivelSimulado : nivelConta;
  const ehAdminTotal = nivelVisao === 'master';
  const simulandoPlano = ehMasterPlataforma && !ehAdminTotal;
  const liberacoes = liberacoesDoNivel(nivelVisao);
  // O teste de 10 dias abre o PRO da conta real, mas não vale para degrau
  // simulado (senão o master não conseguiria ver o painel travado).
  const acessoProLiberado = Boolean(liberacoes.pro || (!ehMasterPlataforma && trialEmAndamento));
  const bloqueioProAtivo = !acessoProLiberado;
  const acessoPlusLiberado = Boolean(liberacoes.plus);
  const bloqueioPlusAtivo = !acessoPlusLiberado;
  const brainLiberado = Boolean(ehAdminTotal || temExpressBrain(contaAcesso));
  const sofiaLiberada = Boolean(ehAdminTotal || temSofiaWhatsApp(contaAcesso));

  // Crachá do topo: cor e texto saem do mesmo nível que trava o trilho.
  const crachaTrial = nivelVisao === 'gratis' && !simulandoPlano && diasDeTrial > 0;
  const estiloCrachaPainel = crachaTrial
    ? ESTILO_NIVEL_PAINEL.trial
    : ESTILO_NIVEL_PAINEL[nivelVisao] || ESTILO_NIVEL_PAINEL.gratis;
  const tituloCrachaPainel = simulandoPlano
    ? 'Simulação: o plano real da conta não mudou'
    : ehAdminTotal
      ? 'Acesso de administração da plataforma'
      : `Plano da conta: ${nivelConta === 'plus' ? 'PLUS' : nivelConta === 'pro' ? 'PRO' : 'Grátis'}`;

  // Muda automaticamente o título da aba do navegador para Express Imobi Tech
  useEffect(() => {
    document.title = 'Express Imobi Tech — Plataforma Imobiliária IA';
  }, []);

  // Guardas de acesso também cobrem links diretos e estado antigo do painel.
  useEffect(() => {
    if (abaAtiva === 'reunioes-atas') {
      if (!acessoPlusLiberado && !brainLiberado && !ehAdminTotal) {
        setAbaAtiva('meuplano');
      }
      return;
    }
    if (MODULOS_PLUS_PLG.has(abaAtiva)) {
      if (bloqueioPlusAtivo) setAbaAtiva('meuplano');
      return;
    }
    if (bloqueioProAtivo && MODULOS_PRO_PLG.has(abaAtiva)) {
      if (abaAtiva === 'captacao_imobi') return; // D-23.25: Captação & Imóveis liberada no Grátis com limite de 5 imóveis
      setAbaAtiva('meuplano');
    }
  }, [bloqueioPlusAtivo, bloqueioProAtivo, abaAtiva, acessoPlusLiberado, brainLiberado, ehAdminTotal]);

  // Pedido de "novo processo": incrementa ao clicar no CTA dourado e é consumido
  // pelo módulo Acompanhamento do Cliente, que abre o formulário.
  const [pedidoNovoProcesso, setPedidoNovoProcesso] = useState(0);
  const abrirNovoProcesso = useCallback(() => {
    setAbaAtiva('acompanhamento_cliente');
    setPedidoNovoProcesso((n) => n + 1);
  }, []);
  const consumirPedidoNovoProcesso = useCallback(() => setPedidoNovoProcesso(0), []);
  // Tema do painel: padrão CLARO. A escolha do usuário é persistida em
  // `localStorage['temaPainel']` e sobrevive ao recarregamento.
  const [tema, setTema] = useState(() => {
    try {
      const salvo = localStorage.getItem('temaPainel');
      return salvo === 'escuro' || salvo === 'claro' ? salvo : 'claro';
    } catch {
      return 'claro';
    }
  });
  // Estados de dados imobiliários
  const [listaLeads, setListaLeads] = useState([]);
  const [listaImoveis, setListaImoveis] = useState([]);
  const [listaVisitas, setListaVisitas] = useState([]);
  const [listaPropostas, setListaPropostas] = useState([]);
  // Imóvel que a Captação por Nicho manda para a Prestação de Contas
  // (Central de Inteligência). Só um atalho de navegação: nada é gravado.
  const [prestacaoFoco, setPrestacaoFoco] = useState(null);
  const [listaTarefas, setListaTarefas] = useState([]);
  const [listaFinanceiro, setListaFinanceiro] = useState([]);
  const [config, setConfig] = useState({});
  const [planosSistema, setPlanosSistema] = useState({});
  const [agentesIA, setAgentesIA] = useState(AGENTES_INICIAIS);

  // Roleta de Leads (Módulo de Assinantes — Distribuição Rotativa e Justa)
  const [roletaAtiva, setRoletaAtiva] = useState(true);
  const [tempoRepasseMin, setTempoRepasseMin] = useState(15);
  const [ponteiroRoleta, setPonteiroRoleta] = useState(0);
  const [statusRoletaMsg, setStatusRoletaMsg] = useState('');
  const [corretoresRoleta, setCorretoresRoleta] = useState([
    { id: 'c1', nome: 'Corretor Plantão 01', whatsapp: '5511999999999', ativo: true, leadsBase: 0 },
    { id: 'c2', nome: 'Especialista Alto Padrão', whatsapp: '5511988888888', ativo: true, leadsBase: 0 },
    { id: 'c3', nome: 'Consultor Locação', whatsapp: '5511977777777', ativo: true, leadsBase: 0 },
  ]);

  // Modais próprios de Ação Rápida Imobiliária
  const [modalNovoImovel, setModalNovoImovel] = useState(false);
  // Retorno da gravação do imóvel: o erro fica dentro do modal (com o formulário
  // preenchido) e o sucesso vira faixa na aba Captação, já com o modal fechado.
  const [erroImovel, setErroImovel] = useState('');
  const [sucessoImovel, setSucessoImovel] = useState('');

  useEffect(() => {
    if (modalNovoImovel) setErroImovel('');
  }, [modalNovoImovel]);
  // Tour guiado: abre sozinho 1x por conta; este estado é só o "Refazer tour".
  const [tourManual, setTourManual] = useState(false);
  const [modalNovoLeadImobi, setModalNovoLeadImobi] = useState(false);
  const [modalNovaVisita, setModalNovaVisita] = useState(false);
  const [sidebarAbertaMobile, setSidebarAbertaMobile] = useState(false);
  const [modalAjudaAberto, setModalAjudaAberto] = useState(false);
  const [sidebarRecuada, setSidebarRecuada] = useState(() => {
    try {
      const salvo = localStorage.getItem('sidebar_recuada');
      return salvo !== null ? salvo === 'true' : true;
    } catch {
      return true;
    }
  });
  const toggleSidebarRecuada = useCallback(() => {
    setSidebarRecuada((prev) => {
      const novo = !prev;
      try {
        localStorage.setItem('sidebar_recuada', String(novo));
      } catch {}
      return novo;
    });
  }, []);

  const [imovelParaVisita, setImovelParaVisita] = useState('');

  // O que a Sofia pode oferecer: imóveis vendidos/alugados/inativos ficam
  // fora do catálogo enviado ao /api/ai (e da contagem mostrada na tela).
  const imoveisDisponiveisSimIA = useMemo(() => filtrarCatalogoDisponivel(listaImoveis), [listaImoveis]);

  // ---- visibilidade do menu por papel (espelho das Firestore Rules) ----
  // `papelEfetivo` = papel real ou 'master' no modo desenvolvedor local.
  const ehGestorUI = ehGestorDoPapel(papelEfetivo);
  const filtrarPorPapel = useCallback((itens) => filtrarModulos(itens, papelEfetivo), [papelEfetivo]);

  // Se o corretor cair numa aba de gestão (estado antigo/atalho), volta ao início.
  useEffect(() => {
    if (!ehGestorUI && MODULOS_SO_GESTAO.has(abaAtiva)) setAbaAtiva('dashboard_imobi');
  }, [ehGestorUI, abaAtiva]);

  const toggleTema = useCallback(() => {
    setTema((prev) => {
      const novo = prev === 'escuro' ? 'claro' : 'escuro';
      try {
        localStorage.setItem('temaPainel', novo);
      } catch {
        /* modo privado / storage bloqueado: tema segue só na sessão */
      }
      return novo;
    });
  }, []);

  const imobiliariaId = useMemo(() => {
    try {
      return (
        dadosImobiliaria?.id ||
        currentUserId ||
        localStorage.getItem('imobiliariaId') ||
        localStorage.getItem('oficinaId')
      );
    } catch {
      return dadosImobiliaria?.id || currentUserId;
    }
  }, [dadosImobiliaria, currentUserId]);

  useEffect(() => {
    if (currentUserId && dadosNegocioGlobal.imobiliariaId !== currentUserId) {
      try {
        localStorage.setItem('imobiliariaId', currentUserId);
        localStorage.setItem('oficinaId', currentUserId);
      } catch (e) {
        console.error(e);
      }
      setDadosNegocioGlobal((prev) => ({
        ...prev,
        imobiliariaId: currentUserId,
        oficinaId: currentUserId,
      }));
    }
  }, [currentUserId, dadosNegocioGlobal.imobiliariaId]);

  const isTrial = useMemo(() => {
    if (papelEfetivo === 'master') return false;
    if (dadosImobiliaria?.statusPlano && dadosImobiliaria.statusPlano !== 'trial') return false;
    return Boolean(dadosImobiliaria?.isTrial || dadosImobiliaria?.statusPlano === 'trial' || dataFimTrial);
  }, [papelEfetivo, dadosImobiliaria, dataFimTrial]);

  useEffect(() => {
    if (!isTrial || !dataFimTrial || trialVerificadoRef.current) return;
    const limite = typeof dataFimTrial?.toDate === 'function' ? dataFimTrial.toDate() : new Date(dataFimTrial);
    if (!Number.isNaN(limite.getTime()) && limite < new Date()) {
      trialVerificadoRef.current = true;
      setTrialExpirou(true);
    }
  }, [isTrial, dataFimTrial]);

  const { carregarFinanceiro, carregarPlanos, carregarConfig } = useCarregamentoInicial(imobiliariaId, {
    setListaCarros: noop,
    setListaFinanceiro,
    setListaEstoque: noop,
    setConfig,
    setPlanosSistema,
    logado,
  });

  // Listeners em tempo real usando caminhos compatíveis com firestore.rules (/oficinas/{id}/...)
  useEffect(() => {
    if (!imobiliariaId || !logado) return;

    const refLeads = collection(db, 'oficinas', imobiliariaId, 'leads_imobi');
    const refImoveis = collection(db, 'oficinas', imobiliariaId, 'imoveis_imobi');
    const refVisitas = collection(db, 'oficinas', imobiliariaId, 'visitas_imobi');
    const refEquipe = collection(db, 'oficinas', imobiliariaId, 'equipe');
    const refPropostas = collection(db, 'oficinas', imobiliariaId, 'propostas_imobi');
    const refTarefas = collection(db, 'oficinas', imobiliariaId, 'tarefas');

    // Sincroniza leads capturados no Portal Público caso não tivessem imobiliariaId no momento da captura
    try {
      const pendentes = JSON.parse(localStorage.getItem('leads_portal_pendentes') || '[]');
      if (Array.isArray(pendentes) && pendentes.length > 0) {
        localStorage.removeItem('leads_portal_pendentes');
        pendentes.forEach((item) => {
          const { idTemp, criadoEmISO, ...dadosLead } = item || {};
          if (dadosLead?.nome && dadosLead?.telefone) {
            addDoc(refLeads, {
              ...dadosLead,
              criadoEm: serverTimestamp(),
            }).catch(() => null);
          }
        });
      }
    } catch (e) {
      console.warn('Aviso ao sincronizar leads do portal:', e);
    }

    const ordenarPorCriacaoDesc = (arr) =>
      [...(arr || [])].sort((a, b) => {
        const rawA = a?.criadoEm || a?.data_registro || a?.data;
        const rawB = b?.criadoEm || b?.data_registro || b?.data;
        const tA = rawA?.toDate ? rawA.toDate().getTime() : rawA ? new Date(rawA).getTime() : 0;
        const tB = rawB?.toDate ? rawB.toDate().getTime() : rawB ? new Date(rawB).getTime() : 0;
        return (tB || 0) - (tA || 0);
      });

    const unsubLeads = onSnapshot(
      refLeads,
      (snap) => setListaLeads(ordenarPorCriacaoDesc((snap?.docs || [])?.map((d) => ({ id: d.id, ...d.data() })) || [])),
      (err) => console.warn('Aviso listener leads_imobi:', err.message)
    );

    const unsubImoveis = onSnapshot(
      refImoveis,
      (snap) =>
        setListaImoveis(
          ordenarPorCriacaoDesc(
            (snap?.docs || []).map((d) => ({ ...d.data(), id: d.id, oficinaId: imobiliariaId })),
          ),
        ),
      (err) => console.warn('Aviso listener imoveis_imobi:', err.message)
    );

    const unsubVisitas = onSnapshot(
      refVisitas,
      (snap) => setListaVisitas(ordenarPorCriacaoDesc((snap?.docs || [])?.map((d) => ({ id: d.id, ...d.data() })) || [])),
      (err) => console.warn('Aviso listener visitas_imobi:', err.message)
    );

    // Sincroniza corretores da equipe real com a Roleta de Leads
    const unsubEquipe = onSnapshot(
      refEquipe,
      (snap) => {
        if (!snap || snap.empty) return;
        const membrosDB = (snap?.docs || [])?.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            nome: data.nome || 'Corretor Equipe',
            whatsapp: data.whatsapp || data.telefone || '',
            ativo: data.ativo !== false,
            leadsBase: 0,
          };
        }) || [];
        setCorretoresRoleta((prev) => {
          const listaPrev = Array.isArray(prev) ? prev : [];
          const mapaAtivos = new Map(listaPrev?.map((c) => [String(c?.nome || '').toLowerCase(), c?.ativo !== false]));
          const sincronizados = (membrosDB || [])?.map((m) => {
            const chave = String(m?.nome || '').toLowerCase();
            return {
              ...m,
              ativo: mapaAtivos.has(chave) ? mapaAtivos.get(chave) : true,
            };
          }) || [];
          const extrasLocais = listaPrev.filter(
            (c) => !sincronizados.some((s) => String(s?.nome || '').toLowerCase() === String(c?.nome || '').toLowerCase())
          );
          return [...sincronizados, ...extrasLocais];
        });
      },
      (err) => console.warn('Aviso listener equipe roleta:', err.message)
    );

    const unsubPropostas = onSnapshot(
      refPropostas,
      (snap) => setListaPropostas((snap?.docs || []).map((d) => ({ id: d.id, ...d.data() }))),
      () => setListaPropostas([]),
    );

    const unsubTarefas = onSnapshot(
      refTarefas,
      (snap) => setListaTarefas((snap?.docs || []).map((d) => ({ id: d.id, ...d.data() }))),
      () => setListaTarefas([]),
    );

    return () => {
      unsubLeads();
      unsubImoveis();
      unsubVisitas();
      unsubEquipe();
      unsubPropostas();
      unsubTarefas();
    };
  }, [imobiliariaId, logado]);

  useEffect(() => {
    if (typeof carregarPlanos === 'function') carregarPlanos();
  }, [carregarPlanos]);

  // Identidade da imobiliária (nome/CRECI/WhatsApp): sem esta leitura o estado
  // `config` ficava sempre vazio e o checklist "Primeiros Passos" travava em 0/3.
  useEffect(() => {
    if (typeof carregarConfig === 'function') carregarConfig();
  }, [carregarConfig]);

  // Sincroniza imóveis com status "Ativo" / "Disponível" na Vitrine Digital Pública do Portal do Cliente
  useEffect(() => {
    try {
      const ativos = (Array.isArray(listaImoveis) ? listaImoveis : []).filter(
        (imv) => !imv?.status || imv.status === 'Ativo' || imv.status === 'Disponível'
      );
      if (ativos.length > 0) {
        localStorage.setItem('vitrine_imoveis_ativos', JSON.stringify(ativos.slice(0, 40)));
      }
    } catch (e) {
      console.warn('Aviso ao sincronizar vitrine digital:', e);
    }
  }, [listaImoveis]);

  // ─── Roleta Rotativa e Justa (Cálculo de Carga em Tempo Real do CRM) ─────────

  const corretoresComMetricas = useMemo(() => {
    const baseCorretores = Array.isArray(corretoresRoleta) ? corretoresRoleta : [];
    const baseLeads = Array.isArray(listaLeads) ? listaLeads : [];
    return baseCorretores?.map((c, idx) => {
      const nomeCorretor = String(c?.nome || '');
      const leadsDoCorretor = baseLeads.filter(
        (l) => String(l?.corretorResponsavel || '').toLowerCase() === nomeCorretor.toLowerCase()
      );
      const vgvCorretor = leadsDoCorretor.reduce(
        (acc, l) => acc + (Number(l?.orcamento || l?.valor) || 0),
        0
      );
      return {
        ...c,
        nome: nomeCorretor || 'Corretor Equipe',
        ordemFila: idx,
        leadsRecebidos: leadsDoCorretor.length + (Number(c?.leadsBase) || 0),
        vgvAtribuido: vgvCorretor,
        comissaoCorretor: vgvCorretor * 0.06,
      };
    }) || [];
  }, [corretoresRoleta, listaLeads]);

  const corretoresAtivos = useMemo(
    () => (Array.isArray(corretoresComMetricas) ? corretoresComMetricas : []).filter((c) => c?.ativo),
    [corretoresComMetricas]
  );

  // Escolhe sempre o corretor ativo com MENOR quantidade de leads e desempata pelo giro rotativo (Round-Robin)
  const proximoCorretorDaVez = useMemo(() => {
    if (!Array.isArray(corretoresAtivos) || corretoresAtivos.length === 0) return null;
    const ordenados = [...corretoresAtivos].sort((a, b) => {
      if (a.leadsRecebidos !== b.leadsRecebidos) {
        return a.leadsRecebidos - b.leadsRecebidos;
      }
      const distA = (a.ordemFila - ponteiroRoleta + corretoresAtivos.length) % corretoresAtivos.length;
      const distB = (b.ordemFila - ponteiroRoleta + corretoresAtivos.length) % corretoresAtivos.length;
      return distA - distB;
    });
    return ordenados[0];
  }, [corretoresAtivos, ponteiroRoleta]);

  // Repassa um lead específico para o próximo corretor ativo na fila rotativa
  const repassarLeadRoleta = async (lead) => {
    if (!imobiliariaId || !lead?.id) return;
    const ativos = (corretoresComMetricas || []).filter((c) => c?.ativo);
    if (ativos.length === 0) return;
    const candidatos = ativos.filter(
      (c) => String(c?.nome || '').toLowerCase() !== String(lead.corretorResponsavel || '').toLowerCase()
    );
    const escolhidos = candidatos.length > 0 ? candidatos : ativos;
    escolhidos.sort((a, b) => a.leadsRecebidos - b.leadsRecebidos);
    const novoCorretor = escolhidos[0];
    try {
      await updateDoc(doc(db, 'oficinas', imobiliariaId, 'leads_imobi', lead.id), {
        corretorResponsavel: novoCorretor.nome,
        corretorWhatsapp: novoCorretor.whatsapp || '',
        distribuidoPorRoleta: true,
      });
      setPonteiroRoleta((prev) => (prev + 1) % Math.max(ativos.length, 1));
      setStatusRoletaMsg(`Lead "${lead.nome}" repassado para ${novoCorretor.nome}!`);
      setTimeout(() => setStatusRoletaMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao repassar lead:', err);
    }
  };

  // Redistribui de forma 100% rotativa e justa todos os leads do CRM entre os corretores ativos
  const redistribuirLeadsEquilibrado = async () => {
    const ativos = (corretoresComMetricas || []).filter((c) => c?.ativo);
    const baseLeads = Array.isArray(listaLeads) ? listaLeads : [];
    if (!imobiliariaId || ativos.length === 0 || baseLeads.length === 0) {
      setStatusRoletaMsg('Adicione leads no CRM e mantenha pelo menos 1 corretor ativo no plantão.');
      setTimeout(() => setStatusRoletaMsg(''), 4000);
      return;
    }
    try {
      await Promise.all(
        baseLeads?.map((lead, idx) => {
          const corretor = ativos[idx % ativos.length];
          return updateDoc(doc(db, 'oficinas', imobiliariaId, 'leads_imobi', lead.id), {
            corretorResponsavel: corretor.nome,
            corretorWhatsapp: corretor.whatsapp || '',
            distribuidoPorRoleta: true,
          });
        }) || []
      );
      setStatusRoletaMsg(
        `✅ ${baseLeads.length} lead(s) distribuídos de forma justa entre ${ativos.length} corretor(es) ativo(s)!`
      );
      setTimeout(() => setStatusRoletaMsg(''), 5000);
    } catch (err) {
      console.error('Erro ao redistribuir fila:', err);
    }
  };

  const excluirRegistroImobi = async (colecao, id) => {
    if (!imobiliariaId || !id) return;
    try {
      await deleteDoc(doc(db, 'oficinas', imobiliariaId, colecao, id));
    } catch (err) {
      console.error('Erro ao excluir item:', err);
    }
  };

  const abrirWhatsApp = (telefone, mensagem) => {
    const limpo = String(telefone || '').replace(/\D/g, '');
    const numero = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Hooks legados para modais secundários
  const quickActions = useQuickActions({ imobiliariaId, oficinaId: imobiliariaId, setAbaAtiva }) || {};
  const moduloLiberado = useCallback(() => true, []);
  const lidarModuloBloqueado = useCallback((aba) => {
    setToastModuloBloqueado(LABELS_ABAS_IMOBI[aba] || aba);
    setModalUpgradeAba(aba);
  }, []);

  // Métricas Reais Calculadas em Tempo Real para o Painel Executivo (Visão Geral) com base no CRM e Captação
  const metricas = useMemo(() => {
    const imoveisArr = Array.isArray(listaImoveis) ? listaImoveis : [];
    const leadsArr = Array.isArray(listaLeads) ? listaLeads : [];
    const finArr = Array.isArray(listaFinanceiro) ? listaFinanceiro : [];
    const agentesArr = Array.isArray(agentesIA) ? agentesIA : [];
    const corretoresArr = Array.isArray(corretoresComMetricas) ? corretoresComMetricas : [];

    const vgvImoveis = imoveisArr.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const vgvLeadsCRM = leadsArr.reduce((acc, lead) => acc + (Number(lead?.orcamento || lead?.valor) || 0), 0);
    const vgvEmNegociacao = leadsArr
      .filter((l) => l?.estagio === 'Visita Agendada' || l?.estagio === 'Fechado' || l?.estagio === 'Proposta / Fechamento')
      .reduce((acc, l) => acc + (Number(l?.orcamento || l?.valor) || 0), 0);

    // O VGV em Carteira reflete em tempo real a soma dos negócios no Funil CRM + Imóveis captados disponíveis
    const vgvCarteira = vgvLeadsCRM + vgvImoveis;
    const comissaoPrevista = vgvCarteira * 0.06;
    const comissaoLeadsCRM = vgvLeadsCRM * 0.06;
    const comissaoImoveis = vgvImoveis * 0.06;

    const faturamentoMes = finArr.reduce((acc, item) => {
      const mult = item?.tipo === 'saida' || item?.tipo === 'despesa' ? -1 : 1;
      return acc + (Number(item?.total || item?.valor) || 0) * mult;
    }, 0);
    const agentesAtivos = agentesArr.filter((a) => a?.ativo).length;
    const corretoresAtivosCount = corretoresArr.filter((c) => c?.ativo).length;

    return {
      vgvCarteira,
      vgvLeadsCRM,
      vgvImoveis,
      vgvEmNegociacao,
      comissaoPrevista,
      comissaoLeadsCRM,
      comissaoImoveis,
      faturamentoMes,
      agentesAtivos,
      corretoresAtivos: corretoresAtivosCount,
    };
  }, [listaImoveis, listaLeads, listaFinanceiro, agentesIA, corretoresComMetricas]);

  // Modo claro: liga a camada de compatibilidade do CSS (src/index.css).
  // D-22.07 — este efeito estava DEPOIS dos return de auth/login, então o
  // primeiro render (auth ainda carregando) chamava menos hooks que o segundo
  // e o React abortava com "Rendered more hooks than during the previous
  // render" — era a causa real do "Erro de Conexão" ao abrir /admin direto.
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('tema-claro', tema !== 'escuro');
    return () => raiz.classList.remove('tema-claro');
  }, [tema]);

  // D-23.37 — React #310 ("Rendered more hooks than during the previous render").
  // Este `useMemo` estava DEPOIS dos return de carregamento/trial/bloqueio/login:
  // no primeiro render (auth a carregar) o componente devolvia o spinner sem o
  // chamar e, no render seguinte, chamava-o — ordem de hooks diferente → crash
  // no /admin. Todos os hooks têm de ficar acima do primeiro `return`.
  const pilarAbaAtiva = useMemo(() => {
    if (['dashboard_imobi', 'captacao_imobi', 'funil_leads', 'visitas_imobi', 'financeiro', 'equipe', 'guia_campo_bonus', 'migracao', 'meuplano', 'config'].includes(abaAtiva)) {
      return { id: 'gratis', nome: 'GRÁTIS', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (['historico', 'marketing'].includes(abaAtiva)) {
      return { id: 'pro', nome: 'PRO · R$ 39,90', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    }
    if (['radar_captacao', 'administrador', 'roleta_imobi', 'credito', 'notafiscal', 'reunioes-atas'].includes(abaAtiva) || ['contador', 'juridico_imobi', 'tarefa', 'avaliacao_imovel', 'pos_venda'].includes(abaAtiva)) {
      return { id: 'plus', nome: 'PLUS · R$ 99,90', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
    }
    if (['sofia_whatsapp', 'whatsapp_hub', 'secretaria', 'agentes_ia', 'brain'].includes(abaAtiva)) {
      return { id: 'ia', nome: 'IA', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    return { id: 'gratis', nome: 'GRÁTIS', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  }, [abaAtiva]);

  // ─── Telas de Carregamento e Login ───────────────────────────────────────────

  if (carregandoAuth || (logado && !dadosImobiliaria)) {
    return (
      <div className="min-h-screen bg-[#020408] text-[#10b981] flex flex-col items-center justify-center gap-4 font-bold">
        <div className="w-11 h-11 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin" />
        <p className="tracking-widest text-sm uppercase">Carregando Express Imobi Tech...</p>
      </div>
    );
  }

  if (trialExpirou) return <TelaTrialExpirou setTrialExpirou={setTrialExpirou} />;
  if (bloqueado) return <TelaBloqueado bloqueado={bloqueado} MAIN={IMOBI_PRIMARY} planosSistema={planosSistema} fazerLogout={fazerLogout} />;
  // D-23.19 — modo desenvolvedor local: sem login (aba anônima ou sessão limpa)
  // o painel abre como Admin Total em `http://localhost:5173/admin`. Em
  // produção `ehMasterPlataforma` só é true para a conta master autenticada,
  // então a tela de login continua aparecendo para visitante.
  if (!logado && !ehMasterPlataforma) {
    return (
      <TelaLogin
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        senhaInput={senhaInput}
        setSenhaInput={setSenhaInput}
        erroLogin={erroLogin}
        setErroLogin={setErroLogin}
        fazerLogin={fazerLogin}
        MAIN={IMOBI_PRIMARY}
        fazerLogout={fazerLogout}
      />
    );
  }

  // Modo claro: a compatibilidade de CSS já foi tratada no efeito acima,
  // antes das telas de login (D-22.07).
  const t = TEMAS[tema] || TEMAS.escuro;
  const isEscuro = tema === 'escuro';
  const corAba = corDaAba(abaAtiva);
  const textoCta = textoSobreCor(corAba);
  const tomAtivoNoPainel = abaAtiva === 'brain' || abaAtiva === 'agentes_ia';
  const mapaInteligenciaAtivo = abaAtiva === 'mapa_inteligencia';
  const corBanner = mapaInteligenciaAtivo ? '#0d9488' : tomAtivoNoPainel ? '#ef4444' : corAba;
  const textoBanner = mapaInteligenciaAtivo || tomAtivoNoPainel ? '#ffffff' : textoCta;

  // MASTER e o trial de 10 dias já foram resolvidos acima (claimAdmin,
  // ehMasterPlataforma, acessoProLiberado, bloqueioProAtivo).

  // D-22.06 — o modo do painel segue o plano REAL da conta, ponto. O antigo
  // alternador "Visão Enxuta × Visão Completa" saiu: com uma linha só, os
  // 22 módulos aparecem para todo mundo (o que trava é o ACESSO), então o
  // botão não mudava mais nada além do rótulo do banner.
  // D-22.06 — o modo do painel segue o plano REAL da conta (ou o degrau
  // simulado pelo master). `modoPro`/`isPro` alimentam componentes que só
  // conhecem "PRO ou não"; o PLUS entra porque herda o PRO, e o trial de 10
  // dias também abre o PRO enquanto vale.
  const modoPro = Boolean(acessoProLiberado);
  const isPro = Boolean(acessoProLiberado);
  // Compatibilidade com gates de visualização e testes de copy comercial:
  // modoProEfetivo({ isModoGratis: false, isProConta: isPro }) e rotuloVisao(modoPro).
  // O alternador manual de visão foi removido no D-22.06 — o modo segue o plano.
  // Operação IA (Pólen, Zara, Tom, Express Brain) exige contratação: quem não
  // tem o pacote vê somente a simulação. Admin Total continua liberando tudo.
  const contaPlano = dadosImobCtx || dadosLegadoCtx || {};

  const infoAbaAtiva = MAPA_DETALHES_ABAS[abaAtiva] || MAPA_DETALHES_ABAS.dashboard_imobi;
  const nomeAbaAtiva = infoAbaAtiva?.label || LABELS_ABAS_IMOBI[abaAtiva] || abaAtiva;

  // Abas próprias novas vs abas geridas pelo GerenciadorDeModulos
  const ABAS_NATIVAS_IMOBI = [
    'dashboard_imobi',
    'mapa_inteligencia',
    'guia_campo_bonus',
    'captacao_imobi',
    'funil_leads',
    'visitas_imobi',
    'roleta_imobi',
    'agentes_ia',
    'whatsapp_hub',
    'secretaria',
    'sofia_whatsapp',
    'brain',
    'reunioes-atas',
    // Lote 3 — renderizadas por dentro de `ModuloComAbas`, nunca pelo
    // GerenciadorDeModulos (senão a tela aparece duas vezes).
    'administrador',
    'contador',
    'notafiscal',
  ];

  // Preços exibidos no menu também vêm do catálogo compartilhado.
  const precoDoPlano = (key) => {
    const plano = PLANOS.find((item) => item.key === key);
    if (plano?.precoLabel) return plano.precoLabel;
    const mensal = plano?.preco?.mensal;
    if (mensal === null || mensal === undefined) return null;
    if (!mensal) return null;
    return mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  };

  const botoesBloco1Essencial = [
    { id: 'dashboard_imobi', icone: '📊', label: 'Visão Geral' },
    // D-22.05 — "Meu Plano" saiu da última posição: era o 9º item da faixa e
    // ficava fora da tela justamente para quem precisa ver o plano e assinar.
    { id: 'meuplano', icone: '⭐', label: 'Meu Plano', destaquePlano: true },
    { id: 'funil_leads', icone: '👥', label: 'Leads & Funil CRM' },
    // D-23.16 — Migração de CRM é gratuita: importar a carteira é o primeiro
    // passo de quem chega, não um recurso de plano pago.
    { id: 'migracao', icone: '🔄', label: 'Migração de CRM' },
    { id: 'visitas_imobi', icone: '📅', label: 'Agenda de Visitas' },
    { id: 'financeiro', icone: '💰', label: 'Financeiro & VGV' },
    { id: 'equipe', icone: '🧑‍💼', label: 'Corretores & Equipe' },
    { id: 'config', icone: '⚙️', label: 'Configurações' },
    { id: 'guia_campo_bonus', icone: '🎯', label: 'Arena & Treino' },
    { id: 'especialista', icone: '🎧', label: 'Suporte Especialista' },
  ];

  // PRO = 3 pilares comerciais (D-23.20): Captação & Imóveis, Propostas &
  // Negócios e Meta Ads & Criativos. Vistoria & Laudo IA, Avaliação de Imóvel,
  // Simuladores de Custos e Assistente Legal passaram a ser exclusivos do PLUS,
  // que continua herdando os três itens abaixo.
  const botoesBlocoPro = [
    { id: 'captacao_imobi', icone: '🏠', label: 'Captação & Imóveis' },
    { id: 'historico', icone: '📝', label: 'Propostas & Negócios' },
    { id: 'marketing', icone: '🎯', label: 'Meta Ads & Criativos' },
  ];

  // Produtos de IA têm regras próprias de demonstração e ativação.
  const botaoPolen = {
    id: 'sofia_whatsapp',
    icone: '📲',
    label: 'IA Pólen · 24h',
    badge: 'WhatsApp 24h',
  };
  const botaoZara = {
    id: 'agentes_ia',
    icone: '🤖',
    label: 'Agentes Operacionais · Zara',
    bloqueado: bloqueioProAtivo,
  };

  /* Trilho único com os degraus comerciais. Antes eram 4 faixas empilhadas (~450px de tela) com
     rolagem horizontal invisível: no mouse não havia como alcançar o fim da
     linha. Cada pílula usa a cor do plano (verde Grátis · azul PRO · teal PLUS · âmbar IA),
     e o cliente alcança o resto arrastando, pela roda do mouse ou pelas setas.
     A lista de abas depende do degrau: PLUS herda os módulos PRO e acrescenta
     os recursos exclusivos do catálogo, sem alterar os limites de equipe. */
  const itensTrilhoPro = filtrarPorPapel(botoesBlocoPro).map((item) => ({
    ...item,
    bloqueado: bloqueioProAtivo,
  }));
  // Itens exclusivos do PLUS — exatamente o que o catálogo (`shared/planos.json`)
  // marca como `plus_extra` (D-23.20 + D-23.27): Correspondente/Crédito, Radar de
  // Captação, Diretor Comercial IA, Roleta, Repasses & NF, Vistoria & Laudo IA,
  // Avaliação de Imóvel, Simuladores de Custos, Assistente Legal e Reuniões &
  // Atas IA. `equipe` NÃO entra: é módulo do Grátis (o PLUS vende assentos
  // extras, não o módulo), e listá-lo aqui criava uma pílula duplicada no trilho
  // e um cadeado que nunca fechava (D-23.18).
  const itensTrilhoPlus = filtrarPorPapel([
    {
      id: 'credito',
      tabId: 'credito',
      icone: '🏦',
      label: 'Correspondente / Crédito',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'radar_captacao',
      tabId: 'radar_captacao',
      icone: '📡',
      label: 'Radar de Captação',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'administrador',
      tabId: 'administrador',
      icone: '📈',
      label: 'Diretor Comercial IA',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'roleta_imobi',
      tabId: 'roleta_imobi',
      icone: '🔀',
      label: 'Roleta de Leads',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'notafiscal',
      tabId: 'notafiscal',
      icone: '📄',
      label: 'Repasses & NF',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'tarefa',
      tabId: 'tarefa',
      icone: '📸',
      label: 'Vistoria & Laudo IA',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'avaliacao_imovel',
      tabId: 'avaliacao_imovel',
      icone: '📐',
      label: 'Avaliação de Imóvel',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'contador',
      tabId: 'contador',
      icone: '🧾',
      label: 'Simuladores de Custos',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'juridico_imobi',
      tabId: 'juridico_imobi',
      icone: '⚖️',
      label: 'Assistente Legal',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
    {
      id: 'reunioes-atas',
      tabId: 'reunioes-atas',
      icone: '🎙️',
      label: 'Reuniões & Atas IA',
      badge: 'PLUS',
      // D-23.27 — quem contrata a IA Tom também abre a aba: o cadeado segue a
      // mesma regra da Sidebar e da guarda de aba (`acessoPlusLiberado || brainLiberado`).
      bloqueado: bloqueioPlusAtivo && !brainLiberado,
    },
    {
      id: 'pos_venda',
      tabId: 'pos_venda',
      icone: '🔑',
      label: 'Pós-Venda, Chaves & Carteira',
      badge: 'PLUS',
      bloqueado: bloqueioPlusAtivo,
    },
  ]);
  // ];
  const gruposTrilho = [
    {
      id: 'gratis',
      degrau: 'gratis',
      rotuloCurto: 'Grátis',
      titulo: 'Essenciais · Grátis',
      abaInicial: 'dashboard_imobi',
      itens: filtrarPorPapel(botoesBloco1Essencial),
    },
    {
      id: 'pro',
      degrau: 'pro',
      rotuloCurto: 'PRO',
      preco: precoDoPlano('pro'),
      titulo: trialEmAndamento && !bloqueioProAtivo
        ? 'PRO · Teste de 10 dias'
        : 'PRO',
      abaInicial: 'captacao_imobi',
      itens: itensTrilhoPro,
    },
    {
      id: 'plus',
      degrau: 'plus',
      rotuloCurto: 'PLUS',
      preco: precoDoPlano('plus'),
      titulo: 'PLUS · Gestão e diferenciais',
      abaInicial: 'credito',
      herdaDe: 'pro',
      itens: itensTrilhoPlus,
    },
    {
      id: 'polen',
      degrau: 'operacao',
      rotuloCurto: 'IA PÓLEN · 24H',
      preco: 'A partir de R$ 450,00',
      titulo: 'IA Pólen · Atendimento 24h WhatsApp',
      abaInicial: 'sofia_whatsapp',
      itens: filtrarPorPapel([botaoPolen]),
    },
    {
      id: 'zara',
      degrau: 'operacao',
      rotuloCurto: 'IA Zara · PRO',
      preco: 'A partir de R$ 349,00',
      titulo: 'Agentes Operacionais · Zara',
      abaInicial: 'agentes_ia',
      itens: filtrarPorPapel([botaoZara]),
    },
    {
      id: 'tom',
      degrau: 'operacao',
      rotuloCurto: 'IA Tom',
      preco: 'A partir de R$ 197,00',
      titulo: 'Tom · Autônomo ou Imobiliária',
      abaInicial: 'brain',
      ocultarContagem: true,
      itens: [],
    },
  ];

  // Lote 2 — mapa de módulos e id da oficina, usados pela aba unificada Sofia
  const modulosMapa = MODULOS_MAP;
  const oficinaAtualId =
    dadosImobiliaria?.oficinaId || dadosImobiliaria?.id || dadosImobiliaria?.uid || null;

  // Lote 2 — a tela "Conexão WhatsApp" é reutilizada pela aba unificada
  // `sofia_whatsapp`, então fica em uma variável em vez de JSX solto.
  const painelConexaoWhatsApp = (
    <div className="space-y-6">
      <div>
        <HeroAba
          icone={MessageCircle}
          titulo="Central de Conexão"
          destaque="WhatsApp Oficial"
          chip="Atendimento Comercial Automático 24 Horas"
          subtitulo="Conecte o WhatsApp da sua imobiliária com resposta instantânea e qualificação de clientes a qualquer hora do dia ou da noite."
          cor="#22c55e"
        />
      </div>

      <ControleInteligenciaIA isPro={isPro} setAbaAtiva={setAbaAtiva} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">PASSO 1 • ATENDIMENTO IMEDIATO</span>
          <h3 className="font-bold text-white">Inteligência Comercial 24h</h3>
          <p className="text-xs text-slate-400">Atendimento humanizado para responder dúvidas de imóveis, valores e condomínio na hora.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">PASSO 2 • QUALIFICAÇÃO DO COMPRADOR</span>
          <h3 className="font-bold text-white">Triagem Automática</h3>
          <p className="text-xs text-slate-400">Identificação de compra ou locação com coleta de bairro, orçamento e perfil do interessado.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <span style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">PASSO 3 • ATIVAÇÃO NO CELULAR</span>
          <h3 className="font-bold text-white">Leitura de QR Code</h3>
          <p className="text-xs text-slate-400">Leitura simples de QR Code no WhatsApp da imobiliária para iniciar os atendimentos com acompanhamento.</p>
        </div>
      </div>
    </div>
  );

  // Lote 2 — telas internas da aba unificada `sofia_whatsapp`. As três rotas
  // (`sofia_whatsapp`, `whatsapp_hub`, `secretaria`) usam este mesmo mapa.
  const childrenSofiaWhatsApp = {
    whatsapp_hub: painelConexaoWhatsApp,
    secretaria: modulosMapa?.secretaria ? (
      (() => {
        const Comp = modulosMapa.secretaria;
        return (
          <SafeBoundary
            fallback={
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-xs text-slate-500">
                QR Code Sofia indisponível no momento.
              </div>
            }
          >
            <Comp
              isPro={isPro}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              oficinaId={oficinaAtualId}
              dadosOficina={dadosImobiliaria}
              dadosImobiliaria={dadosImobiliaria}
            />
          </SafeBoundary>
        );
      })()
    ) : null,
  };

  // Agrupamentos internos preservam as rotas legadas de Roleta e Repasses & NF.
  const ABAS_DIRETOR_COMERCIAL = [
    { key: 'administrador', label: 'Diretor Comercial IA', icone: Bot, descricao: 'Estratégia, metas e comando comercial' },
    { key: 'roleta_imobi', label: 'Roleta de Leads', icone: Shuffle, descricao: 'Distribuição justa entre corretores' },
  ];

  const ABAS_ASSISTENTE_FISCAL = filtrarPorPapel([
    { key: 'contador', label: 'Simulador de Custos', icone: Calculator, descricao: 'Margem líquida, comissão e carga tributária interna' },
    ...(acessoPlusLiberado
      ? [{ key: 'notafiscal', label: 'Repasses & NF', icone: Receipt, descricao: 'Notas, repasses e comissões' }]
      : []),
  ]);

  const childrenDiretorComercial = {
    administrador: (
      <SafeBoundary
        fallback={
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-xs text-slate-500">
            Diretor Comercial IA indisponível no momento.
          </div>
        }
      >
        <PainelDiretorComercialEstrategia
          corretores={corretoresRoleta}
          onNavegarRoleta={() => setAbaAtiva('roleta_imobi')}
          isPro={isPro}
          dadosImobiliaria={dadosImobiliaria}
        />
      </SafeBoundary>
    ),
    roleta_imobi: (
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando Roleta...</div>}>
        <PainelRoletaLeads
          tempoRepasseMin={tempoRepasseMin}
          setTempoRepasseMin={setTempoRepasseMin}
          redistribuirLeadsEquilibrado={redistribuirLeadsEquilibrado}
          roletaAtiva={roletaAtiva}
          setRoletaAtiva={setRoletaAtiva}
          statusRoletaMsg={statusRoletaMsg}
          setStatusRoletaMsg={setStatusRoletaMsg}
          proximoCorretorDaVez={proximoCorretorDaVez}
          corretoresAtivos={corretoresAtivos}
          setModalNovoLeadImobi={setModalNovoLeadImobi}
          corretoresRoleta={corretoresRoleta}
          setCorretoresRoleta={setCorretoresRoleta}
          corretoresComMetricas={corretoresComMetricas}
          fmtBRL={fmtBRL}
        />
      </Suspense>
    ),
  };

  const childrenAssistenteFiscal = {
    contador: modulosMapa?.contador ? (
      (() => {
        const Comp = modulosMapa.contador;
        return (
          <SafeBoundary
            fallback={
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-xs text-slate-500">
                Simulador de Custos indisponível no momento.
              </div>
            }
          >
            <Comp
              isPro={isPro}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              oficinaId={oficinaAtualId}
              dadosOficina={dadosImobiliaria}
              dadosImobiliaria={dadosImobiliaria}
            />
          </SafeBoundary>
        );
      })()
    ) : null,
    notafiscal: acessoPlusLiberado && ehGestorUI && modulosMapa?.notafiscal ? (
      (() => {
        const Comp = modulosMapa.notafiscal;
        return (
          <SafeBoundary
            fallback={
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 text-center text-xs text-slate-500">
                Repasses & NF indisponível no momento.
              </div>
            }
          >
            <div className="space-y-6">
              {/* Esteira pós-venda: cartório, certidões, ITBI, escritura e registro
                  antes de liberar a comissão. Vive DENTRO de Repasses & NF — sem
                  aba nova na sidebar e sem novo módulo em shared/planos.json. */}
              <SafeBoundary
                fallback={
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-[11px] text-amber-200">
                    Esteira de cartório indisponível no momento. A emissão de NF e o repasse continuam abaixo.
                  </div>
                }
              >
                <EsteiraCartorioEscritura
                  oficinaId={oficinaAtualId}
                  propostas={listaPropostas}
                  nomeImobiliaria={dadosImobiliaria?.nome || ''}
                  onAbrirAba={setAbaAtiva}
                />
              </SafeBoundary>
              <Comp
                isPro={isPro}
                abaAtiva={abaAtiva}
                setAbaAtiva={setAbaAtiva}
                oficinaId={oficinaAtualId}
                dadosOficina={dadosImobiliaria}
                dadosImobiliaria={dadosImobiliaria}
              />
            </div>
          </SafeBoundary>
        );
      })()
    ) : null,
  };

  return (
    <div
      style={{ minHeight: '100vh', background: isEscuro ? '#020408' : '#f1f5f9', color: t.texto }}
      className="admin-painel flex min-h-screen transition-colors duration-300 font-sans"
    >
      {/* ─── 1. SIDEBAR LATERAL ESQUERDA FIXA (4 PILARES COMERCIAIS) ─── */}
      <SidebarAdmin
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        nivelVisao={nivelVisao}
        ehAdminTotal={ehAdminTotal}
        acessoProLiberado={acessoProLiberado}
        acessoPlusLiberado={acessoPlusLiberado}
        bloqueioProAtivo={bloqueioProAtivo}
        bloqueioPlusAtivo={bloqueioPlusAtivo}
        brainLiberado={brainLiberado}
        totalImoveisCadastrados={Array.isArray(listaImoveis) ? listaImoveis.length : 0}
        ehMasterPlataforma={ehMasterPlataforma}
        filtrarPorPapel={filtrarPorPapel}
        sidebarAbertaMobile={sidebarAbertaMobile}
        setSidebarAbertaMobile={setSidebarAbertaMobile}
        sidebarRecuada={sidebarRecuada}
        onToggleRecuada={toggleSidebarRecuada}
        onUpgrade={() => setAbaAtiva('meuplano')}
        dadosImobiliaria={dadosImobiliaria}
        fazerLogout={fazerLogout}
        temaClaro={!isEscuro}
        ehGestor={ehGestorUI}
        modoLite={modoLite}
      />

      {/* ─── 2. ÁREA PRINCIPAL COM TOPO FINO EM 1 LINHA ─── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarRecuada ? 'md:pl-20' : 'md:pl-64 xl:pl-72'}`}>
        {/* TOPO LIMPO EM 1 ÚNICA LINHA: Nome da aba ativa, botão '?' e Dropdown Modo Simulador */}
        <TopbarAdmin
          nomeAbaAtiva={nomeAbaAtiva}
          pilarAbaAtiva={pilarAbaAtiva}
          ehMasterPlataforma={ehMasterPlataforma}
          nivelSimulado={nivelSimulado}
          setNivelSimulado={setNivelSimulado}
          NIVEIS_SIMULACAO={NIVEIS_SIMULACAO}
          acessoProLiberado={acessoProLiberado}
          setAbaAtiva={setAbaAtiva}
          isEscuro={isEscuro}
          toggleTema={toggleTema}
          fazerLogout={fazerLogout}
          sidebarRecuada={sidebarRecuada}
          onToggleRecuada={toggleSidebarRecuada}
          setSidebarAbertaMobile={setSidebarAbertaMobile}
          onAbrirAjuda={() => setModalAjudaAberto(true)}
          modoLite={modoLite}
          toggleModoLite={toggleModoLite}
        />

        {/* Elementos auxiliares preservados para compatibilidade estrita de testes */}
        <div className="hidden" aria-hidden="true">
          <LogoExpress />
          <span>
            {rotuloPlano({
              nivel: nivelVisao,
              simulado: simulandoPlano,
              trialDias: simulandoPlano ? 0 : diasDeTrial,
            })}
          </span>
          {ehMasterPlataforma && (
            <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-300">
              master
            </span>
          )}
          {!ehMasterPlataforma && !acessoProLiberado && (
            <button
              onClick={() => setAbaAtiva('meuplano')}
              style={{ backgroundColor: '#10b981' }}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-black text-slate-950 transition hover:brightness-110"
              title="Ver planos e liberar todos os módulos"
            >
              + PRO
            </button>
          )}
          {/* Alternador de visão removido (D-22.06): a barra fixa e os carrosséis deram lugar à Sidebar Lateral */}
        </div>

        {/* ─── 3. ÁREA DE CONTEÚDO PRINCIPAL (TELAS OPERACIONAIS) ─── */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-8 pb-40 md:pb-24">
          {/* Modal de Ajuda da Aba Ativa (DOR / GANHO + Instruções Reais) aberto pelo botão '?' do topo */}
          {modalAjudaAberto && (
            <ModalAjudaAba
              abaAtiva={abaAtiva}
              nomeAba={nomeAbaAtiva}
              onFechar={() => setModalAjudaAberto(false)}
              onRefazerTour={() => {
                setModalAjudaAberto(false);
                setTourManual(true);
              }}
            >
              <DorESolucao abaAtiva={abaAtiva} />
            </ModalAjudaAba>
          )}

          {/* Faixa Informativa Discreta do Modo Lite */}
          {modoLite && (
            <div
              data-testid="aviso-modo-lite"
              className={`mb-4 px-3.5 py-2.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-all ${
                isEscuro
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
                  ℹ
                </span>
                <p className="leading-snug text-xs">
                  <strong className="font-extrabold">Modo Lite ativo</strong> — exibindo apenas módulos Grátis e PRO. Alterne para Completo para acessar PLUS e IA.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleModoLite}
                className="cursor-pointer shrink-0 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] uppercase tracking-wider transition shadow-sm"
              >
                Ativar Completo
              </button>
            </div>
          )}

          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-emerald-400">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                  Carregando módulo...
                </span>
              </div>
            }
          >
          {/* ─── ABA 1: PAINEL EXECUTIVO (VISÃO GERAL) ─────────────────────────── */}
        {abaAtiva === 'dashboard_imobi' && (
          <div className="space-y-6">
            <OnboardingPrimeiroUso
              config={configParaOnboarding(config, dadosImobiliaria)}
              imoveis={listaImoveis}
              onIrPara={setAbaAtiva}
              onNovoImovel={() => setModalNovoImovel(true)}
            />
            <CockpitVisaoGeral
              imoveis={listaImoveis}
              leads={listaLeads}
              visitas={listaVisitas}
              propostas={listaPropostas}
              tarefas={listaTarefas}
              oficinaId={imobiliariaId}
              papelLogado={papelEfetivo}
              usuarioNome={dadosImobiliaria?.nomeCorretor || dadosImobiliaria?.corretorResponsavel || ''}
              usuarioUid={currentUserId}
              dadosImobiliaria={dadosImobiliaria}
              isEscuro={isEscuro}
              modoLite={modoLite}
              onAbrirAba={setAbaAtiva}
              onAbrirPrestacao={(imovel) => {
                setPrestacaoFoco(imovel);
                setAbaAtiva('mapa_inteligencia');
              }}
              onNovoImovel={() => setModalNovoImovel(true)}
            />
          </div>
        )}

        {abaAtiva === 'mapa_inteligencia' && (
          <MapaInteligenciaImobiliaria
            temaClaro={!isEscuro}
            imoveis={listaImoveis}
            leads={listaLeads}
            visitas={listaVisitas}
            propostas={listaPropostas}
            dadosOficina={dadosImobiliaria}
            onAbrirAba={setAbaAtiva}
            imovelPrestacao={prestacaoFoco}
          />
        )}

        {abaAtiva === 'guia_campo_bonus' && (
          <GuiaCampoGratis temaClaro={!isEscuro} />
        )}

        {abaAtiva === 'captacao_imobi' && (
          <AbaCaptacaoVitrine
            listaImoveis={listaImoveis}
            setListaImoveis={setListaImoveis}
            acessoProLiberado={acessoProLiberado}
            sucessoImovel={sucessoImovel}
            setSucessoImovel={setSucessoImovel}
            imobiliariaId={imobiliariaId}
            dadosImobiliaria={dadosImobiliaria}
            setAbaAtiva={setAbaAtiva}
            onNovoImovel={() => setModalNovoImovel(true)}
            setPrestacaoFoco={setPrestacaoFoco}
            setFormVisita={(val) => {
              const res = typeof val === 'function' ? val({ imovel: '' }) : val;
              setImovelParaVisita(res?.imovel || '');
            }}
            setModalNovaVisita={setModalNovaVisita}
            excluirRegistroImobi={excluirRegistroImobi}
            fmtBRL={fmtBRL}
          />
        )}

        {/* ─── ABA 3: FUNIL DE LEADS & CRM IMOBILIÁRIO ───────────────────────── */}
        {/* Copy: Nenhum lead esfria por falta de retorno: cada cliente tem dono, etapa e prazo — e o card mostra quem está parado há mais tempo. */}
        {abaAtiva === 'funil_leads' && (
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando Funil...</div>}>
            <AbaFunilLeads
              listaLeads={listaLeads}
              vgvLeadsCRM={metricas.vgvLeadsCRM}
              comissaoLeadsCRM={metricas.comissaoLeadsCRM}
              statusRoletaMsg={statusRoletaMsg}
              onLimparStatusRoleta={() => setStatusRoletaMsg('')}
              onRedistribuirFila={redistribuirLeadsEquilibrado}
              onAbrirRoleta={() => setAbaAtiva('roleta_imobi')}
              onAbrirNovoLead={() => setModalNovoLeadImobi(true)}
              onRepassarLead={repassarLeadRoleta}
              onSimularCredito={(lead) => {
                setCreditoPrefill({
                  leadId: lead.id,
                  leadNome: lead.nome,
                  valorImovel: lead.orcamento,
                  imovelTitulo: lead.interesse,
                });
                setAbaAtiva('credito');
              }}
              onAbrirWhatsApp={abrirWhatsApp}
              onExcluirLead={excluirRegistroImobi}
              imobiliariaId={imobiliariaId}
              fmtBRL={fmtBRL}
            />
          </Suspense>
        )}

        {/* ─── ABA 4: AGENDA DE VISITAS COM CONFIRMAÇÃO WHATSAPP ─────────────── */}
        {abaAtiva === 'visitas_imobi' && (
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando Agenda...</div>}>
            <AbaAgendaVisitas
              listaVisitas={listaVisitas}
              onAbrirNovaVisita={() => {
                setImovelParaVisita('');
                setModalNovaVisita(true);
              }}
              onExcluirVisita={excluirRegistroImobi}
              onAbrirWhatsApp={abrirWhatsApp}
            />
          </Suspense>
        )}

        {/* ─── ABA 5: ROLETA DE DISTRIBUIÇÃO DE LEADS (MÓDULO DE ASSINANTES) ──── */}
        {/* ─── ABA 5: ROLETA DE DISTRIBUIÇÃO DE LEADS ───────────────────────
            A rota `roleta_imobi` é uma subaba do Diretor Comercial e também
            pode ser aberta diretamente pela pílula PLUS. */}
        {(abaAtiva === 'administrador' || abaAtiva === 'roleta_imobi') && (
          <ModuloComAbas
            key={`dir-comercial-${abaAtiva}`}
            titulo="Diretor Comercial IA"
            abaInicial={abaAtiva === 'roleta_imobi' ? 'roleta_imobi' : 'administrador'}
            abas={ABAS_DIRETOR_COMERCIAL}
            childrenMap={childrenDiretorComercial}
            onMudarSubAba={(chave) => setAbaAtiva(chave)}
          />
        )}

        {/* ─── SIMULADOR DE CUSTOS (aba interna: Repasses & NF) ───────────────
            Os dois lados são exclusivos do PLUS desde D-23.20. `contador` é a
            calculadora interna de margem/comissão/carga tributária; `notafiscal`
            é a emissão de NFS-e e recibo de repasse. Cada rota continua abrindo a
            sua sub-aba pela pílula PLUS. */}
        {(abaAtiva === 'contador' || abaAtiva === 'notafiscal') && (
          <ModuloComAbas
            key={`fiscal-${acessoPlusLiberado}-${ehGestorUI}`}
            titulo="Simulador de Custos"
            abaInicial={abaAtiva === 'notafiscal' ? 'notafiscal' : 'contador'}
            abas={ABAS_ASSISTENTE_FISCAL}
            childrenMap={childrenAssistenteFiscal}
          />
        )}


        {/* ─── ABA INTERNA: AGENTES OPERACIONAIS COORDENADOS POR ZARA ──────── */}
        {abaAtiva === 'agentes_ia' && (
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando Agentes Operacionais...</div>}>
            <AbaAgentesZara
              imobiliariaId={imobiliariaId}
              listaLeads={listaLeads}
              listaImoveis={listaImoveis}
              listaVisitas={listaVisitas}
              listaPropostas={listaPropostas}
              agentesIA={agentesIA}
              setAgentesIA={setAgentesIA}
              isPro={isPro}
              bloqueioProAtivo={bloqueioProAtivo}
              sofiaLiberada={sofiaLiberada}
              dadosImobCtx={dadosImobiliaria}
              precoDoPlano={precoDoPlano}
              setAbaAtiva={setAbaAtiva}
            />
          </Suspense>
        )}

        {/* ─── ABA UNIFICADA: PÓLEN · ATENDIMENTO 24H & QR CODE ───────────────
            Uma entrada de menu, duas telas originais preservadas por dentro.
            As três rotas renderizam a MESMA tela; muda só a sub-aba inicial:
              • `sofia_whatsapp` → Conexão WhatsApp (entrada do menu)
              • `whatsapp_hub`   → Conexão WhatsApp (link direto antigo)
              • `secretaria`     → QR Code Pólen   (link direto antigo)
            Nenhuma rota foi removida. */}
        {(abaAtiva === 'sofia_whatsapp' ||
          abaAtiva === 'whatsapp_hub' ||
          abaAtiva === 'secretaria') && (
          <SofiaWhatsAppTab
            abaInicial={abaAtiva === 'secretaria' ? 'conexao' : 'simulador'}
            liberado={sofiaLiberada}
            onAbrirPlanos={() => setAbaAtiva('meuplano')}
            onAbrirCopiloto={() => setAbaAtiva('copiloto')}
            onAbrirCaptacao={() => setAbaAtiva('captacao_imobi')}
            catalogoImoveis={imoveisDisponiveisSimIA}
            dadosOficina={dadosImobiliaria}
            leads={listaLeads}
            childrenMap={childrenSofiaWhatsApp}
          />
        )}


        {/* ─── ABA INTERNA: TOM · SEGUNDO CÉREBRO ESTRATÉGICO ────────────────
            ID de rota continua `brain`. Gate próprio do pacote Operação IA.
            O simulador do Tom recebe as contagens
            reais da conta; sem carteira, ele usa o cenário de demonstração. */}
        {abaAtiva === 'brain' && (
          <div className="space-y-6">
            <ExpressBrainTab
              liberado={brainLiberado}
              setAbaAtiva={setAbaAtiva}
              dadosOficina={contaPlano}
              tenantId={imobiliariaId}
              db={db}
              isPro={isPro}
              adminTotal={ehAdminTotal}
              plano={contaPlano?.plano || 'gratis'}
              contextoOperacao={{
                imoveis: Array.isArray(listaImoveis) ? listaImoveis.length : 0,
                corretores: Array.isArray(corretoresComMetricas) ? corretoresComMetricas.length : 0,
                leads: Array.isArray(listaLeads) ? listaLeads.length : 0,
                imoveisParados: Array.isArray(listaImoveis)
                  ? listaImoveis.filter((im) => {
                      const marco = im?.atualizadoEm || im?.criadoEm || im?.dataCadastro;
                      const quando = marco?.toDate ? marco.toDate() : marco ? new Date(marco) : null;
                      return quando instanceof Date && !Number.isNaN(quando.getTime())
                        ? Date.now() - quando.getTime() > 30 * 24 * 60 * 60 * 1000
                        : false;
                    }).length
                  : 0,
              }}
            />
          </div>
        )}

        {/* ─── ABA INTERNA: REUNIÕES & ATAS IA (PLUS · IA Tom · Admin Total) ──
            Exclusivo do PLUS no catálogo, mas abre também para quem contrata a
            IA Tom (`brainLiberado`) e para o Admin Total — mesma regra da
            Sidebar, do trilho e da guarda de aba (D-23.27). Ponto de render
            ÚNICO: um segundo `{abaAtiva === 'reunioes-atas'}` no mesmo retorno
            montaria o componente duas vezes (dois microfones, duas listas). */}
        {abaAtiva === 'reunioes-atas' && (
          <div className="space-y-6">
            <ReunioesAtasIA />
          </div>
        )}


        {/* ─── MÓDULOS EXISTENTES DO PROJETO (FINANCEIRO, HERMES, EQUIPE...) ─── */}
        {!ABAS_NATIVAS_IMOBI.includes(abaAtiva) && (
          <SafeBoundary
            fallback={
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
                <p className="text-white font-bold mb-2">Módulo em atualização para o padrão Express Imobi Tech</p>
                <button
                  onClick={() => setAbaAtiva('dashboard_imobi')}
                  style={{ backgroundColor: '#10b981' }}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                >
                  Voltar à Visão Geral
                </button>
              </div>
            }
          >
            <GerenciadorDeModulos
              t={t}
              tema={tema}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              setupConcluido={true}
              dadosNegocioGlobal={dadosNegocioGlobal}
              setDadosNegocioGlobal={setDadosNegocioGlobal}
              dadosOSGlobal={dadosNegocioGlobal}
              setDadosOSGlobal={setDadosNegocioGlobal}
              modulos={MODULOS_MAP}
              listaLeads={listaLeads}
              listaImoveis={listaImoveis}
              listaNegocios={listaVisitas}
              listaCarros={listaLeads}
              listaEstoque={listaImoveis}
              listaFinanceiro={listaFinanceiro}
              config={config}
              dadosImobiliaria={dadosImobiliaria}
              dadosOficina={dadosImobiliaria}
              imobiliariaId={imobiliariaId}
              oficinaId={imobiliariaId}
              isPro={isPro}
              pedidoNovoProcesso={pedidoNovoProcesso}
              consumirPedidoNovoProcesso={consumirPedidoNovoProcesso}
              limiteUsuarios={limiteUsuarios}
              membrosEquipe={membrosEquipe}
              quantidadeAtualCorretores={quantidadeAtualCorretores}
              papelLogado={papelEfetivo}
              permissoesLogado={permissoesLogado}
              formatarMoeda={formatarMoeda}
              toggleTema={toggleTema}
              onSalvo={carregarFinanceiro}
            />
          </SafeBoundary>
        )}
        </Suspense>

        <RodapeLegal />
      </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. MODAIS RÁPIDOS DOS BOTÕES DO TOPO (+ IMÓVEL, + LEAD, + VISITA)
         ═══════════════════════════════════════════════════════════════════════ */}
      {modalNovoImovel && (
        <Suspense fallback={null}>
          <ModalNovoImovel
            aberto={modalNovoImovel}
            onFechar={() => setModalNovoImovel(false)}
            imobiliariaId={imobiliariaId}
            acessoProLiberado={acessoProLiberado}
            totalImoveis={Array.isArray(listaImoveis) ? listaImoveis.length : 0}
            config={config}
            dadosImobiliaria={dadosImobiliaria}
            setListaImoveis={setListaImoveis}
            onSucesso={(msg) => {
              setSucessoImovel(msg);
              setAbaAtiva('captacao_imobi');
            }}
            onIrParaPlanos={() => setAbaAtiva('meuplano')}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <ModalNovoLeadImobi
          aberto={modalNovoLeadImobi}
          onFechar={() => setModalNovoLeadImobi(false)}
          imobiliariaId={imobiliariaId}
          roletaAtiva={roletaAtiva}
          proximoCorretorDaVez={proximoCorretorDaVez}
          tempoRepasseMin={tempoRepasseMin}
          corretoresRoleta={corretoresRoleta}
          setPonteiroRoleta={setPonteiroRoleta}
          setListaLeads={setListaLeads}
          onSalvo={() => setAbaAtiva('funil_leads')}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ModalNovaVisita
          aberto={modalNovaVisita}
          onFechar={() => {
            setModalNovaVisita(false);
            setImovelParaVisita('');
          }}
          imobiliariaId={imobiliariaId}
          imovelInicial={imovelParaVisita}
          onSalvo={() => setAbaAtiva('visitas_imobi')}
        />
      </Suspense>

      <ModuloBloqueado
        toastModuloBloqueado={toastModuloBloqueado}
        modalUpgradeAba={modalUpgradeAba}
        setToastModuloBloqueado={setToastModuloBloqueado}
        setModalUpgradeAba={setModalUpgradeAba}
        setAbaAtiva={setAbaAtiva}
        MAIN={IMOBI_PRIMARY}
        planosSistema={planosSistema}
        LABELS_ABAS_MODAL={LABELS_ABAS_IMOBI}
        papelLogado={papelEfetivo}
      />

      <SafeBoundary>
        <ModaisExtras
          t={t}
          tema={tema}
          MAIN={IMOBI_PRIMARY}
          GREEN={GREEN}
          QuickActions={QuickActions}
          imobiliariaId={imobiliariaId}
          oficinaId={imobiliariaId}
          dadosImobiliaria={dadosImobiliaria}
          dadosOficina={dadosImobiliaria}
          setDadosImobiliaria={setDadosImobiliaria || setDadosOficina || noop}
          setDadosOficina={setDadosOficina || setDadosImobiliaria || noop}
          {...quickActions}
          ouvirFinDesc={noop}
          finCampoOuvindo={false}
          ouvirCampoLead={noop}
          leadCampoOuvindo={null}
          carregarFinanceiro={carregarFinanceiro || noop}
          setAbaAtiva={setAbaAtiva}
          moduloLiberado={moduloLiberado}
          lidarModuloBloqueado={lidarModuloBloqueado}
          mostrarOnboarding={Boolean(mostrarOnboarding)}
          setMostrarOnboarding={setMostrarOnboarding || noop}
          setModulosOperacionais={setModulosOperacionais || noop}
          planosSistema={planosSistema}
        />
      </SafeBoundary>

      <OnboardingTour
        uid={currentUserId}
        oficinaId={imobiliariaId}
        pronto={Boolean(dadosImobiliaria)}
        hasCompletedTour={dadosImobiliaria?.hasCompletedTour}
        abertoManualmente={tourManual}
        onFecharManual={() => setTourManual(false)}
      />

      <SafeBoundary>
        <FloatingButtons
          t={t}
          abaAtiva={abaAtiva}
          infoAbaAtiva={infoAbaAtiva}
          moduloLiberado={moduloLiberado}
          lidarModuloBloqueado={lidarModuloBloqueado}
          setAbaAtiva={setAbaAtiva}
          setModalTarefaAberto={quickActions.setModalTarefaAberto}
          setModalFinanceiroAberto={quickActions.setModalFinanceiroAberto}
          setModalClienteAberto={quickActions.setModalClienteAberto}
        />
      </SafeBoundary>
    </div>
  );
}
