/* eslint-disable */
import React, { useState, useRef, useMemo } from 'react';
import { useGemini } from '../hooks/useGemini';
import { 
  Bot, Sparkles, Zap, Wrench, Cpu, Search, Mic, Copy, 
  CheckCircle2, ExternalLink, FileText, MessageSquare, 
  Share2, Camera, Image as ImageIcon, Type, Smartphone,
  ShieldCheck, AlertTriangle, History, Activity, ArrowRight,
  ClipboardCheck, Car, Save, Settings, Heart, Send
} from 'lucide-react';
import HeroAba from './admin/HeroAba';

const EMERALD_GRADIENT = 'from-emerald-600 to-teal-500';
const EMERALD_LIGHT = '#10b981';

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden',
    input: 'bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm shadow-inner placeholder:text-zinc-700'
};

const CopilotoIA = ({ papelLogado, dadosOficina, setAbaAtiva, listaCarros }) => {
    const recognitionRef = useRef(null);
    const { analyzeText } = useGemini();

    // Form states
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [ano, setAno] = useState('');
    const [motor, setMotor] = useState('');
    const [sintoma, setSintoma] = useState('');
    const [obd, setObd] = useState('');
    const [escutando, setEscutando] = useState('');
    
    // Result states
    const [promptGerado, setPromptGerado] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [mensagemCliente, setMensagemCliente] = useState('');
    const [copiadoCliente, setCopiadoCliente] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const temAcesso = papelLogado === 'master' || papelLogado === 'dono' || dadosOficina?.plano === 'pago' || dadosOficina?.plano === 'trial';

    const diagnosticosMensais = 124; // Mock

    const gerarDiagnosticoNativo = async () => {
        if (!sintoma && !obd) return alert('⚠️ Descreva a objeção do cliente ou o contexto da negociação imobiliária!');

        const imovelContexto = [marca, modelo, motor, ano].filter(Boolean).join(' • ');
        const prompt = `Atue como o Hermes Copiloto Imobiliário Sênior, especialista em fechamento de alto VGV, financiamento imobiliário (MCMV e SBPE), loteamentos, fazendas e locação. Responda em português do Brasil de forma prática, persuasiva e direta.
        IMÓVEL / PERFIL: ${imovelContexto || 'Imóvel Residencial / Comercial'}
        MODALIDADE / CONDIÇÃO: ${obd || 'Venda / Financiamento / Locação'}
        OBJEÇÃO OU MENSAGEM DO CLIENTE: ${sintoma}
        
        Por favor, vá direto ao ponto e entregue:
        1. Estratégia de contorno da objeção (gatilhos mentais de escassez, segurança patrimonial e valorização).
        2. Script pronto para responder no WhatsApp e destravar a visita ou proposta agora.
        3. Dica de ouro de fechamento para o corretor.`;

        try {
            setIsAnalyzing(true);
            setPromptGerado("⏳ Estruturando argumentos de fechamento...");
            
            const respostaIA = await analyzeText(prompt);
            setPromptGerado(respostaIA);
            
            setTimeout(() => document.getElementById('resultado-ia')?.scrollIntoView({ behavior: 'smooth' }), 300);
        } catch (erro) {
            console.error("Erro no Gemini:", erro);
            setPromptGerado("❌ Erro ao gerar estratégia: " + erro.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const ouvirCampo = (setter) => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert('Voz não suportada.');
        if (escutando) { recognitionRef.current?.stop(); setEscutando(''); return; }
        const rec = new Recognition();
        rec.lang = 'pt-BR'; recognitionRef.current = rec;
        rec.onstart = () => setEscutando('sintoma');
        rec.onresult = (e) => setter(e.results[0][0].transcript);
        rec.onend = () => setEscutando('');
        rec.start();
    };

    const copiarTexto = (texto, setter) => {
        navigator.clipboard.writeText(texto);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const abrirWhatsApp = () => {
        const msg = encodeURIComponent(mensagemCliente);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };

    const EXEMPLOS_RAPIDOS = [
        { label: '💬 "Achei o valor alto"', sintoma: 'Cliente visitou o imóvel, gostou, mas disse que o valor está acima do orçamento e pediu desconto de 15%.', obd: 'Financiamento SBPE + FGTS' },
        { label: '💬 "Vou pensar / falar com esposa"', sintoma: 'Cliente recebeu a simulação de financiamento com entrada parcelada, mas disse que vai pensar e sumiu do WhatsApp.', obd: 'Minha Casa, Minha Vida / Médio Padrão' },
        { label: '💬 "Juros altos, prefiro alugar"', sintoma: 'Cliente tem renda aprovada mas está inseguro com a taxa de juros do financiamento imobiliário.', obd: 'Compra vs Locação' },
    ];

    if (!temAcesso) return (
        <div className="mx-auto max-w-4xl p-12 text-center bg-zinc-900/40 border-2 border-dashed border-emerald-500/30 rounded-[3rem]">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Módulo Premium</h3>
            <p className="text-zinc-400 mt-2">O Hermes Copiloto Imobiliário IA é exclusivo para assinantes.</p>
            <button 
                onClick={() => setAbaAtiva('meuplano')}
                className="mt-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-600/20"
            >
                Ver Planos
            </button>
        </div>
    );

    return (
        <div className="bg-[#020408] min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-6xl mx-auto">

                {/* HEADER PREMIUM (ESTILO SECRETÁRIA) */}
                <HeroAba
                    icone={Bot}
                    titulo="Hermes Copiloto de"
                    destaque="Negociação"
                    chip="Assistente de plantão em quebra de objeções"
                    subtitulo="Cole a mensagem difícil do cliente (ex: 'juros altos', 'entrada alta') e receba o argumento de fechamento ideal em segundos."
                    cor="#10b981"
                    acoes={
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status do motor IA</div>
                            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                <span className="text-xs font-black text-emerald-200">ONLINE & PRONTO</span>
                            </div>
                        </div>
                    }
                />

                {/* PAINÉIS DE INSIGHTS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Zap size={14} /> Conversão Comercial
                        </h3>
                        <p className="text-2xl font-black text-white">{diagnosticosMensais}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Scripts gerados este mês</p>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Cpu size={14} /> Motor IA Ativo
                        </h3>
                        <p className="text-2xl font-black text-white">2.0 Flash</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Latência: 1.2s</p>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> Taxa de Destravamento
                        </h3>
                        <p className="text-2xl font-black text-white">98.4%</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Argumentação Imobiliária</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                    
                    {/* FORMULÁRIO COMERCIAL IMOBILIÁRIO */}
                    <div className={STYLES.card}>
                        <h2 className="text-emerald-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-emerald-500 pl-4">
                            <Search size={16} /> Contexto da Negociação Imobiliária
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Tipo de Imóvel</label>
                                <input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: Apartamento / Lote" className={STYLES.input} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Bairro / Região</label>
                                <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: Jardins / Bosque" className={STYLES.input} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Padrão</label>
                                <input value={motor} onChange={(e) => setMotor(e.target.value)} placeholder="Ex: Médio / Alto Padrão" className={STYLES.input} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block px-2">Valor (R$)</label>
                                <input value={ano} onChange={(e) => setAno(e.target.value)} placeholder="Ex: R$ 450 mil" className={STYLES.input} />
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-3 block px-2 flex items-center gap-2">
                                <Activity size={14} className="text-emerald-500" /> Modalidade de Pagamento / Financiamento
                            </label>
                            <input 
                                value={obd} 
                                onChange={e => setObd(e.target.value)} 
                                placeholder="Ex: Financiamento SBPE + FGTS, Minha Casa Minha Vida, Permuta, Locação..."
                                className={STYLES.input + " font-black text-emerald-500 border-emerald-900/30"}
                            />
                        </div>

                        <div className="relative mb-8">
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-3 block px-2 flex items-center gap-2">
                                <MessageSquare size={14} className="text-emerald-500" /> Objeção ou Mensagem Recebida do Cliente
                            </label>
                            <textarea
                                value={sintoma} onChange={(e) => setSintoma(e.target.value)}
                                placeholder="Cole aqui a mensagem do cliente ou descreva a objeção (ex: achou a entrada alta, pediu desconto ou sumiu após a visita)..."
                                className={STYLES.input + " min-h-[160px] pr-16"}
                            />
                            <button onClick={() => ouvirCampo(setSintoma)} className={`absolute right-4 bottom-4 p-4 rounded-2xl ${escutando ? 'bg-emerald-600 animate-pulse' : 'bg-zinc-800 text-emerald-500 shadow-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all'}`}>
                                <Mic size={24} />
                            </button>
                        </div>

                        <button 
                            onClick={gerarDiagnosticoNativo} 
                            disabled={isAnalyzing}
                            className="w-full py-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-widest rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <> <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> ESTRUTURANDO RESPOSTA... </>
                            ) : (
                                <> <Sparkles size={20} /> GERAR RESPOSTA PERSUASIVA IA </>
                            )}
                        </button>
                    </div>

                    {/* SIDEBAR DE APOIO */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 shadow-xl">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                                <Zap size={14} className="text-emerald-500" /> Objeções Comuns
                            </h4>
                            <div className="grid gap-3">
                                {EXEMPLOS_RAPIDOS.map((ex, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { setSintoma(ex.sintoma); setObd(ex.obd || ''); }}
                                        className="text-left p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-emerald-500/50 transition-all group"
                                    >
                                        <p className="text-[11px] font-black text-emerald-500 group-hover:text-emerald-400 mb-1">{ex.label}</p>
                                        <p className="text-[10px] text-zinc-600 line-clamp-1">{ex.sintoma}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-[2.5rem] p-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-4 flex items-center gap-2">
                                <Smartphone size={16} /> Copiloto no Plantão
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                                Utilize o Hermes Copiloto durante o atendimento no WhatsApp para responder dúvidas de financiamento, documentação e fechar visitas em segundos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RESULTADO DO DIAGNÓSTICO */}
                {promptGerado && (
                    <div id="resultado-ia" className="mt-10 rounded-[3rem] border border-emerald-500/30 bg-zinc-950 p-8 md:p-12 shadow-[0_0_60px_rgba(16,185,129,0.15)] animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <ClipboardCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Relatório do Copiloto</h3>
                                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-black mt-1 flex items-center gap-2">
                                        <Bot size={14} /> Diagnóstico Técnico Finalizado
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => copiarTexto(promptGerado, setCopiado)}
                                    className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${copiado ? 'bg-green-600 text-white' : 'bg-zinc-800 text-emerald-500 border border-emerald-500/20'}`}
                                >
                                    {copiado ? 'COPIADO!' : 'COPIAR DIAGNÓSTICO'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 relative min-h-[300px]">
                            <div className="absolute top-8 right-8 opacity-5 pointer-events-none">
                                <Bot size={180} className="text-emerald-500" />
                            </div>
                            <div className="text-sm md:text-base text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed relative z-10 italic">
                                {promptGerado}
                            </div>
                        </div>

                        {/* TRANSFORMADOR EM MENSAGEM */}
                        {!mensagemCliente && (
                            <button 
                                onClick={async () => {
                                    setIsAnalyzing(true);
                                    const p = `Transforme este diagnóstico técnico em uma mensagem de WhatsApp para o cliente de forma amigável e sem termos técnicos: ${promptGerado}`;
                                    const resp = await analyzeText(p);
                                    setMensagemCliente(resp);
                                    setIsAnalyzing(false);
                                    setTimeout(() => document.getElementById('secao-zap')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                }}
                                className="mt-8 w-full py-5 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3"
                            >
                                <MessageSquare size={18} /> Gerar Mensagem para o Cliente
                            </button>
                        )}
                    </div>
                )}

                {/* MENSAGEM PARA WHATSAPP */}
                {mensagemCliente && (
                    <div id="secao-zap" className="mt-10 rounded-[3rem] border border-green-500/30 bg-zinc-950 p-8 md:p-12 shadow-[0_0_60px_rgba(34,197,94,0.15)] animate-in slide-in-from-bottom-10 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-green-500/10 rounded-[1.5rem] flex items-center justify-center text-green-500 border border-green-500/20">
                                    <Send size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mensagem WhatsApp</h3>
                                    <p className="text-[10px] text-green-500 uppercase tracking-widest font-black mt-1">Pronta para envio</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 mb-8">
                            <p className="text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed text-sm italic">
                                {mensagemCliente}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => copiarTexto(mensagemCliente, setCopiadoCliente)}
                                className={`py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${copiadoCliente ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400 border border-zinc-800'}`}
                            >
                                {copiadoCliente ? 'COPIADO!' : 'COPIAR TEXTO'}
                            </button>
                            <button 
                                onClick={abrirWhatsApp}
                                className="py-5 rounded-2xl bg-[#25D366] text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20"
                            >
                                <Share2 size={18} /> ENVIAR PARA O WHATSAPP
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* AVISO DE RESPONSABILIDADE */}
            <div className="max-w-6xl mx-auto mt-10 px-8 flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-500/80">
                <AlertTriangle size={20} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wider">
                    AVISO: O Hermes Copiloto IA é um assistente comercial e de negociação. As condições financeiras e contratuais devem ser validadas pelo corretor responsável (CRECI).
                </p>
            </div>
        </div>
    );
};

export default CopilotoIA;