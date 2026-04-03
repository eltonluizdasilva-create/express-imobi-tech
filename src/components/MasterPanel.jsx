import React, { useState, useEffect } from "react";
import {
  Save,
  ShieldCheck,
  Video,
  Settings,
  Users,
  DollarSign,
  CheckCircle2,
  Lock,
  Globe,
  Database,
  LayoutGrid,
  HelpCircle,
  TrendingUp,
  Package,
  FileText,
  ClipboardList,
  UserCheck,
  Briefcase,
} from "lucide-react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// 1. A LISTA QUE MANDA NO SEU IMPÉRIO (TODAS AS SUAS ABAS)
const LISTA_MESTRA_ABAS = [
  { id: "visao-geral", nome: "Visão Geral", icon: "📊" },
  { id: "estoque", nome: "Estoque", icon: "📦" },
  { id: "financeiro", nome: "Financeiro", icon: "💰" },
  { id: "tarefa", nome: "Tarefas", icon: "📋" },
  { id: "nota-fiscal", nome: "Nota Fiscal", icon: "📄" },
  { id: "retorno", nome: "Retorno/Pós-Venda", icon: "📅" },
  { id: "clientes", nome: "Clientes", icon: "👥" },
  { id: "patrimonio", nome: "Patrimônio", icon: "📊" },
  { id: "fornecedores", nome: "Fornecedores", icon: "🤝" },
  { id: "historico", nome: "Histórico de Placas", icon: "📋" },
  { id: "mercadolivre", nome: "Mercado Livre", icon: "📦" },
  { id: "sistema-config", nome: "Sistema Config", icon: "⚙️" },
  { id: "master-local", nome: "Master Local", icon: "👑" },
  { id: "meu-plano", nome: "Meu Plano", icon: "💳" },
  { id: "ajustes", nome: "Ajustes", icon: "⚙️" },
  { id: "equipe", nome: "Equipe", icon: "👥" },
  { id: "marketing", nome: "Marketing", icon: "📣" },
  { id: "estrategia", nome: "Estratégia", icon: "🚀" },
  { id: "ajuda", nome: "Ajuda/Suporte", icon: "❓" },
];

const db = getFirestore();

export default function MasterPanel() {
  const [activeTab, setActiveTab] = useState("planos");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    videos: {},
    resumos: {},
    modulosBase: ["visao-geral", "ajuda"], // Mercado Livre pode ser base se você quiser
    planos: {
      essencial: { preco: 99, slots: 1, func: 3 },
      profissional: { preco: 149, slots: 3, func: 5 },
      especialista: { preco: 249, slots: 5, func: 8 },
      master: { preco: 449, slots: 99, func: 12 },
    },
  });

  // CARREGA DO BANCO PRA NÃO PERDER NADA
  useEffect(() => {
    const fetchMaster = async () => {
      const snap = await getDoc(doc(db, "config_global", "master_data"));
      if (snap.exists()) setConfig((prev) => ({ ...prev, ...snap.data() }));
    };
    fetchMaster();
  }, []);

  // SALVA NO BANCO (ISSO ATIVA OS CADEADOS NO APP DO CLIENTE)
  const handleSalvarTudo = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "config_global", "master_data"), config, {
        merge: true,
      });
      alert("🚀 SISTEMA SINCRONIZADO COM SUCESSO!");
    } catch (e) {
      alert("Erro ao salvar no Firestore!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans pb-40">
      {/* HEADER PREMIUM */}
      <header className="flex justify-between items-center mb-10 bg-zinc-900/60 p-8 rounded-[40px] border border-zinc-800 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-6">
          <ShieldCheck
            className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            size={40}
          />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Painel <span className="text-red-600">Master</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-black tracking-[0.4em] uppercase">
              Exp Auto Tech - Controle de Licenças
            </p>
          </div>
        </div>
        <button
          onClick={handleSalvarTudo}
          className="bg-red-600 hover:bg-red-700 px-12 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 transition-all active:scale-95 shadow-xl"
        >
          {loading ? (
            "Salvando..."
          ) : (
            <>
              <Save size={20} /> Salvar Configurações
            </>
          )}
        </button>
      </header>

      {/* TABS DE NAVEGAÇÃO */}
      <nav className="flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("planos")}
          className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === "planos" ? "bg-white text-black shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-white"}`}
        >
          📦 Planos & Slots
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === "videos" ? "bg-white text-black shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-white"}`}
        >
          🎥 Vídeos & Resumos
        </button>
        <button
          onClick={() => setActiveTab("oficinas")}
          className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === "oficinas" ? "bg-white text-black shadow-lg" : "bg-zinc-900 text-zinc-500 hover:text-white"}`}
        >
          🏢 Base de Oficinas
        </button>
      </nav>

      {/* 1. PLANOS, FUNCIONÁRIOS E MÓDULOS BASE */}
      {activeTab === "planos" && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.keys(config.planos).map((p) => (
              <div
                key={p}
                className="bg-zinc-900 p-8 rounded-[55px] border border-zinc-800 hover:border-red-600 transition-all"
              >
                <h3 className="text-xl font-black text-red-600 uppercase mb-8 text-center">
                  {p}
                </h3>
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-3xl border border-zinc-800 text-center">
                    <span className="text-[9px] text-zinc-600 font-black block mb-1 uppercase">
                      Preço Mensal
                    </span>
                    <p className="text-white font-black text-sm">
                      R$ {config.planos[p].preco}
                    </p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-3xl border border-zinc-800 text-center">
                    <span className="text-[9px] text-zinc-600 font-black block mb-1 uppercase">
                      Abas Extras
                    </span>
                    <input
                      type="number"
                      value={config.planos[p].slots}
                      className="bg-transparent text-center font-black text-white w-full outline-none"
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          planos: {
                            ...config.planos,
                            [p]: { ...config.planos[p], slots: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="bg-black/40 p-4 rounded-3xl border border-zinc-800 text-center">
                    <span className="text-[9px] text-zinc-600 font-black block mb-1 uppercase">
                      Máx. Funcionários
                    </span>
                    <input
                      type="number"
                      value={config.planos[p].func}
                      className="bg-transparent text-center font-black text-white w-full outline-none"
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          planos: {
                            ...config.planos,
                            [p]: { ...config.planos[p], func: e.target.value },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 p-10 rounded-[60px] border border-zinc-800">
            <h3 className="text-sm font-black uppercase mb-8 flex items-center gap-2 text-red-600">
              <Settings size={20} /> Configuração de Módulos Base (Sempre
              Abertos)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {LISTA_MESTRA_ABAS.map((cat) => {
                const isBase = config.modulosBase.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const novaBase = isBase
                        ? config.modulosBase.filter((i) => i !== cat.id)
                        : [...config.modulosBase, cat.id];
                      setConfig({ ...config, modulosBase: novaBase });
                    }}
                    className={`flex items-center justify-between p-4 rounded-[25px] border text-[9px] font-black uppercase transition-all ${isBase ? "bg-red-600 border-red-600 text-white" : "bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-600"}`}
                  >
                    <span>
                      {cat.icon} {cat.nome}
                    </span>
                    {isBase ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Lock size={16} className="opacity-20" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. VIDEOS E AJUDA (CENTRAL DE CONHECIMENTO) */}
      {activeTab === "videos" && (
        <div className="bg-zinc-900 p-10 rounded-[60px] border border-zinc-800 animate-in fade-in">
          <h2 className="text-xl font-black uppercase text-red-600 mb-10 flex items-center gap-3">
            <Video /> Biblioteca de Vídeos e Resumos
          </h2>
          <div className="space-y-3">
            {LISTA_MESTRA_ABAS.map((cat) => (
              <div
                key={cat.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/40 p-4 rounded-[30px] border border-zinc-800/50 hover:border-red-600 transition-all"
              >
                <div className="flex items-center gap-3 w-48">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[10px] font-black uppercase text-zinc-300">
                    {cat.nome}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Link do YouTube"
                  className="bg-black border border-zinc-800 p-4 rounded-2xl text-[10px] text-red-500 outline-none focus:border-red-600"
                  value={config.videos[cat.id] || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      videos: { ...config.videos, [cat.id]: e.target.value },
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Resumo do Módulo"
                  className="bg-black border border-zinc-800 p-4 rounded-2xl text-[10px] text-zinc-500 outline-none"
                  value={config.resumos[cat.id] || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      resumos: { ...config.resumos, [cat.id]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BASE DE OFICINAS (SEU CRM) */}
      {activeTab === "oficinas" && (
        <div className="bg-zinc-900 p-12 rounded-[60px] border border-zinc-800 text-center py-40 animate-in zoom-in-95">
          <Globe
            className="text-red-600/10 mx-auto mb-8 animate-pulse"
            size={150}
          />
          <h2 className="text-3xl font-black uppercase text-zinc-700">
            Controle Global de Oficinas Ativas
          </h2>
          <p className="text-[10px] text-zinc-800 font-black mt-4 uppercase tracking-[0.5em] max-w-xl mx-auto leading-relaxed">
            Sincronização em tempo real com o Firestore para monitoramento de
            assinaturas.
          </p>
        </div>
      )}
    </div>
  );
}
