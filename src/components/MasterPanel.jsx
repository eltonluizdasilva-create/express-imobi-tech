import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  Play, Save, ShieldCheck, DollarSign, Video, Settings,
  LayoutDashboard, FileText, Wrench, Users, Package,
  Calculator, Rocket, MessageCircle, Database
} from 'lucide-react';

const MASTER_COLOR = '#D4AF37'; // Dourado Master
const GREEN_MONEY = '#00E676';

const NOMES_PLANOS = {
  essencial: 'Essencial (1 Aba)',
  profissional: 'Profissional (Até 3 Abas)',
  especialista: 'Especialista (Até 5 Abas)',
  master: 'Master (6+ Abas)'
};

const IA_IDS = [
  { id: 'contador', label: 'Assistente Fiscal' },
  { id: 'copiloto', label: 'Copiloto IA' },
  { id: 'secretaria', label: 'Secretária IA' },
  { id: 'administrador', label: 'Administrador IA' },
  { id: 'mercadolivre', label: 'Compras' },
  { id: 'retorno', label: 'Retorno' },
  { id: 'estrategia', label: 'Estratégia' },
  { id: 'precificacao', label: 'Precificação' },
];

const DEFAULT_PLANOS = {
  mensal: {},
  anual: {},
  combos: {
    essencial: 99,
    profissional: 149,
    especialista: 249,
    master: 449
  },
  precosIA: {
    contador: 49,
    copiloto: 49,
    secretaria: 49,
    administrador: 49,
    mercadolivre: 49,
    retorno: 49,
    estrategia: 49,
    precificacao: 49
  },
  premiumMods: [
    'clientes', 'estoque', 'retorno', 'pneus', 'copiloto',
    'desmanche', 'hibrido_ev', 'veiculo_eletrico', 'contador'
  ],
  whatsapp: "5534991439845",
  descricaoBase: "Abertura de O.S. Geral e Controle Financeiro."
};

export default function MasterPanel({ setPlanosGlobais }) {
  const [oficinas, setOficinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState(DEFAULT_PLANOS);
  const [salvandoPlanos, setSalvandoPlanos] = useState(false);
  const [videosAjuda, setVideosAjuda] = useState({});
  const [salvandoVideos, setSalvandoVideos] = useState(false);
  const [abaInterna, setAbaInterna] = useState('viewer'); // 'viewer', 'config', 'videos' ou 'oficinas'

  // Lista de 28 Categorias para o Gerenciamento de Vídeos
  const ABAS_VIDEOS = [
    { key: 'visao_geral', label: '📊 Visão Geral', grupo: 'Gestão' },
    { key: 'os', label: '🔧 O.S. (Ordem de Serviço)', grupo: 'Operacional' },
    { key: 'ajustes', label: '⚙️ Ajustes/Config', grupo: 'Gestão' },
    { key: 'mecanica', label: '🔧 Mecânica', grupo: 'Técnico' },
    { key: 'hibrido_ev', label: '🔋 Híbridos', grupo: 'Técnico' },
    { key: 'veiculo_eletrico', label: '🔌 100% Elétricos', grupo: 'Técnico' },
    { key: 'motos', label: '🏍️ Motos', grupo: 'Técnico' },
    { key: 'lataria', label: '🚗 Funilaria/Lataria', grupo: 'Técnico' },
    { key: 'amortecedor', label: '🧰 Amortecedor', grupo: 'Técnico' },
    { key: 'injecao', label: '🛠️ Injeção', grupo: 'Técnico' },
    { key: 'eletrica', label: '⚡ Elétrica', grupo: 'Técnico' },
    { key: 'alinhamento', label: '⚙️ Alinhamento/Geometria', grupo: 'Técnico' },
    { key: 'oleo', label: '🛢️ Óleo/Transmissão', grupo: 'Técnico' },
    { key: 'revisao', label: '🛡️ Revisão Preventiva', grupo: 'Técnico' },
    { key: 'ar_condicionado', label: '❄️ Ar-Condicionado', grupo: 'Técnico' },
    { key: 'pneus', label: '🛞 Pneus/Borracharia', grupo: 'Técnico' },
    { key: 'desmanche', label: '🚗 Desmanche', grupo: 'Gestão' },
    { key: 'escapamento', label: '🪛 Escapamento', grupo: 'Técnico' },
    { key: 'lavajato', label: '🚿 Lava Jato', grupo: 'Técnico' },
    { key: 'estetica', label: '✨ Estética Automotiva', grupo: 'Técnico' },
    { key: 'copiloto', label: '🤖 Copiloto IA', grupo: 'Inteligência' },
    { key: 'secretaria', label: '👩‍💼 Secretária IA', grupo: 'Inteligência' },
    { key: 'administrador', label: '👔 Administrador IA', grupo: 'Inteligência' },
    { key: 'contador', label: '🧾 Assistente Fiscal', grupo: 'Gestão' }, // Mudança de marca aqui
    { key: 'mercadolivre', label: '📦 Compras (ML)', grupo: 'Gestão' },
    { key: 'financeiro', label: '💰 Financeiro', grupo: 'Gestão' },
    { key: 'clientes', label: '👥 Clientes/Leads', grupo: 'Gestão' },
    { key: 'marketing', label: '📣 Marketing', grupo: 'Gestão' },
    { key: 'precificacao', label: '📊 Precificação', grupo: 'Inteligência' },
    { key: 'retorno', label: '📅 Retorno', grupo: 'Inteligência' },
    { key: 'estoque', label: '📦 Estoque', grupo: 'Gestão' },
    { key: 'tarefa', label: '✅ Tarefa', grupo: 'Gestão' },
    { key: 'notafiscal', label: '📄 Nota Fiscal', grupo: 'Gestão' },
    { key: 'patrimonio', label: '🏗️ Patrimônio', grupo: 'Gestão' },
    { key: 'fornecedores', label: '🚚 Fornecedores', grupo: 'Gestão' },
    { key: 'historico', label: '📋 Histórico', grupo: 'Gestão' },
    { key: 'estrategia', label: '🚀 Estratégia', grupo: 'Gestão' },
    { key: 'portal_cliente', label: '📱 Portal do Cliente', grupo: 'Gestão' },
  ];

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const s = await getDocs(collection(db, 'oficinas'));
        setOficinas(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(o => o.id !== 'MASTER'));

        const snap = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'planos'));
        const snapMaster = await getDoc(doc(db, 'configuracoes_admin', 'master'));

        let dadosCarregados = {};
        if (snap.exists()) dadosCarregados = snap.data();
        if (snapMaster.exists()) dadosCarregados = { ...dadosCarregados, ...snapMaster.data() };

        if (snap.exists() || snapMaster.exists()) {
          // Sincronizar combos: Garantir que apenas as 4 chaves solicitadas existam no estado
          const novosCombos = {};
          ['essencial', 'profissional', 'especialista', 'master'].forEach(key => {
            novosCombos[key] = dadosCarregados.combos?.[key] || dadosCarregados.planos?.[key] || DEFAULT_PLANOS.combos[key];
          });

          const novosPrecosIA = { ...DEFAULT_PLANOS.precosIA, ...(dadosCarregados.precosIA || {}) };

          setPlanos(prev => ({ ...prev, ...dadosCarregados, combos: novosCombos, precosIA: novosPrecosIA }));
        }

        const snapVideos = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'videos_ajuda'));
        if (snapVideos.exists()) setVideosAjuda(snapVideos.data());
      } catch (e) {
        console.error("Erro MasterPanel:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, []);

  const salvarPlanos = async () => {
    setSalvandoPlanos(true);
    try {
      // Salva no local antigo para retrocompatibilidade
      await setDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'planos'), planos, { merge: true });

      // Salva no novo local esperado pelo ecrã do cliente
      const payloadMaster = {
        planos: planos.combos,
        precosIA: planos.precosIA,
        modulosBase: ['clientes', 'dashboard', 'financeiro'], // Padrão solicitado
        whatsapp: planos.whatsapp || "5534991439845"
      };
      await setDoc(doc(db, 'configuracoes_admin', 'master'), payloadMaster, { merge: true });

      if (setPlanosGlobais) setPlanosGlobais(planos);
      alert('✅ Configurações de Planos salvas com sucesso!');
    } catch (e) {
      alert('Erro ao salvar planos: ' + e.message);
    } finally {
      setSalvandoPlanos(false);
    }
  };

  const salvarVideos = async () => {
    setSalvandoVideos(true);
    try {
      await setDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'videos_ajuda'), videosAjuda, { merge: true });
      alert('✅ Biblioteca de Vídeos atualizada para todos os usuários!');
    } catch (e) {
      alert('Erro ao salvar vídeos: ' + e.message);
    } finally {
      setSalvandoVideos(false);
    }
  };

  const toggleStatusOficina = async (oficina) => {
    const novoStatus = !oficina.ativo;
    try {
      await updateDoc(doc(db, 'oficinas', oficina.id), { ativo: novoStatus });
      setOficinas(prev => prev.map(o => o.id === oficina.id ? { ...o, ativo: novoStatus } : o));
    } catch (e) {
      alert('Erro ao mudar status: ' + e.message);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: MASTER_COLOR }}>
      <Database size={32} className="animate-spin" />
      <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>CARREGANDO DADOS MASTER...</span>
    </div>
  );

  return (
    <div style={{ padding: '20px', background: '#000', minHeight: '100vh', color: 'white' }}>

      {/* HEADER MASTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `1px solid ${MASTER_COLOR}33`, paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: MASTER_COLOR, fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={32} /> PAINEL MASTER
          </h1>
          <p style={{ margin: '5px 0 0', color: '#888', fontSize: '14px' }}>Gerenciamento Global da Plataforma Express Auto Tech</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          <button onClick={() => setAbaInterna('viewer')} style={{ padding: '10px 20px', background: abaInterna === 'viewer' ? MASTER_COLOR : '#111', color: abaInterna === 'viewer' ? 'black' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>🎓 Treinamento</button>
          <button onClick={() => setAbaInterna('config')} style={{ padding: '10px 20px', background: abaInterna === 'config' ? MASTER_COLOR : '#111', color: abaInterna === 'config' ? 'black' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>⚙️ Planos</button>
          <button onClick={() => setAbaInterna('videos')} style={{ padding: '10px 20px', background: abaInterna === 'videos' ? MASTER_COLOR : '#111', color: abaInterna === 'videos' ? 'black' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>🎬 Editar Vídeos</button>
          <button onClick={() => setAbaInterna('oficinas')} style={{ padding: '10px 20px', background: abaInterna === 'oficinas' ? MASTER_COLOR : '#111', color: abaInterna === 'oficinas' ? 'black' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>🏢 Oficinas</button>
        </div>
      </div>

      {/* CONTEÚDO: TREINAMENTO MASTER (VIEWER) */}
      {abaInterna === 'viewer' && (
        <div className="fade-in">
          <div style={{
            background: 'linear-gradient(145deg, #111 0%, #000 100%)',
            borderRadius: '24px',
            border: `1px solid ${MASTER_COLOR}22`,
            padding: '40px',
            marginBottom: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: `${MASTER_COLOR}11`, filter: 'blur(80px)', borderRadius: '50%' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '40px' }}>
              <div style={{ width: '80px', height: '80px', background: MASTER_COLOR, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${MASTER_COLOR}44` }}>
                <Play size={40} color="black" fill="black" />
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>DOMINANDO O Express Auto Tech</h1>
                <p style={{ margin: '5px 0 0', color: '#888', fontSize: '16px' }}>Área de Treinamento Master: Domine todas as ferramentas do sistema</p>
              </div>
              <a
                href={videosAjuda['visao_geral'] || '#'}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#ff3131',
                  color: 'white',
                  padding: '12px 25px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '900',
                  fontSize: '14px',
                  boxShadow: '0 10px 20px rgba(255,49,49,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Rocket size={18} /> AULA PRINCIPAL
              </a>
            </div>

            {/* BIBLIOTECA DE VÍDEOS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
              <Video size={20} color={MASTER_COLOR} />
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Biblioteca de Vídeos e Resumos</h2>
            </div>

            {/* Grid de Vídeos por Grupo */}
            {['Operacional', 'Técnico', 'Gestão', 'Inteligência'].map((grupo, idx) => (
              <div key={grupo} style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '4px', height: '20px', background: '#ff3131', borderRadius: '2px' }} />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>{idx + 1}. {grupo}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
                  {ABAS_VIDEOS.filter(v => v.grupo === grupo).map(video => (
                    <div key={video.key} style={{
                      background: '#0a0a0a',
                      padding: '20px',
                      borderRadius: '16px',
                      border: '1px solid #1a1a1a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '15px',
                      transition: '0.3s',
                      cursor: 'default',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = video.grupo === 'Inteligência' ? '#06b6d444' : `${MASTER_COLOR}44`;
                        e.currentTarget.style.background = '#111';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1a1a1a';
                        e.currentTarget.style.background = '#0a0a0a';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: video.grupo === 'Inteligência' ? '#06b6d4' : '#ff3131'
                        }}>
                          {video.key === 'copiloto' || video.key === 'secretaria' ? <Rocket size={20} /> : <Wrench size={20} />}
                        </div>
                        <a
                          href={videosAjuda[video.key] || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: videosAjuda[video.key] ? `${MASTER_COLOR}22` : '#222',
                            color: videosAjuda[video.key] ? MASTER_COLOR : '#555',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            pointerEvents: videosAjuda[video.key] ? 'auto' : 'none'
                          }}
                        >
                          <Play size={14} fill="currentColor" /> {videosAjuda[video.key] ? 'ASSISTIR AULA' : 'EM BREVE'}
                        </a>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase' }}>{video.label}</h4>
                        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '12px', lineHeight: '1.4' }}>
                          {video.key === 'mecanica' ? 'Lançamentos específicos para motor e suspensão.' :
                            video.key === 'os' ? 'Domine o fluxo completo de abertura e fechamento de O.S.' :
                              video.key === 'financeiro' ? 'Controle de fluxo de caixa e relatórios de lucratividade.' :
                                video.key === 'precificacao' ? 'Cálculo inteligente de margem e lucro por serviço.' :
                                  video.key === 'retorno' ? 'Fidelização automática de clientes com avisos de revisão.' :
                                    video.key === 'estoque' ? 'Gestão de peças, insumos e avisos de reposição.' :
                                      video.key === 'tarefa' ? 'Produtividade da equipe e monitoramento de atividades.' :
                                        video.key === 'notafiscal' ? 'Emissão simplificada de notas de serviço e produtos.' :
                                          video.key === 'patrimonio' ? 'Controle de ativos, ferramentas e depreciação.' :
                                            video.key === 'fornecedores' ? 'Histórico de compras e cotações com fornecedores.' :
                                              video.key === 'historico' ? 'Auditoria completa de todas as ações no sistema.' :
                                                'Aprenda a utilizar este módulo para maximizar os resultados da oficina.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO: CONFIGURAÇÃO DE PLANOS */}
      {abaInterna === 'config' && (
        <div className="fade-in">
          <div style={{ background: '#0a0a0a', border: `1px solid ${MASTER_COLOR}44`, borderRadius: '16px', padding: '25px', marginBottom: '30px' }}>
            <h2 style={{ color: MASTER_COLOR, fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign size={20} /> Valores e Assinaturas
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {Object.entries(planos.combos).map(([key, value]) => (
                <div key={key} style={{ background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #222' }}>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>{NOMES_PLANOS[key] || key}</label>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ color: GREEN_MONEY, fontWeight: 'bold', marginRight: '5px' }}>R$</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setPlanos({ ...planos, combos: { ...planos.combos, [key]: Number(e.target.value) } })}
                      style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', fontWeight: 'bold', width: '100%', outline: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '15px', borderTop: '1px solid #222', paddingTop: '20px' }}>🛠️ Módulos Premium (Gastam Cota de Plano)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {ABAS_VIDEOS.map(mod => {
                const isPremium = planos.premiumMods.includes(mod.key);
                return (
                  <div
                    key={mod.key}
                    onClick={() => {
                      const newMods = isPremium
                        ? planos.premiumMods.filter(id => id !== mod.key)
                        : [...planos.premiumMods, mod.key];
                      setPlanos({ ...planos, premiumMods: newMods });
                    }}
                    style={{
                      padding: '10px', borderRadius: '8px', border: `1px solid ${isPremium ? MASTER_COLOR : '#222'}`,
                      background: isPremium ? `${MASTER_COLOR}11` : '#0a0a0a', cursor: 'pointer', transition: '0.2s',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '12px', color: isPremium ? 'white' : '#666' }}>{mod.label}</span>
                    {isPremium && <ShieldCheck size={14} color={MASTER_COLOR} />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={salvarPlanos}
              disabled={salvandoPlanos}
              style={{ width: '100%', marginTop: '30px', padding: '15px', background: MASTER_COLOR, color: 'black', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}
            >
              {salvandoPlanos ? 'SALVANDO...' : 'ATUALIZAR CONFIGURAÇÕES GLOBAIS'}
            </button>

            {/* SEÇÃO DE PREÇOS IA */}
            <div style={{ marginTop: '40px', padding: '25px', background: '#0f0f0f', border: `1px solid ${MASTER_COLOR}`, borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '24px' }}>🧠</span>
                <h3 style={{ color: MASTER_COLOR, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>
                  Preços Individuais de Inteligência Artificial
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {IA_IDS.map((ia) => (
                  <div key={ia.id} style={{ background: '#131313', padding: '15px', borderRadius: '12px', border: '1px solid #222' }}>
                    <label style={{ display: 'block', color: '#666', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {ia.label}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: GREEN_MONEY, fontWeight: 'bold' }}>R$</span>
                      <input
                        type="number"
                        value={planos.precosIA?.[ia.id] || 0}
                        onChange={(e) => {
                          const novoPreco = parseFloat(e.target.value);
                          setPlanos(prev => ({
                            ...prev,
                            precosIA: {
                              ...prev.precosIA,
                              [ia.id]: novoPreco
                            }
                          }));
                        }}
                        style={{ width: '100%', background: 'black', border: '1px solid #333', color: 'white', padding: '8px', borderRadius: '6px', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: '15px', fontSize: '11px', color: '#444' }}>
                * Estes valores serão somados ao plano base sempre que o cliente selecionar o módulo de IA correspondente no ecrã "Meu Plano".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: GERENCIAMENTO DE VÍDEOS */}
      {abaInterna === 'videos' && (
        <div className="fade-in">
          <div style={{ background: '#0a0a0a', border: `1px solid ${MASTER_COLOR}44`, borderRadius: '16px', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
              <div>
                <h2 style={{ color: MASTER_COLOR, fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Video size={20} /> Gestão da Biblioteca
                </h2>
                <p style={{ color: '#666', fontSize: '12px', margin: '5px 0 0' }}>Insira os links do YouTube para cada módulo do sistema.</p>
              </div>
              <button
                onClick={salvarVideos}
                disabled={salvandoVideos}
                style={{ padding: '12px 25px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: `0 0 20px ${GREEN_MONEY}33` }}
              >
                <Save size={18} /> {salvandoVideos ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '15px' }}>
              {ABAS_VIDEOS.map((aba) => (
                <div key={aba.key} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: '#111',
                  padding: '15px',
                  borderRadius: '12px',
                  border: '1px solid #222',
                  transition: '0.2s'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: MASTER_COLOR, fontWeight: 'bold', textTransform: 'uppercase', display: 'block', letterSpacing: '1px' }}>{aba.grupo}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'white' }}>{aba.label}</span>
                    </div>
                    {videosAjuda[aba.key] && (
                      <a href={videosAjuda[aba.key]} target="_blank" rel="noreferrer" style={{ color: MASTER_COLOR, background: `${MASTER_COLOR}11`, padding: '5px', borderRadius: '6px' }}>
                        <Play size={16} fill="currentColor" />
                      </a>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videosAjuda[aba.key] || ''}
                      onChange={(e) => setVideosAjuda({ ...videosAjuda, [aba.key]: e.target.value })}
                      style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#00E676', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', outline: 'none', transition: '0.2s' }}
                      onFocus={(e) => e.target.style.borderColor = MASTER_COLOR}
                      onBlur={(e) => e.target.style.borderColor = '#222'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: LISTA DE OFICINAS */}
      {abaInterna === 'oficinas' && (
        <div className="fade-in">
          <div style={{ background: '#0a0a0a', border: `1px solid ${MASTER_COLOR}44`, borderRadius: '16px', padding: '25px' }}>
            <h2 style={{ color: MASTER_COLOR, fontSize: '18px', marginBottom: '20px' }}>🏢 Oficinas Cadastradas ({oficinas.length})</h2>

            <div style={{ display: 'grid', gap: '10px' }}>
              {oficinas.map(oficina => (
                <div key={oficina.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '12px', border: '1px solid #222' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{oficina.nomeOficina || 'Sem Nome'}</span>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      ID: {oficina.id} | Plano: <span style={{ color: MASTER_COLOR }}>{oficina.plano || 'TRIAL'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => toggleStatusOficina(oficina)}
                      style={{
                        padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                        background: oficina.ativo ? '#ff313122' : '#00E67622',
                        color: oficina.ativo ? '#ff3131' : '#00E676',
                        border: `1px solid ${oficina.ativo ? '#ff3131' : '#00E676'}`
                      }}
                    >
                      {oficina.ativo ? 'BLOQUEAR' : 'ATIVAR'}
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      )}

      {/* A tag style precisa ficar DENTRO da sua div principal, antes de fechar o return */}
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}