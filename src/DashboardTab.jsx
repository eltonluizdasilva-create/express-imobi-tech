/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

// ─── EXPORT mantido: AdminNovo.jsx importa { TEMAS } deste arquivo ────────────
export const TEMAS = {
    escuro: {
        bg: 'radial-gradient(circle at top left, rgba(0, 230, 118, 0.14), transparent 34%), radial-gradient(circle at top right, rgba(255, 0, 51, 0.18), transparent 26%), linear-gradient(180deg, #07090d 0%, #0d1017 55%, #080a0f 100%)',
        shell: 'rgba(7, 10, 15, 0.88)',
        card: 'linear-gradient(180deg, rgba(16, 20, 30, 0.94), rgba(9, 12, 18, 0.96))',
        cardSoft: 'linear-gradient(180deg, rgba(19, 24, 36, 0.84), rgba(10, 12, 18, 0.9))',
        stroke: 'rgba(255,255,255,0.08)',
        strokeStrong: 'rgba(255,255,255,0.16)',
        text: '#F5F7FB',
        textSoft: '#9EA7BA',
        textMute: '#697386',
        glow: '0 22px 60px rgba(0, 0, 0, 0.35)',
        grid: 'rgba(255,255,255,0.06)',
        tooltip: '#0d1117',
        positive: '#00E676',
        primary: '#FF335F',
        warning: '#FFD84D',
        info: '#5EA8FF',
        violet: '#8B7BFF',
        chip: 'rgba(255,255,255,0.06)',
        chipStrong: 'rgba(255,255,255,0.1)',
        empty: 'rgba(255,255,255,0.03)',
        heroBorder: 'rgba(255,255,255,0.08)',
        bgCard: 'rgba(16, 20, 30, 0.94)',
        bgCardAlt: 'rgba(10, 12, 18, 0.9)',
        border: 'rgba(255,255,255,0.1)',
        borderSutil: 'rgba(255,255,255,0.06)',
        texto: '#F5F7FB',
        textoSec: '#9EA7BA',
        textoTer: '#697386',
        cardGrad: 'linear-gradient(180deg, rgba(16, 20, 30, 0.94), rgba(9, 12, 18, 0.96))',
        iconeToggle: '☀️',
        labelToggle: 'Modo Claro',
        sombraNeon: (cor) => `0 0 20px ${cor}66, 0 0 40px ${cor}33`,
    },
    claro: {
        bg: 'radial-gradient(circle at top left, rgba(0, 230, 118, 0.12), transparent 34%), radial-gradient(circle at top right, rgba(255, 0, 51, 0.12), transparent 24%), linear-gradient(180deg, #f5f8ff 0%, #eef2fb 55%, #f7f9fd 100%)',
        shell: 'rgba(255, 255, 255, 0.78)',
        card: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,248,252,0.98))',
        cardSoft: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,253,0.92))',
        stroke: 'rgba(15, 23, 42, 0.08)',
        strokeStrong: 'rgba(15, 23, 42, 0.12)',
        text: '#121826',
        textSoft: '#546074',
        textMute: '#7C8799',
        glow: '0 18px 45px rgba(15, 23, 42, 0.08)',
        grid: 'rgba(15, 23, 42, 0.08)',
        tooltip: '#ffffff',
        positive: '#00A85A',
        primary: '#E11D48',
        warning: '#D8A300',
        info: '#2563EB',
        violet: '#6D5DFD',
        chip: 'rgba(15,23,42,0.05)',
        chipStrong: 'rgba(15,23,42,0.08)',
        empty: 'rgba(15,23,42,0.03)',
        heroBorder: 'rgba(15,23,42,0.08)',
        // compat keys
        bgCard: 'rgba(255,255,255,0.98)',
        bgCardAlt: 'rgba(248,250,253,0.92)',
        border: 'rgba(15, 23, 42, 0.1)',
        borderSutil: 'rgba(15, 23, 42, 0.06)',
        texto: '#121826',
        textoSec: '#546074',
        textoTer: '#7C8799',
        cardGrad: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,248,252,0.98))',
        iconeToggle: '🌙',
        labelToggle: 'Modo Escuro',
        sombraNeon: (cor) => `0 4px 20px ${cor}40`,
    },
};

// ─── Formatadores ──────────────────────────────────────────────────────────────
const fmtMoeda = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtCompacto = (value) =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const ratio = (current, target) => {
    if (!target) return 0;
    return Math.max(0, Math.min(100, (current / target) * 100));
};

// ─── Componentes visuais ───────────────────────────────────────────────────────

function StatCard({ label, value, accent, detail, badge, t }) {
    return (
        <div style={{
            background: t.card,
            border: `1px solid ${t.stroke}`,
            borderRadius: '22px',
            padding: '20px',
            boxShadow: t.glow,
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute',
                inset: '-35% auto auto -10%',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: accent,
                opacity: 0.12,
                filter: 'blur(30px)',
                pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, color: t.textSoft, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {label}
                    </p>
                    {badge && (
                        <span style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: t.chip,
                            border: `1px solid ${t.stroke}`,
                            color: t.textSoft,
                            fontSize: '11px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                        }}>
                            {badge}
                        </span>
                    )}
                </div>
                <div style={{ marginTop: '16px', color: accent, fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1 }}>
                    {value}
                </div>
                {detail && (
                    <p style={{ margin: '12px 0 0', color: t.textMute, fontSize: '12px', lineHeight: 1.4 }}>
                        {detail}
                    </p>
                )}
            </div>
        </div>
    );
}

function InsightCard({ title, value, description, accent, t }) {
    return (
        <div style={{
            background: t.cardSoft,
            border: `1px solid ${t.stroke}`,
            borderRadius: '18px',
            padding: '18px',
        }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: accent, boxShadow: `0 0 20px ${accent}` }} />
            <p style={{ margin: '14px 0 8px', color: t.textSoft, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {title}
            </p>
            <h3 style={{ margin: 0, color: t.text, fontSize: '1.15rem' }}>{value}</h3>
            <p style={{ margin: '10px 0 0', color: t.textMute, fontSize: '13px', lineHeight: 1.45 }}>
                {description}
            </p>
        </div>
    );
}

function AlertStrip({ title, count, accent, children, t }) {
    if (!count) return null;
    return (
        <section style={{
            background: t.cardSoft,
            border: `1px solid ${t.strokeStrong}`,
            borderRadius: '24px',
            padding: '22px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: 0, color: accent, fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        {title}
                    </p>
                    <h3 style={{ margin: '8px 0 0', color: t.text, fontSize: '1.05rem' }}>
                        {count} item{count > 1 ? 's' : ''} exigindo atenção
                    </h3>
                </div>
            </div>
            {children}
        </section>
    );
}

function ReminderCard({ title, subtitle, meta, onClick, t }) {
    return (
        <div style={{
            minWidth: '220px',
            background: t.card,
            border: `1px solid ${t.stroke}`,
            borderRadius: '18px',
            padding: '16px',
            flexShrink: 0,
        }}>
            <h4 style={{ margin: 0, color: t.text, fontSize: '14px' }}>{title}</h4>
            <p style={{ margin: '6px 0 0', color: t.textSoft, fontSize: '12px' }}>{subtitle}</p>
            <p style={{ margin: '10px 0 14px', color: t.warning, fontSize: '12px', fontWeight: 700 }}>{meta}</p>
            <button
                onClick={onClick}
                style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '11px 14px',
                    background: 'linear-gradient(90deg, #25D366 0%, #8EF3B0 100%)',
                    color: '#08110b',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '13px',
                }}
            >
                💬 Avisar no WhatsApp
            </button>
        </div>
    );
}

function ChartCard({ dados, t }) {
    return (
        <div style={{
            background: t.card,
            border: `1px solid ${t.stroke}`,
            borderRadius: '26px',
            padding: '22px',
            boxShadow: t.glow,
            height: '100%',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: 0, color: t.textSoft, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Tendência de Fechamento
                    </p>
                    <h3 style={{ margin: '8px 0 0', color: t.text, fontSize: '1.2rem' }}>Real × Projetado do Mês</h3>
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: t.textSoft, fontSize: '12px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.positive, flexShrink: 0 }} />
                        Real
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: t.textSoft, fontSize: '12px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: t.violet, flexShrink: 0 }} />
                        Forecast
                    </span>
                </div>
            </div>
            <div style={{ width: '100%', height: '290px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dados} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="realArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={t.positive} stopOpacity={0.45} />
                                <stop offset="95%" stopColor={t.positive} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={t.violet} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={t.violet} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke={t.grid} vertical={false} />
                        <XAxis dataKey="label" stroke={t.textMute} tickLine={false} axisLine={false} fontSize={11} />
                        <YAxis stroke={t.textMute} tickLine={false} axisLine={false} fontSize={11} tickFormatter={fmtCompacto} />
                        <Tooltip
                            contentStyle={{
                                background: t.tooltip,
                                border: `1px solid ${t.strokeStrong}`,
                                borderRadius: '14px',
                                color: t.text,
                            }}
                            formatter={(value) => fmtMoeda(value)}
                        />
                        <ReferenceLine y={0} stroke={t.grid} />
                        <Area type="monotone" dataKey="real" stroke={t.positive} strokeWidth={3} fill="url(#realArea)" />
                        <Area type="monotone" dataKey="forecast" stroke={t.violet} strokeWidth={3} fill="url(#forecastArea)" strokeDasharray="8 8" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function TinyRevenueChart({ dados, t }) {
    return (
        <div style={{
            background: t.cardSoft,
            border: `1px solid ${t.stroke}`,
            borderRadius: '22px',
            padding: '18px',
        }}>
            <p style={{ margin: 0, color: t.textSoft, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Últimos 7 dias
            </p>
            <h3 style={{ margin: '10px 0 18px', color: t.text, fontSize: '1.05rem' }}>Pulso de receita</h3>
            <div style={{ width: '100%', height: '190px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados}>
                        <CartesianGrid stroke={t.grid} vertical={false} />
                        <XAxis dataKey="data" stroke={t.textMute} tickLine={false} axisLine={false} fontSize={10} />
                        <Tooltip
                            contentStyle={{
                                background: t.tooltip,
                                border: `1px solid ${t.strokeStrong}`,
                                borderRadius: '12px',
                                color: t.text,
                            }}
                            formatter={(value) => fmtMoeda(value)}
                        />
                        <Bar dataKey="valor" fill={t.info} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ─── Componente Principal ──────────────────────────────────────────────────────

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
    // Props extras do DashboardTab original (mantidas para compat)
    oficinaId = '',
    onNovaOS = () => { },
    onBuscarCliente = () => { },
    onFinanceiro = () => { },
    onEstoque = () => { },
    onLancarDespesa = () => { },
    onAgendarRevisao = () => { },
}) {
    const t = TEMAS[tema] || TEMAS.escuro;
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setMounted(true); }, []);

    // Verificação de segurança: garante que dono só acessa o próprio painel
    useEffect(() => {
        const auth = getAuth();
        if (auth.currentUser && oficinaId && auth.currentUser.uid !== oficinaId) {
            navigate('/');
        }
    }, [oficinaId, navigate]);

    // ── Cálculos financeiros ─────────────────────────────────────────────────
    const financeiro = useMemo(() => {
        const hoje = startOfToday();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());

        let faturamentoDia = 0, faturamentoSemana = 0, faturamentoMes = 0;

        listaFinanceiro.forEach((item) => {
            const mult = item.tipo === 'saida' ? -1 : 1;
            const valor = (Number(item.total || item.valor) || 0) * mult;
            const data = item.data_registro?.toDate
                ? item.data_registro.toDate()
                : new Date(item.data_registro || item.data);

            if (!(data instanceof Date) || Number.isNaN(data.getTime())) return;

            if (
                data.getDate() === hoje.getDate() &&
                data.getMonth() === hoje.getMonth() &&
                data.getFullYear() === hoje.getFullYear()
            ) faturamentoDia += valor;

            if (data >= inicioSemana) faturamentoSemana += valor;

            if (
                data.getMonth() === hoje.getMonth() &&
                data.getFullYear() === hoje.getFullYear()
            ) faturamentoMes += valor;
        });

        return { faturamentoDia, faturamentoSemana, faturamentoMes };
    }, [listaFinanceiro]);

    // ── Métricas preditivas ──────────────────────────────────────────────────
    const metricas = useMemo(() => {
        const osAbertas = listaCarros.filter((os) => os.statusPagamento !== 'pago');
        const totalAReceber = osAbertas.reduce((acc, os) => acc + (Number(os.total) || 0), 0);
        const ativosNoPatio = listaCarros.filter(
            (os) => os.status !== 'entregue' && os.status !== 'finalizada'
        ).length;
        const totalEstoque = listaEstoque.reduce((acc, i) => acc + (Number(i.qtd) || 0), 0);
        const ticketMedio = listaCarros.length
            ? listaCarros.reduce((acc, os) => acc + (Number(os.total) || 0), 0) / listaCarros.length
            : 0;
        const potencialRetorno =
            (lembretesDeOleo.length + lembretesDebateria.length) * ticketMedio * 0.35;
        const previstoMes = financeiro.faturamentoMes + totalAReceber + potencialRetorno;
        const capacidade = previstoMes > 0 ? ratio(financeiro.faturamentoMes, previstoMes) : 0;

        return { osAbertas, totalAReceber, ativosNoPatio, totalEstoque, ticketMedio, potencialRetorno, previstoMes, capacidade };
    }, [financeiro.faturamentoMes, lembretesDeOleo.length, lembretesDebateria.length, listaCarros, listaEstoque]);

    // ── Dados do gráfico de forecast ─────────────────────────────────────────
    const dadosForecast = useMemo(() => {
        const base = dadosGrafico.length
            ? dadosGrafico
            : Array.from({ length: 7 }, (_, i) => ({ data: `${i + 1}`, valor: 0 }));

        let running = 0;
        return base.map((item, index) => {
            running += Number(item.valor) || 0;
            const progresso = (index + 1) / base.length;
            const forecast =
                financeiro.faturamentoMes +
                metricas.totalAReceber * progresso +
                metricas.potencialRetorno * progresso;
            return { label: item.data, real: running, forecast };
        });
    }, [dadosGrafico, financeiro.faturamentoMes, metricas.potencialRetorno, metricas.totalAReceber]);

    // ── Insights automáticos ─────────────────────────────────────────────────
    const insights = useMemo(() => {
        const retornoTexto =
            metricas.potencialRetorno > 0
                ? `${fmtMoeda(metricas.potencialRetorno)} pode voltar pelo funil de relacionamento.`
                : 'Sem potencial de retorno mapeado pelos lembretes no momento.';

        return [
            {
                title: 'Projeção de Fechamento',
                value: fmtMoeda(metricas.previstoMes),
                description: `Real ${fmtMoeda(financeiro.faturamentoMes)} + Pátio ${fmtMoeda(metricas.totalAReceber)} + Retorno ${fmtMoeda(metricas.potencialRetorno)}.`,
                accent: t.violet,
            },
            {
                title: 'Ticket Médio Operacional',
                value: fmtMoeda(metricas.ticketMedio),
                description: retornoTexto,
                accent: t.info,
            },
            {
                title: 'Risco de Travamento',
                value: `${estoqueCritico.length} alerta${estoqueCritico.length === 1 ? '' : 's'}`,
                description: estoqueCritico.length
                    ? 'Peças críticas baixas podem frear entrega e faturamento.'
                    : 'Estoque sem gargalos graves no momento.',
                accent: t.primary,
            },
        ];
    }, [estoqueCritico.length, financeiro.faturamentoMes, metricas, t.info, t.primary, t.violet]);

    const heroSubtitle = temPermissao('financeiro')
        ? `Você já confirmou ${fmtMoeda(financeiro.faturamentoMes)} e tem potencial para chegar a ${fmtMoeda(metricas.previstoMes)} neste mês.`
        : 'Libere o Financeiro para acompanhar faturamento real, previsão e risco de fechamento em tempo real.';

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{
            background: t.bg,
            borderRadius: '32px',
            padding: 'clamp(18px, 2vw, 28px)',
            color: t.text,
            border: `1px solid ${t.stroke}`,
            boxShadow: t.glow,
        }}>

            {/* ── Hero Section ─────────────────────────────────────────────── */}
            <section style={{
                background: t.shell,
                border: `1px solid ${t.heroBorder}`,
                borderRadius: '30px',
                padding: 'clamp(22px, 3vw, 34px)',
                backdropFilter: 'blur(16px)',
                marginBottom: '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {/* LEFT: título e tags */}
                    <div style={{ maxWidth: '760px', flex: '2 1 320px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '999px', background: t.chip, border: `1px solid ${t.stroke}` }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.positive, boxShadow: `0 0 18px ${t.positive}`, flexShrink: 0 }} />
                            <span style={{ color: t.textSoft, fontSize: '12px', fontWeight: 700 }}>Dashboard Preditivo · Oficina IA</span>
                        </div>
                        <h1 style={{ margin: '18px 0 10px', fontSize: 'clamp(1.6rem, 4vw, 3rem)', lineHeight: 1.05 }}>
                            Gestão remota com leitura de receita, pátio e conversão.
                        </h1>
                        <p style={{ margin: 0, color: t.textSoft, fontSize: '15px', lineHeight: 1.6 }}>
                            {heroSubtitle}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
                            <span style={{ padding: '9px 14px', borderRadius: '999px', background: t.chip, border: `1px solid ${t.stroke}`, color: t.textSoft, fontSize: '12px', fontWeight: 700 }}>
                                SaaS Freemium orientado a upgrade
                            </span>
                            <span style={{ padding: '9px 14px', borderRadius: '999px', background: t.chip, border: `1px solid ${t.stroke}`, color: t.textSoft, fontSize: '12px', fontWeight: 700 }}>
                                Visão executiva para operação à distância
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: mini-card ritmo */}
                    <div style={{ display: 'grid', gap: '14px', minWidth: '260px', flex: '1 1 280px' }}>
                        <div style={{ background: t.card, border: `1px solid ${t.stroke}`, borderRadius: '22px', padding: '20px' }}>
                            <p style={{ margin: 0, color: t.textSoft, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                                Ritmo Atual
                            </p>
                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                                <strong style={{ color: t.text, fontSize: '2rem' }}>{Math.round(metricas.capacidade)}%</strong>
                                <span style={{ color: t.textMute, fontSize: '12px' }}>do potencial previsto já realizado</span>
                            </div>
                            <div style={{ marginTop: '16px', height: '10px', borderRadius: '999px', background: t.chipStrong, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.max(metricas.capacidade, 5)}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${t.positive} 0%, ${t.violet} 100%)`,
                                    borderRadius: '999px',
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 4 Stat Cards ─────────────────────────────────────────────── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <StatCard
                    label="Faturamento Real"
                    value={temPermissao('financeiro') ? fmtMoeda(financeiro.faturamentoMes) : '🔒 Bloqueado'}
                    accent={t.positive}
                    detail={`Hoje ${fmtMoeda(financeiro.faturamentoDia)} · Semana ${fmtMoeda(financeiro.faturamentoSemana)}`}
                    badge="Mês atual"
                    t={t}
                />
                <StatCard
                    label="Receita em Pátio"
                    value={fmtMoeda(metricas.totalAReceber)}
                    accent={t.warning}
                    detail={`${metricas.osAbertas.length} O.S. abertas aguardando conversão`}
                    badge="Em aberto"
                    t={t}
                />
                <StatCard
                    label="Forecast Inteligente"
                    value={temPermissao('financeiro') ? fmtMoeda(metricas.previstoMes) : '🚀 Upgrade'}
                    accent={t.violet}
                    detail={`Retorno potencial de ${fmtMoeda(metricas.potencialRetorno)}`}
                    badge="Preditivo"
                    t={t}
                />
                <StatCard
                    label="Ativos no Pátio"
                    value={metricas.ativosNoPatio}
                    accent={t.primary}
                    detail={`${metricas.totalEstoque} itens em estoque sustentando a operação`}
                    badge="Operação"
                    t={t}
                />
            </section>

            {/* ── Gráficos: Forecast + Pulso ───────────────────────────────── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: '18px', marginBottom: '24px' }}>
                <div>
                    {mounted && temPermissao('financeiro') ? (
                        <ChartCard dados={dadosForecast} t={t} />
                    ) : (
                        <div style={{ background: t.card, border: `1px solid ${t.stroke}`, borderRadius: '26px', padding: '22px', minHeight: '360px', display: 'grid', placeItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
                                <h3 style={{ margin: 0, color: t.text }}>Módulo Financeiro Bloqueado</h3>
                                <p style={{ margin: '10px 0 0', color: t.textSoft }}>Habilite um plano Pro para ver a previsão de fechamento em tempo real.</p>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ display: 'grid', gap: '18px', gridTemplateRows: '1fr auto' }}>
                    {mounted && <TinyRevenueChart dados={dadosGrafico} t={t} />}
                    <div style={{ background: t.card, border: `1px solid ${t.stroke}`, borderRadius: '22px', padding: '18px' }}>
                        <p style={{ margin: 0, color: t.textSoft, fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            Resumo Rápido
                        </p>
                        <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                            {[
                                { label: 'Lembretes ativos', val: lembretesDeOleo.length + lembretesDebateria.length },
                                { label: 'Estoque crítico', val: estoqueCritico.length },
                                { label: 'Ticket médio', val: fmtMoeda(metricas.ticketMedio) },
                            ].map(({ label, val }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                    <span style={{ color: t.textSoft, fontSize: '13px' }}>{label}</span>
                                    <strong style={{ color: t.text, fontSize: '13px' }}>{val}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Insights Automáticos ─────────────────────────────────────── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {insights.map((item) => (
                    <InsightCard key={item.title} {...item} t={t} />
                ))}
            </section>

            {/* ── Alertas Operacionais ──────────────────────────────────────── */}
            <div style={{ display: 'grid', gap: '18px' }}>
                <AlertStrip title="⚠️ Estoque Crítico" count={estoqueCritico.length} accent={t.primary} t={t}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {estoqueCritico.map((item) => (
                            <span key={item.id || item.nome} style={{ padding: '10px 14px', borderRadius: '999px', background: t.chip, border: `1px solid ${t.stroke}`, color: t.text, fontSize: '13px' }}>
                                {item.nome} {Number(item.qtd) === 0 ? '• zerado' : `• ${item.qtd} un`}
                            </span>
                        ))}
                    </div>
                </AlertStrip>

                <AlertStrip title="🛢️ Lembretes de Serviço" count={lembretesDeOleo.length} accent={t.warning} t={t}>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                        {lembretesDeOleo.map((os) => (
                            <ReminderCard
                                key={os.id}
                                title={os.modelo || 'Veículo'}
                                subtitle={`${os.placa || 'Sem placa'}${os.nomeCliente ? ` · ${os.nomeCliente}` : ''}`}
                                meta="Retorno de manutenção"
                                onClick={() => dispararLembreteOleo(os)}
                                t={t}
                            />
                        ))}
                    </div>
                </AlertStrip>

                <AlertStrip title="🔋 Garantia de Bateria" count={lembretesDebateria.length} accent={t.warning} t={t}>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                        {lembretesDebateria.map((os) => {
                            const dataVenc = os.dataVencimentoBateria ? new Date(os.dataVencimentoBateria) : null;
                            const dias = dataVenc ? Math.ceil((dataVenc - new Date()) / 86400000) : null;
                            const meta =
                                dias == null ? 'Garantia em acompanhamento'
                                    : dias < 0 ? `⚠️ Venceu há ${Math.abs(dias)} dias`
                                        : `⏰ Vence em ${dias} dias`;
                            return (
                                <ReminderCard
                                    key={os.id}
                                    title={os.modelo || 'Veículo'}
                                    subtitle={`${os.placa || 'Sem placa'}${os.marcaBateria ? ` · ${os.marcaBateria}` : ''}`}
                                    meta={meta}
                                    onClick={() => dispararLembreteBateria(os)}
                                    t={t}
                                />
                            );
                        })}
                    </div>
                </AlertStrip>
            </div>

            {/* ── Estado vazio ──────────────────────────────────────────────── */}
            {listaCarros.length === 0 && listaEstoque.length === 0 && (
                <section style={{
                    marginTop: '24px',
                    background: t.empty,
                    border: `1px dashed ${t.strokeStrong}`,
                    borderRadius: '24px',
                    padding: '42px 24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '42px', marginBottom: '14px' }}>🔧</div>
                    <h3 style={{ margin: 0, color: t.text }}>Painel pronto para começar</h3>
                    <p style={{ margin: '10px 0 0', color: t.textSoft }}>
                        Assim que entrar a primeira O.S., o dashboard passa a prever fechamento, pátio e retorno automaticamente.
                    </p>
                </section>
            )}
        </div>
    );
}
