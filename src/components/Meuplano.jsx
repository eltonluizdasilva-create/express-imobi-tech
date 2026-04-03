


// ============================================================
// ========== MÓDULO: MEU PLANO (MONTADOR DE PACOTES) =========
// ============================================================
const ModuloMeuPlano = ({ dadosOficina, planosSistema }) => {
    const [ciclo, setCiclo] = useState('mensal'); // 'mensal' ou 'anual'



    // 1. Definição das Regras do Jogo
    const FIXOS = ['base', 'alinhamento', 'revisaoIa', 'oficina', 'motos', 'lataria', 'amortecedor', 'eletrica', 'lavajato', 'ar_condicionado', 'escapamento', 'estetica', 'injecao'];
    const PREMIUM = ['clientes', 'estoque', 'retorno', 'pneus', 'copiloto', 'desmanche', 'hibrido_ev', 'veiculo_eletrico'];

    // 2. Estado inicial: Fixos vêm marcados, Premium não
    const [modulos, setModulos] = useState({
        base: true, alinhamento: true, revisaoIa: true, oficina: true, motos: true, lataria: true, amortecedor: true, eletrica: true, lavajato: true, ar_condicionado: true, escapamento: true, estetica: true, injecao: true,
        clientes: false, estoque: false, retorno: false, pneus: false, copiloto: false, desmanche: false, hibrido_ev: false, veiculo_eletrico: false
    });

    const combos = planosSistema?.combos || { start: 99, pro: 147, business: 197, master: 247 };

    // 3. O MOTOR DE PRECIFICAÇÃO DINÂMICA
    const qtdPremium = PREMIUM.filter(m => modulos[m]).length;
    let nomePlano = 'START';
    let valorMensal = combos.start;

    if (qtdPremium > 5) { nomePlano = 'MASTER'; valorMensal = combos.master; }
    else if (qtdPremium > 3) { nomePlano = 'BUSINESS'; valorMensal = combos.business; }
    else if (qtdPremium > 1) { nomePlano = 'PRO'; valorMensal = combos.pro; }

    const totalMensal = valorMensal;
    const totalAnual = Math.round(valorMensal * 12 * 0.85); // 15% OFF
    const total = ciclo === 'anual' ? totalAnual : totalMensal;

    const toggleModulo = (mod) => {
        // Se for módulo fixo, nem deixa desmarcar (mostra um alerta amigável)
        if (FIXOS.includes(mod)) {
            alert("⚠️ Este módulo já está INCLUSO de graça no seu plano! Não é possivel desmarcá-lo.");
            return;
        }
        setModulos(prev => ({ ...prev, [mod]: !prev[mod] }));
    };

    const enviarWhatsAppDeVenda = () => {
        const nomesMods = PREMIUM.filter(m => modulos[m]).map(m => m.toUpperCase());
        const extraStr = nomesMods.length > 0 ? `\n✅ *Módulos Premium:* ${nomesMods.join(', ')}` : '';

        const msg = `Olá, Express AI! Meu teste está acabando e montei meu pacote.\n\n📦 *Plano:* ${nomePlano}\n🔄 *Ciclo:* ${ciclo.toUpperCase()}${extraStr}\n💰 *Valor Total:* R$ ${total},00\n\nPode me enviar a chave PIX para liberação?`;

        const numeroExpressAI = planosSistema?.whatsapp || "5534991439845";
        window.open(`https://wa.me/${numeroExpressAI}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${GREEN_MONEY}` }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: GREEN_MONEY, margin: '0 0 10px 0' }}>🧩 Monte a sua Exp Auto Tech</h2>
                <p style={{ color: '#888', fontSize: '14px' }}>Escolha os módulos premium que você precisa e veja o plano se ajustar automaticamente!</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                <div style={{ background: '#111', borderRadius: '30px', border: '1px solid #333', display: 'flex', padding: '5px' }}>
                    <button onClick={() => setCiclo('mensal')} style={{ padding: '10px 30px', borderRadius: '25px', border: 'none', background: ciclo === 'mensal' ? GREEN_MONEY : 'transparent', color: ciclo === 'mensal' ? 'black' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>MENSAL</button>
                    <button onClick={() => setCiclo('anual')} style={{ padding: '10px 30px', borderRadius: '25px', border: 'none', background: ciclo === 'anual' ? GREEN_MONEY : 'transparent', color: ciclo === 'anual' ? 'black' : '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', position: 'relative' }}>
                        ANUAL<span style={{ position: 'absolute', top: '-10px', right: '-10px', background: MAIN_COLOR, color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '10px' }}>15% OFF</span>
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>

                {/* CABEÇALHO DA LISTA */}
                <div style={{ padding: '10px', background: '#1a1a1a', borderRadius: '8px', borderLeft: `4px solid ${GREEN_MONEY}` }}>
                    <p style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Plano Atual: <span style={{ color: GREEN_MONEY }}>{nomePlano}</span> ({qtdPremium} Premium selecionados)</p>
                </div>

                {/* LISTA DE MÓDULOS */}
                {[
                    { id: 'base', label: 'Sistema Base (Obrigatório)', desc: planosSistema?.descricaoBase || 'Abertura de O.S. Geral e Controle Financeiro.' },
                    { id: 'oficina', label: 'Módulo Oficina Mecânica', desc: 'O.S. por serviço (Mecânica, Injeção, etc).' },
                    { id: 'motos', label: 'Aba Motos', desc: 'Checklist exclusivo para motocicletas.' },
                    { id: 'lataria', label: 'Aba Lataria & Acabamento', desc: 'Funilaria, pintura, vidros e interior.' },
                    { id: 'eletrica', label: 'Aba Elétrica', desc: 'Bateria, iluminação, fiação e fusiveis.' },
                    { id: 'clientes', label: '🎯 Gestão de Clientes', desc: 'Captura rápida de leads e histórico.' },
                    { id: 'estoque', label: '📦 Controle de Estoque', desc: 'Alertas de peças em nivel critico.' },
                    { id: 'retorno', label: '📅 Módulo de Retorno', desc: 'Avisa clientes com manutenções vencidas.' },
                    { id: 'pneus', label: '🛞 Pneus & Borracharia', desc: 'Scanner de desgaste TWI e venda direta.' },
                    { id: 'copiloto', label: '🤖 Copiloto Técnico (IA)', desc: 'Manuais mecânicos e análise de erros na hora.' },
                    { id: 'desmanche', label: '🏗️ Módulo Desmanche', desc: 'Gestão de pátio, peças e parceiros B2B.' },
                    { id: 'hibrido_ev', label: '⚡ Módulo Hibridos', desc: 'Ordens de serviço e checklist NR10/NR12 para HEV e PHEV.' },
                    { id: 'veiculo_eletrico', label: '🔌 Módulo Elétricos', desc: 'Ordens de serviço, SOH/SOC e diagnóstico para BEV.' },
                ].map(item => {
                    const isFixo = FIXOS.includes(item.id);
                    const isChecked = modulos[item.id];

                    return (
                        <div key={item.id} onClick={() => toggleModulo(item.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isChecked ? (isFixo ? '#111' : '#001a05') : '#0a0a0a', padding: '15px 20px', borderRadius: '10px', border: `1px solid ${isChecked ? (isFixo ? '#333' : GREEN_MONEY) : '#222'}`, cursor: isFixo ? 'not-allowed' : 'pointer', transition: '0.2s', opacity: isFixo ? 0.7 : 1 }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0', color: isChecked ? (isFixo ? '#ccc' : GREEN_MONEY) : 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="checkbox" checked={isChecked} readOnly style={{ transform: 'scale(1.5)', cursor: isFixo ? 'not-allowed' : 'pointer' }} />
                                    {item.label}
                                </h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '12px', paddingLeft: '25px' }}>{item.desc}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: isChecked ? (isFixo ? '#555' : GREEN_MONEY) : '#555', fontSize: '12px', background: isFixo ? '#222' : 'transparent', padding: '4px 8px', borderRadius: '4px' }}>
                                    {isFixo ? '📌 INCLUSO' : (isChecked ? '✅ ATIVADO' : '+ 1 COTA')}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CAIXA DE TOTAL */}
            <div style={{ background: '#1a1a00', border: `2px dashed ${GREEN_MONEY}`, padding: '25px', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>Valor do Pacote <strong style={{ color: 'white' }}>{nomePlano}</strong> ({ciclo === 'mensal' ? 'mensal' : 'anual - 15% OFF'})</p>

                {ciclo === 'anual' && (
                    <p style={{ color: '#888', fontSize: '12px', margin: '0 0 5px 0' }}>
                        <s style={{ color: '#555' }}>R$ {(totalMensal * 12).toLocaleString('pt-BR')}/ano</s> ➔ com 15% de desconto
                    </p>
                )}

                <h1 style={{ margin: '0 0 20px 0', color: GREEN_MONEY, fontSize: '40px' }}>R$ {total.toLocaleString('pt-BR')} <span style={{ fontSize: '16px' }}>{ciclo === 'mensal' ? '/mês' : '/ano'}</span></h1>

                <button onClick={enviarWhatsAppDeVenda} style={{ width: '100%', padding: '20px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: `0 5px 20px ${GREEN_MONEY}44` }}>
                    💬 CHAMAR EXPRESS AI PARA ASSINAR
                </button>
            </div>
        </div>
    );
};