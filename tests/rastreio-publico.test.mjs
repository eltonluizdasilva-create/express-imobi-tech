import test from 'node:test';
import assert from 'node:assert/strict';

import {
  gerarCodigo,
  gerarSenha,
  docIdDe,
  linkPublico,
  sanitizarClientePrimeiroNome,
  derivarDadosRastreioCartorio,
  sincronizarAcompanhamentoCartorio,
  textoWhatsAppRastreioCartorio,
  ETAPAS_CARTORIO_CREDITO,
} from '../src/lib/acompanhamento.js';

import {
  negociacoesDemoCartorio,
  normalizarNegociacao,
} from '../src/lib/cartorioEscritura.js';

test('1. Geração de código, senha PIN e ID do documento', () => {
  const codigo = gerarCodigo('IMB');
  assert.match(codigo, /^IMB-\d{4}$/, 'Código deve seguir o padrão IMB-XXXX');

  const senha = gerarSenha();
  assert.match(senha, /^\d{4}$/, 'Senha PIN deve conter exatamente 4 dígitos');

  const docId = docIdDe(codigo, senha);
  assert.equal(docId, `${codigo}_${senha}`, 'ID do documento deve ser CODIGO_SENHA');

  const link = linkPublico('IMB-4092', '4092');
  assert.ok(link.includes('/acompanhar?c=IMB-4092&s=4092'), 'Link público deve conter os parâmetros c e s');
});

test('2. Sanitização de nome para estrita privacidade e conformidade com LGPD', () => {
  assert.equal(sanitizarClientePrimeiroNome('Marcelo Vasconcelos'), 'Marcelo');
  assert.equal(sanitizarClientePrimeiroNome('Fernanda Ribeiro da Silva'), 'Fernanda');
  assert.equal(sanitizarClientePrimeiroNome('  Rodrigo  Almeida '), 'Rodrigo');
  assert.equal(sanitizarClientePrimeiroNome(''), 'Cliente');
  assert.equal(sanitizarClientePrimeiroNome(null), 'Cliente');
});

test('3. Contrato de Segurança Firestore: chaves obrigatórias e ausência de dados sensíveis', () => {
  const mockNegociacao = {
    id: 'neg_123',
    codigoImovel: 'IMB-9988',
    codigoRastreio: 'IMB-9988',
    senhaRastreio: '9988',
    imovelTitulo: 'Apartamento Jardins 110 m²',
    comprador: 'Marcelo Vasconcelos',
    cpfComprador: '123.456.789-00', // dado sensível
    rgComprador: 'MG-12.345.678', // dado sensível
    vendedor: 'Carlos Eduardo Mendes',
    comissaoCorretor: 25000, // dado financeiro confidencial
    valorRepasseBruto: 750000, // dado financeiro confidencial
    certidoes: {},
    escritura: {},
  };

  const payload = derivarDadosRastreioCartorio(mockNegociacao, {
    tenantId: 'oficina_abc',
    tenantNome: 'Imobiliária Prime',
  });

  // Validação das chaves exigidas pelas regras do Firestore: keys().hasAll(['codigo', 'senha', 'tenantId'])
  assert.ok(payload.codigo, 'Deve ter código');
  assert.ok(payload.senha, 'Deve ter senha');
  assert.ok(payload.tenantId, 'Deve ter tenantId');
  assert.equal(payload.codigo, 'IMB-9988');
  assert.equal(payload.senha, '9988');
  assert.equal(payload.tenantId, 'oficina_abc');

  // Privacidade: apenas primeiro nome
  assert.equal(payload.cliente, 'Marcelo', 'Cliente deve exibir apenas o primeiro nome');

  // Proteção contra vazamento de dados confidenciais
  assert.equal(payload.cpfComprador, undefined, 'CPF não pode estar no payload público');
  assert.equal(payload.rgComprador, undefined, 'RG não pode estar no payload público');
  assert.equal(payload.comissaoCorretor, undefined, 'Comissão não pode estar no payload público');
  assert.equal(payload.valorRepasseBruto, undefined, 'Valor do repasse não pode estar no payload público');
});

test('4. Derivação e cálculo determinístico das etapas na esteira', () => {
  // Cenário A: Tudo pendente
  const negPendente = normalizarNegociacao({
    codigoImovel: 'IMB-1001',
    comprador: 'Lucas Silva',
  });
  const resPendente = derivarDadosRastreioCartorio(negPendente);
  assert.equal(resPendente.concluidas.length, 0, 'Nenhuma etapa deve estar concluída');
  assert.equal(resPendente.status, 'em_andamento');

  // Cenário B: Certidões concluídas (Etapa 0)
  const certidoesEmitidas = {};
  for (const c of ['matricula', 'cnd_trabalhista', 'cnd_federal', 'cnd_estadual', 'cnd_municipal', 'onus_reais', 'condominio_iptu']) {
    certidoesEmitidas[c] = { status: 'emitida' };
  }

  const negEtapa1Pronta = normalizarNegociacao({
    codigoImovel: 'IMB-1002',
    comprador: 'Ana Beatriz',
    certidoes: certidoesEmitidas,
  });
  const resEtapa1 = derivarDadosRastreioCartorio(negEtapa1Pronta);
  assert.ok(resEtapa1.concluidas.includes(0), 'Etapa 0 (Certidões) deve estar concluída');
  assert.ok(!resEtapa1.concluidas.includes(1), 'Etapa 1 não deve estar concluída ainda');

  // Cenário C: ITBI e Protocolo no RGI concluídos (Etapa 1)
  const negEtapa2Pronta = normalizarNegociacao({
    codigoImovel: 'IMB-1003',
    comprador: 'Carla Dias',
    certidoes: certidoesEmitidas,
    escritura: {
      itbi_pago: { status: 'emitida' },
      escritura: { status: 'emitida' },
      registro_protocolo: { status: 'emitida', protocolo: 'RGI-2026-999' },
    },
  });
  const resEtapa2 = derivarDadosRastreioCartorio(negEtapa2Pronta);
  assert.ok(resEtapa2.concluidas.includes(0), 'Etapa 0 concluída');
  assert.ok(resEtapa2.concluidas.includes(1), 'Etapa 1 (Impostos & RGI) concluída');
  assert.equal(resEtapa2.detalhesEtapas[1].protocoloRgi, 'RGI-2026-999');

  // Cenário D: Registro Concluído e Repasse liberado (Etapa 2 e processo finalizado)
  const negFinalizada = normalizarNegociacao({
    codigoImovel: 'IMB-1004',
    comprador: 'Roberto Justus',
    certidoes: certidoesEmitidas,
    escritura: {
      itbi_pago: { status: 'emitida' },
      escritura: { status: 'emitida' },
      registro_protocolo: { status: 'emitida', protocolo: 'RGI-2026-999' },
      registro_concluido: { status: 'emitida' },
    },
    liberadoRepasse: true,
  });
  const resFinal = derivarDadosRastreioCartorio(negFinalizada);
  assert.equal(resFinal.concluidas.length, 3, 'Todas as 3 etapas devem estar concluídas');
  assert.equal(resFinal.status, 'concluido');
});

test('5. Geração de texto para WhatsApp do cliente com link seguro', () => {
  const neg = {
    codigoImovel: 'IMB-4092',
    codigoRastreio: 'IMB-4092',
    senhaRastreio: '4092',
    imovelTitulo: 'Apartamento Jardins 110 m²',
    comprador: 'Fernanda Ribeiro',
  };

  const texto = textoWhatsAppRastreioCartorio(neg, {
    nomeImobiliaria: 'Horizonte Imóveis',
  });

  assert.ok(texto.includes('Olá, Fernanda!'), 'Deve saudar pelo primeiro nome');
  assert.ok(texto.includes('Horizonte Imóveis'), 'Deve citar o nome da imobiliária');
  assert.ok(texto.includes('Apartamento Jardins 110 m²'), 'Deve citar o imóvel');
  assert.ok(texto.includes('IMB-4092'), 'Deve conter o código de rastreio');
  assert.ok(texto.includes('4092'), 'Deve conter a senha PIN');
  assert.ok(texto.includes('/acompanhar?c=IMB-4092&s=4092'), 'Deve conter o link público direto');
});

test('6. Sincronização e compatibilidade com cenários de demonstração', async () => {
  const demos = negociacoesDemoCartorio();
  assert.equal(demos.length, 3, 'Devem existir 3 negociações de demonstração');

  for (const d of demos) {
    assert.ok(d.codigoRastreio, `Demo ${d.id} deve ter codigoRastreio`);
    assert.ok(d.senhaRastreio, `Demo ${d.id} deve ter senhaRastreio`);

    const sincronizado = await sincronizarAcompanhamentoCartorio(null, {
      negociacao: d,
      tenantId: 'demo_tenant',
      tenantNome: 'Express Imobi Tech',
    });

    assert.equal(sincronizado.ok, true);
    assert.equal(sincronizado.codigo, d.codigoRastreio);
    assert.equal(sincronizado.senha, d.senhaRastreio);
    assert.ok(sincronizado.link.includes(`/acompanhar?c=${d.codigoRastreio}&s=${d.senhaRastreio}`));
  }
});
