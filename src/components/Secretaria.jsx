/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import {
    Bot, Sparkles, MessageSquare, PhoneCall, Calculator,
    CalendarClock, Send, Copy, CheckCircle, CheckCircle2, Clock, Star,
    Mic, Save, Settings, Heart, QrCode, Smartphone, Wifi, WifiOff, Printer, ExternalLink, AlertCircle, Flame, Loader2, Zap
} from "lucide-react";
import HeroAba from "./admin/HeroAba";
import { useSecretariaIA } from "../hooks/useSecretariaIA";
import ControleInteligenciaIA from "./ControleInteligenciaIA";
import { hostPublico, urlPublica } from '../lib/appUrl';
import SimuladorPolen from './imobi/SimuladorPolen';
import { temSofiaWhatsApp } from '../lib/planos';

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border border-zinc-800 focus:border-pink-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm shadow-inner'
};

export default function Secretaria({ oficinaId, abrirRecuperacaoFinanceira, dadosOficina, isPro, setAbaAtiva }) {
    // Central de Inteligência Artificial (DeepSeek/Zhipu)
    const { processarMensagemSecretaria, processandoIA } = useSecretariaIA();

    // Controle de Sub-Aba
    const [subAbaAtiva, setSubAbaAtiva] = useState("conexao"); // Opções: conexao, assistente

    // Detecção de Plano Premium e Lógica de Trial (Requisito Novo)
    const isPremium = dadosOficina?.planoAssinante === true || dadosOficina?.plano === 'premium' || dadosOficina?.papel === 'master';

    // Módulo Pólen contratado → simulador sem contador de demonstração.
    // Mesma autoridade do painel (AdminNovo): plano/módulo, não `isPremium`.
    const polenLiberada = dadosOficina?.papel === 'master' || temSofiaWhatsApp(dadosOficina || {});

    // Lógica do Trial de 3 dias (72 horas)
    const dataInicioTrial = dadosOficina?.secretariaTrialInicio?.toDate ? dadosOficina.secretariaTrialInicio.toDate() 
                           : (dadosOficina?.secretariaTrialInicio ? new Date(dadosOficina.secretariaTrialInicio) : null);
    
    let trialExpirado = false;
    let tempoRestanteFormatado = "";
    let progressoTrial = 0;

    if (dataInicioTrial) {
        const agora = new Date();
        const msPassados = agora.getTime() - dataInicioTrial.getTime();
        const horasPassadas = msPassados / (1000 * 60 * 60);
        const horasTotal = 72; // 3 DIAS GRÁTIS
        
        trialExpirado = horasPassadas >= horasTotal;
        const horasRestantesTotal = Math.max(0, horasTotal - horasPassadas);
        
        const diasRestantes = Math.floor(horasRestantesTotal / 24);
        const horasRestantes = Math.floor(horasRestantesTotal % 24);
        
        tempoRestanteFormatado = diasRestantes > 0 
            ? `${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} e ${horasRestantes} hora${horasRestantes !== 1 ? 's' : ''}`
            : `${horasRestantes} hora${horasRestantes !== 1 ? 's' : ''}`;
            
        progressoTrial = Math.max(0, Math.min(100, (horasRestantesTotal / horasTotal) * 100));
    }

    // O acesso é bloqueado SE não for premium E o trial já tiver expirado
    const acessoBloqueado = !isPremium && trialExpirado && !!dataInicioTrial;

    // Simulação de Estado de Conexão (OpenCode placeholder)
    const [isConnected, setIsConnected] = useState(false);
    const [testando, setTestando] = useState(false);

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

    // Catálogo real da Pólen: o simulador do telemóvel trabalha com os imóveis
    // do tenant; o motor (`simuladorSofia`) descarta vendido/alugado/inativo
    // antes de oferecer qualquer coisa ao "cliente".
    const [catalogoImoveis, setCatalogoImoveis] = useState([]);

    useEffect(() => {
        if (!oficinaId) return;
        let ativo = true;
        getDocs(collection(db, 'oficinas', oficinaId, 'imoveis_imobi'))
            .then((snap) => {
                if (!ativo) return;
                setCatalogoImoveis(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            })
            .catch((erro) => console.warn('Aviso catálogo da Pólen:', erro?.message));
        return () => { ativo = false; };
    }, [oficinaId]);

    // Escuta tempo real do status de conexão do WhatsApp (Integração OpenCode)
    useEffect(() => {
        if (!oficinaId) return;
        
        // Cria o listener para monitorar o campo 'whatsappStatus' em tempo real
        const unsub = onSnapshot(doc(db, 'oficinas', oficinaId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                // Considera conectado se o status for explicitamente 'conectado' ou se existir a flag secretariaConectada
                const conectado = data.whatsappStatus === 'conectado' || !!data.secretariaConectada;
                setIsConnected(conectado);
            }
        });

        return () => unsub();
    }, [oficinaId]);

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

    const handleGerarMensagem = async () => {
        if (!promptTexto.trim()) return;
        try {
            const instrucao = `Reescreva a seguinte solicitação de forma educada, profissional e persuasiva, atuando como a Secretária da Imobiliária ${dadosOficina?.nome || 'Express'}: "${promptTexto}"`;
            const polido = await processarMensagemSecretaria(instrucao);
            setMensagemGerada(polido);
        } catch (error) {
            alert('Erro ao conectar com a Inteligência Artificial. Verifique as chaves de API.');
        }
    };

    const enviarNPS = () => {
        if (!nomeCliente || !veiculoCliente) return alert("Preencha o nome e o imóvel para gerar a pesquisa.");
        const msg = `Olá, ${nomeCliente}! 🌟\n\nO que achou do atendimento no imóvel ${veiculoCliente}? Sua opinião é muito importante para nós!\n\nPoderia nos avaliar com 5 estrelas no Google? Leva menos de 30 segundos e ajuda muito a nossa imobiliária:\n👉 ${googleLink || 'Link do Google'}\n\nMuito obrigado! 👊`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const alertarEquipe = () => {
        const texto = encodeURIComponent(`🚨 *ALERTA ESTRATÉGICO DA DIREÇÃO* 🚨\n\nPessoal, o nosso sistema detectou:\n📸 ${alertasJuridicos.semFoto} atendimentos finalizados sem foto.\n✍️ ${alertasJuridicos.semAssinatura} atendimentos sem assinatura.\n\nPor favor, atenção aos procedimentos de vistoria para evitarmos problemas jurídicos!`);
        window.open(`https://wa.me/?text=${texto}`, '_blank');
    };

    const cobrarInadimplentes = () => {
        if (abrirRecuperacaoFinanceira) {
            abrirRecuperacaoFinanceira();
        } else {
            alert(`💰 Iniciando processo de recuperação de R$ ${alertasContabeis.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}...\n\n(Aba de cobrança em desenvolvimento)`);
        }
    };

    const testarEnvio = async () => {
        if (!oficinaId) return;
        setTestando(true);
        try {
            await updateDoc(doc(db, 'oficinas', oficinaId), { 
                triggerTestMessage: Date.now() // Sinalizador lido pelo OpenCode para disparar mensagem
            });
            alert("🚀 Sinal enviado ao servidor! Verifique seu celular em alguns segundos, o OpenCode irá disparar o teste.");
        } catch (error) {
            alert("Erro ao registrar sinal de teste.");
        } finally {
            setTestando(false);
        }
    };

    const imprimirCartazBalcao = () => {
        const nome = dadosOficina?.nome || 'Minha Imobiliária';
        const link = `${hostPublico()}/${dadosOficina?.slug || oficinaId?.slice(0, 8)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://${link}`)}`;

        const w = window.open('', '_blank', 'width=800,height=900');
        w.document.write(`
            <html>
            <head>
                <title>Cartaz da Vitrine - ${nome}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    body { font-family: 'Inter', sans-serif; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; background-color: #f9fafb; color: #111827; padding: 20px; }
                    .card { background: white; border: 12px solid #7c3aed; border-radius: 48px; padding: 60px 40px; max-width: 600px; box-shadow: 0 20px 50px rgba(124, 58, 237, 0.15); position: relative; }
                    .badge { background: #7c3aed; color: white; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 900; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 30px; }
                    h1 { font-size: 48px; font-weight: 900; margin: 0 0 15px 0; text-transform: uppercase; line-height: 1.1; }
                    p { font-size: 22px; color: #4b5563; line-height: 1.5; margin-bottom: 40px; font-weight: 500; max-width: 500px; margin-left: auto; margin-right: auto; }
                    .qr-container { background: #f3f4f6; padding: 30px; border-radius: 32px; display: inline-block; border: 4px dashed #d1d5db; margin-bottom: 30px; }
                    img { width: 300px; height: 300px; }
                    .url { font-size: 26px; font-weight: 900; color: #7c3aed; margin-top: 10px; }
                    .footer { margin-top: 40px; font-size: 14px; color: #9ca3af; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                    @media print { body { background: white; } .card { box-shadow: none; border-color: #000; } .badge { background: #000; } .url { color: #000; } }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">Portal Interativo</div>
                    <h1>${nome}</h1>
                    <p>Acompanhe seu atendimento em tempo real! Escaneie e veja fotos e o andamento do seu imóvel diretamente no seu celular.</p>
                    <div class="qr-container">
                        <img src="${qrUrl}" alt="QR Code" />
                    </div>
                    <div class="url">${link}</div>
                    <div class="footer">Gerado pelo Express Imobi Tech</div>
                </div>
                <script>
                    window.onload = () => {
                        setTimeout(() => { window.print(); }, 1000);
                    };
                </script>
            </body>
            </html>
        `);
        w.document.close();
    };

    const recontatarOrcamentos = () => {
        if (abrirRecuperacaoFinanceira) {
            abrirRecuperacaoFinanceira();
        } else {
            alert(`📞 Acionando Secretária Digital para recuperar R$ ${alertasSecretaria.valorPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em propostas não aprovadas...`);
        }
    };

    return (
        <div id="tour-aba-secretaria" data-tour="secretaria" style={{ backgroundColor: '#020408' }} className="min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-6xl mx-auto">
                {/* HEADER — base única (HeroAba) */}
                <HeroAba
                    icone={QrCode}
                    titulo="Ativação & QR Code da"
                    destaque="Pólen · Atendimento 24h"
                    chip="Central Prática de Conexão do Atendimento 24h"
                    cor="#10b981"
                    acoes={
                        <div className="bg-[#020408] p-1 rounded-xl flex border border-slate-800">
                            <button
                                onClick={() => setSubAbaAtiva("conexao")}
                                style={subAbaAtiva === "conexao" ? { backgroundColor: '#10b981' } : undefined}
                                className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${subAbaAtiva === "conexao" ? "text-white shadow-lg" : "text-slate-300 hover:text-white"}`}
                            >
                                <QrCode size={14} /> QR Code & Ativação
                            </button>
                            <button
                                onClick={() => setSubAbaAtiva("assistente")}
                                style={subAbaAtiva === "assistente" ? { backgroundColor: '#10b981' } : undefined}
                                className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${subAbaAtiva === "assistente" ? "text-white shadow-lg" : "text-slate-300 hover:text-white"}`}
                            >
                                <Bot size={14} /> Painel & Ferramentas
                            </button>
                        </div>
                    }
                />

                {/* CONTROLE DE INTELIGÊNCIA DO ATENDIMENTO & CRÉDITOS IA */}
                <div className="mb-8">
                    <ControleInteligenciaIA
                        isPro={isPro}
                        setAbaAtiva={setAbaAtiva}
                    />
                </div>

                {/* RENDERIZAÇÃO CONDICIONAL BASEADA NA SUB-ABA */}
                {subAbaAtiva === "conexao" ? (
                    
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Floating Trial Badge (Oferta de Lançamento) */}
                        {!isPremium && !trialExpirado && (
                            <div className="mb-6 bg-gradient-to-r from-purple-600/30 via-purple-500/40 to-pink-600/30 border border-purple-500/50 p-3 md:p-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-pulse">
                                <span className="text-xl">🎁</span>
                                <p className="text-xs md:text-sm font-black text-white tracking-wide uppercase">
                                    OFERTA DE LANÇAMENTO: Teste a Secretária IA por <span className="text-yellow-300 underline decoration-2">3 DIAS SEM CUSTOS!</span>
                                </p>
                            </div>
                        )}

                        {/* Status Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-white bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent tracking-tight">
                                    Ative sua Secretária IA em 30 segundos
                                </h2>
                                <p className="text-zinc-400 mt-1">Conecte seu WhatsApp e libere o Portal do Cliente automaticamente.</p>
                            </div>

                            {/* LED de Status */}
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${isConnected ? 'border-green-500/30 bg-green-500/10' : 'border-emerald-500/30 bg-emerald-500/10'} transition-colors duration-500`}>
                                <span className="relative flex h-3 w-3">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-emerald-400'} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-emerald-500'}`}></span>
                                </span>
                                <span className={`text-[11px] font-black uppercase tracking-widest ${isConnected ? 'text-green-400' : 'text-emerald-400'}`}>
                                    {isConnected ? 'Secretária Atendendo Clientes' : 'IA Desconectada'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 relative">
                            
                            {/* OVERLAY BLOQUEIO UPSELL - VISÍVEL APENAS SE O ACESSO ESTIVER BLOQUEADO (Trial expirado e não pagante) */}
                            {acessoBloqueado && (
                                <div className="absolute inset-[-10px] bg-black/80 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-zinc-800 shadow-2xl">
                                    <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 p-10 rounded-[3rem] border border-zinc-700 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-md relative overflow-hidden group">
                                        {/* Brilho rotativo sutil de fundo */}
                                        <div className="absolute inset-0 bg-emerald-600/10 blur-[60px] transition-all duration-1000"></div>
                                        
                                        <div className="relative w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16, 185, 129,0.3)]">
                                            <Clock size={36} className="text-emerald-400" />
                                        </div>
                                        
                                        <h3 className="relative font-black text-white text-xl uppercase tracking-tight mb-3">Período de Teste Expirado</h3>
                                        <p className="relative text-zinc-300 text-base mb-8 leading-relaxed font-medium">
                                            Seu teste de 3 dias acabou. Este recurso faz parte dos <span className="text-emerald-400 font-black">MÓDULOS ASSINANTES</span>. Ative agora para manter seu atendimento automático 24h.
                                        </p>
                                        
                                        <button 
                                            onClick={() => window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'meuplano' }))}
                                            className="relative w-full bg-gradient-to-r from-emerald-600 to-pink-600 hover:from-emerald-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_25px_rgba(16, 185, 129,0.4)] hover:scale-[1.05] active:scale-[0.98] flex items-center justify-center gap-2 text-sm tracking-wider uppercase border-2 border-white/10 animate-bounce"
                                        >
                                            <Zap size={18} className="fill-current" />
                                            ASSINAR PLANO PRO
                                        </button>
                                    </div>
                                </div>
                            )}
                            


                            {/* COLUNA ESQUERDA: PASSOS E PORTAL */}
                            <div className="lg:col-span-7 space-y-6">
                                
                                {/* Card do Passo a Passo */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-sm">
                                    <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 border-l-4 border-purple-500 pl-4">
                                        Fluxo de Ativação
                                    </h3>

                                    <div className="space-y-6 relative">
                                        {/* Linha conectora dos passos */}
                                        <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-zinc-800 -z-10"></div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-black flex items-center justify-center shrink-0 border-4 border-zinc-900">1</div>
                                            <div>
                                                <h4 className="text-zinc-200 font-bold text-lg leading-tight">Escaneie o QR Code</h4>
                                                <p className="text-zinc-400 text-sm mt-1">Aponte a câmera do seu WhatsApp para o código ao lado. Pronto! Nossa IA assume o pré-atendimento.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 font-black flex items-center justify-center shrink-0 border-4 border-zinc-900">2</div>
                                            <div>
                                                <h4 className="text-zinc-400 font-bold text-lg leading-tight">Teste o envio</h4>
                                                <p className="text-zinc-500 text-sm mt-1">Nossa central envia uma mensagem de confirmação automática.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 font-black flex items-center justify-center shrink-0 border-4 border-zinc-900">3</div>
                                            <div>
                                                <h4 className="text-zinc-400 font-bold text-lg leading-tight">Imprima o QR Code do Portal</h4>
                                                <p className="text-zinc-500 text-sm mt-1">Cole o código no seu balcão para seus clientes baixarem o app.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card do Portal do Cliente */}
                                <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/80 to-purple-900/10 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full"></div>
                                    
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                                        <div className="bg-purple-500/20 p-4 rounded-2xl text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                            <Smartphone size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">Link do Seu Aplicativo</span>
                                            <h4 className="text-white font-bold text-xl mb-2">Seu link exclusivo do portal</h4>
                                            <div className="flex gap-2 items-center bg-black/50 border border-zinc-800 p-3 rounded-xl mb-4">
                                                <span className="text-zinc-300 font-mono text-sm truncate flex-1">{hostPublico()}/{dadosOficina?.slug || oficinaId?.slice(0, 8) || 'sua-imobiliaria'}</span>
                                                <button 
                                                    onClick={() => { navigator.clipboard.writeText(urlPublica(dadosOficina?.slug || oficinaId?.slice(0, 8))); alert("Link copiado!"); }}
                                                    aria-label="Copiar o link do portal do cliente"
                                                    className="text-zinc-500 hover:text-white transition-colors"
                                                ><Copy size={16} aria-hidden="true" /></button>
                                            </div>
                                            
                                            <button 
                                                onClick={imprimirCartazBalcao}
                                                className="w-full md:w-auto bg-white hover:bg-purple-50 text-black font-black px-6 py-3 rounded-xl text-sm tracking-tight flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <Printer size={18} />
                                                GERAR QR CODE PARA IMPRESSÃO
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* NOVO: Card de Potencial / Upgrade (Visível apenas se não for Premium) */}
                                {!isPremium && (
                                    <div className="relative group mt-6 animate-in slide-in-from-bottom-4 duration-700">
                                        {/* Brilho rosa sutil pulsando em volta */}
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
                                        
                                        <div className="relative bg-zinc-950 border border-pink-500/50 rounded-[2rem] p-6 md:p-8 overflow-hidden shadow-[0_20px_40px_rgba(236,72,153,0.1)]">
                                            {/* Decoração Fogo do Mockup */}
                                            <div className="absolute top-4 right-6 text-pink-500 opacity-80">
                                                <Flame size={28} className="animate-bounce" />
                                            </div>

                                            {/* Header do Card */}
                                            <h3 className="text-pink-400 font-black text-lg uppercase tracking-tighter mb-3 flex items-center gap-2">
                                                🎁 Você está usando o Bônus de 3 Dias!
                                            </h3>
                                            
                                            <p className="text-zinc-200 text-sm font-bold mb-5 leading-relaxed">
                                                Sua Secretária IA está ativa no modo padrão. Sabia que você pode torná-la ainda mais potente? No plano Full Tech, ela também:
                                            </p>

                                            {/* Lista de Benefícios */}
                                            <ul className="space-y-3 mb-6">
                                                <li className="flex gap-3 items-start bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
                                                    <span className="text-xl shrink-0">🎙️</span>
                                                    <div>
                                                        <strong className="text-zinc-100 text-xs uppercase block mb-0.5 tracking-wide font-black">Ouve e Resume Áudios</strong>
                                                        <span className="text-zinc-400 text-[11px] leading-relaxed font-medium">Chega de ouvir áudios de 3 minutos dos seus clientes!</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 items-start bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
                                                    <span className="text-xl shrink-0">🧠</span>
                                                    <div>
                                                        <strong className="text-zinc-100 text-xs uppercase block mb-0.5 tracking-wide font-black">IA de Elite (Visão)</strong>
                                                        <span className="text-zinc-400 text-[11px] leading-relaxed font-medium">Analisa fotos do imóvel e sugere padrão construtivo e descrição do anúncio automaticamente.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 items-start bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors">
                                                    <span className="text-xl shrink-0">💰</span>
                                                    <div>
                                                        <strong className="text-zinc-100 text-xs uppercase block mb-0.5 tracking-wide font-black">Recuperação Vendas</strong>
                                                        <span className="text-zinc-400 text-[11px] leading-relaxed font-medium">Recupera clientes inativos conversando automaticamente com eles.</span>
                                                    </div>
                                                </li>
                                            </ul>

                                            {/* Barra de Status do Trial & Botão CTA Inferior */}
                                            <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-zinc-900 pt-5">
                                                <div className="flex-1 w-full">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2">
                                                        <span className="text-zinc-500">Seu Bônus Expira em:</span>
                                                        <span className="text-pink-400">{dataInicioTrial ? tempoRestanteFormatado : '72 HORAS (Após conectar)'}</span>
                                                    </div>
                                                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shadow-inner">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-pink-600 to-purple-500 transition-all duration-1000" 
                                                            style={{ width: `${dataInicioTrial ? progressoTrial : 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'meuplano' }))}
                                                    className="w-full sm:w-auto bg-transparent hover:bg-pink-600/10 border-2 border-pink-500/80 text-pink-400 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.2)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                                                >
                                                    ASSINAR PLANO PRO
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* COLUNA DIREITA: QR CODE E SIMULADOR */}
                            <div className="lg:col-span-5 space-y-8 relative">
                                
                                {/* RENDERIZAÇÃO CONDICIONAL DA ÁREA DE QR CODE BASEADO NO STATUS */}
                                {isConnected ? (
                                    /* TELA DE SUCESSO (Conectado) */
                                    <div className="bg-zinc-950 rounded-3xl border-2 border-green-500/50 p-8 flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_60px_rgba(34,197,94,0.15)] animate-in zoom-in-95 duration-500">
                                        <div className="absolute inset-0 bg-green-500/5 blur-[80px] rounded-full"></div>
                                        
                                        <div className="relative w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.3)] mb-6 scale-110 animate-[bounce_1s_1]">
                                            <CheckCircle2 size={48} className="text-green-400" />
                                        </div>

                                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">✅ Secretária Online</h3>
                                        <p className="text-zinc-400 text-sm mb-8 max-w-xs">Sua imobiliária já está sincronizada e os clientes serão atendidos automaticamente via IA.</p>
                                        
                                        <button 
                                            onClick={testarEnvio}
                                            disabled={testando}
                                            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all 
                                                ${testando ? 'bg-zinc-800 text-zinc-500' : 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:translate-y-0'}`}
                                        >
                                            {testando ? 'SOLICITANDO...' : <><Send size={16} /> TESTAR ENVIO AGORA</>}
                                        </button>
                                        
                                        <span className="text-[10px] text-zinc-500 mt-4">O OpenCode disparará uma mensagem de boas-vindas para o seu telefone conectado.</span>
                                    </div>
                                ) : (
                                    /* ÁREA DO QR CODE PENDENTE */
                                    <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-6 flex flex-col items-center text-center relative group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                        {/* Brilho roxo de fundo no hover/ativo */}
                                        <div className="absolute inset-0 bg-purple-600/5 opacity-100 group-hover:opacity-20 blur-[100px] transition-opacity duration-1000 rounded-full scale-75"></div>
                                        
                                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2"><WifiOff size={14} /> Aguardando Conexão</span>

                                        {/* Molde do QR Code */}
                                        <div
                                            role="img"
                                            aria-label="Pré-visualização do QR Code de conexão do WhatsApp — o código real aparece após a ativação"
                                            className="relative w-full max-w-[240px] aspect-square bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.25)] border-4 border-purple-900/20 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.4)] transition-all duration-500 group-hover:scale-[1.02]"
                                        >
                                            {/* Simulação visual de QR Code via Pattern, futuramente alimentado dinamicamente via IMG da API */}
                                            <div className="w-full h-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Simulate_WhatsApp_Auth_Link')] bg-cover bg-center rounded-xl opacity-90"></div>
                                            
                                            {/* Scan line animation */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-[bounce_3s_infinite] shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                                        </div>
                                        
                                        <span className="mt-6 text-[11px] font-bold text-zinc-500">Escaneie com o aplicativo do WhatsApp</span>
                                    </div>
                                )}

                                {/* SIMULADOR INTERATIVO DA PÓLEN (telemóvel real).
                                    Mesmo motor da aba `agentes_ia`: simuladorSofia.js +
                                    limiteDemo.js (5 mensagens de demonstração) e as 3
                                    perguntas rápidas de ACOES_POLEN. O mockup estático
                                    que ficava aqui foi removido em 22/11. */}
                                <SimuladorPolen
                                    catalogoImoveis={catalogoImoveis}
                                    nomeImobiliaria={dadosOficina?.nome || 'Imobiliária parceira'}
                                    nomeCorretor={dadosOficina?.nomeResponsavel || 'Corretor responsável'}
                                    liberado={polenLiberada}
                                    onAbrirPlanos={() => {
                                        if (typeof setAbaAtiva === 'function') setAbaAtiva('meuplano');
                                        else window.dispatchEvent(new CustomEvent('mudarAba', { detail: 'meuplano' }));
                                    }}
                                    onAbrirCaptacao={() => {
                                        if (typeof setAbaAtiva === 'function') setAbaAtiva('captacao_imobi');
                                    }}
                                />

                                {/* Texto de Conversão Abaixo do Simulador */}
                                <div className="text-center mt-4 px-4">
                                    <p className="text-[11px] md:text-xs text-zinc-400 font-medium leading-relaxed italic bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50">
                                        "Sinta a liberdade de uma imobiliária que nunca para de atender. Após os 3 dias de teste, escolha o plano que melhor se adapta à sua produtividade."
                                    </p>
                                </div>

                            </div>

                        </div>

                        {/* AVISO DE RODAPÉ */}
                        <div className="flex items-center justify-center py-6 border-t border-zinc-900/50 gap-3 text-zinc-500 text-center mt-6">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <p className="text-[11px] md:text-xs font-medium max-w-2xl">
                                Atenção: O agendamento via IA é um pré-atendimento sujeito à confirmação de disponibilidade do imóvel e do corretor responsável.
                            </p>
                        </div>

                    </div>
                    
                ) : (
                    // RENDERIZAÇÃO DA ABA ORIGINAL DE FERRAMENTAS
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* PAINÉIS ESTRATÉGICOS */}
                        {loading ? (
                            <div className="text-center py-10 text-pink-500 font-black animate-pulse">Carregando auditoria...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                {/* PROTEÇÃO JURÍDICA */}
                                <div className="bg-zinc-900 border border-emerald-500 rounded-3xl p-6 shadow-xl">
                                    <h3 className="text-emerald-500 font-bold mb-4">⚖️ Proteção Jurídica</h3>
                                    <p className="text-xs text-zinc-400 mb-4">Fotos: {alertasJuridicos.semFoto} | Assinaturas: {alertasJuridicos.semAssinatura}</p>
                                    <button onClick={alertarEquipe} className="w-full py-2 bg-emerald-900/30 border border-emerald-500 text-emerald-500 rounded-xl">Alertar Equipe</button>
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
                                    <Settings size={16} /> Link de Avaliação da Imobiliária (Google)
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
                                        placeholder="Ex: Avisa que o apartamento está liberado para visita e o valor é R$ 450 mil..."
                                        className={STYLES.input + " min-h-[120px] pr-14"}
                                    />
                                    <button onClick={toggleMic} aria-label={isListening ? 'Parar o ditado por voz' : 'Ditar a mensagem por voz'} aria-pressed={isListening} className={`absolute right-4 bottom-4 p-3 rounded-full ${isListening ? 'bg-emerald-600 animate-pulse' : 'bg-zinc-800 text-pink-500'}`}>
                                        <Mic size={20} aria-hidden="true" />
                                    </button>
                                </div>
                                <button 
                                    onClick={handleGerarMensagem} 
                                    disabled={processandoIA}
                                    className="w-full py-4 bg-zinc-800 hover:bg-pink-600 text-pink-500 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-pink-500/20 disabled:opacity-50"
                                >
                                    {processandoIA ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    {processandoIA ? 'Processando IA...' : 'Polir com IA'}
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
                                <p className="text-[11px] text-zinc-500 mb-6">Gere uma mensagem automática pedindo 5 estrelas no Google para o cliente após a visita.</p>
                                <div className="space-y-4 mb-8">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Nome do Cliente</label>
                                        <input value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Ex: Sr. Carlos" className={STYLES.input} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Imóvel</label>
                                        <input value={veiculoCliente} onChange={(e) => setVeiculoCliente(e.target.value)} placeholder="Ex: Apto 302 - Santa Mônica" className={STYLES.input} />
                                    </div>
                                </div>
                                <button onClick={enviarNPS} className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    <Send size={18} /> Pedir Avaliação no Zap
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}