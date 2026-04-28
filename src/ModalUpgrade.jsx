import React, { useState } from 'react';

const MAIN_COLOR = '#FF0033';
const GREEN_MONEY = '#00E676';
const MASTER_COLOR = '#D4AF37';

const PLANOS = [
    {
        key: 'essencial',
        nome: 'ESSENCIAL',
        preco: 99,
        cor: '#3b82f6',
        emoji: '🔧',
        membrosLimite: 3,
        modulos: [
            'Gestão Base: 1 Módulo Premium à escolha',
            'Abertura de O.S. Geral',
            'Controle Financeiro Básico',
            'Equipe: Você + 2 colaboradores'
        ],
    },
    {
        key: 'profissional',
        nome: 'PROFISSIONAL',
        preco: 149,
        cor: GREEN_MONEY,
        emoji: '⭐',
        destaque: true,
        membrosLimite: 5,
        modulos: [
            '3 Módulos Premium liberados',
            'Equipe: Você + 4 colaboradores',
            'Suporte via WhatsApp',
            'Relatórios de Produtividade'
        ],
    },
    {
        key: 'especialista',
        nome: 'ESPECIALISTA',
        preco: 249,
        cor: '#f97316',
        emoji: '🏆',
        membrosLimite: 8,
        modulos: [
            '5 Módulos Premium liberados',
            'Equipe: Você + 7 colaboradores',
            'CRM e Gestão de Leads',
            'Backup Diário na Nuvem'
        ],
    },
    {
        key: 'master',
        nome: 'MASTER IA',
        preco: 449,
        cor: MASTER_COLOR,
        emoji: '👑',
        membrosLimite: 12,
        modulos: [
            'TODOS OS MÓDULOS LIBERADOS',
            'Equipe: Até 12 colaboradores',
            'Copiloto Técnico (IA)',
            'Relatórios Estratégicos IA'
        ],
    },
    {
        key: 'ultimate',
        nome: 'ULTIMATE AI',
        preco: 799,
        cor: '#E91E63',
        emoji: '🚀',
        membrosLimite: 999,
        modulos: [
            'EQUIPE ILIMITADA (Full VIP)',
            'Secretária IA WhatsApp 24h',
            'Suporte 24h com Gerente VIP',
            'Multioficinas: Até 3 unidades'
        ],
    },
];

const HIERARQUIA = { essencial: 1, profissional: 2, especialista: 3, master: 4, ultimate: 5 };

export default function ModalUpgrade({ aberto, onFechar, planoAtual = 'essencial', whatsapp = '5534988273194' }) {
    const [ciclo, setCiclo] = useState('mensal');

    if (!aberto) return null;

    const nivelAtual = HIERARQUIA[planoAtual?.toLowerCase()] || 1;

    const enviarWhatsApp = (plano) => {
        const valor = ciclo === 'anual' ? Math.round(plano.preco * 12 * 0.85) : plano.preco;
        const msg = encodeURIComponent(
            `🛠️ *SOLICITAÇÃO DE UPGRADE - EXPRESS AI*\n\n` +
            `Olá! Quero mudar meu plano para: *${plano.nome}*\n` +
            `💰 *Valor:* R$ ${valor.toLocaleString('pt-BR')}${ciclo === 'mensal' ? '/mês' : '/ano'}\n` +
            `📋 *Ciclo:* ${ciclo.toUpperCase()}\n\n` +
            `Pode me enviar os dados para pagamento?`
        );
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    };

    return (
        <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#0d0d0d', border: `1px solid ${MASTER_COLOR}33`, borderRadius: '24px', width: '100%', maxWidth: '1350px', padding: '45px 30px', position: 'relative', boxShadow: '0 10px 100px rgba(0,0,0,0.8)' }}>

                <button onClick={onFechar} style={{ position: 'absolute', top: '20px', right: '25px', background: 'transparent', border: 'none', color: '#444', fontSize: '28px', cursor: 'pointer' }}>✕</button>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '45px', marginBottom: '10px' }}>🚀</div>
                    <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '28px', fontWeight: '900', letterSpacing: '1px' }}>
                        EXPANDA SUA <span style={{ color: MAIN_COLOR }}>Express Auto Tech</span>
                    </h2>
                    <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>Selecione o plano ideal para a escala atual da sua empresa.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                    <div style={{ background: '#111', borderRadius: '35px', border: '1px solid #222', display: 'flex', padding: '6px' }}>
                        {['mensal', 'anual'].map((c) => (
                            <button key={c} onClick={() => setCiclo(c)} style={{ padding: '12px 35px', borderRadius: '30px', border: 'none', background: ciclo === c ? GREEN_MONEY : 'transparent', color: ciclo === c ? 'black' : '#888', fontWeight: '900', cursor: 'pointer', fontSize: '14px', position: 'relative', transition: '0.3s' }}>
                                {c.toUpperCase()}
                                {c === 'anual' && <span style={{ position: 'absolute', top: '-12px', right: '-10px', background: MAIN_COLOR, color: 'white', fontSize: '9px', padding: '3px 7px', borderRadius: '10px', fontWeight: '900' }}>-15% OFF</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px', marginBottom: '35px' }}>
                    {PLANOS.map((plano) => {
                        const valorExibido = ciclo === 'anual' ? Math.round(plano.preco * 12 * 0.85) : plano.preco;
                        const isAtivo = planoAtual?.toLowerCase() === plano.key.toLowerCase();
                        const nivelPlano = HIERARQUIA[plano.key];

                        return (
                            <div key={plano.key} style={{ background: plano.destaque ? '#050a05' : '#111', border: `2px solid ${isAtivo ? plano.cor : '#1a1a1a'}`, borderRadius: '20px', padding: '25px 18px', display: 'flex', flexDirection: 'column', position: 'relative', transition: '0.3s' }}>
                                {isAtivo && <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', color: '#000000', fontSize: '10px', fontWeight: '900', padding: '5px 15px', borderRadius: '15px', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.6)', border: '1px solid #ddd', zIndex: 10 }}>SEU PLANO ATUAL</span>}
                                <p style={{ color: plano.cor, fontWeight: '900', fontSize: '13px', margin: '0 0 6px 0', textAlign: 'center' }}>{plano.emoji} {plano.nome}</p>
                                <p style={{ color: 'white', fontWeight: '900', fontSize: '26px', margin: '0 0 12px 0', textAlign: 'center' }}>R$ {valorExibido.toLocaleString('pt-BR')}<span style={{ fontSize: '12px', color: '#555', fontWeight: 'normal' }}>/{ciclo === 'mensal' ? 'mês' : 'ano'}</span></p>
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                                    <p style={{ color: '#555', fontSize: '9px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase' }}>Equipe Permitida</p>
                                    <p style={{ color: plano.cor, fontSize: '15px', fontWeight: '900', margin: 0 }}>{plano.membrosLimite === 999 ? 'ILIMITADA' : `${plano.membrosLimite} MEMBROS`}</p>
                                </div>
                                <ul style={{ padding: 0, margin: '0 0 25px 0', listStyle: 'none', flex: 1 }}>
                                    {plano.modulos.map((mod, i) => (
                                        <li key={i} style={{ color: '#888', fontSize: '10px', marginBottom: '8px', display: 'flex', gap: '8px', lineHeight: '1.3' }}><span style={{ color: plano.cor, fontWeight: 'bold' }}>✓</span>{mod}</li>
                                    ))}
                                </ul>
                                <button onClick={() => !isAtivo && enviarWhatsApp(plano)} style={{ width: '100%', padding: '14px', background: isAtivo ? 'transparent' : plano.cor, color: isAtivo ? plano.cor : (plano.key === 'profissional' ? 'black' : 'white'), border: `1px solid ${isAtivo ? plano.cor : 'transparent'}`, borderRadius: '12px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                                    {isAtivo ? 'PLANO ATIVO' : 'CONTRATAR UPGRADE'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                    <p style={{ color: '#555', fontSize: '11px', margin: '0 0 12px 0' }}>*Ativação via WhatsApp após confirmação do upgrade.</p>
                    <button onClick={onFechar} style={{ background: 'transparent', color: '#444', border: '1px solid #222', borderRadius: '10px', padding: '10px 25px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Continuar no painel atual</button>
                </div>
            </div>
        </div>
    );
}