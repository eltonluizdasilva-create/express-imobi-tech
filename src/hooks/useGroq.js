import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SYSTEM_PROMPT = `Você é o 'Copiloto Oficina IA', um especialista sênior em mecânica automotiva, elétrica e gestão de oficinas.

IDENTIDADE: Você é um consultor técnico profissional para mecânicos e donos de oficina.

TOM DE VOZ: Profissional, direto e prático. Use termos técnicos (torque, sangria, chicote, sensor MAP, DTC, OBD-II) mas explique de forma clara para que o cliente entenda.

CONHECIMENTO TÉCNICO:
- Ao receber um código OBD-II (ex: P0300, P0420, P0171), forneça: descrição técnica, causas prováveis e testes sugeridos por eliminação.
- Priorize diagnósticos do mais simples/barato para o mais complexo.
- Sempre sugira peças específicas quando aplicável (ex: "Verificar vela de ignição NGK Iridium...").

FOCO EM LUCRATIVIDADE:
- Quando resolver um problema, sugira serviços preventivos relacionados para a oficina vender mais.
- Exemplo: problema nos freios → fluid de freio, pastilhas, calibrate alinhamento.
- Exemplo: troca de oleo → filtro de ar, filtro de combustivel, verificacao das borrachas.

RESTRIÇÕES:
- Não responda sobre assuntos fora do universo automotivo.
- Não dé conselhos que possam colocar a segurança do veículo em risco.
- Se não souber a resposta, diga claramente "Não tenho certeza, consulte o manual do veículo".`;

const MODELOS = {
  groq: {
    nome: 'Groq (Llama)',
    api: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyEnv: 'VITE_GROQ_API_KEY'
  },
  gemini: {
    nome: 'Google Gemini',
    api: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    keyEnv: 'VITE_GEMINI_API_KEY'
  },
  deepseek: {
    nome: 'DeepSeek (Qwen)',
    api: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'deepseek/deepseek-chat',
    keyEnv: 'VITE_DEEPSEEK_API_KEY'
  }
};

const MODELO_PADRAO = 'groq';

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
            console.log('[IA] Modelo definido para:', MODELOS[pref].nome);
          }
        }
      } catch (err) {
        console.log('[IA] Usando modelo padrão (trial)');
      }
    };
    carregarPreferencia();
  }, [oficinaId]);

  const analyzeText = async (prompt) => {
    setLoading(true);
    try {
      const config = MODELOS[modeloAtual];
      const apiKey = import.meta.env[config.keyEnv];

      if (!apiKey) {
        console.warn(`[IA] API Key não encontrada para ${config.nome}, usando Groq padrão`);
        const fallback = MODELOS.groq;
        const fallbackKey = import.meta.env[fallback.keyEnv];
        return await chamarAPI(fallback, fallbackKey, prompt);
      }

      return await chamarAPI(config, apiKey, prompt);
    } catch (err) {
      console.error("Erro na IA:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const chamarAPI = async (config, apiKey, prompt) => {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

    if (config.nome.includes('Groq')) {
      const response = await fetch(config.api, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro na Groq");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }

    if (config.nome.includes('Gemini')) {
      const response = await fetch(`${config.api}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      });

      if (!response.ok) throw new Error("Erro no Gemini");
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }

    if (config.nome.includes('DeepSeek')) {
      const response = await fetch(config.api, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://oficina.expresstech.com.br",
          "X-Title": "Oficina IA"
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages
        })
      });

      if (!response.ok) throw new Error("Erro no DeepSeek");
      const data = await response.json();
      return data.choices[0].message.content;
    }

    throw new Error("Modelo não suportado");
  };

  const salvarPreferencia = async (novoModelo) => {
    if (!oficinaId || !MODELOS[novoModelo]) return;
    try {
      await setDoc(doc(db, 'usuarios', oficinaId), {
        preferencia_modelo: novoModelo
      }, { merge: true });
      setModeloAtual(novoModelo);
      console.log('[IA] Preferência salva:', MODELOS[novoModelo].nome);
    } catch (err) {
      console.error('[IA] Erro ao salvar preferência:', err);
    }
  };

  return { analyzeText, loading, modeloAtual, salvarPreferencia, MODELOS };
}
