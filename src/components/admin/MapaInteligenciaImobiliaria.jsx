import React, { useState } from 'react';
import {
  ArrowDown,
  Brain,
  ClipboardList,
  Database,
  MessageCircle,
  Network,
  Workflow,
} from 'lucide-react';
import PrestacaoContasProprietario from '../imobi/PrestacaoContasProprietario';


const NOS = [
  {
    id: 'polen',
    titulo: 'Pólen',
    papel: 'Secretária 24h',
    descricao:
      'Atende e qualifica conversas pelo WhatsApp, encaminhando os dados do lead para a operação.',
    icone: MessageCircle,
    cor: '#10b981',
  },
  {
    id: 'zara',
    titulo: 'Agentes Operacionais · Zara',
    papel: 'Execução da rotina e do funil',
    descricao:
      'Coordena retornos, visitas e acompanhamento dos negócios com base nos registros da operação.',
    icone: Workflow,
    cor: '#8b5cf6',
  },
  {
    id: 'crm',
    titulo: 'CRM · Base de Imóveis e Leads',
    papel: 'Registro central da operação',
    descricao:
      'Organiza os imóveis e leads que dão contexto aos atendimentos, às tarefas e às decisões da equipe.',
    icone: Database,
    cor: '#0284c7',
  },
  {
    id: 'tom',
    titulo: 'Tom',
    papel: 'Segundo Cérebro Estratégico',
    descricao:
      'Apoia decisões usando o contexto da operação com visão executiva e memória operacional contínua.',
    icone: Brain,
    cor: '#f59e0b',
  },
];

const ECOSSISTEMA_GIF =
  new URL('../../assets/ecossistema-express.gif', import.meta.url).href ||
  '/images/ecossistema-express.gif';

export default function MapaInteligenciaImobiliaria({
  temaClaro = false,
  imoveis = [],
  leads = [],
  visitas = [],
  propostas = [],
  dadosOficina = null,
  onAbrirAba,
  imovelPrestacao = null,
}) {
  const [selecionado, setSelecionado] = useState('crm');
  // Sub-abas do módulo: o mapa do ecossistema e a prestação de contas ao
  // proprietário. Nada de nova aba na sidebar — o PLUS já abre este módulo.
  // Sem efeito de sincronização: o deep link é derivado no render, então a
  // escolha manual do usuário sempre vence a sugestão.
  const [subAbaManual, setSubAbaManual] = useState(null);
  const subAba = subAbaManual || (imovelPrestacao ? 'prestacao' : 'mapa');
  const setSubAba = setSubAbaManual;
  const noAtivo = NOS.find((no) => no.id === selecionado) || NOS[2];
  const ItemAtivo = noAtivo.icone;
  const texto = temaClaro ? 'text-slate-600' : 'text-slate-300';
  const cartao = temaClaro
    ? 'border-slate-200 bg-white'
    : 'border-emerald-500/20 bg-[#020408]';
  const nomeImobiliaria = dadosOficina?.nome || dadosOficina?.nomeOficina || '';
  const corretor = dadosOficina?.nomeCorretor || dadosOficina?.corretorResponsavel || '';
  const subAbas = [
    { id: 'mapa', rotulo: 'Mapa do ecossistema', icone: Network },
    { id: 'prestacao', rotulo: 'Prestação de contas', icone: ClipboardList },
  ];

  // Deep link da Captação por Nicho abre direto na prestação de contas
  // (derivado acima em `subAba`, sem efeito).



  return (
    <div className="mapa-inteligencia space-y-5">
      <style>{`
        .mapa-inteligencia .mapa-stage {
          box-shadow: 0 20px 60px -25px rgba(16, 185, 129, 0.45), inset 0 1px 0 rgba(255,255,255,0.08);
          background: #020408;
        }
        .mapa-inteligencia .mapa-node {
          transition: all 200ms ease;
        }
        .mapa-inteligencia .mapa-node:hover {
          transform: translateY(-2px);
        }
        .mapa-inteligencia .mapa-resumo {
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 38px -28px rgba(16,185,129,0.45);
        }
      `}</style>

      <div role="tablist" aria-label="Seções do módulo Central de Inteligência" className="flex flex-wrap gap-2">
        {subAbas.map((sub) => {
          const ativo = subAba === sub.id;
          const IconeSub = sub.icone;
          return (
            <button
              key={sub.id}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => setSubAba(sub.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition ${
                ativo
                  ? 'border-teal-500 bg-teal-500/15 text-teal-300'
                  : temaClaro
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700'
              }`}
            >
              <IconeSub size={13} aria-hidden="true" /> {sub.rotulo}
            </button>
          );
        })}
      </div>

      {subAba === 'prestacao' ? (
        <PrestacaoContasProprietario
          imoveis={imoveis}
          leads={leads}
          visitas={visitas}
          propostas={propostas}
          nomeImobiliaria={nomeImobiliaria}
          corretor={corretor}
          imovelInicial={imovelPrestacao}
          onAbrirCaptacao={onAbrirAba ? () => onAbrirAba('captacao_imobi') : undefined}
        />
      ) : (
      <section className={`rounded-3xl border p-4 sm:p-6 ${cartao}`} aria-label="Mapa interativo de ferramentas">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className={`text-sm font-black uppercase tracking-wide ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
              Fluxo da operação
            </h2>
            <p className={`mt-1 text-xs ${texto}`}>
              Ecossistema integrado em tempo real conectando atendimento, rotina, inteligência e base de dados.
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
            Atendimento · rotina · estratégia · base
          </span>
        </div>

        {/* Palco do GIF Animado em Loop Suave */}
        <div className="mapa-stage relative mx-auto overflow-hidden rounded-2xl border border-emerald-500/30">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/4 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-[80px]" />
          <img
            src={ECOSSISTEMA_GIF}
            alt="Fluxo da Operação - Ecossistema Integrado Express Imobi Tech"
            className="w-full h-auto block select-none pointer-events-none"
            loading="eager"
            onError={(e) => {
              if (e.currentTarget.src !== '/images/ecossistema-express.gif') {
                e.currentTarget.src = '/images/ecossistema-express.gif';
              } else if (!e.currentTarget.dataset.triedFallback) {
                e.currentTarget.dataset.triedFallback = '1';
                e.currentTarget.src = '/assets/ecossistema-express.gif';
              }
            }}
          />
        </div>

        {/* Seletores Interativos dos 4 Módulos */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NOS.map((no) => {
            const ativo = selecionado === no.id;
            const Icone = no.icone;
            return (
              <button
                key={no.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => setSelecionado(no.id)}
                className={`mapa-node flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition sm:p-3 ${
                  ativo
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/20'
                    : temaClaro
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-800/80 bg-slate-950/70 hover:border-slate-700'
                }`}
                style={{
                  borderColor: ativo ? no.cor : undefined,
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform"
                  style={{ backgroundColor: `${no.cor}22`, color: no.cor }}
                >
                  <Icone size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className={`block truncate text-xs font-bold ${temaClaro ? 'text-slate-900' : 'text-white'}`}>
                    {no.titulo}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">
                    {no.papel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Resumo do Módulo Selecionado */}
        <div
          className="mapa-resumo mt-3 flex gap-3 rounded-2xl border p-4 transition-all"
          style={{
            borderColor: `${noAtivo.cor}66`,
            backgroundColor: `${noAtivo.cor}12`,
          }}
          aria-live="polite"
        >
          <ItemAtivo size={20} className="mt-0.5 shrink-0" style={{ color: noAtivo.cor }} aria-hidden="true" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: noAtivo.cor }}>
              {noAtivo.papel}
            </p>
            <p className={`mt-1 text-sm leading-relaxed ${texto}`}>{noAtivo.descricao}</p>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
