/**
 * useCredito — parâmetros, simulações salvas e (fases seguintes) processos.
 * ============================================================================
 * Multi-tenant: TODAS as queries usam oficinas/{oficinaId}/<colecao>.
 * Texto único de verdade: nada de coleção top-level aqui.
 * ============================================================================
 */
import { useCallback, useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { carregarParametros } from '../lib/credito/parametros';

export default function useCredito(oficinaId, usuario) {
  const [parametros, setParametros] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    carregarParametros()
      .then((p) => {
        if (!vivo) return;
        setParametros(p);
        setAviso(p.aviso || '');
      })
      .finally(() => vivo && setCarregando(false));
    return () => { vivo = false; };
  }, []);

  const salvarSimulacao = useCallback(async (simulacao, extra = {}) => {
    if (!oficinaId) throw new Error('Sem oficinaId — não é possível salvar');
    setSalvando(true);
    setErro('');
    try {
      const doc = {
        oficinaId,
        // gestor pode salvar em nome de um corretor da equipe
        corretorId: extra.corretorId || usuario?.uid || null,
        criadoPor: usuario?.uid || null,
        criadoEm: serverTimestamp(),
        leadId: extra.leadId || null,
        leadNome: extra.leadNome || null,
        imovelId: extra.imovelId || null,
        rotulo: extra.rotulo || 'Cenário',
        entrada: simulacao.entrada,
        saida: {
          enquadramento: simulacao.enquadramento,
          financiavel: simulacao.financiavel,
          entradaNecessaria: simulacao.entradaNecessaria,
          subsidio: simulacao.subsidio,
          parcelaInicial: simulacao.parcelaInicial,
          parcelaFinal: simulacao.parcelaFinal,
          comprometimento: simulacao.comprometimento,
          taxaAnual: simulacao.taxaAnual,
          prazo: simulacao.prazo,
          sistema: simulacao.sistema,
          alertas: simulacao.alertas,
        },
        parametrosVersao: parametros?.versao || null,
        parametrosValidados: parametros?.validado === true,
        resultadoOficial: extra.resultadoOficial || null,
      };
      const ref = await addDoc(collection(db, 'oficinas', oficinaId, 'credito_simulacoes'), doc);
      return ref.id;
    } catch (e) {
      setErro(String(e?.message || e));
      throw e;
    } finally {
      setSalvando(false);
    }
  }, [oficinaId, usuario, parametros]);

  return { parametros, carregando, aviso, salvando, erro, salvarSimulacao };
}
