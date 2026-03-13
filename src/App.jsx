import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

// IMPORTANTE: Agora os caminhos apontam diretamente para a pasta atual (./)
import StatusOS from './StatusOS';
import { OficinaProvider } from "./components/OficinaContext"; 
import ProtectedRouteMaster from "./components/ProtectedRouteMaster";
import Layout from "./components/Layout";

import Home from "./Home";
import Servicos from "./Servicos";
import Sobre from "./Sobre";
import Admin from "./Admin";
import Cadastro from "./Cadastro";
import LeadsPage from "./LeadsPage";
import Historico from "./Historico";
import OleoPage from "./OleoPage";
import OSPage from "./OSPage";
import Login from "./Login"; 
import LoginAdmin from "./LoginAdmin";
import Marketing from "./Marketing"; 

function AppRoutes() {
  const location = useLocation();
  
  // A lógica do menu continua a mesma, só os arquivos mudaram de lugar
  const mostrarMenuInferior = ![
    '/site',
    '/cadastro',
    '/servicos',
    '/sobre',
    '/login-admin'
  ].includes(location.pathname) && !location.pathname.startsWith('/status/');

  return (
    <>
      <Routes>
        {/* LOGIN PRINCIPAL */}
        <Route path="/" element={<Login />} />

        {/* LOGIN DO DONO */}
        <Route path="/login-admin" element={<LoginAdmin />} />

        {/* ADMIN */}
        <Route path="/admin" element={<Admin />} />

        {/* ABA MARKETING */}
        <Route path="/marketing" element={<Marketing />} />

        {/* SITE */}
        <Route path="/site" element={<Home />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* STATUS */}
        <Route path="/status/:oficinaId/:osId" element={<StatusOS />} />

        {/* SISTEMA INTERNO */}
        <Route path="/historico" element={<Historico />} />
        <Route path="/oleo" element={<OleoPage />} />
        <Route path="/os" element={<OSPage />} />
        <Route path="/leads" element={<LeadsPage />} />

        <Route path="/master" element={
          <ProtectedRouteMaster>
            <Admin />
          </ProtectedRouteMaster>
        } />
      </Routes>

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