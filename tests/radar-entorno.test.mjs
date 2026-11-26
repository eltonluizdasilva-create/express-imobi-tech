import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CATEGORIAS_RADAR,
  IMPACTOS_RADAR,
  ANCORAS_PREDEFINIDAS,
  converterDistanciaMetros,
  classificarLiquidez,
  calcularIndiceLiquidez,
  gerarParecerFatorLocalizacao,
  gerarArgumentoWhatsAppLocalizacao,
} from '../src/lib/radarEntorno.js';

import { cenarioDemoRadarEntorno } from '../src/lib/cenarioDemo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Radar de Valorização & Amenidades do Entorno — Motor Determinístico', () => {
  test('exporta as 6 categorias de âncoras urbanas obrigatórias', () => {
    assert.equal(CATEGORIAS_RADAR.EDUCACAO, 'Educação & Escolas');
    assert.equal(CATEGORIAS_RADAR.SAUDE, 'Saúde & Hospitais');
    assert.equal(CATEGORIAS_RADAR.COMERCIO, 'Comércio & Supermercados');
    assert.equal(CATEGORIAS_RADAR.LAZER, 'Lazer & Parques');
    assert.equal(CATEGORIAS_RADAR.MOBILIDADE, 'Mobilidade & Vias de Acesso');
    assert.equal(CATEGORIAS_RADAR.RUIDO_ATENCAO, 'Fator de Atenção / Ruído');
  });

  test('exporta impactos de amenidades esperados', () => {
    assert.equal(IMPACTOS_RADAR.ALTA_VALORIZACAO, 'Alta Valorização');
    assert.equal(IMPACTOS_RADAR.CONVENIENCIA, 'Conveniência');
    assert.equal(IMPACTOS_RADAR.PONTO_ATENCAO, 'Ponto de Atenção');
  });

  test('ANCORAS_PREDEFINIDAS disponibiliza amenidades com pesos e distâncias', () => {
    assert.ok(Array.isArray(ANCORAS_PREDEFINIDAS));
    assert.ok(ANCORAS_PREDEFINIDAS.length >= 6);
    const ruído = ANCORAS_PREDEFINIDAS.find((a) => a.categoria === CATEGORIAS_RADAR.RUIDO_ATENCAO);
    assert.ok(ruído);
    assert.ok(ruído.pesoBase < 0, 'fator de ruído deve ter peso negativo');
  });

  test('converterDistanciaMetros converte strings em metros com precisão', () => {
    assert.equal(converterDistanciaMetros('250m'), 250);
    assert.equal(converterDistanciaMetros('1,5km'), 1500);
    assert.equal(converterDistanciaMetros('2km'), 2000);
    assert.equal(converterDistanciaMetros(800), 800);
    assert.equal(converterDistanciaMetros(''), 500);
  });

  test('classificarLiquidez enquadra rigorosamente nas 4 faixas normativas', () => {
    assert.equal(classificarLiquidez(95).rotulo, 'Liquidez Premium');
    assert.equal(classificarLiquidez(80).rotulo, 'Liquidez Premium');
    assert.equal(classificarLiquidez(79).rotulo, 'Alta Atratividade');
    assert.equal(classificarLiquidez(60).rotulo, 'Alta Atratividade');
    assert.equal(classificarLiquidez(59).rotulo, 'Liquidez Moderada');
    assert.equal(classificarLiquidez(40).rotulo, 'Liquidez Moderada');
    assert.equal(classificarLiquidez(39).rotulo, 'Ponto de Atenção / Nicho Específico');
    assert.equal(classificarLiquidez(15).rotulo, 'Ponto de Atenção / Nicho Específico');
  });

  test('calcularIndiceLiquidez devolve ponto neutro 50 para lista vazia', () => {
    const res = calcularIndiceLiquidez([]);
    assert.equal(res.score, 50);
    assert.equal(res.totalAncoras, 0);
  });

  test('calcularIndiceLiquidez calcula nota alta com amenidades nobres próximas', () => {
    const ancoras = [
      { nome: 'Colégio', distancia: '200m', categoria: CATEGORIAS_RADAR.EDUCACAO, impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 18 },
      { nome: 'Parque', distancia: '250m', categoria: CATEGORIAS_RADAR.LAZER, impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 18 },
      { nome: 'Metrô', distancia: '300m', categoria: CATEGORIAS_RADAR.MOBILIDADE, impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 20 },
    ];
    const res = calcularIndiceLiquidez(ancoras);
    assert.ok(res.score >= 80, `score=${res.score} deve ser >= 80 (Liquidez Premium)`);
    assert.equal(res.classificacao.rotulo, 'Liquidez Premium');
    assert.equal(res.totalPositivas, 3);
    assert.equal(res.totalAtencao, 0);
  });

  test('calcularIndiceLiquidez aplica penalidade para fatores de ruído próximos', () => {
    const ancorasComRuido = [
      { nome: 'Linha Férrea / Carga Pesada', distancia: '100m', categoria: CATEGORIAS_RADAR.RUIDO_ATENCAO, impacto: IMPACTOS_RADAR.PONTO_ATENCAO, pesoBase: -25 },
      { nome: 'Supermercado', distancia: '800m', categoria: CATEGORIAS_RADAR.COMERCIO, impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 12 },
    ];
    const res = calcularIndiceLiquidez(ancorasComRuido);
    assert.ok(res.score < 50, `score=${res.score} deve ser inferior ao ponto neutro 50`);
    assert.equal(res.totalAtencao, 1);
  });

  test('calcularIndiceLiquidez trava limites de 0 e 100', () => {
    const muitasNegativas = Array(10).fill({
      nome: 'Ruído', distancia: '50m', categoria: CATEGORIAS_RADAR.RUIDO_ATENCAO, impacto: IMPACTOS_RADAR.PONTO_ATENCAO, pesoBase: -30,
    });
    assert.equal(calcularIndiceLiquidez(muitasNegativas).score, 0);

    const muitasPositivas = Array(10).fill({
      nome: 'Parque', distancia: '100m', categoria: CATEGORIAS_RADAR.LAZER, impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 30,
    });
    assert.equal(calcularIndiceLiquidez(muitasPositivas).score, 100);
  });

  test('gerarParecerFatorLocalizacao gera texto formal compatível com ABNT NBR 14653', () => {
    const parecer = gerarParecerFatorLocalizacao({
      bairro: 'Jardins',
      cidade: 'São Paulo',
      ancoras: [
        { nome: 'Parque Ibirapuera', distancia: '400m', categoria: CATEGORIAS_RADAR.LAZER, impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO },
      ],
    });
    assert.ok(parecer.includes('ABNT NBR 14653'));
    assert.ok(parecer.includes('Jardins, São Paulo'));
    assert.ok(parecer.includes('Parque Ibirapuera'));
    assert.ok(parecer.includes('Índice de Liquidez'));
  });

  test('gerarArgumentoWhatsAppLocalizacao gera roteiro persuasivo com marcadores', () => {
    const whats = gerarArgumentoWhatsAppLocalizacao({
      bairro: 'Centro',
      cidade: 'Uberlândia',
      valorPedido: 'R$ 650.000',
      ancoras: [
        { nome: 'Praça Tubal Vilela', distancia: '300m', categoria: CATEGORIAS_RADAR.LAZER, impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO },
        { nome: 'Tráfego Intenso', distancia: '100m', categoria: CATEGORIAS_RADAR.RUIDO_ATENCAO, impacto: IMPACTOS_RADAR.PONTO_ATENCAO },
      ],
    });
    assert.ok(whats.includes('RAIO-X DE LOCALIZAÇÃO & VALORIZAÇÃO'));
    assert.ok(whats.includes('CENTRO - UBERLÂNDIA'));
    assert.ok(whats.includes('Praça Tubal Vilela'));
    assert.ok(whats.includes('⚠️ *Tráfego Intenso*'));
    assert.ok(whats.includes('R$ 650.000'));
  });
});

describe('Integração com Cenário Demo e UI', () => {
  test('cenarioDemoRadarEntorno expõe 2 laudos demonstrativos calculados', () => {
    assert.ok(Array.isArray(cenarioDemoRadarEntorno));
    assert.equal(cenarioDemoRadarEntorno.length, 2);

    const jard = cenarioDemoRadarEntorno[0];
    assert.equal(jard.bairro, 'Jardins');
    assert.ok(jard.indice.score >= 80, 'Jardins deve ter liquidez premium');

    const udi = cenarioDemoRadarEntorno[1];
    assert.equal(udi.bairro, 'Centro');
    assert.ok(udi.ancoras.some((a) => a.categoria === CATEGORIAS_RADAR.RUIDO_ATENCAO));
  });

  test('AvaliacaoImovel.jsx possui integração do Radar de Entorno', () => {
    const filePath = path.join(ROOT, 'src', 'components', 'imobi', 'AvaliacaoImovel.jsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('Radar de Valorização & Entorno'), 'Deve renderizar título do radar');
    assert.ok(content.includes('indiceLiquidez'), 'Deve usar indiceLiquidez');
    assert.ok(content.includes('adicionarAncoraPredefinida'), 'Deve ter ação de amenidade rápida');
    assert.ok(content.includes('copiarWhatsAppLocalizacao'), 'Deve ter ação para WhatsApp');
  });

  test('company-brain/05-decisoes-ativas.md registra a decisão D-23.34', () => {
    const brainPath = path.join(ROOT, 'company-brain', '05-decisoes-ativas.md');
    const content = fs.readFileSync(brainPath, 'utf-8');
    assert.ok(content.includes('D-23.34'), '05-decisoes-ativas.md deve conter D-23.34');
    assert.ok(content.includes('Radar de Valorização & Amenidades do Entorno'));
  });
});
