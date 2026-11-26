/**
 * iaPdf.js — extração de fichas/listas em PDF via IA (D-23.16)
 * ============================================================================
 * O PDF vai como anexo para o proxy `/api/ai` (provedor Gemini, que aceita
 * `application/pdf` inline) e volta um JSON com leads e imóveis.
 *
 * Regras do prompt:
 *   • responder SÓ JSON (sem markdown, sem comentário);
 *   • nunca inventar: campo ausente vai vazio/null;
 *   • telefone e data exatamente como estão no documento;
 *   • o corretor confere tudo na Etapa 2 antes de gravar.
 *
 * `interpretarPacoteIA` é puro e testado em Node.
 * ============================================================================
 */

/** api/ai.js aceita até 3 MB de base64 por arquivo. */
export const LIMITE_BASE64_PDF = 3 * 1024 * 1024;

export const SISTEMA_EXTRACAO_PDF =
  'Você é um extrator de dados de documentos imobiliários brasileiros (fichas de captação, relatórios de CRM e listas de contatos). ' +
  'Responda exclusivamente com JSON válido, sem markdown, sem comentários e sem texto antes ou depois. ' +
  'Nunca invente dado: se o documento não traz o campo, use string vazia.';

const MODELO_JSON = `{
  "leads": [
    {
      "nome": "",
      "telefone": "",
      "email": "",
      "bairro": "",
      "cidade": "",
      "interesse": "",
      "orcamento": "",
      "status": "",
      "dataContato": "dd/mm/aaaa",
      "observacoes": ""
    }
  ],
  "imoveis": [
    {
      "codigo": "",
      "titulo": "",
      "tipo": "",
      "finalidade": "Venda | Locação | Arrendamento Rural",
      "bairro": "",
      "cidade": "",
      "uf": "",
      "valor": "",
      "quartos": 0,
      "banheiros": 0,
      "vagas": 0,
      "area": 0,
      "descricao": ""
    }
  ]
}`;

/** Prompt de extração — o mesmo para ficha de captação, relatório e lista. */
export function montarPromptExtracaoPdf(nomeArquivo = '') {
  return [
    `Leia o documento${nomeArquivo ? ` "${nomeArquivo}"` : ''} e extraia TODOS os contatos (leads) e TODOS os imóveis que aparecerem.`,
    '',
    'Regras:',
    '1. Responda SOMENTE o JSON abaixo, sem markdown.',
    '2. Não invente: campo que não está no documento fica "" (string vazia) ou 0.',
    '3. Telefone: mantenha DDD e nono dígito, só com números e os separadores originais.',
    '4. Data de contato: converta para dd/mm/aaaa. Se houver hora, use dd/mm/aaaa hh:mm.',
    '5. Status: copie o estágio escrito no documento (ex.: "Proposta", "Visita", "Negociação"). Não deduza.',
    '6. Imóveis: tipo = Apartamento, Casa, Terreno, Comercial ou Rural. Finalidade = Venda, Locação ou Arrendamento Rural.',
    '7. Se o documento não tiver uma das listas, devolva a lista vazia (nunca null).',
    '',
    MODELO_JSON,
  ].join('\n');
}

/** Texto da IA → pacote `{ leads, imoveis }` (ou null quando não é JSON). */
export function interpretarPacoteIA(texto) {
  let bruto = String(texto ?? '').trim();
  if (!bruto) return null;

  bruto = bruto
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  const inicio = bruto.indexOf('{');
  const inicioLista = bruto.indexOf('[');
  if (inicio < 0 && inicioLista < 0) return null;

  const usarLista = inicio < 0 || (inicioLista >= 0 && inicioLista < inicio);
  const abre = usarLista ? '[' : '{';
  const fecha = usarLista ? ']' : '}';
  const primeiro = bruto.indexOf(abre);
  const ultimo = bruto.lastIndexOf(fecha);
  if (primeiro < 0 || ultimo <= primeiro) return null;

  let dados;
  try {
    dados = JSON.parse(bruto.slice(primeiro, ultimo + 1));
  } catch {
    return null;
  }

  if (Array.isArray(dados)) return { leads: dados, imoveis: [] };
  if (!dados || typeof dados !== 'object') return null;

  const leads = [dados.leads, dados.clientes, dados.contatos].find(Array.isArray) || [];
  const imoveis = [dados.imoveis, dados.properties, dados.captacoes].find(Array.isArray) || [];

  if (!leads.length && !imoveis.length) return null;
  return { leads, imoveis };
}

/** File → base64 puro (sem `data:`), para o campo `arquivos` do /api/ai. */
export function lerArquivoBase64(arquivo) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(new Error('Leitura de arquivo disponível apenas no navegador.'));
      return;
    }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Falha ao ler o arquivo enviado.'));
    leitor.onload = () => {
      const resultado = String(leitor.result || '');
      resolve(resultado.includes(',') ? resultado.split(',').pop() : resultado);
    };
    leitor.readAsDataURL(arquivo);
  });
}
