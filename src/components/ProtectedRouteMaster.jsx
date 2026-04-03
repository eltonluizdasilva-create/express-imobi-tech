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

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

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
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db, navigate]);

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
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
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
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
          {/* Aqui renderiza a aba ativa */}
          Conteúdo da aba: {activeTab}
        </div>
      </main>
    </div>
  );
}
