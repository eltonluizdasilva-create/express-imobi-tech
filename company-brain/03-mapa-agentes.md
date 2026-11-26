# 03 — Mapa de Agentes e Skills · Express Tech

> **Verdade atual:** 2026-11-20 · Auditoria do ambiente local (Windows) + repositório
> `C:\Users\User\Desktop\express-imobi-tech`.
> **Regra:** antes de criar qualquer agente novo, procure aqui. Só depois de confirmar que não existe
> equivalente, crie — e atualize este arquivo no mesmo dia.

**Legenda de status**
- `Ativo` — em uso ou pronto para uso imediato.
- `Arquivado` — movido para `AppData/Local/hermes/_archived_skills/` (fora do carregamento ativo).
  Continua no disco, não é carregado por tarefa e não deve ser reativado sem motivo novo.
- `Candidato a Arquivar` — existe, mas não serve a esta operação (SO errado, sem credencial, gíria,
  ou fluxo que não usamos). Status legado: em 2026-11-20 os 10 candidatos foram movidos.

**Resumo da auditoria**

| Origem | Quantidade |
|---|---|
| Papéis de IA do produto (Zara + agentes operacionais, Pólen, Tom e 3 assistentes) | 12 |
| Agentes internos da Express Tech | 7 |
| Agentes de código / orquestração | 7 |
| Skills Express Tech (Hermes) | 7 |
| Skills do projeto (Opensquad) | 11 |
| Skills globais do Hermes (ativas) | 41 |
| Workflows de instrução (Opensquad) | 3 |
| **Total ativo** | **86** |
| Skills globais arquivadas (`_archived_skills/`) | 10 |

---

## 1. Agentes do produto (rodam dentro do Express Imobi Tech)

Os cartões locais ficam em `src/AdminNovo.jsx` (`AGENTES_INICIAIS`). No painel, o bloco de agentes
operacionais fica dentro da Central de Inteligência da Imobiliária, junto à área do Tom. Pólen é
apresentada separadamente como secretária 24h.

| Agente | Caminho | O que faz na prática | Gatilho | Status |
|---|---|---|---|---|
| **Zara · Direção Operacional** | cabeçalho da seção interna `agentes_ia` em `src/AdminNovo.jsx` | Papel de liderança que coordena os agentes e a execução recorrente do funil/rotina. Não é um agente de backend novo. | seção Agentes Operacionais | Papel de UI/produto |
| Iago | `src/AdminNovo.jsx` · `AGENTES_INICIAIS` | Cartão de qualificação por orçamento, metragem, hectares e garantias. | rotina de qualificação | Cartão e estado local; execução autônoma não é implementada por esse cartão |
| Téo | `src/AdminNovo.jsx` · `AGENTES_INICIAIS` | Cartão de agendamento de visitas. | rotina de visitas | Cartão e estado local |
| Lara | `src/AdminNovo.jsx` · `AGENTES_INICIAIS` | Cartão de estruturação de propostas. | rotina de propostas | Cartão e estado local |
| Heitor | `src/AdminNovo.jsx` · `AGENTES_INICIAIS` | Cartão de reativação de base fria. | rotina de reativação | Cartão e estado local |
| Nina | `src/AdminNovo.jsx` · `AGENTES_INICIAIS` | Cartão de onboarding e checklist de crédito (inativo por padrão). | análise de crédito | Cartão e estado local |
| Mônica | `src/AdminNovo.jsx` · `AGENTES_INICIAIS` | Cartão de VGV, comissões e repasses. | rotina financeira | Cartão e estado local |
| **Pólen · Secretária 24h** (id interno `sofia`) | `src/agent/sofiaPrompt.js`, `src/components/Secretaria.jsx` e simulador da Central de IA | Atendimento e triagem de clientes no WhatsApp; a conexão de produção depende da integração externa. | mensagem recebida no WhatsApp do tenant | Produto separado; simulador no painel |
| Hermes Copiloto | `src/agent/hermesClient.js` + aba `copiloto` | Copiloto operacional: resume ficha, cruza dados e executa tarefa no painel. | aba Copiloto / pergunta do corretor | Ativo |
| Diretor Comercial IA | aba `administrador` | Analisa carteira, meta e onde investir; leitura preditiva com LC 214/2025. | aba Diretor Comercial | Ativo |
| Assistente Fiscal **(do cliente)** | aba `contador` | Orientação tributária na venda do imóvel, ganho de capital e nota do cliente. **Não** é o fiscal da Express Tech. | aba Assistente Fiscal | Ativo |
| Assistente Jurídico | aba `juridico_imobi` | Analisa cláusula, distrato e matrícula com motor legal de 27 UFs. | aba Assistente Jurídico | Ativo |
| **Tom · Segundo Cérebro Estratégico** (id interno `brain`) | `src/components/admin/ExpressBrainTab.jsx` + `src/lib/simuladorTom.js` | Apoio decisório estratégico; o simulador usa `/api/ai` e contexto da conta ou cenário demonstrativo. Arquivos e memória operacional persistente estão em implantação. | aba interna `brain` / botão do simulador | Simulador ativo; base estratégica em implantação |

> Esses agentes **não** são skills do Hermes: são código do produto, executados no painel/WhatsApp do
> cliente. Não confundir com os agentes internos da seção 7.

---

## 2. Agentes de código e orquestração (repositório)

| Agente / módulo | Caminho | O que faz na prática | Gatilho | Status |
|---|---|---|---|---|
| Agente de Segurança | `src/agent/agentesExtras.js` | Audita entrada em busca de chave exposta, falha de segurança ou injection. | intenção com "segurança", "vulnerabilidade", "auditoria", "senha" | Ativo |
| Agente Programador | `src/agent/agentesExtras.js` | Escreve código React/Node/Tailwind limpo e pronto para produção. | intenção com "código", "react", "componente", "função" | Ativo |
| Router Hermes | `src/agent/hermesRouter.js` | Decide qual agente responde a cada mensagem (regra por palavra-chave). | toda mensagem que entra no copiloto | Ativo |
| Cliente Hermes | `src/agent/hermesClient.js` | Chama o endpoint `/api/ai` com o prompt do agente e devolve o texto. | chamada interna dos agentes acima | Ativo |
| Prompt Imobi | `src/agent/imobiPrompt.js` | Persona e regras do copiloto no contexto imobiliário. | carregado pelo router | Ativo |
| Prompt Pólen | `src/agent/sofiaPrompt.js` | Persona (**Pólen** desde D-22.02), travas (escopo, zero alucinação, LGPD), catálogo real formatado, triagem por nicho e handoff `CHAMAR_IAGO`/`CHAMAR_CORRETOR` da atendente. Monta o payload do `/api/ai` sem nenhuma chave (D-21.06). | atendimento de lead no WhatsApp / modo suporte ou simulação | Ativo |
| Prompt Tom | `src/lib/simuladorTom.js` | Persona do Tom (maestro), resumo da operação (real ou cenário de demonstração declarado), 4 ações de 1 clique e payload do `/api/ai` (D-22.02). | simulador da aba `brain` | Ativo |
| Proxy de IA | `api/ai.js` + `api/_authToken.js` + `api/_gatilho.js` | Fala com DeepSeek/Groq/Gemini/Zhipu/SiliconFlow com chave no servidor, exige ID token, aplica teto de payload, mídia (imagem/áudio/PDF no Gemini) e remove o bloco `[GATILHO_HERMES]` antes de devolver o texto (D-21.07). | qualquer chamada de IA do painel | Ativo |

---

## 3. Skills Express Tech (Hermes global)

Estas são as skills de departamento que eu carrego por tarefa.

| Skill | Caminho | O que faz na prática | Gatilho | Status |
|---|---|---|---|---|
| `tecnologia` | `AppData/Local/hermes/skills/express-tech/tecnologia/SKILL.md` | Guia React/Firebase do projeto pelo grafo de código; regra de diagnóstico por hash de bundle. | tarefa de implementação ou bug no produto | Ativo |
| `comercial` | `AppData/Local/hermes/skills/express-tech/comercial/SKILL.md` | Monta listas de leads e abordagem consultiva B2B (nunca spam). | prospecção, lista de empresas, abordagem | Ativo |
| `marketing` | `AppData/Local/hermes/skills/express-tech/marketing/SKILL.md` | Cria pacotes de conteúdo para aprovação humana em `Desktop/express-tech-marketing/pendentes/`. | post, campanha, copy, calendário editorial | Ativo |
| `operacoes` | `AppData/Local/hermes/skills/express-tech/operacoes/SKILL.md` | Onboarding de cliente, rotina de suporte e checklist de implantação. | cliente novo, suporte, implantação | Ativo |
| `skill-auditoria-zero-erro` | `AppData/Local/hermes/skills/express-tech/skill-auditoria-zero-erro/SKILL.md` | Checklist obrigatório antes de concluir: fato com fonte, zero dado inventado, zero chave exposta, alinhamento com `05-decisoes-ativas.md`. | fechar qualquer entrega, "prove que funciona" | Ativo |
| `skill-saude-financeira` | `AppData/Local/hermes/skills/express-tech/skill-saude-financeira/SKILL.md` | Margem, custo de API/nuvem e regra de caixa (SaaS PRO + automações a partir de R$ 450) antes de codar; gate de ROI de 5 linhas. | preço, plano, custo de IA, "vale a pena construir?" | Ativo |
| `skill-compliance-lgpd` | `AppData/Local/hermes/skills/express-tech/skill-compliance-lgpd/SKILL.md` | Prospecção B2B só com dado público de empresa, cadência 1+1, opt-out no mesmo dia e isolamento por `oficinaId` no Firestore. | coleta de lead, cadência, descadastro, query multi-tenant | Ativo |

---

## 3.1 Agente interno da Express Tech (não é do produto)

| Agente | Caminho | O que faz na prática | Gatilho | Status |
|---|---|---|---|---|
| `assistente-fiscal-interno` | `agents/assistente-fiscal-interno.md` (regra em `company-brain/06-governanca-lei-financeiro.md`) | Cuida da saúde tributária da **própria Express Tech**: NFSe de SaaS e serviços, provisão de imposto sobre o caixa, enquadramento e impacto prático da LC 214/2025. Sempre exige validação do contador. | "fechamento do mês", "impacto fiscal de X", "NFSe", "reforma tributária" | Ativo (regra) |

> Diferença que não pode se perder: o **Assistente Fiscal do Produto** atende o cliente (aba `contador`);
> o **`assistente-fiscal-interno`** cuida só da Express Tech. Regras completas em
> `06-governanca-lei-financeiro.md`.

---

## 4. Skills do projeto (Opensquad · `skills/`)

Framework de orquestração de squads instalado no repositório. `squads/` está vazio (só `.gitkeep`):
nenhum squad de cliente foi criado ainda.

| Skill | Caminho | O que faz na prática | Gatilho | Status |
|---|---|---|---|---|
| `apify` | `skills/apify/SKILL.md` | Raspa sites e roda Actors prontos para extrair dados. | coletar dados de site ou anúncio | Ativo |
| `blotato` | `skills/blotato/SKILL.md` | Publica e agenda posts em Instagram, LinkedIn, X e TikTok. | publicar/agendar conteúdo social | Ativo |
| `canva` | `skills/canva/SKILL.md` | Cria, busca, preenche e exporta designs no Canva. | gerar peça visual no Canva | Ativo |
| `image-ai-generator` | `skills/image-ai-generator/SKILL.md` | Gera imagem por modelo de IA via OpenRouter (modo teste e final). | criar imagem por IA | Ativo |
| `image-creator` | `skills/image-creator/SKILL.md` | Renderiza HTML/CSS em PNG/JPG via Playwright. | transformar layout em imagem | Ativo |
| `image-fetcher` | `skills/image-fetcher/SKILL.md` | Busca imagem na web, tira screenshot de site e organiza ativos. | buscar ou extrair imagem | Ativo |
| `instagram-publisher` | `skills/instagram-publisher/SKILL.md` | Publica carrossel no Instagram a partir de imagens locais. | publicar carrossel | Ativo |
| `resend` | `skills/resend/SKILL.md` | Envia e-mail transacional pelo Resend (simples e em lote). | disparar e-mail de sistema | Ativo |
| `template-designer` | `skills/template-designer/SKILL.md` | Escolhe e varia template visual para peças de imagem. | definir template de arte | Ativo |
| `opensquad-agent-creator` | `skills/opensquad-agent-creator/SKILL.md` | Cria e mantém arquivos de best-practice do Opensquad. | criar/atualizar best-practice | Ativo |
| `opensquad-skill-creator` | `skills/opensquad-skill-creator/SKILL.md` | Cria, melhora e avalia skills do Opensquad (com agentes analyzer/comparator/grader). | criar ou avaliar skill | Ativo |

### Workflows de instrução

| Arquivo | Caminho | Papel | Status |
|---|---|---|---|
| Regras do Opensquad | `.agent/rules/opensquad.md` | Define comandos `/opensquad`, estrutura de pastas e limites (não editar `_opensquad/`). | Ativo |
| Workflow do Opensquad | `.agent/workflows/opensquad.md` | Passo a passo de ativação, onboarding e menu principal. | Ativo |
| Memória | `_opensquad/_memory/preferences.md` | Nome do usuário, idioma (pt-BR) e IDE. | Ativo |
| Governança fiscal | `company-brain/06-governanca-lei-financeiro.md` | Regras fiscais internas da Express Tech e limites do agente. | Ativo |

---

## 5. Skills globais do Hermes (catálogo da máquina)

Instaladas em `AppData/Local/hermes/skills/`. São ferramenta de base, não regra de negócio.

| Skill | Caminho | O que faz na prática | Gatilho | Status |
|---|---|---|---|---|
| `apple-notes` | `AppData/Local/hermes/_archived_skills/apple/apple-notes/SKILL.md` | Manage Apple Notes via memo CLI: create, search, edit | Apple Notes (macOS) | Arquivado |
| `apple-reminders` | `AppData/Local/hermes/_archived_skills/apple/apple-reminders/SKILL.md` | Apple Reminders via remindctl: add, list, complete | Apple Lembretes (macOS) | Arquivado |
| `findmy` | `AppData/Local/hermes/_archived_skills/apple/findmy/SKILL.md` | Track Apple devices/AirTags via FindMy | localizar dispositivo Apple | Arquivado |
| `imessage` | `AppData/Local/hermes/_archived_skills/apple/imessage/SKILL.md` | Send and receive iMessages/SMS via the imsg CLI on macOS | iMessage/SMS (macOS) | Arquivado |
| `claude-code` | `AppData/Local/hermes/skills/autonomous-ai-agents/claude-code/SKILL.md` | Delegate coding to Claude Code CLI (features, PRs) | delegar feature/PR ao CLI do Claude | Ativo |
| `codex` | `AppData/Local/hermes/skills/autonomous-ai-agents/codex/SKILL.md` | Delegate coding to OpenAI Codex CLI (features, PRs) | delegar feature/PR ao Codex | Ativo |
| `computer-use` | `AppData/Local/hermes/skills/autonomous-ai-agents/computer-use/SKILL.md` | Drive the desktop background-first; escalate on signal | operar o desktop por screenshot | Ativo |
| `hermes-agent` | `AppData/Local/hermes/skills/autonomous-ai-agents/hermes-agent/SKILL.md` | Use, configure, theme, extend, and orchestrate Hermes Agent | configurar ou estender o próprio Hermes (MCP, skills, tema) | Ativo |
| `caveman` | `AppData/Local/hermes/_archived_skills/caveman/SKILL.md` | Terse caveman voice; answer first, keep every fact | quando o usuário pedir voz telegráfica | Arquivado |
| `clean-web-reader` | `AppData/Local/hermes/skills/clean-web-reader/SKILL.md` | Use when reading web pages; strip chrome, keep main text | ler qualquer página web | Ativo |
| `codebase-memory` | `AppData/Local/hermes/skills/codebase-memory/SKILL.md` | Use the codebase knowledge graph for structural code queries | pergunta estrutural sobre o código (grafo) | Ativo |
| `architecture-diagram` | `AppData/Local/hermes/skills/creative/architecture-diagram/SKILL.md` | Dark-themed SVG architecture/cloud/infra diagrams as HTML | diagrama de arquitetura em SVG | Ativo |
| `ascii-video` | `AppData/Local/hermes/skills/creative/ascii-video/SKILL.md` | ASCII video: convert video/audio to colored ASCII MP4/GIF | vídeo convertido em ASCII | Ativo |
| `baoyu-infographic` | `AppData/Local/hermes/skills/creative/baoyu-infographic/SKILL.md` | Infographics: 21 layouts x 21 styles (信息图, 可视化) | infográfico em layouts prontos | Ativo |
| `claude-design` | `AppData/Local/hermes/skills/creative/claude-design/SKILL.md` | Design one-off HTML artifacts (landing, deck, prototype) | landing, deck ou protótipo HTML | Ativo |
| `humanizer` | `AppData/Local/hermes/skills/creative/humanizer/SKILL.md` | Humanize text: strip AI-isms and add real voice | tirar cara de IA do texto | Ativo |
| `manim-video` | `AppData/Local/hermes/skills/creative/manim-video/SKILL.md` | Manim CE animations: 3Blue1Brown math/algo videos | animação matemática (Manim) | Ativo |
| `p5js` | `AppData/Local/hermes/skills/creative/p5js/SKILL.md` | p5 | arte generativa p5.js | Ativo |
| `popular-web-designs` | `AppData/Local/hermes/skills/creative/popular-web-designs/SKILL.md` | 54 real design systems (Stripe, Linear, Vercel) as HTML/CSS | referência de design system real | Ativo |
| `songwriting-and-ai-music` | `AppData/Local/hermes/skills/creative/songwriting-and-ai-music/SKILL.md` | Songwriting craft and Suno AI music prompts | letra e prompt de música | Ativo |
| `sdlc-review` | `AppData/Local/hermes/_archived_skills/devops/sdlc-review/SKILL.md` | Review Kanban handoffs and route verified outcomes | revisar handoff de Kanban | Arquivado |
| `email-inbox-triage` | `AppData/Local/hermes/skills/email/email-inbox-triage/SKILL.md` | Triage an inbox: prioritize threads, draft replies safely | triagem de caixa de entrada | Ativo |
| `himalaya` | `AppData/Local/hermes/_archived_skills/email/himalaya/SKILL.md` | Himalaya CLI: IMAP/SMTP email from terminal | e-mail por IMAP/SMTP no terminal | Arquivado |
| `comercial` | `AppData/Local/hermes/skills/express-tech/comercial/SKILL.md` | Comercial B2B Express Tech: listas e abordagem consultiva | uso geral | Ativo |
| `marketing` | `AppData/Local/hermes/skills/express-tech/marketing/SKILL.md` | Marketing Express Tech: pacotes de conteúdo p/ aprovação | uso geral | Ativo |
| `operacoes` | `AppData/Local/hermes/skills/express-tech/operacoes/SKILL.md` | Operações Express Tech: onboarding e rotina de suporte | uso geral | Ativo |
| `tecnologia` | `AppData/Local/hermes/skills/express-tech/tecnologia/SKILL.md` | Tecnologia Express Tech: React/Firebase guiado pelo grafo | uso geral | Ativo |
| `youtube-content` | `AppData/Local/hermes/skills/media/youtube-content/SKILL.md` | YouTube transcripts to summaries, threads, blogs | transcrição de YouTube → resumo ou blog | Ativo |
| `obsidian` | `AppData/Local/hermes/skills/note-taking/obsidian/SKILL.md` | Read, search, create, and edit notes in the Obsidian vault | notas do vault Obsidian | Ativo |
| `document-to-action-items` | `AppData/Local/hermes/skills/productivity/document-to-action-items/SKILL.md` | Extract cited obligations, deadlines, tasks from documents | documento → obrigações e prazos | Ativo |
| `google-workspace` | `AppData/Local/hermes/_archived_skills/productivity/google-workspace/SKILL.md` | Gmail, Calendar, Drive, Docs, Sheets via gws CLI or Python | Gmail, Calendar, Drive, Docs e Sheets | Arquivado |
| `maps` | `AppData/Local/hermes/skills/productivity/maps/SKILL.md` | Geocode, POIs, routes, timezones via OpenStreetMap/OSRM | geocodificar, POI, rota ou fuso | Ativo |
| `meeting-action-items` | `AppData/Local/hermes/skills/productivity/meeting-action-items/SKILL.md` | Turn meeting notes into cited decisions, owners, tickets | notas de reunião → decisões e tickets | Ativo |
| `microsoft-office` | `AppData/Local/hermes/skills/productivity/microsoft-office/SKILL.md` | Create, read, and edit Word, PowerPoint, and Excel files | docx, pptx e xlsx | Ativo |
| `pdf` | `AppData/Local/hermes/skills/productivity/pdf/SKILL.md` | PDF files: create, read, merge, fill, OCR, edit text | criar, ler ou preencher PDF | Ativo |
| `product-price-monitor` | `AppData/Local/hermes/skills/productivity/product-price-monitor/SKILL.md` | Watch product, flight, or listing prices; alert on target | acompanhar preço de produto ou voo | Ativo |
| `teams-meeting-pipeline` | `AppData/Local/hermes/_archived_skills/productivity/teams-meeting-pipeline/SKILL.md` | Teams meeting summaries, job replay, Graph subscriptions | pipeline de reunião do Teams | Arquivado |
| `weekly-review-planning` | `AppData/Local/hermes/skills/productivity/weekly-review-planning/SKILL.md` | Weekly reset: commitments, stalled work, next-week plan | reset semanal de compromissos | Ativo |
| `arxiv` | `AppData/Local/hermes/skills/research/arxiv/SKILL.md` | Search arXiv papers by keyword, author, category, or ID | buscar paper no arXiv | Ativo |
| `competitor-news-monitor` | `AppData/Local/hermes/skills/research/competitor-news-monitor/SKILL.md` | Watch named companies for material news; cited digests | monitorar notícia de concorrente | Ativo |
| `grounded-citations` | `AppData/Local/hermes/skills/research/grounded-citations/SKILL.md` | Ground answers and documents in cited, verifiable sources | resposta com citação verificável | Ativo |
| `xurl` | `AppData/Local/hermes/_archived_skills/social-media/xurl/SKILL.md` | X/Twitter via xurl CLI: raw post search, posting, DM, media | X/Twitter via CLI | Arquivado |
| `codebase-inspection` | `AppData/Local/hermes/skills/software-development/codebase-inspection/SKILL.md` | Inspect codebases w/ pygount: LOC, languages, ratios | contar LOC e linguagens (pygount) | Ativo |
| `dogfood` | `AppData/Local/hermes/skills/software-development/dogfood/SKILL.md` | Exploratory QA of web apps: find bugs, evidence, reports | QA exploratório de app web | Ativo |
| `github` | `AppData/Local/hermes/skills/software-development/github/SKILL.md` | GitHub via gh CLI: PRs, issues, reviews, repos, auth | PR, issue, review ou repo via gh | Ativo |
| `requesting-code-review` | `AppData/Local/hermes/skills/software-development/requesting-code-review/SKILL.md` | Pre-commit review: security scan, quality gates, auto-fix | revisão pré-commit de código | Ativo |
| `simplify-code` | `AppData/Local/hermes/skills/software-development/simplify-code/SKILL.md` | Parallel 4-agent cleanup of recent code changes | limpar código recém-escrito | Ativo |
| `spike` | `AppData/Local/hermes/skills/software-development/spike/SKILL.md` | Throwaway experiments to validate an idea before build | validar ideia com protótipo descartável | Ativo |
| `systematic-debugging` | `AppData/Local/hermes/skills/software-development/systematic-debugging/SKILL.md` | 4-phase root cause debugging: understand bugs before fixing | bug sem causa óbvia | Ativo |
| `test-driven-development` | `AppData/Local/hermes/skills/software-development/test-driven-development/SKILL.md` | TDD: enforce RED-GREEN-REFACTOR, tests before code | escrever código com teste antes | Ativo |
| `blocked-page-recovery` | `AppData/Local/hermes/skills/web/blocked-page-recovery/SKILL.md` | Use when a fetch fails: 403/429, paywall, WAF, bot wall | fetch bloqueado (403/429/paywall) | Ativo |

### Skills arquivadas em 2026-11-20 → `AppData/Local/hermes/_archived_skills/`

Movidas para fora do carregamento ativo. Não foram apagadas: o diretório `_archived_skills/` fica fora de
`skills/`, preserva a categoria original e pode ser restaurado com `mv` se o motivo deixar de existir.

| Skill | Caminho arquivado | Motivo |
|---|---|---|
| `apple-notes`, `apple-reminders`, `findmy`, `imessage` | `_archived_skills/apple/…` | exigem macOS; esta máquina é Windows |
| `caveman` | `_archived_skills/caveman/` | voz de gíria, sem uso na operação |
| `himalaya` | `_archived_skills/email/himalaya/` | sem conta/credencial configurada |
| `xurl` | `_archived_skills/social-media/xurl/` | sem conta/credencial configurada |
| `google-workspace` | `_archived_skills/productivity/google-workspace/` | sem OAuth configurado; descrição vazia no frontmatter |
| `teams-meeting-pipeline` | `_archived_skills/productivity/teams-meeting-pipeline/` | sem OAuth configurado; descrição vazia no frontmatter |
| `sdlc-review` | `_archived_skills/devops/sdlc-review/` | fluxo de Kanban/handoff que não usamos |

Reativar só com motivo novo registrado em `05-decisoes-ativas.md`.

---

## 6. Lacunas de nomenclatura (o que a auditoria não achou)

| Procurado | Resultado |
|---|---|
| Workflows do n8n | **nenhum arquivo** no disco (0 `.json` com cara de workflow). A integração existe só como contrato: `VITE_MAPS_WEBHOOK_URL` → `/api/places`. |
| `company-brain/` anterior | não existia |
| `AGENTS.md` / `HERMES.md` / `.cursorrules` | nenhum — criado nesta rodada (`AGENTS.md` na raiz do repo) |
| Projeto English Core 200 | não localizado no disco |

---

## 7. Agentes Núcleo da Operação Interna (ativos desde 2026-11-20)

Criados nesta rodada. Arquivo de definição em `agents/<slug>.md`; todos leem o Company Brain via MCP
(`brain_ler`) antes de responder e não publicam, não disparam e não commitam sozinhos.

| Agente | Arquivo | Papel | Gatilho | Status |
|---|---|---|---|---|
| **Gerente Geral** | `agents/gerente-geral.md` | Prioriza o dia pelo que aumenta receita (demo, trial, venda), barra feature fora do roadmap validado e exige `skill-auditoria-zero-erro`. | início do dia/semana, prioridade indefinida | Ativo (Operação Principal) |
| **CFO e Compliance** | `agents/cfo-compliance.md` | Controla custo fixo/variável, MRR, margem e consumo de API de IA com `skill-saude-financeira` + `skill-compliance-lgpd` antes de qualquer gasto ou campanha. | preço, desconto, contrato, API paga, lista de leads | Ativo (Operação Principal) |
| **Assistente Fiscal Interno** | `agents/assistente-fiscal-interno.md` | Saúde tributária da Express Tech: NFSe, provisão, enquadramento, LC 214/2025 (sempre com validação do contador). | fechamento do mês, impacto fiscal, NFSe, reforma | Em Espera (Standby) |
| **Pesquisador de Empresas** | `agents/pesquisador-empresas.md` | Prospecção qualificada via `CapturaLeadsMaps` + `maps` + `skill-compliance-lgpd`. | "monte a lista de X em Y" | Ativo (Operação Principal) |
| **SDR e Atração** | `agents/sdr-atracao.md` | Abordagem consultiva 1:1 via `comercial` + `resend` + `skill-compliance-lgpd` + `skill-auditoria-zero-erro`. | abordar lead, follow-up, objeção | Ativo (Operação Principal) |
| **Editor de Conteúdo** | `agents/editor-conteudo.md` | Roteiro, corte e criativo para aprovação via `marketing` + `youtube-content` + `blotato` + `image-creator`. | post, vídeo, campanha, calendário | Em Espera (Standby) |
| **Assistente Pessoal** | `agents/assistente-pessoal.md` | Rotina, follow-ups e estudos, sem competir com o foco técnico/comercial. | "organiza minha semana", caixa de entrada | Em Espera (Standby) |

**Operação Principal** (2026-11-20) — `gerente-geral`, `cfo-compliance`, `pesquisador-empresas` e
`sdr-atracao` puxam a rotina: priorizam receita, controlam caixa e trazem lead qualificado.
**Em Espera (Standby)** — `assistente-fiscal-interno`, `editor-conteudo` e `assistente-pessoal` existem e
são acionáveis, mas ficam fora da rotina diária até decisão do fundador (ou até o gatilho aparecer:
fechamento fiscal, campanha aprovada, organização de rotina).

### Comandos de acionamento (Hermes)

```
Gerente Geral            -> "Gerente geral: monte as 3 prioridades de hoje pelo impacto no caixa"
CFO e Compliance         -> "CFO: revisar custo e margem de <decisão/oferta> antes de eu codar"
Fiscal Interno           -> "Fiscal interno: revisar o fechamento fiscal do mês"
Pesquisador de Empresas  -> "Pesquisador: lista de <nicho> em <cidade> para abordagem"
SDR e Atração            -> "SDR: escreva a abordagem 1:1 para <empresa> usando os dados da lista"
Editor de Conteúdo       -> "Editor: roteiro de <tema> para Reels + peça visual para aprovação"
Assistente Pessoal       -> "Assistente pessoal: organiza meu dia e os follow-ups em aberto"
```

**Regra de criação:** um agente novo só nasce se (a) não houver equivalente nas seções 1–7,
(b) tiver gatilho explícito e (c) entrar nesta tabela no mesmo commit.
