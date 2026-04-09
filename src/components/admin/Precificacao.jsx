import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Calculator, DollarSign, Save, TrendingUp, Clock, MessageCircle, FileText } from 'lucide-react';

export default function Precificacao({ oficinaId: oficinaIdProp, config, t, verificarLicenca }) {
  const oficinaId = oficinaIdProp;

  const [custos, setCustos] = useState({
    aluguel: '',
    luzAguaNet: '',
    folhaPagamento: '',
    outrosCustos: '',
    horasTrabalhadas: '160'
  });

  const [servico, setServico] = useState({
    nomeServico: '',
    custoPeca: '',
    margemPeca: '30',
    tempoExecucao: '1',
    taxaImposto: '0'
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const carregarCustos = async () => {
      if (!oficinaId) return;
      try {
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
      } catch (err) {
        console.error('Erro ao carregar custos:', err);
      }
    };
    carregarCustos();
  }, [oficinaId]);

  const custoHoraTecnica = useMemo(() => {
    const totalDespesas = (Number(custos.aluguel) || 0) + (Number(custos.luzAguaNet) || 0) + 
                        (Number(custos.folhaPagamento) || 0) + (Number(custos.outrosCustos) || 0);
    const horasUteis = Number(custos.horasTrabalhadas) || 160;
    const resultado = horasUteis > 0 ? totalDespesas / horasUteis : 0;
    console.log('[Precificacao] CustoHora:', { totalDespesas, horasUteis, resultado });
    return resultado;
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

  const precoCliente = custoTotalServico + impostos;

  const lucroLiquido = useMemo(() => {
    const custoPeca = Number(servico.custoPeca) || 0;
    return precoCliente - custoPeca - custoMaoObra;
  }, [precoCliente, servico, custoMaoObra]);

  const percentuais = useMemo(() => {
    if (precoCliente <= 0) return { peca: 0,maoObra: 0, impostos: 0, lucro: 0 };
    const peca = (custoPecaComMargem / precoCliente) * 100;
    const maoObra = (custoMaoObra / precoCliente) * 100;
    const imp = (impostos / precoCliente) * 100;
    const lucro = (lucroLiquido / precoCliente) * 100;
    return { peca, maoObra, impostos: imp, lucro };
  }, [precoCliente, custoPecaComMargem, custoMaoObra, impostos, lucroLiquido]);

  const salvarCustos = async () => {
    if (!oficinaId) return;
    setSalvando(true);
    try {
      const docRef = doc(db, 'oficinas', oficinaId, 'configuracoes', 'precificacao');
      await setDoc(docRef, custos);
      setMensagem('Custos salvos com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err) {
      setMensagem('Erro ao salvar custos');
    } finally {
      setSalvando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

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

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{ background: '#a855f7', padding: '10px', borderRadius: '10px' }}>
          <Calculator size={24} color="white" />
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: 'bold' }}>PRECIFICAÇÃO</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>Configure custos e calcule orçamentos</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px' 
      }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <DollarSign size={20} color="#a855f7" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>Custo Fixo da Oficina</h3>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Aluguel (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={custos.aluguel}
                onChange={(e) => setCustos({...custos, aluguel: e.target.value})}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Água / Luz / Net (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={custos.luzAguaNet}
                onChange={(e) => setCustos({...custos, luzAguaNet: e.target.value})}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Folha de Pagamento (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={custos.folhaPagamento}
                onChange={(e) => setCustos({...custos, folhaPagamento: e.target.value})}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Outros Custos (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={custos.outrosCustos}
                onChange={(e) => setCustos({...custos, outrosCustos: e.target.value})}
                style={inputStyle}
                placeholder="0"
              />
            </div>
            <div>
              <label style={labelStyle}>Horas Trabalhadas por Mês</label>
              <input 
                type="number" 
                step="1"
                value={custos.horasTrabalhadas}
                onChange={(e) => setCustos({...custos, horasTrabalhadas: e.target.value})}
                style={inputStyle}
                placeholder="160"
              />
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
            border: '1px solid #a855f7',
            borderRadius: '10px', 
            padding: '16px', 
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={18} color="#a855f7" />
              <span style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Custo da Hora Técnica</span>
            </div>
            <div style={{ color: '#a855f7', fontSize: '28px', fontWeight: 'bold' }}>
              {formatarMoeda(custoHoraTecnica)}
            </div>
          </div>

          <button 
            onClick={salvarCustos}
            disabled={salvando}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              background: salvando ? '#444' : '#a855f7',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: salvando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} />
            {salvando ? 'Salvando...' : 'Salvar Custos'}
          </button>

          {mensagem && (
            <div style={{ 
              marginTop: '12px', 
              padding: '10px', 
              background: mensagem.includes('sucesso') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${mensagem.includes('sucesso') ? '#22c55e' : '#ef4444'}`,
              borderRadius: '8px',
              color: mensagem.includes('sucesso') ? '#22c55e' : '#ef4444',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {mensagem}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={20} color="#22c55e" />
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>Calculadora de Orçamento</h3>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nome do Serviço</label>
              <input 
                type="text" 
                value={servico.nomeServico}
                onChange={(e) => setServico({...servico, nomeServico: e.target.value})}
                placeholder="Ex: Troca de Óleo"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Custo da Peça (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={servico.custoPeca}
                  onChange={(e) => setServico({...servico, custoPeca: e.target.value})}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={labelStyle}>Margem na Peça (%)</label>
                <input 
                  type="number" 
                  step="1"
                  value={servico.margemPeca}
                  onChange={(e) => setServico({...servico, margemPeca: e.target.value})}
                  style={inputStyle}
                  placeholder="30"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Tempo de Execução (Horas)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={servico.tempoExecucao}
                  onChange={(e) => setServico({...servico, tempoExecucao: e.target.value})}
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
                  onChange={(e) => setServico({...servico, taxaImposto: e.target.value})}
                  style={inputStyle}
                  placeholder="0"
                />
                <p style={{ color: '#888', fontSize: '10px', marginTop: '6px', marginBottom: 0 }}>
                  💡 Dica: Some o imposto da nota fiscal (ex: 6% Simples Nacional) + a taxa da sua maquininha de cartão (ex: 4% crédito) = 10%.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ 
                background: '#0a0a0a', 
                border: '1px solid #333', 
                borderRadius: '10px', 
                padding: '14px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  Custo Peça c/ Margem
                </div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                  {formatarMoeda(custoPecaComMargem)}
                </div>
              </div>
              <div style={{ 
                background: '#0a0a0a', 
                border: '1px solid #333', 
                borderRadius: '10px', 
                padding: '14px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  Mão de Obra
                </div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                  {formatarMoeda(custoMaoObra)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '20px', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px' 
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)', 
              border: '1px solid #22c55e',
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#86efac', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Preço Sugerido
              </div>
              <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                {formatarMoeda(precoCliente)}
              </div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #581c87 0%, #4c1d95 100%)', 
              border: '1px solid #a855f7',
              borderRadius: '12px', 
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#d8b4fe', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Lucro Líquido
              </div>
              <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                {formatarMoeda(lucroLiquido)}
              </div>
            </div>
          </div>

          {servico.nomeServico && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: '#0a0a0a', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ color: '#666', fontSize: '12px' }}>
                {servico.nomeServico}: {formatarMoeda(custoPecaComMargem)} (peça) + {formatarMoeda(custoMaoObra)} (mão de obra) = {formatarMoeda(precoCliente)}
              </span>
            </div>
          )}

          {precoCliente > 0 && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                💰 Raio-X do Dinheiro
              </div>
              <div style={{ display: 'flex', gap: '8px', height: '24px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${percentuais.peca}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: 'white' }}>
                  {percentuais.peca > 10 ? 'Peça' : ''}
                </div>
                <div style={{ width: `${percentuais.maoObra}%`, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: 'white' }}>
                  {percentuais.maoObra > 10 ? 'M.O.' : ''}
                </div>
                <div style={{ width: `${percentuais.impostos}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: 'black' }}>
                  {percentuais.impostos > 10 ? 'Taxa' : ''}
                </div>
                <div style={{ width: `${percentuais.lucro}%`, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: 'black' }}>
                  {percentuais.lucro > 10 ? 'Lucro' : ''}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: '#3b82f6', fontSize: '10px' }}>🔵 Peça: {percentuais.peca.toFixed(1)}%</span>
                <span style={{ color: '#8b5cf6', fontSize: '10px' }}>🟣 M.O.: {percentuais.maoObra.toFixed(1)}%</span>
                <span style={{ color: '#f59e0b', fontSize: '10px' }}>🟠 Taxa: {percentuais.impostos.toFixed(1)}%</span>
                <span style={{ color: '#22c55e', fontSize: '10px' }}>🟢 Lucro: {percentuais.lucro.toFixed(1)}%</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                const telefone = config?.telefone || '';
                const msg = `Olá! O orçamento para o seu serviço (${servico.nomeServico || 'serviço'}) ficou em ${formatarMoeda(precoCliente)} (Peças + Mão de obra inclusas).`;
                if (telefone) {
                  const telLimpo = telefone.replace(/\D/g, '');
                  window.open(`https://wa.me/55${telLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
                } else {
                  alert('Configure o telefone da oficina em Configurações para enviar por WhatsApp.');
                }
              }}
              style={{ flex: 1, padding: '14px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <MessageCircle size={18} />
              Enviar Orçamento por WhatsApp
            </button>
            <button
              onClick={() => verificarLicenca ? verificarLicenca('criar ordens de serviço') : alert('Em breve: Integração direta com a O.S.!')}
              style={{ flex: 1, padding: '14px', background: '#ff0033', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FileText size={18} />
              Criar O.S. com este valor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}