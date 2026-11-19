# 01 — Identidade e Produtos · Express Tech

> **Verdade atual:** 2026-11-20 · Fonte: auditoria do ambiente local + regras definidas pelo fundador.
> Alterou algo? Registre em `05-decisoes-ativas.md` com a data.

---

## 1. A empresa

**Express Tech** — engenharia de Inteligência Artificial e automação comercial, 100% em nuvem
(cloud-first), para pequenas e médias empresas.

| Campo | Valor |
|---|---|
| Base operacional | Araguari & Uberlândia — Triângulo Mineiro / MG |
| Cobertura | Atendimento digital em todo o Brasil |
| Site institucional | `expresstech.com.br` (3 verticais) |
| E-mail oficial | `contato@expresstech.com.br` |
| WhatsApp comercial | `5534991439845` (constante `WHATSAPP_COMERCIAL`) |
| Fundador | Elton Luiz da Silva |
| Projeto Firebase | `express-ai-automation` |

**Propósito:** democratizar IA e automação de ponta para empresas brasileiras.
**Missão:** eliminar o gargalo do atendimento manual e da perda de leads, com sistemas prontos e
agentes que atendem, qualificam e organizam vendas 24 h por dia.
**Visão:** ser referência nacional em SaaS verticais e automação inteligente nos setores
Automotivo, Imobiliário e do Agronegócio.

---

## 2. Verticais e produtos

### 2.1 Express Auto Tech
SaaS de gestão para oficinas mecânicas e auto centers.

| Item | Valor |
|---|---|
| App | `oficina.expresstech.com.br` |
| Código | mesmo monorepo do Imobi Tech (multi-tenant por `oficinaId`, subcoleções `os`, `retornos`) |
| Módulos | Ordens de Serviço digitais, Portal do Cliente com PIN, controle de estoque, financeiro, Assistente Fiscal, Secretária IA no WhatsApp |

### 2.2 Express Imobi Tech
Micro-SaaS e automação WhatsApp multi-agente para corretores e imobiliárias.

| Item | Valor |
|---|---|
| App em produção | `express-imobi-tech-dqgx.vercel.app` · host do painel `imobi.expresstech.com.br` |
| Repositório | `github.com/eltonluizdasilva-create/express-imobi-tech` (branch `main`) |
| Entrada | modo gratuito com trial de 14 dias (tela **Meu Plano**) |
| Módulos PRO | Meta Ads & Criativos · Gestão · Contratos & Assinantes · **7 Agentes de IA** · Hermes Copiloto de Negociação · Diretor Comercial Preditivo (análise **LC 214/2025**) · Assistente Fiscal & Jurídico com motor legal de **27 UFs** · Radar de Captação **OLX/Facebook** · **PTAM ABNT NBR 14.653** · prospecção por região (**Google Maps** → hoje operando por OpenStreetMap) |

**Os 7 agentes do produto** (definidos em `src/AdminNovo.jsx`, `AGENTES_INICIAIS`):

| Agente | Função |
|---|---|
| Sofia | recepção 24 h no WhatsApp (triagem multi-nicho: urbano, loteamento, rural, locação) |
| Iago | qualificação (orçamento, metragem, hectares, garantias) |
| Téo | agendamento de visitas |
| Lara | estruturação de propostas |
| Heitor | reativação de base fria |
| Nina | onboarding e checklist de crédito |
| Hermes | copiloto operacional dentro do painel |

Complementam o plano: assistentes de gestão **Diretor Comercial IA**, **Assistente Fiscal** e
**Assistente Jurídico (Lei do Inquilinato)**.

### 2.3 Express Agro Tech
Automação comercial e atendimento inteligente para revendas agropecuárias, insumos, maquinários e
cooperativas. Vitrine no site institucional (aba âmbar `#F59E0B`); o app próprio ainda não existe —
hoje é oferta de implantação sob medida.

### 2.4 Express Tech (institucional)
`expresstech.com.br` — página única com as 3 verticais em abas (Auto `#EF4444`, Imobi `#10B981`,
Agro `#F59E0B`), fundo `#020408`, seções: hero → portais → dor → verticais → serviços → sobre →
FAQ → contato. Pasta local: `C:\Users\User\Desktop\expresstech-site`.

### 2.5 English Core 200
PWA de estudo de inglês, citado como projeto ativo. **Não localizado no disco deste ambiente** na
auditoria de 2026-11-20 (ver pendência P-01 em `05-decisoes-ativas.md`).

---

## 3. Identidade visual

| Token | Valor | Uso |
|---|---|---|
| Fundo | `#020408` | painéis e site |
| Esmeralda | `#10B981` / `#34d399` | cor principal Imobi Tech |
| Teal | `#0D9488` | gradiente da marca |
| Sky | `#0284C7` | gradiente da marca / links |
| Vermelho | `#EF4444` | vertical Auto Tech |
| Âmbar | `#F59E0B` | vertical Agro Tech |
| Logo | `src/components/ui/LogoExpress.jsx` | tile gradiente + glifo de casa com seta |

Tema escuro é o padrão; existe tema claro com contraste corrigido (`BarraModulos`, `.logo-accent`).
