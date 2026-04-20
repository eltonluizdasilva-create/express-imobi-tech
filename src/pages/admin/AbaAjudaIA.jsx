import React, { useState, useRef, useEffect } from 'react';
import { useGroq } from '../../hooks/useGroq';

export default function AbaAjudaIA({ theme, onBack }) {
    const { analyzeText, loading } = useGroq();
    const [mensagem, setMensagem] = useState('');
    
    // O chat começa sempre com uma mensagem de boas-vindas da IA
    const [chat, setChat] = useState([
        { 
            role: 'assistant', 
            content: 'Olá! Sou a Especialista Virtual da Oficina IA. Posso tirar dúvidas sobre mecânica, dicas de manutenção ou te ajudar a usar o sistema. O que você precisa hoje?' 
        }
    ]);
    
    const fimDoChatRef = useRef(null);

    // Auto-scroll: Desce a tela sozinho quando chega mensagem nova
    useEffect(() => {
        fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    const enviarMensagem = async () => {
        if (!mensagem.trim() || loading) return;

        // 1. Adiciona a pergunta do usuário na tela imediatamente
        const novaMsgUsuario = { role: 'user', content: mensagem };
        const novoChat = [...chat, novaMsgUsuario];
        setChat(novoChat);
        setMensagem(''); // Limpa o input

        // 2. Monta o histórico para a IA ter "memória"
        // Pegamos as últimas 6 mensagens para não estourar o limite de tokens
        const ultimasMensagens = novoChat.slice(-6);
        const historicoTexto = ultimasMensagens.map(m => 
            `${m.role === 'user' ? 'Cliente' : 'Especialista'}: ${m.content}`
        ).join('\n');

        // 3. O PROMPT MESTRE (A Alma da IA)
        const promptMestre = `Você é uma especialista automotiva sênior e assistente virtual do sistema 'Oficina IA'. 
Seja educada, direta, empática e muito profissional. Não use formatação markdown complexa, responda em texto limpo ou com emojis.
Baseie-se no histórico abaixo para continuar a conversa de forma natural.

Histórico:
${historicoTexto}

Especialista:`;

        // 4. Chama a sua API (Groq)
        try {
            const resposta = await analyzeText(promptMestre);
            // Limpa possíveis aspas ou coisas estranhas que a IA possa retornar
            const respostaLimpa = resposta.replace(/^"|"$/g, '').trim();
            
            setChat(prev => [...prev, { role: 'assistant', content: respostaLimpa }]);
        } catch (error) {
            console.error("Erro no chat:", error);
            setChat(prev => [...prev, { role: 'assistant', content: 'Desculpe, minha conexão falhou por um momento. Pode repetir?' }]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') enviarMensagem();
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-center pb-20 px-4 mt-10 animate-fade-in flex flex-col h-[85vh]">
            {/* Header / Botão Voltar */}
            <div className="flex-shrink-0">
                <button onClick={onBack} className="mb-6 text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-600/50 px-8 py-3 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                    ← VOLTAR AO MENU PRINCIPAL
                </button>
                <h2 className="text-3xl font-black text-white uppercase mb-4 tracking-widest">
                    Especialista <span className={theme?.main || 'text-red-600'}>IA</span>
                </h2>
                <p className="text-neutral-500 text-[10px] uppercase tracking-widest mb-6 border-b border-neutral-900 pb-4">
                    Tire suas dúvidas em tempo real
                </p>
            </div>

            {/* Área das Mensagens (Scroll) */}
            <div className="flex-1 overflow-y-auto bg-[#050505] border border-neutral-800 rounded-3xl p-4 mb-4 flex flex-col gap-4 shadow-inner custom-scrollbar">
                {chat.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[85%] p-4 rounded-2xl text-left text-sm leading-relaxed shadow-lg ${
                                msg.role === 'user' 
                                ? 'bg-neutral-800 text-white rounded-br-sm' // Balão do Usuário (Cinza Escuro)
                                : 'bg-[#1a0000] border border-red-900/50 text-red-50 rounded-bl-sm' // Balão da IA (Fundo Avermelhado)
                            }`}
                        >
                            <span className="block text-[8px] font-black uppercase opacity-50 mb-1 tracking-widest">
                                {msg.role === 'user' ? 'Você' : 'Especialista IA'}
                            </span>
                            {msg.content}
                        </div>
                    </div>
                ))}
                
                {/* Indicador de "Digitando..." */}
                {loading && (
                    <div className="flex w-full justify-start animate-fade-in">
                        <div className="bg-[#1a0000] border border-red-900/50 text-red-500 p-4 rounded-2xl rounded-bl-sm text-xs font-bold flex gap-2 items-center">
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                        </div>
                    </div>
                )}
                
                {/* Referência invisível para forçar o scroll para o final */}
                <div ref={fimDoChatRef} />
            </div>

            {/* Input de Texto / Enviar */}
            <div className="flex-shrink-0 flex gap-2">
                <input 
                    type="text" 
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Faça uma pergunta sobre seu carro..."
                    disabled={loading}
                    className="flex-1 p-5 bg-[#0a0a0a] border border-neutral-800 rounded-2xl text-white outline-none focus:border-red-600 transition-all disabled:opacity-50"
                />
                <button 
                    onClick={enviarMensagem}
                    disabled={loading || !mensagem.trim()}
                    className={`px-6 rounded-2xl font-black text-white transition-all flex items-center justify-center ${
                        loading || !mensagem.trim() 
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-500 hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    }`}
                >
                    ENVIAR
                </button>
            </div>
        </div>
    );
}