import React, { useState, useRef, useEffect } from 'react';
import { useGroq } from './hooks/useGroq';
import { Sparkles, X, Mic } from 'lucide-react';

export default function AbaAjudaIA({ onBack, isFloating, abaAtiva }) {
    const { analyzeText, loading } = useGroq();
    const [mensagem, setMensagem] = useState('');
    const [ouvindo, setOuvindo] = useState(false);
    const recRef = useRef(null);
    const [chat, setChat] = useState([
        {
            role: 'assistant',
            content: 'Olá! Sou seu Especialista Particular. Conheço cada detalhe do sistema Oficina IA. Como posso te ajudar a lucrar mais hoje?'
        }
    ]);

    const fimDoChatRef = useRef(null);

    useEffect(() => {
        fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    // ── CONTEXTO DINÂMICO: A IA sabe exatamente em qual tela o usuário está ──
    const gerarContextoIA = (aba) => {
        const contextos = {
            mecanica:      'Contexto: O usuário está preenchendo um laudo mecânico. Seja direto e ofereça ajuda com especificações de motor, torque, capacidades de fluidos ou diagnósticos de falhas mecânicas.',
            motor:         'Contexto: O usuário está preenchendo um laudo mecânico. Seja direto e ofereça ajuda com especificações de motor, torque, capacidades de fluidos ou diagnósticos de falhas mecânicas.',
            hibrido:       'Contexto: O usuário está na aba de Híbridos/Elétricos. Foco em segurança de alta tensão, inversores e baterias.',
            eletrico:      'Contexto: O usuário está na aba de Híbridos/Elétricos. Foco em segurança de alta tensão, inversores e baterias.',
            eletrica:      'Contexto: O usuário está na aba Elétrica. Foco em diagnóstico de alternador, bateria, chicotes e códigos de falha elétrica.',
            os:            'Contexto: O usuário está fechando uma O.S. Ofereça ajuda com estratégias de precificação, sugestão de textos para cobrar clientes ou dicas de margem de lucro.',
            financeiro:    'Contexto: O usuário está na tela Financeira. Ofereça ajuda com fluxo de caixa, margem de lucro, controle de despesas e dicas de gestão financeira para oficinas.',
            estoque:       'Contexto: O usuário está no Estoque. Ajude com controle de peças, saldo mínimo, custo médio e sugira técnicas de redução de desperdício.',
            clientes:      'Contexto: O usuário está na área de Clientes/Leads. Sugira técnicas de fidelização, abordagem de novos clientes e como usar o histórico de placa a favor da venda.',
            config:        'Contexto: O usuário está nas Configurações. Ajude com personalização do sistema, cadastro de chave PIX, logo e preferências gerais.',
            ajuda:         'Contexto: O usuário está na Biblioteca de Ajuda. Indique tutoriais, explique funcionalidades e motive o uso completo do sistema.',
            copiloto:      'Contexto: O usuário está no Copiloto IA Técnico. Sintaá-se à vontade para mergulhar em diagnósticos DTC, tabelas de torque e esquemas elétricos.',
            precificacao:  'Contexto: O usuário está na Precificação. Ajude a calcular hora técnica, margem de lucro real e a cobrar o preço justo sem perder o cliente.',
            marketing:     'Contexto: O usuário está no Marketing. Sugira postagens para redes sociais, promoções sazonais e estratégias de atracção de novos clientes.',
        };
        return contextos[aba] || 'Contexto: O usuário está na tela inicial da oficina. Ofereça ajuda geral de gestão e atendimento.';
    };

    const enviarMensagem = async () => {
        if (!mensagem.trim() || loading) return;

        const novaMsgUsuario = { role: 'user', content: mensagem };
        const novoChat = [...chat, novaMsgUsuario];
        setChat(novoChat);
        setMensagem('');

        // Injeta o contexto dinâmico (tela atual) como instrução oculta antes da mensagem
        const contextoDaTela = gerarContextoIA(abaAtiva);

        const promptMestre = `Você é o Especialista Supremo do software 'Oficina IA'. 
        Seu objetivo é dar suporte técnico e estratégico para o DONO da oficina.
        Você sabe tudo sobre: Ordens de Serviço, Financeiro, Estoque, Desmanche e Marketing.
        Seja direto, use emojis e foque em produtividade.

        ${contextoDaTela}
        
        Histórico: ${novoChat.slice(-5).map(m => m.content).join('\n')}
        Especialista:`;

        try {
            const resposta = await analyzeText(promptMestre);
            setChat(prev => [...prev, { role: 'assistant', content: resposta.replace(/^"|"$/g, '') }]);
        } catch (e) {
            setChat(prev => [...prev, { role: 'assistant', content: 'Tive um soluço na conexão. Pode repetir?' }]);
        }
    };

    const iniciarVoz = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        rec.interimResults = false;
        recRef.current = rec;
        rec.onstart = () => setOuvindo(true);
        rec.onresult = e => setMensagem(prev => prev + ' ' + e.results[0][0].transcript);
        rec.onerror = () => setOuvindo(false);
        rec.onend = () => setOuvindo(false);
        rec.start();
    };

    return (
        <div className={`w-full flex flex-col animate-fade-in bg-black ${isFloating ? 'h-full' : 'min-h-screen'}`}>
            {/* CABEÇALHO */}
            <div className="p-4 md:p-8 text-center border-b border-neutral-900 relative">
                {onBack && (
                    <button onClick={onBack} className="mb-6 text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-600/50 px-8 py-3 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        ← VOLTAR AO MENU PRINCIPAL
                    </button>
                )}
                <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">
                    SUPORTE <span className="text-red-600">ESPECIALISTA IA</span>
                </h2>
                <p className="text-neutral-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-1">
                    Treinado para dominar seu negócio
                </p>
            </div>

            {/* ÁREA DE MENSAGENS */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-10 space-y-4 ${isFloating ? 'min-h-0' : 'min-h-[350px] md:min-h-[500px]'}`} style={{ background: '#050505' }}>
                {chat.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] md:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-2xl ${msg.role === 'user'
                                ? 'bg-neutral-800 text-white rounded-br-none'
                                : 'bg-[#1a0000] border border-red-900/40 text-red-50 rounded-bl-none'
                            }`}>
                            <p className="text-[7px] font-black uppercase opacity-40 mb-1">
                                {msg.role === 'user' ? 'VOCÊ' : 'OFICINA IA'}
                            </p>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a0000] border border-red-900/40 text-red-500 p-4 rounded-2xl rounded-bl-none text-sm">
                            Digitando...
                        </div>
                    </div>
                )}
                <div ref={fimDoChatRef} />
            </div>

            {/* INPUT E BOTÃO */}
            <div className="p-2 md:p-4 bg-[#0a0a0a] border-t border-neutral-900 sticky bottom-0">
                <div className="flex gap-1 md:gap-2 items-center bg-black border border-neutral-800 p-1.5 md:p-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <button
                        onClick={iniciarVoz}
                        className={`p-2 md:p-2.5 rounded-full transition-all ${ouvindo ? 'bg-red-600 animate-pulse' : 'bg-neutral-800'}`}
                    >
                        <Mic size={16} color={ouvindo ? 'white' : '#888'} />
                    </button>
                    <input
                        type="text"
                        value={mensagem}
                        onChange={(e) => setMensagem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                        placeholder="Pergunte..."
                        className="flex-1 bg-transparent text-white text-sm px-2 md:px-4 py-1.5 md:py-2 outline-none"
                    />
                    <button
                        onClick={enviarMensagem}
                        disabled={loading || !mensagem.trim()}
                        className={`p-2 md:p-3 rounded-full transition-all ${loading || !mensagem.trim()
                                ? 'text-neutral-700'
                                : 'text-white bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:scale-110'
                            }`}
                    >
                        {loading ? '...' : '⚡'}
                    </button>
                </div>
            </div>
        </div>
    );
}