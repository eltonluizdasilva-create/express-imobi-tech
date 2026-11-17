/**
 * useParecer — Parecer de viabilidade por IA (Fase 4)
 * ============================================================================
 * - Toda a chamada passa pelo proxy /api/ai (chave nunca no cliente).
 * - LGPD: só o objeto de sanitizarEntrada() chega ao modelo.
 * - Consumo: `creditosIA` é somente leitura no frontend (provisionado pelo
 *   backend). Aqui registramos o CONSUMO ESTIMADO no processo
 *   (`creditosEstimados` + 1), sem tentar debitar saldo.
 * ============================================================================
 */
import { useCallback, useState } from 'react';
import { doc, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  CREDITOS_POR_PARECER, montarPromptParecer, interpretarParecer, sanitizarEntrada,
} from '../lib/credito/parecer';

export default function useParecer(oficinaId) {
  const [parecer, setParecer] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [meta, setMeta] = useState(null);

  const gerar = useCallback(async (dados, contexto = {}) => {
    setCarregando(true);
    setErro('');
    setParecer(null);
    try {
      // 1) lista branca — nada de nome/CPF/telefone segue adiante
      const limpos = sanitizarEntrada(dados);
      const prompt = montarPromptParecer(limpos);

      const resposta = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          systemPrompt: 'Você é analista de crédito imobiliário. Responda exclusivamente JSON válido, sem markdown.',
          prompt,
          temperature: 0.3,
          maxTokens: 1200,
        }),
      });
      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok || !corpo?.text) {
        throw new Error(corpo?.error || `Falha na IA (HTTP ${resposta.status})`);
      }

      const interpretado = interpretarParecer(corpo.text);
      if (!interpretado) throw new Error('A IA não devolveu JSON válido');

      setParecer({ ...interpretado, entradaUsada: limpos });
      setMeta({ modelo: corpo.model, provider: corpo.provider, em: new Date().toISOString() });

      // 2) consumo estimado registrado no processo (sem debitar saldo)
      if (contexto.processoId && oficinaId) {
        try {
          await updateDoc(doc(db, 'oficinas', oficinaId, 'credito_processos', contexto.processoId), {
            creditosEstimados: increment(CREDITOS_POR_PARECER),
            parecerGeradoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp(),
          });
        } catch (e) {
          console.warn('parecer: falha ao registrar consumo estimado', e?.message);
        }
      }
      return interpretado;
    } catch (e) {
      setErro(String(e?.message || e));
      return null;
    } finally {
      setCarregando(false);
    }
  }, [oficinaId]);

  const limpar = useCallback(() => { setParecer(null); setErro(''); setMeta(null); }, []);

  return { parecer, carregando, erro, meta, gerar, limpar, creditosEstimados: CREDITOS_POR_PARECER };
}
