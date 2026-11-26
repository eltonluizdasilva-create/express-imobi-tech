import React, { useId, useMemo, useState } from 'react';
import {
  Brain,
  FileText,
  MousePointerClick,
  Sparkles,
  X,
} from 'lucide-react';

/**
 * GrafoSegundoCerebro — mapa de nós da memória consultada pelo Tom (aba `brain`).
 *
 * Cada nó é um bloco de memória que o Tom lê antes de responder. O componente é
 * SVG puro (sem canvas nem lib de grafo) para continuar leve no bundle do painel.
 *
 * Dois contextos:
 *   • `autonomo`    → corretor que trabalha sozinho (rotina/prospecção da Zara);
 *   • `imobiliaria` → operação com equipe, roleta e repasses.
 *
 * O clique abre o painel do arquivo de memória e o botão "Simular pergunta sobre
 * este nó" entrega o prompt para o simulador real do Tom (`ExpressBrainTab`),
 * que fica mais abaixo na mesma aba. Nada aqui chama IA nem grava dado.
 */

const CENTRO = { x: 460, y: 325 };
const RAIO_X = 322;
const RAIO_Y = 220;

const NOS = {
  regras: {
    id: 'regras',
    grupo: 'Regras & Perfil',
    linhas: ['Regras & Perfil'],
    arquivo: 'REGRAS.md',
    cor: '#f59e0b',
    consulta:
      'Comissão padrão, desconto máximo, permuta, sinal e as políticas que a casa não abre mão.',
    pergunta:
      'Quais regras comerciais da casa valem para qualquer negociação e onde a equipe erra hoje?',
  },
  carteira: {
    id: 'carteira',
    grupo: 'Carteira de Imóveis',
    linhas: ['Carteira de Imóveis'],
    arquivo: 'IMOVEIS.md',
    cor: '#38bdf8',
    consulta:
      'Imóvel parado, preço fora da faixa, documentação pendente e anúncio que não gira.',
    pergunta:
      'Quais imóveis da carteira estão parados há mais de 30 dias e o que eu faço primeiro?',
  },
  leads: {
    id: 'leads',
    grupo: 'Leads & Funil',
    linhas: ['Leads & Funil'],
    arquivo: 'LEADS.md',
    cor: '#34d399',
    consulta:
      'Quem chegou, em que etapa está, quem respondeu e quem esfriou sem retorno.',
    pergunta:
      'Mostre os leads sem resposta por corretor e a regra que precisa ser cobrada para não perder esses clientes.',
  },
  memoria: {
    id: 'memoria',
    grupo: 'Memória Operacional',
    linhas: ['Memória', 'Operacional'],
    arquivo: 'MEMORIA.md',
    cor: '#a78bfa',
    consulta:
      'Histórico do negócio, promessa feita ao cliente, condomínio que trava a venda e decisão antiga da casa.',
    pergunta:
      'O que a memória operacional registra sobre os últimos negócios travados e qual erro eu repito?',
  },
  auditoria: {
    id: 'auditoria',
    grupo: 'Auditoria & Pendências',
    linhas: ['Auditoria &', 'Pendências'],
    arquivo: 'AUDITORIA.md',
    cor: '#fb7185',
    consulta:
      'Promessa fora da política, atendimento fora do SLA e pendência que ninguém assumiu.',
    pergunta:
      'Faça uma auditoria das pendências da equipe e diga o que precisa ser cobrado esta semana.',
  },
  polen: {
    id: 'polen',
    grupo: 'Pólen · WhatsApp',
    linhas: ['Pólen ·', 'WhatsApp'],
    arquivo: 'MEMORIA.md',
    cor: '#22d3ee',
    consulta:
      'Conversa que a Pólen qualificou, handoff para o corretor e objeção que se repete no WhatsApp.',
    pergunta:
      'O que a Pólen registrou nas conversas desta semana que o corretor deixou de acompanhar?',
  },
  zara: {
    id: 'zara',
    grupo: 'Zara · Prospecção',
    linhas: ['Zara ·', 'Prospecção'],
    arquivo: 'LEADS.md',
    cor: '#c084fc',
    consulta:
      'Rotina de prospecção, retorno atrasado e lead que a Zara colocou na fila de atendimento.',
    pergunta:
      'Monte a rotina de prospecção da semana priorizando o lead mais quente e o mais parado.',
  },
  contratos: {
    id: 'contratos',
    grupo: 'Contratos & Legal',
    linhas: ['Contratos &', 'Legal'],
    arquivo: 'REGRAS.md',
    cor: '#facc15',
    consulta:
      'Cláusula padrão, sinal, distrato e o limite em que o Tom chama o advogado (OAB) em vez de opinar.',
    pergunta:
      'Quais cláusulas e garantias a casa exige antes de fechar proposta e quando o caso vai para o advogado?',
  },
  equipe: {
    id: 'equipe',
    grupo: 'Equipe & Roleta',
    linhas: ['Equipe &', 'Roleta'],
    arquivo: 'AUDITORIA.md',
    cor: '#2dd4bf',
    consulta:
      'Quem recebeu o lead na roleta, quem deixou sem resposta e como a carga está distribuída.',
    pergunta:
      'Como está a distribuição da roleta e quem está com lead acumulado sem atendimento?',
  },
  repasses: {
    id: 'repasses',
    grupo: 'Repasses & NF',
    linhas: ['Repasses & NF'],
    arquivo: 'MEMORIA.md',
    cor: '#f472b6',
    consulta:
      'Comissão a repassar, nota fiscal pendente e negócio fechado que travou no financeiro.',
    pergunta:
      'Quais repasses e notas fiscais estão pendentes e o que eu cobro primeiro?',
  },
};

const VISOES = [
  {
    id: 'autonomo',
    rotulo: 'Visão Autônomo',
    resumo:
      'Corretor que trabalha sozinho: regras, carteira, leads e a rotina de prospecção da Zara.',
    ids: ['regras', 'carteira', 'leads', 'polen', 'auditoria', 'memoria', 'contratos', 'zara'],
  },
  {
    id: 'imobiliaria',
    rotulo: 'Visão Imobiliária',
    resumo:
      'Operação com equipe: entra roleta, carga de atendimento e repasses para o Tom auditar.',
    ids: [
      'regras',
      'carteira',
      'leads',
      'equipe',
      'polen',
      'auditoria',
      'memoria',
      'repasses',
      'contratos',
      'zara',
    ],
  },
];

/** Ligações cruzadas (além do raio central). Só aparecem se as duas pontas existirem na visão. */
const LIGACOES_CRUZADAS = [
  ['regras', 'contratos'],
  ['regras', 'equipe'],
  ['carteira', 'leads'],
  ['carteira', 'memoria'],
  ['carteira', 'repasses'],
  ['leads', 'polen'],
  ['leads', 'zara'],
  ['leads', 'equipe'],
  ['auditoria', 'equipe'],
  ['auditoria', 'memoria'],
  ['polen', 'memoria'],
  ['repasses', 'contratos'],
  ['zara', 'memoria'],
];

function posicoesDosNos(ids) {
  return ids.map((id, indice) => {
    const angulo = (-90 + (360 / ids.length) * indice) * (Math.PI / 180);
    return {
      ...NOS[id],
      x: CENTRO.x + RAIO_X * Math.cos(angulo),
      y: CENTRO.y + RAIO_Y * Math.sin(angulo),
    };
  });
}

export default function GrafoSegundoCerebro({ onSimularPergunta = () => {} }) {
  const [visaoId, setVisaoId] = useState('autonomo');
  const [hoverId, setHoverId] = useState(null);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const idBase = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const visao = VISOES.find((item) => item.id === visaoId) || VISOES[0];
  const nos = useMemo(() => posicoesDosNos(visao.ids), [visao]);
  const idsVisiveis = new Set(visao.ids);
  const paresCruzados = LIGACOES_CRUZADAS.filter(
    ([a, b]) => idsVisiveis.has(a) && idsVisiveis.has(b),
  );
  const noSelecionado = nos.find((no) => no.id === selecionadoId) || null;
  const ativoId = hoverId || selecionadoId;
  const vizinhos = new Set();
  if (ativoId) {
    for (const [a, b] of paresCruzados) {
      if (a === ativoId) vizinhos.add(b);
      if (b === ativoId) vizinhos.add(a);
    }
  }
  const totalArquivos = new Set(nos.map((no) => no.arquivo)).size;

  const trocarVisao = (id) => {
    setVisaoId(id);
    setHoverId(null);
    setSelecionadoId(null);
  };

  const simular = () => {
    if (noSelecionado?.pergunta) onSimularPergunta(noSelecionado.pergunta);
  };

  return (
    <section
      className="grafo-sc overflow-hidden rounded-3xl border border-amber-500/25 shadow-[0_30px_90px_-55px_rgba(245,158,11,0.75)]"
      style={{ backgroundColor: '#090d12' }}
    >
      <style>{`
        .grafo-sc .grafo-ligacao { transition: stroke 200ms ease, opacity 200ms ease, stroke-width 200ms ease; }
        .grafo-sc .grafo-no { cursor: pointer; transition: opacity 200ms ease; }
        .grafo-sc .grafo-no-caixa { transform-box: fill-box; transform-origin: center; transition: transform 200ms ease, filter 200ms ease; }
        .grafo-sc .grafo-no:hover .grafo-no-caixa,
        .grafo-sc .grafo-no:focus-visible .grafo-no-caixa { transform: scale(1.035); }
        .grafo-sc .grafo-no:focus { outline: none; }
        .grafo-sc .grafo-no:focus-visible .grafo-no-caixa { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.55)); }
        .grafo-sc .grafo-halo { transform-box: fill-box; transform-origin: center; animation: grafoPulso 5.5s ease-in-out infinite; }
        .grafo-sc .grafo-orbita { transform-box: fill-box; transform-origin: center; animation: grafoGira 34s linear infinite; }
        @keyframes grafoPulso {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.12); }
        }
        @keyframes grafoGira { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .grafo-sc .grafo-halo,
          .grafo-sc .grafo-orbita { animation: none; }
          .grafo-sc .grafo-ligacao,
          .grafo-sc .grafo-no-caixa { transition: none; }
        }
      `}</style>

      <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-300">
            <Brain size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/90">
              Memória viva · {nos.length} nós · {totalArquivos} arquivos
            </p>
            <h3 className="mt-0.5 text-sm font-black uppercase tracking-tight text-white md:text-base">
              Grafo do Segundo Cérebro
            </h3>
            <p className="mt-1 text-[11px] leading-5 text-slate-400 md:text-xs">
              Cada nó é um arquivo que o Tom lê antes de responder. Passe o rato para
              ver as ligações e clique para abrir a memória.
            </p>
          </div>
        </div>

        <div
          role="group"
          aria-label="Contexto do grafo"
          className="inline-flex shrink-0 self-start rounded-full border border-slate-700/80 bg-[#0b1220] p-1 md:self-auto"
        >
          {VISOES.map((item) => {
            const ativa = item.id === visaoId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => trocarVisao(item.id)}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                  ativa
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-amber-200'
                }`}
              >
                {item.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto overscroll-x-contain px-1 pb-1 pt-2 md:px-3">
        <svg
          viewBox="0 0 920 650"
          role="group"
          aria-label={`Grafo do Segundo Cérebro — ${visao.rotulo}`}
          className="block h-auto w-full min-w-[600px] select-none"
        >
          <defs>
            <pattern id={`${idBase}-grade`} width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M34 0H0V34" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.5" />
            </pattern>
            <radialGradient id={`${idBase}-fundo`} cx="50%" cy="46%" r="72%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="70%" stopColor="#0a0f16" />
              <stop offset="100%" stopColor="#090d12" />
            </radialGradient>
            <radialGradient id={`${idBase}-halo`}>
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${idBase}-ouro`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <filter id={`${idBase}-brilho`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          <rect width="920" height="650" fill={`url(#${idBase}-fundo)`} />
          <rect width="920" height="650" fill={`url(#${idBase}-grade)`} />
          <ellipse
            cx={CENTRO.x}
            cy={CENTRO.y}
            rx={310}
            ry={230}
            fill={`url(#${idBase}-halo)`}
            opacity="0.6"
          />
          <text x="24" y="34" fill="#334155" fontSize="9" fontWeight="700" letterSpacing="2">
            MEMÓRIA CONSULTADA PELO TOM
          </text>
          <text
            x="896"
            y="34"
            textAnchor="end"
            fill="#475569"
            fontSize="9"
            fontWeight="700"
            letterSpacing="1.5"
          >
            {visao.rotulo.toUpperCase()}
          </text>

          <g aria-hidden="true">
            {paresCruzados.map(([aId, bId]) => {
              const a = nos.find((no) => no.id === aId);
              const b = nos.find((no) => no.id === bId);
              if (!a || !b) return null;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const cx = mx + (mx - CENTRO.x) * 0.38;
              const cy = my + (my - CENTRO.y) * 0.38;
              const ativa = ativoId === aId || ativoId === bId;
              const ligada = !ativoId || ativa || vizinhos.has(aId) || vizinhos.has(bId);
              return (
                <path
                  key={`${aId}-${bId}`}
                  d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                  fill="none"
                  strokeDasharray="3 5"
                  className="grafo-ligacao"
                  style={{
                    stroke: ativa ? (aId === ativoId ? a.cor : b.cor) : '#64748b',
                    strokeWidth: ativa ? 1.6 : 1,
                    opacity: ativa ? 0.68 : ativoId ? (ligada ? 0.12 : 0.04) : 0.13,
                  }}
                />
              );
            })}

            {nos.map((no) => {
              const ativa = ativoId === no.id;
              const ligada = !ativoId || ativa || vizinhos.has(no.id);
              return (
                <line
                  key={`centro-${no.id}`}
                  x1={CENTRO.x}
                  y1={CENTRO.y}
                  x2={no.x}
                  y2={no.y}
                  className="grafo-ligacao"
                  style={{
                    stroke: ativa ? no.cor : '#64748b',
                    strokeWidth: ativa ? 1.8 : 1,
                    opacity: ativa ? 0.9 : ativoId ? (ligada ? 0.16 : 0.05) : 0.22,
                  }}
                />
              );
            })}
          </g>

          <g aria-hidden="true">
            <circle
              cx={CENTRO.x}
              cy={CENTRO.y}
              r="118"
              fill={`url(#${idBase}-halo)`}
              className="grafo-halo"
            />
            <circle cx={CENTRO.x} cy={CENTRO.y} r="72" fill="none" stroke="#f59e0b" strokeOpacity="0.16" />
            <circle cx={CENTRO.x} cy={CENTRO.y} r="64" fill="#0f172a" stroke="#f59e0b" strokeOpacity="0.35" />
            <circle
              cx={CENTRO.x}
              cy={CENTRO.y}
              r="54"
              fill={`url(#${idBase}-ouro)`}
              filter={`url(#${idBase}-brilho)`}
              opacity="0.4"
            />
            <circle cx={CENTRO.x} cy={CENTRO.y} r="54" fill={`url(#${idBase}-ouro)`} />
            <circle
              cx={CENTRO.x}
              cy={CENTRO.y}
              r="60"
              fill="none"
              stroke="#fde68a"
              strokeOpacity="0.5"
              strokeWidth="1"
              strokeDasharray="2 6"
              className="grafo-orbita"
            />
            <text
              x={CENTRO.x}
              y={CENTRO.y - 2}
              textAnchor="middle"
              fontSize="22"
              fontWeight="900"
              letterSpacing="3"
              fill="#3b2504"
            >
              TOM
            </text>
            <text
              x={CENTRO.x}
              y={CENTRO.y + 17}
              textAnchor="middle"
              fontSize="8"
              fontWeight="800"
              letterSpacing="1.6"
              fill="#4a3206"
            >
              · NÚCLEO ·
            </text>
            <text
              x={CENTRO.x}
              y={CENTRO.y + 98}
              textAnchor="middle"
              fontSize="8"
              fontWeight="800"
              letterSpacing="2.2"
              fill="#f59e0b"
              opacity="0.55"
            >
              MEMÓRIA VIVA
            </text>
          </g>

          {nos.map((no) => {
            const ativa = ativoId === no.id;
            const vizinho = vizinhos.has(no.id);
            const selecionado = selecionadoId === no.id;
            const opacidade = !ativoId ? 1 : ativa ? 1 : vizinho ? 0.74 : 0.3;
            return (
              <g
                key={no.id}
                transform={`translate(${no.x} ${no.y})`}
                className="grafo-no"
                style={{ opacity: opacidade }}
                tabIndex={0}
                role="button"
                aria-pressed={selecionado}
                aria-label={`${no.grupo}, arquivo ${no.arquivo}. ${
                  selecionado ? 'Painel aberto.' : 'Clique para abrir a memória.'
                }`}
                onMouseEnter={() => setHoverId(no.id)}
                onMouseLeave={() => setHoverId((atual) => (atual === no.id ? null : atual))}
                onFocus={() => setHoverId(no.id)}
                onBlur={() => setHoverId((atual) => (atual === no.id ? null : atual))}
                onClick={() => setSelecionadoId(no.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelecionadoId(no.id);
                  }
                }}
              >
                <g className="grafo-no-caixa">
                  {ativa && (
                    <rect x={-90} y={-34} width={180} height={68} rx={20} fill={no.cor} opacity={0.09} />
                  )}
                  {selecionado && (
                    <rect
                      x={-88}
                      y={-32}
                      width={176}
                      height={64}
                      rx={18}
                      fill="none"
                      stroke={no.cor}
                      strokeOpacity={0.6}
                      strokeDasharray="4 5"
                    />
                  )}
                  <rect
                    x={-84}
                    y={-29}
                    width={168}
                    height={58}
                    rx={16}
                    fill="#0f172a"
                    stroke={ativa ? no.cor : 'rgba(148, 163, 184, 0.24)'}
                    strokeWidth={ativa ? 1.8 : 1}
                  />
                  <rect
                    x={-84}
                    y={-17}
                    width={3}
                    height={34}
                    rx={1.5}
                    fill={no.cor}
                    opacity={ativa ? 1 : 0.72}
                  />
                  <circle cx={-66} cy={0} r={4} fill={no.cor} />
                  {no.linhas.length > 1 ? (
                    <>
                      <text x={-53} y={-7} fontSize="10.5" fontWeight="800" fill={ativa ? '#ffffff' : '#e2e8f0'}>
                        {no.linhas[0]}
                      </text>
                      <text x={-53} y={6} fontSize="10.5" fontWeight="800" fill={ativa ? '#ffffff' : '#e2e8f0'}>
                        {no.linhas[1]}
                      </text>
                      <text
                        x={-53}
                        y={21}
                        fontSize="7.5"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        fill={ativa ? no.cor : '#94a3b8'}
                      >
                        {no.arquivo}
                      </text>
                    </>
                  ) : (
                    <>
                      <text x={-53} y={-1} fontSize="10.5" fontWeight="800" fill={ativa ? '#ffffff' : '#e2e8f0'}>
                        {no.linhas[0]}
                      </text>
                      <text
                        x={-53}
                        y={17}
                        fontSize="7.5"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        fill={ativa ? no.cor : '#94a3b8'}
                      >
                        {no.arquivo}
                      </text>
                    </>
                  )}
                  <text
                    x={78}
                    y={0}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize="9"
                    fill={no.cor}
                    opacity={ativa ? 1 : 0.55}
                  >
                    ↗
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-slate-800/80 p-4 md:p-5" aria-live="polite">
        {noSelecionado ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em]"
                  style={{
                    borderColor: `${noSelecionado.cor}66`,
                    color: noSelecionado.cor,
                    backgroundColor: `${noSelecionado.cor}14`,
                  }}
                >
                  <FileText size={11} aria-hidden="true" />
                  {noSelecionado.arquivo}
                </span>
                <span className="truncate text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  {noSelecionado.grupo}
                </span>
                <button
                  type="button"
                  onClick={() => setSelecionadoId(null)}
                  aria-label="Fechar painel do nó"
                  className="ml-auto cursor-pointer rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-300">
                <strong className="font-black text-white">O Tom consulta aqui:</strong>{' '}
                {noSelecionado.consulta}
              </p>
              <p className="mt-1 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-slate-400">
                <span className="font-black uppercase tracking-[0.12em] text-slate-500">
                  Pergunta de exemplo
                </span>
                <br />“{noSelecionado.pergunta}”
              </p>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <button
                type="button"
                onClick={simular}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
              >
                <Sparkles size={14} aria-hidden="true" />
                Simular pergunta sobre este nó
              </button>
              <span className="text-[10px] leading-4 text-slate-500 md:text-right">
                Abre o simulador do Tom nesta página já com a pergunta.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-700/70 bg-[#0b1220]/60 p-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <MousePointerClick size={15} className="text-amber-400" aria-hidden="true" />
              Clique em um nó para abrir o arquivo de memória que o Tom consulta.
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {visao.resumo}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

