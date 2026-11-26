/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { useGemini } from './hooks/useGemini';
import { useOficina } from './components/OficinaContext';
import { parseMoedaBR } from './hooks/useQuickActions';
import {
  Users,
  Sparkles,
  Zap,
  Search,
  Trash2,
  MessageSquare,
  Camera,
  CheckCircle2,
  Clock,
  PieChart,
  UserPlus,
  Phone,
  Home,
  AlertCircle,
  Wand2,
  X,
  DollarSign,
} from 'lucide-react';

const COLUNAS = [
  { id: 'novo', estagioImobi: 'Novo Lead', titulo: 'NOVO LEAD', icon: <Zap size={14} /> },
  { id: 'orcamento', estagioImobi: 'Qualificado IA', titulo: 'QUALIFICADO / PROPOSTA', icon: <Clock size={14} /> },
  { id: 'agendado', estagioImobi: 'Visita Agendada', titulo: 'VISITA AGENDADA', icon: <Clock size={14} /> },
  { id: 'feito', estagioImobi: 'Proposta / Fechamento', titulo: 'FECHADO / VGV', icon: <CheckCircle2 size={14} /> },
];

const mapearEstagioParaColuna = (lead) => {
  const st = String(lead?.status || '').toLowerCase();
  if (st === 'orcamento' || st === 'agendado' || st === 'feito' || st === 'novo') return st;
  const est = String(lead?.estagio || '').toLowerCase();
  if (est.includes('qualificado')) return 'orcamento';
  if (est.includes('visita')) return 'agendado';
  if (est.includes('proposta') || est.includes('fechamento')) return 'feito';
  return 'novo';
};

export default function LeadsPage({ oficinaId: oficinaIdProp, imobiliariaId: imobiliariaIdProp }) {
  const { oficinaId: oficinaIdContext } = useOficina() || {};
  const oficinaId = useMemo(() => {
    if (imobiliariaIdProp) return imobiliariaIdProp;
    if (oficinaIdProp) return oficinaIdProp;
    if (oficinaIdContext) return oficinaIdContext;
    try {
      return localStorage.getItem('imobiliariaId') || localStorage.getItem('oficinaId') || '';
    } catch {
      return '';
    }
  }, [imobiliariaIdProp, oficinaIdProp, oficinaIdContext]);

  const { analyzeImage } = useGemini();

  const [leadsLegado, setLeadsLegado] = useState([]);
  const [leadsImobi, setLeadsImobi] = useState([]);
  const [busca, setBusca] = useState('');
  const [avisoSucesso, setAvisoSucesso] = useState('');

  // Estados Form Manual (Imobiliário)
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [imovelInteresse, setImovelInteresse] = useState('');
  const [orcamentoInput, setOrcamentoInput] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvandoManual, setSalvandoManual] = useState(false);

  // Estados Form IA
  const [textoIA, setTextoIA] = useState('');
  const [fotoLead, setFotoLead] = useState(null);
  const [processandoIA, setProcessandoIA] = useState(false);

  // Máquina de Reativação Preditiva Imobiliária
  const [abaInterna, setAbaInterna] = useState('funil'); // 'funil' | 'retorno'
  const [retornos, setRetornos] = useState([]);
  const [carregandoRetornos, setCarregandoRetornos] = useState(false);
  const [nomeImobiliaria, setNomeImobiliaria] = useState('Nossa Imobiliária');

  // Sincronização em tempo real com leads_imobi e leads
  useEffect(() => {
    if (!oficinaId) return undefined;

    const unsubImobi = onSnapshot(
      collection(db, 'oficinas', oficinaId, 'leads_imobi'),
      (snap) => {
        setLeadsImobi(
          (snap?.docs || [])?.map((d) => ({
            id: d.id,
            _colecao: 'leads_imobi',
            ...d.data(),
          })) || []
        );
      },
      (err) => console.warn('[LeadsPage] Aviso leads_imobi:', err.message)
    );

    const unsubLeads = onSnapshot(
      collection(db, 'oficinas', oficinaId, 'leads'),
      (snap) => {
        setLeadsLegado(
          (snap?.docs || [])?.map((d) => ({
            id: d.id,
            _colecao: 'leads',
            ...d.data(),
          })) || []
        );
      },
      (err) => console.warn('[LeadsPage] Aviso leads:', err.message)
    );

    return () => {
      unsubImobi();
      unsubLeads();
    };
  }, [oficinaId]);

  // Unifica leads evitando duplicidade por nome+telefone
  const leads = useMemo(() => {
    const combinados = [];
    const chavesVistas = new Set();

    const todos = [...(leadsImobi || []), ...(leadsLegado || [])];
    todos.forEach((item) => {
      const chave = `${String(item?.nome || '').trim().toLowerCase()}_${String(item?.telefone || '').replace(/\D/g, '')}`;
      if (chave !== '_' && chavesVistas.has(chave)) return;
      if (chave !== '_') chavesVistas.add(chave);

      combinados.push({
        ...item,
        status: mapearEstagioParaColuna(item),
        imovelExibicao: item.imovel || item.bairro || item.veiculo || '',
        detalheExibicao:
          item.problema ||
          (item.interesse
            ? `${item.interesse}${item.orcamento ? ` • Orçamento: R$ ${Number(item.orcamento).toLocaleString('pt-BR')}` : ''}`
            : 'Interesse imobiliário'),
      });
    });

    return combinados;
  }, [leadsImobi, leadsLegado]);

  const carregarDadosRetorno = useCallback(async () => {
    if (!oficinaId) return;
    setCarregandoRetornos(true);
    try {
      const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'retornos'));
      setRetornos((snap?.docs || [])?.map((d) => ({ id: d.id, ...d.data() })) || []);
    } catch (err) {
      console.error('Erro ao carregar reativações preditivas:', err);
    } finally {
      setCarregandoRetornos(false);
    }
  }, [oficinaId]);

  useEffect(() => {
    if (oficinaId && abaInterna === 'retorno') {
      carregarDadosRetorno();
    }
  }, [oficinaId, abaInterna, carregarDadosRetorno]);

  const comprimirFotoLead = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = base64;
    });
  };

  const handleCapturarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFotoLead(reader.result);
      setFotoLead(comprimida);
    };
    reader.readAsDataURL(file);
  };

  const adicionarLeadManual = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      alert('Preencha pelo menos o Nome e o WhatsApp do cliente!');
      return;
    }

    setSalvandoManual(true);
    try {
      const telLimpo = telefone.replace(/\D/g, '');
      const orcamentoNum = parseMoedaBR(orcamentoInput);
      const resumoDetalhe =
        observacao.trim() ||
        (imovelInteresse.trim() ? `Interesse em ${imovelInteresse.trim()}` : 'Compra / Locação de Imóvel');

      if (oficinaId) {
        await addDoc(collection(db, 'oficinas', oficinaId, 'leads_imobi'), {
          nome: nome.trim(),
          telefone: telLimpo,
          interesse: /alug|loca/i.test(resumoDetalhe) ? 'Locação' : 'Compra',
          bairro: imovelInteresse.trim() || 'Região Principal',
          imovel: imovelInteresse.trim(),
          orcamento: orcamentoNum,
          problema: resumoDetalhe,
          estagio: 'Novo Lead',
          status: 'novo',
          corretorResponsavel: 'Atendimento Direto',
          origem: 'Cadastro Manual CRM',
          criadoEm: serverTimestamp(),
          data_registro: new Date().toISOString(),
        });
      } else {
        setLeadsImobi((prev) => [
          {
            id: `local_${Date.now()}`,
            _colecao: 'leads_imobi',
            nome: nome.trim(),
            telefone: telLimpo,
            bairro: imovelInteresse.trim(),
            orcamento: orcamentoNum,
            problema: resumoDetalhe,
            estagio: 'Novo Lead',
            status: 'novo',
            data_registro: new Date().toISOString(),
          },
          ...(prev || []),
        ]);
      }

      setNome('');
      setTelefone('');
      setImovelInteresse('');
      setOrcamentoInput('');
      setObservacao('');
      setAvisoSucesso('✅ Lead registado com sucesso no Funil CRM!');
      setTimeout(() => setAvisoSucesso(''), 3500);
    } catch (err) {
      alert('Erro ao adicionar lead: ' + err.message);
    } finally {
      setSalvandoManual(false);
    }
  };

  const extrairLeadsIA = async () => {
    if (!textoIA.trim() && !fotoLead) {
      alert('Cole uma lista de contatos ou adicione uma foto primeiro!');
      return;
    }
    setProcessandoIA(true);
    try {
      const prompt = `Extraia nomes, telefones, imóveis/bairros de interesse e observações dos dados fornecidos para um CRM imobiliário. Retorne APENAS um array JSON puro: [{"nome": "...", "telefone": "...", "imovel": "...", "problema": "..."}]. Texto: ${textoIA}`;

      const resposta = await analyzeImage(prompt, fotoLead || null);
      const dadosExtraidos = JSON.parse(String(resposta || '[]').replace(/```json|```/g, ''));

      for (const lead of dadosExtraidos || []) {
        if (lead?.nome || lead?.telefone) {
          if (oficinaId) {
            await addDoc(collection(db, 'oficinas', oficinaId, 'leads_imobi'), {
              nome: lead.nome || 'Lead Importado IA',
              telefone: String(lead.telefone || '').replace(/\D/g, ''),
              interesse: 'Compra',
              bairro: lead.imovel || lead.veiculo || 'Consultoria IA',
              orcamento: 0,
              problema: lead.problema || 'Importado via IA',
              estagio: 'Novo Lead',
              status: 'novo',
              importadoViaIA: true,
              criadoEm: serverTimestamp(),
              data_registro: new Date().toISOString(),
            });
          }
        }
      }

      setTextoIA('');
      setFotoLead(null);
      setAvisoSucesso('✅ Leads importados com sucesso via IA!');
      setTimeout(() => setAvisoSucesso(''), 3500);
    } catch (error) {
      alert('❌ Não foi possível extrair a lista. Verifique a formatação do texto ou nitidez da imagem.');
      console.error(error);
    } finally {
      setProcessandoIA(false);
    }
  };

  const mudarStatus = async (lead, novoStatus) => {
    const colInfo = COLUNAS.find((c) => c.id === novoStatus);
    const novoEstagioImobi = colInfo?.estagioImobi || 'Novo Lead';
    const colecaoAlvo = lead._colecao || 'leads_imobi';

    if (!oficinaId || String(lead.id).startsWith('local_')) {
      setLeadsImobi((prev) =>
        (prev || [])?.map((l) =>
          l.id === lead.id ? { ...l, status: novoStatus, estagio: novoEstagioImobi } : l
        )
      );
      return;
    }

    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, colecaoAlvo, lead.id), {
        status: novoStatus,
        estagio: novoEstagioImobi,
      });
    } catch (e) {
      alert('Erro ao mover lead no funil: ' + e.message);
    }
  };

  const deletarLead = async (lead) => {
    if (!window.confirm('Apagar este lead permanentemente do CRM?')) return;
    const colecaoAlvo = lead._colecao || 'leads_imobi';

    if (!oficinaId || String(lead.id).startsWith('local_')) {
      setLeadsImobi((prev) => (prev || []).filter((l) => l.id !== lead.id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, colecaoAlvo, lead.id));
    } catch (e) {
      alert('Erro ao apagar lead: ' + e.message);
    }
  };

  const abrirWhatsApp = (numero, nomeLead, interesseLead) => {
    if (!numero) return;
    const limpo = String(numero).replace(/\D/g, '');
    const fone = limpo.startsWith('55') ? limpo : `55${limpo}`;
    const msg = `Olá ${nomeLead || ''}! Tudo bem? Aqui é da imobiliária. Vi seu interesse em ${interesseLead || 'imóveis na região'} e separei excelentes oportunidades para você!`;
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const leadsFiltrados = useMemo(() => {
    const termo = busca.toLowerCase();
    return (leads || []).filter(
      (l) =>
        String(l?.nome || '').toLowerCase().includes(termo) ||
        String(l?.imovelExibicao || '').toLowerCase().includes(termo) ||
        String(l?.telefone || '').includes(termo)
    );
  }, [leads, busca]);

  const leadsPorStatus = useMemo(() => {
    const mapa = { novo: [], orcamento: [], agendado: [], feito: [] };
    (leadsFiltrados || []).forEach((l) => {
      if (mapa[l.status]) mapa[l.status].push(l);
      else mapa.novo.push(l);
    });
    return mapa;
  }, [leadsFiltrados]);

  const totalLeads = (leads || []).length;
  const leadsHoje = (leads || []).filter((l) => {
    const raw = l.criadoEm || l.data_registro;
    if (!raw) return false;
    const data = raw?.toDate ? raw.toDate() : new Date(raw);
    return !isNaN(data.getTime()) && data.toDateString() === new Date().toDateString();
  }).length;
  const concluidos = (leads || []).filter((l) => l.status === 'feito').length;
  const taxaConversao = totalLeads > 0 ? ((concluidos / totalLeads) * 100).toFixed(1) : 0;

  return (
    <div
      style={{ backgroundColor: '#020408' }}
      className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans rounded-3xl"
    >
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-[#10b981]/30 bg-slate-900/90 p-6 shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#10b981]">
              <Sparkles size={14} />
              CRM Imobiliário & Funil de Vendas Inteligente
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Transforme leads em <span className="text-[#10b981]">visitas e escrituras assinadas</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Acompanhe cada comprador, locatário ou proprietário desde o primeiro contato no WhatsApp ou Simulador até o fechamento do VGV.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight label="Leads Hoje" value={leadsHoje} helper="Novos interessados" />
            <QuickHighlight label="Conversão" value={`${taxaConversao}%`} helper="Propostas fechadas" />
          </div>
        </div>
      </section>

      {/* MENU DE NAVEGAÇÃO INTERNA */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setAbaInterna('funil')}
          style={abaInterna === 'funil' ? { backgroundColor: '#10b981' } : undefined}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            abaInterna === 'funil'
              ? 'text-slate-950 shadow-lg shadow-[#10b981]/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users size={16} /> Funil de Leads (CRM Kanban)
        </button>
        <button
          type="button"
          onClick={() => setAbaInterna('retorno')}
          style={abaInterna === 'retorno' ? { backgroundColor: '#10b981' } : undefined}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
            abaInterna === 'retorno'
              ? 'text-slate-950 shadow-lg shadow-[#10b981]/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles size={16} /> Reativação de Leads & Renovações
        </button>
      </div>

      {avisoSucesso && (
        <div className="rounded-xl border border-[#10b981] bg-[#10b981]/15 px-4 py-3 text-xs font-bold text-[#10b981]">
          {avisoSucesso}
        </div>
      )}

      {abaInterna === 'funil' ? (
        <>
          {/* METRIC CARDS GRID */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total de Leads"
              value={totalLeads}
              detail="Oportunidades no CRM"
              icon={<Users size={20} />}
            />
            <MetricCard
              title="Visitas Agendadas"
              value={(leads || []).filter((l) => l.status === 'agendado').length}
              detail="Clientes com visita marcada"
              icon={<Clock size={20} />}
            />
            <MetricCard
              title="Negócios Fechados"
              value={concluidos}
              detail="Vendas e locações concluídas"
              icon={<CheckCircle2 size={20} />}
            />
            <MetricCard
              title="Taxa de Conversão"
              value={`${taxaConversao}%`}
              detail="Performance do funil"
              icon={<PieChart size={20} />}
            />
          </section>

          <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
            {/* KANBAN BOARD */}
            <div className="space-y-6 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <h3 className="text-xl font-black text-white">Quadro de Negócios Imobiliários</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, bairro ou WhatsApp..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                {(COLUNAS || [])?.map((coluna) => (
                  <div key={coluna.id} className="min-w-[270px] flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-[#10b981]/30 bg-slate-900">
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#10b981]">
                        {coluna.icon}
                        {coluna.titulo}
                      </div>
                      <span
                        style={{ backgroundColor: '#10b981' }}
                        className="text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full"
                      >
                        {leadsPorStatus[coluna.id]?.length || 0}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 min-h-[380px]">
                      {(leadsPorStatus[coluna.id] || [])?.map((lead) => (
                        <div
                          key={lead.id}
                          className="group relative overflow-hidden rounded-[20px] border border-slate-800 bg-slate-900/90 p-4 transition-all hover:border-[#10b981] shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={() => deletarLead(lead)}
                            className="absolute top-3 right-3 text-slate-500 hover:text-emerald-400 cursor-pointer"
                            title="Excluir lead"
                          >
                            <Trash2 size={14} />
                          </button>

                          <div className="space-y-2.5">
                            <div>
                              <strong className="flex items-center flex-wrap gap-2 text-sm font-black text-white pr-5">
                                {lead.nome}
                                {(lead.importadoViaIA || lead.origem?.includes('IA')) && (
                                  <span className="inline-flex items-center gap-1 bg-[#10b981]/15 text-[#10b981] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#10b981]/30">
                                    <Sparkles size={10} /> IA
                                  </span>
                                )}
                              </strong>
                              {lead.imovelExibicao && (
                                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300 font-bold">
                                  <Home size={12} className="text-[#10b981]" />
                                  {lead.imovelExibicao}
                                </p>
                              )}
                            </div>

                            {lead.telefone && (
                              <button
                                type="button"
                                onClick={() => abrirWhatsApp(lead.telefone, lead.nome, lead.imovelExibicao)}
                                className="flex items-center gap-1.5 text-xs font-black text-[#10b981] hover:underline cursor-pointer"
                              >
                                <MessageSquare size={13} />
                                {lead.telefone}
                              </button>
                            )}

                            <div className="rounded-xl border border-slate-800 bg-[#020408] p-2.5 text-[11px] leading-relaxed text-slate-300">
                              {lead.detalheExibicao}
                            </div>

                            <select
                              value={lead.status}
                              onChange={(e) => mudarStatus(lead, e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-[#020408] px-3 py-2 text-[10px] font-black text-[#10b981] outline-none cursor-pointer hover:border-[#10b981]"
                            >
                              {(COLUNAS || [])?.map((c) => (
                                <option key={c.id} value={c.id}>
                                  ETAPA: {c.titulo}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}

                      {(leadsPorStatus[coluna.id] || []).length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 py-10">
                          Sem leads nesta etapa
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SIDEBAR TOOLS: NOVO LEAD MANUAL + IMPORTAÇÃO IA */}
            <div className="space-y-6">
              {/* MANUAL ENTRY TOOL (Placed first for immediate access) */}
              <form
                onSubmit={adicionarLeadManual}
                className="rounded-[28px] border border-[#10b981]/40 bg-slate-900/90 p-6 shadow-2xl"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    style={{ backgroundColor: '#10b981' }}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950"
                  >
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Cadastrar Novo Lead
                    </h3>
                    <p className="text-[11px] text-slate-400">Entrada imediata no Funil CRM & VGV</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <Field
                    label="Nome do Cliente *"
                    value={nome}
                    onChange={setNome}
                    placeholder="Ex: Rodrigo Almeida"
                    icon={<Users size={13} className="text-[#10b981]" />}
                  />
                  <Field
                    label="WhatsApp com DDD *"
                    value={telefone}
                    onChange={setTelefone}
                    placeholder="Ex: 11 99999-8888"
                    icon={<Phone size={13} className="text-[#10b981]" />}
                  />
                  <Field
                    label="Imóvel / Bairro de Interesse"
                    value={imovelInteresse}
                    onChange={setImovelInteresse}
                    placeholder="Ex: Apto 3 Quartos — Jardins"
                    icon={<Home size={13} className="text-[#10b981]" />}
                  />
                  <Field
                    label="Orçamento Estimado (R$)"
                    value={orcamentoInput}
                    onChange={setOrcamentoInput}
                    placeholder="Ex: 650.000"
                    icon={<DollarSign size={13} className="text-[#10b981]" />}
                  />
                  <Field
                    label="Finalidade / Observações"
                    value={observacao}
                    onChange={setObservacao}
                    placeholder="Ex: Compra com FGTS / Visita sábado"
                    icon={<AlertCircle size={13} className="text-[#10b981]" />}
                  />

                  <button
                    type="submit"
                    disabled={salvandoManual}
                    style={{ backgroundColor: '#10b981' }}
                    className="w-full rounded-2xl py-4 font-black text-xs uppercase tracking-widest text-slate-950 hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#10b981]/25"
                  >
                    {salvandoManual ? 'CADASTRANDO...' : '+ CADASTRAR LEAD NO CRM'}
                  </button>
                </div>
              </form>

              {/* IA IMPORT TOOL */}
              <div className="rounded-[28px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#10b981]/15 rounded-2xl flex items-center justify-center text-[#10b981] border border-[#10b981]/30">
                    <Wand2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Importação de Lista com IA
                    </h3>
                    <p className="text-[11px] text-slate-400">Cole contatos do WhatsApp ou planilhas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={textoIA}
                    onChange={(e) => setTextoIA(e.target.value)}
                    placeholder="Cole aqui nomes, telefones e interesse dos leads..."
                    className="w-full rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3 text-xs text-white outline-none focus:border-[#10b981] resize-none"
                    rows={3}
                  />

                  <div className="flex gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-[#020408] p-3 text-[10px] font-black text-slate-300 hover:border-[#10b981] hover:text-[#10b981] cursor-pointer transition-all">
                      <Camera size={14} />
                      FOTOGRAFAR FICHA / LISTA
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCapturarFoto}
                        className="hidden"
                      />
                    </label>

                    {fotoLead && (
                      <div className="relative w-14 h-14 rounded-xl border border-[#10b981] overflow-hidden shrink-0 group">
                        <img src={fotoLead} alt="Upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFotoLead(null)}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={extrairLeadsIA}
                    disabled={processandoIA}
                    className="w-full rounded-2xl bg-[#020408] border border-[#10b981] py-3.5 font-black text-xs uppercase tracking-widest text-[#10b981] hover:bg-[#10b981] hover:text-slate-950 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processandoIA ? '⏳ EXTRAINDO LEADS...' : <><Zap size={15} /> Importar Contatos com IA</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <RetornoPreditivoImobiDashboard
          retornos={retornos}
          leads={leads}
          carregando={carregandoRetornos}
          nomeImobiliaria={nomeImobiliaria}
        />
      )}
    </div>
  );
}

function RetornoPreditivoImobiDashboard({ retornos, leads = [], carregando, nomeImobiliaria }) {
  const oportunidadesReativacao = useMemo(() => {
    const listaBase = Array.isArray(retornos) && retornos.length > 0 ? retornos : leads;
    return (listaBase || []).slice(0, 12)?.map((item, idx) => ({
      id: item.id || `ret_${idx}`,
      nomeCliente: item.nomeCliente || item.nome || 'Cliente Imobiliário',
      imovel: item.imovel || item.bairro || item.imovelExibicao || 'Carteira Selecionada',
      telefone: item.telefone || '',
      motivo: item.servicoLabel || 'Oportunidade de Visita / Condição Especial de Financiamento',
    }));
  }, [retornos, leads]);

  const dispararConviteImobi = (item) => {
    const telefone = String(item.telefone || '').replace(/\D/g, '');
    if (!telefone) {
      alert('Telefone do cliente não informado neste registo.');
      return;
    }
    const texto = `Olá, ${item.nomeCliente}! Aqui é da ${nomeImobiliaria}. Entrou uma nova oportunidade excelente na região (${item.imovel}) com condições diferenciadas de negociação. Gostaria de receber as fotos e agendar uma visita rápida esta semana?`;
    const telFormatado = telefone.startsWith('55') ? telefone : '55' + telefone;
    window.open(`https://wa.me/${telFormatado}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#10b981] bg-slate-900/60 rounded-[32px] border border-slate-800">
        <Clock size={42} className="animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">
          Analisando Base de Leads e Contratos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-[28px] bg-slate-900 border border-[#10b981]/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="max-w-2xl">
          <h3 className="text-[#10b981] font-black text-lg uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={18} /> Reativação Inteligente de Base & Renovações
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Recupere leads que consultaram financiamento ou visitaram imóveis e envie novas oportunidades em 1 clique no WhatsApp.
          </p>
        </div>
        <div className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-4 py-2.5 rounded-xl text-xs font-black uppercase">
          🔥 {(oportunidadesReativacao || []).length} Oportunidades Mapeadas
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(oportunidadesReativacao || [])?.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 hover:border-[#10b981] p-5 rounded-2xl flex flex-col justify-between gap-4 transition"
          >
            <div>
              <span className="bg-[#10b981]/15 text-[#10b981] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                {item.motivo}
              </span>
              <h4 className="text-white font-black text-base mt-3">{item.nomeCliente}</h4>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Home size={13} className="text-[#10b981]" /> {item.imovel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispararConviteImobi(item)}
              style={{ backgroundColor: '#10b981' }}
              className="w-full py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer"
            >
              <Zap size={14} /> Disparar Oportunidade no WhatsApp
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail, icon }) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <h3 style={{ color: '#10b981' }} className="mt-3 text-2xl font-black">
            {value}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{detail}</p>
        </div>
        <div className="rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 p-3 text-[#10b981]">{icon}</div>
      </div>
    </div>
  );
}

function QuickHighlight({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-[#10b981]/30 bg-[#020408] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#10b981]">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-[#020408] px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#10b981]"
      />
    </label>
  );
}
