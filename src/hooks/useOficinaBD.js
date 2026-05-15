import { useState, useCallback, useRef } from 'react';
import { useGroq } from './useGroq'; // Seu hook de IA já existente
import CONHECIMENTO_OFICINA_IA, { gerarContextoPorAba, buscarPorTag } from '../data/BaseConhecimentoOficinIA';

/**
 * ═══════════════════════════════════════════════════════════════
 * HOOK: useOficinaBD
 * ═══════════════════════════════════════════════════════════════
 * 
 * RESPONSABILIDADES:
 * 1. Gerenciar histórico de chat (memória de conversação)
 * 2. Selecionar contexto inteligente baseado na aba ativa
 * 3. Executar busca RAG (Retrieval-Augmented Generation)
 * 4. Construir prompt otimizado para Groq
 * 5. Manter estado de loading e erros
 * 
 * USO EM AbaAjudaIA.jsx:
 * const { enviarMensagem, chat, loading, iniciarVoz, ... } = useOficinaBD(abaAtiva);
 */

export const useOficinaBD = (abaAtiva = 'visao_geral') => {
    const { analyzeText, loading } = useGroq();

    // ────────────────────────────────────────────────────────────
    // ESTADO
    // ────────────────────────────────────────────────────────────

    const [chat, setChat] = useState(() => {
        const initialTimestamp = Date.now();
        return [
            {
                role: 'assistant',
                content:
                    'Olá! 🚀 Sou seu Especialista Particular Express Auto Tech. Conheço cada detalhe do sistema — Forecast, Fiscal, O.S., Estoque e tudo mais. Como posso te ajudar a lucrar mais hoje?',
                timestamp: initialTimestamp,
            },
        ];
    });

    const [mensagem, setMensagem] = useState('');
    const [ouvindo, setOuvindo] = useState(false);
    const recRef = useRef(null);
    const fimDoChatRef = useRef(null);

    // Limite de histórico para não vazar tokens (últimas 10 mensagens = ~5 volta-e-vinda)
    const MAX_HISTORICO = 10;

    // ────────────────────────────────────────────────────────────
    // FUNÇÕES INTERNAS: Construção de contexto
    // ────────────────────────────────────────────────────────────

    /**
     * Extrai keywords da mensagem do usuário para busca RAG
     * Exemplo: "Como aumentar meu ticket médio?" → ["ticket", "margem", "lucro"]
     */
    const extrairKeywords = useCallback((texto) => {
        const palavrasChave = [
            'faturamento',
            'forecast',
            'ticket',
            'margem',
            'lucro',
            'estoque',
            'giro',
            'clientes',
            'crm',
            'fiscal',
            'nota',
            'financeiro',
            'peças',
            'fornecedor',
            'os',
            'ordem serviço',
            'desmanche',
            'patrimônio',
            'marketing',
            'burocracia',
            'sucata',
            'alvará',
            'selo',
            'migracao',
            'dados',
            'especialista',
            'lei',
            'detran',
            'conama',
            'receptacao',
        ];

        return palavrasChave.filter(
            (palavra) =>
                texto.toLowerCase().includes(palavra) || texto.toLowerCase().includes(palavra.split(' ')[0])
        );
    }, []);

    /**
     * Busca RAG: encontra documentos relevantes na base de conhecimento
     * Se o usuário pergunta sobre "ticket", retorna info sobre Ticket Médio
     */
    const buscarContextoRelevante = useCallback(
        (textoUsuario) => {
            const keywords = extrairKeywords(textoUsuario);

            if (keywords.length === 0) {
                // Fallback: retorna contexto da aba ativa
                return gerarContextoPorAba(abaAtiva);
            }

            let contextoRAG = '';

            // Busca em cada keyword
            keywords.forEach((palavra) => {
                const resultados = buscarPorTag(palavra);
                if (resultados.length > 0) {
                    contextoRAG += `\n📌 Relacionado a "${palavra}":\n`;
                    resultados.forEach((r) => {
                        contextoRAG += `   • ${r.nome}: ${r.descricao.substring(0, 100)}...\n`;
                    });
                }
            });

            // Se não encontrou nada via tag, adiciona contexto da aba
            if (!contextoRAG.trim()) {
                contextoRAG = gerarContextoPorAba(abaAtiva);
            }

            return contextoRAG;
        },
        [abaAtiva, extrairKeywords]
    );

    /**
     * Formata histórico para enviar à IA (últimas 10 mensagens)
     * Isso mantém a memória de conversa sem vazar tokens
     */
    const formatarHistorico = useCallback(() => {
        const historico = chat.slice(-MAX_HISTORICO);
        return historico
            .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
    }, [chat]);

    // ────────────────────────────────────────────────────────────
    // FUNÇÃO PRINCIPAL: Enviar Mensagem
    // ────────────────────────────────────────────────────────────

    const enviarMensagem = useCallback(async () => {
        if (!mensagem.trim() || loading) return;

        // Salvar mensagem do usuário
        const novaMsgUsuario = {
            role: 'user',
            content: mensagem,
            timestamp: Date.now(),
        };

        const novoChat = [...chat, novaMsgUsuario];
        setChat(novoChat);
        setMensagem('');

        // ────────────────────────────────────────────────────────────
        // CONSTRUIR PROMPT SUPREMO
        // ────────────────────────────────────────────────────────────

        const contextoDaTela = gerarContextoPorAba(abaAtiva);
        const contextoRAG = buscarContextoRelevante(mensagem);
        const historico = formatarHistorico();

        const promptSupremo = `
╔════════════════════════════════════════════════════════════════╗
║         ESPECIALISTA IA - EXPRESS AUTO TECH                    ║
║  Seu assistente de gestão de oficinas com foco em LUCRO        ║
╚════════════════════════════════════════════════════════════════╝

IDENTIDADE:
- Nome: Especialista IA
- Expertise: Forecast Inteligente, Fiscal, O.S., Estoque, CRM
- Linguagem: Direto, prático, com emojis. Zero parolagem.
- Objetivo: Aumentar faturamento e lucro do dono de oficina

REGRAS RÍGIDAS:
1. PROIBIDO saudações genéricas ("Olá novamente", "Bem-vindo")
2. Analisa SEMPRE o contexto específico da aba ativa
3. Responde com dados concretos (números, fórmulas, exemplos)
4. Foca em AÇÃO: não explica, recomenda e como fazer
6. Se perguntado "o que é a aba burocracia?", responda EXATAMENTE: "A aba Burocracias é o seu escudo jurídico. Lá você controla seus alvarás, registra o descarte correto de óleo e sucata metálica (evitando multas da Vigilância Sanitária) e conquista o Selo de Oficina Blindada."
7. Se algo está zerado/vazio, DIAGNOSTICA por quê

ABA ATIVA: ${abaAtiva}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXTO DA ABA:
${contextoDaTela}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE DE CONHECIMENTO (RAG):
${contextoRAG}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HISTÓRICO DA CONVERSA (últimas mensagens):
${historico}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENSAGEM DO USUÁRIO: "${mensagem}"

ANALISA E RESPONDE:
- Com base no contexto da aba + conhecimento relevante
- Números concretos (exemplos, cálculos)
- Tom direto: recomendação clara de ação
- Máximo 3-4 parágrafos, sem enrolação
    `;

        try {
            const resposta = await analyzeText(promptSupremo);
            const respostaLimpa = resposta
                .replace(/^"|"$/g, '')
                .replace(/\\n/g, '\n')
                .trim();

            setChat((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: respostaLimpa,
                    timestamp: Date.now(),
                },
            ]);
        } catch (e) {
            console.error('Erro ao chamar IA:', e);
            setChat((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        '⚠️ Tive um soluço técnico na minha análise. Repita a pergunta ou reformule.',
                    timestamp: Date.now(),
                },
            ]);
        }
    }, [mensagem, chat, loading, abaAtiva, analyzeText, buscarContextoRelevante, formatarHistorico]);

    // ────────────────────────────────────────────────────────────
    // FUNÇÕES: Voice Input
    // ────────────────────────────────────────────────────────────

    const iniciarVoz = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Seu navegador não suporta reconhecimento de voz');
            return;
        }

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => setOuvindo(true);

        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setMensagem((prev) => (prev ? prev + ' ' + transcript : transcript));
        };

        rec.onerror = (e) => {
            console.error('Erro ao reconhecer voz:', e);
            setOuvindo(false);
        };

        rec.onend = () => setOuvindo(false);

        recRef.current = rec;
        rec.start();
    }, []);

    const pararVoz = useCallback(() => {
        if (recRef.current) {
            recRef.current.stop();
            setOuvindo(false);
        }
    }, []);

    // ────────────────────────────────────────────────────────────
    // FUNÇÕES: Limpeza e Controle
    // ────────────────────────────────────────────────────────────

    /**
     * Limpa todo o histórico de chat
     * Útil quando quer resetar a conversa
     */
    const limparChat = useCallback(() => {
        setChat([
            {
                role: 'assistant',
                content:
                    'Chat reiniciado! 🔄 Como posso ajudar a aumentar seu lucro hoje?',
                timestamp: Date.now(),
            },
        ]);
        setMensagem('');
    }, []);

    /**
     * Exporta histórico de chat para análise posterior
     * Formato: JSON ou markdown
     */
    const exportarHistorico = useCallback(
        (formato = 'json') => {
            if (formato === 'json') {
                return JSON.stringify(chat, null, 2);
            } else if (formato === 'markdown') {
                return chat
                    .map(
                        (msg) =>
                            `**${msg.role.toUpperCase()}:**\n${msg.content}\n\n---\n`
                    )
                    .join('\n');
            }
        },
        [chat]
    );

    // ────────────────────────────────────────────────────────────
    // EFEITO: Auto-scroll ao novo mensagem
    // ────────────────────────────────────────────────────────────

    // Colocar isso em useEffect no componente:
    // useEffect(() => {
    //   fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [chat]);

    // ────────────────────────────────────────────────────────────
    // RETORNAR API DO HOOK
    // ────────────────────────────────────────────────────────────

    return {
        // Estado
        chat,
        mensagem,
        setMensagem,
        loading,
        ouvindo,
        fimDoChatRef,

        // Ações principais
        enviarMensagem,
        iniciarVoz,
        pararVoz,

        // Utilitários
        limparChat,
        exportarHistorico,

        // Debug
        contextoAtual: gerarContextoPorAba(abaAtiva),
    };
};

export default useOficinaBD;
