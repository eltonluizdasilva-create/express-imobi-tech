import React, { useState, useEffect, useCallback } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { useOficina } from "./components/OficinaContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Landmark } from 'lucide-react';

export default function Financeiro({ oficinaId: oficinaIdProp, onSalvo }) {
  const { oficinaId: oficinaIdContext } = useOficina() || {};
  const oficinaId = oficinaIdProp || oficinaIdContext;

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [pagamento, setPagamento] = useState('PIX / Dinheiro');
  const [tipoTransacao, setTipoTransacao] = useState('entrada');

  const [totalHoje, setTotalHoje] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!oficinaId) return;
    setCarregando(true);
    try {
      const q = query(collection(db, "oficinas", oficinaId, "financeiro"), orderBy("data", "desc"));
      const snapshot = await getDocs(q);
      const listaTemp = [];

      snapshot.forEach((documento) => {
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
        listaTemp.push({ id: documento.id, ...transacao, dataTransacao });
      });

      setMovimentacoes(listaTemp);
    } catch (err) {
      console.error('[Financeiro] Erro ao carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [oficinaId]);

  useEffect(() => {
    let somaHoje = 0;
    let somaMes = 0;
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
    setDadosGrafico(ultimos7Dias);
  }, [movimentacoes]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Atualiza quando onSalvo muda (chamado pelo AdminNovo após salvar rápido)
  useEffect(() => {
    if (onSalvo) carregarDados();
  }, [onSalvo, carregarDados]);

  const handleAdicionar = async () => {
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
    await carregarDados();
  };

  const handleRemover = async (idDaTransacao) => {
    if (!oficinaId) return;
    if (window.confirm("Estornar este lançamento?")) {
      try {
        await deleteDoc(doc(db, "oficinas", oficinaId, "financeiro", idDaTransacao));
        await carregarDados(); // Sincronização imediata
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
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">

      {/* 0. BANNER INFORMATIVO */}
      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
            <Landmark size={20} />
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide">
            Visão Financeira
          </h2>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Controle financeiro interligado: Cada lançamento realizado aqui ou via atalhos rápidos atualiza seu saldo, lucro mensal e gráficos de fluxo em tempo real para uma gestão segura da oficina.
        </p>
      </div>

      {/* 1. RESUMO CAIXA */}
      <div className="w-full flex gap-3">
        <div className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Caixa Hoje</p>
          <p className={`text-xl font-black ${totalHoje >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {carregando ? '...' : `R$ ${totalHoje.toFixed(2).replace('.', ',')}`}
          </p>
        </div>
        <div className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Lucro do Mês</p>
          <p className={`text-xl font-black ${totalMes >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {carregando ? '...' : `R$ ${totalMes.toFixed(2).replace('.', ',')}`}
          </p>
        </div>
      </div>

      {/* 🔥 2. GRÁFICO AUTOMÁTICO (Últimos 7 dias) */}
      <div className="w-full h-48 bg-neutral-900 border border-neutral-800 p-4 rounded-xl shadow-lg">
        <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2 text-center">Fluxo dos últimos 7 dias</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dadosGrafico} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="diaTexto" stroke="#8884d8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: '#222' }}
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
            />
            {/* Barras de Entradas e Saídas sobrepostas/lado a lado */}
            <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. ADICIONAR NOVA MOVIMENTAÇÃO */}
      <div className="w-full bg-black border border-neutral-800 p-4 rounded-xl space-y-4 shadow-xl relative overflow-hidden">

        {/* Toggle Entrada/Saída */}
        <div className="flex w-full bg-neutral-900 rounded-lg p-1">
          <button
            onClick={() => setTipoTransacao('entrada')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tipoTransacao === 'entrada' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            ➕ ENTRADA
          </button>
          <button
            onClick={() => setTipoTransacao('saida')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tipoTransacao === 'saida' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            ➖ DESPESA
          </button>
        </div>

        <input
          type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
          placeholder={tipoTransacao === 'entrada' ? "Ex: Venda de Bateria, Serviço avulso..." : "Ex: Conta de Luz, Compra de Peças..."}
          className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm"
        />

        <div className="w-full flex gap-3">
          <input
            type="number" value={valor} onChange={(e) => setValor(e.target.value)}
            placeholder="Valor R$"
            className="flex-1 p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm font-bold"
          />
          <select
            value={pagamento} onChange={(e) => setPagamento(e.target.value)}
            className="flex-1 p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm"
          >
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
          </select>
        </div>

        <button
          onClick={handleAdicionar}
          className={`w-full text-white font-bold py-3 rounded-lg transition-transform active:scale-95 ${tipoTransacao === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          {tipoTransacao === 'entrada' ? '💰 LANÇAR RECEITA' : '💸 REGISTRAR GASTO'}
        </button>
      </div>

      {/* 4. LISTA DE ÚLTIMAS MOVIMENTAÇÕES */}
      <div className="w-full space-y-3 pt-2">
        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest text-center">HISTÓRICO RECENTE</h3>

        {movimentacoes.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">Nenhuma movimentação no caixa.</p>
        ) : (
          movimentacoes.map((item) => (
            <div key={item.id} className={`w-full bg-neutral-900 border-l-4 rounded-r-xl p-3 flex justify-between items-center ${item.tipo === 'saida' ? 'border-red-500' : 'border-green-500'}`}>
              <div>
                <p className="font-bold text-sm truncate max-w-[200px] text-white">{item.descricao}</p>
                <div className="flex gap-2 text-[10px] mt-1">
                  <span className="text-gray-400">{item.dataTransacao ? (isNaN(new Date(item.dataTransacao).getTime()) ? '-' : new Date(item.dataTransacao).toLocaleDateString('pt-BR')) : '-'}</span>
                  <span className="text-gray-500">• {item.pagamento || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className={`font-bold ${item.tipo === 'saida' ? 'text-red-400' : 'text-green-400'}`}>
                  {item.tipo === 'saida' ? '-' : '+'} R$ {Number(item.valor).toFixed(2).replace('.', ',')}
                </p>
                <button
                  onClick={() => handleRemover(item.id)}
                  className="text-red-500 opacity-50 hover:opacity-100 transition-opacity" title="Estornar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. BOTÃO RELATÓRIO WHATSAPP */}
      <button
        onClick={enviarRelatorioWhatsApp}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-sm transition-all shadow-lg shadow-blue-900/20 mt-4 active:scale-95"
      >
        📱 ENVIAR RESUMO (WHATSAPP)
      </button>

    </div>
  );
}