import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeText = async (prompt) => {
    setLoading(true);
    setError(null);
    try {
      // 🟢 USANDO A VERSÃO LITE (Sem limite Zero e Super Rápida)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const msg = err.message || 'Erro desconhecido';
      let dica = '';
      if (msg.includes('404')) dica = 'Modelo não encontrado. Verifique o nome do modelo.';
      else if (msg.includes('403') || msg.includes('API_KEY')) dica = 'Chave de API inválida ou sem permissão.';
      else if (msg.includes('429')) dica = 'O Google bloqueou a sua conta para testes gratuitos (Limite Zero).';
      else if (msg.includes('fetch') || msg.includes('network')) dica = 'Sem conexão com a internet.';
      else dica = msg;
      alert(`❌ ERRO DA IA (Texto):\n\n${dica}`);
      setError(dica);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (prompt, imageBase64) => {
    setLoading(true);
    setError(null);
    try {
      const modelToUse = imageBase64
        ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        : genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      if (!imageBase64) {
        const result = await modelToUse.generateContent(prompt);
        return result.response.text();
      }

      const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      const imagePart = { inlineData: { data: base64Data, mimeType: "image/jpeg" } };
      const result = await modelToUse.generateContent([prompt, imagePart]);
      return result.response.text();
    } catch (err) {
      const msg = err.message || 'Erro desconhecido';
      let dica = '';
      if (msg.includes('404')) dica = 'Modelo não encontrado.';
      else if (msg.includes('403') || msg.includes('API_KEY')) dica = 'Chave de API inválida.';
      else if (msg.includes('429')) dica = 'O Google bloqueou a sua conta para testes gratuitos (Limite Zero).';
      else if (msg.includes('fetch') || msg.includes('network')) dica = 'Sem internet.';
      else dica = msg;
      setError(dica);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeImage, analyzeText, loading, error };
}