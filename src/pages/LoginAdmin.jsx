import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase'; // Ajuste o caminho se a sua pasta lib for diferente
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const loginComEmail = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/admin'); // A mágica: Se acertar a senha, joga para o painel
    } catch (error) {
      console.error("Erro no login:", error);
      setErro('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const loginComGoogle = async () => {
    setErro('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/admin'); // A mágica: Se logar com o Google, joga para o painel
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setErro('Acesso com Google cancelado ou falhou.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-neutral-800 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,255,85,0.05)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest text-white mb-2">ACESSO <span className="text-green-500">MASTER</span></h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">Área Exclusiva da Oficina</p>
        </div>

        {erro && <div className="bg-red-900/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-900/50">{erro}</div>}

        <form onSubmit={loginComEmail} className="space-y-4">
          <div>
            <label className="text-green-500 text-xs font-bold tracking-widest uppercase mb-1 block">E-mail Corporativo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-4 bg-[#111] border border-neutral-800 rounded-xl focus:border-green-500 outline-none text-white transition-colors" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="text-green-500 text-xs font-bold tracking-widest uppercase mb-1 block">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full p-4 bg-[#111] border border-neutral-800 rounded-xl focus:border-green-500 outline-none text-white tracking-[0.2em] transition-colors" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={carregando} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-sm tracking-widest mt-4">
            {carregando ? '⏳ AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-neutral-800"></div>
          <span className="text-neutral-500 text-xs font-bold px-4">OU</span>
          <div className="flex-1 h-[1px] bg-neutral-800"></div>
        </div>

        <button onClick={loginComGoogle} className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3.5 rounded-xl transition-colors text-sm tracking-widest flex items-center justify-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
          CONTINUAR COM GOOGLE
        </button>
      </div>
    </div>
  );
}