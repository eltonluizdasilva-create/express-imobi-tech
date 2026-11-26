import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  FileText,
  HelpCircle,
  MessageCircle,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react';
import LogoExpress from './components/ui/LogoExpress';
import { EMAIL_INSTITUCIONAL } from './lib/appUrl';
import { EMAIL_EXCLUSAO, EMPRESA } from './pages/legal/conteudoLegal';
import { abrirPreferenciasCookies } from './lib/consentimentoCookies';

const EMAIL = EMAIL_INSTITUCIONAL;

const LINKS = [
  { id: 'rotina', label: 'Sua Rotina' },
  { id: 'quem-somos', label: 'Quem Somos' },
  { id: 'ia', label: 'Atendimento & IA' },
  { id: 'plano-gratis', label: 'Plano Grátis' },
];

const DORES = [
  {
    Icone: Target,
    titulo: 'Avaliação no achismo e horas perdidas',
    texto:
      'Proprietário pedindo valor fora da realidade e você gastando tempo tentando justificar preço na mão sem respaldo técnico.',
  },
  {
    Icone: MessageCircle,
    titulo: 'Cliente ligando toda hora atrás de notícia',
    texto:
      'Você no meio de uma visita ou negociação e o cliente cobrando atualização porque não sabe em que pé está o processo.',
  },
  {
    Icone: TrendingUp,
    titulo: 'Metas no escuro',
    texto:
      'Trabalhar o mês inteiro na correria sem enxergar com clareza o quanto já produziu e o que falta para bater sua meta de comissões.',
  },
  {
    Icone: FileText,
    titulo: 'Propostas & Negócios soltos',
    texto:
      'Propostas perdidas em conversas antigas, negociações esfriando por falta de acompanhamento e dinheiro ficando na mesa.',
  },
  {
    Icone: HelpCircle,
    titulo: 'Dúvidas rápidas que travam a conversa',
    texto:
      'Insegurança na hora de ter uma noção clara sobre financiamento, impostos ou regras do negócio diante do cliente.',
  },
];

const PONTOS_POLEN = [
  {
    Icone: Mic,
    texto:
      'Cliente mandando áudio enquanto você dirige ou está em visita: ela ouve, responde em áudio e acolhe o cliente sem você precisar parar tudo.',
  },
  {
    Icone: MessageCircle,
    texto:
      'Lead pedindo foto e detalhes à noite ou no fim de semana: ela consulta sua carteira, manda a foto na hora e tira as primeiras dúvidas 24h por dia.',
  },
  {
    Icone: ShieldCheck,
    texto:
      'Curioso tomando seu tempo: ela faz o filtro inicial com educação e entrega o cliente aquecido para você focar no fechamento.',
  },
];

const PONTOS_TOM = [
  {
    Icone: Users,
    texto:
      'Panorama de leads e equipe: mostra como está a operação hoje e qual corretor ainda não deu feedback.',
  },
  {
    Icone: Bot,
    texto:
      'Treinamento de corretor novo: prepara a filosofia e os detalhes da sua imobiliária sem você repetir tudo do zero.',
  },
  {
    Icone: FileText,
    texto:
      'Ata de reunião: você envia o áudio ou anotações e o Tom compila os pontos principais e próximos passos.',
  },
  {
    Icone: Video,
    texto:
      'Vídeos e Reels: ajuda a editar e deixar o material pronto para você revisar e postar com facilidade.',
  },
];

function ImagemProduto({ src, alt, rotulo, Icone }) {
  const [erroImagem, setErroImagem] = useState(false);

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
      {erroImagem ? (
        <div
          role="img"
          aria-label={`${alt}. Prévia visual indisponível.`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 px-6 text-center"
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <Icone size={30} aria-hidden="true" />
          </div>
          <div>
            <p className="font-bold text-white">{rotulo}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              A imagem de demonstração será exibida quando o arquivo estiver disponível.
            </p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setErroImagem(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}
      {!erroImagem && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent px-5 pb-5 pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
            <Icone size={13} aria-hidden="true" />
            {rotulo}
          </span>
        </div>
      )}
    </div>
  );
}

function ListaPontos({ itens, cor = 'emerald' }) {
  const classes =
    cor === 'amber'
      ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
      : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';

  return (
    <ul className="mt-6 space-y-4">
      {itens.map(({ Icone, texto }) => (
        <li key={texto} className="flex items-start gap-3">
          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${classes}`}>
            <Icone size={15} aria-hidden="true" />
          </span>
          <span className="text-sm leading-relaxed text-slate-300">{texto}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen scroll-smooth bg-slate-950 font-sans text-slate-50 selection:bg-emerald-500/30 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#topo" className="flex shrink-0 items-center gap-2.5" aria-label="Express Imobi Tech — início">
            <LogoExpress tamanho="sm" comWordmark={false} />
            <span className="text-sm font-extrabold tracking-tight text-white sm:text-base">
              Express <span className="text-emerald-300">Imobi</span> Tech
            </span>
          </a>

          <nav aria-label="Navegação principal" className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-8">
            {LINKS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="whitespace-nowrap text-[13px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => navigate('/login-admin')}
              className="rounded-full px-3 py-2 text-[13px] font-semibold text-slate-300 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:px-4"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="rounded-full bg-emerald-400 px-4 py-2 text-[13px] font-extrabold text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Testar Grátis
            </button>
          </div>
        </div>

        <nav aria-label="Navegação mobile" className="flex gap-5 overflow-x-auto border-t border-white/[0.05] px-4 py-2.5 lg:hidden">
          {LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="topo">
        <style>{`
          .home-hero-scene { perspective: 1100px; }
          .home-hero-panel {
            transform: rotateX(5deg) rotateY(-7deg);
            transform-style: preserve-3d;
            animation: home-hero-drift 8s ease-in-out infinite;
          }
          .home-hero-glow { animation: home-hero-glow 5s ease-in-out infinite alternate; }
          .home-hero-float { animation: home-hero-float 6s ease-in-out infinite; }
          .home-hero-float-late { animation: home-hero-float 6s ease-in-out 1.2s infinite; }
          @keyframes home-hero-drift {
            0%, 100% { transform: rotateX(5deg) rotateY(-7deg) translateY(0); }
            50% { transform: rotateX(3deg) rotateY(-4deg) translateY(-7px); }
          }
          @keyframes home-hero-glow {
            from { opacity: .35; transform: scale(.94); }
            to { opacity: .7; transform: scale(1.06); }
          }
          @keyframes home-hero-float {
            0%, 100% { translate: 0 0; }
            50% { translate: 0 -6px; }
          }
          @media (max-width: 1023px) {
            .home-hero-panel { transform: none; animation: home-hero-float 8s ease-in-out infinite; }
          }
          @media (prefers-reduced-motion: reduce) {
            .home-hero-panel, .home-hero-glow, .home-hero-float, .home-hero-float-late {
              animation: none !important;
              transform: none !important;
              translate: none !important;
            }
          }
        `}</style>

        <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
          <div aria-hidden="true" className="pointer-events-none absolute -left-36 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[110px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-0 -z-10 h-[24rem] w-[24rem] rounded-full bg-teal-400/[0.07] blur-[110px]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 md:grid-cols-[1.02fr_0.98fr] md:gap-4 lg:gap-8 lg:px-8 lg:pb-10 lg:pt-10">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-200 sm:text-[10px] sm:tracking-[0.18em]">
                <Sparkles size={13} aria-hidden="true" />
                ENGENHARIA • CORRETAGEM • INTELIGÊNCIA ARTIFICIAL
              </span>

              <h1 className="mt-3 max-w-xl text-[1.85rem] font-black leading-[1.04] tracking-tight text-white sm:mt-4 sm:text-5xl lg:text-[3.35rem]">
                Mais clareza no funil.
                <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                  Mais tempo para vender.
                </span>
              </h1>

              <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
                Organize leads, imóveis e visitas em um só lugar — com ferramentas feitas para a rotina de corretores e imobiliárias.
              </p>

              <div className="mt-4 flex flex-col items-start gap-2 sm:mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/cadastro')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_12px_34px_-14px_rgba(16,185,129,0.85)] transition hover:-translate-y-0.5 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:w-auto sm:px-6"
                >
                  Comece grátis e organize sua operação <span aria-hidden="true">→</span>
                </button>
                <p className="text-center text-[11px] leading-relaxed text-slate-500 sm:text-left sm:text-xs">
                  Sem cartão de crédito <span className="px-1 text-amber-300">•</span> Sem compromisso
                </p>
              </div>

              <div className="mt-4 hidden flex-wrap gap-2 sm:mt-6 sm:flex">
                {['CRM imobiliário', 'Agenda e visitas', 'Gestão da operação'].map((item) => (
                  <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-slate-300 sm:text-[11px]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="home-hero-scene relative mx-auto h-[190px] w-full max-w-[500px] sm:h-[250px] md:h-[280px] lg:h-[340px]">
              <div aria-hidden="true" className="home-hero-glow absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-[65px] sm:h-64 sm:w-64" />

              <div className="home-hero-panel absolute inset-3 overflow-hidden rounded-[1.6rem] border border-emerald-300/20 bg-slate-900/80 shadow-[0_30px_90px_-40px_rgba(16,185,129,0.55)] backdrop-blur-md sm:inset-5 sm:rounded-[2rem]">
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-emerald-400/[0.11] via-transparent to-sky-400/[0.08]" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5 sm:px-5 sm:py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 sm:text-[9px]">
                      Visão da operação
                    </span>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-1 text-[7px] font-bold uppercase tracking-wider text-emerald-200 sm:text-[8px]">
                    Express Imobi Tech
                  </span>
                </div>

                <svg
                  viewBox="0 0 500 320"
                  className="absolute inset-0 h-full w-full"
                  role="img"
                  aria-label="Ilustração isométrica de uma imobiliária conectada a leads, imóveis e visitas"
                >
                  <defs>
                    <linearGradient id="home-building-top" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="#34d399" stopOpacity=".9" />
                      <stop offset="1" stopColor="#0d9488" stopOpacity=".58" />
                    </linearGradient>
                    <linearGradient id="home-building-left" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#0f766e" stopOpacity=".82" />
                      <stop offset="1" stopColor="#064e3b" stopOpacity=".68" />
                    </linearGradient>
                    <linearGradient id="home-building-right" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#0284c7" stopOpacity=".66" />
                      <stop offset="1" stopColor="#0f172a" stopOpacity=".86" />
                    </linearGradient>
                    <filter id="home-building-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="9" />
                    </filter>
                  </defs>
                  <g fill="none" stroke="#6ee7b7" strokeOpacity=".12">
                    <path d="M56 255 250 143 444 255 250 367Z" />
                    <path d="M104 282 250 198 396 282 250 366Z" />
                    <path d="M150 306 250 248 350 306 250 364Z" />
                  </g>
                  <path d="M250 83 350 141 250 199 150 141Z" fill="#10b981" opacity=".34" filter="url(#home-building-glow)" />
                  <path d="M250 92 340 144 250 196 160 144Z" fill="url(#home-building-top)" stroke="#a7f3d0" strokeOpacity=".7" />
                  <path d="M160 144 250 196 250 294 160 242Z" fill="url(#home-building-left)" stroke="#6ee7b7" strokeOpacity=".35" />
                  <path d="M250 196 340 144 340 242 250 294Z" fill="url(#home-building-right)" stroke="#7dd3fc" strokeOpacity=".35" />
                  <path d="M250 92V196M205 118l90 52M295 118l-90 52" stroke="#d1fae5" strokeOpacity=".58" />
                  <g fill="#d1fae5" fillOpacity=".76">
                    <path d="m181 158 18 10v22l-18-10z" />
                    <path d="m216 178 18 10v22l-18-10z" />
                    <path d="m181 198 18 10v22l-18-10z" />
                    <path d="m216 218 18 10v22l-18-10z" />
                  </g>
                  <g fill="#bae6fd" fillOpacity=".75">
                    <path d="m267 188 18-10v22l-18 10z" />
                    <path d="m301 168 18-10v22l-18 10z" />
                    <path d="m267 228 18-10v22l-18 10z" />
                    <path d="m301 208 18-10v22l-18 10z" />
                  </g>
                  <path d="M82 112C120 82 145 87 174 112M326 95c35-21 62-14 91 15M343 260c31 14 42 13 68 2" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 7" opacity=".65" />
                  <circle cx="82" cy="112" r="4" fill="#6ee7b7" />
                  <circle cx="417" cy="110" r="4" fill="#7dd3fc" />
                  <circle cx="411" cy="262" r="4" fill="#fcd34d" />
                </svg>

                <div className="home-hero-float absolute left-2 top-[28%] rounded-xl border border-emerald-300/20 bg-slate-950/90 px-2.5 py-2 shadow-xl backdrop-blur sm:left-4 sm:px-3">
                  <span className="block text-[7px] font-bold uppercase tracking-widest text-emerald-300 sm:text-[8px]">Leads</span>
                  <span className="mt-0.5 block text-[9px] font-black text-white sm:text-[10px]">Próximo passo claro</span>
                </div>
                <div className="home-hero-float-late absolute right-2 top-[38%] rounded-xl border border-sky-300/20 bg-slate-950/90 px-2.5 py-2 shadow-xl backdrop-blur sm:right-4 sm:px-3">
                  <span className="block text-[7px] font-bold uppercase tracking-widest text-sky-300 sm:text-[8px]">Imóveis</span>
                  <span className="mt-0.5 block text-[9px] font-black text-white sm:text-[10px]">Carteira organizada</span>
                </div>
                <div className="home-hero-float absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl border border-amber-300/20 bg-slate-950/90 px-3 py-2 shadow-xl backdrop-blur sm:bottom-4">
                  <span className="block text-center text-[7px] font-bold uppercase tracking-widest text-amber-200 sm:text-[8px]">Agenda</span>
                  <span className="mt-0.5 block text-[9px] font-black text-white sm:text-[10px]">Visitas e retornos</span>
                </div>
              </div>

              <span aria-hidden="true" className="absolute right-2 top-3 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.9)] sm:right-0 sm:top-5" />
              <span aria-hidden="true" className="absolute bottom-5 left-2 h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.9)] sm:bottom-7 sm:left-0" />
            </div>
          </div>
        </section>

        <section id="rotina" className="scroll-mt-32 border-y border-white/[0.06] bg-slate-900/35 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Sua Rotina</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                A gente conhece o peso da sua semana
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                Antes de falar de tecnologia, a gente sabe exatamente onde o seu tempo e suas comissões escapam:
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {DORES.map(({ Icone, titulo, texto }) => (
                <article key={titulo} className="rounded-2xl border border-white/[0.08] bg-slate-950/70 p-5 transition-colors hover:border-emerald-400/25 sm:p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                    <Icone size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-base font-bold leading-snug text-white">{titulo}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="plano-gratis" className="scroll-mt-32 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-400/[0.09] via-slate-900/80 to-slate-950 p-6 shadow-2xl shadow-emerald-950/20 sm:p-10 lg:p-14">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                <ShieldCheck size={14} aria-hidden="true" />
                Entrada leve, sem cartão
              </span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                A gente entende o ritmo da corretagem.
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-300 sm:text-base sm:leading-7">
                Sabemos que nem sempre é o momento de assumir mais uma mensalidade pesada antes da próxima comissão cair. Por isso, liberamos um Plano Grátis para você entrar sem peso no bolso, explorar cada detalhe e sentir na prática como sua rotina muda.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-7">
                Não precisa acreditar na nossa palavra. Entre, teste e compare — veja na prática quais recursos ajudam a organizar sua operação e fazem sentido para a sua rotina.
              </p>
              <button
                type="button"
                onClick={() => navigate('/cadastro')}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:w-auto sm:px-8"
              >
                Criar Minha Conta Grátis Agora →
              </button>
            </div>
          </div>
        </section>

        <section id="quem-somos" className="scroll-mt-32 border-y border-white/[0.06] bg-slate-900/35 py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Quem Somos</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Feito por quem une Engenharia, Corretagem e Inteligência Artificial.
              </h2>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-slate-950/70 p-6 sm:p-8">
              <p className="text-base leading-relaxed text-slate-300 sm:text-lg sm:leading-8">
                Não é um sistema genérico adaptado de fora. Unimos engenharia de processos, vivência real de balcão imobiliário e recursos pensados para a realidade brasileira. Nossos engenheiros respiram tecnologia e novidade o tempo todo — você fica sabendo das evoluções primeiro e pode mandar sua sugestão de melhoria direto para{' '}
                <a href={`mailto:${EMAIL}`} className="font-semibold text-emerald-300 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-200">
                  {EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section id="ia" className="scroll-mt-32 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Atendimento &amp; IA</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Para você sentir o nível do que existe lá dentro, conheça dois dos nossos carros-chefe:
              </h2>
            </div>

            <div className="mt-14 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <ImagemProduto
                src="/images/polen-whatsapp.jpg"
                alt="Demonstração da Pólen no atendimento pelo WhatsApp"
                rotulo="Pólen · Atendimento no WhatsApp"
                Icone={MessageCircle}
              />
              <article className="py-2">
                <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-200">
                  ATENDIMENTO 24H NO WHATSAPP
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Pólen: esqueça chatbots travados de 'digite 1, digite 2'.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base sm:leading-7">
                  A Pólen não é um robô de menu que irrita o cliente. Ela conversa de forma natural, entende e responde até por áudio e envia fotos dos imóveis da sua carteira direto no WhatsApp.
                </p>
                <ListaPontos itens={PONTOS_POLEN} />
              </article>
            </div>

            <div className="mt-20 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <article className="py-2 lg:order-1">
                <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-amber-200">
                  CENTRAL DE INTELIGÊNCIA OPERACIONAL
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Tom: o braço direito da sua operação pelo WhatsApp.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base sm:leading-7">
                  Enquanto você vende, o Tom ajuda a organizar os bastidores sem você precisar fazer tudo na mão:
                </p>
                <ListaPontos itens={PONTOS_TOM} cor="amber" />
              </article>
              <div className="lg:order-2">
                <ImagemProduto
                  src="/images/tom-whatsapp.jpg"
                  alt="Demonstração do Tom como central de inteligência operacional no WhatsApp"
                  rotulo="Tom · Inteligência operacional"
                  Icone={Bot}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden border-t border-white/[0.06] bg-slate-900/35 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-emerald-400/[0.08] to-transparent" />
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Comece pelo Plano Grátis</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              E isso é só a ponta do iceberg.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-7">
              Entre no Plano Grátis, explore cada aba no seu ritmo e descubra o potencial completo da Express Imobi Tech.
            </p>
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-950/40 transition hover:-translate-y-0.5 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:w-auto sm:px-8 sm:text-base"
            >
              Ei corretor, clique aqui e venha ver nosso potencial grátis →
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <a href="#topo" aria-label="Express Imobi Tech — início" className="inline-flex items-center gap-2.5">
              <LogoExpress tamanho="sm" comWordmark={false} />
              <span className="text-sm font-extrabold tracking-tight text-white">
                Express <span className="text-emerald-300">Imobi</span> Tech
              </span>
            </a>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate-400">
              CRM, gestão imobiliária e inteligência artificial para corretores e imobiliárias que querem organizar a operação e atender melhor.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Araguari &amp; Uberlândia — Triângulo Mineiro / MG
              <br />
              Atendimento digital em todo o Brasil
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Produto</h3>
            <ul className="mt-4 space-y-3 text-[13px] text-slate-400">
              <li><a href="#rotina" className="transition hover:text-white">Sua Rotina</a></li>
              <li><a href="#ia" className="transition hover:text-white">Atendimento &amp; IA</a></li>
              <li><a href="#plano-gratis" className="transition hover:text-white">Plano Grátis</a></li>
              <li><button type="button" onClick={() => navigate('/portal')} className="transition hover:text-white">Portal público</button></li>
              <li><button type="button" onClick={() => navigate('/login-admin')} className="transition hover:text-white">Entrar</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Contato e documentos</h3>
            <ul className="mt-4 space-y-3 text-[13px] text-slate-400">
              <li><a href={`mailto:${EMAIL}`} className="transition hover:text-white">{EMAIL}</a></li>
              <li>
                <a
                  href={`https://wa.me/${EMPRESA.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  WhatsApp comercial {EMPRESA.whatsappExibicao}
                </a>
              </li>
              <li><button type="button" onClick={() => navigate('/termos')} className="transition hover:text-white">Termos de Uso</button></li>
              <li><button type="button" onClick={() => navigate('/privacidade')} className="transition hover:text-white">Política de Privacidade</button></li>
              <li><button type="button" onClick={() => navigate('/reembolso')} className="transition hover:text-white">Política de Reembolso</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Express Tech · Express Imobi Tech — Uberlândia/MG · atendimento digital em todo o Brasil.
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={EMAIL_EXCLUSAO} className="transition hover:text-white">Excluir meus dados · LGPD</a>
              <button type="button" onClick={() => abrirPreferenciasCookies()} className="transition hover:text-white">
                Preferências de cookies
              </button>
            </p>
          </div>
          <p className="mx-auto mt-3 max-w-7xl text-[11px] leading-relaxed text-slate-600">
            Canal único para contato e privacidade:{' '}
            <a href={`mailto:${EMAIL}`} className="underline decoration-slate-600 underline-offset-2 transition hover:text-white">
              {EMAIL}
            </a>
            . O conteúdo deste site é informativo e não substitui a análise do seu corretor, advogado ou contador.
          </p>
        </div>
      </footer>
    </div>
  );
}
