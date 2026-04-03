import React, { useState, useEffect } from 'react';

const GREEN_MONEY = "#00E676";
const MAIN_COLOR = "#FF0033";

export default function ModuloMeuPlano({ dadosOficina, planosSistema }) {
    const [ciclo, setCiclo] = useState('mensal'); // 'mensal' ou 'anual'

    // LÊ AS CONFIGURAÇÕES DO PAINEL MASTER EM TEMPO REAL
    const premiumMods = planosSistema?.premiumMods || [];
    const combos = planosSistema?.combos || { start: 99, pro: 147, business: 197, master: 247, prime: 297 };

    // LISTA MESTRA DE TODOS OS MÓDULOS DO SISTEMA
    const TODOS_MODULOS = [
        { id: 'pacote_ia', label: '🧠 PACOTE PRIME IA (O Futuro)', desc: 'Desbloqueia Copiloto IA Total, Analista de Receita e Automações de Texto.' },
        { id: 'base', label: 'Sistema Base (Obrigatório)', desc: planosSistema?.descricaoBase || 'Abertura de O.S. Geral e Controle Financeiro.' },
        { id: 'alinhamento', label: 'Alinhamento 3D', desc: 'Geometria e balanceamento.' },
        { id: 'revisaoIa', label: 'Revisão Preventiva (IA)', desc: 'Check-up com inteligência artificial.' },
        { id: 'oficina', label: 'Oficina Mecânica', desc: 'O.S. geral de mecânica.' },
        { id: 'motos', label: 'Aba Motos', desc: 'Checklist exclusivo para motocicletas.' },
        { id: 'lataria', label: 'Lataria & Acabamento', desc: 'Reparo de chaparia, pintura, vidros e interior.' },
        { id: 'amortecedor', label: 'Aba Amortecedores', desc: 'Diagnóstico de suspensão.' },
        { id: 'eletrica', label: 'Aba Elétrica', desc: 'Bateria, iluminação, fiação e fusíveis.' },
        { id: 'lavajato', label: 'Lava Jato', desc: 'Fila e controle de lavagem.' },
        { id: 'ar_condicionado', label: 'Ar-Condicionado', desc: 'Climatização automotiva.' },
        { id: 'escapamento', label: 'Escapamento', desc: 'Troca de silenciosos.' },
        { id: 'estetica', label: 'Estética Automotiva', desc: 'Polimento e vitrificação.' },
        { id: 'injecao', label: 'Injeção Eletrônica', desc: 'Scanner e sensores.' },
        { id: 'clientes', label: '🎯 Gestão de Clientes', desc: 'Captura rápida de leads e histórico.' },
        { id: 'estoque', label: '📦 Controle de Estoque', desc: 'Alertas de peças em nível crítico.' },
        { id: 'retorno', label: '📅 Módulo de Retorno', desc: 'Avisa clientes com manutenções vencidas.' },
        { id: 'pneus', label: '🛞 Pneus & Borracharia', desc: 'Scanner de desgaste TWI e venda direta.' },
        { id: 'copiloto', label: '🤖 Copiloto Técnico (IA)', desc: 'Manuais mecânicos e análise de erros na hora.' },
        { id: 'desmanche', label: '🏗️ Módulo Desmanche', desc: 'Gestão de pátio, peças e parceiros B2B.' },
        { id: 'hibrido_ev', label: '⚡ Módulo Híbridos', desc: 'Ordens de serviço para HEV e PHEV.' },
        { id: 'veiculo_eletrico', label: '🔌 Módulo Elétricos', desc: 'Diagnóstico e O.S. para BEV puros.' }
    ];

    // ESTADO DINÂMICO: Se você não marcou no Master que é Premium, ele vira Fixo (true)
    const [modulos, setModulos] = useState(() => {
        const estadoInicial = { pacote_ia: false, base: true };
        TODOS_MODULOS.forEach(m => {
            if (m.id !== 'pacote_ia' && m.id !== 'base') {
                const isPremium = premiumMods.includes(m.id);
                estadoInicial[m.id] = !isPremium; // Se for base, já nasce marcado
            }
        });
        return estadoInicial;
    });

    // Se você for no Master e mudar algo, essa função atualiza a tela do cliente na hora
    useEffect(() => {
        setModulos(prev => {
            const novo = { ...prev };
            TODOS_MODULOS.forEach(m => {
                if (m.id !== 'pacote_ia' && m.id !== 'base') {
                    const isPremium = premiumMods.includes(m.id);
                    if (!isPremium) novo[m.id] = true; // Garante que os fixos fiquem marcados
                }
            });
            return novo;
        });
    }, [premiumMods]);

    // O MOTOR DE PRECIFICAÇÃO 
    // Conta apenas os módulos que são PREMIUM no painel e que o cliente marcou
    const qtdPremiumSelecionados = TODOS_MODULOS.filter(m => premiumMods.includes(m.id) && modulos[m.id]).length;

    let nomePlano = 'START';
    let valorMensal = combos.start;
    let corDestaque = GREEN_MONEY;

    // A Mágica: Marcou a IA, vira PRIME.
    if (modulos.pacote_ia) {
        nomePlano = 'PRIME';
        valorMensal = combos.prime || 297;
        corDestaque = '#a855f7';
    } else if (qtdPremiumSelecionados > 5) {
        nomePlano = 'MASTER'; valorMensal = combos.master;
    } else if (qtdPremiumSelecionados > 3) {
        nomePlano = 'BUSINESS'; valorMensal = combos.business;
    } else if (qtdPremiumSelecionados > 1) {
        nomePlano = 'PRO'; valorMensal = combos.pro;
    }

    const totalMensal = valorMensal;
    const totalAnual = Math.round(valorMensal * 12 * 0.85); // 15% OFF
    const total = ciclo === 'anual' ? totalAnual : totalMensal;

    const toggleModulo = (modId) => {
        const isPremiumItem = premiumMods.includes(modId);
        const isFixo = !isPremiumItem && modId !== 'pacote_ia' && modId !== 'base';

        // Módulo Fixo / Base não pode ser desmarcado
        if (modId === 'base' || isFixo) {
            alert("⚠️ Este módulo já está INCLUSO de graça no seu plano! Não é possível desmarcá-lo.");
            return;
        }

        // Se for Premium ou IA, alterna normalmente
        setModulos(prev => ({ ...prev, [modId]: !prev[modId] }));
    };

    const enviarWhatsAppDeVenda = () => {
        const nomesModsExtras = TODOS_MODULOS.filter(m => premiumMods.includes(m.id) && modulos[m.id]).map(m => m.label);
        if (modulos.pacote_ia) nomesModsExtras.push('PACOTE PRIME IA');

        const extraStr = nomesModsExtras.length > 0 ? `\n✅ *Módulos Extras:* ${nomesModsExtras.join(', ')}` : '';
        const msg = `Olá, Express AI! Meu teste está acabando e montei meu pacote.\n\n📦 *Plano:* ${nomePlano}\n🔄 *Ciclo:* ${ciclo.toUpperCase()}${extraStr}\n💰 *Valor Total:* R$ ${total},00\n\nPode me enviar a chave PIX para liberação?`;

        const numeroExpressAI = planosSistema?.whatsapp || "5534991439845";
        window.open(`https://wa.me/${numeroExpressAI}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${corDestaque}`, transition: 'all 0.3s' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: corDestaque, margin: '0 0 10px 0', transition: 'color 0.3s' }}>🧩 Monte a sua Exp Auto Tech</h2>
                <p style={{ color: '#888', fontSize: '14px' }}>Escolha os módulos premium que você precisa e veja o plano se ajustar automaticamente!</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                <div style={{ background: '#111', borderRadius: '30px', border: '1px solid #333', display: 'flex', padding: '5px' }}>
                    <button onClick={() => setCiclo('mensal')} style={{ padding: '10px 30px', borderRadius: '25px', border: 'none', background: ciclo === 'mensal' ? corDestaque : 'transparent', color: ciclo === 'mensal' ? (modulos.pacote_ia ? 'white' : 'black') : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>MENSAL</button>
                    <button onClick={() => setCiclo('anual')} style={{ padding: '10px 30px', borderRadius: '25px', border: 'none', background: ciclo === 'anual' ? corDestaque : 'transparent', color: ciclo === 'anual' ? (modulos.pacote_ia ? 'white' : 'black') : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', position: 'relative' }}>
                        ANUAL<span style={{ position: 'absolute', top: '-10px', right: '-10px', background: MAIN_COLOR, color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '10px' }}>15% OFF</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>

                {/* CABEÇALHO DA LISTA */}
                <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '8px', borderLeft: `4px solid ${corDestaque}`, transition: 'all 0.3s' }}>
                    <p style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Plano Atual: <span style={{ color: corDestaque }}>{nomePlano}</span> {!modulos.pacote_ia && `(${qtdPremiumSelecionados} Premium selecionados)`}</p>
                </div>

                {/* LISTAGEM DE MÓDULOS */}
                {TODOS_MODULOS.map(item => {
                    const isPremiumItem = premiumMods.includes(item.id);
                    const isFixo = !isPremiumItem && item.id !== 'pacote_ia' && item.id !== 'base';
                    const isChecked = modulos[item.id];
                    const isIa = item.id === 'pacote_ia';
                    const corDoItem = isIa ? '#a855f7' : GREEN_MONEY;

                    return (
                        <div key={item.id} onClick={() => toggleModulo(item.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isChecked ? (isFixo || item.id === 'base' ? '#111' : (isIa ? '#1a0033' : '#001a05')) : '#0a0a0a', padding: '15px 20px', borderRadius: '10px', border: `1px solid ${isChecked ? (isFixo || item.id === 'base' ? '#333' : corDoItem) : '#222'}`, cursor: (isFixo || item.id === 'base') ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: (isFixo || item.id === 'base') ? 0.7 : 1 }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0', color: isChecked ? ((isFixo || item.id === 'base') ? '#ccc' : corDoItem) : 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="checkbox" checked={isChecked} readOnly style={{ transform: 'scale(1.5)', cursor: (isFixo || item.id === 'base') ? 'not-allowed' : 'pointer', accentColor: corDoItem }} />
                                    {item.label}
                                </h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '12px', paddingLeft: '25px' }}>{item.desc}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: isChecked ? ((isFixo || item.id === 'base') ? '#555' : (isIa ? 'white' : GREEN_MONEY)) : '#555', fontSize: '12px', background: (isFixo || item.id === 'base') ? '#222' : (isChecked && isIa ? '#a855f7' : 'transparent'), padding: '4px 8px', borderRadius: '4px' }}>
                                    {(isFixo || item.id === 'base') ? '📌 INCLUSO' : (isChecked ? (isIa ? '⭐ ATIVA PRIME' : '✅ ATIVADO') : '+ 1 COTA')}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CAIXA DE TOTAL */}
            <div style={{ background: '#1a1a00', border: `2px dashed ${corDestaque}`, padding: '25px', borderRadius: '10px', textAlign: 'center', transition: 'all 0.3s' }}>
                <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>Valor do Pacote <strong style={{ color: 'white' }}>{nomePlano}</strong> ({ciclo === 'mensal' ? 'mensal' : 'anual - 15% OFF'})</p>

                {ciclo === 'anual' && (
                    <p style={{ color: '#888', fontSize: '12px', margin: '0 0 5px 0' }}>
                        <s style={{ color: '#555' }}>R$ {(totalMensal * 12).toLocaleString('pt-BR')}/ano</s> ➔ com 15% de desconto
                    </p>
                )}

                <h1 style={{ margin: '0 0 20px 0', color: corDestaque, fontSize: '40px', transition: 'color 0.3s' }}>R$ {total.toLocaleString('pt-BR')} <span style={{ fontSize: '16px' }}>{ciclo === 'mensal' ? '/mês' : '/ano'}</span></h1>

                <button onClick={enviarWhatsAppDeVenda} style={{ width: '100%', padding: '20px', background: corDestaque, color: modulos.pacote_ia ? 'white' : 'black', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: `0 5px 20px ${corDestaque}44`, transition: 'all 0.3s' }}>
                    💬 CHAMAR EXPRESS AI PARA ASSINAR
                </button>
            </div>
        </div>
    );
}