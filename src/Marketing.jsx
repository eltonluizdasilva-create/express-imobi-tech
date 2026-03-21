import React, { useState } from 'react';

const AbaMarketing = () => {
  // 1. A sua lista de serviços agora mora aqui dentro!
  const SERVICOS_MARKETING_DEFAULT = [
    { key: 'trafego_pago', icon: '🎯', nome: 'Tráfego Pago', desc: 'Anúncios no Google e Meta (Facebook/Instagram) para atrair clientes novos todos os dias. Você define o orçamento de mídia, nós cuidamos de tudo.', preco: 'Sob consulta' },
    { key: 'google_negocio', icon: '📍', nome: 'Google Meu Negócio', desc: 'Otimização do seu perfil no Google Maps. Quando alguém pesquisar "oficina perto de mim", sua oficina aparece em destaque.', preco: 'Sob consulta' },
    { key: 'site', icon: '🌐', nome: 'Criação de Site', desc: 'Site profissional com domínio, hospedagem e integração com WhatsApp. Passa credibilidade e funciona como vendedor 24h.', preco: 'Sob consulta' },
    { key: 'whatsapp_bot', icon: '🤖', nome: 'Automação de Atendimento', desc: 'Bot inteligente no WhatsApp que responde clientes automaticamente, agenda serviços e reativa clientes inativos - sem você fazer nada.', preco: 'Módulo Premium' },
    { key: 'redes_sociais', icon: '📱', nome: 'Gestão de Redes Sociais', desc: 'Criação e publicação de posts no Instagram e Facebook. Conteúdo profissional que gera confiança e atrai clientes locais.', preco: 'Sob consulta' },
    { key: 'conteudo', icon: '🎨', nome: 'Criação de Conteúdo', desc: 'Artes, vídeos curtos e stories prontos para você publicar. Sua oficina com visual profissional sem precisar entender de design.', preco: 'Sob consulta' },
    { key: 'seo_local', icon: '🔍', nome: 'SEO Local', desc: 'Posicionamento orgânico nos buscadores. Apareça no Google quando clientes da sua cidade pesquisarem serviços que você oferece.', preco: 'Sob consulta' },
    { key: 'relatorio', icon: '📊', nome: 'Relatório Mensal', desc: 'Relatório completo de resultados: quantos clientes vieram do Google, do Instagram, quantos retornaram. Transparência total do investimento.', preco: 'Incluso' },
  ];

  const [servicosMarketing] = useState(SERVICOS_MARKETING_DEFAULT);

  const contratarServico = (nome) => {
    const seuZap = "5534999999999"; // COLOQUE SEU ZAP AQUI
    const msg = encodeURIComponent(`Olá Elton! Vi no sistema Oficina IA e tenho interesse no serviço: ${nome}. Como começamos?`);
    window.open(`https://wa.me/${seuZap}?text=${msg}`, '_blank');
  };

  return (
    <div style={{ padding: '20px', color: '#ddd', maxWidth: '1200px', margin: '0 auto' }}>

      {/* CABEÇALHO IMPACTANTE */}
      <div style={{
        textAlign: 'center',
        padding: '30px',
        background: '#0a0a0a',
        borderRadius: '15px',
        border: '1px solid #00E676',
        boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)',
        marginBottom: '40px'
      }}>
        <h1 style={{ color: '#00E676', margin: '0 0 10px 0', fontSize: '28px' }}>🚀 CENTRAL DE MARKETING EXPRESS AI</h1>
        <p style={{ color: '#888', fontSize: '15px' }}>Transforme sua oficina na maior autoridade da região com marketing de alta performance.</p>
      </div>

      {/* GRID DE SERVIÇOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {servicosMarketing.map((s) => (
          <div key={s.key} style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: '0.3s'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontSize: '30px' }}>{s.icon}</span>
                <span style={{ fontSize: '11px', color: '#00E676', border: '1px solid #00E676', padding: '2px 8px', borderRadius: '10px', height: 'fit-content' }}>
                  {s.preco || 'CONSULTAR'}
                </span>
              </div>
              <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '10px' }}>{s.nome}</h3>
              <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.6', marginBottom: '20px' }}>
                {s.desc}
              </p>
            </div>

            <button
              onClick={() => contratarServico(s.nome)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                color: '#00E676',
                border: '1px solid #00E676',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              🚀 Contratar Agora
            </button>
          </div>
        ))}
      </div>

      {/* 🤖 SEÇÃO: O FUTURO - ESCALABILIDADE GLOBAL */}
      <div style={{ marginTop: '60px', borderTop: '2px solid #333', paddingTop: '40px' }}>
        <h2 style={{ color: '#ff3333', fontSize: '26px', marginBottom: '30px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px' }}>
          🌐 ROADMAP GLOBAL: EXPRESS AI TECH
        </h2>

        <div style={{
          background: 'rgba(255, 51, 51, 0.05)',
          border: '1px solid #ff3333',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 0 30px rgba(255, 51, 51, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Efeito de fundo para dar profundidade */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', fontSize: '150px', opacity: '0.03', color: '#ff3333' }}>🤖</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

            {/* 📞 SECRETÁRIA ONLINE 24H (IA DE VOZ & ZAP) */}
            <div style={{ background: '#000', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #ff3333' }}>
              <h3 style={{ color: '#fff', margin: '0 0 15px 0', fontSize: '20px' }}>📞 Secretária Digital Global 24h</h3>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7' }}>
                <strong>UTILIDADE:</strong> Atendimento ininterrupto por Voz e WhatsApp com IA Multilíngue.
                <br /><br />
                <span style={{ color: '#ff3333' }}>✔ Atende, tira dúvidas técnicas, agenda serviços e gera orçamentos sem intervenção humana. Sua oficina aberta 24/7 para o mundo.</span>
              </p>
            </div>

            {/* 💰 GESTÃO FINANCEIRA INTELIGENTE */}
            <div style={{ background: '#000', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #3b82f6' }}>
              <h3 style={{ color: '#3b82f6', margin: '0 0 15px 0', fontSize: '20px' }}>💰 Recuperação de Ativos (Finança IA)</h3>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7' }}>
                <strong>UTILIDADE:</strong> Auditoria automática de inadimplência e cobrança inteligente via IA.
                <br /><br />
                <span style={{ color: '#3b82f6' }}>✔ Detecta dinheiro parado, calcula impostos automaticamente e executa a cobrança no WhatsApp com persuasão de alto nível.</span>
              </p>
            </div>

            {/* 📅 AGENDA PREDITIVA */}
            <div style={{ background: '#000', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #00E676' }}>
              <h3 style={{ color: '#00E676', margin: '0 0 15px 0', fontSize: '20px' }}>📅 Preenchimento de Agenda IA</h3>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7' }}>
                <strong>UTILIDADE:</strong> Redução de ociosidade zero. A IA monitora horários vazios e dispara campanhas para clientes inativos.
                <br /><br />
                <span style={{ color: '#00E676' }}>✔ Se a oficina ficar vazia amanhã, a IA "caça" clientes e preenche o pátio automaticamente.</span>
              </p>
            </div>

          </div>

          <div style={{ marginTop: '30px', textAlign: 'center', color: '#ff3333', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
            🚀 Status: Em expansão global. Tecnologia escalável para qualquer país.
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '40px' }}>
        Ao clicar em Contratar, sua solicitação é enviada para a Express AI Tech e entraremos em contato em até 24h úteis.
      </p>
    </div>
  );
};

export default AbaMarketing;
