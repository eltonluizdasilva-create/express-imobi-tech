#!/usr/bin/env node
/**
 * sync-planos.js — mantém functions/planos.json idêntico a shared/planos.json.
 *
 * shared/planos.json é a fonte única de verdade. A Cloud Function não pode
 * importar arquivos fora da pasta functions/ no deploy, por isso o arquivo é
 * copiado para lá antes de cada deploy (firebase.json → functions.predeploy).
 *
 * Uso:
 *   node scripts/sync-planos.js          # copia
 *   node scripts/sync-planos.js --check  # falha se estiverem diferentes
 */

const fs = require('fs');
const path = require('path');

const origem = path.join(__dirname, '..', 'shared', 'planos.json');
const destino = path.join(__dirname, '..', 'functions', 'planos.json');

const bruto = fs.readFileSync(origem, 'utf8');

try {
  JSON.parse(bruto);
} catch (e) {
  console.error(`[sync-planos] shared/planos.json inválido: ${e.message}`);
  process.exit(1);
}

const existe = fs.existsSync(destino);
const atual = existe ? fs.readFileSync(destino, 'utf8') : null;

if (process.argv.includes('--check')) {
  if (atual !== bruto) {
    console.error('[sync-planos] functions/planos.json desatualizado. Rode: node scripts/sync-planos.js');
    process.exit(1);
  }
  console.log('[sync-planos] ok — functions/planos.json em sincronia.');
  process.exit(0);
}

if (atual === bruto) {
  console.log('[sync-planos] já sincronizado.');
  process.exit(0);
}

fs.writeFileSync(destino, bruto, 'utf8');
console.log('[sync-planos] functions/planos.json atualizado a partir de shared/planos.json.');
