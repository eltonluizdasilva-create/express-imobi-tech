import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MODALIDADES_VISTORIA,
  STATUS_CHECKLIST,
  AMBIENTES_PADRAO,
  gerarChecklistInicial,
  calcularResumoChecklist,
  gerarTextoWhatsAppVistoria,
  validarVistoria,
} from '../src/lib/vistoriaChaves.js';

import {
  vistoriasDemoChaves,
  obterCenarioVistoriasDemo,
} from '../src/lib/cenarioDemo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Vistoria de Entrega de Chaves & Laudo Digital — Motor Determinístico', () => {
  test('exporta as 3 modalidades obrigatórias de vistoria', () => {
    assert.equal(MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA, 'Entrega de Chaves — Venda');
    assert.equal(MODALIDADES_VISTORIA.ENTRADA_LOCACAO, 'Vistoria de Entrada — Locação');
    assert.equal(MODALIDADES_VISTORIA.SAIDA_LOCACAO, 'Vistoria de Saída — Locação');
  });

  test('exporta status de checklist padronizados', () => {
    assert.equal(STATUS_CHECKLIST.APROVADO, 'Aprovado');
    assert.equal(STATUS_CHECKLIST.COM_RESSALVA, 'Com Ressalva');
    assert.equal(STATUS_CHECKLIST.REPARO_PENDENTE, 'Reparo Pendente');
  });

  test('define exatamente 7 ambientes críticos padronizados', () => {
    assert.equal(AMBIENTES_PADRAO.length, 7);
    assert.ok(AMBIENTES_PADRAO.includes('Sala & Estar'));
    assert.ok(AMBIENTES_PADRAO.includes('Cozinha & Área de Serviço'));
    assert.ok(AMBIENTES_PADRAO.includes('Quartos & Suítes'));
    assert.ok(AMBIENTES_PADRAO.includes('Banheiros'));
    assert.ok(AMBIENTES_PADRAO.includes('Parte Elétrica & Quadro'));
    assert.ok(AMBIENTES_PADRAO.includes('Hidráulica & Registros'));
    assert.ok(AMBIENTES_PADRAO.includes('Esquadrias, Portas & Fechaduras'));
  });

  test('gerarChecklistInicial cria 7 itens com status Aprovado', () => {
    const lista = gerarChecklistInicial();
    assert.equal(lista.length, 7);
    lista.forEach((item, idx) => {
      assert.equal(item.ambiente, AMBIENTES_PADRAO[idx]);
      assert.equal(item.status, STATUS_CHECKLIST.APROVADO);
      assert.equal(item.observacao, '');
    });
  });

  test('calcularResumoChecklist calcula corretamente 100% de aprovação', () => {
    const lista = gerarChecklistInicial();
    const resumo = calcularResumoChecklist(lista);
    assert.equal(resumo.total, 7);
    assert.equal(resumo.aprovados, 7);
    assert.equal(resumo.ressalvas, 0);
    assert.equal(resumo.pendentes, 0);
    assert.equal(resumo.percentualAprovado, 100);
    assert.equal(resumo.is100PorcentoAprovado, true);
    assert.equal(resumo.itensComRessalva.length, 0);
  });

  test('calcularResumoChecklist calcula ressalvas e reparos pendentes', () => {
    const lista = gerarChecklistInicial();
    lista[0].status = STATUS_CHECKLIST.COM_RESSALVA;
    lista[0].observacao = 'Pequeno risco na porta';
    lista[3].status = STATUS_CHECKLIST.REPARO_PENDENTE;
    lista[3].observacao = 'Vazamento no sifão';

    const resumo = calcularResumoChecklist(lista);
    assert.equal(resumo.total, 7);
    assert.equal(resumo.aprovados, 5);
    assert.equal(resumo.ressalvas, 1);
    assert.equal(resumo.pendentes, 1);
    assert.equal(resumo.percentualAprovado, 71); // 5/7 = 71.4% -> 71%
    assert.equal(resumo.is100PorcentoAprovado, false);
    assert.equal(resumo.itensComRessalva.length, 2);
    assert.equal(resumo.itensComRessalva[0].ambiente, 'Sala & Estar');
    assert.equal(resumo.itensComRessalva[1].ambiente, 'Banheiros');
  });

  test('calcularResumoChecklist lida seguramente com lista vazia', () => {
    const resumo = calcularResumoChecklist([]);
    assert.equal(resumo.total, 0);
    assert.equal(resumo.percentualAprovado, 0);
    assert.equal(resumo.is100PorcentoAprovado, false);
  });

  test('validarVistoria exige título do imóvel e cliente', () => {
    const invalido1 = validarVistoria({});
    assert.equal(invalido1.valido, false);
    assert.ok(invalido1.erros.length >= 2);

    const invalido2 = validarVistoria({ imovelTitulo: 'Casa 1' });
    assert.equal(invalido2.valido, false);

    const valido = validarVistoria({ imovelTitulo: 'Casa 1', nomeCliente: 'Maria Silva' });
    assert.equal(valido.valido, true);
    assert.equal(valido.erros.length, 0);
  });

  test('gerarTextoWhatsAppVistoria formata mensagem completa com medidores e ressalvas', () => {
    const vistoria = {
      modalidade: MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA,
      codigoImovel: 'IMB-3041',
      imovelTitulo: 'Apartamento 3 Suítes — Residencial Jardins',
      endereco: 'Rua das Palmeiras, 450',
      nomeCliente: 'Marcelo Vasconcelos',
      corretor: 'Rodrigo Almeida',
      dataVistoria: '26/11/2026',
      qtdChaves: 4,
      qtdControles: 2,
      qtdTags: 3,
      medidores: {
        energiaNumero: 'MED-784912',
        energiaLeitura: '14280',
        aguaNumero: 'HID-33019',
        aguaLeitura: '318',
        gasNumero: 'GAS-99120',
        gasLeitura: '104',
      },
      checklist: [
        { id: '1', ambiente: 'Sala & Estar', status: 'Aprovado', observacao: '' },
        { id: '2', ambiente: 'Banheiros', status: 'Reparo Pendente', observacao: 'Trocar reparo da torneira' },
      ],
    };

    const texto = gerarTextoWhatsAppVistoria(vistoria);
    assert.ok(texto.includes('LAUDO DE VISTORIA & ENTREGA — EXPRESS IMOBI TECH'));
    assert.ok(texto.includes('Apartamento 3 Suítes — Residencial Jardins (IMB-3041)'));
    assert.ok(texto.includes('Marcelo Vasconcelos'));
    assert.ok(texto.includes('Rodrigo Almeida'));
    assert.ok(texto.includes('Chaves físicas: 4 unidade(s)'));
    assert.ok(texto.includes('Controles de portão/garagem: 2 unidade(s)'));
    assert.ok(texto.includes('Tags de proximidade / Senhas: 3 unidade(s)'));
    assert.ok(texto.includes('Medidor nº MED-784912 | Leitura: 14280 kWh'));
    assert.ok(texto.includes('Hidrômetro nº HID-33019 | Leitura: 318 m³'));
    assert.ok(texto.includes('Relógio nº GAS-99120 | Leitura: 104 m³'));
    assert.ok(texto.includes('[REPARO PENDENTE]: Trocar reparo da torneira'));
  });
});

describe('Modo Demonstração & Cenário Demo de Vistorias', () => {
  test('vistoriasDemoChaves contém 2 laudos realistas com medidores e 7 ambientes', () => {
    assert.ok(Array.isArray(vistoriasDemoChaves));
    assert.equal(vistoriasDemoChaves.length, 2);

    const demo1 = vistoriasDemoChaves[0];
    assert.equal(demo1.id, 'vistoria_demo_1');
    assert.equal(demo1.modalidade, MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA);
    assert.equal(demo1.checklist.length, 7);
    assert.ok(demo1.medidores.energiaLeitura);
    assert.ok(demo1.medidores.aguaLeitura);
    const r1 = calcularResumoChecklist(demo1.checklist);
    assert.equal(r1.percentualAprovado, 100);

    const demo2 = vistoriasDemoChaves[1];
    assert.equal(demo2.id, 'vistoria_demo_2');
    assert.equal(demo2.modalidade, MODALIDADES_VISTORIA.ENTRADA_LOCACAO);
    assert.equal(demo2.checklist.length, 7);
    const r2 = calcularResumoChecklist(demo2.checklist);
    assert.ok(r2.ressalvas > 0 || r2.pendentes > 0);
  });

  test('obterCenarioVistoriasDemo retorna o array de vistorias demo', () => {
    const lista = obterCenarioVistoriasDemo();
    assert.equal(lista.length, 2);
    assert.equal(lista[0].id, 'vistoria_demo_1');
  });
});

describe('Integração de Arquitetura, Regras e UI', () => {
  test('firestore.rules inclui vistorias_chaves em subcolecaoOperacional', () => {
    const rulesPath = path.join(ROOT, 'firestore.rules');
    const content = fs.readFileSync(rulesPath, 'utf-8');
    assert.ok(content.includes("'vistorias_chaves'"), "firestore.rules deve conter 'vistorias_chaves'");
  });

  test('Historico.jsx integra sub-aba vistoria e componente VistoriaEntregaChaves', () => {
    const historicoPath = path.join(ROOT, 'src', 'Historico.jsx');
    const content = fs.readFileSync(historicoPath, 'utf-8');
    assert.ok(content.includes('VistoriaEntregaChaves'), 'Historico.jsx deve importar VistoriaEntregaChaves');
    assert.ok(content.includes("subAba === 'vistoria'"), 'Historico.jsx deve renderizar condição de subAba vistoria');
    assert.ok(content.includes("setSubAba('vistoria')"), 'Historico.jsx deve ter acionador de subAba vistoria');
  });

  test('company-brain/05-decisoes-ativas.md registra a decisão D-23.33', () => {
    const brainPath = path.join(ROOT, 'company-brain', '05-decisoes-ativas.md');
    const content = fs.readFileSync(brainPath, 'utf-8');
    assert.ok(content.includes('D-23.33'), '05-decisoes-ativas.md deve conter D-23.33');
    assert.ok(content.includes('Vistoria de Entrega de Chaves & Laudo Digital'));
  });
});
