/**
 * estilo.js — classes compartilhadas do wizard de Migração (D-23.16).
 * Tema claro/escuro do painel: mesma estrutura, só a superfície muda.
 */

export function tons(temaClaro) {
  return {
    painel: temaClaro ? 'bg-slate-50 text-slate-900' : 'bg-[#020408] text-white',
    card: temaClaro ? 'bg-white border-slate-200' : 'bg-[#0b1118] border-white/10',
    cardSuave: temaClaro ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.03] border-white/10',
    cardAtivo: temaClaro
      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/40'
      : 'bg-emerald-500/[0.08] border-emerald-400/60 ring-1 ring-emerald-400/30',
    titulo: temaClaro ? 'text-slate-900' : 'text-white',
    texto: temaClaro ? 'text-slate-700' : 'text-slate-300',
    fraco: temaClaro ? 'text-slate-500' : 'text-slate-400',
    linha: temaClaro ? 'divide-slate-200' : 'divide-white/10',
    input: temaClaro
      ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
      : 'bg-[#050b12] border-white/15 text-white placeholder:text-slate-500',
    tabela: temaClaro ? 'bg-white' : 'bg-[#0b1118]',
    cabecalhoTabela: temaClaro ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.04] text-slate-400',
    linhaTabela: temaClaro ? 'hover:bg-slate-50' : 'hover:bg-white/[0.03]',
  };
}

export const BOTAO_PRIMARIO =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_30px_-12px_rgba(16,185,129,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgba(16,185,129,0.9)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0';

export const BOTAO_SECUNDARIO =
  'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40';

export const ETAPAS = [
  { id: 1, titulo: 'Origem dos dados', icone: '1' },
  { id: 2, titulo: 'Pré-visualização', icone: '2' },
  { id: 3, titulo: 'Conclusão', icone: '3' },
];
