/**
 * src/lib/aiAuth.js — cabeçalhos do proxy /api/ai com o ID token do Firebase.
 * ============================================================================
 * `api/ai.js` exige `Authorization: Bearer <ID token>` por padrão (D-21.06),
 * igual a `api/places.js`. Este helper centraliza a obtenção do token para que
 * todo chamador do front envie credencial sem repetir código.
 *
 * Sem usuário logado devolve apenas o Content-Type: o servidor responde 401
 * `nao_autorizado` e o chamador mostra o erro — melhor que falhar em silêncio.
 * ============================================================================
 */

import { auth } from './firebase';

export async function cabecalhosIA() {
  const usuario = auth?.currentUser;
  let token = null;

  if (usuario) {
    try {
      token = await usuario.getIdToken();
    } catch {
      token = null;
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
