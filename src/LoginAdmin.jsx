import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './lib/firebase';

// Importações necessárias para a trava de segurança
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginAdmin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  // Função para verificar se o usuário está autorizado no sistema
  const verificarAutorizacao = async (user) => {
    if (!user) return false;
    const emailNormalizado = (typeof user === 'string' ? user : user?.email || '').toLowerCase().trim();

    // 1. A SUA CHAVE MESTRA: Coloque todos os seus e-mails de dono do sistema aqui
    const emailsAdminsMaster = [
      "elton.luizdasilva@hotmail.com",
      "elton.luizdasilva@gmail.com"
    ];

    if (emailNormalizado && emailsAdminsMaster.includes(emailNormalizado)) return true;

    try {
      const uid = user.uid;
      if (!uid) return false;

      // 2. Consulta direta getDoc em usuarios/{uid} e oficinas/{uid}
      // Leituras diretas (get) permitidas pelas regras do Firestore para o próprio usuário autenticado
      const userRef = doc(db, "usuarios", uid);
      const oficinaRef = doc(db, "oficinas", uid);

      const [userSnap, oficinaSnap] = await Promise.all([
        getDoc(userRef),
        getDoc(oficinaRef)
      ]);

      if (userSnap.exists()) {
        const dadosUser = userSnap.data() || {};
        if (dadosUser.oficinaId) return true;
      }

      if (oficinaSnap.exists()) return true;

      return false;
    } catch (e) {
      console.error("Erro na verificação:", e);
      return false;
    }
  };

  const loginComEmail = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      // 1. Autenticação de senha
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);

      // 2. Trava de Segurança: Verificar permissão total passando o objeto user
      const autorizado = await verificarAutorizacao(userCredential.user);

      if (!autorizado) {
        await signOut(auth);
        setErro('🚫 Acesso Negado: Este e-mail não está autorizado por nenhuma imobiliária.');
        return;
      }

      navigate('/admin');
    } catch (error) {
      console.error("Erro no login:", error);
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-login-credentials'
      ) {
        setErro('E-mail ou senha incorretos. Verifique seus dados.');
      } else if (error.code === 'auth/invalid-email') {
        setErro('Formato de e-mail inválido.');
      } else if (error.code === 'auth/too-many-requests') {
        setErro('Muitas tentativas sem sucesso. Aguarde alguns instantes e tente novamente.');
      } else if (error.code === 'auth/network-request-failed') {
        setErro('Falha de conexão com a rede. Verifique sua internet.');
      } else if (error.code === 'permission-denied') {
        setErro('Permissão negada ao acessar os dados da conta.');
      } else {
        setErro(error.message || 'Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const loginComGoogle = async () => {
    setErro('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verifica se é a primeira vez do usuário (se o documento não existe)
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Documento pessoal: apenas identidade e vínculo com a organização
        await setDoc(userRef, {
          nome: user.displayName || "Usuário",
          email: user.email,
          papel: 'dono',
          oficinaId: user.uid,
          modulos: {
            administrador_ia: true
          },
          dataCriacao: serverTimestamp()
        });

        // Organização: fonte única de plano/IA (plano gratuito válido conforme regras do Firestore)
        await setDoc(doc(db, "oficinas", user.uid), {
          uid: user.uid,
          nome: user.displayName || "Minha Imobiliária",
          nomeOficina: user.displayName || "Minha Imobiliária",
          email: user.email,
          plano: 'gratuito',
          nivelInteligencia: 'padrao',
          ativo: true,
          criadoEm: serverTimestamp()
        }, { merge: true });
      }

      const autorizado = await verificarAutorizacao(user);

      if (!autorizado) {
        await signOut(auth);
        setErro('🚫 Este e-mail Google não está autorizado no sistema.');
        return;
      }

      navigate('/admin');
    } catch (error) {
      console.error("Erro no login com Google:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErro('Acesso com Google cancelado.');
      } else if (error.code === 'auth/network-request-failed') {
        setErro('Falha de conexão com a rede. Verifique sua internet.');
      } else if (error.code === 'permission-denied') {
        setErro('Permissão negada ao registrar dados da conta.');
      } else {
        setErro(error.message || 'Acesso com Google cancelado ou falhou.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#020408] border border-[#10b981]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.12)] mb-6 mt-6">

        {/* CABEÇALHO */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest text-white mb-2">
            ADMIN <span className="text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">IA</span>
          </h1>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">ÁREA RESTRITA DA IMOBILIÁRIA / CORRETOR</p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {erro && (
          <div className="bg-emerald-900/20 text-[#10b981] p-3 rounded-lg mb-6 text-sm text-center border border-[#10b981]/40 animate-pulse">
            {erro}
          </div>
        )}

        {/* FORMULÁRIO EMAIL/SENHA */}
        <form onSubmit={loginComEmail} className="space-y-4">
          <div>
            <label className="text-[#10b981] text-[11px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              📧 E-MAIL AUTORIZADO
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 bg-[#0a0f18] border border-slate-800 rounded-xl focus:border-[#10b981] outline-none text-white text-center tracking-wider transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-[#10b981] text-[11px] font-bold tracking-widest uppercase mb-2 mt-4 flex items-center gap-2">
              🔑 SENHA
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full p-4 bg-[#0a0f18] border border-slate-800 rounded-xl focus:border-[#10b981] outline-none text-white text-center tracking-[0.3em] transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-[#10b981] hover:bg-emerald-400 text-[#020408] font-black py-4 rounded-xl transition-colors text-sm tracking-widest mt-6 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            {carregando ? '⏳ VERIFICANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 h-[1px] bg-slate-800"></div>
          <span className="text-slate-500 text-[10px] font-bold px-4 tracking-widest uppercase">Ou</span>
          <div className="flex-1 h-[1px] bg-slate-800"></div>
        </div>

        <button
          onClick={loginComGoogle}
          type="button"
          className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl transition-colors text-[11px] tracking-widest flex items-center justify-center gap-3 shadow-md cursor-pointer"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
          ENTRAR COM O GOOGLE
        </button>

        <p className="text-center text-gray-500 text-[10px] mt-6">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-[#10b981] hover:text-emerald-400 font-bold transition-colors">
            Cadastre sua imobiliária ou corretor grátis
          </a>
        </p>

        <div className="mt-8 pt-6 border-t border-slate-900 text-center">
          <a
            href="/portal"
            className="text-gray-500 hover:text-[#10b981] text-[11px] font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            ← VOLTAR AO PORTAL DO CLIENTE
          </a>
        </div>
      </div>
    </div>
  );
}
