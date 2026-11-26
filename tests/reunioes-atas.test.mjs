/**
 * Reuniões & Atas IA (D-23.27) — módulo `reunioes-atas`.
 * ============================================================================
 * Garante a ligação ponta a ponta sem depender de navegador:
 *   1. catálogo (`shared/planos.json`) e cópia do backend em sincronia;
 *   2. Sidebar, guarda de aba, pilar do topo e trilho com a MESMA regra de
 *      acesso (PLUS · IA Tom · Admin Total);
 *   3. copy (DOR/GANHO), manual e cor da aba publicados;
 *   4. Firestore Rules aceitando o id do módulo no onboarding.
 * ============================================================================
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DOR_SOLUCAO } from '../src/lib/copyAbas.js';
import { MANUAL_ABAS } from '../src/lib/manualAbas.js';
import { CORES_ABAS, corDaAba } from '../src/lib/coresAbas.js';

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8');
const admin = ler('src/AdminNovo.jsx');
const sidebar = ler('src/components/admin/SidebarAdmin.jsx');
const regras = ler('firestore.rules');
const catalogo = JSON.parse(ler('shared/planos.json'));
const catalogoBackend = ler('functions/planos.json');

test('catálogo: reunioes-atas é exclusivo do PLUS e aparece na descrição comercial', () => {
  const { modulos } = catalogo;
  assert.ok(modulos.plus_extra.includes('reunioes-atas'), 'plus_extra sem reunioes-atas');
  for (const grupo of ['gratis', 'essencial_plus_extra', 'profissional_extra', 'esquadrao_extra']) {
    assert.ok(!modulos[grupo].includes('reunioes-atas'), `reunioes-atas vazou para ${grupo}`);
  }
  const planoPlus = catalogo.planos.find((plano) => plano.key === 'plus');
  assert.ok(
    planoPlus.recursos.some((recurso) => recurso.texto.includes('Reuniões & Atas IA')),
    'PLUS não anuncia o módulo nos recursos',
  );
});

test('functions/planos.json é cópia byte a byte do catálogo compartilhado', () => {
  assert.equal(catalogoBackend, ler('shared/planos.json'));
});

test('AdminNovo: importa, renderiza e trata a aba como nativa', () => {
  assert.match(admin, /import ReunioesAtasIA from '\.\/components\/abas\/ReunioesAtasIA';/);
  assert.match(admin, /\{abaAtiva === 'reunioes-atas' && \(/);
  assert.match(admin, /<ReunioesAtasIA \/>/);
  const listaNativas = admin.slice(
    admin.indexOf('const ABAS_NATIVAS_IMOBI = ['),
    admin.indexOf('];', admin.indexOf('const ABAS_NATIVAS_IMOBI = [')),
  );
  assert.ok(listaNativas.includes("'reunioes-atas'"), 'aba não é nativa (renderizaria duas vezes)');
  assert.equal(
    (admin.match(/<ReunioesAtasIA \/>/g) || []).length,
    1,
    'a aba precisa de um único ponto de render (um segundo monta o componente duas vezes)',
  );
});

test('acesso: PLUS ou IA Tom ou Admin Total; o resto volta para Meu Plano', () => {
  // Guarda de aba (link direto/estado antigo).
  assert.match(
    admin,
    /if \(abaAtiva === 'reunioes-atas'\) \{\s*if \(!acessoPlusLiberado && !brainLiberado && !ehAdminTotal\) \{\s*setAbaAtiva\('meuplano'\);/,
  );
  // `brainLiberado` continua sendo Admin Total ou contratação da IA Tom.
  assert.match(admin, /const brainLiberado = Boolean\(ehAdminTotal \|\| temExpressBrain\(contaAcesso\)\);/);
  // Item da Sidebar usa exatamente a mesma condição de cadeado.
  assert.match(
    sidebar,
    /id: 'reunioes-atas',[\s\S]*?bloqueado: !acessoPlusLiberado && !brainLiberado && !ehAdminTotal,/,
  );
  // AdminNovo precisa repassar o estado da IA Tom para a Sidebar.
  assert.match(admin, /<SidebarAdmin[\s\S]*?brainLiberado=\{brainLiberado\}/);
  assert.match(sidebar, /brainLiberado = false,/, 'Sidebar sem a prop brainLiberado');
});

test('trilho e pilar do topo tratam o módulo como PLUS (com cadeado coerente)', () => {
  const inicio = admin.indexOf('const itensTrilhoPlus =');
  const bloco = admin.slice(inicio, admin.indexOf('];', inicio));
  assert.match(bloco, /id: 'reunioes-atas'[\s\S]*?bloqueado: bloqueioPlusAtivo && !brainLiberado/);
  assert.match(
    admin,
    /\['radar_captacao', 'administrador', 'roleta_imobi', 'credito', 'notafiscal', 'reunioes-atas'\]/,
  );
  assert.match(admin, /LABELS_ABAS_IMOBI\['reunioes-atas'\] = 'Reuniões & Atas IA';/);
  assert.match(admin, /MAPA_DETALHES_ABAS\['reunioes-atas'\] = \{/);
});

test('Sidebar: pilar PLUS anuncia 5 módulos com o microfone', () => {
  assert.match(sidebar, /descricaoGrupo: '5 módulos estratégicos/);
  assert.match(sidebar, /id: 'reunioes-atas',\s*icone: '🎙️',\s*label: 'Reuniões & Atas IA',/);
});

test('copy, manual e cor da aba existem', () => {
  const copy = DOR_SOLUCAO['reunioes-atas'];
  assert.ok(copy, 'copyAbas sem a aba');
  assert.ok(copy.dor.length <= 95 && copy.ganho.length <= 120);
  assert.match(copy.dor, /Reunião sem ata vira promessa esquecida/);

  const manual = MANUAL_ABAS['reunioes-atas'];
  assert.ok(manual, 'manualAbas sem a aba');
  assert.equal(manual.passos.length, 3);
  assert.ok(manual.passos.every((passo) => passo.trim().length > 20));

  assert.ok(CORES_ABAS['reunioes-atas'], 'coresAbas sem a aba');
  assert.equal(corDaAba('reunioes-atas'), CORES_ABAS['reunioes-atas'].cor);
});

test('Firestore Rules aceitam o id no onboarding (modulosAtivos)', () => {
  assert.match(regras, /'contador', 'juridico_imobi', 'reunioes-atas'/);
});
