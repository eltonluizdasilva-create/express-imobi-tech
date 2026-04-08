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
  Activity,
  Award,
  Camera,
  MessageCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// 1. A LISTA QUE MANDA NO SEU IMPÉRIO (TODAS AS SUAS ABAS)
const LISTA_MESTRA_ABAS = [
  // OPERACIONAIS
  { id: "os", nome: "O.S. (Ordem de Serviço)", icon: "📝", categoria: "operacional" },
  { id: "mecanica", nome: "Mecânica", icon: "🔧", categoria: "operacional" },
  { id: "clientes", nome: "Clientes", icon: "👥", categoria: "operacional" },
  { id: "hibrido", nome: "Híbridos/Elétricos", icon: "🔋", categoria: "operacional" },
  { id: "moto", nome: "Motos", icon: "🏍️", categoria: "operacional" },
  { id: "funilaria", nome: "Funilaria", icon: "🚗", categoria: "operacional" },
  { id: "amortecedor", nome: "Amortecedor", icon: "🧰", categoria: "operacional" },
  { id: "injecao", nome: "Injeção", icon: "🛠️", categoria: "operacional" },
  { id: "eletrica", nome: "Elétrica", icon: "⚡", categoria: "operacional" },
  { id: "alinhamento", nome: "Alinhamento", icon: "⚙️", categoria: "operacional" },
  { id: "botoesFlutuantes", nome: "Botões Flutuantes", icon: "🖱️", categoria: "operacional" },
  { id: "oleo", nome: "Óleo", icon: "🛢️", categoria: "operacional" },
  { id: "revisao", nome: "Revisão", icon: "🛡️", categoria: "operacional" },
  { id: "ar_condicionado", nome: "Ar-Condicionado", icon: "❄️", categoria: "operacional" },
  { id: "pneus", nome: "Pneus", icon: "🛞", categoria: "operacional" },
  { id: "desmanche", nome: "Desmanche", icon: "🚗", categoria: "operacional" },
  { id: "escapamento", nome: "Escapamento", icon: "🪛", categoria: "operacional" },
  { id: "lavajato", nome: "Lava Jato", icon: "🚿", categoria: "operacional" },
  { id: "estetica", nome: "Estética", icon: "✨", categoria: "operacional" },
  // IA
  { id: "copiloto", nome: "Copiloto IA", icon: "👨‍🔧", categoria: "ia" },
  { id: "secretaria", nome: "Secretária IA", icon: "👩‍💼", categoria: "ia" },
  { id: "administrador", nome: "Administrador IA", icon: "👔", categoria: "ia" },
  { id: "contador", nome: "Contador IA", icon: "🧮", categoria: "ia" },
  { id: "mercadolivre", nome: "Mercado Livre", icon: "📦", categoria: "ia" },
  // GESTÃO
  { id: "dashboard", nome: "Visão Geral", icon: "📊", categoria: "gestao" },
  { id: "financeiro", nome: "Financeiro", icon: "💰", categoria: "gestao" },
  { id: "estoque", nome: "Estoque", icon: "📦", categoria: "gestao" },
  { id: "leads", nome: "Leads/Clientes", icon: "👥", categoria: "gestao" },
  { id: "historico", nome: "Histórico", icon: "📋", categoria: "gestao" },
  { id: "tarefa", nome: "Tarefas", icon: "📋", categoria: "gestao" },
  { id: "notafiscal", nome: "Nota Fiscal", icon: "📄", categoria: "gestao" },
  { id: "retorno", nome: "Retorno", icon: "📅", categoria: "gestao" },
  { id: "patrimonio", nome: "Patrimônio", icon: "🏢", categoria: "gestao" },
  { id: "fornecedores", nome: "Fornecedores", icon: "🤝", categoria: "gestao" },
  // SISTEMA
  { id: "meuplano", nome: "Meu Plano", icon: "💰", categoria: "sistema" },
  { id: "config", nome: "Ajustes", icon: "⚙️", categoria: "sistema" },
  { id: "equipe", nome: "Equipe", icon: "👥", categoria: "sistema" },
  { id: "marketing", nome: "Marketing", icon: "📣", categoria: "sistema" },
  { id: "estrategia", nome: "Estratégia", icon: "🚀", categoria: "sistema" },
  { id: "ajuda", nome: "Ajuda", icon: "❓", categoria: "sistema" },
];

export default function MasterPanel() {
  const [activeTab, setActiveTab] = useState("planos");
  const [loading, setLoading] = useState(false);
  const [oficinas, setOficinas] = useState([]);
  const [stats, setStats] = useState({
    faturamentoEstimado: 0,
    totalOS: 0,
    ranking: [],
  });
  const [config, setConfig] = useState({
    videos: {},
    resumos: {},
    modulosBase: ["mecanica", "clientes"],
    modulosFixoIA: ["copiloto", "secretaria", "administrador", "contador"],
    planos: {
      essencial: { preco: 99, slots: 1, func: 3 },
      profissional: { preco: 149, slots: 3, func: 5 },
      especialista: { preco: 249, slots: 5, func: 8 },
      master: { preco: 449, slots: 99, func: 12 },
      planoPrimeIA: { preco: 599, slots: 999, func: 999, desc: 'Todas as funções + Acesso total à Inteligência Artificial (Copiloto, Secretária e Automações)' },
    },
  });

  // CARREGA DO BANCO PRA NÃO PERDER NADA
  useEffect(() => {
    const fetchMaster = async () => {
      const snap = await getDoc(doc(db, "configuracoes_admin", "master"));
      if (snap.exists()) setConfig((prev) => ({ ...prev, ...snap.data() }));
    };
    fetchMaster();
  }, []);

  // REAL-TIME DASHBOARD DATA & OFICINAS
  useEffect(() => {
    const unsubOficinas = onSnapshot(collection(db, "oficinas"), async (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        metrics: {
          osHoje: 0,
          totalOS: 0,
          totalClientes: 0,
          orcamentosAprovados: 0,
          fotosHistorico: 0,
          cliquesWhatsapp: 0,
        },
      }));
      setOficinas(data);

      // Calcular Faturamento Estimado
      let faturamento = 0;
      data.forEach((oficina) => {
        const planoKey = (oficina.plano || "essencial").toLowerCase();
        if (oficina.statusPagamento === "Ativo") {
          faturamento += config.planos[planoKey]?.preco || 0;
        }
      });
      setStats((prev) => ({ ...prev, faturamentoEstimado: faturamento }));

      // Busca KPIs de cada oficina em tempo real
      for (const oficina of data) {
        // Total de OS
        const snapOS = await getDoc(doc(db, "oficinas", oficina.id));
        const totalOS = snapOS.size || 0;
        updateOficinaMetric(oficina.id, "totalOS", totalOS);

        // OS Hoje
        const hoje = new Date().toISOString().split("T")[0];
        const snapOSHoje = await getDocs(
          query(collection(db, "oficinas", oficina.id, "os"), where("data", "==", hoje))
        );
        updateOficinaMetric(oficina.id, "osHoje", snapOSHoje.size);

        // Clientes
        const snapClientes = await getDocs(collection(db, "oficinas", oficina.id, "clientes"));
        updateOficinaMetric(oficina.id, "totalClientes", snapClientes.size);

        // Aprovados
        const snapAprovados = await getDocs(
          query(collection(db, "oficinas", oficina.id, "os"), where("status", "==", "Aprovado"))
        );
        updateOficinaMetric(oficina.id, "orcamentosAprovados", snapAprovados.size);

        // Fotos
        const snapFotos = await getDocs(collection(db, "oficinas", oficina.id, "historico_fotos"));
        updateOficinaMetric(oficina.id, "fotosHistorico", snapFotos.size);

        // WhatsApp
        const snapWA = await getDoc(doc(db, "oficinas", oficina.id, "stats", "whatsapp"));
        updateOficinaMetric(oficina.id, "cliquesWhatsapp", snapWA.data()?.total || 0);
      }
    });

    return () => unsubOficinas();
  }, []);

  const updateOficinaMetric = (id, field, value) => {
    setOficinas((prev) =>
      prev.map((of) => (of.id === id ? { ...of, metrics: { ...of.metrics, [field]: value } } : of))
    );
  };

  // Resumo Global (Ranking e Total OS)
  useEffect(() => {
    const total = oficinas.reduce((acc, of) => acc + (of.metrics?.orcamentosAprovados || 0), 0);
    const sorted = [...oficinas]
      .sort((a, b) => (b.metrics?.osHoje || 0) - (a.metrics?.osHoje || 0))
      .slice(0, 3);

    setStats((prev) => ({ ...prev, totalOS: total, ranking: sorted }));
  }, [oficinas]);

  // SALVA NO BANCO (ISSO ATIVA OS CADEADOS NO APP DO CLIENTE)
  const handleSalvarTudo = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "configuracoes_admin", "master"), config, { merge: true });
      await setDoc(doc(db, "configuracoes_admin", "videos"), { videos: config.videos, resumos: config.resumos }, { merge: true });
      alert("🚀 SISTEMA SINCRONIZADO COM SUCESSO!");
    } catch (error) {
      console.error("Firebase error:", error);
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

      {/* DASHBOARD MASTER SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900 p-8 rounded-[40px] border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
              Faturamento Mensal Estimado
            </p>
            <h2 className="text-3xl font-black text-green-500">
              R$ {stats.faturamentoEstimado.toLocaleString()}
            </h2>
          </div>
          <DollarSign size={40} className="text-zinc-800" />
        </div>

        <div className="bg-zinc-900 p-8 rounded-[40px] border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">
              Total O.S. Processadas (Rede)
            </p>
            <h2 className="text-3xl font-black text-white">{stats.totalOS}</h2>
          </div>
          <Activity size={40} className="text-zinc-800" />
        </div>

        <div className="bg-zinc-900 p-8 rounded-[40px] border border-zinc-800">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <Award size={14} className="text-yellow-500" /> Cases de Sucesso (Top 3)
          </p>
          <div className="space-y-2">
            {stats.ranking.map((of, idx) => (
              <div key={of.id} className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-xl">
                <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">
                  {idx + 1}. {of.nomeOficina || of.id}
                </span>
                <span className="text-[10px] font-black text-red-600">
                  {of.metrics.osHoje} OS/Hoje
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <nav className="relative z-50 flex gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab("planos")}
          className="relative z-50 cursor-pointer px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-500 hover:text-white"
        >
          📦 Planos & Slots
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className="relative z-50 cursor-pointer px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-500 hover:text-white"
        >
          🎥 Vídeos & Resumos
        </button>
        <button
          onClick={() => setActiveTab("oficinas")}
          className="relative z-50 cursor-pointer px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-500 hover:text-white"
        >
          🏢 Base de Oficinas
        </button>
      </nav>
      <div style={{ color: '#888', fontSize: '11px', marginBottom: '10px' }}>Tab ativa: <strong style={{ color: '#ff0033' }}>{activeTab}</strong></div>

      {/* 1. PLANOS, FUNCIONÁRIOS E MÓDULOS BASE */}
      {activeTab === "planos" && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(config.planos).sort(([a], [b]) => (b === 'planoPrimeIA' ? 1 : 0) - (a === 'planoPrimeIA' ? 1 : 0)).map(([p, plano]) => {
              const isPrime = p === 'planoPrimeIA';
              const cor = isPrime ? '#a855f7' : '#ff0033';
              const titulo = isPrime ? '👑 PRIME IA' : p.toUpperCase();
              return (
                <div
                  key={p}
                  className={`p-8 rounded-[55px] transition-all ${isPrime ? 'bg-gradient-to-b from-purple-950/40 to-zinc-900 border-2' : 'bg-zinc-900 border border-zinc-800'} ${isPrime ? 'hover:border-purple-500' : 'hover:border-red-600'}`}
                  style={isPrime ? { borderColor: '#a855f744', boxShadow: '0 0 30px #a855f722' } : {}}
                >
                  <h3 className="text-xl font-black uppercase mb-4 text-center" style={{ color: cor }}>
                    {titulo}
                  </h3>
                  {isPrime && (
                    <div className="text-center mb-6">
                      <span className="inline-block bg-gradient-to-r from-purple-600 to-yellow-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                        👑 RECOMENDADO / PREMIUM
                      </span>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="bg-black/40 p-4 rounded-3xl border border-zinc-800 text-center">
                      <span className="text-[9px] text-zinc-600 font-black block mb-1 uppercase">
                        Preço Mensal (R$)
                      </span>
                      <input
                        type="number"
                        value={plano.preco}
                        className="bg-transparent text-center font-black text-white w-full outline-none"
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            planos: {
                              ...config.planos,
                              [p]: { ...config.planos[p], preco: Number(e.target.value) },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="bg-black/40 p-4 rounded-3xl border border-zinc-800 text-center">
                      <span className="text-[9px] text-zinc-600 font-black block mb-1 uppercase">
                        Abas Extras
                      </span>
                      <input
                        type="number"
                        value={plano.slots}
                        className="bg-transparent text-center font-black text-white w-full outline-none"
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            planos: {
                              ...config.planos,
                              [p]: { ...config.planos[p], slots: Number(e.target.value) },
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
                        value={plano.func}
                        className="bg-transparent text-center font-black text-white w-full outline-none"
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            planos: {
                              ...config.planos,
                              [p]: { ...config.planos[p], func: Number(e.target.value) },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-zinc-900 p-10 rounded-[60px] border border-zinc-800">
            <h3 className="text-sm font-black uppercase mb-2 flex items-center gap-2 text-red-600">
              <Settings size={20} /> Módulos Fixos (Sempre Abertos)
            </h3>
            <p className="text-zinc-600 text-[10px] font-bold mb-8">
              Módulos marcados aqui ficam SEMPRE liberadas para todos os clientes, sem contar no limite de slots.
            </p>
            {["operacional", "ia", "gestao", "sistema"].map((cat) => {
              const mods = LISTA_MESTRA_ABAS.filter((m) => m.categoria === cat);
              const catLabel = { operacional: "⚙️ Operacionais", ia: "🤖 Inteligência Artificial", gestao: "📋 Gestão", sistema: "⚙️ Sistema" }[cat];
              return (
                <div key={cat} className="mb-6">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-3">{catLabel}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {mods.map((cat) => {
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
              );
            })}
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
        <div className="space-y-6 animate-in slide-in-from-bottom-5">
          {/* CABEÇALHO DA TABELA */}
          <div className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-6">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 text-[9px] font-black uppercase text-zinc-500 tracking-widest">OFICINA / DONO</div>
              <div className="col-span-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest text-center">PLANO</div>
              <div className="col-span-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest text-center">STATUS</div>
              <div className="col-span-2 text-[9px] font-black uppercase text-zinc-500 tracking-widest text-center">VENCIMENTO</div>
              <div className="col-span-3 text-[9px] font-black uppercase text-zinc-500 tracking-widest text-center">KPIs</div>
            </div>
          </div>

          {/* LINHAS DAS OFICINAS */}
          {oficinas.length === 0 && (
            <div className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-12 text-center">
              <Globe size={40} className="mx-auto mb-4 text-zinc-800" />
              <p className="text-zinc-600 font-black text-sm">Nenhuma oficina cadastrada</p>
            </div>
          )}

          {oficinas.map((oficina) => (
            <div
              key={oficina.id}
              className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-6 hover:border-red-600/40 transition-all"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* COLUNA 1: Nome + Email */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center border border-red-600/20 flex-shrink-0">
                      <Globe size={14} className="text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase truncate">{oficina.nomeOficina || "Oficina Sem Nome"}</p>
                      <p className="text-[9px] text-zinc-500 truncate">{oficina.emailDono || oficina.email || oficina.id}</p>
                    </div>
                  </div>
                </div>

                {/* COLUNA 2: Plano */}
                <div className="col-span-2 text-center">
                  <span className="bg-zinc-800 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase">
                    {oficina.plano || "Essencial"}
                  </span>
                </div>

                {/* COLUNA 3: Status */}
                <div className="col-span-2 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${oficina.statusPagamento === "Ativo" ? "bg-green-600/20 text-green-400 border border-green-600/30" : "bg-red-600/20 text-red-400 border border-red-600/30"}`}>
                    {oficina.statusPagamento || "Inativo"}
                  </span>
                </div>

                {/* COLUNA 4: Vencimento */}
                <div className="col-span-2 text-center">
                  <span className="text-[10px] font-bold text-zinc-400">
                    {oficina.dataExpiracao || oficina.trialFim || "---"}
                  </span>
                </div>

                {/* COLUNA 5: 5 KPIs */}
                <div className="col-span-3">
                  <div className="grid grid-cols-5 gap-1">
                    <div className="bg-black/50 rounded-lg p-2 text-center border border-zinc-800">
                      <p className="text-[10px] font-black text-blue-400">{oficina.metrics?.osHoje || 0}</p>
                      <p className="text-[7px] text-zinc-600 uppercase">Hoje</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-2 text-center border border-zinc-800">
                      <p className="text-[10px] font-black text-purple-400">{oficina.metrics?.totalOS || 0}</p>
                      <p className="text-[7px] text-zinc-600 uppercase">Total OS</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-2 text-center border border-zinc-800">
                      <p className="text-[10px] font-black text-pink-400">{oficina.metrics?.totalClientes || 0}</p>
                      <p className="text-[7px] text-zinc-600 uppercase">Clientes</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-2 text-center border border-zinc-800">
                      <p className="text-[10px] font-black text-green-400">{oficina.metrics?.orcamentosAprovados || 0}</p>
                      <p className="text-[7px] text-zinc-600 uppercase">Aprovados</p>
                    </div>
                    <div className="bg-black/50 rounded-lg p-2 text-center border border-zinc-800">
                      <p className="text-[10px] font-black text-emerald-400">{oficina.metrics?.cliquesWhatsapp || 0}</p>
                      <p className="text-[7px] text-zinc-600 uppercase">WhatsApp</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
