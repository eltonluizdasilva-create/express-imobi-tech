/**
 * Testes Unitários de Due Diligence & Raio-X de Matrícula (D-23.28)
 * ============================================================================
 * Valida o prompt, parser seguro, detecção de divergência e integração do módulo
 * dentro do Assistente Legal (juridico_imobi, plano PLUS).
 * ============================================================================
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  SYSTEM_PROMPT_DUE_DILIGENCE,
  montarPromptUsuarioDueDiligence,
  interpretarDueDiligence,
} from '../src/agent/dueDiligencePrompt.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('prompt: SYSTEM_PROMPT_DUE_DILIGENCE contém regras registrais e estrutura JSON', () => {
  assert.ok(SYSTEM_PROMPT_DUE_DILIGENCE.includes('Lei 6.015/73'), 'Falta referência à Lei de Registros Públicos');
  assert.ok(SYSTEM_PROMPT_DUE_DILIGENCE.includes('semaforo'), 'Falta campo semaforo no prompt');
  assert.ok(SYSTEM_PROMPT_DUE_DILIGENCE.includes('VERDE'), 'Falta status VERDE');
  assert.ok(SYSTEM_PROMPT_DUE_DILIGENCE.includes('AMARELO'), 'Falta status AMARELO');
  assert.ok(SYSTEM_PROMPT_DUE_DILIGENCE.includes('VERMELHO'), 'Falta status VERMELHO');
  assert.ok(SYSTEM_PROMPT_DUE_DILIGENCE.includes('checklistCertidoes'), 'Falta checklistCertidoes');
});

test('montarPromptUsuarioDueDiligence: formata documentos e observações com segurança', () => {
  const prompt = montarPromptUsuarioDueDiligence({
    textoDocumentos: 'MATRÍCULA 12.345 DO 1º CRI DE UBERLÂNDIA/MG. IMÓVEL: LOTE 10 QUADRA 5.',
    informacoesAdicionais: 'Vendedor casado em comunhão parcial de bens.',
  });

  assert.ok(prompt.includes('MATRÍCULA 12.345'), 'Não incluiu texto da matrícula');
  assert.ok(prompt.includes('comunhão parcial'), 'Não incluiu informações adicionais');
});

test('interpretarDueDiligence: parser de JSON válido com semáforo VERDE', () => {
  const jsonMock = JSON.stringify({
    semaforo: 'VERDE',
    scoreSeguranca: 95,
    resumoExecutivo: 'Imóvel regular e desimpedido.',
    dadosIdentificados: {
      numeroMatricula: '12.345',
      cartorioRI: '1º CRI',
      proprietariosAtuais: ['João da Silva'],
      areaMatricula: '360 m²',
      areaIPTU: '360 m²',
      divergenciaArea: false,
    },
    alertasRisco: [],
    checklistCertidoes: [
      { item: 'Matrícula Atualizada', status: 'OK', acaoRecomendada: 'Certidão emitida com sucesso.' },
    ],
    recomendacaoFinal: 'Negócio seguro para formalização.',
  });

  const res = interpretarDueDiligence(jsonMock);
  assert.equal(res.semaforo, 'VERDE');
  assert.equal(res.scoreSeguranca, 95);
  assert.equal(res.dadosIdentificados.numeroMatricula, '12.345');
  assert.equal(res.dadosIdentificados.divergenciaArea, false);
  assert.equal(res.checklistCertidoes[0].status, 'OK');
});

test('interpretarDueDiligence: extrai JSON encapsulado em markdown e detecta divergência de área', () => {
  const respostaComMarkdown = `\`\`\`json
{
  "semaforo": "AMARELO",
  "scoreSeguranca": 70,
  "resumoExecutivo": "Averbação de construção pendente.",
  "dadosIdentificados": {
    "numeroMatricula": '88.100',
    "cartorioRI": "2º CRI",
    "proprietariosAtuais": ["Maria Santos"],
    "areaMatricula": "250 m²",
    "areaIPTU": "320 m²",
    "divergenciaArea": false
  },
  "alertasRisco": [
    {
      "nivel": "ALERTA",
      "titulo": "Divergência de Área Construída",
      "descricao": "Área no IPTU maior que na matrícula.",
      "baseLegal": "Art. 213 da Lei 6.015/73"
    }
  ],
  "checklistCertidoes": [
    { "item": "Habite-se / CND do INSS", "status": "PENDENTE", "acaoRecomendada": "Exigir habite-se averbado." }
  ],
  "recomendacaoFinal": "Condicionar o pagamento da última parcela à averbação."
}
\`\`\``.replace(/'88\.100'/g, '"88.100"');

  const res = interpretarDueDiligence(respostaComMarkdown);
  assert.equal(res.semaforo, 'AMARELO');
  assert.equal(res.scoreSeguranca, 70);
  assert.equal(res.dadosIdentificados.divergenciaArea, true, 'Deveria detectar divergência automática entre 250m² e 320m²');
  assert.equal(res.alertasRisco[0].nivel, 'ALERTA');
});

test('interpretarDueDiligence: semáforo VERMELHO garante alerta CRÍTICO', () => {
  const jsonVermelho = JSON.stringify({
    semaforo: 'VERMELHO',
    scoreSeguranca: 20,
    resumoExecutivo: 'Penhora averbada na matrícula.',
    alertasRisco: [],
  });

  const res = interpretarDueDiligence(jsonVermelho);
  assert.equal(res.semaforo, 'VERMELHO');
  assert.ok(res.scoreSeguranca <= 30);
  assert.ok(res.alertasRisco.length > 0, 'Deve ter alertas');
  assert.ok(res.alertasRisco.some((a) => a.nivel === 'CRITICO'), 'Semáforo vermelho exige alerta com nível CRITICO');
});

test('interpretarDueDiligence: resiliência para entradas inválidas ou nulas', () => {
  const resNull = interpretarDueDiligence(null);
  assert.equal(resNull.semaforo, 'AMARELO');
  assert.ok(resNull.resumoExecutivo.length > 0);

  const resTextoLivre = interpretarDueDiligence('O imóvel possui uma alienação fiduciária e precisa de certidões.');
  assert.ok(resTextoLivre.semaforo);
  assert.ok(resTextoLivre.checklistCertidoes.length > 0);
});

test('integração: AssistenteJuridicoImobi importa e renderiza DueDiligenceMatricula', () => {
  const juridico = ler('src/components/AssistenteJuridicoImobi.jsx');
  assert.match(juridico, /import DueDiligenceMatricula from '\.\/imobi\/DueDiligenceMatricula';/);
  assert.match(juridico, /<DueDiligenceMatricula \/>/);
});

test('integração: DueDiligenceMatricula existe e consome processarDueDiligenceIA', () => {
  const due = ler('src/components/imobi/DueDiligenceMatricula.jsx');
  assert.match(due, /import \{ processarDueDiligenceIA \} from '\.\.\/\.\.\/agent\/dueDiligencePrompt';/);
  assert.match(due, /Due Diligence & Raio-X de Matrícula/);
  assert.match(due, /Analisar Matrícula com IA/);
  assert.match(due, /Copiar Parecer & Checklist/);
});
