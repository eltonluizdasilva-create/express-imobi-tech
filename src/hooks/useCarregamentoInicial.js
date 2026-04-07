/* eslint-disable react/prop-types */
import { useCallback, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';

export default function useCarregamentoInicial(oficinaId, {
  setListaCarros,
  setListaFinanceiro,
  setListaEstoque,
  setConfig,
  setPlanosSistema,
  logado,
}) {
  const carregarOS = useCallback(async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, 'oficinas', oficinaId, 'os'), orderBy('data_registro', 'desc')));
      setListaCarros(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarOS:', e.message); }
  }, [oficinaId, setListaCarros]);

  const carregarFinanceiro = useCallback(async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, 'oficinas', oficinaId, 'financeiro'), orderBy('data', 'desc')));
      setListaFinanceiro(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarFinanceiro:', e.message); }
  }, [oficinaId, setListaFinanceiro]);

  const carregarEstoque = useCallback(async () => {
    if (!oficinaId) return;
    try {
      const s = await getDocs(collection(db, 'oficinas', oficinaId, 'estoque'));
      setListaEstoque(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarEstoque:', e.message); }
  }, [oficinaId, setListaEstoque]);

  const carregarConfig = useCallback(async () => {
    if (!oficinaId) return;
    try {
      const d = await getDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'geral'));
      if (d.exists()) setConfig(d.data());
    } catch (e) { console.error(e); }
  }, [oficinaId, setConfig]);

  const carregarPlanos = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'configuracoes_admin', 'master'));
      if (snap.exists()) {
        setPlanosSistema(snap.data());
      }
    } catch (err) {
      console.error('✗ Erro ao carregar planos:', err);
    }
  }, [setPlanosSistema]);

  const carregarTudo = useCallback(() => {
    return Promise.all([
      carregarOS(),
      carregarFinanceiro(),
      carregarEstoque(),
      carregarConfig(),
      carregarPlanos(),
    ]);
  }, [carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos]);

  useEffect(() => {
    if (logado && oficinaId) carregarTudo();
  }, [logado, oficinaId, carregarTudo]);

  return { carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos, carregarTudo };
}
