/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useOficina } from './OficinaContext';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  Calendar,
  DollarSign,
  HelpCircle,
  Zap,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

/**
 * Classificador de intenções simples para ambiente Web
 */
function classifyWebIntent(text) {
  if (!text || typeof text !== 'string') {
    return {
      intent: 'UNKNOWN',
      reply: 'Não entendi a sua mensagem. Como posso ajudar?',
      recommendation: 'SOLICITAR_REPETICAO'
    };
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Comandos / Botões Rápidos
  if (trimmed.startsWith('/')) {
    const cmd = lower.split(' ')[0];
    if (cmd === '/start' || cmd === '/menu') {
      return {
        intent: 'COMMAND_START',
        reply: '🤖 **Bem-vindo ao Atendimento Web Express Auto Tech!**\n\nEscolha uma das opções abaixo:\n• 💼 Orçamento rápido\n• 📅 Agendar atendimento\n• 🛠️ Falar com suporte',
        recommendation: 'EXIBIR_MENU'
      };
    }
    if (cmd === '/orcamento' || cmd === '/preco') {
      return {
        intent: 'COMMAND_BUDGET',
        reply: '💼 **Solicitação de Orçamento**\n\nPara calcularmos a estimativa do seu serviço, informe:\n1. Modelo e Ano do veículo\n2. Serviço pretendido (ex: Troca de óleo, Revisão, Freios)',
        recommendation: 'INICIAR_FLUXO_ORCAMENTO'
      };
    }
    if (cmd === '/agendar' || cmd === '/agenda') {
      return {
        intent: 'COMMAND_SCHEDULE',
        reply: '📅 **Agendamento Online**\n\nPor favor, informe a data de preferência (ex: Amanhã às 14h) e o seu nome completo para reservarmos a sua vaga!',
        recommendation: 'INICIAR_FLUXO_AGENDAMENTO'
      };
    }
    if (cmd === '/ajuda' || cmd === '/suporte') {
      return {
        intent: 'COMMAND_HELP',
        reply: '🛠️ **Central de Suporte**\n\nEm que podemos ajudar com o seu veículo? Digite a sua dúvida ou o problema que o carro apresenta.',
        recommendation: 'EXIBIR_CANAIS_SUPORTE'
      };
    }
  }

  // Análise por palavras-chave
  if (/\b(olá|ola|oi|bom dia|boa tarde|boa noite|iniciar)\b/i.test(lower)) {
    return {
      intent: 'GREETING',
      reply: 'Olá! 👋 Seja bem-vindo à Express Auto Tech. Como podemos cuidar do seu carro hoje?',
      recommendation: 'EXIBIR_MENU'
    };
  }

  if (/\b(orçamento|orcamento|preço|preco|quanto custa|valor|cotação|cotacao|tabela)\b/i.test(lower)) {
    return {
      intent: 'BUDGET_INQUIRY',
      reply: '💼 **Cotação de Serviços**\n\nPara passar o valor exato, informe o modelo do veículo e o serviço desejado.',
      recommendation: 'SOLICITAR_DETALHES_SERVICO'
    };
  }

  if (/\b(agendar|agendamento|marcar|reserva|horario|horário|agenda|data)\b/i.test(lower)) {
    return {
      intent: 'SCHEDULE_REQUEST',
      reply: '📅 **Agendamento**\n\nQual dia e horário seriam melhores para você trazer o veículo à oficina?',
      recommendation: 'ABRIR_AGENDA'
    };
  }

  if (/\b(suporte|ajuda|problema|erro|dúvida|duvida|atendente|humano)\b/i.test(lower)) {
    return {
      intent: 'SUPPORT_HELP',
      reply: '🛠️ **Suporte Técnico**\n\nPor favor, descreva o sintoma do seu veículo (ex: barulho no freio, luz de injeção acesa).',
      recommendation: 'ENCAMINHAR_SUPORTE'
    };
  }

  return {
    intent: 'GENERAL_INQUIRY',
    reply: `Obrigado pelo seu contato! Recebemos a mensagem: "${text}". Nossa equipe de consultores técnicos analisará e retornará em breve.`,
    recommendation: 'ANALISAR_MENSAGEM'
  };
}

export default function WebChatWidget() {
  const { oficinaId } = useOficina();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    {
      id: 'msg_welcome',
      autor: 'bot',
      texto: 'Olá! 👋 Bem-vindo ao atendimento em tempo real da Express Auto Tech. Como posso ajudar com o seu veículo hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [digitando, setDigitando] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (aberto) {
      scrollToBottom();
    }
  }, [mensagens, digitando, aberto]);

  /**
   * Salva o lead no Firebase Firestore e no LocalStorage
   */
  const salvarLeadNaBase = async (userText, intentData) => {
    const leadObj = {
      nome: 'Cliente Web Chat',
      telefone: 'Atendimento Online',
      veiculo: 'Não informado',
      problema: `[Web Chat] ${userText}`,
      intent: intentData.intent,
      recommendation: intentData.recommendation,
      status: 'novo',
      origem: 'web_chat',
      data_registro: new Date()
    };

    // 1. Salva no LocalStorage para histórico local rápido
    try {
      const leadsLocais = JSON.parse(localStorage.getItem('web_leads') || '[]');
      leadsLocais.push({ ...leadObj, id: `web_${Date.now()}` });
      localStorage.setItem('web_leads', JSON.stringify(leadsLocais));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }

    // 2. Salva no Firebase Firestore se a oficina estiver ativa
    if (oficinaId) {
      try {
        await addDoc(collection(db, "oficinas", oficinaId, "leads"), leadObj);
        console.log('[WebChatWidget] Lead gravado no Firestore com sucesso!');
      } catch (err) {
        console.error('[WebChatWidget] Erro ao gravar lead no Firestore:', err);
      }
    }
  };

  /**
   * Envia uma mensagem no chat
   */
  const handleEnviarMensagem = (textoCustomizado = null) => {
    const textoParaEnviar = textoCustomizado || inputTexto;
    if (!textoParaEnviar || !textoParaEnviar.trim()) return;

    const novaMsgUsuario = {
      id: `user_${Date.now()}`,
      autor: 'user',
      texto: textoParaEnviar.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMensagens(prev => [...prev, novaMsgUsuario]);
    if (!textoCustomizado) setInputTexto('');
    setDigitando(true);

    // Avalia a intenção via motor Jev inteligente
    setTimeout(async () => {
      const intentResult = classifyWebIntent(textoParaEnviar);

      // Salva o lead no sistema de controlo de leads
      await salvarLeadNaBase(textoParaEnviar, intentResult);

      const novaMsgBot = {
        id: `bot_${Date.now()}`,
        autor: 'bot',
        texto: intentResult.reply,
        intent: intentResult.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMensagens(prev => [...prev, novaMsgBot]);
      setDigitando(false);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* CHAT MODAL */}
      {aberto && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[520px] rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-200">
          
          {/* HEADER DO CHAT */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                <Bot size={22} className="text-emerald-200" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                  Express Auto Tech
                  <Sparkles size={14} className="text-amber-300" />
                </h3>
                <p className="text-[10px] text-emerald-100 font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  Jev Decision Engine • Online
                </p>
              </div>
            </div>

            <button
              onClick={() => setAberto(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* ÁREA DE MENSAGENS */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/40 styled-scrollbar">
            {mensagens.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.autor === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.autor === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-semibold rounded-br-none shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-lg'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.texto}</div>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {digitando && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl w-fit text-xs text-slate-400">
                <Bot size={14} className="text-emerald-400 animate-spin" />
                <span className="animate-pulse font-medium text-[11px]">Jev AI está a analisar...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* BOTÕES DE AÇÃO RÁPIDA */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleEnviarMensagem('/orcamento')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-amber-400 whitespace-nowrap transition-colors"
            >
              <DollarSign size={12} /> Orçamento
            </button>
            <button
              onClick={() => handleEnviarMensagem('/agendar')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-purple-400 whitespace-nowrap transition-colors"
            >
              <Calendar size={12} /> Agendar
            </button>
            <button
              onClick={() => handleEnviarMensagem('/ajuda')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-cyan-400 whitespace-nowrap transition-colors"
            >
              <HelpCircle size={12} /> Suporte
            </button>
          </div>

          {/* INPUT E BOTÃO ENVIAR */}
          <div className="p-3 bg-slate-950 border-t border-slate-900 flex items-center gap-2">
            <input
              type="text"
              value={inputTexto}
              onChange={e => setInputTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite a sua mensagem..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              onClick={() => handleEnviarMensagem()}
              disabled={!inputTexto.trim()}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE DE ABERTURA */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-5 py-3.5 rounded-full font-black text-xs uppercase tracking-wider shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] active:scale-95 transition-all"
        >
          <div className="relative">
            <MessageCircle size={22} fill="currentColor" className="text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-slate-950 rounded-full animate-ping" />
          </div>
          <span className="hidden sm:inline">Atendimento Online</span>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-950/20 text-[10px]">
            <Zap size={12} className="text-slate-950" />
          </span>
        </button>
      )}
    </div>
  );
}
