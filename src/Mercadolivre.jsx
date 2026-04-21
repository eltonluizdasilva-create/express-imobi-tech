/* eslint-disable react/prop-types */
import React, { useState, useMemo } from 'react';
import {
    Search, Camera, Zap, TrendingDown, TrendingUp, Minus,
    MessageCircle, Plus, Star, Package, CheckCircle, Clock, Truck
} from 'lucide-react';

// ─── Dados simulados ────────────────────────────────────────────────────────────
const PECAS_POPULARES = [
    'Pastilha de Freio Dianteira',
    'Óleo Motor 5W30',
    'Filtro de Óleo',
    'Amortecedor Dianteiro',
    'Correia Dentada',
    'Vela de Ignição',
    'Filtro de Ar',
    'Disco de Freio',
];

const FORNECEDORES_LOCAIS = [
    { nome: 'Araguari Peças', tel: '5534991111111', cidade: 'Araguari-MG' },
    { nome: 'AutoPeças Triângulo', tel: '5534992222222', cidade: 'Uberlândia-MG' },
    { nome: 'Distribuidora Minas Auto', tel: '5534993333333', cidade: 'Araguari-MG' },
];

const MARCAS_RECOMENDADAS = ['Bosch', 'TRW', 'Cofap', 'Nakata', 'Mann'];
const TODAS_MARCAS = ['Original', 'Bosch', 'Cofap', 'Magneti Marelli', 'Nakata', 'TRW', 'Mann', 'Ferodo'];

const IMAGENS = [
    'https://images.tcdn.com.br/img/img_prod/697730/disco_de_freio_dianteiro_vent_fremax_bd5288_uno_palio_siena_1513_1_20200803154133.jpg',
    'https://images.tcdn.com.br/img/img_prod/697730/amortecedor_dianteiro_monroe_334437mm_uno_vivace_1167_1_20190806144558.jpg',
    'https://images.tcdn.com.br/img/img_prod/697730/pastilha_de_freio_dianteira_cobreq_n132_uno_mille_palio_fiorino_1523_1_20200803154448.jpg',
    'https://images.tcdn.com.br/img/img_prod/697730/filtro_de_oleo_mann_filter_w610_8_uno_palio_punto_fiat_500_1549_1_20200803155705.jpg',
];

const termometro = (preco, media) => {
    const ratio = preco / media;
    if (ratio <= 0.92) return { label: 'BARATO', cor: '#00E676', icone: TrendingDown };
    if (ratio <= 1.08) return { label: 'NA MÉDIA', cor: '#FFD84D', icone: Minus };
    return { label: 'ACIMA', cor: '#FF335F', icone: TrendingUp };
};

const fmtMoeda = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function TermometroBadge({ preco, media }) {
    const { label, cor, icone: Icone } = termometro(preco, media);
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 9px', borderRadius: '999px', fontSize: '9px',
            fontWeight: 900, letterSpacing: '0.06em',
            background: `${cor}18`, color: cor,
            border: `1px solid ${cor}44`,
        }}>
            <Icone size={9} strokeWidth={3} /> {label}
        </span>
    );
}

function CardPeca({ produto, onCotacao, onAddEstoque }) {
    const [adicionado, setAdicionado] = useState(false);
    const isRecom = MARCAS_RECOMENDADAS.some(m => produto.titulo.includes(m));
    const preco = parseFloat(produto.preco);
    const sugestaoVenda = (preco * 1.45).toFixed(2);

    const handleAdd = () => {
        onAddEstoque(produto, preco, sugestaoVenda);
        setAdicionado(true);
        setTimeout(() => setAdicionado(false), 2500);
    };

    return (
        <div style={{
            background: 'linear-gradient(180deg, rgba(22,26,38,0.98) 0%, rgba(12,14,20,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '22px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#00E67633';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0,230,118,0.06)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Imagem */}
            <div style={{ height: '140px', background: '#fff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={produto.img} alt={produto.titulo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                    {isRecom && (
                        <span style={{ background: '#00E676', color: '#000', fontSize: '8px', fontWeight: 900, padding: '3px 8px', borderRadius: '8px' }}>
                            ✦ IA RECOMENDA
                        </span>
                    )}
                </div>
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '8px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={9} style={{ color: '#FFD84D', fill: '#FFD84D' }} />
                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>{produto.avaliacao}</span>
                </div>
            </div>

            {/* Corpo */}
            <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                <h3 style={{ color: '#CBD5E1', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.4, margin: 0 }}>
                    {produto.titulo}
                </h3>

                {/* Preço + Termômetro */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                        <span style={{ color: '#728', fontSize: '9px', fontWeight: 700 }}>R$ </span>
                        <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace' }}>{produto.preco}</span>
                    </div>
                    <TermometroBadge preco={preco} media={produto.mediaRegional} />
                </div>

                {/* Preço médio regional */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#697386', fontSize: '9px', fontWeight: 700 }}>📍 Média Araguari/MG</span>
                    <span style={{ color: '#9EA7BA', fontSize: '11px', fontWeight: 800 }}>{fmtMoeda(produto.mediaRegional)}</span>
                </div>

                {/* Entrega */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={11} style={{ color: '#00E676', flexShrink: 0 }} />
                    <span style={{ color: '#697386', fontSize: '9px' }}>Entrega estimada: </span>
                    <span style={{ color: '#9EA7BA', fontSize: '9px', fontWeight: 700 }}>{produto.entrega}</span>
                </div>

                {/* Sugestão de venda */}
                <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '10px', padding: '7px 10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#697386', fontSize: '9px', fontWeight: 700 }}>Vender por (45% margem)</span>
                    <span style={{ color: '#00E676', fontSize: '11px', fontWeight: 900 }}>{fmtMoeda(sugestaoVenda)}</span>
                </div>

                {/* Botões */}
                <div style={{ display: 'grid', gap: '7px', marginTop: 'auto' }}>
                    <button
                        onClick={() => onCotacao(produto)}
                        style={{
                            padding: '10px', borderRadius: '12px', border: 'none',
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            color: '#fff', fontWeight: 900, fontSize: '10px',
                            textTransform: 'uppercase', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                    >
                        <MessageCircle size={12} /> COTAÇÃO RÁPIDA
                    </button>
                    <button
                        onClick={handleAdd}
                        style={{
                            padding: '10px', borderRadius: '12px',
                            border: `1px solid ${adicionado ? '#00E676' : 'rgba(255,255,255,0.1)'}`,
                            background: adicionado ? 'rgba(0,230,118,0.12)' : 'transparent',
                            color: adicionado ? '#00E676' : '#697386',
                            fontWeight: 900, fontSize: '10px',
                            textTransform: 'uppercase', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            transition: 'all 0.3s',
                        }}
                    >
                        {adicionado ? <><CheckCircle size={12} /> ADICIONADO!</> : <><Plus size={12} /> ADD AO ESTOQUE</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function MercadoLivre({ listaCarros = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [sortBy, setSortBy] = useState('relevancia');
    const [toastMsg, setToastMsg] = useState('');
    const [scanMode, setScanMode] = useState(false);

    // Peças mais vendidas baseadas nas O.S. reais
    const maisVendidas = useMemo(() => {
        const map = {};
        listaCarros.forEach(os => {
            (os.pecas || []).forEach(p => {
                if (!p.nome) return;
                map[p.nome] = (map[p.nome] || 0) + 1;
            });
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nome]) => nome);
    }, [listaCarros]);

    const sugestoesBusca = maisVendidas.length > 0 ? maisVendidas : PECAS_POPULARES;

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const handleSearch = (termo = searchTerm) => {
        if (!termo.trim()) return;
        setSearchTerm(termo);
        setIsSearching(true);
        setScanMode(false);

        setTimeout(() => {
            const novos = Array.from({ length: 12 }, (_, i) => {
                const marca = TODAS_MARCAS[i % TODAS_MARCAS.length];
                const base = 55 + Math.random() * 280;
                const mediaRegional = base * (0.92 + Math.random() * 0.18);
                return {
                    id: i + 1,
                    titulo: `${termo.toUpperCase()} — ${marca}`,
                    preco: base.toFixed(2),
                    mediaRegional: parseFloat(mediaRegional.toFixed(2)),
                    avaliacao: (4.2 + Math.random() * 0.7).toFixed(1),
                    entrega: `${1 + Math.floor(Math.random() * 3)} dia${Math.random() > 0.4 ? 's' : ''}`,
                    img: IMAGENS[i % IMAGENS.length],
                };
            });
            setResultados(novos);
            setIsSearching(false);
        }, 900);
    };

    const handleScanIA = () => {
        setScanMode(true);
        setTimeout(() => {
            const peca = 'Pastilha de Freio — Gol 2015';
            setSearchTerm(peca);
            handleSearch(peca);
            showToast('📷 IA identificou: Pastilha de Freio — Gol 2015');
        }, 1800);
    };

    const handleCotacao = (produto) => {
        const msg = `🔩 *COTAÇÃO RÁPIDA — CENTRAL DE SUPRIMENTOS*\n\n` +
            `Peça: *${produto.titulo}*\n` +
            `💰 Preço de Referência: *${fmtMoeda(produto.preco)}*\n` +
            `📍 Média Regional (Araguari/MG): *${fmtMoeda(produto.mediaRegional)}*\n\n` +
            `Você tem essa peça disponível? Qual seria o seu valor?\n` +
            `Aguardo seu retorno! 🙏`;

        const fornecedor = FORNECEDORES_LOCAIS[Math.floor(Math.random() * FORNECEDORES_LOCAIS.length)];
        window.open(`https://wa.me/${fornecedor.tel}?text=${encodeURIComponent(msg)}`, '_blank');
        showToast(`💬 Cotação enviada para ${fornecedor.nome}`);
    };

    const handleAddEstoque = (produto, preco, sugestao) => {
        showToast(`✅ "${produto.titulo.split('—')[0].trim()}" adicionado ao estoque! Custo: ${fmtMoeda(preco)} · Venda sugerida: ${fmtMoeda(sugestao)}`);
    };

    const resultadosOrdenados = useMemo(() => {
        if (!resultados.length) return [];
        const copia = [...resultados];
        if (sortBy === 'menor') copia.sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco));
        if (sortBy === 'maior') copia.sort((a, b) => parseFloat(b.preco) - parseFloat(a.preco));
        if (sortBy === 'avaliacao') copia.sort((a, b) => parseFloat(b.avaliacao) - parseFloat(a.avaliacao));
        return copia;
    }, [resultados, sortBy]);

    return (
        <div style={{ background: '#060810', minHeight: '100vh', color: '#F5F7FB', fontFamily: 'system-ui, sans-serif', padding: '16px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* ── Toast ─────────────────────────────────────────────── */}
                {toastMsg && (
                    <div style={{
                        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 9999, background: '#0d1117', border: '1px solid #00E676',
                        color: '#00E676', padding: '14px 24px', borderRadius: '999px',
                        fontWeight: 800, fontSize: '13px', boxShadow: '0 8px 30px rgba(0,230,118,0.2)',
                        whiteSpace: 'nowrap',
                    }}>
                        {toastMsg}
                    </div>
                )}

                {/* ── Header ────────────────────────────────────────────── */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(139,123,255,0.08) 100%)',
                    border: '1px solid rgba(0,230,118,0.2)',
                    borderRadius: '28px', padding: '28px 32px', marginBottom: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '18px',
                            background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Package size={28} style={{ color: '#00E676' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676', fontSize: '9px', fontWeight: 900, padding: '4px 10px', borderRadius: '999px', letterSpacing: '0.12em' }}>
                                    IA ATIVA
                                </span>
                            </div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                CENTRAL DE SUPRIMENTOS — IA
                            </h1>
                            <p style={{ margin: '6px 0 0', color: '#697386', fontSize: '12px' }}>
                                Inteligência de mercado · Cotação direta · Margem calculada
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Fornecedores', val: FORNECEDORES_LOCAIS.length, cor: '#00E676' },
                            { label: 'Marcas no catálogo', val: TODAS_MARCAS.length, cor: '#8B7BFF' },
                        ].map(({ label, val, cor }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '12px 18px', textAlign: 'center' }}>
                                <div style={{ color: cor, fontSize: '1.4rem', fontWeight: 900 }}>{val}</div>
                                <div style={{ color: '#697386', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Barra de Busca ────────────────────────────────────── */}
                <div style={{
                    background: 'rgba(16,20,30,0.94)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px', padding: '20px', marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        {/* Input */}
                        <div style={{ position: 'relative', flex: '1 1 280px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#697386', pointerEvents: 'none' }} />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Nome da peça, código ou descrição..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '14px', padding: '14px 50px 14px 42px',
                                    color: '#F5F7FB', fontSize: '14px', outline: 'none',
                                    fontFamily: 'inherit',
                                }}
                            />
                            {/* Botão câmera / Scan IA */}
                            <button
                                onClick={handleScanIA}
                                title="Identificar peça por foto (simulação IA)"
                                style={{
                                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                    background: scanMode ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${scanMode ? '#00E676' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '10px', padding: '7px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', transition: 'all 0.2s',
                                }}
                            >
                                <Camera size={15} style={{ color: scanMode ? '#00E676' : '#697386' }} />
                            </button>
                        </div>

                        <button
                            onClick={() => handleSearch()}
                            disabled={isSearching}
                            style={{
                                padding: '14px 28px', borderRadius: '14px', border: 'none',
                                background: isSearching ? 'rgba(0,230,118,0.3)' : 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
                                color: '#060810', fontWeight: 900, fontSize: '13px',
                                textTransform: 'uppercase', cursor: isSearching ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                            }}
                        >
                            {isSearching ? <><Clock size={14} className="animate-spin" /> Buscando...</> : <><Zap size={14} /> Buscar</>}
                        </button>
                    </div>

                    {/* Scan mode feedback */}
                    {scanMode && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E676', fontSize: '12px', marginBottom: '10px', padding: '8px 12px', background: 'rgba(0,230,118,0.06)', borderRadius: '10px' }}>
                            <Camera size={14} />
                            <span>Analisando imagem com IA... Identificando peça automaticamente</span>
                        </div>
                    )}

                    {/* Sugestões rápidas */}
                    <div>
                        <p style={{ color: '#697386', fontSize: '10px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {maisVendidas.length > 0 ? '📊 Mais vendidas na sua oficina' : '🔥 Mais procuradas'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {sugestoesBusca.map(p => (
                                <button
                                    key={p}
                                    onClick={() => handleSearch(p)}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '999px', padding: '5px 14px', color: '#9EA7BA',
                                        fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00E67644'; e.currentTarget.style.color = '#00E676'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9EA7BA'; }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Filtros de ordenação ──────────────────────────────── */}
                {resultadosOrdenados.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: '#697386', fontSize: '11px', fontWeight: 700 }}>Ordenar:</span>
                        {[
                            { key: 'relevancia', label: '⭐ Relevância' },
                            { key: 'menor', label: '↓ Menor Preço' },
                            { key: 'maior', label: '↑ Maior Preço' },
                            { key: 'avaliacao', label: '★ Avaliação' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setSortBy(key)}
                                style={{
                                    padding: '7px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                                    border: `1px solid ${sortBy === key ? '#00E676' : 'rgba(255,255,255,0.08)'}`,
                                    background: sortBy === key ? 'rgba(0,230,118,0.12)' : 'transparent',
                                    color: sortBy === key ? '#00E676' : '#697386', cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                        <span style={{ marginLeft: 'auto', color: '#697386', fontSize: '11px' }}>
                            {resultadosOrdenados.length} resultados para <strong style={{ color: '#9EA7BA' }}>"{searchTerm}"</strong>
                        </span>
                    </div>
                )}

                {/* ── Grid de resultados ────────────────────────────────── */}
                {resultadosOrdenados.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        {resultadosOrdenados.map(produto => (
                            <CardPeca
                                key={produto.id}
                                produto={produto}
                                onCotacao={handleCotacao}
                                onAddEstoque={handleAddEstoque}
                            />
                        ))}
                    </div>
                )}

                {/* ── Fornecedores ──────────────────────────────────────── */}
                <div style={{
                    background: 'rgba(16,20,30,0.94)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '24px', padding: '22px', marginBottom: '20px',
                }}>
                    <p style={{ margin: '0 0 14px', color: '#9EA7BA', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        🤝 Fornecedores Locais Cadastrados
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {FORNECEDORES_LOCAIS.map(f => (
                            <div key={f.nome} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '14px', padding: '14px 18px',
                            }}>
                                <div>
                                    <p style={{ margin: 0, color: '#F5F7FB', fontWeight: 800, fontSize: '13px' }}>{f.nome}</p>
                                    <p style={{ margin: '3px 0 0', color: '#697386', fontSize: '11px' }}>📍 {f.cidade}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const msg = searchTerm
                                            ? `Olá, ${f.nome}! Preciso cotar: *${searchTerm}*. Você tem disponível? Qual o valor?`
                                            : `Olá, ${f.nome}! Gostaria de cotar peças para minha oficina.`;
                                        window.open(`https://wa.me/${f.tel}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    style={{
                                        padding: '10px 18px', borderRadius: '12px', border: 'none',
                                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                        color: '#fff', fontWeight: 900, fontSize: '11px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                    }}
                                >
                                    <MessageCircle size={13} />
                                    {searchTerm ? 'Cotar esta peça' : 'Entrar em contato'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Estado vazio ──────────────────────────────────────── */}
                {resultadosOrdenados.length === 0 && !isSearching && (
                    <div style={{ textAlign: 'center', padding: '56px 24px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '24px' }}>
                        <Package size={48} style={{ color: '#697386', marginBottom: '16px' }} />
                        <h3 style={{ color: '#F5F7FB', margin: '0 0 10px' }}>Pesquise uma peça para começar</h3>
                        <p style={{ color: '#697386', fontSize: '13px', margin: 0 }}>
                            A IA analisa preços regionais, recomenda marcas e calcula sua margem automaticamente.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}