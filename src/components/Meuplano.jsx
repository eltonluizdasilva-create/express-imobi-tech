import React, { useState, useEffect } from 'react';
import { Check, Lock } from 'lucide-react';
import { db } from './lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MAIN = '#FF0033';
const GREEN = '#22c55e';

// ── Módulos organizados por seção (Operacional → Gestão → IA) ─
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
            { id: 'escapamento', label: 'Escapamento', icon: '🪛' },
            { id: 'lavajato', label: 'Lava Jato', icon: '🚿' },
            { id: 'estetica', label: 'Estética', icon: '✨' },
            { id: 'hibrido', label: 'Híbridos', icon: '🔋' },
            { id: 'eletricos', label: 'Elétricos', icon: '⚡' },
        ],
    },
    {
        key: 'gestao',
        label: '📊 Gestão',
        modulos: [
            { id: 'clientes', label: 'Clientes', icon: '👥' },
            { id: 'dashboard', label: 'Visão Geral', icon: '📊' },
            { id: 'financeiro', label: 'Financeiro', icon: '💰' },
            { id: 'estoque', label: 'Estoque', icon: '📦' },
            { id: 'leads', label: 'Leads/Clientes', icon: '👥' },
            { id: 'historico', label: 'Histórico', icon: '📋' },
            { id: 'tarefa', label: 'Tarefas', icon: '📋' },
            { id: 'notafiscal', label: 'Nota Fiscal', icon: '📄' },
            { id: 'retorno', label: 'Retorno', icon: '📅' },
            { id: 'patrimonio', label: 'Patrimônio', icon: '🏢' },
            { id: 'fornecedores', label: 'Fornecedores', icon: '🤝' },
        ],
    },
    {
        key: 'ia',
        label: '🤖 Inteligência Artificial',
        modulos: [
            { id: 'copiloto', label: 'Copiloto IA', icon: '👨‍🔧' },
            { id: 'secretaria', label: 'Secretária IA', icon: '👩‍💼' },
            { id: 'administrador', label: 'Administrador IA', icon: '👔' },
            { id: 'contador', label: 'Contador IA', icon: '🧮' },
            { id: 'mercadolivre', label: 'Mercado Livre', icon: '📦' },
        ],
    },
];

const FALLBACK_FIXOS = ['mecanica', 'clientes'];
const IA_MODULOS = ['copiloto', 'secretaria', 'administrador', 'contador', 'mercadolivre'];
const DIA_MS = 24 * 60 * 60 * 1000;

const FALLBACK_PLANOS = {
    essencial: { preco: 99, slots: 1, func: 3 },
    profissional: { preco: 149, slots: 3, func: 5 },
    especialista: { preco: 249, slots: 5, func: 8 },
    master: { preco: 449, slots: 99, func: 12 },
    planoPrimeIA: { preco: 599, slots: 999, func: 999 },
};

// ── Linha de módulo ──────────────────────────────────────────
const ModuleRow = ({ mod, ativo, isFixo, bloqueado, iaPago, isPrime, onToggle }) => (
    <div
        onClick={() => { if (!isFixo && !bloqueado) onToggle(mod.id); }}
        style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 14px',
            background: ativo ? (isFixo ? '#131313' : '#001a08') : '#0f0f0f',
            border: `1px solid ${ativo ? (isFixo ? '#2a2a2a' : GREEN) : bloqueado ? '#1a0000' : '#1e1e1e'}`,
            borderRadius: '10px', marginBottom: '6px',
            cursor: isFixo || bloqueado ? 'default' : 'pointer',
            opacity: bloqueado ? 0.35 : 1,
            transition: 'all 0.15s',
        }}
    >
        {/* Checkbox */}
        <div style={{
            width: '20px', height: '20px', borderRadius: '5px',
            border: `2px solid ${ativo ? (isFixo ? '#555' : GREEN) : '#2a2a2a'}`,
            background: ativo ? (isFixo ? '#333' : GREEN) : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
        }}>
            {ativo && <Check size={11} color={isFixo ? '#888' : 'black'} strokeWidth={3} />}
        </div>

        {/* Emoji */}
        <span style={{ fontSize: '16px', flexShrink: 0, width: '22px', textAlign: 'center' }}>{mod.icon}</span>

        {/* Label */}
        <span style={{
            flex: 1, fontSize: '13px', fontWeight: 700,
            color: ativo ? (isFixo ? '#888' : GREEN) : '#888',
        }}>
            {mod.label}
        </span>

        {/* Badge */}
        <span style={{
            fontSize: '9px', fontWeight: 800,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: '5px', flexShrink: 0,
            ...(isFixo
                ? { background: '#1e1e1e', color: '#444', border: '1px solid #2a2a2a' }
                : iaPago && !isPrime
                    ? { background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid #a855f744' }
                    : bloqueado
                        ? { background: '#1a0000', color: '#ff333366', border: '1px solid #ff000022' }
                        : ativo
                            ? { background: '#001a08', color: GREEN, border: `1px solid ${GREEN}44` }
                            : { background: '#111', color: '#333', border: '1px solid #1e1e1e' }),
        }}>
            {isFixo ? '📌 Fixo' : iaPago && !isPrime ? '🔒 +IA' : bloqueado ? '🔒 Limite' : ativo ? '✅ Ativo' : '+ Slot'}
        </span>
    </div>
);

// ── Componente principal ─────────────────────────────────────
export default function ModuloMeuPlano({ dadosOficina, planosSistema, onModulosChange }) {
    const [configMaster, setConfigMaster] = useState({ modulosBase: FALLBACK_FIXOS, planos: {} });
    const [_carregandoConfig, setCarregandoConfig] = useState(true);
    const [planoSelecionado, setPlanoSelecionado] = useState(dadosOficina?.plano || 'essencial');
    const [selecionados, setSelecionados] = useState([...FALLBACK_FIXOS]);
    const [ciclo, setCiclo] = useState('mensal');
    const [salvando, setSalvando] = useState(false);
    const [msgSucesso, setMsgSucesso] = useState('');

    const planosConfig = planosSistema?.planos || configMaster.planos || FALLBACK_PLANOS;
    const modulosBase = configMaster.modulosBase || FALLBACK_FIXOS;
    const planoLimite = planosConfig[planoSelecionado]?.slots || 1;
    const planoPreco = planosConfig[planoSelecionado]?.preco || 0;
    const isPrime = planoSelecionado === 'planoPrimeIA';
    const isUnlimited = planoLimite >= 999;
    const ehMaster = dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master';

    const extrasSelecionados = selecionados.filter(id => !modulosBase.includes(id)).length;
    const limiteAtingido = !isUnlimited && extrasSelecionados >= planoLimite;
    const valorIA = isPrime ? 0 : 100;
    const valorMensal = planoPreco + valorIA;
    const totalAnual = Math.round(valorMensal * 12 * 0.85);
    const total = ciclo === 'anual' ? totalAnual : valorMensal;
    const corDestaque = isPrime ? '#a855f7' : planoSelecionado === 'master' ? '#D4AF37' : MAIN;

    useEffect(() => {
        async function carregar() {
            try {
                const snap = await getDoc(doc(db, 'configuracoes_admin', 'master'));
                if (snap.exists()) {
                    const data = snap.data();
                    setConfigMaster({ modulosBase: data.modulosBase || FALLBACK_FIXOS, planos: data.planos || {} });
                }
            } catch (err) { console.error(err); }
            finally { setCarregandoConfig(false); }
        }
        carregar();
    }, []);

    useEffect(() => {
        if (dadosOficina?.modulosOperacionais?.length > 0) {
            setSelecionados(prev => {
                const fixed = prev.filter(id => modulosBase.includes(id));
                return [...new Set([...fixed, ...dadosOficina.modulosOperacionais])];
            });
        } else {
            setSelecionados([...modulosBase]);
        }
        if (dadosOficina?.plano) setPlanoSelecionado(dadosOficina.plano);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dadosOficina?.modulosOperacionais, dadosOficina?.plano]);

    const toggle = (id) => {
        if (modulosBase.includes(id)) return;
        if (limiteAtingido && !selecionados.includes(id)) return;
        setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const salvarPlano = async (comTrial) => {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;
        setSalvando(true);
        try {
            const todosIds = SECOES.flatMap(s => s.modulos.map(m => m.id));
            const modsFinais = comTrial
                ? [...modulosBase, ...todosIds.filter(id => !modulosBase.includes(id))]
                : [...new Set([...modulosBase, ...selecionados])];
            setSelecionados(modsFinais);
            await updateDoc(doc(db, 'usuarios', uid), {
                modulosOperacionais: modsFinais,
                modulosPermitidos: comTrial ? 'ALL' : null,
                plano: planoSelecionado,
                dataFimTrial: comTrial ? new Date(Date.now() + 15 * DIA_MS) : null,
                tipoPlano: comTrial ? 'trial' : ciclo,
            }, { merge: true });
            if (onModulosChange) onModulosChange(modsFinais);
            setMsgSucesso(comTrial ? '✓ Trial ativado! 15 dias com tudo liberado para você acompanhar seus clientes.' : '✓ Plano atualizado com sucesso!');
            setTimeout(() => setMsgSucesso(''), 4000);
        } catch (err) { console.error(err); }
        finally { setSalvando(false); }
    };

    const abrirWhatsApp = () => {
        const msg = `Olá, Express AI! Gostaria de contratar o plano ${planoSelecionado.toUpperCase()}.\n\n🏪 Oficina: ${dadosOficina?.nome || 'Oficina'}\n📦 Plano: ${isPrime ? 'PRIME IA' : planoSelecionado.toUpperCase()}\n🔄 Ciclo: ${ciclo.toUpperCase()}\n📂 Extras: ${extrasSelecionados}\n💰 Total: R$ ${total.toLocaleString('pt-BR')}${ciclo === 'anual' ? '/ano' : '/mês'}\n\nPode me enviar a chave PIX para liberação?`;
        window.open(`https://wa.me/${planosSistema?.whatsapp || '5534991439845'}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${corDestaque}` }}>

            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: corDestaque, margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900' }}>💰 Meu Plano</h2>
                <p style={{ color: '#666', fontSize: '12px' }}>Escolha seu plano e os módulos extras que sua oficina oferece</p>
            </div>

            {/* SELETOR DE PLANO */}
            <div style={{ background: '#111', borderRadius: '14px', border: '1px solid #222', padding: '16px', marginBottom: '20px' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                    Seu plano atual: <span style={{ color: corDestaque }}>{isPrime ? '👑 PRIME IA' : planoSelecionado.toUpperCase()}</span>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                    {Object.entries(planosConfig).map(([chave, p]) => {
                        const ativo = planoSelecionado === chave;
                        const cor = chave === 'planoPrimeIA' ? '#a855f7' : chave === 'master' ? '#D4AF37' : GREEN;
                        return (
                            <button key={chave} onClick={() => setPlanoSelecionado(chave)} style={{
                                background: ativo ? `${cor}15` : '#0a0a0a',
                                border: `1.5px solid ${ativo ? cor : '#222'}`,
                                borderRadius: '12px', padding: '10px 8px', cursor: 'pointer', transition: 'all 0.15s',
                            }}>
                                <p style={{ color: ativo ? cor : '#444', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                                    {chave === 'planoPrimeIA' ? '👑 PRIME IA' : chave}
                                </p>
                                <p style={{ color: ativo ? cor : '#333', fontSize: '14px', fontWeight: '900', margin: 0 }}>
                                    R$ {p.preco}<span style={{ fontSize: '9px', color: '#444' }}>/m</span>
                                </p>
                                <p style={{ color: ativo ? '#888' : '#555', fontSize: '8px', margin: '2px 0 0' }}>
                                    {p.slots >= 999 ? '∞ abas' : `${p.slots} aba${p.slots > 1 ? 's' : ''}`} | {p.func} func.
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* CICLO */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {['mensal', 'anual'].map(c => (
                        <button key={c} onClick={() => setCiclo(c)} style={{
                            padding: '8px 20px', borderRadius: '20px', border: 'none',
                            background: ciclo === c ? corDestaque : '#1e1e1e',
                            color: ciclo === c ? 'white' : '#555',
                            fontWeight: '800', fontSize: '11px', textTransform: 'uppercase',
                            cursor: 'pointer', position: 'relative',
                        }}>
                            {c.toUpperCase()}
                            {c === 'anual' && (
                                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: MAIN, color: 'white', fontSize: '8px', padding: '2px 5px', borderRadius: '10px', fontWeight: '900' }}>15% OFF</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTA DE MÓDULOS */}
            <div style={{ background: '#111', borderRadius: '14px', border: '1px solid #222', marginBottom: '20px', overflow: 'hidden' }}>

                {/* HEADER */}
                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '900', margin: 0 }}>
                            Módulos da Oficina ({selecionados.length})
                        </p>
                        <p style={{ color: '#555', fontSize: '11px', margin: '2px 0 0' }}>
                            {isUnlimited ? 'Sem limite — escolha quantos quiser' : `Até ${planoLimite} extra${planoLimite !== 1 ? 's' : ''} (${extrasSelecionados}/${planoLimite})`}
                        </p>
                    </div>
                    {limiteAtingido && (
                        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '20px', padding: '4px 12px' }}>
                            <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '800' }}>Limite atingido</span>
                        </div>
                    )}
                </div>

                {/* SEÇÕES */}
                <div style={{ padding: '14px 16px' }}>
                    {SECOES.map(secao => (
                        <div key={secao.key} style={{ marginBottom: '20px' }}>
                            {/* Cabeçalho da seção */}
                            <div style={{
                                fontSize: '10px', fontWeight: 800, color: '#f0c040',
                                letterSpacing: '1.5px', textTransform: 'uppercase',
                                margin: '0 0 10px', padding: '5px 10px',
                                background: '#0f0f0f', borderLeft: '3px solid #f0c040',
                                borderRadius: '0 6px 6px 0',
                            }}>
                                {secao.label}
                            </div>

                            {secao.modulos.map(mod => (
                                <ModuleRow
                                    key={mod.id}
                                    mod={mod}
                                    ativo={selecionados.includes(mod.id)}
                                    isFixo={modulosBase.includes(mod.id)}
                                    bloqueado={!modulosBase.includes(mod.id) && limiteAtingido && !selecionados.includes(mod.id)}
                                    iaPago={IA_MODULOS.includes(mod.id)}
                                    isPrime={isPrime}
                                    onToggle={toggle}
                                />
                            ))}
                        </div>
                    ))}

                    {/* BOTÕES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {msgSucesso && (
                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', textAlign: 'center' }}>
                                <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '800' }}>{msgSucesso}</span>
                            </div>
                        )}
                        <button onClick={() => salvarPlano(false)} disabled={salvando} style={{
                            width: '100%', padding: '13px', borderRadius: '12px',
                            background: 'transparent', color: '#555', border: '1px solid #333',
                            fontWeight: '800', fontSize: '11px', textTransform: 'uppercase',
                            cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.5 : 1,
                        }}>
                            {salvando ? 'Salvando...' : '💾 Salvar Configuração'}
                        </button>
                        <button onClick={() => salvarPlano(true)} disabled={salvando} style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FF0033, #ff3366)',
                            color: 'white', border: 'none', fontWeight: '900', fontSize: '13px',
                            textTransform: 'uppercase', cursor: salvando ? 'not-allowed' : 'pointer',
                            boxShadow: '0 6px 24px #FF003344', opacity: salvando ? 0.5 : 1,
                        }}>
                            🚀 Testar Tudo + 🧠 IA (10 Dias Grátis)
                        </button>
                    </div>
                </div>
            </div>

            {/* MODO MASTER */}
            {ehMaster && (
                <div style={{ background: '#1a1a00', border: '1px solid #D4AF37', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#D4AF37', fontSize: '14px', fontWeight: '900', margin: 0 }}>👑 Modo Master — acesso total</p>
                </div>
            )}

            {/* TOTAL */}
            <div style={{ background: '#1a1a00', border: `2px dashed ${corDestaque}`, padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px', textTransform: 'uppercase' }}>
                    {isPrime ? 'PRIME IA' : planoSelecionado.toUpperCase()}
                    {valorIA > 0 && <span style={{ color: '#a855f7', fontSize: '11px', marginLeft: '6px' }}>+ IA R$ {valorIA}/mês</span>}
                    {' '}({ciclo === 'mensal' ? 'mensal' : 'anual - 15% OFF'})
                </p>
                {ciclo === 'anual' && (
                    <p style={{ color: '#444', fontSize: '11px', margin: '0 0 4px 0' }}>
                        <s>R$ {(planoPreco * 12).toLocaleString('pt-BR')}/ano</s> → com 15% OFF
                    </p>
                )}
                <h2 style={{ margin: '0 0 14px 0', color: corDestaque, fontSize: '36px' }}>
                    R$ {total.toLocaleString('pt-BR')} <span style={{ fontSize: '14px' }}>{ciclo === 'mensal' ? '/mês' : '/ano'}</span>
                </h2>
                <button onClick={abrirWhatsApp} style={{
                    width: '100%', padding: '14px', borderRadius: '10px',
                    background: corDestaque, color: 'white', border: 'none',
                    fontWeight: '900', fontSize: '14px', textTransform: 'uppercase',
                    cursor: 'pointer', boxShadow: `0 5px 20px ${corDestaque}33`,
                }}>
                    💬 Solicitar Upgrade
                </button>
            </div>
        </div>
    );
}
