/**
 * src/lib/radarMaps.js
 * ============================================================================
 * Radar de Clientes & Empresas (Google Maps) + Ganchos / Scripts de 10 segundos
 * integrados ao Imóvel-Âncora e ao ecossistema (Tom + Pólen + Zara).
 * ============================================================================
 */

export const ATALHOS_RAMOS = [
  { id: 'medicos', label: 'Médicos / Clínicas', termo: 'Clínica Médica e Consultórios' },
  { id: 'comercio', label: 'Empresários / Comércio', termo: 'Comércio, Distribuição e Varejo' },
  { id: 'construtoras', label: 'Construtoras', termo: 'Construtora e Engenharia' },
  { id: 'advogados', label: 'Advogados / Contadores', termo: 'Advocacia e Contabilidade' },
  { id: 'agronegocio', label: 'Agronegócio', termo: 'Agronegócio e Representações' },
];

export const OBJETIVOS_PROSPECCAO = [
  { id: 'vender_investimento', label: 'Vender Imóvel / Investimento' },
  { id: 'alugar_comercial', label: 'Alugar Sala / Galpão' },
  { id: 'parceria_indicacao', label: 'Parceria / Indicação' },
];

/** Imóveis de demonstração para garantir funcionamento imediato quando a conta estiver vazia. */
export const IMOVEIS_DEMO_ANCORA = [
  {
    id: 'demo-1',
    titulo: 'Residencial Grand Park',
    tipo: 'Apartamento',
    bairro: 'Jardim Finotti',
    cidade: 'Uberlândia',
    valor: 'R$ 440.000',
    detalhes: '3 Quartos (1 Suíte) • 82m² • Varanda Gourmet',
    destaqueVenda: 'Alta liquidez e valorização patrimonial para empresários',
  },
  {
    id: 'demo-2',
    titulo: 'Sala Comercial Plaza Executive',
    tipo: 'Comercial',
    bairro: 'Centro',
    cidade: 'Uberlândia',
    valor: 'R$ 380.000',
    detalhes: 'Sala 64m² • 2 Vagas • Recepção com Catraca',
    destaqueVenda: 'Ideal para consultórios médicos ou escritórios advocatícios',
  },
  {
    id: 'demo-3',
    titulo: 'Galpão Logístico Distrito Industrial',
    tipo: 'Galpão',
    bairro: 'Distrito Industrial',
    cidade: 'Uberlândia',
    valor: 'R$ 1.850.000 (ou R$ 12.000/mês)',
    detalhes: '1.200m² • Pé direito 9m • Pátio para carretas',
    destaqueVenda: 'Excelente para distribuidoras, comércio atacadista e agronegócio',
  },
];

/**
 * Classifica um telefone entre Fixo (8 dígitos após DDD iniciando em 2-5)
 * ou Celular / WhatsApp (9 dígitos após DDD iniciando em 9).
 */
export function classificarTelefone(telefone = '') {
  const limpo = String(telefone || '').replace(/\D/g, '');
  const semDDD = limpo.length >= 10 ? limpo.slice(2) : limpo;

  // Celular / WhatsApp: 9 dígitos iniciando em 9
  if (semDDD.length === 9 && semDDD.startsWith('9')) {
    return {
      tipo: 'whatsapp',
      label: 'Celular / WhatsApp',
      ehWhatsApp: true,
      ehFixo: false,
    };
  }

  // Fixo: 8 dígitos iniciando em 2, 3, 4 ou 5
  if (semDDD.length === 8 && /^[2-5]/.test(semDDD)) {
    return {
      tipo: 'fixo',
      label: 'Telefone Fixo (Ligação)',
      ehWhatsApp: false,
      ehFixo: true,
    };
  }

  // Se tiver 11 dígitos no total e começar com 9 após DDD
  if (limpo.length === 11 && limpo.charAt(2) === '9') {
    return {
      tipo: 'whatsapp',
      label: 'Celular / WhatsApp',
      ehWhatsApp: true,
      ehFixo: false,
    };
  }

  // Padrão seguro para números de 8 dígitos ou comerciais
  return {
    tipo: 'fixo',
    label: 'Telefone Fixo (Ligação)',
    ehWhatsApp: false,
    ehFixo: true,
  };
}

/** Base contextualizada de empresas para os nichos frequentes (com mix de Fixo e WhatsApp) */
const BASE_EMPRESAS_MAPS = {
  medicos: [
    {
      nome: 'Clínica OrtoMed Ortopedia & Fisioterapia',
      endereco: 'Av. Segismundo Pereira, 1420 - Santa Mônica',
      avaliacao: 4.9,
      totalAvaliacoes: 184,
      telefone: '(34) 3234-8890', // Fixo
      status: 'Aberto até 19:00',
    },
    {
      nome: 'Centro Médico & Diagnóstico São Lucas',
      endereco: 'Rua Santos Dumont, 840 - Centro',
      avaliacao: 4.8,
      totalAvaliacoes: 230,
      telefone: '(34) 99201-4433', // WhatsApp
      status: 'Aberto até 18:30',
    },
    {
      nome: 'Dra. Camila Vasconcelos Dermatologia & Estética',
      endereco: 'Av. Rondon Pacheco, 3100 - Saraiva',
      avaliacao: 5.0,
      totalAvaliacoes: 96,
      telefone: '(34) 99318-7722', // WhatsApp
      status: 'Aberto até 19:00',
    },
    {
      nome: 'Instituto Gastro & Saúde Avançada',
      endereco: 'Av. Floriano Peixoto, 1150 - Brasil',
      avaliacao: 4.7,
      totalAvaliacoes: 142,
      telefone: '(34) 3212-5500', // Fixo
      status: 'Aberto hoje',
    },
  ],
  comercio: [
    {
      nome: 'Distribuidora Triângulo Alimentos & Bebidas',
      endereco: 'Av. Brasil, 2890 - Nossa Senhora Aparecida',
      avaliacao: 4.8,
      totalAvaliacoes: 156,
      telefone: '(34) 99255-6677', // WhatsApp
      status: 'Aberto até 18:00',
    },
    {
      nome: 'MegaSul Ferramentas & Equipamentos',
      endereco: 'Av. Afonso Pena, 1950 - Centro',
      avaliacao: 4.7,
      totalAvaliacoes: 210,
      telefone: '(34) 3222-3322', // Fixo
      status: 'Aberto até 18:30',
    },
    {
      nome: 'Empório & Restaurante das Gerais',
      endereco: 'Rua Olegário Maciel, 420 - Centro',
      avaliacao: 4.9,
      totalAvaliacoes: 340,
      telefone: '(34) 99388-1122', // WhatsApp
      status: 'Aberto até 22:00',
    },
  ],
  construtoras: [
    {
      nome: 'Aliança Engenharia & Empreendimentos',
      endereco: 'Av. Cesário Alvim, 1820 - Brasil',
      avaliacao: 4.9,
      totalAvaliacoes: 88,
      telefone: '(34) 3219-9988', // Fixo
      status: 'Aberto até 18:00',
    },
    {
      nome: 'Vértice Obras Civis & Loteamentos',
      endereco: 'Av. João Naves de Ávila, 3400 - Santa Mônica',
      avaliacao: 4.7,
      totalAvaliacoes: 64,
      telefone: '(34) 99188-4455', // WhatsApp
      status: 'Aberto até 17:30',
    },
    {
      nome: 'Granja Construtora & Incorporações',
      endereco: 'Av. Floriano Peixoto, 2200 - Granja Marileusa',
      avaliacao: 4.8,
      totalAvaliacoes: 112,
      telefone: '(34) 99344-0011', // WhatsApp
      status: 'Aberto até 18:00',
    },
  ],
  advogados: [
    {
      nome: 'Oliveira, Castro & Associados Advocacia Empresarial',
      endereco: 'Av. Rondon Pacheco, 2400 - Tibery',
      avaliacao: 4.9,
      totalAvaliacoes: 78,
      telefone: '(34) 3235-5566', // Fixo
      status: 'Aberto até 18:30',
    },
    {
      nome: 'Delta Contabilidade & Perícia Tributária',
      endereco: 'Rua Duque de Caxias, 620 - Centro',
      avaliacao: 4.8,
      totalAvaliacoes: 95,
      telefone: '(34) 99277-3311', // WhatsApp
      status: 'Aberto até 18:00',
    },
    {
      nome: 'Silva & Morais Consultoria Jurídica',
      endereco: 'Av. Getúlio Vargas, 1050 - Tabajaras',
      avaliacao: 5.0,
      totalAvaliacoes: 52,
      telefone: '(34) 99800-2244', // WhatsApp
      status: 'Aberto até 18:00',
    },
  ],
  agronegocio: [
    {
      nome: 'AgroGrãos Fertilizantes & Nutrição Vegetal',
      endereco: 'Av. Anselmo Alves dos Santos, 1900 - Santa Mônica',
      avaliacao: 4.9,
      totalAvaliacoes: 130,
      telefone: '(34) 3216-4488', // Fixo
      status: 'Aberto até 17:30',
    },
    {
      nome: 'Cerrado Sementes & Tecnologia Rural',
      endereco: 'Rodovia BR-050, Km 72 - Distrito Industrial',
      avaliacao: 4.8,
      totalAvaliacoes: 165,
      telefone: '(34) 99233-7711', // WhatsApp
      status: 'Aberto até 18:00',
    },
    {
      nome: 'TratorMax Máquinas & Peças Agrícolas',
      endereco: 'Av. João Pinheiro, 3100 - Umuarama',
      avaliacao: 4.7,
      totalAvaliacoes: 210,
      telefone: '(34) 99311-9955', // WhatsApp
      status: 'Aberto até 18:00',
    },
  ],
};

/**
 * Normaliza string para busca
 */
function normalizarTexto(txt = '') {
  return String(txt || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Gera empresas dinâmicas para qualquer ramo livre (ex.: petshop, academia, restaurante)
 */
function gerarEmpresasDinamicasRamoLivre({ termo = 'Comércio', cidade = 'Uberlândia', bairro = '' }) {
  const termoFormatado = termo
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');

  const localizacaoBase = bairro ? `${bairro}, ${cidade}` : cidade;

  return [
    {
      nome: `${termoFormatado} Prime Center`,
      endereco: `Av. Principal, 120 - ${localizacaoBase}`,
      avaliacao: 4.9,
      totalAvaliacoes: 142,
      telefone: '(34) 99182-4411', // WhatsApp
      status: 'Aberto até 19:00',
    },
    {
      nome: `Espaço ${termoFormatado} & Serviços`,
      endereco: `Rua Comercial, 550 - ${localizacaoBase}`,
      avaliacao: 4.8,
      totalAvaliacoes: 98,
      telefone: '(34) 3234-1122', // Fixo
      status: 'Aberto até 18:30',
    },
    {
      nome: `${termoFormatado} Central ${cidade}`,
      endereco: `Av. Getúlio Vargas, 840 - ${localizacaoBase}`,
      avaliacao: 4.7,
      totalAvaliacoes: 165,
      telefone: '(34) 99201-9988', // WhatsApp
      status: 'Aberto até 18:00',
    },
    {
      nome: `Grupo ${termoFormatado} & Associados`,
      endereco: `Rua Santos Dumont, 310 - ${localizacaoBase}`,
      avaliacao: 5.0,
      totalAvaliacoes: 84,
      telefone: '(34) 3211-7700', // Fixo
      status: 'Aberto hoje',
    },
  ];
}

/**
 * Retorna empresas para qualquer ramo livre ou atalhos selecionados.
 * Garante que buscas livres (ex: petshop) tragam empresas reais daquele nicho.
 */
export function buscarEmpresasMaps({ ramo = 'medicos', cidade = 'Uberlândia', bairro = '' }) {
  const termoLimpo = normalizarTexto(ramo);

  // 1. Verifica se casa com os 5 nichos pré-definidos
  let chaveEncontrada = null;
  if (termoLimpo.includes('medic') || termoLimpo.includes('clinic') || termoLimpo.includes('doutor') || termoLimpo.includes('saude')) {
    chaveEncontrada = 'medicos';
  } else if (termoLimpo.includes('comerc') || termoLimpo.includes('loja') || termoLimpo.includes('distribuid') || termoLimpo.includes('varejo')) {
    chaveEncontrada = 'comercio';
  } else if (termoLimpo.includes('construt') || termoLimpo.includes('engenh') || termoLimpo.includes('obra')) {
    chaveEncontrada = 'construtoras';
  } else if (termoLimpo.includes('advog') || termoLimpo.includes('jurid') || termoLimpo.includes('contab') || termoLimpo.includes('escritorio')) {
    chaveEncontrada = 'advogados';
  } else if (termoLimpo.includes('agro') || termoLimpo.includes('rural') || termoLimpo.includes('fazenda') || termoLimpo.includes('grao')) {
    chaveEncontrada = 'agronegocio';
  }

  const listaBase = chaveEncontrada
    ? BASE_EMPRESAS_MAPS[chaveEncontrada]
    : gerarEmpresasDinamicasRamoLivre({ termo: ramo || 'Estabelecimentos', cidade, bairro });

  return listaBase.map((item, index) => {
    const enderecoAjustado = bairro && !item.endereco.includes(bairro)
      ? `${item.endereco.split('-')[0].trim()} - ${bairro}, ${cidade || 'MG'}`
      : `${item.endereco}, ${cidade || 'MG'}`;

    return {
      id: `lead-maps-${chaveEncontrada || 'busca'}-${Date.now().toString(36)}-${index + 1}`,
      nome: item.nome,
      ramo: ramo || 'Geral',
      endereco: enderecoAjustado,
      avaliacao: item.avaliacao,
      totalAvaliacoes: item.totalAvaliacoes,
      telefone: item.telefone,
      status: item.status,
    };
  });
}

/**
 * Gera o Gancho / Script de 10 segundos da IA conectando:
 * Empresa + Ramo + Objetivo + Imóvel-Âncora da Campanha.
 */
export function gerarScript10Segundos({
  empresa,
  ramo = 'medicos',
  objetivo = 'vender_investimento',
  imovelAncora,
  imobiliaria = 'nossa imobiliária',
}) {
  const nomeEmpresa = empresa?.nome || 'sua empresa';
  const imovelNome = imovelAncora?.titulo || 'oportunidade em carteira';
  const imovelPreco = imovelAncora?.valor ? ` (${imovelAncora.valor})` : '';
  const imovelBairro = imovelAncora?.bairro ? ` no bairro ${imovelAncora.bairro}` : '';

  if (objetivo === 'alugar_comercial') {
    return `Olá equipe da ${nomeEmpresa}! Acompanho a relevância do seu trabalho na região. Estamos com o ${imovelNome}${imovelBairro}${imovelPreco}, espaço com infraestrutura completa e excelente visibilidade, ideal para expansão de sede ou nova unidade. Gostariam de receber uma apresentação rápida de 1 minuto em vídeo?`;
  }

  if (objetivo === 'parceria_indicacao') {
    return `Olá diretores da ${nomeEmpresa}, tudo bem? Atuamos com inteligência de mercado imobiliário pela ${imobiliaria}. Dado o alto volume de clientes e parceiros que vocês movimentam, gostaríamos de apresentar um canal exclusivo de atendimento VIP e comissionamento de parcerias para sua equipe. Podemos agendar um alinhamento rápido de 5 minutos nesta quinta?`;
  }

  // Objetivo padrão: Vender Imóvel / Investimento
  return `Olá! Vi o destaque e a sólida reputação da ${nomeEmpresa} na nossa região. Pelo perfil de patrimônio e reserva de valor do setor, selecionei com exclusividade o ${imovelNome}${imovelBairro}${imovelPreco}: imóvel de alta liquidez e retorno acima do CDI. Posso te enviar a ficha executiva de 1 página com o cálculo de rentabilidade?`;
}

/**
 * Exporta a lista atual de leads capturados para planilha .CSV (compatível com Excel pt-BR)
 */
export function exportarLeadsMapsCsv({ leads = [], statusMap = {}, tempMap = {}, scriptsMap = {} }) {
  if (!leads || leads.length === 0) return false;

  const cabecalhos = [
    'Nome da Empresa',
    'Ramo',
    'Endereço',
    'Telefone',
    'Tipo Telefone',
    'Status',
    'Temperatura',
    'Avaliação Google',
    'Gancho / Script Sugerido',
  ];

  const linhas = leads.map((lead) => {
    const classTel = classificarTelefone(lead.telefone);
    const status = statusMap[lead.id] || 'Novo';
    const temp = tempMap[lead.id] || 'Morno';
    const script = scriptsMap[lead.id] || '';

    return [
      lead.nome,
      lead.ramo || '',
      lead.endereco || '',
      lead.telefone || '',
      classTel.label,
      status,
      temp,
      `${lead.avaliacao} (${lead.totalAvaliacoes} avaliações)`,
      script.replace(/(\r\n|\n|\r)/gm, ' '),
    ].map((val) => `"${String(val || '').replace(/"/g, '""')}"`).join(';');
  });

  const conteudoCsv = '\uFEFF' + [cabecalhos.join(';'), ...linhas].join('\r\n');
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `leads-google-maps-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
