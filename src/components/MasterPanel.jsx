import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  Play, Save, ShieldCheck, DollarSign, Video, Settings,
  LayoutDashboard, FileText, Wrench, Users, Package,
  Calculator, Rocket, MessageCircle, Database
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

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
    'desmanche', 'hibrido_ev', 'veiculo_eletrico', 'contador',
    'fechamento_caixa', 'pagamentos_equipe'
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
  const [abaInterna, setAbaInterna] = useState('viewer'); // 'viewer', 'config', 'videos', 'oficinas' ou 'risco'
  const [dadosRisco, setDadosRisco] = useState([]);
  const [carregandoRisco, setCarregandoRisco] = useState(false);
  const [filtroSeloAtivo, setFiltroSeloAtivo] = useState(false);

  // ==========================================
  // 📊 NOVOS ESTADOS: INTEGRAÇÃO TICKET E MARGEM
  // ==========================================
  const [dadosFinanceiros, setDadosFinanceiros] = useState({});
  const [carregandoFin, setCarregandoFin] = useState(false);
  const [dadosCrescimentoRede, setDadosCrescimentoRede] = useState([]);

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

  const carregarDadosDeRisco = async () => {
    if (oficinas.length === 0) return;
    setCarregandoRisco(true);
    try {
      const promessas = oficinas.map(async (ofi) => {
        try {
          const alvSnap = await getDoc(doc(db, 'oficinas', ofi.id, 'burocracias', 'alvaras'));
          const alvData = alvSnap.exists() ? alvSnap.data() : null;

          const descSnap = await getDocs(collection(db, 'oficinas', ofi.id, 'descartes'));
          const totalDescartes = descSnap.size;

          let temVencido = false;
          let preenchidos = 0;
          const hoje = new Date();

          if (alvData) {
            Object.values(alvData).forEach((val) => {
              if (val && val.dataVencimento) {
                preenchidos++;
                const dv = new Date(val.dataVencimento);
                if (dv < hoje) temVencido = true;
              }
            });
          }

          // VERIFICAÇÕES DO SELO
          // A. Alvará de Funcionamento Válido
          let alvaraValido = false;
          if (alvData?.funcionamento?.dataVencimento) {
            alvaraValido = new Date(alvData.funcionamento.dataVencimento + 'T00:00:00') >= hoje;
          }

          // B. Óleo nos últimos 90 dias
          const noventaDiasAtras = new Date();
          noventaDiasAtras.setDate(hoje.getDate() - 90);
          const temOleoRecente = descSnap.docs.some(doc => {
            const d = doc.data();
            return d.tipoResiduo === 'Óleo Lubrificante' && d.dataColeta && new Date(d.dataColeta + 'T00:00:00') >= noventaDiasAtras;
          });

          // C. Caixa SAO nos últimos 120 dias
          const centoEVinteDiasAtras = new Date();
          centoEVinteDiasAtras.setDate(hoje.getDate() - 120);
          const saoSnap = await getDoc(doc(db, 'oficinas', ofi.id, 'burocracias', 'checklist'));
          const saoData = saoSnap.exists() ? saoSnap.data() : null;
          const saoEmDia = saoData && saoData.saoUltimaLimpeza && new Date(saoData.saoUltimaLimpeza + 'T00:00:00') >= centoEVinteDiasAtras;

          const temSelo = alvaraValido && temOleoRecente && saoEmDia;

          return {
            id: ofi.id,
            nome: ofi.nomeOficina || 'Sem Nome',
            telefone: ofi.telefone || '',
            totalDescartes,
            temVencido,
            preenchidos,
            temSelo,
            alvaras: alvData
          };
        } catch (err) {
          return { id: ofi.id, nome: ofi.nomeOficina || 'Sem Nome', erro: true };
        }
      });

      const res = await Promise.all(promessas);
      setDadosRisco(res.filter((r) => !r.erro));
    } catch (e) {
      console.error('Erro ao buscar riscos:', e);
    } finally {
      setCarregandoRisco(false);
    }
  };

  const carregarMetricasFinanceiras = async () => {
    if (oficinas.length === 0) return;
    setCarregandoFin(true);
    try {
      const results = {};
      const faturamentosMensais = [];

      await Promise.all(oficinas.map(async (ofi) => {
        try {
          const snap = await getDocs(collection(db, 'oficinas', ofi.id, 'os'));
          let totalOS = 0;
          let countValidos = 0;
          let somaMargem = 0;
          let countMargem = 0;

          const meuFaturamentoMensal = {};

          snap.docs.forEach(d => {
            const data = d.data();
            const total = Number(data.total) || 0;
            
            // Agrupamento mensal para Gráfico de Crescimento de Rede
            const ts = data.data_registro?.toDate ? data.data_registro.toDate() : new Date(data.data_registro || data.data);
            if (ts instanceof Date && !isNaN(ts.getTime())) {
               const chaveMes = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
               meuFaturamentoMensal[chaveMes] = (meuFaturamentoMensal[chaveMes] || 0) + total;
            }

            if (total > 0) {
              totalOS += total;
              countValidos++;
            }
            // Margem real que agora salvamos via Assistente de Lucro Real
            const margem = Number(data.margemLucro);
            if (margem !== undefined && !isNaN(margem) && margem !== 0) {
              somaMargem += margem;
              countMargem++;
            }
          });

          faturamentosMensais.push(meuFaturamentoMensal);

          results[ofi.id] = {
            ticketMedio: countValidos > 0 ? totalOS / countValidos : 0,
            margemMedia: countMargem > 0 ? somaMargem / countMargem : 0,
            totalOS: snap.size
          };
        } catch (e) {
          console.error(`Erro ao carregar métricas de ${ofi.id}:`, e);
          results[ofi.id] = { ticketMedio: 0, margemMedia: 0, totalOS: 0 };
        }
      }));

      // Consolidação do faturamento de rede global por mês
      const consolidado = {};
      faturamentosMensais.forEach(mapa => {
         Object.keys(mapa).forEach(chave => {
            consolidado[chave] = (consolidado[chave] || 0) + mapa[chave];
         });
      });

      // Ordenar meses e formatar para Recharts
      const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const listaOrdenada = Object.keys(consolidado)
         .sort()
         .map(chave => {
            const [ano, mes] = chave.split('-');
            return {
               mesLabel: `${nomesMeses[parseInt(mes) - 1]}/${ano.slice(-2)}`,
               chave,
               faturamento: consolidado[chave]
            };
         })
         .slice(-12); // Último ano de atividade da rede

      setDadosCrescimentoRede(listaOrdenada);
      setDadosFinanceiros(results);
    } catch (err) {
      console.error("Erro agregando financeiro global:", err);
    } finally {
      setCarregandoFin(false);
    }
  };

  useEffect(() => {
    if (abaInterna === 'risco' && dadosRisco.length === 0) {
      carregarDadosDeRisco();
    }
    if (abaInterna === 'oficinas' && Object.keys(dadosFinanceiros).length === 0) {
      carregarMetricasFinanceiras();
    }
  }, [abaInterna, oficinas]);

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
          <button onClick={() => setAbaInterna('risco')} style={{ padding: '10px 20px', background: abaInterna === 'risco' ? '#10B981' : '#111', color: abaInterna === 'risco' ? 'black' : '#888', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}>🛡️ Risco & Conformidade</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: MASTER_COLOR, fontSize: '18px', margin: 0 }}>🏢 Oficinas Cadastradas ({oficinas.length})</h2>
              <button 
                onClick={carregarMetricasFinanceiras}
                disabled={carregandoFin}
                style={{ padding: '8px 15px', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#aaa', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
              >
                {carregandoFin ? '🔄 CALCULANDO...' : '🔄 REATUALIZAR MÉTRICAS'}
              </button>
            </div>

            {/* ── GRÁFICO: CRESCIMENTO DA REDE GERAL (IMPACTO OFICINA IA) ────────────── */}
            {dadosCrescimentoRede.length > 0 && (
              <div style={{
                background: '#111',
                border: '1px solid #222',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, color: MASTER_COLOR, fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                      🚀 Impacto de Mercado Real
                    </p>
                    <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 'bold', color: 'white' }}>
                      Crescimento e Faturamento Total da Rede (R$)
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E676', background: 'rgba(0,230,118,0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.2)', fontSize: '11px', fontWeight: '900' }}>
                    💰 Total Consolidado: {
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(
                        dadosCrescimentoRede.reduce((acc, val) => acc + val.faturamento, 0)
                      )
                    }
                  </div>
                </div>

                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={dadosCrescimentoRede} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="corFaturamento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="mesLabel" stroke="#555" fontSize={10} tickLine={false} />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(v)}`} />
                      <RechartsTooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        formatter={(v) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v), 'Faturamento']}
                      />
                      <Area type="monotone" dataKey="faturamento" stroke="#00E676" strokeWidth={2} fillOpacity={1} fill="url(#corFaturamento)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '12px' }}>
              {oficinas.map(oficina => {
                const fin = dadosFinanceiros[oficina.id] || { ticketMedio: 0, margemMedia: 0, totalOS: 0 };
                const precisaTreinamento = fin.margemMedia > 0 && fin.margemMedia < 15;
                const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

                return (
                  <div key={oficina.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '20px', borderRadius: '16px', border: '1px solid #222', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ minWidth: '200px', flex: '1 1 0' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'white' }}>{oficina.nomeOficina || 'Sem Nome'}</span>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        ID: {oficina.id} | Plano: <span style={{ color: MASTER_COLOR, fontWeight: 'bold' }}>{oficina.plano || 'TRIAL'}</span>
                      </div>
                    </div>

                    {/* INDICADORES DE DESEMPENHO FINANCEIRO */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '2 1 0', alignItems: 'center' }}>
                      {carregandoFin ? (
                        <span style={{ color: '#444', fontSize: '12px', fontStyle: 'italic' }}>Analisando base fiscal...</span>
                      ) : (
                        <>
                          <div style={{ background: '#0a0a0a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #222', minWidth: '120px' }}>
                            <p style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Ticket Médio</p>
                            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '2px 0 0' }}>{formatarMoeda(fin.ticketMedio)}</p>
                          </div>
                          <div style={{ background: '#0a0a0a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #222', minWidth: '110px' }}>
                            <p style={{ fontSize: '9px', color: '#555', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Margem Média</p>
                            <p style={{ fontSize: '13px', fontWeight: '900', color: fin.margemMedia >= 15 ? '#00E676' : fin.margemMedia > 0 ? '#F59E0B' : '#555', margin: '2px 0 0' }}>
                              {fin.margemMedia > 0 ? `${fin.margemMedia.toFixed(1)}%` : 'Sem Histórico'}
                            </p>
                          </div>
                          {precisaTreinamento && (
                            <div title="Oficina com margem de lucro crítica na precificação real" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              <Calculator size={12} /> 🎓 Oferecer Treinamento Precificação
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <a
                        href={`https://wa.me/${oficina.telefone || ''}?text=Olá!%20Seja%20bem-vindo(a)%20à%20equipe%20da%20nossa%20oficina.%20Aqui%20está%20o%20seu%20link%20de%20acesso%20ao%20sistema:%20${window.location.origin}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                          background: '#25D36622',
                          color: '#25D366',
                          border: '1px solid #25D366',
                          textDecoration: 'none',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        WHATSAPP
                      </a>
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO: DASHBOARD DE RISCO E CONFORMIDADE */}
      {abaInterna === 'risco' && (
        <div className="fade-in">
          <div style={{ background: '#0a0a0a', border: '1px solid #10B98144', borderRadius: '16px', padding: '25px', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ color: '#10B981', fontSize: '20px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={24} /> Dashboard de Risco Legal & Ecológico
                </h2>
                <p style={{ color: '#666', fontSize: '13px', margin: '5px 0 0' }}>
                  Monitore em tempo real quais oficinas estão sob risco jurídico imediato (alvarás vencidos) ou ecológico (sem descartes).
                </p>
              </div>
              <button 
                onClick={carregarDadosDeRisco}
                disabled={carregandoRisco}
                style={{ background: '#10B98122', color: '#10B981', border: '1px solid #10B981', borderRadius: '8px', padding: '10px 15px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {carregandoRisco ? 'CARREGANDO...' : '🔄 RECARREGAR LISTA'}
              </button>
            </div>

            {carregandoRisco ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#10B981', fontWeight: 'bold' }}>
                <div style={{ width: '30px', height: '30px', border: '3px solid #10B981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
                ANALISANDO SITUAÇÃO DE TODAS AS OFICINAS...
              </div>
            ) : (
              <>
                {/* GRIDS DE MÉTRICAS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}>Total de Oficinas</span>
                    <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '5px 0 0', color: 'white' }}>{dadosRisco.length}</h3>
                  </div>

                  <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #10B98144', borderColor: '#10B98166' }}>
                    <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 'bold', textTransform: 'uppercase' }}>🏅 Selo Ativo (Blindada)</span>
                    <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '5px 0 0', color: '#10B981', textShadow: '0 0 15px rgba(16,185,129,0.3)' }}>
                      {dadosRisco.filter(r => r.temSelo).length}
                    </h3>
                  </div>

                  <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #ef444455' }}>
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>Risco Elevado (Vencido)</span>
                    <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '5px 0 0', color: '#ef4444' }}>
                      {dadosRisco.filter(r => r.temVencido).length}
                    </h3>
                  </div>

                  <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #f59e0b55' }}>
                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase' }}>Sem Descarte Ecológico</span>
                    <h3 style={{ fontSize: '28px', fontWeight: '900', margin: '5px 0 0', color: '#f59e0b' }}>
                      {dadosRisco.filter(r => r.totalDescartes === 0).length}
                    </h3>
                  </div>
                </div>

                {/* FILTRO REATIVO SELO */}
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#111', padding: '10px 15px', borderRadius: '8px', border: '1px solid #222', cursor: 'pointer', fontSize: '13px', color: filtroSeloAtivo ? '#10B981' : '#666', fontWeight: 'bold', transition: '0.2s', borderColor: filtroSeloAtivo ? '#10B98155' : '#222' }}>
                    <input 
                      type="checkbox" 
                      checked={filtroSeloAtivo} 
                      onChange={(e) => setFiltroSeloAtivo(e.target.checked)} 
                      style={{ cursor: 'pointer' }}
                    />
                    🏅 VER APENAS OFICINAS COM SELO ATIVO
                  </label>
                </div>

                {/* TABELA DETALHADA */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #222', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#111', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'left' }}>
                        <th style={{ padding: '15px' }}>Oficina</th>
                        <th style={{ padding: '15px' }}>Alvarás Documentados</th>
                        <th style={{ padding: '15px' }}>Situação Jurídica</th>
                        <th style={{ padding: '15px' }}>Histórico Descartes</th>
                        <th style={{ padding: '15px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dadosRisco
                        .filter(ofi => filtroSeloAtivo ? ofi.temSelo : true)
                        .map((ofi) => {
                        const waMsg = `Olá!%20Identificamos%20pelo%20sistema%20que%20a%20sua%20oficina%20pode%20estar%20com%20algum%20documento%20vencido%20ou%20pendente%20na%20aba%20Burocracias.%20Podemos%20te%20auxiliar%20a%20regularizar%20para%20evitar%20multas?`;
                        return (
                          <tr key={ofi.id} style={{ borderBottom: '1px solid #222', color: '#ccc' }}>
                            <td style={{ padding: '15px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {ofi.nome}
                              {ofi.temSelo && (
                                <span style={{ color: '#10B981', background: '#10B98122', border: '1px solid #10B981', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 'black' }}>🏅 SELO ATIVO</span>
                              )}
                            </td>
                            <td style={{ padding: '15px' }}>{ofi.preenchidos} preenchido(s)</td>
                            <td style={{ padding: '15px' }}>
                              {ofi.temVencido ? (
                                <span style={{ color: '#ef4444', background: '#ef444422', border: '1px solid #ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🔴 VENCIDO / RISCO</span>
                              ) : ofi.preenchidos > 0 ? (
                                <span style={{ color: '#10b981', background: '#10b98122', border: '1px solid #10b981', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>🟢 EM DIA</span>
                              ) : (
                                <span style={{ color: '#666', background: '#222', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>⚪ INCOMPLETO</span>
                              )}
                            </td>
                            <td style={{ padding: '15px' }}>
                              {ofi.totalDescartes === 0 ? (
                                <span style={{ color: '#f59e0b' }}>Nenhum descarte ⚠️</span>
                              ) : (
                                <span style={{ color: '#10b981' }}>{ofi.totalDescartes} coleta(s) registrada(s) 🌱</span>
                              )}
                            </td>
                            <td style={{ padding: '15px' }}>
                              <a
                                href={`https://wa.me/${ofi.telefone}?text=${waMsg}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ background: '#25D36622', color: '#25D366', border: '1px solid #25D366', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}
                              >
                                📞 COBRAR REGULARIZAÇÃO
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
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