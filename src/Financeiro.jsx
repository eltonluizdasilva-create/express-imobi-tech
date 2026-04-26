import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useOficina } from "./components/OficinaContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, CartesianGrid } from 'recharts';
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
  Clock
} from 'lucide-react';

export default function Financeiro({ oficinaId: oficinaIdProp, onSalvo }) {
  const { oficinaId: oficinaIdContext } = useOficina() || {};
  const oficinaId = oficinaIdProp || oficinaIdContext;

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [pagamento, setPagamento] = useState('PIX / Dinheiro');
  const [tipoTransacao, setTipoTransacao] = useState('entrada');

  const [totalHoje, setTotalHoje] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [totalEntradasMes, setTotalEntradasMes] = useState(0);
  const [totalSaidasMes, setTotalSaidasMes] = useState(0);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregarDados = useCallback(() => {
    if (!oficinaId) return;
    setCarregando(true);

    const q = query(
      collection(db, "oficinas", oficinaId, "financeiro"), 
      orderBy("data", "desc")
    );

    // Using onSnapshot for real-time updates like in Estoque
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaTemp = snapshot.docs.map(documento => {
        const transacao = documento.data();
        let dataTransacao;
        try {
          if (transacao.data?.toDate) {
            dataTransacao = transacao.data.toDate();
          } else if (transacao.data) {
            dataTransacao = new Date(transacao.data);
          } else {
            dataTransacao = new Date();
          }
        } catch { dataTransacao = new Date(); }

        if (isNaN(dataTransacao.getTime())) dataTransacao = new Date();
        return { id: documento.id, ...transacao, dataTransacao };
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

  useEffect(() => {
    let somaHoje = 0;
    let somaMes = 0;
    let entradasMes = 0;
    let saidasMes = 0;
    const hoje = new Date();

    const ultimos7Dias = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        diaTexto: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dataComparacao: d.toLocaleDateString('pt-BR'),
        Entradas: 0,
        Saídas: 0
      };
    }).reverse();

    movimentacoes.forEach((transacao) => {
      const valorTransacao = Math.abs(Number(transacao.valor) || 0);
      const ehEntrada = transacao.tipo !== 'saida';
      const multiplicador = ehEntrada ? 1 : -1;
      const dataTransacao = transacao.dataTransacao;

      if (valorTransacao < 1000000) {
        if (dataTransacao && dataTransacao.getMonth() === hoje.getMonth() && dataTransacao.getFullYear() === hoje.getFullYear()) {
          somaMes += (valorTransacao * multiplicador);
          if (ehEntrada) entradasMes += valorTransacao;
          else saidasMes += valorTransacao;
        }
        if (dataTransacao && dataTransacao.toLocaleDateString('pt-BR') === hoje.toLocaleDateString('pt-BR')) {
          somaHoje += (valorTransacao * multiplicador);
        }
        const diaIndex = ultimos7Dias.findIndex(d => d.dataComparacao === (dataTransacao ? dataTransacao.toLocaleDateString('pt-BR') : ''));
        if (diaIndex !== -1) {
          if (ehEntrada) ultimos7Dias[diaIndex].Entradas += valorTransacao;
          else ultimos7Dias[diaIndex].Saídas += valorTransacao;
        }
      }
    });

    setTotalHoje(somaHoje);
    setTotalMes(somaMes);
    setTotalEntradasMes(entradasMes);
    setTotalSaidasMes(saidasMes);
    setDadosGrafico(ultimos7Dias);
  }, [movimentacoes]);

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
      setPagamento('PIX / Dinheiro');
    } catch (error) {
      alert("❌ Erro: " + error.message);
    }
  };

  const handleRemover = async (idDaTransacao) => {
    if (!oficinaId) return;
    if (window.confirm("Estornar este lançamento?")) {
      try {
        await deleteDoc(doc(db, "oficinas", oficinaId, "financeiro", idDaTransacao));
      } catch (error) {
        alert("❌ Erro: " + error.message);
      }
    }
  };

  const enviarRelatorioWhatsApp = () => {
    const mensagem = `📊 *RESUMO DO CAIXA - OFICINA*\n\n📅 Hoje: R$ ${totalHoje.toFixed(2).replace('.', ',')}\n🗓️ Mês Atual: R$ ${totalMes.toFixed(2).replace('.', ',')}\n\n_Gerado automaticamente pelo Oficina IA_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.15),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(16,185,129,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <Sparkles size={14} />
              Gestão Financeira em Tempo Real
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Sua saúde financeira com clareza, lucro e controle absoluto.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Acompanhe entradas, despesas e lucro líquido num painel inteligente interligado com toda a operação da sua oficina.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight
              label="Caixa Hoje"
              value={formatCurrency(totalHoje)}
              tone={totalHoje >= 0 ? "success" : "danger"}
              helper="Saldo das últimas 24h"
            />
            <QuickHighlight
              label="Lucro do Mês"
              value={formatCurrency(totalMes)}
              tone={totalMes >= 0 ? "info" : "danger"}
              helper="Resultado consolidado"
            />
          </div>
        </div>
      </section>

      {/* METRIC CARDS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          title="Entradas (Mês)" 
          value={formatCurrency(totalEntradasMes)} 
          detail="Total bruto recebido" 
          icon={<TrendingUp size={20} />} 
          tone="success" 
        />
        <MetricCard 
          title="Saídas (Mês)" 
          value={formatCurrency(totalSaidasMes)} 
          detail="Despesas e custos" 
          icon={<TrendingDown size={20} />} 
          tone="danger" 
        />
        <MetricCard 
          title="Saldo Atual" 
          value={formatCurrency(totalMes)} 
          detail="Lucro líquido acumulado" 
          icon={<Wallet size={20} />} 
          tone="info" 
        />
        <MetricCard 
          title="Previsão Próximos 7d" 
          value={formatCurrency(totalHoje * 7)} 
          detail="Estimativa baseada em hoje" 
          icon={<ArrowUpRight size={20} />} 
          tone="warning" 
        />
      </section>

      {/* CHART & FORM SECTION */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* CHART */}
        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Fluxo de Caixa</p>
              <h2 className="mt-1 text-xl font-bold text-white">Últimos 7 dias de operação</h2>
            </div>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              Atualizado agora
            </span>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="diaTexto" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: '16px', 
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="Entradas" 
                  fill="url(#colorEntrada)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={20}
                />
                <Bar 
                  dataKey="Saídas" 
                  fill="url(#colorSaida)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={20}
                />
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ADD TRANSACTION FORM */}
        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Novo Lançamento</p>
            <h2 className="mt-1 text-xl font-bold text-white">Registrar movimentação</h2>
          </div>
          
          <form onSubmit={handleAdicionar} className="space-y-4">
            {/* Toggle Entrada/Saída */}
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
                type="number"
                value={valor}
                onChange={setValor}
                placeholder="0,00"
              />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pagamento</span>
                <select
                  value={pagamento}
                  onChange={e => setPagamento(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 appearance-none"
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
      </section>

      {/* HISTORY LIST */}
      <section className="rounded-[28px] border border-slate-800 bg-slate-950/90 shadow-2xl shadow-slate-950/40 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Histórico Recente</h2>
            <p className="text-sm text-slate-400">Últimas movimentações do seu caixa</p>
          </div>
          
          <button 
            onClick={enviarRelatorioWhatsApp}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
          >
            <Send size={16} />
            Relatório WhatsApp
          </button>
        </div>

        <div className="divide-y divide-slate-800/50">
          {movimentacoes.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 italic">
              Nenhuma movimentação registrada até o momento.
            </div>
          ) : (
            movimentacoes.map((item) => (
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
      </section>

    </div>
  );
}

// SHARED UI COMPONENTS (MIMICKING ESTOQUE.JSX)

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