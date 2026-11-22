/**
 * planos.js — FONTE ÚNICA DE VERDADE (camada de acesso).
 *
 * Os DADOS moram em `shared/planos.json` e são lidos por:
 *   - este arquivo (frontend, via Vite)
 *   - functions/index.js (backend, via cópia gerada em functions/planos.json)
 *
 * Consumidores: Meuplano.jsx, AuthContext.jsx, lib/validacoes-planos.js,
 *               Cloud Function ativarPlano / pagamentoWebhook.
 *
 * REGRA: não duplicar preço, módulo ou limite em componente nenhum.
 */

import dados from '../../shared/planos.json';

export const WHATSAPP_COMERCIAL = dados.whatsappComercial;

/* ------------------------------------------------------------------ */
/* MÓDULOS                                                             */
/* ------------------------------------------------------------------ */

export const MODULOS_GRATIS = Object.freeze([...dados.modulos.gratis]);
export const MODULOS_ESSENCIAL_PLUS = Object.freeze([
  ...dados.modulos.gratis,
  ...(dados.modulos.essencial_plus_extra || []),
]);
export const MODULOS_PROFISSIONAL = Object.freeze([
  ...dados.modulos.gratis,
  ...(dados.modulos.essencial_plus_extra || []),
  ...dados.modulos.profissional_extra,
]);
export const MODULOS_ESQUADRAO = Object.freeze([
  ...dados.modulos.gratis,
  ...(dados.modulos.essencial_plus_extra || []),
  ...dados.modulos.profissional_extra,
  ...dados.modulos.esquadrao_extra,
]);

const MODULOS_POR_PLANO = {
  gratis: MODULOS_GRATIS,
  essencial_plus: MODULOS_ESSENCIAL_PLUS,
  profissional: MODULOS_PROFISSIONAL,
  esquadrao_ia: MODULOS_ESQUADRAO,
};

/* ------------------------------------------------------------------ */
/* CATÁLOGO COMERCIAL                                                  */
/* ------------------------------------------------------------------ */

export const PLANOS = Object.freeze(
  dados.planos.map((plano) =>
    Object.freeze({ ...plano, modulos: MODULOS_POR_PLANO[plano.key] || MODULOS_GRATIS })
  )
);

export const DEFAULT_PLANO_KEY = 'gratis';

/* ------------------------------------------------------------------ */
/* LIMITES (O.S., funcionários, abas)                                  */
/* ------------------------------------------------------------------ */

const limites = {};
for (const [chave, valor] of Object.entries(dados.limites)) {
  limites[chave] = Object.freeze({
    funcionarios: valor.funcionarios === null ? Infinity : valor.funcionarios,
    abas: valor.abas === null ? Infinity : valor.abas,
    os_mes: valor.osMes === null ? Infinity : valor.osMes,
    descricao: valor.descricao,
  });
}
// Alias legado: documentos antigos gravam "GRATUITO" em maiúsculas
limites.GRATUITO = limites.gratis;

export const LIMITES_PLANOS = Object.freeze(limites);

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

export const PLANOS_PRO = new Set(dados.planosPro);

const ALIAS_GRATIS = new Set(['', 'gratis', 'grátis', 'gratuito', 'free', 'trial']);

export function normalizarPlano(plano) {
  return String(plano ?? '').trim().toLowerCase();
}

/** true quando o plano (nome cru do Firestore) representa assinatura paga */
export function isPlanoPro(plano) {
  const chave = normalizarPlano(plano);
  if (ALIAS_GRATIS.has(chave)) return false;
  return PLANOS_PRO.has(chave);
}

/* ------------------------------------------------------------------ */
/* TRIAL DE 10 DIAS (D-22.03)                                          */
/* ------------------------------------------------------------------ */
/* Regra comercial: o teste completo dura 10 dias. Dentro da janela o   */
/* usuário entra nas 8 ferramentas PRO e na aba 7 Agentes de IA. Sem     */
/* plano ativo depois disso, as duas frentes exigem PRO (R$ 99/mês) —    */
/* com cadeado no menu e simulador bloqueado. O CRM gratuito não muda.   */

export const DIAS_TRIAL = 10;

/** Tag comercial da aba que entra na faixa PRO com o teste aberto. */
export const SELO_TRIAL_PRO = '10 DIAS GRÁTIS · PRO';

export const AVISO_TRIAL_ENCERRADO =
  'Seu período de 10 dias grátis encerrou · Assine o PRO (R$ 99/mês) para destravar seus agentes e ferramentas';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Firestore Timestamp, `{seconds}`, Date, ISO ou epoch → Date (ou null). */
export function comoData(valor) {
  if (!valor) return null;
  if (typeof valor?.toDate === 'function') {
    const d = valor.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
  }
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === 'number') {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof valor === 'string') {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof valor === 'object' && typeof valor.seconds === 'number') {
    const d = new Date(valor.seconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Fim do teste: o `trialFim`/`dataFimTrial` gravado no cadastro ou, se ele
 * não existir, `trialInicio + 10 dias`. Sem nenhuma das datas → null (conta
 * antiga, sem janela de teste registrada).
 */
export function fimDoTrial(conta = {}) {
  const dados = conta || {};
  const fim =
    comoData(dados.trialFim) ||
    comoData(dados.dataFimTrial) ||
    comoData(dados.trialFimEm);
  if (fim) return fim;

  const inicio =
    comoData(dados.trialInicio) ||
    comoData(dados.dataInicioTrial) ||
    comoData(dados.trialComeco);
  if (!inicio) return null;
  return new Date(inicio.getTime() + DIAS_TRIAL * MS_POR_DIA);
}

/** `true` enquanto o teste de 10 dias estiver aberto. */
export function trialAtivo(conta = {}, agora = new Date()) {
  const fim = fimDoTrial(conta);
  if (!fim) return false;
  const referencia = agora instanceof Date ? agora : new Date(agora);
  if (Number.isNaN(referencia.getTime())) return false;
  return referencia.getTime() < fim.getTime();
}

/** Dias inteiros que ainda restam do teste (0 quando encerrado/inexistente). */
export function diasRestantesTrial(conta = {}, agora = new Date()) {
  const fim = fimDoTrial(conta);
  if (!fim) return 0;
  const referencia = agora instanceof Date ? agora : new Date(agora);
  const restante = fim.getTime() - referencia.getTime();
  return restante > 0 ? Math.ceil(restante / MS_POR_DIA) : 0;
}

function contaPaga(conta = {}) {
  const dados = conta || {};
  if (dados.papel === 'master') return true;
  if (dados.isPro === true || dados.planoAssinante === true) return true;
  return isPlanoPro(dados.plano);
}

/**
 * Acesso às 8 ferramentas PRO e à aba `agentes_ia`: assinatura ativa OU teste
 * de 10 dias em andamento. Fora disso, exige PRO (D-22.03).
 */
export function temAcessoPro(conta = {}, agora = new Date()) {
  if (contaPaga(conta)) return true;
  return trialAtivo(conta, agora);
}

/** Mesma regra do PRO: os 7 Agentes de IA acompanham as ferramentas PRO. */
export function temAcessoAgentesIA(conta = {}, agora = new Date()) {
  return temAcessoPro(conta, agora);
}

/** Chave canónica do catálogo ('gratis' | 'profissional' | 'esquadrao_ia' | ...) */
export function chaveCanonica(plano) {
  const chave = normalizarPlano(plano);
  if (ALIAS_GRATIS.has(chave)) return DEFAULT_PLANO_KEY;
  if (chave === 'pro') return 'profissional';
  return chave;
}

export function getPlano(plano) {
  const chave = chaveCanonica(plano);
  return PLANOS.find((p) => p.key === chave) || PLANOS[0];
}

/** Limite de O.S. por mês (Infinity quando ilimitado ou plano desconhecido) */
export function getLimiteOS(plano) {
  const chave = normalizarPlano(plano);
  return (
    LIMITES_PLANOS[chave]?.os_mes ??
    LIMITES_PLANOS[chaveCanonica(chave)]?.os_mes ??
    Infinity
  );
}

export function getLimitesPlano(plano) {
  const chave = normalizarPlano(plano);
  return LIMITES_PLANOS[chave] || LIMITES_PLANOS[chaveCanonica(chave)] || LIMITES_PLANOS.gratis;
}

/** Chaves de plano que a Cloud Function pode ativar diretamente */
export const PLANOS_ATIVAVEIS = Object.freeze(
  PLANOS.filter((p) => p.autoAtivavel).map((p) => p.key)
);

/** Preço no ciclo, já formatado em BRL */
export function precoNoCiclo(plano, ciclo = 'mensal') {
  const item = typeof plano === 'string' ? getPlano(plano) : plano;
  if (!item) return null;
  if (!item.preco) return item.precoLabel || null;
  const valor = item.preco[ciclo] ?? item.preco.mensal ?? 0;
  if (valor === 0) return 'R$ 0';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/* OPERAÇÃO IA — Sofia WhatsApp e Express Brain são módulos SEPARADOS   */
/* ------------------------------------------------------------------ */
/* Regra comercial (D-22.01): a imobiliária contrata só a Sofia          */
/* (R$ 450+), só o Express Brain (R$ 497+ / sob implantação) ou os dois. */
/* Nenhum dos dois é brinde do outro. A implantação é assistida à parte.  */

/** Piso mensal da Sofia WhatsApp (D-20.23, degrau 4). */
export const VALOR_MINIMO_SOFIA_WHATSAPP = 450;
/** Piso mensal do Express Brain (vendido sozinho ou com a Sofia). */
export const VALOR_MINIMO_EXPRESS_BRAIN = 497;

/** Chaves de plano que liberam SÓ a Sofia WhatsApp. */
export const PLANOS_SO_SOFIA = new Set([
  'esquadrao_ia', // chave canônica em shared/planos.json ("Automação Sofia WhatsApp")
  'sofia_whatsapp',
  'automacao',
  'automacao_sofia',
  'automacao_whatsapp',
]);

/** Chaves de plano que liberam SÓ o Express Brain. */
export const PLANOS_SO_BRAIN = new Set([
  'express_brain',
  'expressbrain',
  'brain',
  'brain_imobiliaria',
]);

/** Chaves de plano combo: liberam os dois módulos. */
export const PLANOS_COMBO_IA = new Set([
  'operacao_ia',
  'combo_operacao_ia',
  'full_tech',
  'combo',
]);

/** Compatibilidade: o conjunto antigo continua exportado (união dos três). */
export const PLANOS_OPERACAO_IA = new Set([
  ...PLANOS_SO_SOFIA,
  ...PLANOS_SO_BRAIN,
  ...PLANOS_COMBO_IA,
]);

const valorMensalDaConta = (conta = {}) =>
  Number(
    conta.valorPlano ??
      conta.valorMensal ??
      conta.assinaturaValor ??
      conta.valorAssinatura ??
      conta.assinaturas?.atual?.valor ??
      0
  );

/**
 * Quais módulos de OPERAÇÃO IA a conta contratou: Set com 'sofia' e/ou 'brain'.
 * Fontes, nesta ordem: lista explícita (`modulosIA`/`modulosOperacaoIA`), marcas
 * booleanas da oficina (`automacaoAtiva`/`brainAtivo`), chave do plano e, por
 * último, o valor mensal quando o plano é genérico e pago.
 */
export function modulosOperacaoIA(dadosOficina = {}) {
  const conta = dadosOficina || {};
  const contratados = new Set();

  const lista = [conta.modulosIA, conta.modulosOperacaoIA, conta.operacaoIA].find(Array.isArray);
  if (lista) {
    const normalizada = lista.map((item) => normalizarPlano(item));
    if (normalizada.some((item) => item.includes('sofia') || item === 'automacao' || item === 'whatsapp')) {
      contratados.add('sofia');
    }
    if (normalizada.some((item) => item.includes('brain') || item.includes('cerebro'))) {
      contratados.add('brain');
    }
  }
  // `operacaoIA: true` é o formato legado: liberava o pacote inteiro.
  if (conta.operacaoIA === true) {
    contratados.add('sofia');
    contratados.add('brain');
  }

  if (conta.automacaoAtiva === true || conta.sofiaAtiva === true) contratados.add('sofia');
  if (conta.brainAtivo === true || conta.expressBrainAtivo === true) contratados.add('brain');

  const chave = normalizarPlano(conta.plano);
  if (PLANOS_COMBO_IA.has(chave)) {
    contratados.add('sofia');
    contratados.add('brain');
  } else if (PLANOS_SO_SOFIA.has(chave)) {
    contratados.add('sofia');
  } else if (PLANOS_SO_BRAIN.has(chave)) {
    contratados.add('brain');
  }

  // Sem plano reconhecido: o valor da assinatura decide. R$ 497+ compra o
  // Brain; de R$ 450 a R$ 496, só a Sofia. Um valor não paga os dois.
  if (contratados.size === 0) {
    const pago =
      conta.planoAssinante === true || conta.pago === true || isPlanoPro(conta.plano);
    const valor = valorMensalDaConta(conta);
    if (pago && Number.isFinite(valor) && valor >= VALOR_MINIMO_EXPRESS_BRAIN) {
      contratados.add('sofia');
      contratados.add('brain');
    } else if (pago && Number.isFinite(valor) && valor >= VALOR_MINIMO_SOFIA_WHATSAPP) {
      contratados.add('sofia');
    }
  }

  return contratados;
}

/** A conta tem o módulo Sofia WhatsApp (WhatsApp oficial + QR Code)? */
export function temSofiaWhatsApp(dadosOficina = {}) {
  return modulosOperacaoIA(dadosOficina).has('sofia');
}

/** A conta tem o módulo Express Brain (Central de Inteligência)? */
export function temExpressBrain(dadosOficina = {}) {
  return modulosOperacaoIA(dadosOficina).has('brain');
}

/** Alias legado: algum módulo de OPERAÇÃO IA contratado. */
export function temOperacaoIA(dadosOficina = {}) {
  return temSofiaWhatsApp(dadosOficina) || temExpressBrain(dadosOficina);
}
