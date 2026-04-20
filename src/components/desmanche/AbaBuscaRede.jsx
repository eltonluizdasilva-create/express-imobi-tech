import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';

const COR = '#ef4444';

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#0d0d0d', border: '1px solid #2a2a2a',
  color: 'white', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box',
};

const btnPrimary = () => ({
  background: COR, color: 'white',
  border: 'none', borderRadius: '8px',
  padding: '11px 18px', fontWeight: '800',
  fontSize: '13px', cursor: 'pointer', letterSpacing: '0.5px',
});

const cardStyle = {
  background: 'linear-gradient(135deg,#111,#0d0d0d)',
  border: '1px solid #222', borderRadius: '14px',
  padding: '18px', marginBottom: '14px',
};

export default function AbaBuscaRede({ db }) {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);

  const buscarNaRede = async () => {
    if (!busca.trim()) return;
    setBuscando(true);
    setResultados([]);
    try {
      const snap = await getDocs(collection(db, 'desmanche_global'));
      const encontrados = [];
      snap.docs.forEach(d => {
        const data = d.data();
        (data.veiculos_publicados || []).forEach(v => {
          const nomeOk = v.modelo?.toLowerCase().includes(busca.toLowerCase());
          if (nomeOk) {
            encontrados.push({
              ...v,
              nomeOficina: data.nomeOficina,
              telefone: data.telefone,
              desmancheId: d.id,
            });
          }
        });
      });
      setResultados(encontrados);
    } catch (e) { console.error(e); alert('Erro na busca: ' + e.message); }
    finally { setBuscando(false); }
  };

  const iniciarVoz = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
      return alert('Use o Chrome para reconhecimento de voz.');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.onstart = () => setOuvindo(true);
    rec.onresult = e => setBusca(e.results[0][0].transcript);
    rec.onend = () => setOuvindo(false);
    rec.start();
  };

  const formatarTel = (tel) => {
    if (!tel) return '';
    const nums = tel.replace(/\D/g, '');
    return nums.startsWith('55') ? tel : `55${nums}`;
  };

  return (
    <div>
      <div style={{ ...cardStyle, borderColor: `${COR}33`, marginBottom: '20px' }}>
        <h3 style={{ color: COR, margin: '0 0 6px 0' }}>🔍 Buscar Veículo / Peça na Rede</h3>
        <p style={{ color: '#555', fontSize: '12px', margin: '0 0 16px 0' }}>
          Pesquise em todos os desmanches parceiros cadastrados na plataforma.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text" value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarNaRede()}
            placeholder="Ex: Civic 2018, Gol, porta dianteira..."
            style={{ ...inputStyle, flex: 1, fontSize: '15px', padding: '13px 14px' }}
          />
          <button onClick={iniciarVoz}
            style={{ ...btnPrimary(), padding: '0 16px', fontSize: '20px', background: ouvindo ? COR : '#2a2a2a' }}>
            {ouvindo ? '🔴' : '🎤'}
          </button>
          <button onClick={buscarNaRede} disabled={buscando || !busca.trim()}
            style={{ ...btnPrimary(), padding: '12px 20px', opacity: buscando ? 0.6 : 1 }}>
            {buscando ? '⏳' : '🔍 Buscar'}
          </button>
        </div>
      </div>

      {buscando && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#555' }}>
          <p>Buscando...</p>
        </div>
      )}

      {!buscando && resultados.length === 0 && busca && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
          <p style={{ fontSize: '32px' }}>🔍</p>
          <p>Nenhum resultado encontrado.</p>
        </div>
      )}

      {resultados.map((v, i) => (
        <div key={i} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '15px' }}>{v.modelo} {v.ano}</h4>
              <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px 0' }}>
                🏪 {v.nomeOficina} &nbsp;·&nbsp; 📍 {v.patio || '—'}
              </p>
              {v.detalhes && (
                <p style={{ color: '#555', fontSize: '12px', margin: '0 0 8px 0', fontStyle: 'italic' }}>📝 {v.detalhes}</p>
              )}
              {(v.fotos || []).length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {v.fotos.slice(0, 3).map((f, idx) => (
                    <img key={idx} src={f} alt="foto" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #333' }} />
                  ))}
                </div>
              )}
            </div>
            {v.telefone && (
              <a href={`https://wa.me/${formatarTel(v.telefone)}?text=${encodeURIComponent(`Olá! Vi${v.modelo} no app. Tem peças disponíveis?`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ background: '#25D366', color: 'black', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                📱 WhatsApp
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}