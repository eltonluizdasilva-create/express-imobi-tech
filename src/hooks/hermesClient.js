/**
 * Cliente do Agente Hermes — usa o proxy /api/ai.
 * Nenhuma chave de IA no navegador: o servidor le process.env.DEEPSEEK_API_KEY.
 */
import { cabecalhosIA } from '../lib/aiAuth';

export async function executarAgenteHermes(promptSistema, historicoMensagens) {
  try {
    const resposta = await fetch('/api/ai', {
      method: 'POST',
      headers: await cabecalhosIA(),
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
  } catch (error) {
    console.error('Erro na execucao do Agente Hermes:', error?.message);
    throw error;
  }
}
