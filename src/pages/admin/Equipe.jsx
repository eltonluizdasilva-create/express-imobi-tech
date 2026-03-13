import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { useOficina } from '.././components/OficinaContext'; // 🔥 Segurança SaaS

export default function Equipe() {
  const { oficinaId } = useOficina() || {};
  
  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Mecânico');
  const [whatsapp, setWhatsapp] = useState('');

  // Estados das Listas
  const [membros, setMembros] = useState([]);
  const [listaOS, setListaOS] = useState([]);
  const [osSelecionada, setOsSelecionada] = useState('');

  // 1. Carregar Equipe em Tempo Real
  useEffect(() => {
    if (!oficinaId) return;
    const q = query(collection(db, "oficinas", oficinaId, "equipe"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembros(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [oficinaId]);

  // 2. Carregar O.S. (Para o Select de Despacho)
  useEffect(() => {
    if (!oficinaId) return;
    const q = query(collection(db, "oficinas", oficinaId, "os"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Pega só as O.S. que têm modelo/cliente para facilitar a leitura
      const osData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaOS(osData);
    });
    return () => unsubscribe();
  }, [oficinaId]);

  // 3. Salvar Novo Membro
  const handleSalvar = async () => {
    if (!nome || !whatsapp) {
      alert("⚠️ Digite o nome e o WhatsApp do membro!");
      return;
    }
    try {
      await addDoc(collection(db, "oficinas", oficinaId, "equipe"), {
        nome,
        cargo,
        whatsapp: whatsapp.replace(/\D/g, ''), // Limpa traços e espaços
        dataCadastro: new Date().toISOString()
      });
      alert("✅ Membro salvo com sucesso!");
      setNome(''); setWhatsapp(''); setCargo('Mecânico');
    } catch (error) {
      alert("❌ Erro ao salvar: " + error.message);
    }
  };

  // 4. Excluir Membro
  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente remover este membro da equipe?")) {
      await deleteDoc(doc(db, "oficinas", oficinaId, "equipe", id));
    }
  };

  // 🔥 5. DESPACHO INTELIGENTE VIA WHATSAPP 🔥
  const despacharOS = (membro) => {
    if (!osSelecionada) {
      alert("⚠️ Selecione uma O.S. no menu suspenso primeiro!");
      return;
    }

    const os = listaOS.find(o => o.id === osSelecionada);
    if (!os) return;

    let mensagem = "";
    const saudacao = `Olá ${membro.nome}, tudo bem? `;

    // Lógica Dinâmica baseada no Cargo
    if (membro.cargo === 'Mecânico') {
      const linkIA = `https://www.youtube.com/results?search_query=como+instalar+${encodeURIComponent(os.pecasDescricao)}+${encodeURIComponent(os.modelo)}`;
      mensagem = `${saudacao}Temos um serviço para você!\n\n🚗 *Veículo:* ${os.modelo}\n🏷️ *Placa:* ${os.placa || 'Sem placa'}\n🛠️ *Problema Relatado:* ${os.diagnostico || 'Verificar'}\n\n🤖 *Dica da IA para o serviço:* ${linkIA}`;
    
    } else if (membro.cargo === 'Secretária') {
      const linkPagamento = os.celular ? `wa.me/55${os.celular}` : 'Nenhum WhatsApp cadastrado para este cliente.';
      mensagem = `${saudacao}A O.S. do ${os.modelo} está pronta para faturamento.\n\n👤 *Cliente:* ${os.cliente || 'Não informado'}\n💰 *Valor Total:* R$ ${Number(os.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n📲 *WhatsApp do Cliente:* ${linkPagamento}\nPor favor, faça a cobrança.`;
    
    } else if (membro.cargo === 'Estoque') {
      mensagem = `${saudacao}Precisamos de peças para uma O.S.!\n\n🚗 *Veículo:* ${os.modelo} (Placa: ${os.placa || 'Sem placa'})\n📦 *Peças necessárias:* ${os.pecasDescricao || 'Nenhuma peça especificada na O.S.'}\n\nPor favor, separe os itens e dê baixa no sistema.`;
    }

    // Abre o WhatsApp do funcionário
    const linkZap = `https://api.whatsapp.com/send?phone=55${membro.whatsapp}&text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');
  };

  // Helper para os emojis dos cargos
  const getIconeCargo = (cargo) => {
    if (cargo === 'Mecânico') return '👨‍🔧';
    if (cargo === 'Secretária') return '👩‍💻';
    if (cargo === 'Estoque') return '📦';
    return '👤';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">

      <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
        👥 GESTÃO DE EQUIPE
      </h2>

      {/* 1. FORMULÁRIO DE CADASTRO */}
      <div className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4">
        <input 
          type="text" value={nome} onChange={(e) => setNome(e.target.value)} 
          placeholder="Nome do Funcionário" 
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg focus:border-red-500 outline-none text-sm" 
        />
        
        <input 
          type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} 
          placeholder="WhatsApp (DDD + Num)" 
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg focus:border-red-500 outline-none text-sm" 
        />

        <select 
          value={cargo} onChange={(e) => setCargo(e.target.value)}
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg focus:border-red-500 outline-none text-sm text-gray-300"
        >
          <option value="Mecânico">👨‍🔧 Mecânico</option>
          <option value="Secretária">👩‍💻 Secretária / Financeiro</option>
          <option value="Estoque">📦 Estoquista</option>
        </select>

        <button onClick={handleSalvar} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg active:scale-95">
          ➕ CADASTRAR MEMBRO
        </button>
      </div>

      {/* 2. MENU DE LOGÍSTICA / DESPACHO DE O.S. */}
      {membros.length > 0 && (
        <div className="w-full space-y-3 pt-4 border-t border-neutral-800">
          <h3 className="text-xs font-bold text-gray-400 tracking-widest">LOGÍSTICA: SELECIONE UMA O.S.</h3>
          <select 
            value={osSelecionada} onChange={(e) => setOsSelecionada(e.target.value)}
            className="w-full p-3 bg-black border border-neutral-800 text-red-500 font-bold rounded-lg outline-none text-sm mb-4"
          >
            <option value="">-- Escolha uma O.S. para Despachar --</option>
            {listaOS.map(os => (
              <option key={os.id} value={os.id}>
                {os.modelo || 'Veículo'} | Placa: {os.placa || 'N/A'} | Cliente: {os.cliente || 'N/A'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. LISTA DA EQUIPE E BOTÕES DE ENVIO */}
      <div className="w-full space-y-3">
        {membros.map((membro) => (
          <div key={membro.id} className="w-full bg-neutral-900 border border-neutral-800 border-l-4 border-l-red-600 rounded-r-xl p-3 flex items-center gap-3 relative">
            
            <button onClick={() => handleExcluir(membro.id)} className="absolute top-2 right-2 text-red-500 text-xs font-bold opacity-50 hover:opacity-100">
              ✕
            </button>

            <div className="w-12 h-12 bg-black border border-neutral-700 rounded-full flex items-center justify-center text-xl">
              {getIconeCargo(membro.cargo)}
            </div>
            
            <div className="flex-1">
              <p className="font-bold text-sm text-white truncate max-w-[150px]">{membro.nome}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{membro.cargo}</p>
            </div>

            {/* BOTÃO DE DESPACHO */}
            <button 
              onClick={() => despacharOS(membro)}
              className="bg-green-600 hover:bg-green-700 text-white p-2 px-3 rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              🚀 ENVIAR O.S.
            </button>

          </div>
        ))}
        {membros.length === 0 && (
          <p className="text-center text-gray-600 text-sm mt-4">Nenhum membro cadastrado.</p>
        )}
      </div>

    </div>
  );
}