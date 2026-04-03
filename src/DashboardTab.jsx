/* eslint-disable react/prop-types */
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip } from 'recharts';

export const TEMAS = {
    escuro: {
        bg: '#000000', bgCard: '#111111', bgCardAlt: '#0a0a0a',
        border: '#222222', borderSutil: '#1a1a1a',
        texto: '#ffffff', textoSec: '#cccccc', textoTer: '#888888',
        cardGrad: 'linear-gradient(145deg, #151515, #050505)',
        graficoTooltip: '#111111', graficoStroke: '#666666',
        graficoCursor: 'rgba(255,255,255,0.05)',
        alertaEstoqueB: '#1a0000', alertaOleoB: '#121212', alertaBateriaB: '#1a1500',
        alertaEstoqueItem: '#FF003311',
        iconeToggle: '☀️', labelToggle: 'MODO CLARO', vazioB: '#111111',
        sombraNeon: (cor) => `0 0 20px ${cor}66, 0 0 40px ${cor}33`,
    },
    claro: {
        bg: '#ffffff', bgCard: '#ffffff', bgCardAlt: '#fafafa',
        border: '#e0e0e0', borderSutil: '#eeeeee',
        texto: '#1a1a1a', textoSec: '#444444', textoTer: '#999999',
        cardGrad: 'linear-gradient(145deg, #ffffff, #f7f7f7)',
        graficoTooltip: '#ffffff', graficoStroke: '#aaaaaa', graficoCursor: '#f5f5f5',
        alertaEstoqueB: '#fff0f0', alertaOleoB: '#ffffff', alertaBateriaB: '#fffef0',
        alertaEstoqueItem: '#ffe5e5',
        iconeToggle: '🌙', labelToggle: 'MODO ESCURO', vazioB: '#ffffff',
        sombraNeon: (cor) => `0 4px 20px ${cor}40`,
    },
};

const GREEN_MONEY = '#00E676';
const MAIN_COLOR = '#FF0033';
const MASTER_COLOR = '#D4AF37';
const KM_COLOR = '#eab308';
const BLUE_INFO = '#3b82f6';
const PURPLE_ACCENT = '#8b5cf6';

const fmtMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function BotaoAcao({ label, cor, onClick, t, icone, tamanho = 'md', ativo = false }) {
    const [hover, setHover] = useState(false);
    const [clicado, setClicado] = useState(false);
    const tamanhos = { sm: { padding: '8px 12px', fontSize: '11px' }, md: { padding: '12px 20px', fontSize: '12px' }, lg: { padding: '16px 28px', fontSize: '14px' } };
    const handleClick = () => { setClicado(true); setTimeout(() => setClicado(false), 150); onClick?.(); };
    return (
        <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={handleClick}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', ...tamanhos[tamanho], background: ativo ? `${cor}20` : hover ? `${cor}15` : t.bgCard, color: ativo ? cor : hover ? '#ffffff' : t.texto, border: `2px solid ${cor}`, borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: hover ? t.sombraNeon(cor) : ativo ? `0 0 15px ${cor}40` : 'none', textTransform: 'uppercase', letterSpacing: '0.8px', transform: clicado ? 'scale(0.95)' : hover ? 'translateY(-2px)' : 'scale(1)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center, ${cor}20 0%, transparent 70%)`, opacity: hover ? 1 : 0, transition: 'opacity 0.3s ease' }} />
            {icone && <span style={{ fontSize: tamanho === 'lg' ? '18px' : '14px' }}>{icone}</span>}
            <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
        </button>
    );
}

function CardMetrica({ label, valor, cor, t, icone, subtitulo, tendencia }) {
    const [hover, setHover] = useState(false);
    return (
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            style={{ background: t.cardGrad, padding: '24px', borderRadius: '16px', border: `1px solid ${t.border}`, borderTop: `5px solid ${cor}`, borderLeft: hover ? `3px solid ${cor}` : `1px solid ${t.border}`, transition: 'all 0.3s', transform: hover ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hover ? t.sombraNeon(cor) : 'none', cursor: 'default', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${cor}, transparent)`, opacity: hover ? 1 : 0.5, transition: 'opacity 0.3s' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {icone && <span style={{ fontSize: '20px' }}>{icone}</span>}
                <p style={{ color: t.textoSec, fontSize: '11px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
            </div>
            <h2 style={{ fontSize: '32px', margin: '12px 0 0', color: cor, fontWeight: '900', textShadow: hover ? `0 0 20px ${cor}50` : 'none', transition: 'text-shadow 0.3s' }}>{valor}</h2>
            {subtitulo && <p style={{ color: t.textoTer, fontSize: '12px', margin: '8px 0 0', fontWeight: '500' }}>{subtitulo}</p>}
            {tendencia && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '12px', color: tendencia > 0 ? GREEN_MONEY : MAIN_COLOR, fontWeight: '700' }}><span>{tendencia > 0 ? '↗' : '↘'}</span><span>{Math.abs(tendencia)}% vs mês anterior</span></div>}
        </div>
    );
}

function AlertaCard({ titulo, itens, cor, t, icone, onAcao, labelAcao }) {
    if (!itens || itens.length === 0) return null;
    return (
        <div style={{ background: t.alertaEstoqueB, border: `2px solid ${cor}`, padding: '24px', borderRadius: '16px', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: cor }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: cor, margin: 0, fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>{icone} {titulo}</h3>
                {onAcao && <button onClick={onAcao} style={{ background: `${cor}20`, color: cor, border: `1.5px solid ${cor}`, padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase' }}>{labelAcao}</button>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {itens.map((item, idx) => (
                    <div key={item.id || idx} style={{ background: t.alertaEstoqueItem, border: `1.5px solid ${cor}`, padding: '12px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{item.nome || item.placa || `Item ${idx + 1}`}</span>
                        <span style={{ color: cor, background: `${cor}20`, padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>{item.qtd !== undefined ? `${item.qtd} un` : item.status || 'Pendente'}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GraficoReceita({ dadosGrafico, t, fmtMoeda }) {
    const [montado, setMontado] = useState(false);
    const [largura, setLargura] = useState(300);
    const ref = React.useRef(null);
    useEffect(() => {
        setMontado(true);
        if (ref.current) {
            const w = ref.current.getBoundingClientRect().width;
            if (w > 0) setLargura(w);
            const obs = new ResizeObserver(entries => { const nw = entries[0]?.contentRect?.width; if (nw > 0) setLargura(nw); });
            obs.observe(ref.current);
            return () => obs.disconnect();
        }
    }, []);
    return (
        <div style={{ background: t.bgCard, padding: '28px', borderRadius: '16px', border: `1px solid ${t.border}`, borderTop: `4px solid ${GREEN_MONEY}`, marginTop: '24px' }}>
            <h3 style={{ color: t.texto, margin: '0 0 25px', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>📈 Evolução de Receita (7 Dias)</h3>
            <div ref={ref} style={{ width: '100%', height: '280px' }}>
                {montado && (
                    <BarChart width={largura} height={280} data={dadosGrafico} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis dataKey="data" stroke={t.textoSec} fontSize={12} fontWeight="600" tickLine={false} axisLine={false} dy={15} />
                        <Tooltip cursor={{ fill: t.graficoCursor, radius: 4 }} contentStyle={{ background: t.graficoTooltip, border: `2px solid ${GREEN_MONEY}`, borderRadius: '12px', padding: '16px', fontWeight: 'bold' }} formatter={(v) => [fmtMoeda(v), 'Faturado']} />
                        <Bar dataKey="valor" fill={GREEN_MONEY} radius={[8, 8, 0, 0]} />
                    </BarChart>
                )}
            </div>
        </div>
    );
}

export default function DashboardTab({
    listaCarros = [], listaEstoque = [], listaFinanceiro = [],
    temPermissao = () => true,
    dispararLembreteOleo = () => { }, dispararLembreteBateria = () => { },
    lembretesDeOleo = [], lembretesDebateria = [],
    estoqueCritico = [], dadosGrafico = [],
    tema = 'escuro', onToggleTema = () => { },
    // Props de navegação — conectadas ao Admin
    onNovaOS = () => { }, onBuscarCliente = () => { },
    onFinanceiro = () => { }, onEstoque = () => { },
    onLancarDespesa = () => { }, onAgendarRevisao = () => { },
}) {
    const t = TEMAS[tema];

    const financeiro = useMemo(() => {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        let fMes = 0, fHoje = 0, fSemana = 0;
        const incSem = new Date(hoje); incSem.setDate(hoje.getDate() - 7);
        listaFinanceiro.forEach(item => {
            const mult = item.tipo === 'saida' ? -1 : 1;
            const v = (Number(item.total || item.valor) || 0) * mult;
            const d = item.data_registro?.toDate ? item.data_registro.toDate() : new Date(item.data_registro || item.data);
            if (!d || isNaN(d)) return;
            if (d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()) fMes += v;
            if (d.toDateString() === hoje.toDateString()) fHoje += v;
            if (d >= incSem) fSemana += v;
        });
        return { fMes, fHoje, fSemana };
    }, [listaFinanceiro]);

    const totalAReceber = listaCarros.filter(os => os.statusPagamento !== 'pago').reduce((a, os) => a + (Number(os.total) || 0), 0);
    const osPendentes = listaCarros.filter(c => c.statusPagamento !== 'pago').length;
    const totalEstoque = listaEstoque.reduce((a, i) => a + (Number(i.qtd) || 0), 0);
    const valorEstoque = listaEstoque.reduce((a, i) => a + ((Number(i.qtd) || 0) * (Number(i.preco_custo) || 0)), 0);

    return (
        <div style={{ padding: '4px 0' }}>

            {/* HEADER COM BOTÕES DE NAVEGAÇÃO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', padding: '20px', background: t.bgCard, borderRadius: '16px', border: `1px solid ${t.border}` }}>
                <div>
                    <h1 style={{ color: t.texto, margin: 0, fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>🏎️ Dashboard da Oficina</h1>
                    <p style={{ color: t.textoSec, margin: '6px 0 0', fontSize: '13px' }}>Visão completa do seu negócio em tempo real</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <BotaoAcao label="Nova O.S." cor={MAIN_COLOR} icone="📄" t={t} onClick={onNovaOS} tamanho="lg" />
                    <BotaoAcao label="Financeiro" cor={GREEN_MONEY} icone="💰" t={t} onClick={onFinanceiro} />
                    <BotaoAcao label="Estoque" cor={KM_COLOR} icone="📦" t={t} onClick={onEstoque} />

=======
                    <div style={{ width: '1px', height: '36px', background: t.border }} />
                    <button onClick={onToggleTema} style={{ background: t.bgCardAlt, color: t.texto, border: `2px solid ${t.border}`, padding: '10px 18px', borderRadius: '30px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                        {t.iconeToggle} {t.labelToggle}
                    </button>
>>>>>>> 5b7369d8d985c6de92b8b5f85688ef797a80d8c3
                </div>
            </div>

            {/* AÇÕES RÁPIDAS — TODAS FUNCIONANDO */}
            <div style={{ background: t.bgCard, padding: '20px', borderRadius: '16px', border: `1px solid ${t.border}`, marginBottom: '24px' }}>
                <h3 style={{ color: t.texto, margin: '0 0 16px', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>⚡ Ações Rápidas</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <BotaoAcao label="Nova O.S." icone="📄" cor={MAIN_COLOR} t={t} onClick={onNovaOS} />
                    <BotaoAcao label="Buscar Cliente" icone="🔍" cor={BLUE_INFO} t={t} onClick={onBuscarCliente} />
                    <BotaoAcao label="Lançar Despesa" icone="💸" cor={PURPLE_ACCENT} t={t} onClick={onLancarDespesa} />
                    <BotaoAcao label="Agendar Revisão" icone="📅" cor={KM_COLOR} t={t} onClick={onAgendarRevisao} />
                </div>
            </div>

            {/* CARDS DE MÉTRICAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                <CardMetrica label="🚗 No Pátio" valor={osPendentes} cor={MAIN_COLOR} t={t} icone="🔧" subtitulo={`${osPendentes} O.S. em aberto`} />
                <CardMetrica label="💰 A Receber" valor={fmtMoeda(totalAReceber)} cor="#facc15" t={t} icone="💵" subtitulo={`${listaCarros.filter(os => os.statusPagamento !== 'pago').length} O.S. pendentes`} />
                <CardMetrica label="📈 Faturamento Mês" valor={temPermissao('financeiro') ? fmtMoeda(financeiro.fMes) : '🔒'} cor={GREEN_MONEY} t={t} icone="📊" subtitulo={temPermissao('financeiro') ? `Hoje: ${fmtMoeda(financeiro.fHoje)}` : 'Sem permissão'} tendencia={null} />
                <CardMetrica label="📦 Itens Estoque" valor={totalEstoque} cor={KM_COLOR} t={t} icone="📦" subtitulo={`Valor: ${fmtMoeda(valorEstoque)}`} />
            </div>

            {/* ALERTAS */}
            <AlertaCard titulo="Estoque Crítico" itens={estoqueCritico} cor={MAIN_COLOR} t={t} icone="⚠️" labelAcao="Comprar" />
            <AlertaCard titulo="Troca de Óleo Pendente" itens={lembretesDeOleo} cor="#f59e0b" t={t} icone="🛢️" onAcao={dispararLembreteOleo} labelAcao="Enviar Lembretes" />
            <AlertaCard titulo="Bateria em Alerta" itens={lembretesDebateria} cor="#6366f1" t={t} icone="🔋" onAcao={dispararLembreteBateria} labelAcao="Notificar" />

            {/* GRÁFICO */}
            {temPermissao('financeiro') && dadosGrafico.length > 0 && (
                <GraficoReceita dadosGrafico={dadosGrafico} t={t} fmtMoeda={fmtMoeda} />
            )}

            {/* RODAPÉ */}
            <div style={{ marginTop: '32px', padding: '20px', background: t.bgCard, borderRadius: '16px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <p style={{ color: t.textoSec, margin: '0 0 4px', fontSize: '11px' }}>Última atualização</p>
                    <p style={{ color: t.texto, margin: 0, fontSize: '13px', fontWeight: '700' }}>{new Date().toLocaleString('pt-BR')}</p>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: t.textoSec, margin: '0 0 4px', fontSize: '10px', textTransform: 'uppercase' }}>Semana</p>
                        <p style={{ color: GREEN_MONEY, margin: 0, fontSize: '18px', fontWeight: '800' }}>{fmtMoeda(financeiro.fSemana)}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: t.textoSec, margin: '0 0 4px', fontSize: '10px', textTransform: 'uppercase' }}>Hoje</p>
                        <p style={{ color: BLUE_INFO, margin: 0, fontSize: '18px', fontWeight: '800' }}>{fmtMoeda(financeiro.fHoje)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
