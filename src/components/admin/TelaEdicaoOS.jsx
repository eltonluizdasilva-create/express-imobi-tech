/* eslint-disable react/prop-types */
import { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Calculator, DollarSign, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';

export default function TelaEdicaoOS({
  osEditando,
  setOsEditando,
  fecharEdicao,
  salvarEdicao,
  normalizarPlaca,
  SpeechTextarea,
  GREEN,
  MAIN,
  oficinaId,
}) {
  const [resetando, setResetando] = useState(false);

  const gerarSenhaAleatoria = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let senha = '';
    for (let i = 0; i < 6; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return senha;
  };

  const resetarSenhaCliente = async () => {
    if (!osEditando || !oficinaId) return;
    if (!confirm('Tem certeza que deseja resetar a senha do cliente? Uma nova senha provisória será gerada e enviada via WhatsApp.')) return;

    setResetando(true);
    try {
      const novaSenha = gerarSenhaAleatoria();
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osEditando.id), { senhaConsulta: novaSenha });
      setOsEditando({ ...osEditando, senhaConsulta: novaSenha });

      const linkConsulta = `https://oficina.expresstech.com.br/${oficinaId}/${osEditando.id}`;
      const mensagem = `Olá! A senha da sua Ordem de Serviço placa ${osEditando.placa} foi resetada por motivos de segurança. Sua nova senha provisória é: ${novaSenha}. Acesse o link ${linkConsulta} para acompanhar seu veículo e altere a senha no primeiro acesso.`;
      const telefone = osEditando.telefone?.replace(/\D/g, '') || '';

      if (telefone.length >= 10) {
        const telWhats = telefone.startsWith('55') ? telefone : '55' + telefone;
        window.open(`https://wa.me/${telWhats}?text=${encodeURIComponent(mensagem)}`, '_blank');
      }

      alert(`✅ Senha resetada! Nova senha: ${novaSenha}`);
    } catch (e) {
      alert('Erro ao resetar senha: ' + e.message);
    } finally {
      setResetando(false);
    }
  };

  // ==========================================
  // 💰 MÓDULO: CÁLCULO DE LUCRO EM TEMPO REAL
  // ==========================================
  const vPecas = Number(osEditando.valorPecas) || 0;
  const vMao = Number(osEditando.valorMaoObra) || 0;
  const totalOS = vPecas + vMao;

  const custoPecas = Number(osEditando.custoPecas) || 0;
  const horasTecnicas = Number(osEditando.horasTecnicas) || 0;
  const valorHoraTecnica = Number(osEditando.valorHoraTecnica) || 120; // Default valor base
  const taxasImpostos = Number(osEditando.taxasImpostos) || 6; // Default taxa de cartão/tributos

  const totalCusto = custoPecas + (horasTecnicas * valorHoraTecnica);
  const taxaAbsoluta = totalOS * (taxasImpostos / 100);
  const lucroLimpo = totalOS - totalCusto - taxaAbsoluta;
  const margemLiquida = totalOS > 0 ? (lucroLimpo / totalOS) * 100 : 0;

  const atualizarCampoFinanceiro = (campo, valor) => {
    const novoEstado = { ...osEditando, [campo]: valor };
    
    // Recalcula Derived Fields para persistência no estado
    const nVPecas = Number(novoEstado.valorPecas) || 0;
    const nVMao = Number(novoEstado.valorMaoObra) || 0;
    const nTotalOS = nVPecas + nVMao;

    const nCustoPecas = Number(novoEstado.custoPecas) || 0;
    const nHorasTecnicas = Number(novoEstado.horasTecnicas) || 0;
    const nValorHoraTecnica = Number(novoEstado.valorHoraTecnica) || 120;
    const nTaxasImpostos = Number(novoEstado.taxasImpostos) || 6;

    const nTotalCusto = nCustoPecas + (nHorasTecnicas * nValorHoraTecnica);
    const nTaxaAbsoluta = nTotalOS * (nTaxasImpostos / 100);
    const nLucroLimpo = nTotalOS - nTotalCusto - nTaxaAbsoluta;
    const nMargemLiquida = nTotalOS > 0 ? (nLucroLimpo / nTotalOS) * 100 : 0;

    setOsEditando({
      ...novoEstado,
      lucroLimpo: Number(nLucroLimpo.toFixed(2)),
      margemLucro: Number(nMargemLiquida.toFixed(1))
    });
  };

  const sugerirPrecoElite = () => {
    const precoComTaxas = totalCusto / (1 - (taxasImpostos / 100));
    const precoSugerido = precoComTaxas * 1.25; // 25% real clean profit buffer

    // Distribui com Markup de 30% no Custo de Peças e restante na Mão de Obra
    const novoValorPecas = Number((custoPecas * 1.3).toFixed(2));
    const novoValorMao = Number((precoSugerido - novoValorPecas).toFixed(2));

    const nTotalOS = novoValorPecas + novoValorMao;
    const nTaxaAbsoluta = nTotalOS * (taxasImpostos / 100);
    const nLucroLimpo = nTotalOS - totalCusto - nTaxaAbsoluta;
    const nMargemLiquida = nTotalOS > 0 ? (nLucroLimpo / nTotalOS) * 100 : 0;

    setOsEditando({
      ...osEditando,
      valorPecas: String(novoValorPecas),
      valorMaoObra: String(novoValorMao),
      lucroLimpo: Number(nLucroLimpo.toFixed(2)),
      margemLucro: Number(nMargemLiquida.toFixed(1))
    });
  };

  const formatarMoeda = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (!osEditando) return null;

  // Sinalizador de Saúde Financeira
  let corSaude = '#10B981'; // Verde (Seguro)
  let corFundoSaude = 'rgba(16, 185, 129, 0.08)';
  let textoAlerta = 'EXCELENTE: Serviço lucrativo e seguro para sua saúde financeira.';
  let pulseClass = '';

  if (margemLiquida < 5) {
    corSaude = '#EF4444'; // Vermelho vibrante
    corFundoSaude = 'rgba(239, 68, 68, 0.15)';
    textoAlerta = 'PERIGO: Você está pagando para trabalhar neste serviço!';
    pulseClass = 'pulse-alert';
  } else if (margemLiquida < 15) {
    corSaude = '#F59E0B'; // Amarelo
    corFundoSaude = 'rgba(245, 158, 11, 0.1)';
    textoAlerta = 'Atenção: Margem Baixa. Verifique seus custos fixos.';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px' }}>
      <style>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-alert {
          animation: pulse-red 1.5s infinite;
          border: 2px solid #ef4444 !important;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `1px solid ${MAIN}`, paddingBottom: '15px' }}>
          <h2 style={{ margin: 0, color: MAIN, fontWeight: 900, textTransform: 'uppercase' }}>✏️ Editando O.S. - {osEditando.placa}</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetarSenhaCliente} disabled={resetando} title="Resetar senha do cliente e enviar WhatsApp" style={{ background: '#1a1a1a', color: '#f59e0b', border: '1px solid #f59e0b', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.2s' }}>
              🔑 {resetando ? 'Enviando...' : 'Resetar Senha Cliente'}
            </button>
            <button onClick={fecharEdicao} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}>✖ Cancelar</button>
          </div>
        </div>

        {/* GRID LAYOUT PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', alignItems: 'start' }}>
          
          {/* PAINEL ESQUERDO: DADOS BÁSICOS DO ORÇAMENTO */}
          <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '25px', borderRadius: '16px', display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold' }}>CLIENTE</label>
              <input
                value={osEditando.nomeCliente || ''}
                onChange={(e) => setOsEditando({ ...osEditando, nomeCliente: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '12px', fontWeight: 'bold' }}>PLACA</label>
                <input
                  value={osEditando.placa || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, placa: normalizarPlaca(e.target.value) })}
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', fontWeight: 'bold', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>VEÍCULO</label>
                  <input
                    value={osEditando.modelo || ''}
                    onChange={(e) => setOsEditando({ ...osEditando, modelo: e.target.value })}
                    placeholder="Gol"
                    style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>ANO</label>
                  <input
                    value={osEditando.ano || ''}
                    onChange={(e) => setOsEditando({ ...osEditando, ano: e.target.value })}
                    placeholder="2020"
                    style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>MOTOR</label>
                  <input
                    value={osEditando.motor || ''}
                    onChange={(e) => setOsEditando({ ...osEditando, motor: e.target.value })}
                    placeholder="1.6"
                    style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <SpeechTextarea
              label="SERVIÇO"
              value={osEditando.checklist || ''}
              onChange={(value) => setOsEditando({ ...osEditando, checklist: value })}
              rows={4}
              placeholder="Descreva os serviços executados..."
              labelStyle={{ color: '#888', fontSize: '12px', fontWeight: 'bold' }}
            />
            
            <SpeechTextarea
              label="PEÇAS E OBSERVAÇÕES"
              value={osEditando.detalhesPecas || ''}
              onChange={(value) => setOsEditando({ ...osEditando, detalhesPecas: value })}
              rows={3}
              placeholder="Descreva peças e observações..."
              labelStyle={{ color: '#888', fontSize: '12px', fontWeight: 'bold' }}
            />

            <div style={{ borderTop: '1px solid #222', marginTop: '10px', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', fontWeight: 900, color: MAIN, textTransform: 'uppercase', letterSpacing: '1px' }}>💰 Preço de Venda ao Cliente</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>VALOR COBRADO PEÇAS (R$)</label>
                  <input
                    type="number"
                    value={osEditando.valorPecas || ''}
                    onChange={(e) => atualizarCampoFinanceiro('valorPecas', e.target.value)}
                    style={{ width: '100%', padding: '15px', background: '#111', border: `1px solid #333`, color: 'white', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>VALOR COBRADO MÃO DE OBRA (R$)</label>
                  <input
                    type="number"
                    value={osEditando.valorMaoObra || ''}
                    onChange={(e) => atualizarCampoFinanceiro('valorMaoObra', e.target.value)}
                    style={{ width: '100%', padding: '15px', background: '#111', border: `1px solid #333`, color: 'white', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO: ASSISTENTE DE LUCRO E INDICADORES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* INPUTS DE CUSTOS REAIS */}
            <div style={{ background: '#0d0d0d', border: '1px solid #333', padding: '25px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '12px' }}>
                <Calculator size={18} style={{ color: MAIN }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Simulador de Custos Reais</h3>
              </div>

              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>CUSTO COMPRA PEÇAS (R$)</label>
                    <input
                      type="number"
                      value={osEditando.custoPecas || ''}
                      onChange={(e) => atualizarCampoFinanceiro('custoPecas', e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '12px', background: '#181818', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>HORAS TÉCNICAS (H)</label>
                    <input
                      type="number"
                      value={osEditando.horasTecnicas || ''}
                      onChange={(e) => atualizarCampoFinanceiro('horasTecnicas', e.target.value)}
                      placeholder="1.0"
                      style={{ width: '100%', padding: '12px', background: '#181818', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>VALOR HORA TÉCNICA (R$/H)</label>
                    <input
                      type="number"
                      value={osEditando.valorHoraTecnica || ''}
                      onChange={(e) => atualizarCampoFinanceiro('valorHoraTecnica', e.target.value)}
                      placeholder="120"
                      style={{ width: '100%', padding: '12px', background: '#181818', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#888', fontSize: '10px', fontWeight: 'bold' }}>IMPOSTOS + TAXAS (%)</label>
                    <input
                      type="number"
                      value={osEditando.taxasImpostos || ''}
                      onChange={(e) => atualizarCampoFinanceiro('taxasImpostos', e.target.value)}
                      placeholder="6"
                      style={{ width: '100%', padding: '12px', background: '#181818', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COMPONENTE LATERAL: ANÁLISE DE LUCRATIVIDADE */}
            <div className={pulseClass} style={{ background: corFundoSaude, border: `1px solid ${corSaude}33`, padding: '25px', borderRadius: '20px', transition: 'all 0.3s', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: corSaude, fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Análise de Lucratividade</h3>
                <div style={{ background: `${corSaude}22`, color: corSaude, padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>Saúde</div>
              </div>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <span style={{ display: 'block', fontSize: '9px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Margem Líquida Real</span>
                <h1 style={{ fontSize: '56px', margin: '5px 0', fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>
                  {margemLiquida.toFixed(1)}<span style={{ fontSize: '24px', color: corSaude }}>%</span>
                </h1>
                <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '10px' }}>
                  <DollarSign size={14} style={{ color: corSaude }} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ccc' }}>Lucro Limpo: </span>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>{formatarMoeda(lucroLimpo)}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <AlertTriangle size={20} style={{ color: corSaude, flexShrink: 0 }} />
                <p style={{ fontSize: '11px', margin: 0, fontWeight: 800, color: corSaude, lineHeight: 1.4 }}>
                  {textoAlerta}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#999' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Custo Total (Peças + Mão de Obra)</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{formatarMoeda(totalCusto)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Impostos & Taxas Operacionais ({taxasImpostos}%)</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{formatarMoeda(taxaAbsoluta)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>VALOR TOTAL DO ORÇAMENTO</span>
                  <span style={{ fontWeight: 900, color: '#fff', fontSize: '16px' }}>{formatarMoeda(totalOS)}</span>
                </div>
              </div>

              {/* BOTÃO ELITE */}
              <button
                onClick={sugerirPrecoElite}
                type="button"
                style={{ width: '100%', marginTop: '20px', background: '#fff', color: '#000', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: '0 10px 20px rgba(255,255,255,0.15)' }}
              >
                <Sparkles size={15} /> SUGERIR PREÇO DE ELITE (25% LIMPO)
              </button>
            </div>
          </div>

        </div>

        {/* BOTÃO SALVAR GLOBAL */}
        <div style={{ marginTop: '30px' }}>
          <button onClick={salvarEdicao} style={{ width: '100%', padding: '20px', background: GREEN, color: 'black', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: `0 15px 35px ${GREEN}44` }}>
            <CheckCircle size={20} /> SALVAR ALTERAÇÕES NA O.S.
          </button>
        </div>

      </div>
    </div>
  );
}
