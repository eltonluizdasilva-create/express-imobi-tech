import React, { useState, useRef } from 'react';
import { Sparkles, X, Mic, ShoppingCart } from 'lucide-react';
import AbaAjudaIA from '../AbaAjudaIA';

export default function ChatFlutuanteIA() {
    const [aberto, setAberto] = useState(false);
    const [ouvindo, setOuvindo] = useState(false);
    const recRef = useRef(null);

    const iniciarVoz = (setter, fieldKey) => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        rec.interimResults = false;
        recRef.current = rec;
        rec.onstart = () => setOuvindo(true);
        rec.onresult = e => setter(e.results[0][0].transcript);
        rec.onerror = () => setOuvindo(false);
        rec.onend = () => setOuvindo(false);
        rec.start();
    };

    return (
        <>
            {/* Botão IA - Mais acima */}
            <button
                onClick={() => setAberto(true)}
                className="fixed bottom-16 right-4 z-[9999] w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
                <Sparkles size={18} color="white" />
            </button>

            {/* Botão ML - Mais abaixo */}
            <div className="fixed bottom-4 right-4 z-[9999]">
                <div className="w-10 h-10 bg-[#FFE600] rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-500" onClick={() => window.dispatchEvent(new CustomEvent('abrirMercadoLivre'))}>
                    <ShoppingCart size={18} color="#2d3277" strokeWidth={2.5} />
                    <span className="absolute -top-0.5 -right-0.5 bg-[#2d3277] text-[#FFE600] text-[6px] font-bold px-1 py-0.5 rounded">ML</span>
                </div>
            </div>

            {aberto && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md h-[70vh] md:h-[550px] bg-black rounded-2xl border border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 bg-[#1a0000] border-b border-red-900/30">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-red-500" />
                                <span className="text-white font-black text-sm">Especialista IA</span>
                            </div>
                            <button
                                onClick={() => setAberto(false)}
                                className="w-7 h-7 bg-neutral-900 rounded-full flex items-center justify-center hover:bg-neutral-800"
                            >
                                <X size={14} color="#666" />
                            </button>
                        </div>
                        {/* Chat */}
                        <div className="h-[calc(100%-50px)]">
                            <AbaAjudaIA isFloating={true} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}