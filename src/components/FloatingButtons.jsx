import React, { useState } from 'react';
import { ShoppingCart, Bot, CheckSquare, Wallet, UserPlus, X, Lock } from 'lucide-react';
import AbaAjudaIA from './AbaAjudaIA';

export default function FloatingButtons({ t, abaAtiva, moduloLiberado, lidarModuloBloqueado, setAbaAtiva }) {
    const [chatAberto, setChatAberto] = useState(false);

    const abrirML = () => {
        window.dispatchEvent(new CustomEvent('abrirMercadoLivreModal'));
    };

    return (
        <>
            {/* ===== LADO ESQUERDO - 2 botões ===== */}
            <div id="botoes-flutuantes" className="fixed bottom-6 left-6 z-[50] flex flex-col gap-3">
                {/* Botão Mercado Livre (Base) - com brilho piscante */}
                <button
                    onClick={abrirML}
                    className="relative w-10 h-10 bg-[#FFE600] rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-500 hover:scale-110 active:scale-95 transition-all"
                    title="Mercado Livre"
                >
                    <ShoppingCart size={18} color="#2d3277" strokeWidth={2.5} />
                    <span className="absolute inset-0 rounded-full animate-ping bg-[#FFE600] opacity-40"></span>
                </button>

                {/* Botão Especialista IA (Topo) - Vermelho com brilho */}
                <button
                    onClick={() => setChatAberto(true)}
                    className="relative w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.8)] border-2 border-red-400 hover:scale-110 active:scale-95 transition-all"
                    title="Especialista IA"
                >
                    <Bot size={18} color="white" />
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-50"></span>
                </button>
            </div>

            {/* ===== LADO DIREITO - 3 botões ===== */}
            <div className="fixed bottom-6 right-6 z-[50] flex flex-col gap-3">
                {/* Botão 1: Tarefas */}
                <button
                    onClick={() => {
                        if (moduloLiberado && !moduloLiberado('tarefa')) {
                            lidarModuloBloqueado('tarefa');
                        } else {
                            if (setAbaAtiva) setAbaAtiva('tarefa');
                            else window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'tarefa' }));
                        }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all relative"
                    style={{ background: t.bgCardAlt, border: `1px solid ${t.border}` }}
                    title="Tarefas"
                >
                    <CheckSquare size={18} color="#f472b6" />
                    {moduloLiberado && !moduloLiberado('tarefa') && (
                        <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 border border-black">
                            <Lock size={8} color="white" />
                        </div>
                    )}
                </button>

                {/* Botão 2: Financeiro */}
                <button
                    onClick={() => {
                        if (moduloLiberado && !moduloLiberado('financeiro')) {
                            lidarModuloBloqueado('financeiro');
                        } else {
                            if (setAbaAtiva) setAbaAtiva('financeiro');
                            else window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'financeiro' }));
                        }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all relative"
                    style={{ background: t.bgCardAlt, border: `1px solid ${t.border}` }}
                    title="Financeiro"
                >
                    <Wallet size={18} color="#3b82f6" />
                    {moduloLiberado && !moduloLiberado('financeiro') && (
                        <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 border border-black">
                            <Lock size={8} color="white" />
                        </div>
                    )}
                </button>

                {/* Botão 3: Clientes */}
                <button
                    onClick={() => {
                        if (moduloLiberado && !moduloLiberado('clientes')) {
                            lidarModuloBloqueado('clientes');
                        } else {
                            if (setAbaAtiva) setAbaAtiva('clientes');
                            else window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'clientes' }));
                        }
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all relative"
                    style={{ background: t.bgCardAlt, border: `1px solid ${t.border}` }}
                    title="Clientes"
                >
                    <UserPlus size={18} color="#22c55e" />
                    {moduloLiberado && !moduloLiberado('clientes') && (
                        <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 border border-black">
                            <Lock size={8} color="white" />
                        </div>
                    )}
                </button>
            </div>

            {/* ===== JANELA CHAT IA ===== */}
            {chatAberto && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md h-[65vh] md:h-[520px] bg-black rounded-2xl border border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between p-3 bg-[#1a0000] border-b border-red-900/30">
                            <div className="flex items-center gap-2">
                                <Bot size={18} className="text-red-500" />
                                <span className="text-white font-black text-sm">Especialista IA</span>
                            </div>
                            <button
                                onClick={() => setChatAberto(false)}
                                className="w-7 h-7 bg-neutral-900 rounded-full flex items-center justify-center hover:bg-neutral-800"
                            >
                                <X size={14} color="#666" />
                            </button>
                        </div>
                        <div className="h-[calc(100%-50px)]">
                            <AbaAjudaIA isFloating={true} abaAtiva={abaAtiva} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}