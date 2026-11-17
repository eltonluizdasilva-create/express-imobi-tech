import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * useGroq — camada fina de IA do painel.
 *
 * Nenhuma chave de provedor passa pelo navegador: tudo vai para POST /api/ai,
 * que lê process.env.* no servidor (ver api/ai.js). O nome do hook foi mantido
 * para não quebrar as telas que já o importam.
 */

const SYSTEM_PROMPT = `Você é o especialista da Express Auto Tech. 
Sua missão é auxiliar mecânicos e gestores de oficina.
Responda de forma direta, técnica quando necessário, mas sempre respeitando o contexto da pergunta do usuário. 
Se o usuário perguntar sobre gestão ou mercado, responda como um consultor de negócios. 
NUNCA use asteriscos (**) para negrito ou formatação nas suas respostas.`;

const MODELOS = {
  gemini: {
    nome: 'Google Gemini',
    provider: 'gemini',
    model: 'gemini-2.0-flash-lite',
  },
  groq: {
    nome: 'Groq (Llama)',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  },
  deepseek: {
    nome: 'DeepSeek',
    provider: 'deepseek',
    model: 'deepseek-chat',
  },
  zhipu: {
    nome: 'Zhipu (GLM)',
    provider: 'zhipu',
    model: 'glm-4-flash',
  },
  siliconflow: {
    nome: 'SiliconFlow',
    provider: 'siliconflow',
    model: 'Qwen/Qwen2.5-7B-Instruct',
  },
};

const MODELO_PADRAO = 'gemini';

export function useGroq(oficinaId) {
  const [loading, setLoading] = useState(false);
  const [modeloAtual, setModeloAtual] = useState(MODELO_PADRAO);

  useEffect(() => {
    const carregarPreferencia = async () => {
      if (!oficinaId) return;
      try {
        const snap = await getDoc(doc(db, 'usuarios', oficinaId));
        const pref = snap.exists() ? snap.data().preferencia_modelo : null;
        if (pref && MODELOS[pref]) setModeloAtual(pref);
      } catch {
        console.log('[IA] Usando modelo padrão');
      }
    };
    carregarPreferencia();
  }, [oficinaId]);

  const chamarAPI = async (config, prompt) => {
    const resposta = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        systemPrompt: SYSTEM_PROMPT,
        prompt,
        temperature: 0.7,
      }),
    });

    let dados = null;
    try {
      dados = await resposta.json();
    } catch {
      throw new Error(`Resposta inválida do servidor de IA (HTTP ${resposta.status}).`);
    }

    if (!resposta.ok || !dados?.text) {
      const motivo = dados?.error || `HTTP ${resposta.status}`;
      if (dados?.variavel) {
        throw new Error(`IA indisponível: configure ${dados.variavel} na Vercel.`);
      }
      throw new Error(`Erro na IA (${config.nome}): ${motivo}`);
    }

    return dados.text;
  };

  const analyzeText = async (prompt) => {
    setLoading(true);
    try {
      return await chamarAPI(MODELOS[modeloAtual], prompt);
    } catch (err) {
      // Reserva: se o modelo escolhido não estiver configurado no servidor,
      // tenta o outro provedor antes de desistir.
      if (modeloAtual !== 'groq') {
        try {
          return await chamarAPI(MODELOS.groq, prompt);
        } catch {
          /* mantém o erro original */
        }
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeText, loading, modeloAtual, MODELOS };
}
