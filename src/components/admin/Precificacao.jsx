import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Calculator, DollarSign, Save, TrendingUp, Clock, MessageCircle, FileText, Zap, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

export default function Precificacao({ oficinaId: oficinaIdProp, config, t, verificarLicenca }) {
  const oficinaId = oficinaIdProp;

  // ========== DADOS DE CUSTOS (EXISTENTE) ==========
  const [custos, setCustos] = useState({
    aluguel: '',
    luzAguaNet: '',
    folhaPagamento: '',
    outrosCustos: '',
    horasTrabalhadas: '160'
  });

  // ========== DADOS DE SERVIÇO EXPANDIDO ==========
  const [servico, setServico] = useState({
    nomeServico: '',
    custoPeca: '',
    margemPeca: '30',
    tempoExecucao: '1',
    taxaImposto: '0'
  });

  // ========== SUGESTÕES INTELIGENTES ==========
  const [servicosSugeridos, setServicaosSugeridos] = useState([
    { id: 'troca-oleo', nome: 'Troca de Óleo', icon: '🛢️', tempo_medio: 1.5, custo_peca_medio: 45, preco_medio: 120 },
    { id: 'troca-filtro', nome: 'Troca de Filtro de Ar', icon: '🌬️', tempo_medio: 0.5, custo_peca_medio: 35, preco_medio: 85 },
    { id: 'balanceamento', nome: 'Balanceamento de Roda', icon: '⚖️', tempo_medio: 1, custo_peca_medio: 0, preco_medio: 60 },
    { id: 'alinhamento', nome: 'Alinhamento de Direção', icon: '📐', tempo_medio: 1.5, custo_peca_medio: 0, preco_medio: 100 },
    { id: 'troca-correia', nome: 'Troca de Correia de Distribuição', icon: '⛓️', tempo_medio: 3, custo_peca_medio: 180, preco_medio: 450 },
    { id: 'troca-pastilha', nome: 'Troca de Pastilha de Freio', icon: '🛑', tempo_medio: 1.5, custo_peca_medio: 95, preco_medio: 250 },
    { id: 'revisao-completa', nome: 'Revisão Completa (10mil km)', icon: '🔧', tempo_medio: 2, custo_peca_medio: 100, preco_medio: 280 },
  ]);

  const [historicoServicos, setHistoricoServicos] = useState({});
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [mostrarSugestao, setMostrarSugestao] = useState(false);

  // ========== ESTADOS DE UI ==========
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [usarSugestaoIA, setUsarSugestaoIA] = useState(false);
  const [precoAjustado, setPrecoAjustado] = useState('');

  // ========== CARREGAMENTO DE DADOS ==========
  useEffect(() => {
    const carregarDados = async () => {
      if (!oficinaId) return;
      try {
        // Carregar custos
        const docRef = doc(db, 'oficinas', oficinaId, 'configuracoes', 'precificacao');
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCustos({
            aluguel: String(data.aluguel || ''),
            luzAguaNet: String(data.luzAguaNet || ''),
            folhaPagamento: String(data.folhaPagamento || ''),
            outrosCustos: String(data.outrosCustos || ''),
            horasTrabalhadas: String(data.horasTrabalhadas || '160')
          });
        }

        // Carregar histórico real de serviços finalizados
        await carregarHistoricoServicos();
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };
    carregarDados();
  }, [oficinaId]);

  // ========== HISTÓRICO REAL DO FIREBASE ==========
  const carregarHistoricoServicos = async () => {
    if (!oficinaId) return;
    try {
      // Busca todas as O.S. finalizadas da oficina
      const osRef = collection(db, 'ordensServico');
      const q = query(
        osRef,
        where('oficinaId', '==', oficinaId),
        where('status', '==', 'finalizado')
      );
      const snap = await getDocs(q);

      if (snap.empty) return; // sem dados reais: sugestões fixas permanecem como fallback

      // Agrupa por nomeServico e acumula valores
      const grupos = {};
      snap.forEach((docSnap) => {
        const os = docSnap.data();
        // Tenta extrair o nome do serviço de diferentes campos possíveis
        const nome = (
          os.nomeServico ||
          os.setor ||
          os.tipo ||
          'outros'
        ).toLowerCase().trim();

        if (!grupos[nome]) {
          grupos[nome] = {
            quantidade: 0,
            somaTempo: 0,
            somaCustoPeca: 0,
            somaPrecoCliente: 0,
          };
        }

        grupos[nome].quantidade += 1;
        grupos[nome].somaTempo += Number(os.tempoExecucao) || 0;
        grupos[nome].somaCustoPeca += Number(os.custoPeca) || 0;
        grupos[nome].somaPrecoCliente +=
          Number(os.precoCliente || os.total || os.valorTotal) || 0;
      });

      // Calcula médias e classifica variação
      const historico = {};
      Object.entries(grupos).forEach(([nome, g]) => {
        const n = g.quantidade;
        const tempo_medio = n > 0 ? g.somaTempo / n : 0;
        const custo_peca_medio = n > 0 ? g.somaCustoPeca / n : 0;
        const preco_medio = n > 0 ? g.somaPrecoCliente / n : 0;

        // Classifica variação pelo volume de O.S.
        const variacao = n >= 15 ? 'baixa' : n >= 6 ? 'média' : 'alta';

        historico[nome] = { quantidade: n, tempo_medio, custo_peca_medio, preco_medio, variacao };
      });

      setHistoricoServicos(historico);

      // Atualiza também os serviçosSugeridos com dados reais quando possível
      setServicaosSugeridos(prev =>
        prev.map(svc => {
          const chaveReal = Object.keys(historico).find(k =>
            k.includes(svc.nome.toLowerCase().slice(0, 8)) ||
            svc.nome.toLowerCase().includes(k.slice(0, 8))
          );
          if (!chaveReal) return svc;
          const h = historico[chaveReal];
          return {
            ...svc,
            tempo_medio: h.tempo_medio > 0 ? h.tempo_medio : svc.tempo_medio,
            custo_peca_medio: h.custo_peca_medio > 0 ? h.custo_peca_medio : svc.custo_peca_medio,
            preco_medio: h.preco_medio > 0 ? h.preco_medio : svc.preco_medio,
          };
        })
      );
    } catch (err) {
      console.error('[Precificacao] Erro ao carregar histórico de O.S.:', err);
      // Sem dados reais: o sugestaoIA já verifica se historicoServicos[id] existe
      // e retorna null, mantendo os valores padrão dos servicosSugeridos.
    }
  };

  // ========== CÁLCULOS PRINCIPAIS (EXISTENTES, OTIMIZADOS) ==========
  const custoHoraTecnica = useMemo(() => {
    const totalDespesas = (Number(custos.aluguel) || 0) + (Number(custos.luzAguaNet) || 0) +
      (Number(custos.folhaPagamento) || 0) + (Number(custos.outrosCustos) || 0);
    const horasUteis = Number(custos.horasTrabalhadas) || 160;
    return horasUteis > 0 ? totalDespesas / horasUteis : 0;
  }, [custos]);

  const custoPecaComMargem = useMemo(() => {
    const custo = Number(servico.custoPeca) || 0;
    const margem = Number(servico.margemPeca) || 0;
    return custo * (1 + margem / 100);
  }, [servico]);

  const custoMaoObra = useMemo(() => {
    return custoHoraTecnica * (Number(servico.tempoExecucao) || 0);
  }, [custoHoraTecnica, servico]);

  const custoTotalServico = custoPecaComMargem + custoMaoObra;

  const impostos = useMemo(() => {
    const taxa = Number(servico.taxaImposto) || 0;
    return custoTotalServico * (taxa / 100);
  }, [custoTotalServico, servico]);

  const precoCliente = useMemo(() => {
    if (usarSugestaoIA && precoAjustado) {
      return Number(precoAjustado) || (custoTotalServico + impostos);
    }
    return custoTotalServico + impostos;
  }, [custoTotalServico, impostos, usarSugestaoIA, precoAjustado]);

  const lucroLiquido = useMemo(() => {
    const custoPeca = Number(servico.custoPeca) || 0;
    return precoCliente - custoPeca - custoMaoObra;
  }, [precoCliente, servico, custoMaoObra]);

  const percentuais = useMemo(() => {
    if (precoCliente <= 0) return { peca: 0, maoObra: 0, impostos: 0, lucro: 0 };
    const peca = (custoPecaComMargem / precoCliente) * 100;
    const maoObra = (custoMaoObra / precoCliente) * 100;
    const imp = (impostos / precoCliente) * 100;
    const lucro = (lucroLiquido / precoCliente) * 100;
    return { peca, maoObra, impostos: imp, lucro };
  }, [precoCliente, custoPecaComMargem, custoMaoObra, impostos, lucroLiquido]);

  // ========== SUGESTÃO INTELIGENTE IA ==========
  const sugestaoIA = useMemo(() => {
    if (!servicoSelecionado) return null;

    const historico = historicoServicos[servicoSelecionado.id];
    if (!historico) return null;

    // Sugestões baseadas no histórico
    const tempoSugerido = historico.tempo_medio;
    const custoPecaSugerido = historico.custo_peca_medio;
    const precoSugerido = historico.preco_medio;

    const custoMaoObraSugerida = custoHoraTecnica * tempoSugerido;
    const custoPecaComMargemSugerida = custoPecaSugerido * 1.3;
    const custoTotalSugerido = custoPecaComMargemSugerida + custoMaoObraSugerida;
    const impostosSugeridos = custoTotalSugerido * (Number(servico.taxaImposto) / 100 || 0);
    const precoIASugerido = precoSugerido + impostosSugeridos;

    // Calcular margem
    const lucroSugeridoIA = precoIASugerido - custoPecaSugerido - custoMaoObraSugerida;
    const margemSugeridaIA = (lucroSugeridoIA / precoIASugerido) * 100;

    return {
      tempoSugerido,
      custoPecaSugerido,
      precoSugerido: precoIASugerido,
      margemSugerida: margemSugeridaIA,
      confianca: Math.min((historico.quantidade / 30) * 100, 100),
      serviceCount: historico.quantidade,
      variacao: historico.variacao,
      lucroSugeridoIA
    };
  }, [servicoSelecionado, historicoServicos, custoHoraTecnica, servico.taxaImposto]);

  // ========== INDICADOR DE SAÚDE DO LUCRO ==========
  const saudeLucro = useMemo(() => {
    const margemPercent = percentuais.lucro;

    if (margemPercent >= 20) {
      return { status: 'excelente', cor: '#22c55e', label: '✓ Excelente', icon: '🟢' };
    } else if (margemPercent >= 15) {
      return { status: 'bom', cor: '#84cc16', label: '✓ Bom', icon: '🟡' };
    } else if (margemPercent >= 10) {
      return { status: 'atencao', cor: '#f59e0b', label: '⚠ Atenção', icon: '🟠' };
    } else if (margemPercent > 0) {
      return { status: 'critico', cor: '#ef4444', label: '✗ Crítico', icon: '🔴' };
    } else {
      return { status: 'prejuizo', cor: '#7c2d12', label: '✗ Prejuízo', icon: '⚫' };
    }
  }, [percentuais.lucro]);

  // ========== FUNÇÕES DE AÇÃO ==========
  const salvarCustos = async () => {
    if (!oficinaId) return;
    setSalvando(true);
    try {
      const docRef = doc(db, 'oficinas', oficinaId, 'configuracoes', 'precificacao');
      await setDoc(docRef, custos);
      setMensagem('✓ Custos salvos com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setMensagem('✗ Erro ao salvar custos');
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const aplicarSugestaoIA = () => {
    if (!sugestaoIA) return;

    setServico({
      ...servico,
      custoPeca: String(sugestaoIA.custoPecaSugerido.toFixed(2)),
      tempoExecucao: String(sugestaoIA.tempoSugerido.toFixed(2))
    });
    setPrecoAjustado(String(sugestaoIA.precoSugerido.toFixed(2)));
    setUsarSugestaoIA(true);
    setMostrarSugestao(false);
  };

  const limparSugestaoIA = () => {
    setUsarSugestaoIA(false);
    setPrecoAjustado('');
    setMostrarSugestao(false);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // ========== ESTILOS ==========
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s'
  };

  const inputStyleFocus = {
    ...inputStyle,
    borderColor: '#a855f7',
    boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px'
  };

  const cardStyle = {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '16px'
  };

  const badgeStyle = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    color: '#c4b5fd',
    marginLeft: '8px',
    border: '1px solid rgba(168, 85, 247, 0.5)'
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{ background: '#a855f7', padding: '10px', borderRadius: '10px' }}>
          <Calculator size={24} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: 'bold' }}>PRECIFICAÇÃO INTELIGENTE</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>IA para sugerir preços | Margens em tempo real</p>
        </div>
      </div>

      {/* NOTIFICAÇÃO */}
      {mensagem && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          background: mensagem.includes('✓') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${mensagem.includes('✓') ? '#22c55e' : '#ef4444'}`,
          borderRadius: '8px',
          color: mensagem.includes('✓') ? '#86efac' : '#fca5a5',
          fontSize: '13px'
        }}>
          {mensagem}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>

        {/* ========== COLUNA 1: CUSTOS E CONFIG ==========*/}
        <div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <DollarSign size={18} color="#a855f7" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>Custos Operacionais</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Aluguel (R$/mês)</label>
                <input
                  type="number"
                  value={custos.aluguel}
                  onChange={(e) => setCustos({ ...custos, aluguel: e.target.value })}
                  style={inputStyle}
                  placeholder="3000"
                />
              </div>
              <div>
                <label style={labelStyle}>Luz, Água e Net</label>
                <input
                  type="number"
                  value={custos.luzAguaNet}
                  onChange={(e) => setCustos({ ...custos, luzAguaNet: e.target.value })}
                  style={inputStyle}
                  placeholder="800"
                />
              </div>
              <div>
                <label style={labelStyle}>Folha de Pagamento</label>
                <input
                  type="number"
                  value={custos.folhaPagamento}
                  onChange={(e) => setCustos({ ...custos, folhaPagamento: e.target.value })}
                  style={inputStyle}
                  placeholder="8000"
                />
              </div>
              <div>
                <label style={labelStyle}>Outros Custos</label>
                <input
                  type="number"
                  value={custos.outrosCustos}
                  onChange={(e) => setCustos({ ...custos, outrosCustos: e.target.value })}
                  style={inputStyle}
                  placeholder="1200"
                />
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle}>Horas Trabalhadas/Mês</label>
              <input
                type="number"
                value={custos.horasTrabalhadas}
                onChange={(e) => setCustos({ ...custos, horasTrabalhadas: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Custo da Hora Técnica
              </div>
              <div style={{ color: '#a855f7', fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
                {formatarMoeda(custoHoraTecnica)}
              </div>
              <p style={{ color: '#555', fontSize: '9px', margin: '6px 0 0 0' }}>
                💡 Esta é a base para calcular o preço mínimo de qualquer serviço
              </p>
            </div>

            <button
              onClick={salvarCustos}
              disabled={salvando}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                background: salvando ? '#555' : '#a855f7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: salvando ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <Save size={16} />
              {salvando ? 'Salvando...' : 'Salvar Custos'}
            </button>
          </div>
        </div>

        {/* ========== COLUNA 2: SERVIÇO + SUGESTÃO IA ==========*/}
        <div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={18} color="#f59e0b" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                Serviço & IA
                {servicoSelecionado && <span style={badgeStyle}>IA Ativa</span>}
              </h3>
            </div>

            {/* SELETOR DE SERVIÇO */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Selecione um Serviço</label>
              <div style={{
                position: 'relative',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <select
                  value={servicoSelecionado?.id || ''}
                  onChange={(e) => {
                    const selecionado = servicosSugeridos.find(s => s.id === e.target.value);
                    setServicoSelecionado(selecionado || null);
                    setMostrarSugestao(!!selecionado);
                    if (selecionado) {
                      setServico({ ...servico, nomeServico: selecionado.nome });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    paddingRight: '32px'
                  }}
                >
                  <option value="">-- Selecione um Serviço --</option>
                  {servicosSugeridos.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.icon} {svc.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SUGESTÃO IA - Card destacado */}
            {mostrarSugestao && sugestaoIA && (
              <div style={{
                marginBottom: '16px',
                padding: '14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(168, 85, 247, 0.1))',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#f59e0b" />
                    <div>
                      <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>SUGESTÃO INTELIGENTE</div>
                      <div style={{ color: '#999', fontSize: '9px', marginTop: '2px' }}>
                        Baseado em {sugestaoIA.serviceCount} serviços anteriores
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: 'rgba(34, 197, 94, 0.2)',
                    borderRadius: '6px'
                  }}>
                    <CheckCircle size={14} color="#22c55e" />
                    <span style={{ color: '#22c55e', fontSize: '10px', fontWeight: 'bold' }}>
                      {Math.round(sugestaoIA.confianca)}% Confiança
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>⏱️ Tempo</div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                      {sugestaoIA.tempoSugerido.toFixed(1)}h
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>💰 Custo Peça</div>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                      {formatarMoeda(sugestaoIA.custoPecaSugerido)}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>💵 Preço Sugerido</div>
                    <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>
                      {formatarMoeda(sugestaoIA.precoSugerido)}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <div style={{ color: '#888', fontSize: '9px' }}>📊 Margem IA</div>
                    <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>
                      {sugestaoIA.margemSugerida.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={aplicarSugestaoIA}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#f59e0b',
                      color: 'black',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✓ Aceitar Sugestão
                  </button>
                  <button
                    onClick={() => setMostrarSugestao(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ✗ Descartar
                  </button>
                </div>
              </div>
            )}

            {/* INPUTS MANUAIS */}
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Nome do Serviço</label>
              <input
                type="text"
                value={servico.nomeServico}
                onChange={(e) => setServico({ ...servico, nomeServico: e.target.value })}
                style={inputStyle}
                placeholder="ex: Troca de Óleo"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Custo Peça (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={servico.custoPeca}
                  onChange={(e) => setServico({ ...servico, custoPeca: e.target.value })}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={labelStyle}>Margem Peça (%)</label>
                <input
                  type="number"
                  step="1"
                  value={servico.margemPeca}
                  onChange={(e) => setServico({ ...servico, margemPeca: e.target.value })}
                  style={inputStyle}
                  placeholder="30"
                />
              </div>
              <div>
                <label style={labelStyle}>Tempo de Execução (h)</label>
                <input
                  type="number"
                  step="0.25"
                  value={servico.tempoExecucao}
                  onChange={(e) => setServico({ ...servico, tempoExecucao: e.target.value })}
                  style={inputStyle}
                  placeholder="1"
                />
              </div>
              <div>
                <label style={labelStyle}>Taxa/Imposto (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={servico.taxaImposto}
                  onChange={(e) => setServico({ ...servico, taxaImposto: e.target.value })}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
            </div>

            {/* STATUS IA ATIVO */}
            {usarSugestaoIA && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={14} color="#f59e0b" />
                  <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>
                    💡 Sugestão IA Aplicada
                  </span>
                </div>
                <button
                  onClick={limparSugestaoIA}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========== COLUNA 3: RESULTADOS E ANÁLISE ==========*/}
        <div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={18} color="#22c55e" />
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>Análise de Lucro</h3>
            </div>

            {/* INDICADOR SAÚDE DO LUCRO */}
            <div style={{
              padding: '16px',
              background: `linear-gradient(135deg, ${saudeLucro.cor}22 0%, ${saudeLucro.cor}11 100%)`,
              border: `2px solid ${saudeLucro.cor}`,
              borderRadius: '10px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{saudeLucro.icon}</div>
              <div style={{ color: saudeLucro.cor, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {saudeLucro.label}
              </div>
              <div style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
                {percentuais.lucro.toFixed(1)}%
              </div>
              <div style={{ color: '#888', fontSize: '10px', marginTop: '6px' }}>
                Margem de Lucro Líquida
              </div>
            </div>

            {/* ALERTAS */}
            {percentuais.lucro < 20 && percentuais.lucro > 0 && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '6px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <AlertTriangle size={14} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', color: '#f59e0b' }}>
                  <strong>Alerta:</strong> Margem abaixo de 20%. Considere aumentar o preço ou reduzir custos.
                </div>
              </div>
            )}

            {percentuais.lucro <= 0 && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '6px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <TrendingDown size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', color: '#ef4444' }}>
                  <strong>Crítico:</strong> Este serviço geraria prejuízo! Aumentar preço agora.
                </div>
              </div>
            )}

            {/* COMPARAÇÃO: IA vs MANUAL */}
            {sugestaoIA && usarSugestaoIA && (
              <div style={{
                marginBottom: '12px',
                padding: '12px',
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
                  📊 Comparação: Sugestão IA vs Seu Ajuste
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '6px' }}>
                    <div style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 'bold' }}>IA Sugeriu</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                      {formatarMoeda(sugestaoIA.precoSugerido)}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(168, 85, 247, 0.2)', borderRadius: '6px' }}>
                    <div style={{ color: '#c4b5fd', fontSize: '9px', fontWeight: 'bold' }}>Você Ajustou</div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                      {formatarMoeda(precoCliente)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '9px', color: '#888' }}>
                  Diferença: <strong style={{ color: precoCliente > sugestaoIA.precoSugerido ? '#22c55e' : '#ef4444' }}>
                    {precoCliente > sugestaoIA.precoSugerido ? '+' : ''}{formatarMoeda(precoCliente - sugestaoIA.precoSugerido)}
                  </strong>
                </div>
              </div>
            )}

            {/* CÁLCULOS DETALHADOS */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '9px', textTransform: 'uppercase' }}>Peça c/ Margem</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                    {formatarMoeda(custoPecaComMargem)}
                  </div>
                </div>
                <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '9px', textTransform: 'uppercase' }}>Mão de Obra</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                    {formatarMoeda(custoMaoObra)}
                  </div>
                </div>
                <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '9px', textTransform: 'uppercase' }}>Impostos</div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                    {formatarMoeda(impostos)}
                  </div>
                </div>
                <div style={{ padding: '10px', background: '#0a0a0a', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '9px', textTransform: 'uppercase' }}>Lucro Líquido</div>
                  <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                    {formatarMoeda(lucroLiquido)}
                  </div>
                </div>
              </div>
            </div>

            {/* PREÇO FINAL */}
            <div style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
              border: '2px solid #22c55e',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#86efac', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Preço Final do Serviço
              </div>
              <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>
                {formatarMoeda(precoCliente)}
              </div>
              {usarSugestaoIA && (
                <div style={{ color: '#86efac', fontSize: '9px', marginTop: '6px' }}>
                  ✓ Baseado em sugestão IA
                </div>
              )}
            </div>

            {/* RAIO-X DO DINHEIRO */}
            {precoCliente > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #222' }}>
                <div style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
                  💰 Distribuição do Preço
                </div>
                <div style={{ display: 'flex', gap: '6px', height: '28px', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ width: `${percentuais.peca}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: 'white' }}>
                    {percentuais.peca > 8 ? 'Peça' : ''}
                  </div>
                  <div style={{ width: `${percentuais.maoObra}%`, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: 'white' }}>
                    {percentuais.maoObra > 8 ? 'M.O.' : ''}
                  </div>
                  <div style={{ width: `${percentuais.impostos}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: 'black' }}>
                    {percentuais.impostos > 8 ? 'Taxa' : ''}
                  </div>
                  <div style={{ width: `${percentuais.lucro}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: 'black' }}>
                    {percentuais.lucro > 8 ? 'Lucro' : ''}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
                  <span style={{ color: '#3b82f6' }}>🔵 Peça: {percentuais.peca.toFixed(1)}%</span>
                  <span style={{ color: '#8b5cf6' }}>🟣 M.O.: {percentuais.maoObra.toFixed(1)}%</span>
                  <span style={{ color: '#f59e0b' }}>🟠 Taxa: {percentuais.impostos.toFixed(1)}%</span>
                  <span style={{ color: '#22c55e' }}>🟢 Lucro: {percentuais.lucro.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== SEÇÃO DE AÇÕES (Rodapé) ==========*/}
      {servico.nomeServico && precoCliente > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              const telefone = config?.telefone || '';
              const msg = `Olá! O orçamento para *${servico.nomeServico}* ficou em *${formatarMoeda(precoCliente)}* (Peças + Mão de obra inclusas). 💼`;
              if (telefone) {
                const telLimpo = telefone.replace(/\D/g, '');
                window.open(`https://wa.me/55${telLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
              } else {
                alert('Configure o telefone da oficina em Configurações.');
              }
            }}
            style={{
              flex: 1,
              padding: '14px',
              background: '#22c55e',
              color: 'black',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <MessageCircle size={18} />
            Enviar por WhatsApp
          </button>
          <button
            onClick={() => verificarLicenca ? verificarLicenca('criar ordens de serviço') : alert('Em breve: Integração com O.S.!')}
            style={{
              flex: 1,
              padding: '14px',
              background: '#a855f7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={18} />
            Criar O.S.
          </button>
        </div>
      )}
    </div>
  );
}
