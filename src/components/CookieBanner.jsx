import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EVENTO_ABRIR_COOKIES,
  consentimentoPermiteAnalitico,
  lerConsentimento,
  salvarConsentimento,
} from '../lib/consentimentoCookies';
import { INTEGRACOES_TERCEIROS, resumoRastreamento } from '../lib/transparenciaDados';

/**
 * CookieBanner — aviso e controle de consentimento (LGPD, D-22.04).
 * ============================================================================
 * - Só aparece quando ainda não existe decisão gravada, ou quando uma tela
 *   pede para reabrir (`abrirPreferenciasCookies()`).
 * - Essencial não é opcional (sessão, tema, contador de demonstração).
 * - Análise/terceiros é opt-in explícito; o registro fica em `localStorage`
 *   com versão e data (`src/lib/consentimentoCookies.js`).
 * - Hoje NÃO existe analytics/pixel no produto: o banner diz isso, em vez de
 *   prometer um bloqueio que não teria o que bloquear.
 * - Acessível: região rotulada, foco levado ao painel ao abrir, botões com
 *   rótulo textual e foco visível (regra global em `src/index.css`).
 * ============================================================================
 */

/**
 * Ponto ÚNICO de injeção de script de terceiro. Nenhum script é carregado
 * hoje; quando existir, ele entra aqui e só roda com consentimento gravado.
 */
function ativarScriptsDeAnalise() {
  if (!consentimentoPermiteAnalitico()) return false;
  // Ex.: injetar <script async src="..."> do provedor de análise aprovado.
  return true;
}

const COR = {
  fundo: 'rgba(11, 17, 24, 0.97)',
  borda: 'rgba(16, 185, 129, 0.45)',
  texto: '#dbe3ec',
  suave: '#9fb0c3',
  titulo: '#f8fafc',
  acento: '#34d399',
  acentoForte: '#10b981',
};

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false);
  const [detalhado, setDetalhado] = useState(false);
  const [analitico, setAnalitico] = useState(false);
  const painelRef = useRef(null);

  const abrir = useCallback((modoDetalhado = false) => {
    setAnalitico(lerConsentimento()?.analitico === true);
    setDetalhado(modoDetalhado === true);
    setVisivel(true);
  }, []);

  useEffect(() => {
    const decisao = lerConsentimento();
    if (decisao) ativarScriptsDeAnalise();
    else {
      const timer = setTimeout(() => setVisivel(true), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  // Reabertura pedida por qualquer tela (rodapé, Política de Privacidade).
  useEffect(() => {
    const aoAbrir = () => abrir(true);
    window.addEventListener(EVENTO_ABRIR_COOKIES, aoAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR_COOKIES, aoAbrir);
  }, [abrir]);

  // Leva o foco ao painel quando ele aparece (teclado e leitor de tela).
  useEffect(() => {
    if (visivel && painelRef.current) {
      try {
        painelRef.current.focus();
      } catch {
        /* ambiente sem foco programático */
      }
    }
  }, [visivel]);

  const decidir = (permiteAnalitico) => {
    salvarConsentimento({ analitico: permiteAnalitico === true });
    if (permiteAnalitico === true) ativarScriptsDeAnalise();
    setVisivel(false);
    setDetalhado(false);
  };

  if (!visivel) return null;

  return (
    <div
      ref={painelRef}
      tabIndex={-1}
      role="region"
      aria-labelledby="titulo-cookies"
      aria-describedby="texto-cookies"
      className="fade-in"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: '760px',
        background: COR.fundo,
        border: `1px solid ${COR.borda}`,
        borderRadius: '18px',
        padding: '18px 20px',
        zIndex: 99999,
        boxShadow: '0 18px 50px rgba(0, 0, 0, 0.75)',
        fontFamily: 'system-ui, sans-serif',
        color: COR.texto,
      }}
    >
      <h2 id="titulo-cookies" style={{ margin: 0, color: COR.titulo, fontSize: '14px', fontWeight: 900 }}>
        Cookies e privacidade
      </h2>
      <p id="texto-cookies" style={{ margin: '6px 0 0', color: COR.suave, fontSize: '12.5px', lineHeight: 1.55 }}>
        Usamos apenas o armazenamento essencial: sessão, tema escolhido e contador de demonstração. Hoje{' '}
        <strong style={{ color: COR.texto }}>não há analytics, pixel ou script de terceiros ativo</strong>; se algum
        for adicionado, ele só roda com a sua autorização. Detalhes na{' '}
        <Link to="/privacidade" style={{ color: COR.acento, textDecoration: 'underline', fontWeight: 700 }}>
          Política de Privacidade
        </Link>
        .
      </p>

      {detalhado && (
        <fieldset
          style={{
            margin: '12px 0 0',
            padding: '12px 14px',
            border: '1px solid rgba(148, 163, 184, 0.28)',
            borderRadius: '12px',
          }}
        >
          <legend style={{ padding: '0 6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: COR.suave }}>
            Preferências
          </legend>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: COR.suave }}>
            Essenciais (sessão, tema, limite de demonstração): sempre ativos, necessários para o sistema funcionar.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={analitico}
              onChange={(e) => setAnalitico(e.target.checked)}
              style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: COR.acentoForte }}
            />
            <span>
              Permitir análise de uso e scripts de terceiros (opcional). Pode ser desligado quando quiser neste mesmo
              painel.
            </span>
          </label>

          {/* Estado REAL de rastreamento e integrações (D-22.05). Lista lida de
              `transparenciaDados.js`: nada de inventar fornecedor. */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.22)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: COR.suave, letterSpacing: '0.06em' }}>
              RASTREAMENTO HOJE: {resumoRastreamento().titulo.toUpperCase()}
            </p>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 800, color: COR.suave, letterSpacing: '0.06em' }}>
              INTEGRAÇÕES DE TERCEIROS
            </p>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', lineHeight: 1.5 }}>
              {INTEGRACOES_TERCEIROS.map((item) => (
                <li key={item.id} style={{ marginBottom: '4px' }}>
                  <strong style={{ color: COR.texto }}>{item.nome}</strong> — {item.finalidade}{' '}
                  <em style={{ color: COR.suave }}>({item.gatilho})</em>
                </li>
              ))}
            </ul>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: COR.suave }}>
              Nenhuma dessas integrações é usada para publicidade ou perfilamento. As opcionais só são acionadas
              quando você usa o recurso correspondente.
            </p>
          </div>
        </fieldset>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
        <button
          type="button"
          onClick={() => decidir(false)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            color: COR.texto,
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Só essenciais
        </button>
        <button
          type="button"
          onClick={() => decidir(true)}
          style={{
            background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
            border: 'none',
            color: '#04120c',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          Aceitar todos
        </button>
        {detalhado ? (
          <button
            type="button"
            onClick={() => decidir(analitico)}
            style={{
              background: 'transparent',
              border: `1px solid ${COR.borda}`,
              color: COR.acento,
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Salvar preferências
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDetalhado(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COR.suave,
              padding: '10px 8px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Personalizar
          </button>
        )}
      </div>
    </div>
  );
}
