/**
 * PrestacaoContasProprietario.jsx — sub-aba "Prestação de contas" do módulo
 * Avaliação / Mapa de Inteligência (PLUS).
 * ============================================================================
 * O relatório é CALCULADO no navegador a partir dos documentos que o painel já
 * carrega (`imoveis_imobi`, `leads_imobi`, `visitas_imobi`, `propostas_imobi`).
 * Zero chamada de IA automática: o botão "Refinar texto" é a única saída que
 * fala com `/api/ai` e, se falhar, o texto determinístico continua na tela.
 *
 * Nada inventado: imóvel sem metragem não ganha comparativo de m² — a tela
 * mostra onde cadastrar. Prestação de contas é acompanhamento operacional, não
 * PTAM, laudo ou parecer técnico (COFECI 1.066/2007).
 * ============================================================================
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Check, ClipboardList, Copy, Info, LoaderCircle, MessageCircle,
  Printer, RefreshCw, Sparkles, TrendingUp,
} from 'lucide-react';
import { corDaAba } from '../../lib/coresAbas';
import { lerPreferencias } from '../../lib/preferencias';
import { UFS } from '../../lib/regrasEstaduais';
import { cabecalhosIA } from '../../lib/aiAuth';
import { obterDadosCenarioDemoMemoria } from '../../lib/cenarioDemo';
import {
  dossieHtmlPrestacao, gerarPrestacao, refinarPrestacaoComIA, textoWhatsAppPrestacao,
} from '../../lib/prestacaoContas';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#0d9488]';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });


const TOM_ALERTA = {
  alta: { borda: 'border-rose-500/40', fundo: 'bg-rose-500/10', texto: 'text-rose-300', chip: 'Urgente' },
  media: { borda: 'border-amber-500/40', fundo: 'bg-amber-500/10', texto: 'text-amber-300', chip: 'Atenção' },
  baixa: { borda: 'border-slate-700', fundo: 'bg-slate-900', texto: 'text-slate-300', chip: 'Rotina' },
};

function Indicador({ rotulo, valor, detalhe, tom = 'neutro', icone: Icone }) {
  const cores = tom === 'alerta'
    ? 'border-rose-500/40 text-rose-300'
    : tom === 'ok'
      ? 'border-emerald-500/40 text-emerald-300'
      : 'border-slate-800 text-white';
  return (
    <div className={`rounded-2xl border bg-slate-950/70 p-3 ${cores}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {Icone ? <Icone size={12} aria-hidden="true" /> : null}
        {rotulo}
      </p>
      <p className="mt-1 text-xl font-black leading-tight">{valor}</p>
      {detalhe ? <p className="mt-0.5 text-[11px] text-slate-400">{detalhe}</p> : null}
    </div>
  );
}

const VEREDITO_TEXTO = {
  dentro: 'Dentro da faixa de mercado',
  acima: 'Acima do valor justo',
  abaixo: 'Abaixo do valor justo',
  sem_valor: 'Anúncio sem valor informado',
};

function LinhaValor({ rotulo, valor, destaque = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-[11px] text-slate-400">{rotulo}</dt>
      <dd className={`text-right text-xs font-bold ${destaque ? 'text-white' : 'text-slate-200'}`}>{valor}</dd>
    </div>
  );
}

export default function PrestacaoContasProprietario({
  imoveis = [],
  leads = [],
  visitas = [],
  propostas = [],
  nomeImobiliaria = '',
  corretor = '',
  imovelInicialId = '',
  imovelInicial = null,
  onAbrirCaptacao,
}) {
  const corAba = corDaAba('mapa_inteligencia');
  const [uf, setUf] = useState(() => lerPreferencias().ufPadrao);
  const [imovelId, setImovelId] = useState(() => String(imovelInicial?.id || imovelInicial?.codigo || imovelInicialId || ''));
  const [demo, setDemo] = useState(null);
  const [textoIA, setTextoIA] = useState('');
  const [refinando, setRefinando] = useState(false);
  const [erroIA, setErroIA] = useState('');
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    const alvo = String(imovelInicial?.id || imovelInicial?.codigo || imovelInicialId || '');
    if (alvo) {
      setImovelId(alvo);
      setTextoIA('');
    }
  }, [imovelInicial, imovelInicialId]);

  const daConta = useMemo(() => (Array.isArray(imoveis) ? imoveis.filter(Boolean) : []), [imoveis]);
  const demonstracao = daConta.length === 0 && Boolean(demo);

  // O imóvel vindo por deep link (Captação por Nicho) pode não estar em
  // `imoveis_imobi`: entra no topo da lista em vez de ser descartado.
  const fonte = useMemo(() => {
    const base = demonstracao ? demo.imoveis : daConta;
    const chave = String(imovelInicial?.id || imovelInicial?.codigo || '');
    if (!chave) return base;
    const jaEsta = base.some((i) => String(i?.id || i?.codigo || '') === chave);
    return jaEsta ? base : [imovelInicial, ...base];
  }, [daConta, demonstracao, demo, imovelInicial]);


  const imovelSelecionado = useMemo(() => {
    if (!fonte.length) return null;
    const achado = fonte.find((i) => String(i?.id || i?.codigo || '') === String(imovelId || ''));
    return achado || fonte[0];
  }, [fonte, imovelId]);

  const prestacao = useMemo(() => {
    if (!imovelSelecionado) return null;
    return gerarPrestacao(imovelSelecionado, {
      leads: demonstracao ? demo.leads : leads,
      visitas: demonstracao ? [] : visitas,
      propostas: demonstracao ? [] : propostas,
      uf,
      nomeImobiliaria,
      corretor,
      demonstracao,
    });
  }, [imovelSelecionado, demonstracao, demo, leads, visitas, propostas, uf, nomeImobiliaria, corretor]);

  const textoCalculado = useMemo(
    () => (prestacao ? textoWhatsAppPrestacao(prestacao) : ''),
    [prestacao],
  );
  const textoFinal = textoIA || textoCalculado;

  function trocarImovel(id) {
    setImovelId(id);
    setTextoIA('');
    setErroIA('');
    setCopiado('');
  }

  function usarDemonstracao() {
    const { imoveisDemo, leadsDemo } = obterDadosCenarioDemoMemoria();
    setDemo({ imoveis: imoveisDemo, leads: leadsDemo });
    setImovelId(String(imoveisDemo[0]?.id || imoveisDemo[0]?.codigo || ''));
    setTextoIA('');
    setErroIA('');
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(textoFinal);
      setCopiado('whatsapp');
      setTimeout(() => setCopiado(''), 2200);
    } catch {
      setCopiado('');
    }
  }

  function imprimirDossie() {
    if (!prestacao) return;
    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Permita pop-ups para gerar o PDF da prestação de contas.');
      return;
    }
    janela.document.write(dossieHtmlPrestacao(prestacao));
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 350);
  }

  async function refinarComIA() {
    if (!prestacao || refinando) return;
    setRefinando(true);
    setErroIA('');
    try {
      const cabecalhos = await cabecalhosIA();
      const resposta = await refinarPrestacaoComIA({ prestacao, cabecalhos });
      if (resposta.ok) setTextoIA(resposta.texto);
      else setErroIA(resposta.erro);
    } catch (erro) {
      // Sessão sem token, rede ou resposta inesperada: o texto calculado fica.
      setErroIA(`Não foi possível refinar agora (${erro?.message || 'falha inesperada'}). O texto calculado continua abaixo.`);
    } finally {
      setRefinando(false);
    }
  }

  /* ------------------------------- estado vazio ------------------------------ */

  if (!fonte.length) {
    return (
      <div className={`${card} p-6 sm:p-8`}>
        <div className="flex items-start gap-3">
          <ClipboardList size={20} className="mt-0.5 shrink-0" style={{ color: corAba }} aria-hidden="true" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-white">Prestação de contas ao proprietário</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Este relatório usa a sua carteira real: dias na carteira, preço de anúncio contra a faixa de mercado,
              leads, visitas, propostas e objeções. Nenhum número é estimado pela IA — tudo sai do que está cadastrado.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {onAbrirCaptacao ? (
            <button
              type="button"
              onClick={onAbrirCaptacao}
              style={{ backgroundColor: corAba }}
              className="cursor-pointer rounded-xl px-4 py-2.5 text-xs font-black text-white transition hover:brightness-110"
            >
              Cadastrar imóvel em Captação &amp; Imóveis
            </button>
          ) : null}
          <button
            type="button"
            onClick={usarDemonstracao}
            className="cursor-pointer rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-black text-slate-200 transition hover:border-[#0d9488]"
          >
            Ver com dados de demonstração
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          A demonstração usa a carteira de exemplo do produto e não grava nada no Firestore. Os imóveis de exemplo não
          têm metragem cadastrada — o comparativo de m² aparece assim que a ficha do imóvel tem área.
        </p>
      </div>
    );
  }

  const { carteira, mercado, funil, recomendacoes } = prestacao;

  return (
    <div className="space-y-4">
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ClipboardList size={20} className="mt-0.5 shrink-0" style={{ color: corAba }} aria-hidden="true" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-white">Prestação de contas ao proprietário</h3>
              <p className="mt-1 text-xs text-slate-400">
                Emitido em {prestacao.geradoEmTexto} · cálculo local, sem IA. Todo número vem da ficha do imóvel e do CRM.
              </p>
            </div>
          </div>
          <span
            className="rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider"
            style={{ borderColor: `${corAba}55`, color: corAba, backgroundColor: `${corAba}14` }}
          >
            {prestacao.totalAlertas} ponto(s) de atenção
          </span>
        </div>

        {demonstracao && (
          <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            <strong>Dados de demonstração.</strong> Nada é gravado: a conta ainda não tem imóveis cadastrados. Os imóveis
            de exemplo não têm metragem na ficha — o comparativo de m² aparece quando o imóvel tem área cadastrada.
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="prestacao-imovel">Imóvel da prestação</label>
            <select
              id="prestacao-imovel"
              value={String(imovelSelecionado?.id || imovelSelecionado?.codigo || '')}
              onChange={(e) => trocarImovel(e.target.value)}
              className={inputCls}
            >
              {fonte.map((item, idx) => {
                const valorOpcao = String(item?.id || item?.codigo || `imovel-${idx}`);
                const rotulo = [item?.codigo, item?.titulo].filter(Boolean).join(' · ') || `Imóvel ${idx + 1}`;
                return <option key={valorOpcao} value={valorOpcao}>{rotulo}</option>;
              })}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="prestacao-uf">UF da negociação</label>
            <select
              id="prestacao-uf"
              value={uf}
              onChange={(e) => { setUf(e.target.value); setTextoIA(''); }}
              className={inputCls}
            >
              {UFS.map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}
            </select>
            <p className="mt-1.5 text-[10px] text-slate-500">A UF define o fator regional aplicado ao valor de mercado.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4" aria-label="Indicadores consolidados">
        <Indicador
          rotulo="Dias na carteira"
          icone={AlertTriangle}
          valor={typeof carteira.dias === 'number' ? `${carteira.dias} d` : 'n/d'}
          detalhe={carteira.alerta ? `acima do limite de ${carteira.limite} dias` : `limite de ${carteira.limite} dias`}
          tom={carteira.alerta ? 'alerta' : 'neutro'}
        />
        <Indicador
          rotulo="Anúncio × valor justo"
          icone={TrendingUp}
          valor={mercado.ok ? `${mercado.deltaPct > 0 ? '+' : ''}${mercado.deltaPct}%` : 'sem metragem'}
          detalhe={mercado.ok
            ? `${brl(mercado.anuncio)} contra ${brl(mercado.valorJusto)}`
            : 'cadastre a área na ficha do imóvel'}
          tom={!mercado.ok ? 'alerta' : mercado.veredito === 'dentro' ? 'ok' : 'alerta'}
        />
        <Indicador
          rotulo="Leads do imóvel"
          icone={MessageCircle}
          valor={funil.totalLeads}
          detalhe={funil.leadsSemResposta ? `${funil.leadsSemResposta} sem resposta há +24h` : 'nenhum pendente de resposta'}
          tom={funil.leadsSemResposta ? 'alerta' : 'neutro'}
        />
        <Indicador
          rotulo="Visitas · propostas"
          icone={ClipboardList}
          valor={`${funil.totalVisitas} · ${funil.totalPropostas}`}
          detalhe={funil.melhorProposta ? `melhor proposta ${brl(funil.melhorProposta)}` : 'nenhuma proposta registrada'}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${card} p-4`}>
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
            <TrendingUp size={14} style={{ color: corAba }} aria-hidden="true" /> 2. Preço e mercado
          </h4>
          {mercado.ok ? (
            <>
              <p
                className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                  mercado.veredito === 'dentro'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                }`}
              >
                {VEREDITO_TEXTO[mercado.veredito] || 'Sem veredito'}
                {mercado.veredito === 'acima' || mercado.veredito === 'abaixo'
                  ? ` · ${Math.abs(mercado.deltaPct)}%`
                  : ''}
              </p>
              <dl className="mt-3 space-y-1.5">
                <LinhaValor rotulo="Área considerada" valor={`${mercado.area} ${mercado.unidade}`} />
                <LinhaValor rotulo="Anúncio" valor={mercado.anuncio ? brl(mercado.anuncio) : 'não informado'} destaque />
                <LinhaValor
                  rotulo={`Anúncio por ${mercado.unidade}`}
                  valor={mercado.precoM2Anuncio ? `${brl(mercado.precoM2Anuncio)}/${mercado.unidade}` : '—'}
                />
                <LinhaValor
                  rotulo="Valor justo de mercado"
                  valor={`${brl(mercado.valorJusto)} (${brl(mercado.precoM2Referencia)}/${mercado.unidade})`}
                  destaque
                />
                <LinhaValor rotulo="Faixa de negociação" valor={`${brl(mercado.bandaMin)} a ${brl(mercado.bandaMax)}`} />
                <LinhaValor rotulo="Prazo médio estimado no valor justo" valor={`${mercado.prazoMedioDias} dias`} />
                <LinhaValor rotulo="Grau de fundamentação" valor={mercado.grauFundamentacao || 'não informado'} />
                <LinhaValor rotulo="Região aplicada" valor={mercado.regiao || mercado.uf || '—'} />
              </dl>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                Comparativo direto com parâmetros regionais (ABNT NBR 14.653-2). Faixa de negociação entre o cenário
                mínimo e o máximo do motor de avaliação.
              </p>
            </>
          ) : (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{mercado.instrucao}</span>
            </p>
          )}
        </section>

        <section className={`${card} p-4`}>
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
            <ClipboardList size={14} style={{ color: corAba }} aria-hidden="true" /> 3. O que foi feito no período
          </h4>
          <dl className="mt-3 space-y-1.5">
            <LinhaValor rotulo="Leads vinculados ao imóvel" valor={String(funil.totalLeads)} destaque />
            <LinhaValor rotulo="Leads em estágio de visita" valor={String(funil.visitasSolicitadas)} />
            <LinhaValor rotulo="Leads sem resposta há +24h" valor={String(funil.leadsSemResposta)} />
            <LinhaValor rotulo="Visitas na agenda" valor={String(funil.totalVisitas)} destaque />
            <LinhaValor rotulo="Propostas registradas" valor={String(funil.totalPropostas)} destaque />
            <LinhaValor
              rotulo="Melhor proposta"
              valor={funil.melhorProposta ? brl(funil.melhorProposta) : 'não registrada'}
            />
          </dl>

          <h5 className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">4. Objeções registradas</h5>
          {funil.objecoes.length ? (
            <ul className="mt-1.5 space-y-1">
              {funil.objecoes.map((o) => (
                <li key={o.texto} className="flex items-baseline justify-between gap-2 rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-200">
                  <span>{o.texto}</span>
                  <span className="shrink-0 font-black text-slate-400">{o.total}x</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              Nenhuma objeção registrada no CRM. Ao mover o lead para Perdido ou concluir a visita, registre o motivo:
              é esse campo que sustenta a conversa de preço com o proprietário.
            </p>
          )}
        </section>
      </div>

      <section className={`${card} p-4`}>
        <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
          <AlertTriangle size={14} style={{ color: corAba }} aria-hidden="true" /> 5. Próximos passos
        </h4>
        <ul className="mt-3 space-y-2">
          {recomendacoes.map((rec, idx) => {
            const tom = TOM_ALERTA[rec.nivel] || TOM_ALERTA.baixa;
            return (
              <li key={`${rec.nivel}-${idx}`} className={`rounded-xl border p-2.5 ${tom.borda} ${tom.fundo}`}>
                <p className={`text-[11px] font-black uppercase tracking-wide ${tom.texto}`}>
                  {tom.chip} · {rec.titulo}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{rec.detalhe}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${card} p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
              <MessageCircle size={14} style={{ color: corAba }} aria-hidden="true" /> Mensagem para o proprietário
            </h4>
            <p className="mt-1 text-[11px] text-slate-400">
              Texto calculado localmente, sem IA. Revise e ajuste antes de enviar — o que está aqui é o que vai chegar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refinarComIA}
              disabled={refinando}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: `${corAba}66`, color: corAba, backgroundColor: `${corAba}14` }}
            >
              {refinando
                ? <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                : <Sparkles size={13} aria-hidden="true" />}
              {refinando ? 'Refinando…' : 'Refinar texto com IA'}
            </button>
            {textoIA ? (
              <button
                type="button"
                onClick={() => { setTextoIA(''); setErroIA(''); }}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-200 transition hover:border-slate-500"
              >
                <RefreshCw size={13} aria-hidden="true" /> Voltar ao cálculo
              </button>
            ) : null}
            <button
              type="button"
              onClick={copiarTexto}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-200 transition hover:border-[#10b981]"
            >
              {copiado ? <Check size={13} className="text-emerald-400" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copiado ? 'Copiado' : 'Copiar WhatsApp'}
            </button>
            <button
              type="button"
              onClick={imprimirDossie}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black text-white transition hover:brightness-110"
              style={{ backgroundColor: corAba }}
            >
              <Printer size={13} aria-hidden="true" /> Dossiê em PDF
            </button>
          </div>
        </div>

        {erroIA ? (
          <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            {erroIA}
          </p>
        ) : null}

        <label className={labelCls} htmlFor="prestacao-texto">Texto da prestação</label>
        <textarea
          id="prestacao-texto"
          value={textoFinal}
          onChange={(e) => setTextoIA(e.target.value)}
          rows={16}
          spellCheck="false"
          className="w-full resize-y rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-100 focus:border-[#0d9488] focus:outline-none"
        />

        <p className="mt-2 flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
          <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Envie a cada 15 dias, mesmo sem novidade. Resumo operacional de acompanhamento: não é PTAM, não é laudo e não
            substitui parecer técnico (Resolução COFECI 1.066/2007).
          </span>
        </p>
      </section>




    </div>
  );
}

