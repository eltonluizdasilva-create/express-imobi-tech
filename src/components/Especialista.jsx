import React, { useCallback, useEffect, useMemo, useState } from 'react';
import HeroAba from './admin/HeroAba';
import {
  Calendar,
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

  // A Pólen mora na aba `agentes_ia` (mesma tela do simulador). O painel passa
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
      livre: 'border-[#10b981]/45 bg-[#10b981]/[0.07] text-white hover:border-[#10b981] hover:bg-[#10b981]/15',
      reservado: 'border-amber-500/45 bg-amber-500/[0.08] text-amber-100',
      ocupado: 'border-slate-800 bg-slate-900/50 text-slate-500',
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
        <span className="text-sm font-black tabular-nums">{horario}</span>
        {salvando ? (
          <Loader2 size={11} className="animate-spin" />
        ) : status === 'livre' ? (
          <span className="text-[7.5px] font-black uppercase tracking-[0.14em] opacity-70">
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
      style={{ backgroundColor: '#020408' }}
      className="min-h-screen text-white font-sans p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500 rounded-3xl"
    >
      <div className="text-center mb-8 pt-4">
        <HeroAba
          flat
          icone={Sparkles}
          chip="Mentoria Executiva Express Imobi Tech"
          titulo="Suporte com Especialista Imobiliário"
          subtitulo="Escale seu VGV, estruture a Roleta de Leads da sua equipe e configure o Esquadrão de IA no WhatsApp com acompanhamento especializado."
          cor="#10b981"
        />
      </div>

      {/* ── Pólen: primeiro canal, antes de qualquer humano ───────────────── */}
      <div className="mb-10 overflow-hidden rounded-3xl border border-[#10b981]/35 bg-gradient-to-r from-[#10b981]/[0.14] via-[#10b981]/[0.05] to-transparent p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex flex-1 items-start gap-3">
            <div className="shrink-0 rounded-2xl bg-[#10b981] p-2.5 text-slate-950">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#10b981]">
                Primeiro canal · dúvida na hora
              </p>
              <h3 className="mt-1 text-base font-black text-white">
                A Pólen tem a base completa do Express Imobi Tech
              </h3>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300">
                Ela foi treinada com o produto inteiro e com a operação imobiliária: módulos e o que cada plano
                libera, VGV e comissão, funil e Roleta de Leads, documentação, vitrine, Portal do Cliente e os
                agentes de IA. Pergunte ali mesmo — responde em segundos, sem esperar atendimento humano.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[
                  'Como funciona a Roleta de Leads?',
                  'O que entra no Essencial Plus?',
                  'Como publico um imóvel na vitrine?',
                ].map((exemplo) => (
                  <button
                    key={exemplo}
                    type="button"
                    onClick={abrirPolen}
                    title="Abrir a Pólen para perguntar isso"
                    className="rounded-full border border-[#10b981]/35 bg-[#10b981]/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200 transition hover:border-[#10b981] hover:text-white"
                  >
                    “{exemplo}”
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={abrirPolen}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:opacity-90"
          >
            Testar a Pólen agora <ArrowRight size={13} />
          </button>
        </div>
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
                <h3 className="text-white font-black uppercase text-lg tracking-tight">
                  Agenda de Consultoria Imobiliária
                </h3>
                <p className="text-slate-400 text-xs font-medium">
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
                Dúvida rápida? A Pólen responde na hora. Humano é para o que precisa de gente.
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
              Setup Esquadrão IA & WhatsApp
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Acompanhamento individual com nossos especialistas para conectar o Pólen (Atendimento 24h) e o Tom
              (Maestro da Imobiliária) na sua imobiliária.
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
