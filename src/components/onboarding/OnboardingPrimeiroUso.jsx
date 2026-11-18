import React, { useMemo, useState } from 'react';
import { Check, Circle, Rocket, X, ArrowRight, Copy, Sparkles } from 'lucide-react';
import {
  avaliarPassos, progresso, deveExibir, proximoPasso, lerOculto, salvarOculto,
  lerPasso3, marcarPasso3, linkVitrine,
} from '../../lib/onboarding';

/**
 * OnboardingPrimeiroUso — card de 3 passos na Visão Geral.
 * Some sozinho em 3/3 e não volta depois de "Já sei usar, fechar guia".
 */
export default function OnboardingPrimeiroUso({ config, imoveis, onIrPara, onNovoImovel }) {
  const [oculto, setOculto] = useState(() => lerOculto());
  const [passo3, setPasso3] = useState(() => lerPasso3());
  const [copiado, setCopiado] = useState(false);

  const passos = useMemo(
    () => avaliarPassos({ config, imoveis, passo3Feito: passo3 }),
    [config, imoveis, passo3],
  );
  const prog = progresso(passos);
  const proximo = proximoPasso(passos);

  if (!deveExibir({ passos, oculto })) return null;

  function fechar() {
    salvarOculto();
    setOculto(true);
  }

  function concluirDivulgacao() {
    marcarPasso3();
    setPasso3(true);
  }

  async function copiarVitrine() {
    const link = linkVitrine(typeof window !== 'undefined' ? window.location.origin : '');
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      if (typeof window !== 'undefined') window.open(link, '_blank', 'noopener,noreferrer');
    }
    concluirDivulgacao();
  }

  function abrirEstudio() {
    concluirDivulgacao();
    if (onIrPara) onIrPara('marketing');
  }

  return (
    <div className="mb-3 rounded-2xl border border-[#10b981]/25 bg-[#10b981]/[0.06] p-3 md:mb-4 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10b981]/15 text-[#10b981]">
            <Rocket size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-white">Primeiros passos</p>
            <p className="truncate text-[10px] text-slate-400">
              {proximo ? `Falta: ${proximo.titulo}` : 'Tudo pronto — bom trabalho.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#10b981]">
            {prog.rotulo}
          </span>
          <button
            type="button"
            onClick={fechar}
            title="Já sei usar, fechar guia"
            className="rounded-lg p-1 text-slate-500 transition hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* barra de progresso */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-[#10b981] transition-all"
          style={{ width: `${prog.pct}%` }}
        />
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {passos.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className={`shrink-0 ${p.concluido ? 'text-[#10b981]' : 'text-slate-600'}`}>
              {p.concluido ? <Check size={13} /> : <Circle size={11} />}
            </span>

            <span
              className={`min-w-0 flex-1 truncate text-[11px] ${
                p.concluido ? 'text-slate-500 line-through' : 'text-slate-200'
              }`}
              title={p.descricao}
            >
              <span className="mr-1 font-black text-slate-400">{p.numero}.</span>
              {p.titulo}
            </span>

            {!p.concluido && p.id === 'divulgar' && (
              <button
                type="button"
                onClick={copiarVitrine}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 transition hover:border-[#10b981] hover:text-[#10b981]"
              >
                {copiado ? <Check size={10} /> : <Copy size={10} />} {copiado ? 'Copiado' : 'Copiar link'}
              </button>
            )}

            {!p.concluido && (
              <button
                type="button"
                onClick={() => {
                  if (p.id === 'divulgar') return abrirEstudio();
                  // Passo 2 abre o cadastro de imóvel direto, sem caçar o botão.
                  if (p.id === 'imovel' && onNovoImovel) return onNovoImovel();
                  if (onIrPara) onIrPara(p.aba);
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#10b981] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110"
              >
                {p.id === 'divulgar' ? <Sparkles size={10} /> : null}
                {p.acao}
                <ArrowRight size={10} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={fechar}
        className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-slate-300"
      >
        Já sei usar, fechar guia
      </button>
    </div>
  );
}
