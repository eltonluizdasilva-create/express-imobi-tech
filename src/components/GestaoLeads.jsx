import React from 'react';

const GestaoLeads = ({ listaCarros, config, TAB_COLORS }) => {
    const hoje = new Date();

    // Agrupa O.S. por placa - pega a mais recente de cada cliente
    const clientesMap = {};
    listaCarros.forEach(os => {
        const placa = os.placa || 'SEM_PLACA';
        const dataOS = os.data_registro?.toDate
            ? os.data_registro.toDate()
            : new Date(os.data_registro || os.data || 0);
        if (!clientesMap[placa] || dataOS > clientesMap[placa].dataOS) {
            clientesMap[placa] = { ...os, dataOS };
        }
    });

    const clientes = Object.values(clientesMap).sort((a, b) => a.dataOS - b.dataOS);

    const getSemaforo = (dataOS) => {
        const dias = Math.floor((hoje - dataOS) / (1000 * 60 * 60 * 24));
        if (dias <= 30) return { cor: '#00E676', bg: '#00E67611', label: 'RECENTE', dias, emoji: '🟢' };
        if (dias <= 90) return { cor: '#facc15', bg: '#facc1511', label: 'ATENÇÃO', dias, emoji: '🟡' };
        if (dias <= 180) return { cor: '#f97316', bg: '#f9731611', label: 'RISCO', dias, emoji: '🟠' };
        return { cor: '#ef4444', bg: '#ef444411', label: 'CRÍTICO', dias, emoji: '🔴' };
    };

    const msgWhatsApp = (os, dias) => {
        const nome = os.nomeCliente ? ` *${os.nomeCliente}*` : '';
        return encodeURIComponent(
            `Olá${nome}! Aqui é da *${config.nome || 'Exp Auto Tech'}*.\n` +
            `Faz um tempinho que não vemos seu *${os.modelo || 'veiculo'}* (Placa: ${os.placa}) por aqui. 😅\n\n` +
            `Manutenção em dia evita dores de cabeça! Que tal agendarmos uma revisão rápida?\n\n` +
            `Qualquer dúvida, é só chamar! 🛠️`
        );
    };

    const totais = { recente: 0, atencao: 0, risco: 0, critico: 0 };
    clientes.forEach(c => {
        const s = getSemaforo(c.dataOS);
        if (s.dias <= 30) totais.recente++;
        else if (s.dias <= 90) totais.atencao++;
        else if (s.dias <= 180) totais.risco++;
        else totais.critico++;
    });

    return (
        <div>
            <h2 style={{ color: TAB_COLORS.leads, marginBottom: '20px' }}>🤝 Relacionamento com Clientes</h2>

            {/* PAINEL RESUMO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                {[
                    { label: 'Recentes', valor: totais.recente, cor: '#00E676', emoji: '🟢', desc: '≤ 30 dias' },
                    { label: 'Atenção', valor: totais.atencao, cor: '#facc15', emoji: '🟡', desc: '31-90 dias' },
                    { label: 'Risco', valor: totais.risco, cor: '#f97316', emoji: '🟠', desc: '91-180 dias' },
                    { label: 'Crítico', valor: totais.critico, cor: '#ef4444', emoji: '🔴', desc: '+180 dias' },
                ].map(({ label, valor, cor, emoji, desc }) => (
                    <div key={label} style={{ background: '#111', border: `1px solid ${cor}33`, borderRadius: '10px', padding: '15px', textAlign: 'center' }}>
                        <p style={{ fontSize: '24px', margin: 0 }}>{emoji}</p>
                        <p style={{ color: cor, fontSize: '22px', fontWeight: '900', margin: '4px 0 0 0' }}>{valor}</p>
                        <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0 0', fontWeight: 'bold' }}>{label}</p>
                        <p style={{ color: '#555', fontSize: '10px', margin: '2px 0 0 0' }}>{desc}</p>
                    </div>
                ))}
            </div>

            {/* LISTA DE CLIENTES */}
            {clientes.length === 0 ? (
                <p style={{ color: '#555', textAlign: 'center', padding: '40px' }}>Nenhuma O.S. registrada ainda.</p>
            ) : clientes.map(os => {
                const s = getSemaforo(os.dataOS);
                const tel = String(os.telefone || '').replace(/\D/g, '');
                return (
                    <div key={os.placa} style={{ background: s.bg, border: `1px solid ${s.cor}44`, borderRadius: '12px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '16px' }}>{s.emoji}</span>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{os.nomeCliente || 'Cliente'}</span>
                                <span style={{ background: `${s.cor}22`, color: s.cor, border: `1px solid ${s.cor}44`, padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>{s.label}</span>
                            </div>
                            <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                                🚗 {os.modelo || '-'} · 🎫 {os.placa} · ⏳ {s.dias} dias sem contato
                            </p>
                        </div>
                        {tel && (
                            <a
                                href={`https://wa.me/55${tel}?text=${msgWhatsApp(os, s.dias)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', fontWeight: 'bold', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                📱 WhatsApp
                            </a>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GestaoLeads;