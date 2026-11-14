import React, { useState } from 'react';
import { Bot, CheckSquare, Wallet, UserPlus, X, Lock, Building2 } from 'lucide-react';
import AbaAjudaIA from './AbaAjudaIA';
import AjudaFlutuante from './ui/AjudaFlutuante';

export default function FloatingButtons({
    t = { bgCardAlt: '#020408', border: '#1e293b' },
    abaAtiva,
    infoAbaAtiva,
    moduloLiberado,
    lidarModuloBloqueado,
    setModalTarefaAberto,
    setModalFinanceiroAberto,
    setModalClienteAberto,
}) {
    const [chatAberto, setChatAberto] = useState(false);

    const acionarTarefaRapida = () => {
        if (moduloLiberado && !moduloLiberado('tarefa')) {
            if (lidarModuloBloqueado) lidarModuloBloqueado('tarefa');
            return;
        }
        if (typeof setModalTarefaAberto === 'function') {
            setModalTarefaAberto(true);
        } else {
            window.dispatchEvent(new CustomEvent('abrirModalTarefaRapida'));
        }
    };

    const acionarFinanceiroRapido = () => {
        if (moduloLiberado && !moduloLiberado('financeiro')) {
            if (lidarModuloBloqueado) lidarModuloBloqueado('financeiro');
            return;
        }
        if (typeof setModalFinanceiroAberto === 'function') {
            setModalFinanceiroAberto(true);
        } else {
            window.dispatchEvent(new CustomEvent('abrirModalFinanceiroRapido'));
        }
    };

    const acionarClienteRapido = () => {
        if (moduloLiberado && !moduloLiberado('clientes')) {
            if (lidarModuloBloqueado) lidarModuloBloqueado('clientes');
            return;
        }
        if (typeof setModalClienteAberto === 'function') {
            setModalClienteAberto(true);
        } else {
            window.dispatchEvent(new CustomEvent('abrirModalClienteRapido'));
        }
    };

    return (
        <>
            {/* ===== LADO ESQUERDO - Especialista Imobiliário IA ===== */}
            <div id="botoes-flutuantes" className="fixed bottom-6 left-6 z-[50] flex flex-col gap-3">
                <button
                    type="button"
                    onClick={() => setChatAberto(true)}
                    style={{ backgroundColor: '#10b981' }}
                    className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.75)] border-2 border-emerald-300 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Especialista Imobiliário IA (Express Imobi Tech)"
                >
                    <Bot size={22} color="#020408" />
                    <span className="absolute inset-0 rounded-full animate-ping bg-[#10b981] opacity-40"></span>
                </button>
            </div>

            {/* ===== LADO DIREITO - Ações Rápidas (Tarefas 1-Clique, Financeiro VGV, Novo Lead) ===== */}
            <div className="fixed bottom-6 right-6 z-[50] flex flex-col gap-3">
                {/* Botão 0: Ajuda / Manual da aba atual (acima dos demais) */}
                <AjudaFlutuante abaAtiva={abaAtiva} infoAba={infoAbaAtiva} />

                {/* Botão 1: Tarefas Imobiliárias Rápidas (1 Clique) */}
                <button
                    type="button"
                    onClick={acionarTarefaRapida}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all relative cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                        border: '2px solid #6ee7b7',
                        boxShadow: '0 0 20px rgba(16,185,129,0.55)',
                    }}
                    title="Tarefas Imobiliárias Rápidas (Criar com 1 Clique)"
                >
                    <CheckSquare size={19} color="#022c22" />
                    {moduloLiberado && !moduloLiberado('tarefa') && (
                        <div className="absolute -top-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-black">
                            <Lock size={8} color="white" />
                        </div>
                    )}
                </button>

                {/* Botão 2: Lançamento Rápido Financeiro & VGV */}
                <button
                    type="button"
                    onClick={acionarFinanceiroRapido}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all relative cursor-pointer"
                    style={{
                        background: '#020408',
                        border: '2px solid #38bdf8',
                        boxShadow: '0 0 18px rgba(56,189,248,0.45)',
                    }}
                    title="Lançamento Rápido: Comissão / Despesa"
                >
                    <Wallet size={18} color="#38bdf8" />
                    {moduloLiberado && !moduloLiberado('financeiro') && (
                        <div className="absolute -top-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-black">
                            <Lock size={8} color="white" />
                        </div>
                    )}
                </button>

                {/* Botão 3: Novo Lead / Cliente Rápido */}
                <button
                    type="button"
                    onClick={acionarClienteRapido}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all relative cursor-pointer"
                    style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        border: '2px solid #c4b5fd',
                        boxShadow: '0 0 20px rgba(139,92,246,0.55)',
                    }}
                    title="Cadastrar Novo Lead / Cliente Imobiliário"
                >
                    <UserPlus size={18} color="#f5f3ff" />
                    {moduloLiberado && !moduloLiberado('clientes') && (
                        <div className="absolute -top-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-black">
                            <Lock size={8} color="white" />
                        </div>
                    )}
                </button>
            </div>

            {/* ===== JANELA CHAT ESPECIALISTA IA ===== */}
            {chatAberto && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        style={{ backgroundColor: '#020408' }}
                        className="w-full max-w-md h-[72vh] md:h-[560px] rounded-2xl border border-[#10b981]/50 shadow-[0_0_35px_rgba(16,185,129,0.3)] overflow-hidden animate-fade-in"
                    >
                        <div className="flex items-center justify-between p-3.5 bg-[#020408] border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div
                                    style={{ backgroundColor: '#10b981' }}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-[#10b981]/30"
                                >
                                    <Building2 size={16} className="text-slate-950" />
                                </div>
                                <div>
                                    <span className="text-white font-black text-xs uppercase block leading-none">
                                        Especialista IA — Express Imobi Tech
                                    </span>
                                    <span style={{ color: '#10b981' }} className="text-[10px] font-bold">
                                        Consultor de VGV, Leads & Imóveis
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setChatAberto(false)}
                                className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                            >
                                <X size={14} color="#94a3b8" />
                            </button>
                        </div>
                        <div className="h-[calc(100%-56px)]">
                            <AbaAjudaIA
                                isFloating={true}
                                abaAtiva={abaAtiva}
                                onBack={() => setChatAberto(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
