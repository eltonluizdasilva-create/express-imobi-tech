import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import HeroAba from './admin/HeroAba';
import { buscarContextoSofia, CONHECIMENTO_SOFIA, RESPOSTAS_PRONTAS_SOFIA } from '../data/cerebroSofia';
import { cabecalhosIA } from '../lib/aiAuth';
import {
  Calendar,
  Send,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Clock,
  Sparkles,
  Star,
  Building2,
  Mail,
  CalendarX2,
  ArrowRight,
  Moon,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Phone,
  Settings2,
  CalendarCheck,
  Bot,
} from 'lucide-react';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  FUSO_ATENDIMENTO,
  HORARIOS_ATENDIMENTO,
  hojeBrasiliaISO,
  proximaDataLivre,
  textoBloqueio,
} from '../lib/agendaEspecialista';
import { EMAIL_INSTITUCIONAL } from '../lib/appUrl';
import { linkEmail, linkWhatsApp, WHATSAPP_SUPORTE_EXIBICAO } from '../lib/contato';

/**
 * Suporte Especialista — Agenda de Consultoria Imobiliária
 * ============================================================================
 * A disponibilidade mora no Firestore, coleção `agenda_consultoria`:
 *   id do documento : `${data}_${horario}`  (ex.: 2026-11-24_20:30)
 *   campos          : data, horario, status ('livre' | 'reservado' | 'ocupado'),
 *                     clienteNome, clienteImobiliaria, clienteWhatsApp, criadoEm
 *
 * Quem manda no horário é o documento no servidor, não o código:
 *   • sem documento        → livre
 *   • status 'reservado'   → o especialista bloqueou
 *   • status 'ocupado'     → cliente confirmou (some para os outros)
 *
 * Janela de atendimento: só a NOITE (20:30–23:00, horário de Brasília).
 * Manhã e tarde ficam de fora de propósito — ver `lib/agendaEspecialista.js`.
 * ============================================================================
 */

const COLECAO = 'agenda_consultoria';

const idDocumento = (data, horario) => `${data}_${horario}`;

/** Telefone só com dígitos, com DDI 55 quando faltar. */
const normalizarWhatsApp = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.startsWith('55') ? digitos : `55${digitos}`;
};

const whatsappValido = (valor) => {
  const digitos = String(valor || '').replace(/\D/g, '');
  return digitos.length >= 10 && digitos.length <= 13;
};

export default function Especialista({ dadosOficina, dadosImobiliaria, papelLogado, setAbaAtiva }) {
  const dadosAtivos = dadosImobiliaria || dadosOficina;
  const nomeImobi = dadosAtivos?.nome || '';

  // Só a conta master da plataforma vê o "Modo Gerenciar Agenda".
  const ehAdmin = papelLogado === 'master' || papelLogado === 'admin';

  const [selectedDate, setSelectedDate] = useState(() => proximaDataLivre() || hojeBrasiliaISO());
  const [agenda, setAgenda] = useState({});
  const [carregandoAgenda, setCarregandoAgenda] = useState(true);
  const [erroAgenda, setErroAgenda] = useState('');
  const [gerenciar, setGerenciar] = useState(false);
  const [salvandoHorario, setSalvandoHorario] = useState('');

  // Modal de reserva (cliente)
  const [reserva, setReserva] = useState(null);
  const [form, setForm] = useState({ nome: '', imobiliaria: '', whatsapp: '' });
  const [erroForm, setErroForm] = useState('');
  const [sucesso, setSucesso] = useState(null);

  const bloqueio = textoBloqueio(selectedDate);

  // ── Chat Interativo da Sofia (Cérebro Estruturado & /api/ai) ─────────────
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagensChat, setMensagensChat] = useState([
    {
      id: 'boas-vindas',
      autor: 'sofia',
      hora: 'Agora',
      texto: 'Olá! Sou a **Sofia**, especialista oficial no **Express Imobi Tech**.\n\nConheço todos os planos (**Grátis**, **PRO** e **PLUS**), ferramentas como **Roleta de Leads**, **Vitrine Pública** (até 7 fotos com Foto 1 como capa), **Migração de CRM** e os módulos de IA (**Pólen 24h**, **Zara** e **Tom**).\n\nComo posso te orientar hoje? Escolha uma das perguntas rápidas abaixo ou digite sua dúvida no campo:',
    },
  ]);
  const [inputPergunta, setInputPergunta] = useState('');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [perguntasLivresUsadas, setPerguntasLivresUsadas] = useState(0);
  const LIMITE_PERGUNTAS_LIVRES = 5;
  const chatFimRef = useRef(null);
  const inputChatRef = useRef(null);
  const containerChatRef = useRef(null);

  const enviarPergunta = async (textoCustom = '') => {
    const texto = String(textoCustom || inputPergunta || '').trim();
    if (!texto || carregandoIA) return;

    setInputPergunta('');
    setChatAberto(true);

    const agoraHora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const msgUsuario = {
      id: 'u-' + Date.now(),
      autor: 'usuario',
      hora: agoraHora,
      texto,
    };

    setMensagensChat((prev) => [...prev, msgUsuario]);
    setTimeout(() => {
      chatFimRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Consulta no Cérebro Estruturado da Sofia
    const { respostaPronta, contexto } = buscarContextoSofia(texto);

    // 1. Resposta pronta instantânea (0 tokens)
    if (respostaPronta) {
      setTimeout(() => {
        setMensagensChat((prev) => [
          ...prev,
          {
            id: 's-' + Date.now(),
            autor: 'sofia',
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            texto: respostaPronta,
            zeroTokens: true,
          },
        ]);
        setTimeout(() => {
          chatFimRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }, 200);
      return;
    }

    // 2. Trava de limite de 5 perguntas livres na sessão
    if (perguntasLivresUsadas >= LIMITE_PERGUNTAS_LIVRES) {
      setTimeout(() => {
        setMensagensChat((prev) => [
          ...prev,
          {
            id: 's-' + Date.now(),
            autor: 'sofia',
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            texto: `Você atingiu o limite de **${LIMITE_PERGUNTAS_LIVRES} perguntas livres** nesta sessão para controle de consumo da IA.\n\nVocê pode continuar consultando os **tópicos rápidos pré-configurados** (0 tokens) ou falar diretamente com a equipe humana nos canais oficiais no rodapé da página.`,
            limiteAtingido: true,
          },
        ]);
        setTimeout(() => {
          chatFimRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }, 150);
      return;
    }

    // 3. Pergunta livre: envia recorte enxuto (~700 tokens) para a DeepSeek via /api/ai
    setPerguntasLivresUsadas((v) => v + 1);
    setCarregandoIA(true);

    try {
      const headers = await cabecalhosIA();
      const promptSofia = `Você é a Sofia, especialista oficial em suporte, planos e configuração do Express Imobi Tech.
Seu objetivo é orientar corretores e donos de imobiliárias com respostas precisas, claras, educadas e objetivas sobre a plataforma.

REGRAS OBRIGATÓRIAS:
1. Baseie sua resposta EXCLUSIVAMENTE nas informações oficiais do Express Imobi Tech fornecidas abaixo.
2. Seja direta e use formatação limpa (tópicos com • e negrito).
3. Nunca invente valores ou funcionalidades que não constem no contexto.
4. Para a Pólen, NÃO cite preço de tabela avulso; oriente a testar no simulador do painel ou solicitar ativação assistida.
5. Se a dúvida for sobre contato humano, informe o e-mail oficial (${CONHECIMENTO_SOFIA.EMPRESA.suporteEmail}).

CONTEXTO OFICIAL DA PLATAFORMA:
${contexto}

DÚVIDA DO USUÁRIO:
${texto}`;

      const resp = await fetch('/api/ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          provider: 'deepseek',
          model: 'deepseek-chat',
          prompt: promptSofia,
          temperature: 0.3,
          maxTokens: 500,
        }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.text) {
        throw new Error(data?.error || `Falha no servidor de IA (HTTP ${resp.status})`);
      }

      setMensagensChat((prev) => [
        ...prev,
        {
          id: 's-' + Date.now(),
          autor: 'sofia',
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          texto: data.text,
          consumiuToken: true,
        },
      ]);
    } catch (err) {
      console.warn('Erro ao consultar /api/ai para a Sofia:', err);
      // Fallback analítico direto baseado no cérebro estruturado
      const fallbackTexto = `Não foi possível falar com a IA externa no momento (${err?.message || 'falha de rede'}).\n\n**Informações oficiais da plataforma sobre o tema:**\n\n${contexto}\n\n*Para suporte humano adicional, confira o contato no rodapé.*`;
      setMensagensChat((prev) => [
        ...prev,
        {
          id: 's-' + Date.now(),
          autor: 'sofia',
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          texto: fallbackTexto,
        },
      ]);
    } finally {
      setCarregandoIA(false);
      setTimeout(() => {
        chatFimRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const abrirSofiaSuporte = (pergunta = '') => {
    setChatAberto(true);
    setTimeout(() => {
      containerChatRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    if (pergunta) {
      enviarPergunta(pergunta);
    } else {
      setTimeout(() => {
        inputChatRef.current?.focus();
      }, 200);
    }
  };

  // Os agentes operacionais ficam na seção de IA; a Pólen tem área própria.
  // O painel passa
  // `setAbaAtiva` para o módulo; o evento é o plano B quando a tela é montada
  // isolada (testes/embed).
  const abrirPolen = () => {
    if (typeof setAbaAtiva === 'function') {
      setAbaAtiva('agentes_ia');
      return;
    }
    window.dispatchEvent(new CustomEvent('abrirAbaImobi', { detail: 'agentes_ia' }));
  };

  // ── Assinatura em tempo real dos horários do dia escolhido ────────────────
  useEffect(() => {
    let ativo = true;
    setCarregandoAgenda(true);
    setErroAgenda('');

    const consulta = query(collection(db, COLECAO), where('data', '==', selectedDate));
    const cancelar = onSnapshot(
      consulta,
      (snap) => {
        if (!ativo) return;
        const mapa = {};
        snap.forEach((documento) => {
          const valor = documento.data() || {};
          if (valor.horario) mapa[valor.horario] = valor;
        });
        setAgenda(mapa);
        setCarregandoAgenda(false);
      },
      (erro) => {
        if (!ativo) return;
        console.error('[agenda_consultoria] leitura falhou:', erro);
        setErroAgenda('Não foi possível carregar a agenda agora. Recarregue a página.');
        setCarregandoAgenda(false);
      },
    );

    return () => {
      ativo = false;
      cancelar();
    };
  }, [selectedDate]);

  const statusDoHorario = useCallback(
    (horario) => agenda[horario]?.status || 'livre',
    [agenda],
  );

  const resumo = useMemo(() => {
    const total = HORARIOS_ATENDIMENTO.length;
    const bloqueados = HORARIOS_ATENDIMENTO.filter((h) => statusDoHorario(h) !== 'livre').length;
    return { total, livres: total - bloqueados };
  }, [statusDoHorario]);

  // ── Cliente reserva ───────────────────────────────────────────────────────
  const abrirReserva = (horario) => {
    setErroForm('');
    setSucesso(null);
    setForm({ nome: '', imobiliaria: nomeImobi, whatsapp: '' });
    setReserva(horario);
  };

  const confirmarReserva = async () => {
    if (!reserva) return;

    if (form.nome.trim().length < 3) return setErroForm('Informe seu nome completo.');
    if (!whatsappValido(form.whatsapp)) return setErroForm('Informe um WhatsApp válido com DDD.');

    const horario = reserva;
    const docId = idDocumento(selectedDate, horario);
    setErroForm('');
    setSalvandoHorario(horario);

    try {
      // Transação: se alguém reservou entre o clique e o envio, recusa em vez
      // de sobrescrever a reserva da outra pessoa.
      await runTransaction(db, async (tx) => {
        const referencia = doc(db, COLECAO, docId);
        const atual = await tx.get(referencia);
        const statusAtual = atual.exists() ? atual.data()?.status : 'livre';
        if (statusAtual && statusAtual !== 'livre') {
          throw new Error('HORARIO_INDISPONIVEL');
        }
        tx.set(referencia, {
          data: selectedDate,
          horario,
          status: 'ocupado',
          clienteNome: form.nome.trim(),
          clienteImobiliaria: form.imobiliaria.trim(),
          clienteWhatsApp: normalizarWhatsApp(form.whatsapp),
          criadoEm: serverTimestamp(),
        });
      });

      const dataFormatada = selectedDate.split('-').reverse().join('/');
      const mensagem =
        `Olá! 👋\n\nSou *${form.nome.trim()}*` +
        (form.imobiliaria.trim() ? ` da *${form.imobiliaria.trim()}*` : '') +
        ` e reservei na agenda o horário de *${horario}* (${FUSO_ATENDIMENTO}) no dia *${dataFormatada}*.\n\n` +
        `📲 Meu WhatsApp: ${form.whatsapp}\n\nPodem confirmar o atendimento? Obrigado!`;

      setSucesso({
        horario,
        url: linkWhatsApp(mensagem),
      });
      setReserva(null);
      setForm({ nome: '', imobiliaria: '', whatsapp: '' });
    } catch (erro) {
      if (erro?.message === 'HORARIO_INDISPONIVEL') {
        setErroForm('Esse horário acabou de ser reservado por outra pessoa. Escolha outro.');
        setReserva(null);
      } else {
        console.error('[agenda_consultoria] reserva falhou:', erro);
        setErroForm('Não conseguimos salvar sua reserva. Tente novamente em instantes.');
      }
    } finally {
      setSalvandoHorario('');
    }
  };

  // ── Administrador bloqueia / libera ───────────────────────────────────────
  const alternarBloqueio = async (horario) => {
    const atual = statusDoHorario(horario);
    const registro = agenda[horario];

    if (atual === 'ocupado') {
      const dono = registro?.clienteNome ? ` de ${registro.clienteNome}` : ' por um cliente';
      if (!window.confirm(`Esse horário está reservado${dono}.\n\nDeseja liberar mesmo assim?`)) return;
    }

    const novoStatus = atual === 'reservado' ? 'livre' : 'reservado';
    setSalvandoHorario(horario);

    try {
      await setDoc(
        doc(db, COLECAO, idDocumento(selectedDate, horario)),
        {
          data: selectedDate,
          horario,
          status: novoStatus,
          ...(novoStatus === 'livre'
            ? { clienteNome: '', clienteImobiliaria: '', clienteWhatsApp: '' }
            : {}),
          criadoEm: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (erro) {
      console.error('[agenda_consultoria] bloqueio falhou:', erro);
      setErroAgenda('Não deu para salvar a alteração. Verifique a conexão e tente de novo.');
    } finally {
      setSalvandoHorario('');
    }
  };

  const aoClicarHorario = (horario) => {
    if (bloqueio) return;
    if (gerenciar && ehAdmin) return alternarBloqueio(horario);
    if (statusDoHorario(horario) !== 'livre') return;
    abrirReserva(horario);
  };

  const irParaPrimeiroLivre = () => {
    const primeiroLivre = HORARIOS_ATENDIMENTO.find((h) => statusDoHorario(h) === 'livre');
    if (!primeiroLivre) {
      window.alert('Todos os horários deste dia estão preenchidos. Escolha outra data.');
      return;
    }
    abrirReserva(primeiroLivre);
  };

  // ── Cartão de horário ─────────────────────────────────────────────────────
  const CartaoHorario = ({ horario }) => {
    const status = statusDoHorario(horario);
    const salvando = salvandoHorario === horario;
    const clicavel = !bloqueio && !salvando && (gerenciar && ehAdmin ? true : status === 'livre');

    const estilos = {
      livre: 'border-emerald-400 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-semibold shadow-md shadow-emerald-500/25',
      reservado: 'border-amber-500/50 bg-amber-500/20 text-amber-200 font-semibold',
      ocupado: 'border-slate-800 bg-slate-900/60 text-slate-400 font-semibold',
    };

    return (
      <button
        type="button"
        onClick={() => aoClicarHorario(horario)}
        disabled={!clicavel}
        aria-label={`${horario} — ${status}`}
        title={
          status === 'livre'
            ? gerenciar && ehAdmin
              ? 'Clique para bloquear (reservado)'
              : 'Clique para reservar'
            : status === 'reservado'
              ? gerenciar && ehAdmin
                ? 'Clique para liberar'
                : 'Horário reservado pelo especialista'
              : 'Horário já ocupado'
        }
        className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3.5 transition-all ${estilos[status]} ${
          clicavel ? 'cursor-pointer hover:-translate-y-px' : 'cursor-not-allowed'
        } ${salvando ? 'opacity-60' : ''}`}
      >
        <span className={`text-sm font-black tabular-nums ${status === 'livre' ? 'text-emerald-950 font-semibold' : ''}`}>{horario}</span>
        {salvando ? (
          <Loader2 size={11} className="animate-spin" />
        ) : status === 'livre' ? (
          <span className="text-[7.5px] font-black uppercase tracking-[0.14em] text-emerald-950 opacity-90">
            {gerenciar && ehAdmin ? 'bloquear' : 'livre'}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[7.5px] font-black uppercase tracking-[0.14em]">
            {status === 'reservado' ? <Lock size={9} /> : <CheckCircle2 size={9} />}
            {status === 'reservado' ? 'RESERVADO' : 'OCUPADO'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      data-tema="escuro-forcado"
      style={{ backgroundColor: '#080C10', color: '#ffffff' }}
      className="painel-escuro min-h-screen font-sans p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500 rounded-3xl space-y-8"
    >
      <div className="text-center pt-2">
        <HeroAba
          flat
          icone={Sparkles}
          chip="Sofia · Suporte & Configuração Oficial"
          titulo="Console de Comando & Diagnóstico da Sofia"
          subtitulo="A Sofia conhece todo o Express Imobi Tech: tira dúvidas de planos, analisa a prontidão da sua imobiliária e orienta configurações em tempo real."
          cor="#0EA5E9"
        />
      </div>

      {/* ─── CONSOLE TECNOLÓGICO EM AZUL-CIANO (#0EA5E9) & PAINEL RADAR ───────── */}
      <div
        className="rounded-3xl border border-sky-500/35 p-6 md:p-8 shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: '#0A1017',
          backgroundImage:
            'radial-gradient(850px 300px at 15% -20%, rgba(14, 165, 233, 0.20), transparent 70%), radial-gradient(700px 250px at 85% -10%, rgba(56, 189, 248, 0.12), transparent 60%), linear-gradient(180deg, #0A1017 0%, #060B10 100%)',
        }}
      >
        {/* Grade polar de fundo sutil */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-radar-sofia" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="1.5" fill="#0EA5E9" />
                <path d="M 25 0 L 25 50 M 0 25 L 50 25" stroke="#0EA5E9" strokeWidth="0.5" strokeOpacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-radar-sofia)" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Coluna Esquerda: Identidade & Ações */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/50 text-[10.5px] font-black uppercase tracking-wider text-sky-300">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                Base Express Imobi Tech Sincronizada
              </span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10.5px] font-black uppercase tracking-wider text-cyan-300">
                ⚡ Resposta em 6s • 94% Resolução Imediata
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden border-2 border-sky-400 bg-slate-950 shadow-2xl shadow-sky-500/30">
                  <img
                    src="/images/avatar-sofia.png"
                    onError={(e) => { e.currentTarget.src = '/images/avatar-sofia.svg'; }}
                    alt="Sofia"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-[#0A1017]"></span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                  SOFIA · <span className="text-sky-400" style={{ color: '#38BDF8', WebkitTextFillColor: '#38BDF8' }}>SUPORTE & DIAGNÓSTICO</span>
                </h2>
                <p className="text-sm md:text-base font-semibold text-sky-300">
                  A Sofia conhece todo o Express Imobi Tech
                </p>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl" style={{ color: '#cbd5e1' }}>
                  Ela foi treinada com a plataforma inteira: o que cada plano libera, como funcionam as rotinas do funil, captação, esteira de crédito, vitrine pública e a configuração dos agentes de WhatsApp. Dúvidas sobre a plataforma? A Sofia responde na hora.
                </p>
              </div>
            </div>

            {/* Dúvidas rápidas sugeridas */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block" style={{ color: '#94a3b8' }}>
                Perguntas Frequentes da Plataforma:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Como funciona a Roleta de Leads?',
                  'O que entra no plano PRO?',
                  'Como configuro meu WhatsApp?',
                  'Como cadastrar imóvel na vitrine?',
                ].map((exemplo) => (
                  <button
                    key={exemplo}
                    type="button"
                    onClick={() => abrirSofiaSuporte(exemplo)}
                    title="Perguntar isso para a Sofia"
                    className="rounded-full border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 text-[11px] font-bold text-sky-200 transition hover:border-sky-300 hover:text-white cursor-pointer"
                  >
                    “{exemplo}”
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => abrirSofiaSuporte()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition shadow-xl shadow-sky-500/25 cursor-pointer font-sans"
              >
                FALAR COM A SOFIA AGORA →
              </button>
            </div>
          </div>

          {/* Coluna Direita: PAINEL RADAR / ANÉIS DE DIAGNÓSTICO DA OPERAÇÃO */}
          <div
            className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl border shadow-2xl relative"
            style={{ backgroundColor: '#0B121E', borderColor: 'rgba(14, 165, 233, 0.3)' }}
          >
            <div className="w-full flex items-center justify-between mb-4 border-b border-sky-500/20 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
                <Sparkles size={12} /> Diagnóstico da Operação
              </span>
              <span className="text-xs font-black text-cyan-300">93.2% OTIMIZADA</span>
            </div>

            {/* Radar Circular Concêntrico SVG */}
            <div className="relative h-48 w-48 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                {/* Círculos concêntricos */}
                <circle cx="60" cy="60" r="54" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.15" />
                <circle cx="60" cy="60" r="42" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="3 3" />
                <circle cx="60" cy="60" r="30" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.35" />
                <circle cx="60" cy="60" r="18" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.45" />

                {/* Eixos do radar */}
                <line x1="60" y1="6" x2="60" y2="114" stroke="#0ea5e9" strokeWidth="0.7" strokeOpacity="0.3" />
                <line x1="6" y1="60" x2="114" y2="60" stroke="#0ea5e9" strokeWidth="0.7" strokeOpacity="0.3" />

                {/* Anel 1: Vitrine (94%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeDasharray="314"
                  strokeDashoffset={314 * (1 - 0.94)}
                  strokeLinecap="round"
                />
                {/* Anel 2: Funil & Roleta (88%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="38"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="3.5"
                  strokeDasharray="238"
                  strokeDashoffset={238 * (1 - 0.88)}
                  strokeLinecap="round"
                />
                {/* Anel 3: Agenda (100%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="26"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeDasharray="163"
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />
              </svg>

              {/* Centro do Radar */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>93%</span>
                <span className="text-[8.5px] font-black uppercase tracking-wider text-sky-400">Score</span>
              </div>
            </div>

            {/* 4 Eixos de Diagnóstico */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-sky-500/20 text-[10.5px]">
              <div
                className="p-2 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: '#0F172A', borderColor: 'rgba(14, 165, 233, 0.2)' }}
              >
                <span className="font-bold" style={{ color: '#E2E8F0' }}>Vitrine</span>
                <span className="font-black" style={{ color: '#38BDF8' }}>94%</span>
              </div>
              <div
                className="p-2 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: '#0F172A', borderColor: 'rgba(14, 165, 233, 0.2)' }}
              >
                <span className="font-bold" style={{ color: '#E2E8F0' }}>Funil/Roleta</span>
                <span className="font-black" style={{ color: '#38BDF8' }}>88%</span>
              </div>
              <div
                className="p-2 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: '#0F172A', borderColor: 'rgba(14, 165, 233, 0.2)' }}
              >
                <span className="font-bold" style={{ color: '#E2E8F0' }}>Agenda</span>
                <span className="font-black" style={{ color: '#38BDF8' }}>100%</span>
              </div>
              <div
                className="p-2 rounded-xl border flex items-center justify-between"
                style={{ backgroundColor: '#0F172A', borderColor: 'rgba(14, 165, 233, 0.2)' }}
              >
                <span className="font-bold" style={{ color: '#E2E8F0' }}>Automação</span>
                <span className="font-black" style={{ color: '#38BDF8' }}>91%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CHAT INTERATIVO DA SOFIA (100% NO PAINEL / ZERO REDIRECIONAMENTO WHATSAPP) ─── */}
      <div
        ref={containerChatRef}
        id="chat-interativo-sofia"
        className="rounded-3xl border border-sky-500/35 p-5 md:p-7 shadow-2xl space-y-5 animate-in fade-in duration-500 relative"
        style={{
          backgroundColor: '#070C12',
          backgroundImage:
            'radial-gradient(900px 300px at 15% 0%, rgba(14, 165, 233, 0.12), transparent 70%), linear-gradient(180deg, #070C12 0%, #04080D 100%)',
          color: '#ffffff',
        }}
      >
        {/* Cabeçalho do Chat */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-sky-500/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-sky-400 bg-slate-950 shadow-lg shadow-sky-500/20">
                <img src="/images/avatar-sofia.png" alt="Sofia" className="h-full w-full object-cover" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border-2 border-[#070C12]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-white" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                  Chat Interativo com a Sofia
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-[9.5px] font-black uppercase tracking-wider text-sky-300">
                  IA Especialista Online
                </span>
              </div>
              <p className="text-xs text-slate-300" style={{ color: '#cbd5e1' }}>
                Tire dúvidas de planos, regras comerciais, rotinas do funil e configurações em tempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10.5px]">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-bold text-emerald-300">
              ● 0 tokens nas perguntas rápidas
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 font-bold text-slate-300">
              Perguntas livres: <strong className="text-sky-300">{perguntasLivresUsadas} / {LIMITE_PERGUNTAS_LIVRES}</strong>
            </span>
          </div>
        </div>

        {/* Área de Mensagens com rolagem suave */}
        <div
          className="h-[360px] overflow-y-auto p-4 rounded-2xl space-y-4 border border-sky-500/20"
          style={{
            backgroundColor: '#090F16',
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.04) 0%, transparent 80%)',
          }}
        >
          {mensagensChat.map((msg) => {
            const ehUsuario = msg.autor === 'usuario';
            return (
              <div key={msg.id} className={`flex flex-col ${ehUsuario ? 'items-end' : 'items-start'} space-y-1`}>
                <div
                  className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-md ${
                    ehUsuario
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-[#0E1622] text-slate-100 rounded-tl-none border border-sky-500/30'
                  }`}
                >
                  {!ehUsuario && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-400 mb-2 border-b border-sky-500/20 pb-1.5">
                      <Sparkles size={12} /> Sofia · Especialista
                      {msg.zeroTokens && (
                        <span className="ml-auto text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ✓ Resposta Instantânea (0 tokens)
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-line space-y-2">
                    {msg.texto}
                  </div>

                  <div className={`flex items-center justify-end text-[9px] mt-2 ${ehUsuario ? 'text-sky-200' : 'text-slate-400'}`}>
                    <span>{msg.hora}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {carregandoIA && (
            <div className="flex items-start gap-2">
              <div className="max-w-[75%] rounded-2xl rounded-tl-none p-3.5 bg-[#0E1622] border border-sky-500/30 text-xs text-sky-200 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-sky-400" />
                <span>Sofia consultando o cérebro da plataforma...</span>
              </div>
            </div>
          )}

          <div ref={chatFimRef} />
        </div>

        {/* Pílulas de Perguntas Rápidas (0 tokens) */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block" style={{ color: '#94a3b8' }}>
            Perguntas Rápidas (Resposta Imediata · 0 tokens):
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'Como funciona a Roleta de Leads?',
              'O que entra no plano PRO?',
              'Como configuro meu WhatsApp?',
              'Como cadastrar imóvel na vitrine?',
            ].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => enviarPergunta(p)}
                disabled={carregandoIA}
                className="rounded-full border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 text-[11px] font-bold text-sky-200 transition hover:border-sky-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                “{p}”
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Entrada de Pergunta Livre */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviarPergunta();
          }}
          className="flex items-center gap-2 pt-2"
        >
          <input
            ref={inputChatRef}
            type="text"
            value={inputPergunta}
            onChange={(e) => setInputPergunta(e.target.value)}
            placeholder="Digite sua dúvida sobre planos, ferramentas ou configurações..."
            disabled={carregandoIA}
            className="flex-1 bg-[#090F16] border border-sky-500/30 focus:border-sky-400 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-slate-400 outline-none transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={carregandoIA || !inputPergunta.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-black px-5 py-3 text-xs uppercase tracking-wider transition shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Perguntar</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-6">
              <div
                style={{ backgroundColor: '#10b981' }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950"
              >
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-white font-black uppercase text-lg tracking-tight" style={{ color: '#ffffff' }}>
                  Agenda de Consultoria Imobiliária
                </h3>
                <p className="text-slate-300 text-xs font-medium" style={{ color: '#cbd5e1' }}>
                  Escolha o dia e o horário para alinhar sua operação de VGV e Leads
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
                  Selecione a Data:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={hojeBrasiliaISO()}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSucesso(null);
                  }}
                  aria-invalid={Boolean(bloqueio)}
                  aria-describedby={bloqueio ? 'aviso-data-bloqueada' : undefined}
                  className="w-full max-w-xs bg-[#020408] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-[#10b981] outline-none transition-all"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4 flex items-center gap-3 max-w-md">
                <div className="bg-[#10b981]/20 text-[#10b981] p-2 rounded-lg">
                  <Moon size={16} />
                </div>
                <div>
                  <p className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-1">
                    Plantão Noturno · {FUSO_ATENDIMENTO}
                  </p>
                  <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                    Atendemos das <strong className="text-white">20:30 às 23:00</strong>, depois do horário de
                    visita. Manhã e tarde ficam fechadas.
                  </p>
                </div>
              </div>
            </div>

            {/* Chave de administração — só para a conta master */}
            {ehAdmin && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Settings2 size={15} className="text-slate-400" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                      Modo Gerenciar Agenda
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Ligado: clicar num horário alterna{' '}
                      <strong className="text-slate-300">livre ⇄ reservado</strong> e salva na hora.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={gerenciar}
                  aria-label="Modo Gerenciar Agenda"
                  onClick={() => setGerenciar((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors ${
                    gerenciar ? 'border-[#10b981] bg-[#10b981]' : 'border-slate-700 bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      gerenciar ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            )}

            {bloqueio ? (
              <div
                id="aviso-data-bloqueada"
                role="status"
                className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] p-5 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-start gap-3">
                  <CalendarX2 size={18} className="mt-0.5 shrink-0 text-amber-300" />
                  <div>
                    <p className="mb-1 text-xs font-black uppercase tracking-widest text-amber-200">
                      Não atendemos nesse dia
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300">{bloqueio}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const proxima = proximaDataLivre();
                    if (proxima) setSelectedDate(proxima);
                  }}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:opacity-90"
                >
                  Ir para o próximo dia <ArrowRight size={13} />
                </button>
              </div>
            ) : null}

            {erroAgenda ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-[11px] text-red-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{erroAgenda}</span>
              </div>
            ) : null}

            {sucesso ? (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#10b981]/40 bg-[#10b981]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <CalendarCheck size={16} className="mt-0.5 shrink-0 text-[#10b981]" />
                  <div>
                    <p className="text-xs font-black text-white">
                      {sucesso.horario} reservado em {selectedDate.split('-').reverse().join('/')}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      O horário já está bloqueado para os outros. Garanta a conversa no WhatsApp.
                    </p>
                  </div>
                </div>
                <a
                  href={sucesso.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-xl bg-[#10b981] px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-slate-950 hover:opacity-90"
                >
                  Abrir WhatsApp
                </a>
              </div>
            ) : null}

            <div className={bloqueio ? 'pointer-events-none select-none opacity-30' : ''}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#10b981]">
                  <Clock size={14} /> Período da Noite · {FUSO_ATENDIMENTO}
                </h4>
                <span className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                  {carregandoAgenda ? 'carregando…' : `${resumo.livres} de ${resumo.total} livres`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {HORARIOS_ATENDIMENTO.map((horario) => (
                  <CartaoHorario key={horario} horario={horario} />
                ))}
              </div>

              {carregandoAgenda ? (
                <p className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                  <Loader2 size={11} className="animate-spin" /> Buscando a disponibilidade no servidor…
                </p>
              ) : (
                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  Horários <strong className="text-slate-300">ocupado</strong> já têm cliente confirmado;{' '}
                  <strong className="text-slate-300">reservado</strong> é bloqueio do especialista. Ambos atualizam
                  em tempo real.
                </p>
              )}
            </div>

            {/* Contato direto — canais oficiais (lib/contato.js) */}
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#020408] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#10b981]/15 p-2 text-[#10b981]">
                    <Mail size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">E-mail</p>
                    <a
                      href={linkEmail('Agenda - Suporte Especialista Imobi')}
                      className="text-xs font-bold text-[#10b981] underline decoration-dotted underline-offset-2 hover:text-white"
                    >
                      {EMAIL_INSTITUCIONAL}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#10b981]/15 p-2 text-[#10b981]">
                    <Phone size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">WhatsApp</p>
                    <a
                      href={linkWhatsApp('Olá! Preciso de ajuda com o Express Imobi Tech.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#10b981] underline decoration-dotted underline-offset-2 hover:text-white"
                    >
                      {WHATSAPP_SUPORTE_EXIBICAO}
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 sm:max-w-[240px] sm:text-right">
                Dúvida rápida? A Sofia responde na hora. Humano é para o que precisa de gente.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/90 border-2 border-[#10b981]/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 bg-[#10b981]/15 text-[#10b981] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-[#10b981]/30">
              🎁 Bônus de Onboarding
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Diagnóstico Inicial de Funil & VGV
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Sessão rápida de 20 minutos para configurar sua Roleta de Leads, cadastrar seus primeiros imóveis e
              validar o Portal do Cliente.
            </p>
            <button
              type="button"
              onClick={irParaPrimeiroLivre}
              style={{ backgroundColor: '#10b981' }}
              className="w-full py-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-90 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
            >
              Agendar Diagnóstico Grátis
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 bg-slate-800 text-emerald-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
              <Star size={11} className="text-[#10b981]" /> Implantação VIP
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
              Setup de IA Operacional & WhatsApp
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Acompanhamento individual com nossos especialistas para conectar a Pólen (secretária 24h),
              organizar os Agentes Operacionais com Zara e configurar o Tom como segundo cérebro estratégico.
            </p>
            <button
              type="button"
              onClick={irParaPrimeiroLivre}
              className="w-full py-4 rounded-xl bg-[#020408] border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-slate-950 font-black text-xs uppercase tracking-widest transition cursor-pointer"
            >
              Solicitar Setup Assistido
            </button>
          </div>
        </div>
      </div>

      {/* ─── Modal de reserva ──────────────────────────────────────────────── */}
      {reserva ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0a0f16] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#10b981]">Reservar horário</p>
                <h4 className="mt-1 text-lg font-black text-white">
                  {selectedDate.split('-').reverse().join('/')} às {reserva}
                </h4>
                <p className="text-[10px] text-slate-500">{FUSO_ATENDIMENTO}</p>
              </div>
              <button
                type="button"
                onClick={() => setReserva(null)}
                aria-label="Fechar"
                className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <User size={11} /> Seu nome
                </span>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Como devemos te chamar"
                  className="w-full rounded-xl border border-slate-800 bg-[#020408] p-3 text-sm text-white outline-none focus:border-[#10b981]"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Building2 size={11} /> Imobiliária
                </span>
                <input
                  value={form.imobiliaria}
                  onChange={(e) => setForm((f) => ({ ...f, imobiliaria: e.target.value }))}
                  placeholder="Nome da imobiliária (opcional para autônomo)"
                  className="w-full rounded-xl border border-slate-800 bg-[#020408] p-3 text-sm text-white outline-none focus:border-[#10b981]"
                />
              </label>

              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Phone size={11} /> WhatsApp com DDD
                </span>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="(34) 99999-9999"
                  inputMode="tel"
                  className="w-full rounded-xl border border-slate-800 bg-[#020408] p-3 text-sm text-white outline-none focus:border-[#10b981]"
                />
              </label>
            </div>

            {erroForm ? (
              <p className="mt-3 flex items-start gap-1.5 text-[11px] text-red-300">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {erroForm}
              </p>
            ) : null}

            <button
              type="button"
              onClick={confirmarReserva}
              disabled={Boolean(salvandoHorario)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] py-3.5 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:opacity-90 disabled:opacity-60"
            >
              {salvandoHorario ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
              {salvandoHorario ? 'Reservando…' : 'Confirmar reserva'}
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              O horário é bloqueado para outras pessoas assim que você confirmar.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
