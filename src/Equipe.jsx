import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

const NIVEL_ACESSO = [
  { value: 'mecanico', label: 'Mecânico (Apenas Operacional)', cor: '#6366f1' },
  { value: 'atendimento', label: 'Atendimento (O.S. e Clientes)', cor: '#f59e0b' },
  { value: 'gerente', label: 'Gerente (Acesso Total)', cor: '#22c55e' },
];

export default function Equipe({ oficinaId, dadosOficina }) {
  const [nome, setNome] = useState('');
  const [emailFuncionario, setEmailFuncionario] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState('mecanico');
  const [membros, setMembros] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!oficinaId) return;
    const q = collection(db, 'oficinas', oficinaId, 'equipe');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembros(lista);
    });
    return () => unsubscribe();
  }, [oficinaId]);

  const handleSalvar = async () => {
    if (!nome.trim()) { alert('Preencha o nome do funcionário.'); return; }
    if (!emailFuncionario.trim()) { alert('Preencha o e-mail de login.'); return; }

    setSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'equipe'), {
        nome: nome.trim(),
        email: emailFuncionario.toLowerCase().trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        nivelAcesso,
        dataCadastro: new Date().toISOString(),
      });
      setNome('');
      setEmailFuncionario('');
      setWhatsapp('');
      setNivelAcesso('mecanico');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Remover este membro da equipe?')) {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'equipe', id));
    }
  };

  const getNivel = (valor) => NIVEL_ACESSO.find(n => n.value === valor) || NIVEL_ACESSO[0];

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-40 font-sans">
      {/* HEADER */}
      <div className="bg-zinc-900 rounded-[40px] border border-zinc-800 p-8 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight text-red-500 mb-1">
          👥 Gestão de Equipe
        </h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
          Gerencie acessos e permissões dos membros
        </p>
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-6 mb-6">
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-4">Novo Membro</p>

        <div className="space-y-3">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do Funcionário"
            className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
          />

          <input
            type="email"
            value={emailFuncionario}
            onChange={(e) => setEmailFuncionario(e.target.value)}
            placeholder="E-mail de Login (Obrigatório)"
            className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
          />

          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="WhatsApp (DDD + Número)"
            className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
          />

          <select
            value={nivelAcesso}
            onChange={(e) => setNivelAcesso(e.target.value)}
            className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white outline-none focus:border-red-500 transition-colors"
          >
            {NIVEL_ACESSO.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? 'Salvando...' : '➕ Autorizar Acesso'}
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest px-1">
          {membros.length} membro{membros.length !== 1 ? 's' : ''} cadastrado{membros.length !== 1 ? 's' : ''}
        </p>

        {membros.length === 0 ? (
          <div className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-10 text-center">
            <p className="text-zinc-600 font-black text-xs uppercase tracking-widest">Nenhum membro cadastrado</p>
            <p className="text-zinc-800 text-[10px] mt-1">Use o formulário acima para adicionar.</p>
          </div>
        ) : (
          membros.map((membro) => {
            const nivel = getNivel(membro.nivelAcesso);
            return (
              <div key={membro.id} className="bg-zinc-900 rounded-[20px] border border-zinc-800 p-5 flex items-center gap-4 group hover:border-zinc-700 transition-all">
                {/* AVATAR */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
                  style={{ background: `${nivel.cor}22`, border: `2px solid ${nivel.cor}44`, color: nivel.cor }}
                >
                  {membro.nome?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{membro.nome}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{membro.email}</p>
                  <div
                    className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                    style={{ background: `${nivel.cor}22`, color: nivel.cor }}
                  >
                    {nivel.label}
                  </div>
                </div>

                {/* DELETE */}
                <button
                  onClick={() => handleExcluir(membro.id)}
                  className="w-9 h-9 bg-zinc-800 hover:bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-all opacity-50 hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
