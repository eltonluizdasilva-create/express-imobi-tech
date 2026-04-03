import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ChecklistViagem({ osId, statusInicial = 1, isAdmin = false, modo = 'ambos' }) {
    const [statusAtual, setStatusAtual] = useState(statusInicial);
    const [salvando, setSalvando] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState('mecanica');
    const [marcados, setMarcados] = useState({});

    const passos = [
        { id: 1, label: 'Entrada', icon: '🏁' },
        { id: 2, label: 'Análise', icon: '🔍' },
        { id: 3, label: 'Reparo', icon: '🛠️' },
        { id: 4, label: 'Pronto', icon: '✨' }
    ];

    const categoriasChecklist = {
        mecanica: {
            id: 'mecanica', titulo: "🔧 Mecânica", cor: "text-red-500", bordaAtiva: "border-red-500 bg-red-500/10", bgCheck: "accent-red-600",
            itens: [
                { id: 'pneus', label: 'Pneus', desc: 'Calibrar todos, incluindo o estepe.' },
                { id: 'fluidos', label: 'Fluidos', desc: 'Nível de óleo do motor e fluido de freio.' },
                { id: 'agua', label: 'Água', desc: 'Líquido de arrefecimento e limpador de para-brisa.' },
                { id: 'luzes', label: 'Luzes', desc: 'Faróis, setas, luzes de freio e ré.' },
                { id: 'freios', label: 'Freios', desc: 'Checar pastilhas e discos.' },
                { id: 'bateria', label: 'Bateria', desc: 'Testar a carga.' },
                { id: 'obrigatorios', label: 'Obrigatórios', desc: 'Triângulo, macaco e chave de roda.' },
                { id: 'extras', label: 'Extras', desc: 'Kit de ferramentas e lanterna.' }
            ]
        },
        documentos: {
            id: 'documentos', titulo: "📄 Documentos", cor: "text-blue-500", bordaAtiva: "border-blue-500 bg-blue-500/10", bgCheck: "accent-blue-600",
            itens: [
                { id: 'cnh', label: 'CNH e CRLV-e', desc: 'Documentos do motorista e do veículo em dia.' },
                { id: 'revisao', label: 'Revisão', desc: 'Verifique se não há revisões próximas durante a viagem.' },
                { id: 'rota', label: 'Rota (GPS)', desc: 'Mapa offline baixado ou roteiro de segurança.' }
            ]
        },
        conforto: {
            id: 'conforto', titulo: "🛋️ Conforto", cor: "text-green-500", bordaAtiva: "border-green-500 bg-green-500/10", bgCheck: "accent-green-600",
            itens: [
                { id: 'carregadores', label: 'Carregadores', desc: 'Cabo USB e carregador veicular.' },
                { id: 'suporte', label: 'Suporte celular', desc: 'Para fixar no painel com segurança.' },
                { id: 'higiene', label: 'Higiene', desc: 'Lenços umedecidos, álcool gel, sacolas para lixo.' },
                { id: 'alimentacao', label: 'Alimentação', desc: 'Água fresca e lanches rápidos.' },
                { id: 'outros', label: 'Primeiros Socorros', desc: 'Óculos de sol, remédios básicos, curativos.' }
            ]
        }
    };

    const alterarStatus = async (novoStatus) => {
        if (!isAdmin) return;
        setStatusAtual(novoStatus);
        setSalvando(true);
        setTimeout(() => setSalvando(false), 500);
    };

    const toggleChecklistItem = (itemId) => {
        setMarcados(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const totalItens = Object.values(categoriasChecklist).flatMap(c => c.itens).length;
    const progresso = Math.round((Object.values(marcados).filter(Boolean).length / totalItens) * 100) || 0;
    const categoriaAtual = categoriasChecklist[abaAtiva];

    // Estilos dinâmicos baseados no modo ativo
    const isChecklist = modo === 'checklist';
    const borderClass = isChecklist ? 'border-green-500' : 'border-[#a855f7]';
    const bgClass = isChecklist ? 'bg-[#001a05]' : 'bg-[#0a001a]';
    const blurClass = isChecklist ? 'bg-green-500' : 'bg-[#a855f7]';

    return (
        <div className={`w-full max-w-2xl mx-auto ${bgClass} border ${borderClass} rounded-[24px] p-6 md:p-10 shadow-2xl relative overflow-hidden font-sans transition-colors duration-500`}>
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 ${blurClass} opacity-10 blur-[80px] pointer-events-none transition-colors duration-500`}></div>

            {/* SEÇÃO 1: RASTREAMENTO */}
            {(modo === 'ambos' || modo === 'rastreamento') && (
                <div className="mb-12 relative z-10 text-center animate-fade-in">
                    <p className="text-[#a855f7] text-[10px] font-black uppercase tracking-[0.3em] mb-2">STATUS EM TEMPO REAL</p>
                    <h3 className="text-white text-xl font-medium mb-10 tracking-wide">Status Atual do Veículo</h3>
                    <div className="relative flex justify-between items-center max-w-lg mx-auto">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-800 -translate-y-1/2 z-0"></div>
                        <div className="absolute top-1/2 left-0 h-[2px] bg-[#a855f7] shadow-[0_0_10px_#a855f7] -translate-y-1/2 z-0 transition-all duration-500 ease-in-out" style={{ width: `${((statusAtual - 1) / (passos.length - 1)) * 100}%` }}></div>
                        {passos.map((p) => (
                            <div key={p.id} className="relative z-10 flex flex-col items-center cursor-pointer" onClick={() => alterarStatus(p.id)}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-[2px] transition-all ${statusAtual >= p.id ? 'bg-[#1a0033] border-[#a855f7] text-white shadow-[0_0_15px_#a855f7]' : 'bg-[#0a0a0a] border-neutral-800 text-neutral-600'}`}>{p.icon}</div>
                                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase ${statusAtual >= p.id ? 'text-[#c4b5fd]' : 'text-neutral-600'}`}>{p.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DIVISÓRIA (SÓ APARECE SE FOR 'AMBOS') */}
            {modo === 'ambos' && (
                <div className="w-full h-[1px] bg-neutral-800 mb-8 relative z-10"></div>
            )}

            {/* SEÇÃO 2: CHECKLIST DE VIAGEM */}
            {(modo === 'ambos' || modo === 'checklist') && (
                <div className="relative z-10 animate-fade-in">
                    <div className="text-center mb-6">
                        <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">PREPARE-SE PARA A ESTRADA</p>
                        <h3 className="text-white text-lg font-black uppercase tracking-widest">Checklist de <span className="text-green-500">Viagem Segura</span></h3>
                    </div>
                    <div className="mb-8 max-w-md mx-auto">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <span className="text-neutral-500 font-bold text-[9px] uppercase tracking-widest">Pronto:</span>
                            <span className="text-white font-black text-sm">{progresso}%</span>
                        </div>
                        <div className="w-full bg-[#111] rounded-full h-2 overflow-hidden border border-neutral-800">
                            <div className="bg-gradient-to-r from-red-600 via-blue-500 to-green-500 h-2 transition-all duration-500" style={{ width: `${progresso}%` }}></div>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {Object.values(categoriasChecklist).map(cat => (
                            <button key={cat.id} onClick={() => setAbaAtiva(cat.id)} className={`flex-shrink-0 px-4 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${abaAtiva === cat.id ? `${cat.bordaAtiva} ${cat.cor}` : 'bg-[#0a0a0a] border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>{cat.titulo}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoriaAtual.itens.map(item => (
                            <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all ${marcados[item.id] ? 'bg-black opacity-40 border-neutral-900' : 'bg-[#0a0a0a] border-neutral-800 hover:border-neutral-600'}`}>
                                <input type="checkbox" className={`w-5 h-5 rounded cursor-pointer ${categoriaAtual.bgCheck}`} checked={!!marcados[item.id]} onChange={() => toggleChecklistItem(item.id)} />
                                <div className="flex-1">
                                    <p className={`font-black text-xs uppercase ${marcados[item.id] ? 'line-through text-neutral-500' : 'text-white'}`}>{item.label}</p>
                                    <p className="text-[10px] mt-1 text-neutral-500">{item.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}