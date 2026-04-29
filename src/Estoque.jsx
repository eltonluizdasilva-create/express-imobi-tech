import React, { useMemo, useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { addDoc, collection, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Edit2,
  Package,
  Save,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useGroq } from './hooks/useGroq';

const LOW_STOCK_LIMIT = 3;
const MEDIUM_STOCK_LIMIT = 7;

export default function Estoque() {
  const { currentUserId } = useAuth();
  const { analyzeText } = useGroq(currentUserId);
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [ordenacao, setOrdenacao] = useState('status');
  const [novoItem, setNovoItem] = useState({ nome: '', qtd: '', valor: '', categoria: '' });
  const [loadingIA, setLoadingIA] = useState(false);
  const [analiseIA, setAnaliseIA] = useState('');

  // Estado para controle de edição
  const [itemParaEditar, setItemParaEditar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sincronização em tempo real com o Firebase
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'oficinas', currentUserId, 'estoque'),
      orderBy('nome', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItens(docs);
    }, (error) => {
      console.error("Erro no listener de estoque:", error);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const categoriasDisponiveis = useMemo(() => {
    return ['Todas', ...new Set(itens.map(item => item.categoria || 'Geral'))];
  }, [itens]);

  const dashboard = useMemo(() => {
    const totalItens = itens.reduce((acc, item) => acc + (Number(item.qtd) || 0), 0);
    const valorTotal = itens.reduce((acc, item) => acc + ((Number(item.qtd) || 0) * (Number(item.valor) || 0)), 0);
    const itensCriticos = itens.filter(item => (Number(item.qtd) || 0) <= LOW_STOCK_LIMIT);
    const itensModerados = itens.filter(item => {
      const qtd = Number(item.qtd) || 0;
      return qtd > LOW_STOCK_LIMIT && qtd <= MEDIUM_STOCK_LIMIT;
    });
    const itemMaisValioso = itens.reduce((top, item) => {
      const itemValue = (Number(item.qtd) || 0) * (Number(item.valor) || 0);
      const topValue = top ? (Number(top.qtd) || 0) * (Number(top.valor) || 0) : -1;
      return itemValue > topValue ? item : top;
    }, null);

    const categoriaMap = itens.reduce((acc, item) => {
      const categoria = item.categoria || 'Geral';
      acc[categoria] = (acc[categoria] || 0) + (Number(item.qtd) || 0);
      return acc;
    }, {});

    const categoriaStats = Object.entries(categoriaMap)
      .map(([categoria, quantidade]) => ({ categoria, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    const stockSeries = [...itens]
      .sort((a, b) => (Number(b.qtd) || 0) - (Number(a.qtd) || 0))
      .slice(0, 6)
      .map(item => ({
        id: item.id,
        nome: item.nome,
        qtd: Number(item.qtd) || 0,
        valor: Number(item.valor) || 0
      }));

    const reposicaoEstimada = itensCriticos.reduce((acc, item) => {
      const qtdAtual = Number(item.qtd) || 0;
      const qtdNecessaria = Math.max(MEDIUM_STOCK_LIMIT - qtdAtual, 0);
      return acc + qtdNecessaria * (Number(item.valor) || 0);
    }, 0);

    return {
      totalItens,
      valorTotal,
      itensCriticos,
      itensModerados,
      itemMaisValioso,
      categoriaStats,
      stockSeries,
      reposicaoEstimada
    };
  }, [itens]);

  const itensProcessados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const result = itens.filter(item => {
      const nome = item.nome?.toLowerCase() || '';
      const categoria = item.categoria?.toLowerCase() || '';
      const buscaOk = !termo || nome.includes(termo) || categoria.includes(termo);
      const categoriaOk = categoriaFiltro === 'Todas' || (item.categoria || 'Geral') === categoriaFiltro;
      return buscaOk && categoriaOk;
    });

    result.sort((a, b) => {
      if (ordenacao === 'nome') return (a.nome || '').localeCompare(b.nome || '');
      if (ordenacao === 'qtd-asc') return (Number(a.qtd) || 0) - (Number(b.qtd) || 0);
      if (ordenacao === 'qtd-desc') return (Number(b.qtd) || 0) - (Number(a.qtd) || 0);
      if (ordenacao === 'valor-desc') return (Number(b.valor) || 0) - (Number(a.valor) || 0);
      return getStockPriority(a) - getStockPriority(b);
    });

    return result;
  }, [itens, busca, categoriaFiltro, ordenacao]);

  const handleSalvar = async (event) => {
    event.preventDefault();
    if (!novoItem.nome || !currentUserId) return;

    try {
      await addDoc(collection(db, 'oficinas', currentUserId, 'estoque'), {
        ...novoItem,
        qtd: Number(novoItem.qtd) || 0,
        valor: Number(novoItem.valor) || 0,
        categoria: novoItem.categoria || 'Geral',
        dataCriacao: new Date().toISOString()
      });
      setNovoItem({ nome: '', qtd: '', valor: '', categoria: '' });
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!currentUserId || !window.confirm('Deseja realmente excluir este item?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', currentUserId, 'estoque', id));
    } catch (error) {
      console.error('Erro ao deletar item:', error);
    }
  };

  const alterarQuantidade = async (item, delta) => {
    if (!currentUserId) return;
    const novaQtd = Math.max((Number(item.qtd) || 0) + delta, 0);
    try {
      await updateDoc(doc(db, 'oficinas', currentUserId, 'estoque', item.id), {
        qtd: novaQtd
      });
    } catch (error) {
      console.error('Erro ao alterar quantidade:', error);
    }
  };

  // Função para abrir o modal de edição
  const handleAbrirEdicao = (item) => {
    setItemParaEditar({ ...item });
    setIsModalOpen(true);
  };

  // Função de Update Corrigida
  const handleSalvarEdicao = async () => {
    try {
      const itemRef = doc(db, 'oficinas', currentUserId, 'estoque', itemParaEditar.id);
      await updateDoc(itemRef, {
        nome: itemParaEditar.nome,
        categoria: itemParaEditar.categoria || 'Geral',
        qtd: Number(itemParaEditar.qtd),
        valor: Number(itemParaEditar.valor)
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const gerarListaWhatsApp = () => {
    const criticos = itens.filter(item => (Number(item.qtd) || 0) <= LOW_STOCK_LIMIT);
    if (!criticos.length) return;

    const texto = criticos
      .map(item => `- ${item.nome} | qtd atual: ${item.qtd} | categoria: ${item.categoria || 'Geral'}`)
      .join('\n');
    const msg = encodeURIComponent(`Lista de reposicao - Oficina\n\n${texto}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  async function handleIA() {
    if (!itens.length) {
      setAnaliseIA('Estoque vazio.');
      return;
    }

    setLoadingIA(true);
    try {
      // MUDANÇA AQUI: Passando os dados reais e travando o comportamento da IA
      const dadosEstoque = itens.map(item => `- ${item.nome} | Qtd: ${item.qtd} | Valor: R$${item.valor}`).join('\n');

      const prompt = `Aja estritamente como um auditor de estoque frio e direto. Analise esta lista:\n${dadosEstoque}\n
            REGRAS OBRIGATÓRIAS:
            1. NÃO explique para que serve a peça. Vá direto ao ponto.
            2. NÃO use formatação (não use asteriscos **).
            3. Informe apenas: O que tem ruptura (menos de 3 unidades) e o custo EXATO para repor 5 unidades de cada item crítico, usando apenas o 'Valor' fornecido na lista.
            4. Responda em no máximo 3 linhas. Seja telegráfico.`;

      const res = await analyzeText(prompt);
      setAnaliseIA(res);
    } catch (error) {
      console.error('Erro na conexao com a inteligencia:', error);
      setAnaliseIA('Erro na conexao com a inteligencia. Verifique o console.');
    } finally {
      setLoadingIA(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8">
      <section className="overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.2),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(34,211,238,0.55)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles size={14} />
              Operacao em tempo real
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Estoque inteligente com visao rapida, alertas e prioridade de reposicao.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Acompanhe quantidades, valor parado e itens em risco num painel unico, com leitura clara para decidir compra e reposicao.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight
              label="Itens criticos"
              value={dashboard.itensCriticos.length}
              tone="danger"
              helper="Reposicao imediata"
            />
            <QuickHighlight
              label="Investimento sugerido"
              value={formatCurrency(dashboard.reposicaoEstimada)}
              tone="info"
              helper="Para subir ao nivel seguro"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pecas em estoque" value={dashboard.totalItens} detail="Total de unidades registradas" icon={<Package size={20} />} tone="info" />
        <MetricCard title="Valor imobilizado" value={formatCurrency(dashboard.valorTotal)} detail="Capital parado no estoque" icon={<TrendingUp size={20} />} tone="success" />
        <MetricCard title="Itens em alerta" value={dashboard.itensCriticos.length} detail={`Ate ${LOW_STOCK_LIMIT} unidades`} icon={<AlertTriangle size={20} />} tone="danger" />
        <MetricCard
          title="Maior peso no estoque"
          value={dashboard.itemMaisValioso?.nome || 'Sem destaque'}
          detail={dashboard.itemMaisValioso ? formatCurrency((Number(dashboard.itemMaisValioso.qtd) || 0) * (Number(dashboard.itemMaisValioso.valor) || 0)) : 'Cadastre itens para analisar'}
          icon={<ArrowUpRight size={20} />}
          tone="warning"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Leitura do estoque</p>
              <h2 className="mt-1 text-xl font-bold text-white">Top itens por quantidade</h2>
            </div>
            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              Atualizado com seus dados
            </span>
          </div>
          <StockBars items={dashboard.stockSeries} />
        </div>

        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Distribuicao</p>
            <h2 className="mt-1 text-xl font-bold text-white">Categorias com mais volume</h2>
          </div>
          <CategoryBars items={dashboard.categoriaStats} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[26px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(255,251,235,0.05),rgba(15,23,42,0.95))] p-6 shadow-2xl shadow-amber-950/20">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Alertas</p>
              <h2 className="mt-1 text-xl font-bold text-white">Itens que pedem atencao</h2>
            </div>
            <button
              onClick={gerarListaWhatsApp}
              disabled={!dashboard.itensCriticos.length}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={16} />
              Enviar lista
            </button>
          </div>
          <AlertList criticos={dashboard.itensCriticos} moderados={dashboard.itensModerados} />
        </div>

        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/40">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Entrada rapida</p>
            <h2 className="mt-1 text-xl font-bold text-white">Cadastrar item no estoque</h2>
          </div>
          <form onSubmit={handleSalvar} className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nome da peca"
              value={novoItem.nome}
              onChange={value => setNovoItem({ ...novoItem, nome: value })}
              placeholder="Ex: Pastilha dianteira"
            />
            <Field
              label="Categoria"
              value={novoItem.categoria}
              onChange={value => setNovoItem({ ...novoItem, categoria: value })}
              placeholder="Ex: Freios"
            />
            <Field
              label="Quantidade"
              type="number"
              value={novoItem.qtd}
              onChange={value => setNovoItem({ ...novoItem, qtd: value })}
              placeholder="0"
            />
            <Field
              label="Custo unitario"
              type="number"
              value={novoItem.valor}
              onChange={value => setNovoItem({ ...novoItem, valor: value })}
              placeholder="0.00"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 md:col-span-2">
              <Save size={18} />
              Registrar item
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/90 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-400/60"
              placeholder="Buscar por nome ou categoria..."
              value={busca}
              onChange={event => setBusca(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
              value={categoriaFiltro}
              onChange={event => setCategoriaFiltro(event.target.value)}
            >
              {categoriasDisponiveis.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>

            <select
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none"
              value={ordenacao}
              onChange={event => setOrdenacao(event.target.value)}
            >
              <option value="status">Prioridade de reposicao</option>
              <option value="nome">Nome A-Z</option>
              <option value="qtd-asc">Menor quantidade</option>
              <option value="qtd-desc">Maior quantidade</option>
              <option value="valor-desc">Maior custo</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Quantidade</th>
                <th className="px-6 py-4">Leitura</th>
                <th className="px-6 py-4 text-right">Valor unitario</th>
                <th className="px-6 py-4 text-right">Impacto total</th>
                <th className="px-6 py-4 text-center">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {itensProcessados.map(item => {
                const qtd = Number(item.qtd) || 0;
                const total = qtd * (Number(item.valor) || 0);
                const status = getStockStatus(qtd);
                return (
                  <tr key={item.id} className="transition hover:bg-slate-900/70">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-white">{item.nome}</p>
                        <span className="inline-flex rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-400">
                          {item.categoria || 'Geral'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alterarQuantidade(item, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-red-400/40 hover:text-red-300"
                        >
                          -
                        </button>
                        <span className={`w-10 text-center font-mono text-lg ${status.textClass}`}>{qtd}</span>
                        <button
                          onClick={() => alterarQuantidade(item, 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StockMeter quantity={qtd} />
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-slate-200">
                      {formatCurrency(Number(item.valor) || 0)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-emerald-300">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleAbrirEdicao(item)}
                          className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2 text-blue-300 transition hover:bg-blue-500/15"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/15"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!itensProcessados.length && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    Nenhum item encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95))] p-6 shadow-2xl shadow-cyan-950/30">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              <Bot size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200">Assistente</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Analise inteligente de reposicao</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Gere uma leitura automatica com foco em ruptura, compra urgente e valor estimado para estabilizar o estoque.
              </p>
            </div>
          </div>

          <button
            onClick={handleIA}
            disabled={loadingIA}
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingIA ? 'Analisando estoque...' : 'Gerar analise'}
          </button>
        </div>

        {analiseIA && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/70 p-5 font-mono text-sm leading-7 text-cyan-50">
            {analiseIA}
          </div>
        )}
      </section>

      {/* Modal de Edição */}
      {isModalOpen && itemParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Editar Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-5">
              <Field
                label="Nome da peca"
                value={itemParaEditar.nome}
                onChange={value => setItemParaEditar({ ...itemParaEditar, nome: value })}
              />
              <Field
                label="Categoria"
                value={itemParaEditar.categoria}
                onChange={value => setItemParaEditar({ ...itemParaEditar, categoria: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Quantidade"
                  type="number"
                  value={itemParaEditar.qtd}
                  onChange={value => setItemParaEditar({ ...itemParaEditar, qtd: value })}
                />
                <Field
                  label="Custo unitario"
                  type="number"
                  value={itemParaEditar.valor}
                  onChange={value => setItemParaEditar({ ...itemParaEditar, valor: value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-slate-800 py-3 font-bold text-slate-400 hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEdicao}
                  className="flex-1 rounded-2xl bg-cyan-400 py-3 font-bold text-slate-950 hover:bg-cyan-300"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, detail, icon, tone }) {
  const tones = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-red-400/20 bg-red-400/10 text-red-200',
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
    danger: 'border-red-400/20 bg-red-400/10 text-red-100',
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

function StockBars({ items }) {
  const maxValue = Math.max(...items.map(item => item.qtd), 1);

  if (!items.length) {
    return <EmptyState message="Adicione itens para gerar o grafico de quantidade." />;
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        const width = Math.max((item.qtd / maxValue) * 100, 8);
        return (
          <div key={item.id}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-200">{item.nome}</span>
              <span className="font-mono text-cyan-200">{item.qtd} un</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.7),rgba(59,130,246,0.95))]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBars({ items }) {
  const maxValue = Math.max(...items.map(item => item.quantidade), 1);

  if (!items.length) {
    return <EmptyState message="Categorias aparecem aqui assim que o estoque tiver itens." />;
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.categoria}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-200">{item.categoria}</span>
            <span className="font-mono text-emerald-200">{item.quantidade} un</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(74,222,128,0.75),rgba(16,185,129,0.95))]"
              style={{ width: `${Math.max((item.quantidade / maxValue) * 100, 10)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertList({ criticos, moderados }) {
  if (!criticos.length && !moderados.length) {
    return <EmptyState message="Sem alertas no momento. O estoque esta em nivel saudavel." />;
  }

  return (
    <div className="space-y-3">
      {criticos.map(item => (
        <AlertRow
          key={item.id}
          title={item.nome}
          subtitle={`Restam ${item.qtd} unidades em ${item.categoria || 'Geral'}`}
          badge="Urgente"
          badgeClass="border-red-400/20 bg-red-400/10 text-red-200"
        />
      ))}
      {moderados.map(item => (
        <AlertRow
          key={item.id}
          title={item.nome}
          subtitle={`Nivel moderado com ${item.qtd} unidades`}
          badge="Atencao"
          badgeClass="border-amber-300/20 bg-amber-300/10 text-amber-100"
        />
      ))}
    </div>
  );
}

function AlertRow({ title, subtitle, badge, badgeClass }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>{badge}</span>
    </div>
  );
}

function StockMeter({ quantity }) {
  const level = Math.min((quantity / 12) * 100, 100);
  const status = getStockStatus(quantity);

  return (
    <div className="space-y-2">
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-900">
        <div className={`h-full rounded-full ${status.barClass}`} style={{ width: `${Math.max(level, 6)}%` }} />
      </div>
      <p className={`text-xs font-semibold ${status.textClass}`}>{status.helper}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-500">
      {message}
    </div>
  );
}

function getStockPriority(item) {
  const qtd = Number(item.qtd) || 0;
  if (qtd <= LOW_STOCK_LIMIT) return 0;
  if (qtd <= MEDIUM_STOCK_LIMIT) return 1;
  return 2;
}

function getStockStatus(quantity) {
  if (quantity <= LOW_STOCK_LIMIT) {
    return {
      label: 'Critico',
      helper: 'Reposicao urgente',
      textClass: 'text-red-300',
      barClass: 'bg-[linear-gradient(90deg,rgba(248,113,113,0.8),rgba(239,68,68,1))]',
      badgeClass: 'border border-red-400/20 bg-red-400/10 text-red-200'
    };
  }

  if (quantity <= MEDIUM_STOCK_LIMIT) {
    return {
      label: 'Atencao',
      helper: 'Planejar compra',
      textClass: 'text-amber-200',
      barClass: 'bg-[linear-gradient(90deg,rgba(253,224,71,0.8),rgba(245,158,11,1))]',
      badgeClass: 'border border-amber-300/20 bg-amber-300/10 text-amber-100'
    };
  }

  return {
    label: 'Estavel',
    helper: 'Nivel confortavel',
    textClass: 'text-emerald-300',
    barClass: 'bg-[linear-gradient(90deg,rgba(74,222,128,0.8),rgba(16,185,129,1))]',
    badgeClass: 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}