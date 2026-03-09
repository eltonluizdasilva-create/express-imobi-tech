import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useOficina } from '../components/OficinaContext';
import { useGemini } from '../hooks/useGemini';

export default function Estoque() {
  const { oficinaId } = useOficina() || {};
  const { analyzeImage } = useGemini();

  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [nome, setNome] = useState('');
  const [qtd, setQtd] = useState('');
  const [valor, setValor] = useState(''); 
  
  const [analiseIA, setAnaliseIA] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);

  // Carrega o estoque em tempo real
  useEffect(() => {
    if (!oficinaId) return;
    const q = query(collection(db, "oficinas", oficinaId, "estoque"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [oficinaId]);

  const handleAdicionar = async () => {
    if (!nome || !qtd) {
        alert("⚠️ Preencha pelo menos o nome da peça e a quantidade!");
        return;
    }
    
    const qtdNum = Number(qtd);
    const valorNum = Number(valor.replace(',', '.')) || 0;
    const valorTotalDaCompra = qtdNum * valorNum;

    try {
      await addDoc(collection(db, "oficinas", oficinaId, "estoque"), {
        nome,
        qtd: qtdNum,
        valor: valorNum,
        data_registro: new Date().toISOString()
      });

      if (valorNum > 0) {
        if (window.confirm(`📦 Peça adicionada!\n\nDeseja registrar o custo total dessa compra (R$ ${valorTotalDaCompra.toFixed(2)}) como DESPESA no seu Caixa/Financeiro agora?`)) {
          await addDoc(collection(db, "oficinas", oficinaId, "financeiro"), {
            descricao: `Compra p/ Estoque: ${qtdNum}x ${nome}`,
            valor: valorTotalDaCompra,
            tipo: 'saida',
            pagamento: 'Dinheiro / PIX',
            data: new Date().toISOString()
          });
          alert("✅ Despesa registrada no caixa com sucesso!");
        }
      }
      setNome(''); setQtd(''); setValor('');
    } catch (error) {
      alert("❌ Erro ao adicionar peça: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta peça do estoque?")) {
      await deleteDoc(doc(db, "oficinas", oficinaId, "estoque", id));
    }
  };

  // 🔥 NOVAS FUNÇÕES PARA ALTERAR QUANTIDADE RÁPIDO
  const alterarQuantidade = async (item, delta) => {
    const novaQtd = Number(item.qtd) + delta;
    if (novaQtd < 0) return; // Não deixa ficar negativo
    
    try {
      await updateDoc(doc(db, "oficinas", oficinaId, "estoque", item.id), {
        qtd: novaQtd
      });
    } catch (error) {
      alert("❌ Erro ao atualizar quantidade.");
    }
  };

  const handleIA = async () => {
    if (itens.length === 0) return alert("Seu estoque está vazio!");
    setLoadingIA(true);
    setAnaliseIA("🤖 Analisando o seu estoque, aguarde...");
    
    try {
      const listaTexto = itens.map(i => `${i.nome}: ${i.qtd} unidades`).join(', ');
      const prompt = `Você é um gerente logístico de uma oficina mecânica. Analise este estoque e crie uma lista de compras APENAS para os itens que estão com 3 ou menos unidades (estoque baixo). Seja direto e profissional. Lista de itens atuais: ${listaTexto}`;
      
      const resposta = await analyzeImage(prompt);
      setAnaliseIA(resposta);
    } catch (e) {
      setAnaliseIA("❌ Erro ao analisar: " + e.message);
    } finally {
      setLoadingIA(false);
    }
  };

  const itensFiltrados = itens.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));
  
  const totalPecas = itens.reduce((acc, i) => acc + Number(i.qtd), 0);
  const valorInvestido = itens.reduce((acc, i) => acc + (Number(i.qtd) * Number(i.valor || 0)), 0);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">
      
      {/* 1. RESUMO ESTOQUE */}
      <div className="w-full flex gap-3">
        <div className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Total de Peças</p>
          <p className="text-xl font-black text-blue-500">{totalPecas}</p>
        </div>
        <div className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Capital Investido</p>
          <p className="text-xl font-black text-yellow-500">R$ {valorInvestido.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      {/* 2. ADICIONAR PEÇA */}
      <div className="w-full bg-black border border-neutral-800 p-4 rounded-xl space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-neutral-800 pb-2">➕ COMPRA / NOVA PEÇA</h3>
        
        <input 
          type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da Peça (Ex: Filtro de Óleo Gol)" 
          className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm" 
        />

        <div className="w-full flex gap-3">
          <div className="flex-[1]">
             <label className="text-[10px] text-gray-500 ml-1">QTD</label>
             <input 
                type="number" value={qtd} onChange={(e) => setQtd(e.target.value)}
                placeholder="0" 
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm font-bold" 
             />
          </div>
          <div className="flex-[2]">
             <label className="text-[10px] text-gray-500 ml-1">CUSTO UNITÁRIO (R$)</label>
             <input 
                type="number" value={valor} onChange={(e) => setValor(e.target.value)}
                placeholder="Valor pago (R$)" 
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-blue-500 outline-none text-sm font-bold" 
             />
          </div>
        </div>

        <button 
          onClick={handleAdicionar}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform active:scale-95 text-sm">
          📥 GUARDAR NO ESTOQUE
        </button>
      </div>

      {/* 3. BARRA DE PESQUISA */}
      <input 
        type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
        placeholder="🔍 Buscar peça no estoque..." 
        className="w-full p-3 bg-neutral-900 border border-blue-900/50 rounded-lg focus:border-blue-500 outline-none text-sm" 
      />

      {/* 4. LISTA DE ESTOQUE (COM BOTÕES DE + E -) */}
      <div className="w-full space-y-3 pt-2">
        {itensFiltrados.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">Nenhuma peça encontrada.</p>
        ) : (
          itensFiltrados.map((item) => {
            const estoqueBaixo = Number(item.qtd) <= 3;
            return (
              <div key={item.id} className={`w-full bg-neutral-900 border-l-4 rounded-r-xl p-3 flex justify-between items-center relative overflow-hidden ${estoqueBaixo ? 'border-red-500' : 'border-blue-500'}`}>
                
                {estoqueBaixo && (
                   <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg z-10">
                      ESTOQUE BAIXO
                   </span>
                )}

                <div className="flex-1 pr-2">
                  <p className="font-bold text-sm text-white">{item.nome}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Custo Un: R$ {Number(item.valor || 0).toFixed(2).replace('.', ',')}</p>
                </div>
                
                <div className="flex items-center gap-3 bg-black p-1 rounded-lg border border-neutral-800">
                  <button 
                    onClick={() => alterarQuantidade(item, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-neutral-800 hover:bg-red-900/50 text-white rounded-md transition-colors"
                  >
                    -
                  </button>
                  
                  <div className="text-center min-w-[20px]">
                    <p className={`font-black text-lg ${estoqueBaixo ? 'text-red-400' : 'text-blue-400'}`}>
                       {item.qtd}
                    </p>
                  </div>

                  <button 
                    onClick={() => alterarQuantidade(item, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-neutral-800 hover:bg-green-900/50 text-white rounded-md transition-colors"
                  >
                    +
                  </button>
                </div>

                <button 
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 opacity-50 hover:opacity-100 transition-opacity p-2 ml-2" title="Apagar"
                >
                  🗑️
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* 5. RELATÓRIO IA */}
      <div className="w-full pt-4 border-t border-neutral-800">
        <button 
            onClick={handleIA} disabled={loadingIA}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-yellow-500 border border-yellow-900 font-bold py-3 rounded-xl flex justify-center items-center gap-2 text-sm transition-all shadow-lg active:scale-95"
        >
            {loadingIA ? '⏳ PENSANDO...' : '🤖 GERAR LISTA DE COMPRAS (IA)'}
        </button>
        
        {analiseIA && (
            <div className="mt-4 p-4 bg-black border border-yellow-900/50 rounded-xl text-gray-300 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                <span className="text-yellow-500 font-bold mb-2 block">📋 Relatório Inteligente:</span>
                {analiseIA}
            </div>
        )}
      </div>

    </div>
  );
}