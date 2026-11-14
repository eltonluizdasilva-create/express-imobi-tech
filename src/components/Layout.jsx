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
          background: '#020408',
          borderBottom: '1px solid #1e293b',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 20px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🏢</span>
            <span style={{ color: '#10b981', fontWeight: '900', fontSize: '13px', letterSpacing: '1px' }}>
              EXPRESS IMOBI TECH
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/login-admin"
              style={{
                background: '#10b981',
                color: 'white',
                padding: '13px 22px',
                borderRadius: '10px',
                fontWeight: '900',
                fontSize: '14px',
                textDecoration: 'none',
                letterSpacing: '0.5px',
                boxShadow: '0 0 24px #10b98166',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              🏢 PAINEL EXECUTIVO — Clique Aqui
            </Link>
          </div>
        </div>
      )}

    </>
  );
}
