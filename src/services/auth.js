// src/services/auth.js
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

export const login = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Erro no login:", error);
    return { 
      success: false, 
      error: getErrorMessage(error.code) 
    };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: error.message };
  }
};

export const observeAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

const getErrorMessage = (code) => {
  const errors = {
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-email': 'Email inválido',
    'auth/user-disabled': 'Usuário desativado',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde',
    'auth/invalid-credential': 'Credenciais inválidas'
  };
  return errors[code] || 'Erro de autenticação';
};