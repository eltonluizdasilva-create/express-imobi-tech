import React, { useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useOficina } from './OficinaContext';

export default function LeadButton() {
  const { oficinaId } = useOficina() || {};
  const [aberto, setAberto] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [carro, setCarro] = useState('');
  const [problema, setProblema] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Controle do Microfone Nativo 🔥
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const recognitionRef = useRef(null);

  const ouvirCampo = (nomeCampo, setFuncaoEstado) => {
    if (!('webkitSpeechRecognition' in window)) return alert("Seu navegador não suporta gravação de voz. Use Chrome ou Edge.");

    // Se clicar no mesmo botão que já está a gravar, ele para.
    if (campoOuvindo === nomeCampo) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setCampoOuvindo(null);
      return;
    }

    if (recognitionRef.current) recognitionRef.current.stop();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setCampoOuvindo(nomeCampo);

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript;

      // Regras de formatação específicas por campo
      if (nomeCampo === 'telefone') {
        setFuncaoEstado(texto.replace(/\D/g, ''));
      } else if (nomeCampo === 'problema') {
        // No problema, a gente soma com o texto que já tem lá
        setFuncaoEstado(prev => prev ? prev + ", " + texto : texto);
      } else {
        setFuncaoEstado(texto);
      }
    };

    recognition.onerror = () => setCampoOuvindo(null);
    recognition.onend = () => setCampoOuvindo(null);

    recognition.start();
  };

  const handleSalvar = async () => {
    if (!nome || !telefone) return alert("Preencha pelo menos o Nome e o WhatsApp!");
    setSalvando(true);
    try {
      await addDoc(collection(db, "oficinas", oficinaId, "leads"), {
        nome,
        telefone: telefone.replace(/\D/g, ''),
        carro,
        problema,
        status: 'novo',
        data_criacao: new Date()
      });
      alert("✅ Lead salvo com sucesso!");
      setNome(''); setTelefone(''); setCarro(''); setProblema('');
      setAberto(false);

      // Tenta recarregar a página de Leads se o usuário estiver nela
      if (window.location.pathname.includes('/leads')) {
        window.location.reload();
      }
    } catch (e) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Se não tiver oficina (não logado), esconde o botão
  if (!oficinaId) return null;

  return (
    <>
      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setAberto(true)}
        style={{ position: 'fixed', bottom: '80px', right: '20px', background: '#00E676', color: 'black', width: '60px', height: '60px', borderRadius: '30px', border: 'none', boxShadow: '0 5px 15px rgba(0,230,118,0.4)', fontSize: '24px', cursor: 'pointer', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ⚡
      </button>

      {/* MODAL DO LEAD RÁPIDO */}
      {aberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '15px', padding: '25px', border: '2px solid #00E676', position: 'relative', boxShadow: '0 10px 40px rgba(0,230,118,0.2)' }}>

            <button onClick={() => setAberto(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>

            <h3 style={{ margin: '0 0 20px 0', color: '#00E676', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              ⚡ Novo Lead Rápido
            </h3>

            {/* CAMPO NOME */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Cliente *" style={{ flex: 1, padding: '15px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
              <button onClick={() => ouvirCampo('nome', setNome)} style={{ background: campoOuvindo === 'nome' ? '#00E676' : '#333', color: campoOuvindo === 'nome' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontSize: '18px', cursor: 'pointer' }}>
                {campoOuvindo === 'nome' ? '🔴' : '🎤'}
              </button>
            </div>

            {/* CAMPO TELEFONE */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))} placeholder="WhatsApp (Somente Números) *" style={{ flex: 1, padding: '15px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
              <button onClick={() => ouvirCampo('telefone', setTelefone)} style={{ background: campoOuvindo === 'telefone' ? '#00E676' : '#333', color: campoOuvindo === 'telefone' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontSize: '18px', cursor: 'pointer' }}>
                {campoOuvindo === 'telefone' ? '🔴' : '🎤'}
              </button>
            </div>

            {/* CAMPO VEÍCULO */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input type="text" value={carro} onChange={(e) => setCarro(e.target.value)} placeholder="Modelo do Veículo" style={{ flex: 1, padding: '15px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
              <button onClick={() => ouvirCampo('carro', setCarro)} style={{ background: campoOuvindo === 'carro' ? '#00E676' : '#333', color: campoOuvindo === 'carro' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontSize: '18px', cursor: 'pointer' }}>
                {campoOuvindo === 'carro' ? '🔴' : '🎤'}
              </button>
            </div>

            {/* CAMPO PROBLEMA */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <textarea value={problema} onChange={(e) => setProblema(e.target.value)} placeholder="Descrição do problema ou serviço..." rows={3} style={{ flex: 1, padding: '15px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'none' }} />
              <button onClick={() => ouvirCampo('problema', setProblema)} style={{ background: campoOuvindo === 'problema' ? '#00E676' : '#333', color: campoOuvindo === 'problema' ? 'black' : 'white', border: 'none', borderRadius: '8px', padding: '0 15px', fontSize: '18px', cursor: 'pointer' }}>
                {campoOuvindo === 'problema' ? '🔴' : '🎤'}
              </button>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setNome(''); setTelefone(''); setCarro(''); setProblema(''); }} style={{ flex: 1, padding: '15px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>LIMPAR</button>
              <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, padding: '15px', background: '#00E676', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {salvando ? '⏳ SALVANDO...' : '💾 SALVAR LEAD'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
