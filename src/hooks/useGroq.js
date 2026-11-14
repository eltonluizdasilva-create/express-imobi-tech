import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 🟢 Prompt de Sistema mais flexível para não "engessar" a resposta
const SYSTEM_PROMPT = `Você é o especialista da Express Auto Tech. 
Sua missão é auxiliar mecânicos e gestores de oficina.
Responda de forma direta, técnica quando necessário, mas sempre respeitando o contexto da pergunta do usuário. 
Se o usuário perguntar sobre gestão ou mercado, responda como um consultor de negócios. 
NUNCA use asteriscos (**) para negrito ou formatação nas suas respostas.`;

const MODELOS = {
  groq: {
    nome: 'Groq (Llama)',
    api: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'VITE_GROQ_API_KEY'
  },
  gemini: {
    nome: 'Google Gemini',
    // 🟢 Atualizado para a versão Flash Lite 2.0
    api: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
    keyEnv: 'VITE_GEMINI_API_KEY'
  }
};

// 🟢 Trocamos o padrão para Gemini
const MODELO_PADRAO = 'gemini';

export function useGroq(oficinaId) {
  const [loading, setLoading] = useState(false);
  const [modeloAtual, setModeloAtual] = useState(MODELO_PADRAO);

  useEffect(() => {
    const carregarPreferencia = async () => {
      if (!oficinaId) return;
      try {
        const snap = await getDoc(doc(db, 'usuarios', oficinaId));
        if (snap.exists() && snap.data().preferencia_modelo) {
          const pref = snap.data().preferencia_modelo;
          if (MODELOS[pref]) {
            setModeloAtual(pref);
          }
        }
      } catch (err) {
        console.log('[IA] Usando modelo padrão');
      }
    };
    carregarPreferencia();
  }, [oficinaId]);

  const analyzeText = async (prompt) => {
    setLoading(true);
    try {
      const config = MODELOS[modeloAtual];
      const apiKey = import.meta.env[config.keyEnv];

      // Se não tiver a chave do Gemini, ele tenta o Groq como reserva
      if (!apiKey) {
        const fallback = MODELOS.groq;
        const fallbackKey = import.meta.env[fallback.keyEnv];
        return await chamarAPI(fallback, fallbackKey, prompt);
      }

      return await chamarAPI(config, apiKey, prompt);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const chamarAPI = async (config, apiKey, prompt) => {
    // 🟢 Configuração para o Google Gemini 2.0
    if (config.nome.includes('Gemini')) {
      const response = await fetch(`${config.api}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      });

      if (!response.ok) throw new Error("Erro no Gemini. Verifique sua VITE_GEMINI_API_KEY.");
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }

    // Configuração para o Groq (Llama)
    if (config.nome.includes('Groq')) {
      const response = await fetch(config.api, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error("Erro na Groq");
      const data = await response.json();
      return data.choices[0].message.content;
    }

    throw new Error("Modelo não suportado");
  };

  return { analyzeText, loading, modeloAtual, MODELOS };
}