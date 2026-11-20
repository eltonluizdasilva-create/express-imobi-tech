/**
 * assistidos-legais.js — contrato de uso das abas assistidas
 * ============================================================================
 * As abas "Minutas & Checklist" (rota `juridico_imobi`) e "Simulador de Custos"
 * (rota `contador`) produzem RASCUNHO OPERACIONAL e ESTIMATIVA REFERENCIAL.
 * Nenhuma das duas emite parecer jurídico ou contábil definitivo.
 *
 * O que este arquivo centraliza (nunca duplicar texto em componente):
 *   • PROMPTS de sistema — a regra que qualquer chamada de IA dessas abas recebe;
 *   • ACEITES — texto do termo que o usuário precisa marcar antes do 1º uso;
 *   • AVISOS — tarja que acompanha todo texto copiado, impresso ou enviado.
 *
 * O aceite é gravado em `oficinas/{id}.aceitesLegais.{chave}` (timestamp do
 * servidor + versão do termo) e é verificado pelo `AceiteLegalGate`.
 * ============================================================================
 */

/** Sobe a versão quando o texto do termo mudar: obriga novo aceite. */
export const VERSAO_ACEITE = '2026-11-20';

/* ───────────────────────── PROMPTS DE SISTEMA ───────────────────────── */

/**
 * System prompt das minutas. Se um dia essa aba chamar IA, este é o prompt
 * que deve ir em `systemPrompt` — sem variação local.
 */
export const PROMPT_MINUTAS = [
  'Você é um assistente OPERACIONAL de minutas imobiliárias do Express Imobi Tech.',
  'REGRAS INVIOLÁVEIS:',
  '1. Produza apenas RASCUNHO de cláusula, notificação ou checklist operacional.',
  '2. NUNCA emita parecer jurídico, opinião sobre o mérito, probabilidade de êxito,',
  '   recomendação de ação judicial ou interpretação definitiva de lei.',
  '3. NUNCA afirme que o documento tem validade jurídica, que está "pronto para assinar"',
  '   ou que substitui advogado.',
  '4. Sempre cite o dispositivo legal em que o rascunho se apoia e sinalize o que',
  '   depende de decisão das partes.',
  '5. Todo texto gerado termina com a tarja:',
  '   "RASCUNHO OPERACIONAL — revisão obrigatória por advogado inscrito na OAB."',
  '6. Se a pergunta pedir julgamento de caso concreto, responda apenas com o checklist',
  '   do que o advogado precisa receber para analisar.',
].join('\n');

/** System prompt do simulador de custos. */
export const PROMPT_CUSTOS = [
  'Você é um simulador OPERACIONAL de custos e tributos imobiliários do Express Imobi Tech.',
  'REGRAS INVIOLÁVEIS:',
  '1. Produza apenas ESTIMATIVA REFERENCIAL com memória de cálculo explícita',
  '   (base, alíquota, fator e resultado).',
  '2. NUNCA emita parecer contábil, defina regime tributário da empresa, confirme',
  '   obrigação acessória ou garanta valor a pagar/receber.',
  '3. NUNCA afirme que o cálculo substitui contador ou que está pronto para guia/DARF.',
  '4. Declare as premissas usadas e o que muda o resultado (regime, município, data).',
  '5. Todo texto gerado termina com a tarja:',
  '   "ESTIMATIVA REFERENCIAL — conferência obrigatória por contador inscrito no CRC."',
].join('\n');

/* ───────────────────────────── AVISOS ───────────────────────────── */

export const AVISO_JURIDICO =
  'RASCUNHO OPERACIONAL — revisão obrigatória por advogado inscrito na OAB. ' +
  'Este conteúdo não é parecer jurídico e não substitui a análise de um advogado.';

export const AVISO_FISCAL =
  'ESTIMATIVA REFERENCIAL — conferência obrigatória por contador inscrito no CRC. ' +
  'Não é parecer contábil e não define regime tributário nem obrigação acessória.';

/* ───────────────────────────── ACEITES ───────────────────────────── */

export const ACEITES = {
  juridico_imobi: {
    chave: 'minutasJuridicas',
    aba: 'juridico_imobi',
    titulo: 'Termo de uso — Minutas & Checklist',
    resumo:
      'Esta aba entrega modelos de cláusula, notificação e checklist para o corretor ' +
      'adiantar o atendimento. Ela não faz análise de caso concreto.',
    itens: [
      'O conteúdo gerado é RASCUNHO OPERACIONAL, sem parecer jurídico.',
      'A revisão por advogado inscrito na OAB é obrigatória antes de qualquer uso com cliente.',
      'Não vou apresentar o texto ao cliente como orientação jurídica definitiva.',
      'A responsabilidade pela minuta final é de quem a assina, com apoio do advogado.',
    ],
    aviso: AVISO_JURIDICO,
  },
  contador: {
    chave: 'simuladorCustos',
    aba: 'contador',
    titulo: 'Termo de uso — Simulador de Custos',
    resumo:
      'Esta aba simula custos, tributos e comissões para apoiar a conversa comercial ' +
      'e organizar o caixa do corretor.',
    itens: [
      'O resultado é ESTIMATIVA REFERENCIAL, com premissas declaradas.',
      'A conferência por contador inscrito no CRC é obrigatória antes de emitir guia ou recibo fiscal.',
      'O regime tributário da minha empresa não é definido por esta aba.',
      'Não vou usar o número simulado como valor fiscal definitivo.',
    ],
    aviso: AVISO_FISCAL,
  },
};

/** Texto completo do termo, para o checkbox e para o registro. */
export function textoAceite(chave) {
  const termo = ACEITES[chave];
  if (!termo) return '';
  return [termo.titulo, termo.resumo, ...termo.itens.map((i) => `• ${i}`), `Versão: ${VERSAO_ACEITE}`].join('\n');
}
