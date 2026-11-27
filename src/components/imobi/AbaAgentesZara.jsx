import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Clock,
  FileText,
  Send,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { carregarCenarioDemo } from '../../lib/cenarioDemo';
import { executarAuditoriaZara, carregarUltimaAuditoriaZara } from '../../lib/auditoriaZara';
import { useAuth } from '../../contexts/AuthContext';
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
import { AVISO_TRIAL_ENCERRADO } from '../../lib/planos';
import HeroAba from '../admin/HeroAba';
import GuiaDaAba from '../ui/GuiaDaAba';
import PainelZaraOperacional from '../admin/PainelZaraOperacional';
import ControleInteligenciaIA from '../ControleInteligenciaIA';
import MicButton from '../ui/MicButton';

const SAUDACAO_SOFIA_SIMULACAO =
  'Olá! Sou a Pólen, a mesma atendente que atende no WhatsApp 24h. Escreva como se você fosse o cliente (bairro, tipo de imóvel, faixa de valor) — eu respondo com os imóveis reais do seu catálogo, sem inventar preço, taxa ou parcela.';

const historicoInicialSimulador = () => [
  { autor: 'ia', agente: 'Pólen • modo simulação', texto: SAUDACAO_SOFIA_SIMULACAO },
];

export default function AbaAgentesZara({
  imobiliariaId,
  listaLeads = [],
  listaImoveis = [],
  listaVisitas = [],
  listaPropostas = [],
  agentesIA = [],
  setAgentesIA,
  isPro = false,
  bloqueioProAtivo = false,
  sofiaLiberada = false,
  dadosImobCtx = {},
  nomeCorretor,
  precoDoPlano = (p) => (p === 'pro' ? 'R$ 39,90' : 'R$ 99,90'),
  setAbaAtiva,
}) {
  const auth = useAuth();

  // Cenário Demo em 1 Clique (Cold Start) e Auditoria Matinal da Zara
  const [carregandoDemo, setCarregandoDemo] = useState(false);
  const [mensagemDemo, setMensagemDemo] = useState('');
  const [gerandoAuditoriaZara, setGerandoAuditoriaZara] = useState(false);
  const [ultimaAuditoriaZara, setUltimaAuditoriaZara] = useState(null);
  const [erroAuditoriaZara, setErroAuditoriaZara] = useState('');

  // Simulador da Pólen REAL
  const [msgTesteIA, setMsgTesteIA] = useState('');
  const [enviandoSimIA, setEnviandoSimIA] = useState(false);
  const [erroSimIA, setErroSimIA] = useState('');
  const [gatilhoSimIA, setGatilhoSimIA] = useState(null);
  const [historicoTesteIA, setHistoricoTesteIA] = useState(historicoInicialSimulador);
  const [restantesPolen, setRestantesPolen] = useState(() => restantesDemo('polen'));

  // Catálogo disponível para a IA
  const imoveisDisponiveisSimIA = useMemo(() => filtrarCatalogoDisponivel(listaImoveis), [listaImoveis]);

  // Sincroniza e carrega a última auditoria matinal da Zara
  useEffect(() => {
    let ativo = true;
    async function carregarAudit() {
      if (!imobiliariaId) return;
      try {
        const audit = await carregarUltimaAuditoriaZara(imobiliariaId, db);
        if (ativo && audit) {
          setUltimaAuditoriaZara(audit);
        }
      } catch (err) {
        console.warn('Aviso ao carregar última auditoria da Zara:', err);
      }
    }
    carregarAudit();
    return () => {
      ativo = false;
    };
  }, [imobiliariaId]);

  const handleCarregarCenarioDemo = async (forcar = false) => {
    setCarregandoDemo(true);
    setMensagemDemo('');
    try {
      const res = await carregarCenarioDemo(imobiliariaId, db, { force: forcar });
      if (res.sucesso) {
        setMensagemDemo('Cenário Demo carregado com sucesso: 5 imóveis e 6 leads criados!');
      } else {
        setMensagemDemo(res.motivo || 'A conta já possui dados cadastrados.');
      }
      setTimeout(() => setMensagemDemo(''), 6000);
    } catch (err) {
      setMensagemDemo(`Erro ao carregar cenário demo: ${err.message}`);
    } finally {
      setCarregandoDemo(false);
    }
  };

  const handleGerarRelatorioZara = async () => {
    setGerandoAuditoriaZara(true);
    setErroAuditoriaZara('');
    try {
      const contaVazia = (!listaLeads || listaLeads.length === 0) && (!listaImoveis || listaImoveis.length === 0);
      if (contaVazia) {
        setMensagemDemo('Conta sem histórico: gerando auditoria com o Cenário Demo da casa.');
        setTimeout(() => setMensagemDemo(''), 7000);
      }
      const resultado = await executarAuditoriaZara(imobiliariaId, {
        db,
        leads: listaLeads,
        imoveis: listaImoveis,
      });
      setUltimaAuditoriaZara(resultado);
    } catch (err) {
      setErroAuditoriaZara(`Erro ao gerar auditoria da Zara: ${err.message || 'Tente novamente'}`);
    } finally {
      setGerandoAuditoriaZara(false);
    }
  };

  const reiniciarSimuladorIA = useCallback(() => {
    setMsgTesteIA('');
    setErroSimIA('');
    setGatilhoSimIA(null);
    setHistoricoTesteIA(historicoInicialSimulador());
  }, []);

  const enviarMensagemPolen = async (mensagemBruta) => {
    const mensagem = String(mensagemBruta || '').trim();
    if (!mensagem || enviandoSimIA) return;

    if (bloqueioProAtivo) {
      setErroSimIA(AVISO_TRIAL_ENCERRADO);
      return;
    }

    const imovelRef = imoveisDisponiveisSimIA[0] || {};
    const corretorNomeEfetivo =
      nomeCorretor || auth?.currentUser?.displayName || dadosImobCtx?.nomeResponsavel || 'Corretor responsável';

    const resposta0Tokens = obterRespostaRapida0Tokens({
      mensagem,
      imovel: imovelRef,
      nomeImobiliaria: dadosImobCtx?.nome || dadosImobCtx?.nomeOficina || 'Imobiliária parceira',
      nomeCorretor: corretorNomeEfetivo,
    });

    if (resposta0Tokens) {
      setMsgTesteIA('');
      setErroSimIA('');
      setGatilhoSimIA(null);
      setHistoricoTesteIA((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { autor: 'cliente', texto: mensagem },
        { autor: 'ia', agente: 'Pólen • modo simulação', texto: resposta0Tokens },
      ]);
      return;
    }

    if (!podeUsarDemo('polen', { liberado: sofiaLiberada })) {
      setRestantesPolen(0);
      setErroSimIA(
        `Você usou as ${LIMITE_DEMO} mensagens gratuitas de demonstração da Pólen. Contrate o módulo de atendimento 24h para falar com ela sem limite.`
      );
      return;
    }

    setMsgTesteIA('');
    setErroSimIA('');
    setGatilhoSimIA(null);
    setHistoricoTesteIA((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { autor: 'cliente', texto: mensagem },
    ]);

    setEnviandoSimIA(true);
    try {
      const resultado = await responderSofiaSimulacao({
        mensagem,
        historico: historicoTesteIA,
        catalogoImoveis: imoveisDisponiveisSimIA,
        nomeImobiliaria: dadosImobCtx?.nome || dadosImobCtx?.nomeOficina || 'Imobiliária parceira',
        nomeCorretor: corretorNomeEfetivo,
        cabecalhos: await cabecalhosIA(),
      });

      if (!resultado.ok) {
        setErroSimIA(resultado.erro);
        return;
      }

      if (!sofiaLiberada) {
        registrarUsoDemo('polen');
        setRestantesPolen(restantesDemo('polen'));
      }

      setHistoricoTesteIA((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { autor: 'ia', agente: 'Pólen • modo simulação', texto: resultado.texto },
      ]);
      setGatilhoSimIA(descreverHandoff(resultado.gatilho));
    } catch (erro) {
      setErroSimIA(erro?.message || 'Falha inesperada ao chamar a Pólen.');
    } finally {
      setEnviandoSimIA(false);
    }
  };

  const simularRespostaAgente = async (e) => {
    e.preventDefault();
    await enviarMensagemPolen(msgTesteIA);
  };

  return (
    <div className="space-y-6">
      <HeroAba
        icone={Bot}
        titulo="Agentes"
        destaque="Operacionais"
        chip="Zara · Direção Operacional"
        subtitulo="Zara coordena a rotina recorrente do funil com os agentes operacionais. Tom apoia decisões como segundo cérebro; Pólen é a secretária 24h no WhatsApp."
        cor="#8b5cf6"
      />
      <GuiaDaAba
        titulo="Agentes Operacionais"
        descricao="Zara coordena as rotinas do funil e os agentes de qualificação, visitas, propostas, reativação, crédito e repasses. A Pólen permanece dedicada ao atendimento 24h."
      />

      {/* ─── ESTEIRA OPERACIONAL VISUAL DA ZARA (CENTRO DE COMANDO) ──────── */}
      <PainelZaraOperacional
        leads={listaLeads}
        imoveis={listaImoveis}
        visitas={listaVisitas}
        propostas={listaPropostas}
        auditando={gerandoAuditoriaZara}
        onDispararAuditoria={handleGerarRelatorioZara}
        ultimaAuditoria={ultimaAuditoriaZara}
      />

      {/* ─── CENÁRIO DEMO EM 1 CLIQUE (COLD START) ─────────────────────────── */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#020408] p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#10b981]">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm md:text-base font-black text-white">
                Cenário Demo em 1 Clique
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black uppercase text-[#10b981]">
                Demonstração Rápida
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Popule automaticamente 5 imóveis (2 parados há mais de 40 dias) e 6 leads (2 sem resposta há mais de 24h) para testar o Tom e a auditoria da Zara na hora.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCarregarCenarioDemo(false)}
            disabled={carregandoDemo}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Zap size={14} />
            <span>{carregandoDemo ? 'Carregando...' : 'Carregar Cenário Demo'}</span>
          </button>
        </div>
      </div>

      {mensagemDemo && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-[#10b981]">
          <CheckCircle2 size={16} />
          <span>{mensagemDemo}</span>
        </div>
      )}

      <ControleInteligenciaIA
        isPro={isPro}
        setAbaAtiva={setAbaAtiva}
      />

      {bloqueioProAtivo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-start gap-2 text-xs font-bold text-amber-200">
            <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{AVISO_TRIAL_ENCERRADO}</span>
          </div>
          <button
            type="button"
            onClick={() => setAbaAtiva?.('meuplano')}
            className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1.5 text-[11px] font-black text-amber-950 shadow-[0_0_18px_rgba(245,158,11,0.45)] transition-all hover:-translate-y-0.5"
          >
            Assinar o PRO · {precoDoPlano('pro')}/mês
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                  👑 Zara · <span style={{ color: '#10b981' }}>Direção Operacional</span>
                </h2>
                <p className="mt-2 text-xs md:text-sm text-slate-400">
                  Audita o funil diário com base exclusivamente nas Regras Comerciais do Tom e nos dados operacionais da casa.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGerarRelatorioZara}
                disabled={gerandoAuditoriaZara}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Clock size={15} />
                <span>{gerandoAuditoriaZara ? 'Auditando...' : 'Gerar Relatório Matinal (08:00) Agora'}</span>
              </button>
            </div>
          </div>

          {erroAuditoriaZara && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
              {erroAuditoriaZara}
            </div>
          )}

          {ultimaAuditoriaZara && (
            <div className="rounded-2xl border border-emerald-500/40 bg-[#020408] p-5 md:p-6 shadow-xl shadow-black/60 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-[#10b981]">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Boletim Executivo das 08:00 · Auditoria da Zara
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {ultimaAuditoriaZara.dataExtenso ? `${ultimaAuditoriaZara.dataExtenso} às ${ultimaAuditoriaZara.horaFormatada}` : `Gerado em: ${new Date(ultimaAuditoriaZara.geradoEm || Date.now()).toLocaleString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ultimaAuditoriaZara.cenarioDemoInjetado && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-[#10b981]">
                      ✨ Cenário Demo
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-black text-amber-300">
                    ⚠️ {ultimaAuditoriaZara.totalLeadsAtrasados ?? (ultimaAuditoriaZara.leadsAtrasados?.length || 0)} leads atrasados
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] font-black text-red-300">
                    🛑 {ultimaAuditoriaZara.totalImoveisParados ?? (ultimaAuditoriaZara.imoveisParados?.length || 0)} imóveis parados
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {ultimaAuditoriaZara.relatorio}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(agentesIA || []).filter((ag) => ag.id !== 'sofia_triagem').map((ag) => (
              <div key={ag.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: '#10b981' }} className="text-xs font-extrabold text-[#10b981]">{ag.cargo}</span>
                    <button
                      onClick={() =>
                        setAgentesIA?.((prev) =>
                          (Array.isArray(prev) ? prev : [])?.map((item) => (item.id === ag.id ? { ...item, ativo: !item.ativo } : item))
                        )
                      }
                      style={ag.ativo ? { backgroundColor: '#10b981' } : undefined}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                        ag.ativo ? 'text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ag.ativo ? 'ATIVO' : 'PAUSADO'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm">{ag.nome}</h3>
                    {ag.demonstracao && (
                      <span className="rounded-full border border-amber-400/50 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.10em] text-amber-300">
                        Demonstração
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ag.prompt}</p>
                </div>
                <p style={{ color: '#10b981' }} className="text-[11px] font-bold text-[#10b981] mt-3 pt-2 border-t border-slate-800">
                  ⚡ {ag.atendimentos} interações demonstrativas
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Simulador da PÓLEN REAL */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[560px]">
          <div className="pb-3 mb-3 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles size={16} style={{ color: '#10b981' }} className="text-[#10b981]" /> Pólen · Secretária 24h
              </h3>
              <button
                type="button"
                onClick={reiniciarSimuladorIA}
                className="px-2.5 py-1 rounded-lg bg-[#020408] border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-slate-300 hover:text-[#10b981] cursor-pointer transition"
              >
                🔄 Reiniciar Chat
              </button>
            </div>
            <p className="text-xs text-slate-400">
              A mesma Pólen do WhatsApp, respondendo pelo <span className="text-slate-200 font-semibold">/api/ai</span> com o
              catálogo real do tenant. Preço, taxa e parcela só saem do cadastro.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {!sofiaLiberada && (
                <span
                  title="Mensagens gratuitas de demonstração neste navegador"
                  className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-white text-[10px] font-bold"
                >
                  💬 {Math.min(Math.max(0, LIMITE_DEMO - restantesPolen), LIMITE_DEMO)}/{LIMITE_DEMO} mensagens grátis
                </span>
              )}
              <span
                title={
                  imoveisDisponiveisSimIA.length === (Array.isArray(listaImoveis) ? listaImoveis.length : 0)
                    ? 'Catálogo enviado à Sofia'
                    : 'Vendidos, alugados e inativos não são enviados à Sofia'
                }
                className="px-2 py-0.5 rounded-md bg-[#020408] border border-slate-700 text-slate-200 text-[10px] font-bold"
              >
                🏠 {imoveisDisponiveisSimIA.length} disponível(is) de{' '}
                {Array.isArray(listaImoveis) ? listaImoveis.length : 0} cadastrado(s)
              </span>
              {gatilhoSimIA && (
                <span
                  title={gatilhoSimIA.motivo ? `Motivo interno: ${gatilhoSimIA.motivo}` : 'Gatilho interno da esteira'}
                  className="px-2 py-0.5 rounded-md bg-[#f59e0b]/15 border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-extrabold"
                >
                  ⚡ {gatilhoSimIA.rotulo}
                </span>
              )}
            </div>
            {gatilhoSimIA && (
              <p className="text-[10px] text-slate-500">
                Tag interna de handoff: o cliente final não vê esta linha — ela não vai para o WhatsApp.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(historicoTesteIA || [])?.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs max-w-[88%] whitespace-pre-line ${
                  m.autor === 'cliente'
                    ? 'ml-auto bg-[#10b981] text-white'
                    : 'border border-slate-800 bg-[#020408] text-slate-200'
                }`}
              >
                {m.autor === 'ia' && m.agente && (
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10b981] mb-1">
                    {m.agente}
                  </span>
                )}
                {m.texto}
              </div>
            ))}
            {enviandoSimIA && (
              <div
                className="p-3 rounded-2xl text-xs max-w-[88%] border border-slate-800 bg-[#020408] text-slate-400"
              >
                Pólen está digitando…
              </div>
            )}
            {erroSimIA && (
              <div className="p-3 rounded-xl text-[11px] border border-red-500/40 bg-red-500/10 text-red-300">
                {erroSimIA}
              </div>
            )}
          </div>

          {imoveisDisponiveisSimIA.length === 0 && (
            <div className="mt-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[11px] text-[#f59e0b] space-y-2">
              <p>
                {Array.isArray(listaImoveis) && listaImoveis.length
                  ? AVISO_SEM_DISPONIVEIS
                  : AVISO_CATALOGO_VAZIO}
              </p>
              <button
                type="button"
                onClick={() => setAbaAtiva?.('captacao_imobi')}
                className="px-2.5 py-1 rounded-lg bg-[#020408] border border-[#f59e0b]/40 text-[10px] font-bold hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition"
              >
                Cadastrar primeiro imóvel →
              </button>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {ACOES_POLEN.map((acao) => (
              <button
                key={acao.key}
                type="button"
                disabled={bloqueioProAtivo || enviandoSimIA || (!sofiaLiberada && restantesPolen <= 0)}
                onClick={() => enviarMensagemPolen(acao.pergunta)}
                className="px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold hover:bg-[#10b981]/20 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {acao.rotulo}
              </button>
            ))}
          </div>

          {bloqueioProAtivo && (
            <div className="tarja-aviso mt-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[11px] text-[#f59e0b] space-y-2">
              <p className="flex items-center gap-1.5 font-black uppercase tracking-wide">
                <Lock size={12} aria-hidden="true" /> Simulador bloqueado
              </p>
              <p>{AVISO_TRIAL_ENCERRADO}</p>
              <button
                type="button"
                onClick={() => setAbaAtiva?.('meuplano')}
                className="px-2.5 py-1 rounded-lg bg-[#020408] border border-[#f59e0b]/40 text-[10px] font-bold hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition"
              >
                Assinar o PRO · {precoDoPlano('pro')}/mês →
              </button>
            </div>
          )}

          {!sofiaLiberada && restantesPolen <= 0 && (
            <div className="tarja-aviso mt-3 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[11px] text-[#f59e0b] space-y-2">
              <p>
                Você usou as {LIMITE_DEMO} mensagens gratuitas de demonstração da Pólen. Ela atende
                sem limite no WhatsApp quando o módulo está contratado ({precoDoPlano('esquadrao_ia')}/mês
                + implantação).
              </p>
              <button
                type="button"
                onClick={() => setAbaAtiva?.('meuplano')}
                className="px-2.5 py-1 rounded-lg bg-[#020408] border border-[#f59e0b]/40 text-[10px] font-bold hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition"
              >
                Contratar a Pólen →
              </button>
            </div>
          )}

          <form onSubmit={simularRespostaAgente} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={msgTesteIA}
                onChange={(e) => setMsgTesteIA(e.target.value)}
                disabled={bloqueioProAtivo || enviandoSimIA || (!sofiaLiberada && restantesPolen <= 0)}
                placeholder="Ex: Procuro um apto de 2 quartos no Tibery até 350 mil"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-white disabled:opacity-60"
              />
              <MicButton
                className="absolute right-1 top-1/2 -translate-y-1/2 !p-1.5"
                tamanho={13}
                onTexto={(texto) => setMsgTesteIA((v) => (v ? `${v} ${texto}` : texto))}
              />
            </div>
            <button
              type="submit"
              aria-label="Enviar mensagem de teste para a Pólen"
              disabled={bloqueioProAtivo || enviandoSimIA || (!sofiaLiberada && restantesPolen <= 0)}
              style={{ backgroundColor: '#10b981' }}
              className="px-4 py-2 rounded-xl hover:opacity-90 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
