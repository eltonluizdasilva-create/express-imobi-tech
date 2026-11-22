import React, { useCallback, useRef, useState } from 'react';
import {
  Brain,
  Lock,
  ScrollText,
  Workflow,
  ShieldCheck,
  Database,
  ArrowUpRight,
  MessageCircle,
  Clock,
  Sparkles,
  Send,
  RotateCcw,
  Wand2,
} from 'lucide-react';
import HeroAba from './HeroAba';
import { WHATSAPP_COMERCIAL } from '../../lib/planos';
import { cabecalhosIA } from '../../lib/aiAuth';
import { ACOES_TOM, responderTomSimulacao } from '../../lib/simuladorTom';
import { LIMITE_DEMO, podeUsarDemo, registrarUsoDemo, restantesDemo } from '../../lib/limiteDemo';

/**
 * ExpressBrainTab — aba `brain` (módulo TOM · MAESTRO DA IMOBILIÁRIA).
 *
 * Nome comercial (D-22.02): **Tom · Maestro da Imobiliária**. O ID interno
 * continua `brain` e os gates continuam `temExpressBrain` / `brainAtivo` —
 * renomear a rota quebraria deep link, tour e webhook.
 *
 * O simulador fala com o motor real (`src/lib/simuladorTom.js` → `/api/ai`).
 * Conta sem o módulo tem 5 consultas de demonstração por navegador
 * (`src/lib/limiteDemo.js`); conta com o módulo não tem contador. Sem carteira
 * cadastrada, o Tom usa o cenário "Imobiliária Horizonte" e é obrigado a
 * avisar que os números são de demonstração.
 */
const PILARES = [
  {
    icon: ScrollText,
    titulo: 'Regras comerciais',
    texto:
      'Desconto máximo, permuta, sinal, exclusividade e política de comissão ficam escritos uma vez e passam a valer para a equipe inteira — sem "cada corretor negocia do seu jeito".',
  },
  {
    icon: Workflow,
    titulo: 'Processos',
    texto:
      'O passo a passo da casa: captação, documentação, visita, proposta, contrato e repasse. O Tom sabe em que etapa cada negócio está e o que falta para andar.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Auditoria de equipe',
    texto:
      'Quem respondeu, quem deixou o lead parado e quem prometeu o que não podia. A leitura da operação sai do achismo e vira registro.',
  },
  {
    icon: Database,
    titulo: 'Memória operacional',
    texto:
      'O histórico da imobiliária deixa de morar na cabeça do dono: imóvel que já deu problema, cliente que não paga, condomínio que atrasa a venda.',
  },
];

const SAUDACAO_TOM =
  'Sou o Tom, o Maestro da Imobiliária. Escolha uma das quatro ações abaixo ou escreva a sua pergunta: eu leio a sua operação e devolvo o que fazer primeiro, com quem executa.';

export default function ExpressBrainTab({
  liberado = false,
  sofiaContratada = false,
  setAbaAtiva = () => {},
  dadosOficina = null,
  contextoOperacao = {},
}) {
  const zap = String(WHATSAPP_COMERCIAL || '').replace(/\D/g, '');
  const nomeOficina = dadosOficina?.nomeOficina || dadosOficina?.nomeImobiliaria || '';

  // ---- Simulador do Tom (motor real via /api/ai) -------------------------
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [restantes, setRestantes] = useState(() => restantesDemo('tom'));
  const [historico, setHistorico] = useState(() => [{ autor: 'ia', texto: SAUDACAO_TOM }]);
  const fimRef = useRef(null);

  const podeFalar = liberado || podeUsarDemo('tom', { liberado });
  const consultasFeitas = Math.max(0, LIMITE_DEMO - restantes);

  const consultarTom = useCallback(
    async (pergunta) => {
      const texto = String(pergunta || '').trim();
      if (!texto || enviando) return;
      if (!podeUsarDemo('tom', { liberado })) {
        setRestantes(0);
        setErro(
          `Você usou as ${LIMITE_DEMO} consultas gratuitas do Tom. Contrate o módulo para seguir conversando com o Maestro.`
        );
        return;
      }

      setMsg('');
      setErro('');
      const historicoAnterior = historico;
      setHistorico((prev) => [...prev, { autor: 'cliente', texto }]);
      setEnviando(true);

      try {
        const resultado = await responderTomSimulacao({
          mensagem: texto,
          historico: historicoAnterior,
          contexto: contextoOperacao || {},
          nomeImobiliaria: nomeOficina,
          cabecalhos: await cabecalhosIA(),
        });

        if (!resultado.ok) {
          setErro(resultado.erro);
          return;
        }

        if (!liberado) {
          registrarUsoDemo('tom');
          setRestantes(restantesDemo('tom'));
        }
        setHistorico((prev) => [...prev, { autor: 'ia', texto: resultado.texto }]);
        setTimeout(() => {
          try {
            fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } catch {
            /* ambiente sem layout */
          }
        }, 60);
      } catch (e) {
        setErro(e?.message || 'Falha inesperada ao chamar o Tom.');
      } finally {
        setEnviando(false);
      }
    },
    [contextoOperacao, enviando, historico, liberado, nomeOficina]
  );

  const reiniciar = () => {
    setMsg('');
    setErro('');
    setHistorico([{ autor: 'ia', texto: SAUDACAO_TOM }]);
  };

  const falarComercial = () => {
    const texto = [
      'Olá! Quero falar sobre o Tom · Maestro da Imobiliária (Operação IA) do Express Imobi Tech.',
      nomeOficina ? `Imobiliária: ${nomeOficina}.` : '',
      'Podemos falar sobre o escopo e o valor a partir de R$ 497/mês + implantação?',
    ]
      .filter(Boolean)
      .join('\n');
    window.open(`https://wa.me/${zap}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <HeroAba
        icone={Brain}
        titulo="Tom ·"
        destaque="Maestro da Imobiliária"
        chip="Central de Inteligência da Imobiliária"
        subtitulo="O Tom rege a operação: regras comerciais, processos, auditoria da equipe e o histórico que hoje vive na cabeça do dono."
        cor="#f59e0b"
      />

      {/* Placeholder assumido: o produto ainda está em implantação. */}
      <div className="tarja-aviso flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
          <Clock size={12} /> Em implantação
        </span>
        <p className="text-xs text-amber-100/90">
          A base de regras, processos e auditoria entra nas próximas entregas. O simulador abaixo já
          responde pelo motor real de IA — nada aqui altera dados da sua operação.
        </p>
      </div>

      {/* ─── SIMULADOR INTERATIVO DO TOM ────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-white">
            <Sparkles size={16} className="text-amber-400" /> Simulador do Tom (IA real)
          </h2>
          <div className="flex items-center gap-2">
            {!liberado && (
              <span
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white"
                title="Consultas gratuitas de demonstração neste navegador"
              >
                {Math.min(consultasFeitas, LIMITE_DEMO)}/{LIMITE_DEMO} consultas de demonstração
              </span>
            )}
            <button
              type="button"
              onClick={reiniciar}
              className="cursor-pointer rounded-lg border border-slate-700 bg-[#020408] px-2.5 py-1 text-[10px] font-bold text-slate-300 transition hover:border-amber-400 hover:text-amber-300"
            >
              <RotateCcw size={11} className="mr-1 inline" /> Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-3 h-[240px] space-y-3 overflow-y-auto pr-1">
          {historico.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[92%] whitespace-pre-line rounded-2xl p-3 text-xs ${
                m.autor === 'cliente'
                  ? 'ml-auto bg-emerald-500 text-white'
                  : 'border border-slate-800 bg-[#020408] text-slate-200'
              }`}
            >
              {m.texto}
            </div>
          ))}
          {enviando && (
            <div className="max-w-[92%] rounded-2xl border border-slate-800 bg-[#020408] p-3 text-xs text-slate-400">
              Tom está lendo a operação…
            </div>
          )}
          {erro && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-[11px] text-red-300">
              {erro}
            </div>
          )}
          <div ref={fimRef} />
        </div>

        {!podeFalar && (
          <div className="tarja-aviso mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300">
              <Lock size={11} /> Limite gratuito atingido
            </span>
            <p className="min-w-0 flex-1 text-[11px] text-amber-100/90">
              Você usou as {LIMITE_DEMO} consultas de demonstração do Tom. Contrate o módulo para o
              Maestro ler a sua operação de verdade.
            </p>
            <button
              type="button"
              onClick={() => setAbaAtiva('meuplano')}
              className="rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:bg-amber-400"
            >
              Contratar o Tom
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {ACOES_TOM.map((acao) => (
            <button
              key={acao.key}
              type="button"
              disabled={!podeFalar || enviando}
              onClick={() => consultarTom(acao.pergunta)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[10.5px] font-bold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Wand2 size={11} /> {acao.rotulo}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            consultarTom(msg);
          }}
          className="mt-3 flex gap-2 border-t border-slate-800 pt-3"
        >
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            disabled={!podeFalar || enviando}
            placeholder="Ex: o que eu cobro do corretor que deixou 6 leads sem resposta?"
            className="w-full flex-1 rounded-xl border border-slate-700 bg-[#020408] px-3 py-2 text-xs text-white disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!podeFalar || enviando}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
        <p className="mt-2 text-[10px] text-slate-500">
          O Tom responde com regras e diagnóstico operacional. Não é parecer jurídico, contábil ou
          tributário — isso é do advogado (OAB) e do contador (CRC).
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-white md:text-2xl">
          O que o Tom <span className="text-amber-400">rege</span> na imobiliária
        </h2>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-400 md:text-sm">
          Hoje a operação funciona porque o dono lembra. Quando ele sai de férias, o padrão muda:
          corretor novo negocia diferente, ninguém sabe qual processo está travado e a mesma discussão
          volta todo mês. O Tom guarda as decisões da casa e devolve isso para a equipe e para os
          agentes de IA no formato certo, na hora certa.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-6 text-amber-200/90">
          <strong className="font-black">Como o Tom se diferencia da Pólen:</strong> a{' '}
          <strong className="font-black">Pólen</strong> atende e qualifica o cliente no WhatsApp 24h. O{' '}
          <strong className="font-black">Tom</strong> é o maestro: guarda as regras comerciais, vigia
          imóveis e leads parados e mantém a equipe no mesmo padrão.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-6 text-amber-200/90">
          <strong className="font-black">Módulo independente:</strong> o Tom pode ser contratado sozinho
          — inclusive por quem já usa outro CRM — ou combinado com a Pólen. Um não inclui o outro, e a
          implantação assistida é cobrada à parte.
        </p>
      </div>

      {/* Formas de contratar: só Tom, só Pólen, ou combo. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            titulo: 'Só o Tom',
            preco: 'R$ 497+ /mês',
            texto:
              'Para quem já tem atendimento (ou outro CRM) e quer só o maestro: regras, processos, auditoria e memória operacional. Implantação assistida à parte.',
          },
          {
            titulo: 'Só a Pólen',
            preco: 'R$ 450+ /mês',
            texto:
              'Atendimento IA 24h no WhatsApp oficial, com QR Code e distribuição de leads. Não inclui o Tom.',
          },
          {
            titulo: 'Combo Pólen + Tom',
            preco: 'Sob proposta',
            texto:
              'A Pólen atende lendo as regras e a memória da casa, e o Tom audita o que a equipe prometeu. Escopo e implantação definidos em conjunto.',
          },
        ].map((item) => (
          <div
            key={item.titulo}
            className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-300">
              {item.titulo}
            </h3>
            <p className="mt-1 text-lg font-black text-white">{item.preco}</p>
            <p className="mt-2 flex-1 text-xs leading-6 text-slate-400">{item.texto}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PILARES.map(({ icon: Icone, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Icone size={17} />
              </span>
              <h3 className="text-sm font-black uppercase tracking-tight text-white">{titulo}</h3>
            </div>
            <p className="text-xs leading-6 text-slate-400">{texto}</p>
          </div>
        ))}
      </div>

      {/* Bloqueio/upgrade — mesmo padrão da Pólen: cartão escuro, cadeado,
          benefícios e CTA para Meu Plano / comercial. */}
      {!liberado && (
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#020408] p-6 text-center shadow-[0_20px_60px_-30px_rgba(16,185,129,0.5)] md:p-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15">
            <Lock size={34} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white md:text-xl">
            Tom · Maestro da Imobiliária · módulo independente
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {sofiaContratada ? (
              <>
                Sua <span className="font-black text-emerald-400">Pólen</span> está ativa, mas o Tom é um
                módulo <span className="font-black text-white">separado</span>: custa a partir de{' '}
                <span className="font-black text-emerald-400">R$ 497/mês + implantação assistida</span> e
                não vem no pacote da Pólen.
              </>
            ) : (
              <>
                Contratável sozinho a partir de{' '}
                <span className="font-black text-emerald-400">R$ 497/mês + implantação assistida</span> —
                inclusive por quem já usa outro CRM — ou em combo com a Pólen. Um módulo não inclui o
                outro.
              </>
            )}
          </p>

          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
            {[
              'Regras comerciais da casa',
              'Processos e etapas por negócio',
              'Auditoria do atendimento da equipe',
              'Memória operacional consultável',
              'Pólen e agentes lendo as regras reais',
              'Implantação acompanhada',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] font-bold text-slate-200"
              >
                <Sparkles size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setAbaAtiva('meuplano')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-emerald-400"
            >
              <ArrowUpRight size={14} /> Ver planos e fazer upgrade
            </button>
            <button
              type="button"
              onClick={falarComercial}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-transparent px-5 py-2.5 text-xs font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/10"
            >
              <MessageCircle size={14} /> Falar com especialista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
