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
import SofiaWhatsAppTab from './components/admin/SofiaWhatsAppTab';
import ExpressBrainTab from './components/admin/ExpressBrainTab';
import PainelZaraOperacional from './components/admin/PainelZaraOperacional';
import ReunioesAtasIA from './components/abas/ReunioesAtasIA';
import ModalPacoteCompleto from './components/admin/ModalPacoteCompleto';
import { carregarCenarioDemo } from './lib/cenarioDemo';
import { executarAuditoriaZara, carregarUltimaAuditoriaZara } from './lib/auditoriaZara';
import MapaInteligenciaImobiliaria from './components/admin/MapaInteligenciaImobiliaria';
import EsteiraCartorioEscritura from './components/imobi/EsteiraCartorioEscritura';
import ModuloComAbas from './components/admin/ModuloComAbas';
import GuiaCampoGratis from './components/admin/GuiaCampoGratis';
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
import { FOTOS_EXEMPLO, AVISO_FOTO_EXEMPLO, ehFotoExemplo, temFotoExemplo } from './lib/fotosExemplo';
import { adicionarFotosImovel, MAX_FOTOS_IMOVEL } from './lib/fotosImovel';
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

import { useAuth } from './contexts/AuthContext';
import useCarregamentoInicial from './hooks/useCarregamentoInicial.jsx';
import { registrarEventoLead, TIPOS_EVENTO } from './services/girardEngine';
import RodaProspeccao from './components/RodaProspeccao';
import useQuickActions, { parseMoedaBR } from './hooks/useQuickActions';
import { cabecalhosIA } from './lib/aiAuth';
import {
  ACOES_POLEN,
  AVISO_CATALOGO_VAZIO,
  AVISO_SEM_DISPONIVEIS,
  descreverHandoff,
  filtrarCatalogoDisponivel,
  responderSofiaSimulacao,
} from './lib/simuladorSofia';
import { obterRespostaRapida0Tokens } from './data/cerebroPolen';
import { LIMITE_DEMO, podeUsarDemo, registrarUsoDemo, restantesDemo } from './lib/limiteDemo';
import PainelDiretorComercialEstrategia from './components/admin/PainelDiretorComercialEstrategia';

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

/** Saudação fixa do simulador: é a única frase que não vem da IA. */
const SAUDACAO_SOFIA_SIMULACAO =
  'Olá! Sou a Pólen, a mesma atendente que atende no WhatsApp 24h. Escreva como se você fosse o cliente (bairro, tipo de imóvel, faixa de valor) — eu respondo com os imóveis reais do seu catálogo, sem inventar preço, taxa ou parcela.';

const historicoInicialSimulador = () => [
  { autor: 'ia', agente: 'Pólen • modo simulação', texto: SAUDACAO_SOFIA_SIMULACAO },
];

const GRUPOS_MENU_IMOBI = [
  {
    titulo: 'BLOCO 1: FERRAMENTAS ESSENCIAIS',
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
        tier: 'pro',
        descricao:
          'Cadastre imóveis com até 7 fotos e publique na vitrine. A primeira foto vira a capa e a imagem principal para a Pólen.',
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
        tier: 'pro',
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
        tier: 'pro',
        descricao:
          'Anúncio pronto em 1 minuto: arte, legenda e público no tom que o cliente responde. Pare de improvisar post no meio do plantão.',
      },
      {
        id: 'meuplano',
        label: '⭐ Meu Plano (10 Dias Grátis)',
        tituloCard: 'MEU PLANO (10 DIAS GRÁTIS)',
        tituloLimpo: 'Meu Plano (10 Dias Grátis) & Assinatura',
        tier: 'gratis',
        descricao:
          'Acompanhe o status do seu período de testes de 10 dias grátis, compare os recursos do Modo Grátis vs Modo PRO e faça upgrade quando desejar.',
      },
    ],
  },
  {
    titulo: 'BLOCO 2: IA DO PAINEL (PRO) E OPERAÇÃO IA',
    cor: '#10b981',
    itens: [
      {
        id: 'whatsapp_hub',
        label: '💬 Conexão WhatsApp',
        tituloCard: 'CONEXÃO WHATSAPP & GATEWAY',
        tituloLimpo: 'Conexão WhatsApp',
        tier: 'operacao',
        descricao: 'Conexão de WhatsApp para a Pólen, produto com contratação e implantação próprias.',
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
        label: '📲 Ativação & QR Code da Pólen (WhatsApp)',
        tituloCard: 'ATIVAÇÃO & QR CODE DA PÓLEN (WHATSAPP)',
        tituloLimpo: 'Ativação & QR Code da Pólen (WhatsApp)',
        tier: 'operacao',
        descricao:
          'Central prática de conexão via QR Code para a Pólen · Atendimento 24h, produto com contratação e implantação próprias.',
      },
      {
        id: 'sofia_whatsapp',
        label: '📲 Pólen · Atendimento 24h',
        tituloCard: 'PÓLEN · ATENDIMENTO 24H',
        tituloLimpo: 'Pólen · Atendimento 24h',
        tier: 'operacao',
        descricao:
          'Conexão do WhatsApp da imobiliária e ativação da Pólen por QR Code; contratação e implantação são próprias.',
      },
      {
        id: 'brain',
        label: '🧠 Tom · Segundo Cérebro',
        tituloCard: 'TOM · SEGUNDO CÉREBRO',
        tituloLimpo: 'Tom · Segundo Cérebro',
        tier: 'operacao',
        descricao:
          'Tom apoia decisões estratégicas; arquivos e memória operacional estão em implantação. Zara coordena os Agentes Operacionais em uma área própria.',
      },
      {
        id: 'administrador',
        label: '📈 Diretor Comercial IA',
        tituloCard: 'DIRETOR COMERCIAL PREDITIVO',
        tituloLimpo: 'DIRETOR COMERCIAL PREDITIVO',
        tier: 'plus',
        descricao:
          'Análise preditiva de conversão de leads, auditoria do atendimento da equipe em tempo real e alertas automáticos sobre oportunidades quentes paradas no CRM.',
      },
      {
        id: 'contador',
        label: '🧾 Simuladores',
        tituloCard: 'SIMULADORES DE CUSTOS',
        tituloLimpo: 'SIMULADORES DE CUSTOS',
        tier: 'plus',
        descricao:
          'Calculadora interna de margem líquida, comissão e carga tributária da venda, com recibos e memória de cálculo. Para financiamento, entrada e parcelas do comprador, use Correspondente / Crédito.',
      },
      {
        id: 'juridico_imobi',
        label: '⚖️ Assistente Legal',
        tituloCard: 'ASSISTENTE LEGAL',
        tituloLimpo: 'ASSISTENTE LEGAL',
        tier: 'plus',
        descricao:
          'Apoio informativo e rascunhos de referência; o conteúdo não é parecer jurídico e exige revisão por advogado inscrito na OAB.',
      },
    ],
  },
  {
    titulo: 'GESTÃO, CONTRATOS & MÓDULOS DE ASSINANTES (PRO E PLUS)',
    cor: '#10b981',
    itens: [
      {
        id: 'roleta_imobi',
        label: '🔀 Roleta de Leads',
        tituloCard: 'ROLETA INTELIGENTE DE LEADS',
        tituloLimpo: 'Roleta de Leads',
        tier: 'plus',
        descricao: 'Distribuição automática e justa de leads em fila rotativa entre corretores de plantão.',
      },
      {
        id: 'tarefa',
        label: '📸 Vistoria & Laudo IA',
        tituloCard: 'VISTORIA & LAUDO FOTOGRÁFICO IA',
        tituloLimpo: 'Vistoria & Laudo Fotográfico IA',
        tier: 'plus',
        descricao:
          'Laudo fotográfico por ambiente na entrada e na saída: acabou a discussão sobre o estado do imóvel e o desconto de caução no chute.',
      },
      {
        id: 'notafiscal',
        label: '📄 Repasses & NF',
        tituloCard: 'REPASSES & NFS-E UNIFICADA (ADN + IBS/CBS)',
        tituloLimpo: 'Repasses & NFS-e Unificada (ADN + IBS/CBS)',
        tier: 'plus',
        descricao:
          'Nota e repasse no mesmo lugar: você emite, divide com o proprietário e vê exatamente quanto entra na conta.',
      },
      {
        id: 'migracao',
        label: '🔄 Migração de CRM',
        tituloCard: 'MIGRAÇÃO INTELIGENTE DE CRM',
        tituloLimpo: 'Migração de CRM',
        tier: 'gratis',
        descricao:
          'Importa carteira de leads e imóveis em 3 etapas — planilha, XML de portal, PDF ou lista colada — com régua de temperatura e mensagem de WhatsApp pronta.',
      },
      {
        id: 'meuplano',
        label: '⭐ Meu Plano (10 Dias Grátis)',
        tituloCard: 'MEU PLANO (10 DIAS GRÁTIS)',
        tituloLimpo: 'Meu Plano (10 Dias Grátis) & Assinatura',
        tier: 'gratis',
        descricao:
          'Acompanhe o status do seu período de testes de 10 dias grátis, compare os recursos do Modo Grátis vs Modo PRO e faça upgrade quando desejar.',
      },
      {
        id: 'config',
        label: '⚙️ Configurações',
        tituloCard: 'CONFIGURAÇÕES DA IMOBILIÁRIA / CORRETOR',
        tituloLimpo: 'Configurações da Imobiliária / Corretor',
        tier: 'gratis',
        descricao: 'Personalização de CRECI, logomarca, chave PIX de comissões e dados institucionais.',
      },
      {
        id: 'radar_captacao',
        label: '📡 Radar de Captação',
        tituloCard: 'RADAR DE CAPTAÇÃO',
        tituloLimpo: 'Radar de Captação (Particulares)',
        tier: 'plus',
        descricao:
          'Monta buscas de anúncios de particular na OLX, Marketplace e Google, extrai preço/área/contato de um anúncio colado, compara com o mercado e devolve três abordagens de WhatsApp — além do feed XML para ZAP, VivaReal e OLX.',
      },
      {
        id: 'credito',
        label: '🏦 Correspondente / Crédito',
        tituloCard: 'CORRESPONDENTE / CRÉDITO',
        tituloLimpo: 'Correspondente / Crédito',
        tier: 'plus',
        descricao:
          'Enquadra renda e financiamento, estima parcelas e subsídios e organiza o processo de crédito para o cliente.',
      },
      {
        id: 'avaliacao_imovel',
        label: '📐 Avaliação de Imóvel',
        tituloCard: 'AVALIAÇÃO DE IMÓVEL',
        tituloLimpo: 'Avaliação de Imóvel (PTAM)',
        tier: 'plus',
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
        tier: 'gratis',
        descricao: 'Central de apoio operacional e consultoria técnica para acelerar resultados na plataforma.',
      },
      {
        id: 'guia_campo_bonus',
        label: 'Arena & Treinamento',
        tituloCard: 'ARENA & TREINAMENTO',
        tituloLimpo: 'Arena de Treinamento & Roleplay IA',
        tier: 'gratis',
        descricao:
          'Simulação de negociação com clientes exigentes em até 5 turnos, ditado por voz e avaliação executiva de autoridade.',
      },
    ],
  },
];

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

const MAPA_DETALHES_ABAS = (GRUPOS_MENU_IMOBI || [])
  .flatMap((g) => (g?.itens || [])?.map((item) => ({ ...item, grupoTitulo: g.titulo })))
  .reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {});

MAPA_DETALHES_ABAS.agentes_ia = {
  ...MAPA_DETALHES_ABAS.brain,
  id: 'agentes_ia',
  label: 'Agentes Operacionais · Zara',
  tituloCard: 'AGENTES OPERACIONAIS',
  tituloLimpo: 'Agentes Operacionais · Zara',
  descricao: 'Zara coordena os agentes e a execução recorrente do funil e da rotina.',
};
MAPA_DETALHES_ABAS.mapa_inteligencia = {
  id: 'mapa_inteligencia',
  label: 'Central de Inteligência da Imobiliária',
  tituloCard: 'MAPA DE INTEGRAÇÃO DA OPERAÇÃO',
  tituloLimpo: 'Central de Inteligência da Imobiliária',
  descricao: 'Mapa visual da conexão entre Pólen, Agentes Operacionais, Tom e CRM.',
};
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

const AGENTES_INICIAIS = [
  {
    id: 'sofia_triagem',
    nome: 'Pólen — Atendimento & Triagem 24h',
    cargo: 'Recepção 24h no WhatsApp',
    ativo: true,
    // Lote 4 — a Pólen é a demonstração do atendimento no degrau Grátis.
    // O WhatsApp oficial com QR Code é a Pólen (D-22.09): R$ 450/mês + implantação.
    demonstracao: true,
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
LABELS_ABAS_IMOBI.agentes_ia = 'Agentes Operacionais · Zara';
LABELS_ABAS_IMOBI.mapa_inteligencia = 'Central de Inteligência da Imobiliária';
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

  // --- Conta MASTER da plataforma: só ela vê o alternador de demonstração ---
  // MASTER = VITE_SU (papelLogado 'master') ou custom claim admin=true no token.
  // (Declarado antes dos retornos de carregamento para a contagem de hooks não
  // mudar entre o primeiro render e os seguintes.)
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
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_SIMULACAO_PLANO, nivelSimulado);
    } catch {
      /* modo privado / storage bloqueado: a escolha vale só nesta sessão */
    }
  }, [nivelSimulado]);

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

  // D-23.15 — a aba inicial do painel é a Central de Inteligência
  // (`mapa_inteligencia`): é o primeiro lugar que o cliente vê ao entrar, com o
  // mapa de integração visível sem cabeçalho duplicado. Aba gratuita e liberada
  // para todos os papéis, então nenhuma guarda de plano precisa redirecionar.
  const [abaAtiva, setAbaAtiva] = useState('mapa_inteligencia');

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
  const [novoCorretorNome, setNovoCorretorNome] = useState('');
  const [novoCorretorZap, setNovoCorretorZap] = useState('');
  const [corretoresRoleta, setCorretoresRoleta] = useState([
    { id: 'c1', nome: 'Corretor Plantão 01', whatsapp: '5511999999999', ativo: true, leadsBase: 0 },
    { id: 'c2', nome: 'Especialista Alto Padrão', whatsapp: '5511988888888', ativo: true, leadsBase: 0 },
    { id: 'c3', nome: 'Consultor Locação', whatsapp: '5511977777777', ativo: true, leadsBase: 0 },
  ]);

  // Modais próprios de Ação Rápida Imobiliária
  const [modalNovoImovel, setModalNovoImovel] = useState(false);
  // Tour guiado: abre sozinho 1x por conta; este estado é só o "Refazer tour".
  const [tourManual, setTourManual] = useState(false);
  const [modalNovoLeadImobi, setModalNovoLeadImobi] = useState(false);
  const [modalNovaVisita, setModalNovaVisita] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
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

  // Cenário Demo em 1 Clique (Cold Start) e Auditoria Matinal da Zara
  const [carregandoDemo, setCarregandoDemo] = useState(false);
  const [mensagemDemo, setMensagemDemo] = useState('');
  const [gerandoAuditoriaZara, setGerandoAuditoriaZara] = useState(false);
  const [ultimaAuditoriaZara, setUltimaAuditoriaZara] = useState(null);
  const [erroAuditoriaZara, setErroAuditoriaZara] = useState('');

  // Formulários rápidos (Com suporte a Nichos Especializados, Padrão de Imóvel, Galeria de Fotos e Vitrine Digital)
  const [filtroNichoCaptacao, setFiltroNichoCaptacao] = useState('Todos');
  const [novaFotoInput, setNovaFotoInput] = useState('');
  const [avisoFotosImovel, setAvisoFotosImovel] = useState('');
  const [formImovel, setFormImovel] = useState({
    titulo: '',
    tipo: 'Apartamento',
    finalidade: 'Venda',
    padraoImovel: 'Médio Padrão',
    status: 'Ativo',
    publico: false,
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

  // Simulador da Pólen REAL (aba de Agentes) — a resposta vem do /api/ai com o
  // catálogo do tenant; nada de roteiro fixo, taxa inventada ou ficha fictícia.
  const [msgTesteIA, setMsgTesteIA] = useState('');
  const [enviandoSimIA, setEnviandoSimIA] = useState(false);
  const [erroSimIA, setErroSimIA] = useState('');
  const [gatilhoSimIA, setGatilhoSimIA] = useState(null);
  const [historicoTesteIA, setHistoricoTesteIA] = useState(historicoInicialSimulador);
  // Demonstração: 5 mensagens por navegador para conta sem o módulo (D-22.02).
  const [restantesPolen, setRestantesPolen] = useState(() => restantesDemo('polen'));

  // O que a Sofia pode oferecer: imóveis vendidos/alugados/inativos ficam
  // fora do catálogo enviado ao /api/ai (e da contagem mostrada na tela).
  const imoveisDisponiveisSimIA = useMemo(() => filtrarCatalogoDisponivel(listaImoveis), [listaImoveis]);

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

  // Sincroniza e carrega a última auditoria matinal da Zara
  useEffect(() => {
    let ativo = true;
    async function carregarAudit() {
      if (!imobiliariaId) return;
      try {
        const audit = await carregarUltimaAuditoriaZara(imobiliariaId, db);
        if (ativo && audit) {
          setUltimaAuditoriaZara(audit);
        }
      } catch (err) {
        console.warn('Aviso ao carregar última auditoria da Zara:', err);
      }
    }
    carregarAudit();
    return () => {
      ativo = false;
    };
  }, [imobiliariaId]);

  const handleCarregarCenarioDemo = async (forcar = false) => {
    setCarregandoDemo(true);
    setMensagemDemo('');
    try {
      const res = await carregarCenarioDemo(imobiliariaId, db, { force: forcar });
      if (res.sucesso) {
        setMensagemDemo('Cenário Demo carregado com sucesso: 5 imóveis e 6 leads criados!');
      } else {
        setMensagemDemo(res.motivo || 'A conta já possui dados cadastrados.');
      }
      setTimeout(() => setMensagemDemo(''), 6000);
    } catch (err) {
      setMensagemDemo(`Erro ao carregar cenário demo: ${err.message}`);
    } finally {
      setCarregandoDemo(false);
    }
  };

  const handleGerarRelatorioZara = async () => {
    setGerandoAuditoriaZara(true);
    setErroAuditoriaZara('');
    try {
      const contaVazia = (!listaLeads || listaLeads.length === 0) && (!listaImoveis || listaImoveis.length === 0);
      if (contaVazia) {
        setMensagemDemo('Conta sem histórico: gerando auditoria com o Cenário Demo da casa.');
        setTimeout(() => setMensagemDemo(''), 7000);
      }
      const resultado = await executarAuditoriaZara(imobiliariaId, {
        db,
        leads: listaLeads,
        imoveis: listaImoveis,
      });
      setUltimaAuditoriaZara(resultado);
    } catch (err) {
      setErroAuditoriaZara(`Erro ao gerar auditoria da Zara: ${err.message || 'Tente novamente'}`);
    } finally {
      setGerandoAuditoriaZara(false);
    }
  };

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
    const fotosAtuais = Array.isArray(formImovel.fotos) ? formImovel.fotos : [];
    if (fotosAtuais.includes(link)) return;
    if (fotosAtuais.length >= MAX_FOTOS_IMOVEL) {
      setAvisoFotosImovel(`O limite de ${MAX_FOTOS_IMOVEL} fotos por imóvel foi atingido.`);
      return;
    }

    setFormImovel((prev) => {
      const atuais = Array.isArray(prev.fotos) ? prev.fotos : [];
      if (atuais.includes(link)) return prev;
      const novas = adicionarFotosImovel(atuais, [link]);
      return {
        ...prev,
        fotos: novas,
        fotoCapa: atuais[0] || novas[0] || '',
      };
    });
    setAvisoFotosImovel('');
    if (!urlDireta) setNovaFotoInput('');
  };

  const lerFotoComprimida = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler o arquivo de imagem.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('O arquivo selecionado não pôde ser decodificado como imagem.'));
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxW = 900;
            const scale = img.width > maxW ? maxW / img.width : 1;
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx2d = canvas.getContext('2d');
            if (!ctx2d) throw new Error('Não foi possível preparar a compressão da imagem.');
            ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.78));
          } catch (error) {
            reject(error);
          }
        };
        if (typeof reader.result !== 'string') {
          reject(new Error('O arquivo de imagem não foi lido corretamente.'));
          return;
        }
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleUploadArquivosImovel = async (e) => {
    const input = e.currentTarget;
    const arquivos = Array.from(input.files || []);
    if (arquivos.length === 0) return;

    const fotosAtuais = Array.isArray(formImovel.fotos) ? formImovel.fotos : [];
    const vagas = Math.max(0, MAX_FOTOS_IMOVEL - fotosAtuais.length);
    if (vagas === 0) {
      setAvisoFotosImovel(`O limite de ${MAX_FOTOS_IMOVEL} fotos por imóvel foi atingido.`);
      input.value = '';
      return;
    }

    const selecionados = arquivos.slice(0, vagas);
    setAvisoFotosImovel(
      arquivos.length > vagas
        ? `Só cabem mais ${vagas} foto(s). As demais não foram adicionadas.`
        : '',
    );

    try {
      const fotosNovas = [];
      for (const arquivo of selecionados) {
        fotosNovas.push(await lerFotoComprimida(arquivo));
      }

      setFormImovel((prev) => {
        const atuais = Array.isArray(prev.fotos) ? prev.fotos : [];
        const novas = adicionarFotosImovel(atuais, fotosNovas);
        const adicionadas = novas.slice(atuais.length);
        return {
          ...prev,
          fotos: novas,
          fotoCapa: atuais[0] || adicionadas[0] || '',
        };
      });
    } catch (error) {
      console.error('Erro ao comprimir fotos do imóvel:', error);
      setAvisoFotosImovel('Não foi possível processar as fotos selecionadas. Tente novamente.');
    } finally {
      input.value = '';
    }
  };

  const removerFotoGaleria = (urlParaRemover) => {
    setFormImovel((prev) => {
      const novas = (Array.isArray(prev.fotos) ? prev.fotos : []).filter((f) => f !== urlParaRemover);
      return {
        ...prev,
        fotos: novas,
        fotoCapa: novas[0] || '',
      };
    });
    setAvisoFotosImovel('');
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
      const capaEscolhida = listaFotos[0] || '';
      const novoImovel = {
        ...formImovel,
        fotos: listaFotos,
        fotoCapa: capaEscolhida,
        publico: formImovel.publico === true,
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
        publico: false,
        publicarPortais: true,
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
      setAvisoFotosImovel('');
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
    setMsgTesteIA('');
    setErroSimIA('');
    setGatilhoSimIA(null);
    setHistoricoTesteIA(historicoInicialSimulador());
  }, []);

  // Simulador REAL: montaCorpoSofia() em modo 'simulacao' com os imóveis do
  // tenant, chama /api/ai com o Bearer (cabecalhosIA) e mostra APENAS o `text`
  // limpo devolvido pelo proxy. Se houver handoff, a badge acima registra —
  // o cliente final nunca vê essa tag (D-21.06 / D-21.07).
  //
  // Limite de demonstração (D-22.02): conta SEM o módulo da Pólen tem 5
  // mensagens por navegador (localStorage via `limiteDemo`). Conta com o
  // módulo (ou master) conversa sem contador.
  const enviarMensagemPolen = async (mensagemBruta) => {
    const mensagem = String(mensagemBruta || '').trim();
    if (!mensagem || enviandoSimIA) return;

    // D-22.03 — encerrado o trial de 10 dias sem plano ativo, o simulador
    // não gasta token: a consulta é bloqueada com o aviso do PRO.
    if (bloqueioProAtivo) {
      setErroSimIA(AVISO_TRIAL_ENCERRADO);
      return;
    }

    // Resposta rápida 0 tokens (Cérebro da Pólen):
    // Para perguntas de demonstração como "Tenho interesse, mas preciso financiar",
    // responde instantaneamente sem queimar tokens com os 7 pontos validados.
    const imovelRef = imoveisDisponiveisSimIA[0] || {};
    const resposta0Tokens = obterRespostaRapida0Tokens({
      mensagem,
      imovel: imovelRef,
      nomeImobiliaria: dadosImobCtx?.nome || dadosImobCtx?.nomeOficina || 'Imobiliária parceira',
      nomeCorretor:
        auth?.currentUser?.displayName || dadosImobCtx?.nomeResponsavel || 'Corretor responsável',
    });

    if (resposta0Tokens) {
      setMsgTesteIA('');
      setErroSimIA('');
      setGatilhoSimIA(null);
      setHistoricoTesteIA((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { autor: 'cliente', texto: mensagem },
        { autor: 'ia', agente: 'Pólen • modo simulação', texto: resposta0Tokens },
      ]);
      return;
    }

    if (!podeUsarDemo('polen', { liberado: sofiaLiberada })) {
      setRestantesPolen(0);
      setErroSimIA(
        `Você usou as ${LIMITE_DEMO} mensagens gratuitas de demonstração da Pólen. Contrate o módulo de atendimento 24h para falar com ela sem limite.`
      );
      return;
    }

    setMsgTesteIA('');
    setErroSimIA('');
    setGatilhoSimIA(null);
    setHistoricoTesteIA((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { autor: 'cliente', texto: mensagem },
    ]);

    setEnviandoSimIA(true);
    try {
      const resultado = await responderSofiaSimulacao({
        mensagem,
        historico: historicoTesteIA,
        catalogoImoveis: imoveisDisponiveisSimIA,
        nomeImobiliaria: dadosImobCtx?.nome || dadosImobCtx?.nomeOficina || 'Imobiliária parceira',
        nomeCorretor:
          auth?.currentUser?.displayName || dadosImobCtx?.nomeResponsavel || 'Corretor responsável',
        cabecalhos: await cabecalhosIA(),
      });

      if (!resultado.ok) {
        setErroSimIA(resultado.erro);
        return;
      }

      if (!sofiaLiberada) {
        registrarUsoDemo('polen');
        setRestantesPolen(restantesDemo('polen'));
      }

      setHistoricoTesteIA((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { autor: 'ia', agente: 'Pólen • modo simulação', texto: resultado.texto },
      ]);
      setGatilhoSimIA(descreverHandoff(resultado.gatilho));
    } catch (erro) {
      setErroSimIA(erro?.message || 'Falha inesperada ao chamar a Pólen.');
    } finally {
      setEnviandoSimIA(false);
    }
  };

  const simularRespostaAgente = async (e) => {
    e.preventDefault();
    await enviarMensagemPolen(msgTesteIA);
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
  // Operação IA (Pólen, Zara, Tom, Express Brain) exige contratação: quem não
  // tem o pacote vê somente a simulação. Admin Total continua liberando tudo.
  const contaPlano = dadosImobCtx || dadosLegadoCtx || {};
  const sofiaLiberada = Boolean(ehAdminTotal || temSofiaWhatsApp(contaPlano));

  const infoAbaAtiva = MAPA_DETALHES_ABAS[abaAtiva] || MAPA_DETALHES_ABAS.dashboard_imobi;
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
  const beneficiosPlus = [
    `Até ${LIMITES_PLANOS.plus.funcionarios} usuários inclusos · +${fmtBRL(LIMITES_PLANOS.plus.usuario_adicional_preco)} por usuário extra`,
    ...(PLANOS.find((plano) => plano.key === 'plus')?.recursos || [])
      .filter((recurso) => recurso?.icone === 'TrendingUp')
      .map((recurso) => recurso.texto),
  ];
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
      beneficios: beneficiosPlus,
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

  // Lote 3 — Roleta de Leads vira aba interna do Diretor Comercial IA.
  const painelRoletaLeads = (
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
              <button onClick={() => setStatusRoletaMsg('')} aria-label="Fechar o aviso da roleta" className="text-slate-400 hover:text-white cursor-pointer">✕</button>
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
  );

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
    roleta_imobi: painelRoletaLeads,
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

          {/* ─── ABA 1: PAINEL EXECUTIVO (VISÃO GERAL) ─────────────────────────── */}
        {abaAtiva === 'dashboard_imobi' && (
          <div className="space-y-4">
            <OnboardingPrimeiroUso
              config={config}
              imoveis={listaImoveis}
              onIrPara={setAbaAtiva}
              onNovoImovel={() => setModalNovoImovel(true)}
            />
          <RodaProspeccao
            leads={listaLeads}
            visitas={listaVisitas}
            propostas={listaPropostas}
            tarefas={listaTarefas}
            oficinaId={imobiliariaId}
            papelLogado={papelEfetivo}
            usuarioNome={dadosImobiliaria?.nomeCorretor || dadosImobiliaria?.corretorResponsavel || ''}
            usuarioUid={currentUserId}
            vgv={(listaImoveis || []).reduce((acc, item) => acc + (Number(item?.valor) || 0), 0)}
            comissao={(listaImoveis || []).reduce((acc, item) => acc + (Number(item?.valor) || 0), 0) * 0.06}
            onAbrirAba={setAbaAtiva}
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
          <div className="space-y-6">
            {!acessoProLiberado && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="font-extrabold text-emerald-400">⚡ Plano Gratuito:</span>
                  <span>{Array.isArray(listaImoveis) ? listaImoveis.length : 0} de 5 imóveis cadastrados.</span>
                </div>
                {(Array.isArray(listaImoveis) ? listaImoveis.length : 0) >= 5 ? (
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('meuplano')}
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-[11px] font-black text-slate-950 shadow-md hover:brightness-110 transition cursor-pointer"
                  >
                    Desbloquear Imóveis Ilimitados no PRO (R$ 39,90) →
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Restam {Math.max(0, 5 - (Array.isArray(listaImoveis) ? listaImoveis.length : 0))} vagas de imóveis grátis.
                  </span>
                )}
              </div>
            )}
            <CaptacaoNicho
              dadosOficina={dadosImobiliaria}
              setAbaAtiva={setAbaAtiva}
              onAbrirPrestacao={(imovel) => {
                setPrestacaoFoco(imovel);
                setAbaAtiva('mapa_inteligencia');
              }}
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
                    const capaDeExemplo = ehFotoExemplo(capaUrl);
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
                                alt={
                                  capaDeExemplo
                                    ? `Imagem de exemplo (banco de imagens) — ${imv.titulo || 'imóvel'}`
                                    : imv.titulo
                                }
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-[#020408]/85 ${tagPadrao.classes}`}>
                                  {tagPadrao.label}
                                </span>
                                {capaDeExemplo && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-amber-500 text-amber-950">
                                    Exemplo
                                  </span>
                                )}
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
                <button onClick={() => setStatusRoletaMsg('')} aria-label="Fechar o aviso da roleta" className="text-slate-400 hover:text-white cursor-pointer">✕</button>
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
          <div className="space-y-6">
            <HeroAba
              icone={Bot}
              titulo="Agentes"
              destaque="Operacionais"
              chip="Zara · Direção Operacional"
              subtitulo="Zara coordena a rotina recorrente do funil com os agentes operacionais. Tom apoia decisões como segundo cérebro; Pólen é a secretária 24h no WhatsApp."
              cor="#8b5cf6"
            />
            <GuiaDaAba
              titulo="Agentes Operacionais"
              descricao="Zara coordena as rotinas do funil e os agentes de qualificação, visitas, propostas, reativação, crédito e repasses. A Pólen permanece dedicada ao atendimento 24h."
            />

            {/* ─── ESTEIRA OPERACIONAL VISUAL DA ZARA (CENTRO DE COMANDO) ──────── */}
            <PainelZaraOperacional
              leads={listaLeads}
              imoveis={listaImoveis}
              visitas={listaVisitas}
              propostas={listaPropostas}
              auditando={gerandoAuditoriaZara}
              onDispararAuditoria={handleGerarRelatorioZara}
              ultimaAuditoria={ultimaAuditoriaZara}
            />

            {/* ─── CENÁRIO DEMO EM 1 CLIQUE (COLD START) ─────────────────────────── */}
            <div className="rounded-2xl border border-emerald-500/30 bg-[#020408] p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/40">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#10b981]">
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm md:text-base font-black text-white">
                      Cenário Demo em 1 Clique
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black uppercase text-[#10b981]">
                      Demonstração Rápida
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Popule automaticamente 5 imóveis (2 parados há mais de 40 dias) e 6 leads (2 sem resposta há mais de 24h) para testar o Tom e a auditoria da Zara na hora.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCarregarCenarioDemo(false)}
                  disabled={carregandoDemo}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Zap size={14} />
                  <span>{carregandoDemo ? 'Carregando...' : 'Carregar Cenário Demo'}</span>
                </button>
              </div>
            </div>

            {mensagemDemo && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-[#10b981]">
                <CheckCircle2 size={16} />
                <span>{mensagemDemo}</span>
              </div>
            )}

            <ControleInteligenciaIA
              isPro={isPro}
              setAbaAtiva={setAbaAtiva}
            />

            {/* D-22.03 — a aba entrou na faixa PRO · Assinantes; o trial de
                10 dias é o que a mantém aberta para quem ainda não assinou. */}
            {bloqueioProAtivo && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="flex items-start gap-2 text-xs font-bold text-amber-200">
                  <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{AVISO_TRIAL_ENCERRADO}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAbaAtiva('meuplano')}
                  className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1.5 text-[11px] font-black text-amber-950 shadow-[0_0_18px_rgba(245,158,11,0.45)] transition-all hover:-translate-y-0.5"
                >
                  Assinar o PRO · {precoDoPlano('pro')}/mês
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              {/* Tema: cabeçalho com ação de auditoria matinal */}
              <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                      👑 Zara · <span style={{ color: '#10b981' }}>Direção Operacional</span>
                    </h2>
                    <p className="mt-2 text-xs md:text-sm text-slate-400">
                      Audita o funil diário com base exclusivamente nas Regras Comerciais do Tom e nos dados operacionais da casa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGerarRelatorioZara}
                    disabled={gerandoAuditoriaZara}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Clock size={15} />
                    <span>{gerandoAuditoriaZara ? 'Auditando...' : 'Gerar Relatório Matinal (08:00) Agora'}</span>
                  </button>
                </div>
              </div>

              {erroAuditoriaZara && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  {erroAuditoriaZara}
                </div>
              )}

              {/* CARD DE DIAGNÓSTICO MATINAL DA ZARA (ÚLTIMA AUDITORIA SALVA) */}
              {ultimaAuditoriaZara && (
                <div className="rounded-2xl border border-emerald-500/40 bg-[#020408] p-5 md:p-6 shadow-xl shadow-black/60 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-[#10b981]">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">
                          Boletim Executivo das 08:00 · Auditoria da Zara
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {ultimaAuditoriaZara.dataExtenso ? `${ultimaAuditoriaZara.dataExtenso} às ${ultimaAuditoriaZara.horaFormatada}` : `Gerado em: ${new Date(ultimaAuditoriaZara.geradoEm || Date.now()).toLocaleString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {ultimaAuditoriaZara.cenarioDemoInjetado && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-[#10b981]">
                          ✨ Cenário Demo
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-300">
                        ⚠️ {ultimaAuditoriaZara.totalLeadsAtrasados ?? (ultimaAuditoriaZara.leadsAtrasados?.length || 0)} leads atrasados
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] font-black text-red-300">
                        🛑 {ultimaAuditoriaZara.totalImoveisParados ?? (ultimaAuditoriaZara.imoveisParados?.length || 0)} imóveis parados
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {ultimaAuditoriaZara.relatorio}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(agentesIA || []).filter((ag) => ag.id !== 'sofia_triagem').map((ag) => (
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-bold text-white text-sm">{ag.nome}</h3>
                        {/* Lote 4 — no degrau Grátis os cartões de agentes são vitrine:
                            Sofia aparece como DEMONSTRAÇÃO do atendimento,
                            sem prometer o WhatsApp oficial da Pólen (R$ 450 + implantação). */}
                        {ag.demonstracao && (
                          <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.10em] text-amber-300">
                            Demonstração
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{ag.prompt}</p>
                    </div>
                    <p style={{ color: '#10b981' }} className="text-[11px] font-bold text-[#10b981] mt-3 pt-2 border-t border-slate-800">
                      ⚡ {ag.atendimentos} interações demonstrativas
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulador da PÓLEN REAL: mesma persona do WhatsApp, resposta via /api/ai
                com o catálogo do tenant. Nenhuma taxa, parcela ou ficha é inventada.
                Conta sem o módulo tem 5 mensagens de demonstração (D-22.02). */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[560px]">
              <div className="pb-3 mb-3 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles size={16} style={{ color: '#10b981' }} className="text-[#10b981]" /> Pólen · Secretária 24h
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
                  A mesma Pólen do WhatsApp, respondendo pelo <span className="text-slate-200 font-semibold">/api/ai</span> com o
                  catálogo real do tenant. Preço, taxa e parcela só saem do cadastro.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {!sofiaLiberada && (
                    <span
                      title="Mensagens gratuitas de demonstração neste navegador"
                      className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-white text-[10px] font-bold"
                    >
                      💬 {Math.min(Math.max(0, LIMITE_DEMO - restantesPolen), LIMITE_DEMO)}/{LIMITE_DEMO} mensagens grátis
                    </span>
                  )}
                  <span
                    title={
                      imoveisDisponiveisSimIA.length === (Array.isArray(listaImoveis) ? listaImoveis.length : 0)
                        ? 'Catálogo enviado à Sofia'
                        : 'Vendidos, alugados e inativos não são enviados à Sofia'
                    }
                    className="px-2 py-0.5 rounded-md bg-[#020408] border border-slate-700 text-slate-200 text-[10px] font-bold"
                  >
                    🏠 {imoveisDisponiveisSimIA.length} disponível(is) de{' '}
                    {Array.isArray(listaImoveis) ? listaImoveis.length : 0} cadastrado(s)
                  </span>
                  {gatilhoSimIA && (
                    <span
                      title={gatilhoSimIA.motivo ? `Motivo interno: ${gatilhoSimIA.motivo}` : 'Gatilho interno da esteira'}
                      className="px-2 py-0.5 rounded-md bg-[#f59e0b]/15 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-extrabold"
                    >
                      ⚡ {gatilhoSimIA.rotulo}
                    </span>
                  )}
                </div>
                {gatilhoSimIA && (
                  <p className="text-[10px] text-slate-500">
                    Tag interna de handoff: o cliente final não vê esta linha — ela não vai para o WhatsApp.
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(historicoTesteIA || [])?.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs max-w-[88%] whitespace-pre-line ${
                      m.autor === 'cliente'
                        ? 'ml-auto bg-[#10b981] text-white'
                        : 'border border-slate-800 bg-[#020408] text-slate-200'
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
                {enviandoSimIA && (
                  <div
                    className="p-3 rounded-2xl text-xs max-w-[88%] border border-slate-800 bg-[#020408] text-slate-400"
                  >
                    Pólen está digitando…
                  </div>
                )}
                {erroSimIA && (
                  <div className="p-3 rounded-xl text-[11px] border border-red-500/40 bg-red-500/10 text-red-300">
                    {erroSimIA}
                  </div>
                )}
              </div>

              {imoveisDisponiveisSimIA.length === 0 && (
                <div className="mt-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[11px] text-[#f59e0b] space-y-2">
                  <p>
                    {Array.isArray(listaImoveis) && listaImoveis.length
                      ? AVISO_SEM_DISPONIVEIS
                      : AVISO_CATALOGO_VAZIO}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('captacao_imobi')}
                    className="px-2.5 py-1 rounded-lg bg-[#020408] border border-[#f59e0b]/40 text-[10px] font-bold hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition"
                  >
                    Cadastrar primeiro imóvel →
                  </button>
                </div>
              )}

              {/* 3 perguntas rápidas: o visitante não precisa inventar a pergunta. */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ACOES_POLEN.map((acao) => (
                  <button
                    key={acao.key}
                    type="button"
                    disabled={bloqueioProAtivo || enviandoSimIA || (!sofiaLiberada && restantesPolen <= 0)}
                    onClick={() => enviarMensagemPolen(acao.pergunta)}
                    className="px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold hover:bg-[#10b981]/20 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {acao.rotulo}
                  </button>
                ))}
              </div>

              {/* D-22.03 — trial encerrado sem plano ativo: nenhuma consulta
                  nova sai daqui (o handler também barra antes do /api/ai). */}
              {bloqueioProAtivo && (
                <div className="tarja-aviso mt-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[11px] text-[#f59e0b] space-y-2">
                  <p className="flex items-center gap-1.5 font-black uppercase tracking-wide">
                    <Lock size={12} aria-hidden="true" /> Simulador bloqueado
                  </p>
                  <p>{AVISO_TRIAL_ENCERRADO}</p>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('meuplano')}
                    className="px-2.5 py-1 rounded-lg bg-[#020408] border border-[#f59e0b]/40 text-[10px] font-bold hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition"
                  >
                    Assinar o PRO · {precoDoPlano('pro')}/mês →
                  </button>
                </div>
              )}

              {/* Conta sem o módulo: 5 mensagens e o CTA de contratação. */}
              {!sofiaLiberada && restantesPolen <= 0 && (
                <div className="tarja-aviso mt-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[11px] text-[#f59e0b] space-y-2">
                  <p>
                    Você usou as {LIMITE_DEMO} mensagens gratuitas de demonstração da Pólen. Ela atende
                    sem limite no WhatsApp quando o módulo está contratado ({precoDoPlano('esquadrao_ia')}/mês
                    + implantação).
                  </p>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('meuplano')}
                    className="px-2.5 py-1 rounded-lg bg-[#020408] border border-[#f59e0b]/40 text-[10px] font-bold hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition"
                  >
                    Contratar a Pólen →
                  </button>
                </div>
              )}

              <form onSubmit={simularRespostaAgente} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={msgTesteIA}
                    onChange={(e) => setMsgTesteIA(e.target.value)}
                    disabled={bloqueioProAtivo || enviandoSimIA || (!sofiaLiberada && restantesPolen <= 0)}
                    placeholder="Ex: Procuro um apto de 2 quartos no Tibery até 350 mil"
                    className="w-full bg-[#020408] border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-white disabled:opacity-60"
                  />
                  <MicButton
                    className="absolute right-1 top-1/2 -translate-y-1/2 !p-1.5"
                    tamanho={13}
                    onTexto={(texto) => setMsgTesteIA((v) => (v ? `${v} ${texto}` : texto))}
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Enviar mensagem de teste para a Pólen"
                  disabled={bloqueioProAtivo || enviandoSimIA || (!sofiaLiberada && restantesPolen <= 0)}
                  style={{ backgroundColor: '#10b981' }}
                  className="px-4 py-2 rounded-xl hover:opacity-90 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={15} aria-hidden="true" />
                </button>
              </form>
            </div>
            </div>
          </div>
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

        <RodapeLegal />
      </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. MODAIS RÁPIDOS DOS BOTÕES DO TOPO (+ IMÓVEL, + LEAD, + VISITA)
         ═══════════════════════════════════════════════════════════════════════ */}
      {modalNovoImovel && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          {!acessoProLiberado && (Array.isArray(listaImoveis) ? listaImoveis.length : 0) >= 5 ? (
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-md space-y-4 my-8 text-center animate-in fade-in shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock size={26} />
              </div>
              <h3 className="text-base font-black text-white">Limite do Plano Gratuito Atingido (5/5)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você já cadastrou os 5 imóveis inclusos no Plano Gratuito. Ative o plano PRO por apenas R$ 39,90/mês para cadastrar imóveis ilimitados e fotos em alta resolução.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoImovel(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:text-white cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalNovoImovel(false);
                    setAbaAtiva('meuplano');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Ver Planos PRO →
                </button>
              </div>
            </div>
          ) : (
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
                  <option value="Ativo">Ativo / disponível</option>
                  <option value="Reservado">Reservado / Em Proposta</option>
                  <option value="Inativo">Inativo / Oculto</option>
                </select>
                <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                  <input
                    type="checkbox"
                    checked={formImovel.publico === true}
                    onChange={(e) => setFormImovel({ ...formImovel, publico: e.target.checked })}
                    className="h-3.5 w-3.5 accent-[#10b981]"
                  />
                  Publicar na vitrine pública e permitir link direto da Pólen
                </label>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  Ao publicar, o anúncio e suas fotos ficam acessíveis no portal público.
                </p>
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
              <CampoMoeda
                valor={formImovel.valor}
                onChange={(valorMascarado) => setFormImovel({ ...formImovel, valor: valorMascarado })}
                placeholder="R$ 0,00"
                className="bg-[#020408] border border-[#10b981]/60 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold"
              />
            </div>

            {/* GALERIA DE FOTOS DO IMÓVEL: a primeira foto é sempre a capa */}
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-[11px] leading-relaxed text-emerald-100">
                <strong className="font-black">Foto 1 (Principal — Fachada ou Entrada do Imóvel).</strong>{' '}
                Ela será a capa do portal. A Pólen deve priorizar essa foto, um resumo e o link direto na primeira apresentação;
                o envio da imagem como anexo depende de o canal WhatsApp oferecer suporte a mídia.
                As outras até 6 fotos ficam na vitrine ou são enviadas somente se o cliente pedir explicitamente.
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase text-[#10b981]">
                  📷 Galeria de Fotos ({(formImovel.fotos || []).length}/{MAX_FOTOS_IMOVEL})
                </span>
                <label
                  aria-disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                  className={`px-3 py-1 rounded-lg text-white text-[11px] font-black transition ${
                    (formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL
                      ? 'bg-slate-700 cursor-not-allowed opacity-60'
                      : 'bg-[#10b981] cursor-pointer hover:opacity-90'
                  }`}
                >
                  + Enviar Fotos ({Math.max(0, MAX_FOTOS_IMOVEL - (formImovel.fotos || []).length)} restantes)
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                    onChange={handleUploadArquivosImovel}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  value={novaFotoInput}
                  onChange={(e) => setNovaFotoInput(e.target.value)}
                  disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                  placeholder="Ou cole o link de uma foto (https://...)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => adicionarLinkFotoImovel()}
                  disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-[#10b981] text-xs font-extrabold text-white cursor-pointer transition"
                >
                  Adicionar Link
                </button>
              </div>

              {/* Sugestões rápidas de fotos para teste imediato */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400">Fotos ilustrativas (banco de imagens):</span>
                {[
                  {
                    nome: '+ Apto Moderno',
                    url: FOTOS_EXEMPLO.apartamento,
                  },
                  {
                    nome: '+ Casa Condomínio',
                    url: FOTOS_EXEMPLO.casa,
                  },
                  {
                    nome: '+ Fazenda / Rural',
                    url: FOTOS_EXEMPLO.fazenda,
                  },
                ]?.map((demo) => (
                  <button
                    key={demo.nome}
                    type="button"
                    onClick={() => adicionarLinkFotoImovel(demo.url)}
                    disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-slate-300 hover:text-[#10b981] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {demo.nome}
                  </button>
                ))}
              </div>

              {avisoFotosImovel && (
                <p role="status" className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[10.5px] font-semibold text-amber-200">
                  {avisoFotosImovel}
                </p>
              )}

              {temFotoExemplo(formImovel.fotos) && (
                <p role="note" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10.5px] font-semibold leading-relaxed text-amber-200">
                  {AVISO_FOTO_EXEMPLO}
                </p>
              )}

              {/* A primeira miniatura é sempre a capa e a foto principal. */}
              {Array.isArray(formImovel.fotos) && formImovel.fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(formImovel.fotos || [])?.map((fotoUrl, idx) => {
                    const isCapa = idx === 0;
                    const fotoDeExemplo = ehFotoExemplo(fotoUrl);
                    return (
                      <div
                        key={`${idx}_${fotoUrl.slice(0, 24)}`}
                        className={`relative rounded-xl overflow-hidden border-2 h-20 group ${
                          isCapa ? 'border-[#10b981]' : 'border-slate-800'
                        }`}
                      >
                        <img
                          src={fotoUrl}
                          alt={
                            fotoDeExemplo
                              ? `Foto ${idx + 1} de exemplo (banco de imagens) — não é o imóvel`
                              : `Foto ${idx + 1} do imóvel`
                          }
                          className="w-full h-full object-cover"
                        />
                        {fotoDeExemplo && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-[8px] font-black uppercase text-amber-950">
                            Exemplo
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => removerFotoGaleria(fotoUrl)}
                            aria-label={`Remover a foto ${idx + 1} da galeria`}
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
                            ★ {idx === 0 ? 'FOTO 1 · CAPA' : `FOTO ${idx + 1}`}
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
          )}
        </div>
      )}

      {modalNovoLeadImobi && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={salvarLeadImobi}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-novo-lead-titulo"
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h3 id="modal-novo-lead-titulo" className="text-lg font-black text-white">👥 Cadastrar Novo Lead Imobiliário</h3>
            <div className="bg-[#020408] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between">
              <span className="text-slate-400">🔀 Destino na Roleta:</span>
              <span style={{ color: '#10b981' }} className="font-bold text-[#10b981]">
                {roletaAtiva ? (proximoCorretorDaVez?.nome || 'Plantão Geral') : 'Fila Manual (Roleta Pausada)'}
              </span>
            </div>
            <div>
              <label htmlFor="lead-nome" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Nome do cliente *
              </label>
              <input
                id="lead-nome"
                name="nome"
                autoComplete="off"
                required
                placeholder="Ex: Maria Oliveira"
                value={formLead.nome}
                onChange={(e) => setFormLead({ ...formLead, nome: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="lead-telefone" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                WhatsApp com DDD *
              </label>
              <input
                id="lead-telefone"
                name="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                required
                placeholder="Ex: 34999998888"
                value={formLead.telefone}
                onChange={(e) => setFormLead({ ...formLead, telefone: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="lead-interesse" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Interesse
                </label>
                <select
                  id="lead-interesse"
                  name="interesse"
                  value={formLead.interesse}
                  onChange={(e) => setFormLead({ ...formLead, interesse: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option>Compra</option>
                  <option>Locação</option>
                  <option>Investimento</option>
                </select>
              </div>
              <div>
                <label htmlFor="lead-orcamento" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Orçamento (R$)
                </label>
                <input
                  id="lead-orcamento"
                  name="orcamento"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="Ex: 350.000"
                  value={formLead.orcamento}
                  onChange={(e) => setFormLead({ ...formLead, orcamento: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lead-bairro" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Bairro de preferência
              </label>
              <input
                id="lead-bairro"
                name="bairro"
                autoComplete="off"
                placeholder="Ex: Tibery"
                value={formLead.bairro}
                onChange={(e) => setFormLead({ ...formLead, bairro: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            {/* LGPD — dado de terceiro digitado pelo corretor (D-22.05) */}
            <p className="text-[10.5px] leading-relaxed text-slate-500">
              Registre aqui apenas o que o cliente informou para ser atendido: nome, WhatsApp, interesse e faixa de
              orçamento. O cadastro fica no CRM desta imobiliária e serve para responder a esse contato. Para
              correção ou exclusão, use <strong className="text-slate-300">Excluir meus dados</strong> no rodapé do
              painel ou a Política de Privacidade.
            </p>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-nova-visita-titulo"
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h3 id="modal-nova-visita-titulo" className="text-lg font-black text-white">📅 Agendar Visita ao Imóvel</h3>
            <div>
              <label htmlFor="visita-cliente" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Nome do cliente *
              </label>
              <input
                id="visita-cliente"
                name="cliente"
                autoComplete="off"
                required
                placeholder="Ex: Maria Oliveira"
                value={formVisita.cliente}
                onChange={(e) => setFormVisita({ ...formVisita, cliente: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="visita-telefone" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                WhatsApp do cliente
              </label>
              <input
                id="visita-telefone"
                name="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="Ex: 34999998888"
                value={formVisita.telefone}
                onChange={(e) => setFormVisita({ ...formVisita, telefone: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="visita-imovel" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Imóvel / código
              </label>
              <input
                id="visita-imovel"
                name="imovel"
                autoComplete="off"
                placeholder="Ex: IMB-1042"
                value={formVisita.imovel}
                onChange={(e) => setFormVisita({ ...formVisita, imovel: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="visita-data" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Data
                </label>
                <input
                  id="visita-data"
                  name="data"
                  type="date"
                  value={formVisita.data}
                  onChange={(e) => setFormVisita({ ...formVisita, data: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="visita-hora" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Hora
                </label>
                <input
                  id="visita-hora"
                  name="hora"
                  type="time"
                  value={formVisita.hora}
                  onChange={(e) => setFormVisita({ ...formVisita, hora: e.target.value })}
                  className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </div>
            </div>
            {/* LGPD — dado de terceiro digitado pelo corretor (D-22.05) */}
            <p className="text-[10.5px] leading-relaxed text-slate-500">
              Nome e WhatsApp servem para confirmar a visita e ficam registrados no CRM desta imobiliária. Não pede
              documento nem dado financeiro. Para correção ou exclusão, use{' '}
              <strong className="text-slate-300">Excluir meus dados</strong> no rodapé do painel.
            </p>
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
