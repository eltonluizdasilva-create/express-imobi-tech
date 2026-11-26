import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CHAVE_MODO_LITE,
  PILARES_MODO_LITE,
  MODULOS_EXCLUSIVOS_PLUS,
  filtrarSecoesModoLite,
  moduloOcultoNoModoLite,
} from '../src/lib/modoLite.js';

test('1. Constantes e chaves de armazenamento do Modo Lite', () => {
  assert.equal(CHAVE_MODO_LITE, 'express_imobi_modo_lite', 'Chave no localStorage deve ser express_imobi_modo_lite');
  assert.deepEqual(PILARES_MODO_LITE, ['gratis', 'pro'], 'Modo Lite deve restringir aos pilares gratis e pro');
});

test('2. Filtragem de seções/pilares da navegação', () => {
  const secoesMock = [
    { key: 'gratis', titulo: 'Grátis', itens: [{ id: 'dashboard_imobi' }] },
    { key: 'pro', titulo: 'PRO', itens: [{ id: 'historico' }] },
    { key: 'plus', titulo: 'PLUS', itens: [{ id: 'notafiscal' }] },
    { key: 'ia', titulo: 'IA', itens: [{ id: 'sofia_whatsapp' }] },
  ];

  // Modo Completo: 100% da interface mantida
  const completas = filtrarSecoesModoLite(secoesMock, false);
  assert.equal(completas.length, 4, 'Modo Completo deve manter todas as 4 seções');
  assert.deepEqual(completas.map((s) => s.key), ['gratis', 'pro', 'plus', 'ia']);

  // Modo Lite: apenas Grátis e PRO
  const lite = filtrarSecoesModoLite(secoesMock, true);
  assert.equal(lite.length, 2, 'Modo Lite deve exibir apenas as 2 seções essenciais');
  assert.deepEqual(lite.map((s) => s.key), ['gratis', 'pro']);
  assert.ok(!lite.some((s) => s.key === 'plus'), 'PLUS deve estar oculto no Modo Lite');
  assert.ok(!lite.some((s) => s.key === 'ia'), 'IA (Pólen/Tom) deve estar oculta no Modo Lite');
});

test('3. Identificação de módulos exclusivos PLUS ocultados no Modo Lite', () => {
  const modulosOcultar = [
    'contador',
    'juridico_imobi',
    'notafiscal',
    'radar_captacao',
    'administrador',
    'roleta_imobi',
    'credito',
    'tarefa',
    'avaliacao_imovel',
    'reunioes-atas',
    'pos_venda',
  ];

  for (const id of modulosOcultar) {
    assert.ok(moduloOcultoNoModoLite(id), `Módulo PLUS '${id}' deve ser ocultado no Modo Lite`);
  }

  const modulosEssenciaisManter = [
    'dashboard_imobi',
    'funil_leads',
    'visitas_imobi',
    'financeiro',
    'meuplano',
    'captacao_imobi',
    'historico',
    'marketing',
  ];

  for (const id of modulosEssenciaisManter) {
    assert.ok(!moduloOcultoNoModoLite(id), `Módulo essencial '${id}' NÃO pode ser ocultado no Modo Lite`);
  }
});

test('4. Inspeção de código: TopbarAdmin possui alternador ao lado do tema e antes de Sair', () => {
  const topbarFonte = readFileSync(new URL('../src/components/admin/TopbarAdmin.jsx', import.meta.url), 'utf8');

  // Verifica que o alternador do Modo Lite existe no TopbarAdmin
  assert.ok(topbarFonte.includes('toggleModoLite'), 'TopbarAdmin deve receber toggleModoLite');
  assert.ok(topbarFonte.includes('modoLite'), 'TopbarAdmin deve receber modoLite');
  assert.ok(topbarFonte.includes('Modo Lite'), 'TopbarAdmin deve exibir rótulo Modo Lite');
  assert.ok(topbarFonte.includes('Modo Completo'), 'TopbarAdmin deve exibir rótulo Modo Completo');

  // Verifica ordem estrita no DOM: toggleTema -> toggleModoLite -> fazerLogout (Sair)
  const idxTema = topbarFonte.indexOf('onClick={toggleTema}');
  const idxLite = topbarFonte.indexOf('onClick={toggleModoLite}');
  const idxLogout = topbarFonte.indexOf('onClick={fazerLogout}');

  assert.ok(idxTema > 0, 'Botão de tema deve existir');
  assert.ok(idxLite > idxTema, 'Botão Modo Lite deve ficar após o botão de tema');
  assert.ok(idxLogout > idxLite, 'Botão Sair deve ficar após o botão Modo Lite');
});

test('5. Inspeção de código: AdminNovo conecta estado e persistência', () => {
  const adminFonte = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');

  assert.ok(adminFonte.includes('modoLite'), 'AdminNovo deve ter estado modoLite');
  assert.ok(adminFonte.includes('toggleModoLite'), 'AdminNovo deve ter toggleModoLite');
  assert.ok(adminFonte.includes('modoLite={modoLite}'), 'AdminNovo deve passar modoLite para os componentes filhos');
});
