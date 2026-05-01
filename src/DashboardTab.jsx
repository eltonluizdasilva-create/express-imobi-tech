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
import { Lock } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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

function ChartCard({ dados, t, isDemo }) {
    if (!dados || dados.length === 0) return null;

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                        <h3 style={{ margin: 0, color: t.text, fontSize: '1.2rem' }}>Real × Projetado do Mês</h3>
                        {isDemo && (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider animate-pulse">
                                💡 DEMO: Ative o Financeiro Pro
                            </span>
                        )}
                    </div>
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
            <div style={{ width: '100%', height: '290px', minWidth: '0' }}>
                <ResponsiveContainer width="99%" height={290}>
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

function TinyRevenueChart({ dados, t, isDemo }) {
    if (!dados || dados.length === 0) return null;

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
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '10px', marginTop: '6px', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: t.text, fontSize: '1.05rem' }}>Pulso de receita</h3>
                {isDemo && (
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider animate-pulse">
                        💡 DEMO
                    </span>
                )}
            </div>
            <div style={{ width: '100%', height: '190px', minWidth: '0' }}>
                <ResponsiveContainer width="99%" height={190}>
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
    dadosOficina = {},
    setAbaAtiva = () => {},
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

    // Verificação de segurança: removida para evitar loops de redirecionamento. 
    // O PrivateRoute no App.jsx já garante que apenas usuários autorizados acessem esta área.


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
    const hasRealFinance = useMemo(() => {
        return temPermissao('financeiro') && (dadosGrafico && dadosGrafico.some(d => Number(d.valor) > 0));
    }, [dadosGrafico, temPermissao]);

    const dadosGraficoExibicao = useMemo(() => {
        if (hasRealFinance) return dadosGrafico;
        return [
            { data: 'Seg', valor: 2850 },
            { data: 'Ter', valor: 3420 },
            { data: 'Qua', valor: 2180 },
            { data: 'Qui', valor: 4520 },
            { data: 'Sex', valor: 5100 },
            { data: 'Sáb', valor: 3890 },
            { data: 'Dom', valor: 4210 }
        ];
    }, [dadosGrafico, hasRealFinance]);

    const dadosForecastExibicao = useMemo(() => {
        if (hasRealFinance) {
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
        }
        return [
            { label: 'Semana 1', real: 3500, forecast: 4200 },
            { label: 'Semana 2', real: 8200, forecast: 9500 },
            { label: 'Semana 3', real: 12100, forecast: 14000 },
            { label: 'Semana 4', real: 16800, forecast: 18500 }
        ];
    }, [dadosGrafico, hasRealFinance, financeiro.faturamentoMes, metricas.potencialRetorno, metricas.totalAReceber]);

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

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasModule = (idAba) => {
        if (isLocalhost) return true;
        const aba = idAba?.toLowerCase();
        if (dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master') return true;
        if (dadosOficina?.plano === 'premium') return true;
        if (dadosOficina?.modulos?.[aba] === true || dadosOficina?.permissoes?.[aba] === true) return true;
        if ((dadosOficina?.modulosOperacionais || []).includes(aba)) return true;
        return false;
    };

    const revisoesMes = useMemo(() => {
        const hoje = startOfToday();
        return listaCarros.filter(os => {
            const data = os.data_registro?.toDate ? os.data_registro.toDate() : new Date(os.data_registro || os.data);
            const isThisMonth = data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
            const isRevisao = os.tipoServico === 'revisao' || os.tipo === 'revisao' || os.tipoServico === 'revisaopremium' || os.tipo === 'revisaopremium';
            return isThisMonth && isRevisao;
        }).length;
    }, [listaCarros]);

    const itensTroca = useMemo(() => {
        let count = 0;
        listaCarros.forEach(os => {
            if (os.checklist) {
                if (typeof os.checklist === 'string' && os.checklist.toLowerCase().includes('trocar')) {
                    count++;
                } else if (Array.isArray(os.checklist)) {
                    os.checklist.forEach(item => {
                        if (item.status === 'trocar' || item.status === 'TROCAR') count++;
                    });
                }
            }
        });
        return count;
    }, [listaCarros]);

    const retornosProximos = useMemo(() => {
        const hoje = startOfToday();
        const limite = new Date(hoje);
        limite.setDate(hoje.getDate() + 7);

        return listaCarros.filter(os => {
            if (!os.dataRetorno) return false;
            const d = os.dataRetorno.toDate ? os.dataRetorno.toDate() : new Date(os.dataRetorno);
            return d >= hoje && d <= limite;
        }).length;
    }, [listaCarros]);

    const possuiModuloRevisao = hasModule('revisaopremium') || hasModule('revisao');
    const possuiModuloRetorno = hasModule('retorno');
    const checklistsMes = revisoesMes;
    const retornosPendentes = retornosProximos;

    const [revisoesComProblemas, setRevisoesComProblemas] = useState([]);
    useEffect(() => {
        if (!oficinaId) return;
        const carregarRevisoes = async () => {
            try {
                const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'revisoes_premium'));
                if (!snap.empty) {
                    const l = [];
                    snap.forEach(d => {
                        const r = d.data();
                        const check = r.checklistRevisao || {};
                        const hasProblem = Object.values(check).some(v => v === 'ATENÇÃO' || v === 'TROCAR');
                        if (hasProblem && r.statusRetorno !== 'concluido') {
                            const hasTrocar = Object.values(check).some(v => v === 'TROCAR');
                            if (hasTrocar || r.statusRetorno === 'agendado') {
                                l.push({ id: d.id, ...r });
                            } else {
                                if (r.dataRetorno) {
                                    const dRetorno = new Date(r.dataRetorno);
                                    const diffMs = dRetorno.getTime() - Date.now();
                                    const diffDays = diffMs / (1000 * 60 * 60 * 24);
                                    if (diffDays >= 0 && diffDays <= 15) {
                                        l.push({ id: d.id, ...r });
                                    }
                                } else {
                                    l.push({ id: d.id, ...r });
                                }
                            }
                        }
                    });
                    setRevisoesComProblemas(l);
                }
            } catch (err) {
                console.error(err);
            }
        };
        carregarRevisoes();
    }, [oficinaId]);

    const [retornoSelecionado, setRetornoSelecionado] = useState(null);
    const [dataAgendamentoModal, setDataAgendamentoModal] = useState('');

    const isExampleMode = useMemo(() => {
        return !revisoesComProblemas || revisoesComProblemas.length === 0;
    }, [revisoesComProblemas]);

    const listaExibicao = useMemo(() => {
        if (revisoesComProblemas && revisoesComProblemas.length > 0) {
            return revisoesComProblemas;
        }
        return [
            {
                id: 'mock1',
                nomeCliente: 'João da Silva',
                placa: 'ABC-1234',
                modelo: 'Toyota Corolla',
                checklistRevisao: { correias: 'BOM', pastilhas: 'TROCAR', discos: 'ATENÇÃO' },
                relatoRevisao: 'Desgaste acentuado nas pastilhas dianteiras.'
            },
            {
                id: 'mock2',
                nomeCliente: 'Maria Souza',
                placa: 'XYZ-9876',
                modelo: 'Honda Civic',
                checklistRevisao: { correias: 'ATENÇÃO', pastilhas: 'BOM' },
                relatoRevisao: 'Correia de acessórios apresentando pequenas fissuras.'
            }
        ];
    }, [revisoesComProblemas]);

    const totalPotentialMapped = useMemo(() => {
        let sum = 0;
        listaExibicao.forEach(r => {
            if (r.totalRevisao) {
                sum += Number(r.totalRevisao) || 0;
            } else if (r.checklistRevisao) {
                const problems = Object.values(r.checklistRevisao).filter(v => v === 'ATENÇÃO' || v === 'TROCAR').length;
                sum += problems * 350;
            }
        });
        return sum;
    }, [listaExibicao]);

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
                            <span style={{ color: t.textSoft, fontSize: '12px', fontWeight: 700 }}>Dashboard Preditivo · Express Auto Tech</span>
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

            {/* ── Gráficos: Forecast + Pulso (Topo) ─────────────────────────── */}
            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: '18px', marginBottom: '24px' }}>
                <div>
                    {mounted && (
                        <ChartCard dados={dadosForecastExibicao} t={t} isDemo={!hasRealFinance} />
                    )}
                </div>
                <div style={{ display: 'grid', gap: '18px', gridTemplateRows: '1fr auto' }}>
                    {mounted && (
                        <TinyRevenueChart dados={dadosGraficoExibicao} t={t} isDemo={!hasRealFinance} />
                    )}
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

            {/* ── LISTA DE CLIENTES QUE PRECISAM DE RETORNO (Amostra Grátis) ────────────────── */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-[2rem] p-6 mb-8 w-full mt-6 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                            🎯 CLIENTES DA ABA REVISÃO PARA CHAMAR NO WHATSAPP
                        </h2>
                        <p className="text-zinc-500 text-xs">Clientes com itens necessitando de atenção identificados nas revisões.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        {isExampleMode && (
                            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider animate-pulse">
                                💡 Visualização de Exemplo: Comece a usar o módulo de Revisão para ver seus clientes aqui
                            </span>
                        )}
                        {!possuiModuloRetorno && (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider">
                                🔓 AMOSTRA GRÁTIS ATIVA
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listaExibicao.map(cliente => {
                        const itensProblema = Object.entries(cliente.checklistRevisao || {})
                            .filter(([_, status]) => status === 'ATENÇÃO' || status === 'TROCAR')
                            .map(([key]) => key.toUpperCase());

                        const handleAcao = () => {
                            if (!possuiModuloRetorno) {
                                alert('Ação Bloqueada. Ative o módulo Máquina de Retorno para entrar em contato com este cliente agora.');
                            } else {
                                alert(`Iniciando contato com ${cliente.nomeCliente}...`);
                            }
                        };

                        const handleAgendar = () => {
                            if (!possuiModuloRetorno) {
                                alert('Ação Bloqueada. Ative o módulo Máquina de Retorno para entrar em contato com este cliente agora.');
                            } else {
                                setRetornoSelecionado(cliente);
                            }
                        };

                        return (
                            <div key={cliente.id} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-[1.5rem] flex flex-col justify-between min-h-[190px] hover:border-zinc-700/60 transition-all group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-all leading-tight">{cliente.nomeCliente}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5 uppercase font-mono font-bold tracking-wider">
                                            {cliente.placa} • {cliente.modelo}
                                        </p>
                                        <span className="inline-block mt-2 text-[8px] font-black bg-red-500/15 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full tracking-wider uppercase">
                                            RETORNO REVISÃO
                                        </span>
                                        {cliente.statusRetorno === 'agendado' && cliente.dataAgendamento && (
                                            <div className="mt-2 flex items-center gap-1 text-blue-400 font-black text-[10px] uppercase tracking-widest">
                                                📅 AGENDADO: {cliente.dataAgendamento}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                        {itensProblema.length} {itensProblema.length === 1 ? 'ITEM' : 'ITENS'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <p className="text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-wider">Itens com Problema:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {itensProblema.map(item => (
                                            <span key={item} className="text-[8px] bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono font-bold">
                                                ⚠️ {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {cliente.statusRetorno === 'agendado' ? (
                                        <>
                                            <button 
                                                onClick={async () => {
                                                    if (!window.confirm(`Confirmar que ${cliente.nomeCliente || 'o cliente'} compareceu para a manutenção?`)) return;
                                                    try {
                                                        const { doc, updateDoc } = await import('firebase/firestore');
                                                        if (cliente.id && !cliente.id.startsWith('mock')) {
                                                            await updateDoc(doc(db, 'oficinas', oficinaId, 'revisoes_premium', cliente.id), {
                                                                statusRetorno: 'concluido',
                                                                dataConclusao: new Date().toISOString(),
                                                            });
                                                        }
                                                        setRevisoesComProblemas(prev => prev.filter(item => item.id !== cliente.id));
                                                    } catch (e) {
                                                        alert('Erro ao concluir: ' + e.message);
                                                    }
                                                }} 
                                                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black text-[10px] h-9 rounded-xl flex items-center justify-center gap-1 transition-all shadow-lg shadow-green-600/20"
                                            >
                                                ✓ Concluir
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (!window.confirm('Remover o agendamento deste cliente?')) return;
                                                    try {
                                                        const { doc, updateDoc } = await import('firebase/firestore');
                                                        if (cliente.id && !cliente.id.startsWith('mock')) {
                                                            await updateDoc(doc(db, 'oficinas', oficinaId, 'revisoes_premium', cliente.id), {
                                                                statusRetorno: 'pendente',
                                                                dataAgendamento: null,
                                                            });
                                                        }
                                                        setRevisoesComProblemas(prev => prev.map(item => item.id === cliente.id ? { ...item, statusRetorno: 'pendente', dataAgendamento: null } : item));
                                                    } catch (e) {
                                                        alert('Erro ao desfazer: ' + e.message);
                                                    }
                                                }} 
                                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black text-[10px] h-9 rounded-xl flex items-center justify-center gap-1 transition-all border border-zinc-700"
                                            >
                                                Desfazer
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={handleAcao} 
                                                className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-black font-black text-[10px] h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#25D366]/10"
                                            >
                                                💬 WhatsApp
                                            </button>
                                            <button 
                                                onClick={handleAgendar} 
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/10"
                                            >
                                                📅 Agendar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {retornoSelecionado && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-md bg-[#0a0a0a] border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Agendar Retorno</h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                                    {retornoSelecionado.nomeCliente} • {retornoSelecionado.placa}
                                </p>
                            </div>
                            <button 
                                onClick={() => setRetornoSelecionado(null)} 
                                className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Data e Horário</label>
                                <style>{`
                                    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                                        filter: invert(1);
                                        cursor: pointer;
                                        opacity: 0.8;
                                    }
                                    input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
                                        opacity: 1;
                                    }
                                `}</style>
                                <div className="relative">
                                    <input 
                                        id="dash-date-picker"
                                        type="datetime-local" 
                                        className="w-full bg-black border border-zinc-800 focus:border-blue-500/50 rounded-2xl p-4 pr-16 text-white outline-none transition-all cursor-pointer"
                                        value={dataAgendamentoModal}
                                        onChange={(e) => setDataAgendamentoModal(e.target.value)}
                                        onClick={(e) => {
                                            try { e.target.showPicker(); } catch (err) {}
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            try { document.getElementById('dash-date-picker').showPicker(); } catch (err) {}
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 p-2.5 rounded-xl text-blue-400 hover:text-blue-300 transition-all pointer-events-auto flex items-center justify-center animate-pulse"
                                    >
                                        📅
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    if (!possuiModuloRetorno) {
                                        alert('Ação Bloqueada. Ative o módulo Máquina de Retorno para entrar em contato com este cliente agora.');
                                    } else {
                                        const phone = retornoSelecionado.telefone || '';
                                        const msg = encodeURIComponent(`Olá ${retornoSelecionado.nomeCliente}, tudo bem? Gostaríamos de agendar o retorno para a revisão do seu veículo placa ${retornoSelecionado.placa}.`);
                                        window.open(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                    }
                                }}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-2"
                            >
                                💬 Falar com Cliente
                            </button>

                            <button 
                                onClick={async () => {
                                    const dateVal = dataAgendamentoModal;
                                    if (!dateVal) return alert('Selecione ou digite uma data.');
                                    const d = new Date(dateVal);
                                    const val = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    try {
                                        if (retornoSelecionado.id && !retornoSelecionado.id.startsWith('mock')) {
                                            const { doc, updateDoc } = await import('firebase/firestore');
                                            await updateDoc(doc(db, 'oficinas', oficinaId, 'revisoes_premium', retornoSelecionado.id), {
                                                statusRetorno: 'agendado',
                                                dataAgendamento: val,
                                            });
                                        }
                                        alert(`Agendamento confirmado para ${retornoSelecionado.nomeCliente} em ${val}.`);
                                        
                                        // Abre o WhatsApp automaticamente para confirmar o agendamento
                                        if (possuiModuloRetorno) {
                                            const msgBase = `Olá${retornoSelecionado.nomeCliente ? ` ${retornoSelecionado.nomeCliente}` : ''}! Horário confirmado para *${val}*.\nNos vemos lá.`;
                                            window.open(`https://wa.me/55${(retornoSelecionado.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msgBase)}`, '_blank');
                                        }

                                        setRetornoSelecionado(null);
                                        setDataAgendamentoModal('');
                                        // Refresh state locally without removing the scheduled one from display
                                        setRevisoesComProblemas(prev => prev.map(item => item.id === retornoSelecionado.id ? { ...item, statusRetorno: 'agendado', dataAgendamento: val } : item));
                                    } catch (e) {
                                        alert('Erro ao agendar retorno: ' + e.message);
                                    }
                                }}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-600/20"
                            >
                                Confirmar Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Painel Estratégico de Crescimento ────────────────────── */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-[2rem] p-6 mb-8 w-full backdrop-blur-md">
              {/* TOPO: Métricas de Impacto */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/80">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                    🚀 Painel Estratégico de Crescimento
                  </h2>
                  <p className="text-zinc-500 text-xs">Módulos profissionais para maximizar o ticket e faturamento da sua oficina.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Potencial Mapeado</span>
                    <span className="text-emerald-400 font-black text-base tracking-tight">
                      {totalPotentialMapped.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — {listaExibicao.length} oportunidades
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* COLUNA 1: REVISÃO */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  {!possuiModuloRevisao ? (
                    <div>
                      {/* Header da Revisão Elite (Grátis) */}
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-white font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Revisão Elite
                          </h3>
                          <p className="text-zinc-500 text-[10px]">Crie laudos profissionais e fotos para o seu cliente.</p>
                        </div>
                        <button onClick={() => setAbaAtiva('meuplano')} className="bg-purple-600 text-white text-[9px] font-black px-4 py-2 rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">ATIVAR AGORA</button>
                      </div>

                      {/* Exemplo de laudo desbotado */}
                      <div className="opacity-50 bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-2xl pointer-events-none select-none">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-zinc-300">📋 Check-up Geral #1042</span>
                          <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">EM ANDAMENTO</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                            <span className="text-xs text-zinc-400">⚠️ Freio Dianteiro</span>
                            <span className="text-[10px] font-bold text-red-400 uppercase">Trocar Pastilha</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                            <span className="text-xs text-zinc-400">⚠️ Suspensão Traseira</span>
                            <span className="text-[10px] font-bold text-amber-400 uppercase">Observação</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                            <span className="text-xs text-zinc-400">✅ Filtro de Ar</span>
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">Ok</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-purple-500 font-black text-xs uppercase tracking-widest mb-4">Revisão Elite</h3>
                      <div className="text-3xl font-black text-white">{checklistsMes || 0}</div>
                      <p className="text-zinc-500 text-[10px] uppercase">Checklists realizados este mês</p>
                    </div>
                  )}
                </div>

                {/* COLUNA 2: RETORNO */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden min-h-[220px] flex flex-col justify-between">
                  {!possuiModuloRetorno ? (
                    <div>
                      {/* Header da Máquina de Retorno (Grátis) */}
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-white font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Máquina de Retorno
                          </h3>
                          <p className="text-zinc-500 text-[10px]">Ative os avisos automáticos e não perca clientes.</p>
                        </div>
                        <button onClick={() => setAbaAtiva('meuplano')} className="bg-green-600 text-white text-[9px] font-black px-4 py-2 rounded-full hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">ATIVAR AGORA</button>
                      </div>

                      {/* Exemplo de card de cliente desbotado com alerta ao clicar */}
                      <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-2xl flex flex-col justify-between h-[132px] cursor-pointer hover:border-zinc-700/80 transition-all group"
                        onClick={() => alert('Este é um cliente quente mapeado pela IA. Ative o módulo para falar com seus 40 clientes prontos para retorno!')}>
                        <div className="opacity-50 select-none flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-all">João da Silva</p>
                              <p className="text-[10px] text-zinc-500">Corolla - ABC1234</p>
                            </div>
                            <span className="text-[9px] font-black bg-red-500/15 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full tracking-wider uppercase">URGENTE: TROCA DE ÓLEO</span>
                          </div>
                          
                          <p className="text-[10px] text-zinc-400 mt-1">Última troca: 10.000km atrás</p>
                        </div>

                        <div className="mt-3">
                          <button className="w-full bg-[#25D366] text-black font-black text-xs h-10 rounded-xl flex items-center justify-center gap-2 hover:bg-[#20ba59] transition-all shadow-lg shadow-[#25D366]/20">
                            💬 AVISAR NO WHATSAPP
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-green-500 font-black text-xs uppercase tracking-widest mb-4">Máquina de Retorno</h3>
                      <div className="text-3xl font-black text-white">{retornosPendentes || 0}</div>
                      <p className="text-zinc-500 text-[10px] uppercase">Clientes para retornar nos próximos 7 dias</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
