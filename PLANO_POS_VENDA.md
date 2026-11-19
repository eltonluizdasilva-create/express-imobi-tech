# Plano Pós-Venda — Express Imobi Tech

Documento operacional e técnico para início dos testes comerciais (faixa de R$ 99,00/mês).

**Regra deste documento:** tudo aqui foi apurado lendo o código do repositório. Onde uma proteção
**não** existe, ela aparece como pendência — não como recurso. Nenhum nome de variável, endpoint ou
campo foi inventado.

Arquivos consultados para escrever este plano:

| Arquivo | O que foi verificado |
|---|---|
| `src/lib/checkout.js` | precedência das URLs de checkout, fallback WhatsApp, abertura de aba |
| `src/components/Meuplano.jsx` | ciclo padrão, montagem do destino, mensagem enviada |
| `functions/index.js` | `pagamentoWebhook`, `ativarPlano`, `aplicarPlano`, identificação do tenant |
| `functions/planos.json` / `shared/planos.json` | `planosPro`, módulos por plano |
| `firebase.json`, `.firebaserc` | runtime das functions, região, projeto |
| `.env.example`, `.gitignore` | variáveis e proteção contra commit de segredo |

---

## Parte 1 — Checkout e pagamento

### 1.1 Como o frontend decide para onde mandar o usuário

Arquivo: `src/lib/checkout.js`

```
urlCheckoutPro(env, ciclo)
  1. env.VITE_CHECKOUT_PRO_MENSAL_URL   (quando ciclo = mensal)
     env.VITE_CHECKOUT_PRO_ANUAL_URL    (quando ciclo = anual)
  2. env.VITE_CHECKOUT_PRO_URL          (compatibilidade: URL única)
  3. '' (nenhuma)                        → cai no WhatsApp
```

Só aceita valor que comece com `http://` ou `https://`; qualquer outra coisa é descartada e o
sistema cai no passo seguinte.

Arquivo: `src/components/Meuplano.jsx` — função `assinarPro()`

- O ciclo vem do seletor da tela, **`anual` por padrão**.
- `urlCheckoutPro` recebe os **valores** das três variáveis (não o objeto `import.meta.env`, para o
  bundle não variar conforme o ambiente de build).
- Sem URL configurada, monta `https://wa.me/<numero>?text=<mensagem>`.
  Número: `VITE_SU_WPP`; se ausente, `5534991439845` (constante `WHATSAPP_PADRAO` em `checkout.js`).
- A mensagem (`mensagemCheckout`) leva: nome do plano com o ciclo, valor, imobiliária, **e-mail** e
  **UID** da conta logada.
- `abrirDestino` abre em `_blank` com `noopener,noreferrer` e devolve `false` quando o navegador
  bloqueia o pop-up — nesse caso a tela mostra aviso, não fica clique morto.

**O que não existe:** não há rota de retorno do checkout (`success_url`/`cancel_url`), não há
consulta de status de pagamento no frontend e a tela não recebe confirmação. Quem libera o plano é
exclusivamente o webhook da Parte 1.3. O usuário precisa recarregar o painel para ver o PRO ativo.

### 1.2 Configurar as variáveis de checkout (Vercel)

1. Vercel → projeto `express-imobi-tech-dqgx` → **Settings → Environment Variables**.
2. Criar, em **Production** (e em **Preview**, se quiser testar antes):
   - `VITE_CHECKOUT_PRO_MENSAL_URL` = URL de pagamento do ciclo mensal (R$ 99,00/mês)
   - `VITE_CHECKOUT_PRO_ANUAL_URL` = URL de pagamento do ciclo anual (R$ 1.068,00/ano)
3. **Redeploy obrigatório** — variáveis `VITE_` são embutidas no bundle durante o build; adicionar
   sem redeploy não muda nada no que já está publicado.

> **Nunca** colocar token, chave secreta ou senha em variável `VITE_`. Tudo com esse prefixo vai para
> o JavaScript público do navegador. Segredos de gateway ficam apenas no servidor (`WEBHOOK_SECRET`,
> em Cloud Functions).

Sem as variáveis, o botão continua funcionando e leva ao WhatsApp comercial — o fluxo não quebra,
apenas deixa de ser pagamento automático.

### 1.3 `pagamentoWebhook` — o que está implementado

Arquivo: `functions/index.js` — `exports.pagamentoWebhook = onRequest({ region: 'southamerica-east1' })`

| Item | Valor real |
|---|---|
| Método | **POST** (qualquer outro → 405) |
| Runtime | `nodejs20` (`firebase.json`) |
| Região | `southamerica-east1` (env `FUNCTIONS_REGION` sobrepõe) |
| Projeto | `express-ai-automation` (`.firebaserc`) |
| URL | `https://southamerica-east1-express-ai-automation.cloudfunctions.net/pagamentoWebhook` — é o padrão `<região>-<projeto>.cloudfunctions.net/<função>`; **confirmar com `firebase functions:list` antes de cadastrar no gateway** (o deploy destas functions não é verificado por este documento) |
| Autenticação | header `x-webhook-secret` comparado com `process.env.WEBHOOK_SECRET` |

Validação da origem, como está no código:

1. Sem `WEBHOOK_SECRET` no ambiente → **500** `Webhook sem segredo configurado` (falha fechada).
2. Comparação com `crypto.timingSafeEqual` sobre buffers de mesmo tamanho → **401** se divergir.
3. **Não há** assinatura HMAC do corpo, **não há** allowlist de IP e **não há** validação de
   timestamp/nonce. A proteção é um segredo compartilhado estático, enviado em header.

Payload aceito (todos opcionais, com defaults):

| Campo | Uso | Default quando ausente |
|---|---|---|
| `status` ou `event` | define a ação | **`pago`** (ver pendência P2) |
| `plano` | chave do plano | `profissional` |
| `ciclo` | `mensal` / `anual` | `mensal` |
| `oficinaId` | id do tenant | — |
| `email` | alternativa ao `oficinaId` | — |
| `valor` | gravado como registro | `null` |
| `gateway` | rótulo de origem | `desconhecido` |
| `pagamentoId` | id do pagamento no gateway | `null` |

Identificação do cliente: usa `oficinaId` quando enviado; senão resolve por `email`, procurando em
`oficinas.email` e, se não achar, em `usuarios.email` (pegando `oficinaId` ou o próprio id do
documento). Sem um dos dois → **400** `oficinaId ou email obrigatório`.

Efeitos por status:

| Status recebido | Escrita em `oficinas/{id}/assinaturas/atual` | Plano aplicado |
|---|---|---|
| `pago`, `pagamento_confirmado`, `ativo` | `status: 'ativa'`, `plano`, `ciclo`, `valor`, `gateway`, `pagamentoId`, `atualizadoEm` | o plano pago recebido |
| `cancelado`, `cancelada`, `estornado` | `status: 'cancelada'`, `atualizadoEm` | `gratis` |
| qualquer outro | nada | nada (responde `{ ok: true, ignorado: true }`) |

O que `aplicarPlano` grava em `oficinas/{oficinaId}`: `plano`, `isPro`, `tipoPlano`,
`modulosOperacionais` (lista derivada de `planos.json`), `planoOrigem` (`pagamento` /
`cancelamento`), `planoAtualizadoEm`; quando o plano não é PRO, também `nivelInteligencia: 'padrao'`.
Se o documento da oficina não existir, ele é criado com `uid`, `plano`, `isPro`, `criadoEm`.

O plano é considerado PRO conforme `planosPro` em `planos.json` (`pro`, `profissional`,
`esquadrao_ia`, `premium`, `pago`, `master`, `prime`, `planoprimeia`, `especialista`, `ultimate`).
`gratis`, `gratuito`, `free`, `trial` e vazio são tratados como gratuitos.

### 1.4 Configurar o webhook (checklist)

1. Definir o segredo **no servidor**, nunca no frontend. Como as functions são v2 (`firebase-functions@5`),
   o caminho suportado pelo CLI é o arquivo de ambiente da função:
   `functions/.env.express-ai-automation` com `WEBHOOK_SECRET=<valor-longo-aleatorio>`.
   Esse arquivo **não está no repositório** e `.gitignore` cobre `.env*` — mantenha assim.
   (Alternativa que exigiria mudança de código: `defineSecret` do v2. Não implementado hoje.)
2. Reimplantar as functions depois de criar/alterar o arquivo de ambiente.
3. No gateway de pagamento, cadastrar a URL da tabela 1.3, método **POST**, com o header
   `x-webhook-secret` e o mesmo valor, enviando o corpo JSON com os campos da tabela.
4. Teste controlado (troque `<SEGREDO>` e `oficinaId`):
   ```bash
   curl -i -X POST \
     "https://southamerica-east1-express-ai-automation.cloudfunctions.net/pagamentoWebhook" \
     -H "Content-Type: application/json" \
     -H "x-webhook-secret: <SEGREDO>" \
     -d '{"status":"pago","plano":"profissional","ciclo":"anual","oficinaId":"<UID_DA_OFICINA>","valor":1068,"gateway":"teste","pagamentoId":"teste-1"}'
   ```
5. Conferir o efeito: documento `oficinas/{oficinaId}/assinaturas/atual` com `status: "ativa"` e o
   documento `oficinas/{oficinaId}` com `plano`, `isPro` e `planoOrigem: "pagamento"`.

**Ambientes:** existe **um único** projeto Firebase (`express-ai-automation`); não há separação
teste/produção para as functions. O `firebase.json` configura emulador **apenas de Firestore**
(porta 8080) — não há emulador de functions configurado, então o webhook não tem caminho de teste
isolado pronto. Pendência P7.

### 1.5 Pendências da Parte 1

| # | Pendência | Impacto |
|---|---|---|
| P1 | Sem assinatura HMAC do corpo, sem IP allowlist, sem nonce/timestamp | Quem obtiver o segredo libera qualquer plano; reenvio do mesmo POST é aceito indefinidamente |
| P2 | `status` ausente vira **`pago`** (`norm(body.status \|\| body.event) \|\| 'pago'`) | Um POST sem `status` libera o plano; deveria ser rejeitado |
| P3 | Sem idempotência por `pagamentoId` e sem log de eventos | Pagamento repetido reprocessa; não há histórico para auditar cobrança |
| P4 | Sem tratamento de eventos fora de ordem | Um `cancelado` atrasado derruba um cliente que já repagou; um `pago` antigo reativa assinatura cancelada |
| P5 | Webhook não valida se `plano` existe em `planosPro`/`ATIVAVEIS` nem se `valor` corresponde ao preço | Chave de plano arbitrária é gravada; `aplicarPlano` cai no módulo gratuito |
| P6 | Frontend sem retorno do checkout e sem consulta de status | Cliente pagou e continua vendo "Plano Gratuito" até recarregar; nenhuma tela confirma o pagamento |
| P7 | Sem ambiente de teste para as functions | Homologação exige usar o projeto de produção ou montar emulador |
| P8 | `VITE_SU_WPP` não é validada no build | Se vazia, o fallback usa `5534991439845`; se errada, o lead cai em número errado sem aviso |
| P9 | Sem rotina de reconciliação com o gateway | Divergência entre gateway e Firestore só é descoberta manualmente |

---

## Parte 2 — Integração com Evolution API (roteiro; **não implementado**)

> **Estimativa: 1 a 2 dias de desenvolvimento.** É estimativa, não compromisso: depende de a
> arquitetura abaixo ser validada na inspeção do passo 1. Não existe hoje nenhum código de WhatsApp
> neste sentido — nem endpoint, nem variável de ambiente, nem campo no Firestore.

### 2.1 Estado atual (auditado)

- `api/` contém apenas `ai.js`, `telegram-webhook.js`, `webhook-portais.js`, `xml-portais.js`,
  `_firestoreAdmin.js`. **Não existe `api/whatsapp.js`.**
- Nenhuma ocorrência de `evolution`, `z-api`, `zapi` ou `typebot` em `src/` ou `api/`.
- A aba Conexão WhatsApp exibe QR Code estático e simulador de conversa; `Secretaria.jsx` não faz
  nenhuma chamada HTTP para gateway (`0` ocorrências de `fetch(`). O "teste de envio" grava o campo
  `triggerTestMessage` em `oficinas/{id}` esperando um serviço externo que não está neste repositório.
- O padrão de acesso ao Firestore no backend já existe e é reutilizável: `api/_firestoreAdmin.js`
  (JWT RS256 com `node:crypto`, REST do Firestore, sem `firebase-admin` na raiz).

### 2.2 Arquitetura proposta

```
Evolution API (servidor próprio ou hospedado, 1 instância por tenant)
        │  webhook (mensagem recebida)
        ▼
api/whatsapp-webhook.js  ── valida token da instância ──▶ resolve oficinaId
        │                                                  │
        │                                      oficinas/{oid}/configuracoes/whatsapp
        ▼                                                  │ (baseUrl, instance, apiKey — gestor only)
leads_imobi / fila de atendimento                          │
                                                           ▼
api/whatsapp.js  ──▶ Evolution API (envio, status, QR, reconexão)
```

Decisão de arquitetura a validar no passo 1: **uma instância por oficina** (isolamento simples,
custo maior) ou **uma instância compartilhada com roteamento por número** (mais barato, exige
cuidado para não vazar conversa entre tenants). O roteiro assume uma instância por oficina.

### 2.3 Roteiro por etapa

**Passo 1 — Inspeção (2 a 3 h)**
Conferir: como `api/*.js` é implantado na Vercel; se `_firestoreAdmin.js` cobre leitura/escrita das
subcoleções necessárias; quais campos de `leads_imobi` já existem (`origem`, `estagio`,
`corretorResponsavel`, `imovelId`); como a Roleta distribui lead hoje. Entregável: confirmação (ou
correção) desta arquitetura.

**Passo 2 — Contrato de configuração (2 h)**
Criar `oficinas/{oid}/configuracoes/whatsapp` com `{ baseUrl, instance, apiKey, ativo, atualizadoEm }`.
**Atenção:** hoje `configuracoes/{docId}` libera leitura para qualquer membro da oficina (exceto
`portais`, que é gestor-only por regra dedicada). Guardar `apiKey` ali exige **alteração de
`firestore.rules`** para tratar `whatsapp` como `portais`. Sem essa mudança, **não** gravar a chave —
é a primeira tarefa do passo.

**Passo 3 — Backend de envio (3 a 4 h)**
`api/whatsapp.js` com rotas autenticadas por gestor: criar instância, obter QR, status de conexão,
enviar texto. Reaproveitar `_firestoreAdmin.js` para carregar a configuração do tenant e chamar a
Evolution com a `apiKey` daquela instância. Nunca aceitar `oficinaId` do corpo sem conferir o vínculo
do usuário autenticado (regra de isolamento idêntica à de `api/xml-portais.js`).

**Passo 4 — Webhook de recebimento (3 a 4 h)**
`api/whatsapp-webhook.js`: validar o token da instância antes de qualquer escrita, resolver a oficina
pelo `instance`, sanitizar texto, gravar/atualizar o lead em `leads_imobi` com `origem: 'WhatsApp Sofia'`
e disparar a resposta pelo mesmo `api/whatsapp.js`. Idempotência por id da mensagem (a Evolution pode
reenviar) — sem isso, lead duplicado a cada retry.

**Passo 5 — Erros e reconexão (2 a 3 h)**
Estados de instância (`conectada`, `desconectada`, `expirada`), retry com backoff no envio, marcação
do tenant como desconectado e aviso no painel. Logs com `oficinaId` + `instance` + id da mensagem,
sem conteúdo sensível.

**Passo 6 — Testes e homologação (3 a 4 h)**
Instância isolada, número de teste: envio, recebimento, queda e reconexão, mensagem duplicada,
mensagem de outro tenant (deve ser recusada), ausência de configuração (deve falhar fechado). Depois,
homologação com o primeiro cliente Enterprise em horário controlado.

### 2.4 Segurança multi-tenant (inegociável)

- `apiKey` da instância **somente** em `configuracoes/whatsapp`, com leitura restrita a gestor.
- Webhook resolve o tenant pelo `instance` **do lado do servidor**; nunca por parâmetro de query
  enviado pelo cliente.
- Toda consulta/escrita usa `oficinas/{oid}/...` com o `oid` resolvido no servidor.
- Falha de validação = recusa e log; nunca "modo permissivo" para não quebrar teste.

### 2.5 Premissas da estimativa

1 a 2 dias assume: Evolution API já instalada e acessível por HTTPS; uma instância por oficina;
nenhuma mudança de modelo de dados além de `configuracoes/whatsapp`; sem fila/retry sofisticado;
sem templates aprovados pela Meta (só texto livre em sessão de 24 h). Se o cliente exigir múltiplas
instâncias, templates ou histórico de conversa no painel, o prazo cresce e precisa de novo recorte.

---

## Apêndice — Limpeza de interface (`src/components/Secretaria.jsx`)

Texto visível trocado de vocabulário de oficina para imobiliário; **nenhum identificador, campo do
Firestore, regra de negócio ou permissão foi alterado**. A relação completa das 22 substituições está
no relatório de entrega desta tarefa.

**Pendências encontradas nesse arquivo (não corrigidas — fora do escopo autorizado):**

| # | Pendência | Detalhe |
|---|---|---|
| S1 | Domínio legado no QR e no link copiado | **Corrigido**: `oficinai.app` saiu dos 4 pontos; agora o link do cartaz/QR e o texto da tela usam `VITE_PUBLIC_APP_URL` → origem da aba → `imobi.expresstech.com.br` (`src/lib/appUrl.js`). O QR passa a apontar para o domínio ativo, não para o legado |
| S2 | Contadores de "Proteção Jurídica" leem `oficinas/{oid}/os` | Coleção legada do produto Auto; em conta Imobi tende a 0. Não é problema de texto, é de modelo |
| S3 | QR Code e "TESTAR ENVIO" não executam nada real | QR é imagem estática do `api.qrserver.com`; o teste grava `triggerTestMessage` sem consumidor no repositório |
| S4 | Texto cita "OpenCode" | Serviço externo inexistente neste repositório; aparece em dois avisos ao usuário |
| S5 | Nome de variável e props ainda em vocabulário de oficina | `veiculoCliente`, `dadosOficina`, `oficinaId` — mantidos de propósito (regra 2 da tarefa) |
