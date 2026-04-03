// ============================================================
<<<<<<< HEAD
// ModalUpgrade.jsx — VERSÃO INTEGRAL (ESPAÇAMENTO ORIGINAL)
// ============================================================

import React, {
    useState
} from 'react';
=======
// ModalUpgrade.jsx — Cadeado Visual do Oficina IA
// Importar no Admin.jsx: import ModalUpgrade from './ModalUpgrade';
// Usar: <ModalUpgrade aberto={modalUpgradeAberto} onFechar={() => setModalUpgradeAberto(false)} planoAtual={dadosOficina?.plano} whatsapp={planosSistema?.whatsapp} />
// ============================================================

import React, { useState } from 'react';
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3

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
<<<<<<< HEAD
        membrosLimite: 3,
        modulos: [
            'Gestão Base: 1 Módulo Premium à escolha',
            'Abertura de O.S. Geral',
            'Controle Financeiro Básico',
            'Equipe: Você + 2 colaboradores'
=======
        modulos: [
            'O.S. Geral (ilimitada)',
            'Troca de Óleo + Retorno',
            'Alinhamento',
            'Financeiro',
            'Dashboard',
            'Portal do Cliente',
            'Módulo Mecânica / Motos / Lataria',
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        ],
    },
    {
        key: 'profissional',
        nome: 'PROFISSIONAL',
        preco: 149,
<<<<<<< HEAD
        cor: '#00E676',
        emoji: '⭐',
        destaque: true,
        membrosLimite: 5,
        modulos: [
            '3 Módulos Premium liberados',
            'Equipe: Você + 4 colaboradores',
            'Suporte via WhatsApp',
            'Relatórios de Produtividade'
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        ],
    },
    {
        key: 'especialista',
        nome: 'ESPECIALISTA',
<<<<<<< HEAD
        preco: 249,
        cor: '#f97316',
        emoji: '🏆',
        membrosLimite: 8,
        modulos: [
            '5 Módulos Premium liberados',
            'Equipe: Você + 7 colaboradores',
            'CRM e Gestão de Leads',
            'Backup Diário na Nuvem'
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        ],
    },
    {
        key: 'master',
<<<<<<< HEAD
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
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        ],
    },
];

<<<<<<< HEAD
const HIERARQUIA = {
    essencial: 1,
    profissional: 2,
    especialista: 3,
    master: 4,
    ultimate: 5
};

export default function ModalUpgrade({
    aberto,
    onFechar,
    planoAtual = 'essencial',
    whatsapp = '5534999999999'
}) {

    const [ciclo, setCiclo] = useState('mensal');

    if (!aberto) return null;

    const enviarWhatsApp = (plano) => {
        const valor = ciclo === 'anual' ? Math.round(plano.preco * 12 * 0.85) : plano.preco;
        const msg = encodeURIComponent(
            `🛠️ *SOLICITAÇÃO DE UPGRADE - EXPRESS AI*\n\n` +
            `Olá! Quero mudar meu plano para: *${plano.nome}*\n` +
            `💰 *Valor:* R$ ${valor.toLocaleString('pt-BR')}${ciclo === 'mensal' ? '/mês' : '/ano'}\n` +
            `📋 *Ciclo:* ${ciclo.toUpperCase()}\n\n` +
            `Pode me enviar os dados para pagamento?`
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
        );
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    };

    return (
        <div
            onClick={onFechar}
            style={{
<<<<<<< HEAD
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.95)',
                zIndex: 200000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflowY: 'auto'
=======
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
                zIndex: 200000, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '16px', overflowY: 'auto',
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
<<<<<<< HEAD
                    background: '#0d0d0d',
                    border: `1px solid ${MASTER_COLOR}33`,
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '1350px',
                    padding: '45px 30px',
                    position: 'relative',
                    boxShadow: '0 10px 100px rgba(0,0,0,0.8)'
                }}
            >

                {/* ------------------------------------------------
                    BOTÃO DE FECHAR
                ------------------------------------------------ */}
                <button
                    onClick={onFechar}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '25px',
                        background: 'transparent',
                        border: 'none',
                        color: '#444',
                        fontSize: '28px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>

                {/* ------------------------------------------------
                    CABEÇALHO
                ------------------------------------------------ */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '45px', marginBottom: '10px' }}>🚀</div>
                    <h2 style={{
                        color: 'white',
                        margin: '0 0 8px 0',
                        fontSize: '28px',
                        fontWeight: '900',
                        letterSpacing: '1px'
                    }}>
                        EXPANDA SUA <span style={{ color: MAIN_COLOR }}>OFICINA IA</span>
                    </h2>
                    <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
                        Selecione o plano ideal para a escala atual da sua empresa.
                    </p>
                </div>

                {/* ------------------------------------------------
                    SELETOR MENSAL/ANUAL
                ------------------------------------------------ */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                    <div style={{
                        background: '#111',
                        borderRadius: '35px',
                        border: '1px solid #222',
                        display: 'flex',
                        padding: '6px'
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                    }}>
                        {['mensal', 'anual'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setCiclo(c)}
                                style={{
<<<<<<< HEAD
                                    padding: '12px 35px',
                                    borderRadius: '30px',
                                    border: 'none',
                                    background: ciclo === c ? GREEN_MONEY : 'transparent',
                                    color: ciclo === c ? 'black' : '#888',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    position: 'relative',
                                    transition: '0.3s'
=======
                                    padding: '8px 24px', borderRadius: '25px', border: 'none',
                                    background: ciclo === c ? GREEN_MONEY : 'transparent',
                                    color: ciclo === c ? 'black' : '#888',
                                    fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
                                    position: 'relative', transition: 'all 0.2s',
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                                }}
                            >
                                {c.toUpperCase()}
                                {c === 'anual' && (
                                    <span style={{
<<<<<<< HEAD
                                        position: 'absolute',
                                        top: '-12px',
                                        right: '-10px',
                                        background: MAIN_COLOR,
                                        color: 'white',
                                        fontSize: '9px',
                                        padding: '3px 7px',
                                        borderRadius: '10px',
                                        fontWeight: '900'
                                    }}>
                                        -15% OFF
=======
                                        position: 'absolute', top: '-10px', right: '-8px',
                                        background: MAIN_COLOR, color: 'white',
                                        fontSize: '8px', padding: '2px 5px', borderRadius: '8px',
                                        fontWeight: '900',
                                    }}>
                                        -15%
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

<<<<<<< HEAD
                {/* ------------------------------------------------
                    GRID DOS CARDS
                ------------------------------------------------ */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: '18px',
                    marginBottom: '35px'
                }}>

                    {PLANOS.map((plano) => {
                        const valorExibido = ciclo === 'anual' ? Math.round(plano.preco * 12 * 0.85) : plano.preco;
                        const isAtivo = planoAtual?.toLowerCase() === plano.key.toLowerCase();
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3

                        return (
                            <div
                                key={plano.key}
                                style={{
<<<<<<< HEAD
                                    background: plano.destaque ? '#050a05' : '#111',
                                    border: `2px solid ${isAtivo ? plano.cor : '#1a1a1a'}`,
                                    borderRadius: '20px',
                                    padding: '25px 18px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    transition: '0.3s'
                                }}
                            >

                                {/* 🎯 BADGE CORRIGIDO: FUNDO BRANCO E TEXTO PRETO 🎯 */}
                                {isAtivo && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-14px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#FFFFFF',
                                        color: '#000000',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        padding: '5px 15px',
                                        borderRadius: '15px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                                        border: '1px solid #ddd',
                                        zIndex: 10
                                    }}>
                                        SEU PLANO ATUAL
                                    </span>
                                )}

                                <p style={{
                                    color: plano.cor,
                                    fontWeight: '900',
                                    fontSize: '13px',
                                    margin: '0 0 6px 0',
                                    textAlign: 'center'
                                }}>
                                    {plano.emoji} {plano.nome}
                                </p>

                                <p style={{
                                    color: 'white',
                                    fontWeight: '900',
                                    fontSize: '26px',
                                    margin: '0 0 12px 0',
                                    textAlign: 'center'
                                }}>
                                    R$ {valorExibido.toLocaleString('pt-BR')}
                                    <span style={{ fontSize: '12px', color: '#555', fontWeight: 'normal' }}>
                                        /{ciclo === 'mensal' ? 'mês' : 'ano'}
                                    </span>
                                </p>

                                {/* QUADRO DE CAPACIDADE DE EQUIPE */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    marginBottom: '20px',
                                    textAlign: 'center',
                                    border: '1px solid #1a1a1a'
                                }}>
                                    <p style={{ color: '#555', fontSize: '9px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase' }}>
                                        Equipe Permitida
                                    </p>
                                    <p style={{ color: plano.cor, fontSize: '15px', fontWeight: '900', margin: 0 }}>
                                        {plano.membrosLimite === 999 ? 'ILIMITADA' : `${plano.membrosLimite} MEMBROS`}
                                    </p>
                                </div>

                                <ul style={{
                                    padding: 0,
                                    margin: '0 0 25px 0',
                                    listStyle: 'none',
                                    flex: 1
                                }}>
                                    {plano.modulos.map((mod, i) => (
                                        <li key={i} style={{
                                            color: '#888',
                                            fontSize: '10px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            gap: '8px',
                                            lineHeight: '1.3'
                                        }}>
                                            <span style={{ color: plano.cor, fontWeight: 'bold' }}>✓</span>
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                                            {mod}
                                        </li>
                                    ))}
                                </ul>

                                <button
<<<<<<< HEAD
                                    onClick={() => !isAtivo && enviarWhatsApp(plano)}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: isAtivo ? 'transparent' : plano.cor,
                                        color: isAtivo ? plano.cor : (plano.key === 'profissional' ? 'black' : 'white'),
                                        border: `1px solid ${isAtivo ? plano.cor : 'transparent'}`,
                                        borderRadius: '12px',
                                        fontWeight: '900',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isAtivo ? 'PLANO ATIVO' : 'CONTRATAR UPGRADE'}
=======
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
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                                </button>
                            </div>
                        );
                    })}
                </div>

<<<<<<< HEAD
                {/* ------------------------------------------------
                    RODAPÉ
                ------------------------------------------------ */}
                <div style={{
                    background: '#111',
                    border: '1px solid #1a1a1a',
                    borderRadius: '12px',
                    padding: '18px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#555', fontSize: '11px', margin: '0 0 12px 0' }}>
                        *Ativação via WhatsApp após confirmação do upgrade.
=======
                {/* Rodapé */}
                <div style={{
                    background: '#111', border: '1px solid #1a1a1a',
                    borderRadius: '10px', padding: '14px', textAlign: 'center',
                }}>
                    <p style={{ color: '#555', fontSize: '11px', margin: '0 0 10px 0' }}>
                        Ao clicar em Contratar, o WhatsApp abre com os dados do seu plano.
                        Um atendente libera o acesso em até 5 minutos após a confirmação do pagamento.
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                    </p>
                    <button
                        onClick={onFechar}
                        style={{
<<<<<<< HEAD
                            background: 'transparent',
                            color: '#444',
                            border: '1px solid #222',
                            borderRadius: '10px',
                            padding: '10px 25px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        Continuar no painel atual
=======
                            background: 'transparent', color: '#444',
                            border: '1px solid #333', borderRadius: '8px',
                            padding: '8px 20px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 'bold',
                        }}
                    >
                        Continuar no plano atual
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                    </button>
                </div>
            </div>
        </div>
    );
<<<<<<< HEAD
}
=======
}
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
