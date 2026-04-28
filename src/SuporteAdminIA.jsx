import { ArrowLeft } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { useGroq } from './hooks/useGroq'; // Ajuste o caminho se estiver em outra pasta

export default function SuporteAdminIA() {
    const { analyzeText, loading } = useGroq();
    const [mensagem, setMensagem] = useState('');

    // Inicia fechado para ficar igual a um banner, e expande quando o usuário clica
    const [expandido, setExpandido] = useState(false);

    const [chat, setChat] = useState([
        {
            role: 'assistant',
            content: 'Olá, Chefe! 🛠️ Sou o Suporte Especialista do Express Auto Tech. Estou aqui para te ajudar a dominar o sistema. Tem alguma dúvida sobre Ordens de Serviço, Financeiro, Módulo de Desmanche ou Configurações?'
        }
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
        const historicoTexto = ultimasMensagens.map(m =>
            `${m.role === 'user' ? 'Administrador' : 'Suporte'}: ${m.content}`
        ).join('\n');

        // PROMPT MESTRE: TREINADO PARA O DONO DA OFICINA
        const promptMestre = `Você é o Suporte Técnico Sênior do software 'Express Auto Tech' (também chamado de Express Auto Tech).
Você está falando com o DONO DA OFICINA (Administrador do sistema).
Seu objetivo é ensinar a usar o software de forma clara, profissional e encorajadora.

1. Gestão de Fluxo (Módulo OS e Pátio):

Você tem controle total sobre o ciclo de vida das ordens de serviço: da abertura (Nova O.S.) ao faturamento final.

Regra de Ouro: Se uma OS estiver com status PAGO, ela é um registro histórico e não deve ser editada para garantir a integridade do financeiro.

O sistema automatiza o envio de laudos técnicos com fotos diretamente para o WhatsApp do cliente, otimizando a aprovação.

2. Inteligência de Peças e Desmanche (B2B & Mercado Livre):

O módulo de Desmanche permite o controle de veículos em desmonte e o rastreio de peças usadas.

Você pode realizar buscas na Rede Global de parceiros e integrar com o Mercado Livre para encontrar ou vender componentes, com baixa automática no estoque.

Vendas de peças avulsas geram lançamentos automáticos de entrada no módulo Financeiro.

3. Ecossistema do Cliente (Portal & IA de Diagnóstico):

O Portal do Cliente é o diferencial de transparência, acessado via Placa e Telefone.

Lá, o cliente interage com a Doutor IA e o Scanner de Painel para entender problemas do veículo antes mesmo de chegar à oficina.

O histórico completo do carro fica disponível para consulta, aumentando a fidelização.

4. Saúde Financeira e Decisão (Contador & Precificação):

O Financeiro processa entradas e saídas de forma automatizada, alimentando o Contador.

O módulo de Precificação protege a margem de lucro, sugerindo valores baseados em custos fixos e variáveis da operação.

A leitura de Faturamento e Metas permite ao dono visualizar o lucro real por setor (Mecânica, Óleo, Funilaria).

5. Comando de Operação (Cérebro & Equipe):

As configurações centrais no Cérebro definem as regras do negócio.

O módulo de Equipe gerencia as permissões e a comunicação direta via WhatsApp com os funcionários para cada serviço.

Regras: Seja direto, use bullet points se for listar passos e use emojis. Não invente menus que não existem.

Histórico:
${historicoTexto}

Suporte:`;

        try {
            const resposta = await analyzeText(promptMestre);
            const respostaLimpa = resposta.replace(/^"|"$/g, '').trim();
            setChat(prev => [...prev, { role: 'assistant', content: respostaLimpa }]);
        } catch (error) {
            console.error("Erro no chat admin:", error);
            setChat(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive uma pequena falha de conexão. Pode repetir?' }]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') enviarMensagem();
    };

    return (
        <div className="w-full flex flex-col gap-4">

            {/* BOTÃO DE VOLTAR ADICIONADO AQUI NO TOPO */}
            <div className="w-full flex justify-start px-2">
                <button
                    onClick={() => window.location.href = '/admin'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#1a1a1a',
                        color: '#a3a3a3',
                        border: '1px solid #333',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = '#FF0033';
                        e.currentTarget.style.background = '#2a0000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#a3a3a3';
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.background = '#1a1a1a';
                    }}
                >
                    <ArrowLeft size={16} />
                    Voltar ao Sistema
                </button>
            </div>

            <div className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 mb-8">

                {/* CABEÇALHO DO BANNER (Sempre visível) */}
                <div
                    onClick={() => setExpandido(!expandido)}
                    className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition-colors relative"
                >
                    {/* Efeito luminoso de fundo */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#eab308] to-[#f97316] opacity-50"></div>

                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#eab308] to-[#f97316] rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                            🤖
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">
                                SUPORTE <span className="text-[#eab308]">ESPECIALISTA</span>
                            </h2>
                            <p className="text-neutral-400 text-sm">
                                Tire dúvidas sobre como extrair o máximo do sistema.
                            </p>
                        </div>
                    </div>

                    <button className="mt-4 md:mt-0 px-8 py-3 rounded-xl font-black text-white bg-neutral-800 hover:bg-neutral-700 transition-all border border-neutral-700 text-xs uppercase tracking-widest flex items-center gap-2">
                        {expandido ? 'FECHAR CHAT ✖' : 'ABRIR CHAT 💬'}
                    </button>
                </div>

                {/* ÁREA DO CHAT (Expande ao clicar) */}
                {expandido && (
                    <div className="border-t border-neutral-800 bg-[#050505] p-6 animate-fade-in">

                        {/* Área das mensagens */}
                        <div className="h-[400px] overflow-y-auto pr-2 mb-4 flex flex-col gap-4 custom-scrollbar">
                            {chat.map((msg, index) => (
                                <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-left text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                                        ? 'bg-neutral-800 text-white rounded-br-sm'
                                        : 'bg-[#1a1500] border border-yellow-900/50 text-yellow-50 rounded-bl-sm'
                                        }`}>
                                        <span className="block text-[8px] font-black uppercase opacity-50 mb-1 tracking-widest">
                                            {msg.role === 'user' ? 'Você (Admin)' : 'Suporte Express AI'}
                                        </span>
                                        <span className="whitespace-pre-line">{msg.content}</span>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex w-full justify-start">
                                    <div className="bg-[#1a1500] border border-yellow-900/50 text-yellow-500 p-4 rounded-2xl rounded-bl-sm text-xs font-bold flex gap-2 items-center">
                                        <span className="animate-bounce">●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                                    </div>
                                </div>
                            )}
                            <div ref={fimDoChatRef} />
                        </div>

                        {/* Input e Botão Groq */}
                        <div className="flex gap-3 items-center bg-[#0a0a0a] p-2 rounded-2xl border border-neutral-800">
                            <input
                                type="text"
                                value={mensagem}
                                onChange={(e) => setMensagem(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Como eu crio uma nova Ordem de Serviço?"
                                disabled={loading}
                                className="flex-1 p-3 bg-transparent text-white outline-none disabled:opacity-50 text-sm pl-4"
                            />
                            <button
                                onClick={enviarMensagem}
                                disabled={loading || !mensagem.trim()}
                                className={`px-6 py-3 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2 tracking-widest text-xs ${loading || !mensagem.trim()
                                    ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#eab308] to-[#f97316] hover:scale-105 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                                    }`}
                            >
                                {loading ? <span className="animate-pulse">⏳...</span> : <>⚡ GROQ</>}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}