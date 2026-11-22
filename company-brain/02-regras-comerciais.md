# 02 — Regras Comerciais · Express Tech

> **Verdade atual:** 2026-11-23 · Toda alteração de preço, plano ou política entra aqui **e** em
> `05-decisoes-ativas.md`, com data.

---

## 1. Preços vigentes

### 1.1 Produtos de IA e serviços

| Item | Valor | Observação |
|---|---|---|
| Pólen · Atendimento 24h | **R$ 450/mês** + **implantação R$ 497** | produto independente; contratação consultiva |
| Tom Autônomo | **R$ 197/mês** | implantação R$ 0 |
| Tom Imobiliária | **R$ 497/mês** + **implantação R$ 697** | operação customizada para equipe |
| Add-on Social Vídeo Automático | **R$ 247/mês (8 vídeos)** ou **R$ 347/mês (12 vídeos)** | vídeos acima de 30s: consultar |
| Implantação / agentes de IA sob medida | **a partir de R$ 450** | escopo e proposta próprios; não representa pacote Pólen + Tom |
| Presença Digital & Tráfego | **setup R$ 690** + **gestão opcional R$ 490/mês** | Vitrine/Portal + Google Meu Negócio no setup; verba de anúncios à parte |

Pólen e Tom são produtos independentes: nenhum é incluído automaticamente no outro.

### 1.2 SaaS — Express Imobi Tech

| Plano | Preço | O que entrega |
|---|---|---|
| **Grátis** | **R$ 0** | CRM, funil, agenda, simuladores e Assistente Legal; sem upload de fotos de imóveis |
| **PRO** | **R$ 39,90/mês** ou **R$ 34,90/mês no anual** | Captação & Imóveis, vitrine pública (opt-in), até 7 fotos por imóvel, 7 agentes de IA e módulos PRO; Foto 1 é a capa |
| **PLUS** | **R$ 99,90/mês** ou **R$ 89,90/mês no anual** | Tudo do PRO, até 3 usuários inclusos e teto maior de operação |
| **Pólen · Atendimento 24h** | **R$ 450/mês** + implantação de **R$ 497** | Atendimento comercial automatizado; produto contratado à parte |
| **Tom Autônomo** | **R$ 197/mês** | Segundo cérebro empacotado; implantação R$ 0 |
| **Tom Imobiliária** | **R$ 497/mês** + implantação de **R$ 697** | Operação customizada para imobiliárias |
| **Add-on Social Vídeo Automático** | **R$ 247/mês (8 vídeos)** ou **R$ 347/mês (12 vídeos)** | Add-on com contratação própria |
| **Presença Digital & Tráfego** | **setup R$ 690** + **gestão de tráfego opcional R$ 490/mês** | Vitrine/Portal sincronizado + Google Meu Negócio (no setup); verba de anúncios paga à parte |

No anual, o preço exibido é mensal equivalente e a cobrança usa o link anual específico. As chaves
legadas `essencial_plus -> pro` e `profissional -> plus` são aliases técnicos para compatibilidade.
Foto 1 é a capa do imóvel no portal. A apresentação inicial da Pólen inclui resumo e link direto;
não se deve afirmar envio de foto no WhatsApp até existir integração real de mídia.

Fonte única de verdade técnica: `shared/planos.json` (copiado para `functions/planos.json` por
`scripts/sync-planos.cjs`). **Nunca** digitar preço em componente.

### 1.3 Fonte de preço
Preços, módulos e limites do Express Imobi Tech ficam em `shared/planos.json`; não criar ofertas
duplicadas em componentes ou habilitar produtos pagos por rótulo visual.

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
