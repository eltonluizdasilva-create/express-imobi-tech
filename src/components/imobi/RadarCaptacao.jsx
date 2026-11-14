import React, { useEffect, useMemo, useState } from 'react';
import {
  Radar, ExternalLink, Search, ClipboardPaste, Copy, Check, FileDown,
  AlertTriangle, TrendingDown, TrendingUp, Sparkles,
} from 'lucide-react';
import HeroAba from '../admin/HeroAba';
import GuiaDaAba from '../ui/GuiaDaAba';
import SeletorUF from '../ui/SeletorUF';
import { corDaAba } from '../../lib/coresAbas';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  montarBuscas, extrairAnuncio, analisarAnuncio, gerarScriptsAbordagem,
  gerarXmlPortais, baixarArquivo,
} from '../../lib/radar';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function RadarCaptacao({ dadosOficina }) {
  const corAba = corDaAba('radar_captacao');
  const tenantId = dadosOficina?.id || dadosOficina?.uid || null;

  const [uf, setUf] = useState('MG');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [nicho, setNicho] = useState('urbano');

  const [anuncioTexto, setAnuncioTexto] = useState('');
  const [copiado, setCopiado] = useState(null);
  const [imoveis, setImoveis] = useState([]);
  const [xmlGerado, setXmlGerado] = useState(null);

  useEffect(() => {
    if (!tenantId) return undefined;
    const unsub = onSnapshot(
      collection(db, 'oficinas', tenantId, 'imoveis_imobi'),
      (snap) => setImoveis(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setImoveis([]),
    );
    return () => unsub();
  }, [tenantId]);

  const buscas = useMemo(() => montarBuscas({ cidade, bairro, uf, nicho }), [cidade, bairro, uf, nicho]);

  const anuncio = useMemo(() => extrairAnuncio(anuncioTexto), [anuncioTexto]);
  const analise = useMemo(
    () => (anuncio.temPreco || anuncio.temArea ? analisarAnuncio(anuncio, { uf, cidade, bairro }) : null),
    [anuncio, uf, cidade, bairro],
  );
  const scripts = useMemo(
    () => (analise ? gerarScriptsAbordagem(anuncio, analise, { imobiliaria: dadosOficina?.nomeOficina || 'nossa imobiliária', uf }) : []),
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
    <div className="space-y-6">
      <HeroAba
        icone={Radar}
        titulo="Radar de"
        destaque="Captação"
        chip="Particulares na OLX, Facebook e Google"
        subtitulo="Encontre o anúncio direto com o proprietário, deixe o motor ler o preço contra o mercado e chegue com avaliação técnica e segurança jurídica na mão."
        cor={corAba}
      />

      <SeletorUF onChange={(p) => setUf(p.ufPadrao)} />

      <GuiaDaAba
        titulo="Radar de Captação"
        descricao="Escolha cidade, bairro e nicho: o sistema monta as buscas de anúncios de particular. Achou um? Cole o texto do anúncio aqui e receba a leitura de preço mais três scripts de WhatsApp. No fim, exporte a carteira no XML que os portais aceitam."
      />

      {/* ── A. Gerador de buscas ── */}
      <div className={`${card} p-5`}>
        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
          <Search size={13} /> Radar de proprietários
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Cidade</label>
            <input className={inputCls} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Uberlândia" />
          </div>
          <div>
            <label className={labelCls}>Bairro</label>
            <input className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Santa Mônica" />
          </div>
          <div>
            <label className={labelCls}>Nicho</label>
            <select className={inputCls} value={nicho} onChange={(e) => setNicho(e.target.value)}>
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
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2.5 transition hover:border-[#10b981]/60"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-black text-white">{b.label}</span>
                <span className="block truncate text-[10px] text-slate-500">{b.detalhe}</span>
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
        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
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
            <div className="rounded-2xl border border-slate-800 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Extraído</p>
              <p className="mt-1 text-sm font-black text-white">{anuncio.temPreco ? brl(anuncio.preco) : 'sem preço'}</p>
              <p className="text-[10px] text-slate-500">
                {anuncio.temArea ? `${anuncio.area} m²` : 'sem área'}
                {anuncio.quartos ? ` · ${anuncio.quartos} quartos` : ''}
                {anuncio.contato ? ` · ${anuncio.contato}` : ''}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-400">Preço por m²</p>
              <p className="mt-1 text-sm font-black text-white">
                {anuncio.temArea && anuncio.temPreco ? brl(analise.precoM2) : '—'}
              </p>
              <p className="text-[10px] text-slate-500">mercado: {brl(analise.referenciaM2)}/m²</p>
            </div>
            <div className={`rounded-2xl border p-3 ${analise.desvioPct > 15 ? 'border-rose-500/40 bg-rose-500/10' : analise.desvioPct < -15 ? 'border-[#10b981]/40 bg-[#10b981]/10' : 'border-slate-800'}`}>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                {analise.desvioPct > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} Desvio
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {analise.desvioPct > 0 ? '+' : ''}{analise.desvioPct}%
              </p>
              <p className="text-[10px] text-slate-400">{analise.leitura}</p>
            </div>
          </div>
        )}

        {scripts.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Sparkles size={12} /> 3 abordagens prontas
            </p>
            {scripts.map((s) => (
              <div key={s.key} className="rounded-2xl border border-slate-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-white">{s.titulo}</span>
                  <button
                    onClick={() => copiar(s.key, s.texto)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#10b981]/50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#10b981] hover:border-[#10b981]"
                  >
                    {copiado === s.key ? <Check size={12} /> : <Copy size={12} />}
                    {copiado === s.key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">{s.texto}</p>
              </div>
            ))}
          </div>
        )}

        {anuncioTexto && !anuncio.temPreco && !anuncio.temArea && (
          <p className="mt-3 flex items-start gap-1.5 text-[10px] text-amber-300">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            Não identifiquei preço nem área no texto colado. Inclua o valor e a metragem para o motor comparar com o mercado.
          </p>
        )}
      </div>

      {/* ── C. Exportação para portais ── */}
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
              <FileDown size={13} /> Exportação para portais
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Gera <strong className="text-slate-200">feed-portais.xml</strong> com os imóveis ativos cadastrados — formato de carga aceito por ZAP, VivaReal e OLX.
            </p>
          </div>
          <button
            onClick={exportarXml}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110"
            style={{ backgroundColor: corAba }}
          >
            <FileDown size={14} /> Baixar feed XML
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
          <span>{imoveis.length} imóvel(is) na carteira</span>
          {xmlGerado && (
            <span className="font-bold text-[#10b981]">
              gerado com {xmlGerado.imoveis} imóvel(is) · {(xmlGerado.tamanho / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
