import React, { Component, useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Building2,
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
} from 'lucide-react';

// Componentes existentes do ecossistema
import { COLORS, formatarMoeda } from './components/admin/constants';
import { TEMAS } from './DashboardTab';
import { TelaTrialExpirou, TelaBloqueado, TelaLogin } from './components/admin/TelasDeAcesso';
import ModuloBloqueado from './components/admin/ModuloBloqueado';
import BarraModulos from './components/admin/BarraModulos';
import HeroAba from './components/admin/HeroAba';
import CaptacaoNicho from './components/imobi/CaptacaoNicho';
import { corDaAba, textoSobreCor, comAlpha } from './lib/coresAbas';
import ModaisExtras from './components/admin/ModaisExtras';
import QuickActions from './components/QuickActions';
import FloatingButtons from './components/FloatingButtons';
import GerenciadorDeModulos from './components/admin/GerenciadorDeModulos';
import ControleInteligenciaIA from './components/ControleInteligenciaIA';
import GuiaDaAba from './components/ui/GuiaDaAba';
import RodapeLegal from './components/ui/RodapeLegal';
import DorESolucao from './components/ui/DorESolucao';
import { ehMasterPlataforma as ehMasterPlataformaFn, modoProEfetivo, rotuloModo } from './lib/acesso-plano';
import { MODULOS_MAP } from './modulosMap';
import { setCreditoPrefill } from './lib/credito/prefill';
import { MODULOS_SO_GESTAO, ehGestor as ehGestorDoPapel, filtrarModulos } from './lib/permissoes-menu';

import { useAuth } from './contexts/AuthContext';
import useCarregamentoInicial from './hooks/useCarregamentoInicial.jsx';
import { registrarEventoLead, TIPOS_EVENTO } from './services/girardEngine';
import RodaProspeccao from './components/RodaProspeccao';
import useQuickActions, { parseMoedaBR } from './hooks/useQuickActions';

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

const GRUPOS_MENU_IMOBI = [
  {
    titulo: 'BLOCO 1: OPERAÇÃO IMOBILIÁRIA (MÓDULOS ESSENCIAIS — 100% GRÁTIS)',
    cor: '#10b981',
    itens: [
      {
        id: 'dashboard_imobi',
        label: '📊 Visão Geral',
        tituloCard: 'PAINEL EXECUTIVO',
        tituloLimpo: 'PAINEL EXECUTIVO — Visão Geral',
        tier: 'gratis',
        descricao:
          'Abra e saiba o que fazer primeiro: quem chegou hoje, quem está esperando resposta e quanto você tem a receber. Menos tempo procurando informação, mais tempo vendendo.',
      },
      {
        id: 'captacao_imobi',
        label: '🏠 Captação & Imóveis',
        tituloCard: 'GESTÃO & VITRINE DE IMÓVEIS',
        tituloLimpo: 'GESTÃO & VITRINE DE IMÓVEIS',
        tier: 'gratis',
        descricao:
          'Cadastre o imóvel uma vez e ele já sai na vitrine, nos portais e no seu material de venda. O formulário muda conforme o nicho, então você não esquece campo nem refaz cadastro.',
      },
      {
        id: 'funil_leads',
        label: '👥 Leads & Funil CRM',
        tituloCard: 'FUNIL DE VENDAS & CRM',
        tituloLimpo: 'FUNIL DE VENDAS & CRM',
        tier: 'gratis',
        descricao:
          'Nenhum lead esfria por falta de retorno: cada cliente tem dono, etapa e prazo. O card mostra quem está parado há mais tempo e o WhatsApp sai com um clique.',
      },
      {
        id: 'visitas_imobi',
        label: '📅 Agenda de Visitas',
        tituloCard: 'AGENDA DE VISITAS & PLANTÃO',
        tituloLimpo: 'AGENDA DE VISITAS & PLANTÃO',
        tier: 'gratis',
        descricao:
          'Visita marcada é comissão encaminhada. Agenda com corretor, imóvel e confirmação automática no WhatsApp — fim do cliente que não aparece.',
      },
      {
        id: 'financeiro',
        label: '💰 Financeiro & VGV',
        tituloCard: 'GESTÃO FINANCEIRA & VGV',
        tituloLimpo: 'GESTÃO FINANCEIRA & VGV',
        tier: 'gratis',
        descricao:
          'Saiba quanto já vendeu, quanto tem a receber e quanto está travado — sem planilha e sem surpresa no fechamento do mês.',
      },
      {
        id: 'historico',
        label: '📋 Propostas & Negócios',
        tituloCard: 'PROPOSTAS & FECHAMENTO',
        tituloLimpo: 'PROPOSTAS & FECHAMENTO',
        tier: 'gratis',
        descricao:
          'Da proposta à assinatura, com status e histórico. Quando o cliente perguntar "como está aquele negócio?", a resposta está na tela.',
      },
      {
        id: 'equipe',
        label: '👔 Corretores & Equipe',
        tituloCard: 'GESTÃO DE CORRETORES',
        tituloLimpo: 'GESTÃO DE CORRETORES',
        tier: 'gratis',
        descricao:
          'Controle de equipe de vendas, distribuição de carteira e acompanhamento de metas individuais por corretor.',
      },
      {
        id: 'marketing',
        label: '🎯 Meta Ads & Criativos',
        tituloCard: 'ADS & CAPTAÇÃO DE TRÁFEGO',
        tituloLimpo: 'ADS & CAPTAÇÃO DE TRÁFEGO',
        tier: 'gratis',
        descricao:
          'Anúncio pronto em 1 minuto: arte, legenda e público no tom que o cliente responde. Pare de improvisar post no meio do plantão.',
      },
      {
        id: 'meuplano',
        label: '⭐ Meu Plano (14 Dias Grátis)',
        tituloCard: 'MEU PLANO (14 DIAS GRÁTIS)',
        tituloLimpo: 'Meu Plano (14 Dias Grátis) & Assinatura',
        tier: 'gratis',
        descricao:
          'Acompanhe o status do seu período de testes de 14 dias grátis, compare os recursos do Modo Grátis vs Modo PRO e faça upgrade quando desejar.',
      },
    ],
  },
  {
    titulo: 'BLOCO 2: ESQUADRÃO DE IA & AUTOMAÇÃO WHATSAPP (DIFERENCIAL PRO)',
    cor: '#10b981',
    itens: [
      {
        id: 'agentes_ia',
        label: '🤖 7 Agentes de IA',
        tituloCard: 'ESQUADRÃO DE INTELIGÊNCIA ARTIFICIAL',
        tituloLimpo: 'ESQUADRÃO DE INTELIGÊNCIA ARTIFICIAL',
        tier: 'pro',
        descricao:
          'Lead que chega às 22h de sábado recebe resposta na hora: os agentes qualificam, agendam e reengajam 24h. Você acorda com a conversa adiantada.',
      },
      {
        id: 'whatsapp_hub',
        label: '💬 Conexão WhatsApp',
        tituloCard: 'CONEXÃO WHATSAPP & GATEWAY',
        tituloLimpo: 'Conexão WhatsApp',
        tier: 'pro',
        descricao: 'Ponte oficial via API para unificar o atendimento da imobiliária 24h por dia.',
      },
      {
        id: 'copiloto',
        label: '🧠 Hermes Copiloto',
        tituloCard: 'HERMES COPILOTO DE NEGOCIAÇÃO',
        tituloLimpo: 'HERMES COPILOTO DE NEGOCIAÇÃO',
        tier: 'pro',
        descricao:
          "Seu assistente de plantão especialista em quebra de objeções. Cole a mensagem difícil do cliente (ex: 'juros altos', 'entrada alta') e receba o argumento de fechamento ideal em segundos.",
      },
      {
        id: 'secretaria',
        label: '📲 Ativação & QR Code da Sofia (WhatsApp)',
        tituloCard: 'ATIVAÇÃO & QR CODE DA SOFIA (WHATSAPP)',
        tituloLimpo: 'Ativação & QR Code da Sofia (WhatsApp)',
        tier: 'pro',
        descricao:
          'Central prática de conexão via QR Code e ativação da secretária virtual Sofia para triagem 24h de leads no WhatsApp.',
      },
      {
        id: 'administrador',
        label: '📈 Diretor Comercial IA',
        tituloCard: 'DIRETOR COMERCIAL PREDITIVO',
        tituloLimpo: 'DIRETOR COMERCIAL PREDITIVO',
        tier: 'pro',
        descricao:
          'Análise preditiva de conversão de leads, auditoria do atendimento da equipe em tempo real e alertas automáticos sobre oportunidades quentes paradas no CRM.',
      },
      {
        id: 'contador',
        label: '🧾 Assistente Fiscal',
        tituloCard: 'ASSISTÊNCIA LEGAL & TRIBUTÁRIA',
        tituloLimpo: 'ASSISTÊNCIA LEGAL & TRIBUTÁRIA (FISCAL)',
        tier: 'pro',
        descricao:
          'Consultoria instantânea baseada na Lei do Inquilinato (Lei nº 8.245/91) e orientações fiscais automatizadas para transações imobiliárias seguras.',
      },
      {
        id: 'juridico_imobi',
        label: '⚖️ Assistente Jurídico (Lei do Inquilinato)',
        tituloCard: 'ASSISTÊNCIA LEGAL & TRIBUTÁRIA',
        tituloLimpo: 'ASSISTÊNCIA LEGAL & TRIBUTÁRIA (LEI DO INQUILINATO)',
        tier: 'pro',
        descricao:
          'Consultoria instantânea baseada na Lei do Inquilinato (Lei nº 8.245/91) e orientações fiscais automatizadas para transações imobiliárias seguras.',
      },
    ],
  },
  {
    titulo: 'GESTÃO, CONTRATOS & MÓDULOS DE ASSINANTES (DIFERENCIAL PRO)',
    cor: '#10b981',
    itens: [
      {
        id: 'roleta_imobi',
        label: '🔀 Roleta de Leads',
        tituloCard: 'ROLETA INTELIGENTE DE LEADS',
        tituloLimpo: 'Roleta de Leads',
        tier: 'pro',
        descricao: 'Distribuição automática e justa de leads em fila rotativa entre corretores de plantão.',
      },
      {
        id: 'tarefa',
        label: '📸 Vistoria & Laudo IA',
        tituloCard: 'VISTORIA & LAUDO FOTOGRÁFICO IA',
        tituloLimpo: 'Vistoria & Laudo Fotográfico IA',
        tier: 'pro',
        descricao:
          'Laudo fotográfico por ambiente na entrada e na saída: acabou a discussão sobre o estado do imóvel e o desconto de caução no chute.',
      },
      {
        id: 'notafiscal',
        label: '📄 Repasses & NF',
        tituloCard: 'REPASSES & NFS-E UNIFICADA (ADN + IBS/CBS)',
        tituloLimpo: 'Repasses & NFS-e Unificada (ADN + IBS/CBS)',
        tier: 'pro',
        descricao:
          'Nota e repasse no mesmo lugar: você emite, divide com o proprietário e vê exatamente quanto entra na conta.',
      },
      {
        id: 'migracao',
        label: '🔄 Migração de CRM',
        tituloCard: 'MIGRAÇÃO INTELIGENTE DE CRM',
        tituloLimpo: 'Migração de CRM',
        tier: 'pro',
        descricao: 'Importação rápida de carteiras de clientes e imóveis vindos de planilhas ou outros sistemas.',
      },
      {
        id: 'meuplano',
        label: '⭐ Meu Plano (14 Dias Grátis)',
        tituloCard: 'MEU PLANO (14 DIAS GRÁTIS)',
        tituloLimpo: 'Meu Plano (14 Dias Grátis) & Assinatura',
        tier: 'gratis',
        descricao:
          'Acompanhe o status do seu período de testes de 14 dias grátis, compare os recursos do Modo Grátis vs Modo PRO e faça upgrade quando desejar.',
      },
      {
        id: 'config',
        label: '⚙️ Configurações',
        tituloCard: 'CONFIGURAÇÕES DA IMOBILIÁRIA / CORRETOR',
        tituloLimpo: 'Configurações da Imobiliária / Corretor',
        tier: 'pro',
        descricao: 'Personalização de CRECI, logomarca, chave PIX de comissões e dados institucionais.',
      },
      {
        id: 'radar_captacao',
        label: '📡 Radar de Captação',
        tituloCard: 'RADAR DE CAPTAÇÃO',
        tituloLimpo: 'Radar de Captação (Particulares)',
        tier: 'pro',
        descricao:
          'Monta buscas de anúncios de particular na OLX, Marketplace e Google, extrai preço/área/contato de um anúncio colado, compara com o mercado e devolve três abordagens de WhatsApp — além do feed XML para ZAP, VivaReal e OLX.',
      },
      {
        id: 'avaliacao_imovel',
        label: '📐 Avaliação de Imóvel',
        tituloCard: 'AVALIAÇÃO DE IMÓVEL',
        tituloLimpo: 'Avaliação de Imóvel (PTAM)',
        tier: 'pro',
        descricao:
          'Chega de "quanto vale?" no chute: avaliação com comparáveis reais, três cenários de preço e prazo estimado de venda. Argumento pronto para o proprietário ajustar o valor.',
      },
      {
        id: 'acompanhamento_cliente',
        label: '🔎 Acompanhamento do Cliente',
        tituloCard: 'ACOMPANHAMENTO DO CLIENTE',
        tituloLimpo: 'Acompanhamento do Cliente (Código + Senha)',
        tier: 'pro',
        descricao:
          'Abra um processo por cliente (financiamento, locação, rural, loteamento ou à vista), gere código e senha e entregue um link onde ele acompanha cada etapa sem ligar para a imobiliária.',
      },
      {
        id: 'especialista',
        label: '🛠️ Suporte Especialista',
        tituloCard: 'SUPORTE COM ESPECIALISTA IMOBILIÁRIO',
        tituloLimpo: 'Suporte Especialista Imobiliário',
        tier: 'pro',
        descricao: 'Central de apoio operacional e consultoria técnica para acelerar resultados na plataforma.',
      },
    ],
  },
];

const MODULOS_GRATIS_PLG = new Set([
  'dashboard_imobi',
  'captacao_imobi',
  'funil_leads',
  'visitas_imobi',
  'financeiro',
  'historico',
  'equipe',
  'marketing',
  'meuplano',
]);

const MAPA_DETALHES_ABAS = (GRUPOS_MENU_IMOBI || [])
  .flatMap((g) => (g?.itens || [])?.map((item) => ({ ...item, grupoTitulo: g.titulo })))
  .reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {});

const AGENTES_INICIAIS = [
  {
    id: 'sofia_triagem',
    nome: 'Sofia — Triagem Inicial Multi-Nicho',
    cargo: 'Recepção 24h no WhatsApp',
    ativo: true,
    atendimentos: 128,
    prompt: 'Recepciona o lead em 3 segundos e identifica se busca Imóvel Urbano, Loteamento/Condomínio, Fazenda/Rural ou Locação.',
  },
  {
    id: 'iago_qualificacao',
    nome: 'Iago — Qualificador Urbano, Lotes & Rural',
    cargo: 'Filtro de Orçamento, Lote, Hectares e Garantias',
    ativo: true,
    atendimentos: 94,
    prompt: 'Filtra Quadra/Lote/m² em loteamentos, Hectares/Aptidão em fazendas, Garantias (Caução/Seguro Fiança) em locação e FGTS/Financiamento.',
  },
  {
    id: 'teo_agenda',
    nome: 'Téo — Agendador de Visitas',
    cargo: 'Sincronização com Corretores',
    ativo: true,
    atendimentos: 41,
    prompt: 'Cruza horários livres do corretor, confirma endereço do imóvel e envia lembrete.',
  },
  {
    id: 'lara_propostas',
    nome: 'Lara — Estruturação de Propostas',
    cargo: 'Fechamento Comercial',
    ativo: true,
    atendimentos: 19,
    prompt: 'Organiza condições de pagamento, sinal, permuta e envia resumo para aprovação.',
  },
  {
    id: 'heitor_reativacao',
    nome: 'Heitor — Reativação de Base',
    cargo: 'Resgate de Leads Antigos',
    ativo: true,
    atendimentos: 67,
    prompt: 'Dispara oportunidades de queda de preço para leads que pararam de responder há 15+ dias.',
  },
  {
    id: 'nina_docs',
    nome: 'Nina — Onboarding & Crédito',
    cargo: 'Checklist de Documentação',
    ativo: false,
    atendimentos: 12,
    prompt: 'Solicita RG, comprovante de renda e certidões para aprovação bancária ou locação.',
  },
  {
    id: 'monica_fiscal',
    nome: 'Mônica — Assistente VGV & Fiscal',
    cargo: 'Controle de Comissões e Repasses',
    ativo: false,
    atendimentos: 8,
    prompt: 'Calcula divisão de comissões (imobiliária/corretor/captador) e resumo mensal.',
  },
];

const LABELS_ABAS_IMOBI = (GRUPOS_MENU_IMOBI || [])
  .flatMap((g) => g?.itens || [])
  .reduce((acc, item) => {
    if (item?.id) acc[item.id] = item.label;
    return acc;
  }, {});

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

  // Muda automaticamente o título da aba do navegador para Express Imobi Tech
  useEffect(() => {
    document.title = 'Express Imobi Tech — Plataforma Imobiliária IA';
  }, []);

  const [abaAtiva, setAbaAtiva] = useState('dashboard_imobi');

  // Pedido de "novo processo": incrementa ao clicar no CTA dourado e é consumido
  // pelo módulo Acompanhamento do Cliente, que abre o formulário.
  const [pedidoNovoProcesso, setPedidoNovoProcesso] = useState(0);
  const abrirNovoProcesso = useCallback(() => {
    setAbaAtiva('acompanhamento_cliente');
    setPedidoNovoProcesso((n) => n + 1);
  }, []);
  const consumirPedidoNovoProcesso = useCallback(() => setPedidoNovoProcesso(0), []);
  const [tema, setTema] = useState('escuro');
  const [modoPainel, setModoPainel] = useState(() => {
    try {
      return localStorage.getItem('modoPainel') || 'completo';
    } catch {
      return 'completo';
    }
  });

  // Estados de dados imobiliários
  const [listaLeads, setListaLeads] = useState([]);
  const [listaImoveis, setListaImoveis] = useState([]);
  const [listaVisitas, setListaVisitas] = useState([]);
  const [listaPropostas, setListaPropostas] = useState([]);
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
  const [novoCorretorNome, setNovoCorretorNome] = useState('');
  const [novoCorretorZap, setNovoCorretorZap] = useState('');
  const [corretoresRoleta, setCorretoresRoleta] = useState([
    { id: 'c1', nome: 'Corretor Plantão 01', whatsapp: '5511999999999', ativo: true, leadsBase: 0 },
    { id: 'c2', nome: 'Especialista Alto Padrão', whatsapp: '5511988888888', ativo: true, leadsBase: 0 },
    { id: 'c3', nome: 'Consultor Locação', whatsapp: '5511977777777', ativo: true, leadsBase: 0 },
  ]);

  // Modais próprios de Ação Rápida Imobiliária
  const [modalNovoImovel, setModalNovoImovel] = useState(false);
  const [modalNovoLeadImobi, setModalNovoLeadImobi] = useState(false);
  const [modalNovaVisita, setModalNovaVisita] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  // Formulários rápidos (Com suporte a Nichos Especializados, Padrão de Imóvel, Galeria de Fotos e Vitrine Digital)
  const [filtroNichoCaptacao, setFiltroNichoCaptacao] = useState('Todos');
  const [novaFotoInput, setNovaFotoInput] = useState('');
  const [formImovel, setFormImovel] = useState({
    titulo: '',
    tipo: 'Apartamento',
    finalidade: 'Venda',
    padraoImovel: 'Médio Padrão',
    status: 'Ativo',
    publicarPortais: true,
    bairro: '',
    quartos: '2',
    valor: '',
    fotos: [],
    fotoCapa: '',
    // Campos específicos: Loteamentos / Condomínios
    quadra: '',
    lote: '',
    metragemTerreno: '',
    // Campos específicos: Fazendas / Imóveis Rurais
    hectares: '',
    aptidaoRural: 'Dupla Aptidão (Lavoura e Pecuária)',
    benfeitorias: '',
    // Campos específicos: Locação (Lei 8.245/91)
    modalidadeGarantia: 'Seguro Fiança / CredPago',
    regrasLocacao: '',
  });
  const [formLead, setFormLead] = useState({
    nome: '',
    telefone: '',
    interesse: 'Compra',
    bairro: '',
    orcamento: '',
    estagio: 'Novo Lead',
  });
  const [formVisita, setFormVisita] = useState({
    cliente: '',
    telefone: '',
    imovel: '',
    data: '',
    hora: '10:00',
    corretor: 'Corretor Plantão 01',
  });

  // Simulador rápido de IA na aba de Agentes (com Memória de Contexto e Máquina de Estados)
  const [msgTesteIA, setMsgTesteIA] = useState('');
  const [contextoSimuladorIA, setContextoSimuladorIA] = useState({
    etapa: 'inicio',
    agenteAtual: 'Sofia (Triagem 24h)',
    modalidade: null,
    tipoImovel: null,
    quartos: null,
    bairro: null,
    orcamento: null,
    fichasEnviadas: false,
    horarioVisita: null,
  });
  const [historicoTesteIA, setHistoricoTesteIA] = useState([
    {
      autor: 'ia',
      agente: 'Sofia • Triagem 24h',
      texto: 'Olá! Sou a Sofia, agente de triagem do Express Imobi Tech. Digite uma mensagem como se fosse um cliente procurando imóvel (ex: bairro, faixa de valor ou tipo de imóvel) para testar!',
    },
  ]);

  // Controle de planos e Trial
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

  // ---- visibilidade do menu por papel (espelho das Firestore Rules) ----
  const ehGestorUI = ehGestorDoPapel(papelLogado);
  const filtrarPorPapel = useCallback((itens) => filtrarModulos(itens, papelLogado), [papelLogado]);

  // Se o corretor cair numa aba de gestão (estado antigo/atalho), volta ao início.
  useEffect(() => {
    if (!ehGestorUI && MODULOS_SO_GESTAO.has(abaAtiva)) setAbaAtiva('dashboard_imobi');
  }, [ehGestorUI, abaAtiva]);

  const alternarModoPainel = useCallback((novoModo) => {
    setModoPainel(novoModo);
    if (novoModo === 'gratis' || novoModo === 'lite') {
      setAbaAtiva((abaAtual) => (MODULOS_GRATIS_PLG.has(abaAtual) ? abaAtual : 'dashboard_imobi'));
    }
    try {
      localStorage.setItem('modoPainel', novoModo);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleTema = useCallback(() => {
    setTema((prev) => (prev === 'escuro' ? 'claro' : 'escuro'));
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
    if (papelLogado === 'master') return false;
    if (dadosImobiliaria?.statusPlano && dadosImobiliaria.statusPlano !== 'trial') return false;
    return Boolean(dadosImobiliaria?.isTrial || dadosImobiliaria?.statusPlano === 'trial' || dataFimTrial);
  }, [papelLogado, dadosImobiliaria, dataFimTrial]);

  useEffect(() => {
    if (!isTrial || !dataFimTrial || trialVerificadoRef.current) return;
    const limite = typeof dataFimTrial?.toDate === 'function' ? dataFimTrial.toDate() : new Date(dataFimTrial);
    if (!Number.isNaN(limite.getTime()) && limite < new Date()) {
      trialVerificadoRef.current = true;
      setTrialExpirou(true);
    }
  }, [isTrial, dataFimTrial]);

  const { carregarFinanceiro, carregarPlanos } = useCarregamentoInicial(imobiliariaId, {
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
      (snap) => setListaImoveis(ordenarPorCriacaoDesc((snap?.docs || [])?.map((d) => ({ id: d.id, ...d.data() })) || [])),
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

  // ─── Funções de Galeria de Fotos, Padrão e Cadastro de Imóveis ───────────────

  const obterEstiloTagPadrao = (padrao) => {
    const p = String(padrao || '').toLowerCase();
    if (p.includes('minha casa') || p.includes('social')) {
      return {
        label: 'Minha Casa, Minha Vida / Social',
        classes: 'bg-sky-500/15 text-sky-400 border border-sky-500/40',
      };
    }
    if (p.includes('alto') || p.includes('luxo')) {
      return {
        label: 'Alto Padrão / Luxo',
        classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
      };
    }
    return {
      label: padrao || 'Médio Padrão',
      classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40',
    };
  };

  const adicionarLinkFotoImovel = (urlDireta = null) => {
    const link = (urlDireta ?? novaFotoInput).trim();
    if (!link) return;
    setFormImovel((prev) => {
      const atuais = Array.isArray(prev.fotos) ? prev.fotos : [];
      if (atuais.includes(link)) return prev;
      const novas = [...atuais, link];
      return {
        ...prev,
        fotos: novas,
        fotoCapa: prev.fotoCapa || link,
      };
    });
    if (!urlDireta) setNovaFotoInput('');
  };

  const handleUploadArquivosImovel = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 900;
          const scale = img.width > maxW ? maxW / img.width : 1;
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx2d = canvas.getContext('2d');
          ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          setFormImovel((prev) => {
            const atuais = Array.isArray(prev.fotos) ? prev.fotos : [];
            const novas = [...atuais, dataUrl];
            return {
              ...prev,
              fotos: novas,
              fotoCapa: prev.fotoCapa || dataUrl,
            };
          });
        };
        img.src = ev.target?.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removerFotoGaleria = (urlParaRemover) => {
    setFormImovel((prev) => {
      const novas = (Array.isArray(prev.fotos) ? prev.fotos : []).filter((f) => f !== urlParaRemover);
      return {
        ...prev,
        fotos: novas,
        fotoCapa: prev.fotoCapa === urlParaRemover ? novas[0] || '' : prev.fotoCapa,
      };
    });
  };

  const alternarStatusVitrine = async (imv) => {
    const novoStatus = imv?.status === 'Ativo' || imv?.status === 'Disponível' ? 'Inativo' : 'Ativo';
    try {
      if (imobiliariaId && imv?.id && !String(imv.id).startsWith('local_')) {
        await updateDoc(doc(db, 'oficinas', imobiliariaId, 'imoveis_imobi', imv.id), {
          status: novoStatus,
        });
      } else {
        setListaImoveis((prev) =>
          (Array.isArray(prev) ? prev : [])?.map((item) =>
            item.id === imv.id ? { ...item, status: novoStatus } : item
          )
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar status na vitrine:', err);
    }
  };

  const salvarImovelImobi = async (e) => {
    e.preventDefault();
    if (!formImovel.titulo.trim()) return;
    setSalvandoAcao(true);
    try {
      const listaFotos = Array.isArray(formImovel.fotos) ? formImovel.fotos : [];
      const capaEscolhida = formImovel.fotoCapa || listaFotos[0] || '';
      const novoImovel = {
        ...formImovel,
        fotos: listaFotos,
        fotoCapa: capaEscolhida,
        padraoImovel: formImovel.padraoImovel || 'Médio Padrão',
        valor: parseMoedaBR(formImovel.valor),
        codigo: `IMB-${Math.floor(1000 + Math.random() * 9000)}`,
        status: formImovel.status || 'Ativo',
        whatsappCorretor: config?.whatsapp || config?.telefone || '',
        criadoEm: serverTimestamp(),
      };
      if (imobiliariaId) {
        await addDoc(collection(db, 'oficinas', imobiliariaId, 'imoveis_imobi'), novoImovel);
      } else {
        setListaImoveis((prev) => [{ id: `local_${Date.now()}`, ...novoImovel }, ...(prev || [])]);
      }
      setFormImovel({
        titulo: '',
        tipo: 'Apartamento',
        finalidade: 'Venda',
        padraoImovel: 'Médio Padrão',
        status: 'Ativo',
        bairro: '',
        quartos: '2',
        valor: '',
        fotos: [],
        fotoCapa: '',
        quadra: '',
        lote: '',
        metragemTerreno: '',
        hectares: '',
        aptidaoRural: 'Dupla Aptidão (Lavoura e Pecuária)',
        benfeitorias: '',
        modalidadeGarantia: 'Seguro Fiança / CredPago',
        regrasLocacao: '',
      });
      setNovaFotoInput('');
      setModalNovoImovel(false);
      setAbaAtiva('captacao_imobi');
    } catch (err) {
      console.error('Erro ao captar imóvel:', err);
    } finally {
      setSalvandoAcao(false);
    }
  };

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

  const salvarLeadImobi = async (e) => {
    e.preventDefault();
    if (!formLead.nome.trim()) return;
    setSalvandoAcao(true);
    try {
      const sorteado = roletaAtiva && proximoCorretorDaVez ? proximoCorretorDaVez : null;
      const corretorSorteado = sorteado ? sorteado.nome : 'Atendimento Direto';
      const orcamentoNumerico = parseMoedaBR(formLead.orcamento);

      const novoLeadObj = {
        ...formLead,
        orcamento: orcamentoNumerico,
        corretorResponsavel: corretorSorteado,
        corretorWhatsapp: sorteado?.whatsapp || '',
        distribuidoPorRoleta: Boolean(sorteado),
        prazoAceiteMin: tempoRepasseMin,
        origem: 'WhatsApp IA • Roleta',
        criadoEm: serverTimestamp(),
      };

      if (imobiliariaId) {
        await addDoc(collection(db, 'oficinas', imobiliariaId, 'leads_imobi'), novoLeadObj);
      } else {
        setListaLeads((prev) => [{ id: `local_${Date.now()}`, ...novoLeadObj }, ...(prev || [])]);
      }

      if (sorteado) {
        setPonteiroRoleta((prev) => (prev + 1) % Math.max((corretoresRoleta || []).length, 1));
      }
      setFormLead({ nome: '', telefone: '', interesse: 'Compra', bairro: '', orcamento: '', estagio: 'Novo Lead' });
      setModalNovoLeadImobi(false);
      setAbaAtiva('funil_leads');
    } catch (err) {
      console.error('Erro ao salvar lead:', err);
    } finally {
      setSalvandoAcao(false);
    }
  };

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

  const adicionarCorretorRoleta = (e) => {
    e.preventDefault();
    if (!novoCorretorNome.trim()) return;
    const novo = {
      id: `cor_${Date.now()}`,
      nome: novoCorretorNome.trim(),
      whatsapp: novoCorretorZap.replace(/\D/g, '') || '5511999999999',
      ativo: true,
      leadsBase: 0,
    };
    setCorretoresRoleta((prev) => [...prev, novo]);
    setNovoCorretorNome('');
    setNovoCorretorZap('');
    setStatusRoletaMsg(`Corretor ${novo.nome} incluído na roleta ativa!`);
    setTimeout(() => setStatusRoletaMsg(''), 4000);
  };

  const salvarVisitaImobi = async (e) => {
    e.preventDefault();
    if (!formVisita.cliente.trim() || !imobiliariaId) return;
    setSalvandoAcao(true);
    try {
      await addDoc(collection(db, 'oficinas', imobiliariaId, 'visitas_imobi'), {
        ...formVisita,
        leadId: formVisita.leadId || null,
        status: 'Confirmada',
        criadoEm: serverTimestamp(),
      });
      const eventoVisita = await registrarEventoLead(db, imobiliariaId, {
        leadId: formVisita.leadId || null,
        telefone: formVisita.telefone,
        tipo: TIPOS_EVENTO.VISITA_AGENDADA,
        canal: 'painel',
        descricao: `Visita agendada para ${formVisita.data || ''} ${formVisita.hora || ''}`.trim(),
        metadados: { imovel: formVisita.imovel, corretor: formVisita.corretor },
      });
      if (!eventoVisita.ok) {
        console.error('Falha ao registrar evento de visita:', eventoVisita.error);
      }
      setFormVisita({ cliente: '', telefone: '', imovel: '', data: '', hora: '10:00', corretor: 'Corretor Plantão 01' });
      setModalNovaVisita(false);
      setAbaAtiva('visitas_imobi');
    } catch (err) {
      console.error('Erro ao agendar visita:', err);
    } finally {
      setSalvandoAcao(false);
    }
  };

  const atualizarEstagioLead = async (leadId, novoEstagio) => {
    if (!imobiliariaId || !leadId) return;
    try {
      await updateDoc(doc(db, 'oficinas', imobiliariaId, 'leads_imobi', leadId), {
        estagio: novoEstagio,
        etapaAlteradaEm: serverTimestamp(),
        ...(novoEstagio === 'Fechado' ? { posVendaStatus: 'pendente' } : {}),
      });
      const eventoEstagio = await registrarEventoLead(db, imobiliariaId, {
        leadId,
        tipo: TIPOS_EVENTO.MUDANCA_ETAPA,
        canal: 'painel',
        descricao: `Estagio alterado para ${novoEstagio}`,
        metadados: { estagioNovo: novoEstagio },
        chaveIdempotencia: `${TIPOS_EVENTO.MUDANCA_ETAPA}:${leadId}:${novoEstagio}:${new Date().toISOString().slice(0, 13)}`,
      });
      if (!eventoEstagio.ok) {
        console.error('Falha ao registrar evento de mudanca de estagio:', eventoEstagio.error);
      }
    } catch (err) {
      console.error('Erro ao mover lead no funil:', err);
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

  const reiniciarSimuladorIA = useCallback(() => {
    setContextoSimuladorIA({
      etapa: 'inicio',
      agenteAtual: 'Sofia (Triagem 24h)',
      modalidade: null,
      tipoImovel: null,
      quartos: null,
      bairro: null,
      orcamento: null,
      fichasEnviadas: false,
      horarioVisita: null,
    });
    setHistoricoTesteIA([
      {
        autor: 'ia',
        agente: 'Sofia • Triagem 24h',
        texto:
          'Olá! Sou a Sofia, agente de triagem do Express Imobi Tech. Digite uma mensagem como se fosse um cliente procurando imóvel (ex: bairro, faixa de valor ou tipo de imóvel) para testar!',
      },
    ]);
  }, []);

  const simularRespostaAgente = (e) => {
    e.preventDefault();
    if (!msgTesteIA.trim()) return;
    const texto = msgTesteIA.trim();
    const textoLower = texto.toLowerCase();
    setMsgTesteIA('');

    const ctx = { ...contextoSimuladorIA };

    // 1. Extração de Modalidade (Compra vs Locação)
    if (/alug|loca/i.test(textoLower)) {
      ctx.modalidade = 'Locação';
    } else if (/compr|financ|fgts|invest|aquisi/i.test(textoLower)) {
      ctx.modalidade = 'Compra';
    }

    // 2. Extração de Tipo de Imóvel (Urbano, Loteamentos/Condomínios, Fazendas/Rurais) e Quartos/Hectares
    if (/fazenda|haras|s[ií]tio|ch[aá]cara|rural|agr[ií]cola|pecu[aá]ria|lavoura|hectare|alqueire/i.test(textoLower)) {
      ctx.tipoImovel = 'Fazenda / Imóvel Rural';
    } else if (/loteamento|quadra|lote\b|terreno|condom[ií]nio fechado/i.test(textoLower)) {
      ctx.tipoImovel = 'Loteamento / Condomínio';
    } else if (/apto|apartamento|studio|kitnet/i.test(textoLower)) {
      ctx.tipoImovel = 'Apartamento';
    } else if (/casa|sobrado/i.test(textoLower)) {
      ctx.tipoImovel = 'Casa';
    } else if (/cobertura/i.test(textoLower)) {
      ctx.tipoImovel = 'Cobertura';
    } else if (/comercial|sala|galp[aã]o|loja/i.test(textoLower)) {
      ctx.tipoImovel = 'Imóvel Comercial';
    }

    const matchHectares = textoLower.match(/(\d+)\s*(hectare|ha\b|alqueire)/i);
    if (matchHectares) {
      ctx.quartos = `${matchHectares[1]} ${matchHectares[2]}`;
    }

    const matchMetragemLote = textoLower.match(/(\d+)\s*(m2|m²|metros)/i);
    if (matchMetragemLote) {
      ctx.quartos = `${matchMetragemLote[1]} m²`;
    }

    const matchQuartos = textoLower.match(/(\d+)\s*(quarto|dorm|su[ií]te|qto)/i);
    if (matchQuartos) {
      ctx.quartos = `${matchQuartos[1]} quartos`;
    }

    // 3. Extração Inteligente de Orçamento / Faixa de Preço (nunca mais pergunta o preço após capturar!)
    const matchValorExplicito = textoLower.match(
      /(?:r\$\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(mil|milh[aã]o|milh[oõ]es|k|reais)?/i
    );
    const temPalavraPreco = /mil|milh|reais|r\$|valor|faixa|or[cç]amento|at[eé]\s*\d|entrada|parcela|fgts/i.test(textoLower);
    const apenasNumeroLimpo = /^\s*(?:r\$\s*)?\d+(?:[.,]\d+)?\s*(?:mil|k|reais)?\s*$/i.test(textoLower);

    if (
      matchValorExplicito &&
      !matchQuartos &&
      !/^\d{1,2}\s*h/i.test(textoLower) &&
      (temPalavraPreco || apenasNumeroLimpo || ctx.etapa === 'aguardando_orcamento')
    ) {
      const numBruto = matchValorExplicito[1];
      const sufixo = (matchValorExplicito[2] || '').toLowerCase();
      if (sufixo.startsWith('milh')) {
        ctx.orcamento = `R$ ${numBruto} ${sufixo}`;
      } else if (sufixo === 'mil' || sufixo === 'k') {
        ctx.orcamento = `R$ ${numBruto} mil`;
      } else {
        const valorNum = Number(String(numBruto).replace(/\./g, '').replace(',', '.'));
        if (valorNum >= 100 && valorNum < 1000 && ctx.modalidade !== 'Locação') {
          ctx.orcamento = `R$ ${valorNum} mil`;
        } else if (valorNum >= 1000) {
          ctx.orcamento = fmtBRL(valorNum);
        }
      }
    }

    // 4. Detecção de Confirmação ("sim", "pode", "quero", "ok", "manda") e Escolha de Horário
    const isConfirmacao =
      /^(sim|s|pode|claro|quero|manda|envia|ok|beleza|com certeza|por favor|bora|vamos|pode sim|quero sim|isso)\b/i.test(
        textoLower
      ) || /pode mandar|pode enviar|quero ver|me envia|manda as fichas|quero visitar|agendar/i.test(textoLower);

    const matchHorario = textoLower.match(
      /(10\s*h|15\s*h|14\s*h|16\s*h|09\s*h|9\s*h|11\s*h|manh[aã]|tarde|amanh[aã]|s[aá]bado|hoje|\b10\b|\b15\b)/i
    );

    // 5. Extração Inteligente de Bairro / Região
    const bairrosConhecidos = textoLower.match(
      /\b(bosque|jardins|centro|zona sul|zona norte|zona leste|zona oeste|vila nova|morumbi|santa m[oô]nica|umuarama|granada|patrim[oô]nio|kara[ií]ba|altamira|copacabana|barra| Lourdes|savassi|alphaville|campolim|cambu[ií])\b/i
    );
    const matchBairroFrase = texto.match(/(?:bairro|regi[aã]o|no|na|em|pro\s+lado\s+do)\s+([A-Za-zÀ-ú0-9\s]{3,25})/i);

    if (bairrosConhecidos) {
      const nomeBairro = bairrosConhecidos[1];
      ctx.bairro = nomeBairro.charAt(0).toUpperCase() + nomeBairro.slice(1);
    } else if (matchBairroFrase && !/valor|faixa|mil|reais|manh[aã]|tarde/i.test(matchBairroFrase[1])) {
      ctx.bairro = matchBairroFrase[1].trim();
    } else if (
      !ctx.bairro &&
      (ctx.etapa === 'aguardando_bairro' || (!apenasNumeroLimpo && !temPalavraPreco)) &&
      !isConfirmacao &&
      !matchHorario &&
      !/^(oi|ol[aá]|bom dia|boa tarde|boa noite|quero comprar|quero alugar|procuro im[oó]vel|im[oó]vel|casa|apartamento)$/i.test(
        textoLower
      ) &&
      texto.length >= 3 &&
      texto.length <= 32
    ) {
      // Se o usuário respondeu diretamente o nome do bairro (ex: "bosque")
      const limpo = texto.replace(/^(no|na|em|bairro)\s+/i, '').trim();
      if (limpo && !/\d{3,}/.test(limpo)) {
        ctx.bairro = limpo.charAt(0).toUpperCase() + limpo.slice(1);
      }
    }

    // 6. Máquina de Estados Conversacional (Transição Fluida: Sofia -> Iago -> Téo -> Lara)
    let agenteTurno = 'Sofia • Triagem 24h';
    let resposta = '';
    const tipoLabel = ctx.tipoImovel || 'imóvel';
    const modLabel = ctx.modalidade || 'Compra';
    const bairroLabel = ctx.bairro || 'região de sua preferência';
    const orcamentoLabel = ctx.orcamento || 'sua faixa de investimento';

    if (
      ctx.etapa === 'aguardando_horario_visita' &&
      (matchHorario || isConfirmacao || /visita|hor[aá]rio|corretor/i.test(textoLower))
    ) {
      // PASSO 4: Téo confirma a visita agendada e passa a bola para a Lara (Propostas/Financiamento)
      const horarioEscolhido = matchHorario ? matchHorario[1] : 'amanhã às 10h';
      ctx.horarioVisita = horarioEscolhido;
      ctx.etapa = 'visita_confirmada';
      ctx.agenteAtual = 'Téo (Agendador de Visitas)';
      agenteTurno = 'Téo • Agendador de Visitas';
      resposta =
        `🗓️ Perfeito! Visita confirmada para ${horarioEscolhido} nos imóveis separados no bairro ${bairroLabel} (${orcamentoLabel}). ` +
        `Já notifiquei o corretor de plantão na roleta e enviei a localização no seu WhatsApp! ` +
        `Enquanto isso, quer que a Lara (Agente de Propostas) já deixe sua simulação de financiamento/FGTS pré-aprovada?`;
    } else if (ctx.etapa === 'visita_confirmada') {
      // PASSO 5: Lara finaliza com simulação de financiamento e preparação de proposta
      ctx.agenteAtual = 'Lara (Propostas & Fechamento)';
      agenteTurno = 'Lara • Propostas & Crédito';
      if (isConfirmacao || /financ|parcela|fgts|entrada|simula|proposta/i.test(textoLower)) {
        resposta =
          `📑 [Lara — Propostas & Crédito]: Excelente! Para a faixa de ${orcamentoLabel} no bairro ${bairroLabel}, a simulação preliminar indica entrada facilitada (podendo usar FGTS) e taxas a partir de 8,99% a.a. ` +
          `Seu atendimento já está salvo no Funil CRM do corretor para a visita (${ctx.horarioVisita || 'agendada'})!`;
      } else {
        resposta =
          `✅ Tudo certo! Sua visita no bairro ${bairroLabel} (${orcamentoLabel}) já está confirmada com nosso corretor. Se precisar alterar o horário ou simular novas condições, é só chamar aqui!`;
      }
    } else if (
      ctx.etapa === 'aguardando_confirmacao_fichas' &&
      (isConfirmacao || /ficha|foto|op[cç][oõ]es|im[oó]ve|visita|agendar/i.test(textoLower))
    ) {
      // PASSO 3: Usuário respondeu "sim" -> Iago envia as 3 fichas e Téo propõe o horário da visita
      ctx.fichasEnviadas = true;
      ctx.etapa = 'aguardando_horario_visita';
      ctx.agenteAtual = 'Téo (Agendador de Visitas)';
      agenteTurno = 'Iago → Téo • Agendador IA';
      resposta =
        `📋 Aqui estão as 3 melhores fichas que separamos no bairro ${bairroLabel} dentro de ${orcamentoLabel}:\n` +
        `1️⃣ ${ctx.tipoImovel || 'Imóvel'} Residencial ${bairroLabel} — ${ctx.quartos || '2 quartos c/ suíte'}, varanda e vaga coberta (Aceita Financiamento/FGTS)\n` +
        `2️⃣ Opção Premium em ${bairroLabel} — Acabamento moderno, excelente sol da manhã\n` +
        `3️⃣ Oportunidade Exclusiva ${bairroLabel} — Documentação 100% OK para fechamento rápido\n\n` +
        `🗓️ O Téo (Agente de Visitas) verificou a agenda do corretor: fica melhor para você conhecer pessoalmente amanhã às 10h ou às 15h?`;
    } else if (/visita|agendar|conhecer pessoalmente/i.test(textoLower)) {
      // Pedido direto de visita em qualquer momento
      ctx.etapa = 'aguardando_horario_visita';
      ctx.agenteAtual = 'Téo (Agendador de Visitas)';
      agenteTurno = 'Téo • Agendador de Visitas';
      resposta =
        `Ótimo! O Téo (Agente de Visitas) já cruzou a agenda para ${ctx.bairro ? `o bairro ${ctx.bairro}` : 'sua região'}${ctx.orcamento ? ` (${ctx.orcamento})` : ''}: ` +
        `temos horário disponível amanhã às 10h ou às 15h. Qual desses horários prefere para eu confirmar com o corretor?`;
    } else if (ctx.bairro && ctx.orcamento) {
      // PASSO 2 COMPLETO: Já temos BAIRRO e ORÇAMENTO -> Avança para envio das fichas sem repetir perguntas!
      ctx.etapa = 'aguardando_confirmacao_fichas';
      ctx.agenteAtual = 'Iago (Qualificador de Perfil)';
      agenteTurno = 'Iago • Qualificador de Perfil';
      resposta =
        `✅ Perfeito! Já filtrei nosso catálogo unindo bairro ${ctx.bairro} + faixa de ${ctx.orcamento} (${modLabel}). ` +
        `Encontrei 3 excelentes opções disponíveis hoje que aceitam financiamento bancário e uso de FGTS. Posso te enviar as fichas com fotos agora?`;
    } else if (ctx.orcamento && !ctx.bairro) {
      // Usuário informou o VALOR (ex: "200 mil"), falta apenas o BAIRRO -> Reconhece o valor e pergunta SÓ o bairro!
      ctx.etapa = 'aguardando_bairro';
      ctx.agenteAtual = 'Iago (Qualificador de Perfil)';
      agenteTurno = 'Iago • Qualificador de Perfil';
      resposta =
        `💰 Excelente faixa de investimento (${ctx.orcamento})! Já ativei o filtro de imóveis compatíveis com financiamento e FGTS nessa faixa. ` +
        `Para eu separar as melhores opções, qual bairro ou região você prefere?`;
    } else if (ctx.bairro && !ctx.orcamento) {
      // Usuário informou o BAIRRO (ex: "bosque"), falta apenas o VALOR -> Reconhece o bairro e pergunta SÓ o valor!
      ctx.etapa = 'aguardando_orcamento';
      ctx.agenteAtual = 'Iago (Qualificador de Perfil)';
      agenteTurno = 'Iago • Qualificador de Perfil';
      resposta =
        `📍 Ótima escolha! A região do ${ctx.bairro} tem alta procura e excelente valorização. ` +
        `Para eu filtrar os imóveis certos lá no ${ctx.bairro}, qual faixa de valor ou investimento você busca hoje?`;
    } else if (isConfirmacao) {
      // Se o usuário respondeu "sim" logo no início sem ter dito bairro nem orçamento ainda
      ctx.etapa = 'aguardando_bairro';
      ctx.agenteAtual = 'Iago (Qualificador de Perfil)';
      agenteTurno = 'Iago • Qualificador de Perfil';
      resposta =
        `Maravilha! Para eu te mostrar as opções ideais agora mesmo, me conta: qual bairro você tem preferência ou qual faixa de valor procura?`;
    } else {
      // Saudação inicial / Interesse geral -> Sofia recepciona e passa para o filtro de bairro
      ctx.etapa = 'aguardando_bairro';
      ctx.agenteAtual = 'Sofia (Triagem 24h)';
      agenteTurno = 'Sofia • Triagem 24h';
      resposta =
        `👋 Olá! Já identifiquei seu interesse em ${tipoLabel} (${modLabel}). ` +
        `Para o Iago filtrar as melhores oportunidades do nosso catálogo, qual bairro você prefere ou qual faixa de valor busca hoje?`;
    }

    setContextoSimuladorIA(ctx);
    setHistoricoTesteIA((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { autor: 'cliente', texto },
      { autor: 'ia', agente: agenteTurno, texto: resposta },
    ]);
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

  const dadosGraficoVGV = useMemo(() => {
    const leadsArr = Array.isArray(listaLeads) ? listaLeads : [];
    const imoveisArr = Array.isArray(listaImoveis) ? listaImoveis : [];
    const visitasArr = Array.isArray(listaVisitas) ? listaVisitas : [];

    const vgvNovo = leadsArr
      .filter((l) => (l?.estagio || 'Novo Lead') === 'Novo Lead')
      .reduce((a, l) => a + (Number(l?.orcamento) || 0), 0);
    const vgvQualificado = leadsArr
      .filter((l) => l?.estagio === 'Em Atendimento' || l?.estagio === 'Qualificado IA')
      .reduce((a, l) => a + (Number(l?.orcamento) || 0), 0);
    const vgvVisita = leadsArr
      .filter((l) => l?.estagio === 'Visita Agendada')
      .reduce((a, l) => a + (Number(l?.orcamento) || 0), 0);
    const vgvProposta = leadsArr
      .filter((l) => l?.estagio === 'Fechado' || l?.estagio === 'Proposta / Fechamento')
      .reduce((a, l) => a + (Number(l?.orcamento) || 0), 0);

    return [
      { mes: 'Captação', leads: imoveisArr.length, vgv: metricas.vgvImoveis || 450000 },
      { mes: 'Novos CRM', leads: leadsArr.length, vgv: vgvNovo || 620000 },
      { mes: 'Qualificados', leads: leadsArr.length, vgv: vgvQualificado || 780000 },
      { mes: 'Visitas', leads: visitasArr.length, vgv: vgvVisita || 950000 },
      { mes: 'Propostas', leads: leadsArr.length, vgv: vgvProposta || 1180000 },
      { mes: 'VGV Total', leads: leadsArr.length, vgv: vgvOuPadrao(metricas.vgvCarteira) },
    ];
  }, [listaImoveis, listaLeads, listaVisitas, metricas.vgvImoveis, metricas.vgvCarteira]);

  function vgvOuPadrao(valor) {
    return valor > 0 ? valor : 1480000;
  }

  // ─── Telas de Carregamento e Login ───────────────────────────────────────────

  if (carregandoAuth || (logado && !dadosImobiliaria)) {
    return (
      <div style={{ backgroundColor: '#020408' }} className="min-h-screen text-[#10b981] flex flex-col items-center justify-center gap-4 font-bold">
        <div className="w-11 h-11 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin" />
        <p className="tracking-widest text-sm uppercase">Carregando Express Imobi Tech...</p>
      </div>
    );
  }

  if (trialExpirou) return <TelaTrialExpirou setTrialExpirou={setTrialExpirou} />;
  if (bloqueado) return <TelaBloqueado bloqueado={bloqueado} MAIN={IMOBI_PRIMARY} planosSistema={planosSistema} fazerLogout={fazerLogout} />;
  if (!logado) {
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

  const t = TEMAS[tema] || TEMAS.escuro;
  const isEscuro = tema === 'escuro';
  const corAba = corDaAba(abaAtiva);
  const textoCta = textoSobreCor(corAba);

  // Modo claro: liga a camada de compatibilidade do CSS (src/index.css)
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('tema-claro', !isEscuro);
    return () => raiz.classList.remove('tema-claro');
  }, [isEscuro]);
  // --- Conta MASTER da plataforma: só ela vê o alternador de demonstração ---
  // MASTER = VITE_SU (papelLogado 'master') ou custom claim admin=true no token.
  const [claimAdmin, setClaimAdmin] = useState(false);
  useEffect(() => {
    let vivo = true;
    const conta = auth?.currentUser;
    if (!conta?.getIdTokenResult) return undefined;
    conta.getIdTokenResult()
      .then((r) => { if (vivo) setClaimAdmin(r?.claims?.admin === true); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [auth?.currentUser]);

  const ehMasterPlataforma = ehMasterPlataformaFn(papelLogado, claimAdmin);

  const isModoGratis = modoPainel === 'gratis' || modoPainel === 'lite';
  // Cliente final não tem rascunho de demo: o painel segue o plano REAL da conta.
  // O localStorage ('modoPainel') só vale para a conta MASTER.
  const modoPro = modoProEfetivo({ master: ehMasterPlataforma, isModoGratis, isProConta });
  const isPro = Boolean(isProConta && modoPro);
  const setModoPro = (ativo) => alternarModoPainel(ativo ? 'completo' : 'gratis');
  const infoAbaAtiva = MAPA_DETALHES_ABAS[abaAtiva] || MAPA_DETALHES_ABAS.dashboard_imobi;

  // Abas próprias novas vs abas geridas pelo GerenciadorDeModulos
  const ABAS_NATIVAS_IMOBI = [
    'dashboard_imobi',
    'captacao_imobi',
    'funil_leads',
    'visitas_imobi',
    'roleta_imobi',
    'agentes_ia',
    'whatsapp_hub',
  ];

  const botoesBloco1Essencial = [
    { id: 'dashboard_imobi', icone: '📊', label: 'Visão Geral' },
    { id: 'captacao_imobi', icone: '🏠', label: 'Captação & Imóveis' },
    { id: 'funil_leads', icone: '👥', label: 'Leads & Funil CRM' },
    { id: 'visitas_imobi', icone: '📅', label: 'Agenda de Visitas' },
    { id: 'financeiro', icone: '💰', label: 'Financeiro & VGV' },
    { id: 'historico', icone: '📝', label: 'Propostas & Negócios' },
    { id: 'equipe', icone: '🧑‍💼', label: 'Corretores & Equipe' },
    { id: 'marketing', icone: '🎯', label: 'Meta Ads & Criativos' },
    { id: 'meuplano', icone: '⭐', label: 'Meu Plano (14 Dias Grátis)', destaquePlano: true },
  ];

  const botoesBloco2EsquadraoIA = [
    { id: 'agentes_ia', icone: '🤖', label: '7 Agentes de IA' },
    { id: 'radar_captacao', icone: '📡', label: 'Radar de Captação' },
    { id: 'whatsapp_hub', icone: '💬', label: 'Conexão WhatsApp' },
    { id: 'copiloto', icone: '⚡', label: 'Hermes Copiloto' },
    { id: 'secretaria', icone: '📷', label: 'QR Code Sofia' },
    { id: 'administrador', icone: '📈', label: 'Diretor Comercial IA' },
    { id: 'contador', icone: '🏛️', label: 'Assistente Fiscal' },
    { id: 'juridico_imobi', icone: '⚖️', label: 'Assistente Jurídico' },
  ];

  const botoesBloco3Gestao = [
    { id: 'roleta_imobi', icone: '🎯', label: 'Roleta de Leads' },
    { id: 'tarefa', icone: '📋', label: 'Vistoria & Laudo IA' },
    { id: 'notafiscal', icone: '📑', label: 'Repasses & NF' },
    { id: 'migracao', icone: '🔄', label: 'Migração de CRM' },
    { id: 'avaliacao_imovel', icone: '📐', label: 'Avaliação de Imóvel' },
    { id: 'credito', icone: '🏦', label: 'Correspondente / Crédito' },
    { id: 'config', icone: '⚙️', label: 'Configurações' },
    { id: 'especialista', icone: '🎧', label: 'Suporte Especialista' },
  ];

  return (
    <div
      style={{ minHeight: '100vh', background: isEscuro ? '#020408' : '#f1f5f9', color: t.texto, paddingBottom: '90px' }}
      className="transition-colors duration-300 font-sans"
    >
      {/* --- SEÇÃO DO TOPO / ALTERNÂNCIA DE MODO --- */}
      <header
        style={{ backgroundColor: '#020408' }}
        className="sticky top-0 z-40 flex flex-wrap items-center justify-between bg-zinc-900 border-b border-zinc-800 px-6 py-3 gap-3"
      >
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: '#10b981' }} className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-[#10b981]/30">
            <Building2 size={20} className="text-white" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-bold text-emerald-400">EXPRESS IMOBI TECH</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50">
              {rotuloModo({ master: ehMasterPlataforma, modoPro, isProConta })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ehMasterPlataforma ? (
            <>
              <span className="hidden text-[9px] font-black uppercase tracking-widest text-zinc-500 sm:inline">
                Demo
              </span>
              <button
                onClick={() => setModoPro(false)}
                style={!modoPro ? { backgroundColor: '#10b981' } : undefined}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  !modoPro
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Modo Grátis
              </button>
              <button
                onClick={() => setModoPro(true)}
                style={modoPro ? { backgroundColor: '#10b981' } : undefined}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  modoPro
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Modo Completo (PRO)
              </button>
            </>
          ) : (
            <>
              <span className="rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300">
                {isProConta ? 'Plano PRO Ativo' : 'Plano Gratuito'}
              </span>
              {!isProConta && (
                <button
                  onClick={() => setAbaAtiva('meuplano')}
                  style={{ backgroundColor: '#10b981' }}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-black text-slate-950 transition hover:brightness-110"
                  title="Ver planos e liberar todos os módulos"
                >
                  + PRO
                </button>
              )}
            </>
          )}

          <button
            onClick={toggleTema}
            className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Alternar tema Claro/Escuro"
          >
            {isEscuro ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={fazerLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition cursor-pointer"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      {/* --- NAVEGAÇÃO HORIZONTAL: ESSENCIAIS → PRO → ESQUADRÃO DE IA --- */}
      <nav style={{ backgroundColor: '#020408' }} className="relative border-b border-zinc-800/80">
        {/* Fundo com gradientes radiais profundos */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(1100px 220px at 12% -30%, rgba(16,185,129,0.13), transparent 62%),' +
              'radial-gradient(900px 200px at 88% -20%, rgba(245,158,11,0.10), transparent 60%),' +
              'radial-gradient(700px 180px at 50% 130%, rgba(20,184,166,0.08), transparent 65%)',
          }}
        />

        <div className="relative mx-auto max-w-[1600px] space-y-3 px-4 py-4 md:px-6">
          {/* CTA central — a cor acompanha a aba ativa */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setAbaAtiva('acompanhamento_cliente')}
              title="Ir para Acompanhamento do Cliente"
              className="group relative flex w-full max-w-3xl items-center gap-3 rounded-full border px-3 py-2.5 text-left transition-all duration-300 hover:-translate-y-0.5 md:gap-4 md:px-4"
              style={{
                borderColor: comAlpha(corAba, 0.55),
                background: `linear-gradient(135deg, ${comAlpha(corAba, 0.92)} 0%, ${comAlpha(corAba, 0.72)} 55%, ${comAlpha(corAba, 0.30)} 100%)`,
                boxShadow: `0 10px 40px -14px ${comAlpha(corAba, 0.85)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:h-11 md:w-11"
                style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <Sparkles size={18} color={textoCta} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block text-[8.5px] font-black uppercase tracking-[0.24em] md:text-[9.5px]"
                  style={{ color: textoCta, opacity: 0.85 }}
                >
                  Painel {modoPro ? 'Operacional PRO' : 'Essencial'} · Express Imobi Tech
                </span>
                <span
                  className="mt-0.5 block truncate text-[11px] font-black uppercase italic leading-tight tracking-[0.06em] md:text-sm"
                  style={{ color: textoCta }}
                >
                  ATUALIZAÇÕES & RASTREIO DO CLIENTE
                </span>
              </span>

              <span
                className="hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] sm:inline-flex"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: `1px solid ${comAlpha(corAba, 0.55)}`,
                  color: textoCta,
                }}
              >
                <Plus size={12} /> {modoPro ? 'PRO' : 'GRÁTIS'}
              </span>
            </button>
          </div>

          {/* Barra 1 — Módulos Essenciais (Grátis) */}
          <BarraModulos
            titulo="Essenciais · Grátis"
            tom="esmeralda"
            itens={filtrarPorPapel(botoesBloco1Essencial)}
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            detalhes={MAPA_DETALHES_ABAS}
            linhaUnica
          />

          {/* Barra 2 — Módulos PRO (Assinantes) */}
          {modoPro && (
            <BarraModulos
              titulo="PRO · Assinantes"
              tom="roxo"
              itens={filtrarPorPapel(botoesBloco3Gestao)}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              detalhes={MAPA_DETALHES_ABAS}
            />
          )}

          {/* Barra 3 — Esquadrão de IA (Elite) */}
          {modoPro && (
            <BarraModulos
              titulo="Esquadrão de IA · Elite"
              tom="ambar"
              itens={filtrarPorPapel(botoesBloco2EsquadraoIA)}
              abaAtiva={abaAtiva}
              setAbaAtiva={setAbaAtiva}
              detalhes={MAPA_DETALHES_ABAS}
              destaque
            />
          )}

          {/* Convite ao PRO no modo Grátis */}
          {!modoPro && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] to-transparent px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                  ✨ Ecossistema PRO
                </span>
                <span>
                  Libere os <strong className="text-amber-300">7 Agentes de IA 24h</strong>,{' '}
                  <strong className="text-amber-300">Automação WhatsApp</strong>,{' '}
                  <strong className="text-amber-300">Roleta de Leads</strong> e{' '}
                  <strong className="text-amber-300">Acompanhamento do Cliente</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAbaAtiva('meuplano')}
                  className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-200 transition-colors hover:border-amber-300 hover:text-white"
                >
                  ⭐ Meu Plano (14 Dias Grátis)
                </button>
                <button
                  onClick={() => setModoPro(true)}
                  className="rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1.5 text-[11px] font-black text-amber-950 shadow-[0_0_18px_rgba(245,158,11,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(245,158,11,0.65)]"
                >
                  🚀 Explorar Recursos PRO
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. ÁREA DE CONTEÚDO PRINCIPAL (NOVAS TELAS IMOBILIÁRIAS + MÓDULOS)
         ═══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-8">

        {/* ─── FAIXA CONTEXTUAL: para que serve esta aba (Dor → Ganho) ───────── */}
        <DorESolucao abaAtiva={abaAtiva} />

        {/* ─── ABA 1: PAINEL EXECUTIVO (VISÃO GERAL) ─────────────────────────── */}
        {abaAtiva === 'dashboard_imobi' && (
          <RodaProspeccao
            leads={listaLeads}
            visitas={listaVisitas}
            propostas={listaPropostas}
            tarefas={listaTarefas}
            oficinaId={imobiliariaId}
            papelLogado={papelLogado}
            usuarioNome={dadosImobiliaria?.nomeCorretor || dadosImobiliaria?.corretorResponsavel || ''}
            usuarioUid={currentUserId}
            vgv={(listaImoveis || []).reduce((acc, item) => acc + (Number(item?.valor) || 0), 0)}
            comissao={(listaImoveis || []).reduce((acc, item) => acc + (Number(item?.valor) || 0), 0) * 0.06}
            onAbrirAba={setAbaAtiva}
          />
        )}

        {abaAtiva === 'captacao_imobi' && (
          <div className="space-y-6">
            <CaptacaoNicho
              dadosOficina={dadosImobiliaria}
              setAbaAtiva={setAbaAtiva}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  🏠 GESTÃO & <span style={{ color: '#10b981' }}>VITRINE DE IMÓVEIS</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Cadastre o imóvel uma vez e ele já sai na vitrine e nos portais — sem digitar o mesmo dado duas vezes. Sua vitrine pública fica em <strong className="text-[#10b981]">/portal</strong>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="/portal?vitrine=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#020408] border border-[#10b981]/50 hover:border-[#10b981] text-[#10b981] font-extrabold text-xs transition"
                >
                  🌐 Ver Vitrine Pública (Portal do Cliente)
                </a>
                <button
                  onClick={() => setModalNovoImovel(true)}
                  style={{ backgroundColor: '#10b981' }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 text-white font-bold text-sm cursor-pointer"
                >
                  <Plus size={18} /> Cadastrar Novo Imóvel
                </button>
              </div>
            </div>

            {/* Filtro Rápido por Nicho e Padrão de Mercado */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'Todos', label: '🌐 Todos os Imóveis' },
                { id: 'MCMV', label: '🏡 Minha Casa, Minha Vida' },
                { id: 'Medio', label: '🏢 Médio Padrão' },
                { id: 'Alto', label: '💎 Alto Padrão / Luxo' },
                { id: 'Loteamento', label: '📐 Loteamentos & Condomínios' },
                { id: 'Rural', label: '🌾 Fazendas & Rurais' },
                { id: 'Locacao', label: '🔑 Locação' },
              ]?.map((abaNicho) => {
                const ativo = filtroNichoCaptacao === abaNicho.id;
                return (
                  <button
                    key={abaNicho.id}
                    type="button"
                    onClick={() => setFiltroNichoCaptacao(abaNicho.id)}
                    style={ativo ? { backgroundColor: '#10b981', borderColor: '#10b981' } : undefined}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      ativo
                        ? 'text-white shadow-md shadow-[#10b981]/20'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-[#10b981]'
                    }`}
                  >
                    {abaNicho.label}
                  </button>
                );
              })}
            </div>

            {(listaImoveis || []).length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
                <Home size={40} className="mx-auto text-slate-500 mb-3" />
                <h3 className="text-lg font-bold text-white">Nenhum imóvel captado ainda</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">
                  Cadastre apartamentos, lotes em condomínio, fazendas ou imóveis de locação com fotos para publicar na Vitrine Digital.
                </p>
                <button
                  onClick={() => setModalNovoImovel(true)}
                  style={{ backgroundColor: '#10b981' }}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                >
                  + Captar Primeiro Imóvel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(listaImoveis || [])
                  .filter((imv) => {
                    if (filtroNichoCaptacao === 'Todos') return true;
                    if (filtroNichoCaptacao === 'MCMV') return /minha casa|social/i.test(imv?.padraoImovel || '');
                    if (filtroNichoCaptacao === 'Medio') return /m[eé]dio/i.test(imv?.padraoImovel || 'Médio Padrão');
                    if (filtroNichoCaptacao === 'Alto') return /alto|luxo/i.test(imv?.padraoImovel || '');
                    if (filtroNichoCaptacao === 'Locacao') return imv?.finalidade === 'Locação';
                    if (filtroNichoCaptacao === 'Loteamento') return /lote|terreno/i.test(imv?.tipo || '');
                    if (filtroNichoCaptacao === 'Rural') return /fazenda|rural|ch[aá]cara|s[ií]tio/i.test(imv?.tipo || '');
                    return true;
                  })
                  ?.map((imv) => {
                    const isLote = /lote|terreno/i.test(imv?.tipo || '');
                    const isRural = /fazenda|rural|ch[aá]cara|s[ií]tio/i.test(imv?.tipo || '');
                    const isLocacao = imv?.finalidade === 'Locação';
                    const tagPadrao = obterEstiloTagPadrao(imv?.padraoImovel);
                    const fotosArr = Array.isArray(imv?.fotos) ? imv.fotos : [];
                    const capaUrl = imv?.fotoCapa || fotosArr[0] || '';
                    const isAtivoVitrine = !imv?.status || imv.status === 'Ativo' || imv.status === 'Disponível';

                    return (
                      <div
                        key={imv.id}
                        className="bg-slate-900 border border-slate-800 hover:border-[#10b981]/50 rounded-2xl overflow-hidden flex flex-col justify-between transition"
                      >
                        <div>
                          {/* Capa Fotográfica do Card */}
                          {capaUrl ? (
                            <div className="relative h-44 w-full bg-[#020408] overflow-hidden border-b border-slate-800">
                              <img
                                src={capaUrl}
                                alt={imv.titulo}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-[#020408]/85 ${tagPadrao.classes}`}>
                                  {tagPadrao.label}
                                </span>
                              </div>
                              {fotosArr.length > 0 && (
                                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold">
                                  📷 {fotosArr.length} foto(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="px-5 pt-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${tagPadrao.classes}`}>
                                {tagPadrao.label}
                              </span>
                            </div>
                          )}

                          <div className="p-5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-bold">
                                {imv.codigo || 'IMÓVEL'} • {imv.finalidade}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => alternarStatusVitrine(imv)}
                                  title="Alternar visibilidade na Vitrine Pública do Portal do Cliente"
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer border ${
                                    isAtivoVitrine
                                      ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {isAtivoVitrine ? '🟢 Ativo na Vitrine' : '⚪ Oculto'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCreditoPrefill({
                                      imovelId: imv.id,
                                      imovelTitulo: imv.titulo,
                                      valorImovel: imv.valor,
                                      bairro: imv.bairro,
                                    });
                                    setAbaAtiva('credito');
                                  }}
                                  title="Simular financiamento deste imóvel"
                                  className="px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer border bg-slate-800 text-[#10b981] border-slate-700 hover:border-[#10b981]"
                                >
                                  🏦 Simular
                                </button>
                                <button
                                  onClick={() => excluirRegistroImobi('imoveis_imobi', imv.id)}
                                  className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-white">{imv.titulo}</h3>
                            <p className="text-xs text-slate-400">
                              📍 {imv.bairro || 'Localização a definir'} • {imv.tipo}
                              {!isLote && !isRural && imv.quartos ? ` • ${imv.quartos} quartos` : ''}
                            </p>

                            {/* Detalhes específicos por Nicho */}
                            {isLote && (imv.quadra || imv.lote || imv.metragemTerreno) && (
                              <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                                <span className="text-[#10b981] font-extrabold block">📐 Dados do Loteamento / Condomínio:</span>
                                <span>
                                  Quadra: <strong>{imv.quadra || '-'}</strong> • Lote: <strong>{imv.lote || '-'}</strong> • Área:{' '}
                                  <strong>{imv.metragemTerreno ? `${imv.metragemTerreno} m²` : '-'}</strong>
                                </span>
                              </div>
                            )}

                            {isRural && (imv.hectares || imv.aptidaoRural || imv.benfeitorias) && (
                              <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                                <span className="text-[#10b981] font-extrabold block">🌾 Dados da Propriedade Rural:</span>
                                <span className="block">
                                  Área: <strong>{imv.hectares ? `${imv.hectares} ha` : 'A consultar'}</strong> • Aptidão:{' '}
                                  <strong>{imv.aptidaoRural || 'Mista'}</strong>
                                </span>
                                {imv.benfeitorias && (
                                  <span className="block text-slate-400 truncate">Benfeitorias: {imv.benfeitorias}</span>
                                )}
                              </div>
                            )}

                            {isLocacao && (imv.modalidadeGarantia || imv.regrasLocacao) && (
                              <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                                <span className="text-[#10b981] font-extrabold block">🔑 Condições de Locação (Lei 8.245/91):</span>
                                <span className="block">
                                  Garantia aceita: <strong>{imv.modalidadeGarantia || 'Seguro Fiança / Caução'}</strong>
                                </span>
                                {imv.regrasLocacao && (
                                  <span className="block text-slate-400 truncate">Regras: {imv.regrasLocacao}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          <span style={{ color: '#10b981' }} className="text-lg font-black text-[#10b981]">
                            {fmtBRL(imv.valor)}
                          </span>
                          <button
                            onClick={() => {
                              setFormVisita((prev) => ({ ...prev, imovel: `${imv.codigo || ''} - ${imv.titulo}` }));
                              setModalNovaVisita(true);
                            }}
                            style={{ backgroundColor: '#10b981' }}
                            className="px-3 py-1.5 rounded-lg hover:opacity-90 text-white text-xs font-bold cursor-pointer"
                          >
                            📅 Marcar Visita
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ─── ABA 3: FUNIL DE LEADS & CRM IMOBILIÁRIO ───────────────────────── */}
        {abaAtiva === 'funil_leads' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  👥 FUNIL DE <span style={{ color: '#10b981' }}>VENDAS & CRM</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Nenhum lead esfria por falta de retorno: cada cliente tem dono, etapa e prazo — e o card mostra quem está parado há mais tempo.
                </p>
                <p className="text-xs text-slate-400 mt-1.5">
                  VGV no Funil: <span className="text-[#10b981] font-bold">{fmtBRL(metricas.vgvLeadsCRM)}</span> • Comissão Prevista (6%):{' '}
                  <span className="text-[#10b981] font-bold">{fmtBRL(metricas.comissaoLeadsCRM)}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={redistribuirLeadsEquilibrado}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-200 hover:text-[#10b981] font-bold text-xs cursor-pointer transition"
                >
                  <Shuffle size={15} className="text-[#10b981]" /> Redistribuir Fila (Roleta)
                </button>
                <button
                  onClick={() => setAbaAtiva('roleta_imobi')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-300 font-bold text-xs cursor-pointer transition"
                >
                  ⚙️ Controlos da Roleta
                </button>
                <button
                  onClick={() => setModalNovoLeadImobi(true)}
                  style={{ backgroundColor: '#10b981' }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 text-white font-bold text-sm cursor-pointer"
                >
                  <Plus size={18} /> Adicionar Lead
                </button>
              </div>
            </div>

            {statusRoletaMsg && (
              <div className="bg-[#020408] border border-[#10b981] rounded-xl px-4 py-3 text-xs font-bold text-[#10b981] flex items-center justify-between">
                <span>{statusRoletaMsg}</span>
                <button onClick={() => setStatusRoletaMsg('')} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { titulo: 'Novo Lead', equivalentes: ['Novo Lead'] },
                { titulo: 'Em Atendimento', equivalentes: ['Em Atendimento', 'Qualificado IA'] },
                { titulo: 'Visita Agendada', equivalentes: ['Visita Agendada'] },
                { titulo: 'Fechado', equivalentes: ['Fechado', 'Proposta / Fechamento'] },
              ]?.map((colInfo) => {
                const coluna = colInfo.titulo;
                const leadsColuna = (Array.isArray(listaLeads) ? listaLeads : []).filter((l) =>
                  colInfo.equivalentes.includes(l?.estagio || 'Novo Lead')
                );
                return (
                  <div key={coluna} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 min-h-[360px]">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">{coluna}</h3>
                      <span style={{ color: '#10b981' }} className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-[#10b981]">
                        {leadsColuna.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(leadsColuna || [])?.map((lead) => (
                        <div key={lead.id} className="bg-[#020408] border border-slate-800 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{lead.nome}</span>
                            <button
                              onClick={() => excluirRegistroImobi('leads_imobi', lead.id)}
                              className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">
                            🎯 {lead.interesse} • 📍 {lead.bairro || 'A definir'}
                          </p>
                          <p style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">
                            💰 Orçamento: {fmtBRL(lead.orcamento)} • 6%: {fmtBRL((Number(lead.orcamento) || 0) * 0.06)}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-300 truncate">👔 {lead.corretorResponsavel || 'Plantão'}</p>
                            <button
                              onClick={() => {
                                setCreditoPrefill({
                                  leadId: lead.id,
                                  leadNome: lead.nome,
                                  valorImovel: lead.orcamento,
                                  imovelTitulo: lead.interesse,
                                });
                                setAbaAtiva('credito');
                              }}
                              title="Abrir o correspondente com este lead pré-carregado"
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-[#10b981] cursor-pointer transition"
                            >
                              🏦 Simular
                            </button>
                            <button
                              onClick={() => repassarLeadRoleta(lead)}
                              title="Repassar para o próximo corretor ativo na roleta"
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-[#10b981] cursor-pointer transition"
                            >
                              🔀 Repassar
                            </button>
                          </div>

                          <div className="pt-2 flex flex-wrap gap-1.5">
                            <button
                              onClick={() =>
                                abrirWhatsApp(
                                  lead.telefone,
                                  `Olá ${lead.nome}! Aqui é da imobiliária. Separei excelentes opções de ${lead.interesse} em ${lead.bairro || 'sua região'}!`
                                )
                              }
                              style={{ backgroundColor: '#10b981' }}
                              className="flex-1 py-1.5 px-2 rounded-lg text-white hover:opacity-90 text-[11px] font-bold cursor-pointer"
                            >
                              💬 Chamar Zap
                            </button>
                            <select
                              value={
                                lead.estagio === 'Qualificado IA'
                                  ? 'Em Atendimento'
                                  : lead.estagio === 'Proposta / Fechamento'
                                  ? 'Fechado'
                                  : lead.estagio || 'Novo Lead'
                              }
                              onChange={(e) => atualizarEstagioLead(lead.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1"
                            >
                              <option value="Novo Lead">Novo Lead</option>
                              <option value="Em Atendimento">Em Atendimento</option>
                              <option value="Visita Agendada">Visita Agendada</option>
                              <option value="Fechado">Fechado</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ABA 4: AGENDA DE VISITAS COM CONFIRMAÇÃO WHATSAPP ─────────────── */}
        {abaAtiva === 'visitas_imobi' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  📅 AGENDA DE <span style={{ color: '#10b981' }}>VISITAS & PLANTÃO</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Visita confirmada no WhatsApp antes do horário: menos plantão furado, mais negócio fechado.
                </p>
              </div>
              <button
                onClick={() => setModalNovaVisita(true)}
                style={{ backgroundColor: '#10b981' }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 text-white font-bold text-sm cursor-pointer"
              >
                <Plus size={18} /> Agendar Nova Visita
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(listaVisitas || [])?.map((vis) => (
                <div key={vis.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold">
                      📅 {vis.data || 'Data a confirmar'} às {vis.hora}
                    </span>
                    <button
                      onClick={() => excluirRegistroImobi('visitas_imobi', vis.id)}
                      className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <h3 className="font-bold text-white text-base">👤 {vis.cliente}</h3>
                  <p className="text-xs text-slate-300">🏠 Imóvel: {vis.imovel || 'Seleção da carteira'}</p>
                  <p className="text-xs text-slate-400">👔 Corretor: {vis.corretor}</p>
                  <button
                    onClick={() =>
                      abrirWhatsApp(
                        vis.telefone,
                        `Olá ${vis.cliente}! Confirmando nossa visita ao imóvel (${vis.imovel}) no dia ${vis.data} às ${vis.hora}. Posso confirmar sua presença?`
                      )
                    }
                    style={{ backgroundColor: '#10b981' }}
                    className="w-full py-2 rounded-xl hover:opacity-90 text-white text-xs font-bold cursor-pointer"
                  >
                    💬 Confirmar Visita no WhatsApp
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ABA 5: ROLETA DE DISTRIBUIÇÃO DE LEADS (MÓDULO DE ASSINANTES) ──── */}
        {abaAtiva === 'roleta_imobi' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  🔀 Módulo de Assinantes • Controlo de Gestão
                </div>
                <h2 className="text-2xl font-black text-white">Roleta de Leads & Distribuição Justa</h2>
                <p className="text-sm text-slate-400">
                  Distribui novos leads de forma rotativa e equilibrada entre os corretores ativos da equipa e calcula o VGV e comissões (6%) por corretor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs text-slate-300 font-bold">
                  Prazo p/ Aceite (min):
                  <input
                    type="number"
                    value={tempoRepasseMin}
                    onChange={(e) => setTempoRepasseMin(Number(e.target.value) || 5)}
                    className="ml-2 w-16 bg-[#020408] border border-slate-700 rounded-lg px-2 py-1 text-[#10b981] font-bold"
                  />
                </label>
                <button
                  onClick={redistribuirLeadsEquilibrado}
                  className="px-4 py-2 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-200 hover:text-[#10b981] text-xs font-bold cursor-pointer transition"
                >
                  🔀 Redistribuir Leads do CRM (Giro Justo)
                </button>
                <button
                  onClick={() => setRoletaAtiva((v) => !v)}
                  style={roletaAtiva ? { backgroundColor: '#10b981' } : undefined}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    roletaAtiva ? 'text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {roletaAtiva ? '✅ Roleta Ativa' : '⏸️ Roleta Pausada'}
                </button>
              </div>
            </div>

            {statusRoletaMsg && (
              <div className="bg-[#020408] border border-[#10b981] rounded-xl px-4 py-3 text-xs font-bold text-[#10b981] flex items-center justify-between">
                <span>{statusRoletaMsg}</span>
                <button onClick={() => setStatusRoletaMsg('')} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>
            )}

            {/* Painel de Controlo da Fila Rotativa + Adição Rápida de Corretor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Próximo Corretor da Vez</span>
                  <h3 style={{ color: '#10b981' }} className="text-xl font-black text-[#10b981] mt-1">
                    {roletaAtiva ? (proximoCorretorDaVez?.nome || 'Nenhum corretor ativo') : 'Roleta Pausada (Plantão Geral)'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Critério: menor carga ativa de leads no CRM + desempate por giro rotativo (Round-Robin).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Corretores no plantão: <strong className="text-white">{corretoresAtivos.length}</strong></span>
                  <button
                    onClick={() => setModalNovoLeadImobi(true)}
                    style={{ backgroundColor: '#10b981' }}
                    className="px-3 py-1.5 rounded-lg text-white font-bold cursor-pointer hover:opacity-90"
                  >
                    + Testar Novo Lead na Roleta
                  </button>
                </div>
              </div>

              <form
                onSubmit={adicionarCorretorRoleta}
                className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Adicionar Corretor à Equipa / Roleta</span>
                  <p className="text-xs text-slate-400 mt-0.5">Inclua corretores para participarem imediatamente na distribuição rotativa.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    placeholder="Nome (ex: Corretor Lucas)"
                    value={novoCorretorNome}
                    onChange={(e) => setNovoCorretorNome(e.target.value)}
                    className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    placeholder="WhatsApp (ex: 11988887777)"
                    value={novoCorretorZap}
                    onChange={(e) => setNovoCorretorZap(e.target.value)}
                    className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    style={{ backgroundColor: '#10b981' }}
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer hover:opacity-90"
                  >
                    + Incluir na Roleta
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(corretoresComMetricas || [])?.map((corretor) => {
                const ehProximo = roletaAtiva && proximoCorretorDaVez?.id === corretor.id;
                return (
                  <div
                    key={corretor.id}
                    className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                      ehProximo ? 'border-[#10b981]' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{corretor.nome}</h3>
                          {ehProximo && (
                            <span className="px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] text-[10px] font-extrabold uppercase">
                              Da Vez
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">📱 {corretor.whatsapp}</p>
                      </div>
                      <button
                        onClick={() =>
                          setCorretoresRoleta((prev) =>
                            (Array.isArray(prev) ? prev : [])?.map((c) => (c.id === corretor.id ? { ...c, ativo: !c.ativo } : c))
                          )
                        }
                        style={corretor.ativo ? { backgroundColor: '#10b981' } : undefined}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          corretor.ativo ? 'text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {corretor.ativo ? 'No Plantão' : 'Ausente'}
                      </button>
                    </div>

                    <div className="bg-[#020408] border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Leads atribuídos no CRM:</span>
                        <span style={{ color: '#10b981' }} className="font-black text-[#10b981]">{corretor.leadsRecebidos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">VGV sob gestão:</span>
                        <span className="font-bold text-white">{fmtBRL(corretor.vgvAtribuido)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Comissão prevista (6%):</span>
                        <span style={{ color: '#10b981' }} className="font-bold text-[#10b981]">{fmtBRL(corretor.comissaoCorretor)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ABA 6: CENTRAL DOS 7 AGENTES DE IA + SIMULADOR AO VIVO ────────── */}
        {abaAtiva === 'agentes_ia' && (
          <div className="space-y-6">
            <HeroAba
              icone={Bot}
              titulo="Esquadrão de"
              destaque="7 Agentes de IA"
              chip="Atendimento autônomo 24h no WhatsApp"
              subtitulo="Sete assistentes que qualificam o lead, respondem dúvidas repetidas, agendam visita e chamam o cliente de volta — você entra quando a conversa está quente."
              cor="#8b5cf6"
            />
            <GuiaDaAba
              titulo="Esquadrão de IA"
              descricao="São sete assistentes que trabalham juntos: qualificam o lead, respondem a dúvida repetida, agendam visita e chamam o cliente de volta. Você entra quando a conversa está quente."
            />
            <ControleInteligenciaIA
              isPro={isPro}
              setAbaAtiva={setAbaAtiva}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  🤖 ESQUADRÃO DE <span style={{ color: '#10b981' }}>INTELIGÊNCIA ARTIFICIAL</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Equipe de 7 agentes autônomos trabalhando 24h por dia na qualificação de leads, triagem, agendamento de visitas e reengajamento no WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(agentesIA || [])?.map((ag) => (
                  <div key={ag.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: '#10b981' }} className="text-xs font-extrabold text-[#10b981]">{ag.cargo}</span>
                        <button
                          onClick={() =>
                            setAgentesIA((prev) =>
                              (Array.isArray(prev) ? prev : [])?.map((item) => (item.id === ag.id ? { ...item, ativo: !item.ativo } : item))
                            )
                          }
                          style={ag.ativo ? { backgroundColor: '#10b981' } : undefined}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            ag.ativo ? 'text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ag.ativo ? 'ATIVO' : 'PAUSADO'}
                        </button>
                      </div>
                      <h3 className="font-bold text-white text-sm">{ag.nome}</h3>
                      <p className="text-xs text-slate-400 mt-1">{ag.prompt}</p>
                    </div>
                    <p style={{ color: '#10b981' }} className="text-[11px] font-bold text-[#10b981] mt-3 pt-2 border-t border-slate-800">
                      ⚡ {ag.atendimentos} interações processadas
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulador de Triagem ao Vivo para Demonstração Comercial */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[560px]">
              <div className="pb-3 mb-3 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} style={{ color: '#10b981' }} className="text-[#10b981]" /> Simulador de Demonstração (Ao Vivo)
                  </h3>
                  <button
                    type="button"
                    onClick={reiniciarSimuladorIA}
                    className="px-2.5 py-1 rounded-lg bg-[#020408] border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-slate-300 hover:text-[#10b981] cursor-pointer transition"
                  >
                    🔄 Reiniciar Chat
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Memória ativa: veja a transição automática Sofia (Triagem) → Iago (Qualificação) → Téo (Agenda).
                </p>

                {/* Barra de Memória de Contexto Capturada pela IA */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-extrabold">
                    🤖 {contextoSimuladorIA.agenteAtual}
                  </span>
                  {contextoSimuladorIA.bairro && (
                    <span className="px-2 py-0.5 rounded-md bg-[#020408] border border-slate-700 text-slate-200 text-[10px] font-bold">
                      📍 {contextoSimuladorIA.bairro}
                    </span>
                  )}
                  {contextoSimuladorIA.orcamento && (
                    <span className="px-2 py-0.5 rounded-md bg-[#020408] border border-slate-700 text-[#10b981] text-[10px] font-bold">
                      💰 {contextoSimuladorIA.orcamento}
                    </span>
                  )}
                  {contextoSimuladorIA.horarioVisita && (
                    <span className="px-2 py-0.5 rounded-md bg-[#020408] border border-[#10b981]/50 text-white text-[10px] font-bold">
                      🗓️ Visita: {contextoSimuladorIA.horarioVisita}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(historicoTesteIA || [])?.map((m, idx) => (
                  <div
                    key={idx}
                    style={m.autor === 'cliente' ? { backgroundColor: '#10b981' } : { backgroundColor: '#020408' }}
                    className={`p-3 rounded-2xl text-xs max-w-[88%] whitespace-pre-line ${
                      m.autor === 'cliente'
                        ? 'ml-auto text-white'
                        : 'border border-slate-800 text-slate-200'
                    }`}
                  >
                    {m.autor === 'ia' && m.agente && (
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10b981] mb-1">
                        {m.agente}
                      </span>
                    )}
                    {m.texto}
                  </div>
                ))}
              </div>

              <form onSubmit={simularRespostaAgente} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={msgTesteIA}
                  onChange={(e) => setMsgTesteIA(e.target.value)}
                  placeholder="Ex: Quero visitar um apto de 2 quartos até 350 mil..."
                  className="flex-1 bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: '#10b981' }}
                  className="px-4 py-2 rounded-xl hover:opacity-90 text-white text-xs font-bold cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
            </div>
          </div>
        )}

        {/* ─── ABA 7: HUB DE CONEXÃO WHATSAPP + TYPEBOT + GEMINI ─────────────── */}
        {abaAtiva === 'whatsapp_hub' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div>
              <HeroAba
                icone={MessageCircle}
                titulo="Central de Conexão"
                destaque="WhatsApp & Typebot"
                chip="Atendimento automático 24h sem servidor Docker"
                subtitulo="Ligue o fluxo visual na nuvem direto à chave gratuita do Gemini Flash."
                cor="#22c55e"
              />
            </div>

            <ControleInteligenciaIA
              isPro={isPro}
              setAbaAtiva={setAbaAtiva}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#020408] border border-slate-800 rounded-2xl p-5 space-y-2">
                <span style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">PASSO 1 • CÉREBRO GRATUITO</span>
                <h3 className="font-bold text-white">Chave Gemini AI Studio</h3>
                <p className="text-xs text-slate-400">Motor `gemini-2.5-flash` pronto para responder dúvidas de imóveis e qualificar leads 24h.</p>
              </div>
              <div className="bg-[#020408] border border-slate-800 rounded-2xl p-5 space-y-2">
                <span style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">PASSO 2 • FLUXO VISUAL</span>
                <h3 className="font-bold text-white">Typebot Cloud</h3>
                <p className="text-xs text-slate-400">Triagem de Compra/Locação + Coleta de Bairro/Orçamento enviando Webhook para o painel.</p>
              </div>
              <div className="bg-[#020408] border border-slate-800 rounded-2xl p-5 space-y-2">
                <span style={{ color: '#10b981' }} className="text-xs font-bold text-[#10b981]">PASSO 3 • QR CODE WHATSAPP</span>
                <h3 className="font-bold text-white">Gateway WhatsApp</h3>
                <p className="text-xs text-slate-400">Leitura rápida de QR Code no celular do corretor para ativar os 14 dias de teste acompanhado.</p>
              </div>
            </div>
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
              papelLogado={papelLogado}
              permissoesLogado={permissoesLogado}
              formatarMoeda={formatarMoeda}
              toggleTema={toggleTema}
              onSalvo={carregarFinanceiro}
            />
          </SafeBoundary>
        )}

        <RodapeLegal />
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. MODAIS RÁPIDOS DOS BOTÕES DO TOPO (+ IMÓVEL, + LEAD, + VISITA)
         ═══════════════════════════════════════════════════════════════════════ */}
      {modalNovoImovel && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={salvarImovelImobi}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4 my-8"
          >
            <div>
              <h3 className="text-lg font-black text-white">🏠 Captar Novo Imóvel (Multi-Nicho)</h3>
              <p className="text-xs text-slate-400">
                Os campos abaixo adaptam-se automaticamente para Imóvel Urbano, Loteamento, Fazenda/Rural ou Locação.
              </p>
            </div>

            <input
              required
              placeholder="Título (Ex: Apto Varanda Gourmet / Lote Condomínio / Fazenda 120 ha)"
              value={formImovel.titulo}
              onChange={(e) => setFormImovel({ ...formImovel, titulo: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Finalidade</label>
                <select
                  value={formImovel.finalidade}
                  onChange={(e) => setFormImovel({ ...formImovel, finalidade: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
                >
                  <option>Venda</option>
                  <option>Locação</option>
                  <option>Arrendamento Rural</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nicho / Tipo de Imóvel</label>
                <select
                  value={formImovel.tipo}
                  onChange={(e) => setFormImovel({ ...formImovel, tipo: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
                >
                  <option>Apartamento</option>
                  <option>Casa</option>
                  <option>Cobertura</option>
                  <option>Loteamento / Condomínio</option>
                  <option>Terreno / Lote</option>
                  <option>Fazenda / Imóvel Rural</option>
                  <option>Chácara / Sítio</option>
                  <option>Comercial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#10b981] mb-1">
                  Classificação por Padrão / Enquadramento
                </label>
                <select
                  value={formImovel.padraoImovel}
                  onChange={(e) => setFormImovel({ ...formImovel, padraoImovel: e.target.value })}
                  className="w-full bg-[#020408] border border-[#10b981]/60 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
                >
                  <option value="Minha Casa, Minha Vida / Interesse Social">
                    Minha Casa, Minha Vida / Interesse Social
                  </option>
                  <option value="Médio Padrão">Médio Padrão</option>
                  <option value="Alto Padrão / Luxo">Alto Padrão / Luxo</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Status na Vitrine Pública
                </label>
                <select
                  value={formImovel.status}
                  onChange={(e) => setFormImovel({ ...formImovel, status: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
                >
                  <option value="Ativo">Ativo (Visível na Vitrine do Cliente)</option>
                  <option value="Reservado">Reservado / Em Proposta</option>
                  <option value="Inativo">Inativo / Oculto</option>
                </select>
                <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                  <input
                    type="checkbox"
                    checked={formImovel.publicarPortais !== false}
                    onChange={(e) => setFormImovel({ ...formImovel, publicarPortais: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#10b981]"
                  />
                  Publicar nos portais (ZAP/VivaReal/OLX)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Bairro / Município / Região"
                value={formImovel.bairro}
                onChange={(e) => setFormImovel({ ...formImovel, bairro: e.target.value })}
                className="bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
              <input
                placeholder="Valor de Venda ou Aluguel (R$)"
                value={formImovel.valor}
                onChange={(e) => setFormImovel({ ...formImovel, valor: e.target.value })}
                className="bg-[#020408] border border-[#10b981]/60 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold"
              />
            </div>

            {/* GALERIA DE FOTOS DO IMÓVEL & FOTO DE CAPA PRINCIPAL */}
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase text-[#10b981]">
                  📷 Galeria de Fotos & Foto de Capa ({(formImovel.fotos || []).length})
                </span>
                <label className="px-3 py-1 rounded-lg bg-[#10b981] text-white text-[11px] font-black cursor-pointer hover:opacity-90 transition">
                  + Enviar Arquivos de Imagem
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadArquivosImovel}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  value={novaFotoInput}
                  onChange={(e) => setNovaFotoInput(e.target.value)}
                  placeholder="Ou cole o link de uma foto (https://...)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => adicionarLinkFotoImovel()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-[#10b981] text-xs font-extrabold text-white cursor-pointer transition"
                >
                  Adicionar Link
                </button>
              </div>

              {/* Sugestões rápidas de fotos para teste imediato */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">Fotos exemplo 1-clique:</span>
                {[
                  {
                    nome: '+ Apto Moderno',
                    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80',
                  },
                  {
                    nome: '+ Casa Condomínio',
                    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80',
                  },
                  {
                    nome: '+ Fazenda / Rural',
                    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
                  },
                ]?.map((demo) => (
                  <button
                    key={demo.nome}
                    type="button"
                    onClick={() => adicionarLinkFotoImovel(demo.url)}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-slate-300 hover:text-[#10b981] cursor-pointer"
                  >
                    {demo.nome}
                  </button>
                ))}
              </div>

              {/* Miniaturas da Galeria com Seleção da Foto de Capa */}
              {Array.isArray(formImovel.fotos) && formImovel.fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(formImovel.fotos || [])?.map((fotoUrl, idx) => {
                    const isCapa = formImovel.fotoCapa === fotoUrl || (!formImovel.fotoCapa && idx === 0);
                    return (
                      <div
                        key={`${idx}_${fotoUrl.slice(0, 24)}`}
                        className={`relative rounded-xl overflow-hidden border-2 h-20 group ${
                          isCapa ? 'border-[#10b981]' : 'border-slate-800'
                        }`}
                      >
                        <img src={fotoUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setFormImovel({ ...formImovel, fotoCapa: fotoUrl })}
                            style={{ backgroundColor: '#10b981' }}
                            className="px-2 py-1 rounded text-[9px] font-black text-white cursor-pointer"
                          >
                            ★ Capa
                          </button>
                          <button
                            type="button"
                            onClick={() => removerFotoGaleria(fotoUrl)}
                            className="px-2 py-1 rounded bg-red-600 text-[9px] font-black text-white cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        {isCapa && (
                          <span
                            style={{ backgroundColor: '#10b981' }}
                            className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white"
                          >
                            ★ CAPA
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CAMPOS ESPECÍFICOS 1: LOTEAMENTOS / CONDOMÍNIOS (QUADRA, LOTE E METRAGEM) */}
            {/lote|terreno/i.test(formImovel.tipo) && (
              <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                  📐 Especificações de Loteamento / Condomínio
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quadra</label>
                    <input
                      placeholder="Ex: Qd. 14"
                      value={formImovel.quadra}
                      onChange={(e) => setFormImovel({ ...formImovel, quadra: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Lote</label>
                    <input
                      placeholder="Ex: Lote 08"
                      value={formImovel.lote}
                      onChange={(e) => setFormImovel({ ...formImovel, lote: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Metragem (m²)</label>
                    <input
                      placeholder="Ex: 360"
                      value={formImovel.metragemTerreno}
                      onChange={(e) => setFormImovel({ ...formImovel, metragemTerreno: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CAMPOS ESPECÍFICOS 2: FAZENDAS / IMÓVEIS RURAIS (HECTARES, BENFEITORIAS E APTIDÃO) */}
            {/fazenda|rural|ch[aá]cara|s[ií]tio/i.test(formImovel.tipo) && (
              <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                  🌾 Especificações de Fazenda / Imóvel Rural
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Área Total (Hectares)</label>
                    <input
                      placeholder="Ex: 150 ha"
                      value={formImovel.hectares}
                      onChange={(e) => setFormImovel({ ...formImovel, hectares: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Aptidão Principal</label>
                    <select
                      value={formImovel.aptidaoRural}
                      onChange={(e) => setFormImovel({ ...formImovel, aptidaoRural: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option>Dupla Aptidão (Lavoura e Pecuária)</option>
                      <option>Lavoura / Grãos (Soja, Milho, Café)</option>
                      <option>Pecuária (Corte / Leite)</option>
                      <option>Lazer / Haras / Turismo</option>
                      <option>Reflorestamento / Eucalipto</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Benfeitorias e Recursos Hídricos
                  </label>
                  <input
                    placeholder="Ex: Casa sede, curral completo, represa, CAR e Georreferenciamento OK"
                    value={formImovel.benfeitorias}
                    onChange={(e) => setFormImovel({ ...formImovel, benfeitorias: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* CAMPOS ESPECÍFICOS 3: LOCAÇÃO (MODALIDADE DE GARANTIA E REGRAS DA LOCAÇÃO) */}
            {formImovel.finalidade === 'Locação' && (
              <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                  🔑 Garantia e Regras de Locação (Lei do Inquilinato 8.245/91)
                </span>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Modalidade de Garantia Aceita (Art. 37)
                  </label>
                  <select
                    value={formImovel.modalidadeGarantia}
                    onChange={(e) => setFormImovel({ ...formImovel, modalidadeGarantia: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option>Seguro Fiança / CredPago</option>
                    <option>Caução (Até 3x o valor do aluguel)</option>
                    <option>Fiador com Imóvel Quitadado</option>
                    <option>Título de Capitalização</option>
                    <option>Locação Sem Garantia (Aluguel Antecipado — Art. 42)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Regras da Locação e Observações Contratuais
                  </label>
                  <input
                    placeholder="Ex: Aceita Pet, Contrato 30 meses com isenção de multa após 12 meses"
                    value={formImovel.regrasLocacao}
                    onChange={(e) => setFormImovel({ ...formImovel, regrasLocacao: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovoImovel(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoAcao}
                style={{ backgroundColor: '#10b981' }}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
              >
                {salvandoAcao ? 'Salvando...' : 'Salvar Imóvel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modalNovoLeadImobi && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={salvarLeadImobi}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-lg font-black text-white">👥 Cadastrar Novo Lead Imobiliário</h3>
            <div className="bg-[#020408] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between">
              <span className="text-slate-400">🔀 Destino na Roleta:</span>
              <span style={{ color: '#10b981' }} className="font-bold text-[#10b981]">
                {roletaAtiva ? (proximoCorretorDaVez?.nome || 'Plantão Geral') : 'Fila Manual (Roleta Pausada)'}
              </span>
            </div>
            <input
              required
              placeholder="Nome do Cliente"
              value={formLead.nome}
              onChange={(e) => setFormLead({ ...formLead, nome: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <input
              required
              placeholder="WhatsApp com DDD (Ex: 11999998888)"
              value={formLead.telefone}
              onChange={(e) => setFormLead({ ...formLead, telefone: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formLead.interesse}
                onChange={(e) => setFormLead({ ...formLead, interesse: e.target.value })}
                className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option>Compra</option>
                <option>Locação</option>
                <option>Investimento</option>
              </select>
              <input
                placeholder="Orçamento (R$)"
                value={formLead.orcamento}
                onChange={(e) => setFormLead({ ...formLead, orcamento: e.target.value })}
                className="bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <input
              placeholder="Bairro de Preferência"
              value={formLead.bairro}
              onChange={(e) => setFormLead({ ...formLead, bairro: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovoLeadImobi(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoAcao}
                style={{ backgroundColor: '#10b981' }}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
              >
                {salvandoAcao ? 'Distribuindo...' : 'Salvar e Enviar p/ Roleta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modalNovaVisita && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={salvarVisitaImobi}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-lg font-black text-white">📅 Agendar Visita ao Imóvel</h3>
            <input
              required
              placeholder="Nome do Cliente"
              value={formVisita.cliente}
              onChange={(e) => setFormVisita({ ...formVisita, cliente: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <input
              placeholder="WhatsApp do Cliente"
              value={formVisita.telefone}
              onChange={(e) => setFormVisita({ ...formVisita, telefone: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <input
              placeholder="Imóvel / Código"
              value={formVisita.imovel}
              onChange={(e) => setFormVisita({ ...formVisita, imovel: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formVisita.data}
                onChange={(e) => setFormVisita({ ...formVisita, data: e.target.value })}
                className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
              />
              <input
                type="time"
                value={formVisita.hora}
                onChange={(e) => setFormVisita({ ...formVisita, hora: e.target.value })}
                className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalNovaVisita(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoAcao}
                style={{ backgroundColor: '#10b981' }}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
              >
                {salvandoAcao ? 'Agendando...' : 'Confirmar Visita'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModuloBloqueado
        toastModuloBloqueado={toastModuloBloqueado}
        modalUpgradeAba={modalUpgradeAba}
        setToastModuloBloqueado={setToastModuloBloqueado}
        setModalUpgradeAba={setModalUpgradeAba}
        setAbaAtiva={setAbaAtiva}
        MAIN={IMOBI_PRIMARY}
        planosSistema={planosSistema}
        LABELS_ABAS_MODAL={LABELS_ABAS_IMOBI}
        papelLogado={papelLogado}
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
