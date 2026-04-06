import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const MAIN_COLOR = "#FF0033";
const GREEN_MONEY = "#00E676";
const KM_COLOR = "#eab308";
const SITE_LINK = 'https://expresstech.com.br';

function limparTelefone(tel) {
  if (!tel) return '';
  const limpo = String(tel).replace(/\D/g, '');
  if (limpo.length < 10) return '';
  return limpo.startsWith('55') ? limpo : '55' + limpo;
}

export default function StatusOS() {
  const { oficinaId, osId } = useParams();
  const [os, setOs] = useState(null);
  const [config, setConfig] = useState(null);
  const [todasOS, setTodasOS] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);

  const carregarDados = async () => {
    try {
      const osRef = doc(db, "oficinas", oficinaId, "os", osId);
      const osSnap = await getDoc(osRef);
      if (!osSnap.exists()) {
        setErro("Ordem de Serviço não encontrada ou apagada!");
        setLoading(false);
        return;
      }
      const osData = { id: osSnap.id, ...osSnap.data() };
      setOs(osData);

      // Carregar TODAS as OS da mesma placa/cliente
      const todasSnap = await getDocs(collection(db, "oficinas", oficinaId, "os"));
      const todas = todasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtrar pelo mesmo veículo (placa ou telefone)
      const doMesmoCliente = todas.filter(o =>
        (osData.placa && o.placa === osData.placa) ||
        (osData.telefone && o.telefone === osData.telefone)
      ).sort((a, b) => {
        const dA = a.data_registro ? new Date(a.data_registro).getTime() : 0;
        const dB = b.data_registro ? new Date(b.data_registro).getTime() : 0;
        return dB - dA;
      });
      setTodasOS(doMesmoCliente);

      const configRef = doc(db, "oficinas", oficinaId, "configuracoes", "geral");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) setConfig(configSnap.data());

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar:", error);
      setErro("Erro ao carregar dados. Verifique a sua conexão.");
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, [oficinaId, osId]);

  const copiarPix = () => {
    if (config?.pixKey) {
      navigator.clipboard.writeText(config.pixKey);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
      alert("✅ Chave PIX copiada!");
    }
  };

  const abrirWhatsApp = () => {
    const msg = `Olá! Tenho uma dúvida sobre a minha O.S. #${osId?.slice(-5).toUpperCase()}`;
    const telefoneDestino = limparTelefone(config?.telefone);
    if (telefoneDestino) {
      window.open(`https://wa.me/${telefoneDestino}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert("A oficina não configurou um telefone de contato.");
    }
  };

  // ✅ Compartilhar ÚLTIMO laudo (a OS atual)
  const compartilharUltimoLaudo = () => {
    const link = `https://oficina.expresstech.com.br/${oficinaId}/${osId}`;
    const nomeOficina = config?.nome || 'Oficina';
    const total = os?.total ? Number(os.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
    const servico = os?.checklist || os?.diagnostico || 'Serviço realizado';
    const msg =
`🔧 *${nomeOficina}*
━━━━━━━━━━━━━━━━━━━━━━━━

📋 *Laudo O.S. #${os?.id?.slice(-5).toUpperCase()}*
🚗 *${os?.modelo || 'Veículo'} | ${os?.placa || ''}*
${os?.kmAtual ? `🛣️ KM: ${os.kmAtual}` : ''}

✅ *Serviço:*
${servico.substring(0, 200)}

💰 *Total: ${total}*

📱 Acesse seu laudo completo:
${link}

━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Express Tech*
${SITE_LINK}`;
    navigator.share
      ? navigator.share({ title: `Laudo ${os?.placa}`, text: msg })
      : window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ✅ Compartilhar TODOS os laudos
  const compartilharTodosLaudos = () => {
    if (todasOS.length === 0) { alert("Nenhum histórico encontrado."); return; }
    const link = `https://oficina.expresstech.com.br/${oficinaId}/${osId}`;
    const nomeOficina = config?.nome || 'Oficina';
    const historico = todasOS.map((o, i) => {
      const d = o.data_registro
        ? new Date(o.data_registro).toLocaleDateString('pt-BR')
        : (o.data ? String(o.data).split(',')[0] : '—');
      const total = Number(o.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const servico = (o.checklist || o.diagnostico || 'Serviço realizado').substring(0, 60);
      return `${i + 1}. 📅 ${d} — ${total}\n   🔧 ${servico}`;
    }).join('\n\n');

    const totalGeral = todasOS.reduce((acc, o) => acc + Number(o.total || 0), 0)
      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const msg =
`🔧 *${nomeOficina}*
━━━━━━━━━━━━━━━━━━━━━━━━

📂 *Histórico Completo*
🚗 *${os?.modelo || 'Veículo'} | ${os?.placa || ''}*
📊 *${todasOS.length} serviço(s) realizados*

${historico}

━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Total investido: ${totalGeral}*

📱 Ver todos os laudos detalhados:
${link}

━━━━━━━━━━━━━━━━━━━━━━━━
🏢 *Express Tech*
${SITE_LINK}`;
    navigator.share
      ? navigator.share({ title: `Histórico ${os?.placa}`, text: msg })
      : window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>⏳</div>
          <p style={{ color: '#888', fontSize: '16px' }}>A carregar informações do veículo...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: MAIN_COLOR, marginBottom: '10px' }}>Ops!</h2>
          <p style={{ color: '#888', marginBottom: '30px' }}>{erro}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '15px 40px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            🔄 TENTAR NOVAMENTE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', paddingBottom: '40px', fontFamily: 'sans-serif' }}>

      {/* ⚠️ AVISO TOPO — MECÂNICOS NÃO SE PERCAM */}
      <div style={{
        background: '#0d0d0d',
        borderBottom: '2px solid #FF0033',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ margin: 0, color: '#FF0033', fontWeight: '900', fontSize: '11px', letterSpacing: '0.5px' }}>
            📱 PORTAL DO CLIENTE
          </p>
          <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '10px' }}>
            Aqui o cliente acompanha o serviço. Mecânico? Acesse ao lado →
          </p>
        </div>
        <a
          href="/admin"
          style={{
            background: 'linear-gradient(135deg, #FF0033, #cc0028)',
            color: 'white',
            padding: '9px 16px',
            borderRadius: '8px',
            fontWeight: '900',
            fontSize: '12px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px',
            boxShadow: '0 0 14px #FF003355',
          }}
        >
          🔐 ÁREA DA OFICINA
        </a>
      </div>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${MAIN_COLOR} 0%, #99001f 100%)`, padding: '30px 20px', textAlign: 'center', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', boxShadow: `0 5px 20px ${MAIN_COLOR}44` }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>
          {config?.nome || 'OFICINA IA'}
        </h1>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>{config?.endereco || 'Endereço não configurado'}</p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>📞 {config?.telefone || 'Telefone não configurado'}</p>
      </div>

      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>

        {/* STATUS */}
        <div style={{ background: os?.statusPagamento === 'pago' ? '#00E67622' : '#FF003322', border: `2px solid ${os?.statusPagamento === 'pago' ? GREEN_MONEY : MAIN_COLOR}`, borderRadius: '15px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>{os?.statusPagamento === 'pago' ? '✅' : '⏳'}</div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: os?.statusPagamento === 'pago' ? GREEN_MONEY : MAIN_COLOR }}>
            {os?.statusPagamento === 'pago' ? 'SERVIÇO CONCLUÍDO E PAGO' : 'A AGUARDAR PAGAMENTO'}
          </h2>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#aaa' }}>
            O.S. #{os?.id?.slice(-5).toUpperCase()} • {os?.data ? String(os.data).split(',')[0] : ''}
          </p>
        </div>

        {/* CLIENTE E VEÍCULO */}
        <div style={{ background: '#111', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>👤 Cliente e Veículo</h3>
          {os?.nomeCliente && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Cliente:</span>
              <strong style={{ fontSize: '15px', color: 'white', textTransform: 'uppercase' }}>{os.nomeCliente}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ color: '#888', fontSize: '13px' }}>Placa:</span>
            <strong style={{ fontSize: '18px', color: 'white', background: '#222', padding: '4px 10px', borderRadius: '6px', border: '1px solid #444', letterSpacing: '1px' }}>{os?.placa}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#888', fontSize: '13px' }}>Modelo:</span>
            <strong style={{ color: 'white', fontSize: '15px' }}>{os?.modelo}</strong>
          </div>
        </div>

        {/* SERVIÇO */}
        <div style={{ background: '#111', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>🔧 Serviço e Peças</h3>
          <div style={{ marginBottom: os?.detalhesPecas ? '20px' : '0' }}>
            <span style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>DEFEITO / SERVIÇOS EXECUTADOS:</span>
            <p style={{ margin: 0, lineHeight: '1.6', color: '#ddd', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{os?.checklist || 'Nenhum serviço detalhado.'}</p>
          </div>
          {os?.detalhesPecas && (
            <div>
              <span style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PEÇAS UTILIZADAS:</span>
              <p style={{ margin: 0, lineHeight: '1.6', color: '#ddd', whiteSpace: 'pre-wrap', fontSize: '14px' }}>{os.detalhesPecas}</p>
            </div>
          )}
        </div>

        {/* FOTOS */}
        {os?.fotos && os.fotos.length > 0 && (
          <div style={{ background: '#111', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>📸 Fotos do Serviço</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {os.fotos.map((foto, index) => (
                <div key={index} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                  <img src={foto.foto} alt={foto.legenda || `Foto ${index + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ background: '#222', padding: '8px', borderTop: '1px solid #444' }}>
                    {foto.legenda && <p style={{ margin: '0 0 4px 0', fontSize: '11px', textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>{foto.legenda}</p>}
                    {foto.dataEnvio && <p style={{ margin: 0, fontSize: '9px', textAlign: 'center', color: '#aaa' }}>⏱️ {foto.dataEnvio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VALOR TOTAL */}
        <div style={{ background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', borderRadius: '15px', padding: '25px', marginBottom: '20px', textAlign: 'center', border: `1px solid ${GREEN_MONEY}44`, boxShadow: '0px 10px 30px rgba(0,230,118,0.1)' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#888', fontWeight: 'bold', letterSpacing: '1px' }}>VALOR TOTAL A PAGAR</p>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '42px', fontWeight: '900', color: GREEN_MONEY }}>
            {os?.total ? Number(os.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
          </h2>
        </div>

        {/* PIX */}
        {config?.pixKey && os?.statusPagamento !== 'pago' && (
          <div style={{ background: '#111', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: `1px solid ${MAIN_COLOR}44` }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#fff', textAlign: 'center' }}>💳 PAGAMENTO VIA PIX</h3>
            <p style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', marginBottom: '15px' }}>Copie a chave abaixo e pague pelo aplicativo do seu banco.</p>
            <div style={{ background: '#000', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px dashed #444' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#666', textAlign: 'center' }}>CHAVE PIX DA OFICINA:</p>
              <p style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-all' }}>{config.pixKey}</p>
            </div>
            <button onClick={copiarPix} style={{ width: '100%', padding: '16px', background: copiado ? GREEN_MONEY : MAIN_COLOR, color: copiado ? 'black' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
              {copiado ? '✅ CHAVE COPIADA COM SUCESSO!' : '📋 COPIAR CHAVE PIX'}
            </button>
          </div>
        )}

        {/* DÚVIDAS WHATSAPP */}
        <div style={{ marginBottom: '12px' }}>
          <button onClick={abrirWhatsApp} style={{ width: '100%', padding: '16px', background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            💬 DÚVIDAS? FALAR COM A OFICINA
          </button>
        </div>

        {/* ✅ COMPARTILHAR ÚLTIMO LAUDO */}
        <div style={{ marginBottom: '12px' }}>
          <button onClick={compartilharUltimoLaudo} style={{ width: '100%', padding: '16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            📋 COMPARTILHAR ÚLTIMO LAUDO
          </button>
        </div>

        {/* ✅ COMPARTILHAR TODOS OS LAUDOS (novo) */}
        {todasOS.length > 1 && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={compartilharTodosLaudos} style={{ width: '100%', padding: '16px', background: '#065f46', color: 'white', border: '1px solid #16a34a', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              📂 COMPARTILHAR TODOS OS LAUDOS ({todasOS.length})
            </button>
          </div>
        )}

        {/* GARANTIA */}
        {config?.garantia && (
          <div style={{ background: '#1a1a00', borderRadius: '15px', padding: '20px', marginBottom: '20px', border: '1px solid #eab30844' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#eab308', textAlign: 'center', lineHeight: '1.5' }}>
              🛡️ <strong>TERMO DE GARANTIA:</strong> {config.garantia}
            </p>
          </div>
        )}

        {/* RODAPÉ */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ fontSize: '11px', color: '#444', margin: '0 0 6px 0' }}>Tecnologia gerada por <strong>Oficina IA</strong></p>
          <a href={SITE_LINK} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#555', textDecoration: 'none' }}>
            🏢 {SITE_LINK}
          </a>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
