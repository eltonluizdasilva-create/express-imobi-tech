/**
 * Express Imobi Tech — Vistoria de Entrega de Chaves & Laudo Digital
 * Módulo determinístico (100% no cliente, zero chamadas de IA automáticas).
 *
 * Suporta:
 * - Entrega de Chaves (Venda)
 * - Vistoria de Entrada (Locação)
 * - Vistoria de Saída (Locação)
 * - Leitura e corte de contas de medidores (energia, água, gás)
 * - Checklist padronizado de 7 ambientes
 * - Resumo executivo e formatação de texto para WhatsApp
 */

export const MODALIDADES_VISTORIA = {
  ENTREGA_CHAVES_VENDA: 'Entrega de Chaves — Venda',
  ENTRADA_LOCACAO: 'Vistoria de Entrada — Locação',
  SAIDA_LOCACAO: 'Vistoria de Saída — Locação',
};

export const STATUS_CHECKLIST = {
  APROVADO: 'Aprovado',
  COM_RESSALVA: 'Com Ressalva',
  REPARO_PENDENTE: 'Reparo Pendente',
};

export const AMBIENTES_PADRAO = [
  'Sala & Estar',
  'Cozinha & Área de Serviço',
  'Quartos & Suítes',
  'Banheiros',
  'Parte Elétrica & Quadro',
  'Hidráulica & Registros',
  'Esquadrias, Portas & Fechaduras',
];

/**
 * Cria a lista inicial de ambientes com status padrão Aprovado.
 */
export function gerarChecklistInicial() {
  return AMBIENTES_PADRAO.map((ambiente, idx) => ({
    id: `amb_${idx + 1}`,
    ambiente,
    status: STATUS_CHECKLIST.APROVADO,
    observacao: '',
    fotoUrl: '',
  }));
}

/**
 * Calcula totais, distribuição de status e percentual de conformidade.
 */
export function calcularResumoChecklist(checklist = []) {
  const lista = Array.isArray(checklist) ? checklist : [];
  const total = lista.length;

  let aprovados = 0;
  let ressalvas = 0;
  let pendentes = 0;

  for (const item of lista) {
    if (item.status === STATUS_CHECKLIST.APROVADO) {
      aprovados++;
    } else if (item.status === STATUS_CHECKLIST.COM_RESSALVA) {
      ressalvas++;
    } else if (item.status === STATUS_CHECKLIST.REPARO_PENDENTE) {
      pendentes++;
    }
  }

  const percentualAprovado = total > 0 ? Math.round((aprovados / total) * 100) : 0;
  const itensComRessalva = lista.filter((i) => i.status !== STATUS_CHECKLIST.APROVADO);

  return {
    total,
    aprovados,
    ressalvas,
    pendentes,
    percentualAprovado,
    itensComRessalva,
    is100PorcentoAprovado: total > 0 && aprovados === total,
  };
}

/**
 * Formata mensagem estruturada para envio de relatório no WhatsApp.
 */
export function gerarTextoWhatsAppVistoria(vistoria = {}) {
  const modalidade = vistoria.modalidade || MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA;
  const imovelTitulo = vistoria.imovelTitulo || 'Imóvel sem título';
  const codigoImovel = vistoria.codigoImovel ? ` (${vistoria.codigoImovel})` : '';
  const cliente = vistoria.nomeCliente || 'Cliente';
  const dataVistoria = vistoria.dataVistoria || new Date().toLocaleDateString('pt-BR');
  const corretor = vistoria.corretor || 'Equipe Imobiliária';

  const chaves = Number(vistoria.qtdChaves ?? 1);
  const controles = Number(vistoria.qtdControles ?? 0);
  const tags = Number(vistoria.qtdTags ?? 0);

  const medidores = vistoria.medidores || {};
  const checklist = vistoria.checklist || [];
  const resumo = calcularResumoChecklist(checklist);

  const linhas = [
    `*LAUDO DE VISTORIA & ENTREGA — EXPRESS IMOBI TECH*`,
    `*Modalidade:* ${modalidade}`,
    ``,
    `*Imóvel:* ${imovelTitulo}${codigoImovel}`,
    vistoria.endereco ? `*Endereço:* ${vistoria.endereco}` : null,
    `*Destinatário / Titular:* ${cliente}`,
    `*Vistoriador / Corretor:* ${corretor}`,
    `*Data da Vistoria:* ${dataVistoria}`,
    ``,
    `*CHAVES E ACESSOS ENTREGUES:*`,
    `• Chaves físicas: ${chaves} unidade(s)`,
    controles > 0 ? `• Controles de portão/garagem: ${controles} unidade(s)` : null,
    tags > 0 ? `• Tags de proximidade / Senhas: ${tags} unidade(s)` : null,
    vistoria.obsChaves ? `• Obs. Acessos: ${vistoria.obsChaves}` : null,
    ``,
    `*LEITURA DE MEDIDORES (CORTE DE CONTAS):*`,
    `• Energia Elétrica: Medidor nº ${medidores.energiaNumero || 'S/N'} | Leitura: ${medidores.energiaLeitura || '0'} kWh`,
    `• Água / Saneamento: Hidrômetro nº ${medidores.aguaNumero || 'S/N'} | Leitura: ${medidores.aguaLeitura || '0'} m³`,
    `• Gás Canalizado: Relógio nº ${medidores.gasNumero || 'S/N'} | Leitura: ${medidores.gasLeitura || 'N/A'} m³`,
    ``,
    `*STATUS GERAL DOS AMBIENTES:*`,
    `• Conformidade: ${resumo.percentualAprovado}% aprovado (${resumo.aprovados}/${resumo.total} ambientes)`,
    resumo.ressalvas > 0 ? `• Com ressalva leve: ${resumo.ressalvas}` : null,
    resumo.pendentes > 0 ? `• Reparo pendente: ${resumo.pendentes}` : null,
  ].filter(Boolean);

  if (resumo.itensComRessalva.length > 0) {
    linhas.push(``, `*RESSALVAS E APONTAMENTOS REGISTRADOS:*`);
    resumo.itensComRessalva.forEach((item) => {
      const tag = item.status === STATUS_CHECKLIST.REPARO_PENDENTE ? '[REPARO PENDENTE]' : '[COM RESSALVA]';
      linhas.push(`- ${item.ambiente} ${tag}: ${item.observacao || 'Sem observação detalhada'}`);
    });
  } else {
    linhas.push(``, `*Todos os 7 ambientes vistoriados encontram-se em perfeito estado de conservação.*`);
  }

  linhas.push(
    ``,
    `Termo registrado e assinado pelas partes. Favor guardar este comprovante para faturamento e titularidade de concessionárias.`
  );

  return linhas.join('\n');
}

/**
 * Validação simplificada para salvamento da vistoria.
 */
export function validarVistoria(vistoria = {}) {
  const erros = [];
  if (!vistoria.imovelTitulo || !String(vistoria.imovelTitulo).trim()) {
    erros.push('Título ou identificação do imóvel é obrigatório.');
  }
  if (!vistoria.nomeCliente || !String(vistoria.nomeCliente).trim()) {
    erros.push('Nome do cliente (comprador/inquilino) é obrigatório.');
  }
  return {
    valido: erros.length === 0,
    erros,
  };
}

/* ==========================================================================
 * ESPELHO PÚBLICO DO LAUDO (Portal do Cliente)
 * O laudo vive em `oficinas/{oid}/vistorias_chaves`, coleção privada do
 * tenant (firestore.rules: subcolecaoOperacional). Para o cliente consultar o
 * resultado sem login, o corretor publica um espelho higienizado em
 * `acompanhamentos_publicos/{CODIGO_PIN}` — mesma coleção com `get: if true`
 * usada pelo rastreio de cartório (D-23.35/D-23.37).
 * ========================================================================== */

/** PIN de 4 dígitos: últimos 4 dígitos do telefone do cliente ou sorteio. */
export function gerarPinLaudo(telefone = '') {
  const digitos = String(telefone || '').replace(/\D/g, '');
  const pin = digitos.slice(-4);
  if (pin.length === 4) return pin;
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** docId do espelho público: CÓDIGO_PIN (mesmo contrato de acompanhamento). */
export function docIdLaudoPublico(codigo = '', pin = '') {
  return `${String(codigo || '').trim().toUpperCase()}_${String(pin || '').trim()}`;
}

const primeiroNome = (nome = '') => {
  const limpo = String(nome || '').trim();
  return limpo ? limpo.split(/\s+/)[0] : '';
};

/**
 * Payload público do laudo: sem telefone, sem CPF e sem sobrenome do cliente.
 * Contém o mínimo para o cliente confirmar chaves, medidores e ressalvas.
 */
export function derivarLaudoPublicoVistoria(vistoria = {}, {
  tenantId = '',
  tenantNome = '',
  pin = '',
  agora = Date.now(),
} = {}) {
  const checklist = Array.isArray(vistoria.checklist) ? vistoria.checklist : [];
  const resumo = calcularResumoChecklist(checklist);
  const codigo = String(vistoria.codigoImovel || vistoria.id || '').trim().toUpperCase() || 'LAUDO';
  const senha = String(pin || '').trim() || gerarPinLaudo(vistoria.telefone);

  return {
    // Chaves exigidas por firestore.rules em acompanhamentos_publicos
    codigo,
    senha,
    tenantId: String(tenantId || ''),
    // Identificação do tipo de documento público
    tipo: 'vistoria_chaves',
    modalidade: vistoria.modalidade || MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA,
    imovelTitulo: String(vistoria.imovelTitulo || 'Imóvel'),
    codigoImovel: codigo,
    tenantNome: String(tenantNome || ''),
    cliente: primeiroNome(vistoria.nomeCliente),
    corretor: String(vistoria.corretor || ''),
    dataVistoria: String(vistoria.dataVistoria || ''),
    qtdChaves: Number(vistoria.qtdChaves ?? 0),
    qtdControles: Number(vistoria.qtdControles ?? 0),
    qtdTags: Number(vistoria.qtdTags ?? 0),
    medidores: {
      energiaNumero: vistoria.medidores?.energiaNumero || '',
      energiaLeitura: vistoria.medidores?.energiaLeitura || '',
      aguaNumero: vistoria.medidores?.aguaNumero || '',
      aguaLeitura: vistoria.medidores?.aguaLeitura || '',
      gasNumero: vistoria.medidores?.gasNumero || '',
      gasLeitura: vistoria.medidores?.gasLeitura || '',
    },
    checklist: checklist.map((item) => ({
      ambiente: item.ambiente || '',
      status: item.status || STATUS_CHECKLIST.APROVADO,
      observacao: item.observacao || '',
    })),
    resumo: {
      total: resumo.total,
      aprovados: resumo.aprovados,
      ressalvas: resumo.ressalvas,
      pendentes: resumo.pendentes,
      percentualAprovado: resumo.percentualAprovado,
    },
    status: resumo.is100PorcentoAprovado ? 'concluido' : 'concluido_com_ressalvas',
    atualizadoEm: new Date(Number(agora)).toISOString(),
  };
}

/**
 * Publica (ou atualiza) o espelho público do laudo.
 * Devolve `{ ok, id, codigo, senha, link, payload }` — `ok: false` quando não
 * há Firestore ou o tenant não está identificado (nenhuma escrita anónima).
 */
export async function publicarLaudoVistoria(db, {
  vistoria = {},
  tenantId = '',
  tenantNome = '',
  pin = '',
} = {}) {
  const payload = derivarLaudoPublicoVistoria(vistoria, { tenantId, tenantNome, pin });
  const id = docIdLaudoPublico(payload.codigo, payload.senha);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`public_acompanhamento_${id}`, JSON.stringify(payload));
    }
  } catch {
    // navegador com storage bloqueado: segue para o Firestore
  }

  if (!db || typeof db !== 'object' || !payload.tenantId) {
    return { ok: false, motivo: 'sem-tenant', id, codigo: payload.codigo, senha: payload.senha, payload };
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'acompanhamentos_publicos', id), payload, { merge: true });
  } catch (err) {
    console.warn('[publicarLaudoVistoria] gravação no Firestore falhou:', err?.message);
    return { ok: false, motivo: 'firestore', id, codigo: payload.codigo, senha: payload.senha, payload };
  }

  return {
    ok: true,
    id,
    codigo: payload.codigo,
    senha: payload.senha,
    link: typeof window !== 'undefined'
      ? `${window.location.origin}/portal?c=${encodeURIComponent(payload.codigo)}&s=${encodeURIComponent(payload.senha)}`
      : `/portal?c=${payload.codigo}&s=${payload.senha}`,
    payload,
  };
}
