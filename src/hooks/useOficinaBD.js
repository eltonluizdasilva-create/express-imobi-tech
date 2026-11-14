import { useState, useCallback, useRef } from 'react';
import { useGroq } from './useGroq';
import { gerarContextoPorAba, buscarPorTag } from '../data/BaseConhecimentoOficinIA';

/**
 * ═══════════════════════════════════════════════════════════════
 * HOOK: useOficinaBD (Especialista IA — Express Imobi Tech)
 * ═══════════════════════════════════════════════════════════════
 *
 * RESPONSABILIDADES:
 * 1. Gerenciar histórico de chat (memória de conversação)
 * 2. Selecionar contexto inteligente baseado na aba ativa (VGV, Leads, Imóveis, Vistoria)
 * 3. Executar busca RAG (Retrieval-Augmented Generation)
 * 4. Construir prompt otimizado para o ecossistema imobiliário
 * 5. Manter estado de loading e voz
 */

export const useOficinaBD = (abaAtiva = 'visao_geral') => {
    const { analyzeText, loading } = useGroq();

    const [chat, setChat] = useState(() => {
        const initialTimestamp = Date.now();
        return [
            {
                role: 'assistant',
                content:
                    'Olá! 🏢 Sou seu Especialista Imobiliário IA da Express Imobi Tech. Conheço cada detalhe da sua operação — Gestão de VGV, Funil CRM de Leads, Captação de Imóveis, Roleta de Distribuição e Vistorias com IA. Como posso ajudar você a fechar mais negócios hoje?',
                timestamp: initialTimestamp,
            },
        ];
    });

    const [mensagem, setMensagem] = useState('');
    const [ouvindo, setOuvindo] = useState(false);
    const recRef = useRef(null);
    const fimDoChatRef = useRef(null);

    const MAX_HISTORICO = 10;

    const extrairKeywords = useCallback((texto) => {
        const palavrasChave = [
            'vgv',
            'comissão',
            'comissao',
            'faturamento',
            'lucro',
            'imóveis',
            'imoveis',
            'captação',
            'captacao',
            'carteira',
            'clientes',
            'leads',
            'crm',
            'funil',
            'roleta',
            'visita',
            'proposta',
            'vistoria',
            'laudo',
            'chaves',
            'financiamento',
            'sac',
            'price',
            'mcmv',
            'sbpe',
            'fiscal',
            'recibo',
            'nota',
            'financeiro',
            'corretor',
            'equipe',
            'marketing',
            'anúncio',
            'creci',
            'pix',
            'locação',
            'aluguel',
            'venda',
        ];

        const lower = String(texto || '').toLowerCase();
        return palavrasChave.filter(
            (palavra) => lower.includes(palavra) || lower.includes(palavra.split(' ')[0])
        );
    }, []);

    const buscarContextoRelevante = useCallback(
        (textoUsuario) => {
            const keywords = extrairKeywords(textoUsuario);

            if (keywords.length === 0) {
                return gerarContextoPorAba(abaAtiva);
            }

            let contextoRAG = '';

            keywords.forEach((palavra) => {
                const resultados = buscarPorTag(palavra);
                if (resultados && resultados.length > 0) {
                    contextoRAG += `\n📌 Relacionado a "${palavra}":\n`;
                    resultados.forEach((r) => {
                        contextoRAG += `   • ${r.nome}: ${String(r.descricao || '').substring(0, 140)}...\n`;
                    });
                }
            });

            if (!contextoRAG.trim()) {
                contextoRAG = gerarContextoPorAba(abaAtiva);
            }

            return contextoRAG;
        },
        [abaAtiva, extrairKeywords]
    );

    const formatarHistorico = useCallback(() => {
        const historico = (chat || []).slice(-MAX_HISTORICO);
        return historico
            .map((msg) => `${String(msg.role || 'user').toUpperCase()}: ${msg.content}`)
            .join('\n\n');
    }, [chat]);

    const enviarMensagem = useCallback(
        async (textoDireto) => {
            const textoParaEnviar =
                typeof textoDireto === 'string' && textoDireto.trim()
                    ? textoDireto.trim()
                    : mensagem.trim();

            if (!textoParaEnviar || loading) return;

            const novaMsgUsuario = {
                role: 'user',
                content: textoParaEnviar,
                timestamp: Date.now(),
            };

            const novoChat = [...chat, novaMsgUsuario];
            setChat(novoChat);
            setMensagem('');

            const contextoDaTela = gerarContextoPorAba(abaAtiva);
            const contextoRAG = buscarContextoRelevante(textoParaEnviar);
            const historico = formatarHistorico();

            const promptSupremo = `
╔════════════════════════════════════════════════════════════════╗
║         ESPECIALISTA IA - EXPRESS IMOBI TECH                   ║
║  Consultor de Gestão Imobiliária, VGV, Leads & Conversão       ║
╚════════════════════════════════════════════════════════════════╝

IDENTIDADE:
- Nome: Especialista Imobiliário IA — Express Imobi Tech
- Expertise: Gestão de VGV, Funil CRM Imobiliário, Captação de Imóveis, Roleta de Leads, Vistoria Imobiliária com IA, Comissões (6%), Financiamento Habitacional (SAC, Price, MCMV, SBPE) e Automação de WhatsApp.
- Linguagem: Direta, executiva, prática e motivadora com emojis estratégicos.
- Objetivo: Aumentar o VGV vendido/locado, a conversão de leads em visitas e o lucro líquido da imobiliária ou corretor.

REGRAS DE OURO:
1. NUNCA mencione oficina mecânica, carros, ordens de serviço (O.S.), peças ou estoque automotivo. Você atua 100% no mercado imobiliário (Express Imobi Tech).
2. Utilize sempre "Visão Geral" e "Painel Executivo" ao se referir ao painel principal.
3. Responda com recomendações práticas, exemplos de scripts de WhatsApp ou cálculos claros de VGV, comissão (6%) e financiamento quando aplicável.
4. Máximo de 3 a 4 parágrafos objetivos.

ABA ATIVA NO SISTEMA: ${abaAtiva}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXTO DA ABA:
${contextoDaTela}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE DE CONHECIMENTO IMOBILIÁRIO (RAG):
${contextoRAG}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HISTÓRICO DA CONVERSA:
${historico}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERGUNTA DO CORRETOR / GESTOR IMOBILIÁRIO: "${textoParaEnviar}"

RESPOSTA DO ESPECIALISTA IA:`;

            try {
                const resposta = await analyzeText(promptSupremo);
                const respostaLimpa = String(resposta || '')
                    .replace(/^"|"$/g, '')
                    .replace(/\\n/g, '\n')
                    .trim();

                setChat((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content:
                            respostaLimpa ||
                            'Estou pronto para ajudar na sua gestão de VGV, leads e imóveis. Qual é a sua prioridade agora?',
                        timestamp: Date.now(),
                    },
                ]);
            } catch (e) {
                console.error('Erro ao chamar Especialista IA:', e);
                setChat((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content:
                            '⚠️ Tive uma oscilação momentânea na conexão. Pode enviar novamente sua dúvida sobre VGV, leads ou imóveis?',
                        timestamp: Date.now(),
                    },
                ]);
            }
        },
        [mensagem, chat, loading, abaAtiva, analyzeText, buscarContextoRelevante, formatarHistorico]
    );

    const iniciarVoz = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Seu navegador não suporta reconhecimento de voz.');
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

    const limparChat = useCallback(() => {
        setChat([
            {
                role: 'assistant',
                content:
                    'Conversa reiniciada! 🔄 Como posso ajudar a impulsionar seu VGV, qualificar leads ou organizar seus imóveis hoje?',
                timestamp: Date.now(),
            },
        ]);
        setMensagem('');
    }, []);

    const exportarHistorico = useCallback(
        (formato = 'json') => {
            if (formato === 'json') {
                return JSON.stringify(chat, null, 2);
            } else if (formato === 'markdown') {
                return (chat || [])
                    .map((msg) => `**${String(msg.role).toUpperCase()}:**\n${msg.content}\n\n---\n`)
                    .join('\n');
            }
        },
        [chat]
    );

    return {
        chat,
        mensagem,
        setMensagem,
        loading,
        ouvindo,
        fimDoChatRef,
        enviarMensagem,
        iniciarVoz,
        pararVoz,
        limparChat,
        exportarHistorico,
        contextoAtual: gerarContextoPorAba(abaAtiva),
    };
};

export default useOficinaBD;
