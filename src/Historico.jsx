<<<<<<< HEAD
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Search, FileText, Calendar, User, Car, DollarSign, Eye, X, Archive, CheckCircle } from "lucide-react";

export default function Historico({ oficinaId }) {
    const [loading, setLoading] = useState(true);
    const [osList, setOsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOS, setSelectedOS] = useState(null);

    useEffect(() => {
        // PROTEÇÃO: Se não tiver o ID da oficina, não busca
        if (!oficinaId) {
            console.error("oficinaId não fornecido para o Histórico");
            return;
        }

        setLoading(true);

        // CAMINHO CORRETO DO BANCO DE DADOS
        const q = query(
            collection(db, 'oficinas', oficinaId, 'os'),
            orderBy('data_atualizacao', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lista = [];
            snapshot.forEach((doc) => {
                lista.push({ id: doc.id, ...doc.data() });
            });
            // Puxa as O.S. e coloca no estado
            setOsList(lista);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar histórico:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [oficinaId]);

    // Filtra por Placa ou Nome do Cliente
    const filteredOS = osList.filter(os => {
        const busca = searchTerm.toLowerCase();
        const placa = (os.placa || "").toLowerCase();
        const nome = (os.nomeCliente || "").toLowerCase();
        return placa.includes(busca) || nome.includes(busca);
    });

    const formatarData = (isoString) => {
        if (!isoString) return "--/--/----";
        const data = new Date(isoString);
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatarModulo = (tipo) => {
        const tipos = {
            'mecanica': 'Mecânica Geral',
            'hibrido': 'Híbridos / Elétricos',
            'eletrico': '100% Elétrico',
            'lataria': 'Lataria e Pintura',
            'moto': 'Oficina Moto',
            'amortecedor': 'Suspensão e Amortecedor',
            'injecao': 'Injeção Eletrônica',
            'alinhamento': 'Alinhamento',
            'oleo': 'Troca de Óleo',
            'revisao': 'Revisão Geral',
            'ar-condicionado': 'Ar-Condicionado',
            'pneus': 'Pneus e Borracharia',
            'escapamento': 'Escapamento',
            'lavajato': 'Lava Jato e Estética',
            'estetica': 'Estética Avançada'
        };
        return tipos[tipo] || (tipo ? tipo.toUpperCase() : 'TRIAGEM INICIAL');
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center gap-6 mb-12 border-b border-zinc-800 pb-8">
                    <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-xl shadow-indigo-600/30">
                        <Archive className="text-white" size={36} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Histórico de O.S.</h1>
                        <p className="text-indigo-400 font-bold text-xs tracking-[0.3em] uppercase">Arquivo de Serviços Realizados</p>
                    </div>
                </div>

                {/* BARRA DE PESQUISA */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 md:p-8 mb-8 shadow-xl flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={24} />
                        <input
                            type="text"
                            placeholder="Digite a PLACA ou NOME do cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 text-zinc-100 p-5 pl-16 rounded-[1.5rem] outline-none transition-all font-mono text-lg shadow-inner"
                        />
                    </div>
                    <div className="bg-indigo-950/30 border border-indigo-500/30 px-8 py-5 rounded-[1.5rem] flex flex-col items-center justify-center shrink-0 w-full md:w-auto">
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Encontrados</span>
                        <span className="text-3xl font-black text-indigo-500">{filteredOS.length}</span>
                    </div>
                </div>

                {/* LISTA DE RESULTADOS */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Carregando Histórico...</p>
                    </div>
                ) : filteredOS.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] p-16 text-center">
                        <FileText size={60} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-zinc-400 uppercase mb-2">Nenhum registro</h3>
                        <p className="text-zinc-600 text-sm">O histórico está vazio ou a placa não foi encontrada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOS.map((os) => (
                            <div key={os.id} className="bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 transition-all rounded-[2rem] p-6 shadow-lg group relative overflow-hidden">

                                {/* Etiqueta PAGO se a O.S. estiver fechada/paga */}
                                {os.status === 'pago' || os.pago === true ? (
                                    <div className="absolute top-0 right-0 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl flex items-center gap-1">
                                        <CheckCircle size={10} /> PAGO
                                    </div>
                                ) : null}

                                <div className="flex justify-between items-start mb-4 mt-2">
                                    <div className="bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl">
                                        <span className="text-lg font-black text-white tracking-widest uppercase">{os.placa || "SEM PLACA"}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <User size={16} className="text-indigo-500" /> <span className="truncate font-semibold text-zinc-200">{os.nomeCliente || "Não informado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <Car size={16} className="text-indigo-500" /> <span className="truncate">{os.modelo || "Não informado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <Calendar size={16} className="text-indigo-500" /> <span>{formatarData(os.data_atualizacao || os.data_registro)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <DollarSign size={16} className="text-green-500" />
                                        <span className="font-black text-green-500 text-lg">
                                            R$ {(os.total || os.totalModulo || os.totalEletrico || os.totalMoto || os.totalAmortecedor || os.totalInjecao || os.totalAlinhamento || os.totalOleo || os.totalRevisao || os.totalAr || os.totalPneus || os.totalEscapamento || os.totalLavaJato || os.totalEstetica || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-2 inline-block text-[10px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-lg font-bold uppercase">
                                        {formatarModulo(os.tipoServico)}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedOS(os)}
                                    className="w-full py-4 bg-zinc-800 group-hover:bg-indigo-600 text-zinc-300 group-hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} /> Ver Laudo Completo
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🛑 MODAL DE DETALHES */}
            {selectedOS && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 relative">
                        <button onClick={() => setSelectedOS(null)} className="absolute top-6 right-6 p-2 bg-zinc-800 hover:bg-red-600 rounded-full transition-all text-white">
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Laudo Finalizado</h2>
                        <p className="text-indigo-500 font-bold text-[10px] tracking-widest uppercase mb-8">ID: {selectedOS.id}</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Placa</span>
                                <span className="text-lg font-black text-white uppercase">{selectedOS.placa || "---"}</span>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Cliente</span>
                                <span className="text-lg font-black text-white">{selectedOS.nomeCliente || "---"}</span>
                            </div>
                        </div>

                        <div className="bg-indigo-950/20 border border-indigo-500/30 p-6 rounded-2xl mb-8">
                            <h3 className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-4">Serviço Realizado</h3>
                            <p className="text-xl font-black text-white mb-2">{formatarModulo(selectedOS.tipoServico)}</p>
                        </div>

                        <div className="bg-green-950/20 border border-green-500/30 p-6 rounded-2xl text-center">
                            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest block mb-2">Total Pago</span>
                            <span className="text-4xl font-black text-green-500">
                                R$ {(selectedOS.total || selectedOS.totalModulo || selectedOS.totalEletrico || selectedOS.totalMoto || selectedOS.totalAmortecedor || selectedOS.totalInjecao || selectedOS.totalAlinhamento || selectedOS.totalOleo || selectedOS.totalRevisao || selectedOS.totalAr || selectedOS.totalPneus || selectedOS.totalEscapamento || selectedOS.totalLavaJato || selectedOS.totalEstetica || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
=======
import React from 'react';

export default function Historico() {
    const servicos = [
        { modelo: 'Caminhão 1113 1978', placa: 'OOO9999', data: '12/02/2026', status: 'Concluído' },
        { modelo: 'Uno 91', placa: 'QQQ1111', data: '08/02/2026', status: 'Em manutenção' },
        { modelo: 'Moto CG Titã 91', placa: 'PPP9999', data: '08/02/2026', status: 'Orçamento' }
    ];

    return (
        <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-center text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest italic">
                Histórico de Serviços - ADMIN
            </h2>

            {servicos.map((s, i) => (
                <div key={i} className="bg-[#0f0f0f] border-l-4 border-red-600 p-4 flex justify-between items-center rounded-r-xl shadow-lg">
                    <div>
                        <p className="text-white font-bold text-sm uppercase leading-tight">
                            {s.modelo}
                        </p>
                        <p className="text-red-500 font-black text-[10px]">{s.placa}</p>
                        <p className="text-gray-600 text-[9px] mt-1">{s.data} • {s.status}</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                        WhatsApp
                    </button>
                </div>
            ))}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        </div>
    );
}