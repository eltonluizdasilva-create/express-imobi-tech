const REGRAS_PLANOS = {
  essencial: { membros: 3, nome: 'Essencial' },
  profissional: { membros: 5, nome: 'Profissional' },
  especialista: { membros: 8, nome: 'Especialista' },
  master: { membros: 12, nome: 'Master IA' },
  ultimate: { membros: 999, nome: 'Ultimate AI' }
};

import React, { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { collection, addDoc, doc, getDoc, onSnapshot, query, deleteDoc } from 'firebase/firestore';
import { useOficina } from './components/OficinaContext';

export default function Equipe({ setModalUpgradeAberto }) {
  const { oficinaId, dadosOficina } = useOficina() || {};

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [emailFuncionario, setEmailFuncionario] = useState(''); // 🔥 Restrição por E-mail
  const [cargo, setCargo] = useState('Mecânico');
  const [whatsapp, setWhatsapp] = useState('');

  // Estados das Listas
  const [membros, setMembros] = useState([]);
  const [limiteAtingido, setLimiteAtingido] = useState(false);

  // 1. Definição da Hierarquia de Planos (Sua lógica solicitada)
  const planoAtual = dadosOficina?.plano || 'essencial';
  const configPlano = REGRAS_PLANOS[planoAtual] || REGRAS_PLANOS.essencial;

  // 2. Monitorar Equipe em Tempo Real
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

  // 3. Salvar Novo Membro com Trava de Plano e E-mail
  const handleSalvar = async () => {
    if (!nome || !emailFuncionario || !whatsapp) {
      alert("⚠️ Preencha todos os campos obrigatórios!");
      return;
    }

    // 🔥 TRAVA DE PLANO: Se atingir o limite, abre o Modal de Upgrade
    if (membros.length >= configPlano.membros) {
      alert(`🚀 Seu plano ${configPlano.nome} permite até ${configPlano.membros} funcionários.`);
      setModalUpgradeAberto(true);
      return;
    }

    try {
      // Salvamos o e-mail para que as Security Rules do Firebase permitam o login desse usuário
      await addDoc(collection(db, "oficinas", oficinaId, "equipe"), {
        nome,
        email: emailFuncionario.toLowerCase().trim(),
        cargo,
        whatsapp: whatsapp.replace(/\D/g, ''),
        dataCadastro: new Date().toISOString(),
        oficinaId: oficinaId // Vincula o funcionário à oficina
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

  const handleExcluir = async (id) => {
    if (window.confirm("Remover acesso deste funcionário?")) {
      await deleteDoc(doc(db, "oficinas", oficinaId, "equipe", id));
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">

      <header className="text-center">
        <h2 className="text-xl font-bold text-red-500">👥 GESTÃO DE EQUIPE</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
          Plano {configPlano.nome}: {membros.length} / {configPlano.membros === 999 ? '∞' : configPlano.membros} vagas
        </p>
      </header>

      {/* FORMULÁRIO DE CADASTRO / CONVITE */}
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
          <option value="Dono">🔑 Co-Administrador</option>
        </select>

        <button
          onClick={handleSalvar}
          className={`w-full py-3 rounded-lg font-bold transition-all active:scale-95 ${limiteAtingido ? 'bg-yellow-600' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {limiteAtingido ? '🚀 FAZER UPGRADE DE PLANO' : '➕ AUTORIZAR ACESSO'}
        </button>
      </div>

      {/* LISTAGEM DE EQUIPE */}
      <div className="w-full space-y-3">
        <h3 className="text-xs font-bold text-gray-500 ml-1">FUNCIONÁRIOS ATIVOS</h3>
        {membros.map((m) => (
          <div key={m.id} className="bg-neutral-900 border-l-4 border-red-600 p-3 rounded-r-xl flex items-center justify-between group">
            <div>
              <p className="font-bold text-sm">{m.nome}</p>
              <p className="text-[10px] text-gray-500 italic">{m.email}</p>
              <span className="text-[9px] bg-neutral-800 px-2 py-0.5 rounded text-red-400 uppercase">{m.cargo}</span>
            </div>
            <button onClick={() => handleExcluir(m.id)} className="text-neutral-700 hover:text-red-500 p-2 transition-colors">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}