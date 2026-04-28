/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import {
    Bot, Sparkles, MessageSquare, PhoneCall, Calculator,
    CalendarClock, Send, Copy, CheckCircle, Clock, Star,
    Mic, Save, Settings, Heart
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm shadow-inner'
};

export default function Secretaria({ oficinaId, abrirRecuperacaoFinanceira }) {
    // Estados do Polidor
    const [promptTexto, setPromptTexto] = useState("");
    const [mensagemGerada, setMensagemGerada] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Estados do NPS
    const [nomeCliente, setNomeCliente] = useState("");
    const [veiculoCliente, setVeiculoCliente] = useState("");
    const [googleLink, setGoogleLink] = useState("");
    const [isEditingLink, setIsEditingLink] = useState(false);

    const [copied, setCopied] = useState(false);

    // Estados dos Novos Painéis
    const [loading, setLoading] = useState(true);
    const [alertasJuridicos, setAlertasJuridicos] = useState({ semFoto: 0, semAssinatura: 0 });
    const [alertasContabeis, setAlertasContabeis] = useState({ osInadimplentes: 0, valorPendente: 0, nfPendente: 0 });
    const [alertasSecretaria, setAlertasSecretaria] = useState({ orcamentosPerdidosCount: 0, valorPerdido: 0 });

    // Busca dados
    useEffect(() => {
        const fetchConfig = async () => {
            if (!oficinaId) return;
            const docSnap = await getDoc(doc(db, 'oficinas', oficinaId));
            if (docSnap.exists() && docSnap.data().googleReviewLink) {
                setGoogleLink(docSnap.data().googleReviewLink);
            } else {
                setIsEditingLink(true);
            }
        };
        fetchConfig();

        const buscarDadosEstrategicos = async () => {
            if (!oficinaId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const osRef = collection(db, "oficinas", oficinaId, "os");
                const querySnapshot = await getDocs(osRef);

                let contSemFoto = 0;
                let contSemAssinatura = 0;
                let contInadimplentes = 0;
                let somaValorPendente = 0;
                let contNfPendente = 0;

                let contOrcamentos = 0;
                let somaValorOrcamentoPerdido = 0;

                const trintaDiasAtras = new Date();
                trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

                querySnapshot.forEach((doc) => {
                    const os = doc.data();
                    if (!os.fotos || os.fotos.length === 0) contSemFoto++;
                    if (!os.assinatura) contSemAssinatura++;
                    if (os.statusPagamento === 'pendente' || os.status === 'pendente') {
                        contInadimplentes++;
                        somaValorPendente += (Number(os.total) || 0);
                        let dataOS = null;
                        if (os.data_registro && typeof os.data_registro.toDate === 'function') {
                            dataOS = os.data_registro.toDate();
                        } else if (os.data_registro) {
                            dataOS = new Date(os.data_registro);
                        }
                        if (dataOS && dataOS >= trintaDiasAtras) {
                            contOrcamentos++;
                            somaValorOrcamentoPerdido += (Number(os.total) || 0);
                        }
                    }
                    if (!os.nfEmitida) contNfPendente++;
                });

                setAlertasJuridicos({ semFoto: contSemFoto, semAssinatura: contSemAssinatura });
                setAlertasContabeis({ osInadimplentes: contInadimplentes, valorPendente: somaValorPendente, nfPendente: contNfPendente });
                setAlertasSecretaria({ orcamentosPerdidosCount: contOrcamentos, valorPerdido: somaValorOrcamentoPerdido });
                setLoading(false);
            } catch (error) {
                console.error("Erro ao auditar dados:", error);
                setLoading(false);
            }
        };
        buscarDadosEstrategicos();
    }, [oficinaId]);

    const salvarGoogleLink = async () => {
        if (!oficinaId) return;
        await updateDoc(doc(db, 'oficinas', oficinaId), { googleReviewLink: googleLink });
        setIsEditingLink(false);
    };

    const toggleMic = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert("Microfone não suportado.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening) { rec.stop(); setIsListening(false); }
        else {
            setIsListening(true); rec.start();
            rec.onresult = (e) => setPromptTexto(e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleGerarMensagem = () => {
        if (!promptTexto.trim()) return;
        setIsGenerating(true);
        setTimeout(() => {
            const polido = `Olá! Tudo bem? 🚗✨\n\nPassando para informar sobre o serviço no seu veículo: ${promptTexto}\n\nQualquer dúvida, estamos à disposição. Um abraço da equipe Express Auto Tech! 🛠️`;
            setMensagemGerada(polido);
            setIsGenerating(false);
        }, 1200);
    };

    const enviarNPS = () => {
        if (!nomeCliente || !veiculoCliente) return alert("Preencha o nome e o veículo para gerar o NPS.");
        const msg = `Olá, ${nomeCliente}! 🌟\n\nO que achou do serviço realizado no seu ${veiculoCliente}? Sua opinião é muito importante para nós!\n\nPoderia nos avaliar com 5 estrelas no Google? Leva menos de 30 segundos e ajuda muito a nossa oficina:\n👉 ${googleLink || 'Link do Google'}\n\nMuito obrigado! 👊`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const alertarEquipe = () => {
        const texto = encodeURIComponent(`🚨 *ALERTA ESTRATÉGICO DA DIREÇÃO* 🚨\n\nPessoal, o nosso sistema detectou:\n📸 ${alertasJuridicos.semFoto} serviços finalizados sem foto.\n✍️ ${alertasJuridicos.semAssinatura} serviços sem assinatura.\n\nPor favor, atenção aos procedimentos no pátio para evitarmos problemas jurídicos!`);
        window.open(`https://wa.me/?text=${texto}`, '_blank');
    };

    const cobrarInadimplentes = () => {
        if (abrirRecuperacaoFinanceira) {
            abrirRecuperacaoFinanceira();
        } else {
            alert(`💰 Iniciando processo de recuperação de R$ ${alertasContabeis.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}...\n\n(Aba de cobrança em desenvolvimento)`);
        }
    };

    const recontatarOrcamentos = () => {
        if (abrirRecuperacaoFinanceira) {
            abrirRecuperacaoFinanceira();
        } else {
            alert(`📞 Acionando Secretária Digital para recuperar R$ ${alertasSecretaria.valorPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em orçamentos não aprovados...`);
        }
    };

    return (
        <div id="tour-aba-secretaria" data-tour="secretaria" className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-pink-600 to-rose-500 rounded-[2rem] p-8 mb-10 shadow-[0_0_40px_rgba(219,39,119,0.3)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-black/20 rounded-2xl backdrop-blur-sm">
                            <Bot className="text-white" size={48} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Secretária IA</h1>
                            <p className="text-pink-100 font-bold mt-2 uppercase tracking-widest text-sm flex items-center gap-2">
                                <Sparkles size={16} /> Assistente de Comunicação e Pós-Venda
                            </p>
                        </div>
                    </div>
                </div>

                {/* PAINÉIS ESTRATÉGICOS */}
                {loading ? (
                    <div className="text-center py-10 text-pink-500 font-black animate-pulse">Carregando auditoria...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {/* PROTEÇÃO JURÍDICA */}
                        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-red-500 font-bold mb-4">⚖️ Proteção Jurídica</h3>
                            <p className="text-xs text-zinc-400 mb-4">Fotos: {alertasJuridicos.semFoto} | Assinaturas: {alertasJuridicos.semAssinatura}</p>
                            <button onClick={alertarEquipe} className="w-full py-2 bg-red-900/30 border border-red-500 text-red-500 rounded-xl">Alertar Equipe</button>
                        </div>
                        {/* CAIXA & DEVEDORES */}
                        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-blue-500 font-bold mb-4">🧾 Caixa & Devedores</h3>
                            <p className="text-xs text-zinc-400 mb-4">R$ {alertasContabeis.valorPendente.toLocaleString('pt-BR')}</p>
                            <button onClick={cobrarInadimplentes} className="w-full py-2 bg-blue-900/30 border border-blue-500 text-blue-500 rounded-xl">Cobrar</button>
                        </div>
                        {/* SECRETÁRIA DIGITAL */}
                        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 shadow-xl">
                            <h3 className="text-green-500 font-bold mb-4">📞 Secretária Digital</h3>
                            <p className="text-xs text-zinc-400 mb-4">R$ {alertasSecretaria.valorPerdido.toLocaleString('pt-BR')}</p>
                            <button onClick={recontatarOrcamentos} className="w-full py-2 bg-green-900/30 border border-green-500 text-green-500 rounded-xl">Recontatar</button>
                        </div>
                    </div>
                )}

                {/* ⚙️ CONFIGURAÇÃO DO GOOGLE REVIEWS */}
                <div className="bg-pink-900/20 border border-pink-500/30 rounded-[2rem] p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-pink-400 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                            <Settings size={16} /> Link de Avaliação da Oficina (Google)
                        </h2>
                        {!isEditingLink && <button onClick={() => setIsEditingLink(true)} className="text-[10px] font-bold text-zinc-500 hover:text-white underline uppercase">Alterar Link</button>}
                    </div>
                    {isEditingLink ? (
                        <div className="flex gap-3">
                            <input value={googleLink} onChange={(e) => setGoogleLink(e.target.value)} placeholder="Cole o link do seu perfil do Google aqui..." className={STYLES.input + " flex-1"} />
                            <button onClick={salvarGoogleLink} className="bg-pink-600 px-6 rounded-xl font-black text-xs uppercase text-white hover:bg-pink-500 transition-all flex items-center gap-2"><Save size={16} /> Salvar</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-zinc-800">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="text-xs font-mono text-zinc-400 truncate">{googleLink}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* 🎙️ POLIDOR DE MENSAGENS */}
                    <div className={STYLES.card}>
                        <h2 className="text-pink-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-pink-500 pl-4">
                            <MessageSquare size={16} /> Polidor de Mensagens
                        </h2>
                        <div className="relative mb-6">
                            <textarea
                                value={promptTexto} onChange={(e) => setPromptTexto(e.target.value)}
                                placeholder="Ex: Avisa que o freio ficou pronto e o valor é 450..."
                                className={STYLES.input + " min-h-[120px] pr-14"}
                            />
                            <button onClick={toggleMic} className={`absolute right-4 bottom-4 p-3 rounded-full ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 text-pink-500'}`}>
                                <Mic size={20} />
                            </button>
                        </div>
                        <button onClick={handleGerarMensagem} className="w-full py-4 bg-zinc-800 hover:bg-pink-600 text-pink-500 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-pink-500/20">
                            <Sparkles size={16} /> Polir com IA
                        </button>

                        {mensagemGerada && (
                            <div className="mt-6 p-4 bg-black/40 border border-zinc-800 rounded-2xl animate-in fade-in duration-500">
                                <p className="text-xs text-zinc-300 font-mono mb-4 whitespace-pre-wrap">{mensagemGerada}</p>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(mensagemGerada); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase transition-all ${copied ? 'bg-green-600' : 'bg-zinc-700'}`}
                                >
                                    {copied ? 'Copiado!' : 'Copiar Texto'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ⭐ PESQUISA DE SATISFAÇÃO (NPS) */}
                    <div className={STYLES.card}>
                        <h2 className="text-yellow-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-yellow-500 pl-4">
                            <Heart size={16} /> Pesquisa de Satisfação
                        </h2>
                        <p className="text-[11px] text-zinc-500 mb-6">Gere uma mensagem automática pedindo 5 estrelas no Google para o cliente após a entrega.</p>
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Nome do Cliente</label>
                                <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Ex: Sr. Carlos" className={STYLES.input} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Veículo</label>
                                <input value={veiculoCliente} onChange={(e) => setVeiculoCliente(e.target.value)} placeholder="Ex: Toyota Corolla" className={STYLES.input} />
                            </div>
                        </div>
                        <button onClick={enviarNPS} className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <Send size={18} /> Pedir Avaliação no Zap
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
