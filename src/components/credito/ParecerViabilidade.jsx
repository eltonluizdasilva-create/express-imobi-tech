import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, Loader2, Landmark, CheckCircle2 } from 'lucide-react';
import useParecer from '../../hooks/useParecer';
import { AVISO_LEGAL_PARECER, CAMPOS_PERMITIDOS } from '../../lib/credito/parecer';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#10b981]';
const labelCls = 'block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const TOM_CHANCE = {
  alta: { cor: '#10b981', rotulo: 'alta' },
  media: { cor: '#eab308', rotulo: 'média' },
  baixa: { cor: '#ef4444', rotulo: 'baixa' },
};

export default function ParecerViabilidade({ oficinaId, dadosBase = {}, processoId = null, nomeCliente = '' }) {
  const { parecer, carregando, erro, meta, gerar, creditosEstimados } = useParecer(oficinaId);

  const [vinculo, setVinculo] = useState('clt');
  const [restricaoSerasa, setRestricaoSerasa] = useState(false);
  const [restricaoBacen, setRestricaoBacen] = useState(false);
  const [restricaoRegistrato, setRestricaoRegistrato] = useState(false);
  const [tipoRestricao, setTipoRestricao] = useState('');

  async function pedir() {
    await gerar({
      rendaTotal: dadosBase.rendaTotal || 0,
      idadeMaisVelho: dadosBase.idade || 0,
      vinculo,
      restricaoSerasa,
      restricaoBacen,
      restricaoRegistrato,
      tipoRestricao,
      fgts: dadosBase.fgts || 0,
      entradaDisponivel: dadosBase.entradaDisponivel || 0,
      valorImovel: dadosBase.valorImovel || 0,
      numProponentes: dadosBase.numProponentes || 1,
    }, { processoId });
  }

  return (
    <div className={`${card} p-5 space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8b5cf6]">
            <Sparkles size={13} /> Parecer de viabilidade (IA)
          </p>
          <p className="text-[11px] text-slate-500">
            Só renda, idade, vínculo, restrições, FGTS e valores são enviados — nunca nome, CPF, e-mail ou telefone.
          </p>
        </div>
        <button
          onClick={pedir}
          disabled={carregando || !dadosBase.rendaTotal || !dadosBase.valorImovel}
          className="inline-flex items-center gap-2 rounded-xl bg-[#8b5cf6] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40"
        >
          {carregando ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {carregando ? 'Analisando…' : 'Gerar Parecer de Viabilidade IA'}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className={labelCls}>Vínculo principal</p>
          <select className={inputCls} value={vinculo} onChange={(e) => setVinculo(e.target.value)}>
            <option value="clt">CLT</option>
            <option value="autonomo">Autônomo / MEI</option>
            <option value="empresario">Empresário / Pró-labore</option>
            <option value="aposentado">Aposentado</option>
            <option value="servidor">Servidor público</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <p className={labelCls}>Restrições declaradas</p>
          <div className="flex flex-wrap gap-3 pt-1">
            {[
              ['Serasa', restricaoSerasa, setRestricaoSerasa],
              ['Bacen', restricaoBacen, setRestricaoBacen],
              ['Registrato', restricaoRegistrato, setRestricaoRegistrato],
            ].map(([rotulo, valor, setter]) => (
              <label key={rotulo} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#8b5cf6]" checked={valor} onChange={(e) => setter(e.target.checked)} />
                {rotulo}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className={labelCls}>Tipo de restrição (opcional)</p>
          <input className={inputCls} value={tipoRestricao} onChange={(e) => setTipoRestricao(e.target.value)} placeholder="cheque, cartão, protesto…" />
        </div>
      </div>

      {erro && <p className="text-[10px] text-red-300">{erro}</p>}

      {parecer && (
        <div className="space-y-3">
          <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] leading-relaxed text-slate-300">{parecer.resumo}</p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {parecer.bancos.map((b, i) => {
              const tom = TOM_CHANCE[b.chance] || TOM_CHANCE.media;
              return (
                <div key={i} className="rounded-xl border border-slate-800 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-black text-white">
                      <Landmark size={11} /> {b.banco}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase" style={{ backgroundColor: `${tom.cor}22`, color: tom.cor }}>
                      {tom.rotulo}
                    </span>
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">{b.linha}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{b.justificativa}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5">
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-300">
                <AlertTriangle size={11} /> Riscos
              </p>
              <ul className="mt-1 space-y-0.5">
                {parecer.riscos.map((r, i) => <li key={i} className="text-[10px] text-slate-300">• {r}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-[#10b981]/30 bg-[#10b981]/5 p-2.5">
              <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#10b981]">
                <CheckCircle2 size={11} /> Ações para viabilizar
              </p>
              <ul className="mt-1 space-y-0.5">
                {parecer.acoes.map((a, i) => <li key={i} className="text-[10px] text-slate-300">• {a}</li>)}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-500">
            <span className="flex items-center gap-1.5"><ShieldCheck size={10} /> {parecer.entradaUsada ? `Enviado: ${Object.keys(parecer.entradaUsada).filter((k) => CAMPOS_PERMITIDOS.includes(k)).length} campos agregados` : 'campos agregados'}</span>
            <span>modelo {meta?.modelo || '—'} · {creditosEstimados} crédito(s) estimado(s){processoId ? ' registrado(s) no processo' : ''}</span>
          </div>
          <p className="text-[9px] leading-relaxed text-slate-500">{AVISO_LEGAL_PARECER}</p>
        </div>
      )}
    </div>
  );
}
