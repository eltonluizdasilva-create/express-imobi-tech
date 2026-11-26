/**
 * src/components/imobi/SimuladorPolen.jsx — telemóvel interativo da Pólen.
 * ============================================================================
 * Substitui o mockup estático de celular que ficava ao lado do QR Code em
 * `src/components/Secretaria.jsx`. O que aparece na tela é o MESMO motor do
 * simulador da seção de IA do painel (`AdminNovo.jsx`):
 *
 *   1. `responderSofiaSimulacao()` (`src/lib/simuladorSofia.js`) → `/api/ai`
 *      com o prompt de produção (`sofiaPrompt.js`) em `modo: 'simulacao'`;
 *   2. catálogo real do tenant (`imoveis_imobi`), já filtrado por
 *      disponibilidade — vendido/alugado/inativo nunca é oferecido;
 *   3. limite comercial de 5 mensagens por navegador (`src/lib/limiteDemo.js`,
 *      chave `expressdemo:polen`); conta com o módulo contratado não tem
 *      contador;
 *   4. as 3 perguntas rápidas de `ACOES_POLEN` e o handoff discreto
 *      (`descreverHandoff`).
 *
 * Nada é inventado: preço, taxa e parcela só saem do cadastro. Sem catálogo a
 * função recusa a chamada e a tela pede o primeiro cadastro.
 *
 * TEMA CLARO: a barra do topo é verde-escura nos dois temas, então título e
 * status usam as classes `whatsapp-barra-titulo` / `whatsapp-barra-status`,
 * presas a `color: #fff` / `#a7f3d0` em `src/index.css`. Sem isso a camada
 * `tema-claro` escureceria o `text-white` e o cabeçalho ficaria ilegível.
 * ============================================================================
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Lock, RotateCcw, Send, Sparkles } from 'lucide-react';
import { cabecalhosIA } from '../../lib/aiAuth';
import {
  ACOES_POLEN,
  AVISO_CATALOGO_VAZIO,
  AVISO_SEM_DISPONIVEIS,
  descreverHandoff,
  filtrarCatalogoDisponivel,
  responderSofiaSimulacao,
} from '../../lib/simuladorSofia';
import { obterRespostaRapida0Tokens } from '../../data/cerebroPolen';
import { LIMITE_DEMO, podeUsarDemo, registrarUsoDemo, restantesDemo } from '../../lib/limiteDemo';

/** Saudação fixa: é a única frase do fio que não vem da IA. */
export const SAUDACAO_POLEN_SIMULACAO =
  'Olá! Sou a Pólen, secretária comercial 24h da sua imobiliária no WhatsApp. Teste como se fosse um cliente interessado em um imóvel — posso tirar dúvidas sobre valores, condomínio, localização e agendar visitas com base no seu catálogo real.';

function horaAgora() {
  try {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const historicoInicial = () => [{ autor: 'ia', texto: SAUDACAO_POLEN_SIMULACAO, hora: horaAgora() }];

export default function SimuladorPolen({
  catalogoImoveis = [],
  nomeImobiliaria = '',
  nomeCorretor = '',
  liberado = false,
  onAbrirPlanos = null,
  onAbrirCaptacao = null,
  className = '',
}) {
  const [msg, setMsg] = useState('');
  const [historico, setHistorico] = useState(historicoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [gatilho, setGatilho] = useState(null);
  const [restantes, setRestantes] = useState(() => restantesDemo('polen'));
  const fimRef = useRef(null);

  const disponiveis = useMemo(
    () => filtrarCatalogoDisponivel(Array.isArray(catalogoImoveis) ? catalogoImoveis : []),
    [catalogoImoveis]
  );
  const totalCadastrado = Array.isArray(catalogoImoveis) ? catalogoImoveis.length : 0;
  const bloqueado = !liberado && restantes <= 0;
  const podeFalar = !bloqueado;

  const rolarParaFim = useCallback(() => {
    try {
      fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      /* ambiente sem layout (SSR/teste) */
    }
  }, []);

  useEffect(() => {
    rolarParaFim();
  }, [historico, enviando, erro, rolarParaFim]);

  const enviar = useCallback(
    async (mensagemBruta) => {
      const mensagem = String(mensagemBruta || '').trim();
      if (!mensagem || enviando) return;

      // Resposta rápida 0 tokens (Cérebro da Pólen):
      // Para perguntas rápidas de demonstração como "Tenho interesse, mas preciso financiar",
      // responde instantaneamente sem queimar tokens e apresentando o fechamento oficial com os 7 pontos validados.
      const imovelRef = disponiveis[0] || (Array.isArray(catalogoImoveis) ? catalogoImoveis[0] : null) || {};
      const resposta0Tokens = obterRespostaRapida0Tokens({
        mensagem,
        imovel: imovelRef,
        nomeImobiliaria,
        nomeCorretor,
      });

      if (resposta0Tokens) {
        setMsg('');
        setErro('');
        setGatilho(null);
        setHistorico((prev) => [
          ...prev,
          { autor: 'cliente', texto: mensagem, hora: horaAgora() },
          { autor: 'ia', texto: resposta0Tokens, hora: horaAgora() },
        ]);
        return;
      }

      if (!podeUsarDemo('polen', { liberado })) {
        setRestantes(0);
        setErro(
          `Você usou as ${LIMITE_DEMO} mensagens gratuitas de demonstração da Pólen. Contrate o módulo de atendimento 24h para falar com ela sem limite.`
        );
        return;
      }

      setMsg('');
      setErro('');
      setGatilho(null);
      const historicoAnterior = historico;
      setHistorico((prev) => [...prev, { autor: 'cliente', texto: mensagem, hora: horaAgora() }]);
      setEnviando(true);

      try {
        const resultado = await responderSofiaSimulacao({
          mensagem,
          historico: historicoAnterior,
          catalogoImoveis,
          nomeImobiliaria,
          nomeCorretor,
          cabecalhos: await cabecalhosIA(),
        });

        if (!resultado.ok) {
          setErro(resultado.erro);
          return;
        }

        if (!liberado) {
          registrarUsoDemo('polen');
          setRestantes(restantesDemo('polen'));
        }
        setHistorico((prev) => [...prev, { autor: 'ia', texto: resultado.texto, hora: horaAgora() }]);
        setGatilho(descreverHandoff(resultado.gatilho));
      } catch (e) {
        setErro(e?.message || 'Falha inesperada ao chamar a Pólen.');
      } finally {
        setEnviando(false);
      }
    },
    [catalogoImoveis, enviando, historico, liberado, nomeCorretor, nomeImobiliaria]
  );

  const reiniciar = () => {
    setMsg('');
    setErro('');
    setGatilho(null);
    setHistorico(historicoInicial());
  };

  const mensagensFeitas = Math.min(Math.max(0, LIMITE_DEMO - restantes), LIMITE_DEMO);

  return (
    <div className={className}>
      {/* Barra de controle do simulador (fora do telemóvel) */}
      <div className="mx-auto mb-2 flex w-full max-w-[340px] flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {!liberado && (
            <span
              title="Mensagens gratuitas de demonstração neste navegador"
              className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-white"
            >
              {mensagensFeitas}/{LIMITE_DEMO} mensagens grátis
            </span>
          )}
          <span
            title={
              disponiveis.length === totalCadastrado
                ? 'Catálogo enviado à Pólen'
                : 'Vendidos, alugados e inativos não são enviados à Pólen'
            }
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-200"
          >
            <Building2 size={10} /> {disponiveis.length}/{totalCadastrado} disponível(is)
          </span>
        </div>
        <button
          type="button"
          onClick={reiniciar}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400"
        >
          <RotateCcw size={10} /> Reiniciar
        </button>
      </div>

      {/* Telemóvel */}
      <div className="relative mx-auto flex h-[560px] w-full max-w-[340px] flex-col overflow-hidden rounded-[2.5rem] border-[6px] border-zinc-900 bg-zinc-950 shadow-2xl">
        {/* Notch — sempre escuro: no tema claro o `bg-zinc-900` viraria branco
            e a pílula apareceria sobre a barra verde. */}
        <div
          className="absolute left-1/2 top-0 z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl"
          style={{ backgroundColor: '#0b1220' }}
        />

        {/* Barra de topo (estilo WhatsApp) — verde-escura nos dois temas */}
        <div className="whatsapp-barra relative z-10 flex shrink-0 items-center gap-3 bg-[#075E54] px-4 pb-3 pt-7">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-emerald-300/40 bg-zinc-900 shadow-sm">
            <img
              src="/images/avatar-polen.png"
              onError={(e) => { e.currentTarget.src = '/images/avatar-polen.svg'; }}
              alt="Pólen"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="whatsapp-barra-titulo truncate text-xs font-bold text-white">
              IA Pólen · 24h
            </h5>
            <span className="whatsapp-barra-status block text-[10px] text-emerald-200">
              {enviando ? 'digitando…' : 'online no WhatsApp'}
            </span>
          </div>
          {gatilho && (
            <span
              title={gatilho.motivo ? `Motivo interno: ${gatilho.motivo}` : 'Gatilho interno da esteira'}
              className="shrink-0 rounded-md border border-amber-300/50 bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-100"
            >
              ⚡ handoff
            </span>
          )}
        </div>

        {/* Conversa */}
        <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#E5DDD5] p-3">
          {historico.map((m, idx) => (
            <div
              key={idx}
              className={
                m.autor === 'cliente'
                  ? 'ml-auto max-w-[85%] whitespace-pre-line rounded-lg rounded-tr-none bg-[#DCF8C6] px-2.5 py-2 text-[11px] leading-relaxed text-zinc-800 shadow-sm'
                  : 'max-w-[88%] whitespace-pre-line rounded-lg rounded-tl-none bg-white px-2.5 py-2 text-[11px] leading-relaxed text-zinc-800 shadow-sm'
              }
            >
              {m.autor === 'ia' && (
                <span className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                  <Sparkles size={9} /> Pólen
                </span>
              )}
              {m.texto}
              <span className="mt-1 block text-right text-[9px] text-zinc-500">{m.hora || ''}</span>
            </div>
          ))}

          {enviando && (
            <div className="max-w-[88%] rounded-lg rounded-tl-none bg-white px-2.5 py-2 text-[11px] text-zinc-500 shadow-sm">
              Pólen está digitando…
            </div>
          )}

          {erro && (
            <div className="mx-auto max-w-[92%] rounded-xl border border-amber-500/60 bg-amber-50 px-3 py-2 text-[10.5px] leading-relaxed text-amber-900">
              {erro}
            </div>
          )}

          {disponiveis.length === 0 && (
            <div className="mx-auto max-w-[92%] space-y-1.5 rounded-xl border border-amber-500/60 bg-amber-50 px-3 py-2 text-[10.5px] leading-relaxed text-amber-900">
              <p>{totalCadastrado ? AVISO_SEM_DISPONIVEIS : AVISO_CATALOGO_VAZIO}</p>
              {onAbrirCaptacao && (
                <button
                  type="button"
                  onClick={onAbrirCaptacao}
                  className="cursor-pointer rounded-lg border border-amber-600/60 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-900 transition hover:bg-amber-100"
                >
                  Cadastrar primeiro imóvel →
                </button>
              )}
            </div>
          )}

          {bloqueado && (
            <div className="mx-auto max-w-[92%] space-y-2 rounded-xl border border-emerald-500/50 bg-[#05070A] p-3 text-[10.5px] leading-relaxed text-slate-200 shadow-lg">
              <p className="flex items-center gap-1.5 font-black uppercase tracking-wide text-[#10b981]">
                <Sparkles size={12} /> Veja a Pólen em ação 24 horas
              </p>
              <p className="text-slate-300">
                Veja como ela atende seus clientes às 2h da manhã e entrega a visita agendada na sua agenda.
              </p>
              {onAbrirPlanos && (
                <button
                  type="button"
                  onClick={onAbrirPlanos}
                  className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-950 transition hover:opacity-90 shadow-md shadow-emerald-500/20"
                >
                  Quero a Pólen no meu WhatsApp →
                </button>
              )}
            </div>
          )}

          <div ref={fimRef} />
        </div>

        {/* 3 perguntas rápidas: o visitante não precisa inventar a pergunta */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-black/10 bg-[#ECE5DD] px-2 py-1.5">
          {ACOES_POLEN.map((acao) => (
            <button
              key={acao.key}
              type="button"
              disabled={!podeFalar || enviando}
              onClick={() => enviar(acao.pergunta)}
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-[#075E54]/40 bg-white px-2.5 py-1 text-[10px] font-bold text-[#075E54] transition hover:bg-[#DCF8C6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {acao.rotulo}
            </button>
          ))}
        </div>

        {/* Campo de digitação */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(msg);
          }}
          className="flex shrink-0 items-center gap-2 border-t border-black/10 bg-[#F0F0F0] px-2 py-2 pb-3"
        >
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            disabled={!podeFalar || enviando}
            placeholder="Escreva como o cliente…"
            aria-label="Mensagem para a Pólen"
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] text-zinc-800 outline-none placeholder:text-zinc-500 focus:border-[#075E54] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!podeFalar || enviando || !msg.trim()}
            aria-label="Enviar mensagem"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#075E54] text-white transition hover:bg-[#0a7a6d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

      <p className="mx-auto mt-2 max-w-[340px] text-center text-[10px] leading-relaxed text-zinc-400">
        Mesma inteligência comercial da Pólen no WhatsApp, qualificando compradores e agendando visitas com base no seu catálogo de imóveis.
      </p>
    </div>
  );
}
