import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, doc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useOficina } from './components/OficinaContext';

const REGRAS_PLANOS = {
  essencial: { membros: 3, nome: 'Essencial' },
  profissional: { membros: 5, nome: 'Profissional' },
  especialista: { membros: 8, nome: 'Especialista' },
  master: { membros: 12, nome: 'Master IA' },
  ultimate: { membros: 999, nome: 'Ultimate AI' }
};

export default function Equipe({ setModalUpgradeAberto }) {
  const { oficinaId, dadosOficina } = useOficina() || {};

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [emailFuncionario, setEmailFuncionario] = useState('');
  const [cargo, setCargo] = useState('Mecânico');
  const [whatsapp, setWhatsapp] = useState('');

  // Estados das Listas
  const [membros, setMembros] = useState([]);
  const [limiteAtingido, setLimiteAtingido] = useState(false);
  const [listaOS, setListaOS] = useState([]);
  const [osSelecionada, setOsSelecionada] = useState('');

  const planoAtual = dadosOficina?.plano || 'essencial';
  const configPlano = REGRAS_PLANOS[planoAtual] || REGRAS_PLANOS.essencial;

  // 1. Carregar Equipe em Tempo Real
  useEffect(() => {
    if (!oficinaId) return;
    const q = query(collection(db, "oficinas", oficinaId, "equipe"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembros(lista);
      setLimiteAtingido(lista.length >= configPlano.membros);
    });
    return () => unsubscribe();
  }, [oficinaId, configPlano.membros]);

  // 2. Carregar O.S. (Para o Select de Despacho)
  useEffect(() => {
    if (!oficinaId) return;
    const q = query(collection(db, "oficinas", oficinaId, "os"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const osData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaOS(osData);
    });
    return () => unsubscribe();
  }, [oficinaId]);

  // 3. Salvar Novo Membro com Trava de Plano e E-mail
  const handleSalvar = async () => {
    if (!nome || !emailFuncionario || !whatsapp) {
      alert("⚠️ Preencha todos os campos obrigatórios!");
      return;
    }

    if (membros.length >= configPlano.membros) {
      alert(`🚀 Seu plano ${configPlano.nome} permite até ${configPlano.membros} funcionários.`);
      if (setModalUpgradeAberto) setModalUpgradeAberto(true);
      return;
    }

    try {
      await addDoc(collection(db, "oficinas", oficinaId, "equipe"), {
        nome,
        email: emailFuncionario.toLowerCase().trim(),
        cargo,
        whatsapp: whatsapp.replace(/\D/g, ''),
        dataCadastro: new Date().toISOString(),
        oficinaId: oficinaId
      });

      alert("✅ Funcionário autorizado! Ele já pode logar com este e-mail.");
      limparCampos();
    } catch (error) {
      alert("❌ Erro ao autorizar: " + error.message);
    }
  };

  const limparCampos = () => {
    setNome(''); setEmailFuncionario(''); setWhatsapp(''); setCargo('Mecânico');
  };

  // 4. Excluir Membro
  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente remover este membro da equipe?")) {
      await deleteDoc(doc(db, "oficinas", oficinaId, "equipe", id));
    }
  };

  // 5. DESPACHO INTELIGENTE VIA WHATSAPP
  const despacharOS = (membro) => {
    if (!osSelecionada) {
      alert("⚠️ Selecione uma O.S. no menu suspenso primeiro!");
      return;
    }

    const os = listaOS.find(o => o.id === osSelecionada);
    if (!os) return;

    let mensagem = "";
    const saudacao = `Olá ${membro.nome}, tudo bem? `;

    if (membro.cargo === 'Mecânico') {
      const linkIA = `https://www.youtube.com/results?search_query=como+instalar+${encodeURIComponent(os.pecasDescricao || '')}+${encodeURIComponent(os.modelo || '')}`;
      mensagem = `${saudacao}Temos um serviço para você!\n\n🚗 *Veículo:* ${os.modelo}\n🏷️ *Placa:* ${os.placa || 'Sem placa'}\n🛠️ *Problema Relatado:* ${os.diagnostico || 'Verificar'}\n\n🤖 *Dica da IA para o serviço:* ${linkIA}`;
    } else if (membro.cargo === 'Secretária') {
      const linkPagamento = os.celular ? `wa.me/55${os.celular}` : 'Nenhum WhatsApp cadastrado para este cliente.';
      mensagem = `${saudacao}A O.S. do ${os.modelo} está pronta para faturamento.\n\n👤 *Cliente:* ${os.cliente || 'Não informado'}\n💰 *Valor Total:* R$ ${Number(os.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n📲 *WhatsApp do Cliente:* ${linkPagamento}\nPor favor, faça a cobrança.`;
    } else if (membro.cargo === 'Estoque') {
      mensagem = `${saudacao}Precisamos de peças para uma O.S.!\n\n🚗 *Veículo:* ${os.modelo} (Placa: ${os.placa || 'Sem placa'})\n📦 *Peças necessárias:* ${os.pecasDescricao || 'Nenhuma peça especificada na O.S.'}\n\nPor favor, separe os itens e dê baixa no sistema.`;
    }

    const linkZap = `https://api.whatsapp.com/send?phone=55${membro.whatsapp}&text=${encodeURIComponent(mensagem)}`;
    window.open(linkZap, '_blank');
  };

  const getIconeCargo = (cargo) => {
    if (cargo === 'Mecânico') return '👨‍🔧';
    if (cargo === 'Secretária') return '👩‍💻';
    if (cargo === 'Estoque') return '📦';
    return '👤';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">
      <header className="text-center">
        <h2 className="text-xl font-bold text-red-500">👥 GESTÃO DE EQUIPE</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
          Plano {configPlano.nome}: {membros.length} / {configPlano.membros === 999 ? '∞' : configPlano.membros} vagas
        </p>
      </header>

      {/* FORMULÁRIO DE CADASTRO */}
      <div className={`w-full bg-neutral-900 border ${limiteAtingido ? 'border-yellow-600' : 'border-neutral-800'} p-4 rounded-xl space-y-3`}>
        <input
          type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do Funcionário"
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg text-sm outline-none focus:border-red-500"
        />

        <input
          type="email" value={emailFuncionario} onChange={(e) => setEmailFuncionario(e.target.value)}
          placeholder="E-mail de Login (Obrigatório)"
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg text-sm outline-none focus:border-red-500"
        />

        <input
          type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp (DDD + Número)"
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg text-sm outline-none focus:border-red-500"
        />

        <select
          value={cargo} onChange={(e) => setCargo(e.target.value)}
          className="w-full p-3 bg-black border border-neutral-700 rounded-lg text-sm text-gray-400"
        >
          <option value="Mecânico">👨‍🔧 Mecânico</option>
          <option value="Secretária">👩‍💻 Secretária / Adm</option>
          <option value="Estoque">📦 Estoquista</option>
        </select>

        <button
          onClick={handleSalvar}
          className={`w-full py-3 rounded-lg font-bold transition-all active:scale-95 ${limiteAtingido ? 'bg-yellow-600' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {limiteAtingido ? '🚀 FAZER UPGRADE DE PLANO' : '➕ AUTORIZAR ACESSO'}
        </button>
      </div>

      {/* LOGÍSTICA / DESPACHO */}
      {membros.length > 0 && (
        <div className="w-full space-y-3 pt-4 border-t border-neutral-800">
          <h3 className="text-xs font-bold text-gray-400 tracking-widest">LOGÍSTICA: SELECIONE UMA O.S.</h3>
          <select
            value={osSelecionada} onChange={(e) => setOsSelecionada(e.target.value)}
            className="w-full p-3 bg-black border border-neutral-800 text-red-500 font-bold rounded-lg outline-none text-sm"
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

      {/* LISTAGEM DE EQUIPE */}
      <div className="w-full space-y-3">
        <h3 className="text-xs font-bold text-gray-500 ml-1">FUNCIONÁRIOS ATIVOS</h3>
        {membros.map((membro) => (
          <div key={membro.id} className="bg-neutral-900 border-l-4 border-red-600 p-3 rounded-r-xl flex items-center justify-between group gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black border border-neutral-700 rounded-full flex items-center justify-center text-lg">
                {getIconeCargo(membro.cargo)}
              </div>
              <div>
                <p className="font-bold text-sm">{membro.nome}</p>
                <p className="text-[10px] text-gray-500 italic">{membro.email}</p>
                <span className="text-[9px] bg-neutral-800 px-2 py-0.5 rounded text-red-400 uppercase">{membro.cargo}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => despacharOS(membro)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg text-[10px] font-bold transition-all active:scale-95"
              >
                🚀 ENVIAR
              </button>
              <button onClick={() => handleExcluir(membro.id)} className="text-neutral-700 hover:text-red-500 p-2 transition-colors">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
