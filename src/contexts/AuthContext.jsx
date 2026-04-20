import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [logado, setLogado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [papelLogado, setPapelLogado] = useState(null);
  const [permissoesLogado, setPermissoesLogado] = useState(null);
  const [dadosOficina, setDadosOficina] = useState(null);
  const [bloqueado, setBloqueado] = useState(null);
  const [modulosOperacionais, setModulosOperacionais] = useState([]);
  const [dataFimTrial, setDataFimTrial] = useState(null);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLogado(false);
        setCurrentUser(null);
        setCurrentUserId(null);
        setPapelLogado(null);
        setDadosOficina(null);
        setMostrarOnboarding(false);
        setCarregandoAuth(false);
        return;
      }

      setCurrentUser(user);
      setCurrentUserId(user.uid);
      setLogado(true);

      try {
        const isMaster = user.email === import.meta.env.VITE_SU;
        const docSnap = await getDoc(doc(db, 'usuarios', user.uid));

        if (docSnap.exists()) {
          const dados = docSnap.data();
          const userOficinaId = dados.oficinaId || (dados.papel === 'dono' ? user.uid : null);

          if (isMaster) {
            setPapelLogado('master');
            setMostrarOnboarding(false);
          } else {
            setPapelLogado(dados.papel || 'dono');
            setMostrarOnboarding(dados.onboardingFeito === false);
          }

          if (userOficinaId) {
            const oficinaSnap = await getDoc(doc(db, 'oficinas', userOficinaId));
            if (oficinaSnap.exists()) {
              setDadosOficina({ ...oficinaSnap.data(), id: userOficinaId });
            }
          }
        } else if (isMaster) {
          setPapelLogado('master');
          setMostrarOnboarding(false);
          setDadosOficina({ id: user.uid, plano: 'master', nome: 'Admin Master' });
        }
        setCarregandoAuth(false);
      } catch (err) {
        console.error("Erro Auth:", err);
        setCarregandoAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fazerLogin = useCallback(async (email, senha) => {
    setErroLogin('');
    try {
      await signInWithEmailAndPassword(getAuth(), email, senha);
      return true;
    } catch (error) {
      console.error('Erro no login por email:', error);
      setErroLogin('Nao foi possivel entrar com email e senha. Verifique os dados e tente novamente.');
      return false;
    }
  }, []);

  const fazerLoginGoogle = useCallback(async () => {
    setErroLogin('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(getAuth(), provider);
      return true;
    } catch (error) {
      console.error('Erro no login com Google:', error);
      setErroLogin('Nao foi possivel entrar com Google. Tente novamente em alguns instantes.');
      return false;
    }
  }, []);

  const fazerLogout = useCallback(() => {
    signOut(getAuth()).then(() => { window.location.href = '/'; });
  }, []);

  const value = useMemo(() => ({
    logado, carregandoAuth, loading: carregandoAuth, currentUser, currentUserId, papelLogado, permissoesLogado,
    dadosOficina, bloqueado, modulosOperacionais, dataFimTrial, mostrarOnboarding,
    emailInput, setEmailInput, senhaInput, setSenhaInput, erroLogin, setErroLogin,
    setDadosOficina, setBloqueado, setModulosOperacionais, setDataFimTrial, setMostrarOnboarding,
    fazerLogin, fazerLoginGoogle, fazerLogout,
  }), [logado, carregandoAuth, currentUser, currentUserId, papelLogado, permissoesLogado, dadosOficina, bloqueado,
    modulosOperacionais, dataFimTrial, mostrarOnboarding, emailInput, senhaInput, erroLogin, fazerLogin, fazerLoginGoogle, fazerLogout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
