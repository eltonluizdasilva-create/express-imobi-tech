import React, { useEffect, useMemo, useState } from 'react';
import { Building, Copy, Check, AlertTriangle, TrendingDown, Landmark, Scale } from 'lucide-react';
import { lerPreferencias, assinarPreferencias } from '../../lib/preferencias';
import { termometroLocador, compararPfHolding, ALIQUOTA_LOCADOR_PF } from '../../lib/fiscal';
import { aliquotaHeranca, siglaImposto, prazoInventario } from '../../lib/regrasEstaduais';

const E = '#6366f1';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function ConsultoriaPatrimonial({ dadosOficina }) {
  const [prefs, setPrefs] = useState(() => lerPreferencias());
  useEffect(() => assinarPreferencias(setPrefs), []);

  const [qtdImoveis, setQtdImoveis] = useState('4');
  const [receitaAnual, setReceitaAnual] = useState('');
  const [valorPatrimonio, setValorPatrimonio] = useState('');
  const [copiado, setCopiado] = useState(false);

  const uf = prefs.ufPadrao;
  const imoveis = Number(qtdImoveis) || 0;
  const receita = Number(receitaAnual) || 0;
  const patrimonio = Number(valorPatrimonio) || 0;

  const termometro = useMemo(
    () => termometroLocador({ qtdImoveis: imoveis, receitaAnual: receita }),
    [imoveis, receita],
  );

  const comparativo = useMemo(() => compararPfHolding({ receitaAnual: receita }), [receita]);
  const heranca = useMemo(() => aliquotaHeranca(uf, patrimonio), [uf, patrimonio]);
  const prazo = useMemo(() => prazoInventario(uf), [uf]);

  const argumentos = useMemo(() => {
    const nome = dadosOficina?.nomeOficina || 'nossa imobiliária';
    if (!termometro.enquadrado) {
      return [
        `Diagnóstico patrimonial — ${imoveis} imóvel(is), receita de ${brl(receita)}/ano.`,
        '',
        `Hoje você está ${termometro.nivel === 'atencao' ? 'perto do limite' : 'fora do regime regular'} do IBS/CBS (teto: mais de 3 imóveis com receita acima de R$ 240 mil, ou receita acima de R$ 288 mil).`,
        `Nesse cenário, manter em pessoa física é mais simples e mais barato do que abrir holding.`,
        '',
        `Ponto de atenção para o futuro: quando a receita passar de ${brl(288000)}/ano, a tributação muda e vale revisar a estrutura antes do fechamento do ano.`,
        '',
        `— ${nome}`,
      ].join('\n');
    }

    const vantagem = comparativo.vantagemHolding;
    return [
      `Diagnóstico patrimonial — ${imoveis} imóvel(is) locados, receita de ${brl(receita)}/ano.`,
      '',
      'COM O NOVO REGIME (LC 214/2025)',
      `• Você já está enquadrado no IBS/CBS: alíquota reduzida de ${ALIQUOTA_LOCADOR_PF}% + redutor de R$ 600 por imóvel residencial.`,
      `• Carga atual estimada em pessoa física: ${brl(comparativo.pf.total)}/ano (${comparativo.pf.cargaPct}% da receita).`,
      `• Em holding (Lucro Presumido), a projeção fica em ${brl(comparativo.holding.total)}/ano (${comparativo.holding.cargaPct}%).`,
      vantagem > 0
        ? `• Nesta faixa, a holding economiza cerca de ${brl(vantagem)}/ano — e ainda organiza a sucessão.`
        : `• Nesta faixa, a holding custa cerca de ${brl(Math.abs(vantagem))}/ano a mais. Ela só se paga quando entra a questão sucessória.`,
      '',
      'SUCESSÃO',
      `• ${siglaImposto(uf)} em ${uf}: ${heranca.aliquota}% sobre ${brl(patrimonio || 0)} = ${brl(heranca.imposto)}.`,
      `• Inventário precisa ser aberto em até ${prazo.dias} dias (CPC, art. 611).${prazo.desconto ? ` ${prazo.desconto.descricao}.` : ''}`,
      '• Em holding, a doação de quotas com usufruto costuma reduzir o custo sucessório e evitar inventário — planejamento, não improviso.',
      '',
      'RECOMENDAÇÃO',
      'Antes de decidir, simulamos os dois cenários com seus números reais e o contador valida. O que não dá é descobrir isso na declaração do ano que vem.',
      '',
      `— ${nome}`,
    ].join('\n');
  }, [termometro, comparativo, heranca, prazo, uf, imoveis, receita, patrimonio, dadosOficina]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(argumentos);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="bg-slate-900/60 border border-indigo-500/25 rounded-3xl p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: E }}>
            <Building size={13} /> Consultoria Patrimonial &amp; Holding
          </p>
          <h3 className="mt-1 text-lg font-black text-white">Holding Familiar × Pessoa Física</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Cruza o Termômetro Fiscal (LC 214/2025), o {siglaImposto(uf)} de {uf} e o prazo de inventário para gerar argumento de fechamento
            com quem tem vários imóveis.
          </p>
        </div>
        <button
          onClick={copiar}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 transition hover:border-indigo-400"
        >
          {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'Copiado' : 'Copiar argumento'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className={labelCls}>Imóveis locados</label>
          <input className={inputCls} value={qtdImoveis} onChange={(e) => setQtdImoveis(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className={labelCls}>Receita anual de aluguéis (R$)</label>
          <input className={inputCls} value={receitaAnual} onChange={(e) => setReceitaAnual(e.target.value)} inputMode="decimal" placeholder="250000" />
        </div>
        <div>
          <label className={labelCls}>Patrimônio para sucessão (R$)</label>
          <input className={inputCls} value={valorPatrimonio} onChange={(e) => setValorPatrimonio(e.target.value)} inputMode="decimal" placeholder="2000000" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className={`rounded-2xl border p-3 ${termometro.enquadrado ? 'border-rose-500/40 bg-rose-500/10' : 'border-[#10b981]/40 bg-[#10b981]/10'}`}>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {termometro.enquadrado ? <AlertTriangle size={12} className="text-rose-300" /> : <Check size={12} color="#10b981" />} IBS/CBS
          </p>
          <p className="mt-1 text-sm font-black text-white">
            {termometro.enquadrado ? 'Enquadrado' : termometro.nivel === 'atencao' ? 'Perto do limite' : 'Fora do regime'}
          </p>
          <p className="text-[10px] text-slate-400">{termometro.alerta}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <TrendingDown size={12} /> Carga anual
          </p>
          <p className="mt-1 text-sm font-black text-white">PF {brl(comparativo.pf.total)}</p>
          <p className="text-sm font-black text-slate-300">Holding {brl(comparativo.holding.total)}</p>
          <p className={`text-[10px] font-bold ${comparativo.vantagemHolding > 0 ? 'text-[#10b981]' : 'text-amber-300'}`}>
            {comparativo.vantagemHolding > 0
              ? `Holding −${brl(comparativo.vantagemHolding)}/ano`
              : `PF economiza ${brl(Math.abs(comparativo.vantagemHolding))}/ano`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Landmark size={12} /> {siglaImposto(uf)} · {uf}
          </p>
          <p className="mt-1 text-sm font-black text-white">{brl(heranca.imposto)}</p>
          <p className="text-[10px] text-slate-400">
            {heranca.aliquota}% sobre {brl(patrimonio || 0)} · inventário em {prazo.dias} dias
          </p>
          {prazo.desconto && <p className="text-[10px] font-bold text-[#10b981]">{prazo.desconto.pct}% de desconto até {prazo.desconto.diasPrazo} dias</p>}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Scale size={12} /> Argumento pronto para o proprietário
        </p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] leading-relaxed text-slate-300">
          {argumentos}
        </pre>
        <p className="mt-2 text-[10px] text-slate-500">{comparativo.observacao}</p>
      </div>
    </div>
  );
}
