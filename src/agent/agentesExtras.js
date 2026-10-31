import { executarAgenteHermes } from "./hermesClient.js";

// Agente Especialista em Segurança
export async function agenteSeguranca(codigoOuInput) {
  const promptSistema = `Você é um especialista em cibersegurança e auditoria de código. 
Analise a entrada a seguir e identifique se há chaves expostas, falhas de segurança ou vulnerabilidades de injection. 
Responda de forma direta com o diagnóstico e a correção recomendada.`;

  return await executarAgenteHermes(promptSistema, [{ role: "user", content: codigoOuInput }]);
}

// Agente Programador
export async function agenteProgramador(requisicao) {
  const promptSistema = `Você é um engenheiro de software sênior focado em React, Node.js e Tailwind CSS. 
Escreva código limpo, modular, livre de comentários desnecessários e pronto para produção.`;

  return await executarAgenteHermes(promptSistema, [{ role: "user", content: requisicao }]);
}
