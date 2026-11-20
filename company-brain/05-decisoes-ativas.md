# 05 — Decisões Ativas · Express Tech

> **Como usar este arquivo**
> 1. Toda decisão nova entra **no topo da seção do dia**, com data `AAAA-MM-DD`.
> 2. Decisão que substitui outra: marque a antiga com **`[OBSOLETO]`** e aponte o que a substituiu —
>    nunca apague o histórico.
> 3. Preço, plano, arquitetura e regra comercial mudam aqui **no mesmo dia** em que mudam no código.
> 4. Dúvida sobre "isso ainda vale?" → a resposta é este arquivo, não a memória de quem executou.

**Estado do registro:** vigente em **2026-11-20** (inclui Control Brain híbrido).

---

## 2026-11-20 — Foco em receita na operação interna

| # | Decisão | Status |
|---|---|---|
| D-20.19 | **4 agentes passam a Operação Principal**: `gerente-geral` (prioriza demo, trial e venda de Imobi Tech / automações R$ 450+ e **barra feature fora do roadmap validado por clientes**), `cfo-compliance` (custo fixo/variável, MRR, margem, consumo de API de IA e conformidade comercial antes de qualquer gasto ou campanha), `pesquisador-empresas` (ficha padrão: nome, cidade, tamanho da equipe, presença digital, site próprio, nota/avaliações no Google, 1 necessidade provável) e `sdr-atracao` (registro de resposta, fila de follow-up e classificação Frio / Morno / Pronto para demo). | **VERDADE ATUAL** |
| D-20.20 | **`assistente-fiscal-interno`, `editor-conteudo` e `assistente-pessoal` ficam Em Espera (Standby)**: seguem acionáveis por gatilho explícito, mas fora da rotina diária até decisão do fundador. | **VERDADE ATUAL** |
| D-20.21 | **Rótulo "Elite" removido da UI**: a 3ª barra de navegação do painel passa de `Esquadrão de IA · Elite` para `Inteligência Artificial · PRO` (`src/AdminNovo.jsx`, `BarraModulos`) e o cabeçalho lateral de `INTELIGÊNCIA ARTIFICIAL (ELITE)` para `INTELIGÊNCIA ARTIFICIAL (PRO)` (`src/components/admin/MenuNavegacao.jsx`). Motivo: alinhar o painel ao Plano **PRO (R$ 99/mês)**, que desde D-19.1 já entrega os 7 módulos de IA via `profissional_extra` — o nome "Elite" sugeria um degrau de módulos exclusivos que não existe mais. D-19.2 (o 3º degrau é equipe/usuários extras/instância dedicada) segue vigente; o que caiu foi apenas o **rótulo** "Elite", não o degrau. Preço e composição do plano inalterados — fonte continua `shared/planos.json`. | **VERDADE ATUAL** |
| D-20.22 | **P-03 encerrada sem alteração de dados**: o backfill `modulosOperacionais` **não foi aplicado** a nenhuma conta. Dry-run apontou 4 contas PRO elegíveis (`Oficina di Zé Ruela`/pro, `Oficina do Ricardo`/pago ×2, `Oficina da Maria`/profissional) — todas são **contas de OFICINA (Auto Tech)**, e o script grava a tabela de módulos do **Imobi Tech**. Gravar ali apagaria os setores do fluxo de O.S.; a correção de fallback em `OS.jsx` (setores padrão quando nenhum módulo é reconhecido) protege essas contas, mas é proteção de UI, não dado correto. Banco mantido intacto. O script passou a filtrar por segmento (`ehContaImobiliaria` / `--incluir-oficina` para forçar) e agora reporta `a atualizar: 0`. Reabrir P-03 só quando existir conta Imobi Tech PRO real precisando de migração. | **VERDADE ATUAL** |
| D-20.23 | **Nova escada comercial de 5 degraus do Imobi Tech** (substitui os 3 degraus de D-18.1): **1. Grátis** (R$ 0 — abas operacionais + `agentes_ia` como vitrine interativa gratuita); **2. Essencial Plus** (R$ 39,90/mês — destrava `historico` Propostas & Negócios + `marketing` Meta Ads & Criativos, via `essencial_plus_extra`); **3. PRO** (R$ 99,00/mês, anual R$ 89 — demais módulos operacionais e de IA); **4. Automação Sofia WhatsApp** (a partir de R$ 450/mês + taxa de implantação — atendente IA 24h no WhatsApp oficial); **5. Presença Digital & Tráfego** (setup R$ 690 = Vitrine/Portal sincronizado + Google Meu Negócio; gestão de tráfego opcional R$ 490/mês; verba de anúncios à parte). **Trial reduzido de 14 para 10 dias** em painel, cadastro, onboarding e tela de expiração. **Prioridade comercial mantida** (D-20.16): caixa vem de Sofia R$ 450+ e PRO R$ 99, nesta ordem — o degrau de R$ 39,90 é porta de entrada, não âncora de receita. Fonte de preço continua **exclusivamente** `shared/planos.json` (sincronizado para `functions/planos.json`); copy comercial em `src/lib/planosComerciais.js`, nunca hardcoded em componente. **Degrau 5 (copy fixada em 2026-11-20):** "Setup R$ 690 (Vitrine/Portal sincronizado + Google Meu Negócio) + Gestão de Tráfego opcional R$ 490/mês · verba de anúncios à parte", nos três pontos — `shared/planos.json` → `setup`, `functions/planos.json` (cópia) e `src/lib/planosComerciais.js` → `implementacao`/`verba`, renderizado em `Meuplano.jsx`. **`agentes_ia` no Grátis:** a aba é liberada no plano gratuito, mas **sem teto de volume definido no código** — não há por plano uma franquia de mensagens; o único freio existente é (a) o bloqueio do nível "avançado" em `ControleInteligenciaIA.jsx` quando `isPro` é falso e (b) o saldo `creditosIA`, que é **somente leitura no frontend** e provisionado/descontado pelo backend (n8n). `FRANQUIA_BASE_CREDITOS_IA = 1000` é apenas escala visual da barra, não cota. Portanto `agentes_ia` no Grátis **não tem consumo ilimitado nem limite comercial**: tem consumo real de API sem cota comercial. Ver D-20.24. | **VERDADE ATUAL** |
| D-20.24 | **Pendência de limite no Grátis**: `agentes_ia` foi liberado no plano gratuito **sem qualquer teto de interações ou mensagens** — auditoria de 2026-11-20 confirmou que não existe contador, franquia ou cota por plano no código. `creditosIA` é somente leitura no frontend (provisionado por n8n) e `FRANQUIA_BASE_CREDITOS_IA = 1000` serve apenas de escala visual; `ControleInteligenciaIA` bloqueia só o nível "avançado" quando `isPro` é falso. **Risco de custo de API de IA sem limite comercial no degrau gratuito** — decisão de teto (mensagens/mês por conta) fica aberta para o `cfo-compliance` antes de divulgar a vitrine como gratuita. | **VERDADE ATUAL** |

---

## 2026-11-20 — Operação interna ativada (7 agentes + 3 skills)

| # | Decisão | Status |
|---|---|---|
| D-20.11 | **10 skills globais arquivadas** (4 de macOS, `caveman`, `himalaya`, `xurl`, `google-workspace`, `teams-meeting-pipeline`, `sdlc-review`) movidas de `AppData/Local/hermes/skills/` para `AppData/Local/hermes/_archived_skills/` — fora do carregamento ativo, sem apagar. Reativar exige motivo novo registrado neste arquivo. | **VERDADE ATUAL** |
| D-20.12 | **3 skills de blindagem** em `skills/express-tech/`: `skill-auditoria-zero-erro` (checklist de entrega com evidência), `skill-saude-financeira` (margem, custo de API/nuvem, caixa primeiro, gate de ROI) e `skill-compliance-lgpd` (prospecção B2B legal, opt-out, isolamento por `oficinaId`). | **VERDADE ATUAL** |
| D-20.13 | **7 agentes núcleo da operação interna** em `agents/<slug>.md`: `gerente-geral`, `cfo-compliance`, `assistente-fiscal-interno`, `pesquisador-empresas`, `sdr-atracao`, `editor-conteudo`, `assistente-pessoal`. Todos leem o Company Brain via MCP (`brain_ler`) antes de responder. | **VERDADE ATUAL** |
| D-20.14 | **Nenhum agente publica, dispara ou commita sozinho**: apresenta e espera aprovação explícita do fundador. Conteúdo continua caindo em `Desktop/express-tech-marketing/pendentes/`. | **VERDADE ATUAL** |
| D-20.15 | **`skill-auditoria-zero-erro` é obrigatória em toda entrega**: "testado/comprovado" só com saída de execução real; fato de negócio só com fonte no Company Brain ou em `shared/planos.json`. | **VERDADE ATUAL** |
| D-20.16 | **Caixa primeiro**: prioridade de esforço = fechar caixa (SaaS PRO + automações a partir de R$ 450) → reter cliente pagante → produto novo. Feature sem receita nem redução de churn é custo. Valores sempre de `shared/planos.json`. | **VERDADE ATUAL** |
| D-20.17 | **Prospecção só com dado público de empresa**, cadência máxima de 1 contato + 1 follow-up e opt-out removido no mesmo dia. E-mail transacional (`resend`) não é canal de prospecção fria. | **VERDADE ATUAL** |
| D-20.18 | `assistente-fiscal-interno` passa a ter arquivo próprio (`agents/assistente-fiscal-interno.md`); a regra fiscal continua em `06-governanca-lei-financeiro.md` e segue exigindo validação do contador. | **VERDADE ATUAL** |

---

## 2026-11-20 — Company Brain e prospecção sem Google

| # | Decisão | Status |
|---|---|---|
| D-20.1 | Criado o **Company Brain** em `company-brain/` (5 arquivos). Toda tarefa começa consultando `03-mapa-agentes.md` e este arquivo. | **VERDADE ATUAL** |
| D-20.2 | Regra global nos arquivos de instrução (`AGENTS.md` na raiz + `SOUL.md` do Hermes): consultar o Company Brain antes de criar agente, código ou copy. | **VERDADE ATUAL** |
| D-20.3 | Captura de leads por região **funciona sem chave do Google**: `GOOGLE_MAPS_API_KEY` ausente → Nominatim (endereço) + Overpass (POI) + Photon (alternativa). Com chave, usa Places API (New). Mesmo contrato JSON, campo `provedor` identifica a fonte. | **VERDADE ATUAL** |
| D-20.4 | Espelhos do Overpass são apenas globais (`overpass-api.de`, `kumi.systems`, `private.coffee`). `overpass.osm.ch` **não** entra: é instância da Suíça e devolve zero resultados no Brasil. | **VERDADE ATUAL** |
| D-20.5 | Nominatim não serve para busca de POI por categoria (retorna `400 Nothing to search for` sem `q`). O fallback de POI é o **Photon**, com filtro de raio por haversine no servidor. | **VERDADE ATUAL** |
| D-20.6 | Google Cloud fica **bloqueado por 2SV/SMS em viagem** — nenhuma entrega pode depender de criar chave Google. | **VERDADE ATUAL** |
| D-20.7 | **Control Brain híbrido**: `company-brain/*.md` (PC, git) ⇄ `company_brain` no Firestore (celular), sincronizado por `npm run brain:push` / `brain:pull`. Sem n8n. | **VERDADE ATUAL** |
| D-20.8 | Coleção `company_brain` é **fechada**: leitura e escrita só para o admin da plataforma (claim `admin=true`), UID master e e-mail institucional. `delete: false` nas rules. | **VERDADE ATUAL** |
| D-20.9 | Painel privado `/brain` (admin): aba **Captura rápida** (anexa no topo com data `AAAA-MM-DD`, `updatedBy: 'mobile'`) e aba **Consultar cérebro**. | **VERDADE ATUAL** |
| D-20.10 | **Dois assistentes fiscais distintos**: o do produto (aba `contador`, atende cliente) e o `assistente-fiscal-interno` da Express Tech (`06-governanca-lei-financeiro.md`). Nenhum substitui o contador. | **VERDADE ATUAL** |

---

## 2026-11-19 — Marca, site institucional e landing comercial

| # | Decisão | Status |
|---|---|---|
| D-19.1 | **PRO (R$ 99/mês) passa a incluir os 7 módulos de automação**: `agentes_ia`, `copiloto`, `secretaria`, `administrador`, `roleta_imobi`, `avaliacao_imovel`, `credito` foram movidos para `profissional_extra` em `shared/planos.json`. `esquadrao_extra` ficou vazio. | **VERDADE ATUAL** |
| D-19.2 | O 3º degrau (Esquadrão) deixa de ser "módulos exclusivos" e passa a ser **equipe, usuários extras e instância dedicada**. | **VERDADE ATUAL** |
| D-19.3 | Landing do Imobi Tech reescrita no padrão **ImoFlow** (hero de dor → canais → mecanismo → fluxo → agentes → planos → FAQ → CTA), com preço transparente na própria home. Sem depoimento inventado. | **VERDADE ATUAL** |
| D-19.4 | Logo do painel é o `LogoExpress` (tile gradiente + glifo de casa). Botões flutuantes: **2 à esquerda** (ajuda + especialista IA) e **3 à direita** (tarefas, financeiro VGV, novo lead). | **VERDADE ATUAL** |
| D-19.5 | Site institucional `expresstech.com.br` passa a apresentar **VERTICAIS** (Auto `#EF4444`, Imobi `#10B981`, Agro `#F59E0B`) em abas, preservando o design existente. | **VERDADE ATUAL** |
| D-19.6 | Contato oficial em todo o produto: `contato@expresstech.com.br`. Domínio legado `oficinai.app` eliminado do código. | **VERDADE ATUAL** |
| D-19.7 | `WHATSAPP_COMERCIAL` é constante única (`5534991439845`); vazio → CTA cai em e-mail, nunca em link morto. | **VERDADE ATUAL** |

---

## 2026-11-18 — Planos, portais e onboarding

| # | Decisão | Status |
|---|---|---|
| D-18.1 | ~~Três degraus comerciais: Essencial (grátis), PRO (R$ 99/mês · R$ 89 no anual · R$ 1.068/ano), Automação a partir de R$ 497/mês + implantação.~~ **[OBSOLETO] → D-20.23** (escada de 5 degraus; automação passou a R$ 450+, novo degrau Essencial Plus R$ 39,90, novo degrau Presença Digital R$ 690 setup + R$ 490/mês opcional). | **[OBSOLETO]** |
| D-18.2 | Portais via **XML nativo** (`/api/xml-portais`) e webhook de retorno (`/api/webhook-portais`), sem depender de n8n. | **VERDADE ATUAL** |
| D-18.3 | `configuracoes/portais` exige `ehGestor(oid)` nas rules. Token de portal nunca é exposto no front. | **VERDADE ATUAL** |
| D-18.4 | Tour de primeiro acesso próprio (sem `driver.js`), dupla persistência (`localStorage` + `hasCompletedTour` no Firestore), passos dinâmicos por aba visível. | **VERDADE ATUAL** |
| D-18.5 | Visão do menu é preferência do usuário (Enxuta × Completa); o bloqueio real é de **acesso ao módulo**, não da lista de abas. | **VERDADE ATUAL** |
| D-18.6 | Copy das abas segue o padrão DOR → GANHO em faixa compacta no topo do conteúdo. | **VERDADE ATUAL** |

---

## 2026-11-17 — Segurança e Firestore

| # | Decisão | Status |
|---|---|---|
| D-17.1 | `firestore.rules` publicadas em produção via **REST API** com service account (não pelo CLI, que falha por credencial/relógio). | **VERDADE ATUAL** |
| D-17.2 | Regras: `ehGestor()` + allowlist `subcolecaoOperacional`; `eventos_lead` imutável (`update/delete: false`). | **VERDADE ATUAL** |
| D-17.3 | Proibido duplicar bloco de regra (duplicata com `||` vira permissão acidental). | **VERDADE ATUAL** |
| D-17.4 | Teste de regra só vale se for executado no Emulator; auditoria estática não substitui execução. | **VERDADE ATUAL** |

---

## 2026-11-16 e anteriores

| # | Decisão | Status |
|---|---|---|
| D-16.1 | Chaves de IA saem do bundle: proxy `/api/ai` com `process.env`, sem `VITE_`. | **VERDADE ATUAL** |
| D-16.2 | `api/` na Vercel substitui dependência de n8n para portais e IA. | **VERDADE ATUAL** |
| D-16.3 | `shared/planos.json` é a **fonte única** de preço, módulo e limite; `functions/planos.json` é cópia gerada. | **VERDADE ATUAL** |
| D-16.4 | Toda entrega: diff antes, aprovação explícita, `git add` nominal, nunca `git add .`. | **VERDADE ATUAL** |
| D-16.5 | Marketing nunca publica sozinho: pacote vai para `Desktop/express-tech-marketing/pendentes/`. | **VERDADE ATUAL** |
| D-16.6 | Comercial nunca faz spam em massa; abordagem consultiva, uma mensagem por vez. | **VERDADE ATUAL** |

---

## Decisões que caíram

| # | Decisão antiga | Substituída por |
|---|---|---|
| X-1 | ~~Produto "Oficina IA" como marca principal do painel~~ | **[OBSOLETO]** → Express Imobi Tech (D-19.4, D-19.5) |
| X-2 | ~~Agentes de IA só no degrau Esquadrão~~ | **[OBSOLETO]** → PRO inclui os 7 módulos (D-19.1) |
| X-3 | ~~Site institucional com menu "OFICINA IA"~~ | **[OBSOLETO]** → menu VERTICAIS (D-19.5) |
| X-4 | ~~Captura por região depende de chave Google~~ | **[OBSOLETO]** → OpenStreetMap por padrão (D-20.3) |
| X-5 | ~~Espelho `overpass.osm.ch` para dados do Brasil~~ | **[OBSOLETO]** → espelhos globais (D-20.4) |
| X-6 | ~~Domínio `oficinai.app` e e-mail pessoal no produto~~ | **[OBSOLETO]** → `expresstech.com.br` (D-19.6) |
| X-7 | ~~Escada de 3 degraus (Grátis / PRO R$ 99 / Automação R$ 497+)~~ | **[OBSOLETO]** → escada de 5 degraus (D-20.23) |

---

## Pendências abertas

| # | Pendência | Impacto | Dono |
|---|---|---|---|
| P-01 | Localizar o projeto **English Core 200** (não está neste disco) | inventário incompleto | fundador |
| P-02 | `firebase deploy --only functions` bloqueado (refresh token revogado; precisa `firebase login`) | backend com cópia antiga de `planos.json` | fundador + Hermes |
| P-03 | Backfill de `modulosOperacionais` das contas PRO já ativas — **[ENCERRADA em 2026-11-20, D-20.22]** sem alteração de dados: as únicas contas PRO elegíveis são de oficina (Auto Tech) e o script grava módulos do Imobi Tech. Reabrir só com conta Imobi PRO real para migrar. | coerência entre plano e módulos | fundador |
| P-04 | `os.get` público e `configuracoes/geral` com `pixKey` exposta nas rules | privacidade | Hermes |
| P-05 | `storage.rules` não publicado (Storage desabilitado) | uploads | fundador |
| P-06 | Chaves antigas do repo `oficina-ia/main` ainda válidas | rotação de credencial | fundador |
| P-07 | Regime tributário da Express Tech não confirmado (Simples? anexo? município da NFSe) | agente fiscal interno não afirma regime | fundador + contador |
| P-08 | Bloco `company_brain` do `firestore.rules` **ainda não publicado** — `/brain` dá `permission-denied` até o deploy das rules | painel mobile offline | Hermes + fundador |
