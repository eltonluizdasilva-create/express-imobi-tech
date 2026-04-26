/* eslint-disable */
import React, { useState, useEffect, useMemo } from "react";
import { db } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  Car, 
  DollarSign, 
  Eye, 
  X, 
  Archive, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  PieChart, 
  ArrowRight,
  TrendingUp,
  MapPin,
  ClipboardList
} from "lucide-react";

export default function Historico({ oficinaId }) {
    const [loading, setLoading] = useState(true);
    const [osList, setOsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOS, setSelectedOS] = useState(null);

    useEffect(() => {
        if (!oficinaId) {
            console.error("oficinaId não fornecido para o Histórico");
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'oficinas', oficinaId, 'os'),
            orderBy('data_atualizacao', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const lista = [];
            snapshot.forEach((doc) => {
                lista.push({ id: doc.id, ...doc.data() });
            });
            setOsList(lista);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar histórico:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [oficinaId]);

    const filteredOS = useMemo(() => {
        return osList.filter(os => {
            const busca = searchTerm.toLowerCase();
            const placa = (os.placa || "").toLowerCase();
            const nome = (os.nomeCliente || "").toLowerCase();
            return placa.includes(busca) || nome.includes(busca);
        });
    }, [osList, searchTerm]);

    const formatarData = (isoString) => {
        if (!isoString) return "--/--/----";
        const data = new Date(isoString);
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatarModulo = (tipo) => {
        const tipos = {
            'mecanica': 'Mecânica Geral',
            'hibrido': 'Híbridos / Elétricos',
            'eletrico': '100% Elétrico',
            'funilaria': 'Funilaria e Pintura',
            'moto': 'Oficina Moto',
            'amortecedor': 'Suspensão e Amortecedor',
            'injecao': 'Injeção Eletrônica',
            'alinhamento': 'Alinhamento',
            'oleo': 'Troca de Óleo',
            'revisao': 'Revisão Geral',
            'ar-condicionado': 'Ar-Condicionado',
            'pneus': 'Pneus e Borracharia',
            'escapamento': 'Escapamento',
            'lavajato': 'Lava Jato e Estética',
            'estetica': 'Estética Avançada'
        };
        return tipos[tipo] || (tipo ? tipo.toUpperCase() : 'TRIAGEM INICIAL');
    };

    const totalFaturamento = useMemo(() => {
        return osList.reduce((acc, os) => {
            const total = Number(os.total || os.totalModulo || os.totalEletrico || os.totalMoto || os.totalAmortecedor || os.totalInjecao || os.totalAlinhamento || os.totalOleo || os.totalRevisao || os.totalAr || os.totalPneus || os.totalEscapamento || os.totalLavaJato || os.totalEstetica || 0);
            return acc + total;
        }, 0);
    }, [osList]);

    const ultimaAtualizacao = useMemo(() => {
        if (osList.length === 0) return '-';
        return formatarData(osList[0].data_atualizacao || osList[0].data_registro);
    }, [osList]);

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
            
            {/* HERO SECTION */}
            <section className="overflow-hidden rounded-[28px] border border-indigo-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(99,102,241,0.35)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
                            <Archive size={14} />
                            Arquivo Digital de O.S.
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl uppercase italic">
                            O histórico da sua oficina, organizado.
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                            Acesse instantaneamente todos os laudos, orçamentos e serviços realizados. Transparência total para você e seu cliente.
                        </p>
                    </div>

                    <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                        <QuickHighlight
                            label="Histórico"
                            value={osList.length}
                            tone="info"
                            helper="Total de registros"
                        />
                        <QuickHighlight
                            label="Faturamento"
                            value={`R$ ${(totalFaturamento / 1000).toFixed(1)}k`}
                            tone="success"
                            helper="Valor arquivado"
                        />
                    </div>
                </div>
            </section>

            {/* METRIC CARDS GRID */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard 
                    title="Total de O.S." 
                    value={osList.length} 
                    detail="Serviços no arquivo digital" 
                    icon={<FileText size={20} />} 
                    tone="info" 
                />
                <MetricCard 
                    title="Faturamento Bruto" 
                    value={`R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    detail="Soma de todos os laudos" 
                    icon={<TrendingUp size={20} />} 
                    tone="success" 
                />
                <MetricCard 
                    title="Último Registro" 
                    value={ultimaAtualizacao} 
                    detail="Data da última atualização" 
                    icon={<Clock size={20} />} 
                    tone="warning" 
                />
                <MetricCard 
                    title="Status de Arquivo" 
                    value="Integrado" 
                    detail="Sincronizado com a nuvem" 
                    icon={<ShieldCheck size={20} />} 
                    tone="info" 
                />
            </section>

            {/* SEARCH BAR AREA */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6 backdrop-blur-xl">
                <div className="relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500" size={24} />
                    <input
                        type="text"
                        placeholder="Digite a PLACA ou NOME do cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 text-slate-100 p-5 pl-16 rounded-2xl outline-none transition-all font-mono text-lg shadow-inner placeholder:text-slate-700"
                    />
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/20 px-8 py-5 rounded-2xl flex flex-col items-center justify-center shrink-0 w-full md:w-auto">
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">Encontrados</span>
                    <span className="text-3xl font-black text-indigo-400 leading-none">{filteredOS.length}</span>
                </div>
            </div>

            {/* LIST AREA */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Carregando Histórico...</p>
                </div>
            ) : filteredOS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-900/20 text-slate-500 text-center px-6">
                    <FileText size={64} className="mb-4 opacity-20" />
                    <h4 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhum registro encontrado</h4>
                    <p className="text-sm mt-2 max-w-sm">O histórico está vazio ou os critérios de busca não retornaram resultados.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredOS.map((os) => (
                        <div key={os.id} className="group relative overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950/80 p-6 transition-all hover:border-indigo-500/40 hover:bg-slate-900 shadow-xl shadow-slate-950/50 animate-in zoom-in-95 duration-200">
                            
                            {/* STATUS BADGE */}
                            {(os.status === 'pago' || os.pago === true) ? (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-lg">
                                    <CheckCircle size={10} /> PAGO
                                </div>
                            ) : (
                                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-lg">
                                    <Clock size={10} /> PENDENTE
                                </div>
                            )}

                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-lg font-black text-white tracking-widest uppercase shadow-inner">
                                        {os.placa || "SEM PLACA"}
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-indigo-500/20 bg-indigo-500/5 text-indigo-400">
                                        {formatarModulo(os.tipoServico)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                        <User size={14} className="text-indigo-500" /> 
                                        <span className="truncate text-slate-200">{os.nomeCliente || "Cliente não informado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                        <Car size={14} className="text-indigo-500/60" /> 
                                        <span className="truncate">{os.modelo || "Veículo não informado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                        <Calendar size={14} className="text-indigo-500/60" /> 
                                        <span>{formatarData(os.data_atualizacao || os.data_registro)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800/50 flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1 text-left">Total do Laudo</p>
                                        <p className="text-xl font-black text-emerald-400">
                                            R$ {(os.total || os.totalModulo || os.totalEletrico || os.totalMoto || os.totalAmortecedor || os.totalInjecao || os.totalAlinhamento || os.totalOleo || os.totalRevisao || os.totalAr || os.totalPneus || os.totalEscapamento || os.totalLavaJato || os.totalEstetica || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedOS(os)}
                                        className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-95"
                                    >
                                        <Eye size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PREMIUM MODAL DETAILS */}
            {selectedOS && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-indigo-500/20 rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_50px_100px_-20px_rgba(99,102,241,0.3)] p-8 relative">
                        <button 
                            onClick={() => setSelectedOS(null)} 
                            className="absolute top-8 right-8 w-12 h-12 bg-slate-800 hover:bg-rose-500 rounded-2xl transition-all text-white flex items-center justify-center shadow-lg border border-slate-700 hover:border-rose-400"
                        >
                            <X size={24} />
                        </button>

                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mb-4">
                                <FileText size={12} />
                                Laudo Finalizado
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Detalhes da O.S.</h2>
                            <p className="text-indigo-400 font-bold text-[10px] tracking-widest uppercase mt-2 opacity-60">Identificador: {selectedOS.id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl shadow-inner">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1.5 opacity-60">Placa do Veículo</span>
                                <span className="text-xl font-black text-white uppercase tracking-widest">{selectedOS.placa || "---"}</span>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl shadow-inner">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1.5 opacity-60">Nome do Cliente</span>
                                <span className="text-xl font-black text-white truncate block">{selectedOS.nomeCliente || "---"}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-[32px] flex items-center justify-between">
                                <div>
                                    <h3 className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-2">Serviço Principal</h3>
                                    <p className="text-2xl font-black text-white leading-none">{formatarModulo(selectedOS.tipoServico)}</p>
                                </div>
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    <Archive size={32} />
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 border border-slate-800 p-6 rounded-[32px]">
                                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">Informações Técnicas</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-center gap-3">
                                        <Car size={18} className="text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-300">{selectedOS.modelo || "---"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar size={18} className="text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-300">{formatarData(selectedOS.data_atualizacao || selectedOS.data_registro)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[40px] text-center shadow-xl shadow-emerald-500/5">
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em] block mb-3">Valor Total Consolidado</span>
                            <span className="text-5xl font-black text-emerald-400 tracking-tighter">
                                R$ {(selectedOS.total || selectedOS.totalModulo || selectedOS.totalEletrico || selectedOS.totalMoto || selectedOS.totalAmortecedor || selectedOS.totalInjecao || selectedOS.totalAlinhamento || selectedOS.totalOleo || selectedOS.totalRevisao || selectedOS.totalAr || selectedOS.totalPneus || selectedOS.totalEscapamento || selectedOS.totalLavaJato || selectedOS.totalEstetica || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        
                        <div className="mt-8 flex justify-center">
                            <button 
                                onClick={() => setSelectedOS(null)}
                                className="px-8 py-4 rounded-2xl bg-slate-800 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95 border border-slate-800"
                            >
                                Fechar Visualização
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// SHARED COMPONENTS

function MetricCard({ title, value, detail, icon, tone }) {
  const tones = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    warning: 'border-indigo-400/20 bg-indigo-400/10 text-indigo-100'
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
    info: 'border-indigo-400/20 bg-indigo-400/10 text-indigo-100'
  };

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm opacity-80">{helper}</p>
    </div>
  );
}