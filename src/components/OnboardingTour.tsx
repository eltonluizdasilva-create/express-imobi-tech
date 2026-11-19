import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { textoDor } from '../lib/copyAbas.js';

/**
 * OnboardingTour — apresentação guiada com spotlight.
 * ============================================================================
 * Os passos são montados a partir das abas REALMENTE visíveis nas barras do
 * menu (`[data-tour="tab-<id>"]`). No modo enxuto as barras PRO/IA não são
 * renderizadas, então o tour mostra só as essenciais e o contador `1/N`
 * recalcula sozinho — nunca sobra passo apontando para alvo inexistente.
 *
 * Texto de cada passo: `copyAbas.textoDor(id).ganho` (uma linha objetiva do
 * que o corretor ganha naquela aba).
 *
 * Disparo único (dupla trava):
 *   • localStorage: `express_imobi_tour_done_<uid>` = 'true'
 *   • Firestore:    `oficinas/{oficinaId}.hasCompletedTour` = true
 * Só inicia quando o documento do tenant já chegou (`pronto`).
 * ============================================================================
 */

export type Retangulo = { top: number; left: number; width: number; height: number };
export type Viewport = { width: number; height: number };

export type PassoAba = {
  id: string;
  titulo: string;
  texto: string;
  seletor: string;
};

/** Rótulo de emergência quando a pílula não expõe texto. */
export function rotuloPadrao(id: string): string {
  return String(id || 'Aba')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Monta os passos a partir da lista de abas visíveis (puro, testável). */
export function montarPassosAbas(abas: Array<{ id: string; label?: string }>): PassoAba[] {
  return (abas || [])
    .filter((a) => a && a.id)
    .map(({ id, label }) => ({
      id,
      titulo: String(label || '').trim() || rotuloPadrao(id),
      texto: textoDor(id).ganho,
      seletor: `[data-tour="tab-${id}"]`,
    }));
}

/** Elemento realmente visível na tela (barra oculta não entra no tour). */
export function elementoVisivel(el: Element | null | undefined): boolean {
  if (!el || typeof (el as Element).getBoundingClientRect !== 'function') return false;
  const r = el.getBoundingClientRect();
  return Boolean(r) && r.width > 0 && r.height > 0;
}

/** Coleta as pílulas de aba na ordem em que aparecem no DOM. */
export function coletarAbasVisiveis(
  doc: Document | null | undefined,
): Array<{ id: string; label: string }> {
  if (!doc || typeof doc.querySelectorAll !== 'function') return [];
  const nos = Array.from(doc.querySelectorAll('[data-tour^="tab-"]'));
  const abas: Array<{ id: string; label: string }> = [];

  for (const el of nos) {
    if (!elementoVisivel(el)) continue;
    const id = String(el.getAttribute('data-tour') || '').replace(/^tab-/, '');
    if (!id) continue;
    const rotulo = el.querySelector('span:last-child')?.textContent || '';
    abas.push({ id, label: String(rotulo).trim() || rotuloPadrao(id) });
  }

  return abas;
}

/* --------------------------- persistência ------------------------------- */

export function chaveTour(uid: string | null | undefined): string {
  return `express_imobi_tour_done_${uid || 'anon'}`;
}

export function lerTourConcluido(uid: string | null | undefined, storage?: Storage | null): boolean {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!s || !uid) return false;
  try {
    return s.getItem(chaveTour(uid)) === 'true';
  } catch {
    return false;
  }
}

export function gravarTourConcluido(uid: string | null | undefined, storage?: Storage | null): void {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!s || !uid) return;
  try {
    s.setItem(chaveTour(uid), 'true');
  } catch {
    /* storage indisponível */
  }
}

export function deveIniciarTour({
  uid,
  pronto,
  hasCompletedTour,
  jaConcluidoLocal,
  jaAbriuNaSessao,
}: {
  uid?: string | null;
  pronto?: boolean;
  hasCompletedTour?: boolean | null;
  jaConcluidoLocal?: boolean;
  jaAbriuNaSessao?: boolean;
}): boolean {
  if (!uid) return false;
  if (!pronto) return false;
  if (hasCompletedTour === true) return false;
  if (jaConcluidoLocal) return false;
  if (jaAbriuNaSessao) return false;
  return true;
}

/* ------------------------------ controles -------------------------------- */

export function textoBotaoPrimario(indice: number, total: number): string {
  return indice >= Math.max(0, total - 1) ? 'Começar agora' : 'Próximo';
}

export function mostrarAnterior(indice: number): boolean {
  return indice > 0;
}

export function rotuloProgresso(indice: number, total: number): string {
  const t = Math.max(1, Number(total) || 1);
  return `${Math.min(indice + 1, t)}/${t}`;
}

export function calcularPopover({
  rect,
  largura,
  altura,
  viewport,
  margem = 12,
  folga = 14,
}: {
  rect: Retangulo | null;
  largura: number;
  altura: number;
  viewport: Viewport;
  margem?: number;
  folga?: number;
}): { top: number; left: number; colocacao: 'baixo' | 'cima' | 'centro' } {
  if (!rect) {
    return {
      top: Math.max(margem, (viewport.height - altura) / 2),
      left: Math.max(margem, (viewport.width - largura) / 2),
      colocacao: 'centro',
    };
  }

  const cabeAbaixo = rect.top + rect.height + folga + altura + margem <= viewport.height;
  const colocacao: 'baixo' | 'cima' = cabeAbaixo ? 'baixo' : 'cima';

  const top = cabeAbaixo
    ? rect.top + rect.height + folga
    : Math.max(margem, rect.top - folga - altura);

  const centroAlvo = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(margem, centroAlvo - largura / 2),
    Math.max(margem, viewport.width - largura - margem),
  );

  return { top, left, colocacao };
}

/* ---------------------- componente de apresentação ----------------------- */

export function TourPopover({
  passo,
  indice,
  total,
  rect,
  viewport,
  onAnterior,
  onProximo,
  onIgnorar,
  onFechar,
}: {
  passo: { titulo: string; texto: string };
  indice: number;
  total: number;
  rect: Retangulo | null;
  viewport: Viewport;
  onAnterior: () => void;
  onProximo: () => void;
  onIgnorar: () => void;
  onFechar: () => void;
}) {
  const largura = Math.min(360, Math.max(280, viewport.width - 32));
  const altura = 210;
  const pos = calcularPopover({ rect, largura, altura, viewport });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tour guiado — passo ${rotuloProgresso(indice, total)}`}
      className="fixed z-[10050] rounded-2xl border border-[#10b981]/40 bg-[#0b1219] p-4 text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
      style={{ top: pos.top, left: pos.left, width: largura }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#10b981]">
          Passo {rotuloProgresso(indice, total)}
        </p>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar tour"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-slate-500 transition hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h3 className="mt-1 text-sm font-black leading-tight text-white">{passo.titulo}</h3>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-300">{passo.texto}</p>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-[#10b981] transition-all"
          style={{ width: `${((indice + 1) / Math.max(1, total)) * 100}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onIgnorar}
          className="text-[10px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-slate-300"
        >
          Ignorar apresentação
        </button>

        <div className="flex items-center gap-2">
          {mostrarAnterior(indice) && (
            <button
              type="button"
              onClick={onAnterior}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={onProximo}
            className="rounded-lg bg-[#10b981] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110"
          >
            {textoBotaoPrimario(indice, total)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- orquestrador -------------------------------- */

/** Evita reabrir se as props mudarem durante a mesma carga de página. */
let abriuNestaSessao = false;

export default function OnboardingTour({
  uid,
  oficinaId,
  pronto,
  hasCompletedTour,
  abertoManualmente,
  onFecharManual,
}: {
  uid?: string | null;
  oficinaId?: string | null;
  pronto?: boolean;
  hasCompletedTour?: boolean | null;
  abertoManualmente?: boolean;
  onFecharManual?: () => void;
}) {
  const [ativo, setAtivo] = useState(false);
  const [indice, setIndice] = useState(0);
  const [passos, setPassos] = useState<PassoAba[]>([]);
  const [rect, setRect] = useState<Retangulo | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ width: 1280, height: 800 });
  const alvoRef = useRef<Element | null>(null);

  /** Relê as abas visíveis e devolve a lista usada nesta sessão do tour. */
  const montarPassos = useCallback((): PassoAba[] => {
    if (typeof document === 'undefined') return [];
    const lista = montarPassosAbas(coletarAbasVisiveis(document));
    setPassos(lista);
    return lista;
  }, []);

  const abrir = useCallback(() => {
    const lista = montarPassos();
    if (!lista.length) return;
    setIndice(0);
    setAtivo(true);
  }, [montarPassos]);

  /* --- abertura automática (uma vez) --- */
  useEffect(() => {
    const deveAbrir = deveIniciarTour({
      uid,
      pronto,
      hasCompletedTour,
      jaConcluidoLocal: lerTourConcluido(uid),
      jaAbriuNaSessao: abriuNestaSessao,
    });
    if (!deveAbrir) return;
    abriuNestaSessao = true;
    // pequeno atraso: garante que as barras já foram pintadas e medidas
    const timer = window.setTimeout(abrir, 250);
    return () => window.clearTimeout(timer);
  }, [uid, pronto, hasCompletedTour, abrir]);

  /* --- abertura manual pelo botão "Refazer tour" --- */
  useEffect(() => {
    if (!abertoManualmente) return;
    abriuNestaSessao = true;
    const timer = window.setTimeout(abrir, 120);
    return () => window.clearTimeout(timer);
  }, [abertoManualmente, abrir]);

  const medir = useCallback(() => {
    if (typeof window === 'undefined') return;
    setViewport({ width: window.innerWidth, height: window.innerHeight });

    const passo = passos[indice];
    if (!passo) {
      setRect(null);
      return;
    }

    const elemento = document.querySelector(passo.seletor);
    alvoRef.current = elemento;

    // alvo sumiu (barra recolhida / modo trocado): centraliza sem recorte
    if (!elemento || !elementoVisivel(elemento)) {
      setRect(null);
      return;
    }

    elemento.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const r = elemento.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [passos, indice]);

  useEffect(() => {
    if (!ativo) return;
    medir();
    const aoMudar = () => medir();
    window.addEventListener('resize', aoMudar);
    window.addEventListener('scroll', aoMudar, true);
    const timer = window.setTimeout(medir, 420);
    return () => {
      window.removeEventListener('resize', aoMudar);
      window.removeEventListener('scroll', aoMudar, true);
      window.clearTimeout(timer);
    };
  }, [ativo, indice, medir]);

  /* --- persistência (dupla trava) --- */
  const concluir = useCallback(
    async (motivo: 'concluido' | 'ignorado' | 'fechado') => {
      gravarTourConcluido(uid);
      setAtivo(false);
      setRect(null);
      if (onFecharManual) onFecharManual();

      if (oficinaId) {
        try {
          await updateDoc(doc(db, 'oficinas', oficinaId), { hasCompletedTour: true });
        } catch (erro) {
          // Sem permissão/offline: o localStorage já impede reabrir neste navegador.
          console.warn('[tour] não foi possível gravar hasCompletedTour:', motivo, erro);
        }
      }
    },
    [uid, oficinaId, onFecharManual],
  );

  const avancar = useCallback(() => {
    if (indice >= passos.length - 1) {
      concluir('concluido');
      return;
    }
    setIndice((i) => Math.min(i + 1, Math.max(0, passos.length - 1)));
  }, [indice, passos.length, concluir]);

  const voltar = useCallback(() => setIndice((i) => Math.max(0, i - 1)), []);

  /* --- teclado --- */
  useEffect(() => {
    if (!ativo) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') concluir('fechado');
      if (e.key === 'ArrowRight') avancar();
      if (e.key === 'ArrowLeft') voltar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [ativo, avancar, voltar, concluir]);

  const passo = passos[indice];

  if (!ativo || !passo || typeof document === 'undefined') return null;

  const recorte = rect
    ? { top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[10040]">
      {/* Bloqueia a interação com o painel enquanto o tour está aberto */}
      <div className="absolute inset-0 bg-[#020408]/70" onClick={(e) => e.stopPropagation()} />

      {/* Recorte iluminado: um elemento com sombra gigante escurece todo o resto */}
      {recorte && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl border-2 border-[#10b981] transition-all duration-300"
          style={{
            top: recorte.top,
            left: recorte.left,
            width: recorte.width,
            height: recorte.height,
            boxShadow: '0 0 0 9999px rgba(2,4,8,0.78), 0 0 0 4px rgba(16,185,129,0.25)',
          }}
        />
      )}

      <TourPopover
        passo={passo}
        indice={indice}
        total={passos.length}
        rect={rect}
        viewport={viewport}
        onAnterior={voltar}
        onProximo={avancar}
        onIgnorar={() => concluir('ignorado')}
        onFechar={() => concluir('fechado')}
      />
    </div>,
    document.body,
  );
}
