import React, { useEffect, useMemo, useState } from 'react';
import {
  Radar,
  ExternalLink,
  Search,
  ClipboardPaste,
  Copy,
  Check,
  FileDown,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Sparkles,
  MapPin,
  Building2,
  Phone,
  PhoneCall,
  MessageCircle,
  Lock,
  Bot,
  Brain,
  Zap,
  ShieldCheck,
  Star,
  Users,
  CheckCircle2,
  HelpCircle,
  Trash2,
  Eraser,
} from 'lucide-react';
import HeroAba from '../admin/HeroAba';
import GuiaDaAba from '../ui/GuiaDaAba';
import SeletorUF from '../ui/SeletorUF';
import CapturaLeadsMaps from '../prospeccao/CapturaLeadsMaps';
import ModalPacoteCompleto from '../admin/ModalPacoteCompleto';
import { corDaAba } from '../../lib/coresAbas';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  montarBuscas,
  extrairAnuncio,
  analisarAnuncio,
  gerarScriptsAbordagem,
  gerarXmlPortais,
  baixarArquivo,
} from '../../lib/radar';
import {
  ATALHOS_RAMOS,
  OBJETIVOS_PROSPECCAO,
  IMOVEIS_DEMO_ANCORA,
  buscarEmpresasMaps,
  gerarScript10Segundos,
  classificarTelefone,
  exportarLeadsMapsCsv,
} from '../../lib/radarMaps';

const card = 'bg-white border border-slate-200 rounded-3xl shadow-sm';
const labelCls = 'block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5';
const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#10b981] focus:bg-white transition';
const brl = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

export default function RadarCaptacao({
  dadosOficina,
  listaImoveis: propImoveis = [],
  isPro = false,
  setAbaAtiva,
  temPolen = false,
  temZara = true,
}) {
  const corAba = corDaAba('radar_captacao');
  const tenantId = dadosOficina?.id || dadosOficina?.uid || null;

  // Sub-abas do Radar: 'empresas_maps' | 'proprietarios'
  const [frenteAtiva, setFrenteAtiva] = useState('empresas_maps');

  // Estado geral
  const [uf, setUf] = useState('MG');
  const [cidade, setCidade] = useState('Uberlândia');
  const [bairro, setBairro] = useState('Santa Mônica');
  const [nicho, setNicho] = useState('urbano');
  const [copiado, setCopiado] = useState(null);
  const [imoveis, setImoveis] = useState([]);
  const [modalPacoteAberto, setModalPacoteAberto] = useState(false);
  const [tarefasZara, setTarefasZara] = useState({});

  // 1. Radar de Proprietários
  const [anuncioTexto, setAnuncioTexto] = useState('');
  const [xmlGerado, setXmlGerado] = useState(null);

  // 2. Radar de Clientes & Empresas (Google Maps)
  const [ramoSelecionado, setRamoSelecionado] = useState('medicos');
  const [ramoTextoLivre, setRamoTextoLivre] = useState('Médicos / Clínicas');
  const [objetivoSelecionado, setObjetivoSelecionado] = useState('vender_investimento');
  const [leadsMaps, setLeadsMaps] = useState([]);
  const [buscandoMaps, setBuscandoMaps] = useState(false);

  // Status e Temperatura por Lead (armazenados por ID)
  const [statusLeads, setStatusLeads] = useState({});
  const [tempLeads, setTempLeads] = useState({});

  // 3. Campanha Inteligente & Imóvel-Âncora
  const [imovelAncoraId, setImovelAncoraId] = useState('');

  // Status de ativação da Pólen e da Zara
  const polenAtiva = Boolean(dadosOficina?.polenAtiva || dadosOficina?.temSofiaWhatsApp || temPolen);
  const zaraAtiva = Boolean(dadosOficina?.zaraAtiva || isPro || temZara);
  const disparosPolenMes = 14;
  const tetoMensalPolen = 330;

  // Carregar imóveis reais do tenant ou usar prop
  useEffect(() => {
    if (propImoveis && propImoveis.length > 0) {
      setImoveis(propImoveis);
      return undefined;
    }
    if (!tenantId) {
      setImoveis(IMOVEIS_DEMO_ANCORA);
      return undefined;
    }
    const unsub = onSnapshot(
      collection(db, 'oficinas', tenantId, 'imoveis_imobi'),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setImoveis(docs.length > 0 ? docs : IMOVEIS_DEMO_ANCORA);
      },
      () => setImoveis(IMOVEIS_DEMO_ANCORA),
    );
    return () => unsub();
  }, [tenantId, propImoveis]);

  // Lista consolidada de imóveis para o seletor
  const listaImoveisAncora = useMemo(() => {
    if (imoveis && imoveis.length > 0) return imoveis;
    return IMOVEIS_DEMO_ANCORA;
  }, [imoveis]);

  // Imóvel-Âncora ativo
  const imovelAncoraAtivo = useMemo(() => {
    const encontrado = listaImoveisAncora.find((im) => String(im.id) === String(imovelAncoraId));
    return encontrado || listaImoveisAncora[0] || IMOVEIS_DEMO_ANCORA[0];
  }, [listaImoveisAncora, imovelAncoraId]);

  // Executar busca livre no Google Maps
  const handleBuscarMaps = () => {
    setBuscandoMaps(true);
    setTimeout(() => {
      const termoBusca = (ramoTextoLivre || ramoSelecionado || 'Geral').trim();
      const resultados = buscarEmpresasMaps({
        ramo: termoBusca,
        cidade: cidade || 'Uberlândia',
        bairro: bairro || '',
      });
      setLeadsMaps(resultados);
      setBuscandoMaps(false);
    }, 350);
  };

  // Carregar leads maps iniciais se a lista estiver vazia
  useEffect(() => {
    if (leadsMaps.length === 0) {
      const iniciais = buscarEmpresasMaps({
        ramo: 'Médicos / Clínicas',
        cidade: 'Uberlândia',
        bairro: 'Santa Mônica',
      });
      setLeadsMaps(iniciais);
    }
  }, [leadsMaps.length]);

  // Handlers para Status e Temperatura
  const handleStatusChange = (leadId, novoStatus) => {
    setStatusLeads((prev) => ({ ...prev, [leadId]: novoStatus }));
  };

  const handleTempChange = (leadId, novaTemp) => {
    setTempLeads((prev) => ({ ...prev, [leadId]: novaTemp }));
  };

  // Excluir card individual
  const handleExcluirLead = (leadId) => {
    setLeadsMaps((prev) => prev.filter((item) => item.id !== leadId));
  };

  // Exportar para CSV
  const handleExportarCsv = () => {
    const scriptsMap = {};
    leadsMaps.forEach((empresa) => {
      scriptsMap[empresa.id] = gerarScript10Segundos({
        empresa,
        ramo: ramoTextoLivre || ramoSelecionado,
        objetivo: objetivoSelecionado,
        imovelAncora: imovelAncoraAtivo,
        imobiliaria: dadosOficina?.nomeOficina || 'nossa imobiliária',
      });
    });

    exportarLeadsMapsCsv({
      leads: leadsMaps,
      statusMap: statusLeads,
      tempMap: tempLeads,
      scriptsMap,
    });
  };

  // Buscas de proprietários (OLX, Face, etc)
  const buscas = useMemo(
    () => montarBuscas({ cidade, bairro, uf, nicho }),
    [cidade, bairro, uf, nicho],
  );

  const anuncio = useMemo(() => extrairAnuncio(anuncioTexto), [anuncioTexto]);
  const analise = useMemo(
    () => (anuncio.temPreco || anuncio.temArea ? analisarAnuncio(anuncio, { uf, cidade, bairro }) : null),
    [anuncio, uf, cidade, bairro],
  );
  const scripts = useMemo(
    () =>
      analise
        ? gerarScriptsAbordagem(anuncio, analise, {
            imobiliaria: dadosOficina?.nomeOficina || 'nossa imobiliária',
            uf,
          })
        : [],
    [anuncio, analise, dadosOficina, uf],
  );

  async function copiar(chave, texto) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setCopiado(null);
    }
  }

  function handleCriarTarefaZara(leadId, empresaNome) {
    setTarefasZara((prev) => ({ ...prev, [leadId]: true }));
    setTimeout(() => {
      alert(`✓ Tarefa agendada na Fila da Zara para o lead "${empresaNome}". Cobrança de follow-up ativa!`);
    }, 150);
  }

  function exportarXml() {
    const xml = gerarXmlPortais(imoveis, {
      ...dadosOficina,
      uf,
      cidade,
    });
    baixarArquivo('feed-portais.xml', xml);
    setXmlGerado({ imoveis: (xml.match(/<Imovel>/g) || []).length, tamanho: xml.length });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── HERO DA ABA ── */}
      <HeroAba
        icone={Radar}
        titulo="Radar de"
        destaque="Captação & Clientes"
        chip="Particulares na Web & Empresas no Google Maps"
        subtitulo="Duas frentes de inteligência: encontre imóveis particulares direto com o proprietário ou capture empresas e tomadores de decisão locais no Google Maps com ganchos de 10 segundos da IA."
        cor={corAba}
      />

      {/* ── BANNER VISUAL ULTRA-ENXUTO (TEMA CLARO & ALTO CONTRASTE) ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm relative overflow-hidden space-y-4">
        {/* Imagem opcional /radar-fluxo.png pronta para exibição caso exista */}
        <img
          src="/radar-fluxo.png"
          alt="Fluxo Integrado do Radar"
          className="w-full h-auto max-h-48 object-cover rounded-2xl hidden"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          onLoad={(e) => {
            e.currentTarget.style.display = 'block';
          }}
        />

        {/* 4 Cards Visuais Compactos (máximo 4 palavras cada) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. ZARA */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500/40 transition flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">Prospecção</span>
              <h4 className="text-xs md:text-sm font-black text-slate-900 truncate">ZARA · Busca Leads</h4>
            </div>
          </div>

          {/* 2. TOM */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500/40 transition flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-widest block">Estratégia</span>
              <h4 className="text-xs md:text-sm font-black text-slate-900 truncate">TOM · Organiza & Escolhe Imóvel</h4>
            </div>
          </div>

          {/* 3. PÓLEN */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500/40 transition flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 border border-teal-300 flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">Contato</span>
              <h4 className="text-xs md:text-sm font-black text-slate-900 truncate">PÓLEN · Aborda 15/dia (24h)</h4>
            </div>
          </div>

          {/* 4. CORRETOR */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-500/40 transition flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-black text-xs shrink-0">
              4
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Fechamento</span>
              <h4 className="text-xs md:text-sm font-black text-slate-900 truncate">CORRETOR · Visita & Venda</h4>
            </div>
          </div>
        </div>

        {/* Linha discreta de rodapé abaixo do banner */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <p className="flex items-center gap-1.5 leading-snug">
            <ShieldCheck size={16} className="text-[#0d9488] shrink-0" />
            <span>
              Limite padrão de ~15 abordagens/dia para proteção contra banimento no WhatsApp. Planos Pólen, Tom e Zara a partir do valor base conforme volume e formato de abordagem.
            </span>
          </p>
          <button
            type="button"
            onClick={() => setModalPacoteAberto(true)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0d9488] hover:text-emerald-700 transition underline underline-offset-2 shrink-0 cursor-pointer"
            title="Ver detalhes dos planos de IA e limites"
          >
            Ver detalhes ?
          </button>
        </div>
      </div>

      {/* ── SELETOR COMPACTO DO IMÓVEL-ÂNCORA & STATUS PÓLEN ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={16} className="text-[#0d9488] shrink-0" />
          <span className="font-bold text-slate-800 shrink-0">Imóvel-Âncora da Campanha:</span>
          <select
            value={imovelAncoraId || (imovelAncoraAtivo ? imovelAncoraAtivo.id : '')}
            onChange={(e) => setImovelAncoraId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#10b981] cursor-pointer max-w-md truncate"
          >
            {listaImoveisAncora.map((im) => (
              <option key={im.id} value={im.id}>
                {im.titulo} — {im.bairro || im.cidade} ({im.valor})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {polenAtiva ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-black text-emerald-800">
              Disparos Pólen: {disparosPolenMes} / {tetoMensalPolen} este mês
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setModalPacoteAberto(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:border-emerald-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={12} className="text-amber-500" /> Ativar Pólen 24h
            </button>
          )}
        </div>
      </div>

      {/* ── 3. ALTERNADOR DAS DUAS FRENTES DO RADAR ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFrenteAtiva('empresas_maps')}
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
            frenteAtiva === 'empresas_maps'
              ? 'bg-[#10b981] text-slate-950 font-black shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold'
          }`}
        >
          <Building2 size={16} />
          Radar de Clientes & Empresas (Google Maps)
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-900 text-white">
            Novo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFrenteAtiva('proprietarios')}
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
            frenteAtiva === 'proprietarios'
              ? 'bg-[#10b981] text-slate-950 font-black shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold'
          }`}
        >
          <Search size={16} />
          Radar de Proprietários (OLX, Facebook & Portais)
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* FRENTE 1: RADAR DE CLIENTES & EMPRESAS (GOOGLE MAPS)                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {frenteAtiva === 'empresas_maps' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0d9488]">
                  <MapPin size={13} /> Varredura de Estabelecimentos & Tomadores de Decisão
                </p>
                <h3 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                  Filtros de Prospecção no Google Maps
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <CapturaLeadsMaps oficinaId={tenantId} cor={corAba} />
                <SeletorUF onChange={(p) => setUf(p.ufPadrao)} />
              </div>
            </div>

            {/* Atalhos Rápidos de Ramos */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                Atalhos Rápidos de Nicho / Ramo (clique para preencher):
              </span>
              <div className="flex flex-wrap gap-2">
                {ATALHOS_RAMOS.map((at) => (
                  <button
                    key={at.id}
                    type="button"
                    onClick={() => {
                      setRamoSelecionado(at.id);
                      setRamoTextoLivre(at.label);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      ramoSelecionado === at.id || ramoTextoLivre === at.label
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {at.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos de Busca Livre */}
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className={labelCls}>Ramo / Perfil (Livre)</label>
                <input
                  className={inputCls}
                  value={ramoTextoLivre}
                  onChange={(e) => {
                    setRamoTextoLivre(e.target.value);
                    setRamoSelecionado('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBuscarMaps();
                  }}
                  placeholder="Ex: petshop, clínica, restaurante..."
                />
              </div>

              <div>
                <label className={labelCls}>Cidade</label>
                <input
                  className={inputCls}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBuscarMaps();
                  }}
                  placeholder="Uberlândia"
                />
              </div>

              <div>
                <label className={labelCls}>Bairro</label>
                <input
                  className={inputCls}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBuscarMaps();
                  }}
                  placeholder="Santa Mônica"
                />
              </div>

              <div>
                <label className={labelCls}>Objetivo da Abordagem</label>
                <select
                  className={inputCls}
                  value={objetivoSelecionado}
                  onChange={(e) => setObjetivoSelecionado(e.target.value)}
                >
                  {OBJETIVOS_PROSPECCAO.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botão de Disparo da Busca Maps */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBuscarMaps}
                disabled={buscandoMaps}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition shadow-md cursor-pointer font-sans disabled:opacity-50"
              >
                <MapPin size={15} />
                {buscandoMaps ? 'Capturando no Google Maps...' : 'Capturar leads MAPS'}
              </button>

              <span className="text-xs text-slate-600 font-medium">
                {leadsMaps.length} estabelecimentos mapeados para <strong>{ramoTextoLivre || 'Ramo livre'}</strong>
              </span>
            </div>
          </div>

          {/* Barra de Controle de Dados: Cabeçalho, Limpar Busca e Exportar CSV */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 size={18} className="text-[#0d9488]" />
              <h4 className="text-sm md:text-base font-black text-slate-900">
                Oportunidades Mapeadas no Google Maps ({leadsMaps.length})
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                · Oferta conectada: <strong className="text-slate-800">{imovelAncoraAtivo.titulo}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLeadsMaps([])}
                disabled={leadsMaps.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40"
              >
                <Eraser size={14} /> Limpar busca
              </button>

              <button
                type="button"
                onClick={handleExportarCsv}
                disabled={leadsMaps.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-40"
              >
                <FileDown size={14} /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Cards de Leads do Google Maps em Tema Claro & Alto Contraste */}
          {leadsMaps.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
              <p className="text-sm font-bold text-slate-600">Nenhum estabelecimento encontrado ou lista limpa.</p>
              <button
                type="button"
                onClick={handleBuscarMaps}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition cursor-pointer"
              >
                Buscar empresas agora
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {leadsMaps.map((empresa) => {
                const script10s = gerarScript10Segundos({
                  empresa,
                  ramo: ramoTextoLivre || ramoSelecionado,
                  objetivo: objetivoSelecionado,
                  imovelAncora: imovelAncoraAtivo,
                  imobiliaria: dadosOficina?.nomeOficina || 'nossa imobiliária',
                });

                const telLimpo = String(empresa.telefone || '').replace(/\D/g, '');
                const linkWa = `https://wa.me/55${telLimpo}?text=${encodeURIComponent(script10s)}`;
                const tarefaCriada = Boolean(tarefasZara[empresa.id]);

                // Classificação Fixo vs. Celular / WhatsApp
                const infoTel = classificarTelefone(empresa.telefone);
                const statusAtual = statusLeads[empresa.id] || 'Novo';
                const tempAtual = tempLeads[empresa.id] || 'Morno';

                return (
                  <div
                    key={empresa.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Topo do Card: Nome, Endereço e Botão Excluir */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-base font-black text-slate-900 leading-snug">
                            {empresa.nome}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">{empresa.endereco}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                            {empresa.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleExcluirLead(empresa.id)}
                            title="Excluir este lead da lista"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Avaliação e Telefone com Badge de Tipo */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <span className="inline-flex items-center gap-1 font-black text-amber-600">
                          <Star size={13} className="fill-current" />
                          {empresa.avaliacao}
                          <span className="text-slate-500 font-normal">
                            ({empresa.totalAvaliacoes} avaliações)
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-800 font-bold flex items-center gap-1">
                            <Phone size={12} className="text-[#0d9488]" />
                            {empresa.telefone}
                          </span>
                          {infoTel.ehWhatsApp ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase">
                              📱 Celular / WhatsApp
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-black uppercase">
                              📞 Telefone Fixo (Ligação)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Seletores Rápidos: Status e Temperatura */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Status do Contato:
                          </label>
                          <select
                            value={statusAtual}
                            onChange={(e) => handleStatusChange(empresa.id, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#10b981]"
                          >
                            <option value="Novo">Novo</option>
                            <option value="Ligação 1">Ligação 1</option>
                            <option value="Ligação 2">Ligação 2</option>
                            <option value="Retornar depois">Retornar depois</option>
                            <option value="Reunião marcada">Reunião marcada</option>
                            <option value="Sem interesse">Sem interesse</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Temperatura:
                          </label>
                          <div className="flex gap-1">
                            {['Frio', 'Morno', 'Quente'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleTempChange(empresa.id, t)}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer border ${
                                  tempAtual === t
                                    ? t === 'Frio'
                                      ? 'bg-sky-100 border-sky-400 text-sky-800'
                                      : t === 'Morno'
                                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                                        : 'bg-rose-100 border-rose-400 text-rose-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bloco de Gancho / Script de 10 segundos da IA */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            <Sparkles size={11} className="text-[#0d9488]" /> Gancho de 10 segundos (IA Tom + Imóvel-Âncora)
                          </span>
                          <button
                            type="button"
                            onClick={() => copiar(empresa.id, script10s)}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 hover:text-emerald-950 cursor-pointer"
                          >
                            {copiado === empresa.id ? (
                              <Check size={11} className="text-emerald-700" />
                            ) : (
                              <Copy size={11} />
                            )}
                            {copiado === empresa.id ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-sans">
                          {script10s}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação Adaptados por Tipo de Telefone */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {infoTel.ehFixo ? (
                        /* Fluxo para Telefone Fixo (Ligação pelo Corretor) */
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`tel:${telLimpo}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition"
                            >
                              <PhoneCall size={14} />
                              Ligar Agora ({empresa.telefone})
                            </a>

                            <button
                              type="button"
                              onClick={() => copiar(empresa.id, script10s)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 transition cursor-pointer"
                            >
                              <Copy size={13} />
                              Copiar Roteiro
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start gap-1.5 leading-snug">
                            <Phone size={13} className="text-sky-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Fluxo de Ligação:</strong> Telefone fixo — a ligação é feita pelo próprio corretor utilizando o roteiro pronto acima (não inclui chamadas de voz automáticas da IA no plano base).
                            </span>
                          </div>

                          {zaraAtiva && (
                            <button
                              type="button"
                              onClick={() => handleCriarTarefaZara(empresa.id, empresa.nome)}
                              disabled={tarefaCriada}
                              title="Criar tarefa na fila operacional da Zara"
                              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                tarefaCriada
                                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Bot size={13} />
                              {tarefaCriada ? 'Na Fila Zara ✓' : 'Adicionar à Fila de Cobrança da Zara'}
                            </button>
                          )}
                        </div>
                      ) : (
                        /* Fluxo para Celular / WhatsApp */
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <a
                              href={`tel:${telLimpo}`}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 py-2 text-[11px] font-bold text-slate-800 transition"
                            >
                              <Phone size={12} />
                              Ligar
                            </a>

                            <button
                              type="button"
                              onClick={() => copiar(empresa.id, script10s)}
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 py-2 text-[11px] font-bold text-slate-800 transition cursor-pointer"
                            >
                              <Copy size={12} />
                              Copiar
                            </button>

                            <a
                              href={linkWa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-[11px] font-black text-white shadow-sm transition"
                            >
                              <MessageCircle size={13} />
                              WhatsApp
                            </a>
                          </div>

                          {/* Automação de Disparo: Pólen ou Cadeado */}
                          <div className="flex items-center gap-2">
                            {polenAtiva ? (
                              <button
                                type="button"
                                onClick={() =>
                                  alert(
                                    `✓ Abordagem agendada na Pólen para ${empresa.nome} dentro da cadência segura (15/dia).`,
                                  )
                                }
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 text-xs uppercase tracking-wider transition cursor-pointer shadow-sm"
                              >
                                <Zap size={13} />
                                Disparar via Pólen 24h
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setModalPacoteAberto(true)}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold px-4 py-2.5 text-xs uppercase tracking-wider hover:border-amber-400 hover:text-amber-800 transition cursor-pointer"
                              >
                                <Lock size={12} className="text-amber-500" />
                                Programar na Pólen 🔒
                              </button>
                            )}

                            {zaraAtiva && (
                              <button
                                type="button"
                                onClick={() => handleCriarTarefaZara(empresa.id, empresa.nome)}
                                disabled={tarefaCriada}
                                title="Criar tarefa na fila operacional da Zara"
                                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                  tarefaCriada
                                    ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Bot size={13} />
                                {tarefaCriada ? 'Na Fila Zara ✓' : 'Fila Zara'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Nota Transparente sobre Preços de IA (A partir de R$ ...) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">
              Planos e Automações de IA (Valores base de contratação):
            </p>
            <p>
              • <strong>IA Pólen:</strong> A partir de R$ 450,00 | • <strong>IA Zara:</strong> A partir de R$ 349,00 | • <strong>IA Tom:</strong> A partir de R$ 197,00
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              *Os valores são informados como base porque variam conforme a frequência/volume de novas abordagens diárias, quantidade de chips conectados e o nível de automação contratado.
            </p>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* FRENTE 2: RADAR DE PROPRIETÁRIOS (OLX, FACEBOOK & PORTAIS)            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {frenteAtiva === 'proprietarios' && (
        <div className="space-y-6">
          <GuiaDaAba
            titulo="Radar de Proprietários Particulares"
            descricao="Escolha cidade, bairro e nicho: o sistema monta as buscas de anúncios de particular. Achou um? Cole o texto do anúncio aqui e receba a leitura de preço mais três scripts de WhatsApp. No fim, exporte a carteira no XML que os portais aceitam."
          />

          {/* ── A. Gerador de buscas ── */}
          <div className={`${card} p-5`}>
            <p
              className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0d9488]"
            >
              <Search size={13} /> Buscas Diretas com Proprietários
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className={labelCls}>Cidade</label>
                <input
                  className={inputCls}
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Uberlândia"
                />
              </div>
              <div>
                <label className={labelCls}>Bairro</label>
                <input
                  className={inputCls}
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Santa Mônica"
                />
              </div>
              <div>
                <label className={labelCls}>Nicho</label>
                <select
                  className={inputCls}
                  value={nicho}
                  onChange={(e) => setNicho(e.target.value)}
                >
                  <option value="urbano">Urbano</option>
                  <option value="alto_padrao">Alto Padrão</option>
                  <option value="loteamento">Loteamento</option>
                  <option value="rural">Rural</option>
                  <option value="mcmv">MCMV</option>
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {buscas.map((b) => (
                <a
                  key={b.portal}
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-[#10b981] hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] font-black text-slate-900">{b.label}</span>
                    <span className="block truncate text-[10px] text-slate-500">
                      {b.detalhe}
                    </span>
                  </span>
                  <ExternalLink size={14} style={{ color: corAba }} />
                </a>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              As buscas já incluem os termos “direto com proprietário”, “sem corretor” — para filtrar anúncio de imobiliária.
            </p>
          </div>

          {/* ── B. Extrator + abordagem ── */}
          <div className={`${card} p-5`}>
            <p
              className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0d9488]"
            >
              <ClipboardPaste size={13} /> Extrator de anúncio &amp; abordagem
            </p>

            <label className={labelCls}>Cole aqui o texto do anúncio (OLX, Marketplace, grupo)</label>
            <textarea
              value={anuncioTexto}
              onChange={(e) => setAnuncioTexto(e.target.value)}
              rows={4}
              placeholder="Ex: Vendo apartamento direto com proprietário, 120 m2, 3 quartos, Bairro Santa Mônica, R$ 890.000, (34) 99999-8888"
              className={`${inputCls} resize-y`}
            />

            {analise && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Extraído</p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {anuncio.temPreco ? brl(anuncio.preco) : 'sem preço'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {anuncio.temArea ? `${anuncio.area} m²` : 'sem área'}
                    {anuncio.quartos ? ` · ${anuncio.quartos} quartos` : ''}
                    {anuncio.contato ? ` · ${anuncio.contato}` : ''}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Preço por m²</p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {anuncio.temArea && anuncio.temPreco ? brl(analise.precoM2) : '—'}
                  </p>
                  <p className="text-[10px] text-slate-500">mercado: {brl(analise.referenciaM2)}/m²</p>
                </div>
                <div
                  className={`rounded-2xl border p-3 ${
                    analise.desvioPct > 15
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : analise.desvioPct < -15
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-600">
                    {analise.desvioPct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} Desvio
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {analise.desvioPct > 0 ? '+' : ''}
                    {analise.desvioPct}%
                  </p>
                  <p className="text-[10px] text-slate-600">{analise.leitura}</p>
                </div>
              </div>
            )}

            {scripts.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700">
                  <Sparkles size={12} className="text-[#0d9488]" /> 3 abordagens prontas
                </p>
                {scripts.map((s) => (
                  <div key={s.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-slate-900">{s.titulo}</span>
                      <button
                        type="button"
                        onClick={() => copiar(s.key, s.texto)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                      >
                        {copiado === s.key ? <Check size={12} /> : <Copy size={12} />}
                        {copiado === s.key ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                      {s.texto}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {anuncioTexto && !anuncio.temPreco && !anuncio.temArea && (
              <p className="mt-3 flex items-start gap-1.5 text-[10px] text-amber-700">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                Não identifiquei preço nem área no texto colado. Inclua o valor e a metragem para o motor comparar com o mercado.
              </p>
            )}
          </div>

          {/* ── C. Exportação para portais ── */}
          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#0d9488]"
                >
                  <FileDown size={13} /> Exportação para portais
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Gera <strong className="text-slate-900">feed-portais.xml</strong> com os imóveis ativos cadastrados — formato de carga aceito por ZAP, VivaReal e OLX.
                </p>
              </div>
              <button
                type="button"
                onClick={exportarXml}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110 cursor-pointer shadow-sm"
                style={{ backgroundColor: corAba }}
              >
                <FileDown size={14} /> Baixar feed XML
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
              <span>{imoveis.length} imóvel(is) na carteira</span>
              {xmlGerado && (
                <span className="font-bold text-emerald-700">
                  gerado com {xmlGerado.imoveis} imóvel(is) · {(xmlGerado.tamanho / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DO PACOTE COMPLETO ── */}
      <ModalPacoteCompleto
        aberto={modalPacoteAberto}
        onFechar={() => setModalPacoteAberto(false)}
      />
    </div>
  );
}
