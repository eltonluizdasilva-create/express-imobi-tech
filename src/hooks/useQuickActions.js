/* eslint-disable react/prop-types */
import { useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function useQuickActions({
  oficinaId,
  setAbaAtiva,
}) {
  const [salvandoTarefaRapida, setSalvandoTarefaRapida] = useState(false);
  const [tarefaRapidaTitulo, setTarefaRapidaTitulo] = useState('');
  const [tarefaRapidaDesc, setTarefaRapidaDesc] = useState('');
  const [tarefaRapidaData, setTarefaRapidaData] = useState('');
  const [tarefaRapidaHora, setTarefaRapidaHora] = useState('');

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

  const salvarTarefaRapida = useCallback(async () => {
    if (!oficinaId || !tarefaRapidaTitulo.trim()) return;
    setSalvandoTarefaRapida(true);
    try {
      let dataHora = null;
      if (tarefaRapidaData) {
        const hora = tarefaRapidaHora || '23:59';
        dataHora = new Date(`${tarefaRapidaData}T${hora}:00`);
      }
      await addDoc(collection(db, 'oficinas', oficinaId, 'tarefas'), {
        titulo: tarefaRapidaTitulo,
        descricao: tarefaRapidaDesc,
        dataHora: dataHora,
        status: 'pendente',
        dataCriacao: new Date(),
        prioridade: 'normal'
      });
      setTarefaRapidaTitulo('');
      setTarefaRapidaDesc('');
      setTarefaRapidaData('');
      setTarefaRapidaHora('');
      setModalTarefaAberto(false);
      setAbaAtiva('tarefa');
    } catch (err) { alert('Erro ao salvar tarefa: ' + err.message); }
    finally { setSalvandoTarefaRapida(false); }
  }, [oficinaId, tarefaRapidaTitulo, tarefaRapidaDesc, tarefaRapidaData, tarefaRapidaHora, setAbaAtiva]);

  const salvarFinanceiroRapido = useCallback(async () => {
    if (!oficinaId || (!finDesc && !finValor)) return;
    setFinSalvando(true);
    try {
      const docRef = await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        descricao: finDesc,
        valor: Number(finValor),
        tipo: finTipo,
        pagamento: finPagamento,
        data: new Date().toISOString(),
        vencimento: new Date().toISOString(),
        status: 'pago'
      });
      setFinDesc('');
      setFinValor('');
      setModalFinanceiroAberto(false);
      setAbaAtiva('financeiro');
    } catch (err) { alert('Erro ao salvar financeiro: ' + err.message); }
    finally { setFinSalvando(false); }
  }, [oficinaId, finDesc, finValor, finTipo, finPagamento, setAbaAtiva]);

  const salvarLeadRapido = useCallback(async () => {
    if (!oficinaId || !leadTelefone) return;
    setLeadSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'leads'), {
        nome: leadNome,
        telefone: leadTelefone,
        problema: leadProblema,
        data_registro: new Date(),
        data: new Date(),
        origem: 'QuickAction',
        status: 'novo'
      });
      setLeadNome('');
      setLeadTelefone('');
      setLeadProblema('');
      setModalClienteAberto(false);
      setAbaAtiva('leads');
    } catch (err) { alert('Erro ao salvar lead: ' + err.message); }
    finally { setLeadSalvando(false); }
  }, [oficinaId, leadNome, leadTelefone, leadProblema, setAbaAtiva]);

  return {
    modalTarefaAberto, setModalTarefaAberto,
    tarefaRapidaTitulo, setTarefaRapidaTitulo,
    tarefaRapidaDesc, setTarefaRapidaDesc,
    tarefaRapidaData, setTarefaRapidaData,
    tarefaRapidaHora, setTarefaRapidaHora,
    salvarTarefaRapida, salvandoTarefaRapida,
    modalFinanceiroAberto, setModalFinanceiroAberto,
    finTipo, setFinTipo,
    finDesc, setFinDesc,
    finValor, setFinValor,
    finPagamento, setFinPagamento,
    salvarFinanceiroRapido, finSalvando,
    modalClienteAberto, setModalClienteAberto,
    leadNome, setLeadNome,
    leadTelefone, setLeadTelefone,
    leadProblema, setLeadProblema,
    salvarLeadRapido, leadSalvando,
  };
}
