import { Link, useLocation } from 'react-router-dom';
import LeadButton from './LeadButton';

export default function Layout() {
  const location = useLocation();

  if (location.pathname.startsWith('/status/')) {
    return null;
  }

  const isPortalCliente =
    location.pathname === '/' ||
    location.pathname === '/clientes' ||
    location.pathname.startsWith('/clientes');


  return (
    <>
      <LeadButton />

      {isPortalCliente && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: '#0a0a0a',
          borderBottom: '1px solid #1a1a1a',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 20px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔧</span>
            <span style={{ color: '#FF0033', fontWeight: '900', fontSize: '13px', letterSpacing: '1px' }}>
              EXPRESS AUTO TECH
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/login-admin"
              style={{
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                color: 'black',
                padding: '13px 22px',
                borderRadius: '10px',
                fontWeight: '900',
                fontSize: '14px',
                textDecoration: 'none',
                letterSpacing: '0.5px',
                boxShadow: '0 0 24px #eab30888',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                animation: 'pulse-yellow 2s infinite',
              }}
            >
              🏢 ÁREA DA EMPRESA — Clique Aqui
            </Link>
            <style>{`@keyframes pulse-yellow { 0%,100%{ box-shadow:0 0 16px #eab30866 } 50%{ box-shadow:0 0 32px #eab308cc } }`}</style>
          </div>
        </div>
      )}

    </>
  );
}
