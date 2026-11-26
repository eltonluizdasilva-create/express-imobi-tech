/**
 * Testes Unitários de Triagem de Financiamento & Crédito (PRO -> PLUS)
 * ============================================================================
 * Valida o prompt, parser com conferência matemática de 30% e 80,5 anos,
 * pré-preenchimento (prefill) e integração com a aba Correspondente / Crédito.
 * ============================================================================
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  SYSTEM_PROMPT_TRIAGEM_CREDITO,
  montarPromptUsuarioTriagem,
  interpretarTriagemCredito,
} from '../src/agent/triagemCreditoPrompt.js';
import { setCreditoPrefill, consumeCreditoPrefill } from '../src/lib/credito/prefill.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');

test('prompt: SYSTEM_PROMPT_TRIAGEM_CREDITO contém regras de 30% de renda, 80,5 anos e FGTS', () => {
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('30%'), 'Falta regra de comprometimento de 30% da renda');
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('statusViabilidade'), 'Falta statusViabilidade no prompt');
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('APROVAVEL'), 'Falta APROVAVEL');
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('AJUSTE_ENTRADA'), 'Falta AJUSTE_ENTRADA');
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('IMPEDIMENTO'), 'Falta IMPEDIMENTO');
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('FGTS'), 'Falta menção ao FGTS');
  assert.ok(SYSTEM_PROMPT_TRIAGEM_CREDITO.includes('dossieCorrespondente'), 'Falta campo de dossiê');
});

test('montarPromptUsuarioTriagem: formata ficha rápida com renda, idade, FGTS e dependentes', () => {
  const prompt = montarPromptUsuarioTriagem({
    valorImovel: '300.000',
    rendaFamiliar: '7.500',
    idadeMaisVelho: '42',
    possuiCoComprador: true,
    parentescoCoComprador: 'Esposa',
    possuiDependentes: true,
    qtdDependentes: '2',
    fgtsMais36Meses: true,
    saldoFgts: '45.000',
    vinculoCidade: true,
  });

  assert.ok(prompt.includes('300.000'), 'Falta valor do imóvel');
  assert.ok(prompt.includes('7.500'), 'Falta renda familiar');
  assert.ok(prompt.includes('42 anos'), 'Falta idade do comprador');
  assert.ok(prompt.includes('Esposa'), 'Falta co-comprador');
  assert.ok(prompt.includes('45.000'), 'Falta saldo de FGTS');
});

test('interpretarTriagemCredito: calcula capacidade de parcela exatamente em 30% e desembolso', () => {
  const jsonMock = JSON.stringify({
    statusViabilidade: 'APROVAVEL',
    scoreAprovacao: 90,
    resumoEnquadramento: 'Comprador com excelente perfil para SBPE SAC.',
    programaSugerido: 'SBPE SAC',
    estimativaFinanceira: {
      valorImovel: 400000,
      rendaFamiliar: 10000,
      capacidadeParcelaMaxima: 999999, // valor simulado incorreto para testar recálculo
      valorFinanciavelEstimado: 320000,
      entradaNecessariaEstimada: 80000,
      saldoFgtsUtilizavel: 30000,
      subsidioEstimado: 0,
      prazoMaximoMeses: 360,
    },
    alertasDocumentais: [],
    dossieCorrespondente: 'Dossiê teste',
  });

  const res = interpretarTriagemCredito(jsonMock, { rendaFamiliar: 10000, valorImovel: 400000, idadeMaisVelho: 35 });
  assert.equal(res.statusViabilidade, 'APROVAVEL');
  assert.equal(res.scoreAprovacao, 90);
  // Regra de ouro: 30% de 10.000 = 3.000 exatos
  assert.equal(res.estimativaFinanceira.capacidadeParcelaMaxima, 3000, 'Parcela máxima deve ser 30% da renda');
  // Desembolso líquido: 80.000 - 30.000 = 50.000
  assert.equal(res.estimativaFinanceira.desembolsoRecursoProprio, 50000);
});

test('interpretarTriagemCredito: respeita regra de idade máxima (idade + prazo <= 80,5 anos)', () => {
  const jsonIdoso = JSON.stringify({
    statusViabilidade: 'AJUSTE_ENTRADA',
    scoreAprovacao: 60,
    resumoEnquadramento: 'Idade avançada reduz o prazo máximo.',
    estimativaFinanceira: {
      valorImovel: 200000,
      rendaFamiliar: 8000,
      prazoMaximoMeses: 420, // IA sugeriu 420 meses mas cliente tem 65 anos
    },
  });

  // Cliente com 65 anos: 80,5 - 65 = 15,5 anos = 186 meses
  const res = interpretarTriagemCredito(jsonIdoso, { idadeMaisVelho: 65, rendaFamiliar: 8000, valorImovel: 200000 });
  assert.ok(res.estimativaFinanceira.prazoMaximoMeses <= 186, 'Prazo não pode ultrapassar limite de 80,5 anos');
});

test('interpretarTriagemCredito: extrai JSON com markdown e trata fallbacks seguros', () => {
  const textoMarkdown = `\`\`\`json
{
  "statusViabilidade": "IMPEDIMENTO",
  "scoreAprovacao": 20,
  "resumoEnquadramento": "Possui imóvel no local e não atende regras de FGTS/MCMV.",
  "estimativaFinanceira": {
    "valorImovel": 300000,
    "rendaFamiliar": 4000
  }
}
\`\`\``;

  const res = interpretarTriagemCredito(textoMarkdown, { valorImovel: 300000, rendaFamiliar: 4000 });
  assert.equal(res.statusViabilidade, 'IMPEDIMENTO');
  assert.ok(res.scoreAprovacao <= 30);
  assert.equal(res.estimativaFinanceira.capacidadeParcelaMaxima, 1200); // 30% de 4.000

  // Resiliência contra null
  const resNull = interpretarTriagemCredito(null, { valorImovel: 250000, rendaFamiliar: 5000 });
  assert.equal(resNull.statusViabilidade, 'AJUSTE_ENTRADA');
  assert.equal(resNull.estimativaFinanceira.capacidadeParcelaMaxima, 1500);
});

test('ponte PRO -> PLUS: prefill transmite dados de Triagem para Correspondente / Crédito', () => {
  const dadosTriagem = {
    origem: 'triagem_pro',
    tipo: 'usado',
    valorImovel: '350000',
    renda: '9000',
    cidade: 'Uberlândia',
    uf: 'MG',
    nascimentoMaisVelho: '1985-01-01',
    fgts: '40000',
    usaFgts: true,
    entradaDinheiro: '30000',
  };

  setCreditoPrefill(dadosTriagem);
  const consumido = consumeCreditoPrefill();
  assert.equal(consumido.origem, 'triagem_pro');
  assert.equal(consumido.valorImovel, '350000');
  assert.equal(consumido.renda, '9000');
  assert.equal(consumido.fgts, '40000');
  assert.equal(consumido.cidade, 'Uberlândia');
});

test('integração PRO: Historico.jsx integra TriagemCredito com sub-abas', () => {
  const hist = ler('src/Historico.jsx');
  assert.match(hist, /import TriagemCredito from '\.\/components\/imobi\/TriagemCredito';/);
  assert.match(hist, /Triagem de Financiamento & Crédito/);
  assert.match(hist, /<TriagemCredito setAbaAtiva=\{setAbaAtiva\} \/>/);
});

test('catálogo: shared/planos.json inclui triagem_credito no PRO e sincroniza com backend', () => {
  const cat = JSON.parse(ler('shared/planos.json'));
  assert.ok(cat.modulos.essencial_plus_extra.includes('triagem_credito'), 'Falta triagem_credito em essencial_plus_extra');
  const catBack = JSON.parse(ler('functions/planos.json'));
  assert.ok(catBack.modulos.essencial_plus_extra.includes('triagem_credito'), 'Falta sincronia em functions/planos.json');
});

test('modulosMap: triagem_credito está mapeado', () => {
  const map = ler('src/modulosMap.jsx');
  assert.match(map, /import TriagemCredito from '\.\/components\/imobi\/TriagemCredito';/);
  assert.match(map, /triagem_credito:\s*TriagemCredito/);
});
