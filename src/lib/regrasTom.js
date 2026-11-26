import { doc, getDoc, setDoc } from 'firebase/firestore';

export const REGRAS_TOM_PADRAO = {
  comissaoPadrao: 6,
  descontoMaximo: 5,
  politicaPermuta: 'Aceita até 30% em veículos ou imóveis de menor valor avaliados pela imobiliária',
  slaAtendimentoMinutos: 15,
  diasAlertaImovelParado: 30,
  regrasEquipe: 'Todo lead recebido deve ser contatado em até 15 minutos. Imóveis parados há mais de 30 dias devem passar por revisão de preço ou novas fotos. Propostas com permuta exigem laudo prévio.',
};

export async function carregarRegrasTom(tenantId, db) {
  if (!tenantId) {
    return REGRAS_TOM_PADRAO;
  }

  // 1. Tentar ler do Firestore
  if (db) {
    try {
      const ref = doc(db, 'imobiliarias', tenantId, 'config', 'regras_tom');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const dados = snap.data();
        return {
          ...REGRAS_TOM_PADRAO,
          ...dados,
        };
      }
    } catch (err) {
      console.warn('Aviso ao carregar regras_tom do Firestore:', err.message);
    }
  }

  // 2. Fallback de cache local
  try {
    const salvo = localStorage.getItem(`regras_tom:${tenantId}`);
    if (salvo) {
      return {
        ...REGRAS_TOM_PADRAO,
        ...JSON.parse(salvo),
      };
    }
  } catch {
    /* ignora */
  }

  return REGRAS_TOM_PADRAO;
}

export async function salvarRegrasTom(tenantId, regras, db) {
  const dadosNormalizados = {
    comissaoPadrao: Number(regras.comissaoPadrao) || REGRAS_TOM_PADRAO.comissaoPadrao,
    descontoMaximo: Number(regras.descontoMaximo) || REGRAS_TOM_PADRAO.descontoMaximo,
    politicaPermuta: String(regras.politicaPermuta || '').trim() || REGRAS_TOM_PADRAO.politicaPermuta,
    slaAtendimentoMinutos: Number(regras.slaAtendimentoMinutos) || REGRAS_TOM_PADRAO.slaAtendimentoMinutos,
    diasAlertaImovelParado: Number(regras.diasAlertaImovelParado) || REGRAS_TOM_PADRAO.diasAlertaImovelParado,
    regrasEquipe: String(regras.regrasEquipe || '').trim() || REGRAS_TOM_PADRAO.regrasEquipe,
    atualizadoEm: new Date().toISOString(),
  };

  // Salvar no cache local
  try {
    localStorage.setItem(`regras_tom:${tenantId}`, JSON.stringify(dadosNormalizados));
  } catch {
    /* ignora */
  }

  // Salvar no Firestore
  if (db && tenantId) {
    try {
      const ref = doc(db, 'imobiliarias', tenantId, 'config', 'regras_tom');
      await setDoc(ref, dadosNormalizados, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar regras_tom no Firestore:', err);
      throw err;
    }
  }

  return dadosNormalizados;
}
