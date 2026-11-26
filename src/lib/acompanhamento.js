/**
 * acompanhamento.js — regras do módulo "Acompanhamento do Cliente".
 *
 * Acompanhamento do cliente: rastreio de processos com código + senha.
 * Coleção privada: oficinas/{tenantId}/acompanhamentos_imobi/{codigo}_{senha}
 * Espelho público: acompanhamentos_publicos/{codigo}_{senha} (leitura anônima)
 */

export const ETAPAS_CARTORIO_CREDITO = [
  'Documentação & Auditoria de Certidões (CNDs)',
  'Impostos, Escritura / Contrato Bancário & RGI',
  'Conclusão do Registro, Repasses & Entrega de Chaves',
];

export const TIPOS_OPERACAO = [
  {
    key: 'cartorio_credito',
    label: 'Cartório & Escritura / Crédito',
    icone: '🏛️',
    resumo: 'Certidões, ITBI, Escritura/Financiamento e Registro em Cartório',
    etapas: ETAPAS_CARTORIO_CREDITO,
  },
  {
    key: 'financiamento',
    label: 'Financiamento Urbano',
    icone: '🏦',
    resumo: 'Banco, engenharia, ITBI e cartório',
    etapas: [
      'Proposta Aceita',
      'Documentação Pessoal',
      'Análise de Crédito (Banco)',
      'Engenharia/Vistoria',
      'Emissão de Contrato',
      'ITBI e Cartório',
      'Entrega das Chaves',
    ],
  },
  {
    key: 'vista',
    label: 'Compra à Vista',
    icone: '💵',
    resumo: 'Due diligence curta e escritura',
    etapas: [
      'Sinal/Arras',
      'Certidões e Due Diligence',
      'Escritura e ITBI',
      'Registro e Chaves',
    ],
  },
  {
    key: 'locacao',
    label: 'Locação',
    icone: '🔑',
    resumo: 'Análise de garantia e vistoria',
    etapas: [
      'Ficha Cadastral',
      'Análise de Garantia',
      'Vistoria de Entrada',
      'Assinatura do Contrato',
      'Entrega das Chaves',
    ],
  },
  {
    key: 'loteamento',
    label: 'Loteamento',
    icone: '🏗️',
    resumo: 'Reserva, aprovação e liberação',
    etapas: [
      'Reserva da Quadra/Lote',
      'Aprovação na Loteadora',
      'Assinatura de Contrato',
      'Liberação',
    ],
  },
  {
    key: 'sucessao',
    label: 'Inventário e Sucessão',
    icone: '⚖️',
    resumo: 'Partilha, ITCMD/ITCD e registro',
    etapas: [
      'Abertura do Inventário',
      'Levantamento de Bens e Certidões',
      'Avaliação e Imposto Estadual',
      'Partilha / Formal de Partilha',
      'Registro e Transferência',
    ],
  },
  {
    key: 'rural',
    label: 'Imóvel Rural',
    icone: '🌾',
    resumo: 'Matrícula, ITR, CCIR, CAR e geo',
    etapas: [
      'Proposta e Sinal',
      'Auditoria (Matrícula, ITR, CCIR, CAR, Geo)',
      'Escritura Pública',
      'Registro e Posse',
    ],
  },
];

export const TIPO_POR_KEY = Object.fromEntries(TIPOS_OPERACAO.map((t) => [t.key, t]));

export function etapasDoTipo(tipoKey) {
  return TIPO_POR_KEY[tipoKey]?.etapas || TIPOS_OPERACAO[0].etapas;
}

export function labelDoTipo(tipoKey) {
  return TIPO_POR_KEY[tipoKey]?.label || 'Processo';
}

const pad4 = (n) => String(n).padStart(4, '0');

/** Código curto: IMB-4829 */
export function gerarCodigo(prefixo = 'IMB') {
  return `${prefixo}-${pad4(Math.floor(1000 + Math.random() * 9000))}`;
}

/** Senha numérica de 4 dígitos */
export function gerarSenha() {
  return pad4(Math.floor(1000 + Math.random() * 9000));
}

export function docIdDe(codigo, senha) {
  return `${String(codigo || '').trim().toUpperCase()}_${String(senha || '').trim()}`;
}

/** Índice da etapa atual = primeira não concluída */
export function etapaAtual(processo) {
  const etapas = processo?.etapas?.length ? processo.etapas : etapasDoTipo(processo?.tipo);
  const feitas = Array.isArray(processo?.concluidas) ? processo.concluidas : [];
  const idx = etapas.findIndex((_, i) => !feitas.includes(i));
  return idx === -1 ? etapas.length : idx;
}

export function progresso(processo) {
  const etapas = processo?.etapas?.length ? processo.etapas : etapasDoTipo(processo?.tipo);
  if (!etapas.length) return 0;
  const feitas = (processo?.concluidas || []).filter((i) => i >= 0 && i < etapas.length).length;
  return Math.round((feitas / etapas.length) * 100);
}

export function linkPublico(codigo, senha) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/acompanhar?c=${encodeURIComponent(codigo)}&s=${encodeURIComponent(senha)}`;
}

/** Mensagem pronta para o WhatsApp do cliente */
export function textoWhatsApp(processo) {
  const url = linkPublico(processo.codigo, processo.senha);
  return (
    `Olá, ${String(processo.cliente || '').split(' ')[0] || ''}! Aqui é da ${processo.tenantNome || 'imobiliária'}.\n` +
    `Acompanhe o andamento do seu processo por aqui:\n` +
    `Código: ${processo.codigo}\nSenha: ${processo.senha}\n${url}\n\n` +
    `Atualizamos cada etapa assim que avança. Qualquer dúvida, é só responder esta mensagem.`
  );
}

/**
 * Sanitiza o nome do cliente deixando estritamente apenas o primeiro nome
 * para proteger a privacidade e respeitar a LGPD no portal público.
 */
export function sanitizarClientePrimeiroNome(nomeCompleto = '') {
  const limpo = String(nomeCompleto || '').trim();
  if (!limpo) return 'Cliente';
  return limpo.split(/\s+/)[0];
}

/**
 * Deriva os dados seguros de rastreio público a partir de uma negociação da Esteira de Cartório & Crédito.
 * Nenhum dado sensível (como comissão, valores brutos de repasse, CPF ou telefone do proprietário) é exposto.
 */
export function derivarDadosRastreioCartorio(negociacao = {}, {
  tenantId = 'demo',
  tenantNome = 'Express Imobi Tech',
  corretorPadrao = '',
  telefoneContato = '',
  agora = Date.now(),
} = {}) {
  const codigo = String(
    negociacao.codigoRastreio ||
    negociacao.codigoImovel ||
    negociacao.codigo ||
    gerarCodigo('IMB')
  ).trim().toUpperCase();

  const senha = String(
    negociacao.senhaRastreio ||
    negociacao.senha ||
    (codigo.replace(/\D/g, '').slice(-4) || gerarSenha())
  ).trim();

  const certidoes = negociacao.certidoes || {};
  const escritura = negociacao.escritura || {};

  // Etapa 1: Documentação & CNDs
  const certList = Object.values(certidoes);
  const totalCert = certList.length || 7;
  const emitidasCert = certList.filter((c) => c?.status === 'emitida' || c?.status === 'concluido').length;
  const etapa0Concluida = emitidasCert >= totalCert && totalCert > 0;

  // Etapa 2: Impostos, Escritura & Protocolo RGI
  const itbiOk = escritura.itbi_pago?.status === 'emitida';
  const escrituraOk = escritura.escritura?.status === 'emitida';
  const protocoloOk = escritura.registro_protocolo?.status === 'emitida' || Boolean(escritura.registro_protocolo?.protocolo);
  const etapa1Concluida = protocoloOk && (itbiOk || escrituraOk);

  // Etapa 3: Conclusão do Registro, Repasses & Chaves
  const registroFinalOk = escritura.registro_concluido?.status === 'emitida';
  const liberadoRepasse = Boolean(negociacao.liberacaoManual?.liberado || negociacao.liberadoRepasse);
  const etapa2Concluida = registroFinalOk || (etapa1Concluida && liberadoRepasse);

  const concluidas = [];
  if (etapa0Concluida) concluidas.push(0);
  if (etapa1Concluida) concluidas.push(1);
  if (etapa2Concluida) concluidas.push(2);

  const statusGeral = concluidas.includes(2) ? 'concluido' : 'em_andamento';
  const clientePrimeiroNome = sanitizarClientePrimeiroNome(negociacao.comprador || negociacao.cliente);

  const detalhesEtapas = [
    {
      titulo: ETAPAS_CARTORIO_CREDITO[0],
      descricao: 'Matrícula atualizada, certidões negativas dos vendedores (CNDs), ônus reais e quitação de tributos.',
      concluida: etapa0Concluida,
      resumo: `${emitidasCert} de ${totalCert} certidões conferidas`,
    },
    {
      titulo: ETAPAS_CARTORIO_CREDITO[1],
      descricao: negociacao.origemCredito
        ? 'Guia de ITBI liquidada, contrato de financiamento com força de escritura e protocolo de prenotação no RGI.'
        : 'Guia de ITBI liquidada, lavratura de escritura pública no cartório de notas e protocolo de prenotação no RGI.',
      concluida: etapa1Concluida,
      protocoloRgi: escritura.registro_protocolo?.protocolo || '',
    },
    {
      titulo: ETAPAS_CARTORIO_CREDITO[2],
      descricao: 'Registro e averbação imobiliária concluídos, liquidação de repasses e entrega das chaves.',
      concluida: etapa2Concluida,
    },
  ];

  return {
    id: docIdDe(codigo, senha),
    codigo,
    senha,
    tenantId: String(tenantId || 'demo'),
    tenantNome: String(tenantNome || 'Express Imobi Tech'),
    cliente: clientePrimeiroNome,
    imovel: String(negociacao.imovelTitulo || negociacao.imovel || 'Imóvel da negociação'),
    tipo: 'cartorio_credito',
    etapaLabel: 'Cartório & Escritura / Crédito',
    etapas: ETAPAS_CARTORIO_CREDITO,
    detalhesEtapas,
    concluidas,
    status: statusGeral,
    origemCredito: Boolean(negociacao.origemCredito),
    banco: String(negociacao.banco || ''),
    corretor: sanitizarClientePrimeiroNome(negociacao.corretor || corretorPadrao),
    telefoneContato: String(telefoneContato || negociacao.telefoneContato || '').replace(/\D/g, ''),
    atualizadoEm: new Date(Number(agora)).toISOString(),
  };
}

/**
 * Sincroniza os dados públicos com o Firestore e grava no localStorage como fallback local e offline.
 */
export async function sincronizarAcompanhamentoCartorio(db, {
  negociacao = {},
  tenantId = 'demo',
  tenantNome = 'Express Imobi Tech',
  corretorPadrao = '',
  telefoneContato = '',
  agora = Date.now(),
} = {}) {
  const payload = derivarDadosRastreioCartorio(negociacao, {
    tenantId,
    tenantNome,
    corretorPadrao,
    telefoneContato,
    agora,
  });

  const docId = payload.id;

  // 1. Armazenamento local para resiliência offline / modo demonstração
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`public_acompanhamento_${docId}`, JSON.stringify(payload));
    }
  } catch (err) {
    // Ignora se o localStorage estiver bloqueado no sandbox
  }

  // 2. Gravação no espelho público do Firestore
  if (db && typeof db === 'object') {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'acompanhamentos_publicos', docId), payload, { merge: true });
    } catch (err) {
      console.warn('[sincronizarAcompanhamentoCartorio] gravação no Firestore falhou:', err?.message);
    }
  }

  return {
    ok: true,
    id: docId,
    codigo: payload.codigo,
    senha: payload.senha,
    payload,
    link: linkPublico(payload.codigo, payload.senha),
  };
}

/**
 * Gera mensagem estruturada para envio via WhatsApp do link de rastreio
 */
export function textoWhatsAppRastreioCartorio(negociacao = {}, {
  nomeImobiliaria = 'Express Imobi Tech',
  link = '',
} = {}) {
  const payload = derivarDadosRastreioCartorio(negociacao, { tenantNome: nomeImobiliaria });
  const url = link || linkPublico(payload.codigo, payload.senha);

  return (
    `Olá, ${payload.cliente}! Aqui é da ${payload.tenantNome}.\n\n` +
    `Você pode acompanhar em tempo real todas as etapas do cartório e documentação do imóvel (${payload.imovel}) pelo nosso portal seguro:\n\n` +
    `🔗 Link direto: ${url}\n` +
    `🔑 Código: ${payload.codigo}\n` +
    `🔒 Senha PIN: ${payload.senha}\n\n` +
    `Cada avanço (certidões, ITBI, escritura e registro) é atualizado em tempo real. Qualquer dúvida, é só nos chamar por aqui!`
  );
}
