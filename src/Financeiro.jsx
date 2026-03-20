import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase'; 
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { useOficina } from "./components/OficinaContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'; // 🔥 Importação do Gráfico

export default function Financeiro() {
  const { oficinaId } = useOficina() || {};

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [pagamento, setPagamento] = useState('PIX / Dinheiro');
  const [tipoTransacao, setTipoTransacao] = useState('entrada'); // 'entrada' ou 'saida'

  const [totalHoje, setTotalHoje] = useState(0);
  const [totalMes, setTotalMes] = useState(0);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [dadosGrafico, setDadosGrafico] = useState([]);

  useEffect(() => {
    if (!oficinaId) return;

    // 🔥 Busca em tempo real e na pasta segura da oficina
    const q = query(collection(db, "oficinas", oficinaId, "financeiro"), orderBy("data", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let somaHoje = 0;
      let somaMes = 0;
      const hoje = new Date();
      const listaTemp = [];
      
      // Variáveis para montar o gráfico de 7 dias
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

      snapshot.forEach((documento) => {
        const transacao = documento.data();
        const valorTransacao = Number(transacao.valor) || 0;
        const ehEntrada = transacao.tipo !== 'saida'; // Considera tudo que não é 'saida' como entrada
        const multiplicador = ehEntrada ? 1 : -1;
        
        if (transacao.data) {
            const dataTransacao = new Date(transacao.data); // Lidando com strings ISO

            // Soma do Mês
            if (dataTransacao.getMonth() === hoje.getMonth() && dataTransacao.getFullYear() === hoje.getFullYear()) {
                somaMes += (valorTransacao * multiplicador);
            }
            
            // Soma de Hoje
            if (dataTransacao.toLocaleDateString('pt-BR') === hoje.toLocaleDateString('pt-BR')) {
                somaHoje += (valorTransacao * multiplicador);
            }

            // Alimenta os dados do Gráfico
            const diaIndex = ultimos7Dias.findIndex(d => d.dataComparacao === dataTransacao.toLocaleDateString('pt-BR'));
            if (diaIndex !== -1) {
                if (ehEntrada) ultimos7Dias[diaIndex].Entradas += valorTransacao;
                else ultimos7Dias[diaIndex].Saídas += valorTransacao;
            }

            listaTemp.push({
              id: documento.id,
              ...transacao,
              dataTransacao
            });
        }
      });

      setTotalHoje(somaHoje);
      setTotalMes(somaMes);
      setMovimentacoes(listaTemp.slice(0, 8)); // Mostra as últimas 8 na lista
      setDadosGrafico(ultimos7Dias);
    });

    return () => unsubscribe();
  }, [oficinaId]);

  const handleAdicionar = async () => {
    if (!descricao || !valor) {
      alert("⚠️ Por favor, preencha a descrição e o valor!");
      return;
    }

    try {
      const valorNumero = parseFloat(valor.replace(',', '.'));

      await addDoc(collection(db, "oficinas", oficinaId, "financeiro"), {
        descricao,
        valor: valorNumero,
        pagamento,
        tipo: tipoTransacao, // 'entrada' ou 'saida'
        data: new Date().toISOString() 
      });
      
      setDescricao(''); setValor(''); setPagamento('PIX / Dinheiro');
    } catch (error) {
      alert("❌ Erro ao salvar a transação: " + error.message);
    }
  };

  const handleRemover = async (idDaTransacao) => {
    if (window.confirm("Tem certeza que deseja apagar ou estornar este valor do caixa?")) {
      try {
        await deleteDoc(doc(db, "oficinas", oficinaId, "financeiro", idDaTransacao));
      } catch (error) {
        alert("❌ Erro ao remover: " + error.message);
      }
    }
  };

  const enviarRelatorioWhatsApp = () => {
    const mensagem = `📊 *RESUMO DO CAIXA - OFICINA*\n\n📅 Hoje: R$ ${totalHoje.toFixed(2).replace('.', ',')}\n🗓️ Mês Atual: R$ ${totalMes.toFixed(2).replace('.', ',')}\n\n_Gerado automaticamente pelo Oficina IA_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">
      
      {/* 1. RESUMO CAIXA */}
      <div className="w-full flex gap-3">
        <div className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Caixa Hoje</p>
          <p className={`text-xl font-black ${totalHoje >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {totalHoje.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Lucro do Mês</p>
          <p className={`text-xl font-black ${totalMes >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            R$ {totalMes.toFixed(2).replace('.', ',')}
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
                cursor={{fill: '#222'}} 
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
                    <span className="text-gray-400">{new Date(item.dataTransacao).toLocaleDateString('pt-BR')}</span>
                    <span className="text-gray-500">• {item.pagamento}</span>
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