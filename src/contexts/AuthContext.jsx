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
import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { isPlanoPro } from '../lib/planos';

const AuthContext = createContext(null);

/**
 * FONTE ÚNICA DA VERDADE (Plano, Faturamento e IA):
 * Coleção raiz da organização `oficinas/{id}`.
 * O documento pessoal `usuarios/{uid}` é usado APENAS para identidade/vínculo
 * (oficinaId, papel, permissões, onboarding) e NUNCA para isPro, plano, creditosIA ou nivelInteligencia.
 */
export const COLECAO_ORGANIZACAO = 'oficinas';

export const DEFAULT_NIVEL_INTELIGENCIA = 'padrao';
/** Fallback exibido quando o backend ainda não provisionou `creditosIA` (somente leitura). */
export const CREDITOS_IA_FALLBACK = 0;
/** Franquia de referência usada apenas para escala visual da barra de progresso. */
export const FRANQUIA_BASE_CREDITOS_IA = 1000;
export const DEFAULT_LIMITE_USUARIOS = 1;



const normalizarNivel = (valor) =>
  valor === 'avancado' || valor === 'padrao' ? valor : DEFAULT_NIVEL_INTELIGENCIA;

/**
 * `creditosIA` é ESTRITAMENTE SOMENTE LEITURA no frontend.
 * Saldo, recargas e descontos são gravados exclusivamente pelo backend (Webhook n8n).
 */
const normalizarCreditos = (valor) =>
  typeof valor === 'number' && !Number.isNaN(valor) ? Math.max(0, valor) : CREDITOS_IA_FALLBACK;

const normalizarLimite = (valor) =>
  typeof valor === 'number' && !Number.isNaN(valor) && valor > 0 ? valor : DEFAULT_LIMITE_USUARIOS;

/**
 * Lê o documento raiz da organização (`oficinas/{id}`).
 * - Se existir: apenas LÊ e normaliza (nenhuma escrita de campos de faturamento/IA).
 * - Se não existir: cria o documento mínimo da organização SEM `creditosIA`, `limiteUsuarios` ou `isPro`
 *   (esses campos são provisionados pelo backend).
 */
export async function gerenciarDocumentoImobiliaria(oficinaId, dadosBase = {}) {
  if (!oficinaId) return null;
  const oficinaRef = doc(db, COLECAO_ORGANIZACAO, oficinaId);
  const oficinaSnap = await getDoc(oficinaRef);

  if (oficinaSnap.exists()) {
    const ofiData = oficinaSnap.data() || {};
    return {
      ...ofiData,
      id: oficinaId,
      nivelInteligencia: normalizarNivel(ofiData.nivelInteligencia),
      creditosIA: normalizarCreditos(ofiData.creditosIA),
      limiteUsuarios: normalizarLimite(ofiData.limiteUsuarios),
    };
  }

  const nomeOrg = dadosBase.nome || 'Minha Imobiliária';
  const novoDocRaiz = {
    uid: oficinaId,
    plano: dadosBase.plano || 'grátis',
    nome: nomeOrg,
    nomeOficina: nomeOrg,
    ativo: true,
    nivelInteligencia: DEFAULT_NIVEL_INTELIGENCIA,
  };

  try {
    await setDoc(oficinaRef, novoDocRaiz, { merge: true });
  } catch (e) {
    console.warn('Aviso ao criar documento raiz da organização:', e?.message);
  }

  return {
    ...novoDocRaiz,
    id: oficinaId,
    creditosIA: CREDITOS_IA_FALLBACK,
    limiteUsuarios: DEFAULT_LIMITE_USUARIOS,
  };
}

export function AuthProvider({ children }) {
  const [logado, setLogado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isMasterConta, setIsMasterConta] = useState(false);
  const [papelLogado, setPapelLogado] = useState(null);
  const [permissoesLogado, setPermissoesLogado] = useState(null);
  const [dadosOficina, setDadosOficina] = useState(null);
  const [nivelInteligencia, setNivelInteligencia] = useState(DEFAULT_NIVEL_INTELIGENCIA);
  // Saldo de IA: somente leitura (atualizado apenas pelo onSnapshot do documento da organização)
  const [creditosIA, setCreditosIASomenteSnapshot] = useState(CREDITOS_IA_FALLBACK);
  const [limiteUsuarios, setLimiteUsuarios] = useState(DEFAULT_LIMITE_USUARIOS);
  const [membrosEquipe, setMembrosEquipe] = useState([]);
  const [bloqueado, setBloqueado] = useState(null);
  const [modulosOperacionais, setModulosOperacionais] = useState([]);
  const [dataFimTrial, setDataFimTrial] = useState(null);
  const [trialExpirou, setTrialExpirou] = useState(false);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  useEffect(() => {
    const auth = getAuth();
    let unsubOficina = null;
    let unsubEquipe = null;

    const aplicarDadosOrganizacao = (orgId, data) => {
      const nivelSinc = normalizarNivel(data.nivelInteligencia);
      const creditosSinc = normalizarCreditos(data.creditosIA);
      const limiteSinc = normalizarLimite(data.limiteUsuarios);

      setNivelInteligencia(nivelSinc);
      setCreditosIASomenteSnapshot(creditosSinc);
      setLimiteUsuarios(limiteSinc);
      setDadosOficina((prev) => ({
        ...(prev || {}),
        ...data,
        id: orgId,
        nivelInteligencia: nivelSinc,
        creditosIA: creditosSinc,
        limiteUsuarios: limiteSinc,
      }));

      if (data.trialFim) setDataFimTrial(data.trialFim);
      else if (data.dataFimTrial) setDataFimTrial(data.dataFimTrial);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubOficina) {
        unsubOficina();
        unsubOficina = null;
      }
      if (unsubEquipe) {
        unsubEquipe();
        unsubEquipe = null;
      }

      if (!user) {
        setLogado(false);
        setCurrentUser(null);
        setCurrentUserId(null);
        setIsMasterConta(false);
        setPapelLogado(null);
        setDadosOficina(null);
        setNivelInteligencia(DEFAULT_NIVEL_INTELIGENCIA);
        setCreditosIASomenteSnapshot(CREDITOS_IA_FALLBACK);
        setLimiteUsuarios(DEFAULT_LIMITE_USUARIOS);
        setMembrosEquipe([]);
        setMostrarOnboarding(false);
        setCarregandoAuth(false);
        return;
      }

      setCurrentUser(user);
      setCurrentUserId(user.uid);
      setLogado(true);

      try {
        const isMaster = user.email === import.meta.env.VITE_SU;
        setIsMasterConta(isMaster);

        // Documento pessoal: usado SOMENTE para identidade/vínculo com a organização
        const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
        let targetOficinaId = user.uid;
        let nomeBase = isMaster ? 'Admin Master' : 'Nova Imobiliária';

        if (docSnap.exists()) {
          const dados = docSnap.data();
          targetOficinaId = dados.oficinaId || user.uid;
          if (dados.nome && !isMaster) nomeBase = dados.nome;

          if (isMaster) {
            setPapelLogado('master');
            setMostrarOnboarding(false);
          } else {
            setPapelLogado(dados.papel || 'dono');
            setMostrarOnboarding(dados.onboardingFeito === false);
            setPermissoesLogado(dados.permissoes || {});
          }

          if (Array.isArray(dados.modulosOperacionais)) {
            setModulosOperacionais(dados.modulosOperacionais);
          }
        } else {
          // 🚀 BLINDAGEM 3: usuário sem documento pessoal.
          // Grava o vínculo usuarios/{uid}.oficinaId — nunca depender de localStorage.
          setPapelLogado(isMaster ? 'master' : 'dono');
          setMostrarOnboarding(!isMaster);
          try {
            await setDoc(doc(db, 'usuarios', user.uid), {
              uid: user.uid,
              oficinaId: user.uid,
              email: user.email || '',
              papel: isMaster ? 'master' : 'dono',
              criadoEm: new Date(),
            }, { merge: true });
          } catch (e) {
            console.warn('Não foi possível gravar usuarios/{uid}.oficinaId:', e?.message);
          }
        }

        // Repara vínculo ausente em documento que já existia
        if (docSnap.exists() && !docSnap.data()?.oficinaId) {
          try {
            await setDoc(doc(db, 'usuarios', user.uid), { oficinaId: user.uid }, { merge: true });
            targetOficinaId = user.uid;
          } catch (e) {
            console.warn('Não foi possível reparar usuarios/{uid}.oficinaId:', e?.message);
          }
        }

        // Documento da organização: fonte única de plano, isPro, creditosIA e nivelInteligencia
        const ofiConsolidada = await gerenciarDocumentoImobiliaria(targetOficinaId, {
          plano: isMaster ? 'master' : 'grátis',
          nome: nomeBase,
        });

        if (ofiConsolidada) {
          aplicarDadosOrganizacao(targetOficinaId, ofiConsolidada);
        }

        // Listener em tempo real (somente leitura) do documento da organização
        unsubOficina = onSnapshot(
          doc(db, COLECAO_ORGANIZACAO, targetOficinaId),
          (snap) => {
            if (!snap.exists()) return;
            aplicarDadosOrganizacao(targetOficinaId, snap.data() || {});
          },
          (err) => console.warn('Aviso listener tempo real organização:', err?.message)
        );

        // Listener em tempo real na subcoleção `equipe` da organização
        unsubEquipe = onSnapshot(
          collection(db, COLECAO_ORGANIZACAO, targetOficinaId, 'equipe'),
          (snap) => {
            const listaEquipe = (snap?.docs || []).map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            setMembrosEquipe(listaEquipe);
          },
          (err) => console.warn('Aviso listener tempo real subcoleção equipe:', err?.message)
        );
      } catch (err) {
        console.error('Erro Auth:', err);
      } finally {
        // 🚀 A GARANTIA FINAL: Independente do que aconteça, tira a tela de "Identificando"
        setCarregandoAuth(false);
      }
    });
    return () => {
      if (unsubOficina) unsubOficina();
      if (unsubEquipe) unsubEquipe();
      unsubscribe();
    };
  }, []);

  // isPro derivado EXCLUSIVAMENTE do documento da organização (+ conta master da plataforma via env)
  const isPro = useMemo(() => {
    if (isMasterConta) return true;
    if (typeof dadosOficina?.isPro === 'boolean') return dadosOficina.isPro;
    if (dadosOficina?.planoAssinante === true) return true;
    const planoNorm = String(dadosOficina?.plano || '').trim().toLowerCase();
    if (
      !planoNorm ||
      planoNorm === 'gratis' ||
      planoNorm === 'grátis' ||
      planoNorm === 'gratuito' ||
      planoNorm === 'free' ||
      planoNorm === 'trial'
    ) {
      return false;
    }
    return isPlanoPro(planoNorm);
  }, [dadosOficina, isMasterConta]);

  const quantidadeAtualCorretores = useMemo(
    () => (Array.isArray(membrosEquipe) ? membrosEquipe.length : 0),
    [membrosEquipe]
  );

  /**
   * ÚNICA escrita de IA permitida no frontend: `nivelInteligencia` no documento da organização.
   * Sempre usa a organização autenticada (não aceita IDs externos) e respeita o bloqueio PRO.
   */
  const atualizarNivelInteligencia = useCallback(
    async (novoNivel) => {
      const nivelValido = novoNivel === 'avancado' ? 'avancado' : 'padrao';
      const targetId = dadosOficina?.id;

      if (!targetId) return false;
      if (nivelValido === 'avancado' && !isPro) {
        throw new Error('Motor PRO disponível apenas para organizações com plano PRO.');
      }

      const nivelAnterior = nivelInteligencia;
      setNivelInteligencia(nivelValido);

      try {
        await setDoc(
          doc(db, COLECAO_ORGANIZACAO, targetId),
          { nivelInteligencia: nivelValido },
          { merge: true }
        );
        return true;
      } catch (err) {
        setNivelInteligencia(nivelAnterior);
        console.error('Erro ao atualizar nivelInteligencia no Firestore:', err);
        throw err;
      }
    },
    [dadosOficina?.id, isPro, nivelInteligencia]
  );

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
    logado,
    carregandoAuth,
    loading: carregandoAuth,
    currentUser,
    currentUserId,
    papelLogado,
    permissoesLogado,
    dadosOficina,
    dadosImobiliaria: dadosOficina,
    nivelInteligencia,
    creditosIA, // somente leitura — sem setter exposto
    limiteUsuarios,
    membrosEquipe,
    setMembrosEquipe,
    quantidadeAtualCorretores,
    isPro,
    atualizarNivelInteligencia,
    bloqueado,
    modulosOperacionais,
    dataFimTrial,
    trialExpirou,
    mostrarOnboarding,
    emailInput,
    setEmailInput,
    senhaInput,
    setSenhaInput,
    erroLogin,
    setErroLogin,
    setDadosOficina,
    setDadosImobiliaria: setDadosOficina,
    setBloqueado,
    setModulosOperacionais,
    setDataFimTrial,
    setTrialExpirou,
    setMostrarOnboarding,
    fazerLogin,
    fazerLoginGoogle,
    fazerLogout,
  }), [
    logado,
    carregandoAuth,
    currentUser,
    currentUserId,
    papelLogado,
    permissoesLogado,
    dadosOficina,
    nivelInteligencia,
    creditosIA,
    limiteUsuarios,
    membrosEquipe,
    quantidadeAtualCorretores,
    isPro,
    atualizarNivelInteligencia,
    bloqueado,
    modulosOperacionais,
    dataFimTrial,
    trialExpirou,
    mostrarOnboarding,
    emailInput,
    senhaInput,
    erroLogin,
    fazerLogin,
    fazerLoginGoogle,
    fazerLogout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
