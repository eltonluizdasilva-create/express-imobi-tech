/**
 * useEstudioMarketing — IA do Estúdio de Posts (Fase tráfego pago)
 * ============================================================================
 * Toda chamada passa pelo proxy /api/ai (chave no servidor).
 * LGPD: só o objeto de sanitizarEntradaEstudio() vai ao modelo — nada de
 * nome, telefone, CPF ou e-mail do cliente.
 * ============================================================================
 */
import { useCallback, useState } from 'react';
import { interpretarEstudio, montarPromptEstudio, sanitizarEntradaEstudio } from '../lib/marketing/estudio.js';

const PROVEDOR = 'gemini';
const SYSTEM = 'Você é redator publicitário imobiliário. Responde exclusivamente com JSON válido, sem markdown.';

export default function useEstudioMarketing() {
  const [resultado, setResultado] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [meta, setMeta] = useState(null);

  const gerar = useCallback(async (dados) => {
    setGerando(true);
    setErro('');
    try {
      const limpos = sanitizarEntradaEstudio(dados);
      const prompt = montarPromptEstudio(limpos);

      const chamar = async (texto) => {
        const r = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: PROVEDOR,
            systemPrompt: SYSTEM,
            prompt: texto,
            temperature: 0.55,
            maxTokens: 1800,
          }),
        });
        const corpo = await r.json().catch(() => ({}));
        if (!r.ok || !corpo?.text) throw new Error(corpo?.error || `Falha na IA (HTTP ${r.status})`);
        return corpo;
      };

      let corpo = await chamar(prompt);
      let pacote = interpretarEstudio(corpo.text);
      if (!pacote) {
        corpo = await chamar(`${prompt}\n\nATENÇÃO: a resposta anterior não era JSON válido. Responda SOMENTE o JSON, começando com { e terminando com }.`);
        pacote = interpretarEstudio(corpo.text);
      }
      if (!pacote) throw new Error('A IA não devolveu JSON válido após duas tentativas');

      setResultado(pacote);
      setMeta({ modelo: corpo.model, provider: corpo.provider, em: new Date().toISOString() });
      return pacote;
    } catch (e) {
      setErro(String(e?.message || e));
      return null;
    } finally {
      setGerando(false);
    }
  }, []);

  const limpar = useCallback(() => { setResultado(null); setErro(''); setMeta(null); }, []);

  return { resultado, gerando, erro, meta, gerar, limpar, setResultado };
}
