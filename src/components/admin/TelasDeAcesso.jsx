/* eslint-disable react/prop-types */

export function TelaTrialExpirou({ setTrialExpirou }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#020408', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999, position: 'fixed', inset: 0,
    }}>
      <div style={{
        background: '#020408', border: '1px solid #10b981', borderRadius: '20px',
        padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center',
        boxShadow: '0 0 40px #10b98133',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
        <h2 style={{ color: '#10b981', fontSize: '20px', fontWeight: '900', marginBottom: '12px' }}>
          PERÍODO DE TESTE ENCERRADO
        </h2>
        <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.7', marginBottom: '24px' }}>
          Seu trial de 10 dias com <strong style={{ color: 'white' }}>TODAS as funcionalidades liberadas</strong> chegou ao fim.<br /><br />
          As abas extras foram <strong style={{ color: '#10b981' }}>bloqueadas</strong>.<br />
          Volte ao plano contratado para continuar.
        </p>
        <a
          href={`https://wa.me/5534991439845?text=${encodeURIComponent('Olá! Meu período de teste acabou. Gostaria de fazer upgrade para o Prime IA ou outro plano.')}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block', width: '100%', padding: '16px', borderRadius: '12px',
            background: '#10b981', color: 'white',
            fontWeight: '900', fontSize: '13px', textDecoration: 'none',
            boxShadow: '0 6px 24px #10b98144', marginBottom: '10px',
          }}
        >
          💬 Falar com Suporte
        </a>
        <button
          onClick={() => setTrialExpirou(false)}
          style={{
            width: '100%', padding: '12px', background: 'transparent',
            color: '#555', border: '1px solid #333', borderRadius: '12px',
            fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
          }}
        >
          Continuar com acesso limitado
        </button>
      </div>
    </div>
  );
}

export function TelaBloqueado({ bloqueado, MAIN = '#10b981', planosSistema, fazerLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '450px', width: '100%', background: '#0f172a', padding: '40px', borderRadius: '15px', border: `1px solid ${MAIN}`, textAlign: 'center' }}>
        <div style={{ fontSize: '50px', marginBottom: '15px' }}>{bloqueado === 'trial' ? '⏰' : '🔒'}</div>
        <h2 style={{ color: MAIN, margin: '0 0 10px 0' }}>{bloqueado === 'trial' ? 'TEMPO DE TESTE TERMINOU' : 'ACESSO SUSPENSO'}</h2>
        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
          {bloqueado === 'trial' ? 'Escolha seu plano para continuar:' : 'Sua conta foi suspensa.'}
        </p>
        <button onClick={() => window.open(planosSistema.linkMensal || '#', '_blank')} style={{ width: '100%', padding: '15px', background: '#020408', color: 'white', border: '1px solid #10b981', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
          💳 Plano Mensal
        </button>
        <button onClick={fazerLogout} style={{ width: '100%', padding: '15px', background: MAIN, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          Sair
        </button>
      </div>
    </div>
  );
}

export function TelaLogin({ emailInput, setEmailInput, senhaInput, setSenhaInput, erroLogin, setErroLogin, verificarSenha, MAIN = '#10b981', fazerLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#020408', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#0f172a', padding: '40px', borderRadius: '10px', border: `1px solid ${MAIN}`, boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>PAINEL EXECUTIVO <span style={{ color: MAIN }}>IA</span></h2>
        <input
          type="email"
          placeholder="E-MAIL"
          value={emailInput}
          onChange={(e) => { setEmailInput(e.target.value); setErroLogin(''); }}
          style={{ width: '100%', padding: '15px', background: '#020408', border: '1px solid #333', color: 'white', marginBottom: '10px', textAlign: 'center' }}
        />
        <input
          type="password"
          placeholder="SENHA"
          value={senhaInput}
          onChange={(e) => { setSenhaInput(e.target.value); setErroLogin(''); }}
          onKeyDown={(e) => e.key === 'Enter' && verificarSenha()}
          style={{ width: '100%', padding: '15px', background: '#020408', border: '1px solid #333', color: 'white', marginBottom: '20px', textAlign: 'center' }}
        />
        {erroLogin && (
          <div style={{ color: '#10b981', fontSize: '13px', marginBottom: '15px', textAlign: 'center', background: '#10b98111', padding: '10px', borderRadius: '8px', border: '1px solid #10b98133' }}>
            ⚠️ {erroLogin}
          </div>
        )}
        <button onClick={verificarSenha} style={{ width: '100%', padding: '15px', background: MAIN, color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '13px' }}>
          Não tem conta? <a href="/cadastro" style={{ color: MAIN, textDecoration: 'none', fontWeight: 'bold' }}>Cadastre sua imobiliária grátis</a>
        </p>
      </div>
    </div>
  );
}
