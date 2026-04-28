import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileDown, Lock, PenSquare, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ListaOS({
  listaCarros: listaCarrosProp,
  iniciarEdicao,
  deletarOS,
  enviarWhatsApp,
  abrirMercado,
  t = { text: '#fff', textSoft: '#888', stroke: '#333', card: '#111', bg: '#000' },
  tema = 'escuro',
}) {
  const listaCarros = listaCarrosProp || [];
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const osFiltradas = useMemo(() => {
    return listaCarros.filter((os) => {
      const termo = busca.toLowerCase();
      const matchBusca =
        (os.placa && os.placa.toLowerCase().includes(termo)) ||
        (os.modelo && os.modelo.toLowerCase().includes(termo)) ||
        (os.nomeCliente && os.nomeCliente.toLowerCase().includes(termo));

      const pago = os.statusPagamento === 'pago';
      const matchStatus =
        filtroStatus === 'todos' ? true :
          filtroStatus === 'pagas' ? pago :
            !pago;

      return matchBusca && matchStatus;
    });
  }, [listaCarros, busca, filtroStatus]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(valor) || 0);
  };

  const totalPagas = listaCarros.filter((os) => os.statusPagamento === 'pago').length;
  const totalPendentes = listaCarros.length - totalPagas;

  const handleCobrarPix = (os) => {
    const confirmarBloqueio = window.confirm(
      `Ao cobrar o PIX da placa ${os.placa || 'sem placa'}, a O.S. sera tratada como encerrada apos o pagamento e a edicao sera bloqueada. Deseja continuar?`
    );

    if (!confirmarBloqueio) return;

    enviarWhatsApp(os, 'pagamento');
  };

  const handleEditarOS = (os) => {
    if (os.statusPagamento === 'pago') {
      alert('Esta O.S. ja foi paga e esta encerrada. A edicao foi bloqueada para preservar o registro final do servico.');
      return;
    }

    iniciarEdicao(os);
  };

  const handleBaixarPdf = (os) => {
    const janelaPdf = window.open('', '_blank');

    if (!janelaPdf) {
      alert('O navegador bloqueou a abertura do PDF. Libere os pop-ups e tente novamente.');
      return;
    }

    try {
      const doc = new jsPDF();
      const valorPecas = parseFloat(os.valores?.pecas || os.valorPecas || 0);
      const valorMaoObra = parseFloat(os.valores?.maoObra || os.valorMaoObra || 0);
      const total = parseFloat(os.total || 0);
      const dataHoje = new Date().toLocaleDateString('pt-BR');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('RECIBO DE SERVICO', 105, 20, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text('Express Auto Tech - Sistema de Gestao', 105, 28, { align: 'center' });

      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO ATENDIMENTO', 20, 45);

      doc.setFont('helvetica', 'normal');
      doc.text(`Placa do Veiculo: ${os.placa || 'NAO INFORMADA'}`, 20, 55);
      doc.text(`Tipo de Servico: ${os.tipoServico || os.tipo || 'Manutencao'}`, 20, 65);
      doc.text(`Data da Emissao: ${dataHoje}`, 20, 75);

      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO FINANCEIRO', 20, 95);

      doc.setFont('helvetica', 'normal');
      doc.text(`Total em Pecas: R$ ${valorPecas.toFixed(2)}`, 20, 105);
      doc.text(`Mao de Obra: R$ ${valorMaoObra.toFixed(2)}`, 20, 115);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(34, 197, 94);
      doc.text(`VALOR TOTAL: R$ ${total.toFixed(2)}`, 20, 135);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Este recibo comprova a prestacao dos servicos listados acima.', 105, 275, { align: 'center' });

      doc.autoPrint();

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      janelaPdf.document.open();
      janelaPdf.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <title>Recibo ${os.placa || ''}</title>
            <style>
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                background: #111;
              }

              iframe {
                width: 100%;
                height: 100%;
                border: 0;
              }
            </style>
          </head>
          <body>
            <iframe id="pdf-frame" src="${pdfUrl}"></iframe>
            <script>
              const frame = document.getElementById('pdf-frame');
              frame.addEventListener('load', () => {
                setTimeout(() => {
                  try {
                    frame.contentWindow.focus();
                    frame.contentWindow.print();
                  } catch (printError) {
                    window.print();
                  }
                }, 500);
              });
            <\/script>
          </body>
        </html>
      `);
      janelaPdf.document.close();

      const limparBlob = () => URL.revokeObjectURL(pdfUrl);
      janelaPdf.addEventListener('beforeunload', limparBlob, { once: true });
    } catch (error) {
      janelaPdf.close();
      console.error('Erro ao gerar o PDF:', error);
      alert('Houve um erro ao tentar gerar o recibo. Tente novamente.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 flex flex-col items-center justify-center border-2" style={{ background: t.card, borderColor: t.stroke }}>
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total</span>
          <span className="text-3xl font-black" style={{ color: t.text }}>{listaCarros.length}</span>
        </div>

        <div className="rounded-xl p-4 flex flex-col items-center justify-center border-2" style={{ background: t.card, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <span className="text-red-500/70 text-xs font-black uppercase tracking-widest mb-1">Pendentes</span>
          <span className="text-red-500 text-3xl font-black">{totalPendentes}</span>
        </div>

        <div className="rounded-xl p-4 flex flex-col items-center justify-center border-2" style={{ background: t.card, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <span className="text-emerald-500/70 text-xs font-black uppercase tracking-widest mb-1">Pagas</span>
          <span className="text-emerald-500 text-3xl font-black">{totalPagas}</span>
        </div>
      </div>

      <div className="rounded-xl p-2 flex items-center gap-2 border" style={{ background: t.card, borderColor: t.stroke }}>
        <Search className="text-zinc-500 ml-2" size={20} />
        <input
          type="text"
          placeholder="Procurar por Placa, Modelo ou Cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="bg-transparent border-none outline-none flex-1 p-2"
          style={{ color: t.text }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFiltroStatus('todos')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filtroStatus === 'todos' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
        >
          Todos
        </button>

        <button
          onClick={() => setFiltroStatus('pendentes')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${filtroStatus === 'pendentes' ? 'bg-red-600/20 text-red-500 border border-red-500/50' : 'bg-zinc-800 text-zinc-400'}`}
        >
          Pendente
        </button>

        <button
          onClick={() => setFiltroStatus('pagas')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${filtroStatus === 'pagas' ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/50' : 'bg-zinc-800 text-zinc-400'}`}
        >
          Pagas
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {osFiltradas.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">Nenhuma O.S. encontrada.</div>
        ) : (
          osFiltradas.map((os) => {
            const pago = os.statusPagamento === 'pago';
            const isDemo = !!os.isDemo;

            return (
              <div
                key={os.id}
                className={`flex flex-col md:flex-row justify-between p-4 md:p-6 rounded-2xl border-2 transition-all ${isDemo
                  ? 'bg-amber-950/10 border-amber-500/40 hover:border-amber-400/60'
                  : pago
                    ? 'bg-emerald-950/20 border-emerald-900/30'
                    : 'border-2'
                  }`}
                style={{ background: pago ? 'rgba(16, 185, 129, 0.1)' : t.card, borderColor: t.stroke }}
              >
                {isDemo && (
                  <div className="w-full mb-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 -mt-1">
                    <span className="text-amber-400 text-sm">Teste</span>
                    <p className="text-amber-400 text-[11px] font-bold leading-tight">
                      <span className="font-black uppercase tracking-widest">O.S. de Demonstracao</span> - Use para testar a Secretaria IA, o botao de PIX e os Laudos.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight" style={{ color: t.text }}>{os.placa}</h3>

                    {isDemo && (
                      <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-[10px] font-black tracking-widest border border-amber-500/30">
                        DEMO
                      </span>
                    )}

                    {pago ? (
                      <span className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded text-[10px] font-black tracking-widest flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 size={12} /> PAGO
                      </span>
                    ) : (
                      <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-[10px] font-black tracking-widest flex items-center gap-1 border border-red-500/30">
                        <AlertCircle size={12} /> PENDENTE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm md:text-base">
                    <span>{os.modelo || 'N/I'}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-yellow-500">{os.senha_web || os.senhaConsulta || 'S/S'}</span>
                  </div>

                  <div className="text-zinc-500 text-xs">
                    Data: {(() => {
                      if (!os.data) return 'N/I';
                      try {
                        const d = os.data.toDate ? os.data.toDate() : new Date(os.data);
                        return isNaN(d.getTime()) ? 'N/I' : d.toLocaleDateString('pt-BR');
                      } catch (e) {
                        return 'N/I';
                      }
                    })()}
                  </div>

                  <div className="mt-2 inline-flex items-center gap-2 bg-emerald-900/30 text-emerald-500 px-3 py-1 rounded-lg w-fit border border-emerald-900/50">
                    <PenSquare size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">{os.tipoServico || os.tipo || 'Mecanica'}</span>
                  </div>

                  <div className="text-3xl md:text-4xl font-black mt-4 text-emerald-500">
                    {formatarMoeda(os.total)}
                  </div>
                </div>

                <div className="w-full md:w-auto md:min-w-[280px] flex flex-col gap-2 shrink-0 relative z-10 mt-6 md:mt-0 pr-14 md:pr-0">
                  <button
                    onClick={() => enviarWhatsApp(os, 'link')}
                    className="w-full bg-[#00A859] hover:bg-[#008f4c] text-white py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    Enviar portal ao cliente
                  </button>

                  <button
                    onClick={() => abrirMercado(os)}
                    className="w-full bg-[#FFE600] hover:bg-[#e5cf00] text-black py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Comprar pecas
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => enviarWhatsApp(os, 'orcamento')}
                      className="bg-[#B12A2A] hover:bg-[#912222] text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                    >
                      Orcamento
                    </button>

                    <button
                      onClick={() => handleCobrarPix(os)}
                      className="bg-[#00D455] hover:bg-[#00b347] text-black py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                    >
                      Cobrar PIX
                    </button>
                  </div>

                  <button
                    onClick={() => enviarWhatsApp(os, 'laudo')}
                    className="w-full bg-[#7D3C98] hover:bg-[#64307a] text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    Compartilhar laudo
                  </button>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleEditarOS(os)}
                      disabled={pago}
                      title={pago ? 'O.S. paga e encerrada. Edicao bloqueada.' : `Editar ${os.tipoServico || 'Mecanica'}`}
                      className={pago
                        ? 'border-2 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 cursor-not-allowed opacity-90'
                        : 'bg-transparent border-2 border-[#7D3C98] text-[#7D3C98] hover:bg-[#7D3C98] hover:text-white py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1'}
                      style={pago ? { background: t.card, borderColor: t.stroke, color: t.textMute } : {}}
                    >
                      {pago ? <Lock size={14} /> : null}
                      {pago ? 'Edicao bloqueada' : `Editar ${os.tipoServico || 'Mecanica'}`}
                    </button>

                    <button
                      onClick={() => handleBaixarPdf(os)}
                      className="hover:bg-zinc-700 text-white py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                      style={{ background: t.chipStrong }}
                    >
                      <FileDown size={14} /> Recibo PDF
                    </button>

                    <button
                      onClick={() => deletarOS(os.id)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} /> Apagar
                    </button>
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
