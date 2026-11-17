import React, { useState } from 'react';
import { Copy, Check, ClipboardList } from 'lucide-react';

const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';

const brl = (v) => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/**
 * FichaCaixa — os mesmos campos, na ordem em que o simulador oficial da Caixa
 * costuma pedir, para o corretor preencher lado a lado sem errar a sequência.
 */
export default function FichaCaixa({ sim, oficial, setOficial }) {
  const [copiado, setCopiado] = useState(false);
  const e = sim.entrada;

  const linhas = [
    ['1. Tipo de imóvel', e.tipo || 'usado'],
    ['2. Valor do imóvel', brl(e.valorImovel)],
    ['3. Entrada (dinheiro)', brl(e.entradaDinheiro)],
    ['4. FGTS na entrada', e.usaFgts ? brl(e.fgts) : 'não utilizado'],
    ['5. Renda bruta familiar', brl(sim.rendaTotal)],
    ['6. Nº de proponentes', String(e.numProponentes || (e.rendas || []).length || 1)],
    ['7. Nascimento do mais velho', e.nascimentoMaisVelho || '(informar)'],
    ['8. UF / Cidade', `${e.uf || '—'} / ${e.cidade || '—'}`],
    ['9. Sistema / prazo', `${sim.sistema.toUpperCase()} · ${sim.prazo} meses`],
    [`10. Taxa (${sim.taxaTipo})`, `${sim.taxaAnual.toFixed(2)}% a.a.`],
    ['10b. Taxa efetiva equivalente', `${sim.taxaEfetiva.toFixed(2)}% a.a.`],
    ['10c. Seguros + tarifa', `MIP ${brl(sim.encargos.mip)} · DFI ${brl(sim.encargos.dfi)} · tarifa ${brl(sim.encargos.tarifa)}`],
    ['10d. Parcela com / sem seguros', `${brl(sim.parcelaComSeguros)} / ${brl(sim.parcelaSemSeguros)}`],
    ['10e. Entrada exigida / disponível', `${brl(sim.entradaNecessaria)} / ${brl(sim.entradaDisponivel)}`],
    ['11. Enquadramento sugerido', `${sim.enquadramento.linha}${sim.enquadramento.faixa ? ' — ' + sim.enquadramento.faixa : ''}`],
  ];

  async function copiar() {
    const texto = linhas.map(([k, v]) => `${k}: ${v}`).join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { setCopiado(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <ClipboardList size={13} /> Ficha espelho — ordem do simulador oficial
        </p>
        <button onClick={copiar} className="inline-flex items-center gap-1.5 rounded-xl border border-[#10b981]/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#10b981]">
          {copiado ? <Check size={12} /> : <Copy size={12} />} {copiado ? 'Copiado' : 'Copiar ficha'}
        </button>
      </div>

      <ol className="divide-y divide-slate-800 rounded-2xl border border-slate-800">
        {linhas.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-[11px] text-slate-400">{k}</span>
            <span className="text-[11px] font-bold text-white">{v}</span>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-slate-800 p-3">
        <p className={labelCls}>Resultado oficial (preencher após simular na Caixa)</p>
        <div className="grid gap-2 md:grid-cols-4">
          <input className={inputCls} placeholder="Nº da simulação" value={oficial.numero} onChange={(ev) => setOficial({ ...oficial, numero: ev.target.value })} />
          <input className={inputCls} inputMode="decimal" placeholder="Valor financiado" value={oficial.valorFinanciado} onChange={(ev) => setOficial({ ...oficial, valorFinanciado: ev.target.value })} />
          <input className={inputCls} inputMode="decimal" placeholder="1ª parcela" value={oficial.parcela} onChange={(ev) => setOficial({ ...oficial, parcela: ev.target.value })} />
          <input className={inputCls} type="date" value={oficial.data} onChange={(ev) => setOficial({ ...oficial, data: ev.target.value })} />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Use isto para comparar a pré-simulação com o número real do banco. Nada é enviado automaticamente.
        </p>
      </div>
    </div>
  );
}
