/* eslint-disable */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGroq } from '../hooks/useGroq';
import ControleInteligenciaIA from './ControleInteligenciaIA';
import {
    Briefcase, Sparkles, TrendingUp, Target, BarChart3,
    Mic, ClipboardCheck, DollarSign, Brain, Search,
    ShieldCheck, AlertTriangle
} from 'lucide-react';
import HeroAba from "./admin/HeroAba";
import ConsultoriaPatrimonial from './imobi/ConsultoriaPatrimonial';
import RadarVitrine from './imobi/RadarVitrine';

const RED_GRADIENT = 'from-emerald-600 to-emerald-500';

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl relative overflow-hidden',
    input: 'bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm shadow-inner placeholder:text-zinc-700'
};

const fmt = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdministradorIA({
    papelLogado,
    dadosOficina,
    setAbaAtiva,
    listaCarros = [],
    listaFinanceiro = [],
    listaUsuarios = [],
    fechamentosDiarios = [],
    oficinaId,
    isPro
}) {
    const [usuariosLocal, setUsuariosLocal] = useState([]);
    const [fechamentosLocal, setFechamentosLocal] = useState([]);

    useEffect(() => {
        if (!oficinaId) return;
        const fetchExtra = async () => {
            try {
                const snapU = await getDocs(collection(db, "oficinas", oficinaId, "equipe"));
                setUsuariosLocal(snapU.docs.map(d => ({ id: d.id, ...d.data() })));

                const snapF = await getDocs(collection(db, "oficinas", oficinaId, "fechamentos_diarios"));
                setFechamentosLocal(snapF.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error(err);
            }
        };
        fetchExtra();
    }, [oficinaId]);

    const recognitionRef = useRef(null);
    const { analyzeText } = useGroq(oficinaId);

    const [duvida, setDuvida] = useState('');
    const [escutando, setEscutando] = useState(false);
    const [promptGerado, setPromptGerado] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const temAcesso = papelLogado === 'master' || papelLogado === 'dono' || dadosOficina?.plano === 'pago' || dadosOficina?.plano === 'trial' || dadosOficina?.plano === 'MASTER' || dadosOficina?.plano === 'premium';

    // Cálculos de contexto para a IA
    const financeiro = useMemo(() => {
        const now = new Date();
        const osMes = listaCarros.filter(os => {
            if (!os.data_registro) return false;
            const d = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const pagas = osMes.filter(os => {
            const s = (os.statusPagamento || os.status || '').toUpperCase();
            return s === 'PAGO' || s === 'PAGA' || s === 'FINALIZADO' || s === 'FINALIZADA';
        });
        const total = pagas.reduce((acc, os) => acc + Number(os.total || 0), 0);
        const ticketMedio = pagas.length ? total / pagas.length : 0;
        return { total, ticketMedio, osMes: osMes.length };
    }, [listaCarros]);

    const gerarConsultoria = async () => {
        if (!duvida) return alert('⚠️ Descreva qual a sua dúvida ou desafio de gestão!');

        const uArray = (Array.isArray(listaUsuarios) && listaUsuarios.length > 0) ? listaUsuarios : (Array.isArray(usuariosLocal) ? usuariosLocal : []);
        const fArray = (Array.isArray(fechamentosDiarios) && fechamentosDiarios.length > 0) ? fechamentosDiarios : (Array.isArray(fechamentosLocal) ? fechamentosLocal : []);

        const ctxUsers = uArray.map(u => `- ${u.nome || u.name} (Cargo: ${u.cargo || 'Funcionário'}, Comissão: ${u.comissao || u.comissaoMaoDeObra || 0}%, Salário Fixo/Meta: R$ ${u.salarioFixo || 0})`).join('\n');
        const ctxFechamentos = fArray.map(f => `- Data: ${f.data || ''}, Esperado: R$ ${f.saldoEsperado || 0}, Informado: R$ ${f.saldoInformado || 0}, Diferença: R$ ${f.diferenca || 0}`).join('\n');

        const ctx = `Faturamento / Comissões no mês: ${fmt(financeiro.total)}. Ticket Médio: ${fmt(financeiro.ticketMedio)}. Negócios no mês: ${financeiro.osMes}.
        Dados de corretores/equipe e suas comissões atuais:
        ${ctxUsers || 'Nenhum corretor cadastrado.'}
        Dados dos últimos fechamentos registrados:
        ${ctxFechamentos || 'Nenhum fechamento registrado ainda.'}`;

        // NOVO PROMPT: Focado totalmente em responder a pergunta do gestor imobiliário
        const prompt = `Você é um Diretor Comercial Imobiliário e estrategista de VGV sênior prestando consultoria para uma imobiliária / corretor de imóveis. 
        O gestor imobiliário lhe fez a seguinte pergunta: "${duvida}".
        
        Sua principal obrigação é RESPONDER A ESSA PERGUNTA de forma direta e estruturada para o mercado imobiliário brasileiro (vendas, locação, loteamentos, fazendas e gestão de corretores).
        Aqui estão alguns dados atuais da imobiliária apenas para te dar contexto (use-os apenas se forem relevantes para a resposta da pergunta acima): ${ctx}
        
        Responda de forma prática, em tópicos (mas não use asteriscos para formatação de texto) e direta ao ponto.`;

        try {
            setIsAnalyzing(true);
            setPromptGerado("⏳ Analisando a pergunta...");

            const respostaIA = await analyzeText(prompt);
            setPromptGerado(respostaIA);

            setTimeout(() => document.getElementById('resultado-ia')?.scrollIntoView({ behavior: 'smooth' }), 300);
        } catch (erro) {
            console.error("Erro na IA:", erro);
            setPromptGerado("❌ Erro ao gerar resposta: " + erro.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const ouvirCampo = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert('Voz não suportada.');
        if (escutando) { recognitionRef.current?.stop(); setEscutando(false); return; }
        const rec = new Recognition();
        rec.lang = 'pt-BR'; recognitionRef.current = rec;
        rec.onstart = () => setEscutando(true);
        rec.onresult = (e) => setDuvida(e.results[0][0].transcript);
        rec.onend = () => setEscutando(false);
        rec.start();
    };

    const copiarTexto = () => {
        navigator.clipboard.writeText(promptGerado);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const EXEMPLOS_RAPIDOS = [
        { label: '📈 Escalar VGV & Vendas', duvida: 'Como posso dobrar a taxa de conversão entre visitas agendadas e propostas fechadas na imobiliária?' },
        { label: '🏠 Giro de Carteira', duvida: 'Temos imóveis captados há mais de 90 dias sem propostas. Qual estratégia usar com os proprietários e no tráfego?' },
        { label: '🧑‍💼 Comissão & Plantão', duvida: 'Qual a melhor estrutura de divisão de comissão entre captador, corretor de atendimento e imobiliária (6% VGV)?' },
    ];

    if (!temAcesso) return (
        <div className="mx-auto max-w-4xl p-12 text-center bg-zinc-900/40 border-2 border-dashed border-emerald-500/30 rounded-[3rem]">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Módulo Premium</h3>
            <p className="text-zinc-400 mt-2">O Diretor Comercial IA é exclusivo para assinantes.</p>
            <button
                onClick={() => setAbaAtiva('meuplano')}
                className="mt-8 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-600/20"
            >
                Ver Planos
            </button>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#020408' }} className="min-h-screen text-zinc-100 p-4 md:p-8 pb-40 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto">

                {/* HEADER PREMIUM */}
                <HeroAba
                    icone={Briefcase}
                    titulo="Diretor Comercial"
                    destaque="Preditivo"
                    chip="Análise preditiva do funil em tempo real"
                    subtitulo="Auditoria do atendimento da equipe e alertas automáticos sobre oportunidades quentes paradas no CRM."
                    cor="#6366f1"
                    acoes={
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Motor Gemini 2.0</div>
                            <div className="flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                                <span className="text-xs font-black text-indigo-200">ONLINE & PRONTO</span>
                            </div>
                        </div>
                    }
                />

                {/* CONTROLE DE INTELIGÊNCIA IA & CRÉDITOS (TIERED AI) */}
                <div className="mb-8">
                    <ControleInteligenciaIA
                        isPro={isPro}
                        setAbaAtiva={setAbaAtiva}
                    />
                </div>

                {/* CONSULTORIA PATRIMONIAL & HOLDING */}
                <div className="mb-8">
                    <ConsultoriaPatrimonial dadosOficina={dadosOficina} />
                </div>

                {/* RADAR DE VITRINE & PORTAL PÚBLICO */}
                <div className="mb-8">
                    <RadarVitrine dadosOficina={dadosOficina} setAbaAtiva={setAbaAtiva} />
                </div>

                {/* PAINÉIS DE INSIGHTS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                            <DollarSign size={14} /> Comissões / Receita Mês
                        </h3>
                        <p className="text-2xl font-black text-white">{fmt(financeiro.total)}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Receita consolidada</p>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Target size={14} /> Ticket Médio
                        </h3>
                        <p className="text-2xl font-black text-white">{fmt(financeiro.ticketMedio)}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Por Negócio Fechado</p>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                            <BarChart3 size={14} /> Negócios em Andamento
                        </h3>
                        <p className="text-2xl font-black text-white">{financeiro.osMes}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Atendimentos registrados no mês</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

                    {/* FORMULÁRIO DE ESTRATÉGIA */}
                    <div className={STYLES.card}>
                        <h2 className="text-emerald-500 font-black mb-8 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-emerald-500 pl-4">
                            <Search size={16} /> Consultoria Direta de VGV & Gestão
                        </h2>

                        <div className="relative mb-8">
                            <label className="text-[10px] text-zinc-500 font-black uppercase mb-3 block px-2 flex items-center gap-2">
                                <Brain size={14} className="text-emerald-500" /> Descreva seu desafio comercial, de captação ou gestão de equipe
                            </label>
                            <textarea
                                value={duvida} onChange={(e) => setDuvida(e.target.value)}
                                placeholder="Ex: Como estruturar uma campanha de reativação de leads antigos para lotes e imóveis de médio padrão?"
                                className={STYLES.input + " min-h-[200px] pr-16"}
                            />
                            <button onClick={ouvirCampo} className={`absolute right-4 bottom-4 p-4 rounded-2xl ${escutando ? 'bg-emerald-600 animate-pulse' : 'bg-zinc-800 text-emerald-500 shadow-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all'}`}>
                                <Mic size={24} />
                            </button>
                        </div>

                        <button
                            onClick={gerarConsultoria}
                            disabled={isAnalyzing}
                            className="w-full py-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm uppercase tracking-widest rounded-[1.5rem] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16, 185, 129,0.3)] disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <> <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> PROCESSANDO... </>
                            ) : (
                                <> <Sparkles size={20} /> GERAR ESTRATÉGIA IA </>
                            )}
                        </button>
                    </div>

                    {/* SIDEBAR DE APOIO */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 shadow-xl">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                                <TrendingUp size={14} className="text-emerald-500" /> Exemplos Rápidos
                            </h4>
                            <div className="grid gap-3">
                                {EXEMPLOS_RAPIDOS.map((ex, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setDuvida(ex.duvida)}
                                        className="text-left p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-emerald-500/50 transition-all group"
                                    >
                                        <p className="text-[11px] font-black text-emerald-500 group-hover:text-emerald-400 mb-1">{ex.label}</p>
                                        <p className="text-[10px] text-zinc-600 line-clamp-2">{ex.duvida}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESULTADO DA CONSULTORIA */}
                {promptGerado && (
                    <div id="resultado-ia" className="mt-10 rounded-[3rem] border border-emerald-500/30 bg-zinc-950 p-8 md:p-12 shadow-[0_0_60px_rgba(16, 185, 129,0.15)] animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <ClipboardCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Plano de Ação</h3>
                                    <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-black mt-1 flex items-center gap-2">
                                        <Briefcase size={14} /> Consultoria Finalizada
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={copiarTexto}
                                    className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${copiado ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-emerald-500 border border-emerald-500/20'}`}
                                >
                                    {copiado ? 'COPIADO!' : 'COPIAR PLANO'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-8 relative min-h-[300px]">
                            <div className="absolute top-8 right-8 opacity-5 pointer-events-none">
                                <Briefcase size={180} className="text-emerald-500" />
                            </div>
                            <div className="text-sm md:text-base text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed relative z-10 italic">
                                {promptGerado}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}