import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Termos() {
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
            Termos de Uso
          </h1>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Última atualização: Maio de 2026</p>
        </header>

        <section style={{ display: 'grid', gap: '30px' }}>
          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>1. Objeto dos Serviços</h2>
            <p>
              O <strong>Express Auto Tech</strong> é um software de gestão na nuvem voltado para proprietários de oficinas mecânicas, operando sob a modalidade SaaS (Software as a Service). O sistema oferece funcionalidades para abertura de Ordens de Serviço (O.S.), controle de estoque, financeiro, monitoramento preventivo e automações preditivas.
            </p>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>2. Cadastro e Responsabilidades do Dono da Oficina</h2>
            <p>
              Para utilizar a plataforma, você deve criar uma conta corporativa. Você declara ser legítimo proprietário ou possuir plenos poderes operacionais para gerir os dados financeiros, fiscais e ambientais da oficina cadastrada. É expressamente vedado o compartilhamento de senhas de nível administrativo com terceiros não autorizados.
            </p>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>3. Propriedade e Uso dos Dados Coletados</h2>
            <p>
              Ao processar Ordens de Serviço e dados de clientes finais da sua oficina (como Placa, Modelo, Telefone e Nome), você atua como <strong>Controlador dos Dados</strong>, e o Express Auto Tech atua estritamente como <strong>Operador</strong> nos termos da LGPD (Lei Federal 13.709/18).
            </p>
            <p>
              Os dados processados servem exclusivamente para fins operacionais da sua oficina (emissão de recibos, gestão financeira e monitoria ambiental). Nós não comercializamos nem compartilhamos estes dados para fins publicitários ou de terceiros.
            </p>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>4. Regras do Plano Grátis e Assinaturas</h2>
            <p>
              O Express Auto Tech opera em modelo freemium. As funcionalidades de nível Avançado ou com uso de Inteligência Artificial exigem upgrade de plano ativo. Reservamo-nos o direito de bloquear o acesso a módulos premium caso haja inadimplência na assinatura após notificações no ecrã do administrador.
            </p>
          </div>

          <div>
            <h2 style={{ color: '#00E676', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>5. Rescisão e Exclusão da Conta</h2>
            <p>
              Você é livre para cancelar sua assinatura ou excluir permanentemente sua conta a qualquer momento através da aba "Configurações". A exclusão de conta aciona a rotina de limpeza irreversível no Firestore, garantindo o seu direito constitucional ao esquecimento digital.
            </p>
          </div>
        </section>

        <footer style={{ marginTop: '60px', borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
          Express Auto Tech © {new Date().getFullYear()} · Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}
