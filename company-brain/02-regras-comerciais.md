# 02 — Regras Comerciais · Express Tech

> **Verdade atual:** 2026-11-23 · Toda alteração de preço, plano ou política entra aqui **e** em
> `05-decisoes-ativas.md`, com data.

---

## 1. Preços vigentes

### 1.1 Automação e serviços (ticket de entrada)

| Item | Valor | Observação |
|---|---|---|
| Implantação / agentes de IA sob medida | **a partir de R$ 450** | piso comercial para filtrar lead e validar demanda B2B |
| Operação IA — Pólen Atendimento 24h + Express Brain | **a partir de R$ 450/mês** + taxa única de implantação | pacote único, venda consultiva e fechamento com especialista |
| Presença Digital & Tráfego | **setup R$ 690** + **gestão opcional R$ 490/mês** | Vitrine/Portal + Google Meu Negócio no setup; verba de anúncios à parte |

O ticket de R$ 450 existe para **qualificar**, não para competir por preço. Abaixo disso, o custo de
atendimento consome a margem.

### 1.2 SaaS — Express Imobi Tech

| Plano | Preço | O que entrega |
|---|---|---|
| **Grátis** | **R$ 0** | CRM, funil, agenda, simuladores e Assistente Legal; sem upload de fotos de imóveis |
| **PRO** | **R$ 39,90/mês** | Captação & Imóveis, vitrine pública (opt-in), até 7 fotos por imóvel, 7 agentes de IA e módulos PRO; Foto 1 é a capa |
| **Operação IA** | **a partir de R$ 450/mês** + taxa única de implantação | Pólen Atendimento 24h + Express Brain no mesmo pacote |
| **Presença Digital & Tráfego** | **setup R$ 690** + **gestão de tráfego opcional R$ 490/mês** | Vitrine/Portal sincronizado + Google Meu Negócio (no setup); verba de anúncios paga à parte |

As chaves antigas `essencial_plus` e `profissional` são aliases técnicos do PRO, não planos ou
ofertas separados. Foto 1 deve ser a apresentação inicial da Pólen; as fotos 2–7 só podem ser
compartilhadas se o cliente pedir explicitamente. O envio de imagem como anexo depende de o canal
WhatsApp oferecer suporte a mídia.

Fonte única de verdade técnica: `shared/planos.json` (copiado para `functions/planos.json` por
`scripts/sync-planos.cjs`). **Nunca** digitar preço em componente.

### 1.3 Express Auto Tech
Mesmo motor comercial (modo gratuito + degraus pagos); preços de tabela ficam em
`shared/planos.json` (`gratis`, `profissional`, `esquadrao_ia`).

---

## 2. Posicionamento e tom de voz

**Posição:** engenharia de IA aplicada, não agência de marketing. O que se vende é
**operação rodando**, com número na mão.

**Tom:** direto, prático, focado em ROI real, tempo economizado e gargalo eliminado. Frases curtas.
Zero jargão técnico na ponta comercial (nada de "orquestração de LLM", "pipeline vetorial").

**Regras de escrita comercial**

1. Falar do problema do cliente antes da tecnologia.
2. Números sempre com contexto (o que significa R$ 39,90/mês frente a uma diária de anúncio).
3. **Nunca** desmerecer o corretor, o gestor ou a equipe dele. A culpa é do processo, não da pessoa.
4. Prova só quando existe: sem depoimento inventado, sem "5,0 no Google", sem métrica fabricada.
5. Uma ideia por parágrafo; verbo no presente; nada de "revolucionário", "disruptivo", "sinérgico".
6. CTA sempre com destino real (cadastro, login, e-mail, WhatsApp) — nunca botão morto.

**O que nunca fazer**

- Spam em massa no WhatsApp ou lista comprada (`skills/express-tech/comercial`).
- Publicar conteúdo sem aprovação humana (`skills/express-tech/marketing`: pacotes vão para
  `Desktop/express-tech-marketing/pendentes/`).
- Prometer módulo que o plano não libera (ver `shared/planos.json`).
- Expor chave, token ou credencial em texto, print, commit ou resposta.

---

## 3. Processo comercial

```
Lead (site / indicação / prospecção por região)
  → diagnóstico (o que trava a operação hoje)
  → demonstração curta com o ambiente real
  → proposta (SaaS pronto ou implantação sob medida)
  → contrato + onboarding assistido
```

- **Prospecção por região:** botão "Capturar leads (Maps)" no Radar de Captação. Sem chave Google,
  roda em OpenStreetMap; salva direto em `oficinas/{id}/leads` com `origem: 'Captura Maps'`.
- **Listas de prospecção:** `Desktop/express-tech-comercial/leads/` (CSV por data e cidade).
- **Abordagem:** consultiva, uma mensagem por vez, com referência ao contexto da empresa. Sem
  sequência automática sem resposta.

---

## 4. Regras de aprovação (invioláveis)

| Ação | Precisa de aprovação explícita? |
|---|---|
| Commit e push | **sim**, sempre, com `git add` nominal por arquivo |
| Deploy (Vercel, Firebase, rules) | **sim** |
| Publicar conteúdo/marketing | **sim** (humano no loop) |
| Criar ou alterar preço/plano | **sim** |
| Alterar dados de produção | **sim** |
| Ler código, rodar testes, gerar diff | não |

Quando autorizado, o `git add` é **nominal** — nunca `git add .` nem `git add -A`.
