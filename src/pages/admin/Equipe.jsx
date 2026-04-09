import React, { useState, useEffect } from 'react';
import { db, auth } from './lib/firebase';
import { collection, setDoc, doc, onSnapshot, query, deleteDoc } from 'firebase/firestore';
import { useOficina } from './components/OficinaContext';

const REGRAS_PLANOS = {
  essencial: { membros: 3, nome: 'Essencial' },
  profissional: { membros: 5, nome: 'Profissional' },
  especialista: { membros: 8, nome: 'Especialista' },
  master: { membros: 99, nome: 'Master IA' },
  planoPrimeIA: { membros: 99, nome: 'Prime IA' }
};

// MÓDULOS QUE O DONO PODE ESCOLHER
const MODULOS_DISPONIVEIS = [
  { id: 'os', nome: 'Ordens de Serviço (O.S.)', icone: '📝' },
  { id: 'estoque', nome: 'Estoque / Peças', icone: '📦' },
  { id: 'financeiro', nome: 'Financeiro / Caixa', icone: '💰' },
  { id: 'clientes', nome: 'Base de Clientes', icone: '👥' },
  { id: 'relatorios', nome: 'Relatórios / Dashboard', icone: '📊' }
];

export default function Equipe({ setModalUpgradeAberto, dataFimTrial }) {
  const { oficinaId, dadosOficina } = useOficina() || {};

  const isTrial = dataFimTrial && new Date(dataFimTrial) > new Date();

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [emailFuncionario, setEmailFuncionario] = useState('');
  const [cargo, setCargo] = useState('Mecânico');
  const [whatsapp, setWhatsapp] = useState('');
  const [permissoes, setPermissoes] = useState(['os']); // Todo mundo começa com a aba O.S. marcada

  const [membros, setMembros] = useState([]);
  const [limiteAtingido, setLimiteAtingido] = useState(false);

  const planoAtual = dadosOficina?.plano || 'essencial';
  let configPlano = REGRAS_PLANOS[planoAtual] || REGRAS_PLANOS.essencial;

  if (isTrial) {
    configPlano = REGRAS_PLANOS.ultimate;
  }

  // Carregar Equipe em Tempo Real
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

  // Marcar e desmarcar as caixinhas de permissão
  const togglePermissao = (modId) => {
    if (permissoes.includes(modId)) {
      setPermissoes(permissoes.filter(p => p !== modId));
    } else {
      setPermissoes([...permissoes, modId]);
    }
  };

  // Salvar Novo Membro com as Permissões
  const handleSalvar = async () => {
    if (!nome || !emailFuncionario || !whatsapp) {
      alert("⚠️ Preencha todos os campos obrigatórios!");
      return;
    }

    if (permissoes.length === 0) {
      alert("⚠️ Escolha pelo menos um módulo para este funcionário acessar.");
      return;
    }

    if (membros.length >= configPlano.membros) {
      if (isTrial) {
        alert("🎉 Você está usando o período de teste com acesso total do plano Prime IA. Adicione sua equipe livremente!");
      } else if (planoAtual === 'master' || planoAtual === 'planoPrimeIA') {
        // Ignora o bloqueio
      } else {
        alert(`🚀 Seu plano ${configPlano.nome} permite até ${configPlano.membros} funcionários.`);
        if (setModalUpgradeAberto) setModalUpgradeAberto(true);
      }
      return;
    }

    try {
      const emailTratado = emailFuncionario.toLowerCase().trim();
      const senhaTemporaria = "oficina123";

      const apiKey = auth.app.options.apiKey;
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTratado,
          password: senhaTemporaria,
          returnSecureToken: true
        })
      });

      const data = await res.json();

      if (data.error) {
        if (data.error.message === 'EMAIL_EXISTS') {
          alert("⚠️ Este e-mail já tem uma conta no sistema!");
        } else {
          alert("❌ Erro ao criar login: " + data.error.message);
        }
        return;
      }

      const novoUid = data.localId;

      await setDoc(doc(db, "oficinas", oficinaId, "equipe", novoUid), {
        nome,
        email: emailTratado,
        cargo,
        whatsapp: whatsapp.replace(/\D/g, ''),
        permissoes: permissoes, // Salva as abas que o dono escolheu!
        dataCadastro: new Date().toISOString(),
        oficinaId: oficinaId
      });

      alert(`✅ Conta criada com sucesso!\n\nE-mail: ${emailTratado}\nSenha: ${senhaTemporaria}`);
      limparCampos();
    } catch (error) {
      alert("❌ Erro ao autorizar: " + error.message);
    }
  };

  const limparCampos = () => {
    setNome(''); setEmailFuncionario(''); setWhatsapp(''); setCargo('Mecânico'); setPermissoes(['os']);
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente remover este membro da equipe?")) {
      await deleteDoc(doc(db, "oficinas", oficinaId, "equipe", id));
    }
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
          {isTrial ? 'Período de Teste (Acesso Total)' : `Plano ${configPlano.nome}`}: {membros.length} / {configPlano.membros === 999 ? '∞' : configPlano.membros} vagas
        </p>
      </header>

      <div className={`w-full bg-neutral-900 border ${limiteAtingido ? 'border-yellow-600' : 'border-neutral-800'} p-4 rounded-xl space-y-4`}>
        <div className="space-y-3">
          <input
            type="text" value={nome} onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do Funcionário"
            autoComplete="off" // Repelente de fantasma
            className="w-full p-3 bg-black border border-neutral-700 rounded-lg text-sm outline-none focus:border-red-500"
          />
          <input
            type="email" value={emailFuncionario} onChange={(e) => setEmailFuncionario(e.target.value)}
            placeholder="E-mail de Login (Obrigatório)"
            autoComplete="off" // Repelente de fantasma
            className="w-full p-3 bg-black border border-neutral-700 rounded-lg text-sm outline-none focus:border-red-500"
          />
          <input
            type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp (DDD + Número)"
            autoComplete="off" // Repelente de fantasma
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
        </div>

        {/* NOVA ÁREA: SELEÇÃO DE ABAS */}
        <div className="pt-2 border-t border-neutral-800">
          <h3 className="text-xs font-bold text-gray-400 mb-3 tracking-widest">PERMISSÕES DE ACESSO (ABAS)</h3>
          <div className="grid grid-cols-2 gap-2">
            {MODULOS_DISPONIVEIS.map(mod => (
              <label key={mod.id} className="flex items-center space-x-2 bg-black p-2 rounded border border-neutral-800 cursor-pointer hover:border-neutral-600">
                <input
                  type="checkbox"
                  checked={permissoes.includes(mod.id)}
                  onChange={() => togglePermissao(mod.id)}
                  className="accent-red-500"
                />
                <span className="text-[10px] text-gray-300">{mod.icone} {mod.nome}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSalvar}
          className={`w-full py-3 rounded-lg font-bold transition-all mt-2 active:scale-95 ${limiteAtingido ? 'bg-yellow-600' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {limiteAtingido ? '🚀 FAZER UPGRADE DE PLANO' : '➕ AUTORIZAR ACESSO'}
        </button>
      </div>

      <div className="w-full space-y-3">
        <h3 className="text-xs font-bold text-gray-500 ml-1">FUNCIONÁRIOS ATIVOS</h3>
        {membros.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Nenhum membro cadastrado.</p>
        ) : (
          membros.map((membro) => (
            <div key={membro.id} className="bg-neutral-900 border-l-4 border-red-600 p-3 rounded-r-xl flex flex-col group gap-2">
              <div className="flex items-center justify-between">
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
                <button onClick={() => handleExcluir(membro.id)} className="text-neutral-700 hover:text-red-500 p-2 transition-colors">
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mt-1 pl-12">
                {membro.permissoes && membro.permissoes.map(p => (
                  <span key={p} className="text-[8px] bg-neutral-800 text-gray-400 px-1.5 py-0.5 rounded uppercase">
                    {MODULOS_DISPONIVEIS.find(m => m.id === p)?.nome || p}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}