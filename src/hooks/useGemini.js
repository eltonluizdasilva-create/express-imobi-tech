import { useState } from 'react';
import { executarAgenteHermes } from './hermesClient.js';

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeText = async (prompt) => {
    setLoading(true);
    setError(null);
    try {
      // 🟢 A usar o Hermes com a DeepSeek (sem limites de cota do Google)
      const promptSistema = "Você é o Hermes Imobi, o assistente especialista e orquestrador técnico do Express Imobi Tech (mercado imobiliário: corretagem, locação, financiamento, VGV e gestão de carteira).";
      const historico = [{ role: "user", content: prompt }];
      
      const resposta = await executarAgenteHermes(promptSistema, historico);
      return resposta;
    } catch (err) {
      const msg = err.message || 'Erro desconhecido';
      let dica = '';
      if (msg.includes('401') || msg.includes('403') || msg.includes('API_KEY')) {
        dica = 'Chave de API da DeepSeek inválida ou sem permissão no .env.';
      } else if (msg.includes('fetch') || msg.includes('network')) {
        dica = 'Sem conexão com a internet.';
      } else {
        dica = msg;
      }
      alert(`❌ ERRO DA IA (DeepSeek):\n\n${dica}`);
      setError(dica);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (prompt, imageBase64) => {
    return await analyzeText(prompt + (imageBase64 ? " [Nota: O utilizador enviou uma imagem para análise técnica]." : ""));
  };

  return { analyzeImage, analyzeText, loading, error };
}