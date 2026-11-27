/**
 * onboarding.js — primeiros passos do corretor (puro, testável)
 * ============================================================================
 * Três passos, cada um com uma condição objetiva de conclusão — nada de "marcar
 * como feito" sem ter feito. O passo 3 depende de uma ação do usuário (gerar
 * arte ou copiar a vitrine), então é o único que usa localStorage.
 * ============================================================================
 */

export const CHAVE_OCULTO = 'imobi:onboarding:oculto';
export const CHAVE_PASSO3 = 'imobi:onboarding:passo3';

export const PASSOS = [
  {
    id: 'marca',
    numero: 1,
    titulo: 'Configure logo, CRECI e WhatsApp',
    descricao: 'É o que aparece na arte, na vitrine e no portal do cliente.',
    acao: 'Configurar',
    aba: 'config',
  },
  {
    id: 'imovel',
    numero: 2,
    titulo: 'Cadastre seu 1º imóvel',
    descricao: 'Sem imóvel não há vitrine, portal nem anúncio.',
    acao: 'Cadastrar',
    aba: 'captacao_imobi',
  },
  {
    id: 'divulgar',
    numero: 3,
    titulo: 'Gere sua 1ª arte ou compartilhe a vitrine',
    descricao: 'Um clique para o corretor ter o que enviar ao cliente.',
    acao: 'Abrir Estúdio',
    aba: 'marketing',
  },
];

/* ------------------------------- storage --------------------------------- */

function storageSeguro(storage) {
  if (storage) return storage;
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* modo privado */ }
  return null;
}

export function lerOculto(storage) {
  const s = storageSeguro(storage);
  if (!s) return false;
  try { return s.getItem(CHAVE_OCULTO) === '1'; } catch { return false; }
}

export function salvarOculto(storage) {
  const s = storageSeguro(storage);
  if (!s) return;
  try { s.setItem(CHAVE_OCULTO, '1'); } catch { /* ignora */ }
}

export function lerPasso3(storage) {
  const s = storageSeguro(storage);
  if (!s) return false;
  try { return s.getItem(CHAVE_PASSO3) === '1'; } catch { return false; }
}

export function marcarPasso3(storage) {
  const s = storageSeguro(storage);
  if (!s) return;
  try { s.setItem(CHAVE_PASSO3, '1'); } catch { /* ignora */ }
}

/* ------------------------------- avaliação ------------------------------- */

/** Passo 1: configuracoes/geral com nome (ou nomeOficina) e WhatsApp. */
export function marcaConfigurada(config) {
  if (!config || typeof config !== 'object') return false;
  const nome = String(config.nome || config.nomeOficina || config.nomeImobiliaria || '').trim();
  const zap = String(config.whatsapp || config.telefone || config.telefoneComercial || '').replace(/\D/g, '');
  return Boolean(nome) && zap.length >= 10;
}

/**
 * Alternativa do passo 1: CRECI informado também prova que a marca foi
 * configurada. O corretor que preenche o CRECI na tela de Configurações via
 * nome + CRECI e o checklist ficava em 0/3 mesmo com o cadastro completo.
 */
export function creciInformado(config) {
  if (!config || typeof config !== 'object') return false;
  const creci = String(config.creci || config.registroCreci || '').replace(/\s+/g, '');
  return creci.length >= 4;
}

export function avaliarPassos({ config, imoveis, passo3Feito = false } = {}) {
  const total = Array.isArray(imoveis) ? imoveis.length : 0;
  const concluidos = {
    marca: marcaConfigurada(config) || creciInformado(config),
    imovel: total >= 1,
    divulgar: Boolean(passo3Feito),
  };
  return PASSOS.map((p) => ({ ...p, concluido: Boolean(concluidos[p.id]) }));
}

export function progresso(passos = []) {
  const total = passos.length || PASSOS.length;
  const concluidos = passos.filter((p) => p.concluido).length;
  return {
    total,
    concluidos,
    pct: total ? Math.round((concluidos / total) * 100) : 0,
    rotulo: `${concluidos} de ${total} concluídos`,
  };
}

/** Mostra enquanto não terminou e não foi dispensado. */
export function deveExibir({ passos, oculto }) {
  const { concluidos, total } = progresso(passos);
  return !oculto && concluidos < total;
}

/** Próximo passo pendente (para destacar no card). */
export function proximoPasso(passos = []) {
  return passos.find((p) => !p.concluido) || null;
}

export function linkVitrine(origem) {
  const base = String(origem || '').replace(/\/$/, '');
  return `${base}/portal`;
}
