import React, { useState, useEffect } from 'react';
import { Check, Lock, Sparkles, Zap, Brain, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MAIN = '#FF0033';
const GREEN = '#22c55e';
const GOLD = '#fbbf24';
const PURPLE = '#a855f7';

// ── DADOS DE EXIBIÇÃO ──────────────────────────────────────
const BENEFICIOS_TOPO = [
    { titulo: '1 O.S. / MÊS', desc: 'Perfeito para quem está começando ou quer testar o fluxo de orçamentos e recibos.', color: GREEN, icon: <Zap size={20} color={GREEN} /> },
    { titulo: '15 DIAS DE TRIAL', desc: 'Experimente todas as ferramentas avançadas e nossa Inteligência Artificial sem compromisso.', color: PURPLE, icon: <Brain size={20} color={PURPLE} /> },
    { titulo: 'SEM BLOQUEIOS', desc: 'Suas abas de gestão (Ajustes, Equipe, Marketing) nunca exibem cadeado. Liberdade total.', color: GOLD, icon: <ShieldCheck size={20} color={GOLD} /> },
];

const FERRAMENTAS_GRATIS = [
    { id: 'dashboard', label: 'Visão Geral', desc: 'Dashboard intuitivo para acompanhar a saúde e produtividade em tempo real.', icon: '📊' },
    { id: 'tarefa', label: 'Tarefas', desc: 'Organize o dia a dia da equipe e acompanhe o que precisa ser feito.', icon: '📋' },
    { id: 'patrimonio', label: 'Patrimônio', desc: 'Inventário de ferramentas e equipamentos. Proteja seus ativos.', icon: '🏢' },
    { id: 'fornecedores', label: 'Fornecedores', desc: 'Sua lista de parceiros e autopeças organizada para cotações rápidas.', icon: '🤝' },
    { id: 'historico', label: 'Histórico', desc: 'Auditoria completa de tudo o que acontece no sistema para total segurança.', icon: '📜' },
    { id: 'estoque', label: 'Estoque', desc: 'Controle de peças e produtos básicos da oficina.', icon: '📦' },
    { id: 'financeiro', label: 'Financeiro', desc: 'Controle de fluxo de caixa simplificado.', icon: '💰' },
];

const SERVICOS_OPERACOES = [
    { id: 'mecanica', label: 'Mecânica', icon: '🔧' },
    { id: 'moto', label: 'Motos', icon: '🏍️' },
    { id: 'funilaria', label: 'Funilaria', icon: '🚗' },
    { id: 'amortecedor', label: 'Amortecedor', icon: '🧰' },
    { id: 'injecao', label: 'Injeção', icon: '🛠️' },
    { id: 'eletrica', label: 'Elétrica', icon: '⚡' },
    { id: 'alinhamento', label: 'Alinhamento', icon: '⚙️' },
    { id: 'oleo', label: 'Óleo', icon: '🛢️' },
    { id: 'ar_condicionado', label: 'Ar-Condic.', icon: '❄️' },
    { id: 'pneus', label: 'Pneus', icon: '🛞' },
    { id: 'escapamento', label: 'Escapamento', icon: '🪛' },
    { id: 'lavajato', label: 'Lava Jato', icon: '🚿' },
    { id: 'estetica', label: 'Estética', icon: '✨' },
];

const MODULOS_PROFISSIONAIS = [
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'compras', label: 'Compras', icon: '🛒' },
    { id: 'precificacao', label: 'Precificação', icon: '💲' },
    { id: 'revisao_premium', label: 'Revisão Premium', icon: '🛡️' }, // Substituiu a revisão antiga
    { id: 'notafiscal', label: 'Nota Fiscal', icon: '📄' },
    { id: 'desmanche', label: 'Desmanche', icon: '🏗️' },
];

const IA_MODULOS = [
    { id: 'copiloto', label: 'Copiloto IA', icon: '👨‍🔧' },
    { id: 'secretaria', label: 'Secretária IA', icon: '👩‍💼' },
    { id: 'administrador', label: 'Administrador IA', icon: '👔' },
    { id: 'contador', label: 'Assistente Fiscal', icon: '📋' },
    { id: 'retorno', label: 'Máquina de Retorno', icon: '📅' },
    { id: 'estrategia', label: 'Estratégia', icon: '🚀' },
    { id: 'fechamento_caixa', label: '💎 Fechamento Diário (Elite)', icon: '📊' },
    { id: 'pagamentos_equipe', label: '💎 Gestão Equipe/Pagamentos (Elite)', icon: '👥' },
];

const FALLBACK_PLANOS = {
    gratis: { preco: 0, nome: 'Grátis' },
    essencial: { preco: 99, nome: 'Essencial' },
    profissional: { preco: 149, nome: 'Profissional' },
    especialista: { preco: 199, nome: 'Especialista' },
    master: { preco: 249, nome: 'Master' },
    prime: { preco: 599, nome: 'Prime IA' },
};

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function ModuloMeuPlano({ dadosOficina, onModulosChange }) {
    const [planoSelecionado, setPlanoSelecionado] = useState('gratis');
    const [ciclo, setCiclo] = useState('mensal');
    const [servicosSelecionados, setServicosSelecionados] = useState([]);
    const [iaSelecionados, setIaSelecionados] = useState([]);
    const [salvando, setSalvando] = useState(false);
    const [msgSucesso, setMsgSucesso] = useState('');
    const [dataFimTrial, setDataFimTrial] = useState(null);
    const [trialAtivo, setTrialAtivo] = useState(false);

    // A Mágica de Vendas: Se tem plano pago OU algum serviço selecionado, ganha os módulos profissionais
    const isPlanPago = planoSelecionado !== 'gratis' || servicosSelecionados.length > 0;
    const isPremium = isPlanPago || trialAtivo;


    useEffect(() => {
        async function fetchTrial() {
            try {
              const uid = getAuth().currentUser?.uid;
              if (!uid) return;
              const snap = await getDoc(doc(db, 'usuarios', uid));
              if (snap.exists()) {
                const data = snap.data();
                if (data.dataFimTrial) {
                  const fim = data.dataFimTrial.toDate ? data.dataFimTrial.toDate() : new Date(data.dataFimTrial);
                  setDataFimTrial(fim);
                  setTrialAtivo(new Date() < fim);
                }
              }
            } catch (e) { console.error(e); }
          }
          fetchTrial();
        
        if (dadosOficina) {
            setPlanoSelecionado(dadosOficina.plano || 'gratis');
            setCiclo(dadosOficina.tipoPlano === 'anual' ? 'anual' : 'mensal');
            
            const mods = dadosOficina.modulosOperacionais || [];
            setServicosSelecionados(mods.filter(id => SERVICOS_OPERACOES.map(s => s.id).includes(id)));
            setIaSelecionados(mods.filter(id => IA_MODULOS.map(ia => ia.id).includes(id)));
        }
    }, [dadosOficina]);

    // Recalculate plan based on number of selected services
    useEffect(() => {
        const qtd = servicosSelecionados.length;
        if (qtd === 1) setPlanoSelecionado('essencial');
        else if (qtd >= 2 && qtd <= 3) setPlanoSelecionado('profissional');
        else if (qtd >= 4 && qtd <= 5) setPlanoSelecionado('especialista');
        else if (qtd >= 6) setPlanoSelecionado('master');
        // If 0, keep current selection
    }, [servicosSelecionados]);

    const handleToggleServico = (id) => {
        setServicosSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        if (planoSelecionado === 'gratis' && !servicosSelecionados.includes(id)) {
            setPlanoSelecionado('essencial'); // Sugere o essencial ao selecionar o primeiro serviço
        }
    };

    const handleToggleIA = (id) => {
        setIaSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };


    const precoBase = FALLBACK_PLANOS[planoSelecionado]?.preco || 0;
    const precoIA = iaSelecionados.length * 49; // R$49 por módulo IA
    const valorTotal = precoBase + precoIA;
    const valorFinal = ciclo === 'anual' ? Math.round(valorTotal * 12 * 0.85) : valorTotal;

    const salvarConfiguracao = async () => {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;
        setSalvando(true);
        try {
            // Junta tudo que vai salvar no Firebase[cite: 2]
            const modsFinais = [
                ...FERRAMENTAS_GRATIS.map(g => g.id),
                ...servicosSelecionados,
                ...(isPremium ? MODULOS_PROFISSIONAIS.map(m => m.id) : []),
                ...iaSelecionados
            ];

            await updateDoc(doc(db, 'usuarios', uid), {
                modulosOperacionais: [...new Set(modsFinais)],
                plano: planoSelecionado,
                tipoPlano: ciclo,
            }, { merge: true });

            if (onModulosChange) onModulosChange(modsFinais);
            setMsgSucesso('✓ Configuração atualizada com sucesso! Módulos liberados.');
            setTimeout(() => setMsgSucesso(''), 4000);
        } catch (err) { console.error(err); }
        finally { setSalvando(false); }
    };

    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>
            
            {/* 1. CARDS DE BENEFÍCIOS (TOPO) */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
                {BENEFICIOS_TOPO.map(b => (
                    <div key={b.titulo} style={{ flex: '1 1 250px', background: '#111', border: `1px solid ${b.color}40`, borderRadius: '15px', padding: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ background: `${b.color}20`, padding: '10px', borderRadius: '10px' }}>{b.icon}</div>
                        <div>
                            <h3 style={{ color: b.color, margin: '0 0 5px 0', fontSize: '14px', fontWeight: '900' }}>{b.titulo}</h3>
                            <p style={{ margin: 0, color: '#888', fontSize: '12px', lineHeight: '1.4' }}>{b.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: GREEN, margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase' }}>Meu Plano - Exp Auto Tech</h1>
                <p style={{ color: '#666', fontSize: '14px' }}>Configure as ferramentas da sua oficina e pague apenas pelo que usar.</p>
            </div>

            {/* 2. SWITCH MENSAL / ANUAL */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: ciclo === 'mensal' ? '#fff' : '#666' }}>MENSAL</span>
                <div onClick={() => setCiclo(c => c === 'mensal' ? 'anual' : 'mensal')} style={{ width: '50px', height: '24px', background: '#333', borderRadius: '15px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '20px', height: '20px', background: GREEN, borderRadius: '50%', position: 'absolute', top: '2px', left: ciclo === 'mensal' ? '2px' : '28px', transition: 'all 0.3s' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '900', color: ciclo === 'anual' ? '#fff' : '#666', position: 'relative' }}>
                    ANUAL
                    <span style={{ position: 'absolute', top: '-15px', right: '-40px', background: MAIN, color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '10px' }}>-15%</span>
                </span>
            </div>

            {/* 3. ESCALA DE PREÇOS (CARDS) */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '20px', marginBottom: '20px' }}>
                {Object.entries(FALLBACK_PLANOS).map(([key, plan]) => {
                    const ativo = planoSelecionado === key;
                    const isRecomendado = key === 'essencial';
                    return (
                        <div key={key} onClick={() => setPlanoSelecionado(key)} style={{
                            minWidth: '140px', flex: 1, background: ativo ? '#1a1a1a' : '#111',
                            border: `2px solid ${ativo ? (isRecomendado ? GOLD : GREEN) : '#222'}`,
                            borderRadius: '15px', padding: '20px 15px', textAlign: 'center', cursor: 'pointer', position: 'relative',
                            boxShadow: ativo && isRecomendado ? `0 0 20px ${GOLD}20` : 'none',
                            transition: 'all 0.2s'
                        }}>
                            {isRecomendado && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: GOLD, color: '#000', fontSize: '9px', fontWeight: '900', padding: '3px 10px', borderRadius: '10px', whiteSpace: 'nowrap' }}>⭐ RECOMENDADO</div>}
                            <h4 style={{ color: ativo ? '#fff' : '#666', margin: '0 0 10px 0', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900' }}>{plan.nome}</h4>
                            <div style={{ color: ativo ? (isRecomendado ? GOLD : GREEN) : '#888', fontSize: '24px', fontWeight: '900' }}>
                                R$ {plan.preco}<span style={{ fontSize: '12px', fontWeight: '500' }}>/mês</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. SERVIÇOS E OPERAÇÕES (O Gatilho) */}
            <div style={{ marginBottom: '30px', border: '1px solid #222', borderRadius: '15px', padding: '20px', background: '#111' }}>
                <h3 style={{ color: '#aaa', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={14} color={GREEN} /> 1. SELECIONE SUA ÁREA DE ATUAÇÃO
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                    {SERVICOS_OPERACOES.map(serv => {
                        const ativo = servicosSelecionados.includes(serv.id);
                        return (
                            <div key={serv.id} onClick={() => handleToggleServico(serv.id)} style={{
                                background: ativo ? '#001a08' : '#1a1a1a', border: `1px solid ${ativo ? GREEN : '#333'}`,
                                borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${ativo ? GREEN : '#555'}`, background: ativo ? GREEN : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {ativo && <Check size={12} color="#000" strokeWidth={4} />}
                                </div>
                                <span style={{ fontSize: '16px' }}>{serv.icon}</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: ativo ? GREEN : '#888' }}>{serv.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 5. MÓDULOS PROFISSIONAIS (Brinde do Plano) */}
            <div style={{ marginBottom: '30px', border: `1px solid ${isPremium ? GREEN : '#333'}`, borderRadius: '15px', padding: '20px', background: isPremium ? '#001a0820' : '#111', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ color: isPremium ? GREEN : '#aaa', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', margin: 0 }}>
                        🚀 2. MÓDULOS PROFISSIONAIS
                    </h3>
{!isPremium ? (
  <span style={{ background: MAIN, color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '10px' }}>REQUER PLANO PAGO</span>
) : trialAtivo && !isPlanPago ? (
  <span style={{ background: PURPLE, color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '10px' }}>🔓 TRIAL ATIVO - APROVEITE</span>
) : null}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MODULOS_PROFISSIONAIS.map(mod => (
                        <div key={mod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: isPremium ? '#001a08' : '#1a1a1a', border: `1px solid ${isPremium ? GREEN + '40' : '#222'}`, borderRadius: '10px', opacity: isPremium ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '16px' }}>{mod.icon}</span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: isPremium ? '#fff' : '#666' }}>{mod.label}</span>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '900',
                              background: isPremium ? (isPlanPago ? GOLD + '20' : PURPLE + '20') : '#111',
                              color: isPremium ? (isPlanPago ? GOLD : PURPLE) : '#555',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${isPremium ? (isPlanPago ? GOLD + '40' : PURPLE + '40') : '#333'}`
                            }}>
                              {isPlanPago ? '🎁 BÔNUS DO PLANO' : (trialAtivo ? '✅ LIVRE NO TRIAL' : 'BLOQUEADO')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 6. FERRAMENTAS GRÁTIS (Cards Explicativos) */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#aaa', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>🎁 FERRAMENTAS INCLUÍDAS (LIVRE)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {FERRAMENTAS_GRATIS.map(item => (
                        <div key={item.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px', display: 'flex', gap: '15px' }}>
                            <div style={{ fontSize: '24px', background: '#1a1a1a', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                            <div>
                                <h4 style={{ color: '#ddd', margin: '0 0 5px 0', fontSize: '13px', fontWeight: '800' }}>{item.label}</h4>
                                <p style={{ color: '#666', fontSize: '11px', margin: 0, lineHeight: '1.4' }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7. INTELIGÊNCIA ARTIFICIAL */}
            <div style={{ marginBottom: '40px', border: '1px solid #222', borderRadius: '15px', padding: '20px', background: '#111' }}>
                <h3 style={{ color: PURPLE, fontSize: '12px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={14} color={PURPLE} /> INTELIGÊNCIA ARTIFICIAL PREMIUM
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                    {IA_MODULOS.map(ia => {
                        const ativo = iaSelecionados.includes(ia.id);
                        return (
                            <div key={ia.id} onClick={() => handleToggleIA(ia.id)} style={{
                                background: ativo ? PURPLE + '15' : '#1a1a1a', border: `1px solid ${ativo ? PURPLE : '#333'}`,
                                borderRadius: '10px', padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${ativo ? PURPLE : '#555'}`, background: ativo ? PURPLE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {ativo && <Check size={12} color="#fff" strokeWidth={4} />}
                                    </div>
                                    <span style={{ fontSize: '16px' }}>{ia.icon}</span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: ativo ? '#fff' : '#888' }}>{ia.label}</span>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: PURPLE }}>+ R$ 49</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* TOTAL E BOTÃO SALVAR */}
            <div style={{ position: 'sticky', bottom: '20px', background: '#111', border: `1px solid ${GREEN}`, borderRadius: '15px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `0 10px 30px #000`, zIndex: 10 }}>
                <div>
                    <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', fontWeight: '900', margin: '0 0 5px 0' }}>Total do Plano {ciclo}</p>
                    <h2 style={{ color: GREEN, fontSize: '28px', margin: 0, fontWeight: '900' }}>
                        R$ {valorFinal.toLocaleString('pt-BR')}
                    </h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    {msgSucesso && <span style={{ color: GREEN, fontSize: '12px', fontWeight: '900' }}>{msgSucesso}</span>}
                    <button 
                        onClick={salvarConfiguracao} 
                        disabled={salvando}
                        style={{ 
                            background: `linear-gradient(90deg, ${GREEN}, #16a34a)`, color: '#fff', border: 'none', 
                            padding: '15px 40px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', 
                            textTransform: 'uppercase', cursor: salvando ? 'not-allowed' : 'pointer', 
                            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 0 20px ${GREEN}40`
                        }}
                    >
                        <Sparkles size={18} />
                        {salvando ? 'Processando...' : 'Salvar Configuração'}
                    </button>
                </div>
            </div>

        </div>
    );
}