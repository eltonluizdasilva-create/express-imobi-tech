import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import HeroAba from './HeroAba';
import GrafoSegundoCerebro from './GrafoSegundoCerebro';
import NucleoTomJarvis from './NucleoTomJarvis';
import { getPlano, precoNoCiclo, WHATSAPP_COMERCIAL } from '../../lib/planos';
import { cabecalhosIA } from '../../lib/aiAuth';
import { ACOES_TOM, responderTomSimulacao } from '../../lib/simuladorTom';
import { LIMITE_DEMO_TOM, podeUsarDemo, registrarUsoDemo, restantesDemo } from '../../lib/limiteDemo';
import { carregarRegrasTom, salvarRegrasTom, REGRAS_TOM_PADRAO } from '../../lib/regrasTom';

/**
 * ExpressBrainTab — aba `brain` (Tom · segundo cérebro estratégico).
 *
 * O ID interno continua `brain` e os gates continuam `temExpressBrain` / `brainAtivo` —
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
  'Sou o Tom, seu segundo cérebro estratégico. Escolha uma das quatro ações abaixo ou escreva sua pergunta: eu leio o contexto da operação e apoio sua decisão.';
// D-22.09 — o Tom deixou de ser um único produto dentro do pacote Operação IA.
// Agora são dois degraus com preço próprio, lidos do catálogo compartilhado.
const PLANO_TOM_AUTONOMO = getPlano('tom_autonomo');
const PLANO_TOM_IMOBILIARIA = getPlano('tom_imobiliaria');
const PRECO_TOM_AUTONOMO = `${precoNoCiclo(PLANO_TOM_AUTONOMO)}${PLANO_TOM_AUTONOMO.periodo}`;
const PRECO_TOM_IMOBILIARIA = `${precoNoCiclo(PLANO_TOM_IMOBILIARIA)}${PLANO_TOM_IMOBILIARIA.periodo}`;

export default function ExpressBrainTab({
  liberado = false,
  setAbaAtiva = () => {},
  dadosOficina = null,
  contextoOperacao = {},
  tenantId = '',
  db = null,
  isPro = false,
  adminTotal = false,
  plano = 'gratis',
}) {
  const zap = String(WHATSAPP_COMERCIAL || '').replace(/\D/g, '');
  const nomeOficina = dadosOficina?.nomeOficina || dadosOficina?.nomeImobiliaria || '';

  // ---- Nó Selecionado no Centro Neural (Jarvis) ---------------------------
  const [noSelecionado, setNoSelecionado] = useState(null);

  // ---- Regras Comerciais da Casa (Tom + Zara) -----------------------------
  const [painelRegrasAberto, setPainelRegrasAberto] = useState(true);
  const [regras, setRegras] = useState(REGRAS_TOM_PADRAO);
  const [salvandoRegras, setSalvandoRegras] = useState(false);
  const [sucessoRegras, setSucessoRegras] = useState('');
  const [erroRegras, setErroRegras] = useState('');

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const dados = await carregarRegrasTom(tenantId, db);
        if (ativo && dados) {
          setRegras(dados);
        }
      } catch (err) {
        console.warn('Erro ao carregar regras Tom:', err);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [tenantId, db]);

  const handleSalvarRegras = async (e) => {
    if (e) e.preventDefault();
    setSalvandoRegras(true);
    setErroRegras('');
    setSucessoRegras('');
    try {
      const atualizado = await salvarRegrasTom(tenantId, regras, db);
      setRegras(atualizado);
      setSucessoRegras('Regras comerciais da casa salvas com sucesso no Firestore!');
      setTimeout(() => setSucessoRegras(''), 4000);
    } catch (err) {
      setErroRegras(`Erro ao salvar regras: ${err.message || 'tente novamente'}`);
    } finally {
      setSalvandoRegras(false);
    }
  };

  // ---- Simulador do Tom (motor real via /api/ai) -------------------------
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [restantes, setRestantes] = useState(() => restantesDemo('tom', LIMITE_DEMO_TOM));
  const [historico, setHistorico] = useState(() => [{ autor: 'ia', texto: SAUDACAO_TOM }]);
  const fimRef = useRef(null);
  const simuladorRef = useRef(null);

  const podeFalar = liberado || podeUsarDemo('tom', { liberado, limite: LIMITE_DEMO_TOM });
  const consultasFeitas = Math.max(0, LIMITE_DEMO_TOM - restantes);

  const consultarTom = useCallback(
    async (pergunta) => {
      const texto = String(pergunta || '').trim();
      if (!texto || enviando) return;
      if (!podeUsarDemo('tom', { liberado, limite: LIMITE_DEMO_TOM })) {
        setRestantes(0);
        setErro(
          `Você usou as ${LIMITE_DEMO_TOM} consultas gratuitas de teste do Tom. Contrate o módulo para seguir conversando com o Maestro.`
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
          contexto: {
            ...(contextoOperacao || {}),
            regrasComerciais: regras,
            resumoNo: noSelecionado?.resumoContexto || null,
          },
          nomeImobiliaria: nomeOficina,
          cabecalhos: await cabecalhosIA(),
        });

        if (!resultado.ok) {
          setErro(resultado.erro);
          return;
        }

        if (!liberado) {
          registrarUsoDemo('tom');
          setRestantes(restantesDemo('tom', LIMITE_DEMO_TOM));
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
    [contextoOperacao, enviando, historico, liberado, noSelecionado, nomeOficina, regras]
  );

  // Seleção de pergunta via Núcleo Jarvis: preenche o campo de comando sem chamada automática
  const handleSelecionarPerguntaDoNucleo = useCallback((pergunta, no) => {
    setMsg(pergunta);
    setNoSelecionado(no);
    try {
      simuladorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      /* ambiente sem layout */
    }
  }, []);

  const reiniciar = () => {
    setMsg('');
    setErro('');
    setHistorico([{ autor: 'ia', texto: SAUDACAO_TOM }]);
  };

  const falarComercial = () => {
    const texto = [
      'Olá! Quero falar sobre o Tom (Segundo Cérebro Estratégico) do Express Imobi Tech.',
      nomeOficina ? `Imobiliária: ${nomeOficina}.` : '',
      `Podemos falar do Tom Autônomo (${PRECO_TOM_AUTONOMO}) e do Tom Imobiliária (${PRECO_TOM_IMOBILIARIA} + implantação)?`,
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
        destaque="Segundo Cérebro Estratégico"
        chip="Visão estratégica da operação"
        subtitulo="O Tom atua como segundo cérebro e sócio estratégico, apoiando decisões com base nas regras comerciais da casa."
        cor="#f59e0b"
      />

      {/* ─── NÚCLEO TOM JARVIS (CENTRO DE COMANDO NEURAL) ───────────────── */}
      <NucleoTomJarvis
        plano={plano}
        isPro={isPro}
        liberado={liberado}
        adminTotal={adminTotal}
        estadoProcessamento={enviando}
        onSelecionarPergunta={handleSelecionarPerguntaDoNucleo}
        onTextoVoz={(texto) => setMsg(texto)}
        noSelecionado={noSelecionado}
        setNoSelecionado={setNoSelecionado}
      />

      {/* ─── PAINEL COLAPSÁVEL: REGRAS COMERCIAIS DA CASA (TOM) ────────────── */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#020408] shadow-lg shadow-black/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setPainelRegrasAberto((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 md:p-5 bg-slate-900/90 hover:bg-slate-900 border-b border-emerald-500/20 text-left transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#10b981]">
              <ScrollText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-black tracking-tight text-white">
                  Regras Comerciais da Casa
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider text-[#10b981]">
                  Ativo no Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Limites operacionais, SLA de resposta e políticas que guiam Tom e Zara.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-xs font-semibold hidden sm:inline">
              {painelRegrasAberto ? 'Recolher' : 'Expandir'}
            </span>
            {painelRegrasAberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {painelRegrasAberto && (
          <form onSubmit={handleSalvarRegras} className="p-4 md:p-6 space-y-5 bg-[#020408]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Comissão Padrão da Imobiliária (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="30"
                    value={regras.comissaoPadrao ?? 6}
                    onChange={(e) => setRegras((prev) => ({ ...prev, comissaoPadrao: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10b981]"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Desconto Máximo Permitido (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={regras.descontoMaximo ?? 5}
                    onChange={(e) => setRegras((prev) => ({ ...prev, descontoMaximo: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10b981]"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  SLA Atendimento a Novos Leads (minutos)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="1440"
                    value={regras.slaAtendimentoMinutos ?? 15}
                    onChange={(e) => setRegras((prev) => ({ ...prev, slaAtendimentoMinutos: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10b981]"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">min</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alerta Imóvel Parado Sem Giro (dias)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="365"
                    value={regras.diasAlertaImovelParado ?? 30}
                    onChange={(e) => setRegras((prev) => ({ ...prev, diasAlertaImovelParado: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#10b981]"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">dias</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Política de Permuta
                </label>
                <textarea
                  rows={2}
                  value={regras.politicaPermuta ?? ''}
                  onChange={(e) => setRegras((prev) => ({ ...prev, politicaPermuta: e.target.value }))}
                  placeholder="Ex: Aceita até 30% em veículos ou imóveis de menor valor avaliados pela casa..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Regras Gerais da Equipe e Observações
                </label>
                <textarea
                  rows={2}
                  value={regras.regrasEquipe ?? ''}
                  onChange={(e) => setRegras((prev) => ({ ...prev, regrasEquipe: e.target.value }))}
                  placeholder="Ex: Todo lead recebido deve ser contatado em até 15 minutos. Propostas exigem laudo..."
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            {sucessoRegras && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-[#10b981]">
                <CheckCircle2 size={16} />
                <span>{sucessoRegras}</span>
              </div>
            )}

            {erroRegras && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {erroRegras}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={salvandoRegras}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save size={15} />
                <span>{salvandoRegras ? 'Salvando...' : 'Salvar Regras da Casa'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── SIMULADOR INTERATIVO DO TOM ────────────────────────────────── */}
      <div
        ref={simuladorRef}
        id="simulador-tom"
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-white">
            <Sparkles size={16} className="text-amber-400" /> Simulador do Tom (IA real)
          </h2>
          <div className="flex items-center gap-2">
            {!liberado && (
              <span
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white"
                title="Consultas de teste para validar o Tom com a equipe"
              >
                {Math.min(consultasFeitas, LIMITE_DEMO_TOM)}/{LIMITE_DEMO_TOM} consultas de teste
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
              <Lock size={11} /> Limite de testes atingido
            </span>
            <p className="min-w-0 flex-1 text-[11px] text-amber-100/90">
              Você usou as {LIMITE_DEMO_TOM} consultas de teste do Tom. Contrate o módulo para o
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
          <strong className="font-black">Produtos contratados separadamente:</strong> a{' '}
          <strong className="font-black">Pólen</strong> atende e qualifica o cliente no WhatsApp 24h. O{' '}
          <strong className="font-black">Tom</strong> guarda regras comerciais, acompanha a operação e
          tem versões Autônomo e Imobiliária. Um produto não está incluído no outro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-300">
            Tom Autônomo · Segundo Cérebro Empacotado
          </h3>
          <p className="mt-1 text-lg font-black text-white">{PRECO_TOM_AUTONOMO}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {PLANO_TOM_AUTONOMO.setup}
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Molde pronto e clonável, conectado por QR Code ao WhatsApp do corretor que trabalha sozinho:
            rotina do dia, cobrança de follow-up, roteiros de vídeo e copy.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300">
            Tom Imobiliária · Operação Customizada
          </h3>
          <p className="mt-1 text-lg font-black text-white">{PRECO_TOM_IMOBILIARIA}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            {PLANO_TOM_IMOBILIARIA.setup}
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Cérebro adaptado sob medida para imobiliárias e equipes: regras de comissão, metas, auditoria de
            funil, governança de equipe e imóveis parados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PILARES.map(({ icon: Icone, titulo, texto }) => (
          <div key={titulo} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                {React.createElement(Icone, { size: 17 })}
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
            Tom · Segundo Cérebro Estratégico
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Tom Autônomo por {PRECO_TOM_AUTONOMO} (sem implantação) ou Tom Imobiliária por{' '}
            {PRECO_TOM_IMOBILIARIA} {PLANO_TOM_IMOBILIARIA.setup ? `+ ${PLANO_TOM_IMOBILIARIA.setup}` : ''}.
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
