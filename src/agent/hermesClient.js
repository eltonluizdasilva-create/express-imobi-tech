/**
 * Cliente do Agente Hermes (agent) — usa o proxy /api/ai.
 * Chamada generica reutilizavel por qualquer agente.
 */
export async function executarAgenteHermes(promptSistema, historicoMensagens) {
  const resposta = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'deepseek',
      model: 'deepseek-chat',
      systemPrompt: promptSistema,
      messages: historicoMensagens,
      temperature: 0.3,
    }),
  });

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok || !dados?.text) {
    throw new Error(dados?.error || `Falha na IA (HTTP ${resposta.status})`);
  }

  return dados.text;
}
