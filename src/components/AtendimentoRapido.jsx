import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useOficina } from './OficinaContext'; // 🔐 IMPORTAMOS O CONTEXTO

export default function AtendimentoRapido() {
  const { oficinaId } = useOficina() || {}; // 🔐 PEGAMOS O ID DA OFICINA
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState('form');
  const [ouvindo, setOuvindo] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [servico, setServico] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('carro');
  const [descricao, setDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [atendimentosHoje, setAtendimentosHoje] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 🔐 SÓ CARREGA SE TIVER O ID DA OFICINA
    if (aberto && modo === 'historico' && oficinaId) carregarAtendimentosHoje();
  }, [aberto, modo, oficinaId]);

  const carregarAtendimentosHoje = async () => {
    if (!oficinaId) return;
    setCarregando(true);
    try {
      // 🔐 BUSCANDO NO COFRE DA OFICINA
      const q = query(collection(db, "oficinas", oficinaId, "leads"), where("origem", "==", "atendimento_rapido"), orderBy("data", "desc"));
      const snapshot = await getDocs(q);
      const todos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const hoje = new Date().toDateString();
      setAtendimentosHoje(todos.filter(l => {
        const dataLead = l.data?.toDate?.() || new Date(l.data);
        return dataLead.toDateString() === hoje;
      }));
    } catch (e) { console.error("Erro:", e); }
    finally { setCarregando(false); }
  };

  const iniciarVoz = () => {
    if (!('webkitSpeechRecognition' in window)) { alert("Use Chrome"); return; }
    const rec = new window.webkitSpeechRecognition();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;
    rec.onstart = () => { setOuvindo(true); setTranscricao(''); };
    rec.onresult = (e) => {
      let textoFinal = '', textoInterim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) textoFinal += e.results[i][0].transcript + ' ';
        else textoInterim += e.results[i][0].transcript;
      }
      const texto = (transcricao + textoFinal + textoInterim).trim();
      setTranscricao(texto);
      processarTexto(texto);
    };
    rec.onend = () => setOuvindo(false);
    rec.start();
    setTimeout(() => rec.stop(), 15000);
  };

  const pararVoz = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setOuvindo(false);
  };

  const processarTexto = (texto) => {
    const t = texto.toLowerCase();
    const nomeMatch = texto.match(/(?:nome|cliente|chamo|sou)\s+([A-Za-zÀ-ú]+)/i);
    if (nomeMatch) setNome(capitalizar(nomeMatch[1]));
    const telMatch = texto.match(/(\d{2})\s*(\d{4,5})[\s-]?(\d{4})/);
    if (telMatch) { let tel = telMatch[0].replace(/\D/g, ''); setTelefone(tel); }
    if (t.includes('moto')) setTipoVeiculo('moto');
    else if (t.includes('caminhão') || t.includes('caminhao')) setTipoVeiculo('caminhao');
    const modelos = /(gol|uno|onix|hb20|civic|corolla|cg|fan|titan|strada|toro|kwid|polo)/i;
    const modMatch = texto.match(modelos);
    if (modMatch) setVeiculo(capitalizar(modMatch[1]));
    if (t.includes('óleo') || t.includes('oleo')) setServico('Troca de Óleo');
    else if (t.includes('freio')) setServico('Revisão de Freios');
    else if (t.includes('revisão') || t.includes('revisao')) setServico('Revisão Completa');
    else if (t.includes('pneu')) setServico('Troca de Pneus');
    else if (t.includes('bateria')) setServico('Bateria');
    setDescricao(texto);
  };

  const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const limparFormulario = () => {
    setNome(''); setTelefone(''); setVeiculo(''); setServico('');
    setDescricao(''); setObservacoes(''); setTipoVeiculo('carro');
    setTranscricao(''); setOuvindo(false);
  };

  const salvarAtendimento = async () => {
    if (!oficinaId) return alert("Erro: Oficina não identificada."); // 🔐 PROTEÇÃO
    if (!telefone) { alert("⚠️ Telefone obrigatório!"); return; }
    try {
      // 🔐 SALVANDO NO COFRE DA OFICINA
      await addDoc(collection(db, "oficinas", oficinaId, "leads"), {
        nome: nome || 'Não informado',
        telefone: telefone.replace(/\D/g, ''),
        veiculo: veiculo || 'Não informado',
        servico: servico || 'Não especificado',
        descricao: descricao || '',
        observacoes,
        tipoVeiculo,
        status: 'novo',
        data: new Date(),
        origem: 'atendimento_rapido',
        whatsappEnviado: false
      });
      alert("✅ Lead salvo!");
      limparFormulario();
      setModo('historico');
    } catch (e) { alert("❌ Erro: " + e.message); }
  };

  const enviarWhatsApp = async (a) => {
    const msg = `Olá ${a.nome}! 👋\nSou da Express Auto Tech.\nServiço: ${a.servico}\nVeículo: ${a.veiculo}\n${a.descricao ? `📋 ${a.descricao}\n` : ''}Quando pode trazer? 🚗🔧`;
    try {
      // 🔐 ATUALIZANDO DENTRO DO COFRE DA OFICINA
      await updateDoc(doc(db, "oficinas", oficinaId, "leads", a.id), { whatsappEnviado: true });
      carregarAtendimentosHoje();
    } catch (e) { console.error(e); }
    window.open(`https://wa.me/55${a.telefone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} style={{ position: 'fixed', bottom: '100px', right: '20px', width: '60px', height: '60px', background: '#00E676', color: 'white', border: 'none', borderRadius: '50%', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,230,118,0.4)', zIndex: 9999 }}>
        💬
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#1a1a1a', width: '100%', maxWidth: '400px', borderRadius: '15px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #333' }}>
          <h3 style={{ color: '#00E676', margin: 0 }}>{modo === 'form' ? '⚡ Atendimento Rápido' : '📋 Hoje'}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setModo(modo === 'form' ? 'historico' : 'form')} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer' }}>
              {modo === 'form' ? 'Histórico' : 'Novo'}
            </button>
            <button onClick={() => setAberto(false)} style={{ background: 'transparent', color: '#888', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>
        </div>

        {modo === 'form' ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

            <button onClick={ouvindo ? pararVoz : iniciarVoz} style={{ padding: '15px', background: ouvindo ? '#FF0033' : '#00E676', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              {ouvindo ? '🎤 OUVINDO... FALE!' : '🎤 CLICAR E FALAR'}
            </button>

            {transcricao && (
              <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '5px', border: '1px solid #333' }}>
                <p style={{ color: '#888', fontSize: '11px', margin: '0 0 5px 0' }}>📝 Ouviu:</p>
                <p style={{ color: '#fff', fontStyle: 'italic', margin: 0, fontSize: '13px' }}>"{transcricao}"</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {['carro', 'moto', 'caminhao'].map(t => (
                <button key={t} onClick={() => setTipoVeiculo(t)} style={{ flex: 1, padding: '10px', background: tipoVeiculo === t ? '#00E676' : '#0a0a0a', color: tipoVeiculo === t ? 'black' : '#888', border: '1px solid #333', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {t === 'carro' ? '🚗' : t === 'moto' ? '🏍️' : '🚛'}
                </button>
              ))}
            </div>

            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do cliente" style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px', fontSize: '14px' }} />

            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value.replace(/\D/g, ''))} placeholder="WhatsApp *" style={{ padding: '12px', background: '#0a0a0a', border: '2px solid #00E676', color: 'white', borderRadius: '5px', fontSize: '14px' }} />

            <input value={veiculo} onChange={e => setVeiculo(e.target.value)} placeholder="Modelo do veículo (ex: Gol 2019)" style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px', fontSize: '14px' }} />

            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="📋 Descrição do problema (ex: barulho no motor, freios falhando...)" rows={3} style={{ padding: '12px', background: '#0a0a0a', border: '2px solid #00E676', color: 'white', borderRadius: '5px', fontSize: '14px', resize: 'none' }} />

            <select value={servico} onChange={e => setServico(e.target.value)} style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px', fontSize: '14px' }}>
              <option value="">Tipo de serviço</option>
              <option value="Troca de Óleo">🛢️ Troca de Óleo</option>
              <option value="Revisão Completa">🔧 Revisão Completa</option>
              <option value="Revisão de Freios">🛑 Freios</option>
              <option value="Troca de Pneus">🛞 Pneus</option>
              <option value="Bateria">🔋 Bateria</option>
              <option value="Suspensão">🔩 Suspensão</option>
              <option value="Diagnóstico">🔍 Diagnóstico</option>
              <option value="Orçamento">💰 Orçamento</option>
            </select>

            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais..." rows={2} style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px', fontSize: '14px', resize: 'none' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={limparFormulario} style={{ flex: 1, padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Limpar</button>
              <button onClick={salvarAtendimento} disabled={!telefone} style={{ flex: 2, padding: '12px', background: telefone ? '#00E676' : '#555', color: telefone ? 'black' : '#888', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: telefone ? 'pointer' : 'not-allowed' }}>💾 SALVAR</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {carregando ? <p style={{ textAlign: 'center', color: '#888' }}>Carregando...</p> :
              atendimentosHoje.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                  <p style={{ fontSize: '40px' }}>📭</p>
                  <p>Nenhum atendimento hoje</p>
                </div>
              ) : atendimentosHoje.map(a => (
                <div key={a.id} style={{ background: '#0a0a0a', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #333' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'white' }}>{a.whatsappEnviado ? '✅' : '🆕'} {a.nome}</p>
                  <p style={{ margin: '4px 0', color: '#888', fontSize: '12px' }}>🚗 {a.veiculo} | 🔧 {a.servico}</p>
                  {a.descricao && <p style={{ margin: '4px 0', color: '#aaa', fontSize: '11px' }}>📋 {a.descricao}</p>}
                  <p style={{ color: '#00E676', fontSize: '13px', margin: '8px 0' }}>📱 {a.telefone}</p>
                  <button onClick={() => enviarWhatsApp(a)} disabled={a.whatsappEnviado} style={{ width: '100%', padding: '10px', background: a.whatsappEnviado ? '#333' : '#25D366', color: a.whatsappEnviado ? '#888' : 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: a.whatsappEnviado ? 'not-allowed' : 'pointer' }}>
                    {a.whatsappEnviado ? '✅ Enviado' : '💬 Enviar WhatsApp'}
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}