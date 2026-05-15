/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
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
  const [excluindo, setExcluindo] = useState(false);

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

  const handleExcluirConta = async () => {
    if (!oficinaId) return;

    const confirmacao1 = window.confirm(
      "🚨 ATENÇÃO MÁXIMA! 🚨\n\nVocê está prestes a excluir permanentemente a sua oficina e TODOS os seus dados vinculados.\nEsta ação é irreversível nos termos da LGPD.\n\nTem certeza absoluta que deseja prosseguir?"
    );
    if (!confirmacao1) return;

    const confirmacao2 = window.prompt(
      'Para confirmar a exclusão definitiva em cascata, digite exatamente a palavra "EXCLUIR" em letras maiúsculas:'
    );
    if (confirmacao2 !== "EXCLUIR") {
      alert("Confirmação incorreta. Ação cancelada por segurança.");
      return;
    }

    setExcluindo(true);
    try {
      console.log("Iniciando limpeza em cascata para oficina:", oficinaId);

      // Subcoleções mapeadas do Firestore vinculadas à oficina
      const subcolecoes = [
        'os',
        'estoque',
        'retornos',
        'burocracias',
        'descartes',
        'relatorios_mensais',
        'configuracoes',
        'funcionarios',
        'despesas',
        'equipe'
      ];

      // 1. Deleta documentos de cada subcoleção concorrentemente
      await Promise.all(subcolecoes.map(async (subColNome) => {
        try {
          const colRef = collection(db, 'oficinas', oficinaId, subColNome);
          const snap = await getDocs(colRef);
          await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
          console.log(`Limpeza concluída: subcoleção /${subColNome}`);
        } catch (err) {
          console.warn(`Aviso na limpeza da subcoleção /${subColNome}:`, err);
        }
      }));

      // 2. Deleta o documento raiz da oficina
      await deleteDoc(doc(db, 'oficinas', oficinaId));
      console.log("Documento raiz da oficina deletado.");

      // 3. Deleta documento de usuário no Firestore (se houver)
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          await deleteDoc(doc(db, 'usuarios', user.uid));
          console.log("Dados do usuário no Firestore deletados.");
        } catch (err) {
          console.warn("Erro ao apagar dados extras de usuário:", err);
        }

        // 4. Exclusão da Conta Auth Engine do Firebase
        try {
          await deleteUser(user);
          console.log("Conta de Autenticação deletada com sucesso.");
        } catch (err) {
          console.warn("Aviso Auth: deleteUser falhou ou exige login recente.", err);
          if (err.code === 'auth/requires-recent-login') {
             alert("Por motivos de segurança do Firebase, esta operação exige que você tenha feito login recentemente. Por favor, faça logout, logue de novo e repita o processo.");
             setExcluindo(false);
             return;
          }
        }
      }

      alert("Todos os seus dados foram apagados permanentemente em conformidade com a LGPD! Redirecionando...");
      window.location.href = '/';
    } catch (error) {
      console.error("Erro crítico na deleção cascata LGPD:", error);
      alert("Erro ao excluir dados: " + error.message);
    } finally {
      setExcluindo(false);
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

      {/* 🔒 ÁREA DE PRIVACIDADE E LGPD */}
      <div style={{
        marginTop: '30px',
        borderTop: '1px dashed #222',
        paddingTop: '30px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#00E676' }}>🔒</span> Segurança e Privacidade (LGPD)
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '12px', lineHeight: 1.5 }}>
            Como titular dos dados, você possui o <strong>Direito ao Esquecimento</strong> digital. Você pode solicitar a eliminação permanente e definitiva de todas as suas informações dos nossos servidores a qualquer momento.
          </p>
        </div>

        <button
          onClick={handleExcluirConta}
          disabled={excluindo || salvando}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(255, 49, 49, 0.05)',
            border: '1px solid rgba(255, 49, 49, 0.3)',
            color: '#FF3131',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '900',
            cursor: 'pointer',
            transition: '0.2s',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {excluindo ? 'DELETANDO TUDO EM CASCATA...' : '⚠️ Excluir Minha Conta e Dados Permanentemente'}
        </button>
      </div>
    </div>
  );
}
