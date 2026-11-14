import React, { useEffect, useMemo, useState } from 'react';
import { Scale, AlertTriangle, Check, Landmark, FileSignature } from 'lucide-react';
import { lerPreferencias, assinarPreferencias } from '../../lib/preferencias';
import {
  validarInventarioExtrajudicial, checklistInventario, simularItcmdSucessao,
} from '../../lib/sucessao';
import { regraUF, prazoInventario } from '../../lib/regrasEstaduais';

const E = '#10b981';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';

const fmtBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function SucessaoPatrimonial({ uf }) {
  const [prefs, setPrefs] = useState(() => lerPreferencias());
  useEffect(() => assinarPreferencias(setPrefs), []);
  const ufAtual = uf || prefs.ufPadrao;

  const [temMenor, setTemMenor] = useState(false);
  const [quinhaoGarantido, setQuinhaoGarantido] = useState(false);
  const [avalMP, setAvalMP] = useState(false);
  const [consensual, setConsensual] = useState(true);
  const [todosCapazes, setTodosCapazes] = useState(true);
  const [valorBens, setValorBens] = useState('');

  const regra = regraUF(ufAtual);
  const prazo = prazoInventario(ufAtual);

  const validacao = useMemo(
    () => validarInventarioExtrajudicial({ uf: ufAtual, temMenor, quinhaoGarantido, avalMP, consensual, todosCapazes }),
    [ufAtual, temMenor, quinhaoGarantido, avalMP, consensual, todosCapazes],
  );

  const checklist = useMemo(() => checklistInventario(ufAtual), [ufAtual]);
  const simulacao = useMemo(
    () => simularItcmdSucessao({ uf: ufAtual, valorBens: Number(valorBens) || 0 }),
    [ufAtual, valorBens],
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: E }}>
            {regra.imposto} · {regra.nome} · Resolução CNJ 571/2024
          </span>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Scale size={18} style={{ color: E }} /> Sucessão Patrimonial &amp; Inventário
          </h3>
          <p className="mt-1 max-w-3xl text-xs text-slate-400">
            Inventário extrajudicial em cartório segue possível com herdeiros menores desde que o quinhão esteja
            garantido e o Ministério Público dê parecer favorável. Prazo de abertura: {prazo.dias} dias.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prazo CPC 611</p>
          <p className="text-lg font-black text-white">{prazo.dias} dias</p>
          {prazo.desconto && <p className="text-[10px] font-bold" style={{ color: E }}>{prazo.desconto.pct}% desconto até {prazo.desconto.diasPrazo} dias</p>}
          {prazo.multa && <p className="text-[10px] font-bold text-amber-400">Multa {prazo.multa.pct}%</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 p-4">
          <p className={labelCls}>Caso concreto</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={consensual} onChange={(e) => setConsensual(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
              Partilha consensual
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={temMenor} onChange={(e) => setTemMenor(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
              Há herdeiro menor ou incapaz
            </label>
            <label className={`flex cursor-pointer items-center gap-2 text-xs ${temMenor ? 'text-slate-300' : 'text-slate-600'}`}>
              <input type="checkbox" disabled={!temMenor} checked={quinhaoGarantido} onChange={(e) => setQuinhaoGarantido(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
              Quinhão do menor garantido na escritura
            </label>
            <label className={`flex cursor-pointer items-center gap-2 text-xs ${temMenor ? 'text-slate-300' : 'text-slate-600'}`}>
              <input type="checkbox" disabled={!temMenor} checked={avalMP} onChange={(e) => setAvalMP(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
              Parecer favorável do Ministério Público
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={todosCapazes} onChange={(e) => setTodosCapazes(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
              Todos capazes ou representados
            </label>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${validacao.permitido ? 'border-[#10b981]/40 bg-[#10b981]/5' : 'border-rose-500/40 bg-rose-500/10'}`}>
          <p className="flex items-center gap-2 text-xs font-black text-white">
            {validacao.permitido ? <Check size={15} color={E} /> : <AlertTriangle size={15} className="text-rose-400" />}
            {validacao.permitido ? 'Via extrajudicial liberada' : 'Via extrajudicial bloqueada'}
          </p>
          {validacao.bloqueios.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-rose-200">
              {validacao.bloqueios.map((b) => <li key={b}>{b}</li>)}
            </ul>
          )}
          {validacao.alertas.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-[11px] text-slate-300">
              {validacao.alertas.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
          <p className="mt-2 text-[10px] text-slate-500">{validacao.observacao}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 p-4">
          <p className={labelCls}>Checklist · {checklist.uf} ({checklist.impostoSigla})</p>
          <div className="space-y-1.5">
            {checklist.itens.map((item) => (
              <div key={item.key} className="flex items-start gap-2">
                <FileSignature size={13} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[11px] font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-500">{item.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 p-4">
          <p className={labelCls}>Simulação do {simulacao.impostoSigla}</p>
          <label className="mb-1.5 block text-[10px] font-bold text-slate-500">Valor dos bens transmitidos (R$)</label>
          <input className={inputCls} value={valorBens} onChange={(e) => setValorBens(e.target.value)} inputMode="decimal" placeholder="500000" />
          {Number(valorBens) > 0 && (
            <div className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              <p className="flex justify-between"><span>Alíquota aplicada</span><strong className="text-white">{simulacao.aliquota}%</strong></p>
              <p className="flex justify-between"><span>{simulacao.impostoSigla} sobre {fmtBRL(simulacao.valorBase)}</span><strong style={{ color: E }}>{fmtBRL(simulacao.imposto)}</strong></p>
              {simulacao.impostoComDesconto != null && (
                <p className="flex justify-between"><span>Com desconto estadual</span><strong className="text-white">{fmtBRL(simulacao.impostoComDesconto)}</strong></p>
              )}
              <p className="mt-2 text-[10px] text-slate-500">{simulacao.aviso}</p>
            </div>
          )}
          <p className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-500">
            <Landmark size={12} className="mt-0.5 shrink-0" /> {prazo.resumo}
          </p>
        </div>
      </div>
    </div>
  );
}
