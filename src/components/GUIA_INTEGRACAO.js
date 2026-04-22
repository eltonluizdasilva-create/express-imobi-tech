/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GUIA DE INTEGRAÇÃO: ESTRUTURA COMPLETA EXPRESS AUTO TECH
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Você agora tem 3 arquivos interconectados:
 * 
 * 1. BaseConhecimentoOficinIA.js     (Dados estruturados)
 * 2. useOficinaBD.js                 (Hook que gerencia contexto + chat)
 * 3. AbaAjudaIA.jsx                  (Componente refatorado)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 1: ESTRUTURA DE PASTAS RECOMENDADA
// ═══════════════════════════════════════════════════════════════════════════

/*
seu-projeto/
├── src/
│   ├── components/
│   │   └── AbaAjudaIA/
│   │       └── AbaAjudaIA.jsx          ← Componente UI
│   │
│   ├── hooks/
│   │   └── useOficinaBD.js             ← Hook de lógica
│   │
│   ├── data/
│   │   └── BaseConhecimentoOficinIA.js ← Base de conhecimento
│   │
│   └── pages/
│       └── Dashboard.jsx               ← Onde você importa AbaAjudaIA
*/

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 2: IMPORTAÇÕES CORRETAS EM SEUS ARQUIVOS
// ═══════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// EM: useOficinaBD.js
// ──────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import { useGroq } from './useGroq'; // Seu hook existente
import CONHECIMENTO_OFICINA_IA, {
    gerarContextoPorAba,
    buscarPorTag,
} from '../data/BaseConhecimentoOficinIA';

// Resto do hook...

// ──────────────────────────────────────────────────────────────────────────
// EM: AbaAjudaIA.jsx
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import { useOficinaBD } from '../hooks/useOficinaBD'; // ✅ Hook
import {
    Sparkles,
    X,
    Mic,
    MicOff,
    Send,
    RotateCcw,
    Download,
} from 'lucide-react';

// Resto do componente...

// ──────────────────────────────────────────────────────────────────────────
// EM: sua página principal (ex: Dashboard.jsx)
// ──────────────────────────────────────────────────────────────────────────

import AbaAjudaIA from '../components/AbaAjudaIA/AbaAjudaIA';

export default function Dashboard() {
    const [abaAtiva, setAbaAtiva] = useState('visao_geral');

    return (
        <div className="flex">
            {/* Seu menu de abas */}
            <nav className="w-64 bg-black">
                <button onClick={() => setAbaAtiva('visao_geral')}>
                    Visão Geral
                </button>
                <button onClick={() => setAbaAtiva('estoque')}>
                    Estoque
                </button>
                <button onClick={() => setAbaAtiva('financeiro')}>
                    Financeiro
                </button>
                {/* ... mais abas */}
            </nav>

            {/* Chat IA que se adapta à aba */}
            <div className="flex-1">
                <AbaAjudaIA
                    abaAtiva={abaAtiva}
                    onBack={() => console.log('Voltando...')}
                    isFloating={false}
                />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 3: COMO FUNCIONA O FLUXO
// ═══════════════════════════════════════════════════════════════════════════

/*
1. USUÁRIO digita mensagem em AbaAjudaIA.jsx
   └─ handleEnviar() → enviarMensagem()

2. useOficinaBD.js recebe mensagem
   └─ extrairKeywords() → ["ticket", "lucro"]
   └─ buscarContextoRelevante() → busca em BaseConhecimentoOficinIA
   └─ gerarContextoPorAba() → pega contexto da aba ativa

3. Prompt é construído com:
   ┌─ Identidade do especialista
   ├─ Contexto da aba ativa
   ├─ Base de conhecimento RAG (apenas relevante)
   ├─ Histórico de chat (últimas 10 msgs)
   └─ Mensagem do usuário

4. Groq API processa e retorna resposta
   └─ Resposta é exibida em AbaAjudaIA.jsx
   └─ Chat history é atualizado
   └─ Auto-scroll para bottom

5. PRÓXIMA mensagem mantém contexto das anteriores
   └─ Memória de conversa funciona!
*/

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 4: COMO ESTENDER A BASE DE CONHECIMENTO
// ═══════════════════════════════════════════════════════════════════════════

/*
Se você quer adicionar um novo módulo ou feature:

1. Abra BaseConhecimentoOficinIA.js

2. Adicione em ABAS_GESTAO:
*/

NOVO_MODULO: {
    nome: "Novo Módulo",
        icone: "📌",
            descricao: "Descrição breve do que faz",
                funcionalidades: [
                    "Feature 1",
                    "Feature 2",
                ],
                    exemplos_perguntas: [
                        "Como usar Feature 1?",
                        "Qual é o benefício?",
                    ],
                        tags: ["nova", "feature", "palavra-chave"], // ← IMPORTANTE: tags para RAG
}

/*
3. Agora qualquer pergunta sobre "nova" ou "feature"
   vai automaticamente recuperar esse módulo via buscarPorTag()

4. O prompt inteligente incluirá:
   "📌 Relacionado a 'feature': Novo Módulo: Descrição..."
*/

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 5: PERSONALIZAÇÕES RECOMENDADAS
// ═══════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// A) Mudar cor da interface (vermelho para outro)
// ──────────────────────────────────────────────────────────────────────────

// Em AbaAjudaIA.jsx, procure por "red-600" e troque por sua cor:
// red-600 → blue-600 (azul)
// red-600 → green-600 (verde)
// red-600 → purple-600 (roxo)

// ──────────────────────────────────────────────────────────────────────────
// B) Adicionar mais perguntas de exemplo na interface
// ──────────────────────────────────────────────────────────────────────────

// Em AbaAjudaIA.jsx, adicione um componente de "Quick Tips":

function QuickTips({ contexto }) {
    const dicas = {
        visao_geral: [
            "Quanto vou faturar nos próximos 30 dias?",
            "Por que meu faturamento está zerado?",
            "Como ativar o Forecast?",
        ],
        financeiro: [
            "Como aumentar minha margem?",
            "Qual é o Assistente Fiscal?",
        ],
        estoque: [
            "Quais peças estão paradas?",
            "Como calcular giro ABC?",
        ],
    };

    return (
        <div className="p-4 space-y-2">
            {dicas[contexto]?.map((dica, i) => (
                <button
                    key={i}
                    onClick={() => setMensagem(dica)}
                    className="w-full text-left px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors"
                >
                    💡 {dica}
                </button>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────
// C) Integrar com seu dashboard de metricas
// ──────────────────────────────────────────────────────────────────────────

// Se você tem dados reais (faturamento, estoque, etc), passe pro contexto:

// Em seu Dashboard.jsx:
const [dados, setDados] = useState({
    faturamento: 0,
    estoque_total: 0,
    clientes_ativos: 0,
});

// Passe para AbaAjudaIA:
<AbaAjudaIA
    abaAtiva={abaAtiva}
    dados={dados} // ← novo prop
    onBack={() => { }}
/>

// Em useOficinaBD, use os dados no prompt:
const promptSupremo = `
...
DADOS REAIS DO USUÁRIO:
- Faturamento atual: R$ ${dados.faturamento}
- Estoque: ${dados.estoque_total} itens
- Clientes ativos: ${dados.clientes_ativos}
...
`

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 6: TESTES RECOMENDADOS
// ═══════════════════════════════════════════════════════════════════════════

/*
TESTE 1: Mudança de aba
├─ Abra o chat em VISÃO_GERAL
├─ Pergunte: "Qual é meu faturamento?"
├─ Mude para FINANCEIRO
├─ Pergunte novamente: "E agora?"
└─ Esperado: Resposta diferente baseada no contexto da aba

TESTE 2: RAG funcionando
├─ Pergunte: "Como aumentar ticket?"
├─ Resposta deve incluir info sobre TICKET_MEDIO de BaseConhecimento
└─ Verifique se formula aparece

TESTE 3: Histórico de chat
├─ Pergunte: "Sou novo aqui, como começo?"
├─ Depois: "E qual é o primeiro passo?"
├─ Esperado: IA lembra do contexto anterior

TESTE 4: Voice input
├─ Clique no ícone de microfone
├─ Diga algo em português
├─ Esperado: Transcrição aparece no input
└─ Envie (Enter) e veja resposta

TESTE 5: Exportar histórico
├─ Converse alguns tópicos
├─ Clique em ⋮ → "Exportar histórico"
├─ Arquivo JSON deve fazer download
└─ Abra e veja toda conversa estruturada
*/

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 7: TROUBLESHOOTING
// ═══════════════════════════════════════════════════════════════════════════

/*
❌ PROBLEMA: "Cannot find module BaseConhecimentoOficinIA"
✅ SOLUÇÃO:
   - Verifique o caminho de importação em useOficinaBD.js
   - Use path relativo correto: '../data/BaseConhecimentoOficinIA'
   - Ou configure um alias em tsconfig.json:
     {
       "compilerOptions": {
         "paths": {
           "@data/*": ["src/data/*"]
         }
       }
     }
   - Então importe: import CONHECIMENTO from '@data/BaseConhecimentoOficinIA'

❌ PROBLEMA: IA não usa contexto da aba
✅ SOLUÇÃO:
   - Certifique de passar corretamente o prop 'abaAtiva' ao componente
   - Verifique se a aba existe em gerarContextoPorAba() em BaseConhecimento
   - Se não, adicione ela

❌ PROBLEMA: Respostas muito curtas ou genéricas
✅ SOLUÇÃO:
   - Aumente a base de conhecimento em BaseConhecimentoOficinIA
   - Adicione mais exemplos em ESTRATEGIAS_LUCRO ou FORMULAS
   - Refine as tags para melhor RAG
   - Aumente max_tokens no prompt (se Groq suportar)

❌ PROBLEMA: Voice input não funciona
✅ SOLUÇÃO:
   - Browser precisa ter https (não http)
   - Permissão de microfone foi negada: reset em chrome://settings/content/siteDetails?site=seu-site
   - Idioma browser pode estar diferente de pt-BR
   - Teste em Chrome/Edge primeiro

❌ PROBLEMA: Chat fica lento com muitas mensagens
✅ SOLUÇÃO:
   - MAX_HISTORICO em useOficinaBD é limitado a 10
   - Se ainda lento, reduza para 6
   - Histórico não é perdido, apenas o prompt fica mais curto
*/

// ═══════════════════════════════════════════════════════════════════════════
// PASSO 8: PRÓXIMOS PASSOS (ROADMAP SUGERIDO)
// ═══════════════════════════════════════════════════════════════════════════

/*
FASE 1 - AGORA (Você implementou)
└─ Chat inteligente com contexto por aba
└─ Base de conhecimento estruturada
└─ Voice input funcionando
└─ Exportar histórico

FASE 2 - PRÓXIMO (Sugerido)
├─ Integrar dados reais do usuário
│  └─ Faturamento, estoque, clientes do API
│  └─ IA analisa dados reais, não genérico
│
├─ Análise profunda
│  └─ "Mostre-me por que meu estoque está alto"
│  └─ IA correlaciona dados com base de conhecimento
│
├─ Recomendações automáticas
│  └─ Ao abrir chat, IA sugere:
│     "Notei que seu estoque está 20% acima. Quer dicas de giro?"
│
└─ Feedback loop
   └─ Usuário avalia resposta (👍/👎)
   └─ IA aprende quais respostas funcionam melhor

FASE 3 - FUTURO
├─ Multi-language (português, inglês, espanhol)
├─ Webhooks: IA dispara ações (criar tarefa, enviar WhatsApp)
├─ Integração com contabilidade automática
└─ Dashboard dinâmico que atualiza conforme conversa
*/

// ═══════════════════════════════════════════════════════════════════════════
// RESUMO EXECUTIVO
// ═══════════════════════════════════════════════════════════════════════════

/*
O QUE VOCÊ GANHOU:

1️⃣ IA ESPECIALIZADA
   └─ Não é genérica. Conhece CADA detalhe do Express Auto Tech

2️⃣ CONTEXTO ADAPTATIVO
   └─ Mudou de aba? IA automaticamente muda de foco

3️⃣ MEMÓRIA DE CONVERSA
   └─ IA lembra do que foi dito antes, não repete

4️⃣ BUSCA INTELIGENTE (RAG)
   └─ Se pergunta sobre "ticket", IA puxa info sobre Ticket Médio

5️⃣ ESCALÁVEL
   └─ Fácil adicionar novos módulos à base de conhecimento

6️⃣ PRONTO PARA PRODUÇÃO
   └─ UI profissional, error handling, voice input

PRÓXIMO PASSO:
└─ Testar com seus dados reais
└─ Adicionar métricas do seu negócio ao contexto
└─ Treinar clientes a usar (simplesmente fazer perguntas!)
*/
