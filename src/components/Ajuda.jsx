import React from 'react';

export default function Ajuda({ ajudaItens = [], tabColors = {}, videosAjudaAdmin = {} }) {
    // Curativo para evitar crash se tabColors.ajuda for lido antes de chegar
    const ajudaColor = tabColors?.ajuda || '#06b6d4';

    return (
        <div>
            <div style={{ background: 'linear-gradient(145deg, #111, #1a1a1a)', padding: '25px', borderRadius: '10px', border: `1px solid ${ajudaColor}`, marginBottom: '30px', boxShadow: `0px 10px 20px ${ajudaColor}22` }}>
                <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '22px' }}>O Futuro da sua Oficina chegou!</h2>
                <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>O <strong>Exp Auto Tech</strong> é o seu gestor inteligente. Cada aba tem uma cor e uma função específica para escalar seu negócio.</p>
            </div>
            <h2 style={{ color: ajudaColor, marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Manual Completo - Clique para expandir</h2>

            {/* TABELA DE PLANOS DE FUNCIONÁRIOS */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: `1px solid ${ajudaColor}55`, marginBottom: '30px' }}>
                <h3 style={{ color: 'white', marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>💰 Limites de Funcionários e Valores</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc', fontSize: '14px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#1a1a1a', borderBottom: '2px solid #333' }}>
                                <th style={{ padding: '12px', color: 'white' }}>Plano Base</th>
                                <th style={{ padding: '12px', color: 'white' }}>Nº de Funcionários</th>
                                <th style={{ padding: '12px', color: 'white' }}>Mensalidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}><strong style={{ color: '#00E676' }}>ESSENCIAL</strong></td>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}>Até 3 Funcionários</td>
                                <td style={{ padding: '12px', color: 'white' }}>R$ 99,00</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}><strong style={{ color: '#00E676' }}>PROFISSIONAL</strong></td>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}>Até 5 Funcionários</td>
                                <td style={{ padding: '12px', color: 'white' }}>R$ 149,00</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}><strong style={{ color: '#00E676' }}>ESPECIALISTA</strong></td>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}>Até 8 Funcionários</td>
                                <td style={{ padding: '12px', color: 'white' }}>R$ 249,00</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}><strong style={{ color: '#D4AF37' }}>MASTER IA</strong></td>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}>Até 12 Funcionários</td>
                                <td style={{ padding: '12px', color: 'white' }}>R$ 449,00</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}><strong style={{ color: '#E91E63' }}>ULTIMATE AI</strong></td>
                                <td style={{ padding: '12px', borderRight: '1px solid #222' }}>Acesso Ilimitado</td>
                                <td style={{ padding: '12px', color: 'white' }}>R$ 799,00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                {ajudaItens.map(({ aba, icon, titulo, conteudo }) => (
                    <details key={aba} style={{ background: '#111', padding: '15px', borderRadius: '10px', border: `1px solid ${(tabColors[aba] || '#333')}22`, cursor: 'pointer' }}>
                        <summary style={{ fontWeight: 'bold', color: tabColors[aba] || 'white', fontSize: '15px', outline: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: `${tabColors[aba] || '#333'}22`, padding: '3px 8px', borderRadius: '5px', fontSize: '13px' }}>{icon}</span>
                            {titulo}
                            {videosAjudaAdmin[aba] && (
                                <a 
                                    href={videosAjudaAdmin[aba]} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    onClick={e => e.stopPropagation()} 
                                    style={{ marginLeft: 'auto', background: '#ff0000', color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                                >
                                    Ver Video
                                </a>
                            )}
                        </summary>
                        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(conteudo || []).map((linha, i) => (
                                <p key={i} style={{ color: '#bbb', fontSize: '13px', lineHeight: '1.6', margin: 0, paddingLeft: '10px', borderLeft: `2px solid ${(tabColors[aba] || '#333')}44` }}>
                                    {linha}
                                </p>
                            ))}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
