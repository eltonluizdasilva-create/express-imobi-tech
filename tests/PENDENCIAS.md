# Pendências, riscos e decisões — Firestore Rules

Documento separado da suíte de propósito: os testes afirmam o **comportamento
atual** das regras. Onde esse comportamento é um risco conhecido, ele aparece
aqui — em vez de o teste ser "ajustado" para parecer seguro.

Estado: **nenhum teste foi executado ainda**. JDK 21 (Temurin 21.0.13) está
instalado e acessível pela sessão; faltam `vitest` e
`@firebase/rules-unit-testing` (não instalados, não declarados no `package.json`).

---

## 0. Estruturas REAIS vs. HIPOTÉTICAS (auditoria A4/A10)

Os testes usam dois tipos de fixture. A distinção importa: um teste verde sobre
uma estrutura hipotética prova que **a regra** funciona — não que **o produto**
se comporta assim.

| Fixture | Classificação | Evidência no código |
|---|---|---|
| `usuarios/{uid}` com `oficinaId` + `papel: 'dono'` | **REAL** | `Cadastro.jsx:66-79` grava exatamente isso |
| `oficinas/{oid}` com `plano: 'GRATUITO'`, `nivelInteligencia: 'padrao'` | **REAL** | `Cadastro.jsx:52-63` |
| claim `admin: true` | **REAL** | aplicado por `scripts-locais/set-admin-claim.js` |
| `os`, `configuracoes/geral` | **REAL** | `TelaEdicaoOS.jsx:36`, `StatusOS.jsx` |
| `leads_imobi` (payload de 11 campos) | **REAL** | `PortalCliente.jsx:124-135` |
| `oficinas/{oid}/leads` (payload de 8 campos) | **REAL** | `PortalCliente.jsx:160-168` |
| `desmanche_global/{oficinaId}` | **REAL** | `Desmanche.jsx:100` |
| `acompanhamentos_publicos/{codigo}_{senha}` | **REAL** | `acompanhamento.js:104-113` (`docIdDe`) |
| `usuarios.papel: 'corretor'` | **HIPOTÉTICO** | nenhum fluxo grava esse papel: só `'dono'` (Cadastro) e `'master'` (claim) |
| `equipe/{uid}` com `nivelAcesso: 'gerente'` | **HIPOTÉTICO** | `Equipe.jsx:208` usa `addDoc` (ID aleatório) e o payload **não tem `uid`** → `papelNoTenant()` nunca dispara em produção |
| `imoveis_imobi` / `vistorias` com `publico: true` | **HIPOTÉTICO** | nenhuma ocorrência de `publico: true` em `src/`; a vitrine consulta o campo e recebe vazio |
| `ordensServico` com `oficinaId` | **HIPOTÉTICO** | nenhum `addDoc/setDoc/updateDoc` nessa coleção; só leitura em `Precificacao.jsx:97` |

Os testes de estrutura hipotética **não foram removidos**: cobrem superfície que
existe nas Rules e pode virar real. Ficam marcados `[HIPOTÉTICO]` no título.

---

## 1. Isolamento dos testes (A5)

`beforeEach` executa `clearFirestore()` + `prepararCenario()`. Consequências:

- Nenhum teste depende da ordem; rodar um único teste (`-t`) funciona.
- Custo: ~80 documentos reescritos antes de cada teste. Trade-off aceito em troca
  de determinismo.
- `withSecurityRulesDisabled` aparece **apenas** dentro de `prepararCenario()`.

---

## 2. Validação do motivo da negação (A3)

Os helpers `negar()` / `permitir()` substituem `assertFails` / `assertSucceeds`:

- `negar()` só aceita erro com `code === 'permission-denied'`. `not-found`
  (fixture faltando) ou `invalid-argument` (query mal montada) **derrubam o teste**
  com a causa na mensagem.
- `permitir()` reporta o `code` real quando a operação é bloqueada.

Efeito desejado: `getDocs(collectionGroup(...))` sem filtro agora prova que a
recusa vem da regra, não de uma query rejeitada pelo SDK.

---

## 3. Riscos permitidos HOJE pelas Rules

Bloco `13. [RISCO ACEITO]` da suíte. **Verde ali não significa seguro.**

| ID | Comportamento permitido | Impacto | Correção | Bloqueio |
|---|---|---|---|---|
| R1 | anônimo cria lead em qualquer `oid` existente | lead direcionado a outra imobiliária | endpoint `POST /api/leads` com App Check + rate limit | decisão de arquitetura |
| R2 | anônimo escolhe `corretorResponsavel` | atribuição comercial forjada | fixar valor no servidor | depende de R1 |
| R3 | `os.get: true` expõe `nomeCliente`, `telefone`, `placa`, `fotos[]` | dado pessoal do cliente final | espelho `os_publico/{token}` | alteração em `src/` |
| R4 | `configuracoes.get: true` expõe `pixKey`, `endereco`, `telefone` | dado financeiro; docId constante (`geral`) | `configuracoes_publicas/geral` | alteração em `src/` |
| R5 | `acompanhamentos_publicos`: senha no `docId`, 26,3 bits (81M combinações) | enumeração por força bruta | `docId = sha256(codigo+senha)` | `src/lib/acompanhamento.js` |
| R6 | imóvel `publico: true` legível inteiro | vazamento de campos internos | allowlist no espelho público | depende de R3/R4 + vitrine |
| R7 | `desmanche_global` listável por qualquer autenticado | catálogo cruzado com telefone/parceiros | endpoint paginado | decisão de produto |
| R8 | `planos` legível por qualquer autenticado | catálogo comercial exposto | escopo por tenant | decisão de produto |
| R9 | `delete` de `usuarios` sempre negado | exclusão de conta impossível (`Configuracoes.jsx:110`) | Cloud Function com Admin SDK | alteração em `src/` |

Os IDs R1–R9 correspondem aos títulos `[R1]`…`[R9]` dos testes.

---

## 4. Decisões que exigem humano

1. **R1** — construir o endpoint de lead antes do piloto ou aceitar o risco?
2. **R3/R4** — criar `os_publico`/`configuracoes_publicas` nesta fase ou depois?
3. **R5** — migrar links de acompanhamento já emitidos para hash (quebra links antigos) ou conviver com o risco?
4. **R7/R8** — catálogo cruzado é requisito de rede ou vazamento a fechar?
5. **`trialFim`** — manter 252h de tolerância (10 dias + 12h) ou criar o trial em Cloud Function e eliminar a folga?
6. **Admin** — hoje lê qualquer usuário, mas não edita. Operação administrativa vai para Cloud Function?

---

## 5. Limites da suíte (o que ela não prova)

1. **Compilação das Rules** — só o Emulator/Console compilam. O arquivo estático
   faz verificação estrutural (chaves, parênteses, referências qualificadas,
   funções órfãs, superfície pública), **não** compilação.
2. **`criadoEm == request.time`** com `serverTimestamp()` real.
3. **Limite de 10 leituras por avaliação** (`gestorDoTenant` usa ~4): o Emulator
   não falha por custo.
4. **Taxa real de enumeração** do acompanhamento — depende de rede/observabilidade.
5. **`collectionGroup` com regra baseada em `resource.data`** — a mensagem exata
   de erro pode variar entre versões do Emulator.
6. **Formato real dos documentos hipotéticos** (tabela da seção 0).

---

## 6. Operações ainda sem cobertura

| Item | Por que ficou de fora |
|---|---|
| `telegram_leads` — delete | regra `isAdminPlataforma()` uniforme; create e read cobertos |
| `planos` — delete | idem, read/write cobertos |
| `oficinas/MASTER/{sub=**}` — `list` de subcoleção profunda | caminho curinga; `get` e `write` cobertos |
| `oficinas/{oid}` — `list` por membro | a regra só permite `list` ao admin; o inverso está coberto |
| `acompanhamentos_publicos` — update com `tenantId` divergente | exigiria fixture violando dois níveis; o comportamento já é coberto por "membro de outro tenant não altera" |
| `imoveis_nicho` / `notas_fiscais_imobi` — update | validações idênticas às de create; create coberto |

Nenhuma lacuna bloqueia a homologação: todas são extensões do mesmo contrato já
testado (`membroOficina(oid)` ou `isAdminPlataforma()`).

---

## 7. Como executar

```bash
# 0. JVM já instalada (Temurin 21.0.13). Na sessão atual:
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-21.0.13.9-hotspot"
export PATH="$JAVA_HOME/bin:$PATH"

# 1. dependências de teste (ainda NÃO instaladas)
npm i -D vitest @firebase/rules-unit-testing

# 2. verificações estáticas — sem emulador
npx vitest run tests/firestore.rules.static.test.js

# 3. suíte completa no emulador isolado
npx firebase emulators:exec --only firestore --project demo-express-imobi \
  "npx vitest run"
```

**Nunca** usar `firebase deploy` como validação: publicaria em
`express-ai-automation` (o `.firebaserc` aponta para produção).
