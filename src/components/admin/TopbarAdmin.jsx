import React from 'react';
import { Menu, HelpCircle, Sun, Moon, LogOut } from 'lucide-react';

export default function TopbarAdmin({
  nomeAbaAtiva,
  pilarAbaAtiva,
  ehMasterPlataforma = false,
  nivelSimulado = 'master',
  setNivelSimulado = () => {},
  NIVEIS_SIMULACAO = [],
  acessoProLiberado = false,
  setAbaAtiva = () => {},
  isEscuro = true,
  toggleTema = () => {},
  fazerLogout = () => {},
  setSidebarAbertaMobile = () => {},
  sidebarRecuada = false,
  onToggleRecuada = () => {},
  onAbrirAjuda = () => {},
}) {
  return (
    <header
      style={{ backgroundColor: isEscuro ? '#020408' : '#ffffff' }}
      className={`sticky top-0 z-30 h-14 w-full border-b px-3 sm:px-5 md:px-6 backdrop-blur-md flex items-center justify-between gap-3 transition-colors ${
        isEscuro
          ? 'border-slate-800/80 bg-[#020408]/95 text-white'
          : 'border-slate-200 bg-white/95 text-slate-900 shadow-sm'
      }`}
    >
      {/* ─── LADO ESQUERDO: HAMBÚRGUER (MOBILE) / RECUAR (‹/›) + NOME DA ABA ATIVA ─── */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Botão Hambúrguer no Mobile */}
        <button
          type="button"
          onClick={() => setSidebarAbertaMobile(true)}
          className={`md:hidden flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer shrink-0 ${
            isEscuro
              ? 'border-slate-800 bg-[#05080c] text-slate-300 hover:text-white'
              : 'border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900'
          }`}
          aria-label="Abrir menu de navegação"
        >
          <Menu size={17} />
        </button>

        {/* Botão de Recuar / Expandir (» / «) no Desktop */}
        <button
          type="button"
          onClick={onToggleRecuada}
          className={`hidden md:flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer text-base font-black shrink-0 ${
            isEscuro
              ? 'border-slate-800 bg-[#05080c] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-emerald-600 hover:border-emerald-500/40 shadow-sm'
          }`}
          title={sidebarRecuada ? 'Expandir barra lateral (»)' : 'Recuar barra lateral («)'}
          aria-label={sidebarRecuada ? 'Expandir barra lateral' : 'Recuar barra lateral'}
        >
          {sidebarRecuada ? '»' : '«'}
        </button>

        {/* Nome da Aba Ativa */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className={`text-xs sm:text-sm font-extrabold truncate tracking-tight ${
            isEscuro ? 'text-white' : 'text-slate-900'
          }`}>
            {nomeAbaAtiva}
          </h1>

          {/* Badge Discreta do Pilar Comercial */}
          {pilarAbaAtiva && (
            <span
              className={`hidden sm:inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 ${pilarAbaAtiva.badge}`}
            >
              {pilarAbaAtiva.nome}
            </span>
          )}
        </div>
      </div>

      {/* ─── LADO DIREITO: SIMULADOR MASTER, AJUDA '?', TEMA E LOGOUT ───────── */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Dropdown Discreto "Modo Simulador" (quando MASTER) */}
        {ehMasterPlataforma && (
          <div className="flex items-center gap-1.5">
            <select
              value={nivelSimulado}
              onChange={(e) => setNivelSimulado(e.target.value)}
              aria-label="Simular plano do painel"
              className={`rounded-lg border px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider outline-none cursor-pointer transition shadow-sm ${
                isEscuro
                  ? 'border-amber-500/40 bg-[#040810] text-amber-300 hover:border-amber-400'
                  : 'border-amber-500/40 bg-amber-50 text-amber-900 hover:border-amber-500'
              }`}
            >
              <option value="master">Admin Total</option>
              <option value="gratis">Simular Grátis</option>
              <option value="pro">Simular Pro</option>
              <option value="plus">Simular Plus</option>
            </select>
            <span className={`hidden md:inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
              isEscuro
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-amber-500/40 bg-amber-100 text-amber-800'
            }`}>
              master
            </span>
          </div>
        )}

        {/* Botão de Upgrade "+ PRO" (quando não é master e está no gratuito) */}
        {!ehMasterPlataforma && !acessoProLiberado && (
          <button
            type="button"
            onClick={() => setAbaAtiva('meuplano')}
            style={{ backgroundColor: '#10b981' }}
            className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-black text-slate-950 transition hover:brightness-110 shadow-sm shadow-emerald-500/20"
            title="Ver planos e assinar o PRO"
          >
            + PRO
          </button>
        )}

        {/* Botão '?' - Abre o Modal de Ajuda com DOR/GANHO e Instruções Reais */}
        <button
          type="button"
          onClick={onAbrirAjuda}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer ${
            isEscuro
              ? 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-slate-800'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-emerald-500/50 hover:text-emerald-700 hover:bg-slate-200 shadow-sm'
          }`}
          title="Ajuda e manual prático desta aba"
          aria-label="Ajuda e manual prático desta aba"
        >
          <HelpCircle size={15} />
        </button>

        {/* Alternador de Tema Claro / Escuro */}
        <button
          type="button"
          onClick={toggleTema}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer ${
            isEscuro
              ? 'border-slate-700/80 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 shadow-sm'
          }`}
          title={isEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
          aria-label={isEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
          aria-pressed={!isEscuro}
        >
          {isEscuro ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
        </button>

        {/* Botão Sair */}
        <button
          type="button"
          onClick={fazerLogout}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition cursor-pointer"
          title="Encerrar sessão"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
