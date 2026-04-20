import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { uploadImages } from './uploadImage';

const COR = '#ef4444';
const COR2 = '#f97316';
const VERDE = '#00E676';

const condicaoCor = {
  otima: '#00E676',
  boa: '#eab308',
  regular: '#f97316',
  sucata: '#ef4444',
};

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

export default function AbaPecas({
  db,
  oficinaId,
  pecas,
  veiculos,
  onReload,
  onAbrirLightbox,
  onVenderPeca,
  dadosOficina,
  carregarFinanceiro,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ouvindo, setOuvindo] = useState(false);

  const formInicial = {
    nome: '', veiculoId: '', veiculoNome: '',
    preco: '', condicao: 'otima', codigo: '',
    prateleira: '', fotos: [], status: 'disponivel',
    descricao: '',
  };
  const [form, setForm] = useState(formInicial);

  const pecasFiltradas = pecas.filter(p => {
    const bOk = !busca ||
      p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.veiculoNome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busca.toLowerCase());
    const sOk = filtroStatus === 'todos' || p.status === filtroStatus;
    return bOk && sOk;
  });

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

  const formatarMoeda = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const agora = () => new Date().toISOString();

  const salvar = async () => {
    if (!form.nome.trim()) return alert('⚠️ Preencha o nome da peça!');
    setSalvando(true);
    try {
      const dados = { ...form, data_registro: agora() };
      if (editando) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', editando), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), dados);
      }
      setForm(formInicial);
      setEditando(null);
      setMostrarForm(false);
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvando(false); }
  };

  const editar = (p) => {
    setForm({
      nome: p.nome || '', veiculoId: p.veiculoId || '',
      veiculoNome: p.veiculoNome || '', preco: p.preco || '',
      condicao: p.condicao || 'otima', codigo: p.codigo || '',
      prateleira: p.prateleira || '', fotos: p.fotos || [],
      status: p.status || 'disponivel', descricao: p.descricao || '',
    });
    setEditando(p.id);
    setMostrarForm(true);
  };

  const vender = async (peca) => {
    if (!window.confirm(`Marcar "${peca.nome}" como VENDIDA por R$ ${formatarMoeda(peca.preco)}?`)) return;
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', peca.id), {
        status: 'vendida', data_venda: agora(),
      });
      await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        tipo: 'entrada',
        descricao: `🚗 Venda peça desmanche: ${peca.nome}${peca.veiculoNome ? ` (${peca.veiculoNome})` : ''}`,
        valor: Number(peca.preco) || 0,
        formaPagamento: 'desmanche',
        data: agora(),
        data_registro: agora(),
      });
      if (carregarFinanceiro) await carregarFinanceiro();
      if (onReload) onReload();
      alert('✅ Peça vendida! Valor lançado automaticamente no Financeiro.');
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir esta peça?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', id));
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar peça, código, veículo..."
          style={{ ...inputStyle, flex: 1, minWidth: '180px', padding: '10px 14px' }}
        />
        {['todos', 'disponivel', 'vendida', 'reservada'].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)} style={{
            padding: '8px 14px', borderRadius: '20px',
            background: filtroStatus === s ? (s === 'disponivel' ? VERDE : s === 'vendida' ? COR : '#f97316') : '#1a1a1a',
            color: filtroStatus === s ? (s === 'disponivel' ? 'black' : 'white') : '#666',
            border: `1px solid ${filtroStatus === s ? 'transparent' : '#2a2a2a'}`,
            fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
          }}>
            {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button onClick={() => { setForm(formInicial); setEditando(null); setMostrarForm(true); }}
          style={btnPrimary(COR2)}>
          + Nova Peça
        </button>
      </div>

      <p style={{ color: '#555', fontSize: '12px', marginBottom: '14px' }}>
        {pecasFiltradas.length} peça(s) encontrada(s)
      </p>

      {pecasFiltradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
          <p style={{ fontSize: '32px' }}>🔩</p>
          <p>Nenhuma peça encontrada.</p>
        </div>
      )}

      {pecasFiltradas.map(peca => (
        <div key={peca.id} style={{
          ...cardStyle,
          borderLeft: `4px solid ${peca.status === 'vendida' ? VERDE : peca.status === 'reservada' ? '#f97316' : '#333'}`,
          opacity: peca.status === 'vendida' ? 0.7 : 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h4 style={{ color: 'white', margin: 0, fontSize: '15px' }}>{peca.nome}</h4>
                <span style={{
                  background: `${condicaoCor[peca.condicao] || '#333'}22`,
                  color: condicaoCor[peca.condicao] || '#666',
                  padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold',
                }}>
                  {peca.condicao?.toUpperCase()}
                </span>
                <span style={{
                  background: peca.status === 'vendida' ? '#00E67622' : '#1a1a1a',
                  color: peca.status === 'vendida' ? VERDE : '#666',
                  padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold',
                }}>
                  {peca.status?.toUpperCase()}
                </span>
              </div>
              <p style={{ color: '#555', fontSize: '12px', margin: '0 0 4px 0' }}>
                🚗 {peca.veiculoNome || '—'} &nbsp;·&nbsp; 🏷️ Código: {peca.codigo || '—'} &nbsp;·&nbsp; 📦 Prateleira: {peca.prateleira || '—'}
              </p>
              {peca.descricao && (
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 6px 0', fontStyle: 'italic' }}>📝 {peca.descricao}</p>
              )}
              <p style={{ color: VERDE, fontSize: '18px', fontWeight: '900', margin: 0 }}>
                R$ {formatarMoeda(peca.preco)}
              </p>
            </div>
            {(peca.fotos || []).length > 0 && (
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                {peca.fotos.slice(0, 3).map((f, i) => (
                  <img key={i} src={f} alt="foto" onClick={() => onAbrirLightbox?.(peca.fotos, i)}
                    style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #2a2a2a' }} />
                ))}
              </div>
            )}
          </div>

          {peca.status !== 'vendida' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => editar(peca)} style={{ ...btnPrimary('#2a2a2a'), color: '#aaa', border: '1px solid #333' }}>
                ✏️ Editar
              </button>
              <button onClick={() => vender(peca)} style={btnPrimary(VERDE)}>
                💰 Vender
              </button>
              <button onClick={() => excluir(peca.id)} style={{ ...btnPrimary('#1a1a1a'), color: '#ef444488', border: '1px solid #ef444422' }}>
                🗑️
              </button>
            </div>
          )}
          {peca.status === 'vendida' && peca.data_venda && (
            <p style={{ color: '#444', fontSize: '11px', marginTop: '8px', margin: '8px 0 0 0' }}>
              ✅ Vendida em {new Date(peca.data_venda).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      ))}

      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.92)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div style={{
            background: '#111', width: '100%', maxWidth: '520px',
            borderRadius: '16px', padding: '26px',
            border: `2px solid ${COR2}`, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: COR2, margin: 0 }}>{editando ? '✏️ Editar Peça' : '🔩 Nova Peça'}</h3>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Veículo de Origem</label>
              <select value={form.veiculoId}
                onChange={e => {
                  const v = veiculos.find(v => v.id === e.target.value);
                  setForm(p => ({ ...p, veiculoId: e.target.value, veiculoNome: v ? `${v.modelo} ${v.ano}` : '' }));
                }}
                style={inputStyle}>
                <option value=''>Nenhum / Peça avulsa</option>
                {veiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.modelo} {v.ano}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {[
                { label: 'Nome da Peça *', key: 'nome', type: 'text', full: true },
                { label: 'Preço (R$)', key: 'preco', type: 'number' },
                { label: 'Código / Ref.', key: 'codigo', type: 'text' },
                { label: 'Prateleira / Local', key: 'prateleira', type: 'text' },
              ].map(({ label, key, type, full }) => (
                <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                  <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{label}</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type={type} value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      style={inputStyle} />
                    {key === 'nome' && (
                      <button onClick={() => iniciarVoz('nome')}
                        style={{ ...btnPrimary(ouvindo ? COR : '#2a2a2a'), padding: '0 12px', fontSize: '16px' }}>
                        {ouvindo ? '🔴' : '🎤'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Condição</label>
                <select value={form.condicao} onChange={e => setForm(p => ({ ...p, condicao: e.target.value }))}
                  style={inputStyle}>
                  <option value='otima'>Ótima</option>
                  <option value='boa'>Boa</option>
                  <option value='regular'>Regular</option>
                  <option value='sucata'>Sucata</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={inputStyle}>
                  <option value='disponivel'>Disponível</option>
                  <option value='reservada'>Reservada</option>
                  <option value='vendida'>Vendida</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Descrição / Observações</label>
              <textarea value={form.descricao}
                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '8px' }}>Fotos</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(form.fotos || []).map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={f} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2a2a2a' }} />
                    <button onClick={() => setForm(p => ({ ...p, fotos: p.fotos.filter((_, j) => j !== i) }))}
                      style={{ position: 'absolute', top: '-5px', right: '-5px', background: COR, color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ))}
                <label style={{ width: '60px', height: '60px', background: '#1a1a1a', border: '2px dashed #2a2a2a', borderRadius: '8px', color: '#444', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                style={{ ...btnPrimary(COR2), flex: 2, opacity: salvando ? 0.5 : 1 }}>
                {salvando ? '⏳ Salvando...' : '💾 Salvar Peça'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}