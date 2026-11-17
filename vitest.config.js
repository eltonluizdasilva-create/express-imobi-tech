/**
 * Configuração do Vitest para a suíte de segurança das Firestore Rules.
 * ----------------------------------------------------------------------------
 * Arquivo separado de `vite.config.js` de propósito: o build da PWA não carrega
 * configuração de teste, e o Vitest usa esta com prioridade.
 *
 * Dois arquivos de teste, com naturezas diferentes:
 *   • tests/firestore.rules.static.test.js → só leitura do arquivo de regras.
 *     Roda sem Emulator e sem Java:
 *         npx vitest run tests/firestore.rules.static.test.js
 *   • tests/firestore.rules.test.js → fala com o Emulator. Exige:
 *         npx firebase emulators:exec --only firestore \
 *           --project demo-express-imobi "npx vitest run"
 *
 * `globals: false` é explícito: as APIs do Vitest (`describe`, `it`, `expect`)
 * precisam ser importadas em cada arquivo — nada de variável global implícita.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules/**', 'dist/**', 'functions/**', 'dashboard/**'],

    // Sem globals: `expect` etc. vêm por import (auditoria A1).
    globals: false,

    // Um arquivo por vez: o suite dinâmico faz clearFirestore + reseed em
    // beforeEach, e dois processos disputariam o mesmo emulador.
    fileParallelism: false,
    sequence: { concurrent: false },

    // Emulador frio pode levar alguns segundos para aceitar as regras.
    testTimeout: 20000,
    hookTimeout: 60000,

    passWithNoTests: false,
    reporters: ['default'],
  },
});
