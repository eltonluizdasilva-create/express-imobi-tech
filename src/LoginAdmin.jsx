import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './lib/firebase';

// Verifique se o caminho do firebase está correto para o seu projeto
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
      navigate('/admin');
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
      navigate('/admin');
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setErro('Acesso com Google cancelado ou falhou.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-red-900/50 p-8 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.1)] mb-6">

        {/* CABEÇALHO */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest text-white mb-2">
            ADMIN <span className="text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">IA</span>
          </h1>
          <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase">Área Restrita da Oficina</p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {erro && (
          <div className="bg-red-900/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center border border-red-900/50">
            {erro}
          </div>
        )}

        {/* FORMULÁRIO EMAIL/SENHA */}
        <form onSubmit={loginComEmail} className="space-y-4">
          <div>
            <label className="text-red-600 text-[11px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              📧 E-MAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 bg-[#111] border border-neutral-800 rounded-xl focus:border-red-500 outline-none text-white text-center tracking-wider transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-red-600 text-[11px] font-bold tracking-widest uppercase mb-2 mt-4 flex items-center gap-2">
              🔑 SENHA
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full p-4 bg-[#111] border border-neutral-800 rounded-xl focus:border-red-500 outline-none text-white text-center tracking-[0.3em] transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors text-sm tracking-widest mt-6 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            {carregando ? '⏳ ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        {/* DIVISÓRIA */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-neutral-800"></div>
          <span className="text-neutral-500 text-[10px] font-bold px-4 tracking-widest uppercase">Ou</span>
          <div className="flex-1 h-[1px] bg-neutral-800"></div>
        </div>

        {/* BOTÃO GOOGLE */}
        <button
          onClick={loginComGoogle}
          type="button"
          className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl transition-colors text-[11px] tracking-widest flex items-center justify-center gap-3 shadow-md"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
          ENTRAR COM O GOOGLE
        </button>

        {/* LINK CADASTRO */}
        <p className="text-center text-gray-600 text-[10px] mt-6">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-red-500 hover:text-red-400 font-bold transition-colors">
            Cadastre sua oficina grátis
          </a>
        </p>
      </div>

      {/* BOTAO VÍDEO TUTORIAL FLUTUANTE ABAIXO DO QUADRO DE LOGIN */}
      <a
        href="https://youtu.be/u5ufl4IrzlA"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '12px 24px',
          background: 'linear-gradient(to right, #111, #1a0505)',
          border: '1px solid #ef4444',
          borderRadius: '30px',
          color: '#ef4444',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.2)'
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = '#ef4444';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.4)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'linear-gradient(to right, #111, #1a0505)';
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.2)';
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
        COMO USAR O SISTEMA
      </a>

    </div>
  );
}