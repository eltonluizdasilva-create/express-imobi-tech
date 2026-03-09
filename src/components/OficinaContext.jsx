import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const OficinaContext = createContext();

export function OficinaProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [oficinaId, setOficinaId] = useState(null);
  const [iniciado, setIniciado] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'usuarios', user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUsuario({ uid: user.uid, ...userData });
            setOficinaId(userData.oficinaId);
          } else {
            // 🛠️ CORREÇÃO: Se a conta for o seu Master, ele usa o seu próprio UID como "Oficina Base"
            setUsuario({ uid: user.uid, papel: 'master' });
            setOficinaId(user.uid); 
          }
        } catch (error) {
          console.error("Erro no Contexto:", error);
          setOficinaId(user.uid); // Salva-vidas
        }
      } else {
        setUsuario(null);
        setOficinaId(null);
      }
      setIniciado(true);
    });

    return () => unsubscribe();
  }, []);

  if (!iniciado) {
    return <div style={{ background: 'black', height: '100vh', width: '100vw' }}></div>;
  }

  return (
    <OficinaContext.Provider value={{ usuario, oficinaId }}>
      {children}
    </OficinaContext.Provider>
  );
}

export function useOficina() {
  const context = useContext(OficinaContext);
  if (!context) {
    console.warn("useOficina chamado fora do provedor!");
    return {};
  }
  return context;
}