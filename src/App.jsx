import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OficinaProvider } from './components/OficinaContext';
import { auth } from './lib/firebase';
import { ambienteDevLocal } from './lib/acesso-plano';

import Layout from './components/Layout';
import CookieBanner from './components/CookieBanner';

// ============================================================
// IMPORTAÇÕES DINÂMICAS (LAZY LOADING)
// Reduz o bundle inicial e acelera o carregamento em 3G/4G
// ============================================================
const AdminNovo = lazy(() => import('./AdminNovo'));
const Brain = lazy(() => import('./pages/Brain'));
const Historico = lazy(() => import('./Historico'));
const Login = lazy(() => import('./Login'));
const LoginAdmin = lazy(() => import('./LoginAdmin'));
const OSPage = lazy(() => import('./OSPage'));
const PortalCliente = lazy(() => import('./PortalCliente'));
const StatusOS = lazy(() => import('./StatusOS'));
const RevisaoPremium = lazy(() => import('./pages/admin/RevisaoPremium'));
const Termos = lazy(() => import('./pages/Termos'));
const Privacidade = lazy(() => import('./pages/Privacidade'));
const Reembolso = lazy(() => import('./pages/Reembolso'));
const Home = lazy(() => import('./Home'));
const Cadastro = lazy(() => import('./Cadastro'));
const Servicos = lazy(() => import('./Servicos'));
const Sobre = lazy(() => import('./Sobre'));
const AcompanharProcesso = lazy(() => import('./components/acompanhamento/AcompanharProcesso'));

// ============================================================
// ERROR BOUNDARY
// Previne que o app quebre completamente se um chunk falhar (deploy novo,
// cache do PWA) — e também mostra a causa real quando o erro é de renderização.
// D-23.37: a tela culpava sempre a rede do utilizador, o que era falso em
// erros de código (ex.: React #310 / ordem de hooks). Agora o texto separa
// falha de carregamento de módulo de exceção de renderização JavaScript.
// ============================================================
const ERRO_MODULO = /dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically|Failed to fetch/i;
const ERRO_REACT = /Minified React error|Rendered more hooks|Rendered fewer hooks|Invalid hook call|Objects are not valid as a React child|Cannot read propert|is not a function|undefined is not/i;

function classificarErro(mensagem) {
  const msg = String(mensagem || '');
  if (ERRO_MODULO.test(msg)) {
    return {
      tipo: 'modulo',
      titulo: 'Não foi possível carregar esta tela',
      texto:
        'O navegador não conseguiu descarregar os ficheiros desta parte do sistema — normalmente é cache antigo depois de uma atualização ou ligação instável. Recarregue a página para tentar novamente.',
    };
  }
  if (ERRO_REACT.test(msg)) {
    return {
      tipo: 'render',
      titulo: 'Erro ao renderizar esta tela',
      texto:
        'Não é a sua internet: a interface encontrou um erro inesperado de programação e interrompeu a renderização para não mostrar dados errados. Recarregue a página; se o erro voltar, envie o detalhe técnico abaixo para o suporte.',
    };
  }
  return {
    tipo: 'desconhecido',
    titulo: 'Erro inesperado nesta tela',
    texto:
      'A aplicação encontrou um erro que não conseguiu tratar. Recarregue a página; se o erro voltar, envie o detalhe técnico abaixo para o suporte.',
  };
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, detalhe: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, detalhe: String((error && error.message) || error || '') };
  }
  componentDidCatch(error, info) {
    // Sem isso a tela só dizia "instabilidade na rede" e escondia a causa real.
    // O erro completo fica no console (e no texto abaixo).
    console.error('[ErrorBoundary] tela:', window.location.pathname, error, info);

    // Chunk velho/ausente (deploy novo, Vite re-otimizando dependências, cache
    // do PWA): recarregar uma vez resolve. Guarda a tentativa na sessão para
    // não entrar em laço quando o problema é de código, não de carregamento.
    const msg = String((error && error.message) || '');
    const falhaDeModulo = ERRO_MODULO.test(msg);
    if (falhaDeModulo) {
      const chave = `erro-modulo:${window.location.pathname}`;
      try {
        if (!sessionStorage.getItem(chave)) {
          sessionStorage.setItem(chave, '1');
          window.location.reload();
        }
      } catch { /* sessionStorage bloqueado: só mostra a tela */ }
    }
  }
  render() {
    if (this.state.hasError) {
      const diagnostico = classificarErro(this.state.detalhe);
      return (
        <div style={{ backgroundColor: '#020408' }} className="h-screen w-full flex flex-col items-center justify-center text-white p-4 text-center">
          <h1 className="text-2xl font-bold text-emerald-400 mb-2">{diagnostico.titulo}</h1>
          <p className="text-gray-400 mb-3 max-w-md">{diagnostico.texto}</p>
          {this.state.detalhe ? (
            <p className="mb-6 max-w-xl break-words rounded-lg border border-slate-800 bg-black/40 px-3 py-2 text-[11px] text-slate-500">
              <strong className="text-slate-400">Detalhe técnico:</strong> {this.state.detalhe}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => window.location.reload()} style={{ backgroundColor: '#10b981' }} className="px-6 py-3 font-bold rounded-xl hover:opacity-90 transition-colors text-white">Recarregar Página</button>
            <button
              onClick={() => { window.location.href = '/login-admin'; }}
              className="rounded-xl border border-slate-700 px-6 py-3 font-bold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
            >
              Ir para o login
            </button>
          </div>
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
    <div style={{ backgroundColor: '#020408' }} className="h-screen w-full flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin" />
      <p className="text-white mt-4 font-bold">Verificando acesso...</p>
    </div>
  );
}

// ============================================================
// ROTA PRIVADA
// Garante que apenas usuários logados acessem o Admin.
// Exceção: máquina de desenvolvimento (`npm run dev` / localhost) abre o
// painel sem login para testar o modo Admin Total (D-23.19). Em produção o
// bundle tem `import.meta.env.DEV === false` e o host não é local, então a
// regra de login continua valendo.
// ============================================================
const ACESSO_LOCAL_DEV = ambienteDevLocal();

function PrivateRoute({ children }) {
  const { logado, carregandoAuth } = useAuth();

  if (carregandoAuth) {
    return <TelaCarregamento />;
  }

  if (ACESSO_LOCAL_DEV) return children;

  return logado ? children : <Navigate to="/login-admin" replace />;
}

/**
 * AdminRoute — /brain só abre para a conta administradora da plataforma
 * (papel 'master' ou custom claim admin=true). Cliente logado vai para /admin.
 */
function AdminRoute({ children }) {
  const { logado, carregandoAuth, papelLogado } = useAuth();
  const [souAdmin, setSouAdmin] = React.useState(null);

  React.useEffect(() => {
    let vivo = true;
    const conta = auth?.currentUser;
    if (!conta?.getIdTokenResult) {
      setSouAdmin(papelLogado === 'master');
      return undefined;
    }
    conta
      .getIdTokenResult()
      .then((r) => { if (vivo) setSouAdmin(r?.claims?.admin === true || papelLogado === 'master'); })
      .catch(() => { if (vivo) setSouAdmin(papelLogado === 'master'); });
    return () => { vivo = false; };
  }, [papelLogado, logado]);

  if (carregandoAuth || souAdmin === null) return <TelaCarregamento />;
  if (!logado) return <Navigate to="/login-admin" replace />;
  return souAdmin ? children : <Navigate to="/admin" replace />;
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

  const rotasSemLayout = ['/', '/login', '/login-admin', '/portal', '/portal2', '/cadastro', '/servicos', '/sobre', '/acompanhar', '/termos', '/privacidade', '/reembolso', '/brain'];
  const mostrarMenuInferior =
    !rotasSemLayout.includes(location.pathname) &&
    !location.pathname.startsWith('/status/');

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={logado ? <Navigate to="/admin" replace /> : <Home />}
        />

        <Route
          path="/brain"
          element={
            <AdminRoute>
              <Brain />
            </AdminRoute>
          }
        />

        <Route path="/portal" element={<PortalCliente />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/acompanhar" element={<AcompanharProcesso />} />

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
        <Route path="/reembolso" element={<Reembolso />} />

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
