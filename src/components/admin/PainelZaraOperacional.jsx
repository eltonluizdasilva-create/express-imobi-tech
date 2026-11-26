import React, { useState, useMemo } from 'react';
import {
  Bot,
  Clock,
  Home,
  MessageSquare,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  TrendingDown,
  UserCheck,
  Radio,
  Bell,
  Play,
} from 'lucide-react';

export default function PainelZaraOperacional({
  leads = [],
  imoveis = [],
  visitas = [],
  propostas = [],
  auditando = false,
  onDispararAuditoria = () => {},
  ultimaAuditoria = null,
}) {
  const [gatilhoFocado, setGatilhoFocado] = useState(null); // 'leads' | 'imoveis' | 'visitas' | 'rotina'

  // Contadores dinâmicos calculados do estado real (com fallback para cenário demo se a conta for vazia)
  const contadores = useMemo(() => {
    const agora = Date.now();
    const diaMs = 24 * 60 * 60 * 1000;
    const horaMs = 60 * 60 * 1000;

    const listaLeads = Array.isArray(leads) ? leads : [];
    const listaImoveis = Array.isArray(imoveis) ? imoveis : [];
    const listaVisitas = Array.isArray(visitas) ? visitas : [];
    const listaPropostas = Array.isArray(propostas) ? propostas : [];

    // Se conta sem dados, exibe os números do cenário demo
    const contaVazia = listaLeads.length === 0 && listaImoveis.length === 0;

    if (contaVazia) {
      return {
        contaVazia: true,
        leadsAtrasados24h: 2, // Eduardo (36h), Camila (28h)
        imoveisParados40d: 2, // IMB-101 (48d), IMB-102 (42d)
        visitasEPropostas: 3,
        rotinaStatus: '08:00 Agendada',
      };
    }

    // Cálculo em dados reais
    const leads24h = listaLeads.filter((l) => {
      const st = String(l.status || '').toLowerCase();
      if (['convertido', 'ganho', 'perdido', 'descartado'].includes(st)) return false;
      const horas = Number(l.horasSemContato || l.horasSemResposta);
      if (horas >= 24) return true;
      const t = l.criadoEm || l.dataCriacao || l.createdAt;
      const ms = t?.toMillis ? t.toMillis() : t ? new Date(t).getTime() : 0;
      return ms > 0 && (agora - ms) >= 24 * horaMs;
    }).length;

    const imoveis40d = listaImoveis.filter((im) => {
      const st = String(im.status || '').toLowerCase();
      if (['vendido', 'alugado', 'inativo'].includes(st)) return false;
      if (Number.isFinite(im.diasParado) && im.diasParado >= 40) return true;
      const t = im.atualizadoEm || im.criadoEm || im.dataCadastro;
      const ms = t?.toMillis ? t.toMillis() : t ? new Date(t).getTime() : 0;
      return ms > 0 && (agora - ms) >= 40 * diaMs;
    }).length;

    const visitasEPropostas = listaVisitas.length + listaPropostas.length;

    return {
      contaVazia: false,
      leadsAtrasados24h: leads24h,
      imoveisParados40d: imoveis40d,
      visitasEPropostas: visitasEPropostas || 0,
      rotinaStatus: '08:00 Agendada',
    };
  }, [leads, imoveis, visitas, propostas]);

  // Status visual da Zara
  const statusZara = auditando ? 'Auditando funil...' : 'Em espera';

  // Verifica se um agente deve estar iluminado
  const isAgenteIluminado = (agenteId) => {
    if (auditando) return true;
    if (!gatilhoFocado) return false;
    if (gatilhoFocado === 'rotina') return true;
    if (gatilhoFocado === 'leads' && (agenteId === 'resgate_leads' || agenteId === 'boletim_08h')) return true;
    if (gatilhoFocado === 'imoveis' && (agenteId === 'auditor_carteira' || agenteId === 'boletim_08h')) return true;
    if (gatilhoFocado === 'visitas' && (agenteId === 'cobranca_followup' || agenteId === 'boletim_08h')) return true;
    return false;
  };

  return (
    <div
      style={{ backgroundColor: '#080C10', color: '#F8FAFC' }}
      className="rounded-2xl border border-violet-500/30 bg-[#080C10] p-4 md:p-6 shadow-2xl shadow-black/80 space-y-5"
    >
      {/* ─── CABEÇALHO DO PAINEL DA ZARA ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/40 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
            <Bot size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black tracking-tight text-[#F8FAFC] flex items-center gap-2">
                Esteira Operacional · <span className="text-violet-400">Zara</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-black uppercase text-violet-300">
                Direção Operacional
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Coordenação de rotinas, resgate de clientes e auditoria matinal com base nas regras comerciais do Tom.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {contadores.contaVazia && (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10.5px] font-bold text-[#10b981]">
              ✨ Indicadores Demo Ativos
            </span>
          )}
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5">
            <Radio size={12} className={auditando ? 'text-violet-400 animate-spin' : 'text-[#10b981] animate-pulse'} />
            <span>{statusZara}</span>
          </span>
        </div>
      </div>

      {/* ─── 3 COLUNAS CONECTADAS POR LINHAS SVG ANIMADAS ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* COLUNA ESQUERDA: GATILHOS DO FUNIL (4 CARDS) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" /> Gatilhos do Funil
            </span>
            <span className="text-[10px] font-bold text-slate-500">Gatilhos em Tempo Real</span>
          </div>

          {/* Gatilho 1: Leads sem resposta (>24h) */}
          <div
            onClick={() => setGatilhoFocado((prev) => (prev === 'leads' ? null : 'leads'))}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              gatilhoFocado === 'leads'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Leads sem resposta (&gt;24h)</h4>
                <p className="text-[10px] text-slate-400">Atendimento fora do SLA</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#080C10] border border-amber-500/30 text-amber-300 text-xs font-black">
              {contadores.leadsAtrasados24h} pendente(s)
            </span>
          </div>

          {/* Gatilho 2: Imóveis parados (>40d) */}
          <div
            onClick={() => setGatilhoFocado((prev) => (prev === 'imoveis' ? null : 'imoveis'))}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              gatilhoFocado === 'imoveis'
                ? 'bg-sky-500/15 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Home size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Imóveis parados (&gt;40d)</h4>
                <p className="text-[10px] text-slate-400">Carteira sem giro</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#080C10] border border-sky-500/30 text-sky-300 text-xs font-black">
              {contadores.imoveisParados40d} imóvel(is)
            </span>
          </div>

          {/* Gatilho 3: Visitas & Propostas */}
          <div
            onClick={() => setGatilhoFocado((prev) => (prev === 'visitas' ? null : 'visitas'))}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              gatilhoFocado === 'visitas'
                ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-[#10b981] border border-emerald-500/20">
                <Calendar size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Visitas & Propostas</h4>
                <p className="text-[10px] text-slate-400">Em andamento na esteira</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#080C10] border border-emerald-500/30 text-[#10b981] text-xs font-black">
              {contadores.visitasEPropostas} ativo(s)
            </span>
          </div>

          {/* Gatilho 4: Rotina 08:00 */}
          <div
            onClick={() => setGatilhoFocado((prev) => (prev === 'rotina' ? null : 'rotina'))}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              gatilhoFocado === 'rotina'
                ? 'bg-violet-500/15 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Bell size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC]">Rotina 08:00</h4>
                <p className="text-[10px] text-slate-400">Auditoria matinal diária</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#080C10] border border-violet-500/30 text-violet-300 text-xs font-black">
              {contadores.rotinaStatus}
            </span>
          </div>
        </div>

        {/* COLUNA CENTRAL: NÚCLEO ZARA (HUB PULSANTE VIOLETA/ESMERALDA) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 relative">
          {/* Conexão SVG visual entre os blocos */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Halo de pulso externo */}
            <div
              className={`w-40 h-40 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 shadow-2xl relative ${
                auditando
                  ? 'border-violet-400 bg-violet-950/40 shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-pulse'
                  : 'border-violet-500/50 bg-[#06090e] shadow-[0_0_30px_rgba(139,92,246,0.2)]'
              }`}
            >
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border border-violet-400/30 flex flex-col items-center justify-center bg-gradient-to-tr from-violet-950/80 via-slate-900 to-emerald-950/60 p-3 text-center shadow-inner">
                <span className="text-xl md:text-2xl">👑</span>
                <span className="text-xs md:text-sm font-black tracking-wider text-white mt-1">ZARA</span>
                <span className="text-[9px] font-bold text-violet-300 uppercase tracking-tight">Direção Operacional</span>
                <span
                  className={`text-[8.5px] font-extrabold mt-1 px-1.5 py-0.5 rounded-full ${
                    auditando
                      ? 'bg-violet-500/30 text-violet-200 border border-violet-400/40'
                      : 'bg-emerald-500/20 text-[#10b981] border border-emerald-500/40'
                  }`}
                >
                  {statusZara}
                </span>
              </div>
            </div>

            {/* Botão de Disparo Rápido da Auditoria */}
            <button
              type="button"
              onClick={onDispararAuditoria}
              disabled={auditando}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-emerald-500 hover:from-violet-500 hover:to-emerald-400 text-white font-black px-4 py-2 text-xs uppercase tracking-wider transition shadow-lg shadow-violet-500/25 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={14} className={auditando ? 'animate-spin' : ''} />
              <span>{auditando ? 'Auditando com DeepSeek...' : 'Disparar Auditoria das 08:00'}</span>
            </button>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Audita funil, SLA e carteira em 1 clique
            </p>
          </div>
        </div>

        {/* COLUNA DIREITA: AGENTES OPERACIONAIS (4 CARDS) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bot size={13} className="text-violet-400" /> Agentes Operacionais
            </span>
            <span className="text-[10px] font-bold text-slate-500">Esquadrão Ativo</span>
          </div>

          {/* Agente 1: Auditor de Carteira */}
          <div
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isAgenteIluminado('auditor_carteira')
                ? 'bg-sky-500/15 border-sky-400 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'bg-slate-900/90 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <Home size={14} className={isAgenteIluminado('auditor_carteira') ? 'text-sky-300' : 'text-slate-500'} />
                Auditor de Carteira
              </h4>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isAgenteIluminado('auditor_carteira') ? 'bg-sky-500/30 text-sky-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isAgenteIluminado('auditor_carteira') ? 'ILUMINADO' : 'PRONTO'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Varre imóveis sem giro há &gt;40d e sugere reposicionamento de valor ou novas fotos.
            </p>
          </div>

          {/* Agente 2: Resgate de Leads */}
          <div
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isAgenteIluminado('resgate_leads')
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/90 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <MessageSquare size={14} className={isAgenteIluminado('resgate_leads') ? 'text-amber-300' : 'text-slate-500'} />
                Resgate de Leads
              </h4>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isAgenteIluminado('resgate_leads') ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isAgenteIluminado('resgate_leads') ? 'ILUMINADO' : 'PRONTO'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Fiscaliza o SLA de 15m e notifica corretores com contatos parados há mais de 24h.
            </p>
          </div>

          {/* Agente 3: Cobrança de Follow-up */}
          <div
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isAgenteIluminado('cobranca_followup')
                ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-slate-900/90 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <UserCheck size={14} className={isAgenteIluminado('cobranca_followup') ? 'text-[#10b981]' : 'text-slate-500'} />
                Cobrança de Follow-up
              </h4>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isAgenteIluminado('cobranca_followup') ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isAgenteIluminado('cobranca_followup') ? 'ILUMINADO' : 'PRONTO'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Acompanha pós-visita e propostas em negociação para evitar que esfriem no funil.
            </p>
          </div>

          {/* Agente 4: Boletim Executivo 08:00 */}
          <div
            className={`p-3 rounded-xl border transition-all duration-300 ${
              isAgenteIluminado('boletim_08h')
                ? 'bg-violet-500/15 border-violet-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                : 'bg-slate-900/90 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5">
                <FileText size={14} className={isAgenteIluminado('boletim_08h') ? 'text-violet-300' : 'text-slate-500'} />
                Boletim Executivo 08:00
              </h4>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isAgenteIluminado('boletim_08h') ? 'bg-violet-500/30 text-violet-200' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isAgenteIluminado('boletim_08h') ? 'ILUMINADO' : 'PRONTO'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Compila a síntese matinal em 4 tópicos com a ação prioritária do gestor para destravar caixa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
