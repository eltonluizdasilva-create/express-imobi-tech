# AGENTS.md — instruções para agentes neste repositório

> **REGRA DO COMPANY BRAIN: Antes de responder, escrever código, criar agentes ou gerar textos
> comerciais, consulte os arquivos da pasta `company-brain/` (especialmente `03-mapa-agentes.md` e
> `05-decisoes-ativas.md`). Nunca crie um novo agente sem antes verificar se já existe um no mapa, e
> sempre atualize `05-decisoes-ativas.md` quando uma nova regra de negócio ou arquitetura for definida.**

---

## Ordem de leitura obrigatória

1. `company-brain/01-identidade-produtos.md` — quem somos, o que vendemos, domínios.
2. `company-brain/02-regras-comerciais.md` — preço, tom de voz, o que nunca fazer.
3. `company-brain/03-mapa-agentes.md` — agentes e skills que já existem (não duplicar).
4. `company-brain/04-arquitetura-stack.md` — stack, endpoints, regra de segurança.
5. `company-brain/05-decisoes-ativas.md` — o que vale hoje e o que virou obsoleto.

## Company Brain — sincronização automática (não precisa de comando manual)

O cérebro vive em dois lugares: `company-brain/*.md` (disco, versionado no git) e a coleção
`company_brain` no Firestore (nuvem, acesso pelo celular em `/brain`). A sincronização é automática:

| Gatilho | O que acontece sozinho |
|---|---|
| Commit que toca `company-brain/` | o hook `.githooks/post-commit` roda o `push` (disco → nuvem) |
| Conversa com o agente | o MCP `company-brain` lê a nuvem e grava decisões na hora (`brain_ler`, `brain_buscar`, `brain_registrar`, `brain_obsoletar`) |
| Decisão tomada no celular (`/brain`) | entra na nuvem com `updatedBy: 'mobile'`; o próximo `git pull`/sessão traz para o disco |

**Não é mais necessário rodar `brain:pull` / `brain:push` no dia a dia.** Os comandos continuam
existindo como ferramenta de manutenção (`--dry-run`, `--force`, `--only`), e o hook é ativado uma
única vez por clone com `npm run brain:hooks`.

Regras que continuam valendo:
- Regra nova ou decisão registrada pelo agente entra em `05-decisoes-ativas.md` com a data, e a regra
  substituída é marcada **`[OBSOLETO]`** — nunca apagada.
- `brain:pull` faz backup de cada arquivo sobrescrito em `company-brain/.backup/` (gitignored).
- `company_brain` é **fechada**: só o admin da plataforma (claim `admin=true`), o UID master e o
  e-mail institucional leem ou escrevem. Nenhum tenant, nenhum anônimo. `delete` é proibido nas rules.
- Credencial do script/MCP vem de `FIREBASE_SERVICE_ACCOUNT` (env) ou de
  `scripts-locais/service-account.json` — nunca no código.


## Regras de execução

- **Aprovação explícita** antes de commit, push, deploy, publicação ou alteração de dados.
- `git add` **nominal**, arquivo por arquivo. Nunca `git add .` nem `git add -A`.
- Chave, token ou senha **nunca** no código, no bundle, em print ou em resposta. `.env` e variáveis
  de ambiente (Vercel/Firebase) apenas.
- Toda entrega mostra **diff** e **evidência de execução real** (teste, build, request) antes de
  declarar concluído. Análise de código não é teste executado.
- Preço, plano, módulo e limite vêm de `shared/planos.json`. Nunca duplicar valor em componente.
- Conteúdo de marketing nunca é publicado por agente: vai para
  `C:\Users\User\Desktop\express-tech-marketing\pendentes\` e aguarda aprovação humana.
- Comercial nunca faz disparo em massa.

## Contexto técnico rápido

- Stack: React 19 + Vite 7 + Tailwind 3, Firestore multi-tenant (`oficinas/{id}/...`),
  serverless em `/api/*` (Vercel) e Cloud Functions (`ativarPlano`, `pagamentoWebhook`).
- Identidade visual: fundo `#020408`, esmeralda `#10B981`, teal `#0D9488`, sky `#0284C7`.
- Skills de departamento: `tecnologia`, `comercial`, `marketing`, `operacoes`.
