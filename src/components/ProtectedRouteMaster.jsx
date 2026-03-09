import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

// Seu UID de Master (Hotmail)
const UID_MASTER = 'R1ZPF4yTucNLDRgPrGR2skD7fXf1';

export default function ProtectedRouteMaster({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === UID_MASTER) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ background: 'black', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FF0033', fontWeight: 'bold' }}>
        Verificando credenciais de Master...
      </div>
    );
  }

  // Se for você, libera a tela. Se não for, chuta para a tela de login/admin
  return isAuthorized ? children : <Navigate to="/admin" replace />;
}