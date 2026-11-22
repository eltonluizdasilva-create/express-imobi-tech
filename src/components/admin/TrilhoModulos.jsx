import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, LayoutGrid, X } from 'lucide-react';

/**
 * TrilhoModulos — navegação em UMA linha arrastável (substitui as 4 barra
 * empilhadas). Cada pílula carrega o círculo/borda da cor do degrau comercial
 * a que pertence, então o cliente vê de relance onde está (Grátis × PRO ×
 * Operação IA) sem precisar abrir "Meu Plano".
 *
 * Por que arrasto + setas + filtro: com 22 módulos o trilho passa de 3000px;
 * sozinho o arrasto esconde metade do menu de quem usa mouse. As setas, a borda
 * esmaecida existem para provar que há mais à direita.
 */

const DEGRAUS = {
  gratis: {
    id: 'gratis',
    nome: 'Grátis',
    cor: '#10b981',
    base: '16,185,129',
    textoClaro: '#047857',
    textoEscuro: '#6ee7b7',
  },
  pro: {
    id: 'pro',
    nome: 'PRO',
    cor: '#0284c7',
    base: '2,132,199',
    textoClaro: '#0369a1',
    textoEscuro: '#7dd3fc',
  },
  operacao: {
    id: 'operacao',
    nome: 'Operação IA',
    cor: '#f59e0b',
    base: '245,158,11',
    textoClaro: '#b45309',
    textoEscuro: '#fcd34d',
  },
};

const rgba = (base, a) => `rgba(${base},${a})`;

export default function TrilhoModulos({
  grupos = [],
  abaAtiva,
  setAbaAtiva,
  detalhes = {},
  temaClaro = false,
  dataTour = 'trilho-modulos',
}) {
  const railRef = useRef(null);
  const arrasto = useRef({ ativo: false, x: 0, left: 0, moveu: 0 });
  const [filtro, setFiltro] = useState('todos');
  const [grade, setGrade] = useState(false);
  const [bordas, setBordas] = useState({ esq: false, dir: true });

  // ------------------------------------------------------------------ dados
  const degrausVisiveis = useMemo(
    () => grupos.map((g) => ({ ...g, degrau: DEGRAUS[g.degrau] || DEGRAUS.gratis })),
    [grupos],
  );

  const itensVisiveis = useMemo(() => {
    const base = filtro === 'todos' ? degrausVisiveis : degrausVisiveis.filter((g) => g.id === filtro);
    return base.flatMap((g) =>
      (g.itens || []).map((item) => ({ ...item, grupoId: g.id, degrau: g.degrau })),
    );
  }, [degrausVisiveis, filtro]);

  // ------------------------------------------------------------ medição/rolagem
  const medir = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setBordas({ esq: el.scrollLeft > 6, dir: el.scrollLeft < max - 6 });
  }, []);

  useEffect(() => {
    medir();
    const el = railRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [medir, itensVisiveis.length]);

  const rolar = (dir) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 240), behavior: 'smooth' });
  };

  // roda do mouse rola na horizontal; para no fim para não sequestrar a página
  const onWheel = (e) => {
    const el = railRef.current;
    if (!el) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const chegouFim = el.scrollLeft <= 0 && e.deltaY < 0;
    const chegouInicio = el.scrollLeft >= max - 1 && e.deltaY > 0;
    if (chegouFim || chegouInicio) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  // arrasto com mouse (o dedo já é nativo no celular)
  const onPointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    arrasto.current = { ativo: true, x: e.clientX, left: el.scrollLeft, moveu: 0 };
    el.classList.add('arrastando');
  };

  const onPointerMove = (e) => {
    const st = arrasto.current;
    if (!st.ativo) return;
    const el = railRef.current;
    if (!el) return;
    const dx = e.clientX - st.x;
    st.moveu = Math.max(st.moveu, Math.abs(dx));
    el.scrollLeft = st.left - dx;
  };

  const encerrar = () => {
    arrasto.current.ativo = false;
    railRef.current?.classList.remove('arrastando');
  };

  const abrirItem = (item) => {
    if (arrasto.current.moveu > 6) return; // foi arrasto, não clique
    if (item.bloqueado) {
      setAbaAtiva('meuplano');
      return;
    }
    setAbaAtiva(item.id);
  };

  // ------------------------------------------------------------------ pílula
  const Pilula = ({ item, compacta = false }) => {
    const ativo = abaAtiva === item.id;
    const { cor, base, textoClaro, textoEscuro } = item.degrau;
    const det = detalhes[item.id];
    const textoAcento = temaClaro ? textoClaro : textoEscuro;

    return (
      <button
        type="button"
        data-tour={`tab-${item.id}`}
        aria-current={ativo ? 'page' : undefined}
        aria-disabled={item.bloqueado || undefined}
        onClick={() => abrirItem(item)}
        title={
          item.bloqueado
            ? `${item.label}: disponível no ${item.degrau.nome} — abra Meu Plano`
            : det
              ? `${det.tituloCard || det.tituloLimpo || item.label}: ${det.descricao || ''}`
              : item.label
        }
        style={{
          borderColor: ativo ? cor : rgba(base, 0.22),
          background: ativo ? rgba(base, temaClaro ? 0.12 : 0.20) : temaClaro ? '#ffffff' : 'rgba(255,255,255,0.02)',
          boxShadow: ativo ? `0 0 0 1px ${rgba(base, 0.6)}, 0 8px 22px -14px ${rgba(base, 0.95)}` : undefined,
          color: ativo ? (temaClaro ? '#0f172a' : '#ffffff') : undefined,
        }}
        className={`group relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 ${
          compacta ? 'text-[11px] px-3 py-1.5' : ''
        } ${
          ativo
            ? 'font-black'
            : temaClaro
              ? 'text-slate-700 hover:-translate-y-px hover:bg-white'
              : 'text-slate-300 hover:-translate-y-px hover:text-white'
        }`}
        onMouseEnter={(e) => {
          if (ativo) return;
          e.currentTarget.style.borderColor = rgba(base, 0.5);
          e.currentTarget.style.background = rgba(base, temaClaro ? 0.07 : 0.09);
        }}
        onMouseLeave={(e) => {
          if (ativo) return;
          e.currentTarget.style.borderColor = rgba(base, 0.22);
          e.currentTarget.style.background = temaClaro ? '#ffffff' : 'rgba(255,255,255,0.02)';
        }}
      >
        {/* círculo do degrau — a marca de plano que o cliente vê em primeiro lugar */}
        <span
          className="h-2 w-2 shrink-0 rounded-full transition-all"
          style={{
            background: cor,
            boxShadow: ativo ? `0 0 0 3px ${rgba(base, 0.22)}` : 'none',
          }}
          aria-hidden="true"
        />
        <span className="text-[12px] leading-none" aria-hidden="true">{item.icone}</span>
        <span className="whitespace-nowrap">{item.label}</span>
        {item.badge && (
          <span
            className="whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-[0.10em]"
            style={{
              background: rgba(base, temaClaro ? 0.10 : 0.16),
              border: `1px solid ${rgba(base, 0.45)}`,
              color: textoAcento,
            }}
          >
            {item.badge}
          </span>
        )}
        {item.bloqueado && <Lock size={10} className="shrink-0 opacity-80" aria-hidden="true" />}
      </button>
    );
  };

  return (
    <div data-tour={dataTour} className={temaClaro ? 'text-slate-900' : 'text-slate-200'}>
      {/* ---------- linha de filtros por degrau ---------- */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {degrausVisiveis.map((g) => {
            const ativo = filtro === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setFiltro(ativo ? 'todos' : g.id)}
                aria-pressed={ativo}
                title={
                  ativo
                    ? `Mostrando só o ${g.degrau.nome} — clique para ver todos os módulos`
                    : `Mostrar só os módulos do ${g.degrau.nome}`
                }
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.10em] transition ${
                  ativo ? 'font-black' : ''
                }`}
                style={{
                  borderColor: ativo ? g.degrau.cor : rgba(g.degrau.base, 0.3),
                  background: ativo ? rgba(g.degrau.base, temaClaro ? 0.10 : 0.16) : 'transparent',
                  color: temaClaro ? g.degrau.textoClaro : g.degrau.textoEscuro,
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.degrau.cor }} aria-hidden="true" />
                {g.rotuloCurto || g.degrau.nome}
                {g.preco && (
                  <span className="hidden font-extrabold tracking-normal sm:inline">{g.preco}</span>
                )}
                {/* A contagem fica numa caixinha própria para não se confundir com o preço. */}
                <span
                  title={`${(g.itens || []).length} módulos neste degrau`}
                  className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8.5px] font-black tabular-nums"
                  style={{
                    background: rgba(g.degrau.base, temaClaro ? 0.14 : 0.22),
                    border: `1px solid ${rgba(g.degrau.base, 0.35)}`,
                  }}
                >
                  {(g.itens || []).length}
                </span>
                {ativo && <X size={9} className="opacity-70" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setGrade((v) => !v)}
          aria-expanded={grade}
          aria-label={grade ? 'Fechar a grade de módulos' : 'Ver todos os módulos em grade'}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[9.5px] font-black uppercase tracking-[0.10em] transition sm:px-2.5 ${
            temaClaro
              ? 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
          }`}
        >
          {grade ? <X size={12} /> : <LayoutGrid size={12} />}
          <span className="hidden sm:inline">{grade ? 'Fechar' : 'Ver tudo'}</span>
        </button>
      </div>

      {/* ---------- trilho único ---------- */}
      <div className="relative flex items-center gap-1 px-2 md:px-3">
        <button
          type="button"
          onClick={() => rolar(-1)}
          aria-label="Rolar módulos para a esquerda"
          tabIndex={bordas.esq ? 0 : -1}
          className={`z-10 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all md:flex ${
            temaClaro
              ? 'border-slate-300 bg-white text-slate-600 hover:border-slate-900 hover:text-slate-900'
              : 'border-white/15 bg-[#0b1118] text-slate-400 hover:border-white/40 hover:text-white'
          }`}
          style={{ opacity: bordas.esq ? 1 : 0.25, pointerEvents: bordas.esq ? 'auto' : 'none' }}
        >
          <ChevronLeft size={15} />
        </button>

        <div className="relative min-w-0 flex-1">

          <div
            ref={railRef}
            role="tablist"
            aria-label="Módulos do painel"
            className="cursor-arraste flex flex-nowrap items-center gap-1.5 overflow-x-auto px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={medir}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={encerrar}
            onPointerLeave={encerrar}
            onPointerCancel={encerrar}
          >
            {itensVisiveis.map((item, idx) => {
              const trocaGrupo = idx > 0 && itensVisiveis[idx - 1].grupoId !== item.grupoId;
              return (
                <React.Fragment key={`${item.grupoId}-${item.id}`}>
                  {trocaGrupo && (
                    <span
                      className="mx-1 h-6 w-px shrink-0"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${rgba(item.degrau.base, 0.45)}, transparent)`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <Pilula item={item} />
                </React.Fragment>
              );
            })}
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-14 transition-opacity duration-200"
            style={{
              opacity: bordas.esq ? 1 : 0,
              background: temaClaro
                ? 'linear-gradient(90deg,#fff 45%,rgba(255,255,255,0))'
                : 'linear-gradient(90deg,#020408 45%,rgba(2,4,8,0))',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-14 transition-opacity duration-200"
            style={{
              opacity: bordas.dir ? 1 : 0,
              background: temaClaro
                ? 'linear-gradient(270deg,#fff 45%,rgba(255,255,255,0))'
                : 'linear-gradient(270deg,#020408 45%,rgba(2,4,8,0))',
            }}
            aria-hidden="true"
          />
        </div>

        <button
          type="button"
          onClick={() => rolar(1)}
          aria-label="Rolar módulos para a direita"
          tabIndex={bordas.dir ? 0 : -1}
          className={`z-10 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all md:flex ${
            temaClaro
              ? 'border-slate-300 bg-white text-slate-600 hover:border-slate-900 hover:text-slate-900'
              : 'border-white/15 bg-[#0b1118] text-slate-400 hover:border-white/40 hover:text-white'
          }`}
          style={{ opacity: bordas.dir ? 1 : 0.25, pointerEvents: bordas.dir ? 'auto' : 'none' }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* ---------- grade "ver tudo", agrupada por degrau ---------- */}
      {grade && (
        <div
          className={`mx-3 mb-3 space-y-3 rounded-2xl border p-3 md:mx-4 ${
            temaClaro ? 'border-slate-200 bg-white' : 'border-white/[0.06] bg-white/[0.02]'
          }`}
        >
          {degrausVisiveis.map((g) => (
            <div key={g.id}>
              <div
                className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em]"
                style={{ color: temaClaro ? g.degrau.textoClaro : g.degrau.textoEscuro }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: g.degrau.cor }} />
                {g.titulo}
                {g.preco && <span className="opacity-60">{g.preco}</span>}
                <span className="opacity-50">· {(g.itens || []).length} módulos</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(g.itens || []).map((item) => (
                  <Pilula key={item.id} item={{ ...item, grupoId: g.id, degrau: g.degrau }} compacta />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {`${itensVisiveis.length} módulos visíveis`}
      </span>
    </div>
  );
}
