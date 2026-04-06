/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatarTelefone, normalizarPlaca, TAB_COLORS } from './constants';

const SETORES = [
  { key: 'mecanica', label: 'Mecânica', icon: '🔧' },
  { key: 'hibrido', label: 'Híbridos', icon: '🔋' },
  { key: 'eletrico', label: 'Elétricos', icon: '🔌' },
  { key: 'moto', label: 'Motos', icon: '🏍️' },
  { key: 'funilaria', label: 'Funilaria', icon: '🚗' },
  { key: 'amortecedor', label: 'Amortecedor', icon: '🧰' },
  { key: 'injecao', label: 'Injeção', icon: '🛠️' },
  { key: 'eletrica', label: 'Elétrica', icon: '⚡' },
  { key: 'alinhamento', label: 'Alinhamento', icon: '⚙️' },
  { key: 'oleo', label: 'Óleo', icon: '🛢️' },
  { key: 'revisao', label: 'Revisão', icon: '🛡️' },
  { key: 'ar_condicionado', label: 'Ar-Cond.', icon: '❄️' },
  { key: 'pneus', label: 'Pneus', icon: '🛞' },
  { key: 'desmanche', label: 'Desmanche', icon: '🚗' },
  { key: 'escapamento', label: 'Escapamento', icon: '🪛' },
  { key: 'lavajato', label: 'Lava Jato', icon: '🚿' },
  { key: 'estetica', label: 'Estética', icon: '✨' },
];

export default function OS({ oficinaId, onSalvo, onRedirecionar, buscarDadosPorPlaca }) {
  const [dados, setDados] = useState({
    nomeCliente: '',
    placa: '',
    veiculo: '',
    ano: '',
    motor: '',
    telefone: '',
    tipoVeiculo: 'carro',
  });
  const [salvando, setSalvando] = useState(false);
  const [buscaPlaca, setBuscaPlaca] = useState('');
  const [setorAtivo, setSetorAtivo] = useState('mecanica');

  useEffect(() => {
    if (buscaPlaca.length >= 7 && buscarDadosPorPlaca) {
      buscarDadosPorPlaca(buscaPlaca, {
        setNome: (v) => setDados((d) => ({ ...d, nomeCliente: v })),
        setTelefone: (v) => setDados((d) => ({ ...d, telefone: v })),
        setModelo: (v) => {
          // Tenta quebrar o modelo em campos se possível, senão joga em 'veiculo'
          const partes = v.split(' ');
          setDados((d) => ({ ...d, veiculo: v }));
        }
      });
      setDados((d) => ({ ...d, placa: normalizarPlaca(buscaPlaca) }));
    }
  }, [buscaPlaca, buscarDadosPorPlaca]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;

    if (name === 'placa') novoValor = normalizarPlaca(value);
    if (name === 'telefone') novoValor = formatarTelefone(value);

    setDados((prev) => ({ ...prev, [name]: novoValor }));

    if (name === 'placa') {
      setBuscaPlaca(novoValor);
    }
  };

  const handleGerarOS = async (e) => {
    e.preventDefault();

    if (!dados.placa || !dados.veiculo) {
      alert('Preencha Placa e Veículo!');
      return;
    }

    setSalvando(true);
    try {
      const modeloCompleto = `${dados.veiculo} ${dados.ano} ${dados.motor}`.trim();

      const payload = {
        ...dados,
        modelo: modeloCompleto,
        oficinaId,
        data_registro: new Date().toISOString(),
        statusPagamento: 'pendente',
        tipo: setorAtivo,
        tipoServico: setorAtivo,
        total: 0,
      };

      const docRef = await addDoc(collection(db, 'oficinas', oficinaId, 'os'), payload);
      const novaOS = { id: docRef.id, ...payload };

      alert(`O.S. gerada e enviada para ${setorAtivo.toUpperCase()}!`);
      setDados({
        nomeCliente: '',
        placa: '',
        veiculo: '',
        ano: '',
        motor: '',
        telefone: '',
        tipoVeiculo: 'carro',
      });
      setBuscaPlaca('');
      setSetorAtivo('mecanica');

      if (onSalvo) onSalvo();
      if (onRedirecionar) onRedirecionar(setorAtivo, novaOS);
    } catch (erro) {
      alert('Erro: ' + erro.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-black text-white p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-red-500 mb-6 border-b border-red-900/30 pb-4">📋 Recepção de Veículo</h2>

      <form onSubmit={handleGerarOS} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Cliente *</label>
            <input type="text" name="nomeCliente" value={dados.nomeCliente} onChange={handleChange} className="w-full bg-[#111] border border-[#333] p-3 rounded-lg text-white focus:border-red-500 outline-none" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Placa *</label>
              <input type="text" name="placa" value={dados.placa} onChange={handleChange} className="w-full bg-black border border-red-900 p-3 rounded-lg text-white font-bold text-center tracking-widest text-lg" required />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">WhatsApp *</label>
              <input type="text" name="telefone" value={dados.telefone} onChange={handleChange} className="w-full bg-[#111] border border-[#333] p-3 rounded-lg text-white" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Veículo *</label>
              <input type="text" name="veiculo" value={dados.veiculo} onChange={handleChange} placeholder="Ex: Gol" className="w-full bg-[#111] border border-[#333] p-3 rounded-lg text-white text-xs" required />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Ano</label>
              <input type="text" name="ano" value={dados.ano} onChange={handleChange} placeholder="2020" className="w-full bg-[#111] border border-[#333] p-3 rounded-lg text-white text-xs" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Motor</label>
              <input type="text" name="motor" value={dados.motor} onChange={handleChange} placeholder="1.6" className="w-full bg-[#111] border border-[#333] p-3 rounded-lg text-white text-xs" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] text-gray-500 font-bold uppercase block">Área do Serviço *</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {SETORES.map((setor) => {
              const cor = TAB_COLORS[setor.key] || '#ff0033';
              const ativo = setorAtivo === setor.key;
              return (
                <button
                  key={setor.key}
                  type="button"
                  onClick={() => setSetorAtivo(setor.key)}
                  className="nav-button-premium"
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    background: ativo ? `${cor}22` : '#0a0a0a',
                    border: `1px solid ${ativo ? cor : '#222'}`,
                    color: ativo ? 'white' : '#777',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '--glow-color': cor
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{setor.icon}</span>
                  <span style={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{setor.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={salvando} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg mt-4 shadow-xl">
          {salvando ? 'GERANDO...' : '💾 GERAR O.S.'}
        </button>
      </form>

      <div className="mt-12 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-inner">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="text-sm font-bold text-gray-400 m-0 tracking-widest uppercase">Busca Rápida (Placa)</h3>
        </div>
        <input
          type="text"
          placeholder="Digite a placa para preencher..."
          value={buscaPlaca}
          onChange={(e) => setBuscaPlaca(e.target.value)}
          className="w-full bg-black border border-[#222] p-4 rounded-xl text-white uppercase outline-none focus:border-red-500 text-2xl font-black tracking-[0.2em] transition-all mb-4"
        />
        <div style={{ background: '#1a0505', padding: '12px', borderRadius: '10px', border: '1px solid #ff003322' }}>
           <p className="text-[11px] text-gray-400 m-0 leading-relaxed">
            <strong className="text-red-500">O.S. (Ordem de Serviço):</strong> É o documento que registra tudo o que será feito no veículo, as peças cobradas e garante o histórico técnico do seu cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
