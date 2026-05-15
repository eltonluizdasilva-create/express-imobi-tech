import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OficinaProvider } from './components/OficinaContext';

import Layout from './components/Layout';
import CookieBanner from './components/CookieBanner';

// ============================================================
// IMPORTAÇÕES DINÂMICAS (LAZY LOADING)
// Reduz o bundle inicial e acelera o carregamento em 3G/4G
// ============================================================
const AdminNovo = lazy(() => import('./AdminNovo'));
const Historico = lazy(() => import('./Historico'));
const Login = lazy(() => import('./Login'));
const LoginAdmin = lazy(() => import('./LoginAdmin'));
const OSPage = lazy(() => import('./OSPage'));
const PortalCliente = lazy(() => import('./PortalCliente'));
const StatusOS = lazy(() => import('./StatusOS'));
const RevisaoPremium = lazy(() => import('./pages/admin/RevisaoPremium'));
const Termos = lazy(() => import('./pages/Termos'));
const Privacidade = lazy(() => import('./pages/Privacidade'));

// ============================================================
// ERROR BOUNDARY
// Previne que o app quebre completamente se a internet cair
// durante um lazy load (Failed to fetch dynamically imported module)
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-4 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Erro de Conexão</h1>
          <p className="text-gray-400 mb-6 max-w-md">Ocorreu uma instabilidade na sua rede no momento de carregar os componentes desta tela.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 font-bold rounded-xl hover:bg-red-500 transition-colors">Recarregar Página</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// COMPONENTE DE CARREGAMENTO (FALLBACK)
// Exibido enquanto os módulos dinâmicos são baixados
// ============================================================
function TelaCarregamento() {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white mt-4 font-bold">Verificando acesso...</p>
    </div>
  );
}

// ============================================================
// ROTA PRIVADA
// Garante que apenas usuários logados acessem o Admin
// ============================================================
function PrivateRoute({ children }) {
  const { logado, carregandoAuth } = useAuth();

  if (carregandoAuth) {
    return <TelaCarregamento />;
  }

  return logado ? children : <Navigate to="/login-admin" replace />;
}

// ============================================================
// GERENCIAMENTO DE ROTAS
// ============================================================
function AppRoutes() {
  const location = useLocation();
  const { logado, carregandoAuth } = useAuth();

  if (carregandoAuth) {
    return <TelaCarregamento />;
  }

  const rotasSemLayout = ['/', '/login', '/login-admin', '/portal', '/portal2', '/termos', '/privacidade'];
  const mostrarMenuInferior =
    !rotasSemLayout.includes(location.pathname) &&
    !location.pathname.startsWith('/status/');

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={logado ? <Navigate to="/admin" replace /> : <PortalCliente />}
        />

        <Route path="/portal" element={<PortalCliente />} />

        <Route
          path="/login"
          element={logado ? <Navigate to="/admin" replace /> : <Login />}
        />

        <Route
          path="/login-admin"
          element={logado ? <Navigate to="/admin" replace /> : <LoginAdmin />}
        />

        <Route
          path="/admin"
          element={(
            <PrivateRoute>
              <AdminNovo />
            </PrivateRoute>
          )}
        />

        <Route
          path="/historico"
          element={(
            <PrivateRoute>
              <Historico />
            </PrivateRoute>
          )}
        />

        <Route
          path="/os"
          element={(
            <PrivateRoute>
              <OSPage />
            </PrivateRoute>
          )}
        />

        <Route path="/status/:oficinaId/:osId" element={<StatusOS />} />

        <Route
          path="/admin/revisao-premium"
          element={(
            <PrivateRoute>
              <RevisaoPremium />
            </PrivateRoute>
          )}
        />

        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />

        <Route path="*" element={<Navigate to={logado ? '/admin' : '/login-admin'} replace />} />
      </Routes>

      {mostrarMenuInferior && <Layout />}
    </>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL (APP)
// Envolvido em Suspense para gerenciar o Lazy Loading
// ============================================================
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <OficinaProvider>
          <ErrorBoundary>
            <Suspense fallback={<TelaCarregamento />}>
              <AppRoutes />
              <CookieBanner />
            </Suspense>
          </ErrorBoundary>
        </OficinaProvider>
      </AuthProvider>
    </Router>
  );
}