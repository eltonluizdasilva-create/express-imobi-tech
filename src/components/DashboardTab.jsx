/* eslint-disable react/prop-types */
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip } from 'recharts';

// ============================================================
// PALETA COMPLETA — ESCURO E CLARO
// ============================================================
export const TEMAS = {
    escuro: {
        bg: '#000000',
        bgCard: '#111111',
        bgCardAlt: '#0a0a0a',
        border: '#333333',
        borderSutil: '#1a1a1a',
        texto: '#ffffff',
        textoSec: '#888888',
        textoTer: '#555555',
        cardGrad: 'linear-gradient(145deg, #111, #0a0a0a)',
        graficoTooltip: '#000000',
        graficoStroke: '#888888',
        graficoCursor: '#222222',
        alertaEstoqueB: '#1a0000',
        alertaOleoB: '#1a1a1a',
        alertaBateriaB: '#1a1500',
        alertaEstoqueItem: '#FF003311',
        iconeToggle: '☀️',
        labelToggle: 'Modo Claro',
        vazioB: '#111111',
    },
    claro: {
        bg: '#f0f2f5',
        bgCard: '#ffffff',
        bgCardAlt: '#f8f9fa',
        border: '#e0e0e0',
        borderSutil: '#ebebeb',
        texto: '#1a1a1a',
        textoSec: '#555555',
        textoTer: '#999999',
        cardGrad: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
        graficoTooltip: '#ffffff',
        graficoStroke: '#aaaaaa',
        graficoCursor: '#f0f0f0',
        alertaEstoqueB: '#fff5f5',
        alertaOleoB: '#fafafa',
        alertaBateriaB: '#fffde7',
        alertaEstoqueItem: '#ffe5e5',
        iconeToggle: '🌙',
        labelToggle: 'Modo Escuro',
        vazioB: '#ffffff',
    },
};

const GREEN_MONEY = '#00E676';
const MAIN_COLOR = '#FF0033';
const MASTER_COLOR = '#D4AF37';
const KM_COLOR = '#eab308';

const fmtMoeda = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ============================================================
// CardMetrica
// ============================================================
function CardMetrica({ label, valor, cor, t }) {
    return (
        <div style={{
            background: t.cardGrad,
            padding: '20px',
            borderRadius: '15px',
            border: `1px solid ${t.border}`,
            transition: 'all 0.3s ease',
        }}>
            <p style={{ color: t.textoSec, fontSize: '11px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
                {label}
            </p>
            <h2 style={{ fontSize: '26px', margin: '10px 0 0', color: cor, fontWeight: '900' }}>{valor}</h2>
        </div>
    );
}

// ============================================================
// CardLembreteOleo
// ============================================================
function CardLembreteOleo({ os, onAvisar, t }) {
    return (
        <div style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            padding: '14px',
            borderRadius: '10px',
            minWidth: '190px',
            flexShrink: 0,
        }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 3px', fontSize: '13px', color: t.texto }}>{os.modelo || 'Veículo'}</p>
            <p style={{ color: t.textoSec, margin: '0 0 3px', fontSize: '11px' }}>🚗 {os.placa || 'Sem Placa'}</p>
            {os.nomeCliente && (
                <p style={{ color: t.textoSec, margin: '0 0 10px', fontSize: '11px' }}>👤 {os.nomeCliente}</p>
            )}
            <button
                onClick={() => onAvisar(os)}
                style={{ width: '100%', padding: '9px', background: '#25D366', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
                💬 AVISAR NO ZAP
            </button>
        </div>
    );
}

// ============================================================
// CardBateria
// ============================================================
function CardBateria({ os, onAvisar, t }) {
    const dataVenc = os.dataVencimentoBateria?.toDate ? os.dataVencimentoBateria.toDate() : new Date(os.dataVencimentoBateria);
    const diasAteVencer = Math.ceil(
        (dataVenc - new Date()) / (1000 * 60 * 60 * 24)
    );
    const venc = dataVenc.toLocaleDateString('pt-BR');
    const corDias = diasAteVencer < 0 ? '#ef4444' : '#facc15';

    return (
        <div style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            padding: '14px',
            borderRadius: '10px',
            minWidth: '200px',
            flexShrink: 0,
        }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 3px', fontSize: '13px', color: t.texto }}>{os.modelo || 'Veículo'}</p>
            <p style={{ color: t.textoSec, margin: '0 0 3px', fontSize: '11px' }}>🚗 {os.placa}</p>
            <p style={{ color: '#facc15', margin: '0 0 3px', fontSize: '11px' }}>🔋 {os.marcaBateria || 'Bateria'}</p>
            <p style={{ color: corDias, margin: '0 0 10px', fontSize: '11px', fontWeight: 'bold' }}>
                {diasAteVencer < 0
                    ? `⚠️ Venceu há ${Math.abs(diasAteVencer)}d`
                    : `⏰ Vence em ${diasAteVencer}d (${venc})`}
            </p>
            <button
                onClick={() => onAvisar(os)}
                style={{ width: '100%', padding: '9px', background: '#25D366', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
            >
                💬 AVISAR NO ZAP
            </button>
        </div>
    );
}

// ============================================================
// GraficoReceita — usa useRef para largura real, sem ResponsiveContainer
// ============================================================
function GraficoReceita({ dadosGrafico, t, fmtMoeda }) {
    const containerRef = React.useRef(null);
    const [largura, setLargura] = useState(300);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            const w = entries[0]?.contentRect?.width;
            if (w && w > 0) setLargura(w);
        });
        observer.observe(containerRef.current);
        const w = containerRef.current.getBoundingClientRect().width;
        if (w > 0) setLargura(w);
        return () => observer.disconnect();
    }, []);

    return (
        <div style={{ background: t.bgCard, padding: '20px', borderRadius: '12px', border: `1px solid ${t.border}`, transition: 'background 0.3s' }}>
            <h3 style={{ color: t.texto, margin: '0 0 20px', fontSize: '15px', fontWeight: '700' }}>
                📈 Receita dos Últimos 7 Dias
            </h3>
            <div ref={containerRef} style={{ width: '100%', height: '220px' }}>
                <BarChart width={largura} height={220} data={dadosGrafico} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <XAxis
                        dataKey="data"
                        stroke={t.graficoStroke}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: t.graficoCursor }}
                        contentStyle={{
                            background: t.graficoTooltip,
                            border: `1px solid ${t.border}`,
                            borderRadius: '8px',
                            color: t.texto,
                        }}
                        itemStyle={{ color: t.texto }}
                        formatter={(value) => [fmtMoeda(value), 'Receita']}
                    />
                    <Bar dataKey="valor" fill="#00E676" radius={[4, 4, 0, 0]} />
                </BarChart>
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL: DashboardTab
// ============================================================
export default function DashboardTab({
    listaCarros = [],
    listaEstoque = [],
    listaFinanceiro = [],
    temPermissao = () => true,
    dispararLembreteOleo = () => { },
    dispararLembreteBateria = () => { },
    lembretesDeOleo = [],
    lembretesDebateria = [],
    estoqueCritico = [],
    dadosGrafico = [],
    tema = 'escuro',
    onToggleTema = () => { },
}) {
    const t = TEMAS[tema] || TEMAS.escuro;

    const financeiro = useMemo(() => {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const incSem = new Date(hoje); incSem.setDate(hoje.getDate() - hoje.getDay());
        let fDia = 0, fSem = 0, fMes = 0;

        listaFinanceiro.forEach(item => {
            const mult = item.tipo === 'saida' ? -1 : 1;
            const v = (Number(item.total || item.valor) || 0) * mult;
            const d = item.data_registro?.toDate ? item.data_registro.toDate() : new Date(item.data_registro || item.data);

            if (!d || isNaN(d)) return;
            if (d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) fDia += v;
            if (d >= incSem) fSem += v;
            if (d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) fMes += v;
        });
        return { fDia, fSem, fMes };
    }, [listaFinanceiro]);

    const totalAReceber = listaCarros.filter(os => os.statusPagamento !== 'pago').reduce((a, os) => a + (Number(os.total) || 0), 0);
    const osPendentes = listaCarros.filter(c => c.statusPagamento !== 'pago' && c.status !== 'finalizado').length;
    const totalEstoque = listaEstoque.reduce((a, i) => a + (Number(i.qtd) || 0), 0);

    const [montado, setMontado] = useState(false);
    useEffect(() => { setMontado(true); }, []);

    return (
        <div style={{ padding: '5px' }}>

            {/* ===== BOTÃO TEMA CLARO / ESCURO ===== */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                <button
                    onClick={onToggleTema}
                    title={t.labelToggle}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        background: tema === 'escuro' ? '#1a1a1a' : '#e8e8e8',
                        color: t.texto,
                        border: `1px solid ${t.border}`,
                        borderRadius: '30px',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: tema === 'claro' ? '0 2px 10px rgba(0,0,0,0.12)' : 'none',
                    }}
                >
                    <span style={{ fontSize: '18px' }}>{t.iconeToggle}</span>
                    {t.labelToggle}
                </button>
            </div>

            {/* ===== CARDS TOPO — 4 MÉTRICAS PRINCIPAIS ===== */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '28px',
            }}>
                <CardMetrica label="🚗 VEÍCULOS NO PÁTIO" valor={osPendentes} cor={GREEN_MONEY} t={t} />
                <CardMetrica
                    label="💰 A RECEBER"
                    valor={fmtMoeda(totalAReceber)}
                    cor="#facc15"
                    t={t}
                />
                <CardMetrica
                    label="📈 FATURAMENTO MÊS"
                    valor={temPermissao('financeiro') ? fmtMoeda(financeiro.fMes) : '🔒'}
                    cor="#3b82f6"
                    t={t}
                />
                <CardMetrica label="📦 ITENS EM ESTOQUE" valor={totalEstoque} cor={KM_COLOR} t={t} />
            </div>

            <h2 style={{ color: GREEN_MONEY, marginBottom: '14px', fontSize: '20px', fontWeight: '900' }}>
                📊 Resumo Financeiro
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '24px',
            }}>
                {[
                    { label: 'GANHO DO DIA', valor: temPermissao('financeiro') ? fmtMoeda(financeiro.fDia) : '🔒', cor: GREEN_MONEY },
                    { label: 'GANHO NA SEMANA', valor: temPermissao('financeiro') ? fmtMoeda(financeiro.fSem) : '🔒', cor: '#3b82f6' },
                    { label: 'VALOR EM O.S.', valor: fmtMoeda(totalAReceber), cor: '#facc15' },
                    { label: 'O.S. TOTAIS', valor: listaCarros.length, cor: KM_COLOR },
                ].map(({ label, valor, cor }) => (
                    <div key={label} style={{ background: t.bgCard, padding: '18px', borderRadius: '10px', border: `1px solid ${t.border}`, transition: 'background 0.3s' }}>
                        <p style={{ color: t.textoSec, margin: '0 0 6px', fontSize: '11px', fontWeight: 'bold' }}>{label}</p>
                        <h3 style={{ color: cor, margin: 0, fontSize: '20px', fontWeight: '800' }}>{valor}</h3>
                    </div>
                ))}
            </div>

            {/* ===== ESTOQUE CRÍTICO ===== */}
            {estoqueCritico.length > 0 && (
                <div style={{
                    background: t.alertaEstoqueB,
                    border: `1px solid ${MAIN_COLOR}`,
                    padding: '18px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                }}>
                    <h3 style={{ color: MAIN_COLOR, margin: '0 0 12px', fontSize: '15px', fontWeight: '800' }}>
                        ⚠️ ALERTA DE ESTOQUE CRÍTICO ({estoqueCritico.length})
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {estoqueCritico.map(item => (
                            <div key={item.id} style={{
                                background: t.alertaEstoqueItem,
                                border: `1px solid ${MAIN_COLOR}55`,
                                padding: '8px 14px',
                                borderRadius: '8px',
                            }}>
                                <span style={{ color: t.texto, fontWeight: 'bold', fontSize: '13px' }}>{item.nome}</span>
                                <span style={{ color: MAIN_COLOR, fontWeight: '900', fontSize: '13px', marginLeft: '8px' }}>
                                    {item.qtd === 0 ? '🚫 ZERADO' : `${item.qtd} un`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== LEMBRETES ÓLEO ===== */}
            {lembretesDeOleo.length > 0 && (
                <div style={{
                    background: t.alertaOleoB,
                    border: `1px solid ${MASTER_COLOR}`,
                    padding: '18px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                }}>
                    <h3 style={{ color: MASTER_COLOR, margin: '0 0 12px', fontSize: '15px', fontWeight: '800' }}>
                        🔔 LEMBRETE DE RETORNO — ÓLEO/REVISÃO ({lembretesDeOleo.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}
                        className="scrollbar-hide">
                        {lembretesDeOleo.map(os => (
                            <CardLembreteOleo key={os.id} os={os} onAvisar={dispararLembreteOleo} t={t} />
                        ))}
                    </div>
                </div>
            )}

            {/* ===== LEMBRETES BATERIA ===== */}
            {lembretesDebateria.length > 0 && (
                <div style={{
                    background: t.alertaBateriaB,
                    border: '1px solid #facc1588',
                    padding: '18px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                }}>
                    <h3 style={{ color: '#facc15', margin: '0 0 12px', fontSize: '15px', fontWeight: '800' }}>
                        🔋 GARANTIA DE BATERIA PRÓXIMA AO FIM ({lembretesDebateria.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}
                        className="scrollbar-hide">
                        {lembretesDebateria.map(os => (
                            <CardBateria key={os.id} os={os} onAvisar={dispararLembreteBateria} t={t} />
                        ))}
                    </div>
                </div>
            )}

            {/* ===== GRÁFICO DE RECEITA ===== */}
            {montado && (
                <div style={{ width: '100%', height: '250px', minWidth: '300px' }}>
                    <GraficoReceita
                        dadosGrafico={dadosGrafico}
                        t={t}
                        fmtMoeda={fmtMoeda}
                    />
                </div>
            )}

            {/* ===== ESTADO VAZIO ===== */}
            {listaCarros.length === 0 && listaEstoque.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: t.vazioB,
                    borderRadius: '12px',
                    border: `1px dashed ${t.border}`,
                    marginTop: '20px',
                    transition: 'background 0.3s',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔧</div>
                    <h3 style={{ color: t.textoSec, margin: '0 0 8px', fontSize: '18px', fontWeight: '800' }}>Bem-vindo ao Sistema!</h3>
                    <p style={{ color: t.textoTer, margin: 0, fontSize: '14px' }}>
                        Abra a primeira O.S. no menu lateral para começar a ver as métricas da sua oficina.
                    </p>
                </div>
            )}

        </div>
    );
}