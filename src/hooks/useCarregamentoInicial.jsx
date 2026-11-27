import { useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { CONFIG_CANONICA, CONFIG_LEGADA, mesclarConfigImobiliaria, normalizarConfigImobiliaria } from '../lib/configImobiliaria';

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
    try {
      // Caminho canônico (config/geral) + espelho legado (configuracoes/geral):
      // a tela de Configurações antiga gravava no segundo, e o painel só lia o
      // primeiro — a marca nunca chegava ao checklist nem ao anúncio público.
      const [canonica, legada] = await Promise.all([
        getDoc(doc(db, 'oficinas', oficinaId, CONFIG_CANONICA.colecao, CONFIG_CANONICA.docId)).catch(() => null),
        getDoc(doc(db, 'oficinas', oficinaId, CONFIG_LEGADA.colecao, CONFIG_LEGADA.docId)).catch(() => null),
      ]);
      const dados = mesclarConfigImobiliaria(
        legada?.exists() ? legada.data() : null,
        canonica?.exists() ? canonica.data() : null,
      );
      if (Object.keys(dados).length) setConfig(normalizarConfigImobiliaria(dados));
    } catch (e) {
      console.warn('Aviso carregarConfig:', e?.message);
    }
  }, [oficinaId, logado, setConfig]);

  const carregarPlanos = useCallback(async () => {
    if (!logado) return;
    try {
      // Tenta buscar na coleção 'planos' que é pública
      const planosRef = collection(db, 'planos');
      const q = query(planosRef);
      const s = await getDocs(q);
      
      if (!s.empty) {
        const lista = {};
        s.forEach(d => lista[d.id] = d.data());
        setPlanosSistema(lista);
        console.log("💎 Planos carregados via planos");
      } else {
        // Se a coleção 'planos' estiver vazia, tenta o Admin
        try {
          const masterRef = doc(db, 'configuracoes_admin', 'master');
          const snap = await getDoc(masterRef);
          if (snap.exists()) {
            const dados = snap.data();
            setPlanosSistema(dados.planos || {});
            console.log("💎 Planos carregados via Admin");
          }
        } catch (errMaster) {
          // Ignorado silenciosamente
        }
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
