/**
 * Verificações ESTÁTICAS das Firestore Rules — não tocam no Emulator.
 * ============================================================================
 * Este arquivo existe separado do suite dinâmico de propósito (auditoria A2):
 * as checagens abaixo são puramente textuais e devem poder rodar com
 *
 *     npx vitest run tests/firestore.rules.static.test.js
 *
 * sem Java, sem Emulator, sem Firestore. Se algo aqui falhar, o problema está
 * no arquivo de regras — não na preparação de dados.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RULES_RAW = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
/**
 * O arquivo está versionado com CRLF (529 linhas CRLF, 0 LF isolado).
 * Todas as análises abaixo rodam sobre esta versão normalizada: fatiar ou
 * comparar strings com `\n` num arquivo CRLF devolve vazio e transforma
 * verificação em falso positivo.
 */
const RULES_TEXT = RULES_RAW.replace(/\r\n/g, '\n');

/* --------------------------------------------------------------- utilitários */

/** Remove comentários de linha e conteúdo de strings (mantém a estrutura). */
function semComentariosEStrings(texto) {
  return texto
    .split('\n')
    .map((linha) => linha.replace(/\/\/.*$/, ''))
    .join('\n')
    .replace(/'[^'\n]*'/g, "''");
}

/** Extrai os blocos `match` de primeiro nível com suas instruções `allow`. */
function blocosDeMatch(texto) {
  const blocos = [];
  let atual = null;
  let capturando = false;
  let buffer = '';

  for (const linha of texto.split('\n')) {
    const m = linha.match(/^ {4}match (\/\S+) \{/);
    if (m) {
      atual = { caminho: m[1], allow: [] };
      blocos.push(atual);
      capturando = false;
      buffer = '';
      continue;
    }
    if (!atual) continue;

    if (!capturando && /^\s+allow\s/.test(linha)) {
      capturando = true;
      buffer = linha.trim();
    } else if (capturando) {
      buffer += ` ${linha.trim()}`;
    }
    // `allow` pode ocupar várias linhas: fecha no primeiro ';'
    if (capturando && /;\s*$/.test(linha)) {
      atual.allow.push(buffer.replace(/\s+/g, ' ').trim());
      capturando = false;
      buffer = '';
    }
  }
  return blocos;
}

const SEM_COMENTARIO = semComentariosEStrings(RULES_TEXT);
const BLOCOS = blocosDeMatch(RULES_TEXT);

/* ==========================================================================
 * 1. Integridade estrutural
 * ========================================================================== */
describe('estrutura do arquivo', () => {
  it('declara rules_version 2', () => {
    expect(RULES_TEXT.startsWith("rules_version = '2';")).toBe(true);
  });

  it('tem chaves, parênteses e colchetes balanceados', () => {
    expect(RULES_TEXT.split('{').length).toBe(RULES_TEXT.split('}').length);
    expect(RULES_TEXT.split('(').length).toBe(RULES_TEXT.split(')').length);
    expect(RULES_TEXT.split('[').length).toBe(RULES_TEXT.split(']').length);
  });

  it('não tem blocos match duplicados', () => {
    const caminhos = BLOCOS.map((b) => b.caminho);
    expect(caminhos.length).toBe(new Set(caminhos).size);
  });

  it('tem 44 blocos match', () => {
    expect(BLOCOS).toHaveLength(44);
  });

  it('não usa bindings `let` (sintaxe não verificada por compilador local)', () => {
    expect(/\blet\s+\w+\s*=/.test(SEM_COMENTARIO)).toBe(false);
  });

  it('toda função de autorização está definida e é usada', () => {
    const definidas = [...RULES_TEXT.matchAll(/function (\w+)\(/g)].map((m) => m[1]);
    expect(definidas.length).toBe(13);
    definidas.forEach((nome) => {
      const usos = (RULES_TEXT.match(new RegExp(`\\b${nome}\\(`, 'g')) || []).length;
      expect(usos, `função ${nome}: definida mas nunca chamada`).toBeGreaterThan(1);
    });
    // nomes esperados — falha se alguém adicionar/remover helper sem revisar
    expect(new Set(definidas)).toEqual(new Set([
      'authed', 'isAdminPlataforma', 'temDocUsuario', 'oficinaDoUsuario',
      'membroOficina', 'papelDoUsuario', 'papelNoTenant', 'gestorDoTenant',
      'camposComerciaisIntactos', 'planoArmazenadoEhPro', 'docPublico',
      'leadPublicoImobiValido', 'leadPublicoGenericoValido',
    ]));
  });
});

/* ==========================================================================
 * 2. Superfície pública — allowlist por operação, sem contagem frágil (A8)
 * ========================================================================== */
describe('superfície pública', () => {
  const PUBLICO_ESPERADO = [
    ['/oficinas/{oid}/os/{osId}', 'allow get: if true;'],
    ['/oficinas/{oid}/configuracoes/{docId}', 'allow get: if true;'],
    ['/acompanhamentos_publicos/{docId}', 'allow get: if true;'],
  ];

  /** Toda linha `allow ... if true;` encontrada, com o bloco a que pertence. */
  function permissoesIncondicionais() {
    return BLOCOS.flatMap((b) =>
      b.allow
        .filter((a) => /\bif true\s*;/.test(a))
        .map((a) => [b.caminho, a]),
    );
  }

  it('nenhuma criação incondicional (`allow create: if true`)', () => {
    expect(/allow create: if true/.test(RULES_TEXT)).toBe(false);
  });

  it('as únicas permissões incondicionais são as três leituras do /status e do acompanhamento', () => {
    const encontradas = permissoesIncondicionais().sort();
    expect(encontradas).toEqual([...PUBLICO_ESPERADO].sort());
  });

  it('acesso anônimo a leads é sempre condicionado a whitelist', () => {
    const blocos = BLOCOS.filter((b) => /\/leads(_imobi)?\/\{leadId\}/.test(b.caminho));
    expect(blocos.length).toBe(3);
    blocos.forEach((b) => {
      b.allow
        .filter((a) => a.startsWith('allow create'))
        .forEach((a) => expect(a, `${b.caminho}: ${a}`).toMatch(/leadPublico|allow create: if false;/));
    });
  });

  it('toda criação é limitada por algum guarda de autorização', () => {
    const GUARDAS = [
      'membroOficina', 'gestorDoTenant', 'isAdminPlataforma',
      'request.auth.uid', 'leadPublico', 'exists(',
    ];
    const criacoes = BLOCOS.flatMap((b) =>
      b.allow.filter((a) => a.startsWith('allow create')).map((a) => ({ caminho: b.caminho, a })),
    );
    expect(criacoes.length).toBeGreaterThan(10);

    const semGuarda = criacoes.filter(
      ({ a }) => !/if false;/.test(a) && !GUARDAS.some((g) => a.includes(g)),
    );
    expect(semGuarda).toEqual([]);
  });

  it('a coleção global /leads não aceita criação', () => {
    const bloco = BLOCOS.find((b) => b.caminho === '/leads/{leadId}');
    expect(bloco).toBeDefined();
    expect(bloco.allow.some((a) => /allow create: if false;/.test(a))).toBe(true);
  });

  it('eventos_lead nunca permite update nem delete', () => {
    const bloco = BLOCOS.find((b) => b.caminho === '/oficinas/{oid}/eventos_lead/{eventoId}');
    expect(bloco).toBeDefined();
    expect(bloco.allow.some((a) => /allow update, delete: if false;/.test(a))).toBe(true);
  });
});

/* ==========================================================================
 * 3. oficinas.create — todos os campos qualificados (A7)
 * ========================================================================== */
describe('oficinas.create — referências de campo', () => {
  // Extração robusta: localiza o bloco do tenant e o `allow create` seguinte,
  // em vez de casar indentação exata. Falha alto se o recorte sair vazio.
  const idxMatch = RULES_TEXT.indexOf('    match /oficinas/{oid} {');
  const idxCreate = RULES_TEXT.indexOf('allow create: if authed()', idxMatch);
  const idxUpdate = RULES_TEXT.indexOf('// Qualquer alteracao de nivelInteligencia', idxCreate);
  const blocoBruto = idxCreate > 0 && idxUpdate > idxCreate
    ? RULES_TEXT.slice(idxCreate, idxUpdate)
    : '';
  const bloco = semComentariosEStrings(blocoBruto);

  it('o bloco existe e foi isolado corretamente', () => {
    expect(idxMatch).toBeGreaterThan(0);
    expect(idxCreate).toBeGreaterThan(idxMatch);
    expect(idxUpdate).toBeGreaterThan(idxCreate);
    expect(blocoBruto.length).toBeGreaterThan(1500);
    // guarda contra falso positivo: se o recorte sair vazio, os testes de
    // símbolo abaixo passariam sem verificar nada.
    expect(blocoBruto).toContain('modulosAtivos');
    expect(blocoBruto).toContain('request.time');
  });

  // Campos e métodos que a regra usa. Qualquer ocorrência NUA (sem ponto antes)
  // é referência inválida: em Rules não existem variáveis implícitas.
  const SIMBOLOS = [
    'keys', 'size', 'get', 'hasOnly', 'hasAny', 'hasAll', 'diff', 'affectedKeys',
    'nomeOficina', 'nome', 'cidade', 'telefone', 'email', 'plano', 'uid',
    'nivelInteligencia', 'trialInicio', 'trialFim', 'ativo', 'criadoEm',
    'modulosAtivos', 'oficinaId',
  ];

  SIMBOLOS.forEach((simbolo) => {
    it(`\`${simbolo}\` nunca aparece sem qualificação`, () => {
      // [^\w.'] já rejeita ocorrências precedidas por ponto (acesso a membro);
      // strings e comentários foram removidos antes, então qualquer sobra é nua.
      const nuas = [...bloco.matchAll(new RegExp(`(^|[^\\w.'])${simbolo}\\b`, 'g'))]
        .map((m) => m[0].trim());
      expect(nuas, `referências nuas a ${simbolo}: ${JSON.stringify(nuas)}`).toHaveLength(0);
    });
  });

  it('usa request.resource.data como raiz de todas as leituras', () => {
    const leituras = [...bloco.matchAll(/request\.resource\.data(?:\.\w+|\.get\()/g)];
    expect(leituras.length).toBeGreaterThan(15);

    // `resource.data` (documento existente) não pode aparecer num bloco de create
    const totalResource = (bloco.match(/resource\.data\./g) || []).length;
    const doRequest = (bloco.match(/request\.resource\.data\./g) || []).length;
    expect(totalResource).toBe(doRequest);
  });

  it('valida o trial com request.time e duration (252h)', () => {
    // `bloco` está com strings removidas — a duração literal só existe no bruto.
    expect(bloco).toContain('request.time');
    expect(blocoBruto).toContain("duration.value(252, 'h')");
    expect(blocoBruto).toMatch(/trialFim\s*<=\s*request\.time\s*\+\s*duration\.value\(252, 'h'\)/);
  });
});
