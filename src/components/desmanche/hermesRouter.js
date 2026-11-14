import { executarAgenteHermes } from "../../agent/hermesClient.js";
import { agenteSeguranca, agenteProgramador } from "../../agent/agentesExtras.js";

const PROMPT_IMOBI = `Você é o assistente virtual imobiliário do Express Imobi Tech. 
Atenda o cliente com cordialidade, ajude a qualificar o perfil de imóvel desejado e oriente sobre os próximos passos.`;

export async function orquestradorHermes(mensagemUsuario, historico = []) {
  const promptRoteador = `Você é o Hermes, o orquestrador central do sistema.
Analise a mensagem do usuário e responda APENAS com uma destas palavras:
- SEGURANCA (se for dúvida/pedido de auditoria, cibersegurança ou chaves)
- PROGRAMADOR (se for pedido para criar, corrigir ou refatorar código)
- IMOBI (para atendimento imobiliário e leads no WhatsApp)`;

  const decisao = await executarAgenteHermes(promptRoteador, [
    { role: "user", content: mensagemUsuario }
  ]);

  const agenteTratado = decisao.trim().toUpperCase();

  if (agenteTratado.includes("SEGURANCA")) {
    return await agenteSeguranca(mensagemUsuario);
  } 
  
  if (agenteTratado.includes("PROGRAMADOR")) {
    return await agenteProgramador(mensagemUsuario);
  }

  return await executarAgenteHermes(PROMPT_IMOBI, [...historico, { role: "user", content: mensagemUsuario }]);
}