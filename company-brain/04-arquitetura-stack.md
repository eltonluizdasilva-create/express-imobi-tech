# 04 — Arquitetura e Stack · Express Tech

> **Verdade atual:** 2026-11-20. Mudou infraestrutura? Registre em `05-decisoes-ativas.md`.

---

## 1. Visão geral

```
Navegador (React 19 + Vite 7 + Tailwind 3)
   │  SPA · PWA (Workbox) · sem chave de API
   ├── Firebase Auth ──► ID token
   ├── Firestore (leitura/escrita por tenant)
   └── fetch /api/* (Vercel serverless)
            ├── /api/ai            → DeepSeek · Groq · Gemini (chaves no servidor)
            ├── /api/places        → Google Places (se houver chave) | OpenStreetMap (padrão)
            ├── /api/xml-portais   → feed XML para ZAP/VivaReal/OLX/Imovelweb/Chaves na Mão
            ├── /api/webhook-portais → baixa lead do portal e grava no CRM
            └── /api/telegram-webhook → notificações

Cloud Functions (southamerica-east1, projeto express-ai-automation)
   ├── ativarPlano       → grava plano, módulos e limites no tenant
   └── pagamentoWebhook  → confirma pagamento com HMAC e ativa assinatura
```

---

## 2. Frontend

| Item | Versão / escolha |
|---|---|
| React | `^19.2.0` (com `react-dom`) |
| Roteamento | `react-router-dom ^7.13.0` |
| Build | `vite ^7.2.4` |
| Estilo | `tailwindcss ^3.4.0` (tema escuro `#020408` + tema claro) |
| Ícones / gráficos | `lucide-react ^0.563.0` · `recharts ^3.7.0` |
| PWA | `vite-plugin-pwa ^1.2.0` (Workbox, `skipWaiting`, `cleanupOutdatedCaches`) |
| Firebase SDK | `^12.9.0` |
| Deploy | **Vercel** — build da raiz, `routes: [{handle:'filesystem'}, {src:'/(.*)', dest:'/index.html'}]`, `api/*.js` com `maxDuration: 30` |

**Rotas públicas** (`src/App.jsx`): `/` (landing), `/cadastro`, `/login`, `/login-admin`, `/portal`
(vitrine pública), `/servicos`, `/sobre`, `/acompanhar`, `/status/:oficinaId/:osId`, `/termos`,
`/privacidade`. **Área autenticada:** `/admin` (painel único, abas por plano).

**Casca do painel:** `src/AdminNovo.jsx` (abas em `BarraModulos`), `src/components/ui/` (LogoExpress,
DorESolucao, GuiaDaAba, RodapeLegal), `src/components/prospeccao/` (captura de leads por região).

O cadastro inicial é orquestrado por `AuthContext`: Auth + `oficinas/{uid}` + `usuarios/{uid}` são
criados em um único batch; o listener de autenticação aguarda o batch antes do bootstrap genérico.

---

## 3. Backend e banco

### 3.1 Firestore — multi-tenant

- Isolamento por documento de tenant: `oficinas/{oficinaId}/...` (subcoleções `leads`, `os`,
  `imoveis_imobi`, `visitas`, `imoveis_portais`, `configuracoes/*`, `assinaturas`, `credito`, etc.).
- Inventário completo: `docs/INVENTARIO-FIRESTORE.md` (240 acessos, 47 caminhos, 35 subcoleções).
- `firestore.rules`: **628 linhas**, publicadas em produção via REST API com service account.
  Contém `ehGestor()` (claims/papel), allowlist `subcolecaoOperacional`, bloqueio de flags em
  `oficinas.update`, criação inicial de `oficinas/{uid}` restrita ao próprio usuário em plano
  grátis (`isPro` ausente ou `false`) e `configuracoes/portais` restrito ao gestor.
- `storage.rules`: **61 linhas**, versionado e **não publicado** (Storage ainda não habilitado).

### 3.2 Cloud Functions

`functions/index.js` (Node 20, CommonJS) usa `functions/planos.json` — cópia gerada por
`node scripts/sync-planos.cjs` a partir de `shared/planos.json` (fonte única).

### 3.3 Serverless da Vercel (`/api`)

| Endpoint | Função |
|---|---|
| `ai.js` | proxy de IA; escolhe provedor e modelo, sem expor chave |
| `places.js` | varredura por região; Google com chave, **OpenStreetMap sem chave** |
| `xml-portais.js` | gera feed XML por tenant |
| `webhook-portais.js` | recebe lead de portal e grava no CRM |
| `telegram-webhook.js` | notificação |
| `pagamento-webhook.js` | confirma pagamento e atualiza assinatura/plano via `firebase-admin`; aceita o payload nativo do Asaas (`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`, cabeçalho `asaas-access-token`) e o JSON direto (`x-webhook-secret`) |
| `_firestoreAdmin.js` | JWT de service account + REST (usado pelos endpoints que dependem do helper) |
| `_authToken.js` | valida ID token do Firebase nos endpoints sensíveis |

O endpoint `pagamento-webhook.js` usa a dependência `firebase-admin` instalada na raiz e a variável
`FIREBASE_SERVICE_ACCOUNT`; os demais endpoints que usam `_firestoreAdmin.js` continuam via REST.

Webhook do Asaas: o token do cabeçalho `asaas-access-token` é comparado com `WEBHOOK_SECRET` (mesmo segredo do JSON direto). Plano vem do valor pago (mapa derivado de `shared/planos.json`) ou de `externalReference`/`description`; a leitura pura vive em `api/_asaas.js`. Links de upgrade: `src/lib/checkout.js` (`urlAsaasLink`, `LINK_ASAAS_PADRAO`), sem link configurado o botão do Essencial Plus/PRO usa o link público do Asaas.

---

## 4. Automação e IA

| Camada | Como está |
|---|---|
| **n8n** | integração por contrato: `VITE_MAPS_WEBHOOK_URL` aponta o front para um webhook externo. **Nenhum workflow versionado no repo** (auditoria 2026-11-20). |
| **Hermes Agent** | CLI/orquestrador desta operação: skills, MCP `codebase-memory-mcp`, subagentes, cron. |
| **OpenSquad** | framework multi-agente de conteúdo dentro do repo (`.agent/`, `_opensquad/`, `skills/`, `squads/`). |
| **DeepSeek** | `deepseek-chat` via `DEEPSEEK_API_KEY` |
| **Gemini** | cadeia `3.5-flash-lite → 3.1-flash-lite → 3.8-flash` via `GEMINI_API_KEY` |
| **Groq** | cadeia `openai/gpt-oss-120b → gpt-oss-20b → qwen/qwen3.8-27b` via `GROQ_API_KEY` |
| **OpenStreetMap** | Nominatim (geocoding) + Overpass (POI) + Photon (alternativa) — sem chave |
| **Google Places** | Geocoding + Places API (New) — só quando `GOOGLE_MAPS_API_KEY` existir |

Regra de modelo: cadeia com fallback em 429/503, escolhida por teste real — não por documentação.

---

## 5. Segurança — regras invioláveis

1. **Nunca** chave, token ou senha hardcoded no código-fonte. `.env` local + Environment Variables na
   Vercel (sem prefixo `VITE_` para segredo).
2. Prefixo `VITE_` = público. Só URL e configuração não sensível.
3. `scripts-locais/` (service account, publicadores) é **gitignored**.
4. Endpoint que gasta dinheiro exige ID token do Firebase (`api/_authToken.js`).
5. Firestore: isolamento por query no cliente **e** regras no servidor. Campo novo exige regra nova.
6. Antes de publicar rules: diff, teste estático e depois REST com service account.
7. Histórico: uma `VITE_DEEPSEEK_API_KEY` chegou a ser embutida no bundle em 2026-11 — removida e
   substituída pelo proxy `/api/ai`. É o exemplo do que não repetir.

### Pendências de segurança conhecidas

| Item | Situação |
|---|---|
| `os.get: true` | leitura pública de O.S. (expõe PII) — revisar |
| `configuracoes/geral` (`get: true`) | expõe `pixKey` e endereço — revisar |
| `storage.rules` | escrito, não publicado (Storage desabilitado) |
| `desmanche_global` | correção apenas estática, sem teste em produção |

---

## 6. Ambiente local

| Item | Valor |
|---|---|
| SO | Windows 11 · shell bash (MSYS) |
| Node | v24.18.0 · npm 12.0.2 |
| Repo produto | `C:\Users\User\Desktop\express-imobi-tech` |
| Site institucional | `C:\Users\User\Desktop\expresstech-site` (HTML estático) |
| Skills Hermes | `C:\Users\User\AppData\Local\hermes\skills` |
| Rede | DNS local instável: usar DoH `8.8.8.8` + `curl --resolve`; `*.vercel.app` exige proxy |

---

## 7. Company Brain — Control Brain híbrido (sem n8n)

O cérebro da empresa existe em dois espelhos, sincronizados por script:

```
company-brain/*.md  ⇄  Firestore `company_brain/{slug}`
      (PC, git)                 (nuvem, celular em /brain)
```

| Componente | Onde | Papel |
|---|---|---|
| Arquivos locais | `company-brain/*.md` | fonte versionada; histórico no git |
| Coleção Firestore | `company_brain/{slug}` | espelho na nuvem; leitura e captura pelo celular |
| Script de sync | `scripts/sync-brain.js` | `npm run brain:push` (disco→nuvem) e `npm run brain:pull` (nuvem→disco, com backup) |
| Painel privado | rota `/brain` (`src/pages/Brain.jsx`) | aba Captura rápida (anexa decisão no topo com a data) e aba Consultar (lê os 6 documentos) |
| Regras | `firestore.rules` → bloco `company_brain` | leitura/escrita só do admin da plataforma; `delete: false` |

**Documento** (`company_brain/{slug}`):

| Campo | Tipo | Regra |
|---|---|---|
| `titulo` | string | 1–160 caracteres |
| `conteudo` | string (Markdown) | até 400 000 caracteres |
| `updatedAt` | timestamp | servidor |
| `updatedBy` | string | `pc` (script) ou `mobile` (rota `/brain`) |

**IDs**: `01-identidade-produtos`, `02-regras-comerciais`, `03-mapa-agentes`,
`04-arquitetura-stack`, `05-decisoes-ativas`, `06-governanca-lei-financeiro`.

**Conflito**: `push` não sobrescreve documento cuja `updatedAt` seja mais nova que o arquivo local
(protege decisão tomada no celular); `pull` não sobrescreve arquivo local mais novo que a nuvem.
Nos dois casos existe `--force` e o `pull` sempre grava backup em `company-brain/.backup/`.

**Credencial**: `FIREBASE_SERVICE_ACCOUNT` (caminho, JSON ou base64) → fallback
`scripts-locais/service-account.json` (gitignored). Nada de chave no código.
