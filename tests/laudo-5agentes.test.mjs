/**
 * Teste real do laudo 5 agentes: monta o prompt com dados de exemplo,
 * chama o handler local (/api/ai) e valida o contrato JSON.
 */
import { montarPromptLaudo, calcularScoreComposto, classificarScore, PESOS_AGENTES } from '../src/hooks/useLaudoImobi.js';
import { calcularNotaLocalizacao, normalizarCep, classificarNota, resumirParaIA } from '../src/services/vizinhancaService.js';

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!cond) falhas += 1;
};

/* ---------- 1. funções puras ---------- */
ok('normalizarCep aceita formatado', normalizarCep('38400-000') === '38400000');
ok('normalizarCep rejeita curto', normalizarCep('123') === '');

const zero = calcularNotaLocalizacao({});
ok('nota sem POIs = 0', zero.nota === 0, `nota=${zero.nota} / ${zero.classificacao}`);

const cheio = calcularNotaLocalizacao({ mercados: 6, escolas: 4, saude: 5, gastronomia: 12, lazer: 4 });
ok('nota com ideais = 100', cheio.nota === 100, `nota=${cheio.nota} / ${cheio.classificacao}`);

// 3/6 + 2/4 + 2/5 + 6/12 + 2/4 = 0.30*.5 + 0.25*.5 + 0.20*.4 + 0.15*.5 + 0.10*.5 = 0.48
const meio = calcularNotaLocalizacao({ mercados: 3, escolas: 2, saude: 2, gastronomia: 6, lazer: 2 });
ok('nota proporcional (0,48)', meio.nota === 48, `nota=${meio.nota}`);

const soMercado = calcularNotaLocalizacao({ mercados: 99 });
ok('só mercado satura em 30', soMercado.nota === 30, `nota=${soMercado.nota}`);
ok('classificação por faixa', classificarNota(90) === 'Localização premium' && classificarNota(10) === 'Isolado / rural');

const somaPesos = Object.values(PESOS_AGENTES).reduce((a, b) => a + b, 0);
ok('pesos somam 1', Math.abs(somaPesos - 1) < 1e-9, `soma=${somaPesos}`);

const scoreExemplo = calcularScoreComposto({
  agente1: { nota: 90 }, agente2: { nota: 80 }, agente3: { nota: 70 },
  agente4: { nota: 60 }, agente5: { nota: 50 },
});
ok('score composto 25/25/20/15/15', scoreExemplo === Math.round(90*.25 + 80*.25 + 70*.20 + 60*.15 + 50*.15), `score=${scoreExemplo}`);
ok('classificação do score', classificarScore(85).rotulo === 'Compra Forte' && classificarScore(20).rotulo === 'Evitar');

/* ---------- 2. prompt montado ---------- */
const viz = {
  ok: true, endereco: 'Rua Olegário Maciel, 100, Uberlândia, MG', raioMetros: 1000,
  nota: 72, classificacao: 'Muito bem servido', total: 23,
  contagem: { mercados: 5, escolas: 3, saude: 4, gastronomia: 8, lazer: 3 },
  pontos: [
    { nome: 'Supermercado Bretas', categoria: 'mercados', metros: 180 },
    { nome: 'Escola Estadual Antônio', categoria: 'escolas', metros: 320 },
  ],
};
const resumoViz = resumirParaIA(viz);
ok('resumo da vizinhança cita a nota', resumoViz.includes('72/100') && resumoViz.includes('Bretas'));

const prompt = montarPromptLaudo({
  dados: {
    cidade: 'Uberlândia', bairro: 'Centro', uf: 'MG', tipologia: 'urbano',
    padrao: 'normal', estado: 'bom', topografia: 'plano',
    areaTotal: 360, areaConstruida: 210,
    comparaveis: [
      { valor: 480000, area: 200, distanciaKm: 0.8, oferta: true },
      { valor: 520000, area: 220, distanciaKm: 1.4, oferta: true },
      { valor: 495000, area: 210, distanciaKm: 2.0, oferta: false },
    ],
  },
  avaliacao: {
    valorJusto: 470000, precoUnitario: 2238, unidade: 'm²', prazoMedioDias: 95,
    cenarios: [
      { label: 'Mínimo', valor: 440000 }, { label: 'Provável', valor: 470000 }, { label: 'Máximo', valor: 505000 },
    ],
    metodo: 'Comparativo direto', grauFundamentacao: 'Grau II',
  },
  valorPedido: 520000,
  vizinhanca: resumoViz,
  fotos: { padraoConstrutivo: 'normal', estadoConservacao: 'bom', confianca: 78, justificativa: 'Fachada e acabamentos em bom estado.' },
  cdi: 15, fii: 8.5,
});
ok('prompt tem as 5 tarefas', ['AGENTE 1','AGENTE 2','AGENTE 3','AGENTE 4','AGENTE 5'].every((a) => prompt.includes(a)));
// Intl usa espaço não separável (U+00A0) entre R$ e o número: normaliza antes.
const promptPlano = prompt.replace(/\u00a0/g, ' ');
ok('prompt traz comparáveis formatados', promptPlano.includes('R$ 480.000') && promptPlano.includes('/m²'), promptPlano.match(/1\)[^\n]+/)?.[0] || '');
ok('prompt exige JSON', prompt.includes('"agente1"') && prompt.includes('"scoreImobi"') === false);
console.log(`   (prompt: ${prompt.length} caracteres)`);

/* ---------- 3. chamada real ao handler ---------- */
const r = await fetch('http://localhost:5173/api/ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'gemini',
    systemPrompt: 'Você é um comitê de avaliação imobiliária. Responde exclusivamente com JSON válido, sem markdown.',
    prompt,
    temperature: 0.3,
    maxTokens: 4096,
  }),
});
const dados = await r.json();
ok('handler responde 200', r.status === 200, `HTTP ${r.status} ${dados.error || ''}`);
if (r.status !== 200) { console.log(JSON.stringify(dados).slice(0, 600)); process.exit(1); }

const texto = String(dados.text || '');
const limpo = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
let laudo = null;
try { laudo = JSON.parse(limpo.slice(limpo.indexOf('{'), limpo.lastIndexOf('}') + 1)); } catch (e) {
  ok('JSON parseável', false, e.message);
}
if (laudo) {
  ok('JSON parseável', true, `modelo ${dados.model}`);
  for (const ag of ['agente1','agente2','agente3','agente4','agente5']) {
    ok(`${ag} com nota 0-100`, Number.isFinite(laudo[ag]?.nota) && laudo[ag].nota >= 0 && laudo[ag].nota <= 100, `nota=${laudo[ag]?.nota}`);
  }
  const score = calcularScoreComposto(laudo);
  console.log(`\n   Score Imobi composto = ${score} (${classificarScore(score).rotulo})`);
  console.log(`   PTAM sugerido: R$ ${laudo.agente1?.valorJustoRecomendado} · faixa ${laudo.agente1?.faixaMinima}-${laudo.agente1?.faixaMaxima} · dif ${laudo.agente1?.diferencaPercentualPedido}%`);
  console.log(`   Aluguel R$ ${laudo.agente2?.aluguelMensal} · cap rate ${laudo.agente2?.capRateAnual}% · ROI5 ${laudo.agente2?.roi5Anos}%`);
  console.log(`   Liquidez: ${laudo.agente4?.diasNoPrecoPedido}d pedido vs ${laudo.agente4?.diasNoPrecoJusto}d justo`);
  console.log(`   Anúncio: ${String(laudo.agente5?.anuncio || '').length} caracteres`);
  console.log(`\n   --- anúncio (início) ---\n   ${String(laudo.agente5?.anuncio || '').slice(0, 280).replace(/\n/g, '\n   ')}`);
}

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
