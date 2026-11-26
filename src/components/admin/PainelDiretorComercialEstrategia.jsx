import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  Search,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  Copy,
  Check,
  ChevronRight,
  Flame,
  ArrowUpRight,
  MessageCircle,
} from 'lucide-react';

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RESPOSTAS_ESTRATEGICAS_PADRAO = {
  escalar: `Estratégia Recomendada para Escalar VGV (Taxa de Conversão Visita ➔ Proposta):

1. Validação Prévia com Pólen: Nunca envie o corretor a campo sem a Pólen validar 3 pontos: poder de compra/renda, momento de decisão (compra em até 60 dias) e interesse real no imóvel.
2. Script de Fechamento na Visita: O corretor deve conduzir a visita focando na "proposta condicional" no local: "Se o proprietário aceitar R$ X de entrada, você fecha hoje?".
3. Follow-up de 4 Horas: Após a visita, a Pólen envia uma mensagem acolhedora com os pontos fortes do imóvel e pergunta se restou alguma dúvida burocrática ou de documentação.
4. Meta de Conversão: Imobiliárias de alta performance convertem 30% a 35% das visitas em propostas escritas.`,

  giro: `Estratégia para Giro de Carteira (Imóveis Parados há > 40 dias):

1. Reposicionamento de Preço: Imóveis com mais de 40 dias sem visitas costumam estar 8% a 12% acima da média do metro quadrado do bairro. Apresente ao proprietário o relatório de buscas reais do CRM.
2. Troca de Foto de Capa: Fotos de fachada escuras diminuem o clique em 45%. Substitua a Foto 1 por um ângulo iluminado da área social ou vista principal.
3. Campanha com Imóvel-Âncora: Use o imóvel como âncora no Radar Maps e na esteira da Zara, disparando para compradores compatíveis da carteira.
4. Contrato de Exclusividade com Plano de Ação: Renegocie exclusividade de 60 dias garantindo investimento semanal em tráfego qualificado.`,

  metas: `Estrutura de Metas e Comissões por Desempenho (6% VGV Padrão):

1. Divisão Base do Honorário (6% do VGV):
   - 45% a 50% para o Corretor de Vendas / Atendimento.
   - 10% a 15% para o Corretor Captador do Imóvel.
   - 35% a 45% para a Imobiliária (estrutura, CRM, IA e geração de leads).
2. Acelerador de Meta Mensal:
   - Até 80% da meta: comissão base padrão.
   - 80% a 100%: bônus de 5% sobre a receita da imobiliária.
   - Acima de 100%: bônus de 10% + prioridade máxima na Roleta de Leads no mês seguinte.
3. Reunião Semanal de Alinhamento (Toda Segunda 08:30): Revisão do funil individual de cada corretor com foco nas propostas em negociação.`,

  reativacao: `Estratégia para Reativação de Leads Antigos do CRM (Últimos 90 dias):

1. Segmentação por Faixa de VGV: Separe os leads que pararam de responder entre Econômico (MCMV), Médio Padrão e Alto Padrão.
2. Gancho de Curiosidade no WhatsApp (via Pólen): "Olá [Nome], liberamos ontem 2 oportunidades no bairro [Bairro] que ainda não foram para os portais. Pensei no seu perfil. Quer dar uma olhada?".
3. Abordagem Gradual: Limite a 15 disparos diários para proteger o número de WhatsApp contra bloqueios.
4. Taxa Esperada: Uma campanha bem estruturada reativa entre 14% e 18% dos leads que estavam frios.`,
};

export default function PainelDiretorComercialEstrategia({
  corretores = [],
  onNavegarRoleta = null,
  isPro = true,
  dadosImobiliaria = {},
}) {
  const [duvida, setDuvida] = useState('');
  const [respostaIA, setRespostaIA] = useState('');
  const [processando, setProcessando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Lista padrão de corretores se não vier do pai
  const equipe = Array.isArray(corretores) && corretores.length > 0
    ? corretores
    : [
        { id: 'c1', nome: 'Carlos Silva', whatsapp: '11987654321', ativo: true, leadsRecebidos: 12, vgvAtribuido: 4250000, comissaoCorretor: 255000 },
        { id: 'c2', nome: 'Mariana Souza', whatsapp: '11976543210', ativo: true, leadsRecebidos: 10, vgvAtribuido: 3800000, comissaoCorretor: 228000 },
        { id: 'c3', nome: 'Roberto Santos', whatsapp: '21988887777', ativo: true, leadsRecebidos: 8, vgvAtribuido: 2900000, comissaoCorretor: 174000 },
      ];

  const metaVGVTotal = 15000000;
  const vgvEmGestao = equipe.reduce((acc, c) => acc + Number(c.vgvAtribuido || 0), 0);
  const comissaoTotalImobiliaria = vgvEmGestao * 0.06;
  const pctAtingido = Math.min(Math.round((vgvEmGestao / metaVGVTotal) * 100), 100);

  const executarPerguntaRapida = (chave, pergunta) => {
    setDuvida(pergunta);
    setProcessando(true);
    setRespostaIA('');
    setTimeout(() => {
      setRespostaIA(RESPOSTAS_ESTRATEGICAS_PADRAO[chave] || RESPOSTAS_ESTRATEGICAS_PADRAO.escalar);
      setProcessando(false);
    }, 350);
  };

  const handleGerarConsultoria = (e) => {
    e?.preventDefault();
    if (!duvida.trim()) return;
    setProcessando(true);
    setRespostaIA('');

    setTimeout(() => {
      const dLower = duvida.toLowerCase();
      let resp = '';
      if (dLower.includes('giro') || dLower.includes('parado') || dLower.includes('tempo')) {
        resp = RESPOSTAS_ESTRATEGICAS_PADRAO.giro;
      } else if (dLower.includes('comiss') || dLower.includes('meta') || dLower.includes('bonus')) {
        resp = RESPOSTAS_ESTRATEGICAS_PADRAO.metas;
      } else if (dLower.includes('reativ') || dLower.includes('antigo') || dLower.includes('frio')) {
        resp = RESPOSTAS_ESTRATEGICAS_PADRAO.reativacao;
      } else {
        resp = RESPOSTAS_ESTRATEGICAS_PADRAO.escalar;
      }
      setRespostaIA(resp);
      setProcessando(false);
    }, 400);
  };

  const copiarResposta = () => {
    if (!respostaIA) return;
    navigator.clipboard?.writeText(respostaIA);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ─── BANNER PRINCIPAL: DIRETOR COMERCIAL IA ─────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#05080c] via-[#080d14] to-[#040608] p-6 md:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-400">
              <Sparkles size={13} className="text-emerald-400" />
              Diretor Comercial IA • Inteligência Preditiva de VGV
            </div>
            <h1 className="mt-3 text-2xl font-black text-white md:text-3xl">
              Estratégia, Metas & Comando Comercial
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-300">
              Acompanhamento estratégico de metas de vendas, projeção de VGV da imobiliária e inteligência comercial para os corretores de atendimento.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#020408]/80 px-4 py-2.5 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-black text-white">IA EM OPERAÇÃO CONTÍNUA</span>
            </div>
            {onNavegarRoleta && (
              <button
                type="button"
                onClick={onNavegarRoleta}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
              >
                Ir para Roleta de Distribuição de Leads <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ─── METAS & VGV CONSOLIDADO ─────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-[#020408]/90 p-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Meta VGV Mês</span>
              <Target size={15} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">{fmtBRL(metaVGVTotal)}</div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Atingido: <strong className="text-emerald-400">{pctAtingido}%</strong></span>
              <span>{fmtBRL(vgvEmGestao)}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${pctAtingido}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#020408]/90 p-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>VGV em Gestão Ativa</span>
              <TrendingUp size={15} className="text-teal-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-teal-400">{fmtBRL(vgvEmGestao)}</div>
            <p className="mt-1 text-[11px] text-slate-400">
              Distribuído entre <strong className="text-white">{equipe.length} corretores</strong> no plantão
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#020408]/90 p-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Comissão Prevista (6%)</span>
              <DollarSign size={15} className="text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">{fmtBRL(comissaoTotalImobiliaria)}</div>
            <p className="mt-1 text-[11px] text-slate-400">
              Receita projetada nos negócios em andamento
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#020408]/90 p-4">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Conversão Visita ➔ Venda</span>
              <BarChart3 size={15} className="text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-300">31,2%</div>
            <p className="mt-1 text-[11px] text-slate-400">
              +4,5% acima da média do mercado local
            </p>
          </div>
        </div>
      </div>

      {/* ─── ALERTAS PREDITIVOS DO DIRETOR COMERCIAL ───────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs">
          <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
            <Flame size={18} />
          </div>
          <div>
            <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px]">Atenção no CRM</span>
            <h4 className="font-bold text-white mt-0.5">3 Leads de Alto Padrão sem Contato</h4>
            <p className="text-slate-400 mt-1">Leads com VGV &gt; R$ 1,5M sem interação há mais de 24h. Risco de desinteresse.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs">
          <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
            <Target size={18} />
          </div>
          <div>
            <span className="font-extrabold text-emerald-300 uppercase tracking-wider text-[10px]">Meta Próxima</span>
            <h4 className="font-bold text-white mt-0.5">Mariana Souza atingiu 95% da Meta</h4>
            <p className="text-slate-400 mt-1">Apenas 1 fechamento para atingir a meta mensal individual de VGV.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs">
          <div className="rounded-xl bg-indigo-500/20 p-2 text-indigo-400">
            <Users size={18} />
          </div>
          <div>
            <span className="font-extrabold text-indigo-300 uppercase tracking-wider text-[10px]">Distribuição Balanceada</span>
            <h4 className="font-bold text-white mt-0.5">Carga Ativa de Leads Equilibrada</h4>
            <p className="text-slate-400 mt-1">Roleta de Leads mantém equilíbrio entre os corretores ativos no plantão.</p>
          </div>
        </div>
      </div>

      {/* ─── QUADRO DE METAS POR CORRETOR ───────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Gestão de Equipe</span>
            <h3 className="text-lg font-black text-white">Quadro de Metas e Performance Individual</h3>
            <p className="text-xs text-slate-400">Metas de VGV, leads atribuídos e previsão de comissão por corretor.</p>
          </div>
          <div className="text-xs text-slate-400">
            Total de Corretores: <strong className="text-white">{equipe.length}</strong>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {equipe.map((c, idx) => {
            const metaInd = 4500000;
            const pctInd = Math.min(Math.round(((c.vgvAtribuido || 0) / metaInd) * 100), 100);
            return (
              <div
                key={c.id || idx}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#020408] p-4 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{c.nome}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        c.ativo ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.ativo ? 'No Plantão' : 'Ausente'}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-0.5">📱 {c.whatsapp}</p>

                  <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">VGV sob gestão:</span>
                      <span className="font-bold text-white">{fmtBRL(c.vgvAtribuido)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Leads ativos no CRM:</span>
                      <span className="font-extrabold text-emerald-400">{c.leadsRecebidos}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Comissão prevista:</span>
                      <span className="font-bold text-emerald-400">{fmtBRL(c.comissaoCorretor)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Meta Individual</span>
                    <strong className="text-white">{pctInd}%</strong>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pctInd}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── CONSULTORIA ESTRATÉGICA IA (DIRETA AO PONTO) ────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">
          <Brain size={16} /> Consultoria Estratégica IA de VGV & Gestão
        </div>
        <h3 className="text-lg font-black text-white">Comando Comercial em Tempo Real</h3>
        <p className="text-xs text-slate-400 mb-4">
          Faça perguntas sobre fechamento, negociação, metas de corretores ou reativação de clientes.
        </p>

        {/* Atalhos Rápidos */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              executarPerguntaRapida(
                'escalar',
                'Como dobrar a taxa de conversão entre visitas agendadas e propostas fechadas na imobiliária?'
              )
            }
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#020408] px-3 py-2 text-xs font-bold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
          >
            📈 Escalar VGV & Vendas
          </button>
          <button
            type="button"
            onClick={() =>
              executarPerguntaRapida(
                'giro',
                'Temos imóveis captados há mais de 40 dias sem propostas. Qual estratégia usar com os proprietários e no tráfego?'
              )
            }
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#020408] px-3 py-2 text-xs font-bold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
          >
            🏠 Giro de Carteira (&gt;40d)
          </button>
          <button
            type="button"
            onClick={() =>
              executarPerguntaRapida(
                'metas',
                'Qual a melhor estrutura de divisão de comissão e bônus de equipe sobre 6% de VGV?'
              )
            }
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#020408] px-3 py-2 text-xs font-bold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
          >
            🧑‍💼 Metas & Comissão de Equipe
          </button>
          <button
            type="button"
            onClick={() =>
              executarPerguntaRapida(
                'reativacao',
                'Como estruturar uma campanha rápida para reativar leads do CRM que esfriaram no último trimestre?'
              )
            }
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#020408] px-3 py-2 text-xs font-bold text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition"
          >
            🎯 Reativação de Leads Frios
          </button>
        </div>

        {/* Input de Pergunta */}
        <form onSubmit={handleGerarConsultoria} className="space-y-3">
          <div className="relative">
            <textarea
              value={duvida}
              onChange={(e) => setDuvida(e.target.value)}
              placeholder="Digite sua dúvida de gestão comercial, estratégias para bater a meta do mês ou desafogar corretores..."
              className="w-full rounded-xl border border-slate-800 bg-[#020408] p-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 min-h-[90px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              💡 Consultoria instantânea orientada ao mercado imobiliário brasileiro
            </span>
            <button
              type="submit"
              disabled={processando || !duvida.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600 disabled:opacity-50 cursor-pointer transition shadow-lg shadow-emerald-500/20"
            >
              {processando ? (
                <>Analisando...</>
              ) : (
                <>
                  <Sparkles size={14} /> Gerar Estratégia Comercial IA
                </>
              )}
            </button>
          </div>
        </form>

        {/* Exibição da Resposta */}
        {respostaIA && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-[#020408] p-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Parecer do Diretor Comercial IA
              </span>
              <button
                type="button"
                onClick={copiarResposta}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
              >
                {copiado ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copiado ? 'Copiado!' : 'Copiar Estratégia'}
              </button>
            </div>
            <pre className="font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {respostaIA}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
