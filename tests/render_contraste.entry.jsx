/**
 * tests/render_contraste.entry.jsx — harness de contraste do modo claro.
 *
 * Renderiza as telas reais (SSR) dentro de um HTML com `html.tema-claro` +
 * o CSS do build (`dist/assets/index-*.css`). O runner gera
 * `tests/.contraste.html`; a medição roda no navegador (getComputedStyle).
 *
 * Motivo: D-21.11 mostrou que inspeção de classe não prova contraste. Aqui o
 * CSS real é aplicado e a cor computada é a que o usuário vê.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import ExpressBrainTab from '../src/components/admin/ExpressBrainTab.jsx';
import SofiaWhatsAppTab from '../src/components/admin/SofiaWhatsAppTab.jsx';
import Secretaria from '../src/components/Secretaria.jsx';

const raiz = process.cwd();
const dirCss = path.join(raiz, 'dist', 'assets');
const arquivoCss = readdirSync(dirCss)
  .filter((f) => f.startsWith('index-') && f.endsWith('.css'))
  .sort()
  .pop();

if (!arquivoCss) {
  console.error('CSS do build não encontrado — rode `npm run build` antes.');
  process.exit(1);
}

const css = readFileSync(path.join(dirCss, arquivoCss), 'utf8');

// localStorage mínimo: limiteDemo/onboarding leem no render.
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
};

const brain = renderToStaticMarkup(
  React.createElement(ExpressBrainTab, {
    liberado: false,
    sofiaContratada: false,
    setAbaAtiva: () => {},
    dadosOficina: { nomeOficina: 'Imobiliária Horizonte' },
    contextoOperacao: {},
  })
);

const brainLiberado = renderToStaticMarkup(
  React.createElement(ExpressBrainTab, {
    liberado: true,
    sofiaContratada: true,
    setAbaAtiva: () => {},
    dadosOficina: { nomeOficina: 'Imobiliária Horizonte' },
    contextoOperacao: { imoveis: 14, corretores: 4, leads: 23 },
  })
);

const sofiaTab = renderToStaticMarkup(
  React.createElement(SofiaWhatsAppTab, {
    abaInicial: 'whatsapp_hub',
    liberado: false,
    onAbrirPlanos: () => {},
    onAbrirCopiloto: () => {},
    childrenMap: {
      whatsapp_hub: React.createElement('div', { className: 'text-xs text-slate-400' }, 'Conexão WhatsApp (stub)'),
      secretaria: null,
    },
  })
);

const secretaria = renderToStaticMarkup(
  React.createElement(Secretaria, {
    isPro: true,
    abaAtiva: 'secretaria',
    setAbaAtiva: () => {},
    oficinaId: 'OFICINA_TESTE',
    dadosOficina: { nome: 'Imobiliária Horizonte' },
    dadosImobiliaria: { nome: 'Imobiliária Horizonte' },
  })
);

const html = `<!doctype html>
<html lang="pt-BR" class="tema-claro">
<head>
<meta charset="utf-8" />
<title>contraste — modo claro</title>
<style>${css}</style>
</head>
<body class="tema-claro">
  <div data-comp="brain-bloqueado" class="p-6">${brain}</div>
  <div data-comp="brain-liberado" class="p-6">${brainLiberado}</div>
  <div data-comp="sofia-tab" class="p-6">${sofiaTab}</div>
  <div data-comp="secretaria" class="p-6">${secretaria}</div>
</body>
</html>`;

writeFileSync(path.join(raiz, 'tests', '.contraste.html'), html, 'utf8');
console.log(`HTML gerado com ${arquivoCss} (${(css.length / 1024).toFixed(0)} kB de CSS)`);
console.log(`brain=${brain.length} chars, sofiaTab=${sofiaTab.length}, secretaria=${secretaria.length}`);
