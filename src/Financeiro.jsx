import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useOficina } from "./components/OficinaContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Minus,
  Calendar,
  Send,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Save,
  Clock,
  Filter
} from 'lucide-react';

export default function Financeiro({ oficinaId: oficinaIdProp, listaFinanceiro, onSalvo }) {
  const { oficinaId: oficinaIdContext } = useOficina() || {};
  const oficinaId = oficinaIdProp || oficinaIdContext;

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [pagamento, setPagamento] = useState('PIX');
  const [tipoTransacao, setTipoTransacao] = useState('entrada');

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Novos Filtros e Provisão
  const [filtroPeriodo, setFiltroPeriodo] = useState('7 Dias');
  const [valorSemanal, setValorSemanal] = useState(1000);
  const [valorQuinzenal, setValorQuinzenal] = useState(2000);

  const carregarDados = useCallback(() => {
    if (!oficinaId) return;
    setCarregando(true);

    const q = query(
      collection(db, "oficinas", oficinaId, "financeiro"),
      orderBy("data", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaTemp = snapshot.docs.map(documento => {
        const transacao = documento.data();
        return { id: documento.id, ...transacao };
      });
      setMovimentacoes(listaTemp);
      setCarregando(false);
    }, (err) => {
      console.error('[Financeiro] Erro no listener:', err);
      setCarregando(false);
    });

    return unsubscribe;
  }, [oficinaId]);

  useEffect(() => {
    const unsubscribe = carregarDados();
    return () => unsubscribe && unsubscribe();
  }, [carregarDados]);

  // Transações normalizadas e ordenadas
  const transacoesEfetivas = useMemo(() => {
    const base = listaFinanceiro && listaFinanceiro.length > 0 ? listaFinanceiro : movimentacoes;
    return base.map(t => {
      let dataTransacao;
      try {
        if (t.data?.toDate) {
          dataTransacao = t.data.toDate();
        } else if (t.data) {
          dataTransacao = new Date(t.data);
        } else {
          dataTransacao = new Date();
        }
      } catch {
        dataTransacao = new Date();
      }
      if (isNaN(dataTransacao.getTime())) dataTransacao = new Date();
      return { ...t, dataTransacao };
    }).sort((a, b) => b.dataTransacao.getTime() - a.dataTransacao.getTime());
  }, [listaFinanceiro, movimentacoes]);

  // Cálculo das datas limite (Período Atual e Período Anterior)
  const bounds = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let inicioAtual = new Date(hoje);
    let inicioAnterior = new Date(hoje);
    let fimAnterior = new Date(hoje);

    if (filtroPeriodo === 'Hoje') {
      inicioAtual.setHours(0, 0, 0, 0);

      inicioAnterior.setDate(inicioAnterior.getDate() - 1);
      inicioAnterior.setHours(0, 0, 0, 0);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
    } else if (filtroPeriodo === '7 Dias') {
      inicioAtual.setDate(inicioAtual.getDate() - 6);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior.setDate(fimAnterior.getDate() - 7);
      inicioAnterior.setDate(inicioAnterior.getDate() - 13);
      inicioAnterior.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === '15 Dias') {
      inicioAtual.setDate(inicioAtual.getDate() - 14);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior.setDate(fimAnterior.getDate() - 15);
      inicioAnterior.setDate(inicioAnterior.getDate() - 29);
      inicioAnterior.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'Mensal') {
      inicioAtual.setDate(1);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior = new Date(inicioAtual);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setDate(1);
      inicioAnterior.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'Anual') {
      inicioAtual.setMonth(0, 1);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior = new Date(inicioAtual);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setMonth(0, 1);
      inicioAnterior.setHours(0, 0, 0, 0);
    }

    return { inicioAtual, fimAtual: hoje, inicioAnterior, fimAnterior };
  }, [filtroPeriodo]);

  // Filtros e Provisões do período ativo
  const filteredData = useMemo(() => {
    const { inicioAtual, fimAtual, inicioAnterior, fimAnterior } = bounds;

    let receitasAtual = 0;
    let despesasAtual = 0;
    let receitasAnterior = 0;
    let despesasAnterior = 0;

    const lancamentosAtual = [];

    transacoesEfetivas.forEach(t => {
      const v = Number(t.valor) || 0;
      const isEntrada = t.tipo !== 'saida';
      const d = t.dataTransacao;

      if (d >= inicioAtual && d <= fimAtual) {
        if (isEntrada) receitasAtual += v;
        else despesasAtual += v;
        lancamentosAtual.push(t);
      } else if (d >= inicioAnterior && d <= fimAnterior) {
        if (isEntrada) receitasAnterior += v;
        else despesasAnterior += v;
      }
    });

    const diffMs = bounds.fimAtual.getTime() - bounds.inicioAtual.getTime();
    const diffDays = Math.max(1, diffMs / (1000 * 60 * 60 * 24));

    let semanasNoPeriodo = diffDays / 7;
    let quinzenasNoPeriodo = diffDays / 15;

    if (filtroPeriodo === 'Mensal') {
      semanasNoPeriodo = 4;
      quinzenasNoPeriodo = 2;
    } else if (filtroPeriodo === 'Anual') {
      semanasNoPeriodo = 52;
      quinzenasNoPeriodo = 24;
    }

    const provisaoFolha = (semanasNoPeriodo * valorSemanal) + (quinzenasNoPeriodo * valorQuinzenal);
    const lucroLiquidoAtual = receitasAtual - despesasAtual;
    const lucroLiquidoAnterior = receitasAnterior - despesasAnterior;

    let projecaoFechamento = receitasAtual;
    if (filtroPeriodo === 'Mensal') {
      const elapsedDays = Math.max(1, new Date().getDate());
      projecaoFechamento = (receitasAtual / elapsedDays) * 30;
    } else if (filtroPeriodo === 'Hoje') {
      projecaoFechamento = receitasAtual * 1.5;
    } else if (filtroPeriodo === '7 Dias') {
      projecaoFechamento = receitasAtual * 1.25;
    } else if (filtroPeriodo === '15 Dias') {
      projecaoFechamento = receitasAtual * 1.15;
    } else if (filtroPeriodo === 'Anual') {
      const elapsedMonths = Math.max(1, new Date().getMonth() + 1);
      projecaoFechamento = (receitasAtual / elapsedMonths) * 12;
    }

    const lucroRealLiquido = projecaoFechamento - despesasAtual - provisaoFolha;

    return {
      receitasAtual,
      despesasAtual,
      receitasAnterior,
      despesasAnterior,
      lucroLiquidoAtual,
      lucroLiquidoAnterior,
      provisaoFolha,
      projecaoFechamento,
      lucroRealLiquido,
      lancamentosAtual,
    };
  }, [transacoesEfetivas, bounds, filtroPeriodo, valorSemanal, valorQuinzenal]);

  // Criação dos dados para o gráfico principal (Realizado vs Projeção)
  const chartData = useMemo(() => {
    const { lancamentosAtual } = filteredData;
    const { fimAtual } = bounds;

    if (filtroPeriodo === 'Hoje') {
      const data = [
        { label: '0h-6h', 'Realizado': 0, 'Projeção': 0 },
        { label: '6h-12h', 'Realizado': 0, 'Projeção': 0 },
        { label: '12h-18h', 'Realizado': 0, 'Projeção': 0 },
        { label: '18h-24h', 'Realizado': 0, 'Projeção': 0 },
      ];

      lancamentosAtual.forEach(t => {
        const h = t.dataTransacao.getHours();
        const v = Number(t.valor) || 0;
        const isEntrada = t.tipo !== 'saida';
        if (isEntrada) {
          const idx = Math.min(3, Math.floor(h / 6));
          data[idx]['Realizado'] += v;
          data[idx]['Projeção'] += v * 1.5;
        }
      });
      return data;
    }

    if (filtroPeriodo === '7 Dias') {
      const daysList = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(fimAtual);
        d.setDate(d.getDate() - i);
        daysList.push({
          label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
          dataStr: d.toLocaleDateString('pt-BR'),
          'Realizado': 0,
          'Projeção': 0,
        });
      }

      lancamentosAtual.forEach(t => {
        const str = t.dataTransacao.toLocaleDateString('pt-BR');
        const idx = daysList.findIndex(x => x.dataStr === str);
        if (idx !== -1) {
          const v = Number(t.valor) || 0;
          const isEntrada = t.tipo !== 'saida';
          if (isEntrada) {
            daysList[idx]['Realizado'] += v;
            daysList[idx]['Projeção'] += v * 1.25;
          }
        }
      });
      return daysList;
    }

    if (filtroPeriodo === '15 Dias') {
      const blocks = [
        { label: 'Dias 1-3', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Dias 4-6', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Dias 7-9', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Dias 10-12', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Dias 13-15', 'Realizado': 0, 'Projeção': 0 },
      ];

      lancamentosAtual.forEach(t => {
        const msDiff = fimAtual.getTime() - t.dataTransacao.getTime();
        const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
        const bIdx = Math.min(4, Math.floor((14 - daysDiff) / 3));
        if (bIdx >= 0 && bIdx <= 4) {
          const v = Number(t.valor) || 0;
          const isEntrada = t.tipo !== 'saida';
          if (isEntrada) {
            blocks[bIdx]['Realizado'] += v;
            blocks[bIdx]['Projeção'] += v * 1.15;
          }
        }
      });
      return blocks;
    }

    if (filtroPeriodo === 'Mensal') {
      const weeks = [
        { label: 'Semana 1', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Semana 2', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Semana 3', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Semana 4+', 'Realizado': 0, 'Projeção': 0 },
      ];

      lancamentosAtual.forEach(t => {
        const day = t.dataTransacao.getDate();
        const wIdx = Math.min(3, Math.floor((day - 1) / 7));
        const v = Number(t.valor) || 0;
        const isEntrada = t.tipo !== 'saida';
        if (isEntrada) {
          weeks[wIdx]['Realizado'] += v;
          weeks[wIdx]['Projeção'] += v * 1.35;
        }
      });
      return weeks;
    }

    if (filtroPeriodo === 'Anual') {
      const months = [
        { label: 'Jan', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Fev', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Mar', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Abr', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Mai', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Jun', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Jul', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Ago', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Set', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Out', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Nov', 'Realizado': 0, 'Projeção': 0 },
        { label: 'Dez', 'Realizado': 0, 'Projeção': 0 },
      ];

      lancamentosAtual.forEach(t => {
        const mIdx = t.dataTransacao.getMonth();
        const v = Number(t.valor) || 0;
        const isEntrada = t.tipo !== 'saida';
        if (isEntrada) {
          months[mIdx]['Realizado'] += v;
          months[mIdx]['Projeção'] += v * 1.25;
        }
      });
      return months;
    }

    return [];
  }, [filteredData, filtroPeriodo, bounds]);

  // Criação dos dados para o gráfico de comparação (Período Atual vs Anterior)
  const comparisonChartData = useMemo(() => {
    const { inicioAnterior, fimAnterior } = bounds;

    const data = chartData.map(cd => ({
      ...cd,
      'Atual': cd['Realizado'],
      'Anterior': 0
    }));

    transacoesEfetivas.forEach(t => {
      const d = t.dataTransacao;
      if (d >= inicioAnterior && d <= fimAnterior) {
        const isEntrada = t.tipo !== 'saida';
        if (isEntrada) {
          const v = Number(t.valor) || 0;
          if (filtroPeriodo === 'Hoje') {
            const h = d.getHours();
            const idx = Math.min(3, Math.floor(h / 6));
            if (data[idx]) data[idx]['Anterior'] += v;
          } else if (filtroPeriodo === '7 Dias') {
            const daysDiff = Math.floor((fimAnterior.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            const idx = Math.min(6, Math.max(0, 6 - daysDiff));
            if (data[idx]) data[idx]['Anterior'] += v;
          } else if (filtroPeriodo === '15 Dias') {
            const daysDiff = Math.floor((fimAnterior.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
            const idx = Math.min(4, Math.floor((14 - daysDiff) / 3));
            if (data[idx]) data[idx]['Anterior'] += v;
          } else if (filtroPeriodo === 'Mensal') {
            const day = d.getDate();
            const idx = Math.min(3, Math.floor((day - 1) / 7));
            if (data[idx]) data[idx]['Anterior'] += v;
          } else if (filtroPeriodo === 'Anual') {
            const mIdx = d.getMonth();
            if (data[mIdx]) data[mIdx]['Anterior'] += v;
          }
        }
      }
    });

    return data;
  }, [chartData, bounds, transacoesEfetivas, filtroPeriodo]);

  const handleAdicionar = async (e) => {
    if (e) e.preventDefault();
    if (!oficinaId) return;
    if (!descricao || !valor) {
      alert("⚠️ Preencha a descrição e o valor!");
      return;
    }
    try {
      const valorNumero = Math.abs(parseFloat(String(valor).replace(',', '.')));
      await addDoc(collection(db, "oficinas", oficinaId, "financeiro"), {
        descricao,
        valor: valorNumero,
        pagamento,
        tipo: tipoTransacao,
        data: new Date().toISOString()
      });
      setDescricao('');
      setValor('');
      setPagamento('PIX');
      if (onSalvo) onSalvo();
    } catch (error) {
      alert("❌ Erro: " + error.message);
    }
  };

  const handleRemover = async (idDaTransacao) => {
    if (!oficinaId) return;
    if (window.confirm("Estornar este lançamento?")) {
      try {
        await deleteDoc(doc(db, "oficinas", oficinaId, "financeiro", idDaTransacao));
        if (onSalvo) onSalvo();
      } catch (error) {
        alert("❌ Erro: " + error.message);
      }
    }
  };

  const enviarRelatorioWhatsApp = () => {
    const msg = `📊 *RESUMO DO CAIXA - OFICINA*\n\nPeríodo: ${filtroPeriodo}\nReceitas: ${formatCurrency(filteredData.receitasAtual)}\nDespesas: ${formatCurrency(filteredData.despesasAtual)}\nSaldo Líquido: ${formatCurrency(filteredData.lucroLiquidoAtual)}\n\n_Gerado automaticamente pelo Express Auto Tech_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">

      {/* HERO & FILTERS SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.15),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(16,185,129,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <Sparkles size={14} />
              Gestão Financeira & Caixa Intelligente
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Seu lucro e despesas no controle absoluto.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Monitore receitas, custos recorrentes de folha e metas baseadas na projeção de fechamento atual.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[320px]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Filtrar Período:</p>
            <div className="flex flex-wrap gap-2">
              {['Hoje', '7 Dias', '15 Dias', 'Mensal', 'Anual'].map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => setFiltroPeriodo(opcao)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${filtroPeriodo === opcao ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROVISION SECTION: PAYROLL COST */}
      <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/80 backdrop-blur p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300 flex items-center gap-2">
              📋 Provisão de Folha de Funcionários
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Ajuste as despesas recorrentes de folha da sua equipe para calcular o Lucro Líquido Real.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Valor Semanal (R$)</span>
              <input
                type="number"
                value={valorSemanal}
                onChange={e => setValorSemanal(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Valor Quinzenal (R$)</span>
              <input
                type="number"
                value={valorQuinzenal}
                onChange={e => setValorQuinzenal(Number(e.target.value))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              />
            </label>
          </div>
        </div>
      </section>

      {/* METRIC CARDS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Receitas no Período"
          value={formatCurrency(filteredData.receitasAtual)}
          detail={`Período anterior: ${formatCurrency(filteredData.receitasAnterior)}`}
          icon={<TrendingUp size={20} />}
          tone="success"
        />
        <MetricCard
          title="Despesas no Período"
          value={formatCurrency(filteredData.despesasAtual)}
          detail={`Período anterior: ${formatCurrency(filteredData.despesasAnterior)}`}
          icon={<TrendingDown size={20} />}
          tone="danger"
        />
        <MetricCard
          title="Provisão de Folha"
          value={formatCurrency(filteredData.provisaoFolha)}
          detail="Cálculo proporcional de pessoal"
          icon={<Calendar size={20} />}
          tone="warning"
        />
        <MetricCard
          title="Lucro Real Líquido"
          value={formatCurrency(filteredData.lucroRealLiquido)}
          detail="Após folha e despesas"
          icon={<Wallet size={20} />}
          tone="info"
        />
      </section>

      {/* CHARTS SECTION */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* CHART 1: REALIZADO VS PROJEÇÃO (NEON GREEN/PURPLE) */}
        <div className="rounded-[26px] border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Entradas & Metas</p>
              <h2 className="mt-1 text-xl font-bold text-white">Realizado vs Projeção ({filtroPeriodo})</h2>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Projeção"
                  fill="url(#colorProjecao)"
                  radius={[8, 8, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="Realizado"
                  fill="url(#colorRealizado)"
                  radius={[8, 8, 0, 0]}
                  barSize={18}
                />
                <defs>
                  <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: COMPARAÇÃO (ATUAL VS ANTERIOR) */}
        <div className="rounded-[26px] border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Comparação de Vendas</p>
              <h2 className="mt-1 text-xl font-bold text-white">Este Período vs Período Anterior</h2>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Atual"
                  fill="url(#colorAtual)"
                  radius={[8, 8, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="Anterior"
                  fill="url(#colorAnterior)"
                  radius={[8, 8, 0, 0]}
                  barSize={18}
                />
                <defs>
                  <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* CREATE TRANSACTION FORM & RECENT HISTORY */}
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* ADD TRANSACTION FORM */}
        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40 h-fit">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Novo Lançamento</p>
            <h2 className="mt-1 text-xl font-bold text-white">Registrar movimentação</h2>
          </div>

          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="flex w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setTipoTransacao('entrada')}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${tipoTransacao === 'entrada' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <Plus size={14} /> ENTRADA
              </button>
              <button
                type="button"
                onClick={() => setTipoTransacao('saida')}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${tipoTransacao === 'saida' ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <Minus size={14} /> DESPESA
              </button>
            </div>

            <Field
              label="Descrição"
              value={descricao}
              onChange={setDescricao}
              placeholder={tipoTransacao === 'entrada' ? "Ex: Venda de Bateria" : "Ex: Conta de Luz"}
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Valor (R$)"
                type="text"
                value={valor}
                onChange={setValor}
                placeholder="0,00"
              />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pagamento</span>
                <select
                  value={pagamento}
                  onChange={e => setPagamento(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </label>
            </div>

            <button className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${tipoTransacao === 'entrada' ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' : 'bg-rose-500 text-white hover:bg-rose-400'}`}>
              <Save size={18} />
              {tipoTransacao === 'entrada' ? 'Lançar Receita' : 'Registrar Gasto'}
            </button>
          </form>
        </div>

        {/* HISTORY LIST */}
        <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 shadow-2xl shadow-slate-950/40 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Histórico Recente</h2>
              <p className="text-sm text-slate-400">Últimas movimentações no período filtrado</p>
            </div>

            <button
              onClick={enviarRelatorioWhatsApp}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
            >
              <Send size={16} />
              Relatório WhatsApp
            </button>
          </div>

          <div className="divide-y divide-slate-800/50 max-h-[460px] overflow-y-auto">
            {filteredData.lancamentosAtual.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500 italic">
                Nenhuma movimentação registrada para este período.
              </div>
            ) : (
              filteredData.lancamentosAtual.map((item) => (
                <div key={item.id} className="group flex items-center justify-between px-6 py-4 transition hover:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.tipo === 'saida' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                      {item.tipo === 'saida' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">{item.descricao}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={10} /> {item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-'}</span>
                        <span className="flex items-center gap-1"><Wallet size={10} /> {item.pagamento || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <p className={`text-lg font-black font-mono ${item.tipo === 'saida' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {item.tipo === 'saida' ? '-' : '+'} {formatCurrency(Number(item.valor))}
                    </p>
                    <button
                      onClick={() => handleRemover(item.id)}
                      className="rounded-xl border border-red-500/10 p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

// SHARED UI COMPONENTS
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

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
      />
    </label>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}