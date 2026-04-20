import { useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

export default function useCarregamentoInicial(oficinaId, setters) {
  const { setListaCarros, setListaFinanceiro, setListaEstoque, setConfig, setPlanosSistema, logado } = setters;

  const carregarOS = useCallback(async () => {
    if (!oficinaId || !logado) return;
    const q = query(collection(db, 'oficinas', oficinaId, 'os'), orderBy('data_registro', 'desc'));
    const s = await getDocs(q);
    setListaCarros(s.docs.map(d => ({ id: d.id, ...d.data() })));
  }, [oficinaId, logado, setListaCarros]);

  const carregarFinanceiro = useCallback(async () => {
    if (!oficinaId || !logado) return;
    const q = query(collection(db, 'oficinas', oficinaId, 'financeiro'), orderBy('data', 'desc'));
    const s = await getDocs(q);
    setListaFinanceiro(s.docs.map(d => ({ id: d.id, ...d.data() })));
  }, [oficinaId, logado, setListaFinanceiro]);

  const carregarEstoque = useCallback(async () => {
    if (!oficinaId || !logado) return;
    const s = await getDocs(collection(db, 'oficinas', oficinaId, 'estoque'));
    setListaEstoque(s.docs.map(d => ({ id: d.id, ...d.data() })));
  }, [oficinaId, logado, setListaEstoque]);

  const carregarConfig = useCallback(async () => {
    if (!oficinaId || !logado) return;
    const s = await getDoc(doc(db, 'oficinas', oficinaId, 'config', 'geral'));
    if (s.exists()) setConfig(s.data());
  }, [oficinaId, logado, setConfig]);

  const carregarPlanos = useCallback(async () => {
    // Implement ou mock
  }, []);

  return { carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos };
}
