import React, { useState, useEffect } from 'react';
import { useOficinaBD } from '../hooks/useOficinaBD';
import {
    Sparkles,
    X,
    Mic,
    MicOff,
    Send,
    RotateCcw,
    Download,
    Building2,
} from 'lucide-react';

const SUGESTOES_RAPIDAS_IMOBI = [
    '📈 Como aumentar meu VGV este mês?',
    '💬 Script WhatsApp para agendar visita',
    '🔀 Como funciona a Roleta de Leads?',
    '📸 Como gerar Laudo de Vistoria com IA?',
];

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
    } = useOficinaBD(abaAtiva);

    const [mostrarMenuAcoes, setMostrarMenuAcoes] = useState(false);

    useEffect(() => {
        fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat, fimDoChatRef]);

    const handleEnviar = (textoOpcional) => {
        enviarMensagem(textoOpcional);
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
        a.download = `chat-especialista-imobi-${Date.now()}.json`;
        a.click();
        setMostrarMenuAcoes(false);
    };

    return (
        <div
            style={{ backgroundColor: '#020408' }}
            className={`w-full h-full flex flex-col ${t?.bg || 'bg-[#020408]'} overflow-hidden transition-all duration-300`}
        >
            {/* CABEÇALHO (Exibe quando não está embutido em modal que já possui barra superior, ou exibe subtítulo compacto) */}
            {!isFloating && (
                <div
                    style={{ backgroundColor: '#020408' }}
                    className="backdrop-blur-lg border-b border-slate-800 px-4 py-3.5 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div
                            style={{ backgroundColor: '#10b981' }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#10b981]/25"
                        >
                            <Building2 size={20} className="text-slate-950" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-tight text-white">
                                Especialista <span style={{ color: '#10b981' }}>Imobiliário IA</span>
                            </h2>
                            <p style={{ color: '#10b981' }} className="text-[10px] font-bold">
                                Express Imobi Tech • VGV, Leads & Imóveis
                            </p>
                        </div>
                    </div>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-900 rounded-lg transition-all duration-200 text-slate-400 hover:text-white cursor-pointer"
                            title="Fechar"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            )}

            {/* ATALHOS DE CONSULTA IMOBILIÁRIA EM 1 CLIQUE */}
            <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                {(SUGESTOES_RAPIDAS_IMOBI || [])?.map((sugestao) => (
                    <button
                        key={sugestao}
                        type="button"
                        disabled={loading}
                        onClick={() => handleEnviar(sugestao)}
                        className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900/90 border border-[#10b981]/30 hover:border-[#10b981] text-[10px] font-bold text-emerald-300 hover:text-white transition cursor-pointer"
                    >
                        {sugestao}
                    </button>
                ))}
            </div>

            {/* ÁREA DE CHAT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                {(chat || [])?.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div
                            className={`max-w-[88%] px-4 py-3 rounded-2xl text-xs md:text-sm leading-relaxed transition-all duration-200 ${
                                msg.role === 'user'
                                    ? 'bg-[#10b981]/20 border border-[#10b981]/40 ' +
                                      (tema === 'light' ? 'text-zinc-900' : 'text-white') +
                                      ' shadow-lg shadow-[#10b981]/10'
                                    : 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-lg shadow-black/20'
                            }`}
                        >
                            <p
                                style={{ color: '#10b981' }}
                                className="text-[10px] font-extrabold mb-1 uppercase tracking-wider"
                            >
                                {msg.role === 'user' ? '👤 Corretor / Gestor' : '🤖 Especialista Imobi IA'}
                            </p>

                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            <p className="text-[9px] opacity-40 mt-1.5 text-right">
                                {msg.timestamp
                                    ? new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : ''}
                            </p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-bounce"></div>
                                <div
                                    className="w-2 h-2 rounded-full bg-[#10b981] animate-bounce"
                                    style={{ animationDelay: '0.1s' }}
                                ></div>
                                <div
                                    className="w-2 h-2 rounded-full bg-[#10b981] animate-bounce"
                                    style={{ animationDelay: '0.2s' }}
                                ></div>
                            </div>
                            <span className="text-slate-400 text-xs">Consultando inteligência imobiliária...</span>
                        </div>
                    </div>
                )}

                <div ref={fimDoChatRef} />
            </div>

            {/* INPUT DE MENSAGEM */}
            <div
                style={{ backgroundColor: '#020408' }}
                className="backdrop-blur-lg border-t border-slate-800/80 p-3 space-y-2"
            >
                <div className="relative">
                    <div className="flex gap-2 items-end bg-slate-900/80 border border-slate-800 rounded-2xl px-3 py-2 transition-all duration-200 focus-within:border-[#10b981]">
                        <button
                            type="button"
                            onClick={handleVoz}
                            disabled={loading}
                            className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 cursor-pointer ${
                                ouvindo
                                    ? 'bg-[#10b981] text-slate-950 shadow-lg shadow-[#10b981]/50'
                                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                            } disabled:opacity-50`}
                            title={ouvindo ? 'Parar gravação' : 'Falar com Especialista IA'}
                        >
                            {ouvindo ? <MicOff size={15} /> : <Mic size={15} />}
                        </button>

                        <textarea
                            value={mensagem}
                            onChange={(e) => setMensagem(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Pergunte sobre VGV, leads, captação de imóveis ou financiamento..."
                            className="flex-1 bg-transparent text-white text-xs md:text-sm outline-none resize-none max-h-24 py-1 placeholder:text-slate-500"
                            rows="1"
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() => handleEnviar()}
                            disabled={loading || !mensagem.trim()}
                            style={{ backgroundColor: '#10b981' }}
                            className="p-2 rounded-full transition-all duration-200 flex-shrink-0 text-slate-950 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title="Enviar mensagem"
                        >
                            <Send size={15} />
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMostrarMenuAcoes(!mostrarMenuAcoes)}
                                className="p-2 rounded-full transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                                title="Mais opções"
                            >
                                ⋮
                            </button>

                            {mostrarMenuAcoes && (
                                <div className="absolute right-0 bottom-full mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[180px]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            limparChat();
                                            setMostrarMenuAcoes(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-[#10b981] flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <RotateCcw size={14} />
                                        Reiniciar conversa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleExportar}
                                        className="w-full px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-[#10b981] flex items-center gap-2 transition-colors border-t border-slate-800 cursor-pointer"
                                    >
                                        <Download size={14} />
                                        Exportar histórico
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-[10px] text-slate-500 px-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <span style={{ backgroundColor: '#10b981' }} className="inline-block w-1.5 h-1.5 rounded-full"></span>
                        <span>
                            Express Imobi Tech • Contexto: <strong className="text-[#10b981]">{abaAtiva}</strong>
                        </span>
                    </span>
                    <span className="text-slate-600 font-bold">Especialista IA 24h</span>
                </div>
            </div>
        </div>
    );
}
