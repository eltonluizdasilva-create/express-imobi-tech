import { useState } from 'react';

/**
 * AGENTES_CONFIG
 * Definições rígidas de Personas e System Prompts para o hub de Inteligência Artificial.
 */
const AGENTES_CONFIG = {
    secretaria: {
        nome: "Secretária Digital",
        prompt: "Você é a Secretária Digital de uma imobiliária. Responda de forma curta, amigável, com emojis, focando no status do atendimento e do processo do cliente (visita, proposta, documentação, financiamento). Seja cordial e encaminhe sempre para o próximo passo comercial."
    },
    triagem: {
        nome: "Triagem Inteligente",
        prompt: "Você é o agente de Triagem Inteligente do atendimento imobiliário. Leia a mensagem recebida do cliente e classifique a intenção principal em uma das categorias: COMPRA, VENDA/CAPTAÇÃO, LOCAÇÃO, FINANCIAMENTO, VISITA, AVALIAÇÃO ou DÚVIDA. Em seguida, de forma estruturada, extraia se houver: nome do cliente, tipo de imóvel, bairro/cidade, faixa de preço, forma de pagamento e prazo. Seja estritamente analítico e objetivo."
    },
    assistente_fiscal: {
        nome: "Assistente Fiscal",
        prompt: "Você é o Assistente Fiscal de apoio operacional de uma imobiliária. Sua função é ler descrições de notas, recibos de comissão, aluguéis, ITBI/ITCMD e documentos de fechamento, auxiliando na categorização dessas despesas para a gestão interna. ATENÇÃO: Você NÃO é um contador e não presta assessoria contábil, jurídica ou tributária oficial. Limite-se a ler, interpretar descrições e sugerir divisões de custos lógicos (ex: Comissões, Aluguéis, Marketing, Cartório, Administrativo)."
    },
    geracao_riqueza: {
        nome: "Gerador de Riqueza",
        prompt: "Você é o Especialista em Engenharia Financeira do Express Imobi Tech, focado no dono da imobiliária. Analise o log de vendas, locações e captações fornecido e elabore um resumo executivo de alto impacto focado em Geração de Riqueza. Destaque: 1) VGV potencial não explorado da carteira, 2) Otimização de ROI em captação e marketing por imóvel e 3) Eficiência da operação comercial (conversão, ticket médio e tempo de fechamento). Use um tom direto, altamente profissional e motivador para negócios."
    }
};

/**
 * useAgentesIA
 * Hook central que opera como o 'Segundo Cérebro' do Express Imobi Tech.
 * Centraliza múltiplos agentes inteligentes utilizando a infraestrutura de alto desempenho SiliconFlow.
 */
export function useAgentesIA() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Infraestrutura: o provedor é chamado pelo proxy /api/ai (chave no servidor).
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

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'groq',
                    model: MODELO,
                    messages: messages,
                    temperature: 0.7,
                    maxTokens: 1000
                })
            });

            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.text) {
                throw new Error(data?.error || `Erro no provedor de IA (${response.status})`);
            }

            const respostaFinal = data.text;

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
