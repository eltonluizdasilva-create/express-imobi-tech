import React, { useMemo, useState } from 'react';
import {
  Ruler, Copy, Check, Printer, Sparkles, AlertTriangle, TrendingUp,
  Building2, MapPin, Gauge, FileText, MessageSquare, Info, ChevronDown, Stamp,
  Camera, X, Loader2, ScanSearch,
} from 'lucide-react';
import HeroAba from '../admin/HeroAba';
import GuiaDaAba from '../ui/GuiaDaAba';
import SeletorUF from '../ui/SeletorUF';
import { corDaAba, heroDaAba } from '../../lib/coresAbas';
import { lerPreferencias } from '../../lib/preferencias';
import LaudoExecutivo from './LaudoExecutivo';
import useLaudoImobi, { comprimirImagem, CDI_PADRAO, FII_TIJOLO_PADRAO } from '../../hooks/useLaudoImobi.js';
import { raioXDaVizinhanca } from '../../services/vizinhancaService.js';
import {
  avaliarImovel, gerarPTAM, gerarResumoComercial, gerarDocumentoHtmlPTAM,
  TIPOLOGIAS, PADROES, ESTADOS_CONSERVACAO, TOPOGRAFIAS, CONDICOES_TESTADA, FINALIDADES_PTAM,
} from '../../lib/avaliacao';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function AvaliacaoImovel() {
  const corAba = corDaAba('avaliacao_imovel');
  const prefs = lerPreferencias();

  const [uf, setUf] = useState(prefs.ufPadrao);
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [tipologia, setTipologia] = useState('urbano');
  const [padrao, setPadrao] = useState('normal');
  const [estado, setEstado] = useState('bom');
  const [topografia, setTopografia] = useState('plano');
  const [condicoes, setCondicoes] = useState([]);
  const [areaTotal, setAreaTotal] = useState('');
  const [areaConstruida, setAreaConstruida] = useState('');
  const [comparaveis, setComparaveis] = useState([
    { valor: '', area: '', distanciaKm: '', oferta: true },
    { valor: '', area: '', distanciaKm: '', oferta: true },
    { valor: '', area: '', distanciaKm: '', oferta: true },
  ]);

  const [abrirEmissao, setAbrirEmissao] = useState(false);
  const [corretorNome, setCorretorNome] = useState('');
  const [creci, setCreci] = useState('');
  const [cnai, setCnai] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [matricula, setMatricula] = useState('');
  const [finalidade, setFinalidade] = useState('venda');

  const [abaSaida, setAbaSaida] = useState('resumo');
  const [copiado, setCopiado] = useState(false);

  // --- Laudo executivo 5 agentes ---
  const [cep, setCep] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [cdi, setCdi] = useState(CDI_PADRAO);
  const [fii, setFii] = useState(FII_TIJOLO_PADRAO);
  const [fotos, setFotos] = useState([]);
  const [erroFoto, setErroFoto] = useState('');
  const [vizCarregando, setVizCarregando] = useState(false);
  const {
    fase, carregando: gerandoLaudo, erro: erroLaudo, laudo,
    analiseFotos, vizinhanca, meta, gerar: gerarLaudoIA, setVizinhanca,
  } = useLaudoImobi();

  const avaliacao = useMemo(() => avaliarImovel({
    uf, cidade, bairro, tipologia, padrao, estado, topografia, condicoes,
    areaTotal: Number(areaTotal) || 0,
    areaConstruida: Number(areaConstruida) || 0,
    comparaveis,
  }), [uf, cidade, bairro, tipologia, padrao, estado, topografia, condicoes, areaTotal, areaConstruida, comparaveis]);

  const dadosEmissao = useMemo(() => ({
    corretorNome, creci, cnai, solicitante, matricula, finalidade, cidade, uf,
  }), [corretorNome, creci, cnai, solicitante, matricula, finalidade, cidade, uf]);

  const resumo = useMemo(() => gerarResumoComercial(dadosEmissao, avaliacao), [dadosEmissao, avaliacao]);
  const documento = useMemo(() => gerarPTAM(dadosEmissao, avaliacao), [dadosEmissao, avaliacao]);
  const temArea = (Number(areaTotal) || 0) + (Number(areaConstruida) || 0) > 0;

  function alternarCondicao(key) {
    setCondicoes((atual) => (atual.includes(key) ? atual.filter((k) => k !== key) : [...atual, key]));
  }

  function atualizarComparavel(idx, campo, valor) {
    setComparaveis((atual) => atual.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)));
  }

  async function copiar() {
    const texto = abaSaida === 'resumo' ? resumo : documento;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  }

  function imprimir() {
    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Permita pop-ups para gerar o PDF do parecer.');
      return;
    }
    janela.document.write(gerarDocumentoHtmlPTAM(dadosEmissao, avaliacao));
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 350);
  }

  async function adicionarFotos(evento) {
    const arquivos = Array.from(evento.target.files || []).slice(0, 3 - fotos.length);
    if (!arquivos.length) return;
    setErroFoto('');
    const novas = [];
    for (const arquivo of arquivos) {
      try {
        novas.push(await comprimirImagem(arquivo));
      } catch (e) {
        setErroFoto(String(e?.message || e));
      }
    }
    setFotos((atual) => [...atual, ...novas].slice(0, 3));
    evento.target.value = '';
  }

  async function gerarLaudoCompleto() {
    setVizCarregando(true);
    let viz = null;
    try {
      viz = await raioXDaVizinhanca({
        cep,
        endereco: [bairro, cidade].filter(Boolean).join(', '),
        cidade,
        uf,
      });
    } catch (e) {
      viz = { ok: false, motivo: String(e?.message || e) };
    } finally {
      setVizCarregando(false);
    }
    setVizinhanca(viz);

    await gerarLaudoIA({
      dados: {
        cidade, bairro, uf, tipologia, padrao, estado, topografia,
        areaTotal: Number(areaTotal) || 0,
        areaConstruida: Number(areaConstruida) || 0,
        comparaveis,
      },
      avaliacao,
      valorPedido: Number(valorPedido) || 0,
      cdi: Number(cdi) || CDI_PADRAO,
      fii: Number(fii) || FII_TIJOLO_PADRAO,
      fotos,
      vizinhanca: viz,
    });
  }

  return (
    <div className="space-y-6">
      <HeroAba
        icone={Ruler}
        titulo="Avaliação de"
        destaque="Imóvel"
        chip="PTAM · COFECI 1.066/2007 + ABNT NBR 14.653"
        subtitulo="Comparativo direto com fatores de topografia e testada, três cenários de preço e parecer no padrão oficial para o proprietário."
        cor={corAba}
      />

      <SeletorUF onChange={(p) => setUf(p.ufPadrao)} />

      {/* Quadro legal */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          <strong className="text-slate-300">Base legal (Lei 6.530/78 e Resolução COFECI 1.066/2007):</strong>{' '}
          todo corretor de imóveis regular no CRECI tem prerrogativa legal para emitir o PTAM
          (Parecer Técnico de Avaliação Mercadológica). Laudos estruturais de engenharia exigem
          ART/RRT (CREA/CAU).
        </p>
      </div>

      <GuiaDaAba
        titulo="Avaliação de Imóvel"
        descricao="Preencha os dados do imóvel, a topografia e as condições da testada, e informe até 3 comparáveis. O motor homogeneíza (desconto de oferta 10% + peso por distância), aplica os fatores físicos e devolve três cenários, prazo e dois textos: resumo para WhatsApp e o PTAM oficial para imprimir."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`${card} p-5 lg:col-span-3 space-y-4`}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelCls}>Cidade</label>
              <input className={inputCls} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Uberlândia" />
            </div>
            <div>
              <label className={labelCls}>Bairro</label>
              <input className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" />
            </div>
            <div>
              <label className={labelCls}>Tipologia</label>
              <select className={inputCls} value={tipologia} onChange={(e) => setTipologia(e.target.value)}>
                {TIPOLOGIAS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className={labelCls}>{tipologia === 'rural' ? 'Área (hectares)' : 'Área total (m²)'}</label>
              <input className={inputCls} value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} inputMode="decimal" placeholder="360" />
            </div>
            <div>
              <label className={labelCls}>Área construída (m²)</label>
              <input className={inputCls} value={areaConstruida} onChange={(e) => setAreaConstruida(e.target.value)} inputMode="decimal" placeholder="210" />
            </div>
            <div>
              <label className={labelCls}>Padrão construtivo</label>
              <select className={inputCls} value={padrao} onChange={(e) => setPadrao(e.target.value)}>
                {PADROES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Conservação</label>
              <select className={inputCls} value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_CONSERVACAO.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Topografia */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Topografia do terreno</label>
              <select className={inputCls} value={topografia} onChange={(e) => setTopografia(e.target.value)}>
                {TOPOGRAFIAS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({t.efeito === 0 ? 'sem ajuste' : `${t.efeito}%`})
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-slate-800 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">Fator de topografia</p>
              <p className="text-sm font-black text-white">
                {avaliacao.topografia.fator.toFixed(2)}
                <span className="ml-2 text-[10px] font-bold text-slate-500">{avaliacao.topografia.nota}</span>
              </p>
            </div>
          </div>

          {/* Testada */}
          <div>
            <label className={labelCls}>Condições da testada / terreno</label>
            <div className="flex flex-wrap gap-2">
              {CONDICOES_TESTADA.map((c) => {
                const ativo = condicoes.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => alternarCondicao(c.key)}
                    title={c.nota}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${ativo
                      ? 'border-[#10b981] bg-[#10b981]/15 text-[#10b981]'
                      : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  >
                    {c.label} <span className="opacity-70">({c.efeito > 0 ? '+' : ''}{c.efeito}%)</span>
                  </button>
                );
              })}
            </div>
            {condicoes.length > 0 && (
              <p className="mt-2 text-[10px] text-slate-500">
                Fator cumulativo da testada: {avaliacao.fatores.testada} ({avaliacao.fatores.testadaPct > 0 ? '+' : ''}{avaliacao.fatores.testadaPct}%)
              </p>
            )}
          </div>

          {/* Comparáveis */}
          <div className="rounded-2xl border border-slate-800 p-4">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Building2 size={13} /> Comparáveis de referência (opcional, até 3)
            </p>
            <div className="space-y-2">
              {comparaveis.map((c, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <span className="col-span-1 text-[10px] font-black text-slate-500">#{i + 1}</span>
                  <input className={`${inputCls} col-span-4`} value={c.valor} onChange={(e) => atualizarComparavel(i, 'valor', e.target.value)} placeholder="Valor pedido (R$)" inputMode="decimal" />
                  <input className={`${inputCls} col-span-3`} value={c.area} onChange={(e) => atualizarComparavel(i, 'area', e.target.value)} placeholder="Área" inputMode="decimal" />
                  <input className={`${inputCls} col-span-3`} value={c.distanciaKm} onChange={(e) => atualizarComparavel(i, 'distanciaKm', e.target.value)} placeholder="Distância km" inputMode="decimal" />
                  <label className="col-span-1 flex items-center justify-center" title="É anúncio de oferta (aplica desconto de 10%)">
                    <input type="checkbox" checked={c.oferta} onChange={(e) => atualizarComparavel(i, 'oferta', e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Marque a caixa quando o valor for preço de anúncio: o motor aplica 10% de desconto e reduz o peso de comparáveis distantes.
            </p>
          </div>

          {/* Emissão do PTAM */}
          <div className="rounded-2xl border border-slate-800 p-4">
            <button onClick={() => setAbrirEmissao((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Stamp size={13} /> Dados para emissão do PTAM
              </span>
              <ChevronDown size={15} className={`text-slate-500 transition ${abrirEmissao ? 'rotate-180' : ''}`} />
            </button>

            {abrirEmissao && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Corretor / Avaliador</label>
                  <input className={inputCls} value={corretorNome} onChange={(e) => setCorretorNome(e.target.value)} placeholder="Seu nome" />
                </div>
                <div>
                  <label className={labelCls}>CRECI</label>
                  <input className={inputCls} value={creci} onChange={(e) => setCreci(e.target.value)} placeholder="MG 12345" />
                </div>
                <div>
                  <label className={labelCls}>CNAI (opcional)</label>
                  <input className={inputCls} value={cnai} onChange={(e) => setCnai(e.target.value)} placeholder="CNAI 000000" />
                </div>
                <div>
                  <label className={labelCls}>Solicitante / Proprietário</label>
                  <input className={inputCls} value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nome do proprietário" />
                </div>
                <div>
                  <label className={labelCls}>Matrícula (CRI)</label>
                  <input className={inputCls} value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="45.678" />
                </div>
                <div>
                  <label className={labelCls}>Finalidade</label>
                  <select className={inputCls} value={finalidade} onChange={(e) => setFinalidade(e.target.value)}>
                    {FINALIDADES_PTAM.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${card} p-5`}>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
              <Gauge size={13} /> Valor do {avaliacao.unidade}
            </p>
            <p className="mt-1 text-3xl font-black text-white">{brl(avaliacao.precoUnitario)}</p>
            <p className="text-[11px] text-slate-500">
              base {brl(avaliacao.precoUnitarioBase)} · mercado {brl(avaliacao.precoMercado)} →
              físico ×{avaliacao.fatorFisico} = {brl(avaliacao.precoUnitario)}
            </p>
            <p className="text-[10px] text-slate-500">{avaliacao.grauFundamentacao}</p>

            <div className="mt-4 space-y-2">
              {avaliacao.cenarios.map((c) => (
                <div key={c.key} className="rounded-xl border border-slate-800 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</span>
                    <strong className="text-sm font-black text-white">{brl(c.valor)}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500">{c.objetivo}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2">
              <TrendingUp size={14} color={corAba} />
              <span className="text-[11px] text-slate-300">Prazo médio: <strong className="text-white">{avaliacao.prazoMedioDias} dias</strong></span>
            </div>

            {avaliacao.alertas.length > 0 && (
              <ul className="mt-3 space-y-1">
                {avaliacao.alertas.map((a) => (
                  <li key={a} className="flex items-start gap-1.5 text-[10px] text-amber-300">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
              <MapPin size={11} /> {avaliacao.cidade} · {avaliacao.uf} · região {avaliacao.regiao}
            </p>
          </div>
        </div>
      </div>

      {/* ================= Laudo Executivo 5 Agentes ================= */}
      <div className={`${card} p-5 space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
              <ScanSearch size={13} /> Laudo executivo · 5 agentes de IA
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Cruza o PTAM com comparáveis reais, raio-X de vizinhança (OpenStreetMap), fotos do imóvel,
              renda fixa e liquidez — e devolve score, faixa de preço, prazo e anúncio pronto.
            </p>
          </div>
          <button
            onClick={gerarLaudoCompleto}
            disabled={!temArea || gerandoLaudo || vizCarregando}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:bg-[#0ea472] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {gerandoLaudo || vizCarregando ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {gerandoLaudo ? 'Gerando…' : vizCarregando ? 'Consultando entorno…' : 'Gerar Laudo Executivo 5 Agentes'}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className={labelCls}>CEP do imóvel</label>
            <input className={inputCls} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="38400-000" inputMode="numeric" />
          </div>
          <div>
            <label className={labelCls}>Valor pedido pelo dono (R$)</label>
            <input className={inputCls} value={valorPedido} onChange={(e) => setValorPedido(e.target.value)} placeholder="450000" inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>CDI anual (%)</label>
            <input className={inputCls} value={cdi} onChange={(e) => setCdi(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>FII de tijolo (%)</label>
            <input className={inputCls} value={fii} onChange={(e) => setFii(e.target.value)} inputMode="decimal" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Fotos do imóvel (até 3 · análise visual Gemini)</label>
          <div className="flex flex-wrap items-center gap-2">
            {fotos.map((foto, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-800">
                <img src={foto} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => setFotos((atual) => atual.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-0.5 text-slate-300 hover:text-white"
                  title="Remover foto"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {fotos.length < 3 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 text-slate-500 transition hover:border-[#10b981] hover:text-[#10b981]">
                <Camera size={18} />
                <span className="text-[9px] font-bold uppercase">Anexar</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={adicionarFotos} />
              </label>
            )}
          </div>
          {analiseFotos && (
            <p className="mt-2 text-[10px] text-slate-400">
              Fotos: padrão <strong className="text-slate-200">{analiseFotos.padraoConstrutivo}</strong> ·
              conservação <strong className="text-slate-200">{analiseFotos.estadoConservacao}</strong>
              {analiseFotos.confianca ? ` · confiança ${analiseFotos.confianca}%` : ''}
            </p>
          )}
          {erroFoto && <p className="mt-1 text-[10px] text-amber-300">{erroFoto}</p>}
        </div>

        {!temArea && (
          <p className="flex items-center gap-1.5 text-[10px] text-amber-300">
            <AlertTriangle size={12} /> Informe a área do imóvel para liberar o laudo executivo.
          </p>
        )}
      </div>

      <LaudoExecutivo
        laudo={laudo}
        meta={meta}
        vizinhanca={vizinhanca}
        analiseFotos={analiseFotos}
        avaliacao={avaliacao}
        valorPedido={Number(valorPedido) || 0}
        dados={{ cidade, bairro, uf, padrao, estado }}
        carregando={gerandoLaudo || vizCarregando}
        fase={vizCarregando ? 'Consultando ViaCEP, OpenStreetMap e Overpass…' : fase}
        erro={erroLaudo}
      />

      {/* Saídas */}
      <div className={`${card} p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 p-1">
            <button
              onClick={() => setAbaSaida('resumo')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${abaSaida === 'resumo' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare size={12} /> Resumo comercial
            </button>
            <button
              onClick={() => setAbaSaida('ptam')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${abaSaida === 'ptam' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText size={12} /> Documento PTAM
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiar}
              className="inline-flex items-center gap-2 rounded-xl border border-[#10b981]/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#10b981] transition hover:border-[#10b981]"
            >
              {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'Copiado' : abaSaida === 'resumo' ? 'Copiar WhatsApp' : 'Copiar documento'}
            </button>
            <button
              onClick={imprimir}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-500"
            >
              <Printer size={13} /> Imprimir / PDF
            </button>
          </div>
        </div>

        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] leading-relaxed text-slate-300">
          {temArea ? (abaSaida === 'resumo' ? resumo : documento) : 'Informe a área do imóvel para gerar o parecer.'}
        </pre>

        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Sparkles size={11} />
          {abaSaida === 'resumo'
            ? 'Resumo curto para convencer na conversa — cita topografia, poste, bueiro e arrimo quando marcados.'
            : 'Documento completo no padrão COFECI 1.066/2007, com partes, metodologia, fatores, amostras e bloco de assinatura.'}
        </p>
      </div>
    </div>
  );
}
