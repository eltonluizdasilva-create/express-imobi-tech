import React from 'react';

export default function TelasIniciais({
    bloqueado, logado, emailInput, setEmailInput, senhaInput, setSenhaInput,
    verificarSenha, fazerLogout, dadosOficina, planosSistema, MAIN_COLOR, abrirWhatsApp
}) {
    // TELA DE BLOQUEIO / TRIAL VENCIDO
    if (bloqueado) {
        const combos = planosSistema?.combos || { start: 99, pro: 147, business: 197, master: 247 };
        return (
            <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '56px', marginBottom: '12px' }}>{bloqueado === 'trial' ? '⏳' : '🚫'}</div>
                    <h2 style={{ color: MAIN_COLOR, margin: '0 0 8px', fontSize: '24px', fontWeight: '900' }}>
                        {bloqueado === 'trial' ? 'SEU PERÍODO GRÁTIS TERMINOU' : 'ACESSO SUSPENSO'}
                    </h2>
                    <button onClick={() => abrirWhatsApp(`Olá! Quero renovar minha oficina: ${dadosOficina?.nomeOficina}`)} style={{ width: '100%', padding: '18px', background: '#25D366', color: 'black', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' }}>
                        📲 RENOVAR AGORA (WHATSAPP)
                    </button>
                    <button onClick={fazerLogout} style={{ background: 'transparent', color: '#444', border: 'none', marginTop: '20px', textDecoration: 'underline', cursor: 'pointer' }}>Sair da conta</button>
                </div>
            </div>
        );
    }

    // TELA DE LOGIN
    if (!logado) {
        return (
            <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ width: '100%', maxWidth: '400px', background: '#111', padding: '40px', borderRadius: '10px', border: `1px solid ${MAIN_COLOR}` }}>
                    <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>ADMIN <span style={{ color: MAIN_COLOR }}>IA</span></h2>
                    <input type="email" placeholder="E-MAIL" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={{ width: '100%', padding: '15px', background: 'black', border: '1px solid #333', color: 'white', marginBottom: '10px', textAlign: 'center' }} />
                    <input type="password" placeholder="SENHA" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verificarSenha()} style={{ width: '100%', padding: '15px', background: 'black', border: '1px solid #333', color: 'white', marginBottom: '20px', textAlign: 'center' }} />
                    <button onClick={verificarSenha} style={{ width: '100%', padding: '15px', background: MAIN_COLOR, color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
                </div>
            </div>
        );
    }

    return null;
}