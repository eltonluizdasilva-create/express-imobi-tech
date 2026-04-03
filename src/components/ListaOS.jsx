import React, { useState } from 'react';

// 1. Definição de Cores e Temas (Mantenha ou ajuste conforme seu sistema)
const CORES = {
    mecanica: '#8b5cf6',
    estetica: '#a855f7',
    gestao: '#00E676',
    sistema: '#3b82f6',
    erro: '#FF0033',
    alerta: '#eab308'
};

// 2. O "Cérebro" do Menu - Aqui os ?? foram removidos e trocados por Emojis Reais
const MENU_ESTRUTURA = {
    servicos: [
        { id: 'mecanica', label: 'Mecânica', cor: CORES.mecanica, icone: '🔧' },
        { id: 'hibridos', label: 'Híbridos', cor: CORES.alerta, icone: '⚡' },
        { id: 'eletricos', label: 'Elétricos', cor: '#06b6d4', icone: '🔋' },
        { id: 'motos', label: 'Motos', cor: '#f97316', icone: '🏍️' },
        { id: 'lataria', label: 'Lataria', cor: '#ec4899', icone: '🔨' },
        { id: 'injecao', label: 'Injeção', cor: CORES.mecanica, icone: '🔌' },
        { id: 'oleo', label: 'Óleo', cor: CORES.alerta, icone: '🛢️' },
        { id: 'revisao', label: 'Revisão', cor: CORES.sistema, icone: '📋' },
        { id: 'pneus', label: 'Pneus', cor: CORES.gestao, icone: '🛞' }
    ],
    gestao: [
        { id: 'visão', label: 'Visão Geral', cor: CORES.gestao, icone: '📊' },
        { id: 'estoque', label: 'Estoque', cor: CORES.alerta, icone: '📦' },
        { id: 'financeiro', label: 'Financeiro', cor: CORES.gestao, icone: '💰' },
        { id: 'nota_fiscal', label: 'Nota Fiscal', cor: CORES.sistema, icone: '🧾' },
        { id: 'clientes', label: 'Clientes', cor: CORES.sistema, icone: '👥' },
        { id: 'copiloto', label: 'Copiloto IA', cor: CORES.estetica, icone: '🤖' }
    ],
    sistema: [
        { id: 'config', label: 'Config', cor: '#64748b', icone: '⚙️' },
        { id: 'equipe', label: 'Equipe', cor: CORES.mecanica, icone: '👷' },
        { id: 'marketing', label: 'Marketing', cor: CORES.estetica, icone: '📢' },
        { id: 'ajuda', label: 'Ajuda', cor: CORES.sistema, icone: '❓' }
    ]
};

// 3. Componente de Botão Estilizado
function BotaoMenu({ item, ativo, onClick }) {
    return (
        <button
            onClick={() => onClick(item.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: ativo ? `${item.cor}22` : '#111',
                color: ativo ? item.cor : '#eee',
                border: `1px solid ${ativo ? item.cor : '#333'}`,
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }}
        >
            <span>{item.icone}</span>
            {item.label}
        </button>
    );
}

// 4. Componente Principal do Topo do Admin
export default function AdminHeader({ abaAtiva, setAbaAtiva, pendentes = 0 }) {
    return (
        <div style={{ background: '#000', padding: '20px', borderBottom: '1px solid #222' }}>
            {/* 🚀 BOTÃO NOVA OS COM GATILHO ATIVADO */}
            <button
                onClick={() => setAbaAtiva('os')}
                style={{
                    width: '100%',
                    padding: '15px',
                    background: CORES.erro,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '900',
                    fontSize: '14px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                ➕ NOVA ORDEM DE SERVIÇO
                <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                    {pendentes} pendentes
                </span>
            </button>

            {/* Renderização Automática das Categorias */}
            {Object.entries(MENU_ESTRUTURA).map(([categoria, itens]) => (
                <div key={categoria} style={{ marginBottom: '15px' }}>
                    <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
                        {categoria}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>

                        {/* 🛡️ MAP BLINDADO AQUI COM A INTERROGAÇÃO */}
                        {itens?.map(item => (
                            <BotaoMenu
                                key={item.id}
                                item={item}
                                ativo={abaAtiva === item.id}
                                onClick={setAbaAtiva}
                            />
                        ))}

                    </div>
                </div>
            ))}
        </div>
    );
}