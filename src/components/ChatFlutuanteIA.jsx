import React, { useState, useRef } from 'react';
import { Sparkles, X, Building2 } from 'lucide-react';
import AbaAjudaIA from './AbaAjudaIA';

export default function ChatFlutuanteIA() {
    const [aberto, setAberto] = useState(false);
    const [ouvindo, setOuvindo] = useState(false);
    const recRef = useRef(null);

    const iniciarVoz = (setter) => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        rec.interimResults = false;
        recRef.current = rec;
        rec.onstart = () => setOuvindo(true);
        rec.onresult = (e) => setter(e.results[0][0].transcript);
        rec.onerror = () => setOuvindo(false);
        rec.onend = () => setOuvindo(false);
        rec.start();
    };

    return (
        <>
            <button
                onClick={() => setAberto(true)}
                style={{ backgroundColor: '#10b981' }}
                className="fixed bottom-6 right-4 z-[9999] w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-[#10b981]/40 hover:scale-110 transition-transform cursor-pointer"
                title="Especialista Imobiliário IA"
            >
                <Sparkles size={18} color="#020408" />
            </button>

            {aberto && (
                <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
                    <div
                        style={{ backgroundColor: '#020408' }}
                        className="w-full max-w-md h-[72vh] md:h-[560px] rounded-2xl border border-[#10b981]/50 shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden animate-fade-in"
                    >
                        <div className="flex items-center justify-between p-3.5 bg-[#020408] border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div
                                    style={{ backgroundColor: '#10b981' }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                >
                                    <Building2 size={15} className="text-slate-950" />
                                </div>
                                <div>
                                    <span className="text-white font-black text-xs uppercase block leading-none">
                                        Especialista IA — Express Imobi Tech
                                    </span>
                                    <span style={{ color: '#10b981' }} className="text-[10px] font-bold">
                                        Gestão de VGV, Leads & Imóveis
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setAberto(false)}
                                className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                            >
                                <X size={14} color="#94a3b8" />
                            </button>
                        </div>
                        <div className="h-[calc(100%-56px)]">
                            <AbaAjudaIA isFloating={true} onBack={() => setAberto(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
