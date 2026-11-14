import React, { useEffect, useMemo, useState } from 'react';
import { Store, ExternalLink, Copy, Check, ImageOff, Plus } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const E = '#6366f1';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Remove acentos e deixa o texto curto para o link/caption. */
function resumo(imovel = {}) {
  const tipo = imovel.tipo || imovel.categoria || 'Imóvel';
  const bairro = imovel.bairro || imovel.localizacao || '';
  const valor = imovel.valor || imovel.preco || 0;
  return { tipo, bairro, valor: Number(valor) || 0 };
}

export default function RadarVitrine({ dadosOficina, setAbaAtiva }) {
  const tenantId = dadosOficina?.id || dadosOficina?.uid || null;
  const [imoveis, setImoveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [copiadoId, setCopiadoId] = useState(null);

  useEffect(() => {
    if (!tenantId) {
      setCarregando(false);
      return undefined;
    }
    const unsub = onSnapshot(
      collection(db, 'oficinas', tenantId, 'imoveis_imobi'),
      (snap) => {
        setImoveis(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCarregando(false);
      },
      () => setCarregando(false),
    );
    return () => unsub();
  }, [tenantId]);

  const stats = useMemo(() => {
    const comFoto = imoveis.filter((i) => i.foto || i.fotoUrl || (Array.isArray(i.fotos) && i.fotos.length)).length;
    const comValor = imoveis.filter((i) => resumo(i).valor > 0).length;
    return { total: imoveis.length, comFoto, semValor: imoveis.length - comValor };
  }, [imoveis]);

  const linkDe = (id) => `${window.location.origin}/portal?vitrine=1&imovel=${encodeURIComponent(id)}`;

  async function copiarChamada(imovel) {
    const { tipo, bairro, valor } = resumo(imovel);
    const texto = [
      `${tipo}${bairro ? ` no ${bairro}` : ''}${valor ? ` por ${brl(valor)}` : ''}.`,
      'Fotos, detalhes e condições no link:',
      linkDe(imovel.id),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(imovel.id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      setCopiadoId(null);
    }
  }

  return (
    <div className="bg-slate-900/60 border border-indigo-500/25 rounded-3xl p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: E }}>
            <Store size={13} /> Radar de Vitrine &amp; Portal Público
          </p>
          <h3 className="mt-1 text-lg font-black text-white">Divulgação dos imóveis captados</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            O que está publicado em <strong className="text-slate-200">/portal</strong> e o que ainda falta para gerar chamada de venda.
          </p>
        </div>
        <a
          href="/portal?vitrine=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-300 transition hover:border-indigo-400"
        >
          <ExternalLink size={13} /> Abrir vitrine
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Captados</p>
          <p className="text-lg font-black text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Com foto</p>
          <p className="text-lg font-black text-white">{stats.comFoto}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Sem valor</p>
          <p className={`text-lg font-black ${stats.semValor > 0 ? 'text-amber-300' : 'text-white'}`}>{stats.semValor}</p>
        </div>
      </div>

      {carregando ? (
        <p className="text-xs text-slate-500">Carregando imóveis…</p>
      ) : imoveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-center">
          <ImageOff size={18} className="mx-auto text-slate-600" />
          <p className="mt-1 text-xs text-slate-400">Nenhum imóvel captado ainda.</p>
          {setAbaAtiva && (
            <button
              onClick={() => setAbaAtiva('captacao_imobi')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:border-slate-500"
            >
              <Plus size={12} /> Cadastrar imóvel
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {imoveis.slice(0, 6).map((imovel) => {
            const { tipo, bairro, valor } = resumo(imovel);
            const semFoto = !(imovel.foto || imovel.fotoUrl || (Array.isArray(imovel.fotos) && imovel.fotos.length));
            return (
              <div key={imovel.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black text-white">
                    {tipo}{bairro ? ` · ${bairro}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {valor > 0 ? brl(valor) : 'valor não informado'}
                    {semFoto && <span className="ml-2 font-bold text-amber-400">sem foto</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copiarChamada(imovel)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:border-indigo-400"
                  >
                    {copiadoId === imovel.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiadoId === imovel.id ? 'Copiado' : 'Chamada'}
                  </button>
                  <a
                    href={linkDe(imovel.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/40 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 hover:border-indigo-400"
                  >
                    <ExternalLink size={12} /> Link
                  </a>
                </div>
              </div>
            );
          })}
          {imoveis.length > 6 && (
            <p className="text-[10px] text-slate-500">+ {imoveis.length - 6} imóvel(is) na vitrine completa.</p>
          )}
        </div>
      )}
    </div>
  );
}
