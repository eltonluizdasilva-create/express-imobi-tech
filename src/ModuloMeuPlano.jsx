import React, { useState, useEffect, useMemo } from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { db } from './lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MAIN = '#FF0033';
const GREEN = '#22c55e';
const PURPLE = '#a855f7';
const GOLD = '#fbbf24';

const FIXOS_GRATIS = [
  'dashboard', 'estoque', 'financeiro', 'tarefa',
  'patrimonio', 'fornecedores', 'historico', 'ajustes'
];

const FIXOS_PAGOS = ['notafiscal'];

const AUTO_INCLUIDOS_PAGO = ['clientes', 'notafiscal', 'revisao'];

const IA_MODULOS = [
  'copiloto', 'secretaria', 'administrador',
  'contador', 'retorno', 'estrategia'
];

const DESCRICOES_GRATIS = {
  dashboard: 'Dashboard intuitivo para acompanhar a saúde e produtividade em tempo real.',
  estoque: 'Controle de peças, saldo mínimo e custo médio do seu inventário.',
  financeiro: 'Entradas, saídas e fluxo de caixa mensal da oficina.',
  tarefa: 'Organize o dia a dia da equipe e acompanhe o que precisa ser feito.',
  patrimonio: 'Inventário de ferramentas e equipamentos. Proteja seus ativos.',
  fornecedores: 'Cadastre e gerencie seus fornecedores de peças e insumos.',
  historico: 'Busca completa por placa com todo o histórico do veículo.',
  ajustes: 'Personalize nome, logo e dados da sua oficina.',
};

const SECOES = [
  {
    key: 'gratis',
    label: '🎁 FERRAMENTAS GRÁTIS (Livre)',
    cor: GREEN,
    modulos: [
      { id: 'dashboard', label: 'Visão Geral', icon: '📊' },
      { id: 'estoque', label: 'Estoque', icon: '📦' },
      { id: 'financeiro', label: 'Financeiro', icon: '💰' },
      { id: 'tarefa', label: 'Tarefas', icon: '📋' },
      { id: 'patrimonio', label: 'Patrimônio', icon: '🏢' },
      { id: 'fornecedores', label: 'Fornecedores', icon: '🤝' },
      { id: 'historico', label: 'Histórico', icon: '📋' },
      { id: 'ajustes', label: 'Ajustes', icon: '⚙️' },
    ],
  },
  {
    key: 'gestao',
    label: '🚀 MÓDULOS PROFISSIONAIS (Plano Pago)',
    cor: MAIN,
    modulos: [
      { id: 'clientes', label: 'Clientes', icon: '👥' },
      { id: 'compras', label: 'Compras', icon: '📦' },
      { id: 'precificacao', label: 'Precificação', icon: '💲' },
      { id: 'revisao', label: 'Revisão Premium', icon: '🛡️' },
      { id: 'desmanche', label: 'Desmanche', icon: '🚗️' },
      { id: 'notafiscal', label: 'Nota Fiscal', icon: '📄' },
      { id: 'mecanica', label: 'Mecânica', icon: '🔧' },
      { id: 'funilaria', label: 'Funilaria', icon: '🚗' },
    ],
  },
  {
    key: 'ia',
    label: '🧠 INTELIGÊNCIA ARTIFICIAL (Premium)',
    cor: PURPLE,
    modulos: [
      { id: 'copiloto', label: 'Copiloto IA', icon: '👨‍🔧' },
      { id: 'secretaria', label: 'Secretária IA', icon: '👩‍💼' },
      { id: 'administrador', label: 'Administrador IA', icon: '👔' },
      { id: 'contador', label: 'Assistente Fiscal', icon: '📋' },
      { id: 'retorno', label: 'Máquina de Retorno', icon: '📅' },
      { id: 'estrategia', label: 'Estratégia', icon: '🚀' },
    ],
  },
];

const FALLBACK_PLANOS = {
  gratis: { preco: 0, slots: 0, func: 1 },
  essencial: { preco: 99, slots: 1, func: 3 },
  profissional: { preco: 149, slots: 3, func: 5 },
  especialista: { preco: 199, slots: 5, func: 8 },
  master: { preco: 249, slots: 99, func: 12 },
};

/* ── Card explicativo para ferramentas grátis ── */
const GratisCard = ({ mod }) => {
  const desc = DESCRICOES_GRATIS[mod.id] || '';
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d1a0d 0%, #111 100%)',
      border: '1px solid #1a3a1a',
      borderRadius: '12px', padding: '14px 16px', marginBottom: '8px',
      display: 'flex', gap: '14px', alignItems: 'flex-start',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px',
        background: `${GREEN}15`, border: `1px solid ${GREEN}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
      }}>{mod.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#e5e5e5' }}>{mod.label}</span>
          <span style={{
            fontSize: '8px', fontWeight: 900, letterSpacing: '0.5px',
            padding: '2px 7px', borderRadius: '5px',
            background: '#1e1e1e', color: '#555', border: '1px solid #2a2a2a',
          }}>LIVRE</span>
        </div>
        {desc && <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: '1.5' }}>{desc}</p>}
      </div>
      <div style={{
        width: '20px', height: '20px', borderRadius: '5px',
        border: '2px solid #555', background: '#333',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}><Check size={11} color="#888" strokeWidth={3} /></div>
    </div>
  );
};

/* ── Row para módulos pagos e IA ── */
const ModuleRow = ({ mod, ativo, isFixoPago, iaPago, precoIAConfig, isPremium, autoIncluido, onToggle }) => {
  const bloqueado = isFixoPago && !isPremium;
  const visualmenteAtivo = ativo || (isPremium && isFixoPago) || (isPremium && autoIncluido);

  const getBorderColor = () => {
    if (visualmenteAtivo) return iaPago ? PURPLE : MAIN;
    if (bloqueado) return '#1a0000';
    return '#1e1e1e';
  };

  const getBgColor = () => {
    if (visualmenteAtivo) return iaPago ? '#1a0b2e' : '#1a0000';
    return '#0f0f0f';
  };

  const getStatusStyle = () => {
    if (autoIncluido && isPremium) return { background: `${GREEN}18`, color: GREEN, border: `1px solid ${GREEN}44` };
    if (isFixoPago && isPremium) return { background: `${MAIN}15`, color: MAIN, border: `1px solid ${MAIN}44` };
    if (bloqueado) return { background: '#1a0000', color: '#ff333366', border: '1px solid #ff000022' };
    if (iaPago) return { background: `${PURPLE}20`, color: PURPLE, border: `1px solid ${PURPLE}44` };
    if (visualmenteAtivo) return { background: `${MAIN}15`, color: MAIN, border: `1px solid ${MAIN}44` };
    return { background: '#111', color: '#333', border: '1px solid #1e1e1e' };
  };

  const getStatusText = () => {
    if (autoIncluido && isPremium) return '✅ INCLUÍDO';
    if (isFixoPago && isPremium) return '🎁 BÔNUS';
    if (bloqueado) return '🔒 PAGO';
    if (iaPago) return '🧠 IA';
    if (visualmenteAtivo) return '✅ ATIVO';
    return 'SELECIONAR';
  };

  const isClickable = !isFixoPago && !(autoIncluido && isPremium);

  return (
    <div
      onClick={() => { if (isClickable) onToggle(mod.id); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px',
        background: getBgColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '10px', marginBottom: '6px',
        cursor: isClickable ? 'pointer' : 'default',
        opacity: bloqueado ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: '20px', height: '20px', borderRadius: '5px',
        border: `2px solid ${visualmenteAtivo ? (iaPago ? PURPLE : MAIN) : '#2a2a2a'}`,
        background: visualmenteAtivo ? (iaPago ? PURPLE : MAIN) : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {visualmenteAtivo && <Check size={11} color="white" strokeWidth={3} />}
        {bloqueado && !visualmenteAtivo && <Lock size={10} color={MAIN} />}
      </div>

      <span style={{ fontSize: '16px', flexShrink: 0, width: '22px', textAlign: 'center' }}>{mod.icon}</span>
      <span style={{ flex: 1, fontSize: '13px', fontWeight: 700, color: visualmenteAtivo ? (iaPago ? PURPLE : 'white') : '#888' }}>
        {mod.label}
      </span>

      {iaPago && (
        <span style={{ color: PURPLE, fontSize: '10px', fontWeight: '800', marginRight: '8px' }}>
          + R$ {precoIAConfig}
        </span>
      )}

      <span style={{
        fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
        padding: '2px 7px', borderRadius: '5px', flexShrink: 0,
        ...getStatusStyle(),
      }}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default function ModuloMeuPlano({ dadosOficina, planosSistema, onModulosChange }) {
  const [configMaster, setConfigMaster] = useState({ planos: {}, precosIA: {} });
  const [selecionados, setSelecionados] = useState([...FIXOS_GRATIS]);
  const [ciclo, setCiclo] = useState('mensal');
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');

  const planosConfig = useMemo(() => {
    const base = { ...FALLBACK_PLANOS };
    const firePlanos = planosSistema?.planos || configMaster.planos || {};
    Object.keys(base).forEach(key => {
      if (firePlanos[key] !== undefined) {
        const val = firePlanos[key];
        base[key].preco = typeof val === 'object' ? (val.preco || 0) : Number(val);
      }
    });
    return base;
  }, [planosSistema, configMaster.planos]);

  const abasExtrasEscolhidas = selecionados.filter(id =>
    !FIXOS_GRATIS.includes(id) &&
    !FIXOS_PAGOS.includes(id) &&
    !IA_MODULOS.includes(id) &&
    !AUTO_INCLUIDOS_PAGO.includes(id)
  );
  const qtdExtras = abasExtrasEscolhidas.length;

  let planoCalculado = 'gratis';
  if (qtdExtras === 1) planoCalculado = 'essencial';
  else if (qtdExtras >= 2 && qtdExtras <= 3) planoCalculado = 'profissional';
  else if (qtdExtras >= 4 && qtdExtras <= 5) planoCalculado = 'especialista';
  else if (qtdExtras >= 6) planoCalculado = 'master';

  const isPremium = planoCalculado !== 'gratis';
  const precoBase = planosConfig[planoCalculado]?.preco || 0;

  // Auto-incluir módulos quando plano é pago
  useEffect(() => {
    if (isPremium) {
      setSelecionados(prev => {
        const next = new Set(prev);
        AUTO_INCLUIDOS_PAGO.forEach(id => next.add(id));
        return [...next];
      });
    }
  }, [isPremium]);

  const iaEscolhidas = selecionados.filter(id => IA_MODULOS.includes(id));
  const getPrecoIA = (id) => Number(configMaster.precosIA?.[id] || 49);
  const precoIA = iaEscolhidas.reduce((acc, id) => acc + getPrecoIA(id), 0);

  const valorMensal = precoBase + precoIA;
  const total = ciclo === 'anual' ? Math.round(valorMensal * 12 * 0.85) : valorMensal;
  const corDestaque = iaEscolhidas.length > 0 ? PURPLE : (isPremium ? MAIN : GREEN);

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDoc(doc(db, 'configuracoes_admin', 'master'));
        if (snap.exists()) setConfigMaster(snap.data());
      } catch (err) { console.error(err); }
    }
    carregar();
  }, []);

  useEffect(() => {
    if (dadosOficina?.modulosOperacionais?.length > 0) {
      setSelecionados([...new Set([...FIXOS_GRATIS, ...dadosOficina.modulosOperacionais])]);
    }
  }, [dadosOficina?.modulosOperacionais]);

  const toggle = (id) => {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const salvarPlano = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    setSalvando(true);
    try {
      let modsParaSalvar = [...new Set([...FIXOS_GRATIS, ...selecionados])];
      if (isPremium) {
        AUTO_INCLUIDOS_PAGO.forEach(id => { if (!modsParaSalvar.includes(id)) modsParaSalvar.push(id); });
        if (!modsParaSalvar.includes('notafiscal')) modsParaSalvar.push('notafiscal');
      }

      await updateDoc(doc(db, 'usuarios', uid), {
        modulosOperacionais: modsParaSalvar,
        plano: planoCalculado,
        tipoPlano: ciclo,
      }, { merge: true });

      if (onModulosChange) onModulosChange(modsParaSalvar);
      setMsgSucesso('✓ Configuração salva com sucesso!');
      setTimeout(() => setMsgSucesso(''), 3000);
    } catch (err) { console.error(err); }
    finally { setSalvando(false); }
  };

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${corDestaque}` }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: corDestaque, margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900' }}>💰 MEU PLANO - EXP AUTO TECH</h2>
        <p style={{ color: '#666', fontSize: '12px' }}>Configure as ferramentas da sua oficina e pague apenas pelo que usar.</p>
      </div>

      {/* SELETOR DE PLANO AUTOMÁTICO */}
      <div style={{ background: '#111', borderRadius: '14px', border: '1px solid #222', padding: '16px', marginBottom: '20px' }}>
        <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px' }}>
          Nível Atual: <span style={{ color: corDestaque }}>{planoCalculado.toUpperCase()}</span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
          {Object.entries(planosConfig).filter(([c]) => c !== 'gratis').map(([chave, p]) => {
            const isEssencial = chave === 'essencial';
            const isAtivo = planoCalculado === chave;
            return (
              <div key={chave} style={{
                position: 'relative',
                background: isAtivo ? `${MAIN}15` : '#0a0a0a',
                border: `1.5px solid ${isEssencial ? GOLD : (isAtivo ? MAIN : '#1e1e1e')}`,
                borderRadius: '12px', padding: '10px 8px',
                opacity: p.slots <= (planosConfig[planoCalculado]?.slots ?? -1) || isAtivo ? 1 : 0.4,
                boxShadow: isEssencial ? `0 0 12px ${GOLD}22` : 'none',
              }}>
                {isEssencial && (
                  <div style={{
                    position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`,
                    color: '#000', fontSize: '7px', fontWeight: 900, letterSpacing: '0.8px',
                    padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
                  }}>⭐ RECOMENDADO</div>
                )}
                <p style={{ color: isAtivo ? MAIN : (isEssencial ? GOLD : '#666'), fontSize: '9px', fontWeight: '900', margin: 0 }}>{chave.toUpperCase()}</p>
                <p style={{ color: 'white', fontSize: '14px', fontWeight: '900', margin: 0 }}>R$ {p.preco}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* LISTA DE MÓDULOS POR SEÇÃO */}
      <div style={{ background: '#111', borderRadius: '14px', border: '1px solid #222', padding: '16px' }}>
        {SECOES.map(secao => (
          <div key={secao.key} style={{ marginBottom: '20px' }}>
            {/* Seção header — destaque extra para Profissionais */}
            {secao.key === 'gestao' ? (
              <div style={{
                background: `linear-gradient(135deg, ${MAIN}12, transparent)`,
                border: `1px solid ${MAIN}30`, borderRadius: '10px',
                padding: '10px 14px', marginBottom: '12px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: MAIN, letterSpacing: '1px', textTransform: 'uppercase', flex: 1 }}>
                  {secao.label}
                </span>
                <span style={{
                  fontSize: '8px', fontWeight: 900, color: '#fff',
                  background: `linear-gradient(135deg, ${MAIN}, #cc0029)`,
                  padding: '3px 8px', borderRadius: '5px', letterSpacing: '0.5px',
                }}>UPGRADE R$99</span>
              </div>
            ) : (
              <div style={{ fontSize: '10px', fontWeight: 800, color: secao.cor, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                {secao.label}
              </div>
            )}

            {/* Cards grátis explicativos vs rows normais */}
            {secao.key === 'gratis'
              ? secao.modulos.map(mod => <GratisCard key={mod.id} mod={mod} />)
              : secao.modulos.map(mod => (
                <ModuleRow
                  key={mod.id}
                  mod={mod}
                  ativo={selecionados.includes(mod.id)}
                  isFixoPago={FIXOS_PAGOS.includes(mod.id)}
                  iaPago={IA_MODULOS.includes(mod.id)}
                  precoIAConfig={getPrecoIA(mod.id)}
                  isPremium={isPremium}
                  autoIncluido={AUTO_INCLUIDOS_PAGO.includes(mod.id)}
                  onToggle={toggle}
                />
              ))
            }
          </div>
        ))}

        {msgSucesso && <p style={{ color: GREEN, fontSize: '12px', textAlign: 'center' }}>{msgSucesso}</p>}
        <button
          onClick={salvarPlano}
          disabled={salvando}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${corDestaque}, ${corDestaque === PURPLE ? '#7c3aed' : (corDestaque === MAIN ? '#cc0029' : '#16a34a')})`,
            color: 'white', border: 'none', fontWeight: '900', cursor: 'pointer',
            fontSize: '14px', letterSpacing: '0.5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: `0 4px 20px ${corDestaque}35`,
            transition: 'all 0.2s',
          }}
        >
          <Sparkles size={16} />
          {salvando ? 'Salvando...' : '💾 SALVAR CONFIGURAÇÃO'}
        </button>
      </div>
    </div>
  );
}
