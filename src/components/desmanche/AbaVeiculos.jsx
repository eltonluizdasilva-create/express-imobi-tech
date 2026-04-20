import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { uploadImages } from './uploadImage';

const COR = '#ef4444';
const COR2 = '#f97316';
const VERDE = '#00E676';

const statusCor = {
  em_desmonte: '#ef4444',
  desmontado: '#00E676',
  encerrado: '#666',
};

const PATIOS = ['Todos', 'Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'];

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#0d0d0d', border: '1px solid #2a2a2a',
  color: 'white', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box',
};

const btnPrimary = (cor = COR) => ({
  background: cor, color: cor === VERDE ? 'black' : 'white',
  border: 'none', borderRadius: '8px',
  padding: '11px 18px', fontWeight: '800',
  fontSize: '13px', cursor: 'pointer', letterSpacing: '0.5px',
});

const cardStyle = {
  background: 'linear-gradient(135deg,#111,#0d0d0d)',
  border: '1px solid #222', borderRadius: '14px',
  padding: '18px', marginBottom: '14px',
};

export default function AbaVeiculos({
  db,
  oficinaId,
  veiculos,
  pecas,
  onReload,
  onAbrirLightbox,
  onPublicarChegada,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [patioFiltro, setPatioFiltro] = useState('Todos');
  const [ouvindo, setOuvindo] = useState(false);

  const formInicial = {
    modelo: '', ano: '', cor: '', placa: '',
    valorLeilao: '', procedencia: '', patio: '',
    detalhes: '', fotos: [], status: 'em_desmonte',
  };
  const [form, setForm] = useState(formInicial);

  const veiculosFiltrados = veiculos.filter(v =>
    patioFiltro === 'Todos' || v.patio === patioFiltro
  );

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const urls = await uploadImages(files, oficinaId, 'desmanche');
    setForm(prev => ({ ...prev, fotos: [...prev.fotos, ...urls] }));
  };

  const iniciarVoz = (fieldKey) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
      return alert('Use o Chrome para reconhecimento de voz.');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.onstart = () => setOuvindo(true);
    rec.onresult = e => setForm(prev => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || '') + ' ' + e.results[0][0].transcript,
    }));
    rec.onend = () => setOuvindo(false);
    rec.start();
  };

  const salvar = async () => {
    if (!form.modelo.trim()) return alert('⚠️ Preencha o modelo do veículo!');
    setSalvando(true);
    try {
      const dados = { ...form, data_entrada: new Date().toISOString() };
      if (editando) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', editando), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos'), {
          ...dados, data_registro: new Date().toISOString(),
        });
      }
      setForm(formInicial);
      setEditando(null);
      setMostrarForm(false);
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvando(false); }
  };

  const editar = (v) => {
    setForm({
      modelo: v.modelo || '', ano: v.ano || '', cor: v.cor || '',
      placa: v.placa || '', valorLeilao: v.valorLeilao || '',
      procedencia: v.procedencia || '', patio: v.patio || '',
      detalhes: v.detalhes || '', fotos: v.fotos || [],
      status: v.status || 'em_desmonte',
    });
    setEditando(v.id);
    setMostrarForm(true);
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir este veículo do desmanche?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', id));
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
          {PATIOS.map(p => (
            <button key={p} onClick={() => setPatioFiltro(p)} style={{
              padding: '7px 14px', borderRadius: '20px',
              background: patioFiltro === p ? COR2 : '#1a1a1a',
              color: patioFiltro === p ? 'white' : '#666',
              border: `1px solid ${patioFiltro === p ? COR2 : '#2a2a2a'}`,
              fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
            }}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm(formInicial); setEditando(null); setMostrarForm(true); }}
          style={btnPrimary()}>
          + Novo Veículo
        </button>
      </div>

      {veiculosFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
          <p style={{ fontSize: '32px' }}>🚗</p>
          <p>Nenhum veículo cadastrado neste pátio.</p>
        </div>
      )}

      {veiculosFiltrados.map(carro => {
        const pecasDoCarro = pecas.filter(p => p.veiculoId === carro.id);
        const pecasDispCarro = pecasDoCarro.filter(p => p.status === 'disponivel').length;
        const pecasVendCarro = pecasDoCarro.filter(p => p.status === 'vendida').length;
        const receitaCarro = pecasDoCarro.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
        return (
          <div key={carro.id} style={{ ...cardStyle, borderLeft: `4px solid ${statusCor[carro.status] || '#333'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h4 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{carro.modelo} {carro.ano}</h4>
                  <span style={{
                    background: `${statusCor[carro.status] || '#333'}22`,
                    color: statusCor[carro.status] || '#666',
                    padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                  }}>
                    {carro.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  {carro.publicado && (
                    <span style={{ background: '#00E67622', color: VERDE, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                      ✅ PUBLICADO
                    </span>
                  )}
                </div>
                <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px 0' }}>
                  🎨 {carro.cor || '—'} &nbsp;·&nbsp; 📍 {carro.patio || '—'} &nbsp;·&nbsp; 🔑 {carro.placa || '—'}
                </p>
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 6px 0' }}>
                  🏷️ Leilão: <span style={{ color: COR, fontWeight: 'bold' }}>R$ {Number(carro.valorLeilao || 0).toLocaleString('pt-BR')}</span>
                  &nbsp;·&nbsp; 📦 Procedência: {carro.procedencia || '—'}
                </p>
                {carro.detalhes && (
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontStyle: 'italic' }}>📝 {carro.detalhes}</p>
                )}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#f97316' }}>
                    🔩 {pecasDispCarro} peças disp.
                  </span>
                  <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: VERDE }}>
                    💰 Receita: R$ {Number(receitaCarro).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#555' }}>
                    ✅ {pecasVendCarro} vendidas
                  </span>
                </div>
              </div>
              {(carro.fotos || []).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '200px' }}>
                  {carro.fotos.slice(0, 4).map((f, i) => (
                    <img key={i} src={f} alt="foto" onClick={() => onAbrirLightbox?.(carro.fotos, i)}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #333', flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => editar(carro)} style={{ ...btnPrimary('#333'), color: '#aaa', border: '1px solid #333' }}>
                ✏️ Editar
              </button>
              <button onClick={() => onPublicarChegada?.(carro)}
                style={{ ...btnPrimary('#1a1a1a'), color: '#25D366', border: '1px solid #25D36644' }}>
                📣 Avisar Parceiros
              </button>
              <button onClick={() => excluir(carro.id)}
                style={{ ...btnPrimary('#1a1a1a'), color: '#ef444488', border: '1px solid #ef444422' }}>
                🗑️
              </button>
            </div>
          </div>
        );
      })}

      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.92)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: '#111', width: '100%', maxWidth: '520px',
            borderRadius: '16px', padding: '26px',
            border: `2px solid ${COR}`, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: COR, margin: 0 }}>{editando ? '✏️ Editar Veículo' : '🚗 Novo Veículo'}</h3>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {[
                { label: 'Modelo *', key: 'modelo', type: 'text', full: true },
                { label: 'Ano', key: 'ano', type: 'text' },
                { label: 'Cor', key: 'cor', type: 'text' },
                { label: 'Placa', key: 'placa', type: 'text' },
                { label: 'Valor Leilão (R$)', key: 'valorLeilao', type: 'number' },
                { label: 'Procedência', key: 'procedencia', type: 'text' },
              ].map(({ label, key, type, full }) => (
                <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                  <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Pátio</label>
              <select value={form.patio} onChange={e => setForm(p => ({ ...p, patio: e.target.value }))}
                style={{ ...inputStyle }}>
                <option value=''>Selecionar...</option>
                {['Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'].map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ ...inputStyle }}>
                <option value='em_desmonte'>Em Desmonte</option>
                <option value='desmontado'>Desmontado</option>
                <option value='encerrado'>Encerrado</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Detalhes / Observações</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={form.detalhes}
                  onChange={e => setForm(p => ({ ...p, detalhes: e.target.value }))}
                  rows={3} style={{ ...inputStyle, resize: 'none' }} />
                <button onClick={() => iniciarVoz('detalhes')}
                  style={{ ...btnPrimary(ouvindo ? COR : '#333'), padding: '0 14px', fontSize: '18px' }}>
                  {ouvindo ? '🔴' : '🎤'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '8px' }}>Fotos</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {(form.fotos || []).map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={f} alt="foto" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }} />
                    <button onClick={() => setForm(p => ({ ...p, fotos: p.fotos.filter((_, j) => j !== i) }))}
                      style={{ position: 'absolute', top: '-6px', right: '-6px', background: COR, color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ))}
                <label style={{ width: '64px', height: '64px', background: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px', color: '#555', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  +
                  <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setMostrarForm(false)}
                style={{ ...btnPrimary('#2a2a2a'), color: '#888', flex: 1 }}>
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando}
                style={{ ...btnPrimary(), flex: 2, opacity: salvando ? 0.5 : 1 }}>
                {salvando ? '⏳ Salvando...' : '💾 Salvar Veículo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}