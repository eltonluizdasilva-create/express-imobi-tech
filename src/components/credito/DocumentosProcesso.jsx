import React, { useEffect, useMemo, useState } from 'react';
import {
  FileCheck2, Copy, Check, Plus, Trash2, AlertTriangle, ShieldAlert, RefreshCw,
} from 'lucide-react';
import useDocumentos from '../../hooks/useDocumentos';
import {
  BLOCOS, STATUS_DOC, PERFIS_COMPRADOR, statusEfetivo,
} from '../../lib/credito/documentos';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const labelCls = 'block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1';
const fmtData = (v) => {
  if (!v) return '—';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

export default function DocumentosProcesso({ oficinaId, processo, usuario, papelLogado }) {
  const {
    docs, carregando, erro, podeExcluir, resumo, textoWhatsApp,
    semear, marcarStatus, salvarObservacao, adicionarExtra, remover,
  } = useDocumentos(oficinaId, processo, usuario, papelLogado);

  const [perfil, setPerfil] = useState('clt');
  const [tipoImovel, setTipoImovel] = useState('usado');
  const [usaFgts, setUsaFgts] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [extra, setExtra] = useState({ bloco: 'comprador', item: '', validadeMeses: '' });
  const [gerando, setGerando] = useState(false);

  useEffect(() => { setPerfil('clt'); }, [processo?.id]);

  const porBloco = useMemo(() => {
    const mapa = { comprador: [], vendedor: [], imovel: [] };
    for (const d of docs) (mapa[d.bloco] || mapa.comprador).push(d);
    for (const k of Object.keys(mapa)) {
      mapa[k].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }
    return mapa;
  }, [docs]);

  async function copiarPendencias() {
    try {
      await navigator.clipboard.writeText(textoWhatsApp());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { setCopiado(false); }
  }

  async function gerarChecklist() {
    setGerando(true);
    try { await semear({ perfil, tipoImovel, usaFgts }); } finally { setGerando(false); }
  }

  if (!processo) {
    return (
      <div className={`${card} p-6 text-center text-[11px] text-slate-400`}>
        Selecione um processo na esteira para montar o checklist de documentos.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <FileCheck2 size={13} /> Documentos — {processo.leadNome || 'processo'}
            </p>
            <p className="text-[11px] text-slate-500">
              {resumo.recebidos}/{resumo.total} recebidos · {resumo.pendentes} pendentes · {resumo.vencidos} vencidos
            </p>
            <div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-[#10b981] transition-all" style={{ width: `${resumo.percentual}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copiarPendencias}
              disabled={!docs.length}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#10b981]/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#10b981] disabled:opacity-40"
            >
              {copiado ? <Check size={12} /> : <Copy size={12} />} {copiado ? 'Copiado' : 'Copiar pendências p/ WhatsApp'}
            </button>
            <button
              onClick={gerarChecklist}
              disabled={gerando}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40"
            >
              <RefreshCw size={12} /> {docs.length ? 'Gerar de novo (outro perfil)' : 'Gerar checklist'}
            </button>
          </div>
        </div>

        {!docs.length && (
          <div className="mt-3 grid gap-2 rounded-2xl border border-slate-800 p-3 sm:grid-cols-4">
            <div>
              <p className={labelCls}>Perfil do comprador</p>
              <select className={inputCls} value={perfil} onChange={(e) => setPerfil(e.target.value)}>
                {PERFIS_COMPRADOR.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <p className={labelCls}>Tipo de imóvel</p>
              <select className={inputCls} value={tipoImovel} onChange={(e) => setTipoImovel(e.target.value)}>
                <option value="usado">Usado</option>
                <option value="novo">Novo</option>
                <option value="apartamento">Apartamento</option>
                <option value="planta">Na planta</option>
              </select>
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-[10px] text-slate-300">
              <input type="checkbox" className="h-3.5 w-3.5 accent-[#10b981]" checked={usaFgts} onChange={(e) => setUsaFgts(e.target.checked)} />
              Usa FGTS
            </label>
            <div className="flex items-end">
              <span className="text-[10px] text-slate-500">Escolha e clique em “Gerar checklist”.</span>
            </div>
          </div>
        )}

        {erro && <p className="mt-2 text-[10px] text-red-300">{erro}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldAlert size={11} /> Nesta fase nenhum arquivo é enviado: o controle é de status e validade (sem Storage, sem binário no Firestore).
        </p>
      </div>

      {carregando && <div className={`${card} p-5 text-[11px] text-slate-400`}>Carregando documentos…</div>}

      {docs.length > 0 && (
        <>
          {BLOCOS.map((bloco) => (
            <div key={bloco.key} className={`${card} p-5`}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {bloco.icone} {bloco.label}
                <span className="ml-2 text-slate-600">{(porBloco[bloco.key] || []).length}</span>
              </p>
              <div className="space-y-1.5">
                {(porBloco[bloco.key] || []).map((d) => {
                  const st = d.statusEfetivo || statusEfetivo(d);
                  const cor = (STATUS_DOC.find((s) => s.key === st) || STATUS_DOC[0]).cor;
                  return (
                    <div key={d.id} className="rounded-xl border border-slate-800 p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                        <p className="min-w-[180px] flex-1 text-[11px] text-slate-200">{d.item}</p>
                        <select
                          className="rounded-lg border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ color: cor }}
                          value={d.status || 'pendente'}
                          onChange={(e) => marcarStatus(d, e.target.value)}
                        >
                          {STATUS_DOC.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <span className="text-[9px] text-slate-500">
                          {d.validadeEm ? `vence ${fmtData(d.validadeEm)}` : (d.validadeMeses ? `${d.validadeMeses}m` : '—')}
                        </span>
                        {d.extra && podeExcluir && (
                          <button onClick={() => remover(d)} className="text-slate-600 hover:text-red-300" title="Remover item extra">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <input
                        className="mt-1 w-full bg-transparent text-[10px] text-slate-400 placeholder-slate-600 focus:outline-none"
                        placeholder="observação (opcional)"
                        defaultValue={d.observacao || ''}
                        onBlur={(e) => { if (e.target.value !== (d.observacao || '')) salvarObservacao(d, e.target.value); }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className={`${card} p-5`}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Adicionar item extra</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <select className={inputCls} value={extra.bloco} onChange={(e) => setExtra({ ...extra, bloco: e.target.value })}>
                {BLOCOS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
              <input className={`${inputCls} sm:col-span-2`} placeholder="Documento" value={extra.item} onChange={(e) => setExtra({ ...extra, item: e.target.value })} />
              <div className="flex gap-2">
                <input className={inputCls} placeholder="validade (meses)" inputMode="numeric" value={extra.validadeMeses} onChange={(e) => setExtra({ ...extra, validadeMeses: e.target.value })} />
                <button
                  onClick={() => { adicionarExtra(extra); setExtra({ bloco: extra.bloco, item: '', validadeMeses: '' }); }}
                  className="rounded-xl bg-[#10b981] px-2 text-slate-950"
                  title="Adicionar"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
            {resumo.vencidos > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-red-300">
                <AlertTriangle size={11} /> {resumo.vencidos} documento(s) com validade estourada.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
