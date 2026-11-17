/**
 * useEsteira — processos de crédito (oficinas/{oficinaId}/credito_processos)
 * ============================================================================
 * Leitura em tempo real, escopo por papel:
 *   - dono/admin/master  → todos os processos da oficina
 *   - corretor           → apenas os próprios (where corretorId == uid)
 * Histórico é imutável por convenção: só push (arrayUnion), nunca edição.
 * ============================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc, arrayUnion, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mascararCpf, prazoDaEtapa, registroHistorico, proximaEtapa, etapaAnterior } from '../lib/credito/esteira';

const PAPEIS_GESTAO = new Set(['dono', 'admin', 'master']);

export default function useEsteira(oficinaId, usuario, papelLogado) {
  const [processos, setProcessos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const podeVerTudo = PAPEIS_GESTAO.has(papelLogado);

  useEffect(() => {
    if (!oficinaId) { setCarregando(false); return undefined; }
    const base = collection(db, 'oficinas', oficinaId, 'credito_processos');
    const consulta = podeVerTudo
      ? query(base)
      : query(base, where('corretorId', '==', usuario?.uid || ''));

    const unsub = onSnapshot(
      consulta,
      (snap) => {
        setProcessos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregando(false);
      },
      (e) => {
        setErro(String(e?.message || e));
        setCarregando(false);
      },
    );
    return unsub;
  }, [oficinaId, podeVerTudo, usuario?.uid]);

  const criarProcesso = useCallback(async (dados = {}) => {
    if (!oficinaId) throw new Error('Sem oficinaId');
    const proponentes = (dados.proponentes || []).map((p) => ({
      nome: p.nome || '',
      cpfMascarado: p.cpf ? mascararCpf(p.cpf) : (p.cpfMascarado || ''),
      renda: Number(p.renda) || 0,
      estadoCivil: p.estadoCivil || '',
      regimeBens: p.regimeBens || '',
      perfil: p.perfil || 'clt',
    }));

    const docProcesso = {
      oficinaId,
      corretorId: dados.corretorId || usuario?.uid || null,
      criadoPor: usuario?.uid || null,
      criadoEm: serverTimestamp(),

      leadId: dados.leadId || null,
      leadNome: dados.leadNome || '',
      imovelId: dados.imovelId || null,
      imovelTitulo: dados.imovelTitulo || '',
      valorImovel: Number(dados.valorImovel) || 0,

      proponentes,
      banco: dados.banco || 'Caixa',
      modalidade: dados.modalidade || '',
      valorFinanciado: Number(dados.valorFinanciado) || 0,

      etapa: 'simulacao',
      etapaDesde: serverTimestamp(),
      motivoReprovacao: null,
      sla: { etapa: 'simulacao', prazoEm: prazoDaEtapa('simulacao') },

      simulacaoId: dados.simulacaoId || null,
      consentimentoLGPD: {
        aceito: Boolean(dados.consentimentoLGPD),
        em: dados.consentimentoLGPD ? new Date().toISOString() : null,
        versao: 'v1',
      },
      historico: [registroHistorico({ etapa: null }, 'simulacao', usuario?.nome || usuario?.email || 'corretor', usuario?.uid)],
      atualizadoEm: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'oficinas', oficinaId, 'credito_processos'), docProcesso);
    return ref.id;
  }, [oficinaId, usuario]);

  const moverEtapa = useCallback(async (processo, novaEtapa, extra = {}) => {
    if (!oficinaId || !processo?.id) return;
    const historico = registroHistorico(
      processo, novaEtapa,
      usuario?.nome || usuario?.email || 'corretor',
      usuario?.uid,
      extra.motivo || '',
    );
    const atualizacao = {
      etapa: novaEtapa,
      etapaDesde: serverTimestamp(),
      sla: { etapa: novaEtapa, prazoEm: prazoDaEtapa(novaEtapa) },
      historico: arrayUnion(historico),
      atualizadoEm: serverTimestamp(),
    };
    if (novaEtapa === 'reprovado') atualizacao.motivoReprovacao = extra.motivo || 'não informado';
    await updateDoc(doc(db, 'oficinas', oficinaId, 'credito_processos', processo.id), atualizacao);
  }, [oficinaId, usuario]);

  const avancar = useCallback((processo) => moverEtapa(processo, proximaEtapa(processo?.etapa)), [moverEtapa]);
  const voltar = useCallback((processo) => moverEtapa(processo, etapaAnterior(processo?.etapa)), [moverEtapa]);

  const atualizarProcesso = useCallback(async (processo, campos) => {
    if (!oficinaId || !processo?.id) return;
    await updateDoc(doc(db, 'oficinas', oficinaId, 'credito_processos', processo.id), {
      ...campos,
      atualizadoEm: serverTimestamp(),
    });
  }, [oficinaId]);

  const resumo = useMemo(() => ({
    total: processos.length,
    ativos: processos.filter((p) => !['aprovado', 'reprovado'].includes(p?.etapa)).length,
    aprovados: processos.filter((p) => p?.etapa === 'aprovado').length,
    reprovados: processos.filter((p) => p?.etapa === 'reprovado').length,
    estourados: processos.filter((p) => {
      if (!p?.sla?.prazoEm) return false;
      const prazo = p.sla.prazoEm.toDate ? p.sla.prazoEm.toDate() : new Date(p.sla.prazoEm);
      return prazo.getTime() < Date.now() && !['aprovado', 'reprovado'].includes(p?.etapa);
    }).length,
  }), [processos]);

  return {
    processos, carregando, erro, resumo, podeVerTudo,
    criarProcesso, moverEtapa, avancar, voltar, atualizarProcesso,
  };
}
