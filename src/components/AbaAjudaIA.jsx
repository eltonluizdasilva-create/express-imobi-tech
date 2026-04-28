import React, { useState, useRef, useEffect } from 'react';
import { useOficinaBD } from '../hooks/useOficinaBD';
import {
    Sparkles,
    X,
    Mic,
    MicOff,
    Send,
    RotateCcw,
    Download,
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * COMPONENTE: AbaAjudaIA
 * ═══════════════════════════════════════════════════════════════
 * 
 * Interface de chat inteligente com Especialista IA
 * - Integrado com BaseConhecimentoOficinIA.js
 * - Suporta voice input (reconhecimento de voz em PT-BR)
 * - Design dark elegante com animações suaves
 * - Responsivo para mobile e desktop
 * 
 * PROPS:
 * - onBack: função para voltar ao menu anterior
 * - isFloating: se está em modo flutuante
 * - abaAtiva: qual aba do sistema está ativa (para contexto)
 */

export default function AbaAjudaIA({ onBack, isFloating, abaAtiva = 'visao_geral', t, tema }) {
    const {
        chat,
        mensagem,
        setMensagem,
        loading,
        ouvindo,
        fimDoChatRef,
        enviarMensagem,
        iniciarVoz,
        pararVoz,
        limparChat,
        exportarHistorico,
        contextoAtual,
    } = useOficinaBD(abaAtiva);

    // Estado local para UI
    const [mostrarMenuAcoes, setMostrarMenuAcoes] = useState(false);

    // Auto-scroll ao nova mensagem
    useEffect(() => {
        fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat, fimDoChatRef]);

    // Handlers
    const handleEnviar = () => {
        enviarMensagem();
        setMostrarMenuAcoes(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEnviar();
        }
    };

    const handleVoz = () => {
        if (ouvindo) {
            pararVoz();
        } else {
            iniciarVoz();
        }
    };

    const handleExportar = () => {
        const json = exportarHistorico('json');
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-especialista-${Date.now()}.json`;
        a.click();
        setMostrarMenuAcoes(false);
    };

    return (
        <div className={`w-full h-full flex flex-col ${t?.bg || 'bg-black'} overflow-hidden transition-all duration-300`}>
            {/* ─────────────────────────────────────────────────────────
          CABEÇALHO
          ───────────────────────────────────────────────────────── */}
            <div className={`${t?.card || 'bg-black/70'} backdrop-blur-lg border-b ${t?.border || 'border-neutral-900/50'} px-4 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center animate-pulse">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className={`text-sm font-black uppercase tracking-tight ${t?.text || 'text-white'}`}>
                            Especialista <span className="text-red-500">IA</span>
                        </h2>
                        <p className={`text-[10px] ${t?.textMuted || 'text-neutral-400'} font-medium`}>
                            Express Auto Tech
                        </p>
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className={`p-2 hover:${t?.bgCard || 'bg-neutral-900'} rounded-lg transition-all duration-200 ${t?.textMuted || 'text-neutral-400'} hover:${t?.text || 'text-white'}`}
                    title="Voltar"
                >
                    <X size={18} />
                </button>
            </div>

            {/* ─────────────────────────────────────────────────────────
          ÁREA DE CHAT
          ───────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                {chat.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                            } animate-fade-in`}
                        style={{
                            animation: `fadeIn 0.3s ease-out forwards`,
                            animationDelay: `${index * 50}ms`,
                        }}
                    >
                        {/* Bolha da mensagem */}
                        <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${msg.role === 'user'
                                ? 'bg-red-600/20 border border-red-600/40 ' + (tema === 'light' ? 'text-zinc-900' : 'text-white') + ' shadow-lg shadow-red-600/10'
                                : (t?.card || 'bg-neutral-900/80') + ' border ' + (t?.border || 'border-neutral-800/50') + ' ' + (t?.text || 'text-neutral-100') + ' shadow-lg shadow-black/20'
                                }`}
                        >
                            {/* Badge de role */}
                            <p className="text-[10px] font-bold opacity-40 mb-1.5 uppercase tracking-wider">
                                {msg.role === 'user' ? '👤 Você' : '🤖 Especialista'}
                            </p>

                            {/* Conteúdo */}
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            {/* Timestamp */}
                            <p className="text-[9px] opacity-30 mt-1.5 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Indicador de carregamento */}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-neutral-900/80 border border-neutral-800/50 px-4 py-3 rounded-2xl flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></div>
                                <div
                                    className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                                    style={{ animationDelay: '0.1s' }}
                                ></div>
                                <div
                                    className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                                    style={{ animationDelay: '0.2s' }}
                                ></div>
                            </div>
                            <span className="text-neutral-400 text-xs">Analisando...</span>
                        </div>
                    </div>
                )}

                {/* Referência para auto-scroll */}
                <div ref={fimDoChatRef} />
            </div>

            {/* ─────────────────────────────────────────────────────────
          INPUT DE MENSAGEM
          ───────────────────────────────────────────────────────── */}
            <div className={`${t?.card || 'bg-black/70'} backdrop-blur-lg border-t ${t?.border || 'border-neutral-900/50'} p-4 space-y-3`}>
                {/* Input Box */}
                <div className="relative">
                    <div className={`flex gap-2 items-end ${t?.bg || 'bg-neutral-900/60'} border ${t?.border || 'border-neutral-800'} rounded-2xl px-3 py-2 transition-all duration-200 hover:border-neutral-700 focus-within:border-red-600/50 focus-within:shadow-lg focus-within:shadow-red-600/10`}>
                        {/* Botão de voz */}
                        <button
                            onClick={handleVoz}
                            disabled={loading}
                            className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${ouvindo
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                : (t?.bgCard || 'bg-neutral-800') + ' ' + (t?.textMuted || 'text-neutral-400') + ' hover:' + (t?.text || 'text-white') + ' hover:bg-neutral-700'
                                } disabled:opacity-50`}
                            title={ouvindo ? 'Parar gravação' : 'Iniciar gravação de voz'}
                        >
                            {ouvindo ? (
                                <MicOff size={16} />
                            ) : (
                                <Mic size={16} />
                            )}
                        </button>

                        {/* Input de texto */}
                        <textarea
                            value={mensagem}
                            onChange={(e) => setMensagem(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="O que você quer saber para lucrar mais?"
                            className={`flex-1 bg-transparent ${t?.text || 'text-white'} text-sm outline-none resize-none max-h-24 py-1`}
                            rows="1"
                            disabled={loading}
                            style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#404040 transparent',
                            }}
                        />

                        {/* Botão enviar */}
                        <button
                            onClick={handleEnviar}
                            disabled={loading || !mensagem.trim()}
                            className="p-2 rounded-full transition-all duration-200 flex-shrink-0 bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Enviar mensagem"
                        >
                            <Send size={16} />
                        </button>

                        {/* Menu de ações */}
                        <div className="relative">
                            <button
                                onClick={() => setMostrarMenuAcoes(!mostrarMenuAcoes)}
                                className="p-2 rounded-full transition-all duration-200 text-neutral-400 hover:text-white hover:bg-neutral-800"
                                title="Mais ações"
                            >
                                ⋮
                            </button>

                            {mostrarMenuAcoes && (
                                <div className="absolute right-0 bottom-full mb-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50 min-w-[180px]">
                                    <button
                                        onClick={() => {
                                            limparChat();
                                            setMostrarMenuAcoes(false);
                                        }}
                                        className="w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors"
                                    >
                                        <RotateCcw size={14} />
                                        Limpar chat
                                    </button>
                                    <button
                                        onClick={handleExportar}
                                        className="w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors border-t border-neutral-800"
                                    >
                                        <Download size={14} />
                                        Exportar histórico
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dica rápida */}
                <div className="text-[10px] text-neutral-500 px-2 flex items-center gap-2">
                    <span className="inline-block w-1 h-1 rounded-full bg-neutral-600"></span>
                    <span>
                        Aba ativa: <strong className="text-neutral-400">{abaAtiva}</strong>
                    </span>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
          ESTILOS GLOBAIS
          ───────────────────────────────────────────────────────── */}
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-neutral-800::-webkit-scrollbar-thumb {
          background-color: rgba(38, 38, 38, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thumb-neutral-800::-webkit-scrollbar-thumb:hover {
          background-color: rgba(64, 64, 64, 0.7);
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
        </div>
    );
}
