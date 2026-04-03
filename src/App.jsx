import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// IMPORTANTE: Caminhos apontando para a pasta atual (./) ou components
import StatusOS from './StatusOS';
import { OficinaProvider } from "./components/OficinaContext";
import ProtectedRouteMaster from "./components/ProtectedRouteMaster";
import Layout from "./components/Layout";

import Home from "./Home";
import Servicos from "./Servicos";
import Sobre from "./Sobre";
import AdminNovo from './AdminNovo';
import Cadastro from "./Cadastro";
import LeadsPage from "./LeadsPage";
import Historico from "./Historico";
import OleoPage from "./OleoPage";
import OSPage from "./OSPage";
import Login from "./Login";
import LoginAdmin from "./LoginAdmin";
import Marketing from "./Marketing";

// 🟢 IMPORT DO NOVO PORTAL DO CLIENTE
import PortalCliente from "./PortalCliente";

function AppRoutes() {
  const location = useLocation();

  // Lógica do menu inferior (Layout)
  // Adicionamos as rotas onde o menu NÃO deve aparecer
  const mostrarMenuInferior = ![
    '/',
    '/site',
    '/cadastro',
    '/servicos',
    '/sobre',
    '/login-admin',
    '/portal',
    '/portal2',
    '/login'
  ].includes(location.pathname) && !location.pathname.startsWith('/status/');

  return (
    <>
      <Routes>
        {/* 🟢 PORTAL DO CLIENTE - PÁGINA PRINCIPAL E VARIANTES */}
        <Route path="/" element={<PortalCliente />} />
        <Route path="/portal" element={<PortalCliente />} />
        <Route path="/portal2" element={<PortalCliente />} />

        {/* LOGINS */}
        <Route path="/login" element={<Login />} />
        <Route path="/login-admin" element={<LoginAdmin />} />

        {/* 🟢 ADMIN CORRIGIDO (PARA ABRIR DIRETO SEM TELA PRETA) */}
        <Route path="/admin" element={<AdminNovo />} />
        <Route path="/admin2" element={<AdminNovo />} />

        {/* ABA MARKETING */}
        <Route path="/marketing" element={<Marketing />} />

        {/* SITE INSTITUCIONAL */}
        <Route path="/site" element={<Home />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* STATUS DA OS (PÁGINA DO CLIENTE) */}
        <Route path="/status/:oficinaId/:osId" element={<StatusOS />} />

        {/* 🟢 SISTEMA INTERNO (AQUI O MENU INFERIOR APARECE) */}
        <Route path="/historico" element={<Historico />} />
        <Route path="/oleo" element={<OleoPage />} />
        <Route path="/os" element={<OSPage />} />
        <Route path="/leads" element={<LeadsPage />} />

        {/* ÁREA MASTER PROTEGIDA */}
        <Route path="/master" element={
          <ProtectedRouteMaster>
            <AdminNovo />
          </ProtectedRouteMaster>
        } />
      </Routes>

      {/* O componente Layout é o seu menu inferior com botões */}
      {mostrarMenuInferior && <Layout />}
    </>
  );
}

export default function App() {
  return (
    <OficinaProvider>
      <Router>
        <AppRoutes />
      </Router>
    </OficinaProvider>
  );
}