import React, { useState, useEffect, useMemo } from 'react';
import { Check, Lock, Sparkles, Layout, Users, BarChart3, Wallet, ClipboardCheck, Building2, Handshake, History, Zap, Brain, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const MAIN = '#FF0033';
const GREEN = '#22c55e';
const PURPLE = '#a855f7';
const GOLD = '#f0c040';

const FIXOS_GRATIS = ['dashboard', 'tarefa', 'patrimonio', 'fornecedores', 'historico'];
const FIXOS_PAGOS = ['notafiscal', 'clientes', 'financeiro'];
const IA_MODULOS = ['copiloto', 'secretaria', 'administrador', 'contador', 'mercadolivre', 'retorno', 'estrategia', 'precificacao'];

const MODULOS_GRATIS_INFO = [
    { id: 'dashboard', label: 'VISÃO GERAL', icon: <BarChart3 size={20} />, desc: 'Um dashboard intuitivo para você acompanhar a saúde e a produtividade da sua oficina em tempo real.' },
    { id: 'tarefa', label: 'TAREFA', icon: <ClipboardCheck size={20} />, desc: 'Organize o dia a dia da sua equipe, distribuindo atividades e acompanhando o que precisa ser feito.' },
    { id: 'patrimonio', label: 'PATRIMÔNIO', icon: <Building2 size={20} />, desc: 'Faça o inventário das suas ferramentas, elevadores e equipamentos. Proteja os ativos da sua empresa.' },
    { id: 'fornecedores', label: 'FORNECEDORES', icon: <Handshake size={20} />, desc: 'Tenha sua lista de parceiros e autopeças organizada para cotações rápidas e eficientes.' },
    { id: 'historico', label: 'HISTÓRICO', icon: <History size={20} />, desc: 'Auditoria completa de tudo o que acontece no sistema para garantir total segurança e transparência.' },
];

const SECOES = [
    {
        key: 'operacional',
        label: '🔧 Serviços e Operações',
        modulos: [
            { id: 'mecanica', label: 'Mecânica', icon: '🔧' },
            { id: 'moto', label: 'Motos', icon: '🏍️' },
            { id: 'funilaria', label: 'Funilaria', icon: '🚗' },
            { id: 'amortecedor', label: 'Amortecedor', icon: '🧰' },
            { id: 'injecao', label: 'Injeção', icon: '🛠️' },
            { id: 'eletrica', label: 'Elétrica', icon: '⚡' },
            { id: 'alinhamento', label: 'Alinhamento', icon: '⚙️' },
            { id: 'oleo', label: 'Óleo', icon: '🛢️' },
            { id: 'revisao', label: 'Revisão', icon: '🛡️' },
            { id: 'ar_condicionado', label: 'Ar-Condicionado', icon: '❄️' },
            { id: 'pneus', label: 'Pneus', icon: '🛞' },
            { id: 'desmanche', label: 'Desmanche', icon: '🏗️' },
            { id: 'lavajato', label: 'Lava Jato', icon: '🚿' },
        ],
    },
    {
        key: 'gestao',
        label: '📊 Gestão e Fiscal',
        modulos: [
            { id: 'clientes', label: 'Clientes', icon: '👥' },
            { id: 'financeiro', label: 'Financeiro', icon: '💰' },
            { id: 'notafiscal', label: 'Nota Fiscal', icon: '📄' },
            { id: 'estoque', label: 'Estoque', icon: '📦' },
        ],
    },
    {
        key: 'ia',
        label: '🤖 Inteligência Artificial',
        modulos: [
            { id: 'copiloto', label: 'Copiloto IA', icon: '👨‍🔧' },
            { id: 'secretaria', label: 'Secretária IA', icon: '👩‍💼' },
            { id: 'administrador', label: 'Administrador IA', icon: '👔' },
            { id: 'contador', label: 'Assist. Fiscal', icon: '📋' },
            { id: 'mercadolivre', label: 'Compras', icon: '📦' },
            { id: 'retorno', label: 'Retorno', icon: '📅' },
            { id: 'estrategia', label: 'Estratégia', icon: '🚀' },
            { id: 'precificacao', label: 'Precificação', icon: '💰' },
        ],
    },
];

const FALLBACK_PLANOS = {
    gratis: { preco: 0, slots: 0, label: 'GRÁTIS', func: 'Ilimitado' },
    essencial: { preco: 99, slots: 1, label: 'ESSENCIAL', func: '3 FUNCIONÁRIOS' },
    profissional: { preco: 149, slots: 3, label: 'PROFISSIONAL', func: '5 FUNCIONÁRIOS' },
    especialista: { preco: 199, slots: 5, label: 'ESPECIALISTA', func: '8 FUNCIONÁRIOS' },
    master: { preco: 249, slots: 99, label: 'MASTER', func: 'CONSULTAR' },
    primeia: { preco: 599, slots: 99, label: 'PRIME IA', func: 'CONSULTAR' },
};

export default function Meuplano({ dadosOficina, planosSistema, onModulosChange }) {
    const [configMaster, setConfigMaster] = useState({ planos: {}, precosIA: {} });
    const [selecionados, setSelecionados] = useState([...FIXOS_GRATIS]);
    const [salvando, setSalvando] = useState(false);
    const [msgSucesso, setMsgSucesso] = useState('');
    const [ciclo, setCiclo] = useState('mensal');

    useEffect(() => {
        async function carregar() {
            const snap = await getDoc(doc(db, 'configuracoes_admin', 'master'));
            if (snap.exists()) setConfigMaster(snap.data());
        }
        carregar();
    }, []);

    useEffect(() => {
        if (dadosOficina?.modulosOperacionais?.length > 0) {
            setSelecionados([...new Set([...FIXOS_GRATIS, ...dadosOficina.modulosOperacionais])]);
        }
    }, [dadosOficina?.modulosOperacionais]);

    const planosConfig = useMemo(() => {
        const base = JSON.parse(JSON.stringify(FALLBACK_PLANOS));
        const firePlanos = planosSistema?.planos || configMaster.planos || {};
        Object.keys(base).forEach(key => {
            if (firePlanos[key]) {
                const val = firePlanos[key];
                base[key].preco = typeof val === 'object' ? (val.preco || 0) : Number(val);
            }
        });
        return base;
    }, [planosSistema, configMaster]);

    const extrasAtivos = selecionados.filter(id => !FIXOS_GRATIS.includes(id) && !FIXOS_PAGOS.includes(id) && !IA_MODULOS.includes(id));
    const qtdExtras = extrasAtivos.length;

    let planoCalculado = 'gratis';
    if (qtdExtras === 1) planoCalculado = 'essencial';
    else if (qtdExtras >= 2 && qtdExtras <= 3) planoCalculado = 'profissional';
    else if (qtdExtras >= 4 && qtdExtras <= 5) planoCalculado = 'especialista';
    else if (qtdExtras >= 6) planoCalculado = 'master';

    const slotsDisponiveis = planosConfig[planoCalculado]?.slots || 0;
    const precoBase = planosConfig[planoCalculado]?.preco || 0;
    const iaAtivas = selecionados.filter(id => IA_MODULOS.includes(id));
    const precoIA = iaAtivas.reduce((acc, id) => acc + Number(configMaster.precosIA?.[id] || 49), 0);
    
    const subtotal = precoBase + precoIA;
    const descontoAnual = ciclo === 'anual' ? 0.85 : 1;
    const total = subtotal * descontoAnual;

    const salvarConfiguracao = async () => {
        if (!dadosOficina?.id) return;
        setSalvando(true);
        try {
            let modsParaSalvar = [...new Set([...FIXOS_GRATIS, ...selecionados])];
            if (planoCalculado !== 'gratis') {
                if (!modsParaSalvar.includes('notafiscal')) modsParaSalvar.push('notafiscal');
                if (!modsParaSalvar.includes('clientes')) modsParaSalvar.push('clientes');
                if (!modsParaSalvar.includes('financeiro')) modsParaSalvar.push('financeiro');
            }

            await updateDoc(doc(db, 'usuarios', dadosOficina.id), {
                modulosOperacionais: modsParaSalvar,
                plano: planoCalculado,
                valorMensal: total,
                cicloPagamento: ciclo
            });

            if (onModulosChange) onModulosChange(modsParaSalvar);
            setMsgSucesso('✓ Configuração salva com sucesso!');
            setTimeout(() => setMsgSucesso(''), 4000);
        } catch (err) {
            console.error('Erro ao salvar plano:', err);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div style={{ background: '#050505', minHeight: '100vh', padding: '0 0 50px 0', color: 'white', fontFamily: 'sans-serif' }}>
            
            {/* 1. SEÇÃO FERRAMENTA GRÁTIS */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(240, 192, 64, 0.1)', padding: '10px 20px', borderRadius: '15px', border: `1px solid ${GOLD}`, marginBottom: '15px' }}>
                        <span style={{ fontSize: '24px' }}>🎁</span>
                        <h2 style={{ margin: 0, color: GOLD, fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>Ferramenta Grátis: Sua Oficina Organizada</h2>
                    </div>
                    <p style={{ color: '#888', fontSize: '16px', margin: 0 }}>Acesso vitalício para organizar sua oficina. Você decide quando crescer.</p>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '12px', color: GOLD, letterSpacing: '2px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>⚒ O QUE VOCÊ LEVA SEM CUSTO (PARA SEMPRE)</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '60px' }}>
                    {MODULOS_GRATIS_INFO.map(mod => (
                        <div key={mod.id} style={{ background: '#0f0f0f', padding: '25px', borderRadius: '20px', border: '1px solid #1a1a1a', transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '12px', color: GOLD }}>{mod.icon}</div>
                                <span style={{ fontWeight: '900', fontSize: '15px', letterSpacing: '1px' }}>{mod.label}</span>
                            </div>
                            <p style={{ color: '#666', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>{mod.desc}</p>
                        </div>
                    ))}
                </div>

                {/* 2. BENEFÍCIOS E LIBERDADE */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '12px', color: GOLD, letterSpacing: '2px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>🚀 BENEFÍCIOS E LIBERDADE</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '80px' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '25px', borderRadius: '25px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '12px', borderRadius: '15px', color: GREEN }}><Zap size={24} /></div>
                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', color: GREEN }}>1 O.S. / MÊS</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Perfeito para quem está começando ou quer testar o fluxo de orçamentos e recibos profissionais.</p>
                        </div>
                    </div>
                    <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '25px', borderRadius: '25px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '15px', color: PURPLE }}><Brain size={24} /></div>
                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', color: PURPLE }}>15 DIAS DE TRIAL</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Experimente todas as ferramentas avançadas e nossa Inteligência Artificial por 15 dias sem compromisso.</p>
                        </div>
                    </div>
                    <div style={{ background: 'rgba(240, 192, 64, 0.05)', border: '1px solid rgba(240, 192, 64, 0.2)', padding: '25px', borderRadius: '25px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ background: 'rgba(240, 192, 64, 0.2)', padding: '12px', borderRadius: '15px', color: GOLD }}><ShieldCheck size={24} /></div>
                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', color: GOLD }}>SEM BLOQUEIOS</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Suas abas de gestão (Ajustes, Equipe, Marketing e Ajuda) nunca exibem cadeado. O sistema é seu, a liberdade também.</p>
                        </div>
                    </div>
                </div>

                {/* 3. SELETOR DE PLANOS INTEGRADO */}
                <div id="passo-carrinho" style={{ background: '#0a0a0a', borderRadius: '40px', padding: '40px', border: '1px solid #1a1a1a', marginBottom: '50px' }}>
                    <p style={{ color: '#444', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '25px' }}>SEU PLANO ATUAL: <span style={{ color: MAIN }}>{planoCalculado.toUpperCase()}</span></p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                        {Object.entries(planosConfig).map(([key, p]) => (
                            <div 
                                key={key}
                                style={{ 
                                    background: '#0f0f0f', padding: '20px', borderRadius: '20px', border: `2px solid ${planoCalculado === key ? GOLD : '#1a1a1a'}`,
                                    textAlign: 'center', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <p style={{ margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', color: '#444' }}>{p.label}</p>
                                <h4 style={{ margin: '0 0 5px 0', fontSize: '20px', color: planoCalculado === key ? GOLD : 'white' }}>R$ {p.preco} <span style={{ fontSize: '10px', color: '#444' }}>/m</span></h4>
                                <p style={{ margin: 0, fontSize: '9px', color: '#444', fontWeight: '900' }}>{p.slots > 0 ? (p.slots === 99 ? 'ILIMITADAS' : `ATÉ ${p.slots} ABAS`) : '1 O.S. / MÊS'}</p>
                                <p style={{ margin: '8px 0 0 0', fontSize: '10px', color: GOLD, fontWeight: '900' }}>{p.func}</p>
                                {planoCalculado === key && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: GOLD }} />}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', background: '#111', padding: '5px', borderRadius: '15px', gap: '5px' }}>
                            <button onClick={() => setCiclo('mensal')} style={{ background: ciclo === 'mensal' ? GOLD : 'transparent', color: ciclo === 'mensal' ? 'black' : '#666', border: 'none', padding: '10px 25px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>MENSAL</button>
                            <button onClick={() => setCiclo('anual')} style={{ background: ciclo === 'anual' ? GOLD : 'transparent', color: ciclo === 'anual' ? 'black' : '#666', border: 'none', padding: '10px 25px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', position: 'relative' }}>
                                ANUAL
                                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: MAIN, color: 'white', fontSize: '8px', padding: '2px 6px', borderRadius: '5px' }}>-15%</span>
                            </button>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '48px', margin: '0 0 5px 0', color: 'white' }}>R$ {total.toLocaleString('pt-BR')} <span style={{ fontSize: '16px', color: '#444' }}>/mês</span></h2>
                            {msgSucesso && <p style={{ color: GREEN, fontSize: '12px', fontWeight: '900', margin: '10px 0' }}>{msgSucesso}</p>}
                            <button 
                                onClick={salvarConfiguracao}
                                disabled={salvando}
                                style={{ background: MAIN, color: 'white', border: 'none', padding: '15px 40px', borderRadius: '20px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 10px 30px ${MAIN}33` }}
                            >
                                <Layout size={20} />
                                {salvando ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÃO'}
                            </button>
                        </div>

                        {/* BARRA DE SLOTS INTEGRADA */}
                        <div style={{ width: '100%', maxWidth: '500px', marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900', color: '#444', marginBottom: '8px', textTransform: 'uppercase' }}>
                                <span>Slots de Ferramentas</span>
                                <span>{qtdExtras} DE {slotsDisponiveis === 99 ? '∞' : slotsDisponiveis} USADOS</span>
                            </div>
                            <div style={{ height: '6px', background: '#111', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min((qtdExtras / (slotsDisponiveis || 1)) * 100, 100)}%`, height: '100%', background: planoCalculado === 'gratis' ? '#333' : GREEN, transition: 'width 0.5s ease' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. SEÇÕES DE MÓDULOS (O CARRINHO) */}
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '13px', color: GOLD, letterSpacing: '2px', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>Módulos da Oficina ({qtdExtras})</h3>
                        <p style={{ color: '#444', fontSize: '11px', margin: '5px 0' }}>Escolha as abas operacionais que sua oficina utiliza</p>
                    </div>

                    {SECOES.map(secao => (
                        <div key={secao.key} style={{ marginBottom: '40px' }}>
                            <h4 style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '1px solid #111', paddingBottom: '10px', letterSpacing: '1px' }}>{secao.label}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                {secao.modulos.map(mod => {
                                    const isGratis = FIXOS_GRATIS.includes(mod.id);
                                    const isIA = IA_MODULOS.includes(mod.id);
                                    const ativo = selecionados.includes(mod.id);
                                    const livre = isGratis;

                                    return (
                                        <div
                                            key={mod.id}
                                            onClick={() => !isGratis && setSelecionados(prev => prev.includes(mod.id) ? prev.filter(x => x !== mod.id) : [...prev, mod.id])}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px',
                                                background: ativo ? 'rgba(34, 197, 94, 0.05)' : '#0f0f0f',
                                                border: `1px solid ${ativo ? GREEN : '#1a1a1a'}`,
                                                borderRadius: '15px', cursor: isGratis ? 'default' : 'pointer',
                                                transition: 'all 0.1s', position: 'relative'
                                            }}
                                        >
                                            <div style={{ width: '18px', height: '18px', border: `2px solid ${ativo ? GREEN : '#333'}`, borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ativo ? GREEN : 'transparent' }}>
                                                {ativo && <Check size={12} color="black" strokeWidth={4} />}
                                            </div>
                                            <span style={{ fontSize: '18px' }}>{mod.icon}</span>
                                            <span style={{ flex: 1, fontWeight: '700', fontSize: '13px', color: ativo ? 'white' : '#444', textTransform: 'uppercase' }}>{mod.label}</span>
                                            {isIA && <span style={{ fontSize: '9px', background: 'rgba(168, 85, 247, 0.1)', color: PURPLE, padding: '3px 8px', borderRadius: '5px', fontWeight: '900' }}>+ R$ {configMaster.precosIA?.[mod.id] || 49}</span>}
                                            {livre && <span style={{ fontSize: '9px', color: GREEN, fontWeight: '900', letterSpacing: '1px' }}>LIVRE</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}