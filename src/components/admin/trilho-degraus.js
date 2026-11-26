/**
 * trilho-degraus.js — regra de dados do trilho de módulos do painel.
 *
 * Fica fora do componente (JSX) para poder ser testada sem React e para não
 * misturar export de constante com export de componente.
 *
 * Termos:
 *  - `degrau`  → identidade visual/comercial do grupo (cor do plano).
 *  - `itens`   → abas do painel que o grupo exibe.
 *  - `herdaDe` → o grupo ACESSA os itens do grupo pai além dos próprios.
 *
 * Herança é direito comercial, não vitrine: quem assina o PLUS continua podendo
 * abrir e usar os módulos PRO e Grátis (`bloqueioProAtivo` fica falso para o
 * plano `plus` em `src/lib/planos.js`). A pílula de filtro, porém, é a vitrine
 * do degrau e mostra SÓ os itens exclusivos dele — daí `itensProprios()`.
 */

export const DEGRAUS = {
  gratis: {
    id: 'gratis',
    nome: 'Grátis',
    cor: '#10b981',
    base: '16,185,129',
    textoClaro: '#047857',
    textoEscuro: '#6ee7b7',
  },
  pro: {
    id: 'pro',
    nome: 'PRO',
    cor: '#0284c7',
    base: '2,132,199',
    textoClaro: '#0369a1',
    textoEscuro: '#7dd3fc',
  },
  plus: {
    id: 'plus',
    nome: 'PLUS',
    cor: '#0d9488',
    base: '13,148,136',
    textoClaro: '#0f766e',
    textoEscuro: '#5eead4',
  },
  operacao: {
    id: 'operacao',
    nome: 'Módulos de IA',
    cor: '#f59e0b',
    base: '245,158,11',
    textoClaro: '#b45309',
    textoEscuro: '#fcd34d',
  },
};

export function idDaAbaDoItem(item) {
  return item?.tabId || item?.id;
}

/**
 * Monta os degraus a partir da configuração vinda do painel.
 * Herança: `herdaDe` recebe os itens do grupo pai DEPOIS dos próprios, marcados
 * com `herdado: true`. Item próprio vence o herdado de mesmo id.
 */
export function montarDegraus(grupos = []) {
  const gruposPorId = new Map(grupos.map((grupo) => [grupo.id, grupo]));
  return grupos.map((grupo) => {
    const origem = grupo.herdaDe ? gruposPorId.get(grupo.herdaDe) : null;
    if (grupo.herdaDe && !origem) {
      throw new Error(`TrilhoModulos: grupo ${grupo.id} herda de um grupo inexistente.`);
    }
    const proprios = grupo.itens || [];
    const idsProprios = new Set(proprios.map((item) => item.id));
    const herdados = (origem?.itens || [])
      .filter((item) => !idsProprios.has(item.id))
      .map((item) => ({ ...item, herdado: true }));
    return {
      ...grupo,
      itens: origem ? [...proprios, ...herdados] : proprios,
      degrau: DEGRAUS[grupo.degrau] || DEGRAUS.gratis,
    };
  });
}

/**
 * Itens exclusivos do degrau — a vitrine da pílula de filtro e da grade "Ver
 * tudo". Os herdados continuam em `grupo.itens` (marcados com `herdado: true`)
 * só para documentar o que o plano inclui; nunca entram na contagem visual.
 */
export function itensProprios(grupo = {}) {
  return (grupo?.itens || []).filter((item) => !item.herdado);
}

/**
 * Itens da visão atual. Em "todos", mostra os itens próprios de cada grupo (sem
 * repetir abas). Com filtro ativo, mostra APENAS os itens exclusivos daquele
 * degrau: o filtro PLUS lista os seis módulos PLUS e não mistura os sete do
 * PRO, que continuam acessíveis pelo filtro PRO, por "Ver tudo" e pela herança
 * comercial do plano. Nunca repete id.
 */
export function selecionarItens(degraus = [], filtro = 'todos') {
  const base = filtro === 'todos'
    ? degraus
    : degraus.filter((grupo) => grupo.id === filtro);
  const idsVisiveis = new Set();
  return base.flatMap((grupo) =>
    itensProprios(grupo)
      .filter((item) => {
        if (idsVisiveis.has(item.id)) return false;
        idsVisiveis.add(item.id);
        return true;
      })
      .map((item) => ({ ...item, grupoId: grupo.id, degrau: grupo.degrau })),
  );
}
