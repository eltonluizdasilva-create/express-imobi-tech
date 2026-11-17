/**
 * parametros.js — carregamento dos parâmetros de crédito
 * ============================================================================
 * FONTE: coleção global `parametrosCredito/{versao}` (leitura para logados,
 * escrita manual/Admin SDK). Sem documento (ou com erro), usam-se os defaults
 * de parametrosPadrao.js e a UI mostra "parâmetros não validados".
 * ============================================================================
 */
import { doc, getDoc, getDocs, collection, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { PARAMETROS_PADRAO, VERSAO_PADRAO, fundirParametros } from './parametrosPadrao';

export { CAMPOS_CONFERIR, PARAMETROS_PADRAO, VERSAO_PADRAO, avisoDeParametros } from './parametrosPadrao';

/**
 * Carrega os parâmetros. Nunca lança: em qualquer falha devolve os defaults
 * com `aviso` preenchido.
 */
export async function carregarParametros() {
  try {
    let dados = null;
    const direto = await getDoc(doc(db, 'parametrosCredito', VERSAO_PADRAO));
    if (direto.exists()) {
      dados = direto.data();
    } else {
      const snap = await getDocs(query(collection(db, 'parametrosCredito'), orderBy('vigenciaInicio', 'desc'), limit(1)));
      if (!snap.empty) dados = snap.docs[0].data();
    }

    if (!dados) {
      return { ...PARAMETROS_PADRAO, aviso: 'Nenhuma versão publicada em parametrosCredito — usando defaults do código.' };
    }

    const mesclado = fundirParametros(PARAMETROS_PADRAO, dados);
    const vigente = !mesclado.vigenciaFim || new Date(mesclado.vigenciaFim) >= new Date();
    return {
      ...mesclado,
      fonte: `parametrosCredito/${dados.versao || VERSAO_PADRAO}`,
      aviso: vigente ? null : 'A versão carregada está fora da vigência — confira os valores.',
    };
  } catch (erro) {
    return {
      ...PARAMETROS_PADRAO,
      aviso: `Falha ao ler parametrosCredito (${String(erro?.message || erro).slice(0, 80)}) — usando defaults.`,
    };
  }
}
