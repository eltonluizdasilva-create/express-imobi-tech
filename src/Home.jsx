import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoExpress from './components/ui/LogoExpress';
import { EMAIL_INSTITUCIONAL } from './lib/appUrl';
import { EMAIL_EXCLUSAO, EMPRESA } from './pages/legal/conteudoLegal';
import { abrirPreferenciasCookies } from './lib/consentimentoCookies';
import { precoNoCiclo } from './lib/planos';

/**
 * Home — vitrine pública do Express Imobi Tech.
 * Estrutura comercial: promessa → prova de canal → dor → mecanismo (recursos)
 * → fluxo (como funciona) → agentes → planos transparentes → dúvidas → CTA.
 * Identidade: fundo #020408, esmeralda #10B981, teal #0D9488, sky #0284C7.
 */

const EMAIL = EMAIL_INSTITUCIONAL;
const PRECO_PRO = precoNoCiclo('pro');
const PRECO_OPERACAO_IA = precoNoCiclo('esquadrao_ia');

const PORTAIS = ['ZAP Imóveis', 'Viva Real', 'OLX', 'Imovelweb', 'Chaves na Mão'];

const DORES = [
  {
    hora: 'Sábado, 21h',
    titulo: 'O lead que chamou e não teve resposta',
    texto:
      'Ele viu o anúncio, mandou mensagem no WhatsApp e só recebeu retorno na segunda. Nesse intervalo, visitou com outra imobiliária que respondeu primeiro.',
    vira:
      'A Pólen recebe o contato automaticamente, entende o que ele procura e agenda a visita — inclusive fora do horário comercial.',
  },
  {
    hora: 'Quarta, 15h',
    titulo: 'O cliente do decorado que esfriou no crédito',
    texto:
      'A ficha foi enviada ao correspondente e a análise ficou parada. Sem prazo visível, o cliente foi esfriando em casa enquanto a documentação dormia na caixa de entrada.',
    vira:
      'O correspondente atualiza o status dentro do sistema e o responsável é avisado na hora. Você vê o que está aprovado, condicionado e parado.',
  },
  {
    hora: 'Sexta, 18h',
    titulo: 'A proposta que ninguém retomou',
    texto:
      'A conversa terminou em "vou pensar" e ficou sem próximo passo marcado. Duas semanas depois, ninguém sabia dizer se a proposta estava viva ou morta.',
    vira:
      'Cada proposta entra no funil com dono e data de retomada. O sistema mostra o que está parado antes do mês fechar.',
  },
];

const RECURSOS = [
  {
    icone: '🧭',
    titulo: 'CRM & Funil de Vendas',
    texto:
      'Todo lead com etapa, responsável e próximo passo definido. Kanban visual, histórico de conversa e nenhuma negociação esquecida no bloco de notas.',
  },
  {
    icone: '🎯',
    titulo: 'Roleta de Leads',
    texto:
      'Distribuição automática e justa entre os corretores da equipe. Sem resposta no prazo, o lead gira para o próximo — sem discussão e sem privilégio.',
  },
  {
    icone: '🌐',
    titulo: 'Portal Público (/portal)',
    texto:
      'No PRO, os imóveis publicados ficam em uma vitrine própria, com link direto para compartilhar no WhatsApp, no Instagram e nos anúncios.',
  },
  {
    icone: '🧮',
    titulo: 'Simulador de Financiamento',
    texto:
      'Parcelas calculadas na hora, com entrada, prazo e taxa. O corretor conversa com o cliente sabendo o número que cabe no bolso dele.',
  },
  {
    icone: '📋',
    titulo: 'Vistoria Digital com IA',
    texto:
      'Checklist e laudo gerados no celular, com fotos e assinatura. A vistoria termina no imóvel, não no escritório, três dias depois.',
  },
  {
    icone: '🔗',
    titulo: 'Portais XML nativos',
    texto:
      'ZAP, Viva Real, OLX, Imovelweb e Chaves na Mão a partir de um único cadastro. Publicou no sistema, está no portal.',
  },
];

const AGENTES = [
  {
    nome: 'Pólen',
    funcao: 'Recepção 24h',
    texto: 'Responde automaticamente e identifica se o lead quer imóvel urbano, loteamento, rural ou locação.',
  },
  {
    nome: 'Iago',
    funcao: 'Qualificação',
    texto: 'Filtra orçamento, metragem, hectares e garantias antes de ocupar o tempo do corretor.',
  },
  {
    nome: 'Téo',
    funcao: 'Agendamento',
    texto: 'Cruza a agenda do corretor, confirma o endereço do imóvel e envia o lembrete da visita.',
  },
  {
    nome: 'Lara',
    funcao: 'Propostas',
    texto: 'Organiza condições, sinal e permuta, e devolve o resumo pronto para aprovação.',
  },
  {
    nome: 'Heitor',
    funcao: 'Reativação',
    texto: 'Retoma leads antigos com oportunidade real, como queda de preço ou imóvel novo compatível.',
  },
  {
    nome: 'Nina',
    funcao: 'Documentação',
    texto: 'Pede RG, comprovante de renda e certidões no ritmo do cliente, sem virar cobrança.',
  },
  {
    nome: 'Hermes',
    funcao: 'Copiloto',
    texto: 'Executa tarefas dentro do painel: resume ficha, cruza dados e escreve o que você pedir.',
  },
];

const PLANO_GRATIS = [
  'CRM, funil de leads e agenda de visitas',
  'Simuladores essenciais e Assistente Legal',
  'Painel, financeiro essencial e gestão da equipe',
  'Sem upload de fotos ou publicação de imóveis na vitrine',
  '1 usuário',
];

const PLANO_PRO = [
  'Tudo do plano gratuito',
  'Captação & Imóveis e vitrine pública',
  'Até 7 fotos por imóvel; Foto 1 como capa principal',
  'Propostas, histórico e Meta Ads & Criativos',
  'Os 7 agentes de IA no WhatsApp',
  'Roleta de Leads automática',
  'Vistoria Digital com IA',
  'Correspondente / Crédito',
  'Portais XML: ZAP, Viva Real, OLX, Imovelweb e Chaves na Mão',
  'Simulador de financiamento e NFS-e',
  'Até 3 usuários',
];

const FAQ = [
  {
    q: 'Preciso de cartão para começar?',
    a: 'Não. O cadastro não pede cartão. Você começa com 10 dias de teste completo, com os módulos PRO e os 7 Agentes de IA liberados. Depois, CRM, agenda, simuladores e Assistente Legal continuam grátis; Captação & Imóveis e os demais módulos PRO exigem assinatura.',
  },
  {
    q: 'Como funcionam o teste de 10 dias e o bônus dos 100 primeiros?',
    a: 'O teste de 10 dias começa na criação da conta e libera os módulos PRO e os 7 Agentes de IA. Depois dele, sem assinatura, essas ferramentas ficam bloqueadas; o plano Grátis continua disponível. Em paralelo, as 100 primeiras imobiliárias cadastradas garantem 1 ano grátis no CRM Essencial, aplicado na própria conta e sem cobrança.',
  },
  {
    q: 'O que muda de fato entre o gratuito e o PRO?',
    a: 'O Grátis organiza leads, agenda, simuladores e Assistente Legal, sem upload de fotos. O PRO acrescenta Captação & Imóveis, vitrine pública, até 7 fotos por anúncio e os demais módulos operacionais. A Operação IA, contratada à parte, reúne Pólen e Express Brain.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. O painel foi desenhado para o corretor em campo: o mesmo sistema abre no celular, no tablet e no computador. Vistoria, laudo e simulação de financiamento são feitos na visita, não depois.',
  },
  {
    q: 'Já uso outro sistema. Consigo trazer meus imóveis?',
    a: 'Sim. Você pode importar a carteira por planilha ou cadastrar imóvel por imóvel. O PRO também inclui a migração assistida, e a conferência da carteira é feita antes de virar a chave.',
  },
  {
    q: 'Os agentes de IA substituem o corretor?',
    a: 'Não, e nem deveriam. Eles fazem o que consome o dia: primeira resposta, triagem, agendamento, cobrança de documento e retomada de conversa parada. A negociação, a visita e o fechamento continuam com quem entende de gente — o corretor.',
  },
  {
    q: 'Meus dados e os dados dos meus clientes ficam comigo?',
    a: 'Sim. A conta é sua e a base é isolada por imobiliária. Você pode exportar sua carteira a qualquer momento e cancelar quando quiser, sem multa e sem fidelidade.',
  },
];

function irPara(id) {
  const alvo = document.getElementById(id);
  if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Home() {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(0);

  return (
    <div className="min-h-screen bg-[#020408] font-sans text-white selection:bg-emerald-500/30 selection:text-white">
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#020408]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center"
            aria-label="Express Imobi Tech — início"
          >
            <span className="sm:hidden">
              <LogoExpress tamanho="sm" comWordmark={false} />
            </span>
            <span className="hidden sm:block">
              <LogoExpress tamanho="sm" />
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-400 md:flex">
            <button type="button" onClick={() => irPara('recursos')} className="transition-colors hover:text-white">Recursos</button>
            <button type="button" onClick={() => irPara('agentes')} className="transition-colors hover:text-white">Agentes de IA</button>
            <button type="button" onClick={() => irPara('planos')} className="transition-colors hover:text-white">Planos</button>
            <button type="button" onClick={() => irPara('faq')} className="transition-colors hover:text-white">Dúvidas</button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login-admin')}
              className="whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold text-slate-300 transition-colors hover:text-white sm:px-4"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#0d9488] px-4 py-2 text-[13px] font-bold text-[#04120c] shadow-[0_8px_30px_-10px_rgba(16,185,129,0.9)] transition-transform hover:scale-[1.03]"
            >
              Começar grátis
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-[#10b981]/15 blur-[130px]" />
        <div className="pointer-events-none absolute -right-32 top-20 h-[30rem] w-[30rem] rounded-full bg-[#0284c7]/15 blur-[130px]" />

        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              CRM imobiliário com 7 agentes de IA
            </span>

            <h1 className="mt-6 text-[2rem] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              <span className="block text-white">Pronto para a 3ª onda do corretor?</span>
              <span className="mt-2 block text-[#10b981] sm:mt-3">
                Indicação e tráfego trazem o lead, mas a resposta imediata fecha.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
              O Express Imobi Tech reúne CRM, funil de vendas, portal público e sete agentes de IA no WhatsApp
              para que nenhum lead espere por resposta. Você continua conduzindo a visita e fechando o negócio —
              com os números na mão, não com a memória.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/cadastro')}
                className="rounded-xl bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#0d9488] px-6 py-3.5 text-sm font-bold text-[#04120c] shadow-[0_16px_40px_-16px_rgba(16,185,129,0.95)] transition-transform hover:scale-[1.02]"
              >
                Começar grátis, sem cartão
              </button>
              <button
                type="button"
                onClick={() => irPara('planos')}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:text-white"
              >
                Ver os planos →
              </button>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-slate-500">
              <li className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 10 dias de teste completo, grátis</li>
              <li className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 100 primeiros: 1 ano grátis no CRM Essencial</li>
              <li className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Sem instalação</li>
              <li className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Funciona no celular</li>
            </ul>
          </div>

          {/* Prévia do painel — só CSS, sem imagem */}
          <div className="relative">
            <div className="absolute inset-x-6 -bottom-6 h-24 rounded-3xl bg-emerald-500/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050b09] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.45)]">
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28ca41]" />
                <span className="ml-2 truncate rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-slate-500">
                  imobi.expresstech.com.br
                </span>
                <span className="ml-auto shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-300">
                  Prévia com dados de exemplo
                </span>
              </div>

              <div className="space-y-2.5 p-4">
                {[
                  { nome: 'Rafael Lima', imovel: 'Apto 3q · Jardim América', etapa: 'Visita agendada', cor: 'emerald' },
                  { nome: 'Camila Souza', imovel: 'Casa · Setor Sul', etapa: 'Crédito aprovado', cor: 'sky' },
                  { nome: 'Marcos Dias', imovel: 'Lote · Granja Marileusa', etapa: 'Proposta enviada', cor: 'teal' },
                ].map((lead) => (
                  <div key={lead.nome} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-white">{lead.nome}</p>
                      <p className="truncate text-[11px] text-slate-500">{lead.imovel}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        lead.cor === 'emerald'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : lead.cor === 'sky'
                            ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                            : 'border-teal-500/30 bg-teal-500/10 text-teal-300'
                      }`}
                    >
                      {lead.etapa}
                    </span>
                  </div>
                ))}

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="flex items-end justify-between gap-1.5">
                    {[38, 52, 44, 66, 58, 74, 88].map((altura, i) => (
                      <span
                        key={i}
                        className="w-full rounded-t bg-gradient-to-t from-[#0d9488] to-[#34d399]"
                        style={{ height: `${altura}px`, opacity: 0.35 + i * 0.09 }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Leads atendidos por dia</p>
                  <p className="mt-1 text-[9px] leading-snug tracking-[0.10em] text-slate-600">
                    Imagem ilustrativa: nomes, imóveis e números são exemplos de tela, não clientes reais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portais */}
        <div className="relative border-y border-white/[0.06] bg-white/[0.015]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:px-6 md:flex-row md:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Seus imóveis nos portais que o cliente já usa
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PORTAIS.map((portal) => (
                <span
                  key={portal}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-slate-300"
                >
                  {portal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- DOR ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Onde a venda se perde</p>
          <h2 className="mt-3 text-[1.7rem] font-black leading-tight tracking-tight sm:text-4xl">
            Três momentos em que uma venda escapa — e nenhum deles é falta de competência.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
            Quem atende bem não perde venda por falta de esforço. Perde porque a operação depende de alguém lembrar,
            alguém responder e alguém cobrar — e ninguém consegue lembrar de tudo, o dia inteiro, todos os dias.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {DORES.map((dor) => (
            <div
              key={dor.titulo}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-emerald-500/30"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{dor.hora}</span>
              <h3 className="mt-3 text-[15px] font-bold text-white">{dor.titulo}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-400">{dor.texto}</p>
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">Com o sistema</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300">{dor.vira}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- RECURSOS ---------------- */}
      <section id="recursos" className="border-y border-white/[0.06] bg-white/[0.012] py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">O que está dentro</p>
            <h2 className="mt-3 text-[1.7rem] font-black leading-tight tracking-tight sm:text-4xl">
              A operação inteira em um só lugar — do primeiro contato ao contrato.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
              Sem sistema paralelo, sem planilha de apoio e sem retrabalho. Cada recurso conversa com o outro,
              porque nasceu no mesmo lugar.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((recurso) => (
              <div
                key={recurso.titulo}
                className="rounded-2xl border border-white/[0.07] bg-[#050b09] p-6 transition-colors hover:border-emerald-500/35"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg">
                  <span>{recurso.icone}</span>
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-white">{recurso.titulo}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{recurso.texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.12] via-teal-500/[0.08] to-sky-500/[0.08] p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-[15px] font-bold text-white">Sete agentes de IA atendendo no WhatsApp</h3>
              <p className="mt-1 text-[13px] text-slate-300">
                Pólen abre a conversa, Iago qualifica, Téo agenda, Lara monta a proposta, Heitor retoma o frio,
                Nina organiza documento e Hermes executa o que você pedir dentro do painel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => irPara('agentes')}
              className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-[13px] font-bold text-emerald-200 transition-colors hover:bg-emerald-400/20"
            >
              Conhecer os agentes →
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Como começar</p>
          <h2 className="mt-3 text-[1.7rem] font-black leading-tight tracking-tight sm:text-4xl">
            Três passos até a operação rodar sozinha.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Coloque sua carteira dentro',
              d: 'Importe por planilha ou cadastre imóvel por imóvel. Com endereço, fotos e valor, o portal público já nasce pronto para receber lead.',
            },
            {
              n: '02',
              t: 'Ligue seus canais',
              d: 'Ative o WhatsApp dos agentes, conecte os portais XML e compartilhe o link do portal. Todo contato entra no mesmo funil, com dono definido.',
            },
            {
              n: '03',
              t: 'Acompanhe e feche',
              d: 'A roleta distribui, os agentes atendem e o funil mostra o que está parado. Você entra onde é decisivo: a visita, a proposta e o fechamento.',
            },
          ].map((passo) => (
            <div key={passo.n} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <span className="text-[26px] font-black leading-none text-emerald-500/25">{passo.n}</span>
              <h3 className="mt-3 text-[15px] font-bold text-white">{passo.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{passo.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- AGENTES ---------------- */}
      <section id="agentes" className="border-y border-white/[0.06] bg-white/[0.012] py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Esquadrão de IA</p>
            <h2 className="mt-3 text-[1.7rem] font-black leading-tight tracking-tight sm:text-4xl">
              Cada agente cuida de uma parte do atendimento. Nenhum deles negocia por você.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
              Eles fazem o trabalho repetitivo que consome o dia e entregam a conversa pronta para quem vende:
              o corretor.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTES.map((agente) => (
              <div key={agente.nome} className="rounded-2xl border border-white/[0.07] bg-[#050b09] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[15px] font-bold text-white">{agente.nome}</h3>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {agente.funcao}
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-400">{agente.texto}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[12px] text-slate-500">
            No plano PRO você também conta com os assistentes de gestão: Diretor Comercial IA, Simulador de Custos e
            Minutas & Checklist (Lei do Inquilinato) — rascunho operacional, com revisão obrigatória de contador (CRC) e advogado (OAB).
          </p>

          <p className="mt-3 text-[12px] text-slate-500">
            Acima do PRO ficam os dois módulos de <span className="font-semibold text-slate-300">Operação IA</span>,
            contratados separadamente: <span className="font-semibold text-emerald-300">Pólen · Atendimento 24h</span> (a
            atendente que responde e qualifica no WhatsApp oficial) e{' '}
            <span className="font-semibold text-amber-300">Tom · Maestro da Imobiliária</span> (as regras comerciais, os
            processos e a auditoria da equipe no mesmo lugar).
          </p>
        </div>
      </section>

      {/* ---------------- PLANOS ---------------- */}
      <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Planos</p>
          <h2 className="mt-3 text-[1.7rem] font-black leading-tight tracking-tight sm:text-4xl">
            Preço claro, sem letra miúda.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
            Comece de graça e organize a carteira hoje. Quando a operação pedir automação, o PRO entra por menos do
            que uma diária de anúncio.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-4 lg:grid-cols-2">
          {/* GRÁTIS */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#050b09] p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-bold text-white">Gratuito</h3>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Para começar
              </span>
            </div>
            <p className="mt-4 flex items-end gap-1.5">
              <span className="text-4xl font-black tracking-tight text-white">R$ 0</span>
              <span className="pb-1 text-sm text-slate-500">/mês</span>
            </p>
            <p className="mt-2 text-[13px] text-slate-400">
              Plano gratuito para sempre, sem cartão. O teste de 10 dias libera também os módulos PRO e os 7 Agentes de IA.
            </p>

            <ul className="mt-6 space-y-2.5">
              {PLANO_GRATIS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-300">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="mt-7 w-full rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
            >
              Criar conta gratuita
            </button>
          </div>

          {/* PRO */}
          <div className="relative rounded-2xl border border-emerald-500/35 bg-gradient-to-b from-emerald-500/[0.10] via-[#050b09] to-[#050b09] p-7 shadow-[0_30px_90px_-40px_rgba(16,185,129,0.7)]">
            <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-[#34d399] to-[#0d9488] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#04120c]">
              Mais escolhido
            </span>

            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-bold text-white">PRO</h3>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                Operação completa
              </span>
            </div>
            <p className="mt-4 flex items-end gap-1.5">
              <span className="text-4xl font-black tracking-tight text-white">{PRECO_PRO}</span>
              <span className="pb-1 text-sm text-slate-400">/mês</span>
            </p>
            <p className="mt-2 text-[13px] text-slate-400">
              Sem fidelidade, cancele quando quiser. Reúne Captação & Imóveis, vitrine pública e os módulos PRO
              após o teste gratuito de 10 dias.
            </p>

            <ul className="mt-6 space-y-2.5">
              {PLANO_PRO.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-slate-200">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="mt-7 w-full rounded-xl bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#0d9488] px-5 py-3 text-sm font-bold text-[#04120c] shadow-[0_18px_44px_-18px_rgba(16,185,129,0.95)] transition-transform hover:scale-[1.01]"
            >
              Assinar o PRO
            </button>
            <a
              href={`mailto:${EMAIL}?subject=Quero%20saber%20mais%20sobre%20o%20plano%20PRO`}
              className="mt-3 block text-center text-[12px] text-slate-400 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-white"
            >
              Prefiro falar com a equipe antes
            </a>
          </div>
        </div>

        {/* Teste completo × bônus de lançamento */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Teste completo</p>
            <h3 className="mt-2 text-[15px] font-bold text-white">10 dias grátis com tudo liberado</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
              Ao criar a conta, o teste de 10 dias libera{' '}
              <strong className="text-white">os módulos PRO</strong> e os{' '}
              <strong className="text-white">7 Agentes de IA</strong>. Terminado o período sem assinatura, esses módulos
              ficam bloqueados; CRM, agenda, simuladores e Assistente Legal continuam no plano gratuito.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">Bônus de lançamento</p>
            <h3 className="mt-2 text-[15px] font-bold text-white">100 primeiros: 1 ano grátis no CRM Essencial</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
              As 100 primeiras imobiliárias cadastradas garantem{' '}
              <strong className="text-white">1 ano grátis no CRM Essencial</strong>, aplicado na própria conta e sem
              cobrança. O teste completo de 10 dias continua valendo para conhecer as ferramentas PRO e os agentes de IA.
            </p>
          </div>
        </div>

        {/* OPERAÇÃO IA reúne a Pólen e o Express Brain no mesmo pacote. */}
        <div className="mt-6 grid gap-4">
          {[
            {
              nome: 'Pólen · Atendimento 24h + Express Brain',
              preco: PRECO_OPERACAO_IA,
              texto:
                'Pacote de Operação IA: atendimento da Pólen no WhatsApp oficial e Express Brain para regras comerciais, processos, auditoria e memória operacional. Implantação assistida à parte.',
              cor: 'emerald',
            },
          ].map((modulo) => (
            <div
              key={modulo.nome}
              className={`rounded-2xl border p-6 ${
                modulo.cor === 'emerald'
                  ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                  : 'border-amber-500/30 bg-amber-500/[0.06]'
              }`}
            >
              <h3 className="text-[15px] font-bold text-white">{modulo.nome}</h3>
              <p className="mt-1 text-[13px] font-semibold text-slate-300">{modulo.preco}/mês</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{modulo.texto}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[12px] text-slate-500">
          A Operação IA inclui Pólen e Express Brain no mesmo pacote. A implantação assistida é cobrada à parte.{' '}
          <a
            href={`mailto:${EMAIL}?subject=Opera%C3%A7%C3%A3o%20IA%20-%20P%C3%B3len%20e%20Tom`}
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Falar sobre a Operação IA
          </a>
          .
        </p>

        <p className="mt-4 text-center text-[12px] text-slate-500">
          Imobiliária com equipe e operação de WhatsApp dedicada? Tem um degrau acima do PRO.{' '}
          <a
            href={`mailto:${EMAIL}?subject=Plano%20para%20equipe%20-%20Express%20Imobi%20Tech`}
            className="font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Falar sobre a operação completa
          </a>
          .
        </p>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="border-y border-white/[0.06] bg-white/[0.012] py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Dúvidas</p>
            <h2 className="mt-3 text-[1.7rem] font-black leading-tight tracking-tight sm:text-4xl">
              O que os corretores mais perguntam antes de entrar.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              Ficou algo de fora? Escreva para{' '}
              <a href={`mailto:${EMAIL}`} className="font-semibold text-emerald-300 hover:text-emerald-200">
                {EMAIL}
              </a>
              . Respondemos por e-mail, sem robô do outro lado.
            </p>
          </div>

          <div className="space-y-2.5">
            {FAQ.map((item, i) => (
              <div key={item.q} className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#050b09]">
                <button
                  type="button"
                  onClick={() => setAberto(aberto === i ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-semibold text-white">{item.q}</span>
                  <span
                    className={`shrink-0 text-emerald-400 transition-transform duration-200 ${aberto === i ? 'rotate-45' : ''}`}
                  >
                    +
                  </span>
                </button>
                {aberto === i && (
                  <p className="px-5 pb-4 text-[13px] leading-relaxed text-slate-400">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/10 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <h2 className="text-[1.8rem] font-black leading-tight tracking-tight sm:text-4xl">
            Comece pelo gratuito. O PRO entra quando a operação pedir.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Crie a conta, cadastre sua carteira e veja o primeiro lead cair no funil. Não precisa de cartão,
            não precisa de instalação e não precisa parar o que você está fazendo agora.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/cadastro')}
              className="rounded-xl bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#0d9488] px-7 py-3.5 text-sm font-bold text-[#04120c] shadow-[0_18px_44px_-18px_rgba(16,185,129,0.95)] transition-transform hover:scale-[1.02]"
            >
              Criar minha conta grátis
            </button>
            <a
              href={`mailto:${EMAIL}`}
              className="rounded-xl border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white"
            >
              Falar com a equipe
            </a>
          </div>

          <p className="mt-6 text-[12px] text-slate-500">
            Você também pode conhecer a vitrine pública antes de criar a conta:{' '}
            <button
              type="button"
              onClick={() => navigate('/portal')}
              className="font-semibold text-emerald-300 hover:text-emerald-200"
            >
              ver o Portal
            </button>
            .
          </p>
        </div>
      </section>

      {/* ---------------- RODAPÉ ---------------- */}
      <footer className="border-t border-white/[0.06] bg-[#01060a]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <LogoExpress tamanho="sm" />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-slate-500">
              CRM, funil de vendas, portal público e agentes de IA no WhatsApp para imobiliárias e corretores que
              tratam o atendimento como parte do negócio.
            </p>
            <p className="mt-4 text-[12px] text-slate-500">
              Araguari &amp; Uberlândia — Triângulo Mineiro / MG
              <br />
              Atendimento digital em todo o Brasil
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Produto</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-slate-500">
              <li><button type="button" onClick={() => irPara('recursos')} className="hover:text-white">Recursos</button></li>
              <li><button type="button" onClick={() => irPara('agentes')} className="hover:text-white">Agentes de IA</button></li>
              <li><button type="button" onClick={() => irPara('planos')} className="hover:text-white">Planos</button></li>
              <li><button type="button" onClick={() => navigate('/portal')} className="hover:text-white">Portal público</button></li>
              <li><button type="button" onClick={() => navigate('/login-admin')} className="hover:text-white">Entrar</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Contato</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-slate-500">
              <li>
                <a href={`mailto:${EMAIL}`} className="hover:text-white">{EMAIL}</a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${EMPRESA.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp comercial {EMPRESA.whatsappExibicao}
                </a>
              </li>
              <li><button type="button" onClick={() => navigate('/termos')} className="hover:text-white">Termos de uso</button></li>
              <li><button type="button" onClick={() => navigate('/privacidade')} className="hover:text-white">Política de privacidade</button></li>
              <li><button type="button" onClick={() => navigate('/reembolso')} className="hover:text-white">Política de reembolso</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {new Date().getFullYear()} Express Tech · Express Imobi Tech — Uberlândia/MG · atendimento digital
              em todo o Brasil.
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={EMAIL_EXCLUSAO} className="hover:text-white">Excluir meus dados</a>
              <button type="button" onClick={() => abrirPreferenciasCookies()} className="hover:text-white">
                Preferências de cookies
              </button>
            </p>
          </div>
          <p className="mx-auto mt-3 max-w-6xl text-[11px] leading-relaxed text-slate-600">
            Canal único para contato e privacidade:{' '}
            <a href={`mailto:${EMAIL}`} className="underline decoration-slate-600 underline-offset-2 hover:text-white">
              {EMAIL}
            </a>
            . O conteúdo deste site é informativo e não substitui a análise do seu corretor, advogado ou contador.
          </p>
        </div>
      </footer>
    </div>
  );
}
