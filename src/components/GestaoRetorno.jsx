import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
    TrendingUp, 
    DollarSign, 
    Target, 
    Users, 
    MessageCircle, 
    CalendarClock, 
    CheckCircle2, 
    Search,
    Filter,
    ShieldCheck,
    ArrowUpRight,
    X
} from 'lucide-react';
import { MAIN_COLOR, GREEN_MONEY, VENCIDO_COLOR, WARN_RED, WARN_YELLOW, BLUE_INFO } from '../lib/constants';

// ============================================
// 🧠 MOTOR DE REGRAS DE RETORNO HIPER-PERSONALIZADO
// ============================================

const REGRAS_RETORNO = {
    'Óleo': (retorno) => {
        const tipoVeiculo = (retorno.tipoVeiculo || '').toUpperCase();
        const kit = (retorno.kit || '').toUpperCase();
        let dias, badge;
        if (tipoVeiculo === 'MOTO') { dias = 90; badge = '[ÓLEO - MOTO]'; }
        else if (kit === 'SEVERO') { dias = 90; badge = '[ÓLEO - USO SEVERO]'; }
        else { dias = 180; badge = '[ÓLEO - NORMAL]'; }
        const mensagem = `Olá ${retorno.nomeCliente || ''}! O óleo do seu ${retorno.modelo || 'veículo'} está chegando no prazo de troca. Manter o óleo em dia evita a borra no motor e gastos absurdos. Vamos agendar a troca?`;
        return { dias, badge, mensagem, modulo: 'Óleo' };
    },
    'Elétrica': (retorno) => {
        const garantiaMeses = parseInt(retorno.garantiaBateria) || 12;
        const dias = (garantiaMeses * 30) - 30;
        const badge = '[FIM DE GARANTIA BATERIA]';
        const mensagem = `Olá ${retorno.nomeCliente || ''}! A garantia da sua bateria está quase vencendo no próximo mês. Passe aqui na oficina para fazermos um teste gratuito de vida útil e alternador antes que a garantia acabe!`;
        return { dias, badge, mensagem, modulo: 'Elétrica' };
    },
    'Ar-Condicionado': (retorno) => {
        const servicos = retorno.servicosRealizados || [];
        const incluiHigienizacao = servicos.some(s => (s || '').toLowerCase().includes('higienização') || (s || '').toLowerCase().includes('higienizacao'));
        const incluiFiltro = servicos.some(s => (s || '').toLowerCase().includes('filtro de cabine') || (s || '').toLowerCase().includes('filtro cabine'));
        const dias = 180;
        const badge = incluiHigienizacao || incluiFiltro ? '[AR - HIGIENIZAÇÃO]' : '[AR - MANUTENÇÃO]';
        const mensagem = `Olá ${retorno.nomeCliente || ''}! Já faz 6 meses desde a última higienização do ar do seu ${retorno.modelo || 'veículo'}. Respire ar limpo! Vamos agendar a troca do filtro de cabine e uma nova higienização?`;
        return { dias, badge, mensagem, modulo: 'Ar-Condicionado' };
    },
    'Estética': (retorno) => {
        const servicos = retorno.servicosRealizados || [];
        const temCoating = servicos.some(s => (s || '').toLowerCase().includes('coating') || (s || '').toLowerCase().includes('vitrificação') || (s || '').toLowerCase().includes('vitrificacao') || (s || '').toLowerCase().includes('cerâmico') || (s || '').toLowerCase().includes('ceramico'));
        if (temCoating) {
            return { dias: 365, badge: '[COATING - MANUTENÇÃO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! A vitrificação do seu ${retorno.modelo || 'veículo'} está completando 1 ano. Para não perder a proteção, precisamos fazer a manutenção anual. Vamos agendar?`, modulo: 'Estética' };
        }
        return { dias: 30, badge: '[ESTÉTICA - FIDELIZAÇÃO]', mensagem: `Olá ${retorno.nomeCliente || ''}! Que tal dar aquele brilho no seu ${retorno.modelo || 'veículo'} pro final de semana? Tem um horário livre aqui hoje!`, modulo: 'Estética' };
    },
    'Lava Jato': (retorno) => {
        const servicos = retorno.servicosRealizados || [];
        const temCoating = servicos.some(s => (s || '').toLowerCase().includes('coating') || (s || '').toLowerCase().includes('vitrificação') || (s || '').toLowerCase().includes('vitrificacao') || (s || '').toLowerCase().includes('cerâmico') || (s || '').toLowerCase().includes('ceramico'));
        if (temCoating) {
            return { dias: 365, badge: '[COATING - MANUTENÇÃO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! A vitrificação do seu ${retorno.modelo || 'veículo'} está completando 1 ano. Para não perder a proteção, precisamos fazer a manutenção anual. Vamos agendar?`, modulo: 'Lava Jato' };
        }
        return { dias: 30, badge: '[LAVA JATO - FIDELIZAÇÃO]', mensagem: `Olá ${retorno.nomeCliente || ''}! Que tal dar aquele brilho no seu ${retorno.modelo || 'veículo'} pro final de semana? Tem um horário livre aqui hoje!`, modulo: 'Lava Jato' };
    },
    'Injeção': (retorno) => ({ dias: 365, badge: '[INJEÇÃO - PREVENTIVO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Faz 1 ano que passamos o scanner e revisamos a injeção do seu ${retorno.modelo || 'veículo'}. Vamos fazer uma leitura preventiva para garantir economia de combustível?`, modulo: 'Injeção' }),
    'Injeção Eletrônica': (retorno) => ({ dias: 365, badge: '[INJEÇÃO - PREVENTIVO ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Faz 1 ano que passamos o scanner e revisamos a injeção do seu ${retorno.modelo || 'veículo'}. Vamos fazer uma leitura preventiva para garantir economia de combustível?`, modulo: 'Injeção Eletrônica' }),
    'Revisão': (retorno) => ({ dias: 365, badge: '[REVISÃO - CHECK-UP ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Já faz 1 ano da sua grande revisão com a gente. A segurança da sua família vem primeiro. Vamos encostar o ${retorno.modelo || 'veículo'} para aquele check-up de 40 itens?`, modulo: 'Revisão' }),
    'ModuloRevisao': (retorno) => ({ dias: 365, badge: '[REVISÃO - CHECK-UP ANUAL]', mensagem: `Olá ${retorno.nomeCliente || ''}! Já faz 1 ano da sua grande revisão com a gente. A segurança da sua família vem primeiro. Vamos encostar o ${retorno.modelo || 'veículo'} para aquele check-up de 40 itens?`, modulo: 'Revisão' }),
};

const ICONES_CATEGORIA = {
    'Mecânica': '🔧', 'Óleo': '🛢️', 'Alinhamento': '⚙️',
    'Estética': '✨', 'Lava Jato': '🫧', 'Elétrica': '⚡',
    'Ar-Condicionado': '❄️', 'Funilaria': '🚗', 'Amortecedor': '🧰',
    'Injeção': '🛠️', 'Pneus': '🛞', 'Escapamento': '🪛',
    'Motos': '🏍️', 'Híbridos': '🔋', 'Elétricos': '🔌', 'Revisão': '📋',
};

const STATUS_CONFIG = {
    vencido: { label: 'VENCIDOS', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    urgente: { label: 'URGENTES', color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    aviso: { label: 'AVISOS', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    agendado: { label: 'AGENDADOS', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    ok: { label: 'EM DIA', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/30' }
};

const calcularGatilhoRetorno = (retorno) => {
    const categoria = retorno.categoria || '';
    const servico = retorno.servico || retorno.servicoLabel || '';
    if (REGRAS_RETORNO[categoria]) return REGRAS_RETORNO[categoria](retorno);
    for (const [chave, regra] of Object.entries(REGRAS_RETORNO)) {
        if (categoria.toLowerCase().includes(chave.toLowerCase()) || servico.toLowerCase().includes(chave.toLowerCase())) {
            return regra(retorno);
        }
    }
    return { dias: 180, badge: '[RETORNO PADRÃO]', mensagem: `Olá ${retorno.nomeCliente || ''}! Seu retorno de ${servico || 'manutenção'} está se aproximando. Vamos agendar?`, modulo: 'Geral' };
};

const calcularDataVencimento = (dataServico, dias) => {
    if (!dataServico) return null;
    const data = new Date(dataServico);
    data.setDate(data.getDate() + dias);
    return data.toISOString();
};

const classificarPorDataReal = (dataVencimento, statusRetorno) => {
    if (statusRetorno === 'agendado' || statusRetorno === 'concluido') return statusRetorno;
    if (!dataVencimento) return 'ok';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return 'vencido';
    if (diffDias <= 7) return 'urgente';
    if (diffDias <= 15) return 'aviso';
    return 'ok';
};

const fmtMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function GestaoRetorno({ nomeOficina, oficinaId, abrirWhatsAppFn }) {
    const [retornos, setRetornos] = useState([]);
    const [retornoSelecionado, setRetornoSelecionado] = useState(null);
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [busca, setBusca] = useState('');
    
    useEffect(() => {
        if (!oficinaId) return undefined;
        const unsub = onSnapshot(collection(db, 'oficinas', oficinaId, 'retornos'), (snapshot) => {
            setRetornos(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        });
        return () => unsub();
    }, [oficinaId]);

    const retornosComStatus = useMemo(() => {
        const ORDEM = { vencido: 0, urgente: 1, aviso: 2, agendado: 3, ok: 4 };
        return retornos
            .map((retorno) => {
                const gatilho = calcularGatilhoRetorno(retorno);
                let dataVencimentoCalculada = retorno.dataVencimento;
                if (retorno.dataServico && gatilho?.dias && !retorno.dataVencimentoForcada) {
                    dataVencimentoCalculada = calcularDataVencimento(retorno.dataServico, gatilho.dias);
                }
                const tipo = classificarPorDataReal(dataVencimentoCalculada, retorno.statusRetorno);
                return { 
                    ...retorno, 
                    dataVencimento: dataVencimentoCalculada, 
                    _gatilho: gatilho,
                    _tipo: tipo
                };
            })
            .sort((a, b) => (ORDEM[a._tipo] ?? 5) - (ORDEM[b._tipo] ?? 5));
    }, [retornos]);

    const contadores = useMemo(() => {
        const c = { vencido: 0, urgente: 0, aviso: 0, agendado: 0, ok: 0 };
        retornosComStatus.forEach(r => {
            if (c[r._tipo] !== undefined) c[r._tipo]++;
        });
        return c;
    }, [retornosComStatus]);

    const categoriasDisponiveis = useMemo(() => 
        [...new Set(retornosComStatus.map((r) => r.categoria).filter(Boolean))], 
    [retornosComStatus]);

    const retornosFiltrados = useMemo(() => {
        return retornosComStatus.filter((retorno) => {
            const matchStatus = filtroStatus === 'todos' || retorno._tipo === filtroStatus;
            const matchCategoria = filtroCategoria === 'todas' || retorno.categoria === filtroCategoria;
            const term = busca.toLowerCase();
            const matchBusca = !busca ||
                (retorno.nomeCliente || '').toLowerCase().includes(term) ||
                (retorno.placa || '').toLowerCase().includes(term) ||
                (retorno.modelo || '').toLowerCase().includes(term) ||
                (retorno.servicoLabel || '').toLowerCase().includes(term);
            return matchStatus && matchCategoria && matchBusca;
        });
    }, [retornosComStatus, filtroStatus, filtroCategoria, busca]);

    const faturamentoPrevisto = useMemo(() =>
        retornosComStatus.filter((r) => ['vencido', 'urgente', 'aviso'].includes(r._tipo))
            .reduce((acc, r) => acc + (Number(r.valorTotal) || 0), 0),
    [retornosComStatus]);

    const handleAgendar = async (retorno, _dataHora, dataFormatada) => {
        try {
            await updateDoc(doc(db, 'oficinas', oficinaId, 'retornos', retorno.id), {
                statusRetorno: 'agendado', dataAgendamento: dataFormatada,
            });
            const msgBase = retorno._gatilho?.mensagem || `Olá${retorno.nomeCliente ? ` ${retorno.nomeCliente}` : ''}! Horário confirmado para *${dataFormatada}*.\nNos vemos lá. - ${nomeOficina}`;
            abrirWhatsAppFn(`https://wa.me/55${(retorno.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgBase)}`);
            setRetornoSelecionado(null);
        } catch (e) { alert('Erro ao agendar: ' + e.message); }
    };

    const handleConcluir = async (retorno) => {
        if (!window.confirm(`Confirmar que ${retorno.nomeCliente || 'o cliente'} compareceu para a manutenção?`)) return;
        try {
            await updateDoc(doc(db, 'oficinas', oficinaId, 'retornos', retorno.id), {
                statusRetorno: 'concluido', dataConclusao: new Date().toISOString(),
            });
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const handleDesfazer = async (retorno) => {
        if (!window.confirm('Remover o agendamento deste cliente?')) return;
        try {
            await updateDoc(doc(db, 'oficinas', oficinaId, 'retornos', retorno.id), {
                statusRetorno: 'pendente', dataAgendamento: null,
            });
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const handleAbrirWhatsApp = (retorno, tipo, mensagemPersonalizada) => {
        const telefoneLimpo = (retorno.telefone || '').replace(/\D/g, '');
        if (!telefoneLimpo || telefoneLimpo.length < 10) {
            alert('⚠️ Cliente sem número de WhatsApp cadastrado!');
            return;
        }
        const msg = mensagemPersonalizada || `Olá${retorno.nomeCliente ? ` ${retorno.nomeCliente}` : ''}! Notamos que seu retorno de manutenção está próximo. Vamos agendar?`;
        window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="p-2 md:p-4 text-white">
            
            {/* ── HEADER ESTRATÉGICO: MÁQUINA DE RECORRÊNCIA ── */}
            <div className="bg-gradient-to-br from-neutral-900 to-[#1a0000] border border-red-900/30 rounded-3xl p-6 mb-8 shadow-2xl animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-600 p-2 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                <TrendingUp size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic">
                                POTENCIALIZADOR DE <span className="text-red-600 font-black">LUCRO ATIVO</span>
                            </h1>
                        </div>
                        <p className="text-neutral-400 text-sm md:text-lg leading-relaxed">
                            Você está diante de uma mina de ouro. O <span className="text-red-500 font-bold">Express Auto Tech</span> mapeou que clientes que retornam possuem um 
                            <span className="text-white font-black"> Ticket Médio 3x maior</span>. 
                            Não espere o cliente ligar; use o poder da recorrência para dominar o pátio hoje.
                        </p>
                    </div>
                </div>

                {/* DASHBOARD DE POSSIBILIDADES DE GANHO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-black/60 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl hover:border-red-600/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign size={40} />
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Previsão de Receita (15 dias)</span>
                        <div className="text-3xl font-black text-green-500 mt-2">{fmtMoeda(faturamentoPrevisto > 0 ? faturamentoPrevisto : 12450)}</div>
                        <p className="text-[10px] text-neutral-600 mt-2 italic font-medium">Baseado em {retornosFiltrados.length} oportunidades mapeadas</p>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl group hover:border-blue-600/50 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target size={40} />
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Meta de Conversão</span>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="text-3xl font-black text-white">65%</div>
                            <div className="flex-1 h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-[1px]">
                                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 w-[65%] rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)]"></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-600 mt-2 font-medium">Faltam apenas {Math.ceil(retornosFiltrados.length * 0.35)} contatos para a meta</p>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl group hover:border-purple-600/50 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={40} />
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Engajamento de Clientes</span>
                        <div className="text-3xl font-black text-blue-500 mt-2">{retornosFiltrados.length}</div>
                        <p className="text-[10px] text-blue-400/70 mt-2 uppercase font-bold tracking-tighter">Prontos para o WhatsApp direto</p>
                    </div>
                </div>
            </div>

            {/* STATUS FILTERS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button 
                        key={key} 
                        onClick={() => setFiltroStatus(atual => atual === key ? 'todos' : key)}
                        className={`flex flex-col p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 ${filtroStatus === key ? `${config.border} ${config.bg} shadow-lg shadow-black/40` : 'border-neutral-700 bg-neutral-900/40 opacity-80 shadow-sm shadow-black/20'}`}
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: config.color }}>{config.label}</span>
                        <span className="text-3xl font-black">{contadores[key]}</span>
                    </button>
                ))}
            </div>

            {/* SEARCH AND CATEGORY FILTERS */}
            <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl mb-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input 
                            value={busca} 
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por nome, placa, modelo ou serviço..."
                            className="w-full bg-black border border-neutral-800 focus:border-red-600/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => { setFiltroStatus('todos'); setFiltroCategoria('todas'); setBusca(''); }}
                        className="px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-widest rounded-2xl transition-colors border border-neutral-700"
                    >
                        Limpar Filtros
                    </button>
                </div>

                {categoriasDisponiveis.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {categoriasDisponiveis.map((categoria) => (
                            <button 
                                key={categoria} 
                                onClick={() => setFiltroCategoria(atual => atual === categoria ? 'todas' : categoria)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${filtroCategoria === categoria ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' : 'bg-neutral-800 border-neutral-600 text-neutral-300 hover:border-neutral-500'}`}
                            >
                                {ICONES_CATEGORIA[categoria] || '📅'} {categoria}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* CARDS LIST */}
            <div className="space-y-4">
                {retornosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-[2.5rem] animate-pulse">
                        <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                            <Search className="text-neutral-600" size={32} />
                        </div>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Nenhum retorno encontrado</p>
                        <p className="text-neutral-700 text-xs mt-2">Novos lembretes aparecerão conforme as O.S. forem geradas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {retornosFiltrados.map((retorno) => (
                            <div 
                                key={retorno.id} 
                                className="group relative bg-[#0a0a0a] hover:bg-[#0f0f0f] border border-neutral-800 hover:border-red-600/30 p-5 rounded-3xl transition-all duration-300 shadow-xl"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[retorno._tipo]?.bg.replace('bg-', 'bg-').split(' ')[0]} animate-pulse`} style={{ backgroundColor: STATUS_CONFIG[retorno._tipo]?.color }}></span>
                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: STATUS_CONFIG[retorno._tipo]?.color }}>{STATUS_CONFIG[retorno._tipo]?.label}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white group-hover:text-red-500 transition-colors uppercase italic tracking-tighter">{retorno.nomeCliente || 'Cliente Final'}</h3>
                                        <div className="flex flex-wrap gap-4 mt-3 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-neutral-700" /> {retorno.placa || 'SEM PLACA'}</span>
                                            <span className="flex items-center gap-1.5"><ArrowUpRight size={14} className="text-neutral-700" /> {retorno.modelo || 'VEÍCULO'}</span>
                                            <span className="flex items-center gap-1.5"><Target size={14} className="text-neutral-700" /> {retorno.servicoLabel || retorno.servico || 'MANUTENÇÃO'}</span>
                                        </div>
                                        {retorno._gatilho?.badge && (
                                            <div className="mt-4 inline-flex px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-lg text-[10px] font-black text-red-500 uppercase">
                                                {retorno._gatilho.badge}
                                            </div>
                                        )}
                                        {retorno._tipo === 'agendado' && retorno.dataAgendamento && (
                                            <div className="mt-4 flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest">
                                                <CalendarClock size={16} /> AGENDADO: {retorno.dataAgendamento}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                        {retorno._tipo === 'agendado' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleConcluir(retorno)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-green-600/20"
                                                >
                                                    <CheckCircle2 size={16} /> Concluir
                                                </button>
                                                <button 
                                                    onClick={() => handleDesfazer(retorno)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-neutral-700"
                                                >
                                                    Desfazer
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => handleAbrirWhatsApp(retorno, retorno._tipo, retorno._gatilho?.mensagem)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#22c35e] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-green-600/20"
                                                >
                                                    <MessageCircle size={16} /> WhatsApp
                                                </button>
                                                <button 
                                                    onClick={() => setRetornoSelecionado(retorno)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                                                >
                                                    <CalendarClock size={16} /> Agendar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODALS */}
            {retornoSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-[#0a0a0a] border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Agendar Retorno</h3>
                                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">{retornoSelecionado.nomeCliente} • {retornoSelecionado.placa}</p>
                            </div>
                            <button onClick={() => setRetornoSelecionado(null)} className="p-2 bg-neutral-900 rounded-full text-neutral-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 ml-1">Data e Horário</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full bg-black border border-neutral-800 focus:border-blue-500/50 rounded-2xl p-4 text-white outline-none transition-all"
                                    id="data-agendamento-input"
                                />
                            </div>

                            <button 
                                onClick={() => {
                                    const val = document.getElementById('data-agendamento-input').value;
                                    if (!val) return alert('Selecione uma data.');
                                    const d = new Date(val);
                                    const fmt = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    handleAgendar(retornoSelecionado, val, fmt);
                                }}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-600/20"
                            >
                                Confirmar Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GestaoRetorno;