# 01 — Identidade e Produtos · Express Tech

> **Verdade atual:** 2026-11-24 · Fonte: auditoria do ambiente local + regras definidas pelo fundador.
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
| Módulos PRO | Captação & Imóveis · Propostas & Negócios (histórico) · Meta Ads & Criativos · **Agentes Operacionais (direção de Zara)** · Hermes Copiloto de Negociação · prospecção por região (**Google Maps** → hoje operando por OpenStreetMap) |

**Módulos exclusivos do PLUS (10):** Correspondente / Crédito · Radar de Captação OLX/Facebook ·
Diretor Comercial IA · Roleta de Leads · Repasses & NF · Vistoria & Laudo IA (`tarefa`) ·
Avaliação de Imóvel PTAM ABNT NBR 14.653 (`avaliacao_imovel`) · Simuladores de Custos (`contador`) ·
Assistente Legal com motor legal de **27 UFs** (`juridico_imobi`) · Reuniões & Atas IA
(`reunioes-atas`: transcrição ao vivo no navegador + ata executiva com pendências enviadas à agenda;
também liberado para quem contrata a IA Tom — D-23.27). O PLUS herda todos os módulos
PRO e Grátis (D-23.20).

**Papéis de IA do produto** (sem alteração de preço ou regra de contratação):

| Papel | Função |
|---|---|
| Sofia | secretária de suporte e pré-vendas da plataforma Express Tech (atende dúvidas sobre planos, suporte, onboarding e configuração); paleta Azul-Ciano (`#0EA5E9` / `#38BDF8`) em fundo escuro (`#080C10`) |
| Zara | direção operacional: coordena agentes e a execução recorrente do funil e da rotina |
| Agentes Operacionais | Iago (qualificação), Téo (visitas), Lara (propostas), Heitor (reativação), Nina (crédito) e Mônica (VGV/repasses) |
| Tom | segundo cérebro/sócio estratégico para arquivos, memória operacional e apoio decisório; recursos de arquivos e memória estão em implantação |
| Pólen | secretária comercial 24 h no WhatsApp da imobiliária (atende compradores, tira dúvidas de imóveis e agenda visitas); paleta Verde-Esmeralda (`#10B981`) + Âmbar (`#F59E0B`) em fundo `#05070A`; pílula `IA PÓLEN · 24H` com abordagem de curiosidade comercial (sem menção explícita de R$ 450). **Roteiro Oficial de Pré-Simulação Bancária:** Nunca pede CPF no WhatsApp (corretor usa o próprio CPF na simulação inicial); preenche automaticamente dados do imóvel pelo cadastro (tipo residencial/comercial, valor, localização cidade/UF/bairro, novo/usado); nunca calcula parcelas (responsabilidade do corretor/correspondente); nunca cita preço da plataforma para o comprador; para clientes à vista pula o checklist e agenda a visita direto; para financiamento envia fechamento acolhedor e opcional com os **7 itens validados** (1. data de nascimento do mais velho, 2. moradia/trabalho na cidade, 3. renda bruta familiar, 4. 3+ anos de FGTS, 5. saldo FGTS > 10% do valor do imóvel para ajudar na entrada, 6. subsídio da União/FGTS após 02/05/2005, 7. composição de renda ou dependente sem renda até 21 anos / 24 universitário). |

O PRO inclui os assistentes **Fiscal** e **Jurídico (Lei do Inquilinato)**; o PLUS acrescenta o
**Diretor Comercial IA** e os demais módulos exclusivos listados acima.

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
