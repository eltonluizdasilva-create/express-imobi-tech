import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  HelpCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  Brain,
  Flame,
  ArrowUpRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { DOR_SOLUCAO } from '../lib/copyAbas';
import { manualDaAba } from '../lib/manualAbas';
import {
  LIMITE_DEMO,
  lerUsoDemo,
  registrarUsoDemo,
  podeUsarDemo,
  restantesDemo,
} from '../lib/limiteDemo';
import { cabecalhosIA } from '../lib/aiAuth';

// ─── DEFINIÇÃO DAS 3 PERSONAS DO HUB ──────────────────────────────────────────

const PERSONAS = {
  sofia: {
    id: 'sofia',
    nome: 'Sofia',
    titulo: 'Suporte & Guia da Plataforma',
    subtitulo: 'Tira dúvidas de uso do sistema em tempo real sem inventar menus.',
    corPrimaria: '#0ea5e9', // Ciano
    corTexto: 'text-sky-400',
    corBgBadge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    corBorda: 'border-sky-500/40',
    corGradiente: 'from-sky-500 to-cyan-600',
    corGlow: 'rgba(14, 165, 233, 0.4)',
    avatar: '/images/avatar-sofia.png',
    icone: Bot,
    tag: 'Suporte 100% Liberado',
    mensagemBoasVindas:
      'Olá! Eu sou a Sofia, sua especialista de suporte e guia do Express Imobi Tech. Como posso te orientar no uso dos módulos e navegação do painel?',
    perguntasRapidas: [
      { key: 'aba_atual', rotulo: '📖 O que fazer nesta aba?' },
      { key: 'cadastro_imovel', rotulo: '🏠 Como cadastrar imóvel (7 fotos)?' },
      { key: 'presimulacao', rotulo: '🏦 Como funciona a pré-simulação Caixa?' },
    ],
  },
  zara: {
    id: 'zara',
    nome: 'Zara',
    titulo: 'Agentes Operacionais & Funil',
    subtitulo: 'Auditoria de rotina matinal 08:00, leads parados (>24h) e imóveis (>40d).',
    corPrimaria: '#f59e0b', // Âmbar
    corTexto: 'text-amber-400',
    corBgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    corBorda: 'border-amber-500/40',
    corGradiente: 'from-amber-500 to-yellow-600',
    corGlow: 'rgba(245, 158, 11, 0.4)',
    avatar: '/images/avatar-polen.png',
    icone: Flame,
    tag: 'Agentes Operacionais • R$ 349/mês',
    mensagemBoasVindas:
      'Olá! Sou a Zara, diretora operacional do seu funil. Minha função é auditar a rotina diária às 08:00, cobrar leads parados (>24h) e coordenar os agentes operacionais da imobiliária. O que você gostaria de saber sobre a operação?',
    perguntasRapidas: [
      { key: 'rotina_08', rotulo: '⏰ Como funciona a rotina das 08:00?' },
      { key: 'auditoria_leads', rotulo: '🚨 Como audita leads sem resposta (>24h)?' },
      { key: 'planos_zara', rotulo: '💰 Quais são os planos da Zara (R$ 349)?' },
    ],
  },
  tom: {
    id: 'tom',
    nome: 'Tom',
    titulo: 'Segundo Cérebro da Imobiliária',
    subtitulo: 'Memória operacional estratégica, análise preditiva de VGV e metas.',
    corPrimaria: '#10b981', // Verde Esmeralda
    corTexto: 'text-emerald-400',
    corBgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    corBorda: 'border-emerald-500/40',
    corGradiente: 'from-emerald-500 to-teal-600',
    corGlow: 'rgba(16, 185, 129, 0.4)',
    avatar: null,
    icone: Brain,
    tag: 'Segundo Cérebro • R$ 197/mês',
    mensagemBoasVindas:
      'Olá! Eu sou o Tom, o segundo cérebro estratégico da sua imobiliária. Conecto o histórico dos clientes aos imóveis parados, calculo metas de VGV e guardo a memória operacional do seu negócio. Como posso apoiar suas decisões hoje?',
    perguntasRapidas: [
      { key: 'segundo_cerebro', rotulo: '🧠 Como o Tom atua como Segundo Cérebro?' },
      { key: 'vgv_metas', rotulo: '📈 Como apoia a meta de VGV da equipe?' },
      { key: 'planos_tom', rotulo: '💼 Quais são os planos do Tom (R$ 197)?' },
    ],
  },
};

// ─── RESPOSTAS INTELIGENTES LOCAIS (FALLBACK DE ALTA QUALIDADE) ──────────────

function gerarRespostaFallback(personaId, pergunta, abaAtiva, infoAba) {
  const pLower = pergunta.toLowerCase();
  const nomeAba = infoAba?.label || abaAtiva || 'Visão Geral';
  const dorGanho = DOR_SOLUCAO[abaAtiva] || {
    dor: 'Organizar clientes e rotinas sem perder oportunidades de negócio.',
    ganho: 'Acompanhar em tempo real etapas, metas e prazos com suporte inteligente.',
  };

  if (personaId === 'sofia') {
    if (pLower.includes('nesta aba') || pLower.includes('aba atual') || pLower.includes('o que fazer')) {
      return `Guia Prático da Aba "${nomeAba}":

1. O Desafio Comum: ${dorGanho.dor}
2. O que Esta Aba Resolve: ${dorGanho.ganho}
3. Como Usar: Navegue pelos cards e filtros superiores para gerenciar seus registros. Se precisar cadastrar novos dados, utilize os botões de ação dedicados no topo da tela.`;
    }
    if (pLower.includes('imóvel') || pLower.includes('imovel') || pLower.includes('7 fotos') || pLower.includes('foto')) {
      return `Como Cadastrar Imóvel com até 7 Fotos (Plano PRO):

1. Acesse a aba "Captação & Imóveis" no menu superior.
2. Preencha os dados do imóvel (tipo, valor de venda/locação, cidade, bairro e metragem).
3. Faça o upload de até 7 fotos de alta resolução. A Foto 1 é automaticamente selecionada como a Capa Principal na vitrine.
4. Salve o cadastro: o imóvel já fica pronto para ofertas da Pólen e campanhas nas redes sociais.`;
    }
    if (pLower.includes('financiamento') || pLower.includes('caixa') || pLower.includes('crédito') || pLower.includes('credito')) {
      return `Roteiro Oficial de Pré-Simulação Bancária (Caixa / SBPE):

1. Sem CPF no WhatsApp: A Pólen nunca pede CPF do cliente no WhatsApp; o corretor usa o próprio CPF na simulação inicial com os correspondentes.
2. Dados do Imóvel: Preenchidos automaticamente pelo cadastro (valor, residencial/comercial, novo/usado).
3. 7 Itens Validados com o Comprador:
   - Data de nascimento do mais velho que financia;
   - Se mora/trabalha na cidade do imóvel;
   - Renda bruta mensal familiar;
   - Se possui 3+ anos de FGTS;
   - Se possui conta ou saldo de FGTS >10% do valor;
   - Se já recebeu subsídio após 2005;
   - Se vai compor renda ou possui dependente.`;
    }
    return `Olá! Estou à disposição para tirar qualquer dúvida sobre as abas e ferramentas do Express Imobi Tech. Atualmente você está na aba "${nomeAba}". Em que posso te orientar?`;
  }

  if (personaId === 'zara') {
    if (pLower.includes('rotina') || pLower.includes('08:00') || pLower.includes('8:00') || pLower.includes('manhã')) {
      return `Como Funciona a Rotina Operacional das 08:00 da Zara:

1. Varredura Automática Matinal: Às 08:00, a Zara verifica toda a base do CRM.
2. Priorização por Urgência:
   - Leads sem resposta há mais de 24 horas recebem cobrança prioritária;
   - Visitas agendadas para o dia são checadas com disparo de lembrete pelo WhatsApp;
   - Imóveis parados há mais de 40 dias sem propostas são listados para revisão de preço.
3. Alinhamento com o Corretor: Cada corretor recebe no painel a lista clara do que fechar primeiro no dia.`;
    }
    if (pLower.includes('leads') || pLower.includes('sem resposta') || pLower.includes('24h') || pLower.includes('atrasado')) {
      return `Auditoria de Leads Sem Resposta (>24h) com a Zara:

1. Monitoramento do Funil: A Zara detecta leads que entraram no CRM ou enviaram mensagem e não foram respondidos em até 24h.
2. Notificação Operacional: O corretor responsável recebe o alerta "Lead de alto potencial aguardando contato".
3. Reatribuição na Roleta: Se o corretor permanecer sem interagir, a Zara pode sugerir a reatribuição para o próximo corretor da fila rotativa (giro justo).`;
    }
    if (pLower.includes('plano') || pLower.includes('preço') || pLower.includes('preco') || pLower.includes('valor') || pLower.includes('349')) {
      return `Planos e Condições dos Agentes Operacionais da Zara:

- Plano Zara Operacional: A partir de R$ 349,00/mês.
- O que inclui: Coordenação contínua do funil comercial, rotina automática das 08:00, auditoria de leads sem resposta (>24h), checklist operacional e integração com a esteira de corretores.
- Como Ativar: Acesse a aba "Meu Plano" na barra de navegação superior ou clique no botão de upgrade deste chat.`;
    }
    return `Sou a Zara, diretora operacional do seu funil comercial. Minha missão é garantir que nenhum lead esfrie e que sua esteira de vendas funcione com ritmo diário das 08:00. O plano da Zara está disponível a partir de R$ 349,00/mês.`;
  }

  if (personaId === 'tom') {
    if (pLower.includes('segundo cérebro') || pLower.includes('segundo cerebro') || pLower.includes('memória') || pLower.includes('memoria')) {
      return `Como o Tom Atua como o Segundo Cérebro da Imobiliária:

1. Memória Operacional Permanente: O Tom guarda o histórico de negociações, preferências de clientes e regras da imobiliária (comissões de 6%, repasses e contratos).
2. Cruzamento Inteligente: Quando um novo imóvel é captado, o Tom cruza na hora com leads antigos do CRM que procuravam aquele perfil de metragem e preço.
3. Tomada de Decisão com Dados: Em vez de adivinhar, você pergunta ao Tom qual bairro está com mais demanda e ele entrega o diagnóstico analítico.`;
    }
    if (pLower.includes('vgv') || pLower.includes('meta') || pLower.includes('comissão') || pLower.includes('comissao')) {
      return `Como o Tom Apoia a Meta de VGV e Receita da Equipe:

1. Projeção de VGV: O Tom calcula o VGV ativo sob gestão de cada corretor e projeta a receita estimada de comissão (6%).
2. Taxa de Conversão: Monitora a taxa de visitas que viram propostas escritas (meta recomendada: 30% a 35%).
3. Alertas de Desvio: Alerta o gestor comercial quando a equipe está abaixo do ritmo para bater a meta mensal de vendas.`;
    }
    if (pLower.includes('plano') || pLower.includes('preço') || pLower.includes('preco') || pLower.includes('valor') || pLower.includes('197') || pLower.includes('497')) {
      return `Planos e Condições do Tom (Segundo Cérebro):

- Tom Autônomo: A partir de R$ 197,00/mês (ideal para corretores individuais gerenciarem sua carteira e VGV).
- Tom Imobiliária: A partir de R$ 497,00/mês + implantação assistida (memória operacional para toda a equipe de corretores).
- Como Ativar: Acesse "Meu Plano" ou a pílula do Tom no topo para destravar.`;
    }
    return `Sou o Tom, segundo cérebro estratégico da sua imobiliária. Conecto o histórico dos clientes aos imóveis parados e projeto suas metas de VGV. Planos a partir de R$ 197,00/mês (Autônomo) e R$ 497,00/mês (Imobiliária).`;
  }

  return 'Olá! Como posso ajudar você hoje no Express Imobi Tech?';
}

// ─── COMPONENTE PRINCIPAL: HUB FLUTUANTE DE ASSISTENTES IA ───────────────────

export default function FloatingButtons({
  t = { bgCardAlt: '#020408', border: '#1e293b' },
  abaAtiva = 'dashboard_imobi',
  infoAbaAtiva = null,
  moduloLiberado = null,
  lidarModuloBloqueado = null,
  setAbaAtiva = null,
}) {
  const [chatAberto, setChatAberto] = useState(false);
  const [personaAtiva, setPersonaAtiva] = useState('sofia');
  const [guiaAbaAberto, setGuiaAbaAberto] = useState(false);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Histórico de mensagens por persona
  const [conversas, setConversas] = useState({
    sofia: [
      {
        id: 'sofia-init',
        remetente: 'ia',
        texto: PERSONAS.sofia.mensagemBoasVindas,
      },
    ],
    zara: [
      {
        id: 'zara-init',
        remetente: 'ia',
        texto: PERSONAS.zara.mensagemBoasVindas,
      },
    ],
    tom: [
      {
        id: 'tom-init',
        remetente: 'ia',
        texto: PERSONAS.tom.mensagemBoasVindas,
      },
    ],
  });

  const chatEndRef = useRef(null);

  // Rolagem automática ao enviar mensagem
  useEffect(() => {
    if (chatAberto) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversas, personaAtiva, chatAberto]);

  // Contagem de limite de demonstração para Zara e Tom
  const temZaraAtiva = moduloLiberado ? moduloLiberado('agentes_ia') : false;
  const temTomAtivo = moduloLiberado ? moduloLiberado('brain') : false;

  const demoRestanteZara = temZaraAtiva ? 999 : restantesDemo('zara');
  const demoRestanteTom = temTomAtivo ? 999 : restantesDemo('tom');

  const personaConfig = PERSONAS[personaAtiva] || PERSONAS.sofia;
  const IconePersona = personaConfig.icone;

  // Verifica se a persona atual esgotou a demo
  const esgotouDemo =
    (personaAtiva === 'zara' && !temZaraAtiva && demoRestanteZara <= 0) ||
    (personaAtiva === 'tom' && !temTomAtivo && demoRestanteTom <= 0);

  const enviarMensagem = async (textoPersonalizado = null) => {
    const texto = (textoPersonalizado || inputTexto).trim();
    if (!texto || enviando) return;

    if (esgotouDemo) return;

    // Registra pergunta do usuário
    const novaMsgUsuario = {
      id: `u-${Date.now()}`,
      remetente: 'usuario',
      texto,
    };

    setConversas((prev) => ({
      ...prev,
      [personaAtiva]: [...(prev[personaAtiva] || []), novaMsgUsuario],
    }));

    setInputTexto('');
    setEnviando(true);

    // Registra uso demo para Zara e Tom
    if (personaAtiva === 'zara' && !temZaraAtiva) {
      registrarUsoDemo('zara');
    } else if (personaAtiva === 'tom' && !temTomAtivo) {
      registrarUsoDemo('tom');
    }

    try {
      // Monta system prompt contextualizado
      const nomeAba = infoAbaAtiva?.label || abaAtiva || 'Visão Geral';
      let systemPrompt = '';
      if (personaAtiva === 'sofia') {
        systemPrompt = `Você é a Sofia, especialista de suporte e guia do Express Imobi Tech. O corretor está atualmente na aba "${nomeAba}". Conheça todas as abas reais do sistema (Visão Geral, Leads & Funil CRM, Captação & Imóveis, Propostas, Correspondente/Crédito, Radar de Captação, Diretor Comercial IA, etc.) sem inventar menus. Responda em português brasileiro de forma direta, acolhedora e prática, sem asteriscos para negrito.`;
      } else if (personaAtiva === 'zara') {
        systemPrompt = `Você é a Zara, diretora operacional do funil no Express Imobi Tech. Apresente sua capacidade de auditar rotina matinal 08:00, cobrar leads parados (>24h) e imóveis parados (>40d). Informe que o plano dos Agentes Operacionais da Zara está disponível a partir de R$ 349,00/mês. Responda em tópicos objetivos, sem asteriscos para negrito.`;
      } else {
        systemPrompt = `Você é o Tom, o segundo cérebro estratégico da imobiliária no Express Imobi Tech. Explique sua memória operacional, inteligência de VGV, metas e carteira. Informe que o Tom custa a partir de R$ 197,00/mês (Autônomo) e a partir de R$ 497,00/mês (Imobiliária). Responda com visão estratégica e analítica, sem asteriscos para negrito.`;
      }

      const headers = await cabecalhosIA();

      // Chamada real ao proxy de IA (DeepSeek)
      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: 'deepseek',
          systemPrompt,
          messages: [
            ...(conversas[personaAtiva] || []).slice(-4).map((m) => ({
              role: m.remetente === 'usuario' ? 'user' : 'assistant',
              content: m.texto,
            })),
            { role: 'user', content: texto },
          ],
          temperature: 0.35,
          maxTokens: 500,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const textoResposta = data?.text?.trim();
        if (textoResposta) {
          setConversas((prev) => ({
            ...prev,
            [personaAtiva]: [
              ...(prev[personaAtiva] || []),
              { id: `ia-${Date.now()}`, remetente: 'ia', texto: textoResposta },
            ],
          }));
          setEnviando(false);
          return;
        }
      }
      throw new Error('Falha na resposta da API');
    } catch {
      // Fallback inteligente instantâneo (zero tela em branco)
      const respostaLocal = gerarRespostaFallback(
        personaAtiva,
        texto,
        abaAtiva,
        infoAbaAtiva
      );
      setConversas((prev) => ({
        ...prev,
        [personaAtiva]: [
          ...(prev[personaAtiva] || []),
          { id: `ia-${Date.now()}`, remetente: 'ia', texto: respostaLocal },
        ],
      }));
    } finally {
      setEnviando(false);
    }
  };

  // Informações da aba atual para a Sofia
  const dorGanhoAbaAtual = DOR_SOLUCAO[abaAtiva] || {
    dor: 'Organizar clientes e rotinas sem perder oportunidades de negócio.',
    ganho: 'Acompanhar em tempo real etapas, metas e prazos com suporte inteligente.',
  };
  const nomeAbaAtual = infoAbaAtiva?.label || abaAtiva || 'Visão Geral';

  return (
    <>
      {/* ─── BOTÃO FLUTUANTE ÚNICO: CANTO INFERIOR DIREITO ─────────────── */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] flex items-center">
        <button
          type="button"
          onClick={() => setChatAberto((v) => !v)}
          className="group relative flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-[#020408]/95 px-4 py-2.5 shadow-[0_0_25px_rgba(16,185,129,0.35)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
          aria-label="Abrir Hub de Assistentes IA (Sofia, Zara, Tom)"
          title="Assistentes de IA • Sofia • Zara • Tom"
        >
          {/* Micro-indicador pulsante */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          {/* Ícone com gradiente */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 text-[#020408] shadow-sm">
            <Sparkles size={14} className="animate-spin-slow" />
          </div>

          {/* Rótulo discreto conforme especificação do usuário */}
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-emerald-400 transition">
              Sofia • Zara • Tom
            </span>
            <span className="text-[9px] font-bold text-slate-400">
              Assistentes de IA • Suporte & Operação
            </span>
          </div>
        </button>
      </div>

      {/* ─── JANELA DE CHAT COM 3 PERSONAS (ABAS INTERNAS) ──────────────── */}
      {chatAberto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            style={{ backgroundColor: '#020408' }}
            className={`w-full max-w-lg h-[86vh] sm:h-[640px] rounded-3xl border ${personaConfig.corBorda} shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}
          >
            {/* ─── CABEÇALHO DO CHAT COM AS 3 ABAS DE PERSONAS ────────────── */}
            <div className="border-b border-slate-800/90 bg-[#04070c] p-3.5 space-y-3">
              {/* Topo: Seletor de Persona + Botão Fechar */}
              <div className="flex items-center justify-between gap-2">
                {/* 3 Abas Internas: Sofia, Zara, Tom */}
                <div
                  role="tablist"
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-[#020408] p-1 flex-1"
                >
                  {/* Aba SOFIA */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={personaAtiva === 'sofia'}
                    onClick={() => {
                      setPersonaAtiva('sofia');
                      setGuiaAbaAberto(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      personaAtiva === 'sofia'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Bot size={13} />
                    <span>Sofia</span>
                  </button>

                  {/* Aba ZARA */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={personaAtiva === 'zara'}
                    onClick={() => {
                      setPersonaAtiva('zara');
                      setGuiaAbaAberto(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      personaAtiva === 'zara'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Flame size={13} />
                    <span>Zara</span>
                  </button>

                  {/* Aba TOM */}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={personaAtiva === 'tom'}
                    onClick={() => {
                      setPersonaAtiva('tom');
                      setGuiaAbaAberto(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      personaAtiva === 'tom'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Brain size={13} />
                    <span>Tom</span>
                  </button>
                </div>

                {/* Botão de Fechar */}
                <button
                  type="button"
                  onClick={() => setChatAberto(false)}
                  className="h-8 w-8 rounded-full border border-slate-800 bg-[#020408] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Fechar janela de chat"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Faixa da Persona Ativa */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${personaConfig.corGradiente} text-[#020408] shadow-md`}
                  >
                    <IconePersona size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black text-white truncate">
                        {personaConfig.nome} • {personaConfig.titulo}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {personaConfig.subtitulo}
                    </p>
                  </div>
                </div>

                {/* Badge ou Contador de Demonstração */}
                <div className="shrink-0 text-right">
                  {personaAtiva === 'sofia' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-sky-400">
                      Suporte 100% Liberado
                    </span>
                  ) : personaAtiva === 'zara' ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                        temZaraAtiva
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {temZaraAtiva
                        ? 'Plano Ativo'
                        : `Modo Demonstração: ${Math.max(demoRestanteZara, 0)}/5`}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                        temTomAtivo
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {temTomAtivo
                        ? 'Plano Ativo'
                        : `Modo Demonstração: ${Math.max(demoRestanteTom, 0)}/5`}
                    </span>
                  )}
                </div>
              </div>

              {/* Botão de Ajuda Integrado para a Sofia: Guia da Aba Atual */}
              {personaAtiva === 'sofia' && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 truncate">
                    Aba ativa: <strong className="text-white">{nomeAbaAtual}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuiaAbaAberto((v) => !v)}
                    className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-sky-400 hover:text-sky-300 transition cursor-pointer"
                  >
                    <BookOpen size={12} />
                    {guiaAbaAberto ? 'Fechar Guia' : 'Ver Guia da Aba'}
                  </button>
                </div>
              )}
            </div>

            {/* ─── CORPO: GUIA DA ABA (INTEGRADO NA SOFIA) ─────────────────── */}
            {personaAtiva === 'sofia' && guiaAbaAberto && (
              <div className="border-b border-sky-500/20 bg-sky-950/20 p-4 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1">
                    <Info size={12} /> Guia Contextual • {nomeAbaAtual}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuiaAbaAberto(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p>
                    <strong className="text-amber-300">Desafio Comum:</strong>{' '}
                    {dorGanhoAbaAtual.dor}
                  </p>
                  <p>
                    <strong className="text-emerald-300">Como Esta Aba Ajuda:</strong>{' '}
                    {dorGanhoAbaAtual.ganho}
                  </p>
                </div>
              </div>
            )}

            {/* ─── CORPO: MENSAGENS DA CONVERSA ──────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {(conversas[personaAtiva] || []).map((msg) => {
                const ehUsuario = msg.remetente === 'usuario';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${ehUsuario ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                        ehUsuario
                          ? 'bg-slate-800 text-white rounded-tr-none border border-slate-700'
                          : personaAtiva === 'sofia'
                          ? 'bg-[#040810] text-slate-200 border border-sky-500/30 rounded-tl-none'
                          : personaAtiva === 'zara'
                          ? 'bg-[#080602] text-slate-200 border border-amber-500/30 rounded-tl-none'
                          : 'bg-[#020805] text-slate-200 border border-emerald-500/30 rounded-tl-none'
                      }`}
                    >
                      {msg.texto}
                    </div>
                  </div>
                );
              })}

              {/* Indicador de Digitação */}
              {enviando && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-800 bg-[#04070c] px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]" />
                    <span className="text-[11px] font-semibold">
                      {personaConfig.nome} está analisando...
                    </span>
                  </div>
                </div>
              )}

              {/* ─── CARD DE UPGRADE CASO ESGOTE A DEMONSTRAÇÃO ──────────── */}
              {esgotouDemo && (
                <div
                  className={`mt-4 rounded-2xl border p-4 space-y-3 ${
                    personaAtiva === 'zara'
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-emerald-500/40 bg-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                    <Lock size={14} className={personaConfig.corTexto} />
                    <span>Limite do Modo Demonstração Atingido (5/5)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {personaAtiva === 'zara'
                      ? 'Você explorou a coordenação operacional da Zara. Desbloqueie auditoria contínua e rotina matinal das 08:00 a partir de R$ 349,00/mês.'
                      : 'Você explorou a inteligência do Tom. Desbloqueie a memória operacional e análise de VGV a partir de R$ 197,00/mês.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof setAbaAtiva === 'function') {
                        setAbaAtiva('meuplano');
                      }
                      setChatAberto(false);
                    }}
                    className={`w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg cursor-pointer transition ${
                      personaAtiva === 'zara'
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                    }`}
                  >
                    {personaAtiva === 'zara'
                      ? 'Ativar Zara • A partir de R$ 349,00/mês'
                      : 'Ativar Tom • A partir de R$ 197,00/mês'}
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ─── ATALHOS RÁPIDOS DA PERSONA ────────────────────────────── */}
            <div className="border-t border-slate-800/80 bg-[#03060a] p-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {personaConfig.perguntasRapidas.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={esgotouDemo || enviando}
                    onClick={() => enviarMensagem(item.rotulo)}
                    className="shrink-0 rounded-xl border border-slate-800 bg-[#020408] px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:border-slate-600 hover:text-white disabled:opacity-40 transition cursor-pointer"
                  >
                    {item.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── FORMULÁRIO DE ENVIO DE MENSAGEM ────────────────────────── */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviarMensagem();
              }}
              className="border-t border-slate-800 bg-[#020408] p-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputTexto}
                onChange={(e) => setInputTexto(e.target.value)}
                disabled={esgotouDemo || enviando}
                placeholder={
                  esgotouDemo
                    ? 'Ative o módulo para continuar conversando...'
                    : `Pergunte para ${personaConfig.nome}...`
                }
                className="flex-1 rounded-xl border border-slate-800 bg-[#05080c] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputTexto.trim() || esgotouDemo || enviando}
                style={{ backgroundColor: personaConfig.corPrimaria }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#020408] hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                title="Enviar mensagem"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
