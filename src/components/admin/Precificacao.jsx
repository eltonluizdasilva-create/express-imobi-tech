/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Calculator, 
  DollarSign, 
  Save, 
  TrendingUp, 
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  PieChart, 
  Target, 
  Info, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Wallet,
  Activity,
  ChevronRight,
  Monitor
} from 'lucide-react';

export default function Precificacao({ oficinaId, config, t, verificarLicenca }) {

  // ========== DADOS DE CUSTOS ==========
  const [custos, setCustos] = useState({
    aluguel: '',
    luzAguaNet: '',
    folhaPagamento: '',
    outrosCustos: '',
    horasTrabalhadas: '160'
  });

  // ========== DADOS DE SERVIÇO ==========
  const [servico, setServico] = useState({
    nomeServico: '',
    custoPeca: '',
    margemPeca: '30',
    tempoExecucao: '1',
    taxaImposto: '0'
  });

  // ========== SUGESTÕES INTELIGENTES ==========
  const [servicosSugeridos, setServicaosSugeridos] = useState([
    { id: 'troca-oleo', nome: 'Troca de Óleo', icon: '🛢️', tempo_medio: 1.5, custo_peca_medio: 45, preco_medio: 120 },
    { id: 'troca-filtro', nome: 'Troca de Filtro de Ar', icon: '🌬️', tempo_medio: 0.5, custo_peca_medio: 35, preco_medio: 85 },
    { id: 'balanceamento', nome: 'Balanceamento de Roda', icon: '⚖️', tempo_medio: 1, custo_peca_medio: 0, preco_medio: 60 },
    { id: 'alinhamento', nome: 'Alinhamento de Direção', icon: '📐', tempo_medio: 1.5, custo_peca_medio: 0, preco_medio: 100 },
    { id: 'troca-correia', nome: 'Troca de Correia de Distribuição', icon: '⛓️', tempo_medio: 3, custo_peca_medio: 180, preco_medio: 450 },
    { id: 'troca-pastilha', nome: 'Troca de Pastilha de Freio', icon: '🛑', tempo_medio: 1.5, custo_peca_medio: 95, preco_medio: 250 },
    { id: 'revisao-completa', nome: 'Revisão Completa (10mil km)', icon: '🔧', tempo_medio: 2, custo_peca_medio: 100, preco_medio: 280 },
  ]);

  const [historicoServicos, setHistoricoServicos] = useState({});
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [mostrarSugestao, setMostrarSugestao] = useState(false);

  // ========== ESTADOS DE UI ==========
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [usarSugestaoIA, setUsarSugestaoIA] = useState(false);
  const [precoAjustado, setPrecoAjustado] = useState('');

  // ========== CARREGAMENTO DE DADOS ==========
  useEffect(() => {
    const carregarDados = async () => {
      if (!oficinaId) return;
      try {
        const docRef = doc(db, 'oficinas', oficinaId, 'configuracoes', 'precificacao');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCustos({
            aluguel: String(data.aluguel || ''),
            luzAguaNet: String(data.luzAguaNet || ''),
            folhaPagamento: String(data.folhaPagamento || ''),
            outrosCustos: String(data.outrosCustos || ''),
            horasTrabalhadas: String(data.horasTrabalhadas || '160')
          });
        }
        await carregarHistoricoServicos();
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };
    carregarDados();
  }, [oficinaId]);

  const carregarHistoricoServicos = async () => {
    if (!oficinaId) return;
    try {
      const osRef = collection(db, 'ordensServico');
      const q = query(
        osRef,
        where('oficinaId', '==', oficinaId),
        where('status', '==', 'finalizado')
      );
      const snap = await getDocs(q);

      if (snap.empty) return;

      const grupos = {};
      snap.forEach((docSnap) => {
        const os = docSnap.data();
        const nome = (os.nomeServico || os.setor || os.tipo || 'outros').toLowerCase().trim();

        if (!grupos[nome]) {
          grupos[nome] = { quantidade: 0, somaTempo: 0, somaCustoPeca: 0, somaPrecoCliente: 0 };
        }

        grupos[nome].quantidade += 1;
        grupos[nome].somaTempo += Number(os.tempoExecucao) || 0;
        grupos[nome].somaCustoPeca += Number(os.custoPeca) || 0;
        grupos[nome].somaPrecoCliente += Number(os.precoCliente || os.total || os.valorTotal) || 0;
      });

      const historico = {};
      Object.entries(grupos).forEach(([nome, g]) => {
        const n = g.quantidade;
        historico[nome] = { 
          quantidade: n, 
          tempo_medio: n > 0 ? g.somaTempo / n : 0, 
          custo_peca_medio: n > 0 ? g.somaCustoPeca / n : 0, 
          preco_medio: n > 0 ? g.somaPrecoCliente / n : 0,
          variacao: n >= 15 ? 'baixa' : n >= 6 ? 'média' : 'alta'
        };
      });

      setHistoricoServicos(historico);

      setServicaosSugeridos(prev =>
        prev.map(svc => {
          const chaveReal = Object.keys(historico).find(k =>
            k.includes(svc.nome.toLowerCase().slice(0, 8)) ||
            svc.nome.toLowerCase().includes(k.slice(0, 8))
          );
          if (!chaveReal) return svc;
          const h = historico[chaveReal];
          return {
            ...svc,
            tempo_medio: h.tempo_medio > 0 ? h.tempo_medio : svc.tempo_medio,
            custo_peca_medio: h.custo_peca_medio > 0 ? h.custo_peca_medio : svc.custo_peca_medio,
            preco_medio: h.preco_medio > 0 ? h.preco_medio : svc.preco_medio,
          };
        })
      );
    } catch (err) {
      console.error('[Precificacao] Erro ao carregar histórico:', err);
    }
  };

  // ========== CÁLCULOS PRINCIPAIS ==========
  const custoHoraTecnica = useMemo(() => {
    const totalDespesas = (Number(custos.aluguel) || 0) + (Number(custos.luzAguaNet) || 0) +
      (Number(custos.folhaPagamento) || 0) + (Number(custos.outrosCustos) || 0);
    const horasUteis = Number(custos.horasTrabalhadas) || 160;
    return horasUteis > 0 ? totalDespesas / horasUteis : 0;
  }, [custos]);

  const custoPecaComMargem = useMemo(() => {
    const custo = Number(servico.custoPeca) || 0;
    const margem = Number(servico.margemPeca) || 0;
    return custo * (1 + margem / 100);
  }, [servico]);

  const custoMaoObra = useMemo(() => {
    return custoHoraTecnica * (Number(servico.tempoExecucao) || 0);
  }, [custoHoraTecnica, servico]);

  const custoTotalServico = custoPecaComMargem + custoMaoObra;

  const impostos = useMemo(() => {
    const taxa = Number(servico.taxaImposto) || 0;
    return custoTotalServico * (taxa / 100);
  }, [custoTotalServico, servico]);

  const precoCliente = useMemo(() => {
    if (usarSugestaoIA && precoAjustado) {
      return Number(precoAjustado) || (custoTotalServico + impostos);
    }
    return custoTotalServico + impostos;
  }, [custoTotalServico, impostos, usarSugestaoIA, precoAjustado]);

  const lucroLiquido = useMemo(() => {
    const custoPeca = Number(servico.custoPeca) || 0;
    return precoCliente - custoPeca - custoMaoObra - impostos;
  }, [precoCliente, servico, custoMaoObra, impostos]);

  const percentuais = useMemo(() => {
    if (precoCliente <= 0) return { peca: 0, maoObra: 0, impostos: 0, lucro: 0 };
    return {
      peca: (custoPecaComMargem / precoCliente) * 100,
      maoObra: (custoMaoObra / precoCliente) * 100,
      impostos: (impostos / precoCliente) * 100,
      lucro: (lucroLiquido / precoCliente) * 100
    };
  }, [precoCliente, custoPecaComMargem, custoMaoObra, impostos, lucroLiquido]);

  // ========== SUGESTÃO INTELIGENTE IA ==========
  const sugestaoIA = useMemo(() => {
    if (!servicoSelecionado) return null;
    const historico = historicoServicos[servicoSelecionado.id] || historicoServicos[servicoSelecionado.nome.toLowerCase()];
    if (!historico) return null;

    const tempoSugerido = historico.tempo_medio;
    const custoPecaSugerido = historico.custo_peca_medio;
    const precoSugerido = historico.preco_medio;

    const custoMaoObraSugerida = custoHoraTecnica * tempoSugerido;
    const custoPecaComMargemSugerida = custoPecaSugerido * 1.3;
    const custoTotalSugerido = custoPecaComMargemSugerida + custoMaoObraSugerida;
    const impostosSugeridos = custoTotalSugerido * (Number(servico.taxaImposto) / 100 || 0);
    const precoIASugerido = precoSugerido + impostosSugeridos;

    const lucroSugeridoIA = precoIASugerido - custoPecaSugerido - custoMaoObraSugerida - impostosSugeridos;
    const margemSugeridaIA = (lucroSugeridoIA / precoIASugerido) * 100;

    return {
      tempoSugerido,
      custoPecaSugerido,
      precoSugerido: precoIASugerido,
      margemSugerida: margemSugeridaIA,
      confianca: Math.min((historico.quantidade / 30) * 100, 100),
      serviceCount: historico.quantidade,
      variacao: historico.variacao,
      lucroSugeridoIA
    };
  }, [servicoSelecionado, historicoServicos, custoHoraTecnica, servico.taxaImposto]);

  const saudeLucro = useMemo(() => {
    const margemPercent = percentuais.lucro;
    if (margemPercent >= 20) return { status: 'excelente', cor: '#22c55e', label: 'Excelente', icon: '💎' };
    if (margemPercent >= 15) return { status: 'bom', cor: '#84cc16', label: 'Bom', icon: '✅' };
    if (margemPercent >= 10) return { status: 'atencao', cor: '#f59e0b', label: 'Atenção', icon: '⚠️' };
    if (margemPercent > 0) return { status: 'critico', cor: '#ef4444', label: 'Crítico', icon: '🚨' };
    return { status: 'prejuizo', cor: '#ef4444', label: 'Prejuízo', icon: '💀' };
  }, [percentuais.lucro]);

  const salvarCustos = async () => {
    if (!oficinaId) return;
    setSalvando(true);
    try {
      const docRef = doc(db, 'oficinas', oficinaId, 'configuracoes', 'precificacao');
      await setDoc(docRef, custos);
      setMensagem('Custos operacionais salvos!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setMensagem('Erro ao salvar custos');
    } finally {
      setSalvando(false);
    }
  };

  const aplicarSugestaoIA = () => {
    if (!sugestaoIA) return;
    setServico({
      ...servico,
      custoPeca: String(sugestaoIA.custoPecaSugerido.toFixed(2)),
      tempoExecucao: String(sugestaoIA.tempoSugerido.toFixed(2))
    });
    setPrecoAjustado(String(sugestaoIA.precoSugerido.toFixed(2)));
    setUsarSugestaoIA(true);
    setMostrarSugestao(false);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(245,158,11,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              <Target size={14} />
              Inteligência Financeira 2.0
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl uppercase italic">
              Precificação <span className="text-amber-500 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Inteligente</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Domine suas margens. Calcule o custo real da sua hora técnica e receba sugestões baseadas no histórico da sua oficina.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight
              label="Custo Hora"
              value={formatarMoeda(custoHoraTecnica)}
              tone="info"
              helper="Valor base operacional"
            />
            <QuickHighlight
              label="Eficiência"
              value={`${Math.round(percentuais.lucro)}%`}
              tone={percentuais.lucro > 15 ? 'success' : 'danger'}
              helper="Margem de lucro atual"
            />
          </div>
        </div>
      </section>

      {/* METRIC CARDS */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Despesas" value={formatarMoeda((Number(custos.aluguel) || 0) + (Number(custos.luzAguaNet) || 0) + (Number(custos.folhaPagamento) || 0) + (Number(custos.outrosCustos) || 0))} detail="Custo fixo mensal" icon={<Wallet size={20} />} tone="danger" />
        <MetricCard title="Horas Úteis" value={`${custos.horasTrabalhadas}h`} detail="Capacidade mensal" icon={<Clock size={20} />} tone="info" />
        <MetricCard title="Preço Sugerido" value={formatarMoeda(precoCliente)} detail="Valor final ao cliente" icon={<TrendingUp size={20} />} tone="success" />
        <MetricCard title="Lucro Líquido" value={formatarMoeda(lucroLiquido)} detail="Sobra real no caixa" icon={<DollarSign size={20} />} tone="success" />
      </section>

      {mensagem && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-in fade-in duration-300">
          <CheckCircle2 size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">{mensagem}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* COL 1: OPERATIONAL COSTS */}
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8 flex items-center gap-2">
              <DollarSign size={14} className="text-rose-500" /> Custos Operacionais
            </h4>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Aluguel (R$)" value={custos.aluguel} onChange={v => setCustos({...custos, aluguel: v})} placeholder="3000" icon={<Monitor size={12} />} />
                <Field label="Luz, Água e Net" value={custos.luzAguaNet} onChange={v => setCustos({...custos, luzAguaNet: v})} placeholder="800" icon={<Activity size={12} />} />
                <Field label="Folha Pagamento" value={custos.folhaPagamento} onChange={v => setCustos({...custos, folhaPagamento: v})} placeholder="8000" icon={<Wallet size={12} />} />
                <Field label="Outros Custos" value={custos.outrosCustos} onChange={v => setCustos({...custos, outrosCustos: v})} placeholder="1200" icon={<Info size={12} />} />
              </div>
              <Field label="Horas Trabalhadas/Mês" value={custos.horasTrabalhadas} onChange={v => setCustos({...custos, horasTrabalhadas: v})} placeholder="160" icon={<Clock size={12} />} />
              
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor da Sua Hora Técnica</p>
                <p className="text-3xl font-black text-rose-500">{formatarMoeda(custoHoraTecnica)}</p>
                <p className="text-[10px] text-slate-600 leading-relaxed italic">Base indispensável para garantir que nenhum serviço dê prejuízo.</p>
              </div>

              <button 
                onClick={salvarCustos}
                disabled={salvando}
                className="w-full py-4 bg-slate-800 hover:bg-rose-600 text-rose-500 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-rose-500/20 flex items-center justify-center gap-2"
              >
                {salvando ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                {salvando ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </div>
          </div>
        </div>

        {/* COL 2: SERVICE & IA */}
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> Serviço & IA
            </h4>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2">
                  <Calculator size={12} /> Seleção Inteligente
                </label>
                <select 
                  value={servicoSelecionado?.id || ''}
                  onChange={e => {
                    const sel = servicosSugeridos.find(s => s.id === e.target.value);
                    setServicoSelecionado(sel || null);
                    setMostrarSugestao(!!sel);
                    if (sel) setServico({...servico, nomeServico: sel.nome});
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl outline-none focus:border-amber-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="">-- Selecionar Serviço --</option>
                  {servicosSugeridos.map(s => <option key={s.id} value={s.id}>{s.icon} {s.nome}</option>)}
                </select>
              </div>

              {mostrarSugestao && sugestaoIA && (
                <div className="rounded-3xl border-2 border-amber-500/30 bg-amber-500/5 p-6 space-y-6 shadow-lg shadow-amber-500/5 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Sugestão da IA</p>
                        <p className="text-xs text-slate-400">Baseado em {sugestaoIA.serviceCount} O.S.</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500">
                      {Math.round(sugestaoIA.confianca)}% CONFIANÇA
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Preço Sugerido</p>
                      <p className="text-lg font-black text-amber-400">{formatarMoeda(sugestaoIA.precoSugerido)}</p>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-slate-800">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Margem Projetada</p>
                      <p className="text-lg font-black text-emerald-400">{sugestaoIA.margemSugerida.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={aplicarSugestaoIA} className="flex-1 py-3 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all">Aceitar Sugestão</button>
                    <button onClick={() => setMostrarSugestao(false)} className="px-4 py-3 bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-700">Ignorar</button>
                  </div>
                </div>
              )}

              <Field label="Nome do Serviço" value={servico.nomeServico} onChange={v => setServico({...servico, nomeServico: v})} placeholder="Ex: Troca de Óleo" icon={<ArrowRight size={12} />} />
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Custo Peça (R$)" value={servico.custoPeca} onChange={v => setServico({...servico, custoPeca: v})} placeholder="0.00" icon={<Wallet size={12} />} />
                <Field label="Margem Peça (%)" value={servico.margemPeca} onChange={v => setServico({...servico, margemPeca: v})} placeholder="30" icon={<Percent size={12} />} />
                <Field label="Tempo Execução (h)" value={servico.tempoExecucao} onChange={v => setServico({...servico, tempoExecucao: v})} placeholder="1.0" icon={<Clock size={12} />} />
                <Field label="Impostos (%)" value={servico.taxaImposto} onChange={v => setServico({...servico, taxaImposto: v})} placeholder="0" icon={<Activity size={12} />} />
              </div>
            </div>
          </div>
        </div>

        {/* COL 3: PROFIT ANALYSIS */}
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" /> Análise de Lucro
            </h4>

            <div className="space-y-8">
              <div className={`p-8 rounded-[40px] border-2 bg-gradient-to-br transition-all duration-500 text-center ${saudeLucro.status === 'prejuizo' ? 'border-rose-500/50 from-rose-500/20 to-transparent' : 'border-emerald-500/30 from-emerald-500/10 to-transparent'}`}>
                <div className="text-5xl mb-4 animate-bounce-slow">{saudeLucro.icon}</div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${saudeLucro.status === 'prejuizo' ? 'text-rose-500' : 'text-emerald-500'}`}>Saúde do Lucro: {saudeLucro.label}</p>
                <p className="text-6xl font-black text-white tracking-tighter">{percentuais.lucro.toFixed(1)}<span className="text-2xl text-slate-500">%</span></p>
                <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-bold">Margem Líquida Real</p>
              </div>

              {saudeLucro.status === 'prejuizo' ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-4 items-center">
                  <TrendingDown className="text-rose-500 shrink-0" size={24} />
                  <p className="text-xs text-rose-200 font-bold leading-relaxed">
                    CRÍTICO: Este serviço gera prejuízo. Aumente o preço ou reduza custos imediatamente!
                  </p>
                </div>
              ) : percentuais.lucro < 20 ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex gap-4 items-center">
                  <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                  <p className="text-xs text-amber-200 font-bold leading-relaxed">
                    ATENÇÃO: Sua margem está abaixo da meta de 20%. Verifique seus custos fixos.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex gap-4 items-center">
                  <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
                  <p className="text-xs text-emerald-200 font-bold leading-relaxed">
                    EXCELENTE: Serviço lucrativo e seguro para sua saúde financeira.
                  </p>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><ArrowRight size={12} className="text-rose-500" /> Custo Mão de Obra</span>
                  <span className="text-white font-mono">{formatarMoeda(custoMaoObra)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><ArrowRight size={12} className="text-amber-500" /> Custo Peças (c/ margem)</span>
                  <span className="text-white font-mono">{formatarMoeda(custoPecaComMargem)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-black uppercase tracking-widest flex items-center gap-2"><ArrowRight size={12} className="text-cyan-500" /> Impostos</span>
                  <span className="text-white font-mono">{formatarMoeda(impostos)}</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-white font-black uppercase tracking-widest flex items-center gap-2"><PieChart size={16} className="text-emerald-500" /> Preço Ideal ao Cliente</span>
                  <span className="text-3xl font-black text-emerald-500">{formatarMoeda(precoCliente)}</span>
                </div>
              </div>
            </div>
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
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-100'
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
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
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
      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
        {icon}{label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-4 text-sm text-white outline-none transition focus:border-amber-500/60 placeholder:text-slate-800 font-bold"
      />
    </label>
  );
}
