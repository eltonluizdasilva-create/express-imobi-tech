/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useGemini } from '../hooks/useGemini';
import { useOficina } from '../components/OficinaContext';

const COLUNAS = [
  { id: 'novo', titulo: 'NOVO', cor: '#3b82f6', icone: '🕹️' },
  { id: 'orcamento', titulo: 'ORÇAMENTO', cor: '#eab308', icone: '💰' },
  { id: 'agendado', titulo: 'AGENDADO', cor: '#a855f7', icone: '📅' },
  { id: 'feito', titulo: 'FEITO', cor: '#22c55e', icone: '✅' }
];

export default function LeadsPage() {
  const { oficinaId } = useOficina();
  const { analyzeImage } = useGemini();
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  // Estados Form Manual
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [problema, setProblema] = useState('');

  // Estados Form IA
  const [textoIA, setTextoIA] = useState('');
  const [fotoLead, setFotoLead] = useState(null);
  const [processandoIA, setProcessandoIA] = useState(false);

  const carregarLeads = async () => {
    if (!oficinaId) return;
    setLoading(true);
    try {
      const s = await getDocs(query(collection(db, "oficinas", oficinaId, "leads"), orderBy("data_registro", "desc")));
      setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Erro ao carregar leads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLeads();
  }, [oficinaId]);

  const comprimirFotoLead = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas'); const maxW = 800;
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      }; img.src = base64;
    });
  };

  const handleCapturarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comprimida = await comprimirFotoLead(reader.result);
      setFotoLead(comprimida);
    };
    reader.readAsDataURL(file);
  };

  const adicionarLeadManual = async () => {
    if (!nome || !telefone) return alert("Preencha pelo menos Nome e WhatsApp!");
    try {
      await addDoc(collection(db, "oficinas", oficinaId, "leads"), {
        nome,
        telefone: telefone.replace(/\D/g, ''),
        veiculo,
        problema,
        status: 'novo',
        data_registro: new Date()
      });
      setNome(''); setTelefone(''); setVeiculo(''); setProblema('');
      carregarLeads();
    } catch (e) {
      alert("Erro ao adicionar lead.");
    }
  };

  const extrairLeadsIA = async () => {
    if (!textoIA && !fotoLead) return alert("Cole um texto ou adicione uma foto primeiro!");
    setProcessandoIA(true);
    try {
      const prompt = `Extraia nomes, telefones, veículos e problemas dos dados fornecidos. O usuário pode estar colando uma lista de Excel (.xls), texto do Word (.doc), contatos do WhatsApp ou a foto de uma lista/cartão. Retorne APENAS um array JSON puro: [{"nome": "...", "telefone": "...", "veiculo": "...", "problema": "..."}]. Se faltar algum dado, deixe em branco. Texto: ${textoIA}`;
      
      const resposta = await analyzeImage(prompt, fotoLead || null);
      const dadosExtraidos = JSON.parse(resposta.replace(/```json|```/g, ''));

      for (const lead of dadosExtraidos) {
        if (lead.nome || lead.telefone) {
          await addDoc(collection(db, "oficinas", oficinaId, "leads"), {
            nome: lead.nome || 'Cliente Desconhecido',
            telefone: (lead.telefone || '').replace(/\D/g, ''),
            veiculo: lead.veiculo || '',
            problema: lead.problema || 'Extraído via IA',
            status: 'novo',
            data_registro: new Date()
          });
        }
      }

      setTextoIA('');
      setFotoLead(null);
      alert('✅ Leads importados com sucesso!');
      carregarLeads();
    } catch (error) {
      alert('❌ Erro na leitura pela IA. Tente uma imagem mais nítida ou verifique a formatação da sua lista.');
      console.error(error);
    } finally {
      setProcessandoIA(false);
    }
  };

  const mudarStatus = async (leadId, novoStatus) => {
    try {
      await updateDoc(doc(db, "oficinas", oficinaId, "leads", leadId), { status: novoStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: novoStatus } : l));
    } catch (e) {
      alert("Erro ao mover card.");
    }
  };

  const deletarLead = async (leadId) => {
    if(!confirm("Apagar este lead permanentemente?")) return;
    try {
      await deleteDoc(doc(db, "oficinas", oficinaId, "leads", leadId));
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (e) {
      alert("Erro ao apagar.");
    }
  };

  const abrirWhatsApp = (numero) => {
    if(!numero) return;
    window.open(`https://wa.me/55${numero}`, '_blank');
  };

  const leadsFiltrados = useMemo(() => {
    return leads.filter(l => 
      (l.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (l.veiculo || '').toLowerCase().includes(busca.toLowerCase())
    );
  }, [leads, busca]);

  const leadsPorStatus = useMemo(() => {
    const mapa = { novo: [], orcamento: [], agendado: [], feito: [] };
    leadsFiltrados.forEach(l => {
      if (mapa[l.status]) mapa[l.status].push(l);
      else mapa['novo'].push(l);
    });
    return mapa;
  }, [leadsFiltrados]);

  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ color: '#FF0033', marginBottom: '20px' }}>🎯 Funil de Vendas (Leads)</h2>

      {/* BLOCO IA - IMPORTAÇÃO DE LISTAS */}
      <div style={{ background: '#111', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <h3 style={{ color: '#3b82f6', margin: 0, fontSize: '16px' }}>Importação de Leads e Lista de Clientes (IA)</h3>
        </div>
        <p style={{ color: '#888', fontSize: '13px', marginBottom: '15px', lineHeight: '1.5' }}>
          <strong>Como usar:</strong> Copie os dados das suas planilhas de Excel (.xls), arquivos de texto (.doc), ou mensagens longas do WhatsApp e cole aqui. Você também pode clicar no botão da câmera para tirar foto de uma lista de clientes impressa ou de cartões de visita. A Inteligência Artificial vai ler e cadastrar tudo automaticamente no seu funil.
        </p>
        
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <textarea
            value={textoIA}
            onChange={e => setTextoIA(e.target.value)}
            placeholder="Cole aqui os contatos copiados da sua planilha ou do WhatsApp..."
            style={{ width: '100%', padding: '15px', background: '#0a0a0a', color: 'white', border: '1px solid #333', borderRadius: '5px' }}
            rows={3}
          />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
            <label style={{ flex: 1, padding: '15px', background: '#222', color: '#00E676', border: '1px dashed #00E676', textAlign: 'center', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>📸</span> FOTOGRAFAR LISTA IMPRESSA / CARTÃO
              <input type="file" accept="image/*" capture="environment" onChange={handleCapturarFoto} style={{ display: 'none' }} />
            </label>

            {fotoLead && (
              <div style={{ position: 'relative', width: '100px', border: '1px solid #3b82f6', borderRadius: '5px', overflow: 'hidden' }}>
                <img src={fotoLead} alt="Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setFotoLead(null)} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={extrairLeadsIA} 
          disabled={processandoIA} 
          style={{ marginTop: '15px', width: '100%', padding: '15px', background: processandoIA ? '#222' : '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {processandoIA ? '⏳ EXTRAINDO CLIENTES DA LISTA...' : '✨ IMPORTAR CONTATOS AUTOMATICAMENTE'}
        </button>
      </div>

      {/* BLOCO MANUAL - ADICIONAR CLIENTE */}
      <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: '1px solid #333', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <span style={{ fontSize: '20px' }}>✍️</span>
          <h3 style={{ color: '#FF0033', margin: 0, fontSize: '16px' }}>Adicionar Novo Cliente Manualmente</h3>
        </div>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '15px' }}>Use este formulário para registrar um cliente que chegou à oficina ou ligou.</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do Cliente" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
          <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="WhatsApp (DDD + Num)" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
          <input type="text" value={veiculo} onChange={e => setVeiculo(e.target.value)} placeholder="Veículo (Ex: Gol 2018)" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
          <input type="text" value={problema} onChange={e => setProblema(e.target.value)} placeholder="Problema / Serviço..." style={{ flex: 2, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
        </div>
        <button onClick={adicionarLeadManual} style={{ padding: '12px 25px', background: '#FF0033', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>➕ CADASTRAR NO KANBAN</button>
      </div>

      {/* BUSCA */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={busca} 
          onChange={e => setBusca(e.target.value)} 
          placeholder="🔍 Localizar leads por nome ou veículo..." 
          style={{ width: '100%', padding: '15px', background: '#111', border: '1px solid #3b82f6', color: 'white', borderRadius: '8px' }}
        />
      </div>

      {/* KANBAN BOARD */}
      <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }} className="scrollbar-hide">
        {COLUNAS.map(coluna => (
          <div key={coluna.id} style={{ minWidth: '280px', flex: 1, background: '#111', borderRadius: '10px', padding: '15px', borderTop: `4px solid ${coluna.cor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: coluna.cor }}>{coluna.icone} {coluna.titulo}</h3>
              <span style={{ background: '#222', color: '#888', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                {leadsPorStatus[coluna.id]?.length || 0}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leadsPorStatus[coluna.id]?.length === 0 && (
                <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '20px 0' }}>Nenhum lead aqui.</div>
              )}
              
              {leadsPorStatus[coluna.id]?.map(lead => (
                <div key={lead.id} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '15px', border: '1px solid #333', position: 'relative' }}>
                  <button onClick={() => deletarLead(lead.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: '#FF0033', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                  
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>👤 {lead.nome}</strong>
                  {lead.telefone && (
                    <button onClick={() => abrirWhatsApp(lead.telefone)} style={{ background: 'transparent', border: 'none', color: '#00E676', cursor: 'pointer', padding: 0, fontSize: '12px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      📱 {lead.telefone}
                    </button>
                  )}
                  {lead.veiculo && <p style={{ margin: '0 0 5px 0', color: '#ccc', fontSize: '12px' }}>🚗 {lead.veiculo}</p>}
                  
                  <div style={{ background: '#0a0a0a', padding: '8px', borderRadius: '5px', color: '#aaa', fontSize: '11px', marginTop: '10px', minHeight: '40px' }}>
                    {lead.problema}
                  </div>

                  {/* SELECT PARA MOVER O CARD */}
                  <select 
                    value={lead.status}
                    onChange={(e) => mudarStatus(lead.id, e.target.value)}
                    style={{ width: '100%', marginTop: '10px', padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    {COLUNAS.map(c => (
                      <option key={c.id} value={c.id}>Mover para: {c.titulo}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}