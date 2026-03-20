/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { db, auth } from './lib/firebase'; // Verifique se o caminho do firebase está correto
import { collection, query, where, getDocs } from 'firebase/firestore';

const COR = '#00E676';
const COR2 = '#00b85c';
const WARN = '#eab308';
const INFO = '#38bdf8';
const ROXO = '#a855f7';

export default function NotaFiscal() {
  const [tipoEmpresa, setTipoEmpresa] = useState(''); // 'mei' | 'me'
  const [subAba, setSubAba] = useState('guia');

  // ── Gerador de texto ──
  const [nomeCliente, setNomeCliente] = useState('');
  const [documento, setDocumento] = useState('');
  const [placa, setPlaca] = useState('');
  const [modeloCarro, setModeloCarro] = useState('');
  const [numeroOS, setNumeroOS] = useState('');
  const [servicos, setServicos] = useState('');
  const [valorServico, setValorServico] = useState('');
  const [pecas, setPecas] = useState('');
  const [valorPecas, setValorPecas] = useState('');

  const [copiadoNFS, setCopiadoNFS] = useState(false);
  const [copiadoNFe, setCopiadoNFe] = useState(false);

  const clienteDoc = documento.trim() || 'Consumidor Final';
  const formatMoeda = (v) => {
    const n = parseFloat(String(v || '').replace(',', '.'));
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const textoNFSe = `=== DADOS PARA NFS-e NACIONAL ===
─────────────────────────────
Cliente: ${nomeCliente || 'CONSUMIDOR FINAL'}
Documento: ${clienteDoc}
Veículo: ${placa ? `${placa.toUpperCase()} – ${modeloCarro}` : modeloCarro || '–'}
Referente à O.S.: #${numeroOS || '–'}

Descrição do Serviço:
${servicos || '–'}

Valor do Serviço: ${formatMoeda(valorServico)}
─────────────────────────────
Padrão Aprovado 2026 - Emissão Portal Nacional`;

  const textoNFe = `=== DADOS PARA NF-e (Peças) ===
─────────────────────────────
Cliente: ${nomeCliente || 'CONSUMIDOR FINAL'}
Documento: ${clienteDoc}
Referente à O.S.: #${numeroOS || '–'}

Produto: Peças utilizadas conforme O.S. #${numeroOS || '–'}
Descrição:
${pecas || '–'}

Valor Total: ${formatMoeda(valorPecas)}
─────────────────────────────
Emissão SEFAZ Estadual`;

  const copiar = (texto, setCopied) => {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── FUNÇÃO DE BUSCA AUTOMÁTICA DA O.S. PELA PLACA ──
  const buscarDadosPorPlaca = async (placaBuscada) => {
    const placaLimpa = placaBuscada.toUpperCase().trim();
    if (placaLimpa.length < 7) return;

    try {
      const oficinaId = auth.currentUser?.uid;
      if (!oficinaId) {
        alert("Sessão expirada. Atualize a página.");
        return;
      }

      const q = query(collection(db, 'oficinas', oficinaId, 'os'), where('placa', '==', placaLimpa));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0));
        const os = list[0]; // Pega a O.S. mais recente

        // Preenche os campos automaticamente no React
        setNomeCliente(os.nomeCliente || '');
        setModeloCarro(os.modelo || '');
        setNumeroOS(os.id.slice(0, 6).toUpperCase());
        setServicos(os.checklist || os.observacoes || 'Serviços mecânicos gerais');
        setValorServico(os.valorMaoObra || '0');
        setPecas(os.detalhesPecas || 'Peças aplicadas na manutenção');
        setValorPecas(os.valorPecas || '0');

        alert('✅ Dados da última O.S. importados com sucesso!');
      } else {
        alert('⚠️ Nenhuma O.S. encontrada para esta placa.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao buscar a placa.');
    }
  };

  // ─────────────────────────────────────────
  return (
    <div style={{ color: 'white', fontFamily: 'sans-serif' }}>

      {/* HEADER 2026 */}
      <div style={{ background: `linear-gradient(135deg, ${COR}18, transparent)`, border: `1px solid ${COR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px', color: COR, fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🧾 Central de Emissão Fiscal
          <span style={{ background: COR, color: 'black', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Padrão Nacional 2026</span>
        </h2>
        <p style={{ margin: 0, color: '#ccc', fontSize: '13px', lineHeight: '1.5' }}>
          <strong>Antecipe-se à lei:</strong> A partir de 1º de janeiro de 2026, a NFS-e será obrigatória e padronizada nacionalmente. O Oficina IA já formata os dados da sua O.S. prontos para o <strong style={{ color: INFO }}>Emissor Nacional (gov.br)</strong>.
        </p>
      </div>

      {/* SUB-ABAS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'guia', label: '📖 Guia Prático' },
          { key: 'gerar', label: '📋 Gerar Dados da Nota' },
          { key: 'portais', label: '🌐 Portais Oficiais' },
        ].map(s => (
          <button key={s.key} onClick={() => setSubAba(s.key)}
            style={{ padding: '10px 20px', background: subAba === s.key ? COR : '#1a1a1a', color: subAba === s.key ? 'black' : '#888', border: `1px solid ${subAba === s.key ? COR : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: '0.2s' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ══════════ ABA: GUIA ══════════ */}
      {subAba === 'guia' && (
        <div className="animate-fade-in">

          {/* BLOCO 1: Entendendo */}
          <div style={{ background: '#111', border: `1px solid ${COR}33`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ color: COR, margin: '0 0 14px', fontSize: '16px' }}>💡 Entendendo as Notas da Oficina</h3>
            <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.6' }}>
              Na prática, você vende <strong style={{ color: 'white' }}>duas coisas diferentes</strong>, e cada uma vai para um sistema diferente do governo:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#001a0a', border: `2px solid ${COR}`, borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 6px', color: COR, fontWeight: '900', fontSize: '14px' }}>🔧 Mão de Obra</p>
                <p style={{ margin: '0 0 6px', color: '#aaa', fontSize: '12px' }}>Nota: <strong style={{ color: 'white' }}>NFS-e (Padrão Nacional)</strong></p>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Imposto vai para a <strong style={{ color: WARN }}>Prefeitura</strong> da sua cidade</p>
              </div>
              <div style={{ background: '#001a1f', border: `2px solid ${INFO}`, borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 6px', color: INFO, fontWeight: '900', fontSize: '14px' }}>🔩 Peças e Fluidos</p>
                <p style={{ margin: '0 0 6px', color: '#aaa', fontSize: '12px' }}>Nota: <strong style={{ color: 'white' }}>NF-e</strong></p>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Imposto vai para o <strong style={{ color: WARN }}>Estado (SEFAZ)</strong></p>
              </div>
            </div>

            {/* Dúvida do duplo imposto */}
            <div style={{ background: '#1a1a00', border: `1px solid ${WARN}`, borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <p style={{ color: WARN, fontWeight: '900', margin: '0 0 8px', fontSize: '13px' }}>❓ Dúvida comum: "Já comprei a peça com nota — vou pagar imposto duas vezes?"</p>
              <p style={{ color: '#ccc', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                <strong style={{ color: COR }}>Não!</strong> A maioria das peças tem o imposto recolhido na fábrica (Substituição Tributária — ST). Seu contador abate isso.<br /><br />
                Mas você <strong style={{ color: 'white' }}>é obrigado a emitir</strong> a nota da peça para o cliente para:
              </p>
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {['✅ Justificar sua margem de lucro', '✅ Dar baixa no estoque legal', '✅ Fornecer garantia da peça ao dono do carro'].map((t, i) => (
                  <p key={i} style={{ margin: 0, color: '#aaa', fontSize: '12px', padding: '6px 10px', background: '#1a1400', borderRadius: '6px', borderLeft: `3px solid ${COR}` }}>{t}</p>
                ))}
              </div>
            </div>

            {/* CPF / CNPJ */}
            <div style={{ background: '#0d0020', border: `1px solid ${ROXO}`, borderRadius: '10px', padding: '14px' }}>
              <p style={{ color: ROXO, fontWeight: '900', margin: '0 0 8px', fontSize: '13px' }}>👤 E quando o cliente não tem CPF/CNPJ?</p>
              <p style={{ color: '#ccc', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                Sem problema! Use <strong style={{ color: 'white' }}>CONSUMIDOR FINAL</strong> no campo de cliente. A maioria das prefeituras e a SEFAZ aceitam isso normalmente para valores mais baixos.
              </p>
            </div>
          </div>

          {/* REGRA DE OURO MEI */}
          <div style={{ background: 'linear-gradient(135deg, #1a1400, #0a0a00)', border: `2px solid ${WARN}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '28px' }}>⭐</span>
              <div>
                <p style={{ margin: 0, color: WARN, fontWeight: '900', fontSize: '15px' }}>Regra de Ouro do MEI</p>
                <p style={{ margin: 0, color: '#666', fontSize: '11px' }}>Informação que tira um peso enorme das costas do mecânico</p>
              </div>
            </div>
            <div style={{ background: '#0a0800', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <p style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
                Por lei, o <strong style={{ color: WARN }}>MEI não é obrigado a emitir nota fiscal para pessoa física (CPF)</strong> — apenas para pessoa jurídica (CNPJ), a não ser que o cliente pessoa física exija a nota.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { icon: '✅', text: 'Cliente com CNPJ (empresa) → nota obrigatória', cor: COR },
                { icon: '⚠️', text: 'Cliente com CPF (pessoa física) → só se ele pedir', cor: WARN },
                { icon: '💡', text: 'Se o cliente não pedir, você não é obrigado a emitir', cor: '#38bdf8' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', background: '#111', borderRadius: '8px', borderLeft: `3px solid ${item.cor}` }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                  <p style={{ margin: 0, color: '#ccc', fontSize: '12px', lineHeight: '1.5' }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: '16px' }}>🚀 Como Emitir — Escolha o tipo da sua empresa:</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[
                { key: 'mei', label: '⚙️ MEI', desc: 'Microempreendedor Individual' },
                { key: 'me', label: '🏢 ME/Simples', desc: 'Microempresa / Simples Nacional' },
              ].map(t => (
                <button key={t.key} onClick={() => setTipoEmpresa(tipoEmpresa === t.key ? '' : t.key)}
                  style={{ flex: 1, padding: '14px 10px', background: tipoEmpresa === t.key ? COR + '22' : '#0a0a0a', color: tipoEmpresa === t.key ? COR : '#666', border: `2px solid ${tipoEmpresa === t.key ? COR : '#333'}`, borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '16px', marginBottom: '2px' }}>{t.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.7 }}>{t.desc}</span>
                </button>
              ))}
            </div>

            {/* MEI */}
            {tipoEmpresa === 'mei' && (
              <div className="animate-fade-in">
                <div style={{ background: '#001a0a', border: `1px solid ${COR}`, borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                  <p style={{ color: COR, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🔧 MEI — Mão de Obra (NFS-e)</p>
                  {[
                    '1️⃣ O governo unificou a nota de serviço do MEI — é totalmente GRATUITO',
                    '2️⃣ Acesse o Portal Nacional da NFS-e (gov.br/nfse) ou baixe o app "NFS-e Mobile"',
                    '3️⃣ Use os dados da O.S. do Oficina IA (aba "Gerar Dados da Nota" ao lado)',
                    '4️⃣ Cole no portal, descreva o serviço e emita',
                  ].map((p, i) => (
                    <p key={i} style={{ margin: '0 0 6px', color: '#ccc', fontSize: '12px', padding: '8px 10px', background: '#002a10', borderRadius: '6px', borderLeft: `3px solid ${COR}` }}>{p}</p>
                  ))}
                </div>
                <div style={{ background: '#001a1f', border: `1px solid ${INFO}`, borderRadius: '10px', padding: '16px' }}>
                  <p style={{ color: INFO, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🔩 MEI — Peças (NF-e Avulsa)</p>
                  {[
                    '1️⃣ O MEI usa a "Nota Fiscal Avulsa Eletrônica" (NFA-e)',
                    '2️⃣ Acesse o site da SEFAZ do seu Estado',
                    '3️⃣ Procure por "NFA-e" ou "Nota Fiscal Avulsa de Produtor" — é gratuito',
                    '4️⃣ Use os dados de peças da O.S. do Oficina IA',
                  ].map((p, i) => (
                    <p key={i} style={{ margin: '0 0 6px', color: '#ccc', fontSize: '12px', padding: '8px 10px', background: '#001a22', borderRadius: '6px', borderLeft: `3px solid ${INFO}` }}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* ME */}
            {tipoEmpresa === 'me' && (
              <div className="animate-fade-in">
                <div style={{ background: '#001a0a', border: `1px solid ${COR}`, borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                  <p style={{ color: COR, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🔧 ME/Simples — Mão de Obra (NFS-e Nacional)</p>
                  {[
                    '1️⃣ Com a lei de 2026, você também deverá usar o Portal Nacional ou sistema integrado',
                    '2️⃣ Acesse o Portal Nacional NFS-e ou o sistema da sua Prefeitura (se ainda vigente)',
                    '3️⃣ Use os dados da O.S. gerados aqui no Oficina IA',
                    '4️⃣ Descreva o serviço (ex: Troca de óleo + filtro + alinhamento)',
                  ].map((p, i) => (
                    <p key={i} style={{ margin: '0 0 6px', color: '#ccc', fontSize: '12px', padding: '8px 10px', background: '#002a10', borderRadius: '6px', borderLeft: `3px solid ${COR}` }}>{p}</p>
                  ))}
                </div>
                <div style={{ background: '#001a1f', border: `1px solid ${INFO}`, borderRadius: '10px', padding: '16px' }}>
                  <p style={{ color: INFO, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🔩 ME/Simples — Peças (NF-e)</p>
                  {[
                    '1️⃣ Você precisará do Certificado Digital (A1 ou A3)',
                    '2️⃣ Use o Emissor Gratuito do Sebrae ou similar',
                    '3️⃣ Copie a lista de peças da O.S. do Oficina IA (aba Gerar Dados)',
                    '4️⃣ Lance no emissor e gere o DANFE para o cliente',
                  ].map((p, i) => (
                    <p key={i} style={{ margin: '0 0 6px', color: '#ccc', fontSize: '12px', padding: '8px 10px', background: '#001a22', borderRadius: '6px', borderLeft: `3px solid ${INFO}` }}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {!tipoEmpresa && (
              <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', margin: '10px 0' }}>👆 Selecione o tipo da sua empresa para ver o passo a passo</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════ ABA: GERAR DADOS ══════════ */}
      {subAba === 'gerar' && (
        <div className="animate-fade-in">
          <div style={{ background: '#1a0525', border: `1px solid ${ROXO}55`, borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(168,85,247,0.1)' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <p style={{ color: '#c4b5fd', fontSize: '12px', margin: 0, fontWeight: 'bold' }}>AUTOMAÇÃO IA: Digite a placa e clique na lupa (ou aperte Enter). O sistema buscará os dados da última O.S. automaticamente!</p>
          </div>

          {/* Campos */}
          <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #222', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: ROXO }}></div>

            <p style={{ color: ROXO, fontSize: '10px', fontWeight: '900', letterSpacing: '1.5px', margin: '0 0 16px' }}>CARREGAR DADOS DA O.S.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>

              {/* CAMPO DA PLACA COM BOTÃO DE LUPA EMBUTIDO */}
              <div style={{ position: 'relative', width: '100%' }}>
                <input value={placa}
                  onChange={e => setPlaca(e.target.value.toUpperCase())}
                  onBlur={(e) => buscarDadosPorPlaca(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') buscarDadosPorPlaca(e.target.value); }}
                  placeholder="PLACA (Ex: ABC1234)"
                  style={{ padding: '16px', paddingRight: '48px', background: '#111', border: `1px solid ${ROXO}88`, color: 'white', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box', width: '100%', boxShadow: `0 0 15px ${ROXO}22` }} />

                <button
                  onClick={() => buscarDadosPorPlaca(placa)}
                  title="Buscar O.S."
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: ROXO, border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                  🔍
                </button>
              </div>

              <input value={modeloCarro} onChange={e => setModeloCarro(e.target.value)} placeholder="Modelo (ex: Gol 1.0)"
                style={{ padding: '16px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box', width: '100%' }} />

              <input value={numeroOS} onChange={e => setNumeroOS(e.target.value.toUpperCase())} placeholder="Nº da O.S. (ex: AB1234)"
                style={{ padding: '16px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box', width: '100%' }} />
            </div>

            <p style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', margin: '20px 0 12px', borderTop: '1px solid #222', paddingTop: '20px' }}>👤 DADOS DO CLIENTE</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome do cliente (ou Consumidor Final)"
                style={{ padding: '14px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', fontSize: '13px', boxSizing: 'border-box', width: '100%' }} />
              <input value={documento} onChange={e => setDocumento(e.target.value)} placeholder="CPF ou CNPJ (opcional)"
                style={{ padding: '14px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', fontSize: '13px', boxSizing: 'border-box', width: '100%' }} />
            </div>
          </div>

          {/* NFS-e — Serviço */}
          <div style={{ background: '#0a0a0a', border: `1px solid ${COR}55`, borderRadius: '16px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: COR, color: 'black', fontSize: '9px', fontWeight: '900', padding: '6px 12px', borderBottomLeftRadius: '12px', letterSpacing: '1px' }}>PORTAL NACIONAL 2026</div>
            <p style={{ color: COR, fontWeight: '900', margin: '0 0 16px', fontSize: '15px' }}>🔧 NFS-e — Mão de Obra</p>
            <textarea value={servicos} onChange={e => setServicos(e.target.value)}
              placeholder="Ex: Troca de óleo + filtro de óleo&#10;Alinhamento e balanceamento"
              rows={3} style={{ width: '100%', padding: '16px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', resize: 'vertical', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px' }} />
            <input value={valorServico} onChange={e => setValorServico(e.target.value)} placeholder="Valor da Mão de Obra (ex: 350)"
              type="number" style={{ width: '100%', padding: '20px', background: '#050505', border: `1px solid ${COR}44`, color: COR, borderRadius: '12px', fontSize: '24px', fontWeight: '900', textAlign: 'center', boxSizing: 'border-box', marginBottom: '20px' }} />

            {/* Preview NFS-e */}
            <button onClick={() => copiar(textoNFSe, setCopiadoNFS)}
              style={{ width: '100%', padding: '18px', background: copiadoNFS ? COR : COR + '11', color: copiadoNFS ? 'black' : COR, border: `1px solid ${COR}`, borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {copiadoNFS ? '✅ Copiado! Cole no Emissor Nacional' : '📄 Copiar Texto Pronto para NFS-e'}
            </button>
          </div>

          {/* NF-e — Peças */}
          <div style={{ background: '#0a0a0a', border: `1px solid ${INFO}55`, borderRadius: '16px', padding: '24px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: INFO, color: 'black', fontSize: '9px', fontWeight: '900', padding: '6px 12px', borderBottomLeftRadius: '12px', letterSpacing: '1px' }}>SEFAZ ESTADUAL</div>
            <p style={{ color: INFO, fontWeight: '900', margin: '0 0 16px', fontSize: '15px' }}>📦 NF-e — Peças e Fluidos</p>
            <textarea value={pecas} onChange={e => setPecas(e.target.value)}
              placeholder="Ex: 1x Óleo 5W30 Castrol – R$89,00&#10;1x Filtro de óleo – R$35,00"
              rows={4} style={{ width: '100%', padding: '16px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '12px', resize: 'vertical', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px' }} />
            <input value={valorPecas} onChange={e => setValorPecas(e.target.value)} placeholder="Valor total das Peças (ex: 244)"
              type="number" style={{ width: '100%', padding: '20px', background: '#050505', border: `1px solid ${INFO}44`, color: INFO, borderRadius: '12px', fontSize: '24px', fontWeight: '900', textAlign: 'center', boxSizing: 'border-box', marginBottom: '20px' }} />

            {/* Preview NF-e */}
            <button onClick={() => copiar(textoNFe, setCopiadoNFe)}
              style={{ width: '100%', padding: '18px', background: copiadoNFe ? INFO : INFO + '11', color: copiadoNFe ? 'black' : INFO, border: `1px solid ${INFO}`, borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {copiadoNFe ? '✅ Copiado! Cole na SEFAZ' : '📦 Copiar Texto Pronto para NF-e'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ABA: PORTAIS ══════════ */}
      {subAba === 'portais' && (
        <div className="animate-fade-in">
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            <h3 style={{ color: COR, margin: '0 0 16px', fontSize: '15px' }}>🟢 NFS-e — Mão de Obra</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '🌐 Portal Nacional NFS-e (gov.br)', url: 'https://www.gov.br/nfse/pt-br', desc: 'Emissor Padrão Nacional (Obrigatório em 2026)' },
                { label: '📱 App NFS-e Mobile (Android)', url: 'https://play.google.com/store/search?q=nfse+mobile', desc: 'Emita pelo celular' },
                { label: '📱 App NFS-e Mobile (iOS)', url: 'https://apps.apple.com/br/app/nfs-e-mobile/id1090373239', desc: 'Emita pelo celular' },
              ].map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#001a0a', border: `1px solid ${COR}33`, borderRadius: '10px', textDecoration: 'none' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', color: COR, fontWeight: 'bold', fontSize: '13px' }}>{item.label}</p>
                    <p style={{ margin: 0, color: '#555', fontSize: '11px' }}>{item.desc}</p>
                  </div>
                  <span style={{ color: COR, fontSize: '18px' }}>→</span>
                </a>
              ))}
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            <h3 style={{ color: INFO, margin: '0 0 16px', fontSize: '15px' }}>🔵 NF-e — Peças (SEFAZ Estadual)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '🌐 SEFAZ Nacional — Consulta', url: 'https://www.nfe.fazenda.gov.br', desc: 'Portal federal da NF-e' },
                { label: '💻 Emissor Gratuito SEBRAE', url: 'https://www.sebrae.com.br/sites/PortalSebrae/bis/emissao-de-nota-fiscal-eletronica', desc: 'Emissor NF-e gratuito para ME/MEI' },
                { label: '🌐 SEFAZ MG', url: 'https://www.fazenda.mg.gov.br', desc: 'Minas Gerais' },
              ].map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#001a1f', border: `1px solid ${INFO}22`, borderRadius: '10px', textDecoration: 'none' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', color: INFO, fontWeight: 'bold', fontSize: '13px' }}>{item.label}</p>
                    <p style={{ margin: 0, color: '#555', fontSize: '11px' }}>{item.desc}</p>
                  </div>
                  <span style={{ color: INFO, fontSize: '18px' }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}