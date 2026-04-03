<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  ClipboardList,
  FileText,
  Users,
  LogOut,
  Lock,
  Zap,
  Star,
  History,
  Sparkles,
  Clock,
} from "lucide-react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function ProtectedRouteMaster({ children }) {
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [oficina, setOficina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [bloqueado, setBloqueado] = useState(false);

=======
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, DollarSign, ClipboardList,
  FileText, Users, LogOut, Lock, Zap, Star, History, Sparkles
} from 'lucide-react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function DashboardOficina() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [oficina, setOficina] = useState(null);
  const [loading, setLoading] = useState(true);
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

<<<<<<< HEAD
  // 1. LISTA DE MÓDULOS (Agora com a regra de Negócio)
  const modules = [
    {
      id: "visao-geral",
      name: "VISÃO GERAL",
      icon: <LayoutDashboard size={20} />,
      color: "#00e676",
      fixo: true,
    },
    {
      id: "tarefa",
      name: "TAREFAS",
      icon: <ClipboardList size={20} />,
      color: "#ff5722",
      fixo: true,
    },
    {
      id: "clientes",
      name: "CLIENTES",
      icon: <Users size={20} />,
      color: "#4caf50",
      fixo: true,
    },
    {
      id: "estoque",
      name: "ESTOQUE",
      icon: <Package size={20} />,
      color: "#ffc107",
      fixo: false,
    },
    {
      id: "financeiro",
      name: "FINANCEIRO",
      icon: <DollarSign size={20} />,
      color: "#00e676",
      fixo: false,
    },
    {
      id: "nota-fiscal",
      name: "NOTA FISCAL",
      icon: <FileText size={20} />,
      color: "#03a9f4",
      fixo: false,
    },
    {
      id: "retorno",
      name: "RETORNO",
      icon: <History size={20} />,
      color: "#9c27b0",
      fixo: false,
    },
    {
      id: "patrimonio",
      name: "PATRIMÔNIO",
      icon: <Package size={20} />,
      color: "#2196f3",
      fixo: false,
    },
    {
      id: "desmanche",
      name: "DESMANCHE",
      icon: <Package size={20} />,
      color: "#ff5722",
      fixo: false,
    },
    {
      id: "copiloto",
      name: "COPILOTO IA",
      icon: <Sparkles size={20} />,
      color: "#ff0033",
      fixo: false,
      isIA: true,
    },
=======
  // Lista completa de módulos (incluindo PATRIMÔNIO e DESMANCHE que aparecem na imagem)
  const modules = [
    { id: 'visao-geral', name: 'VISÃO GERAL', icon: <LayoutDashboard size={20} />, color: '#00e676', premium: false },
    { id: 'estoque', name: 'ESTOQUE', icon: <Package size={20} />, color: '#ffc107', premium: true },
    { id: 'financeiro', name: 'FINANCEIRO', icon: <DollarSign size={20} />, color: '#00e676', premium: true },
    { id: 'tarefa', name: 'TAREFA', icon: <ClipboardList size={20} />, color: '#ff5722', premium: false },
    { id: 'nota-fiscal', name: 'NOTA FISCAL', icon: <FileText size={20} />, color: '#03a9f4', premium: true },
    { id: 'retorno', name: 'RETORNO', icon: <History size={20} />, color: '#9c27b0', premium: true },
    { id: 'clientes', name: 'CLIENTES', icon: <Users size={20} />, color: '#4caf50', premium: false },
    { id: 'patrimonio', name: 'PATRIMÔNIO', icon: <Package size={20} />, color: '#2196f3', premium: true }, // Adicionado
    { id: 'desmanche', name: 'DESMANCHE', icon: <Package size={20} />, color: '#ff5722', premium: true }, // Adicionado
    { id: 'copiloto', name: 'COPILOTO IA', icon: <Sparkles size={20} />, color: '#ff0033', premium: true },
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
<<<<<<< HEAD
        const q = query(
          collection(db, "oficinas"),
          where("email", "==", currentUser.email),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const dados = snap.docs[0].data();

          // 🔒 Lógica do Trial e Bloqueio
          const fim = dados.trialFim?.toDate();
          if (fim) {
            const dias = Math.ceil((fim - new Date()) / (1000 * 60 * 60 * 24));
            setDiasRestantes(dias);
            if (dias <= 0 && dados.plano === "trial") setBloqueado(true);
          }
          setOficina({ id: snap.docs[0].id, ...dados });
        }
      } else {
        navigate("/login-admin");
=======
        try {
          const oficinasRef = collection(db, 'oficinas');
          const q = query(oficinasRef, where('email', '==', currentUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const dados = querySnapshot.docs[0].data();
            console.log("Dados carregados:", dados); // DEBUG
            console.log("Plano detectado:", dados.plano); // DEBUG
            console.log("Plano lowercase:", dados.plano?.toLowerCase()); // DEBUG
            setOficina({ id: querySnapshot.docs[0].id, ...dados });
          }
        } catch (error) {
          console.error("Erro ao buscar oficina:", error);
        }
      } else {
        navigate('/login-admin');
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db, navigate]);

<<<<<<< HEAD
  // 2. FUNÇÃO QUE DECIDE SE TEM CADEADO OU NÃO
  const temAcesso = (mod) => {
    if (oficina?.plano === "master" || oficina?.plano === "ultimate")
      return true;
    if (mod.fixo) return true; // Abas fixas sempre liberadas
    if (mod.isIA && oficina?.plano === "trial") return false; // Bloqueia IA no Trial
    return oficina?.modulosAtivos?.includes(mod.id); // Libera se estiver nos Slots do cliente
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-600"></div>
      </div>
    );

  if (bloqueado) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Lock size={60} className="text-red-600 mb-4" />
        <h1 className="text-2xl font-bold">TRIAL EXPIRADO</h1>
        <p className="text-zinc-500 mt-2 mb-6">
          Fale com o Elton para ativar seu plano.
        </p>
        <button
          onClick={() =>
            window.open(`https://wa.me/5534991439845?text=Meu trial expirou!`)
          }
          className="bg-red-600 px-8 py-3 rounded-xl font-bold"
        >
          ATIVAR AGORA
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      {/* Aviso de Dias no Topo */}
      {diasRestantes > 0 && oficina?.plano === "trial" && (
        <div
          className={`p-2 text-center text-[10px] font-bold uppercase ${diasRestantes <= 3 ? "bg-red-600" : "bg-yellow-500 text-black"}`}
        >
          Acesso Trial: Restam {diasRestantes} dias!
        </div>
      )}

      <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/80 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="text-red-600" fill="currentColor" size={24} />
          <h1 className="text-xl font-black uppercase">
            Oficina <span className="text-red-600">IA</span>
          </h1>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="p-2 border border-zinc-800 rounded-full hover:text-red-500"
        >
=======
  const handleLogout = () => signOut(auth).then(() => navigate('/login-admin'));

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-600"></div>
    </div>
  );

  // LÓGICA CORRIGIDA E SIMPLIFICADA
  const isMaster = oficina?.plano?.toLowerCase() === 'master';

  // Debug no console do navegador (aperte F12 para ver)
  console.log("É Master?", isMaster);
  console.log("Dados da oficina:", oficina);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">
      {/* Header */}
      <header className="p-6 border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="text-red-600" fill="currentColor" size={24} />
          <h1 className="text-xl font-black tracking-tighter uppercase">Oficina <span className="text-red-600">IA</span></h1>
        </div>
        <button onClick={handleLogout} className="p-2 border border-zinc-800 rounded-full hover:bg-red-600/10 hover:text-red-500 transition-all">
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
<<<<<<< HEAD
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {modules.map((mod) => {
            const acesso = temAcesso(mod);
            return (
              <button
                key={mod.id}
                onClick={() =>
                  acesso
                    ? setActiveTab(mod.id)
                    : alert("🔒 Aba bloqueada! Faça upgrade do plano.")
                }
                className={`relative p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 
                  ${activeTab === mod.id ? "bg-zinc-800 border-zinc-500" : "bg-zinc-900 border-zinc-800"}
                  ${!acesso ? "opacity-40" : "hover:border-zinc-600"}`}
              >
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: `${mod.color}15`,
                    color: mod.color,
                  }}
                >
                  {mod.icon}
                </div>
                <span className="text-[10px] font-black uppercase text-center">
                  {mod.name}
                </span>
                {!acesso && (
                  <Lock
                    size={12}
                    className="absolute top-3 right-3 text-red-500"
                  />
=======
        {/* Status */}
        <div className="mb-8 p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Olá, {oficina?.nome || 'Usuário'}</h2>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">
              Status: <span className={isMaster ? "text-yellow-400" : "text-red-500"}>
                {oficina?.plano || 'Trial'}
              </span>
            </p>
            {isMaster && <p className="text-[10px] text-yellow-600 mt-1">⚡ ACESSO MASTER LIBERADO</p>}
          </div>
          {!isMaster && (
            <button className="bg-red-600/10 text-red-500 border border-red-600/20 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all">
              UPGRADE
            </button>
          )}
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {modules.map((module) => {
            // REGRA SIMPLES: Se é master, libera tudo. Se não, verifica se é premium.
            const hasAccess = !module.premium || isMaster;

            return (
              <button
                key={module.id}
                onClick={() => hasAccess ? setActiveTab(module.id) : alert('🔒 Módulo Premium necessário. Faça upgrade para o plano Master.')}
                className={`
                  relative p-6 rounded-2xl border transition-all flex flex-col items-center gap-3
                  ${activeTab === module.id ? 'bg-zinc-800 border-zinc-500 scale-105' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
                  ${!hasAccess ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-800'}
                `}
              >
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${module.color}15`, color: module.color }}
                >
                  {module.icon}
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase text-center leading-tight">
                  {module.name}
                </span>

                {/* ÍCONE DE CADEADO - Só aparece se for premium E não for master */}
                {module.premium && !isMaster && (
                  <div className="absolute top-3 right-3 text-zinc-600 bg-black/50 rounded-full p-1">
                    <Lock size={12} />
                  </div>
                )}

                {/* ÍCONE DE ESTRELA - Aparece se for premium E for master (liberado) */}
                {module.premium && isMaster && (
                  <div className="absolute top-3 right-3 text-yellow-500 animate-pulse">
                    <Star size={12} fill="currentColor" />
                  </div>
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                )}
              </button>
            );
          })}
        </div>
<<<<<<< HEAD

        <div className="mt-8 p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
          {/* Aqui renderiza a aba ativa */}
          Conteúdo da aba: {activeTab}
        </div>
      </main>
    </div>
  );
}
=======
      </main>

      {/* Menu Inferior */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-2xl border border-zinc-800 p-2 rounded-2xl flex gap-2 shadow-2xl z-50">
        <button onClick={() => navigate('/')} className="px-6 py-2 rounded-xl bg-zinc-800 text-white font-bold text-[10px] uppercase tracking-tighter">Início</button>
        <button onClick={() => navigate('/admin-master')} className="px-6 py-2 rounded-xl text-zinc-500 hover:text-white font-bold text-[10px] uppercase tracking-tighter">Master</button>
      </nav>
    </div>
  );
}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
