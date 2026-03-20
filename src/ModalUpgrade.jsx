// ============================================================
// ModalUpgrade.jsx — Cadeado Visual do Oficina IA
// Importar no Admin.jsx: import ModalUpgrade from './ModalUpgrade';
// Usar: <ModalUpgrade aberto={modalUpgradeAberto} onFechar={() => setModalUpgradeAberto(false)} planoAtual={dadosOficina?.plano} whatsapp={planosSistema?.whatsapp} />
// ============================================================

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
        modulos: [
            'O.S. Geral (ilimitada)',
            'Troca de Óleo + Retorno',
            'Alinhamento',
            'Financeiro',
            'Dashboard',
            'Portal do Cliente',
            'Módulo Mecânica / Motos / Lataria',
        ],
    },
    {
        key: 'profissional',
        nome: 'PROFISSIONAL',
        preco: 149,
        cor: GREEN_MONEY,
        emoji: '⭐',
        destaque: true,
        modulos: [
            'Tudo do Essencial',
            'Controle de Estoque',
            'Nota Fiscal',
            'Gestão de Retorno',
            'Lava Jato',
            'Ar-Condicionado',
            'Escapamento / Estética',
        ],
    },
    {
        key: 'especialista',
        nome: 'ESPECIALISTA',
        preco: 199,
        cor: '#f97316',
        emoji: '🏆',
        modulos: [
            'Tudo do Profissional',
            'Módulo Desmanche',
            'Gestão de Equipe',
            'Fornecedores Parceiros',
            'Relatório Estratégico',
            'Elétrica Avançada',
        ],
    },
    {
        key: 'master',
        nome: 'MASTER',
        preco: 249,
        cor: MASTER_COLOR,
        emoji: '🤖',
        modulos: [
            'Tudo do Especialista',
            'Copiloto Técnico (IA)',
            'Revisão Preventiva (IA)',
            'Scanner de Pneus (IA)',
            'Injeção Eletrônica (IA)',
            'Diagnóstico por Foto/Vídeo',
        ],
    },
];

const HIERARQUIA = { essencial: 1, profissional: 2, especialista: 3, master: 4 };

export default function ModalUpgrade({ aberto, onFechar, planoAtual = 'essencial', whatsapp = '5534999999999' }) {
    const [ciclo, setCiclo] = useState('mensal');
    if (!aberto) return null;

    const nivelAtual = HIERARQUIA[planoAtual] || 1;

    const enviarWhatsApp = (plano) => {
        const valor = ciclo === 'anual'
            ? Math.round(plano.preco * 12 * 0.85)
            : plano.preco;
        const msg = encodeURIComponent(
            `Olá! Quero fazer upgrade para o plano *${plano.nome}*.\n\n` +
            `💰 Valor: R$ ${valor}${ciclo === 'mensal' ? '/mês' : '/ano'}\n` +
            `📋 Ciclo: ${ciclo.toUpperCase()}\n\n` +
            `Pode me enviar as instruções de pagamento?`
        );
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    };

    return (
        <div
            onClick={onFechar}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
                zIndex: 200000, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '16px', overflowY: 'auto',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#0d0d0d', border: `1px solid ${MASTER_COLOR}44`,
                    borderRadius: '20px', width: '100%', maxWidth: '780px',
                    padding: '30px 24px', position: 'relative',
                }}
            >
                {/* Fechar */}
                <button
                    onClick={onFechar}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none', color: '#555',
                        fontSize: '22px', cursor: 'pointer',
                    }}
                >✕</button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔒</div>
                    <h2 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '22px', fontWeight: '900' }}>
                        Funcionalidade <span style={{ color: MAIN_COLOR }}>Premium</span>
                    </h2>
                    <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                        Escolha o plano certo para a sua oficina e libere agora.
                    </p>
                </div>

                {/* Ciclo Mensal / Anual */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                        background: '#111', borderRadius: '30px',
                        border: '1px solid #333', display: 'flex', padding: '4px',
                    }}>
                        {['mensal', 'anual'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setCiclo(c)}
                                style={{
                                    padding: '8px 24px', borderRadius: '25px', border: 'none',
                                    background: ciclo === c ? GREEN_MONEY : 'transparent',
                                    color: ciclo === c ? 'black' : '#888',
                                    fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
                                    position: 'relative', transition: 'all 0.2s',
                                }}
                            >
                                {c.toUpperCase()}
                                {c === 'anual' && (
                                    <span style={{
                                        position: 'absolute', top: '-10px', right: '-8px',
                                        background: MAIN_COLOR, color: 'white',
                                        fontSize: '8px', padding: '2px 5px', borderRadius: '8px',
                                        fontWeight: '900',
                                    }}>
                                        -15%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards de planos */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px',
                }}>
                    {PLANOS.map((plano) => {
                        const nivelPlano = HIERARQUIA[plano.key];
                        const ativo = plano.key === planoAtual;
                        const inferior = nivelPlano <= nivelAtual;
                        const valorMensal = plano.preco;
                        const valorAnual = Math.round(plano.preco * 12 * 0.85);
                        const valorExibido = ciclo === 'anual' ? valorAnual : valorMensal;
                        const sufixo = ciclo === 'mensal' ? '/mês' : '/ano';

                        return (
                            <div
                                key={plano.key}
                                style={{
                                    background: plano.destaque ? '#001a05' : '#111',
                                    border: `2px solid ${ativo ? plano.cor : plano.destaque ? plano.cor + '66' : '#222'}`,
                                    borderRadius: '14px', padding: '18px 14px',
                                    display: 'flex', flexDirection: 'column',
                                    position: 'relative', opacity: inferior && !ativo ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {/* Badge atual */}
                                {ativo && (
                                    <span style={{
                                        position: 'absolute', top: '-10px', left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: plano.cor, color: 'black',
                                        fontSize: '9px', fontWeight: '900',
                                        padding: '3px 10px', borderRadius: '10px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        PLANO ATUAL
                                    </span>
                                )}
                                {plano.destaque && !ativo && (
                                    <span style={{
                                        position: 'absolute', top: '-10px', left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: GREEN_MONEY, color: 'black',
                                        fontSize: '9px', fontWeight: '900',
                                        padding: '3px 10px', borderRadius: '10px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        MAIS POPULAR
                                    </span>
                                )}

                                <p style={{ color: plano.cor, fontWeight: '900', fontSize: '13px', margin: '0 0 4px 0' }}>
                                    {plano.emoji} {plano.nome}
                                </p>
                                <p style={{ color: 'white', fontWeight: '900', fontSize: '22px', margin: '0 0 12px 0' }}>
                                    R$ {valorExibido.toLocaleString('pt-BR')}
                                    <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>{sufixo}</span>
                                </p>

                                <ul style={{ padding: 0, margin: '0 0 16px 0', listStyle: 'none', flex: 1 }}>
                                    {plano.modulos.map((mod, i) => (
                                        <li key={i} style={{ color: '#aaa', fontSize: '11px', marginBottom: '5px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                            <span style={{ color: plano.cor, flexShrink: 0 }}>✓</span>
                                            {mod}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => !inferior && enviarWhatsApp(plano)}
                                    disabled={inferior}
                                    style={{
                                        width: '100%', padding: '10px',
                                        background: ativo ? '#111' : inferior ? '#0a0a0a' : plano.cor,
                                        color: ativo ? plano.cor : inferior ? '#333' : (plano.key === 'profissional' ? 'black' : 'white'),
                                        border: `1px solid ${ativo ? plano.cor : inferior ? '#1a1a1a' : 'transparent'}`,
                                        borderRadius: '8px', fontWeight: '900',
                                        fontSize: '12px', cursor: inferior ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {ativo ? '✅ Ativo' : inferior ? '✓ Incluído' : '💬 Contratar'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Rodapé */}
                <div style={{
                    background: '#111', border: '1px solid #1a1a1a',
                    borderRadius: '10px', padding: '14px', textAlign: 'center',
                }}>
                    <p style={{ color: '#555', fontSize: '11px', margin: '0 0 10px 0' }}>
                        Ao clicar em Contratar, o WhatsApp abre com os dados do seu plano.
                        Um atendente libera o acesso em até 5 minutos após a confirmação do pagamento.
                    </p>
                    <button
                        onClick={onFechar}
                        style={{
                            background: 'transparent', color: '#444',
                            border: '1px solid #333', borderRadius: '8px',
                            padding: '8px 20px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 'bold',
                        }}
                    >
                        Continuar no plano atual
                    </button>
                </div>
            </div>
        </div>
    );
}
