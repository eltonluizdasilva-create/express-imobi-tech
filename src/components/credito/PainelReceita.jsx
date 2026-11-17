import React, { useMemo } from 'react';
import { Wallet, TrendingUp, Landmark, ArrowRight } from 'lucide-react';
import {
  resumoReceita, receitaPorBanco, conversaoPorEtapa, STATUS_RECEBIMENTO,
} from '../../lib/credito/receita';
import { etapaPorKey } from '../../lib/credito/esteira';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v) => `${Math.round(Number(v) || 0)}%`;

export default function PainelReceita({ processos = [] }) {
  const resumo = useMemo(() => resumoReceita(processos), [processos]);
  const porBanco = useMemo(() => receitaPorBanco(processos), [processos]);
  const conversao = useMemo(() => conversaoPorEtapa(processos), [processos]);

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Wallet size={13} /> Receita & comissões
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total financiado na esteira', brl(resumo.totalFinanciado), '#e2e8f0'],
            ['Comissão prevista', brl(resumo.prevista), '#0ea5e9'],
            ['Comissão recebida', brl(resumo.recebida), '#10b981'],
            ['A receber / faturado', brl(resumo.aReceber + resumo.faturada), '#eab308'],
          ].map(([rotulo, valor, cor]) => (
            <div key={rotulo} className="rounded-xl border border-slate-800 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{rotulo}</p>
              <p className="text-lg font-black" style={{ color: cor }}>{valor}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
          <span>{resumo.processosAtivos} processo(s) ativo(s)</span>
          <span>·</span>
          <span>
            realizado: <strong className="text-white">
              {resumo.prevista > 0 ? pct((resumo.recebida / resumo.prevista) * 100) : '0%'}
            </strong> da comissão prevista
          </span>
        </div>
        <p className="mt-2 text-[9px] text-slate-500">
          Comissão de cada processo vem de banco/modalidade + percentual editável no processo (tabela padrão do sistema: Caixa 1,0–1,5%).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${card} p-5`}>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Landmark size={13} /> Comissão por banco
          </p>
          {porBanco.length === 0 ? (
            <p className="mt-2 text-[11px] text-slate-500">Nenhum processo ativo.</p>
          ) : (
            <table className="mt-2 w-full text-[10px]">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-widest text-slate-500">
                  <th className="pb-1">Banco</th>
                  <th className="pb-1 text-right">Financiado</th>
                  <th className="pb-1 text-right">Prevista</th>
                  <th className="pb-1 text-right">Recebida</th>
                </tr>
              </thead>
              <tbody>
                {porBanco.map((b) => (
                  <tr key={b.banco} className="border-t border-slate-800">
                    <td className="py-1 text-slate-200">{b.banco} <span className="text-slate-600">({b.quantidade})</span></td>
                    <td className="py-1 text-right text-slate-300">{brl(b.financiado)}</td>
                    <td className="py-1 text-right text-slate-300">{brl(b.prevista)}</td>
                    <td className="py-1 text-right text-[#10b981]">{brl(b.recebida)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_RECEBIMENTO.map((s) => (
              <span key={s.key} className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ backgroundColor: `${s.cor}22`, color: s.cor }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <TrendingUp size={13} /> Conversão por etapa
          </p>
          <div className="mt-2 space-y-2">
            {conversao.map((c) => {
              const etapa = etapaPorKey(c.etapa);
              return (
                <div key={c.etapa}>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: etapa.cor }} />
                      {etapa.label}
                    </span>
                    <span className="text-slate-400">{c.chegou} · {pct(c.percentual)}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full" style={{ width: `${c.percentual}%`, backgroundColor: etapa.cor }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[9px] text-slate-500">
            <ArrowRight size={10} /> Percentual sobre todos os processos da esteira (inclusive reprovados).
          </p>
        </div>
      </div>
    </div>
  );
}
