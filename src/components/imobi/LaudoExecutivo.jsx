import React, { useMemo, useState } from 'react';
import {
  Sparkles, Copy, Check, Printer, TrendingUp, MapPin, Clock, Gauge,
  Wallet, Camera, Home, AlertTriangle, Loader2, Award,
} from 'lucide-react';
import { classificarScore, PESOS_AGENTES } from '../../hooks/useLaudoImobi.js';
import { identidadeDocumento } from '../../lib/avaliacao.js';
import { CATEGORIAS_ENTORNO } from '../../services/vizinhancaService.js';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v) => `${(Number(v) || 0).toFixed(2).replace('.', ',')}%`;

/** Anel de score em SVG puro (sem dependência de gráfico). */
function AnelScore({ score, cor }) {
  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;
  const traco = (Math.max(0, Math.min(100, score)) / 100) * circunferencia;
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
      <circle cx="70" cy="70" r={raio} fill="none" stroke="#1e293b" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={raio} fill="none" stroke={cor} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${traco} ${circunferencia - traco}`} transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fill="#ffffff" fontSize="30" fontWeight="900">{score}</text>
      <text x="70" y="86" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="700">/ 100</text>
    </svg>
  );
}

function BarraDias({ rotulo, dias, maximo, cor }) {
  const largura = maximo > 0 ? Math.min(100, Math.round((dias / maximo) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rotulo}</span>
        <strong className="text-sm font-black text-white">{dias} dias</strong>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full transition-all" style={{ width: `${largura}%`, backgroundColor: cor }} />
      </div>
    </div>
  );
}

export default function LaudoExecutivo({
  laudo, meta, vizinhanca, analiseFotos, avaliacao, valorPedido, dados,
  carregando, fase, erro, identidade,
}) {
  // Rótulo do documento: PTAM só com nome + CRECI do corretor; caso contrário,
  // estudo estimativo (ver lib/avaliacao.js → identidadeDocumento).
  const doc = identidade || identidadeDocumento(dados || {});
  const [copiado, setCopiado] = useState('');

  const score = Number(laudo?.scoreImobi) || 0;
  const classe = useMemo(() => classificarScore(score), [score]);
  const a1 = laudo?.agente1 || {};
  const a2 = laudo?.agente2 || {};
  const a3 = laudo?.agente3 || {};
  const a4 = laudo?.agente4 || {};
  const a5 = laudo?.agente5 || {};

  const diasPedido = Number(a4.diasNoPrecoPedido) || 0;
  const diasJusto = Number(a4.diasNoPrecoJusto) || 0;
  const maxDias = Math.max(diasPedido, diasJusto, 1);
  const cdi = Number(meta?.cdi) || 0;
  const fii = Number(meta?.fii) || 0;

  async function copiar(texto, chave) {
    try {
      await navigator.clipboard.writeText(texto || '');
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 2000);
    } catch { setCopiado(''); }
  }

  function imprimir() {
    const janela = window.open('', '_blank');
    if (!janela) { alert('Permita pop-ups para gerar o PDF executivo.'); return; }
    const pontos = (vizinhanca?.ok ? vizinhanca.pontos : []).slice(0, 12)
      .map((p) => `<tr><td>${p.nome}</td><td>${(CATEGORIAS_ENTORNO.find((c) => c.key === p.categoria) || {}).label || p.categoria}</td><td>${p.metros} m</td></tr>`).join('');
    const bloco = (titulo, peso, nota, texto) => `
      <h3>${titulo} <span class="peso">peso ${Math.round(peso * 100)}% · nota ${nota}/100</span></h3>
      <p>${texto || '—'}</p>`;
    janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>${doc.titulo} — ${dados?.cidade || ''}</title>
      <style>
        *{box-sizing:border-box} body{font-family:Segoe UI,Arial,sans-serif;color:#111;margin:32px;font-size:12px;line-height:1.5}
        h1{font-size:20px;margin:0 0 4px} h2{font-size:14px;margin:22px 0 8px;border-bottom:2px solid #10b981;padding-bottom:4px}
        h3{font-size:12px;margin:14px 0 4px} .peso{font-weight:400;color:#555;font-size:11px}
        .topo{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #10b981;padding-bottom:10px}
        .score{font-size:34px;font-weight:900;color:#10b981;line-height:1}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
        .box{border:1px solid #ddd;border-radius:8px;padding:8px}
        table{width:100%;border-collapse:collapse;margin-top:6px} td,th{border-bottom:1px solid #eee;padding:4px 6px;text-align:left;font-size:11px}
        .mini{color:#666;font-size:10px}
        pre{white-space:pre-wrap;font-family:inherit;background:#f6f6f6;padding:10px;border-radius:8px}
        @page{margin:14mm}
      </style></head><body>
      <div class="topo">
        <div>
          <h1>{doc.temResponsavel ? 'Laudo Executivo — PTAM' : 'Estudo Estimativo de Valor de Mercado'}</h1>
          <div class="mini">Express Imobi Tech · {doc.temResponsavel ? 'PTAM ABNT NBR 14.653' : 'estudo estimativo — NÃO é PTAM nem laudo'} · {dados?.cidade || '—'}/{dados?.uf || '—'} · {dados?.bairro || '—'}</div>
          <div class="mini">Gerado em ${new Date().toLocaleString('pt-BR')} · modelo ${meta?.modelo || '—'}</div>
        </div>
        <div style="text-align:right"><div class="score">${score}<span style="font-size:13px">/100</span></div><div class="mini">${classe.rotulo}</div></div>
      </div>

      ${doc.temResponsavel ? '' : '<div style="margin-top:10px;border:1px solid #b45309;background:#fef3c7;color:#7c2d12;padding:8px 10px;border-radius:6px;font-size:11px"><strong>ESTUDO ESTIMATIVO DE VALOR DE MERCADO.</strong> Sem nome e CRECI do corretor: não é PTAM, não é laudo e não serve para garantia, financiamento ou decisão judicial.</div>'}

      <h2>1. Resumo executivo</h2>
      <p>${laudo?.resumoExecutivo || '—'}</p>

      <div class="grid">
        <div class="box"><strong>Valor pedido</strong><br>${brl(valorPedido)}</div>
        <div class="box"><strong>Valor justo ${doc.temResponsavel ? '(PTAM)' : '(estimado)'}</strong><br>${brl(a1.valorJustoRecomendado || avaliacao?.valorJusto)}</div>
        <div class="box"><strong>Faixa de mercado</strong><br>${brl(a1.faixaMinima)} a ${brl(a1.faixaMaxima)}</div>
        <div class="box"><strong>Diferença do pedido</strong><br>${pct(a1.diferencaPercentualPedido)}</div>
        <div class="box"><strong>Aluguel estimado</strong><br>${brl(a2.aluguelMensal)}/mês</div>
        <div class="box"><strong>Cap Rate · ROI 5 anos</strong><br>${pct(a2.capRateAnual)} · ${pct(a2.roi5Anos)}</div>
        <div class="box"><strong>Liquidez</strong><br>${diasPedido} dias no pedido · ${diasJusto} dias no justo</div>
        <div class="box"><strong>Localização</strong><br>${vizinhanca?.ok ? `${vizinhanca.nota}/100 — ${vizinhanca.classificacao}` : 'indisponível'}</div>
      </div>

      <h2>2. Parecer dos 5 agentes</h2>
      ${bloco('Agente 1 — Comparáveis & valor de referência', PESOS_AGENTES.comparaveis, a1.nota, a1.analise)}
      ${bloco('Agente 2 — Investimento & Renda', PESOS_AGENTES.investimento, a2.nota, a2.comparativo)}
      ${bloco('Agente 3 — Bairro & Infraestrutura', PESOS_AGENTES.bairro, a3.nota, a3.analise)}
      ${bloco('Agente 4 — Liquidez & Tempo de Venda', PESOS_AGENTES.liquidez, a4.nota, a4.analise)}
      ${bloco('Agente 5 — Copywriting & Captação', PESOS_AGENTES.copy, a5.nota, a5.argumentoProprietario)}

      <h2>3. Raio-X do entorno (1 km)</h2>
      <p>${vizinhanca?.ok ? `${vizinhanca.total} pontos reais encontrados via OpenStreetMap. Nota ${vizinhanca.nota}/100.` : (vizinhanca?.motivo || 'sem dados')}</p>
      ${pontos ? `<table><tr><th>Estabelecimento</th><th>Categoria</th><th>Distância</th></tr>${pontos}</table>` : ''}

      <h2>4. Anúncio pronto</h2>
      <pre>${(a5.anuncio || '—').replace(/</g, '&lt;')}</pre>

      <h2>5. Base técnica</h2>
      <p class="mini">Metodologia: ${avaliacao?.metodo || 'comparativo direto'} · grau de fundamentação ${avaliacao?.grauFundamentacao || '—'} · padrão ${dados?.padrao || '—'} · conservação ${dados?.estado || '—'}${analiseFotos ? ` · fotos: padrão ${analiseFotos.padraoConstrutivo}, conservação ${analiseFotos.estadoConservacao} (confiança ${analiseFotos.confianca}%)` : ''}.</p>
      <p class="mini">Este parecer é apoio à decisão comercial e não substitui laudo de engenharia com ART/RRT. Benchmarks: CDI ${cdi}% a.a. · FII de tijolo ${fii}% a.a.</p>
      </body></html>`);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 400);
  }

  if (!laudo && !carregando && !erro) return null;

  return (
    <div className="space-y-4">
      {carregando && (
        <div className={`${card} flex items-center gap-3 p-5`}>
          <Loader2 size={18} className="animate-spin text-[#10b981]" />
          <div>
            <p className="text-sm font-black text-white">Gerando laudo executivo…</p>
            <p className="text-[11px] text-slate-400">{fase || 'Preparando os agentes'}</p>
          </div>
        </div>
      )}

      {erro && !carregando && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-[11px] leading-relaxed text-amber-200">{erro}</p>
        </div>
      )}

      {laudo && (
        <>
          {/* Score + classificação */}
          <div className={`${card} p-5`}>
            <div className="flex flex-wrap items-center gap-5">
              <AnelScore score={score} cor={classe.cor} />
              <div className="min-w-[240px] flex-1">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Award size={13} /> Score Imobi Composto
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: `${classe.cor}22`, color: classe.cor }}>
                    {classe.rotulo}
                  </span>
                  <span className="text-[11px] text-slate-400">{classe.tom}</span>
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{laudo.resumoExecutivo}</p>
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {[
                    ['PTAM', a1.nota, PESOS_AGENTES.comparaveis],
                    ['Renda', a2.nota, PESOS_AGENTES.investimento],
                    ['Bairro', a3.nota, PESOS_AGENTES.bairro],
                    ['Liquidez', a4.nota, PESOS_AGENTES.liquidez],
                    ['Copy', a5.nota, PESOS_AGENTES.copy],
                  ].map(([rotulo, nota, peso]) => (
                    <div key={rotulo} className="rounded-xl border border-slate-800 px-2 py-1.5 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{rotulo}</p>
                      <p className="text-sm font-black text-white">{Number(nota) || 0}</p>
                      <p className="text-[9px] text-slate-500">{Math.round(peso * 100)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Valor e faixa */}
            <div className={`${card} p-5`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Gauge size={13} /> Comparáveis & PTAM · agente 1
              </p>
              <p className="mt-1 text-2xl font-black text-white">{brl(a1.valorJustoRecomendado || avaliacao?.valorJusto)}</p>
              <p className="text-[11px] text-slate-500">
                faixa {brl(a1.faixaMinima)} — {brl(a1.faixaMaxima)} · pedido {brl(valorPedido)}
              </p>
              <p className="mt-2 text-[11px] font-bold" style={{ color: Number(a1.diferencaPercentualPedido) > 0 ? '#f97316' : '#10b981' }}>
                Pedido {Number(a1.diferencaPercentualPedido) > 0 ? 'acima' : 'abaixo'} do justo em {pct(Math.abs(Number(a1.diferencaPercentualPedido) || 0))}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{a1.analise}</p>
              {(analiseFotos || a1.padraoIdentificado) && (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Camera size={11} /> Fotos: padrão {a1.padraoIdentificado || analiseFotos?.padraoConstrutivo} · conservação {a1.estadoIdentificado || analiseFotos?.estadoConservacao}
                  {analiseFotos?.confianca ? ` (confiança ${analiseFotos.confianca}%)` : ''}
                </p>
              )}
            </div>

            {/* Renda fixa */}
            <div className={`${card} p-5`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Wallet size={13} /> Imóvel vs. Renda Fixa · agente 2
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 px-2 py-2">
                  <p className="text-[9px] font-black uppercase text-[#10b981]">Cap Rate</p>
                  <p className="text-lg font-black text-white">{pct(a2.capRateAnual)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 px-2 py-2">
                  <p className="text-[9px] font-black uppercase text-slate-400">CDI</p>
                  <p className="text-lg font-black text-white">{pct(cdi)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 px-2 py-2">
                  <p className="text-[9px] font-black uppercase text-slate-400">FII tijolo</p>
                  <p className="text-lg font-black text-white">{pct(fii)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
                <TrendingUp size={13} className="text-[#10b981]" />
                Aluguel {brl(a2.aluguelMensal)}/mês · ROI 5 anos {pct(a2.roi5Anos)}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{a2.comparativo}</p>
            </div>

            {/* Liquidez */}
            <div className={`${card} p-5`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock size={13} /> Dias estimados para venda · agente 4
              </p>
              <div className="mt-3 space-y-3">
                <BarraDias rotulo="No preço pedido" dias={diasPedido} maximo={maxDias} cor="#ef4444" />
                <BarraDias rotulo="No preço do PTAM" dias={diasJusto} maximo={maxDias} cor="#10b981" />
              </div>
              <p className="mt-2 text-[10px] font-bold text-slate-400">
                Diferença de {Math.max(0, diasPedido - diasJusto)} dias a menos ajustando o preço.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{a4.analise}</p>
            </div>

            {/* Entorno */}
            <div className={`${card} p-5`}>
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <MapPin size={13} /> Raio-X do entorno (1 km) · agente 3
              </p>
              {vizinhanca?.ok ? (
                <>
                  <p className="mt-1 text-2xl font-black text-white">{vizinhanca.nota}<span className="text-sm text-slate-500">/100</span></p>
                  <p className="text-[11px] text-slate-500">{vizinhanca.classificacao} · {vizinhanca.total} pontos reais (OSM)</p>
                  <div className="mt-2 grid grid-cols-5 gap-1">
                    {CATEGORIAS_ENTORNO.map((c) => (
                      <div key={c.key} className="rounded-lg border border-slate-800 px-1 py-1.5 text-center" title={c.label}>
                        <p className="text-sm">{c.icone}</p>
                        <p className="text-sm font-black text-white">{vizinhanca.contagem?.[c.key] || 0}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {vizinhanca.pontos.slice(0, 5).map((p) => (
                      <li key={`${p.nome}-${p.metros}`} className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span className="truncate">{p.nome}</span>
                        <span className="shrink-0 text-slate-500">{p.metros} m</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-2 text-[11px] text-amber-300">Raio-X indisponível: {vizinhanca?.motivo || 'sem endereço/CEP'}.</p>
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{a3.analise}</p>
            </div>
          </div>

          {/* Anúncio */}
          <div className={`${card} p-5`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Home size={13} /> Anúncio pronto · agente 5
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copiar(a5.anuncio, 'anuncio')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#10b981]/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#10b981] transition hover:border-[#10b981]"
                >
                  {copiado === 'anuncio' ? <Check size={12} /> : <Copy size={12} />} {copiado === 'anuncio' ? 'Copiado' : 'Copiar anúncio'}
                </button>
                <button
                  onClick={imprimir}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-500"
                >
                  <Printer size={12} /> Exportar laudo (PDF)
                </button>
              </div>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] leading-relaxed text-slate-300">
              {a5.anuncio || '—'}
            </pre>

            <div className="mt-3 rounded-xl border border-slate-800 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Argumento para o proprietário</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{a5.argumentoProprietario}</p>
              <button
                onClick={() => copiar(a5.argumentoProprietario, 'argumento')}
                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#10b981]"
              >
                {copiado === 'argumento' ? <Check size={12} /> : <Copy size={12} />} {copiado === 'argumento' ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
              <Sparkles size={11} /> Score calculado localmente com pesos 25/25/20/15/15 · modelo {meta?.modelo || '—'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
