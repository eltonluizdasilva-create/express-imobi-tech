/**
 * useLaudoImobi — orquestra os 5 agentes de avaliação e a análise de fotos.
 * ============================================================================
 * Regras de ouro:
 *  - O navegador nunca fala direto com DeepSeek/Gemini: tudo passa por /api/ai.
 *  - O Score Imobi composto é calculado AQUI (aritmética determinística), nunca
 *    pela IA — o modelo só devolve as notas por agente.
 *  - Se a IA devolver JSON inválido, há UMA segunda tentativa exigindo JSON puro.
 * ============================================================================
 */
import { useCallback, useState } from 'react';
import { resumirParaIA } from '../services/vizinhancaService.js';

export const PESOS_AGENTES = {
  comparaveis: 0.25,
  investimento: 0.25,
  bairro: 0.20,
  liquidez: 0.15,
  copy: 0.15,
};

export const CDI_PADRAO = 15.0;   // % a.a. — ajuste no painel conforme o Focus
export const FII_TIJOLO_PADRAO = 8.5;

const MODELO_PADRAO = 'gemini';

const PROMPT_FOTOS = `Você é um avaliador de imóveis sênior (ABNT NBR 14.653).
Analise as fotos do imóvel e responda APENAS com JSON válido, sem markdown, sem texto antes ou depois:
{"padraoConstrutivo":"baixo|normal|alto","estadoConservacao":"novo|otimo|bom|regular|reparos|ruina","confianca":0,"justificativa":"até 240 caracteres","observacoes":["..."]}
Critérios: padrão construtivo considera acabamentos, esquadrias, revestimentos e área; estado de conservação segue Ross-Heidecke (novo, ótimo, bom, regular, reparos, ruína). confianca é 0-100. Se as fotos não permitirem conclusão, use confianca baixa e diga o motivo em justificativa.`;

function extrairJson(texto = '') {
  const limpo = String(texto).replace(/```json/gi, '').replace(/```/g, '').trim();
  const inicio = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) return null;
  try {
    return JSON.parse(limpo.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

function brl(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Redimensiona/comprime a foto no navegador antes de enviar (economia de banda e tokens). */
export function comprimirImagem(arquivo, maxLado = 1024, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    if (!arquivo?.type?.startsWith('image/')) {
      reject(new Error('O arquivo precisa ser uma imagem'));
      return;
    }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas indisponível')); return; }
        ctx.drawImage(img, 0, 0, largura, altura);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}

async function chamarIA(corpo, timeoutMs = 60000) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), timeoutMs);
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controle.signal,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) {
      const motivo = dados?.error || `HTTP ${r.status}`;
      throw new Error(motivo);
    }
    return dados;
  } finally {
    clearTimeout(timer);
  }
}

export function montarPromptLaudo({ dados, avaliacao, valorPedido, vizinhanca, fotos, cdi, fii }) {
  const comparaveis = (dados.comparaveis || [])
    .filter((c) => Number(c.valor) > 0 && Number(c.area) > 0)
    .map((c, i) => `  ${i + 1}) ${brl(c.valor)} · ${c.area} m² · ${c.distanciaKm || 0} km · ${c.oferta ? 'anúncio (oferta)' : 'transação'} · ${brl((Number(c.valor) / Number(c.area)) || 0)}/m²`)
    .join('\n') || '  (nenhum comparável informado)';

  const cenarios = (avaliacao?.cenarios || [])
    .map((c) => `  - ${c.label}: ${brl(c.valor)}`).join('\n');

  const pedido = Number(valorPedido) || 0;
  const justo = Number(avaliacao?.valorJusto) || 0;

  return `Você é o comitê de 5 agentes de avaliação imobiliária do Express Imobi Tech.
Responda APENAS com um JSON válido (sem markdown, sem comentários, sem texto fora do JSON).

DADOS DO IMÓVEL
  Cidade/bairro: ${dados.cidade || '—'} / ${dados.bairro || '—'} (${dados.uf || '—'})
  Tipologia: ${dados.tipologia}; padrão informado: ${dados.padrao}; conservação informada: ${dados.estado}; topografia: ${dados.topografia}
  Área total: ${dados.areaTotal || 0} m²; área construída: ${dados.areaConstruida || 0} m²
  Valor pedido pelo proprietário: ${pedido ? brl(pedido) : 'não informado'}
  PTAM do motor (comparativo direto homogenizado): valor justo ${brl(justo)} · unitário ${brl(avaliacao?.precoUnitario)}/${avaliacao?.unidade || 'm²'} · prazo médio ${avaliacao?.prazoMedioDias || '—'} dias
  Cenários do motor:
${cenarios || '  (sem cenários)'}
  Comparáveis:
${comparaveis}

ANÁLISE DAS FOTOS (Gemini multimodal, quando houver)
${fotos ? `  Padrão construtivo identificado: ${fotos.padraoConstrutivo} (confiança ${fotos.confianca}%)\n  Estado de conservação (Ross-Heidecke): ${fotos.estadoConservacao}\n  Justificativa: ${fotos.justificativa}` : '  Sem fotos anexadas — use o padrão e a conservação informados no formulário.'}

RAIO-X DE VIZINHANÇA (dados reais do OpenStreetMap, raio de 1 km)
${vizinhanca}

BENCHMARKS FINANCEIROS DE HOJE
  CDI: ${cdi}% a.a. · FII de tijolo (média): ${fii}% a.a.

TAREFA — produza as 5 análises, cada uma com "nota" de 0 a 100 (nota = qualidade da oportunidade para o comprador/investidor):

AGENTE 1 (comparáveis e PTAM, peso 25%): cruze metragem, padrão das fotos e amostras para definir valorJustoRecomendado, faixaMinima, faixaMaxima e a diferença percentual em relação ao valor pedido.
AGENTE 2 (investimento e renda, peso 25%): estime aluguelMensal, capRateAnual (aluguel*12/valor, líquido de 8% de vacância e administração), roi5Anos (valorização + renda acumulada) e compare com CDI e FII de tijolo.
AGENTE 3 (bairro e infraestrutura, peso 20%): consolide a Nota de Localização e os estabelecimentos reais; aponte forças e carências.
AGENTE 4 (liquidez e tempo de venda, peso 15%): estime diasNoPrecoPedido e diasNoPrecoJusto (números inteiros), explicando o encalhe.
AGENTE 5 (copywriting e captação, peso 15%): escreva um anuncio (texto pronto para portal/WhatsApp, 700-1100 caracteres, sem markdown) e um argumentoProprietario (objetivo, baseado nos números, para convencer a ajustar o preço).

FORMATO OBRIGATÓRIO:
{"agente1":{"nota":0,"valorJustoRecomendado":0,"faixaMinima":0,"faixaMaxima":0,"diferencaPercentualPedido":0,"padraoIdentificado":"","estadoIdentificado":"","analise":""},
"agente2":{"nota":0,"aluguelMensal":0,"capRateAnual":0,"roi5Anos":0,"comparativo":""},
"agente3":{"nota":0,"notaVizinhanca":0,"destaques":[""],"carencias":[""],"analise":""},
"agente4":{"nota":0,"diasNoPrecoPedido":0,"diasNoPrecoJusto":0,"analise":""},
"agente5":{"nota":0,"anuncio":"","argumentoProprietario":"","hashtags":[""]},
"resumoExecutivo":""}
Números em reais sem símbolo (ex.: 450000). Não invente comparáveis que não estejam nos dados.`;
}

export function classificarScore(score) {
  if (score >= 80) return { rotulo: 'Compra Forte', cor: '#10b981', tom: 'Oportunidade acima da média' };
  if (score >= 65) return { rotulo: 'Preço Justo', cor: '#22c55e', tom: 'Dentro do valor de mercado' };
  if (score >= 50) return { rotulo: 'Neutro', cor: '#eab308', tom: 'Depende da negociação' };
  if (score >= 35) return { rotulo: 'Sobrepreço', cor: '#f97316', tom: 'Precisa de desconto para fechar' };
  return { rotulo: 'Evitar', cor: '#ef4444', tom: 'Risco alto de encalhe' };
}

export function calcularScoreComposto(laudo) {
  if (!laudo) return 0;
  const notas = {
    comparaveis: Number(laudo?.agente1?.nota) || 0,
    investimento: Number(laudo?.agente2?.nota) || 0,
    bairro: Number(laudo?.agente3?.nota) || 0,
    liquidez: Number(laudo?.agente4?.nota) || 0,
    copy: Number(laudo?.agente5?.nota) || 0,
  };
  const soma = Object.entries(PESOS_AGENTES).reduce((acc, [k, peso]) => acc + notas[k] * peso, 0);
  return Math.round(soma);
}

export default function useLaudoImobi() {
  const [fase, setFase] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [laudo, setLaudo] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [analiseFotos, setAnaliseFotos] = useState(null);
  const [vizinhanca, setVizinhanca] = useState(null);
  const [meta, setMeta] = useState(null);

  const limpar = useCallback(() => {
    setLaudo(null);
    setErro('');
    setAnaliseFotos(null);
    setVizinhanca(null);
    setMeta(null);
    setFase('');
  }, []);

  const analisarFotos = useCallback(async (imagens) => {
    if (!imagens?.length) return null;
    const bruto = await chamarIA({
      provider: MODELO_PADRAO,
      systemPrompt: 'Você responde sempre com JSON válido, sem markdown.',
      prompt: PROMPT_FOTOS,
      images: imagens.slice(0, 3),
      temperature: 0.2,
      maxTokens: 700,
    });
    const json = extrairJson(bruto?.text);
    if (!json) throw new Error('A IA não devolveu JSON válido na análise das fotos');
    return json;
  }, []);

  const gerar = useCallback(async (contexto) => {
    const { dados, avaliacao, valorPedido, cdi = CDI_PADRAO, fii = FII_TIJOLO_PADRAO, vizinhanca: vizPronta } = contexto;
    setCarregando(true);
    setErro('');
    setLaudo(null);
    setFase('Analisando fotos do imóvel…');

    try {
      let fotosJson = analiseFotos;
      if (contexto.fotos?.length && !fotosJson) {
        try {
          fotosJson = await analisarFotos(contexto.fotos);
          setAnaliseFotos(fotosJson);
        } catch (e) {
          // foto é opcional: segue sem ela, mas registra o aviso
          fotosJson = null;
          setErro(`Fotos não analisadas: ${e.message}`);
        }
      }

      setFase('Consultando os 5 agentes de avaliação…');
      const viz = vizPronta || { ok: false, motivo: 'sem raio-X' };
      setVizinhanca(viz);

      const prompt = montarPromptLaudo({
        dados, avaliacao, valorPedido,
        vizinhanca: resumirParaIA(viz),
        fotos: fotosJson, cdi, fii,
      });

      const chamada = (p) => chamarIA({
        provider: MODELO_PADRAO,
        systemPrompt: 'Você é um comitê de avaliação imobiliária. Responde exclusivamente com JSON válido, sem markdown.',
        prompt: p,
        temperature: 0.3,
        maxTokens: 4096,
      });

      let resposta = await chamada(prompt);
      let json = extrairJson(resposta?.text);
      if (!json) {
        setFase('Refazendo a análise (JSON inválido)…');
        resposta = await chamada(`${prompt}\n\nATENÇÃO: a resposta anterior não era JSON válido. Responda SOMENTE o JSON, começando com { e terminando com }.`);
        json = extrairJson(resposta?.text);
      }
      if (!json) throw new Error('A IA não devolveu JSON válido após duas tentativas');

      const score = calcularScoreComposto(json);
      setLaudo({ ...json, scoreImobi: score, classificacao: classificarScore(score).rotulo });
      setMeta({
        modelo: resposta?.model || '—',
        provedor: resposta?.provider || MODELO_PADRAO,
        cdi, fii,
        geradoEm: new Date().toISOString(),
        pesoTotal: Object.values(PESOS_AGENTES).reduce((a, b) => a + b, 0),
      });
      setFase('');
      return { laudo: json, score };
    } catch (e) {
      setErro(String(e?.message || e));
      setFase('');
      return null;
    } finally {
      setCarregando(false);
    }
  }, [analiseFotos]);

  return {
    fase, carregando, erro, laudo, fotos, setFotos,
    analiseFotos, vizinhanca, setVizinhanca, meta,
    gerar, limpar, analisarFotos,
  };
}
