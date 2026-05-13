import { useState } from 'react';

/**
 * AGENTES_CONFIG
 * Definições rígidas de Personas e System Prompts para o hub de Inteligência Artificial.
 */
const AGENTES_CONFIG = {
    secretaria: {
        nome: "Secretária Digital",
        prompt: "Você é a Secretária da Oficina. Responda de forma curta, amigável, use emojis e foque no status do serviço do cliente. Seja cordial e encaminhe sempre para o fechamento de serviço."
    },
    triagem: {
        nome: "Triagem Inteligente",
        prompt: "Você é o agente de Triagem Inteligente de Atendimento. Leia a mensagem recebida do cliente e classifique a intenção principal em uma das categorias: ORÇAMENTO, AGENDAMENTO, RECLAMAÇÃO ou DÚVIDA. Em seguida, de forma estruturada, extraia se houver: Nome do cliente, Modelo do veículo e Sintoma relatado. Seja estritamente analítico e objetivo."
    },
    assistente_fiscal: {
        nome: "Assistente Fiscal",
        prompt: "Você é o Assistente Fiscal de apoio operacional da oficina mecânica. Sua função é ler descrições de notas, orçamentos e peças, auxiliando na categorização técnica dessas despesas para a gestão interna da oficina. ATENÇÃO: Você NÃO é um contador e não presta assessoria contábil jurídica ou tributária oficial. Limite-se a ler, interpretar descrições técnicas automotivas e sugerir divisões de custos lógicos (ex: Peças, Serviços, Consumíveis de Oficina, Administrativo)."
    },
    geracao_riqueza: {
        nome: "Gerador de Riqueza",
        prompt: "Você é o Especialista em Engenharia Financeira da Express Auto Tech focado no dono da oficina. Analise o log de serviços/vendas fornecido e elabore um resumo executivo de alto impacto focado puramente na Geração de Riqueza. Destaque: 1) Potencial Oculto de Faturamento, 2) Otimização de ROI sobre serviços recorrentes e 3) Eficiência operacional do pátio. Use um tom direto, altamente profissional e motivador para negócios."
    }
};

/**
 * useAgentesIA
 * Hook central que opera como o 'Segundo Cérebro' do ecossistema Express Auto Tech.
 * Centraliza múltiplos agentes inteligentes utilizando a infraestrutura de alto desempenho SiliconFlow.
 */
export function useAgentesIA() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Configurações de infraestrutura migrados para estabilidade na nuvem Groq
    const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "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";
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    const MODELO = "llama-3.3-70b-versatile"; // Modelo Llama estável de alto desempenho

    /**
     * Função mestra flexível para despachar requisições para qualquer agente cadastrado.
     * @param {string} agenteId - O identificador do agente (ex: 'assistente_fiscal')
     * @param {string} promptUsuario - O texto/input enviado pelo usuário ou sistema
     * @param {Array} historico - Array opcional contendo histórico prévio da conversa
     */
    const chamarAgente = async (agenteId, promptUsuario, historico = []) => {
        const agente = AGENTES_CONFIG[agenteId];
        
        if (!agente) {
            const erroMsg = `Agente '${agenteId}' não está configurado no Hub.`;
            console.error(erroMsg);
            setError(erroMsg);
            throw new Error(erroMsg);
        }

        if (!promptUsuario) return '';

        setLoading(true);
        setError(null);

        console.log(`🧠 [Hub IA] Ativando agente: ${agente.nome} via Groq (Llama 3.3)...`);

        try {
            // Prepara as mensagens com o System Prompt da Persona escolhida
            const messages = [
                { role: 'system', content: agente.prompt },
                ...historico,
                { role: 'user', content: promptUsuario }
            ];

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: MODELO,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const erroServidor = await response.text();
                throw new Error(`Erro na API SiliconFlow (${response.status}): ${erroServidor}`);
            }

            const data = await response.json();
            const respostaFinal = data.choices?.[0]?.message?.content || '';

            setLoading(false);
            return respostaFinal;

        } catch (err) {
            console.error(`🚨 Erro ao processar agente ${agente.nome}:`, err.message);
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    return {
        chamarAgente,
        loadingIA: loading,
        erroIA: error,
        listaAgentesDisponiveis: Object.keys(AGENTES_CONFIG)
    };
}
