#!/usr/bin/env node
/**
 * install-hooks.mjs — ativa os hooks versionados em .githooks/
 * Uso: npm run brain:hooks  (ou node scripts/install-hooks.mjs)
 */
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hook = join(raiz, '.githooks', 'post-commit');

if (!existsSync(hook)) {
  console.error('✖ .githooks/post-commit não existe');
  process.exit(1);
}

try {
  chmodSync(hook, 0o755);
} catch {
  /* Windows: o bit de execução não é obrigatório para o git for Windows */
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: raiz, stdio: 'inherit' });
console.log('✓ hooks ativos: core.hooksPath = .githooks');
console.log('  post-commit → npm run brain:push quando company-brain/ mudar');
