import React from 'react';

/**
 * LogoExpress — marca do painel.
 * Tile com gradiente esmeralda→teal→sky, brilho interno e um glifo de casa com
 * seta de valorização. Wordmark em três pesos ("EXPRESS" / "IMOBI" / "TECH").
 * Sem imagem: escala nítido de 24px (mobile) a 44px.
 */
export default function LogoExpress({ tamanho = 'md', comWordmark = true, className = '' }) {
  const lado = tamanho === 'sm' ? 'h-8 w-8 rounded-[10px]' : tamanho === 'lg' ? 'h-11 w-11 rounded-[14px]' : 'h-9 w-9 rounded-xl md:h-10 md:w-10 md:rounded-[13px]';
  const glifo = tamanho === 'sm' ? 'h-[18px] w-[18px]' : tamanho === 'lg' ? 'h-6 w-6' : 'h-5 w-5 md:h-[22px] md:w-[22px]';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative shrink-0 ${lado} ring-1 ring-white/25 shadow-[0_10px_26px_-10px_rgba(16,185,129,0.95)]`}
        style={{
          background: 'linear-gradient(135deg, #34d399 0%, #10b981 38%, #0d9488 68%, #0284c7 100%)',
        }}
        aria-hidden="true"
      >
        {/* brilho superior — dá o aspecto de vidro sem peso */}
        <span
          className={`absolute inset-0 ${lado.split(' ').filter((c) => c.startsWith('rounded')).join(' ')}`}
          style={{ background: 'radial-gradient(120% 85% at 22% 0%, rgba(255,255,255,0.55), rgba(255,255,255,0) 58%)' }}
        />
        <svg
          viewBox="0 0 24 24"
          className={`relative m-auto ${glifo}`}
          style={{ position: 'absolute', inset: 0, margin: 'auto' }}
          fill="none"
        >
          <path
            d="M3.4 11.2 12 4.3l8.6 6.9"
            stroke="#ffffff"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 11.1v7.9h11V11.1"
            stroke="#ffffff"
            strokeOpacity="0.94"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 17.1v-4.2m0 0-1.75 1.75M12 12.9l1.75 1.75"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {comWordmark && (
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-[13px] font-black tracking-[0.16em] text-white sm:text-[15px]">
            EXPRESS
          </span>
          <span
            className="logo-accent bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-[13px] font-black uppercase tracking-[0.16em] text-transparent sm:text-[15px]"
          >
            Imobi
          </span>
          <span className="hidden text-[9px] font-bold uppercase tracking-[0.42em] text-slate-500 sm:inline">
            Tech
          </span>
        </div>
      )}
    </div>
  );
}
