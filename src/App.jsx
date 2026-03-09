import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import StatusOS from './pages/StatusOS';
import { OficinaProvider } from "./components/OficinaContext"; 
import ProtectedRouteMaster from "./components/ProtectedRouteMaster";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Servicos from "./pages/Servicos";
import Sobre from "./pages/Sobre";
import Admin from "./pages/Admin";
import Cadastro from "./pages/Cadastro";
import LeadsPage from "./pages/LeadsPage";
import Historico from "./pages/Historico";
import OleoPage from "./pages/OleoPage";
import OSPage from "./pages/OSPage";
import Login from "./pages/Login"; 
import LoginAdmin from "./pages/LoginAdmin"; // 🟢 A importação da nova tela do Google!

function AppRoutes() {
  const location = useLocation();
  
  // 🟢 Adicionei o '/login-admin' aqui para a tela de login ficar limpa, sem menu embaixo
  const mostrarMenuInferior = !['/site', '/cadastro', '/servicos', '/sobre', '/login-admin'].includes(location.pathname) && !location.pathname.startsWith('/status/');

  return (
    <>
      <Routes>
        {/* 🔴 O APP VOLTA AO NORMAL: Placa e Senha é a tela principal! */}
        <Route path="/" element={<Login />} />
        
        {/* 🟢 A NOVA FECHADURA DO SISTEMA (Acesso do Dono) */}
        <Route path="/login-admin" element={<LoginAdmin />} />
        
        {/* 🔴 PAINEL DO DONO DA OFICINA */}
        <Route path="/admin" element={<Admin />} />

        {/* 🔵 SITE DE VENDAS MOVIDO PARA /site (Para não atrapalhar o APP) */}
        <Route path="/site" element={<Home />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cadastro" element={<Cadastro />} />
        
        <Route path="/status/:oficinaId/:osId" element={<StatusOS />} />

        {/* Rotas Internas do Sistema */}
        <Route path="/historico" element={<Historico />} />
        <Route path="/oleo" element={<OleoPage />} />
        <Route path="/os" element={<OSPage />} />
        <Route path="/leads" element={<LeadsPage />} />

        <Route path="/master" element={<ProtectedRouteMaster><Admin /></ProtectedRouteMaster>} />
      </Routes>

      {/* Renderiza o menu inferior (Início, Admin, Clientes) */}
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