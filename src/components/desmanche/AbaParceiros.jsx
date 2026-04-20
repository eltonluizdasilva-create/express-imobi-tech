import React, { useState } from 'react';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

const COR = '#ef4444';

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#0d0d0d', border: '1px solid #2a2a2a',
  color: 'white', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box',
};

const btnPrimary = (cor = COR) => ({
  background: cor, color: 'white',
  border: 'none', borderRadius: '8px',
  padding: '11px 18px', fontWeight: '800',
  fontSize: '13px', cursor: 'pointer', letterSpacing: '0.5px',
});

const cardStyle = {
  background: 'linear-gradient(135deg,#111,#0d0d0d)',
  border: '1px solid #222', borderRadius: '14px',
  padding: '18px', marginBottom: '14px',
};

export default function AbaParceiros({
  db,
  oficinaId,
  parceiros,
  onReload,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const formInicial = { nome: '', telefone: '', cidade: '', responsavel: '', oficinaId: '' };
  const [form, setForm] = useState(formInicial);

  const agora = () => new Date().toISOString();

  const salvar = async () => {
    if (!form.nome.trim()) return alert('⚠️ Preencha o nome da oficina parceira!');
    setSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'), {
        ...form, data_registro: agora(),
      });
      setForm(formInicial);
      setMostrarForm(false);
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvando(false); }
  };

  const excluir = async (id) => {
    if (!window.confirm('Remover esta oficina parceira?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_parceiros', id));
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
          {parceiros.length} oficina(s) parceira(s)
        </p>
        <button onClick={() => { setForm(formInicial); setMostrarForm(true); }}
          style={btnPrimary()}>
          + Novo Parceiro
        </button>
      </div>

      {parceiros.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
          <p style={{ fontSize: '32px' }}>🔧</p>
          <p>Nenhuma oficina parceira cadastrada.</p>
        </div>
      )}

      {parceiros.map(p => (
        <div key={p.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '15px' }}>{p.nome}</h4>
              <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px 0' }}>
                📞 {p.telefone || '—'}
              </p>
              <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px 0' }}>
                📍 {p.cidade || '—'} {p.responsavel ? `• ${p.responsavel}` : ''}
              </p>
            </div>
            <button onClick={() => excluir(p.id)}
              style={{ ...btnPrimary('#1a1a1a'), color: '#ef444488', border: '1px solid #ef444422', padding: '8px 12px' }}>
              🗑️
            </button>
          </div>
        </div>
      ))}

      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.92)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: '#111', width: '100%', maxWidth: '420px',
            borderRadius: '16px', padding: '26px',
            border: `2px solid ${COR}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: COR, margin: 0 }}>🔧 Novo Parceiro</h3>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
              {[
                { label: 'Nome da Oficina *', key: 'nome' },
                { label: 'Telefone', key: 'telefone' },
                { label: 'Cidade', key: 'cidade' },
                { label: 'Responsável', key: 'responsavel' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input type="text" value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarForm(false)}
                style={{ ...btnPrimary('#2a2a2a'), color: '#888', flex: 1 }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                style={{ ...btnPrimary(), flex: 2, opacity: salvando ? 0.5 : 1 }}>
                {salvando ? '⏳ Salvando...' : '💾 Salvar Parceiro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}