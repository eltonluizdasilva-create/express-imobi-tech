/* eslint-disable react/prop-types */
import { useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function useAuthListener({
  onLogin,
  onLogout,
  onMasterLogin,
  onBloqueado,
  onDadosOficina,
  onPapelPermissoes,
  onModulos,
  onTrial,
  onOnboarding,
}) {
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        onLogout();
        return;
      }

      onLogin(user.uid);

      if (user.email === import.meta.env.VITE_SU) {
        onMasterLogin(user.uid);
        return;
      }

      try {
        onSnapshot(doc(db, 'usuarios', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const dados = docSnap.data();
            if (dados.modulosOperacionais !== undefined) {
              onModulos(dados.modulosOperacionais);
            }
            if (dados.dataFimTrial) {
              const fim = dados.dataFimTrial.toDate ? dados.dataFimTrial.toDate() : new Date(dados.dataFimTrial);
              onTrial(fim);
            }
            if (dados.onboardingFeito === false) {
              onOnboarding(true);
            }
          }
        });

        const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
        if (docSnap.exists()) {
          const dados = docSnap.data();
          const userOficinaId = dados.papel === 'dono' ? user.uid : dados.oficinaId;
          if (userOficinaId) {
            const oficinaSnap = await getDoc(doc(db, 'oficinas', userOficinaId));
            if (oficinaSnap.exists()) {
              const oficina = oficinaSnap.data();
              onDadosOficina({ ...oficina, id: userOficinaId });
              if (oficina.ativo === false) { onBloqueado('bloqueado'); return; }
              if (oficina.plano === 'trial') {
                const fim = oficina.trialFim?.toDate ? oficina.trialFim.toDate() : new Date(oficina.trialFim);
                if (fim < new Date()) { onBloqueado('trial'); return; }
              }
            }
          }
          onPapelPermissoes(dados.papel || 'dono', dados.permissoes || null);
        } else {
          onPapelPermissoes('dono', null);
          onDadosOficina({ id: user.uid, nome: 'Minha Oficina', plano: 'trial' });
        }
      } catch {
        onPapelPermissoes('dono', null);
      }

      onLogin(user.uid);
    });

    return () => unsubscribe();
  }, []);
}
