import { executarAgenteHermes } from "./hermesClient.js";
import { HERMES_IMOBI_PROMPT } from "./imobiPrompt.js";
import { agenteSeguranca, agenteProgramador } from "./agentesExtras.js";

// Roteador central que despacha a mensagem para o agente adequado com base no contexto ou intenção
export async function routerHermes(intencaoOuMensagem, historicoMensagens = []) {
  const intencao = intencaoOuMensagem.toLowerCase();

  // 1. Se envolver segurança, auditoria ou vazamento de chave -> Aciona Agente de Segurança
  if (
    intencao.includes("seguranca") ||
    intencao.includes("vulnerabilidade") ||
    intencao.includes("auditoria") ||
    intencao.includes("chave exposta") ||
    intencao.includes("senha")
  ) {
    return await agenteSeguranca(intencaoOuMensagem);
  }

  // 2. Se envolver código, programação, React ou componentes -> Aciona Agente Programador
  if (
    intencao.includes("codigo") ||
    intencao.includes("react") ||
    intencao.includes("componente") ||
    intencao.includes("funcao") ||
    intencao.includes("tailwind")
  ) {
    return await agenteProgramador(intencaoOuMensagem);
  }

  // 3. Padrão: Aciona o Agente Hermes Imobi (Atendimento, Triagem e Simulação Caixa)
  const historicoCompleto = [
    ...historicoMensagens,
    { role: "user", content: intencaoOuMensagem }
  ];

  return await executarAgenteHermes(HERMES_IMOBI_PROMPT, historicoCompleto);
}
