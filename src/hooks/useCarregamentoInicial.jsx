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
    if (!logado) return;
    try {
      // Tenta buscar no local mestre primeiro
      const masterRef = doc(db, 'configuracoes_admin', 'master');
      const snap = await getDoc(masterRef);
      
      if (snap.exists()) {
        const dados = snap.data();
        setPlanosSistema(dados.planos || {});
        console.log("💎 Planos carregados via Admin");
      } else {
        // Se não achar, tenta o local secundário (retrocompatibilidade)
        const planosRef = collection(db, 'planos');
        const q = query(planosRef);
        const s = await getDocs(q);
        const lista = {};
        s.forEach(d => lista[d.id] = d.data());
        setPlanosSistema(lista);
      }
    } catch (e) {
      // ESTA É A CHAVE: Se der erro de permissão, o sistema não trava mais!
      console.warn("⚠️ Aviso carregarPlanos (ignorado para Master/Dono):", e.message);
      
      // Se falhar a leitura global, injetamos planos padrão para a interface não bugar
      setPlanosSistema({
        essencial: { valor: 99 },
        profissional: { valor: 149 },
        master: { valor: 449 }
      });
    }
  }, [logado, setPlanosSistema]);

  return { carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos };
}
