import { ArrowLeft, Building2, Sparkles } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useGroq } from './hooks/useGroq';

export default function SuporteAdminIA() {
    const { analyzeText, loading } = useGroq();
    const [mensagem, setMensagem] = useState('');
    const [expandido, setExpandido] = useState(false);

    const [chat, setChat] = useState([
        {
            role: 'assistant',
            content:
                'Olá, Gestor! 🏢 Sou o Especialista IA da Express Imobi Tech. Estou aqui para ajudar você a dominar o Painel Executivo, Gestão de VGV, Captação de Imóveis, Funil CRM de Leads, Roleta de Distribuição e Vistorias com IA. Qual é a sua dúvida hoje?',
        },
    ]);

    const fimDoChatRef = useRef(null);

    useEffect(() => {
        if (expandido) {
            fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chat, expandido]);

    const enviarMensagem = async () => {
        if (!mensagem.trim() || loading) return;

        const novaMsgUsuario = { role: 'user', content: mensagem };
        const novoChat = [...chat, novaMsgUsuario];
        setChat(novoChat);
        setMensagem('');

        const ultimasMensagens = novoChat.slice(-6);
        const historicoTexto = (ultimasMensagens || [])
            .map((m) => `${m.role === 'user' ? 'Gestor Imobiliário' : 'Especialista IA'}: ${m.content}`)
            .join('\n');

        const promptMestre = `Você é o Especialista Técnico e Estratégico da plataforma 'Express Imobi Tech'.
Você está falando com o GESTOR DA IMOBILIÁRIA ou CORRETOR DE IMÓVEIS.
Seu objetivo é orientar sobre o uso do ecossistema imobiliário de forma clara, profissional e focada em resultados:

1. Visão Geral e Painel Executivo:
- Monitoramento em tempo real do VGV em Carteira, Comissão Prevista (6%), Leads no Funil e Visitas Agendadas.

2. Captação de Imóveis, Funil CRM e Roleta de Leads:
- Cadastro rápido de imóveis para venda e locação com disparo de ficha no WhatsApp.
- Funil Kanban (Novo Lead, Qualificado IA, Visita Agendada, Proposta / Fechamento) com distribuição rotativa e justa (Roleta de Leads).

3. Portal do Cliente & Ferramentas de Qualificação:
- Simulador de Financiamento com IA (SAC vs Price, MCMV vs SBPE, limite de idade bancário de 80 anos e 6 meses), Guia de Documentação, Consulta de Status de Vistoria e Calculadora de Rentabilidade (ROI).
- Captura obrigatória de Nome e WhatsApp com entrada automática no CRM.

4. Vistoria Imobiliária & Financeiro VGV:
- Laudo fotográfico por divisão (Sala, Cozinha, Quartos, W.C., Exterior) com geração de minuta por IA.
- Controle de comissões de venda, taxas de administração, repasses e despesas operacionais.

Regras: Seja direto, utilize tópicos objetivos e emojis estratégicos. Nunca mencione oficina mecânica, carros ou peças.

Histórico:
${historicoTexto}

Especialista IA:`;

        try {
            const resposta = await analyzeText(promptMestre);
            const respostaLimpa = String(resposta || '').replace(/^"|"$/g, '').trim();
            setChat((prev) => [...prev, { role: 'assistant', content: respostaLimpa }]);
        } catch (error) {
            console.error('Erro no chat admin:', error);
            setChat((prev) => [
                ...prev,
                { role: 'assistant', content: 'Desculpe, tive uma pequena falha de conexão. Pode repetir sua pergunta?' },
            ]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') enviarMensagem();
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="w-full flex justify-start px-2">
                <button
                    onClick={() => (window.location.href = '/admin')}
                    className="flex items-center gap-2 bg-[#020408] text-slate-300 border border-slate-800 hover:border-[#10b981] hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-[#10b981]" />
                    Voltar ao Painel Executivo
                </button>
            </div>

            <div
                style={{ backgroundColor: '#020408' }}
                className="w-full border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 mb-8"
            >
                <div
                    onClick={() => setExpandido(!expandido)}
                    className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-slate-900/50 transition-colors relative"
                >
                    <div
                        style={{ backgroundColor: '#10b981' }}
                        className="absolute top-0 left-0 w-full h-1 opacity-70"
                    ></div>

                    <div className="flex items-center gap-5 text-center md:text-left">
                        <div
                            style={{ backgroundColor: '#10b981' }}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-[#10b981]/30"
                        >
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-1">
                                ESPECIALISTA <span style={{ color: '#10b981' }}>IMOBI IA</span>
                            </h2>
                            <p className="text-slate-400 text-xs md:text-sm">
                                Consultoria em tempo real sobre VGV, Funil CRM, Captação de Imóveis e Financiamento.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        style={{ backgroundColor: '#10b981' }}
                        className="mt-4 md:mt-0 px-6 py-3 rounded-xl font-black text-slate-950 hover:opacity-90 transition-all text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                    >
                        <Sparkles size={14} />
                        {expandido ? 'FECHAR CHAT ✖' : 'ABRIR ESPECIALISTA IA'}
                    </button>
                </div>

                {expandido && (
                    <div className="border-t border-slate-800 bg-[#020408] p-6 animate-fade-in">
                        <div className="h-[400px] overflow-y-auto pr-2 mb-4 flex flex-col gap-4 custom-scrollbar">
                            {(chat || [])?.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-left text-sm leading-relaxed shadow-lg ${
                                            msg.role === 'user'
                                                ? 'bg-[#10b981]/20 border border-[#10b981]/40 text-white rounded-br-sm'
                                                : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm'
                                        }`}
                                    >
                                        <span
                                            style={{ color: '#10b981' }}
                                            className="block text-[9px] font-black uppercase mb-1 tracking-widest"
                                        >
                                            {msg.role === 'user' ? 'Você (Gestor / Corretor)' : 'Especialista Express Imobi IA'}
                                        </span>
                                        <span className="whitespace-pre-line">{msg.content}</span>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex w-full justify-start">
                                    <div className="bg-slate-900 border border-slate-800 text-[#10b981] p-4 rounded-2xl rounded-bl-sm text-xs font-bold flex gap-2 items-center">
                                        <span className="animate-bounce">●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>
                                            ●
                                        </span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                                            ●
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={fimDoChatRef} />
                        </div>

                        <div className="flex gap-3 items-center bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
                            <input
                                type="text"
                                value={mensagem}
                                onChange={(e) => setMensagem(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ex: Como aumentar a conversão de leads em visitas presenciais?"
                                disabled={loading}
                                className="flex-1 p-3 bg-transparent text-white outline-none disabled:opacity-50 text-sm pl-4 placeholder:text-slate-500"
                            />
                            <button
                                onClick={enviarMensagem}
                                disabled={loading || !mensagem.trim()}
                                style={
                                    !loading && mensagem.trim()
                                        ? { backgroundColor: '#10b981' }
                                        : undefined
                                }
                                className={`px-6 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 tracking-widest text-xs cursor-pointer ${
                                    loading || !mensagem.trim()
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'text-slate-950 hover:opacity-90 shadow-lg shadow-[#10b981]/25'
                                }`}
                            >
                                {loading ? <span className="animate-pulse">⏳...</span> : <>⚡ ENVIAR</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
