/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

const ESTADO_INICIAL = {
  nome: '',
  endereco: '',
  telefone: '',
  logoUrl: '',
  pixKey: '',
};

export default function Configuracoes({ oficinaId, onSalvo }) {
  const [config, setConfig] = useState(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      if (!oficinaId) return;
      const snap = await getDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'geral'));
      if (snap.exists()) {
        setConfig((prev) => ({ ...prev, ...snap.data() }));
      }
    }

    carregar();
  }, [oficinaId]);

  const atualizarCampo = (campo, valor) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

  const salvar = async () => {
    if (!oficinaId) return;

    setSalvando(true);
    try {
      await setDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'geral'), config, { merge: true });
      if (onSalvo) await onSalvo();
      alert('Configurações da oficina salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '18px', padding: '22px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '22px', fontWeight: '900' }}>⚙️ CONFIG DA OFICINA</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.5' }}>
          Atualize a identidade da oficina para refletir automaticamente no portal do cliente, recibo e botão de PIX.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>NOME DA OFICINA</label>
          <input
            type="text"
            value={config.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '10px' }}
          />
        </div>

        <div>
          <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>ENDEREÇO</label>
          <input
            type="text"
            value={config.endereco}
            onChange={(e) => atualizarCampo('endereco', e.target.value)}
            style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '10px' }}
          />
        </div>

        <div>
          <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>TELEFONE / WHATSAPP</label>
          <input
            type="text"
            value={config.telefone}
            onChange={(e) => atualizarCampo('telefone', e.target.value)}
            style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '10px' }}
          />
        </div>

        <div>
          <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>LOGOMARCA (URL)</label>
          <input
            type="text"
            value={config.logoUrl}
            onChange={(e) => atualizarCampo('logoUrl', e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '10px' }}
          />
        </div>

        {config.logoUrl && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>PRÉVIA DA LOGOMARCA</p>
            <img src={config.logoUrl} alt="Logomarca da oficina" style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} />
          </div>
        )}

        <div>
          <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>CHAVE PIX</label>
          <input
            type="text"
            value={config.pixKey}
            onChange={(e) => atualizarCampo('pixKey', e.target.value)}
            style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #222', color: '#fff', borderRadius: '10px' }}
          />
        </div>
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        style={{ width: '100%', marginTop: '22px', padding: '16px', background: '#FF0033', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}
      >
        {salvando ? 'SALVANDO...' : '💾 SALVAR CONFIGURAÇÕES'}
      </button>
    </div>
  );
}
