/**
 * src/data/cerebroSofia.js
 * ============================================================================
 * Cérebro Estruturado da Sofia — Especialista Oficial do Express Imobi Tech.
 *
 * Contém o mapeamento fiel e completo de:
 * 1. Módulos e limites de cada degrau (Grátis, PRO, PLUS);
 * 2. Módulos de Inteligência Artificial (Pólen 24h, Zara Operacional, Tom Jarvis);
 * 3. Regras de negócio e fluxos reais (Roleta de Leads, Vitrine, Migração, WhatsApp);
 * 4. Respostas prontas instantâneas para botões de 1 clique (0 tokens);
 * 5. Mecanismo de busca semântica/RAG local leve com teto de ~700 tokens de contexto.
 * ============================================================================
 */

export const CONHECIMENTO_SOFIA = Object.freeze({
  EMPRESA: {
    nome: 'Express Imobi Tech',
    empresaMae: 'Express Tech',
    slogan: 'Plataforma Inteligente de VGV, CRM e Automação para Imobiliárias e Corretores',
    suporteWhatsapp: '+856 20 99640154',
    suporteEmail: 'contato@expresstech.com.br',
    siteOficial: 'imobi.expresstech.com.br',
  },

  PLANOS: {
    gratis: {
      nome: 'Plano Grátis',
      preco: 'R$ 0,00',
      usuarios: '1 usuário',
      totalModulos: 10,
      descricao: 'Estrutura essencial para corretores autônomos e imobiliárias organizarem seu funil e rotina comercial sem custo.',
      modulos: [
        '1. Visão Geral (Painel Executivo com métricas de VGV em carteira, comissão prevista de 6%, leads ativos e visitas)',
        '2. Meu Plano (Gestão de assinatura, faturamento e comparação de degraus)',
        '3. Leads & Funil CRM (Gestão de compradores e proprietários em etapas visuais do funil)',
        '4. Migração de CRM (Importação de carteira via planilha Excel/CSV ou XML de portais sem perda de histórico)',
        '5. Agenda de Visitas (Sincronização de compromissos com compradores e controle de horários)',
        '6. Financeiro & VGV (Controle básico de entradas, saídas e comissões transacionadas)',
        '7. Corretores & Equipe (Cadastro de membros da equipe e definição de metas)',
        '8. Configurações (Dados da imobiliária, CNPJ/CRECI, logotipo e parâmetros gerais)',
        '9. Bônus de Campo (Guia tático de abordagem presencial e captação externa de imóveis)',
        '10. Suporte Especialista (Mentoria direta com a Sofia — 1 ano de suporte dedicado garantido para os 100 primeiros clientes)',
      ],
      restricaoFotos: 'Não inclui upload de fotos para vitrine pública (requer upgrade para o Plano PRO).',
    },

    pro: {
      nome: 'Plano PRO',
      precoMensal: 'R$ 39,90/mês',
      precoAnual: 'R$ 34,90/mês (cobrado anualmente)',
      usuarios: '1 usuário incluso',
      pilaresPrincipais: [
        'Pilar 1 — Captação & Imóveis: Cadastro completo de imóveis (apartamentos, casas, terrenos, coberturas e comerciais) com até 7 fotos em alta resolução por imóvel. A Foto 1 é automaticamente definida como a capa da vitrine.',
        'Pilar 2 — Propostas & Negociações: Esteira completa de propostas e contrapropostas, histórico de negociação e geração de minutas.',
        'Pilar 3 — Tráfego & Meta Ads: Gerador de anúncios e copys de alta conversão para Facebook e Instagram Ads específicas para o nicho imobiliário.',
      ],
      extrasInclusos: [
        'Vitrine Pública & Portal do Cliente: Página online moderna sincronizada com o catálogo de imóveis.',
        'Agentes Operacionais: Esteira com agentes de apoio coordenados por Zara no funil diário.',
        'Hermes Copiloto de Negociação: Assistente tático para contornar objeções de preço e condições.',
      ],
    },

    plus: {
      nome: 'Plano PLUS',
      precoMensal: 'R$ 99,90/mês',
      precoAnual: 'R$ 89,90/mês (cobrado anualmente)',
      usuarios: 'Até 3 usuários inclusos (+ R$ 19,90/mês por usuário adicional)',
      descricao: 'Plano completo para imobiliárias em escala. Herda 100% dos recursos do PRO e Grátis e adiciona 9 módulos executivos exclusivos.',
      modulosExclusivos: [
        '1. Correspondente / Crédito: Simulações bancárias oficiais (Caixa e bancos privados), esteira de aprovação e enquadramento de FGTS.',
        '2. Radar de Captação: Varredura contínua de imóveis anunciados direto por proprietários no OLX, Facebook e portais.',
        '3. Administrador / Gestão: Painel executivo avançado para diretores e gerentes com auditoria de equipe.',
        '4. Roleta de Leads: Distribuição automática e igualitária (round-robin) de novos leads entre os corretores, com alerta de SLA de resposta.',
        '5. Repasses & NF: Divisão automática de honorários entre imobiliária, captador e vendedor + emissão de notas fiscais.',
        '6. Tarefas & Vistorias: Checklist fotográfico de vistorias de entrada e saída para locação e venda.',
        '7. Avaliação de Imóvel PTAM: Laudo técnico mercadológico segundo a norma ABNT NBR 14.653.',
        '8. Contador & Custos: Simulador de taxas de transferência, ITBI municipal, emolumentos de cartório e certidões.',
        '9. Assistente Legal: Pareceres sobre a Lei do Inquilinato (Lei 8.245/91), rescisões e contratos com motor jurídico para as 27 UFs.',
      ],
    },

    ia: {
      polen: {
        nome: 'IA Pólen · 24H',
        funcao: 'Secretária Comercial 24 horas no WhatsApp oficial da imobiliária.',
        comoFunciona: 'Atende clientes de madrugada, responde dúvidas com base no catálogo real de imóveis da imobiliária, qualifica o perfil de compra e agenda visitas na agenda da equipe.',
        politicaPreco: 'Contratação consultiva e independente. A Sofia não cita preço de tabela da Pólen, convidando o usuário a testar o simulador ao vivo na aba da Pólen ou solicitar a ativação à equipe técnica.',
        ativacao: 'Pareamento assistido por engenheiros da Express Tech em servidores dedicados e seguros, sem risco de bloqueio de número.',
      },
      zara: {
        nome: 'IA Zara · Direção Operacional',
        funcao: 'Diretora de Operações e Rotina da imobiliária.',
        comoFunciona: 'Audita diariamente a operação às 08:00 com base nas Regras da Casa (Tom), cobrando corretores por leads acima do SLA e indicando ações para destravar imóveis parados há mais de 30/40 dias.',
      },
      tom: {
        nome: 'IA Tom · Segundo Cérebro Estratégico',
        preco: 'A partir de R$ 197,00/mês (autônomo) ou R$ 497,00/mês (equipe/imobiliária).',
        funcao: 'Sócio e cérebro estratégico para memória de regras comerciais, auditoria de contratos e apoio em tomadas de decisão de alto nível.',
      },
    },
  },

  FUNCIONALIDADES_CHAVE: {
    roleta: {
      titulo: 'Roleta de Leads (Distribuição Justa)',
      plano: 'Exclusivo do Plano PLUS',
      explicacao: 'A Roleta de Leads distribui contatos que chegam pela vitrine, campanhas ou portais de forma alternada (round-robin) entre os corretores ativos. Nenhum corretor é favorecido e o sistema dispara alerta se o corretor não atender o lead dentro do SLA configurado nas Regras Comerciais da imobiliária.',
      passoAPasso: 'Para configurar: acesse a aba Roleta de Leads, selecione quais corretores da equipe estão aptos a receber novos clientes e ative a distribuição automática.',
    },
    vitrine: {
      titulo: 'Vitrine Pública & Cadastro de Imóveis',
      plano: 'Disponível no Plano PRO e PLUS',
      explicacao: 'A Vitrine Pública é o portal online da sua imobiliária. Para cadastrar um imóvel: acesse a aba Captação & Imóveis, preencha tipo, bairro, valor e anexe até 7 fotos em alta resolução. A Foto 1 é automaticamente a foto de capa e destaque do anúncio.',
      passoAPasso: 'Acesse Captação & Imóveis > Novo Imóvel > preencha os dados > envie até 7 fotos (garanta que a foto mais atraente seja a Foto 1) > salve para publicar na vitrine.',
    },
    migracao: {
      titulo: 'Migração de CRM & Carteira',
      plano: 'Disponível em todos os planos (inclusive Grátis)',
      explicacao: 'Você pode trazer todos os seus clientes e imóveis de outros sistemas (Kenlo, Vista, inGaia, Sigavi, etc.) sem digitar nada manualmente. Aceita arquivos Excel (.xlsx), planilhas (.csv) e links de feeds XML de portais (ZAP, VivaReal, Chaves na Mão).',
      passoAPasso: 'Acesse a aba Migração de CRM > selecione se deseja importar Clientes ou Imóveis > envie sua planilha ou link XML > valide o mapeamento das colunas e conclua.',
    },
    whatsapp: {
      titulo: 'Configuração & Ativação do WhatsApp (IA Pólen)',
      plano: 'Módulo de Atendimento IA 24h',
      explicacao: 'O WhatsApp da Pólen funciona conectado diretamente ao número oficial da sua imobiliária através de uma infraestrutura em nuvem dedicada. Não utiliza códigos ou extensões instáveis de navegador: nossa equipe de engenharia realiza o pareamento assistido após a solicitação.',
      passoAPasso: 'Na aba IA PÓLEN · 24H, você pode experimentar como ela responde no Simulador de Atendimento ao Vivo. Para ativar no seu número oficial, basta clicar em "Quero a Pólen no meu WhatsApp" para iniciar a ativação assistida.',
    },
  },
});

/**
 * Respostas prontas instantâneas para os 4 botões de perguntas rápidas (0 tokens / tempo de resposta 0ms).
 */
export const RESPOSTAS_PRONTAS_SOFIA = Object.freeze({
  'Como funciona a Roleta de Leads?': `A **Roleta de Leads** (exclusiva do **Plano PLUS**) garante que todos os novos clientes que entram pelos seus canais de captação sejam distribuídos de forma 100% justa e automática entre a sua equipe de corretores:

1. **Rodízio Inteligente (Round-Robin):** Cada lead novo é entregue ao próximo corretor da fila, sem privilégios ou disputas manuais.
2. **Monitoramento de SLA:** O sistema acompanha o tempo de resposta do corretor. Se ultrapassar o prazo estabelecido nas Regras da Casa (ex.: 15 minutos), a diretora **Zara** emite alerta imediato.
3. **Equipe Ativa:** Você escolhe exatamente quais corretores estão de plantão para receber contatos.

Essa funcionalidade evita que leads esfriem e aumenta diretamente a taxa de conversão em visitas da sua imobiliária.`,

  'O que entra no plano PRO?': `O **Plano PRO** é a escolha ideal para corretores e imobiliárias que precisam de tração comercial rápida por apenas **R$ 39,90/mês** (ou R$ 34,90/mês no anual). Ele entrega:

• **Pilar 1 — Captação & Imóveis:** Cadastro completo do catálogo com até **7 fotos** por imóvel, sendo a **Foto 1** definida automaticamente como a capa da vitrine.
• **Pilar 2 — Propostas & Negociações:** Esteira para gerenciar propostas recebidas, contrapropostas e histórico de clientes.
• **Pilar 3 — Tráfego & Meta Ads:** Gerador automático de anúncios e copys de alta conversão para Facebook e Instagram Imobiliário.
• **Vitrine Pública Online:** Portal sincronizado para expor seus imóveis para clientes.
• **Agentes Operacionais & Hermes:** Apoio tático para contornar objeções de compradores.

*(Para ter múltiplos corretores, Roleta de Leads e Crédito Bancário, conheça o Plano PLUS).*`,

  'Como configuro meu WhatsApp?': `A ativação do WhatsApp com a **IA Pólen (Secretária Comercial 24h)** é profissional e acompanhada:

1. **Simulação Imediata:** Na aba **IA PÓLEN · 24H**, você já pode testar o simulador ao vivo com perguntas reais para ver como ela atende de madrugada e agenda visitas.
2. **Pareamento Seguro e Assistido:** Para colocar a Pólen para responder no número oficial da sua imobiliária, nossa equipe de engenharia realiza a configuração assistida em servidores dedicados e seguros, garantindo estabilidade e proteção anti-bloqueio.
3. **Sincronização com o Catálogo:** A Pólen estuda automaticamente os imóveis cadastrados na sua conta e responde dúvidas sobre valores, condomínio, localização e regras de visita.

Para iniciar a ativação no seu número, clique no botão **"Quero a Pólen no meu WhatsApp"** na aba da Pólen!`,

  'Como cadastrar imóvel na vitrine?': `Cadastrar um imóvel para aparecer na sua **Vitrine Pública** é muito simples:

1. Acesse o menu lateral e clique em **Captação & Imóveis** (incluso nos Planos PRO e PLUS).
2. Clique no botão **"Novo Imóvel"** ou **"Cadastrar Imóvel"**.
3. Preencha os dados essenciais: Tipo (apartamento, casa, etc.), Finalidade (venda/locação), Bairro, Cidade, Valor e Metragem.
4. Anexe até **7 fotos** do imóvel. **Dica importante:** A **Foto 1** será utilizada automaticamente como a capa principal do anúncio na vitrine, então escolha a imagem de maior impacto visual!
5. Salve o cadastro. O imóvel ficará imediatamente visível na sua vitrine online e disponível para os agentes de IA responderem compradores.`,
});

/**
 * Normaliza string para busca (sem acentos, minúsculas).
 */
function normalizarTexto(texto = '') {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Busca no Cérebro da Sofia.
 * Se a pergunta corresponder a uma pergunta rápida, retorna a resposta pronta instantânea (0 tokens).
 * Caso contrário, extrai apenas o recorte de contexto relevante (~700 tokens máx) para envio ao /api/ai.
 *
 * @param {string} pergunta Pergunta enviada pelo usuário
 * @returns {{ respostaPronta: string|null, contexto: string, moduloSugerido: string }}
 */
export function buscarContextoSofia(pergunta = '') {
  const limpa = normalizarTexto(pergunta);

  // 1. Verificação de correspondência com as perguntas prontas
  for (const [chaveOriginal, resposta] of Object.entries(RESPOSTAS_PRONTAS_SOFIA)) {
    const chaveNorm = normalizarTexto(chaveOriginal);
    if (limpa === chaveNorm || limpa.includes(chaveNorm) || chaveNorm.includes(limpa)) {
      return {
        respostaPronta: resposta,
        contexto: '',
        moduloSugerido: identificarModuloPorTexto(limpa),
      };
    }
  }

  // Correspondência flexível para intenções clássicas
  if (limpa.includes('roleta') && (limpa.includes('como funciona') || limpa.includes('o que e') || limpa.includes('leads'))) {
    return {
      respostaPronta: RESPOSTAS_PRONTAS_SOFIA['Como funciona a Roleta de Leads?'],
      contexto: '',
      moduloSugerido: 'roleta',
    };
  }

  if (limpa.includes('plano pro') || (limpa.includes('pro') && (limpa.includes('entra') || limpa.includes('quanto custa') || limpa.includes('preco')))) {
    return {
      respostaPronta: RESPOSTAS_PRONTAS_SOFIA['O que entra no plano PRO?'],
      contexto: '',
      moduloSugerido: 'pro',
    };
  }

  if ((limpa.includes('whatsapp') || limpa.includes('polen') || limpa.includes('secretaria')) && (limpa.includes('configur') || limpa.includes('ativar') || limpa.includes('conectar'))) {
    return {
      respostaPronta: RESPOSTAS_PRONTAS_SOFIA['Como configuro meu WhatsApp?'],
      contexto: '',
      moduloSugerido: 'polen',
    };
  }

  if (limpa.includes('vitrine') && (limpa.includes('cadastr') || limpa.includes('imovel') || limpa.includes('foto'))) {
    return {
      respostaPronta: RESPOSTAS_PRONTAS_SOFIA['Como cadastrar imóvel na vitrine?'],
      contexto: '',
      moduloSugerido: 'vitrine',
    };
  }

  // 2. Extração RAG enxuta de contexto para perguntas livres (teto de ~700 tokens)
  const blocos = [];
  const c = CONHECIMENTO_SOFIA;

  // Relevância para Planos
  if (limpa.includes('gratis') || limpa.includes('gratuito') || limpa.includes('free')) {
    blocos.push(`[PLANO GRÁTIS (${c.PLANOS.gratis.preco})]:\n${c.PLANOS.gratis.modulos.join('\n')}\nRestrição: ${c.PLANOS.gratis.restricaoFotos}`);
  }

  if (limpa.includes('pro') || limpa.includes('fotos') || limpa.includes('capa') || limpa.includes('39,90') || limpa.includes('anuncio')) {
    blocos.push(`[PLANO PRO (${c.PLANOS.pro.precoMensal} ou ${c.PLANOS.pro.precoAnual})]:\n${c.PLANOS.pro.pilaresPrincipais.join('\n')}\n${c.PLANOS.pro.extrasInclusos.join('\n')}`);
  }

  if (limpa.includes('plus') || limpa.includes('usuarios') || limpa.includes('credito') || limpa.includes('equipe') || limpa.includes('ptam') || limpa.includes('99,90')) {
    blocos.push(`[PLANO PLUS (${c.PLANOS.plus.precoMensal} ou ${c.PLANOS.plus.precoAnual} · ${c.PLANOS.plus.usuarios})]:\n${c.PLANOS.plus.modulosExclusivos.join('\n')}`);
  }

  // Relevância para IA
  if (limpa.includes('polen') || limpa.includes('whatsapp') || limpa.includes('24h') || limpa.includes('secretaria')) {
    blocos.push(`[IA PÓLEN · 24H]:\nFunção: ${c.PLANOS.ia.polen.funcao}\nComo funciona: ${c.PLANOS.ia.polen.comoFunciona}\nRegra de Preço: Não expor preço avulso; orientar a testar no simulador ou solicitar ativação assistida à equipe.`);
  }

  if (limpa.includes('zara') || limpa.includes('operacao') || limpa.includes('08:00') || limpa.includes('auditoria') || limpa.includes('sla')) {
    blocos.push(`[IA ZARA · DIREÇÃO OPERACIONAL]:\nFunção: ${c.PLANOS.ia.zara.funcao}\nComo opera: ${c.PLANOS.ia.zara.comoFunciona}`);
  }

  if (limpa.includes('tom') || limpa.includes('cerebro') || limpa.includes('estrategico') || limpa.includes('regras')) {
    blocos.push(`[IA TOM · SEGUNDO CÉREBRO]:\nPreço: ${c.PLANOS.ia.tom.preco}\nFunção: ${c.PLANOS.ia.tom.funcao}`);
  }

  // Relevância para Recursos Específicos
  if (limpa.includes('migrac') || limpa.includes('excel') || limpa.includes('xml') || limpa.includes('planilha') || limpa.includes('import')) {
    blocos.push(`[MIGRAÇÃO DE CRM]:\n${c.FUNCIONALIDADES_CHAVE.migracao.explicacao}\nPasso a passo: ${c.FUNCIONALIDADES_CHAVE.migracao.passoAPasso}`);
  }

  if (limpa.includes('roleta') || limpa.includes('distribuicao') || limpa.includes('rodizio')) {
    blocos.push(`[ROLETA DE LEADS]:\n${c.FUNCIONALIDADES_CHAVE.roleta.explicacao}\nPasso a passo: ${c.FUNCIONALIDADES_CHAVE.roleta.passoAPasso}`);
  }

  if (limpa.includes('vitrine') || limpa.includes('portal') || limpa.includes('site') || limpa.includes('catalogo')) {
    blocos.push(`[VITRINE PÚBLICA]:\n${c.FUNCIONALIDADES_CHAVE.vitrine.explicacao}\nPasso a passo: ${c.FUNCIONALIDADES_CHAVE.vitrine.passoAPasso}`);
  }

  // Se nenhum bloco específico bateu, injeta a síntese executiva dos 3 planos
  if (blocos.length === 0) {
    blocos.push(
      `[SÍNTESE DOS PLANOS DO EXPRESS IMOBI TECH]:\n` +
      `• GRÁTIS (R$ 0): 10 módulos essenciais (Visão Geral, Meu Plano, Funil CRM, Migração de CRM, Agenda, Financeiro, Equipe, Configurações, Bônus de Campo e Suporte Especialista 1 ano grátis para 100 primeiros).\n` +
      `• PRO (R$ 39,90/mês ou R$ 34,90/mês no anual · 1 usuário): Captação de imóveis com até 7 fotos (Foto 1 é capa da vitrine), Propostas & Negociações, Tráfego Meta Ads, vitrine pública e Agentes com Zara.\n` +
      `• PLUS (R$ 99,90/mês ou R$ 89,90/mês no anual · até 3 usuários): Tudo do PRO + Crédito bancário, Radar de Captação, Roleta de Leads justa, Repasses & NF, Tarefas/Vistorias, Avaliação PTAM NBR 14.653, Simulador de Custos e Assistente Legal 27 UFs.\n` +
      `• IA PÓLEN 24H: Secretária comercial no WhatsApp da imobiliária (não citar preço, orientar a testar no simulador).\n` +
      `• IA ZARA: Auditoria matinal às 08:00.\n` +
      `• IA TOM: Segundo cérebro estratégico a partir de R$ 197/mês.`
    );
  }

  return {
    respostaPronta: null,
    contexto: blocos.join('\n\n'),
    moduloSugerido: identificarModuloPorTexto(limpa),
  };
}

function identificarModuloPorTexto(limpo = '') {
  if (limpo.includes('roleta')) return 'roleta';
  if (limpo.includes('pro')) return 'pro';
  if (limpo.includes('plus')) return 'plus';
  if (limpo.includes('gratis')) return 'gratis';
  if (limpo.includes('polen') || limpo.includes('whatsapp')) return 'polen';
  if (limpo.includes('zara')) return 'zara';
  if (limpo.includes('tom')) return 'tom';
  if (limpo.includes('vitrine') || limpo.includes('imovel')) return 'vitrine';
  if (limpo.includes('migrac')) return 'migracao';
  return 'geral';
}
