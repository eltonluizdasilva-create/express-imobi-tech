/* eslint-disable react/prop-types */
import React, { useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { COLORS, TAB_COLORS, formatarData, formatarMoeda } from './constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { jsPDF } from 'jspdf';

const { MAIN, GREEN, BLUE_INFO } = COLORS;
const APP_BASE_URL = 'https://oficina.expresstech.com.br';

export default function ListaOS({ listaCarros, onEditar, onDeletar, onWhatsApp, onBaixar, iniciarEdicao, oficinaId, onMercadoClick }) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const osFiltradas = useMemo(() => {
    return listaCarros.filter((os) => {
      const matchBusca = !busca ||
        (os.placa || '').toLowerCase().includes(busca.toLowerCase()) ||
        (os.modelo || '').toLowerCase().includes(busca.toLowerCase()) ||
        (os.nomeCliente || '').toLowerCase().includes(busca.toLowerCase());

      const matchStatus = filtroStatus === 'todos' ||
        (filtroStatus === 'pendente' && os.statusPagamento !== 'pago') ||
        (filtroStatus === 'pago' && os.statusPagamento === 'pago');

      return matchBusca && matchStatus;
    });
  }, [listaCarros, busca, filtroStatus]);

  const stats = useMemo(() => {
    const total = listaCarros.length;
    const pagas = listaCarros.filter((o) => o.statusPagamento === 'pago').length;
    const pendentes = total - pagas;
    const totalValor = listaCarros.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
    return { total, pagas, pendentes, totalValor };
  }, [listaCarros]);

  const getEstiloServico = (tipo) => {
    const t = (tipo || 'mecanica').toLowerCase();
    const cor = TAB_COLORS[t] || MAIN;
    const labels = {
      mecanica: '🔧 Mecânica',
      eletrica: '⚡ Elétrica',
      hibrido: '🔋 Híbrido',
      moto: '🏍️ Moto',
      funilaria: '🚗 Funilaria',
      amortecedor: '🧰 Amortecedor',
      injecao: '🛠️ Injeção',
      alinhamento: '⚙️ Alinhamento',
      oleo: '🛢️ Óleo',
      pneus: '🛞 Pneus',
      revisao: '🛡️ Revisão',
      lavajato: '🚿 Lava Jato',
      recepcao: '📋 Recepção',
    };
    return { label: labels[t] || labels.mecanica, color: cor };
  };

  const getLabelEditar = (os) => {
    const tipo = (os?.tipo || os?.tipoServico || '').toLowerCase();

    if (tipo === 'oleo') return '🛢️ Editar Óleo';
    if (tipo === 'pneus') return '🛞 Editar Pneu';
    if (tipo === 'alinhamento') return '⚙️ Editar Alinh.';
    if (tipo === 'eletrica') return '⚡ Editar Elétrica';
    if (tipo === 'revisao') return '🛡️ Editar Revisão';
    if (tipo === 'lavajato') return '🚿 Editar Lava Jato';
    if (tipo === 'moto') return '🏍️ Editar Moto';
    if (tipo === 'hibrido') return '🔋 Editar Híbrido';
    if (tipo === 'funilaria') return '🚗 Editar Funilaria';
    if (tipo === 'amortecedor') return '🧰 Editar Amort.';
    if (tipo === 'injecao') return '🛠️ Editar Injeção';

    return '🟣 Editar Mecânica';
  };

  const acaoEditar = iniciarEdicao || onEditar;

  const compartilharLaudo = (os) => {
    const link = `${APP_BASE_URL}/status/${oficinaId || ''}/${os.id}`;
    const msg = encodeURIComponent(`📋 *Laudo da O.S.*\n🚗 ${os.modelo} (Placa: ${os.placa})\n🛠️ Serviço: ${os.checklist || 'Avaliação'}\n💰 Valor: ${formatarMoeda(os.total)}\n\n🔗 Acesse o laudo completo:\n${link}`);
    const tel = (os.telefone || '').replace(/\D/g, '');

    if (tel) {
      window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
      return;
    }

    navigator.clipboard.writeText(link);
    alert('📋 Link do laudo copiado!');
  };

  const enviarPortalCliente = (os) => {
    const link = `${APP_BASE_URL}/status/${oficinaId || ''}/${os.id}`;
    const senha = os.senhaConsulta || 'Não gerada';
    const msg = `Olá! Acompanhe o serviço do seu veículo placa ${os.placa} pelo nosso portal VIP. Acesse: ${link} e use a senha: ${senha}`;
    const tel = (os.telefone || '').replace(/\D/g, '');

    if (tel) {
      window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      navigator.clipboard.writeText(link);
      alert('📋 Link copiado! Telefone não cadastrado para WhatsApp.');
    }
  };

  const gerarReciboPDF = async (os) => {
    if (!oficinaId) return;
    try {
      const [configSnap, osSnap] = await Promise.all([
        getDoc(doc(db, 'oficinas', oficinaId)),
        getDoc(doc(db, 'oficinas', oficinaId, 'os', os.id)),
      ]);
      const cfg = configSnap.exists() ? configSnap.data() : {};
      const dados = osSnap.exists() ? osSnap.data() : {};

      const doc_ = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
      const W = 148;
      const H = 210;
      const ML = 15;
      const MR = 15;
      const MX = ML;
      const MW = W - ML - MR;
      let y = 15;

      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(16);
      doc_.setTextColor(20, 20, 20);
      const nomeOficina = cfg.nome || 'Oficina';
      doc_.text(nomeOficina.toUpperCase(), W / 2, y, { align: 'center' });
      y += 6;

      doc_.setFont('helvetica', 'normal');
      doc_.setFontSize(8);
      doc_.setTextColor(80, 80, 80);
      if (cfg.cnpj) { doc_.text(`CNPJ: ${cfg.cnpj}`, W / 2, y, { align: 'center' }); y += 4; }
      if (cfg.endereco) { doc_.text(cfg.endereco, W / 2, y, { align: 'center' }); y += 4; }
      if (cfg.telefone) { doc_.text(`TEL: ${cfg.telefone}`, W / 2, y, { align: 'center' }); y += 4; }

      y += 2;
      doc_.setDrawColor(180, 180, 180);
      doc_.setLineWidth(0.3);
      doc_.line(ML, y, W - MR, y);
      y += 6;

      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(13);
      doc_.setTextColor(255, 0, 51);
      doc_.text(`ORDEM DE SERVICO #${(os.id || '').slice(-5).toUpperCase()}`, W / 2, y, { align: 'center' });
      y += 7;

      doc_.setFont('helvetica', 'normal');
      doc_.setFontSize(8);
      doc_.setTextColor(80, 80, 80);
      const dataStr = String(dados.data || '').split(',')[0] || '';
      doc_.text(`Data: ${dataStr}`, ML, y); y += 5;

      y += 2;
      doc_.setDrawColor(200, 200, 200);
      doc_.line(ML, y, W - MR, y);
      y += 5;

      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(9);
      doc_.setTextColor(40, 40, 40);
      const campos = [
        ['CLIENTE', (dados.nomeCliente || 'N/A').toUpperCase()],
        ['PLACA', (dados.placa || '').toUpperCase()],
        ['VEICULO', dados.modelo || ''],
        ['KM', dados.kmAtual ? `${Number(dados.kmAtual).toLocaleString('pt-BR')} km` : ''],
      ].filter(([, v]) => v);
      campos.forEach(([label, valor]) => {
        doc_.setFont('helvetica', 'bold');
        doc_.setTextColor(120, 120, 120);
        doc_.setFontSize(8);
        doc_.text(`${label}:`, ML, y);
        doc_.setFont('helvetica', 'bold');
        doc_.setTextColor(20, 20, 20);
        doc_.setFontSize(9);
        doc_.text(valor, ML + 22, y);
        y += 5;
      });

      y += 3;
      doc_.setDrawColor(200, 200, 200);
      doc_.line(ML, y, W - MR, y);
      y += 5;

      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(8);
      doc_.setTextColor(100, 100, 100);
      doc_.text('SERVICO / DEFEITO:', ML, y); y += 4;
      doc_.setFont('helvetica', 'normal');
      doc_.setTextColor(30, 30, 30);
      doc_.setFontSize(8);
      const servicoTexto = dados.checklist || 'Nenhum';
      const linhasServico = doc_.splitTextToSize(servicoTexto, MW);
      doc_.text(linhasServico, ML, y);
      y += linhasServico.length * 4 + 3;

      if (dados.detalhesPecas) {
        doc_.setFont('helvetica', 'bold');
        doc_.setFontSize(8);
        doc_.setTextColor(100, 100, 100);
        doc_.text('PECAS UTILIZADAS:', ML, y); y += 4;
        doc_.setFont('helvetica', 'normal');
        doc_.setTextColor(30, 30, 30);
        doc_.setFontSize(8);
        const pecasTexto = dados.detalhesPecas;
        const linhasPecas = doc_.splitTextToSize(pecasTexto, MW);
        doc_.text(linhasPecas, ML, y);
        y += linhasPecas.length * 4 + 3;
      }

      y += 3;
      doc_.setDrawColor(20, 20, 20);
      doc_.line(ML, y, W - MR, y);
      y += 6;

      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(10);
      doc_.setTextColor(80, 80, 80);
      doc_.text('VALOR TOTAL:', ML, y);
      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(16);
      doc_.setTextColor(0, 100, 0);
      doc_.text(
        dados.total ? Number(dados.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
        W - MR,
        y,
        { align: 'right' }
      );
      y += 10;

      doc_.setDrawColor(200, 200, 200);
      doc_.line(ML, y, W - MR, y);
      y += 5;

      if (cfg.pixKey) {
        doc_.setFont('helvetica', 'bold');
        doc_.setFontSize(8);
        doc_.setTextColor(30, 30, 30);
        doc_.text('PAGAMENTO VIA PIX:', ML, y); y += 4;
        doc_.setFont('helvetica', 'bold');
        doc_.setFontSize(9);
        doc_.setTextColor(0, 0, 0);
        doc_.text(cfg.pixKey, W / 2, y, { align: 'center' }); y += 8;
      }

      if (cfg.garantia) {
        doc_.setFont('helvetica', 'normal');
        doc_.setFontSize(7);
        doc_.setTextColor(100, 100, 100);
        const garantiaTexto = doc_.splitTextToSize(`Garantia: ${cfg.garantia}`, MW);
        doc_.text(garantiaTexto, ML, y);
        y += garantiaTexto.length * 3 + 3;
      }

      y += 3;
      doc_.setFont('helvetica', 'bold');
      doc_.setFontSize(8);
      doc_.setTextColor(100, 100, 100);
      doc_.text('OFICINA IA — Express Tech', W / 2, H - 10, { align: 'center' });

      window.open(doc_.output('bloburl'), '_blank');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o recibo PDF.');
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px' }}>📄</span>
        <h2 style={{ color: '#888', margin: 0, fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>ORDENS DE SERVIÇO</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'TOTAL', val: stats.total, col: 'white' },
          { label: 'PENDENTES', val: stats.pendentes, col: MAIN },
          { label: 'PAGAS', val: stats.pagas, col: GREEN },
          { label: 'VALOR TOTAL', val: formatarMoeda(stats.totalValor), col: GREEN, small: true },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111', borderRadius: '12px', padding: '15px 10px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
            <p style={{ color: '#444', fontSize: '9px', fontWeight: 'bold', margin: '0 0 5px' }}>{s.label}</p>
            <p style={{ color: s.col, fontSize: s.small ? '13px' : '22px', fontWeight: '900', margin: 0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '15px' }}>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="🔍 Procurar por Placa, Modelo ou Cliente..."
          style={{ width: '100%', padding: '16px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: 'white', borderRadius: '12px', fontSize: '14px', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'todos', label: 'Todos', col: BLUE_INFO },
          { key: 'pendente', label: '⏳ Pendentes', col: MAIN },
          { key: 'pago', label: '✅ Pagas', col: GREEN },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltroStatus(f.key)}
            style={{
              padding: '10px 18px',
              background: filtroStatus === f.key ? f.col : '#111',
              color: filtroStatus === f.key ? (f.key === 'pago' ? 'black' : 'white') : '#555',
              border: 'none',
              borderRadius: '25px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {osFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>Nenhuma O.S. encontrada.</div>
        ) : (
          osFiltradas.map((os) => {
            const servico = getEstiloServico(os.tipo || os.tipoServico);
            const pago = os.statusPagamento === 'pago';

            return (
              <div
                key={os.id}
                style={{
                  background: '#111',
                  borderRadius: '16px',
                  border: '1px solid #232323',
                  padding: '14px',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.26)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '14px', alignItems: 'stretch' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: 'white' }}>{os.nomeCliente || 'Cliente'}</h3>
                      <span style={{
                        background: pago ? '#0d2a14' : '#2c0710',
                        color: pago ? '#22c55e' : '#ff4d6d',
                        border: `1px solid ${pago ? '#22c55e' : '#ff3355'}`,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: '900',
                      }}>
                        {pago ? '✅ PAGO' : '⏳ PENDENTE'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ccc', fontWeight: '700' }}>
                      🚗 {os.placa} - {os.modelo}
                    </p>
                    <p style={{ color: '#f59e0b', fontSize: '10px', margin: '0 0 6px 0', fontWeight: '600' }}>
                      🔑 Senha Web: {os.senhaConsulta || 'Não gerada'}
                    </p>
                    <p style={{ color: '#777', fontSize: '11px', margin: '0 0 6px 0' }}>
                      Data: {formatarData(os.data_registro)}
                    </p>
                    {os.kmAtual && (
                      <p style={{ color: '#60a5fa', margin: '0 0 8px 0', fontSize: '11px', fontWeight: '700' }}>
                        📍 {Number(os.kmAtual).toLocaleString()} km
                      </p>
                    )}
                    <span style={{ display: 'inline-block', marginBottom: '8px', padding: '4px 8px', background: `${servico.color}22`, color: servico.color, borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                      {servico.label}
                    </span>
                    <p style={{ color: GREEN, fontSize: '30px', fontWeight: '900', margin: '6px 0 0 0' }}>
                      {formatarMoeda(os.total)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => enviarPortalCliente(os)}
                      style={{ padding: '9px 12px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '900' }}
                    >
                      💬 ENVIAR PORTAL AO CLIENTE
                    </button>

                    <button
                      onClick={() => onMercadoClick?.(os)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={16} /> COMPRAR PEÇAS
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        onClick={() => onWhatsApp?.(os, 'orcamento')}
                        style={{ padding: '8px 6px', background: '#128C7E', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}
                      >
                        🟡 Orçamento
                      </button>
                      {pago ? (
                        <button
                          disabled
                          style={{ padding: '8px 6px', background: '#0a0a0a', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}
                        >
                          ✅ Recebido
                        </button>
                      ) : (
                        <button
                          onClick={() => onBaixar?.(os)}
                          style={{ padding: '8px 6px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}
                        >
                          🟢 Cobrar PIX
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => compartilharLaudo(os)}
                      style={{ padding: '8px 6px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '900', width: '100%' }}
                    >
                      📋 COMPARTILHAR LAUDO
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <button
                        onClick={() => !pago && acaoEditar?.(os)}
                        disabled={pago}
                        title={pago ? 'O.S. Paga não pode ser editada. Ver no Histórico.' : 'Editar O.S.'}
                        style={{
                          padding: '8px 6px',
                          background: pago ? '#2a2a2a' : '#321453',
                          color: pago ? '#777' : '#d8b4fe',
                          border: `1px solid ${pago ? '#444' : '#8b5cf6'}`,
                          borderRadius: '6px',
                          cursor: pago ? 'not-allowed' : 'pointer',
                          fontSize: '10px',
                          fontWeight: '900',
                          lineHeight: '1.15',
                        }}
                      >
                        {pago ? '🔒 Bloqueado' : getLabelEditar(os)}
                      </button>
                      <button
                        onClick={() => gerarReciboPDF(os)}
                        style={{ padding: '8px 6px', background: '#5b5b5b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}
                      >
                        🧾 Recibo PDF
                      </button>
                      <button
                        onClick={() => onDeletar?.(os.id)}
                        style={{ padding: '8px 6px', background: '#ff2147', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '900' }}
                      >
                        🗑️ Apagar
                      </button>
                    </div>
                    {pago && (
                      <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '10px', textAlign: 'center' }}>
                        O.S. Paga não pode ser editada. Ver no Histórico.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
