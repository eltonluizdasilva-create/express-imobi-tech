import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  SYSTEM_PROMPT_POS_VENDA,
  montarPromptUsuarioPosVenda,
  interpretarPosVenda,
} from '../src/agent/posVendaCarteiraPrompt.js';

test('prompt: SYSTEM_PROMPT_POS_VENDA orienta 30 dias, 6 meses, 1 ano e integração com Pólen/Zara', () => {
  assert.ok(typeof SYSTEM_PROMPT_POS_VENDA === 'string' && SYSTEM_PROMPT_POS_VENDA.length > 200);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /Pós-Venda/i);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /30 DIAS|30 dias/);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /6 MESES|6 meses/);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /1 ANO|1 ano/);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /Pólen/i);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /Zara/i);
  assert.match(SYSTEM_PROMPT_POS_VENDA, /JSON/);
});

test('montarPromptUsuarioPosVenda: formata dados da venda, cliente, corretor e marco', () => {
  const prompt = montarPromptUsuarioPosVenda({
    clienteNome: 'Mariana Duarte',
    clienteTelefone: '11988887777',
    imovelTitulo: 'Apartamento Jardins 3 Suítes',
    valorVenda: 1450000,
    dataFechamento: '2024-05-10',
    corretorNome: 'Bruno Lima',
    marco: '30_dias',
    observacoes: 'Cliente elogiou a vista e solicitou indicação de marceneiro',
  });

  assert.match(prompt, /Mariana Duarte/);
  assert.match(prompt, /Apartamento Jardins 3 Suítes/);
  assert.match(prompt, /Bruno Lima/);
  assert.match(prompt, /30_dias|30 dias/i);
  assert.match(prompt, /marceneiro/);
});

test('interpretarPosVenda: parser de JSON válido estruturado', () => {
  const jsonMock = JSON.stringify({
    marco: '30_dias',
    statusMarco: 'Dentro do prazo',
    diagnosticoRelacionamento: 'Período ideal para validar mudança e pedir indicações naturais.',
    mensagemPersonalizada: 'Oi Mariana! Como foi o primeiro mês no apê novo?',
    acaoSugerida: 'Disparo via WhatsApp pessoal do corretor ou Pólen 24h',
    canalRecomendado: 'WhatsApp',
    gatilhos: ['Validação de mudança', 'Pedido de indicação leve'],
    proximosPassos: ['Confirmar entrega de chaves', 'Registrar retorno'],
  });

  const res = interpretarPosVenda(jsonMock);
  assert.equal(res.marco, '30_dias');
  assert.equal(res.statusMarco, 'Dentro do prazo');
  assert.match(res.mensagemPersonalizada, /Oi Mariana/);
  assert.equal(res.canalRecomendado, 'WhatsApp');
  assert.equal(res.gatilhos.length, 2);
});

test('interpretarPosVenda: extrai JSON encapsulado em markdown com segurança', () => {
  const textoMarkdown = `Aqui está a resposta gerada:
\`\`\`json
{
  "marco": "6_meses",
  "statusMarco": "Vencendo hoje",
  "diagnosticoRelacionamento": "Momento propício para presentear e pedir indicações de amigos.",
  "mensagemPersonalizada": "Olá! Já são 6 meses de casa nova. Tudo em ordem por aí?",
  "acaoSugerida": "Disparo pela Zara às 08:00 com cópia ao corretor",
  "canalRecomendado": "Zara 08:00",
  "gatilhos": ["Pesquisa de satisfação", "Indicação premiada"],
  "proximosPassos": ["Agendar lembrete anual"]
}
\`\`\``;

  const res = interpretarPosVenda(textoMarkdown);
  assert.equal(res.marco, '6_meses');
  assert.match(res.mensagemPersonalizada, /6 meses/);
  assert.equal(res.canalRecomendado, 'Zara 08:00');
  assert.ok(res.gatilhos.length >= 1);
});

test('interpretarPosVenda: resiliência para entradas inválidas ou nulas', () => {
  const resInvalido = interpretarPosVenda('texto quebrado sem json');
  assert.equal(resInvalido.marco, '30_dias');
  assert.ok(typeof resInvalido.mensagemPersonalizada === 'string');
  assert.ok(resInvalido.mensagemPersonalizada.length > 0);
  assert.ok(Array.isArray(resInvalido.gatilhos));

  const resNulo = interpretarPosVenda(null);
  assert.equal(resNulo.marco, '30_dias');
  assert.ok(typeof resNulo.mensagemPersonalizada === 'string');
});

test('catálogo: shared/planos.json inclui pos_venda no PLUS e sincroniza com backend', () => {
  const cat = JSON.parse(readFileSync(new URL('../shared/planos.json', import.meta.url), 'utf8'));
  const catBack = JSON.parse(readFileSync(new URL('../functions/planos.json', import.meta.url), 'utf8'));

  assert.ok(cat.modulos.plus_extra.includes('pos_venda'), 'Falta pos_venda em plus_extra');
  assert.ok(catBack.modulos.plus_extra.includes('pos_venda'), 'Falta sincronia em functions/planos.json');
});

test('modulosMap: pos_venda está mapeado para componente PosVendaCarteira', () => {
  const fonte = readFileSync(new URL('../src/modulosMap.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /import PosVendaCarteira from '\.\/components\/imobi\/PosVendaCarteira';/);
  assert.match(fonte, /pos_venda:\s*PosVendaCarteira/);
});

test('SidebarAdmin: inclui pos_venda com ícone KeyRound no pilar PLUS', () => {
  const fonte = readFileSync(new URL('../src/components/admin/SidebarAdmin.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /KeyRound/);
  assert.match(fonte, /id:\s*'pos_venda'/);
  assert.match(fonte, /label:\s*'Pós-Venda, Chaves & Carteira'/);
});

test('AdminNovo: mapeia pos_venda no trilho PLUS, pilar ativo e labels', () => {
  const fonte = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /MAPA_DETALHES_ABAS\.pos_venda = \{/);
  assert.match(fonte, /LABELS_ABAS_IMOBI\.pos_venda = 'Pós-Venda, Chaves & Carteira';/);
  assert.match(fonte, /'pos_venda'\.includes\(abaAtiva\)|'pos_venda',/);
  assert.match(fonte, /id:\s*'pos_venda',[\s\S]*?tabId:\s*'pos_venda',[\s\S]*?bloqueado:\s*bloqueioPlusAtivo/);
});

test('PosVendaCarteira: interface possui linha do tempo, marcos de relacionamento e ações de IA', () => {
  const fonte = readFileSync(new URL('../src/components/imobi/PosVendaCarteira.jsx', import.meta.url), 'utf8');
  // 4 etapas de pós-fechamento
  assert.match(fonte, /contrato/i);
  assert.match(fonte, /cartorio/i);
  assert.match(fonte, /chaves/i);
  assert.match(fonte, /utilidades/i);
  // 3 marcos
  assert.match(fonte, /30_dias/);
  assert.match(fonte, /6_meses/);
  assert.match(fonte, /1_ano/);
  // Agentes Pólen e Zara
  assert.match(fonte, /Pólen/i);
  assert.match(fonte, /Zara/i);
  assert.match(fonte, /WhatsApp/i);
});
