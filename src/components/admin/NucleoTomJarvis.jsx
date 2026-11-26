import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Brain,
  Mic,
  MicOff,
  Zap,
  ShieldCheck,
  Users,
  Home,
  Calendar,
  ScrollText,
  MessageCircle,
  Bot,
  DollarSign,
  Lock,
  Radio,
  Sliders,
  CheckCircle2,
  Sparkles,
  Compass,
  Activity,
  ArrowRight,
} from 'lucide-react';

/**
 * 8 Nós operacionais conectados ao Centro Neural do Tom
 */
export const NOS_NEURAIS_TOM = [
  {
    id: 'crm_leads',
    nome: 'CRM & Leads',
    icone: Users,
    cor: '#10b981', // esmeralda
    angulo: -135,
    pergunta: 'Qual o status do funil de vendas hoje e quais leads precisam de atenção imediata?',
    resumoContexto: 'Módulo CRM & Leads: fluxo de entrada de contatos, temperatura do funil e distribuição da equipe.',
    planoMinimo: 'gratis',
  },
  {
    id: 'captacao_imoveis',
    nome: 'Captação & Imóveis',
    icone: Home,
    cor: '#38bdf8', // azul celeste
    angulo: -90,
    pergunta: 'Quais imóveis da carteira estão parados há mais de 30 dias e precisam de ajuste de preço ou novas fotos?',
    resumoContexto: 'Módulo Captação & Imóveis: estoque de carteira, giro de imóveis e imóveis sem visita.',
    planoMinimo: 'gratis',
  },
  {
    id: 'agenda',
    nome: 'Agenda',
    icone: Calendar,
    cor: '#818cf8', // indigo
    angulo: -45,
    pergunta: 'Como está a agenda de visitas desta semana e quais horários têm maior taxa de conversão?',
    resumoContexto: 'Módulo Agenda: visitas agendadas, horários confirmados e disponibilidade dos corretores.',
    planoMinimo: 'gratis',
  },
  {
    id: 'regras_memoria',
    nome: 'Regras & Memória',
    icone: ScrollText,
    cor: '#f59e0b', // âmbar
    angulo: 0,
    pergunta: 'Quais são as regras comerciais da casa sobre comissão padrão, desconto máximo e política de permuta?',
    resumoContexto: 'Módulo Regras & Memória: políticas comerciais e limites cadastrados no painel do Tom.',
    planoMinimo: 'tom',
  },
  {
    id: 'polen_whatsapp',
    nome: 'Pólen · WhatsApp',
    icone: MessageCircle,
    cor: '#06b6d4', // ciano
    angulo: 45,
    pergunta: 'O que a secretária 24h Pólen registrou nas conversas noturnas que a equipe ainda não atendeu?',
    resumoContexto: 'Módulo Pólen WhatsApp: secretária digital com atendimento automático e triagem de interesse.',
    planoMinimo: 'esquadrao_ia',
  },
  {
    id: 'zara_prospeccao',
    nome: 'Zara · Prospecção',
    icone: Bot,
    cor: '#a855f7', // roxo
    angulo: 90,
    pergunta: 'Qual foi o último diagnóstico matinal da Zara sobre gargalos de SLA e imóveis travados?',
    resumoContexto: 'Módulo Zara Operações: auditoria de rotina do funil, fiscalização de SLA e cobrança matinal.',
    planoMinimo: 'pro',
  },
  {
    id: 'financeiro_nf',
    nome: 'Financeiro & NF',
    icone: DollarSign,
    cor: '#2dd4bf', // teal
    angulo: 135,
    pergunta: 'Quais repasses de comissão e notas fiscais estão pendentes de conferência na operação?',
    resumoContexto: 'Módulo Financeiro & NF: controle de repasses, faturamento, VGV e fechamentos.',
    planoMinimo: 'pro',
  },
  {
    id: 'juridico',
    nome: 'Jurídico',
    icone: ShieldCheck,
    cor: '#eab308', // amarelo ouro
    angulo: 180,
    pergunta: 'Quais cláusulas de garantia e sinal são obrigatórias antes da emissão do contrato de compra e venda?',
    resumoContexto: 'Módulo Jurídico: conformidade contratual, minutas padronizadas e limites legais.',
    planoMinimo: 'plus',
  },
];

const CENTRO_SVG = { x: 350, y: 220 };
const RAIO_X = 250;
const RAIO_Y = 145;

export default function NucleoTomJarvis({
  plano = 'gratis',
  isPro = false,
  liberado = false,
  adminTotal = false,
  estadoProcessamento = false, // se Tom está enviando/processando
  onSelecionarPergunta = () => {},
  onTextoVoz = () => {},
  noSelecionado = null,
  setNoSelecionado = () => {},
}) {
  const [autonomia, setAutonomia] = useState('copiloto'); // 'copiloto' | 'piloto_automatico'
  const [ouvindoVoz, setOuvindoVoz] = useState(false);
  const [erroVoz, setErroVoz] = useState('');
  const [atividades, setAtividades] = useState([
    { id: 1, hora: '08:00', texto: 'Centro Neural Tom inicializado em prontidão' },
    { id: 2, hora: '08:01', texto: 'Conexão ativa com as regras comerciais da casa' },
    { id: 3, hora: '08:02', texto: 'Monitoramento contínuo de 8 nós neurais' },
  ]);

  const recognitionRef = useRef(null);

  // Determina estado do orbe central
  const estadoOrbe = useMemo(() => {
    if (ouvindoVoz) return 'Ouvindo...';
    if (estadoProcessamento) return 'Processando...';
    return 'Em espera';
  }, [ouvindoVoz, estadoProcessamento]);

  // Adiciona item no feed de atividade
  const registrarAtividade = useCallback((texto) => {
    const agora = new Date();
    const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAtividades((prev) => [
      { id: Date.now() + Math.random(), hora, texto },
      ...prev.slice(0, 4),
    ]);
  }, []);

  // Verifica se o nó está ativo no plano atual ou em simulação
  const checarNoAtivo = useCallback(
    (no) => {
      if (adminTotal || liberado) return true;
      if (no.planoMinimo === 'gratis') return true;
      if (no.planoMinimo === 'tom') return liberado || adminTotal;
      if (no.planoMinimo === 'pro') return isPro || plano === 'pro' || plano === 'plus';
      if (no.planoMinimo === 'plus') return plano === 'plus';
      if (no.planoMinimo === 'esquadrao_ia') return plano === 'plus' || plano === 'esquadrao_ia';
      return false;
    },
    [adminTotal, isPro, liberado, plano]
  );

  // Calcula nós com posições e status
  const nosMapeados = useMemo(() => {
    return NOS_NEURAIS_TOM.map((no) => {
      const rad = (no.angulo * Math.PI) / 180;
      const x = CENTRO_SVG.x + RAIO_X * Math.cos(rad);
      const y = CENTRO_SVG.y + RAIO_Y * Math.sin(rad);
      const ativo = checarNoAtivo(no);
      return {
        ...no,
        x,
        y,
        ativo,
      };
    });
  }, [checarNoAtivo]);

  const totalAtivos = useMemo(() => {
    return nosMapeados.filter((n) => n.ativo).length;
  }, [nosMapeados]);

  // Manipulação de voz via SpeechRecognition local nativo
  const alternarVoz = useCallback(() => {
    const SpeechClass = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechClass) {
      setErroVoz('Reconhecimento de voz não suportado neste navegador.');
      setTimeout(() => setErroVoz(''), 4000);
      return;
    }

    if (ouvindoVoz) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignora */
      }
      setOuvindoVoz(false);
      return;
    }

    try {
      const recognition = new SpeechClass();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setOuvindoVoz(true);
        setErroVoz('');
      };

      recognition.onresult = (e) => {
        const transcricao = e?.results?.[0]?.[0]?.transcript || '';
        if (transcricao) {
          onTextoVoz(transcricao);
          registrarAtividade(`Comando de voz recebido: "${transcricao.slice(0, 38)}..."`);
        }
      };

      recognition.onerror = (err) => {
        console.warn('Aviso microfone local:', err?.error);
        setOuvindoVoz(false);
      };

      recognition.onend = () => {
        setOuvindoVoz(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setOuvindoVoz(false);
      setErroVoz('Microfone indisponível.');
      setTimeout(() => setErroVoz(''), 3000);
    }
  }, [onTextoVoz, ouvindoVoz, registrarAtividade]);

  // Clique no nó: preenche pergunta no simulador (sem chamada automática a APIs)
  const handleClicarNo = (no) => {
    setNoSelecionado(no);
    onSelecionarPergunta(no.pergunta, no);
    registrarAtividade(`Nó focado: [${no.nome}] → Pergunta sugerida transferida`);
  };

  return (
    <div
      style={{ backgroundColor: '#080C10', color: '#F8FAFC' }}
      className="rounded-2xl border border-emerald-500/30 bg-[#080C10] p-4 md:p-6 shadow-2xl shadow-black/80 space-y-5"
    >
      {/* ─── TOPO: CONTROLES DO CENTRO NEURAL & AUTONOMIA ───────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Brain size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black tracking-tight text-[#F8FAFC] flex items-center gap-2">
                Centro de Comando Neural · <span className="text-[#10b981]">Tom</span>
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase text-[#10b981]">
                Jarvis Imobi
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Orbe neural integrando a operação em tempo real. Clique em um nó para formular diretrizes estratégicas.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Autonomia */}
          <div className="flex items-center rounded-xl bg-[#020408] border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => {
                setAutonomia('copiloto');
                registrarAtividade('Modo alternado para Copiloto Estratégico');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                autonomia === 'copiloto'
                  ? 'bg-emerald-500/20 text-[#10b981] border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass size={13} />
              <span>Copiloto</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAutonomia('piloto_automatico');
                registrarAtividade('Modo alternado para Piloto Automático');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                autonomia === 'piloto_automatico'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={13} />
              <span>Piloto Automático</span>
            </button>
          </div>

          {/* Botão de Microfone / Voz Local */}
          <button
            type="button"
            onClick={alternarVoz}
            title={ouvindoVoz ? 'Clique para encerrar escuta' : 'Falar comando em português (pt-BR)'}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-md ${
              ouvindoVoz
                ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 hover:border-[#10b981] text-slate-200 hover:text-white'
            }`}
          >
            {ouvindoVoz ? <MicOff size={15} className="text-red-400" /> : <Mic size={15} className="text-[#10b981]" />}
            <span>{ouvindoVoz ? 'Ouvindo...' : 'Voz Local'}</span>
          </button>

          {/* Indicador de Links Ativos */}
          <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-[#10b981] text-[11px] font-black tracking-wide">
            {totalAtivos} de 8 links ativos
          </span>
        </div>
      </div>

      {erroVoz && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200">
          {erroVoz}
        </div>
      )}

      {/* ─── CENTRO VISUAL: ORBE CENTRAL & NÓS CIRCULARES CONECTADOS ───────── */}
      <div
        style={{ backgroundColor: '#080C10', color: '#F8FAFC' }}
        className="relative w-full overflow-hidden rounded-2xl bg-[#080C10] border border-slate-800/80 p-2 md:p-4 shadow-inner"
      >
        {/* Fundo de Grade Cibernética Sutil */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#10b981 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          viewBox="0 0 700 440"
          className="w-full h-[320px] sm:h-[380px] md:h-[440px] select-none"
        >
          <defs>
            {/* Gradientes dos links */}
            <linearGradient id="gradOrbe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.4" />
            </linearGradient>

            <filter id="glowFiltro" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Linhas SVG animadas conectando o centro a cada nó */}
          {nosMapeados.map((no) => {
            const selecionado = noSelecionado?.id === no.id;
            return (
              <g key={`link-${no.id}`}>
                <line
                  x1={CENTRO_SVG.x}
                  y1={CENTRO_SVG.y}
                  x2={no.x}
                  y2={no.y}
                  stroke={no.ativo ? (selecionado ? '#10b981' : no.cor) : '#334155'}
                  strokeWidth={selecionado ? 3 : no.ativo ? 1.8 : 1}
                  strokeOpacity={no.ativo ? (selecionado ? 0.9 : 0.45) : 0.15}
                  strokeDasharray={no.ativo ? '6,6' : '3,3'}
                  className={no.ativo ? 'transition-all duration-300' : ''}
                />
                {no.ativo && (
                  <circle
                    cx={(CENTRO_SVG.x + no.x) / 2}
                    cy={(CENTRO_SVG.y + no.y) / 2}
                    r={selecionado ? 3.5 : 2}
                    fill={no.cor}
                    opacity={selecionado ? 0.9 : 0.6}
                  >
                    <animate
                      attributeName="opacity"
                      values="0.2;1;0.2"
                      dur="2.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* ─── ORBE CENTRAL (TOM) ────────────────────────────────────────── */}
          <g className="cursor-pointer" onClick={() => registrarAtividade('Núcleo TOM pulsando em espera')}>
            {/* Halo pulsante externo */}
            <circle
              cx={CENTRO_SVG.x}
              cy={CENTRO_SVG.y}
              r={estadoOrbe === 'Ouvindo...' ? 68 : estadoOrbe === 'Processando...' ? 62 : 54}
              fill="none"
              stroke={estadoOrbe === 'Ouvindo...' ? '#ef4444' : estadoOrbe === 'Processando...' ? '#f59e0b' : '#10b981'}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            >
              <animate
                attributeName="r"
                values={estadoOrbe === 'Ouvindo...' ? '64;74;64' : '52;58;52'}
                dur={estadoOrbe === 'Ouvindo...' ? '1s' : '3s'}
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0.2;0.6;0.2"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Corpo principal do Orbe */}
            <circle
              cx={CENTRO_SVG.x}
              cy={CENTRO_SVG.y}
              r="44"
              fill="#06121a"
              stroke={estadoOrbe === 'Ouvindo...' ? '#ef4444' : estadoOrbe === 'Processando...' ? '#f59e0b' : '#10b981'}
              strokeWidth="2.5"
              filter="url(#glowFiltro)"
            />

            {/* Esfera de energia interior */}
            <circle
              cx={CENTRO_SVG.x}
              cy={CENTRO_SVG.y}
              r="34"
              fill="url(#gradOrbe)"
              opacity={estadoOrbe === 'Ouvindo...' ? 0.9 : 0.65}
            />

            {/* Texto Central TOM */}
            <text
              x={CENTRO_SVG.x}
              y={CENTRO_SVG.y + 4}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="16"
              fontWeight="900"
              letterSpacing="2px"
              style={{ fontFamily: 'sans-serif' }}
            >
              TOM
            </text>

            {/* Sub-label com estado */}
            <text
              x={CENTRO_SVG.x}
              y={CENTRO_SVG.y + 20}
              textAnchor="middle"
              fill={estadoOrbe === 'Ouvindo...' ? '#fca5a5' : estadoOrbe === 'Processando...' ? '#fde047' : '#a7f3d0'}
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="0.5px"
            >
              {estadoOrbe}
            </text>
          </g>

          {/* ─── 8 NÓS CIRCULARES AO REDOR ─────────────────────────────────── */}
          {nosMapeados.map((no) => {
            const IconeComponente = no.icone;
            const selecionado = noSelecionado?.id === no.id;
            const ativo = no.ativo;

            return (
              <g
                key={no.id}
                onClick={() => handleClicarNo(no)}
                className="cursor-pointer transition-transform duration-200"
                style={{ transformOrigin: `${no.x}px ${no.y}px` }}
              >
                {/* Glow ao redor se ativo/selecionado */}
                {ativo && (
                  <circle
                    cx={no.x}
                    cy={no.y}
                    r={selecionado ? 32 : 26}
                    fill={no.cor}
                    opacity={selecionado ? 0.25 : 0.08}
                  />
                )}

                {/* Círculo do Nó */}
                <circle
                  cx={no.x}
                  cy={no.y}
                  r="23"
                  fill={ativo ? '#0a1017' : '#04070a'}
                  stroke={selecionado ? '#ffffff' : ativo ? no.cor : '#334155'}
                  strokeWidth={selecionado ? 2.5 : ativo ? 1.8 : 1}
                  strokeOpacity={ativo ? 0.9 : 0.3}
                />

                {/* Ícone via foreignObject */}
                <foreignObject
                  x={no.x - 11}
                  y={no.y - 12}
                  width="22"
                  height="22"
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center text-white">
                    {ativo ? (
                      <IconeComponente size={15} style={{ color: no.cor }} />
                    ) : (
                      <Lock size={13} className="text-slate-500" />
                    )}
                  </div>
                </foreignObject>

                {/* Label do Nó com Alto Contraste (#F8FAFC) sobre Fundo Escuro (#080C10) */}
                <text
                  x={no.x}
                  y={no.y > CENTRO_SVG.y ? no.y + 36 : no.y - 30}
                  textAnchor="middle"
                  fill={ativo ? (selecionado ? '#10b981' : '#F8FAFC') : '#94A3B8'}
                  style={{
                    fill: ativo ? (selecionado ? '#10b981' : '#F8FAFC') : '#94A3B8',
                    paintOrder: 'stroke fill',
                    stroke: '#080C10',
                    strokeWidth: '4px',
                    strokeLinejoin: 'round',
                    fontWeight: selecionado ? '900' : '700',
                  }}
                  fontSize="11.5"
                  fontWeight={selecionado ? '900' : '700'}
                  letterSpacing="0.3px"
                >
                  {no.nome}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ─── BARRA INFERIOR: PAINEL DE ATIVIDADE & NÓ FOCADO ───────────── */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-800/80">
          {/* Card do Nó Focado */}
          <div className="md:col-span-7 rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity size={12} className="text-[#10b981]" />
                  {noSelecionado ? `Nó Selecionado: ${noSelecionado.nome}` : 'Clique em qualquer nó acima para formular diretrizes'}
                </span>
                {noSelecionado && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-extrabold"
                    style={{
                      backgroundColor: `${noSelecionado.cor}20`,
                      color: noSelecionado.cor,
                      border: `1px solid ${noSelecionado.cor}40`,
                    }}
                  >
                    Contexto Enxuto (~800 tok)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
                {noSelecionado ? noSelecionado.pergunta : 'O Tom atua como segundo cérebro em modo Copiloto. Selecione um nó neural para preencher a pergunta recomendada no simulador abaixo.'}
              </p>
            </div>

            {noSelecionado && (
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10.5px] text-slate-400 truncate">
                  {noSelecionado.resumoContexto}
                </span>
                <button
                  type="button"
                  onClick={() => onSelecionarPergunta(noSelecionado.pergunta, noSelecionado)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#10b981] text-[10px] font-bold cursor-pointer transition shrink-0"
                >
                  <span>Inserir no Simulador</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            )}
          </div>

          {/* Feed de Atividade em Tempo Real */}
          <div className="md:col-span-5 rounded-xl bg-slate-900/90 border border-slate-800 p-3 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio size={12} className="text-[#10b981] animate-pulse" /> Atividade em tempo real
              </span>
              <span className="text-[9px] font-bold text-slate-500">Live Feed</span>
            </div>
            <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1">
              {atividades.map((a) => (
                <div key={a.id} className="flex items-start gap-1.5 text-[10.5px]">
                  <span className="text-slate-500 font-mono text-[9.5px] shrink-0 mt-0.5">{a.hora}</span>
                  <span className="text-slate-300 leading-tight truncate">{a.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
