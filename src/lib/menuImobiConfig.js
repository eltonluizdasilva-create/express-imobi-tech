/**
 * menuImobiConfig.js — Catálogos estáticos do menu, abas e agentes iniciais
 * ============================================================================
 * Extraído de src/AdminNovo.jsx para redução de tamanho e carregamento rápido.
 * ============================================================================
 */

export const GRUPOS_MENU_IMOBI = [
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

export const MAPA_DETALHES_ABAS = (GRUPOS_MENU_IMOBI || [])
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

export const AGENTES_INICIAIS = [
  {
    id: 'sofia_triagem',
    nome: 'Pólen — Atendimento & Triagem 24h',
    cargo: 'Recepção 24h no WhatsApp',
    ativo: true,
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

export const LABELS_ABAS_IMOBI = (GRUPOS_MENU_IMOBI || [])
  .flatMap((g) => g?.itens || [])
  .reduce((acc, item) => {
    if (item?.id) acc[item.id] = item.label;
    return acc;
  }, {});
LABELS_ABAS_IMOBI.agentes_ia = 'Agentes Operacionais · Zara';
LABELS_ABAS_IMOBI.mapa_inteligencia = 'Central de Inteligência da Imobiliária';
LABELS_ABAS_IMOBI['reunioes-atas'] = 'Reuniões & Atas IA';
LABELS_ABAS_IMOBI.pos_venda = 'Pós-Venda, Chaves & Carteira';
