/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useGemini } from './hooks/useGemini';
import { useOficina } from './components/OficinaContext';
import { 
  Users, 
  Sparkles, 
  Zap, 
  Search, 
  Plus, 
  Trash2, 
  MessageSquare, 
  MoreHorizontal, 
  Camera, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PieChart, 
  ArrowRight,
  UserPlus,
  Phone,
  Car,
  AlertCircle,
  Wand2,
  X
} from 'lucide-react';

const COLUNAS = [
  { id: 'novo', titulo: 'NOVO', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: <Zap size={14} /> },
  { id: 'orcamento', titulo: 'ORÇAMENTO', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: <Clock size={14} /> },
  { id: 'agendado', titulo: 'AGENDADO', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Clock size={14} /> },
  { id: 'feito', titulo: 'FEITO', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: <CheckCircle2 size={14} /> }
];

export default function LeadsPage() {
  const { oficinaId } = useOficina();
  const { analyzeImage } = useGemini();
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Estados Form Manual
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [problema, setProblema] = useState('');

  // Estados Form IA
  const [textoIA, setTextoIA] = useState('');
  const [fotoLead, setFotoLead] = useState(null);
  const [processandoIA, setProcessandoIA] = useState(false);

  // ============================================
  // 🎯 NOVOS ESTADOS: MÁQUINA DE RETORNO PREDITIVO
  // ============================================
  const [abaInterna, setAbaInterna] = useState('funil'); // 'funil' | 'retorno'
  const [retornos, setRetornos] = useState([]);
  const [carregandoRetornos, setCarregandoRetornos] = useState(false);
  const [nomeOficina, setNomeOficina] = useState('Oficina');

  const carregarLeads = async () => {
    if (!oficinaId) return;
    setLoading(true);
    try {
      const s = await getDocs(query(collection(db, "oficinas", oficinaId, "leads"), orderBy("data_registro", "desc")));
      setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erro ao carregar leads:", e);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosRetorno = async () => {
    if (!oficinaId) return;
    setCarregandoRetornos(true);
    try {
      // 1. Carrega nome da oficina
      const ofiSnap = await getDocs(query(collection(db, "oficinas")));
      const docOfi = ofiSnap.docs.find(d => d.id === oficinaId);
      if (docOfi) setNomeOficina(docOfi.data().nomeOficina || 'Nossa Oficina');

      // 2. Carrega Retornos Agendados
      const snap = await getDocs(collection(db, "oficinas", oficinaId, "retornos"));
      setRetornos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Erro ao carregar retornos preditivos:", err);
    } finally {
      setCarregandoRetornos(false);
    }
  };

  useEffect(() => {
    if (oficinaId) {
      carregarDadosRetorno();
    }
  }, [oficinaId, abaInterna]);

  useEffect(() => {
    carregarLeads();
  }, [oficinaId]);

  const comprimirFotoLead = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas'); const maxW = 800;
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      }; img.src = base64;
    });
  };

  const handleCapturarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFotoLead(reader.result);
      setFotoLead(comprimida);
    };
    reader.readAsDataURL(file);
  };

  const adicionarLeadManual = async () => {
    if (!nome || !telefone) return alert("Preencha pelo menos Nome e WhatsApp!");
    try {
      await addDoc(collection(db, "oficinas", oficinaId, "leads"), {
        nome,
        telefone: telefone.replace(/\D/g, ''),
        veiculo,
        problema,
        status: 'novo',
        data_registro: new Date()
      });
      setNome(''); setTelefone(''); setVeiculo(''); setProblema('');
      carregarLeads();
    } catch (e) {
      alert("Erro ao adicionar lead.");
    }
  };

  const extrairLeadsIA = async () => {
    if (!textoIA && !fotoLead) return alert("Cole um texto ou adicione uma foto primeiro!");
    setProcessandoIA(true);
    try {
      const prompt = `Extraia nomes, telefones, veículos e problemas dos dados fornecidos. O usuário pode estar colando uma lista de Excel (.xls), texto do Word (.doc), contatos do WhatsApp ou a foto de uma lista/cartão. Retorne APENAS um array JSON puro: [{"nome": "...", "telefone": "...", "veiculo": "...", "problema": "..."}]. Se faltar algum dado, deixe em branco. Texto: ${textoIA}`;
      
      const resposta = await analyzeImage(prompt, fotoLead || null);
      const dadosExtraidos = JSON.parse(resposta.replace(/```json|```/g, ''));

      for (const lead of dadosExtraidos) {
        if (lead.nome || lead.telefone) {
          await addDoc(collection(db, "oficinas", oficinaId, "leads"), {
            nome: lead.nome || 'Cliente Desconhecido',
            telefone: (lead.telefone || '').replace(/\D/g, ''),
            veiculo: lead.veiculo || '',
            problema: lead.problema || 'Extraído via IA',
            status: 'novo',
            data_registro: new Date()
          });
        }
      }

      setTextoIA('');
      setFotoLead(null);
      alert('✅ Leads importados com sucesso!');
      carregarLeads();
    } catch (error) {
      alert('❌ Erro na leitura pela IA. Tente uma imagem mais nítida ou verifique a formatação da sua lista.');
      console.error(error);
    } finally {
      setProcessandoIA(false);
    }
  };

  const mudarStatus = async (leadId, novoStatus) => {
    try {
      await updateDoc(doc(db, "oficinas", oficinaId, "leads", leadId), { status: novoStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: novoStatus } : l));
    } catch (e) {
      alert("Erro ao mover card.");
    }
  };

  const deletarLead = async (leadId) => {
    if(!confirm("Apagar este lead permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "oficinas", oficinaId, "leads", leadId));
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (e) {
      alert("Erro ao apagar.");
    }
  };

  const abrirWhatsApp = (numero) => {
    if(!numero) return;
    window.open(`https://wa.me/55${numero}`, '_blank');
  };

  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => 
      (l.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (l.veiculo || '').toLowerCase().includes(busca.toLowerCase())
    );
  }, [leads, busca]);

  const leadsPorStatus = useMemo(() => {
    const mapa = { novo: [], orcamento: [], agendado: [], feito: [] };
    leadsFiltrados.forEach(l => {
      if (mapa[l.status]) mapa[l.status].push(l);
      else mapa['novo'].push(l);
    });
    return mapa;
  }, [leadsFiltrados]);

  const totalLeads = leads.length;
  const leadsHoje = leads.filter(l => {
    const data = l.data_registro?.toDate ? l.data_registro.toDate() : new Date(l.data_registro);
    return data.toDateString() === new Date().toDateString();
  }).length;
  const concluidos = leads.filter(l => l.status === 'feito').length;
  const taxaConversao = totalLeads > 0 ? ((concluidos / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-violet-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(139,92,246,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
              <Sparkles size={14} />
              CRM & Funil de Vendas Inteligente
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Transforme leads em clientes fiéis.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Acompanhe cada etapa do atendimento, desde o primeiro contato até a entrega final, com inteligência artificial.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight
              label="Leads Hoje"
              value={leadsHoje}
              tone="info"
              helper="Novos contatos"
            />
            <QuickHighlight
              label="Conversão"
              value={`${taxaConversao}%`}
              tone="success"
              helper="Taxa de sucesso"
            />
          </div>
        </div>
      </section>

      {/* AI INTEGRATION MESSAGE */}
      <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 border border-violet-500/20">
          <Zap size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-violet-200">Integração Total com Assistentes IA</h4>
          <p className="text-xs leading-relaxed text-violet-300/80">
            Toda a interação realizada através dos assistentes de IA (botões flutuantes como Copiloto e Secretária) é automaticamente capturada e organizada aqui no seu Funil, garantindo que você nunca perca uma oportunidade de negócio.
          </p>
        </div>
      </div>

      {/* MENU DE NAVEGAÇÃO INTERNA - MÁQUINA DE RETORNO */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-6">
        <button
          onClick={() => setAbaInterna('funil')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            abaInterna === 'funil'
              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users size={16} /> Funil de Vendas (CRM)
        </button>
        <button
          onClick={() => setAbaInterna('retorno')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            abaInterna === 'retorno'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles size={16} /> Máquina de Retorno Preditivo
        </button>
      </div>

      {abaInterna === 'funil' ? (
        <>
          {/* METRIC CARDS GRID */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          title="Total de Leads" 
          value={totalLeads} 
          detail="Oportunidades em aberto" 
          icon={<Users size={20} />} 
          tone="info" 
        />
        <MetricCard 
          title="Agendamentos" 
          value={leads.filter(l => l.status === 'agendado').length} 
          detail="Clientes com data marcada" 
          icon={<Clock size={20} />} 
          tone="warning" 
        />
        <MetricCard 
          title="Conversões" 
          value={concluidos} 
          detail="Atendimentos finalizados" 
          icon={<CheckCircle2 size={20} />} 
          tone="success" 
        />
        <MetricCard 
          title="Taxa de Sucesso" 
          value={`${taxaConversao}%`} 
          detail="Performance do funil" 
          icon={<PieChart size={20} />} 
          tone="info" 
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        
        {/* KANBAN BOARD */}
        <div className="space-y-6 overflow-hidden">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-white">Quadro de Vendas</h3>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                value={busca} 
                onChange={e => setBusca(e.target.value)} 
                placeholder="Localizar lead..." 
                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {COLUNAS.map(coluna => (
              <div key={coluna.id} className="min-w-[280px] flex-1 flex flex-col gap-4">
                <div className={`flex items-center justify-between p-3 rounded-2xl border ${coluna.border} ${coluna.bg}`}>
                  <div className={`flex items-center gap-2 text-[10px] font-black tracking-widest ${coluna.color}`}>
                    {coluna.icon}
                    {coluna.titulo}
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {leadsPorStatus[coluna.id]?.length || 0}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[400px]">
                  {leadsPorStatus[coluna.id]?.map(lead => (
                    <div key={lead.id} className="group relative overflow-hidden rounded-[20px] border border-slate-800 bg-slate-950/80 p-4 transition-all hover:border-violet-500/30 hover:bg-slate-900 shadow-lg shadow-slate-950/30 animate-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => deletarLead(lead.id)} 
                        className="absolute top-3 right-3 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <div className="space-y-3">
                        <div>
                          <strong className="flex items-center flex-wrap gap-2 text-sm font-black text-white">
                            {lead.nome}
                            {(lead.importadoViaIA || lead.origem === 'ia' || lead.problema === 'Extraído via IA') && (
                              <span className="inline-flex items-center gap-1 bg-violet-500/20 text-violet-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-violet-500/30 animate-in fade-in zoom-in duration-300">
                                <Sparkles size={10} /> IA
                              </span>
                            )}
                          </strong>
                          {lead.veiculo && (
                            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                              <Car size={12} className="text-violet-500" />
                              {lead.veiculo}
                            </p>
                          )}
                        </div>

                        {lead.telefone && (
                          <button 
                            onClick={() => abrirWhatsApp(lead.telefone)} 
                            className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <MessageSquare size={14} />
                            {lead.telefone}
                          </button>
                        )}
                        
                        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50 p-3 text-[11px] leading-relaxed text-slate-400 italic">
                          {lead.problema || "Sem detalhes"}
                        </div>

                        <select 
                          value={lead.status}
                          onChange={(e) => mudarStatus(lead.id, e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[10px] font-black text-slate-400 outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                        >
                          {COLUNAS.map(c => (
                            <option key={c.id} value={c.id}>MOVER PARA: {c.titulo}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {leadsPorStatus[coluna.id]?.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 py-10">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR TOOLS */}
        <div className="space-y-6">
          {/* IA IMPORT TOOL */}
          <div className="rounded-[32px] border border-violet-500/20 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 border border-violet-500/20">
                <Wand2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Importação IA</h3>
                <p className="text-[10px] text-slate-500">Cole listas ou tire fotos</p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={textoIA}
                onChange={e => setTextoIA(e.target.value)}
                placeholder="Cole contatos do WhatsApp ou Planilhas..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white outline-none focus:border-violet-500/60 resize-none transition-all placeholder:text-slate-700"
                rows={4}
              />

              <div className="flex gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 p-3 text-[10px] font-black text-slate-500 hover:border-violet-500/40 hover:text-violet-400 cursor-pointer transition-all">
                  <Camera size={14} />
                  FOTOGRAFAR LISTA
                  <input type="file" accept="image/*" capture="environment" onChange={handleCapturarFoto} className="hidden" />
                </label>

                {fotoLead && (
                  <div className="relative w-14 h-14 rounded-xl border border-violet-500/40 overflow-hidden shrink-0 group">
                    <img src={fotoLead} alt="Upload" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFotoLead(null)} 
                      className="absolute inset-0 bg-rose-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={extrairLeadsIA} 
                disabled={processandoIA} 
                className="w-full rounded-2xl bg-violet-500 py-4 font-black text-xs uppercase tracking-widest text-white hover:bg-violet-400 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processandoIA ? '⏳ EXTRAINDO...' : <><Zap size={16} /> Importar com IA</>}
              </button>
            </div>
          </div>

          {/* MANUAL ENTRY TOOL */}
          <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-800">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Novo Lead</h3>
                <p className="text-[10px] text-slate-500">Registro manual rápido</p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Nome" value={nome} onChange={setNome} placeholder="Nome do Cliente" icon={<Users size={14} />} />
              <Field label="WhatsApp" value={telefone} onChange={setTelefone} placeholder="11 99999-9999" icon={<Phone size={14} />} />
              <Field label="Veículo" value={veiculo} onChange={setVeiculo} placeholder="Modelo / Ano" icon={<Car size={14} />} />
              <Field label="Problema" value={problema} onChange={setProblema} placeholder="Motivo do contato" icon={<AlertCircle size={14} />} />
              
              <button 
                onClick={adicionarLeadManual} 
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-4 font-black text-xs uppercase tracking-widest text-slate-400 hover:border-slate-600 hover:text-white transition-all active:scale-[0.98]"
              >
                Cadastrar no Kanban
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
    <RetornoPreditivoDashboard 
          retornos={retornos}
          carregando={carregandoRetornos}
          nomeOficina={nomeOficina}
          onRecarregar={carregarDadosRetorno}
        />
      )}
    </div>
  );
}

// ==============================================
// 🎯 NOVO SUB-COMPONENTE: RETORNO PREDITIVO
// ==============================================
function RetornoPreditivoDashboard({ retornos, carregando, nomeOficina, onRecarregar }) {
  const getDiasRestantes = (dataVencimento) => {
    const agora = new Date();
    const venc = new Date(dataVencimento);
    const diff = venc.getTime() - agora.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const grupos = useMemo(() => {
    const hoje = [];
    const emBreve = [];

    retornos.forEach(r => {
      if (r.statusRetorno === 'concluido') return; // Pula concluídos
      const dias = getDiasRestantes(r.dataVencimento);
      // Classifica como crítico se falta menos de 15 dias para o prazo final (6 meses óleo / 12 meses revisão)
      if (dias <= 15) {
        hoje.push({ ...r, diasRestantes: dias });
      } else if (dias <= 30) {
        emBreve.push({ ...r, diasRestantes: dias });
      }
    });

    const sortFn = (a, b) => a.diasRestantes - b.diasRestantes;
    return {
      hoje: hoje.sort(sortFn),
      emBreve: emBreve.sort(sortFn)
    };
  }, [retornos]);

  const dispararWhatsApp = (retorno) => {
    const nomeClie = retorno.nomeCliente || 'Cliente';
    const veiculo = retorno.modelo || retorno.veiculo || 'Veículo';
    const telefone = (retorno.telefone || '').replace(/\D/g, '');
    
    let texto = '';
    if (String(retorno.servico).toUpperCase().includes('OLEO') || String(retorno.servicoLabel).toLowerCase().includes('óleo')) {
      // Gatilho Exato solicitado pelo Usuário para Óleo:
      texto = `Olá, ${nomeClie}! Aqui é da ${nomeOficina}. O seu ${veiculo} está chegando na quilometragem ideal para a próxima troca de óleo. Manter o óleo em dia economiza até 30% de combustível e evita quebras graves. Vamos reservar um horário para você nesta semana?`;
    } else {
      // Gatilho Exato solicitado pelo Usuário para Revisão Geral:
      texto = `Oi ${nomeClie}, tudo bem? Faz quase um ano que revisamos a segurança do seu ${veiculo}. Para sua tranquilidade em viagens e no dia a dia, gostaria de te convidar para um check-up gratuito de 10 itens. Segurança em primeiro lugar, né? Posso agendar?`;
    }

    if (!telefone) {
      alert("Telefone do cliente não cadastrado no registro desta O.S.!");
      return;
    }

    const telFormatado = telefone.startsWith('55') ? telefone : '55' + telefone;
    window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-emerald-400 bg-slate-950/50 rounded-[32px] border border-slate-900">
        <Clock size={48} className="animate-spin mb-4 opacity-50" />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 animate-pulse">Processando Dados Preditivos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in animate-in zoom-in-95 duration-300">
      {/* BANNER DE INTELIGÊNCIA */}
      <div className="p-8 rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] border border-emerald-500/20 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="max-w-2xl">
          <h3 className="text-emerald-400 font-black text-xl uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={20} /> Cérebro de Vendas Preditivas Ativado
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Antecipe-se à concorrência. O Copiloto analisou o histórico de serviços e mapeou os clientes que precisam retornar (6 meses para troca de óleo e 12 meses para mecânica geral). Utilize os botões para disparar convites magnéticos.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">
            🔥 {grupos.hoje.length} OPORTUNIDADES DE HOJE
          </div>
        </div>
      </div>

      {/* GRID DE LISTAS */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* COLUNA 1: RECUPERAÇÃO CRÍTICA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <AlertCircle size={14} /> 🔥 Para Recuperar Hoje (Janela de 15 Dias)
            </h4>
            <span className="text-[9px] font-bold text-slate-600 uppercase bg-slate-900 border border-slate-800 px-2 py-1 rounded">CRÍTICO</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 styled-scrollbar">
            {grupos.hoje.length === 0 ? (
              <div className="bg-slate-950/50 border-2 border-dashed border-slate-900 p-10 text-center rounded-[32px] text-slate-600 italic text-xs">
                Excelente trabalho! Nenhum retorno crítico pendente para contato no momento.
              </div>
            ) : (
              grupos.hoje.map(r => (
                <div key={r.id} className="bg-gradient-to-br from-slate-900/80 to-slate-950 border-2 border-rose-500/20 p-6 rounded-[32px] hover:border-rose-500/40 transition-all flex flex-col gap-5 relative overflow-hidden group shadow-xl">
                  
                  <div className="absolute top-0 right-0 bg-rose-500/10 px-4 py-1 rounded-bl-2xl border-l border-b border-rose-500/20 text-[9px] font-black text-rose-400 flex items-center gap-1">
                    <Clock size={10} />
                    {r.diasRestantes < 0 ? `EXPIROU HÁ ${Math.abs(r.diasRestantes)} DIAS` : `EXPIRA EM ${r.diasRestantes} DIAS`}
                  </div>

                  <div className="pt-2">
                    <span className="bg-rose-500/10 text-rose-400 text-[9px] font-black px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-wider">
                      {r.servicoLabel || 'Serviço Automotivo'}
                    </span>
                    <h5 className="text-white font-black text-xl mt-4 leading-none">{r.nomeCliente}</h5>
                    <div className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800/50 w-fit">
                      <Car size={12} className="text-slate-500" />
                      <span>{r.modelo || 'Modelo'} • <span className="font-mono uppercase text-slate-300">{r.placa || 'SEM PLACA'}</span></span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Último Registro</p>
                      <p className="text-xs font-black text-slate-400 mt-0.5">{new Date(r.dataBase).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button 
                      onClick={() => dispararWhatsApp(r)}
                      className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 group-hover:scale-[1.02]"
                    >
                      <Zap size={14} fill="currentColor" /> DISPARAR CONVITE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNA 2: EM BREVE */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <Clock size={14} /> ⏳ Monitoramento Próximos 30 Dias
            </h4>
            <span className="text-[9px] font-bold text-slate-600 uppercase bg-slate-900 border border-slate-800 px-2 py-1 rounded">ALERTA</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 styled-scrollbar">
            {grupos.emBreve.length === 0 ? (
              <div className="bg-slate-950/50 border-2 border-dashed border-slate-900 p-10 text-center rounded-[32px] text-slate-600 italic text-xs">
                Sem clientes na janela de aproximação nos próximos 30 dias.
              </div>
            ) : (
              grupos.emBreve.map(r => (
                <div key={r.id} className="bg-slate-950 border border-slate-900 p-6 rounded-[32px] hover:border-amber-500/20 transition-all flex flex-col gap-4 shadow-sm relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                        {r.servicoLabel || 'Revisão'}
                      </span>
                      <h5 className="text-white font-black text-lg mt-3">{r.nomeCliente}</h5>
                      <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5">
                        <Car size={12} />
                        <span>{r.modelo} • <span className="font-mono uppercase">{r.placa}</span></span>
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl text-right min-w-[90px]">
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Ciclo IA</p>
                      <p className="text-sm font-black text-amber-400 mt-0.5">{r.diasRestantes} DIAS</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-900/60 pt-4 flex justify-between items-center mt-2">
                    <div>
                      <p className="text-[8px] text-slate-600 font-black uppercase">Previsão Vencimento</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">{new Date(r.dataVencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button 
                      onClick={() => dispararWhatsApp(r)}
                      className="bg-slate-900 hover:bg-emerald-500 text-slate-400 hover:text-black border border-slate-800 hover:border-emerald-500 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-2 transition-all"
                    >
                      ANTECIPAR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SHARED COMPONENTS

function MetricCard({ title, value, detail, icon, tone }) {
  const tones = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    warning: 'border-amber-300/20 bg-amber-300/10 text-amber-100'
  };

  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-950/90 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-black text-white">{value}</h3>
          <p className="mt-2 text-sm text-slate-400">{detail}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickHighlight({ label, value, helper, tone }) {
  const tones = {
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    info: 'border-violet-400/20 bg-violet-400/10 text-violet-100'
  };

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm opacity-80">{helper}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
        {icon}{label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white outline-none transition focus:border-violet-500/60 placeholder:text-slate-700"
      />
    </label>
  );
}