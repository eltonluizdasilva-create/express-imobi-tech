/**
 * mapsScraperService.ts — camada unica de acesso a varredura de regiao.
 * ============================================================================
 * REGRA DE OURO: o navegador NAO fala com o Google e NAO conhece chave nenhuma.
 * Este modulo so empacota o pedido e conversa com um endpoint no servidor:
 *
 *   1. `VITE_MAPS_WEBHOOK_URL` (n8n, Cloud Function, outro backend) se existir;
 *   2. caso contrario, `/api/places` (serverless do proprio projeto).
 *
 * Qualquer chave de Google Maps fica em `process.env.GOOGLE_MAPS_API_KEY` do
 * lado do servidor. Aqui nunca entra `import.meta.env.VITE_GOOGLE*`.
 *
 * Tratamento de falha: todo erro vira `CapturaError` com `codigo` estavel
 * (entrada, nao_autorizado, cota, sem_resultado, sem_config, tempo, provedor,
 * rede, servidor) para a interface decidir a mensagem sem quebrar o app.
 * ============================================================================
 */

export type ObjetivoCaptura = 'comercial' | 'entorno';

export type CodigoErroCaptura =
  | 'entrada'
  | 'nao_autorizado'
  | 'cota'
  | 'sem_resultado'
  | 'sem_config'
  | 'tempo'
  | 'provedor'
  | 'rede'
  | 'servidor';

export interface CapturaParams {
  endereco: string;
  raio: number;
  objetivo: ObjetivoCaptura;
  tipos?: string[];
}

export interface LugarCapturado {
  placeId: string;
  nome: string;
  categoria: string;
  endereco: string;
  avaliacao: number | null;
  totalAvaliacoes: number;
  status: string;
  telefone: string;
  site: string;
  lat: number | null;
  lng: number | null;
}

export interface CentroCaptura {
  enderecoFormatado: string;
  lat: number;
  lng: number;
}

export interface BuscaPorTipo {
  tipo: string;
  quantidade: number;
  erro?: string;
}

export interface CapturaResposta {
  ok: true;
  /** 'google' quando há chave configurada; 'openstreetmap' no modo aberto. */
  provedor?: string;
  centro: CentroCaptura;
  raio: number;
  objetivo: ObjetivoCaptura;
  tipos: string[];
  total: number;
  encontrados: number;
  truncado: boolean;
  buscas: BuscaPorTipo[];
  itens: LugarCapturado[];
  avisos: string[];
}

export class CapturaError extends Error {
  codigo: CodigoErroCaptura;
  status: number;
  detalhe?: string;
  hint?: string;

  constructor(codigo: CodigoErroCaptura, mensagem: string, extras: { status?: number; detalhe?: string; hint?: string } = {}) {
    super(mensagem);
    this.name = 'CapturaError';
    this.codigo = codigo;
    this.status = extras.status ?? 0;
    this.detalhe = extras.detalhe;
    this.hint = extras.hint;
  }
}

export interface OpcoesCaptura {
  /** Devolve o ID token do Firebase (Authorization: Bearer). */
  getToken?: () => Promise<string | null>;
  /** Cancela a varredura (ex.: modal fechado). */
  signal?: AbortSignal;
  /** Tempo maximo em ms. O endpoint responde em ate 30 s. */
  timeoutMs?: number;
}

export const RAIO_MIN = 100;
export const RAIO_MAX = 30000;
export const POR_PAGINA = 8;

/* ------------------------------- endpoint -------------------------------- */

export function resolverEndpoint(): string {
  const doEnv = String(envDoVite().VITE_MAPS_WEBHOOK_URL || '');
  const limpo = doEnv.trim();
  if (limpo) return limpo;
  return '/api/places';
}

/** Acesso a `import.meta.env` sem depender de tipos do Vite no projeto. */
function envDoVite(): Record<string, string | undefined> {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  return meta.env || {};
}

export function usandoWebhookExterno(): boolean {
  return resolverEndpoint() !== '/api/places';
}

/* ------------------------------- validação ------------------------------- */

export function validarParams(params: CapturaParams): string | null {
  const endereco = String(params?.endereco || '').trim();
  if (endereco.length < 3) return 'Informe um endereco, bairro ou cidade.';
  const raio = Number(params?.raio);
  if (!Number.isFinite(raio) || raio < RAIO_MIN || raio > RAIO_MAX) {
    return `Raio deve estar entre ${RAIO_MIN} m e ${RAIO_MAX / 1000} km.`;
  }
  if (params?.objetivo !== 'comercial' && params?.objetivo !== 'entorno') return 'Escolha um objetivo.';
  return null;
}

/* -------------------------------- captura -------------------------------- */

export async function capturarLeads(
  params: CapturaParams,
  opcoes: OpcoesCaptura = {}
): Promise<CapturaResposta> {
  const problema = validarParams(params);
  if (problema) throw new CapturaError('entrada', problema);

  const endpoint = resolverEndpoint();
  const timeoutMs = opcoes.timeoutMs ?? 28000;

  const controle = new AbortController();
  const cancelarExterno = () => controle.abort();
  if (opcoes.signal) {
    if (opcoes.signal.aborted) cancelarExterno();
    else opcoes.signal.addEventListener('abort', cancelarExterno, { once: true });
  }
  const relogio = setTimeout(() => controle.abort(), timeoutMs);

  try {
    let token: string | null = null;
    if (opcoes.getToken) {
      try {
        token = await opcoes.getToken();
      } catch {
        token = null;
      }
    }

    const cabecalhos: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) cabecalhos.Authorization = `Bearer ${token}`;

    const resposta = await fetch(endpoint, {
      method: 'POST',
      headers: cabecalhos,
      body: JSON.stringify({
        endereco: String(params.endereco).trim(),
        raio: Math.round(Number(params.raio)),
        objetivo: params.objetivo,
        tipos: params.tipos,
      }),
      signal: controle.signal,
    });

    const texto = await resposta.text();
    let dados: any = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = null;
    }

    if (!resposta.ok || !dados || dados.ok === false) {
      throw traduzirErroHttp(resposta.status, dados);
    }

    const itens: LugarCapturado[] = Array.isArray(dados.itens) ? dados.itens : [];
    if (!itens.length) {
      throw new CapturaError('sem_resultado', 'Nenhum estabelecimento encontrado nesse raio.', {
        status: resposta.status,
        hint: 'Aumente o raio ou troque o objetivo da busca.',
      });
    }

    return {
      ok: true,
      provedor: dados.provedor,
      centro: dados.centro,
      raio: dados.raio,
      objetivo: dados.objetivo,
      tipos: dados.tipos || [],
      total: dados.total ?? itens.length,
      encontrados: dados.encontrados ?? itens.length,
      truncado: Boolean(dados.truncado),
      buscas: Array.isArray(dados.buscas) ? dados.buscas : [],
      itens,
      avisos: Array.isArray(dados.avisos) ? dados.avisos : [],
    };
  } catch (erro) {
    if (erro instanceof CapturaError) throw erro;

    const abortado = (erro as any)?.name === 'AbortError';
    if (abortado) {
      throw new CapturaError('tempo', 'A varredura passou do tempo limite.', {
        hint: 'Tente um raio menor ou repita em alguns instantes.',
      });
    }
    throw new CapturaError('rede', 'Nao foi possivel falar com o servidor de varredura.', {
      detalhe: String((erro as any)?.message || erro),
      hint: 'Verifique a conexao. Nenhum dado da sua operacao foi alterado.',
    });
  } finally {
    clearTimeout(relogio);
    if (opcoes.signal) opcoes.signal.removeEventListener('abort', cancelarExterno);
  }
}

function traduzirErroHttp(status: number, dados: any): CapturaError {
  const codigo = String(dados?.code || '');
  const detalhe = dados?.detalhe || dados?.error || '';
  const hint = dados?.hint;

  switch (codigo) {
    case 'entrada':
      return new CapturaError('entrada', dados?.error || 'Dados da busca invalidos.', { status, detalhe, hint });
    case 'nao_autorizado':
      return new CapturaError('nao_autorizado', 'Sua sessao expirou. Entre novamente para capturar.', {
        status,
        detalhe,
      });
    case 'cota':
      return new CapturaError('cota', 'Cota da busca por regiao esgotada agora.', {
        status,
        detalhe,
        hint: 'Tente novamente mais tarde. A captura manual por link continua funcionando.',
      });
    case 'endereco_nao_encontrado':
      return new CapturaError('sem_resultado', 'Endereco nao localizado.', {
        status,
        detalhe,
        hint: 'Inclua cidade e estado, ex.: "Av. Afonso Pena, 1000, Uberlândia - MG".',
      });
    case 'sem_config':
      return new CapturaError('sem_config', 'A busca por regiao ainda nao esta configurada no servidor.', {
        status,
        detalhe,
        hint,
      });
    case 'tempo':
      return new CapturaError('tempo', 'A consulta demorou demais.', { status, detalhe, hint });
    default:
      if (status === 401) {
        return new CapturaError('nao_autorizado', 'Sua sessao expirou. Entre novamente.', { status, detalhe });
      }
      if (status === 429) return new CapturaError('cota', 'Cota esgotada no provedor.', { status, detalhe, hint });
      if (status >= 500) {
        return new CapturaError('servidor', 'O servidor de varredura falhou.', { status, detalhe, hint });
      }
      return new CapturaError('provedor', dados?.error || 'A varredura nao pode ser concluida.', {
        status,
        detalhe,
        hint,
      });
  }
}

/* ------------------------------ apresentação ----------------------------- */

export function rotuloAvaliacao(item: LugarCapturado): string {
  if (!item.avaliacao) return 'Sem nota';
  const total = item.totalAvaliacoes ? ` (${item.totalAvaliacoes})` : '';
  return `${item.avaliacao.toFixed(1)} ★${total}`;
}

export function rotuloStatus(item: LugarCapturado): string {
  if (item.status === 'CLOSED_PERMANENTLY') return 'Fechado';
  if (item.status === 'CLOSED_TEMPORARILY') return 'Fechado temporariamente';
  return 'Aberto';
}

export function paginar<T>(itens: T[], pagina: number, porPagina = POR_PAGINA) {
  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return {
    itens: itens.slice(inicio, inicio + porPagina),
    pagina: atual,
    totalPaginas,
    total,
    inicio,
  };
}

export function exportarCsv(itens: LugarCapturado[]): string {
  const colunas = ['Nome', 'Categoria', 'Endereco', 'Avaliacao', 'Avaliacoes', 'Status', 'Telefone', 'Site'];
  const escapar = (valor: unknown) => {
    const texto = String(valor ?? '').replace(/\r?\n/g, ' ').trim();
    return `"${texto.replace(/"/g, '""')}"`;
  };

  const linhas = itens.map((item) =>
    [
      item.nome,
      item.categoria,
      item.endereco,
      item.avaliacao ?? '',
      item.totalAvaliacoes ?? '',
      rotuloStatus(item),
      item.telefone,
      item.site,
    ]
      .map(escapar)
      .join(';')
  );

  return ['\uFEFF' + colunas.join(';'), ...linhas].join('\r\n');
}
