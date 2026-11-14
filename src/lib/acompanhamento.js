/**
 * acompanhamento.js — regras do módulo "Acompanhamento do Cliente".
 *
 * Acompanhamento do cliente: rastreio de processos com código + senha.
 * Coleção privada: oficinas/{tenantId}/acompanhamentos_imobi/{codigo}_{senha}
 * Espelho público: acompanhamentos_publicos/{codigo}_{senha} (leitura anônima)
 */

export const TIPOS_OPERACAO = [
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
