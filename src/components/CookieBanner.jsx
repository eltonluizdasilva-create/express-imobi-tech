import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Checar se consentimento já existe
    const consent = localStorage.getItem('lgpdConsent');
    if (!consent) {
      // Pequeno delay para dar uma entrada premium e sutil
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (consent === 'true') {
      // Se já aceitou anteriormente, podemos simular o carregamento de pixels de terceiro
      carregarMetricasExternas();
    }
  }, []);

  const aceitarTodos = () => {
    localStorage.setItem('lgpdConsent', 'true');
    setVisible(false);
    carregarMetricasExternas();
  };

  const recusarNaoEssenciais = () => {
    localStorage.setItem('lgpdConsent', 'false');
    setVisible(false);
    console.log('LGPD: Apenas cookies estritamente funcionais autorizados pelo usuário.');
  };

  // Função arquitetural pronta para carregar Google Analytics, Meta Pixel, etc.
  const carregarMetricasExternas = () => {
    console.log('LGPD Consentido: Iniciando injeção segura de scripts externos de análise...');
    // EX: window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
  };

  if (!visible) return null;

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '720px',
        background: 'rgba(10,10,10,0.9)',
        border: '1px solid rgba(0,230,118,0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        padding: '20px 25px',
        zIndex: 99999,
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(0,230,118,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div style={{ flex: '1 1 400px' }}>
        <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#00E676' }}>🍪</span> Controle sua Privacidade e Dados
        </h4>
        <p style={{ margin: 0, color: '#aaa', fontSize: '12px', lineHeight: 1.5 }}>
          Utilizamos cookies funcionais e inteligentes para garantir o desempenho do sistema. Scripts de análise só rodam sob o seu comando. 
          Saiba mais lendo nossa <Link to="/privacidade" style={{ color: '#00E676', textDecoration: 'underline', fontWeight: 'bold' }}>Política de Privacidade</Link> e <Link to="/termos" style={{ color: '#00E676', textDecoration: 'underline', fontWeight: 'bold' }}>Termos</Link>.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={recusarNaoEssenciais}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#888',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: '0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
        >
          Apenas Essenciais
        </button>

        <button
          onClick={aceitarTodos}
          style={{
            background: 'linear-gradient(90deg, #00E676 0%, #00b25a 100%)',
            border: 'none',
            color: '#000',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,230,118,0.25)',
            transition: '0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Aceitar Tudo
        </button>
      </div>
    </div>
  );
}
