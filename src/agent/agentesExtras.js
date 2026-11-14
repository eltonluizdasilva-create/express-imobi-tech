import { executarAgenteHermes } from "./hermesClient.js";

// Prompts dos novos agentes
const PROMPT_SEGURANCA = `Você é um especialista em cibersegurança e auditoria de código. 
Analise a entrada a seguir e identifique se há chaves expostas, falhas de segurança ou vulnerabilidades de injection. 
Responda de forma direta com o diagnóstico e a correção recomendada.`;

const PROMPT_PROGRAMADOR = `Você é um engenheiro de software sênior focado em React, Node.js e Tailwind CSS. 
Escreva código limpo, modular, livre de comentários desnecessários e pronto para produção.`;

// Chamada direta do Agente de Segurança
export async function agenteSeguranca(codigoOuInput) {
  return await executarAgenteHermes(PROMPT_SEGURANCA, [{ role: "user", content: codigoOuInput }]);
}

// Chamada direta do Agente Programador
export async function agenteProgramador(requisicao) {
  return await executarAgenteHermes(PROMPT_PROGRAMADOR, [{ role: "user", content: requisicao }]);
}
