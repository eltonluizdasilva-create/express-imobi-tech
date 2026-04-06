import React, { useState, useEffect } from 'react';
import { Check, Lock, Sparkles, Clock, ChevronDown, AlertTriangle } from 'lucide-react';
import { db } from './lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MAIN = '#FF0033';
const GREEN = '#22c55e';

const TODOS_MODULOS = [
  { id: 'mecanica', label: 'Mecânica', icon: '🔧', cor: MAIN, categoria: 'operacional' },
  { id: 'clientes', label: 'Clientes', icon: '👥', cor: GREEN, categoria: 'gestao' },
  { id: 'hibrido', label: 'Híbridos/Elétricos', icon: '🔋', cor: '#a855f7', categoria: 'operacional' },
  { id: 'moto', label: 'Motos', icon: '🏍️', cor: '#f97316', categoria: 'operacional' },
  { id: 'funilaria', label: 'Funilaria', icon: '🚗', cor: '#ec4899', categoria: 'operacional' },
  { id: 'amortecedor', label: 'Amortecedor', icon: '🧰', cor: '#f59e0b', categoria: 'operacional' },
  { id: 'injecao', label: 'Injeção', icon: '🛠️', cor: '#06b6d4', categoria: 'operacional' },
  { id: 'eletrica', label: 'Elétrica', icon: '⚡', cor: '#eab308', categoria: 'operacional' },
  { id: 'alinhamento', label: 'Alinhamento', icon: '⚙️', cor: '#6366f1', categoria: 'operacional' },
  { id: 'oleo', label: 'Óleo', icon: '🛢️', cor: '#84cc16', categoria: 'operacional' },
  { id: 'revisao', label: 'Revisão', icon: '🛡️', cor: '#14b8a6', categoria: 'operacional' },
  { id: 'ar_condicionado', label: 'Ar-Condicionado', icon: '❄️', cor: '#3b82f6', categoria: 'operacional' },
  { id: 'pneus', label: 'Pneus', icon: '🛞', cor: '#78716c', categoria: 'operacional' },
  { id: 'desmanche', label: 'Desmanche', icon: '🚗', cor: '#92400e', categoria: 'operacional' },
  { id: 'escapamento', label: 'Escapamento', icon: '🪛', cor: '#6b7280', categoria: 'operacional' },
  { id: 'lavajato', label: 'Lava Jato', icon: '🚿', cor: '#0ea5e9', categoria: 'operacional' },
  { id: 'estetica', label: 'Estética', icon: '✨', cor: '#f43f5e', categoria: 'operacional' },
  { id: 'copiloto', label: 'Copiloto IA', icon: '👨‍🔧', cor: '#a855f7', categoria: 'ia' },
  { id: 'secretaria', label: 'Secretária IA', icon: '👩‍💼', cor: '#d946ef', categoria: 'ia' },
  { id: 'administrador', label: 'Administrador IA', icon: '👔', cor: '#7c3aed', categoria: 'ia' },
  { id: 'contador', label: 'Contador IA', icon: '🧮', cor: '#4f46e5', categoria: 'ia' },
  { id: 'mercadolivre', label: 'Mercado Livre', icon: '📦', cor: '#facc15', categoria: 'ia' },
  { id: 'dashboard', label: 'Visão Geral', icon: '📊', cor: '#06b6d4', categoria: 'gestao' },
  { id: 'financeiro', label: 'Financeiro', icon: '💰', cor: '#22c55e', categoria: 'gestao' },
  { id: 'estoque', label: 'Estoque', icon: '📦', cor: '#f59e0b', categoria: 'gestao' },
  { id: 'leads', label: 'Leads/Clientes', icon: '👥', cor: '#8b5cf6', categoria: 'gestao' },
  { id: 'historico', label: 'Histórico', icon: '📋', cor: '#64748b', categoria: 'gestao' },
  { id: 'tarefa', label: 'Tarefas', icon: '📋', cor: '#14b8a6', categoria: 'gestao' },
  { id: 'notafiscal', label: 'Nota Fiscal', icon: '📄', cor: '#6366f1', categoria: 'gestao' },
  { id: 'retorno', label: 'Retorno', icon: '📅', cor: '#f97316', categoria: 'gestao' },
  { id: 'patrimonio', label: 'Patrimônio', icon: '🏢', cor: '#78716c', categoria: 'gestao' },
  { id: 'fornecedores', label: 'Fornecedores', icon: '🤝', cor: '#0ea5e9', categoria: 'gestao' },
  { id: 'meuplano', label: 'Meu Plano', icon: '💰', cor: '#22c55e', categoria: 'sistema' },
  { id: 'config', label: 'Ajustes', icon: '⚙️', cor: '#64748b', categoria: 'sistema' },
  { id: 'equipe', label: 'Equipe', icon: '👥', cor: '#3b82f6', categoria: 'sistema' },
  { id: 'marketing', label: 'Marketing', icon: '📣', cor: '#f97316', categoria: 'sistema' },
  { id: 'estrategia', label: 'Estratégia', icon: '🚀', cor: '#06b6d4', categoria: 'sistema' },
  { id: 'ajuda', label: 'Ajuda', icon: '❓', cor: '#64748b', categoria: 'sistema' },
];

const CATEGORIAS = [
  { key: 'operacional', label: '⚙️ Serviços e Operações' },
  { key: 'ia', label: '🤖 Inteligência Artificial' },
  { key: 'gestao', label: '📋 Gestão' },
  { key: 'sistema', label: '⚙️ Sistema' },
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
  const usaIA = selecionados.some(id => IA_MODULOS.includes(id));
  const valorIA = isPrime ? 0 : (usaIA ? 100 : 0);
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
          setConfigMaster({
            modulosBase: data.modulosBase || FALLBACK_FIXOS,
            planos: data.planos || {},
          });
        }
      } catch (err) { console.error(err); } finally {
        setCarregandoConfig(false);
      }
    }
    carregar();
  }, []);

  useEffect(() => {
    setSelecionados([...new Set([...modulosBase, ...(dadosOficina?.modulosOperacionais || [])])]);
    if (dadosOficina?.plano) {
      setPlanoSelecionado(dadosOficina.plano);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosOficina?.modulosOperacionais, dadosOficina?.plano, modulosBase]);

  const toggle = (id) => {
    if (modulosBase.includes(id)) return;
    if (limiteAtingido && !selecionados.includes(id)) return;
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const salvarPlano = async (comTrial) => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;
    setSalvando(true);
    try {
      let modsFinais = comTrial
        ? [...modulosBase, ...TODOS_MODULOS.map(m => m.id).filter(id => !modulosBase.includes(id))]
        : [...new Set([...modulosBase, ...selecionados])];
      let modsPerm = comTrial ? 'ALL' : null;
      setSelecionados(modsFinais);
      const payload = {
        modulosOperacionais: modsFinais,
        modulosPermitidos: modsPerm,
        plano: planoSelecionado,
        dataFimTrial: comTrial ? new Date(Date.now() + 10 * DIA_MS) : null,
      };
      await updateDoc(doc(db, 'usuarios', uid), payload, { merge: true });
      if (onModulosChange) onModulosChange(modsFinais);
      setMsgSucesso(comTrial ? '✓ Trial ativado! 10 dias com tudo liberado.' : '✓ Plano atualizado com sucesso!');
      setTimeout(() => setMsgSucesso(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const abrirWhatsApp = () => {
    const oficinaNome = dadosOficina?.nome || 'Oficina';
    const extras = extrasSelecionados;
    const msg = `Olá, Express AI! Gostaria de contratar o plano ${planoSelecionado.toUpperCase()} com ${extras} módulo${extras !== 1 ? 's' : ''} extras.\n\n🏪 Oficina: ${oficinaNome}\n📦 Plano: ${isPrime ? 'PRIME IA' : planoSelecionado.toUpperCase()}\n🔄 Ciclo: ${ciclo.toUpperCase()}\n📂 Extras escolhidos: ${extras}\n💰 Total: R$ ${total.toLocaleString('pt-BR')}${ciclo === 'anual' ? '/ano' : '/mês'}\n\nPode me enviar a chave PIX para liberação?`;
    const numero = planosSistema?.whatsapp || '5534991439845';
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Separa módulos fixos (do Master) para renderizar no topo
  const fixosRender = TODOS_MODULOS.filter(m => modulosBase.includes(m.id));
  // Restante por categoria
  const CATEGORIAS_RENDER = CATEGORIAS.filter(c => c.key !== 'sistema').map(c => ({
    ...c,
    mods: TODOS_MODULOS.filter(m => m.categoria === c.key && !modulosBase.includes(m.id)),
  })).filter(c => c.mods.length > 0);

  const renderCard = (mod) => {
    const cor = mod.cor;
    const isFixo = modulosBase.includes(mod.id);
    const ativo = selecionados.includes(mod.id) || modulosBase.includes(mod.id);
    const bloqueado = !isFixo && limiteAtingido && !ativo;

    return (
      <div
        onClick={() => { if (!isFixo && !bloqueado) toggle(mod.id); }}
        style={{
          background: ativo || isFixo ? `${cor}12` : '#0a0a0a',
          border: `1.5px solid ${ativo || isFixo ? cor : bloqueado ? '#2a0000' : '#1e1e1e'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          cursor: isFixo || bloqueado ? 'default' : 'pointer',
          opacity: bloqueado ? 0.4 : 1,
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
        }}
      >
        <div style={{
          width: '20px', height: '20px', borderRadius: '6px',
          border: `2px solid ${ativo || isFixo ? cor : '#333'}`,
          background: ativo || isFixo ? cor : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {(ativo || isFixo) && <Check size={11} color="white" strokeWidth={3} />}
        </div>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{mod.icon}</span>
        <span style={{
          color: ativo || isFixo ? cor : '#555',
          fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
          flex: 1, lineHeight: '1.2',
        }}>
          {mod.label}
        </span>
        {isFixo ? (
          <span style={{ color: cor, fontSize: '8px', fontWeight: '900', marginLeft: 'auto', flexShrink: 0 }}>FIXO</span>
        ) : (
          <Lock size={10} color={bloqueado ? '#222' : '#333'} style={{ flexShrink: 0, marginLeft: 'auto' }} />
        )}
      </div>
    );
  };

  return (
    <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: `1px solid ${corDestaque}` }}>

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: corDestaque, margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900' }}>💰 Meu Plano</h2>
        <p style={{ color: '#666', fontSize: '12px' }}>Escolha seu plano e os módulos extras que sua oficina oferece</p>
      </div>

      {/* PLANO ATUAL / SELETOR */}
      <div style={{ background: '#111', borderRadius: '14px', border: '1px solid #222', padding: '16px', marginBottom: '20px' }}>
        <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
          Seu plano atual: <span style={{ color: corDestaque }}>{isPrime ? '👑 PRIME IA' : planoSelecionado.toUpperCase()}</span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
          {Object.entries(planosConfig).map(([chave, p]) => {
            const ativo = planoSelecionado === chave;
            const cor = chave === 'planoPrimeIA' ? '#a855f7' : chave === 'master' ? '#D4AF37' : GREEN;
            return (
              <button
                key={chave}
                onClick={() => { setPlanoSelecionado(chave); }}
                style={{
                  background: ativo ? `${cor}15` : '#0a0a0a',
                  border: `1.5px solid ${ativo ? cor : '#222'}`,
                  borderRadius: '12px', padding: '10px 8px',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <p style={{ color: ativo ? cor : '#444', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                  {chave === 'planoPrimeIA' ? '👑 PRIME IA' : chave}
                </p>
                <p style={{ color: ativo ? cor : '#333', fontSize: '14px', fontWeight: '900', margin: 0 }}>
                  R$ {p.preco}<span style={{ fontSize: '9px', color: '#444' }}>/m</span>
                </p>
                <p style={{ color: '#555', fontSize: '8px', margin: '2px 0 0' }}>
                  {p.slots >= 999 ? '∞' : `1-${p.slots} abas`}
                </p>
              </button>
            );
          })}
        </div>

        {/* CICLO */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {['mensal', 'anual'].map(c => (
            <button
              key={c}
              onClick={() => setCiclo(c)}
              style={{
                padding: '8px 20px', borderRadius: '20px', border: 'none',
                background: ciclo === c ? corDestaque : '#1e1e1e',
                color: ciclo === c ? 'white' : '#555',
                fontWeight: '800', fontSize: '11px', textTransform: 'uppercase',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {c.toUpperCase()}
              {c === 'anual' && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: MAIN, color: 'white', fontSize: '8px',
                  padding: '2px 5px', borderRadius: '10px', fontWeight: '900',
                }}>15% OFF</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PAINEL DE MÓDULOS */}
      {/* LISTA DE MÓDULOS */}
      <div style={{ background: '#111', borderRadius: '14px', border: `1px solid #222`, marginBottom: '20px', overflow: 'hidden' }}>
          {/* HEADER */}
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #1e1e1e' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '900', margin: 0 }}>
                  Módulos da Oficina ({selecionados.length})
                </p>
                <p style={{ color: '#555', fontSize: '11px', margin: '2px 0 0' }}>
                  {isUnlimited
                    ? 'Plano sem limite — escolha quantas quiser'
                    : `Escolha até ${planoLimite} módulo${planoLimite !== 1 ? 's' : ''} extra${planoLimite !== 1 ? 's' : ''} (${extrasSelecionados}/${planoLimite})`}
                </p>
              </div>
              {limiteAtingido && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '20px', padding: '4px 12px' }}>
                  <span style={{ color: '#ef4444', fontSize: '10px', fontWeight: '800' }}>Limite atingido</span>
                </div>
              )}
            </div>
          </div>

          {/* CATEGORIAS */}
          <div style={{ padding: '14px 16px' }}>
            {/* MÓDULOS FIXOS (do Master) */}
            {fixosRender.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#555', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
                  🔒 Módulos Inclusos
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {fixosRender.map(mod => <div key={mod.id}>{renderCard(mod)}</div>)}
                </div>
              </div>
            )}

            {/* CATEGORIAS RESTANTES */}
            {CATEGORIAS_RENDER.map(cat => (
              <div key={cat.key} style={{ marginBottom: '16px' }}>
                <p style={{ color: '#555', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
                  {cat.label}
                </p>
                <div>
                  <p style={{ color: '#333', fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    ⭐ Extras {limiteAtingido ? '(limite atingido)' : ''}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cat.mods.map(mod => <div key={mod.id}>{renderCard(mod)}</div>)}
                  </div>
                </div>
              </div>
            ))}

            {/* BOTÕES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {msgSucesso && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: '800' }}>{msgSucesso}</span>
                </div>
              )}
              <button
                onClick={() => salvarPlano(false)}
                disabled={salvando}
                style={{
                  width: '100%', padding: '13px', borderRadius: '12px',
                  background: 'transparent', color: '#555', border: '1px solid #333',
                  fontWeight: '800', fontSize: '11px', textTransform: 'uppercase',
                  cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.5 : 1,
                }}
              >
                {salvando ? 'Salvando...' : '💾 Salvar Configuração'}
              </button>
              <button
                onClick={() => salvarPlano(true)}
                disabled={salvando}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF0033, #ff3366)',
                  color: 'white', border: 'none',
                  fontWeight: '900', fontSize: '13px', textTransform: 'uppercase',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 24px #FF003344', opacity: salvando ? 0.5 : 1,
                }}
              >
                🚀 Testar Tudo + 🧠 IA (10 Dias Grátis)
              </button>
            </div>
          </div>
        </div>

      {/* CAIXA DE TOTAL */}
      <div style={{ background: '#1a1a00', border: `2px dashed ${corDestaque}`, padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
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
