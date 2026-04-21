import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OficinaProvider } from './components/OficinaContext';

import Layout from './components/Layout';

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

  const rotasSemLayout = ['/', '/login', '/login-admin', '/portal', '/portal2'];
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
          <Suspense fallback={<TelaCarregamento />}>
            <AppRoutes />
          </Suspense>
        </OficinaProvider>
      </AuthProvider>
    </Router>
  );
}