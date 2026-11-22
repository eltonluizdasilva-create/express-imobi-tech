/**
 * PaginaLegal.jsx — moldura única das páginas Termos, Privacidade e Reembolso.
 * ============================================================================
 * Uma página por documento (`/termos`, `/privacidade`, `/reembolso`) com:
 *   - título, data de atualização e resumo em linguagem simples;
 *   - sumário navegável por teclado (links de âncora);
 *   - seções em `<section>` com `<h2>`, texto e listas semânticas;
 *   - identificação da empresa, canal de contato, canal de exclusão de dados e
 *     botão para reabrir as preferências de cookies;
 *   - navegação entre os três documentos.
 *
 * COR: estas páginas são escuras nos dois temas do painel. Para não serem
 * atingidas pela camada `html.tema-claro` de `src/index.css` (que converte
 * `bg-[#020408]`, `text-white` e `bg-slate-*`), as cores vêm em `style` inline
 * com valores fora da lista convertida. Layout/foco ficam em classes.
 * ============================================================================
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import {
  ATUALIZADO_EM,
  DOCUMENTOS,
  EMPRESA,
  EMAIL_EXCLUSAO,
  EMAIL_PRIVACIDADE,
  ORDEM_DOCUMENTOS,
} from './conteudoLegal';
import { abrirPreferenciasCookies } from '../../lib/consentimentoCookies';

const C = {
  fundo: '#050b09',
  superficie: '#0b1118',
  borda: 'rgba(148, 163, 184, 0.22)',
  bordaAcento: 'rgba(16, 185, 129, 0.35)',
  titulo: '#f8fafc',
  texto: '#dbe3ec',
  suave: '#9fb0c3',
  acento: '#34d399',
  acentoForte: '#10b981',
};

const estiloLink = {
  color: C.acento,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  fontWeight: 600,
};

function BotaoPreferenciasCookies() {
  return (
    <button
      type="button"
      onClick={() => abrirPreferenciasCookies()}
      style={{
        background: 'transparent',
        border: `1px solid ${C.borda}`,
        color: C.texto,
        padding: '8px 14px',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      Preferências de cookies
    </button>
  );
}

export default function PaginaLegal({ documento }) {
  const doc = DOCUMENTOS[documento] || DOCUMENTOS.termos;

  useEffect(() => {
    const anterior = document.title;
    document.title = `${doc.titulo} — ${EMPRESA.produto}`;
    return () => {
      document.title = anterior;
    };
  }, [doc.titulo]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.fundo, color: C.texto }}>
      <a
        href="#conteudo-legal"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          background: C.acentoForte,
          color: '#04120c',
          padding: '10px 16px',
          fontWeight: 800,
          zIndex: 10,
        }}
        onFocus={(e) => { e.currentTarget.style.left = '12px'; e.currentTarget.style.top = '12px'; }}
        onBlur={(e) => { e.currentTarget.style.left = '-9999px'; }}
      >
        Ir para o conteúdo
      </a>

      <header style={{ borderBottom: `1px solid ${C.borda}` }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/"
            style={{ ...estiloLink, display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontWeight: 800 }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao site
          </Link>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: C.suave }}>
            <Building2 size={14} aria-hidden="true" />
            {EMPRESA.nome} · {EMPRESA.produto}
          </span>
        </div>
      </header>

      <main id="conteudo-legal" className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
        <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.acento }}>
          Documentos legais
        </p>
        <h1 className="mt-2 text-[1.9rem] font-black leading-tight sm:text-4xl" style={{ color: C.titulo }}>
          {doc.titulo}
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.suave }}>
          Última atualização: {ATUALIZADO_EM} · {EMPRESA.produto}
        </p>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed">{doc.resumo}</p>

        <nav aria-label="Documentos legais" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {ORDEM_DOCUMENTOS.map((item) => {
              const atual = item.slug === doc.slug;
              return (
                <li key={item.slug}>
                  <Link
                    to={item.rota}
                    aria-current={atual ? 'page' : undefined}
                    style={{
                      display: 'inline-block',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: `1px solid ${atual ? C.acentoForte : C.borda}`,
                      backgroundColor: atual ? 'rgba(16,185,129,0.14)' : 'transparent',
                      color: atual ? C.acento : C.texto,
                      fontSize: '12px',
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    {item.titulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="Sumário do documento" className="mt-8 rounded-2xl p-5" style={{ backgroundColor: C.superficie, border: `1px solid ${C.borda}` }}>
          <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.suave }}>
            Nesta página
          </p>
          <ol className="mt-3 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
            {doc.secoes.map((secao) => (
              <li key={secao.id}>
                <a href={`#${secao.id}`} style={{ ...estiloLink, fontWeight: 600 }}>
                  {secao.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {doc.secoes.map((secao) => (
            <section key={secao.id} id={secao.id} aria-labelledby={`${secao.id}-titulo`} className="scroll-mt-24">
              <h2 id={`${secao.id}-titulo`} className="text-[17px] font-black leading-snug sm:text-xl" style={{ color: C.titulo }}>
                {secao.titulo}
              </h2>
              {(secao.paragrafos || []).map((texto, i) => (
                <p key={i} className="mt-3 text-[14px] leading-relaxed">
                  {texto}
                </p>
              ))}
              {Array.isArray(secao.itens) && secao.itens.length > 0 && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed">
                  {secao.itens.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Identificação da empresa, contato e canais de titular */}
        <section aria-labelledby="dados-empresa" className="mt-12 rounded-2xl p-6" style={{ backgroundColor: C.superficie, border: `1px solid ${C.bordaAcento}` }}>
          <h2 id="dados-empresa" className="flex items-center gap-2 text-[15px] font-black" style={{ color: C.titulo }}>
            <ShieldCheck size={16} aria-hidden="true" style={{ color: C.acento }} />
            Quem somos e como falar com a gente
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed">
            {EMPRESA.nome} — {EMPRESA.produto}. {EMPRESA.descricao}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed">
            {EMPRESA.local} · {EMPRESA.atuacao}.
          </p>
          <ul className="mt-4 space-y-2 text-[13px]">
            <li className="flex flex-wrap items-center gap-2">
              <Mail size={14} aria-hidden="true" style={{ color: C.acento }} />
              <a href={`mailto:${EMPRESA.email}`} style={estiloLink}>{EMPRESA.email}</a>
              <span style={{ color: C.suave }}>— contato geral, suporte e privacidade</span>
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <MessageCircle size={14} aria-hidden="true" style={{ color: C.acento }} />
              <a
                href={`https://wa.me/${EMPRESA.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={estiloLink}
              >
                WhatsApp comercial {EMPRESA.whatsappExibicao}
              </a>
            </li>
            <li className="flex flex-wrap items-center gap-2">
              <Building2 size={14} aria-hidden="true" style={{ color: C.acento }} />
              <a href={EMPRESA.site} target="_blank" rel="noopener noreferrer" style={estiloLink}>
                {EMPRESA.site.replace(/^https?:\/\//, '')}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={EMAIL_EXCLUSAO}
              style={{
                background: C.acentoForte,
                color: '#04120c',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              Solicitar exclusão dos meus dados
            </a>
            <a
              href={EMAIL_PRIVACIDADE}
              style={{
                border: `1px solid ${C.borda}`,
                color: C.texto,
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Exercer outro direito de titular
            </a>
            <BotaoPreferenciasCookies />
          </div>
        </section>

        <p className="mt-6 text-[12px] leading-relaxed" style={{ color: C.suave }}>
          Documento informativo do produto, atualizado em {ATUALIZADO_EM}. Ele descreve como a plataforma
          funciona e como tratamos dados; não substitui o contrato assinado nem constitui orientação
          jurídica para o seu caso.
        </p>
      </main>

      <footer style={{ borderTop: `1px solid ${C.borda}` }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12px] sm:px-6" style={{ color: C.suave }}>
          <span>
            © {new Date().getFullYear()} {EMPRESA.nome} · {EMPRESA.produto}
          </span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {ORDEM_DOCUMENTOS.map((item) => (
              <Link key={item.slug} to={item.rota} style={{ ...estiloLink, fontSize: '12px' }}>
                {item.titulo}
              </Link>
            ))}
          </span>
        </div>
      </footer>
    </div>
  );
}
