/* eslint-disable react/prop-types */
import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { parseMoedaBR } from '../lib/moedaBR.js';

// Fonte única em src/lib/moedaBR.js; reexportado para os chamadores históricos.
export { parseMoedaBR };

export default function useQuickActions({
  imobiliariaId,
  oficinaId: oficinaIdProp,
  setAbaAtiva,
}) {
  const oficinaId = imobiliariaId || oficinaIdProp || (() => {
    try {
      return localStorage.getItem('imobiliariaId') || localStorage.getItem('oficinaId') || '';
    } catch {
      return '';
    }
  })();

  const [salvandoTarefaRapida, setSalvandoTarefaRapida] = useState(false);
  const [tarefaRapidaTitulo, setTarefaRapidaTitulo] = useState('');
  const [tarefaRapidaDesc, setTarefaRapidaDesc] = useState('');
  const [tarefaRapidaData, setTarefaRapidaData] = useState('');
  const [tarefaRapidaHora, setTarefaRapidaHora] = useState('');
  const [tarefasRapidas, setTarefasRapidas] = useState([]);
  const [feedbackTarefa, setFeedbackTarefa] = useState('');

  const [finSalvando, setFinSalvando] = useState(false);
  const [finDesc, setFinDesc] = useState('');
  const [finValor, setFinValor] = useState('');
  const [finTipo, setFinTipo] = useState('entrada');
  const [finPagamento, setFinPagamento] = useState('PIX');

  const [leadSalvando, setLeadSalvando] = useState(false);
  const [leadNome, setLeadNome] = useState('');
  const [leadTelefone, setLeadTelefone] = useState('');
  const [leadProblema, setLeadProblema] = useState('');

  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);

  // Escuta eventos globais disparados pelos botões flutuantes
  useEffect(() => {
    const abrirTarefa = () => setModalTarefaAberto(true);
    const abrirFinanceiro = () => setModalFinanceiroAberto(true);
    const abrirCliente = () => setModalClienteAberto(true);

    window.addEventListener('abrirModalTarefaRapida', abrirTarefa);
    window.addEventListener('abrirModalFinanceiroRapido', abrirFinanceiro);
    window.addEventListener('abrirModalClienteRapido', abrirCliente);

    return () => {
      window.removeEventListener('abrirModalTarefaRapida', abrirTarefa);
      window.removeEventListener('abrirModalFinanceiroRapido', abrirFinanceiro);
      window.removeEventListener('abrirModalClienteRapido', abrirCliente);
    };
  }, []);

  // Sincroniza tarefas imobiliárias em tempo real
  useEffect(() => {
    if (!oficinaId) return;
    const refTarefas = collection(db, 'oficinas', oficinaId, 'tarefas');
    const unsub = onSnapshot(
      refTarefas,
      (snap) => {
        const lista = (snap?.docs || [])?.map((d) => ({ id: d.id, ...d.data() })) || [];
        lista.sort((a, b) => {
          const tA = a.dataCriacao?.toDate ? a.dataCriacao.toDate().getTime() : new Date(a.dataCriacao || 0).getTime();
          const tB = b.dataCriacao?.toDate ? b.dataCriacao.toDate().getTime() : new Date(b.dataCriacao || 0).getTime();
          return tB - tA;
        });
        setTarefasRapidas(lista);
      },
      (err) => console.warn('[useQuickActions] Aviso listener tarefas:', err.message)
    );
    return () => unsub();
  }, [oficinaId]);

  const salvarTarefaRapida = useCallback(
    async (presetOuEvento) => {
      const isPreset =
        presetOuEvento &&
        typeof presetOuEvento === 'object' &&
        typeof presetOuEvento.preventDefault !== 'function' &&
        presetOuEvento.titulo;

      const tituloEfetivo = isPreset ? String(presetOuEvento.titulo).trim() : tarefaRapidaTitulo.trim();
      const descEfetiva = isPreset
        ? String(presetOuEvento.descricao || 'Criada com 1 clique no painel imobiliário')
        : tarefaRapidaDesc.trim();

      if (!tituloEfetivo) return;
      setSalvandoTarefaRapida(true);
      try {
        let dataHora = new Date();
        if (!isPreset && tarefaRapidaData) {
          const hora = tarefaRapidaHora || '10:00';
          dataHora = new Date(`${tarefaRapidaData}T${hora}:00`);
        }

        const novaTarefa = {
          titulo: tituloEfetivo,
          descricao: descEfetiva,
          categoria: isPreset ? presetOuEvento.categoria || 'Imobiliária' : 'Compromisso Imobiliário',
          dataHora: dataHora.toISOString(),
          status: 'pendente',
          dataCriacao: new Date().toISOString(),
          criadoEm: serverTimestamp(),
          prioridade: isPreset ? presetOuEvento.prioridade || 'alta' : 'normal',
        };

        if (oficinaId) {
          await addDoc(collection(db, 'oficinas', oficinaId, 'tarefas'), novaTarefa);
        } else {
          setTarefasRapidas((prev) => [{ id: `local_${Date.now()}`, ...novaTarefa }, ...(prev || [])]);
        }

        if (!isPreset) {
          setTarefaRapidaTitulo('');
          setTarefaRapidaDesc('');
          setTarefaRapidaData('');
          setTarefaRapidaHora('');
        }

        setFeedbackTarefa(`✅ Tarefa "${tituloEfetivo}" criada com sucesso!`);
        setTimeout(() => setFeedbackTarefa(''), 3500);
      } catch (err) {
        alert('Erro ao salvar tarefa imobiliária: ' + err.message);
      } finally {
        setSalvandoTarefaRapida(false);
      }
    },
    [oficinaId, tarefaRapidaTitulo, tarefaRapidaDesc, tarefaRapidaData, tarefaRapidaHora]
  );

  const alternarStatusTarefaRapida = useCallback(
    async (tarefa) => {
      if (!tarefa?.id) return;
      const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida';
      if (!oficinaId || String(tarefa.id).startsWith('local_')) {
        setTarefasRapidas((prev) =>
          (prev || [])?.map((t) => (t.id === tarefa.id ? { ...t, status: novoStatus } : t))
        );
        return;
      }
      try {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tarefa.id), {
          status: novoStatus,
        });
      } catch (err) {
        console.error('Erro ao atualizar tarefa:', err);
      }
    },
    [oficinaId]
  );

  const excluirTarefaRapida = useCallback(
    async (tarefaId) => {
      if (!tarefaId) return;
      if (!oficinaId || String(tarefaId).startsWith('local_')) {
        setTarefasRapidas((prev) => (prev || []).filter((t) => t.id !== tarefaId));
        return;
      }
      try {
        await deleteDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tarefaId));
      } catch (err) {
        console.error('Erro ao excluir tarefa:', err);
      }
    },
    [oficinaId]
  );

  const salvarFinanceiroRapido = useCallback(async () => {
    if (!oficinaId || (!finDesc.trim() && !finValor)) return;
    setFinSalvando(true);
    try {
      const valorNumerico = parseMoedaBR(finValor);
      const tipoNormalizado = finTipo === 'despesa' || finTipo === 'saida' ? 'saida' : 'entrada';

      await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        descricao: finDesc.trim() || (tipoNormalizado === 'entrada' ? 'Comissão / Receita Imobiliária' : 'Despesa Operacional'),
        valor: valorNumerico,
        tipo: tipoNormalizado,
        pagamento: finPagamento || 'PIX',
        data: new Date().toISOString(),
        vencimento: new Date().toISOString(),
        status: 'pago',
      });
      setFinDesc('');
      setFinValor('');
      setModalFinanceiroAberto(false);
      if (setAbaAtiva) setAbaAtiva('financeiro');
    } catch (err) {
      alert('Erro ao salvar lançamento financeiro: ' + err.message);
    } finally {
      setFinSalvando(false);
    }
  }, [oficinaId, finDesc, finValor, finTipo, finPagamento, setAbaAtiva]);

  const salvarLeadRapido = useCallback(async () => {
    if (!leadNome.trim() && !leadTelefone.trim()) {
      alert('Preencha pelo menos o Nome ou o WhatsApp do cliente!');
      return;
    }
    setLeadSalvando(true);
    try {
      const nomeLimpo = leadNome.trim() || 'Lead Imobiliário';
      const telLimpo = leadTelefone.replace(/\D/g, '');
      const detalheInteresse = leadProblema.trim() || 'Interesse em compra/locação de imóvel';

      if (oficinaId) {
        // 1. Salva no CRM Imobiliário principal (leads_imobi) para atualizar Funil e VGV imediatamente
        await addDoc(collection(db, 'oficinas', oficinaId, 'leads_imobi'), {
          nome: nomeLimpo,
          telefone: telLimpo,
          interesse: /alug|loca/i.test(detalheInteresse) ? 'Locação' : 'Compra',
          bairro: detalheInteresse,
          orcamento: 0,
          estagio: 'Novo Lead',
          corretorResponsavel: 'Atendimento Direto',
          origem: 'Ação Rápida • Painel',
          criadoEm: serverTimestamp(),
        });

        // 2. Salva também na coleção leads para sincronia total com o Kanban de Clientes
        await addDoc(collection(db, 'oficinas', oficinaId, 'leads'), {
          nome: nomeLimpo,
          telefone: telLimpo,
          veiculo: 'Imóvel Residencial / Comercial',
          imovel: detalheInteresse,
          problema: detalheInteresse,
          data_registro: new Date().toISOString(),
          data: new Date().toISOString(),
          origem: 'QuickAction',
          status: 'novo',
        });
      }

      setLeadNome('');
      setLeadTelefone('');
      setLeadProblema('');
      setModalClienteAberto(false);
      if (setAbaAtiva) setAbaAtiva('funil_leads');
    } catch (err) {
      alert('Erro ao salvar lead: ' + err.message);
    } finally {
      setLeadSalvando(false);
    }
  }, [oficinaId, leadNome, leadTelefone, leadProblema, setAbaAtiva]);

  return {
    modalTarefaAberto,
    setModalTarefaAberto,
    tarefaRapidaTitulo,
    setTarefaRapidaTitulo,
    tarefaRapidaDesc,
    setTarefaRapidaDesc,
    tarefaRapidaData,
    setTarefaRapidaData,
    tarefaRapidaHora,
    setTarefaRapidaHora,
    salvarTarefaRapida,
    salvandoTarefaRapida,
    tarefasRapidas,
    alternarStatusTarefaRapida,
    excluirTarefaRapida,
    feedbackTarefa,
    modalFinanceiroAberto,
    setModalFinanceiroAberto,
    finTipo,
    setFinTipo,
    finDesc,
    setFinDesc,
    finValor,
    setFinValor,
    finPagamento,
    setFinPagamento,
    salvarFinanceiroRapido,
    finSalvando,
    modalClienteAberto,
    setModalClienteAberto,
    leadNome,
    setLeadNome,
    leadTelefone,
    setLeadTelefone,
    leadProblema,
    setLeadProblema,
    salvarLeadRapido,
    leadSalvando,
  };
}
