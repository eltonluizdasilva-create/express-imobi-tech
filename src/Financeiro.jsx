/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useOficina } from './components/OficinaContext';
import { parseMoedaBR } from './hooks/useQuickActions';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Minus,
  Calendar,
  Send,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Save,
  Clock,
  Building2,
} from 'lucide-react';

const isSaidaTipo = (tipo) => tipo === 'saida' || tipo === 'despesa';

const ATALHOS_LANCAMENTO_IMOBI = [
  { label: '+ Comissão Venda (6%)', tipo: 'entrada', desc: 'Comissão de Intermediação de Venda' },
  { label: '+ Taxa Locação', tipo: 'entrada', desc: 'Taxa de Administração de Locação' },
  { label: '+ Sinal / Arras', tipo: 'entrada', desc: 'Recebimento de Sinal de Negócio' },
  { label: '- Tráfego Meta Ads', tipo: 'saida', desc: 'Investimento em Campanhas Meta Ads' },
  { label: '- Portal Imobiliário', tipo: 'saida', desc: 'Anúncios em Portal Imobiliário' },
  { label: '- Repasse Corretor', tipo: 'saida', desc: 'Repasse de Comissão a Corretor Parceiro' },
];

export default function Financeiro({
  oficinaId: oficinaIdProp,
  imobiliariaId: imobiliariaIdProp,
  listaFinanceiro,
  listaImoveis = [],
  listaLeads = [],
  onSalvo,
}) {
  const { oficinaId: oficinaIdContext } = useOficina() || {};
  const oficinaId = useMemo(() => {
    if (imobiliariaIdProp) return imobiliariaIdProp;
    if (oficinaIdProp) return oficinaIdProp;
    if (oficinaIdContext) return oficinaIdContext;
    try {
      return localStorage.getItem('imobiliariaId') || localStorage.getItem('oficinaId') || '';
    } catch {
      return '';
    }
  }, [imobiliariaIdProp, oficinaIdProp, oficinaIdContext]);

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [pagamento, setPagamento] = useState('PIX');
  const [tipoTransacao, setTipoTransacao] = useState('entrada');
  const [salvando, setSalvando] = useState(false);
  const [avisoSucesso, setAvisoSucesso] = useState('');

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [snapshotCarregado, setSnapshotCarregado] = useState(false);

  // Filtros e Provisão de Equipe / Estrutura
  const [filtroPeriodo, setFiltroPeriodo] = useState('Mensal');
  const [valorSemanal, setValorSemanal] = useState(800);
  const [valorQuinzenal, setValorQuinzenal] = useState(1500);

  const carregarDados = useCallback(() => {
    if (!oficinaId) return undefined;

    const refFin = collection(db, 'oficinas', oficinaId, 'financeiro');
    const unsubscribe = onSnapshot(
      refFin,
      (snapshot) => {
        const listaTemp =
          (snapshot?.docs || [])?.map((documento) => ({
            id: documento.id,
            ...documento.data(),
          })) || [];
        setMovimentacoes(listaTemp);
        setSnapshotCarregado(true);
      },
      (err) => {
        console.error('[Financeiro Imobi] Erro no listener:', err);
      }
    );

    return unsubscribe;
  }, [oficinaId]);

  useEffect(() => {
    const unsubscribe = carregarDados();
    return () => unsubscribe && unsubscribe();
  }, [carregarDados]);

  // Transações normalizadas e ordenadas (prioriza o listener ao vivo do Firestore)
  const transacoesEfetivas = useMemo(() => {
    const base = snapshotCarregado
      ? movimentacoes
      : Array.isArray(movimentacoes) && movimentacoes.length > 0
      ? movimentacoes
      : Array.isArray(listaFinanceiro)
      ? listaFinanceiro
      : [];

    return (base || [])
      ?.map((t) => {
        let dataTransacao;
        try {
          if (t?.data?.toDate) {
            dataTransacao = t.data.toDate();
          } else if (t?.data) {
            dataTransacao = new Date(t.data);
          } else {
            dataTransacao = new Date();
          }
        } catch {
          dataTransacao = new Date();
        }
        if (isNaN(dataTransacao.getTime())) dataTransacao = new Date();
        return {
          ...t,
          valor: Number(t?.valor ?? t?.total) || 0,
          dataTransacao,
        };
      })
      .sort((a, b) => b.dataTransacao.getTime() - a.dataTransacao.getTime());
  }, [snapshotCarregado, movimentacoes, listaFinanceiro]);

  // Métricas de VGV integradas ao Financeiro
  const resumoVGV = useMemo(() => {
    const imoveisArr = Array.isArray(listaImoveis) ? listaImoveis : [];
    const leadsArr = Array.isArray(listaLeads) ? listaLeads : [];
    const vgvImoveis = imoveisArr.reduce((acc, item) => acc + (Number(item?.valor) || 0), 0);
    const vgvLeads = leadsArr.reduce((acc, lead) => acc + (Number(lead?.orcamento || lead?.valor) || 0), 0);
    const vgvTotal = vgvImoveis + vgvLeads;
    return {
      vgvTotal,
      comissaoPrevista6: vgvTotal * 0.06,
    };
  }, [listaImoveis, listaLeads]);

  // Cálculo das datas limite (Período Atual e Período Anterior)
  const bounds = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    let inicioAtual = new Date(hoje);
    let inicioAnterior = new Date(hoje);
    let fimAnterior = new Date(hoje);

    if (filtroPeriodo === 'Hoje') {
      inicioAtual.setHours(0, 0, 0, 0);

      inicioAnterior.setDate(inicioAnterior.getDate() - 1);
      inicioAnterior.setHours(0, 0, 0, 0);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
    } else if (filtroPeriodo === '7 Dias') {
      inicioAtual.setDate(inicioAtual.getDate() - 6);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior.setDate(fimAnterior.getDate() - 7);
      inicioAnterior.setDate(inicioAnterior.getDate() - 13);
      inicioAnterior.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === '15 Dias') {
      inicioAtual.setDate(inicioAtual.getDate() - 14);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior.setDate(fimAnterior.getDate() - 15);
      inicioAnterior.setDate(inicioAnterior.getDate() - 29);
      inicioAnterior.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'Mensal') {
      inicioAtual.setDate(1);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior = new Date(inicioAtual);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setDate(1);
      inicioAnterior.setHours(0, 0, 0, 0);
    } else if (filtroPeriodo === 'Anual') {
      inicioAtual.setMonth(0, 1);
      inicioAtual.setHours(0, 0, 0, 0);

      fimAnterior = new Date(inicioAtual);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setMonth(0, 1);
      inicioAnterior.setHours(0, 0, 0, 0);
    }

    return { inicioAtual, fimAtual: hoje, inicioAnterior, fimAnterior };
  }, [filtroPeriodo]);

  // Filtros e Provisões do período ativo
  const filteredData = useMemo(() => {
    const { inicioAtual, fimAtual, inicioAnterior, fimAnterior } = bounds;

    let receitasAtual = 0;
    let despesasAtual = 0;
    let receitasAnterior = 0;
    let despesasAnterior = 0;

    const lancamentosAtual = [];

    (transacoesEfetivas || []).forEach((t) => {
      const v = Number(t.valor) || 0;
      const isEntrada = !isSaidaTipo(t.tipo);
      const d = t.dataTransacao;

      if (d >= inicioAtual && d <= fimAtual) {
        if (isEntrada) receitasAtual += v;
        else despesasAtual += v;
        lancamentosAtual.push(t);
      } else if (d >= inicioAnterior && d <= fimAnterior) {
        if (isEntrada) receitasAnterior += v;
        else despesasAnterior += v;
      }
    });

    const diffMs = bounds.fimAtual.getTime() - bounds.inicioAtual.getTime();
    const diffDays = Math.max(1, diffMs / (1000 * 60 * 60 * 24));

    let semanasNoPeriodo = diffDays / 7;
    let quinzenasNoPeriodo = diffDays / 15;

    if (filtroPeriodo === 'Mensal') {
      semanasNoPeriodo = 4;
      quinzenasNoPeriodo = 2;
    } else if (filtroPeriodo === 'Anual') {
      semanasNoPeriodo = 52;
      quinzenasNoPeriodo = 24;
    }

    const provisaoFolha = semanasNoPeriodo * valorSemanal + quinzenasNoPeriodo * valorQuinzenal;
    const lucroLiquidoAtual = receitasAtual - despesasAtual;
    const lucroLiquidoAnterior = receitasAnterior - despesasAnterior;

    let projecaoFechamento = receitasAtual;
    if (filtroPeriodo === 'Mensal') {
      const elapsedDays = Math.max(1, new Date().getDate());
      projecaoFechamento = (receitasAtual / elapsedDays) * 30;
    } else if (filtroPeriodo === 'Hoje') {
      projecaoFechamento = receitasAtual * 1.5;
    } else if (filtroPeriodo === '7 Dias') {
      projecaoFechamento = receitasAtual * 1.25;
    } else if (filtroPeriodo === '15 Dias') {
      projecaoFechamento = receitasAtual * 1.15;
    } else if (filtroPeriodo === 'Anual') {
      const elapsedMonths = Math.max(1, new Date().getMonth() + 1);
      projecaoFechamento = (receitasAtual / elapsedMonths) * 12;
    }

    const lucroRealLiquido = lucroLiquidoAtual - provisaoFolha;

    return {
      receitasAtual,
      despesasAtual,
      receitasAnterior,
      despesasAnterior,
      lucroLiquidoAtual,
      lucroLiquidoAnterior,
      provisaoFolha,
      projecaoFechamento,
      lucroRealLiquido,
      lancamentosAtual,
    };
  }, [transacoesEfetivas, bounds, filtroPeriodo, valorSemanal, valorQuinzenal]);

  // Gráfico principal (Realizado vs Projeção)
  const chartData = useMemo(() => {
    const { lancamentosAtual } = filteredData;
    const { fimAtual } = bounds;

    if (filtroPeriodo === 'Hoje') {
      const data = [
        { label: '0h-6h', Realizado: 0, Projeção: 0 },
        { label: '6h-12h', Realizado: 0, Projeção: 0 },
        { label: '12h-18h', Realizado: 0, Projeção: 0 },
        { label: '18h-24h', Realizado: 0, Projeção: 0 },
      ];

      (lancamentosAtual || []).forEach((t) => {
        const h = t.dataTransacao.getHours();
        const v = Number(t.valor) || 0;
        if (!isSaidaTipo(t.tipo)) {
          const idx = Math.min(3, Math.floor(h / 6));
          data[idx].Realizado += v;
          data[idx].Projeção += v * 1.5;
        }
      });
      return data;
    }

    if (filtroPeriodo === '7 Dias') {
      const daysList = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(fimAtual);
        d.setDate(d.getDate() - i);
        daysList.push({
          label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
          dataStr: d.toLocaleDateString('pt-BR'),
          Realizado: 0,
          Projeção: 0,
        });
      }

      (lancamentosAtual || []).forEach((t) => {
        const str = t.dataTransacao.toLocaleDateString('pt-BR');
        const idx = daysList.findIndex((x) => x.dataStr === str);
        if (idx !== -1 && !isSaidaTipo(t.tipo)) {
          const v = Number(t.valor) || 0;
          daysList[idx].Realizado += v;
          daysList[idx].Projeção += v * 1.25;
        }
      });
      return daysList;
    }

    if (filtroPeriodo === '15 Dias') {
      const blocks = [
        { label: 'Dias 1-3', Realizado: 0, Projeção: 0 },
        { label: 'Dias 4-6', Realizado: 0, Projeção: 0 },
        { label: 'Dias 7-9', Realizado: 0, Projeção: 0 },
        { label: 'Dias 10-12', Realizado: 0, Projeção: 0 },
        { label: 'Dias 13-15', Realizado: 0, Projeção: 0 },
      ];

      (lancamentosAtual || []).forEach((t) => {
        const msDiff = fimAtual.getTime() - t.dataTransacao.getTime();
        const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));
        const bIdx = Math.min(4, Math.floor((14 - daysDiff) / 3));
        if (bIdx >= 0 && bIdx <= 4 && !isSaidaTipo(t.tipo)) {
          const v = Number(t.valor) || 0;
          blocks[bIdx].Realizado += v;
          blocks[bIdx].Projeção += v * 1.15;
        }
      });
      return blocks;
    }

    if (filtroPeriodo === 'Mensal') {
      const weeks = [
        { label: 'Semana 1', Realizado: 0, Projeção: 0 },
        { label: 'Semana 2', Realizado: 0, Projeção: 0 },
        { label: 'Semana 3', Realizado: 0, Projeção: 0 },
        { label: 'Semana 4+', Realizado: 0, Projeção: 0 },
      ];

      (lancamentosAtual || []).forEach((t) => {
        const day = t.dataTransacao.getDate();
        const wIdx = Math.min(3, Math.floor((day - 1) / 7));
        if (!isSaidaTipo(t.tipo)) {
          const v = Number(t.valor) || 0;
          weeks[wIdx].Realizado += v;
          weeks[wIdx].Projeção += v * 1.35;
        }
      });
      return weeks;
    }

    if (filtroPeriodo === 'Anual') {
      const months = [
        { label: 'Jan', Realizado: 0, Projeção: 0 },
        { label: 'Fev', Realizado: 0, Projeção: 0 },
        { label: 'Mar', Realizado: 0, Projeção: 0 },
        { label: 'Abr', Realizado: 0, Projeção: 0 },
        { label: 'Mai', Realizado: 0, Projeção: 0 },
        { label: 'Jun', Realizado: 0, Projeção: 0 },
        { label: 'Jul', Realizado: 0, Projeção: 0 },
        { label: 'Ago', Realizado: 0, Projeção: 0 },
        { label: 'Set', Realizado: 0, Projeção: 0 },
        { label: 'Out', Realizado: 0, Projeção: 0 },
        { label: 'Nov', Realizado: 0, Projeção: 0 },
        { label: 'Dez', Realizado: 0, Projeção: 0 },
      ];

      (lancamentosAtual || []).forEach((t) => {
        const mIdx = t.dataTransacao.getMonth();
        if (!isSaidaTipo(t.tipo)) {
          const v = Number(t.valor) || 0;
          months[mIdx].Realizado += v;
          months[mIdx].Projeção += v * 1.25;
        }
      });
      return months;
    }

    return [];
  }, [filteredData, filtroPeriodo, bounds]);

  // Gráfico de comparação (Período Atual vs Anterior)
  const comparisonChartData = useMemo(() => {
    const { inicioAnterior, fimAnterior } = bounds;

    const data = (chartData || [])?.map((cd) => ({
      ...cd,
      Atual: cd.Realizado,
      Anterior: 0,
    }));

    (transacoesEfetivas || []).forEach((t) => {
      const d = t.dataTransacao;
      if (d >= inicioAnterior && d <= fimAnterior && !isSaidaTipo(t.tipo)) {
        const v = Number(t.valor) || 0;
        if (filtroPeriodo === 'Hoje') {
          const h = d.getHours();
          const idx = Math.min(3, Math.floor(h / 6));
          if (data[idx]) data[idx].Anterior += v;
        } else if (filtroPeriodo === '7 Dias') {
          const daysDiff = Math.floor((fimAnterior.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          const idx = Math.min(6, Math.max(0, 6 - daysDiff));
          if (data[idx]) data[idx].Anterior += v;
        } else if (filtroPeriodo === '15 Dias') {
          const daysDiff = Math.floor((fimAnterior.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          const idx = Math.min(4, Math.floor((14 - daysDiff) / 3));
          if (data[idx]) data[idx].Anterior += v;
        } else if (filtroPeriodo === 'Mensal') {
          const day = d.getDate();
          const idx = Math.min(3, Math.floor((day - 1) / 7));
          if (data[idx]) data[idx].Anterior += v;
        } else if (filtroPeriodo === 'Anual') {
          const mIdx = d.getMonth();
          if (data[mIdx]) data[mIdx].Anterior += v;
        }
      }
    });

    return data;
  }, [chartData, bounds, transacoesEfetivas, filtroPeriodo]);

  const handleAdicionar = async (e) => {
    if (e) e.preventDefault();
    const valorNumero = parseMoedaBR(valor);
    if (!descricao.trim() || valorNumero <= 0) {
      alert('⚠️ Preencha a descrição e um valor válido!');
      return;
    }

    setSalvando(true);
    try {
      const tipoNormalizado = isSaidaTipo(tipoTransacao) ? 'saida' : 'entrada';
      const novoRegistro = {
        descricao: descricao.trim(),
        valor: valorNumero,
        pagamento,
        tipo: tipoNormalizado,
        data: new Date().toISOString(),
      };

      if (oficinaId) {
        await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), novoRegistro);
      } else {
        setMovimentacoes((prev) => [{ id: `local_${Date.now()}`, ...novoRegistro }, ...(prev || [])]);
        setSnapshotCarregado(true);
      }

      // Fluxo Automatizado PLG/Fiscal: Liquidação de Receita dispara geração automática de NFS-e ADN + Recibo de Repasse
      if (tipoNormalizado === 'entrada') {
        try {
          const isLocacao = /loca|alug/i.test(descricao);
          const taxaAdmPerc = isLocacao ? 10 : 100;
          const baseTributavel = isLocacao ? valorNumero * 0.1 : valorNumero;
          const valorRepasseProprietario = isLocacao ? valorNumero * 0.9 : 0;
          const chaveADN = `352611${Math.floor(10000000000000 + Math.random() * 89999999999999)}0001995600000000${Math.floor(100000 + Math.random() * 899999)}`;
          const nfAuto = {
            id: `nf_auto_${Date.now()}`,
            numeroNfse: String(Math.floor(2026000 + Math.random() * 999)),
            chaveAcessoADN: chaveADN,
            modalidade: isLocacao ? 'Locação com Repasse (Split)' : 'Comissão de Corretagem / Venda',
            clienteNome: descricao.trim(),
            clienteDoc: 'Automático via Liquidação Financeira',
            clienteWhatsapp: '',
            imovelRef: isLocacao ? 'Contrato de Locação Ativo' : 'Escritura / Proposta Fechada',
            valorBrutoOperacao: valorNumero,
            valorRepasseProprietario,
            taxaAdmPerc,
            baseCalculoTributavel: baseTributavel,
            aliquotaIssAtual: 3.0,
            valorIssAtual: +(baseTributavel * 0.03).toFixed(2),
            aliquotaIbsCbsEfetiva: 13.25,
            valorIbsEstimado: +(baseTributavel * 0.0885).toFixed(2),
            valorCbsEstimado: +(baseTributavel * 0.044).toFixed(2),
            statusADN: 'Emitida Automaticamente (Webhook Financeiro → ADN)',
            origemFinanceiro: true,
            pagamento,
            dataEmissao: new Date().toISOString(),
          };
          const listaAtual = JSON.parse(localStorage.getItem('notas_fiscais_imobi_auto') || '[]');
          localStorage.setItem(
            'notas_fiscais_imobi_auto',
            JSON.stringify([nfAuto, ...(Array.isArray(listaAtual) ? listaAtual : [])].slice(0, 50))
          );
        } catch (errAuto) {
          console.warn('Aviso ao sincronizar webhook fiscal automático:', errAuto);
        }
      }

      setDescricao('');
      setValor('');
      setPagamento('PIX');
      setAvisoSucesso(
        tipoNormalizado === 'entrada'
          ? `✅ Receita de ${formatCurrency(valorNumero)} liquidada! 📄 NFS-e Nacional (ADN) + Recibo de Repasse gerados automaticamente!`
          : `✅ Despesa/Repasse de ${formatCurrency(valorNumero)} registada com sucesso!`
      );
      setTimeout(() => setAvisoSucesso(''), 3500);
      if (typeof onSalvo === 'function') onSalvo();
    } catch (error) {
      alert('❌ Erro ao registar movimentação: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (idDaTransacao) => {
    if (!idDaTransacao) return;
    if (!window.confirm('Deseja estornar e remover este lançamento financeiro?')) return;

    try {
      if (oficinaId && !String(idDaTransacao).startsWith('local_')) {
        await deleteDoc(doc(db, 'oficinas', oficinaId, 'financeiro', idDaTransacao));
      } else {
        setMovimentacoes((prev) => (prev || []).filter((item) => item.id !== idDaTransacao));
      }
      if (typeof onSalvo === 'function') onSalvo();
    } catch (error) {
      alert('❌ Erro ao estornar: ' + error.message);
    }
  };

  const enviarRelatorioWhatsApp = () => {
    const msg = `📊 *RESUMO FINANCEIRO & VGV — EXPRESS IMOBI TECH*\n\n📅 *Período:* ${filtroPeriodo}\n🏢 *VGV em Carteira:* ${formatCurrency(resumoVGV.vgvTotal)}\n💎 *Comissão Prevista (6%):* ${formatCurrency(resumoVGV.comissaoPrevista6)}\n\n💰 *Comissões / Receitas Recebidas:* ${formatCurrency(filteredData.receitasAtual)}\n📉 *Despesas / Repasses:* ${formatCurrency(filteredData.despesasAtual)}\n✅ *Saldo Operacional:* ${formatCurrency(filteredData.lucroLiquidoAtual)}\n\n_Gerado por Express Imobi Tech_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      style={{ backgroundColor: '#020408' }}
      className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans rounded-3xl"
    >
      {/* HERO & FILTERS SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-[#10b981]/30 bg-slate-900/90 p-6 shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#10b981]">
              <Sparkles size={14} />
              Financeiro & VGV
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl uppercase">
              GESTÃO <span style={{ color: '#10b981' }}>FINANCEIRA & VGV</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Projeção de comissões, controle de fluxo de caixa da imobiliária e acompanhamento em tempo real do Volume Geral de Vendas (VGV) em carteira.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[300px]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Filtrar Período:</p>
            <div className="flex flex-wrap gap-2">
              {['Hoje', '7 Dias', '15 Dias', 'Mensal', 'Anual']?.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setFiltroPeriodo(opcao)}
                  style={filtroPeriodo === opcao ? { backgroundColor: '#10b981' } : undefined}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    filtroPeriodo === opcao
                      ? 'text-slate-950 font-black shadow-lg shadow-[#10b981]/30'
                      : 'bg-[#020408] border border-slate-800 text-slate-400 hover:text-white hover:border-[#10b981]'
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROVISION SECTION: EQUIPE & CUSTO FIXO IMOBILIÁRIO */}
      <section className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#10b981] flex items-center gap-2">
              <Building2 size={16} /> Provisão Operacional (Equipe, Portais & Tráfego)
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Ajuste os custos recorrentes da operação imobiliária para apurar o Resultado Líquido Real.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Custo Semanal (R$)
              </span>
              <input
                type="number"
                value={valorSemanal}
                onChange={(e) => setValorSemanal(Number(e.target.value) || 0)}
                className="w-full rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3 text-sm text-white outline-none transition focus:border-[#10b981]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Custo Quinzenal (R$)
              </span>
              <input
                type="number"
                value={valorQuinzenal}
                onChange={(e) => setValorQuinzenal(Number(e.target.value) || 0)}
                className="w-full rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3 text-sm text-white outline-none transition focus:border-[#10b981]"
              />
            </label>
          </div>
        </div>
      </section>

      {/* METRIC CARDS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Comissões & Receitas"
          value={formatCurrency(filteredData.receitasAtual)}
          detail={`Período anterior: ${formatCurrency(filteredData.receitasAnterior)}`}
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          title="Despesas & Repasses"
          value={formatCurrency(filteredData.despesasAtual)}
          detail={`Período anterior: ${formatCurrency(filteredData.despesasAnterior)}`}
          icon={<TrendingDown size={20} />}
        />
        <MetricCard
          title="Comissão Prevista (VGV 6%)"
          value={formatCurrency(resumoVGV.comissaoPrevista6)}
          detail={`VGV Carteira: ${formatCurrency(resumoVGV.vgvTotal)}`}
          icon={<Calendar size={20} />}
        />
        <MetricCard
          title="Saldo Operacional"
          value={formatCurrency(filteredData.lucroLiquidoAtual)}
          detail={`Após provisão: ${formatCurrency(filteredData.lucroRealLiquido)}`}
          icon={<Wallet size={20} />}
        />
      </section>

      {/*CREATE TRANSACTION FORM & RECENT HISTORY (Positioned prominently so user registers & sees immediately) */}
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {/* ADD TRANSACTION FORM */}
        <div className="rounded-[26px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl h-fit">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#10b981]">Novo Lançamento Imobiliário</p>
            <h2 className="mt-1 text-xl font-bold text-white">Registar Comissão ou Despesa</h2>
          </div>

          {avisoSucesso && (
            <div className="mb-4 rounded-xl border border-[#10b981] bg-[#10b981]/15 px-4 py-2.5 text-xs font-bold text-[#10b981]">
              {avisoSucesso}
            </div>
          )}

          {/* Atalhos rápidos 1 clique */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Preenchimento Rápido:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(ATALHOS_LANCAMENTO_IMOBI || [])?.map((at) => (
                <button
                  key={at.label}
                  type="button"
                  onClick={() => {
                    setTipoTransacao(at.tipo);
                    setDescricao(at.desc);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#020408] border border-slate-800 hover:border-[#10b981] text-[10px] font-bold text-slate-300 hover:text-[#10b981] transition cursor-pointer"
                >
                  {at.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAdicionar} className="space-y-4">
            <div className="flex w-full bg-[#020408] border border-slate-800 rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setTipoTransacao('entrada')}
                style={tipoTransacao === 'entrada' ? { backgroundColor: '#10b981' } : undefined}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tipoTransacao === 'entrada' ? 'text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus size={14} /> COMISSÃO / ENTRADA
              </button>
              <button
                type="button"
                onClick={() => setTipoTransacao('saida')}
                style={isSaidaTipo(tipoTransacao) ? { backgroundColor: '#10b981' } : undefined}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSaidaTipo(tipoTransacao) ? 'text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Minus size={14} /> DESPESA / REPASSE
              </button>
            </div>

            <Field
              label="Descrição do Lançamento"
              value={descricao}
              onChange={setDescricao}
              placeholder={
                tipoTransacao === 'entrada'
                  ? 'Ex: Comissão Venda Apto Jardins (6%)'
                  : 'Ex: Repasse Corretor / Anúncio Portal ZAP'
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Valor (R$)"
                type="text"
                value={valor}
                onChange={setValor}
                placeholder="Ex: 15.000,00"
              />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Meio de Pagamento
                </span>
                <select
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3 text-sm text-white outline-none transition focus:border-[#10b981]"
                >
                  <option value="PIX">PIX</option>
                  <option value="Transferência TED">Transferência TED</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={salvando}
              style={{ backgroundColor: '#10b981' }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-sm uppercase tracking-widest text-slate-950 transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg shadow-[#10b981]/25"
            >
              <Save size={18} />
              {salvando
                ? 'REGISTANDO...'
                : tipoTransacao === 'entrada'
                ? 'Lançar Comissão / Receita'
                : 'Registar Despesa / Repasse'}
            </button>
          </form>
        </div>

        {/* HISTORY LIST */}
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden flex flex-col">
          <div className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Histórico de Movimentações ({(filteredData.lancamentosAtual || []).length})
              </h2>
              <p className="text-xs text-slate-400">
                Comissões, taxas e despesas registadas no período ({filtroPeriodo})
              </p>
            </div>

            <button
              type="button"
              onClick={enviarRelatorioWhatsApp}
              className="inline-flex items-center gap-2 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-2 text-xs font-bold text-[#10b981] transition hover:bg-[#10b981]/20 cursor-pointer"
            >
              <Send size={15} />
              Relatório WhatsApp
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[480px] overflow-y-auto flex-1">
            {(filteredData.lancamentosAtual || []).length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                Nenhuma movimentação registada neste período. Utilize o formulário ao lado para lançar uma comissão ou despesa.
              </div>
            ) : (
              (filteredData.lancamentosAtual || [])?.map((item) => {
                const ehSaida = isSaidaTipo(item.tipo);
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between px-6 py-4 transition hover:bg-[#020408]/60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981]">
                        {ehSaida ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm group-hover:text-[#10b981] transition-colors">
                          {item.descricao}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />{' '}
                            {item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wallet size={10} /> {item.pagamento || 'PIX'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-extrabold text-[#10b981]">
                            {ehSaida ? 'SAÍDA / REPASSE' : 'ENTRADA / COMISSÃO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-base md:text-lg font-black font-mono text-[#10b981]">
                        {ehSaida ? '- ' : '+ '}
                        {formatCurrency(Number(item.valor))}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemover(item.id)}
                        className="rounded-xl border border-slate-800 hover:border-[#10b981] p-2 text-slate-400 transition hover:bg-[#10b981]/10 hover:text-[#10b981] cursor-pointer"
                        title="Estornar lançamento"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CHARTS SECTION */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[26px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#10b981]">Comissões & Metas</p>
              <h2 className="mt-1 text-xl font-bold text-white">Realizado vs Projeção ({filtroPeriodo})</h2>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: '#020408',
                    border: '1px solid #10b981',
                    borderRadius: '16px',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Projeção" fill="#059669" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar dataKey="Realizado" fill="#10b981" radius={[8, 8, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#10b981]">Evolução de Receita</p>
              <h2 className="mt-1 text-xl font-bold text-white">Este Período vs Período Anterior</h2>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.3 }}
                  contentStyle={{
                    backgroundColor: '#020408',
                    border: '1px solid #10b981',
                    borderRadius: '16px',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Atual" fill="#10b981" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar dataKey="Anterior" fill="#334155" radius={[8, 8, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, detail, icon }) {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <h3 style={{ color: '#10b981' }} className="mt-3 text-2xl font-black">
            {value}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{detail}</p>
        </div>
        <div className="rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 p-3 text-[#10b981]">{icon}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-[#020408] px-4 py-3 text-sm text-white outline-none transition focus:border-[#10b981]"
      />
    </label>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}
