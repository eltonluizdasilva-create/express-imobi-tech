import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
  const navigate = useNavigate();

  return (
    <div style={{
      background: '#000',
      minHeight: '100vh',
      color: '#ccc',
      fontFamily: 'system-ui, sans-serif',
      padding: 'clamp(20px, 5vw, 60px)',
      lineHeight: 1.6
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '40px',
            fontSize: '13px'
          }}
        >
          ← VOLTAR
        </button>

        <header style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '40px' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 10px 0', fontWeight: '900' }}>
            Política de Privacidade
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Em conformidade com a LGPD (Lei Federal 13.709/2018)</p>
        </header>

        <section style={{ display: 'grid', gap: '30px' }}>
          <div style={{ background: 'rgba(0,230,118,0.05)', borderLeft: '4px solid #00E676', padding: '20px', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '16px' }}>🔑 Princípio do Menor Privilégio</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Nós apenas coletamos as informações estritamente necessárias para fornecer os serviços de gestão automotiva. Nossos servidores hospedados no Google Cloud Firestore utilizam criptografia de dados em trânsito e repouso (AES-256).
            </p>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>1. Dados que Coletamos e Por Que</h2>
            <ul style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Dados de Conta do Dono</strong>: Nome, e-mail institucional e telefone. Servem para autenticação no console do Firebase Auth e comunicações sobre faturamento ou atualizações de segurança.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Dados Operacionais da Oficina</strong>: Logotipo, CNPJ, alvarás (bombeiro/sanitário) e licenças ambientais. Utilizados estritamente para preencher o painel de Gestão de Conformidade e gerar certificados de impressão.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Dados de Clientes da Oficina</strong>: Nome do cliente final, placa, telefone e marca/modelo do veículo. Processados na nuvem para que você gere recibos digitais e envie ordens de serviço pelo portal do cliente.
              </li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>2. Transferência e Compartilhamento de Dados</h2>
            <p>
              O Express Auto Tech <strong>nunca comercializa nem cede seus dados</strong> para corretoras de anúncios, seguradoras ou terceiros. O compartilhamento de dados ocorre apenas nas seguintes hipóteses técnicas:
            </p>
            <ol style={{ paddingLeft: '20px' }}>
              <li style={{ marginBottom: '5px' }}>Comunicações e envio de mensagens de revisão integrados ao WhatsApp Business API (via gateway cadastrado pela oficina).</li>
              <li style={{ marginBottom: '5px' }}>Provedores de infraestrutura Cloud e Autenticação (Google Firebase e Cloud Run).</li>
            </ol>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>3. Política de Cookies Inteligentes</h2>
            <p>
              Nosso portal utiliza cookies estritamente funcionais para manter o seu token de login ativo com segurança. Scripts de análise e métricas externas (como Pixel do Facebook ou Analytics) são **totalmente bloqueados** até que você forneça seu consentimento expresso através da barra de privacidade na entrada.
            </p>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>4. Seus Direitos (Direito ao Esquecimento)</h2>
            <p>
              Como titular dos dados, você possui o direito pleno de:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>
              <li>Confirmar a existência de tratamento e acessar seus dados em tempo real.</li>
              <li>Corrigir dados incompletos ou desatualizados na aba Configurações.</li>
              <li><strong>Excluir todos os seus dados definitivamente</strong> a qualquer momento, acionando a rotina em cascata do Firestore nas configurações da sua conta.</li>
            </ul>
          </div>
        </section>

        <footer style={{ marginTop: '60px', borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
          Ambiente Blindado & Protegido · Express Auto Tech © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
