/**
 * useDocumentos — checklist do processo (oficinas/{oficinaId}/credito_documentos)
 * ============================================================================
 * Nenhum arquivo é enviado: o documento é um REGISTRO DE STATUS.
 * O checklist nasce sozinho na primeira abertura do processo (seed único).
 * ============================================================================
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { gerarChecklist, somarMeses, statusEfetivo, resumoChecklist, pendenciasParaWhatsApp } from '../lib/credito/documentos';

export default function useDocumentos(oficinaId, processo, usuario, papelLogado) {
  const [docs, setDocs] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const semeado = useRef(null);

  const podeExcluir = ['dono', 'admin', 'master'].includes(papelLogado);

  useEffect(() => {
    if (!oficinaId || !processo?.id) { setDocs([]); return undefined; }
    setCarregando(true);
    const consulta = query(
      collection(db, 'oficinas', oficinaId, 'credito_documentos'),
      where('processoId', '==', processo.id),
    );
    const unsub = onSnapshot(consulta, (snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCarregando(false);
    }, (e) => { setErro(String(e?.message || e)); setCarregando(false); });
    return unsub;
  }, [oficinaId, processo?.id]);

  const semear = useCallback(async (opcoes = {}) => {
    if (!oficinaId || !processo?.id) return;
    if (semeado.current === processo.id) return;
    semeado.current = processo.id;

    const itens = gerarChecklist({
      perfil: opcoes.perfil || 'clt',
      tipoImovel: opcoes.tipoImovel || 'usado',
      usaFgts: Boolean(opcoes.usaFgts),
      imovelAlugado: Boolean(opcoes.imovelAlugado),
    });

    await Promise.all(itens.map((item, ordem) => addDoc(
      collection(db, 'oficinas', oficinaId, 'credito_documentos'),
      {
        oficinaId,
        processoId: processo.id,
        corretorId: processo.corretorId || usuario?.uid || null,
        criadoPor: usuario?.uid || null,
        criadoEm: serverTimestamp(),
        bloco: item.bloco,
        item: item.item,
        chave: item.chave,
        obrigatorio: item.obrigatorio,
        validadeMeses: item.validadeMeses,
        status: 'pendente',
        validadeEm: null,
        observacao: '',
        perfil: opcoes.perfil || 'clt',
        ordem,
      },
    )));
  }, [oficinaId, processo, usuario]);

  const marcarStatus = useCallback(async (documento, novoStatus) => {
    if (!oficinaId || !documento?.id) return;
    const validadeEm = novoStatus === 'recebido'
      ? (documento.validadeMeses ? somarMeses(new Date(), documento.validadeMeses) : null)
      : (documento.validadeEm || null);
    await updateDoc(doc(db, 'oficinas', oficinaId, 'credito_documentos', documento.id), {
      status: novoStatus,
      validadeEm,
      recebidoEm: novoStatus === 'recebido' ? new Date().toISOString() : null,
      atualizadoEm: serverTimestamp(),
    });
  }, [oficinaId]);

  const salvarObservacao = useCallback(async (documento, observacao) => {
    if (!oficinaId || !documento?.id) return;
    await updateDoc(doc(db, 'oficinas', oficinaId, 'credito_documentos', documento.id), {
      observacao: String(observacao || '').slice(0, 400),
      atualizadoEm: serverTimestamp(),
    });
  }, [oficinaId]);

  const adicionarExtra = useCallback(async ({ bloco, item, validadeMeses }) => {
    if (!oficinaId || !processo?.id || !item?.trim()) return;
    await addDoc(collection(db, 'oficinas', oficinaId, 'credito_documentos'), {
      oficinaId,
      processoId: processo.id,
      corretorId: processo.corretorId || usuario?.uid || null,
      criadoPor: usuario?.uid || null,
      criadoEm: serverTimestamp(),
      bloco: bloco || 'comprador',
      item: item.trim().slice(0, 160),
      chave: `extra:${Date.now()}`,
      obrigatorio: false,
      validadeMeses: validadeMeses ? Number(validadeMeses) : null,
      status: 'pendente',
      validadeEm: null,
      observacao: '',
      extra: true,
      ordem: 900,
    });
  }, [oficinaId, processo, usuario]);

  const remover = useCallback(async (documento) => {
    if (!oficinaId || !documento?.id || !podeExcluir) return;
    await deleteDoc(doc(db, 'oficinas', oficinaId, 'credito_documentos', documento.id));
  }, [oficinaId, podeExcluir]);

  return {
    docs: docs.map((d) => ({ ...d, statusEfetivo: statusEfetivo(d) })),
    carregando, erro, podeExcluir,
    resumo: resumoChecklist(docs),
    textoWhatsApp: () => pendenciasParaWhatsApp(docs, processo?.leadNome || ''),
    semear, marcarStatus, salvarObservacao, adicionarExtra, remover,
  };
}
