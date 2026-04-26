import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, DollarSign, ClipboardList,
  FileText, Users, LogOut, Lock, Zap, Star, History, Sparkles, HelpCircle
} from 'lucide-react';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import BibliotecaTreinamento from './admin/Ajuda';

export default function DashboardOficina() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [oficina, setOficina] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // Lista completa de módulos
  const modules = [
    { id: 'visao-geral', name: 'VISÃO GERAL', icon: <LayoutDashboard size={20} />, color: '#00e676', premium: false },
    { id: 'estoque', name: 'ESTOQUE', icon: <Package size={20} />, color: '#ffc107', premium: true },
    { id: 'financeiro', name: 'FINANCEIRO', icon: <DollarSign size={20} />, color: '#00e676', premium: true },
    { id: 'tarefa', name: 'TAREFA', icon: <ClipboardList size={20} />, color: '#ff5722', premium: false },
    { id: 'nota-fiscal', name: 'NOTA FISCAL', icon: <FileText size={20} />, color: '#03a9f4', premium: true },
    { id: 'retorno', name: 'RETORNO', icon: <History size={20} />, color: '#9c27b0', premium: true },
    { id: 'clientes', name: 'CLIENTES', icon: <Users size={20} />, color: '#4caf50', premium: false },
    { id: 'patrimonio', name: 'PATRIMÔNIO', icon: <Package size={20} />, color: '#2196f3', premium: true },
    { id: 'desmanche', name: 'DESMANCHE', icon: <Package size={20} />, color: '#ff5722', premium: true },
    { id: 'copiloto', name: 'COPILOTO IA', icon: <Sparkles size={20} />, color: '#ff0033', premium: true },
    { id: 'ajuda', name: 'AJUDA', icon: <HelpCircle size={20} />, color: '#ff3131', premium: false },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const oficinasRef = collection(db, 'oficinas');
          const q = query(oficinasRef, where('email', '==', currentUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const dados = querySnapshot.docs[0].data();
            setOficina({ id: querySnapshot.docs[0].id, ...dados });
          }
        } catch (error) {
          console.error("Erro ao buscar oficina:", error);
        }
      } else {
        navigate('/login-admin');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db, navigate]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login-admin'));

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-600"></div>
    </div>
  );

  const isMaster = oficina?.plano?.toLowerCase() === 'master';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">
      {/* Header */}
      <header className="p-6 border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="text-red-600" fill="currentColor" size={24} />
          <h1 className="text-xl font-black tracking-tighter uppercase">Oficina <span className="text-red-600">IA</span></h1>
        </div>
        <button onClick={handleLogout} className="p-2 border border-zinc-800 rounded-full hover:bg-red-600/10 hover:text-red-500 transition-all">
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
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

        {/* Grid de Módulos ou Ajuda */}
        {activeTab === 'ajuda' ? (
          <BibliotecaTreinamento />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {modules.map((module) => {
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

                  {module.premium && !isMaster && (
                    <div className="absolute top-3 right-3 text-zinc-600 bg-black/50 rounded-full p-1">
                      <Lock size={12} />
                    </div>
                  )}

                  {module.premium && isMaster && (
                    <div className="absolute top-3 right-3 text-yellow-500 animate-pulse">
                      <Star size={12} fill="currentColor" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Menu Inferior */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-2xl border border-zinc-800 p-2 rounded-2xl flex gap-2 shadow-2xl z-50">
        <button onClick={() => setActiveTab('visao-geral')} className="px-6 py-2 rounded-xl bg-zinc-800 text-white font-bold text-[10px] uppercase tracking-tighter">Início</button>
        <button onClick={() => navigate('/admin-master')} className="px-6 py-2 rounded-xl text-zinc-500 hover:text-white font-bold text-[10px] uppercase tracking-tighter">Master</button>
      </nav>
    </div>
  );
}
