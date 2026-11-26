// src/components/imobi/PosVendaCarteira.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  Send,
  MessageCircle,
  Bot,
  Calendar,
  TrendingUp,
  UserCheck,
  FileText,
  Building2,
  Share2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { processarPosVendaIA } from '../../agent/posVendaCarteiraPrompt';

const VENDAS_DEMONSTRACAO = [
  {
    id: 'venda_1',
    nomeComprador: 'Marcelo Vasconcelos',
    telefone: '11999887766',
    nomeProprietario: 'Construtora Horizonte',
    imovelTitulo: 'Apartamento 3 Suítes — Residencial Jardins',
    codigoImovel: 'IMB-3041',
    valorVenda: 740000,
    dataFechamento: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 28 dias atrás
    nomeCorretor: 'Rodrigo Almeida',
    etapas: {
      assinatura: true,
      cartorio: true,
      chaves: true,
      utilidades: false,
    },
    marcosAcionados: {
      '30_dias': false,
      '6_meses': false,
      '1_ano': false,
    },
  },
  {
    id: 'venda_2',
    nomeComprador: 'Fernanda Ribeiro',
    telefone: '11988776655',
    nomeProprietario: 'Espólio de Souza',
    imovelTitulo: 'Casa em Condomínio Fechado — Alphaville',
    codigoImovel: 'IMB-1180',
    valorVenda: 1250000,
    dataFechamento: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~6 meses atrás
    nomeCorretor: 'Camila Rocha',
    etapas: {
      assinatura: true,
      cartorio: true,
      chaves: true,
      utilidades: true,
    },
    marcosAcionados: {
      '30_dias': true,
      '6_meses': false,
      '1_ano': false,
    },
  },
  {
    id: 'venda_3',
    nomeComprador: 'Dr. Roberto Mendonça',
    telefone: '11977665544',
    nomeProprietario: 'Investimentos Delta',
    imovelTitulo: 'Cobertura Duplex — Jardim Europa',
    codigoImovel: 'IMB-8090',
    valorVenda: 2100000,
    dataFechamento: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~11.5 meses atrás
    nomeCorretor: 'Rodrigo Almeida',
    etapas: {
      assinatura: true,
      cartorio: true,
      chaves: true,
      utilidades: true,
    },
    marcosAcionados: {
      '30_dias': true,
      '6_meses': true,
      '1_ano': false,
    },
  },
];

export default function PosVendaCarteira({ setAbaAtiva }) {
  const [vendas, setVendas] = useState(VENDAS_DEMONSTRACAO);
  const [vendaSelecionadaId, setVendaSelecionadaId] = useState(VENDAS_DEMONSTRACAO[0].id);
  const [marcoAtivo, setMarcoAtivo] = useState('30_dias');
  const [gerandoIA, setGerandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [polenAcionada, setPolenAcionada] = useState(false);
  const [zaraAcionada, setZaraAcionada] = useState(false);

  const vendaAtiva = useMemo(() => {
    return vendas.find((v) => v.id === vendaSelecionadaId) || vendas[0];
  }, [vendas, vendaSelecionadaId]);

  // Calcula os dias decorridos desde o fechamento
  const diasFechamento = useMemo(() => {
    if (!vendaAtiva?.dataFechamento) return 0;
    const dataFim = new Date(vendaAtiva.dataFechamento);
    const hoje = new Date();
    const diff = Math.floor((hoje - dataFim) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [vendaAtiva]);

  // Altera status de uma etapa da timeline
  const alternarEtapa = (chaveEtapa) => {
    setVendas((prev) =>
      prev.map((v) => {
        if (v.id === vendaAtiva.id) {
          const etapasNovas = { ...v.etapas, [chaveEtapa]: !v.etapas[chaveEtapa] };
          return { ...v, etapas: etapasNovas };
        }
        return v;
      })
    );
  };

  // Executa geração de mensagem personalizada de pós-venda com IA
  const gerarMensagemMarco = async (marcoAlvo) => {
    const alvo = marcoAlvo || marcoAtivo;
    setMarcoAtivo(alvo);
    setGerandoIA(true);
    setErro('');
    setPolenAcionada(false);
    setZaraAcionada(false);

    try {
      const res = await processarPosVendaIA({
        nomeComprador: vendaAtiva.nomeComprador,
        nomeProprietario: vendaAtiva.nomeProprietario,
        imovelTitulo: vendaAtiva.imovelTitulo,
        codigoImovel: vendaAtiva.codigoImovel,
        dataFechamento: vendaAtiva.dataFechamento,
        nomeCorretor: vendaAtiva.nomeCorretor,
        marco: alvo,
      });

      setResultadoIA(res);
    } catch (err) {
      setErro(err.message || 'Falha ao gerar mensagem com IA.');
    } finally {
      setGerandoIA(false);
    }
  };

  const copiarMensagem = () => {
    if (!resultadoIA?.mensagemWhatsApp) return;
    try {
      navigator.clipboard?.writeText(resultadoIA.mensagemWhatsApp);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  const enviarWhatsApp = () => {
    const texto = resultadoIA?.mensagemWhatsApp;
    if (!texto) return;
    const telLimpo = (vendaAtiva.telefone || '').replace(/\D/g, '');
    const num = telLimpo ? (telLimpo.startsWith('55') ? telLimpo : `55${telLimpo}`) : '';
    const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const acionarPolen = () => {
    setPolenAcionada(true);
    setTimeout(() => {
      if (typeof setAbaAtiva === 'function') {
        setAbaAtiva('sofia_whatsapp');
      }
    }, 600);
  };

  const acionarZara = () => {
    setZaraAcionada(true);
    setTimeout(() => {
      if (typeof setAbaAtiva === 'function') {
        setAbaAtiva('agentes_ia');
      }
    }, 600);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* ─── CABEÇALHO DO MÓDULO (PLANO PLUS) ───────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 bg-[#020408] p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
              <KeyRound size={13} /> Plano PLUS · Pós-Venda & Carteira LTV
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Pós-Venda, Chaves & Carteira
            </h1>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              Gestão de esteira pós-fechamento (contrato, cartório, chaves e utilidades) e ativação dos 3 marcos de relacionamento (30 dias, 6 meses e 1 ano) para gerar indicações espontâneas e compras de investimento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof setAbaAtiva === 'function') setAbaAtiva('sofia_whatsapp');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <Bot size={14} /> Pólen 24h WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof setAbaAtiva === 'function') setAbaAtiva('agentes_ia');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <TrendingUp size={14} /> Rotina Zara 08:00
            </button>
          </div>
        </div>
      </div>

      {/* ─── GRID: SELETOR DE CLIENTES & LINHA DO TEMPO PÓS-FECHAMENTO ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Clientes e Vendas em Acompanhamento */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <UserCheck size={15} className="text-purple-400" /> Clientes na Carteira ({vendas.length})
            </span>
            <span className="text-[10px] font-bold text-slate-500">Pós-fechamento</span>
          </div>

          <div className="space-y-2.5">
            {vendas.map((v) => {
              const ativo = v.id === vendaAtiva.id;
              const dias = Math.floor((new Date() - new Date(v.dataFechamento)) / (1000 * 60 * 60 * 24));

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVendaSelecionadaId(v.id);
                    setResultadoIA(null);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                    ativo
                      ? 'border-purple-500 bg-[#020408] shadow-md shadow-purple-500/15'
                      : 'border-slate-800 bg-[#020408]/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-black text-white truncate">{v.nomeComprador}</span>
                    <span className="text-[10px] font-bold text-purple-400 shrink-0">
                      há {dias} dias
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{v.imovelTitulo}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                    <span>Corretor: {v.nomeCorretor}</span>
                    <span className="font-bold text-slate-300">{v.codigoImovel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Linha do Tempo e Marcos de Relacionamento */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Linha do Tempo Interativa das 4 Etapas */}
          <div className="rounded-3xl border border-slate-800 bg-[#020408] p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <KeyRound size={16} className="text-purple-400" /> Esteira de Entrega & Posse
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique no status para atualizar o avanço operacional com o cartório e cliente.
                </p>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-xl">
                {diasFechamento} dias de compra
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
              {/* Etapa 1: Assinatura */}
              <div
                onClick={() => alternarEtapa('assinatura')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  vendaAtiva.etapas.assinatura
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Etapa 1</span>
                  {vendaAtiva.etapas.assinatura ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Assinatura de Contrato</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {vendaAtiva.etapas.assinatura ? 'Concluída' : 'Pendente'}
                  </p>
                </div>
              </div>

              {/* Etapa 2: Cartório */}
              <div
                onClick={() => alternarEtapa('cartorio')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  vendaAtiva.etapas.cartorio
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Etapa 2</span>
                  {vendaAtiva.etapas.cartorio ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Registro em Cartório</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {vendaAtiva.etapas.cartorio ? 'Escritura Registrada' : 'Em Prenotação'}
                  </p>
                </div>
              </div>

              {/* Etapa 3: Chaves */}
              <div
                onClick={() => alternarEtapa('chaves')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  vendaAtiva.etapas.chaves
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Etapa 3</span>
                  {vendaAtiva.etapas.chaves ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Entrega de Chaves</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {vendaAtiva.etapas.chaves ? 'Posse Entregue' : 'Agendar Entrega'}
                  </p>
                </div>
              </div>

              {/* Etapa 4: Utilidades */}
              <div
                onClick={() => alternarEtapa('utilidades')}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  vendaAtiva.etapas.utilidades
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Etapa 4</span>
                  {vendaAtiva.etapas.utilidades ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Água, Luz e IPTU</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {vendaAtiva.etapas.utilidades ? 'Transferidas' : 'Pendência Cliente'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Painel dos 3 Marcos de Ouro de Relacionamento */}
          <div className="rounded-3xl border border-slate-800 bg-[#020408] p-5 md:p-6 space-y-5">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Calendar size={16} className="text-emerald-400" /> Os 3 Marcos de Ouro de Relacionamento (LTV)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecione o marco e gere com inteligência artificial a mensagem personalizada para fidelização e indicação de novos compradores.
              </p>
            </div>

            {/* 3 Cartões de Marcos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Marco 30 Dias */}
              <button
                type="button"
                onClick={() => gerarMensagemMarco('30_dias')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  marcoAtivo === '30_dias'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-emerald-400">Marco 1</span>
                  <span className="text-[10px] font-bold text-slate-500">30 Dias</span>
                </div>
                <h4 className="text-xs font-black text-white">Adaptação & Chaves</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Check-in de mudança, utilidades e primeiras impressões do imóvel.
                </p>
              </button>

              {/* Marco 6 Meses */}
              <button
                type="button"
                onClick={() => gerarMensagemMarco('6_meses')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  marcoAtivo === '6_meses'
                    ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-sky-400">Marco 2</span>
                  <span className="text-[10px] font-bold text-slate-500">6 Meses</span>
                </div>
                <h4 className="text-xs font-black text-white">Indicações Espontâneas</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Checagem da vizinhança e pedido natural de indicação de amigos e familiares.
                </p>
              </button>

              {/* Marco 1 Ano */}
              <button
                type="button"
                onClick={() => gerarMensagemMarco('1_ano')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  marcoAtivo === '1_ano'
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-purple-400">Marco 3</span>
                  <span className="text-[10px] font-bold text-slate-500">1 Ano</span>
                </div>
                <h4 className="text-xs font-black text-white">Aniversário & Investimento</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Celebração de 1 ano de conquista, valorização do bairro e novos imóveis.
                </p>
              </button>
            </div>

            {/* Botão de Disparo Manual de Geração */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400">
                Cliente selecionado: <strong className="text-white">{vendaAtiva.nomeComprador}</strong> ({vendaAtiva.imovelTitulo})
              </span>

              <button
                type="button"
                onClick={() => gerarMensagemMarco(marcoAtivo)}
                disabled={gerandoIA}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-purple-500/20"
              >
                {gerandoIA ? <Clock size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{gerandoIA ? 'Gerando com IA...' : 'Gerar Mensagem do Marco com IA'}</span>
              </button>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {erro}
              </div>
            )}

            {/* 3. Resultado Gerado pela IA */}
            {resultadoIA && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles size={14} /> {resultadoIA.tituloMarco}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {resultadoIA.gatilhoPolenZara?.melhorHorario}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-3 text-xs text-slate-300 font-medium leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Objetivo Estratégico:
                  </span>
                  {resultadoIA.resumoEstrategico}
                </div>

                {/* Caixa de Texto da Mensagem */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    Mensagem Personalizada para Envio:
                  </label>
                  <div className="rounded-2xl border border-slate-800 bg-[#020408] p-4 text-xs text-white whitespace-pre-line leading-relaxed font-sans">
                    {resultadoIA.mensagemWhatsApp}
                  </div>
                </div>

                {/* Gancho de Indicação */}
                {resultadoIA.pedidoIndicacao && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-0.5">
                      Gancho Natural de Indicação:
                    </span>
                    <p className="text-slate-300 italic">&ldquo;{resultadoIA.pedidoIndicacao}&rdquo;</p>
                  </div>
                )}

                {/* Barra de Ações: WhatsApp, Pólen, Zara e Copiar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copiarMensagem}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition cursor-pointer"
                    >
                      {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiado ? 'Copiada!' : 'Copiar Texto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={enviarWhatsApp}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <MessageCircle size={14} />
                      <span>Enviar no WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={acionarPolen}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 transition cursor-pointer"
                    >
                      <Bot size={14} />
                      <span>{polenAcionada ? 'Abrindo Pólen 24h...' : 'Disparar via Pólen 24h'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={acionarZara}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 transition cursor-pointer"
                    >
                      <TrendingUp size={14} />
                      <span>{zaraAcionada ? 'Abrindo Zara...' : 'Auditoria Zara'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
