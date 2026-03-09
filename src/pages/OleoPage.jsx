/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useGemini } from '../hooks/useGemini';
import { useOficina } from '../components/OficinaContext';

const MAIN_COLOR = "#FF0033";
const KM_COLOR = "#eab308";
const GREEN_MONEY = "#00E676";

const CATEGORIAS = [
  { id: 'carro', label: '🚗 CARRO', dias: 180 },
  { id: 'moto', label: '🏍️ MOTO', dias: 90 },
  { id: 'pesado', label: '🚛 PESADO', dias: 180 },
];

const KITS = [
  { id: 'normal', label: '🟢 KIT NORMAL', desc: 'Sintético + Filtro' },
  { id: 'severo', label: '🚥 KIT SEVERO', desc: 'Uso intenso + Filtros' },
];

const SERVICOS_EXTRAS = [
  { id: 'oleo_cambio', label: '⚙️ Óleo Câmbio' },
  { id: 'filtro_ar', label: '🌬️ Filtro Ar' },
  { id: 'filtro_cabine', label: '❄️ Filtro Cabine' },
  { id: 'filtro_comb', label: '⛽ Filtro Comb.' },
  { id: 'higienizacao', label: '🧼 Higienização' },
  { id: 'revisao_geral', label: '🔍 Revisão Geral' },
];

export default function OleoPage() {
  const { oficinaId } = useOficina() || {};
  const { analyzeImage } = useGemini();

  // Categoria e kit
  const [categoria, setCategoria] = useState('carro');
  const [kit, setKit] = useState('normal');
  const [servicosExtras, setServicosExtras] = useState([]);

  // Dados do cliente/veículo
  const [placa, setPlaca] = useState('');
  const [litros, setLitros] = useState('');
  const [tipoOleo, setTipoOleo] = useState('5W30 Sintético');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [modelo, setModelo] = useState('');

  // KM e foto do painel
  const [fotoPainel, setFotoPainel] = useState(null);
  const [kmAtual, setKmAtual] = useState('');
  const [kmProxima, setKmProxima] = useState('');
  const [lendoKm, setLendoKm] = useState(false);

  // Voz
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const recognitionRef = useRef(null);

  // Status
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const categoriaSelecionada = CATEGORIAS.find(c => c.id === categoria);

  const calcularProximaTroca = (km) => {
    const base = Number(km);
    if (!base) return '';
    const intervalo = categoria === 'moto' ? 5000 : kit === 'severo' ? 7500 : 10000;
    return String(base + intervalo);
  };

  const toggleServico = (id) => {
    setServicosExtras(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const ouvirCampo = (nomeCampo, setFn, modo = 'substituir') => {
    if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para usar o microfone.');
    if (campoOuvindo === nomeCampo) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setCampoOuvindo(null);
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    recognitionRef.current = rec;
    rec.onstart = () => setCampoOuvindo(nomeCampo);
    rec.onresult = (e) => {
      const texto = e.results[0][0].transcript;
      if (nomeCampo === 'placa') setFn(texto.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      else if (nomeCampo === 'telefone') setFn(texto.replace(/\D/g, ''));
      else if (modo === 'adicionar') setFn(prev => prev ? prev + ', ' + texto : texto);
      else setFn(texto);
    };
    rec.onerror = () => setCampoOuvindo(null);
    rec.onend = () => setCampoOuvindo(null);
    rec.start();
  };

  const comprimirFoto = (base64, qualidade = 0.5) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.src = base64;
    });
  };

  const handleFotoPainel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFoto(reader.result);
      setFotoPainel(comprimida);
      setLendoKm(true);
      setKmAtual('🤖 Lendo...');
      try {
        const kmLido = await analyzeImage(
          'Leia o odômetro/quilometragem mostrado neste painel de veículo. Responda APENAS com o número, sem texto. Exemplo: 54321',
          comprimida
        );
        const numero = kmLido.replace(/\D/g, '');
        setKmAtual(numero || '');
        if (numero) setKmProxima(calcularProximaTroca(numero));
      } catch {
        setKmAtual('');
      } finally {
        setLendoKm(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Atualiza próxima troca quando KM atual é digitado manualmente
  const handleKmAtual = (valor) => {
    setKmAtual(valor);
    if (valor && !isNaN(valor)) setKmProxima(calcularProximaTroca(valor));
  };

  const montarChecklist = () => {
    const kitDesc = KITS.find(k => k.id === kit)?.label || '';
    const extras = servicosExtras.map(s => SERVICOS_EXTRAS.find(x => x.id === s)?.label || '').filter(Boolean);
    const partes = [`Troca de Óleo - ${tipoOleo} ${litros ? `(${litros}L)` : ''}`, kitDesc, ...extras];
    return partes.filter(Boolean).join(', ');
  };

  const handleSalvar = async () => {
    if (!placa) return alert('Informe a placa do veículo!');
    if (!oficinaId) return;
    setSalvando(true);
    try {
      const diasProxima = categoriaSelecionada.dias;
      const dataProxTroca = new Date();
      dataProxTroca.setDate(dataProxTroca.getDate() + diasProxima);

      const os = {
        nomeCliente,
        placa: placa.toUpperCase(),
        telefone: telefone.replace(/\D/g, ''),
        modelo,
        checklist: montarChecklist(),
        detalhesPecas: `Kit: ${kit === 'normal' ? 'Normal' : 'Severo'} | Óleo: ${tipoOleo} ${litros ? litros + 'L' : ''}`,
        fotos: [],
        fotoPainel: fotoPainel || null,
        kmAtual: kmAtual || '',
        kmProxima: kmProxima || '',
        valorPecas: 0,
        valorMaoObra: 0,
        total: 0,
        // Dados específicos do óleo
        tipoServico: 'oleo',
        categoriaVeiculo: categoria,
        kitOleo: kit,
        servicosExtras,
        litrosOleo: litros,
        tipoOleo,
        diasRetorno: diasProxima,
        dataProxTroca: dataProxTroca,
        statusPagamento: 'pendente',
        data: new Date().toLocaleString('pt-BR'),
        data_registro: new Date(),
      };

      await addDoc(collection(db, 'oficinas', oficinaId, 'os'), os);

      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);

      // Limpar campos
      setPlaca(''); setNomeCliente(''); setTelefone(''); setModelo('');
      setLitros(''); setKmAtual(''); setKmProxima('');
      setFotoPainel(null); setServicosExtras([]);
      setCategoria('carro'); setKit('normal');
    } catch (e) {
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '16px',
    background: '#111',
    border: '1px solid #333',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
  };

  const micBtn = (campo, fn, modo) => (
    <button
      onClick={() => ouvirCampo(campo, fn, modo)}
      style={{
        background: campoOuvindo === campo ? MAIN_COLOR : '#333',
        color: 'white', border: 'none', borderRadius: '8px',
        padding: '0 16px', fontSize: '20px', cursor: 'pointer', flexShrink: 0,
      }}
    >
      {campoOuvindo === campo ? '🔴' : '🎤'}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>

      <h2 style={{ color: MAIN_COLOR, marginBottom: '20px', textAlign: 'center' }}>🔧 Nova Ordem de Serviço</h2>

      {/* CATEGORIA */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>TIPO DE VEÍCULO</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategoria(cat.id); if (kmAtual && !isNaN(kmAtual)) setKmProxima(calcularProximaTroca(kmAtual)); }}
              style={{
                padding: '15px 8px', border: `2px solid ${categoria === cat.id ? MAIN_COLOR : '#333'}`,
                background: categoria === cat.id ? `${MAIN_COLOR}22` : '#111',
                color: categoria === cat.id ? MAIN_COLOR : '#888',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{cat.label.split(' ')[0]}</div>
              <div style={{ fontSize: '11px' }}>{cat.label.split(' ').slice(1).join(' ')}</div>
              <div style={{ fontSize: '10px', color: categoria === cat.id ? MAIN_COLOR : '#555', marginTop: '4px' }}>{cat.dias} dias</div>
            </button>
          ))}
        </div>
      </div>

      {/* KIT */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>KIT DE SERVIÇO</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {KITS.map(k => (
            <button
              key={k.id}
              onClick={() => setKit(k.id)}
              style={{
                padding: '15px', border: `2px solid ${kit === k.id ? (k.id === 'severo' ? KM_COLOR : '#00E676') : '#333'}`,
                background: kit === k.id ? (k.id === 'severo' ? `${KM_COLOR}22` : '#00E67622') : '#111',
                color: kit === k.id ? (k.id === 'severo' ? KM_COLOR : '#00E676') : '#888',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '14px' }}>{k.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>{k.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SERVIÇOS EXTRAS */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>➕ ADICIONAR AO CHECKLIST:</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {SERVICOS_EXTRAS.map(s => (
            <button
              key={s.id}
              onClick={() => toggleServico(s.id)}
              style={{
                padding: '12px 8px', border: `1px solid ${servicosExtras.includes(s.id) ? GREEN_MONEY : '#333'}`,
                background: servicosExtras.includes(s.id) ? `${GREEN_MONEY}22` : '#111',
                color: servicosExtras.includes(s.id) ? GREEN_MONEY : '#888',
                borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* FOTO DO PAINEL */}
      <div style={{ marginBottom: '20px', background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid ${KM_COLOR}44` }}>
        <label style={{ color: KM_COLOR, fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          📸 FOTO DO PAINEL (Leitura Automática de KM)
        </label>
        {fotoPainel ? (
          <div>
            <img src={fotoPainel} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${KM_COLOR}` }} />
            <button
              onClick={() => { setFotoPainel(null); setKmAtual(''); setKmProxima(''); }}
              style={{ width: '100%', marginTop: '8px', padding: '8px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
            >
              🗑️ REMOVER FOTO
            </button>
          </div>
        ) : (
          <label style={{ display: 'block', padding: '25px', border: `2px dashed ${KM_COLOR}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷</div>
            <div style={{ color: KM_COLOR, fontWeight: 'bold', fontSize: '13px' }}>FOTOGRAFAR PAINEL AGORA</div>
            <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>A Inteligência Artificial lê a quilometragem sozinha</div>
            <input type="file" accept="image/*" capture="environment" onChange={handleFotoPainel} style={{ display: 'none' }} />
          </label>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#888', fontSize: '11px' }}>KM ATUAL</label>
            <input
              type="number"
              value={kmAtual}
              onChange={(e) => handleKmAtual(e.target.value)}
              placeholder="Ex: 54321"
              style={{ ...inputStyle, border: `1px solid ${KM_COLOR}`, color: lendoKm ? '#666' : KM_COLOR, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#888', fontSize: '11px' }}>PRÓXIMA TROCA</label>
            <input
              type="number"
              value={kmProxima}
              onChange={(e) => setKmProxima(e.target.value)}
              placeholder="Automático"
              style={{ ...inputStyle, border: `1px solid ${MAIN_COLOR}`, color: MAIN_COLOR, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}
            />
          </div>
        </div>
      </div>

      {/* TIPO E LITROS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={{ flex: 2 }}>
          <label style={{ color: '#888', fontSize: '11px' }}>TIPO DE ÓLEO</label>
          <select
            value={tipoOleo}
            onChange={(e) => setTipoOleo(e.target.value)}
            style={{ ...inputStyle, color: GREEN_MONEY, fontWeight: 'bold' }}
          >
            <option>5W30 Sintético</option>
            <option>5W40 Sintético</option>
            <option>10W40 Semi-sintético</option>
            <option>15W40 Mineral</option>
            <option>0W20 Sintético</option>
            <option>20W50 Mineral</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ color: '#888', fontSize: '11px' }}>LITROS</label>
          <input
            type="number"
            step="0.5"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            placeholder="Ex: 4.5"
            style={{ ...inputStyle, textAlign: 'center' }}
          />
        </div>
      </div>

      {/* DADOS DO CLIENTE */}
      <div style={{ background: '#0a0a0a', padding: '15px', borderRadius: '10px', border: '1px solid #222', marginBottom: '15px' }}>
        <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>DADOS DO CLIENTE / VEÍCULO</label>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="PLACA *" style={{ ...inputStyle, fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }} />
          {micBtn('placa', setPlaca)}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input type="text" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} placeholder="Nome do cliente" style={inputStyle} />
          {micBtn('nomeCliente', setNomeCliente)}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))} placeholder="WhatsApp" style={inputStyle} />
          {micBtn('telefone', setTelefone)}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo (Ex: Gol 2019)" style={inputStyle} />
          {micBtn('modelo', setModelo)}
        </div>
      </div>

      {/* RESUMO */}
      {placa && (
        <div style={{ background: '#0a0a0a', padding: '15px', borderRadius: '10px', border: `1px solid ${GREEN_MONEY}44`, marginBottom: '20px' }}>
          <label style={{ color: GREEN_MONEY, fontSize: '11px', fontWeight: 'bold' }}>RESUMO DO SERVIÇO</label>
          <p style={{ color: '#ccc', fontSize: '13px', margin: '8px 0 0 0', lineHeight: '1.6' }}>{montarChecklist()}</p>
          {kmAtual && (
            <p style={{ color: KM_COLOR, fontSize: '12px', margin: '8px 0 0 0' }}>
              📍 KM atual: {Number(kmAtual).toLocaleString()} → próxima troca: {Number(kmProxima).toLocaleString()} km
            </p>
          )}
          <p style={{ color: '#888', fontSize: '11px', margin: '6px 0 0 0' }}>
            📅 Retorno em {categoriaSelecionada.dias} dias
          </p>
        </div>
      )}

      {/* BOTÃO SALVAR */}
      <button
        onClick={handleSalvar}
        disabled={salvando}
        style={{
          width: '100%', padding: '20px',
          background: salvando ? '#333' : salvo ? GREEN_MONEY : MAIN_COLOR,
          color: salvo ? 'black' : 'white',
          border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
        }}
      >
        {salvando ? '⏳ SALVANDO...' : salvo ? '✅ SALVO NA O.S.!' : '💾 SALVAR SERVIÇO NA O.S.'}
      </button>

    </div>
  );
}