import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc, getDoc } from 'firebase/firestore';

export function useDados(oficinaId) {
    const [listaCarros, setListaCarros] = useState([]);
    const [listaEstoque, setListaEstoque] = useState([]);
    const [listaFinanceiro, setListaFinanceiro] = useState([]);
    const [listaEquipamentos, setListaEquipamentos] = useState([]);
    const [listaVistorias, setListaVistorias] = useState([]);
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [listaFornecedores, setListaFornecedores] = useState([]);

    const carregarOS = async () => {
        if (!oficinaId) return;
        const s = await getDocs(query(collection(db, "oficinas", oficinaId, "os"), orderBy("data_registro", "desc")));
        setListaCarros(s.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const carregarEstoque = async () => {
        if (!oficinaId) return;
        const s = await getDocs(collection(db, "oficinas", oficinaId, "estoque"));
        setListaEstoque(s.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const carregarFinanceiro = async () => {
        if (!oficinaId) return;
        const s = await getDocs(query(collection(db, "oficinas", oficinaId, "financeiro"), orderBy("data", "desc")));
        setListaFinanceiro(s.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const carregarTudo = () => {
        carregarOS();
        carregarEstoque();
        carregarFinanceiro();
        // Adicione as outras chamadas aqui conforme necessário
    };

    const deletarDoc = async (col, id, reload) => {
        if (!oficinaId) return;
        if (confirm("Deseja realmente apagar permanentemente?")) {
            await deleteDoc(doc(db, "oficinas", oficinaId, col, id));
            reload();
        }
    };

    return {
        listaCarros, setListaCarros, listaEstoque, listaFinanceiro,
        listaEquipamentos, listaVistorias, listaUsuarios, setListaUsuarios,
        listaFornecedores, carregarTudo, carregarOS, carregarFinanceiro, deletarDoc
    };
}