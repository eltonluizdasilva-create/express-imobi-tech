/* eslint-disable no-unused-vars */
import React, { useState } from 'react';

const COR = '#00E676';
const COR2 = '#00b85c';
const WARN = '#eab308';
const INFO = '#38bdf8';
const ROXO = '#a855f7';

export default function NotaFiscal() {
  const [tipoEmpresa, setTipoEmpresa] = useState(''); // 'mei' | 'me'
  const [subAba, setSubAba] = useState('guia');

  // ── Gerador de texto ──
  const [nomeCliente,  setNomeCliente]  = useState('');
  const [documento,    setDocumento]    = useState('');
  const [placa,        setPlaca]        = useState('');
  const [modeloCarro,  setModeloCarro]  = useState('');
  const [numeroOS,     setNumeroOS]     = useState('');
  const [servicos,     setServicos]     = useState('');
  const [valorServico, setValorServico] = useState('');
  const [pecas,        setPecas]        = useState('');
  const [valorPecas,   setValorPecas]   = useState('');

  const [copiadoNFS, setCopiadoNFS] = useState(false);
  const [copiadoNFe, setCopiadoNFe] = useState(false);

  const clienteDoc = documento.trim() || 'Consumidor Final';
  const formatMoeda = (v) => {
    const n = parseFloat((v||'').replace(',','.'));
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  };

  const textoNFSe = `DADOS PARA NFS-e (Mão de Obra)
─────────────────────────────
Cliente: ${nomeCliente || 'CONSUMIDOR FINAL'}
Documento: ${clienteDoc}
Veículo: ${placa ? `${placa.toUpperCase()} – ${modeloCarro}` : modeloCarro || '–'}
Referente à O.S.: #${numeroOS || '–'}

Descrição do Serviço:
${servicos || '–'}

Valor do Serviço: ${formatMoeda(valorServico)}
─────────────────────────────
Emita no portal da Prefeitura (NFS-e)`;

  const textoNFe = `DADOS PARA NF-e (Peças e Fluidos)
─────────────────────────────
Cliente: ${nomeCliente || 'CONSUMIDOR FINAL'}
Documento: ${clienteDoc}
Referente à O.S.: #${numeroOS || '–'}

Produto: Peças utilizadas conforme O.S. #${numeroOS || '–'}
Descrição:
${pecas || '–'}

Valor Total: ${formatMoeda(valorPecas)}
─────────────────────────────
Emita na SEFAZ do seu Estado`;

  const copiar = (texto, setCopied) => {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ─────────────────────────────────────────
  return (
    <div style={{ color: 'white', fontFamily: 'sans-serif' }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg, ${COR}18, transparent)`, border: `1px solid ${COR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', color: COR, fontSize: '22px', fontWeight: '900' }}>🧾 Central de Emissão Fiscal</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>O Oficina IA organiza toda a sua gestão. Use esses dados prontos para emitir a nota oficial no portal do governo em menos de 1 minuto.</p>
      </div>

      {/* SUB-ABAS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'guia',    label: '📖 Guia Prático' },
          { key: 'gerar',   label: '📋 Gerar Dados da Nota' },
          { key: 'portais', label: '🌐 Portais Oficiais' },
        ].map(s => (
          <button key={s.key} onClick={() => setSubAba(s.key)}
            style={{ padding: '10px 20px', background: subAba === s.key ? COR : '#1a1a1a', color: subAba === s.key ? 'black' : '#888', border: `1px solid ${subAba === s.key ? COR : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ══════════ ABA: GUIA ══════════ */}
      {subAba === 'guia' && (
        <div>

          {/* BLOCO 1: Entendendo */}
          <div style={{ background: '#111', border: `1px solid ${COR}33`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ color: COR, margin: '0 0 14px', fontSize: '16px' }}>💡 Entendendo as Notas da Oficina</h3>
            <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 16px', lineHeight: '1.6' }}>
              Na prática, você vende <strong style={{ color: 'white' }}>duas coisas diferentes</strong>, e cada uma vai para um sistema diferente do governo:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#001a0a', border: `2px solid ${COR}`, borderRadius: '12px', padding: '16px' }}>
                <p style={{ margin: '0 0 6px', color: COR, fontWeight: '900', fontSize: '14px' }}>🔧 Mão de Obra</p>
                <p style={{ margin: '0 0 6px', color: '#aaa', fontSize: '12px' }}>Nota: <strong style={{ color: 'white' }}>NFS-e</strong></p>
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
                Sem problema! Use <strong style={{ color: 'white' }}>CONSUMIDOR FINAL</strong> no campo de cliente. A maioria das prefeituras e a SEFAZ aceitam isso normalmente para valores mais baixos.<br /><br />
                <span style={{ color: '#666', fontSize: '11px' }}>Acima de R$ 500 algumas prefeituras exigem CPF — consulte seu contador.</span>
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
              <p style={{ color: '#444', fontSize: '10px', margin: '12px 0 0', lineHeight: '1.5' }}>
                📌 Fonte: Lei Complementar 123/2006, Art. 26 §2º. Consulte seu contador para casos específicos.
              </p>
            </div>


          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ color: 'white', margin: '0 0 14px', fontSize: '16px' }}>🚀 Como Emitir — Escolha o tipo da sua empresa:</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[
                { key: 'mei', label: '⚙️ MEI', desc: 'Microempreendedor Individual' },
                { key: 'me',  label: '🏢 ME/Simples', desc: 'Microempresa / Simples Nacional' },
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
              <div>
                <div style={{ background: '#001a0a', border: `1px solid ${COR}`, borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                  <p style={{ color: COR, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🔧 MEI — Mão de Obra (NFS-e)</p>
                  {[
                    '1️⃣ O governo unificou a nota de serviço do MEI — é totalmente GRATUITO',
                    '2️⃣ Acesse o Portal Nacional da NFS-e (nfse.gov.br) ou baixe o app "NFS-e Mobile"',
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
              <div>
                <div style={{ background: '#001a0a', border: `1px solid ${COR}`, borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                  <p style={{ color: COR, fontWeight: '900', margin: '0 0 10px', fontSize: '13px' }}>🔧 ME/Simples — Mão de Obra (NFS-e)</p>
                  {[
                    '1️⃣ Acesse o portal da Prefeitura da sua cidade (cada cidade tem o seu)',
                    '2️⃣ Procure por "Nota Fiscal de Serviços Eletrônica" ou "NFS-e"',
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
                  <div style={{ marginTop: '10px', background: '#1a1a00', border: `1px solid ${WARN}`, borderRadius: '8px', padding: '10px' }}>
                    <p style={{ color: WARN, fontSize: '11px', margin: 0 }}>💡 <strong>Dica:</strong> O Sebrae oferece cursos gratuitos online de emissão de NF-e para mecânicos e oficinas.</p>
                  </div>
                </div>
              </div>
            )}

            {!tipoEmpresa && (
              <p style={{ color: '#444', fontSize: '13px', textAlign: 'center', margin: '10px 0' }}>👆 Selecione o tipo da sua empresa para ver o passo a passo</p>
            )}
          </div>

          {/* BLOCO 3: Disclaimer */}
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '16px' }}>
            <p style={{ color: '#555', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 8px' }}>🔒 TERMO DE RESPONSABILIDADE</p>
            <p style={{ color: '#555', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              O <strong style={{ color: '#777' }}>Oficina IA</strong> é um sistema de gestão gerencial. O cupom de Ordem de Serviço gerado pelo sistema serve para controle interno, conferência do cliente e garantia, mas <strong style={{ color: '#777' }}>não substitui a Nota Fiscal Oficial</strong> (NF-e / NFS-e). A emissão dos documentos fiscais nos portais do governo é de responsabilidade exclusiva do estabelecimento prestador do serviço.
            </p>
          </div>
        </div>
      )}

      {/* ══════════ ABA: GERAR DADOS ══════════ */}
      {subAba === 'gerar' && (
        <div>
          <div style={{ background: '#0d0020', border: `1px solid ${ROXO}33`, borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ color: ROXO, fontSize: '12px', margin: 0 }}>💡 Preencha os dados abaixo (ou copie da sua O.S.) → o sistema monta o texto pronto para colar no portal da Prefeitura e na SEFAZ.</p>
          </div>

          {/* Campos */}
          <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
            <p style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', margin: '0 0 12px' }}>👤 DADOS DO CLIENTE</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome do cliente (ou deixe vazio = Consumidor Final)"
                style={{ padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', width: '100%', gridColumn: '1 / -1' }} />
              <input value={documento} onChange={e => setDocumento(e.target.value)} placeholder="CPF ou CNPJ (opcional)"
                style={{ padding: '11px', background: '#0a0a0a', border: `1px solid ${documento ? ROXO : '#333'}`, color: ROXO, borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', width: '100%' }} />
              <div style={{ padding: '11px', background: '#0a0a0a', border: '1px dashed #333', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#444', fontSize: '11px' }}>{documento ? '' : '→ Sem doc: usa "Consumidor Final"'}</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
            <p style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', margin: '0 0 12px' }}>🚗 DADOS DO VEÍCULO / OS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="PLACA"
                style={{ padding: '11px', background: '#0a0a0a', border: `1px solid ${COR}44`, color: COR, borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', boxSizing: 'border-box', width: '100%' }} />
              <input value={modeloCarro} onChange={e => setModeloCarro(e.target.value)} placeholder="Modelo (ex: Fiat Palio 1.0)"
                style={{ padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', width: '100%' }} />
              <input value={numeroOS} onChange={e => setNumeroOS(e.target.value.toUpperCase())} placeholder="Número da O.S. (ex: AB1234)"
                style={{ padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: WARN, borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', boxSizing: 'border-box', width: '100%' }} />
            </div>
          </div>

          {/* NFS-e — Serviço */}
          <div style={{ background: '#001a0a', border: `2px solid ${COR}`, borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
            <p style={{ color: COR, fontWeight: '900', margin: '0 0 12px', fontSize: '14px' }}>🔧 NFS-e — Mão de Obra</p>
            <textarea value={servicos} onChange={e => setServicos(e.target.value)}
              placeholder="Ex: Troca de óleo + filtro de óleo&#10;Alinhamento e balanceamento&#10;Troca de velas"
              rows={3} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'vertical', fontSize: '12px', boxSizing: 'border-box', marginBottom: '10px' }} />
            <input value={valorServico} onChange={e => setValorServico(e.target.value)} placeholder="Valor da Mão de Obra (ex: 350)"
              type="number" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: `1px solid ${COR}44`, color: COR, borderRadius: '8px', fontSize: '20px', fontWeight: '900', textAlign: 'center', boxSizing: 'border-box', marginBottom: '12px' }} />

            {/* Preview NFS-e */}
            <pre style={{ background: '#002a10', border: `1px solid ${COR}33`, borderRadius: '8px', padding: '12px', color: '#aaa', fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '0 0 12px' }}>
              {textoNFSe}
            </pre>
            <button onClick={() => copiar(textoNFSe, setCopiadoNFS)}
              style={{ width: '100%', padding: '14px', background: copiadoNFS ? COR : COR + '22', color: copiadoNFS ? 'black' : COR, border: `1px solid ${COR}`, borderRadius: '10px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}>
              {copiadoNFS ? '✅ Copiado! Cole no portal da Prefeitura' : '📋 COPIAR TEXTO DA NFS-e'}
            </button>
          </div>

          {/* NF-e — Peças */}
          <div style={{ background: '#001a1f', border: `2px solid ${INFO}`, borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
            <p style={{ color: INFO, fontWeight: '900', margin: '0 0 12px', fontSize: '14px' }}>🔩 NF-e — Peças e Fluidos</p>
            <textarea value={pecas} onChange={e => setPecas(e.target.value)}
              placeholder="Ex: 1x Óleo 5W30 Castrol – R$89,00&#10;1x Filtro de óleo – R$35,00&#10;4x Velas NGK – R$120,00"
              rows={4} style={{ width: '100%', padding: '11px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'vertical', fontSize: '12px', boxSizing: 'border-box', marginBottom: '10px' }} />
            <input value={valorPecas} onChange={e => setValorPecas(e.target.value)} placeholder="Valor total das Peças (ex: 244)"
              type="number" style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: `1px solid ${INFO}44`, color: INFO, borderRadius: '8px', fontSize: '20px', fontWeight: '900', textAlign: 'center', boxSizing: 'border-box', marginBottom: '12px' }} />

            {/* Preview NF-e */}
            <pre style={{ background: '#001a22', border: `1px solid ${INFO}33`, borderRadius: '8px', padding: '12px', color: '#aaa', fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.6', margin: '0 0 12px' }}>
              {textoNFe}
            </pre>
            <button onClick={() => copiar(textoNFe, setCopiadoNFe)}
              style={{ width: '100%', padding: '14px', background: copiadoNFe ? INFO : INFO + '22', color: copiadoNFe ? 'black' : INFO, border: `1px solid ${INFO}`, borderRadius: '10px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}>
              {copiadoNFe ? '✅ Copiado! Cole na SEFAZ' : '📋 COPIAR TEXTO DA NF-e'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ ABA: PORTAIS ══════════ */}
      {subAba === 'portais' && (
        <div>
          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            <h3 style={{ color: COR, margin: '0 0 16px', fontSize: '15px' }}>🟢 NFS-e — Mão de Obra (Prefeitura)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '🌐 Portal Nacional NFS-e (MEI)', url: 'https://www.nfse.gov.br', desc: 'Para MEI — gratuito e federal' },
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
              <div style={{ background: '#1a1a00', border: `1px solid ${WARN}`, borderRadius: '10px', padding: '12px' }}>
                <p style={{ color: WARN, fontSize: '12px', margin: 0 }}>⚠️ <strong>Para ME/Simples:</strong> procure o portal da Prefeitura da sua cidade. Cada prefeitura tem o seu sistema. Pesquise: <em>"NFS-e Prefeitura de [sua cidade]"</em></p>
              </div>
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            <h3 style={{ color: INFO, margin: '0 0 16px', fontSize: '15px' }}>🔵 NF-e — Peças (SEFAZ Estadual)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '🌐 SEFAZ Nacional — Consulta', url: 'https://www.nfe.fazenda.gov.br', desc: 'Portal federal da NF-e' },
                { label: '💻 Emissor Gratuito SEBRAE', url: 'https://www.sebrae.com.br/sites/PortalSebrae/bis/emissao-de-nota-fiscal-eletronica', desc: 'Emissor NF-e gratuito para ME/MEI' },
                { label: '🌐 SEFAZ SP', url: 'https://www.fazenda.sp.gov.br', desc: 'São Paulo' },
                { label: '🌐 SEFAZ MG', url: 'https://www.fazenda.mg.gov.br', desc: 'Minas Gerais' },
                { label: '🌐 SEFAZ RJ', url: 'https://www.fazenda.rj.gov.br', desc: 'Rio de Janeiro' },
                { label: '🌐 SEFAZ RS', url: 'https://www.sefaz.rs.gov.br', desc: 'Rio Grande do Sul' },
                { label: '🌐 SEFAZ PR', url: 'https://www.fazenda.pr.gov.br', desc: 'Paraná' },
                { label: '🌐 SEFAZ BA', url: 'https://www.sefaz.ba.gov.br', desc: 'Bahia' },
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

          {/* Disclaimer */}
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px' }}>
            <p style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px' }}>🔒 AVISO LEGAL</p>
            <p style={{ color: '#444', fontSize: '11px', lineHeight: '1.5', margin: 0 }}>Os links acima são portais oficiais do governo brasileiro. O Oficina IA não tem vínculo com esses órgãos. Em caso de dúvidas fiscais, consulte seu contador.</p>
          </div>
        </div>
      )}
    </div>
  );
}
