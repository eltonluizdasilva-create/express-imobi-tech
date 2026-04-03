import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";


// IMPORTANTE: Caminhos apontando para a pasta atual (./) ou components
=======
// IMPORTANTE: Agora os caminhos apontam diretamente para a pasta atual (./)
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
import StatusOS from './StatusOS';
import { OficinaProvider } from "./components/OficinaContext";
import ProtectedRouteMaster from "./components/ProtectedRouteMaster";
import Layout from "./components/Layout";

import Home from "./Home";
import Servicos from "./Servicos";
import Sobre from "./Sobre";

import AdminNovo from './AdminNovo';
=======
import Admin from "./Admin";
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
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
=======
// 🟢 IMPORT DO NOVO PORTAL DO CLIENTE (Buscando da pasta pages/admin)
import PortalCliente from "./pages/admin/PortalCliente";
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3

function AppRoutes() {
  const location = useLocation();


  // Lógica do menu inferior (Layout)
  // Adicionamos as rotas onde o menu NÃO deve aparecer
  const mostrarMenuInferior = ![
    '/',
=======
  // A lógica do menu: adicionamos '/' e '/login' aqui para o menu do mecânico NÃO aparecer
  const mostrarMenuInferior = ![
    '/',             // <--- Esconde o menu na nova página principal do site
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
    '/site',
    '/cadastro',
    '/servicos',
    '/sobre',
    '/login-admin',
    '/portal',

    '/portal2',
    '/login'
=======
    '/login'         // <--- Esconde o menu na tela de login velha
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
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
=======
        {/* 🟢 AGORA O PORTAL DO CLIENTE É A PÁGINA PRINCIPAL DO SITE */}
        <Route path="/" element={<PortalCliente />} />

        {/* Mantive a rota /portal funcionando caso você já tenha divulgado esse link */}
        <Route path="/portal" element={<PortalCliente />} />

        {/* O antigo login principal foi movido para cá, para a equipe continuar usando */}
        <Route path="/login" element={<Login />} />

        {/* LOGIN DO DONO */}
        <Route path="/login-admin" element={<LoginAdmin />} />

        {/* ADMIN */}
        <Route path="/admin" element={<Admin />} />
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3

        {/* ABA MARKETING */}
        <Route path="/marketing" element={<Marketing />} />


        {/* SITE INSTITUCIONAL */}
=======
        {/* SITE */}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        <Route path="/site" element={<Home />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cadastro" element={<Cadastro />} />


        {/* STATUS DA OS (PÁGINA DO CLIENTE) */}
        <Route path="/status/:oficinaId/:osId" element={<StatusOS />} />

        {/* 🟢 SISTEMA INTERNO (AQUI O MENU INFERIOR APARECE) */}
=======
        {/* STATUS */}
        <Route path="/status/:oficinaId/:osId" element={<StatusOS />} />

        {/* SISTEMA INTERNO */}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        <Route path="/historico" element={<Historico />} />
        <Route path="/oleo" element={<OleoPage />} />
        <Route path="/os" element={<OSPage />} />
        <Route path="/leads" element={<LeadsPage />} />


        {/* ÁREA MASTER PROTEGIDA */}
        <Route path="/master" element={
          <ProtectedRouteMaster>
            <AdminNovo />
=======
        <Route path="/master" element={
              <ProtectedRouteMaster>
                <Admin />
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
              </ProtectedRouteMaster>
            } />
          </Routes>


      {/* O componente Layout é o seu menu inferior com botões */}
=======
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
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