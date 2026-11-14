import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// 🚨 O seu e-mail de mestre que libera o acesso
const EMAIL_MASTER = 'eltonluizdasilva@gmail.com'; 

export default function ProtectedRouteMaster({ children }) {
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Se tiver usuário e o e-mail bater com o seu, autoriza!
      if (user && user.email === EMAIL_MASTER) {
        setAutorizado(true);
      } else {
        setAutorizado(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (loading) return <div className="min-h-screen bg-black" />;

  // Se não for você, chuta o cara para o login comum
  if (!autorizado) {
    return <Navigate to="/login-admin" replace />;
  }

  return children;
}