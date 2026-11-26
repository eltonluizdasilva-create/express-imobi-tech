import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  SYSTEM_PROMPT_CAPTACAO_CAMPO,
  interpretarCaptacaoCampo,
  toNum,
  converterNumeroSeguro,
  montarPromptUsuarioCaptacao,
} from '../src/agent/captacaoCampoPrompt.js';

test('prompt: SYSTEM_PROMPT_CAPTACAO_CAMPO contém diretrizes ABNT/COFECI, normalização e anti-alucinação', () => {
  assert.ok(typeof SYSTEM_PROMPT_CAPTACAO_CAMPO === 'string');
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /ABNT NBR 14653/i);
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /COFECI/i);
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /dadosTecnicos/);
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /analiseMercado/);
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /materialComercial/);
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /null/i);
  assert.match(SYSTEM_PROMPT_CAPTACAO_CAMPO, /480 mil/i);
});

test('helper toNum / converterNumeroSeguro: converte e sanitiza números com segurança', () => {
  assert.equal(toNum(120), 120);
  assert.equal(toNum('480000'), 480000);
  assert.equal(toNum('1.250,50'), 1250.5);
  assert.equal(toNum('360.00'), 360);
  assert.equal(toNum(null), null);
  assert.equal(toNum(''), null);
  assert.equal(toNum('abc'), null);
  assert.equal(toNum(NaN), null);
  assert.equal(toNum(Infinity), null);
  assert.equal(converterNumeroSeguro('3'), 3);
});

test('interpretarCaptacaoCampo: parse de JSON limpo e cálculo determinístico de m²', () => {
  const jsonMock = JSON.stringify({
    dadosTecnicos: {
      cidade: 'Uberlândia',
      bairro: 'Jardim dos Ipês',
      endereco: 'Rua das Flores, 120',
      tipologia: 'Urbano',
      subtipo: 'Apartamento',
      areaTotal: '120',
      areaConstruida: '95',
      quartos: '3',
      suites: '1',
      vagas: '2',
      padraoConstrutivo: 'Médio-Alto',
      conservacao: 'Bom',
      valorPedido: '480000',
    },
    analiseMercado: {
      valorM2Pedido: 999999, // Deve ser ignorado e recalculado em JS
      observacaoTecnica: 'Apartamento bem ventilado, posição nascente.',
    },
    materialComercial: {
      tituloAnuncio: 'Lindo Apartamento 3 Quartos no Jardim dos Ipês',
      descricaoPortal: 'Excelente oportunidade com 95m² de área construída...',
      roteiroReels: '[0-3s GANCHO] Conheça este apê incrível...',
      fichaTecnica: '• 3 Quartos (1 suíte)\n• 2 Vagas',
    },
  });

  const res = interpretarCaptacaoCampo(jsonMock);
  assert.ok(res);
  assert.equal(res.dadosTecnicos.cidade, 'Uberlândia');
  assert.equal(res.dadosTecnicos.areaTotal, 120);
  assert.equal(res.dadosTecnicos.areaConstruida, 95);
  assert.equal(res.dadosTecnicos.quartos, 3);
  assert.equal(res.dadosTecnicos.suites, 1);
  assert.equal(res.dadosTecnicos.vagas, 2);
  assert.equal(res.dadosTecnicos.valorPedido, 480000);

  // Cálculo determinístico em JS: 480000 / 95 = 5053
  assert.equal(res.analiseMercado.valorM2Pedido, Math.round(480000 / 95));
  assert.equal(res.materialComercial.tituloAnuncio, 'Lindo Apartamento 3 Quartos no Jardim dos Ipês');
});

test('interpretarCaptacaoCampo: remove cercas markdown e trata texto ao redor', () => {
  const textoComMarkdown = `Segue o resultado da captação:
\`\`\`json
{
  "dadosTecnicos": {
    "cidade": "Ribeirão Preto",
    "areaTotal": 300,
    "valorPedido": 600000
  },
  "analiseMercado": {
    "observacaoTecnica": "Terreno plano em condomínio fechado."
  },
  "materialComercial": {
    "tituloAnuncio": "Terreno 300m² em Condomínio",
    "descricaoPortal": "Excelente terreno plano pronto para construir."
  }
}
\`\`\`
Qualquer dúvida me avise.`;

  const res = interpretarCaptacaoCampo(textoComMarkdown);
  assert.ok(res);
  assert.equal(res.dadosTecnicos.cidade, 'Ribeirão Preto');
  assert.equal(res.dadosTecnicos.areaTotal, 300);
  assert.equal(res.dadosTecnicos.valorPedido, 600000);
  // Cálculo: 600000 / 300 = 2000
  assert.equal(res.analiseMercado.valorM2Pedido, 2000);
});

test('interpretarCaptacaoCampo: m² é null se faltar valorPedido ou área', () => {
  const semArea = JSON.stringify({
    dadosTecnicos: {
      valorPedido: 350000,
      areaTotal: null,
      areaConstruida: null,
    },
  });
  const resSemArea = interpretarCaptacaoCampo(semArea);
  assert.equal(resSemArea.analiseMercado.valorM2Pedido, null);

  const semValor = JSON.stringify({
    dadosTecnicos: {
      valorPedido: null,
      areaTotal: 250,
    },
  });
  const resSemValor = interpretarCaptacaoCampo(semValor);
  assert.equal(resSemValor.analiseMercado.valorM2Pedido, null);

  assert.equal(interpretarCaptacaoCampo(null), null);
  assert.equal(interpretarCaptacaoCampo(''), null);
});

test('montarPromptUsuarioCaptacao: inclui transcrição e dados complementares opcionais', () => {
  const prompt = montarPromptUsuarioCaptacao({
    transcricao: 'Casa com 3 quartos sendo 1 suíte, terreno de 360m²',
    endereco: 'Rua Minas Gerais, 45',
    valorPedido: '550.000',
  });
  assert.match(prompt, /Casa com 3 quartos/);
  assert.match(prompt, /Rua Minas Gerais/);
  assert.match(prompt, /550\.000/);
});

test('CaptacaoNicho.jsx: possui interface de voz, preenchimento inteligente e Kit Portais & Reels', () => {
  const fonte = readFileSync(new URL('../src/components/imobi/CaptacaoNicho.jsx', import.meta.url), 'utf8');

  // 1. Elementos de reconhecimento de voz
  assert.match(fonte, /SpeechRecognition/);
  assert.match(fonte, /Gravar Áudio de Campo/);
  assert.match(fonte, /Parar Gravação/);

  // 2. Botão de processamento inteligente com IA
  assert.match(fonte, /Preencher Ficha & Gerar Anúncio\/Reels/);
  assert.match(fonte, /processarCaptacaoCampoIA/);

  // 3. Botões de cópia do Kit Portais & Reels
  assert.match(fonte, /Copiar Anúncio/);
  assert.match(fonte, /Copiar Roteiro/);
  assert.match(fonte, /Copiar Ficha/);

  // 4. Campos técnicos no formulário
  assert.match(fonte, /bairro/);
  assert.match(fonte, /endereco/);
  assert.match(fonte, /quartos/);
  assert.match(fonte, /suites/);
  assert.match(fonte, /vagas/);
  assert.match(fonte, /padraoConstrutivo/);
  assert.match(fonte, /conservacao/);
  assert.match(fonte, /materialComercial/);
  assert.match(fonte, /analiseMercado/);
});
