import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Image as ImageIcon, Download, Copy, Check, Loader2, Palette,
  Megaphone, Wand2, RefreshCw, AlertTriangle, Camera,
} from 'lucide-react';
import useEstudioMarketing from '../../hooks/useEstudioMarketing';
import {
  MODOS, FUNDOS, RODAPE_ILUSTRATIVO, interpretarEstudio,
} from '../../lib/marketing/estudio.js';
import {
  FORMATOS, DESENHOS_FUNDO, renderizarArte, baixarPng, nomeArquivo, formatarWhatsApp, textoRodape,
} from '../../lib/marketing/geradorArteCanvas.js';

const card = 'bg-slate-900/90 border border-slate-800 rounded-3xl';
const inputCls = 'w-full bg-[#020408] border border-slate-800 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const labelCls = 'block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function MiniFundo({ indice, ativo, onClick }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const desenho = DESENHOS_FUNDO[indice];
    canvas.width = 240;
    canvas.height = 240;
    desenho(ctx, 240, 240);
  }, [indice]);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-xl border-2 transition ${ativo ? 'border-[#10b981]' : 'border-slate-800 hover:border-slate-600'}`}
      title={FUNDOS[indice]?.label}
    >
      <canvas ref={ref} className="block h-20 w-20" />
    </button>
  );
}

export default function EstudioPosts({ config = {}, listaImoveis = [] }) {
  const [modo, setModo] = useState('imovel');
  const [imovelId, setImovelId] = useState('');
  const [fotoLocal, setFotoLocal] = useState('');
  const [fundoIndice, setFundoIndice] = useState(0);
  const [formato, setFormato] = useState('feed');

  const [selo, setSelo] = useState('EXCLUSIVO');
  const [headline, setHeadline] = useState('');
  const [bullets, setBullets] = useState(['', '', '']);

  const [tema, setTema] = useState('Minha Casa Minha Vida');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [faixaValor, setFaixaValor] = useState('');
  const [subsidio, setSubsidio] = useState('');
  const [vantagens, setVantagens] = useState(['', '', '']);

  const [previa, setPrevia] = useState(null);
  const [previaLoading, setPreviaLoading] = useState(false);
  const [copiado, setCopiado] = useState('');
  const [erroArte, setErroArte] = useState('');

  const { resultado, gerando, erro, meta, gerar } = useEstudioMarketing();

  const imovel = useMemo(
    () => (Array.isArray(listaImoveis) ? listaImoveis.find((i) => i.id === imovelId) : null),
    [listaImoveis, imovelId],
  );

  const imagemUrl = fotoLocal || imovel?.fotoCapa || imovel?.fotos?.[0] || imovel?.capaUrl || '';
  const whatsapp = formatarWhatsApp(config?.whatsapp || config?.telefone || '');
  const creci = config?.creci || '';

  // Ao escolher imóvel, preenche a arte
  useEffect(() => {
    if (!imovel) return;
    setHeadline(String(imovel.titulo || '').slice(0, 45));
    setBullets([
      [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ') || '',
      imovel.quartos ? `${imovel.quartos} quartos` : '',
      imovel.valor ? brl(imovel.valor) : '',
    ].map((b) => String(b).slice(0, 28)));
    setSelo(imovel.finalidade ? String(imovel.finalidade).toUpperCase() : 'EXCLUSIVO');
  }, [imovel]);

  function enviarFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) { setErroArte('Envie uma imagem.'); return; }
    const leitor = new FileReader();
    leitor.onload = () => setFotoLocal(String(leitor.result));
    leitor.readAsDataURL(arquivo);
    e.target.value = '';
  }

  function dadosParaIA() {
    return {
      modo,
      titulo: imovel?.titulo || '',
      bairro: modo === 'imovel' ? (imovel?.bairro || '') : bairro,
      cidade: modo === 'imovel' ? (imovel?.cidade || '') : cidade,
      metragem: imovel?.metragemTerreno || imovel?.metragem || '',
      quartos: imovel?.quartos || '',
      valor: imovel?.valor || '',
      tema,
      faixaValor,
      subsidio,
      vantagens: modo === 'imovel'
        ? bullets.filter(Boolean)
        : vantagens.filter(Boolean),
      publico: '',
      tom: 'profissional',
    };
  }

  async function gerarPacote() {
    const pacote = await gerar(dadosParaIA());
    if (!pacote) return;
    setHeadline(pacote.headlineArte || headline);
    setBullets([0, 1, 2].map((i) => pacote.bulletsArte[i] || ''));
    await desenhar(pacote);
  }

  async function desenhar(pacote = resultado) {
    setErroArte('');
    setPreviaLoading(true);
    try {
      const url = await renderizarArte({
        formato,
        modo,
        imagemUrl,
        fundoIndice,
        seloTexto: selo,
        headline: headline || pacote?.headlineArte || '',
        bullets: (bullets.filter(Boolean).length ? bullets : pacote?.bulletsArte) || [],
        logoUrl: config?.logoUrl || '',
        whatsapp,
        creci,
        rodape: modo === 'conceitual' ? RODAPE_ILUSTRATIVO : '',
      });
      setPrevia(url);
    } catch (e) {
      setErroArte(String(e?.message || e));
    } finally {
      setPreviaLoading(false);
    }
  }

  async function baixar(todas = false) {
    const formatos = todas ? ['feed', 'story'] : [formato];
    for (const f of formatos) {
      const url = await renderizarArte({
        formato: f,
        modo,
        imagemUrl,
        fundoIndice,
        seloTexto: selo,
        headline,
        bullets: bullets.filter(Boolean),
        logoUrl: config?.logoUrl || '',
        whatsapp,
        creci,
        rodape: modo === 'conceitual' ? RODAPE_ILUSTRATIVO : '',
      });
      baixarPng(url, nomeArquivo(f, modo));
    }
  }

  async function copiar(texto, chave) {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 2000);
    } catch { setCopiado(''); }
  }

  const legenda = resultado?.legendaInstagramFacebook || '';
  const roteiro = resultado?.roteiroTikTokReels || null;
  const trafego = resultado?.pacoteTrafegoPago || [];

  return (
    <div className="space-y-5">
      {/* modos */}
      <div className={`${card} p-5`}>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#10b981]">
          <Wand2 size={13} /> Estúdio de posts sociais
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MODOS.map((m) => (
            <button
              key={m.key}
              onClick={() => setModo(m.key)}
              className={`rounded-2xl border p-3 text-left transition ${modo === m.key ? 'border-[#10b981] bg-[#10b981]/10' : 'border-slate-800 hover:border-slate-600'}`}
            >
              <span className="flex items-center gap-2 text-[12px] font-black text-white">
                {m.key === 'imovel' ? <Camera size={13} /> : <Palette size={13} />} {m.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">{m.descricao}</span>
            </button>
          ))}
        </div>

        {modo === 'imovel' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Imóvel da carteira</label>
              <select className={inputCls} value={imovelId} onChange={(e) => setImovelId(e.target.value)}>
                <option value="">Selecione…</option>
                {listaImoveis.map((i) => (
                  <option key={i.id} value={i.id}>{i.titulo || i.codigo || i.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>…ou foto local</label>
              <label className={`${inputCls} flex cursor-pointer items-center gap-2`}>
                <ImageIcon size={13} /> {fotoLocal ? 'Foto carregada' : 'Escolher imagem'}
                <input type="file" accept="image/*" className="hidden" onChange={enviarFoto} />
              </label>
            </div>
            <div>
              <label className={labelCls}>Selo superior</label>
              <input className={inputCls} value={selo} onChange={(e) => setSelo(e.target.value.slice(0, 22))} placeholder="EXCLUSIVO" />
            </div>
          </div>
        )}

        {modo === 'conceitual' && (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Tema da campanha</label>
                <input className={inputCls} value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Minha Casa Minha Vida" />
              </div>
              <div>
                <label className={labelCls}>Bairro</label>
                <input className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Santa Mônica" />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input className={inputCls} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Uberlândia" />
              </div>
              <div>
                <label className={labelCls}>Faixa de valor</label>
                <input className={inputCls} value={faixaValor} onChange={(e) => setFaixaValor(e.target.value)} placeholder="R$ 180 mil a R$ 350 mil" />
              </div>
              <div>
                <label className={labelCls}>Subsídio / condição</label>
                <input className={inputCls} value={subsidio} onChange={(e) => setSubsidio(e.target.value)} placeholder="Subsídio de até R$ 55 mil" />
              </div>
              <div>
                <label className={labelCls}>Selo superior</label>
                <input className={inputCls} value={selo} onChange={(e) => setSelo(e.target.value.slice(0, 22))} placeholder="MCMV" />
              </div>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Vantagens (até 3)</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {vantagens.map((v, i) => (
                  <input
                    key={i}
                    className={inputCls}
                    maxLength={28}
                    value={v}
                    onChange={(e) => setVantagens((atual) => atual.map((x, idx) => (idx === i ? e.target.value : x)))}
                    placeholder={`Vantagem ${i + 1} (28 chars)`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Fundo arquitetônico</label>
              <div className="flex flex-wrap gap-2">
                {FUNDOS.map((f) => (
                  <MiniFundo key={f.key} indice={f.indice} ativo={fundoIndice === f.indice} onClick={() => setFundoIndice(f.indice)} />
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className={labelCls}>Formato</label>
            <select className={inputCls} value={formato} onChange={(e) => setFormato(e.target.value)}>
              {Object.values(FORMATOS).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <div className="min-w-[220px] flex-1">
            <label className={labelCls}>Headline (máx 45)</label>
            <input className={inputCls} maxLength={45} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Gerada pela IA ou escrita por você" />
          </div>
          <button
            onClick={gerarPacote}
            disabled={gerando}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 disabled:opacity-40"
          >
            {gerando ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {gerando ? 'Gerando…' : 'Gerar com IA'}
          </button>
          <button
            onClick={() => desenhar()}
            disabled={previaLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40"
          >
            <RefreshCw size={12} /> Prévia
          </button>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {bullets.map((b, i) => (
            <input
              key={i}
              className={inputCls}
              maxLength={28}
              value={b}
              onChange={(e) => setBullets((atual) => atual.map((x, idx) => (idx === i ? e.target.value : x)))}
              placeholder={`Bullet ${i + 1} (28 chars)`}
            />
          ))}
        </div>

        {erro && <p className="mt-2 flex items-start gap-1.5 text-[10px] text-red-300"><AlertTriangle size={11} className="mt-0.5" /> {erro}</p>}
        {erroArte && <p className="mt-2 text-[10px] text-red-300">{erroArte}</p>}
        {modo === 'conceitual' && (
          <p className="mt-2 text-[10px] text-slate-500">Rodapé automático: “{RODAPE_ILUSTRATIVO}”.</p>
        )}
      </div>

      {/* preview + download */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${card} p-5`}>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <ImageIcon size={13} /> Prévia {FORMATOS[formato]?.label}
          </p>
          <div className="mt-3 flex items-center justify-center rounded-2xl border border-slate-800 bg-[#020408] p-3">
            {previaLoading ? (
              <Loader2 size={20} className="animate-spin text-slate-500" />
            ) : previa ? (
              <img src={previa} alt="Prévia da arte" className="max-h-[420px] w-auto rounded-xl" />
            ) : (
              <p className="py-16 text-[11px] text-slate-500">Clique em “Prévia” para montar a arte.</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => baixar(false)} disabled={!previa} className="inline-flex items-center gap-1.5 rounded-xl border border-[#10b981]/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#10b981] disabled:opacity-40">
              <Download size={12} /> Baixar PNG ({formato === 'feed' ? '1080×1080' : '1080×1920'})
            </button>
            <button onClick={() => baixar(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <Download size={12} /> Baixar os dois
            </button>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Megaphone size={13} /> Legenda, roteiro e tráfego
          </p>

          {!resultado ? (
            <p className="mt-3 text-[11px] text-slate-500">
              Clique em “Gerar com IA” para receber headline, bullets, legenda, roteiro de 30s e 3 variações de anúncio.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <p className={labelCls}>Legenda Instagram/Facebook</p>
                  <button onClick={() => copiar(legenda, 'legenda')} className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#10b981]">
                    {copiado === 'legenda' ? <Check size={10} /> : <Copy size={10} />} copiar
                  </button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-[#020408] p-2 text-[10px] leading-relaxed text-slate-300">{legenda}</pre>
              </div>

              {roteiro && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className={labelCls}>Roteiro TikTok/Reels (30s)</p>
                    <button
                      onClick={() => copiar([`GANCHO: ${roteiro.gancho}`, `APRESENTAÇÃO: ${roteiro.apresentacao}`, `CTA: ${roteiro.cta}`].join('\n\n'), 'roteiro')}
                      className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#10b981]"
                    >
                      {copiado === 'roteiro' ? <Check size={10} /> : <Copy size={10} />} copiar
                    </button>
                  </div>
                  <ul className="rounded-xl border border-slate-800 bg-[#020408] p-2 text-[10px] leading-relaxed text-slate-300">
                    <li><strong className="text-white">Gancho:</strong> {roteiro.gancho}</li>
                    <li className="mt-1"><strong className="text-white">Apresentação:</strong> {roteiro.apresentacao}</li>
                    <li className="mt-1"><strong className="text-white">CTA:</strong> {roteiro.cta}</li>
                  </ul>
                </div>
              )}

              {trafego.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <p className={labelCls}>Tráfego pago — Meta Ads</p>
                    <button
                      onClick={() => copiar(trafego.map((v, i) => `#${i + 1} ${v.titulo}\nObjetivo: ${v.objetivo}\nPúblico: ${v.publico}\n\n${v.texto}`).join('\n\n---\n\n'), 'trafego')}
                      className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#10b981]"
                    >
                      {copiado === 'trafego' ? <Check size={10} /> : <Copy size={10} />} copiar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {trafego.map((v, i) => (
                      <div key={i} className="rounded-xl border border-slate-800 p-2">
                        <p className="text-[10px] font-black text-white">{i + 1}. {v.titulo}</p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">{v.objetivo} · {v.publico}</p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-300">{v.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[9px] text-slate-500">modelo {meta?.modelo || '—'} · pacote validado nos limites da arte (45/28/3)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
