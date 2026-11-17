import React, { useMemo, useState } from 'react';
import {
  ChevronRight, ChevronLeft, Plus, X, AlertTriangle, Clock, FileText,
  ShieldCheck, User, Building2, Ban, CheckCircle2, Inbox,
} from 'lucide-react';
import useEsteira from '../../hooks/useEsteira';
import {
  ETAPAS, ETAPAS_LATERAIS, etapaPorKey, situacaoSla, mascararCpf,
  contarPorEtapa, totalFinanciado, BANCOS, ESTADOS_CIVIS, REGIMES_BENS,
} from '../../lib/credito/esteira';
import { PERFIS_DOCUMENTO } from '../../lib/credito/simulador';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const labelCls = 'block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const TOM_SLA = {
  ok: 'text-slate-300 border-slate-700',
  atencao: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  estourado: 'text-red-300 border-red-500/40 bg-red-500/10',
  'sem-sla': 'text-slate-400 border-slate-800',
  'sem-data': 'text-slate-400 border-slate-800',
};

function SeloSla({ processo }) {
  const s = situacaoSla(processo);
  if (s.estado === 'sem-sla') return null;
  const rotulo = s.dias == null ? `SLA ${s.limite}d` : `${s.dias}d / ${s.limite}d`;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${TOM_SLA[s.estado] || TOM_SLA.ok}`}>
      <Clock size={9} /> {rotulo}
    </span>
  );
}

function CartaoProcesso({ processo, onAvancar, onVoltar, onAbrir, onPendencia, onReprovar }) {
  const etapa = etapaPorKey(processo.etapa);
  const proponentes = Array.isArray(processo.proponentes) ? processo.proponentes : [];
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-white">{processo.leadNome || 'Sem lead vinculado'}</p>
          <p className="truncate text-[10px] text-slate-400">{processo.imovelTitulo || 'Imóvel não informado'}</p>
        </div>
        <SeloSla processo={processo} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400">
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 font-bold">{processo.banco || '—'}</span>
        {processo.modalidade ? <span className="rounded-full bg-slate-800/70 px-2 py-0.5">{processo.modalidade}</span> : null}
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5">{proponentes.length} prop.</span>
      </div>

      <p className="text-[11px] font-black text-[#10b981]">{brl(processo.valorFinanciado)}</p>

      <div className="flex items-center gap-1">
        <button onClick={() => onVoltar(processo)} title="Etapa anterior" className="rounded-lg border border-slate-700 p-1 text-slate-400 hover:text-white">
          <ChevronLeft size={12} />
        </button>
        <button onClick={() => onAvancar(processo)} title="Avançar etapa" className="flex-1 rounded-lg border border-[#10b981]/40 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#10b981] hover:bg-[#10b981]/10">
          avançar
        </button>
        <button onClick={() => onAbrir(processo)} title="Detalhes" className="rounded-lg border border-slate-700 p-1 text-slate-400 hover:text-white">
          <FileText size={12} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-1">
        <button onClick={() => onPendencia(processo)} className="text-[9px] font-bold text-amber-300 hover:underline">pendência</button>
        <button onClick={() => onReprovar(processo)} className="flex items-center gap-1 text-[9px] font-bold text-red-300 hover:underline">
          <Ban size={9} /> reprovar
        </button>
      </div>
      <p className="text-[8px] uppercase tracking-widest text-slate-600">{etapa.label}</p>
    </div>
  );
}

function DetalheProcesso({ processo, onFechar, onAtualizar }) {
  if (!processo) return null;
  const proponentes = Array.isArray(processo.proponentes) ? processo.proponentes : [];
  const historico = Array.isArray(processo.historico) ? [...processo.historico].reverse() : [];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onFechar}>
      <div className={`${card} max-h-[88vh] w-full max-w-2xl overflow-auto p-5`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-black text-white">{processo.leadNome || 'Processo'}</p>
            <p className="text-[10px] text-slate-400">{processo.imovelTitulo || '—'} · {etapaPorKey(processo.etapa).label}</p>
          </div>
          <button onClick={onFechar} className="text-slate-500 hover:text-white"><X size={16} /></button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 p-2">
            <p className={labelCls}>Banco / modalidade</p>
            <div className="flex gap-2">
              <select className={inputCls} value={processo.banco || 'Caixa'} onChange={(e) => onAtualizar(processo, { banco: e.target.value })}>
                {BANCOS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input className={inputCls} value={processo.modalidade || ''} placeholder="SBPE / MCMV"
                     onChange={(e) => onAtualizar(processo, { modalidade: e.target.value })} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 p-2">
            <p className={labelCls}>Valor financiado</p>
            <input className={inputCls} inputMode="decimal" defaultValue={processo.valorFinanciado || ''}
                   onBlur={(e) => onAtualizar(processo, { valorFinanciado: Number(e.target.value) || 0 })} />
          </div>
        </div>

        <p className={`${labelCls} mt-3`}>Proponentes</p>
        <div className="space-y-1">
          {proponentes.length === 0 && <p className="text-[11px] text-slate-500">Nenhum proponente cadastrado.</p>}
          {proponentes.map((p, i) => (
            <div key={i} className="rounded-xl border border-slate-800 px-2 py-1.5 text-[10px] text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{p.nome || `Proponente ${i + 1}`}</span>
                <span className="text-slate-500">{mascararCpf(p.cpfMascarado)}</span>
              </div>
              <span className="text-[9px] text-slate-500">
                {brl(p.renda)} · {p.estadoCivil || '—'} · {p.regimeBens || '—'} · {p.perfil || '—'}
              </span>
            </div>
          ))}
        </div>

        {processo.motivoReprovacao && (
          <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-300">
            Motivo da reprovação: {processo.motivoReprovacao}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 px-2 py-1.5">
          <ShieldCheck size={12} className={processo.consentimentoLGPD?.aceito ? 'text-[#10b981]' : 'text-amber-300'} />
          <span className="text-[10px] text-slate-300">
            Consentimento LGPD: {processo.consentimentoLGPD?.aceito
              ? `registrado em ${processo.consentimentoLGPD.em || '—'} (${processo.consentimentoLGPD.versao || 'v1'})`
              : 'NÃO registrado'}
          </span>
        </div>

        <p className={`${labelCls} mt-3`}>Histórico</p>
        <ol className="space-y-1">
          {historico.length === 0 && <li className="text-[11px] text-slate-500">Sem movimentações.</li>}
          {historico.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
              <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-slate-600" />
              <span>
                <strong className="text-slate-200">{etapaPorKey(h.de).label} → {etapaPorKey(h.para).label}</strong>
                {' · '}{h.autor || 'autor não registrado'}{h.em ? ` · ${new Date(h.em).toLocaleString('pt-BR')}` : ''}
                {h.motivo ? ` · motivo: ${h.motivo}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function EsteiraKanban({ oficinaId, usuario, papelLogado, simAtual, onAbrirSimulador }) {
  const { processos, carregando, erro, resumo, podeVerTudo, criarProcesso, avancar, voltar, moverEtapa, atualizarProcesso } =
    useEsteira(oficinaId, usuario, papelLogado);

  const [aberto, setAberto] = useState(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({ leadNome: '', imovelTitulo: '', valorImovel: '', valorFinanciado: '', banco: 'Caixa', modalidade: 'SBPE', consentimento: false });
  const [salvando, setSalvando] = useState(false);
  const [erroLocal, setErroLocal] = useState('');

  const porEtapa = useMemo(() => {
    const mapa = Object.fromEntries([...ETAPAS, ...ETAPAS_LATERAIS].map((e) => [e.key, []]));
    for (const p of processos) {
      const k = mapa[p?.etapa] ? p.etapa : 'simulacao';
      mapa[k].push(p);
    }
    return mapa;
  }, [processos]);

  const contagem = contarPorEtapa(processos);
  const financiado = totalFinanciado(processos);

  async function criarDoForm() {
    setErroLocal('');
    if (!form.leadNome.trim()) { setErroLocal('Informe o nome do cliente.'); return; }
    if (!form.consentimento) { setErroLocal('Registre o consentimento LGPD para abrir o processo.'); return; }
    setSalvando(true);
    try {
      await criarProcesso({
        leadNome: form.leadNome,
        imovelTitulo: form.imovelTitulo,
        valorImovel: form.valorImovel,
        valorFinanciado: form.valorFinanciado,
        banco: form.banco,
        modalidade: form.modalidade,
        consentimentoLGPD: true,
      });
      setForm({ leadNome: '', imovelTitulo: '', valorImovel: '', valorFinanciado: '', banco: 'Caixa', modalidade: 'SBPE', consentimento: false });
      setCriando(false);
    } catch (e) {
      setErroLocal(String(e?.message || e));
    } finally {
      setSalvando(false);
    }
  }

  async function reprovar(processo) {
    const motivo = window.prompt('Motivo da reprovação (obrigatório):');
    if (!motivo) return;
    await moverEtapa(processo, 'reprovado', { motivo });
  }

  const abrirDoSimulador = async () => {
    if (!simAtual) return;
    setSalvando(true);
    try {
      await criarProcesso({
        leadNome: form.leadNome || 'Cliente da simulação',
        imovelTitulo: `${simAtual.entrada?.tipo || 'imóvel'} em ${simAtual.entrada?.cidade || '—'}`,
        valorImovel: simAtual.entrada?.valorImovel,
        valorFinanciado: simAtual.financiavel,
        banco: 'Caixa',
        modalidade: simAtual.enquadramento?.linha === 'MCMV' ? 'MCMV' : 'SBPE',
        consentimentoLGPD: true,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho / resumo */}
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Esteira de crédito</p>
            <p className="text-sm text-slate-300">
              {resumo.total} processo(s) · {resumo.ativos} ativos · {resumo.aprovados} aprovados · {resumo.reprovados} reprovados
              {resumo.estourados > 0 && <span className="ml-2 font-black text-red-300">{resumo.estourados} com SLA estourado</span>}
            </p>
            <p className="text-[11px] text-slate-500">Financiado em andamento: <strong className="text-[#10b981]">{brl(financiado)}</strong></p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {simAtual && (
              <button onClick={abrirDoSimulador} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-xl border border-[#10b981]/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#10b981] disabled:opacity-40">
                <Plus size={12} /> Abrir processo da simulação
              </button>
            )}
            <button onClick={() => setCriando((v) => !v)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950">
              <Plus size={12} /> Novo processo
            </button>
          </div>
        </div>

        {criando && (
          <div className="mt-3 grid gap-2 rounded-2xl border border-slate-800 p-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className={labelCls}>Cliente / lead</p>
              <input className={inputCls} value={form.leadNome} onChange={(e) => setForm({ ...form, leadNome: e.target.value })} placeholder="Nome do cliente" />
            </div>
            <div>
              <p className={labelCls}>Imóvel</p>
              <input className={inputCls} value={form.imovelTitulo} onChange={(e) => setForm({ ...form, imovelTitulo: e.target.value })} placeholder="Apto 302 — Santa Mônica" />
            </div>
            <div>
              <p className={labelCls}>Valor do imóvel</p>
              <input className={inputCls} inputMode="decimal" value={form.valorImovel} onChange={(e) => setForm({ ...form, valorImovel: e.target.value })} placeholder="450000" />
            </div>
            <div>
              <p className={labelCls}>Valor financiado</p>
              <input className={inputCls} inputMode="decimal" value={form.valorFinanciado} onChange={(e) => setForm({ ...form, valorFinanciado: e.target.value })} placeholder="360000" />
            </div>
            <div>
              <p className={labelCls}>Banco</p>
              <select className={inputCls} value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
                {BANCOS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <p className={labelCls}>Modalidade</p>
              <select className={inputCls} value={form.modalidade} onChange={(e) => setForm({ ...form, modalidade: e.target.value })}>
                <option value="SBPE">SBPE</option>
                <option value="MCMV">MCMV</option>
                <option value="Pró-cotista">Pró-cotista</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-slate-300 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-[#10b981]" checked={form.consentimento} onChange={(e) => setForm({ ...form, consentimento: e.target.checked })} />
              Cliente autorizou o tratamento dos dados (LGPD) — registra data no processo
            </label>
            <div className="flex items-center gap-2">
              <button onClick={criarDoForm} disabled={salvando} className="rounded-xl bg-[#10b981] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 disabled:opacity-40">
                {salvando ? 'Salvando…' : 'Criar'}
              </button>
              <button onClick={() => setCriando(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-500">cancelar</button>
            </div>
            {erroLocal && <p className="text-[10px] text-red-300 sm:col-span-3">{erroLocal}</p>}
          </div>
        )}

        {erro && <p className="mt-2 text-[10px] text-red-300">Erro ao ler processos: {erro}</p>}
        {!podeVerTudo && <p className="mt-2 text-[10px] text-slate-500">Você está vendo apenas os processos em que é o corretor responsável.</p>}
      </div>

      {/* Kanban */}
      {carregando ? (
        <div className={`${card} p-5 text-[11px] text-slate-400`}>Carregando processos…</div>
      ) : processos.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-2 p-10 text-center`}>
          <Inbox size={22} className="text-slate-600" />
          <p className="text-sm font-black text-white">Nenhum processo na esteira</p>
          <p className="text-[11px] text-slate-400">Crie a partir de uma simulação ou cadastre manualmente.</p>
          {onAbrirSimulador && (
            <button onClick={onAbrirSimulador} className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#10b981]">ir para o simulador</button>
          )}
        </div>
      ) : (
        <>
          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex min-w-full gap-3 px-1">
              {ETAPAS.map((etapa) => (
                <div key={etapa.key} className="w-[240px] shrink-0">
                  <div className="mb-2 flex items-center justify-between gap-1 rounded-xl border border-slate-800 px-2 py-1.5">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: etapa.cor }} />
                      {etapa.label}
                    </span>
                    <span className="text-[9px] font-black text-slate-500">{contagem[etapa.key] || 0}</span>
                  </div>
                  <div className="space-y-2">
                    {(porEtapa[etapa.key] || []).map((p) => (
                      <CartaoProcesso
                        key={p.id} processo={p}
                        onAvancar={avancar} onVoltar={voltar} onAbrir={setAberto}
                        onPendencia={(proc) => moverEtapa(proc, 'pendencia')}
                        onReprovar={reprovar}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Etapas laterais */}
          <div className={`${card} p-4`}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Etapas de exceção</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ETAPAS_LATERAIS.map((etapa) => (
                <div key={etapa.key}>
                  <div className="mb-1.5 flex items-center justify-between rounded-lg border border-slate-800 px-2 py-1">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: etapa.cor }} />
                      {etapa.label}
                    </span>
                    <span className="text-[9px] text-slate-500">{contagem[etapa.key] || 0}</span>
                  </div>
                  <div className="space-y-2">
                    {(porEtapa[etapa.key] || []).map((p) => (
                      <CartaoProcesso
                        key={p.id} processo={p}
                        onAvancar={avancar} onVoltar={voltar} onAbrir={setAberto}
                        onPendencia={(proc) => moverEtapa(proc, 'pendencia')}
                        onReprovar={reprovar}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <DetalheProcesso processo={aberto} onFechar={() => setAberto(null)} onAtualizar={(p, campos) => { atualizarProcesso(p, campos); setAberto(null); }} />
    </div>
  );
}
