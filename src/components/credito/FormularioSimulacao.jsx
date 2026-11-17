import React from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { SISTEMAS, TIPOS_IMOVEL, PERFIS_DOCUMENTO } from '../../lib/credito/simulador';

const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';

export default function FormularioSimulacao({ entrada, setEntrada, parametros, prefilled }) {
  const set = (campo, valor) => setEntrada((atual) => ({ ...atual, [campo]: valor }));

  function setRenda(idx, valor) {
    setEntrada((atual) => {
      const rendas = [...(atual.rendas || [])];
      rendas[idx] = valor;
      return { ...atual, rendas, numProponentes: rendas.length };
    });
  }

  function adicionarProponente() {
    setEntrada((atual) => ({ ...atual, rendas: [...(atual.rendas || []), ''], numProponentes: (atual.rendas || []).length + 1 }));
  }

  function removerProponente(idx) {
    setEntrada((atual) => {
      const rendas = (atual.rendas || []).filter((_, i) => i !== idx);
      return { ...atual, rendas: rendas.length ? rendas : [''], numProponentes: Math.max(1, rendas.length) };
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className={labelCls}>Valor do imóvel (R$)</label>
          <input className={inputCls} inputMode="decimal" value={entrada.valorImovel} onChange={(e) => set('valorImovel', e.target.value)} placeholder="450000" />
        </div>
        <div>
          <label className={labelCls}>Tipo</label>
          <select className={inputCls} value={entrada.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {TIPOS_IMOVEL.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>UF</label>
          <input className={inputCls} value={entrada.uf} onChange={(e) => set('uf', e.target.value.toUpperCase().slice(0, 2))} placeholder="MG" />
        </div>
        <div>
          <label className={labelCls}>Cidade</label>
          <input className={inputCls} value={entrada.cidade} onChange={(e) => set('cidade', e.target.value)} placeholder="Uberlândia" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className={labelCls}>Renda bruta mensal por proponente</p>
          <button onClick={adicionarProponente} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#10b981]">
            <UserPlus size={12} /> Adicionar
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {(entrada.rendas || ['']).map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={inputCls} inputMode="decimal" value={r} onChange={(e) => setRenda(i, e.target.value)} placeholder={`Proponente ${i + 1}`} />
              {(entrada.rendas || []).length > 1 && (
                <button onClick={() => removerProponente(i)} className="text-slate-500 hover:text-red-400" title="Remover">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className={labelCls}>Nascimento do mais velho</label>
          <input type="date" className={inputCls} value={entrada.nascimentoMaisVelho} onChange={(e) => set('nascimentoMaisVelho', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Nº de proponentes</label>
          <input className={inputCls} inputMode="numeric" value={entrada.numProponentes} onChange={(e) => set('numProponentes', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Saldo FGTS (R$)</label>
          <input className={inputCls} inputMode="decimal" value={entrada.fgts} onChange={(e) => set('fgts', e.target.value)} placeholder="20000" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 pb-2.5 text-[11px] text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-[#10b981]" checked={entrada.usaFgts} onChange={(e) => set('usaFgts', e.target.checked)} />
            Usar FGTS na entrada
          </label>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className={labelCls}>Entrada em dinheiro (R$)</label>
          <input className={inputCls} inputMode="decimal" value={entrada.entradaDinheiro} onChange={(e) => set('entradaDinheiro', e.target.value)} placeholder="40000" />
        </div>
        <div>
          <label className={labelCls}>Sistema</label>
          <select className={inputCls} value={entrada.sistema} onChange={(e) => set('sistema', e.target.value)}>
            {SISTEMAS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Prazo (meses)</label>
          <input className={inputCls} inputMode="numeric" value={entrada.prazo} onChange={(e) => set('prazo', e.target.value)} placeholder="360" />
        </div>
        <div>
          <label className={labelCls}>Taxa anual % (editável)</label>
          <div className="flex gap-2">
            <input className={inputCls} inputMode="decimal" value={entrada.taxaAnual} onChange={(e) => set('taxaAnual', e.target.value)}
                   placeholder={String(parametros?.sbpe?.taxaPadrao || 10.5)} />
            <select className={`${inputCls} w-32`} value={entrada.taxaTipo} onChange={(e) => set('taxaTipo', e.target.value)}>
              <option value="nominal">nominal</option>
              <option value="efetiva">efetiva</option>
            </select>
          </div>
          <p className="mt-1 text-[9px] text-slate-500">
            {entrada.taxaTipo === 'nominal'
              ? 'Nominal: o banco divide por 12 (padrão da Caixa) — custa mais que a mesma taxa efetiva.'
              : 'Efetiva: taxa anual já composta.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 p-3">
        <p className={`${labelCls} mb-2`}>Seguros e tarifa mensais (entram na parcela)</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">MIP % ao mês (saldo)</label>
            <input className={inputCls} inputMode="decimal" value={entrada.mipPct} onChange={(e) => set('mipPct', e.target.value)}
                   placeholder={String(parametros?.seguros?.mipPct ?? 0.05)} />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">DFI % ao mês (imóvel)</label>
            <input className={inputCls} inputMode="decimal" value={entrada.dfiPct} onChange={(e) => set('dfiPct', e.target.value)}
                   placeholder={String(parametros?.seguros?.dfiPct ?? 0.015)} />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Tarifa R$/mês</label>
            <input className={inputCls} inputMode="decimal" value={entrada.tarifaMensal} onChange={(e) => set('tarifaMensal', e.target.value)}
                   placeholder={String(parametros?.seguros?.tarifaMensal ?? 25)} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" className="h-4 w-4 accent-[#10b981]" checked={entrada.primeiroImovel} onChange={(e) => set('primeiroImovel', e.target.checked)} />
          Primeiro imóvel
        </label>
        {prefilled && (
          <span className="rounded-full border border-[#10b981]/40 bg-[#10b981]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#10b981]">
            Pré-preenchido: {prefilled.leadNome || prefilled.imovelTitulo || 'registro selecionado'}
          </span>
        )}
      </div>
    </div>
  );
}
