import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Copy, Check, MessageCircle, Trash2, ExternalLink, Lock,
  LoaderCircle, Search, ChevronRight, X, CircleDot,
} from 'lucide-react';
import GuiaDaAba from '../ui/GuiaDaAba';
import HeroAba from '../admin/HeroAba';
import SeletorUF from '../ui/SeletorUF';
import { corDaAba, heroDaAba } from '../../lib/coresAbas';
import { db } from '../../lib/firebase';
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  TIPOS_OPERACAO, etapasDoTipo, labelDoTipo, gerarCodigo, gerarSenha,
  docIdDe, etapaAtual, progresso, linkPublico, textoWhatsApp,
} from '../../lib/acompanhamento';

const E = '#10b981';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';

export default function AcompanhamentoCliente({
  dadosOficina,
  isPro = false,
  onIrParaPlanos,
  setAbaAtiva,
  pedidoNovoProcesso = 0,
  consumirPedidoNovoProcesso,
}) {
  const tenantId = dadosOficina?.id || dadosOficina?.uid || null;
  const tenantNome = dadosOficina?.nomeOficina || 'Imobiliária';
  const corAba = corDaAba('acompanhamento_cliente');
  const heroAba = heroDaAba('acompanhamento_cliente');

  const [processos, setProcessos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');
  const [form, setForm] = useState({ cliente: '', whatsapp: '', imovel: '', tipo: 'financiamento' });

  /* ---------------------------------------------------------------- */
  /* Listener                                                          */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!tenantId) { setCarregando(false); return; }
    const ref = collection(db, 'oficinas', tenantId, 'acompanhamentos_imobi');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const lista = (snap?.docs || []).map((d) => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
        setProcessos(lista);
        setCarregando(false);
      },
      (err) => {
        console.warn('[acompanhamento] listener:', err?.message);
        setCarregando(false);
      }
    );
    return () => unsub();
  }, [tenantId]);

  // Compatibilidade: renderizado pelo GerenciadorDeModulos recebe setAbaAtiva
  const irParaPlanos = onIrParaPlanos
    || (typeof setAbaAtiva === 'function' ? () => setAbaAtiva('meuplano') : undefined);

  const limiteGratis = 1;
  const noLimite = !isPro && processos.length >= limiteGratis;

  // Pedido vindo do CTA dourado (AdminNovo): abre o formulário de novo processo
  useEffect(() => {
    if (!pedidoNovoProcesso) return;
    consumirPedidoNovoProcesso?.();
    if (noLimite) {
      irParaPlanos?.();
      return;
    }
    setErro('');
    setForm({ cliente: '', whatsapp: '', imovel: '', tipo: 'financiamento' });
    setFormAberto(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoNovoProcesso]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return processos;
    return processos.filter((p) =>
      [p.cliente, p.imovel, p.codigo, p.whatsapp].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [processos, busca]);

  /* ---------------------------------------------------------------- */
  /* Criar                                                             */
  /* ---------------------------------------------------------------- */
  const abrirForm = () => {
    if (noLimite) { setErro(''); irParaPlanos?.(); return; }
    setErro('');
    setForm({ cliente: '', whatsapp: '', imovel: '', tipo: 'financiamento' });
    setFormAberto(true);
  };

  const criarProcesso = async (e) => {
    e?.preventDefault?.();
    if (!tenantId) return setErro('Sessão sem organização vinculada.');
    if (!form.cliente.trim()) return setErro('Informe o nome do cliente.');

    setSalvando(true);
    setErro('');
    try {
      const codigo = gerarCodigo();
      const senha = gerarSenha();
      const id = docIdDe(codigo, senha);
      const etapas = etapasDoTipo(form.tipo);

      const base = {
        codigo,
        senha,
        cliente: form.cliente.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        imovel: form.imovel.trim(),
        tipo: form.tipo,
        etapaLabel: labelDoTipo(form.tipo),
        tenantId,
        tenantNome,
        status: 'ativo',
        concluidas: [],
        etapas,
      };

      // 1) documento do tenant (fonte de verdade)
      await setDoc(doc(db, 'oficinas', tenantId, 'acompanhamentos_imobi', id), {
        ...base,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      // 2) espelho público (o cliente consulta com código + senha, sem login)
      await setDoc(doc(db, 'acompanhamentos_publicos', id), {
        codigo,
        senha,
        tenantId,
        cliente: base.cliente,
        imovel: base.imovel,
        tipo: base.tipo,
        etapaLabel: base.etapaLabel,
        etapas,
        concluidas: [],
        status: 'ativo',
        atualizadoEm: serverTimestamp(),
      });

      setFormAberto(false);
      setCopiado(id);
    } catch (err) {
      console.error('[acompanhamento] criar:', err);
      setErro(err?.code === 'permission-denied'
        ? 'Sem permissão para gravar. Verifique as regras do Firestore.'
        : 'Não foi possível criar o processo.');
    } finally {
      setSalvando(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Avançar / voltar etapa                                            */
  /* ---------------------------------------------------------------- */
  const alternarEtapa = async (processo, indice) => {
    const atual = Array.isArray(processo.concluidas) ? processo.concluidas : [];
    const concluidas = atual.includes(indice)
      ? atual.filter((i) => i !== indice)
      : [...atual, indice].sort((a, b) => a - b);

    const etapas = processo.etapas?.length ? processo.etapas : etapasDoTipo(processo.tipo);
    const status = concluidas.length >= etapas.length ? 'concluido' : 'ativo';

    await setDoc(doc(db, 'oficinas', tenantId, 'acompanhamentos_imobi', processo.id), {
      concluidas, status, atualizadoEm: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, 'acompanhamentos_publicos', processo.id), {
      concluidas, status, atualizadoEm: serverTimestamp(),
    }, { merge: true });
  };

  const excluir = async (processo) => {
    if (!window.confirm(`Excluir o processo de ${processo.cliente}? O link do cliente deixa de funcionar.`)) return;
    await deleteDoc(doc(db, 'oficinas', tenantId, 'acompanhamentos_imobi', processo.id));
    await deleteDoc(doc(db, 'acompanhamentos_publicos', processo.id));
  };

  const copiar = async (texto, chave) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 2200);
    } catch {
      setCopiado('');
    }
  };

  /* ---------------------------------------------------------------- */
  /* UI                                                                */
  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Hero da aba (formato único do painel) */}
      <HeroAba
        chip={heroAba.chip}
        titulo={heroAba.titulo}
        subtitulo={heroAba.subtitulo}
        cor={corAba}
        stats={[
          { label: 'Processos', valor: processos.length, detalhe: 'no arquivo' },
          {
            label: 'Concluídos',
            valor: processos.filter((x) => x.status === 'concluido').length,
            detalhe: 'entregues',
          },
        ]}
        acao={
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={abrirForm}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition-all hover:brightness-110"
              style={{ backgroundColor: E }}
            >
              <Plus size={16} /> Novo Processo
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {isPro ? 'PRO · processos ilimitados' : `Grátis · ${processos.length}/${limiteGratis} de degustação`}
            </span>
          </div>
        }
      />

      <SeletorUF className="mb-4" />

      <GuiaDaAba
        titulo="Acompanhamento do Cliente"
        descricao="Cada processo ganha um código e uma senha. O cliente acompanha as etapas pelo link e você marca cada avanço com um toque — sem ligação perguntando qual o andamento."
      />

      {/* Bloqueio comercial (Grátis no limite) */}
      {noLimite && (
        <section className="rounded-3xl border border-[#10b981]/30 bg-[#10b981]/5 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-white">Seu processo de degustação já está aberto</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                No Modo Grátis você tem 1 processo ativo. Quem vende com acompanhamento reduz ligação de
                "qual o andamento?" e fecha mais rápido — no PRO são processos ilimitados, com histórico e link por cliente.
              </p>
            </div>
          </div>
          <button
            onClick={() => irParaPlanos?.()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-950 hover:brightness-110"
            style={{ backgroundColor: E }}
          >
            Liberar no PRO <ChevronRight size={15} />
          </button>
        </section>
      )}

      {/* Formulário */}
      {formAberto && (
        <section className={`${card} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Novo processo</h2>
            <button onClick={() => setFormAberto(false)} className="text-slate-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={criarProcesso} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Nome do cliente *</label>
              <input
                className={inputCls}
                value={form.cliente}
                onChange={(ev) => setForm((f) => ({ ...f, cliente: ev.target.value }))}
                placeholder="Ex: Marina Alves"
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input
                className={inputCls}
                value={form.whatsapp}
                onChange={(ev) => setForm((f) => ({ ...f, whatsapp: ev.target.value }))}
                placeholder="(34) 99999-0000"
              />
            </div>
            <div>
              <label className={labelCls}>Imóvel / referência</label>
              <input
                className={inputCls}
                value={form.imovel}
                onChange={(ev) => setForm((f) => ({ ...f, imovel: ev.target.value }))}
                placeholder="Ex: Apto Santa Mônica, Q. 12 L. 4"
              />
            </div>
            <div>
              <label className={labelCls}>Tipo de operação</label>
              <select
                className={inputCls}
                value={form.tipo}
                onChange={(ev) => setForm((f) => ({ ...f, tipo: ev.target.value }))}
              >
                {TIPOS_OPERACAO.map((t) => (
                  <option key={t.key} value={t.key} className="bg-slate-950">
                    {t.icone} {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1.5">
                {etapasDoTipo(form.tipo).length} etapas carregadas automaticamente
              </p>
            </div>

            {erro && (
              <div className="md:col-span-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {erro}
              </div>
            )}

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-950 disabled:opacity-50"
                style={{ backgroundColor: E }}
              >
                {salvando ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}
                Gerar código e senha
              </button>
              <button
                type="button"
                onClick={() => setFormAberto(false)}
                className="px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-400 border border-slate-800 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Busca */}
      {processos.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Buscar por cliente, imóvel ou código"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {filtrados.length} processo(s)
          </span>
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <div className={`${card} p-10 flex items-center justify-center gap-3 text-slate-400 text-sm`}>
          <LoaderCircle size={18} className="animate-spin text-[#10b981]" /> Carregando processos…
        </div>
      ) : filtrados.length === 0 ? (
        <div className={`${card} p-10 text-center`}>
          <CircleDot size={26} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-bold text-white">Nenhum processo aberto</p>
          <p className="text-xs text-slate-500 mt-1">
            Clique em "Novo Processo" para gerar o primeiro código de acompanhamento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtrados.map((p) => {
            const etapas = p.etapas?.length ? p.etapas : etapasDoTipo(p.tipo);
            const feitas = Array.isArray(p.concluidas) ? p.concluidas : [];
            const atual = etapaAtual({ ...p, etapas });
            const pct = progresso({ ...p, etapas });
            const link = linkPublico(p.codigo, p.senha);

            return (
              <div key={p.id} className={`${card} p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{p.cliente}</p>
                    <p className="text-[11px] text-slate-400">
                      {p.imovel || 'Imóvel não informado'} · {labelDoTipo(p.tipo)}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
                    {p.status === 'concluido' ? 'Concluído' : `${pct}%`}
                  </span>
                </div>

                {/* barra */}
                <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: E }} />
                </div>

                {/* código/senha */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                    {p.codigo}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                    senha {p.senha}
                  </span>
                  <button
                    onClick={() => copiar(link, `link_${p.id}`)}
                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#10b981] hover:brightness-125"
                  >
                    {copiado === `link_${p.id}` ? <Check size={12} /> : <Copy size={12} />} link
                  </button>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                  >
                    <ExternalLink size={12} /> abrir
                  </a>
                  <a
                    href={`https://wa.me/55${String(p.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(textoWhatsApp({ ...p, tenantNome }))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
                  >
                    <MessageCircle size={12} /> enviar
                  </a>
                </div>

                {/* etapas */}
                <div className="mt-4 space-y-1.5">
                  {etapas.map((etapa, i) => {
                    const done = feitas.includes(i);
                    const ehAtual = i === atual && !done;
                    return (
                      <button
                        key={i}
                        onClick={() => alternarEtapa(p, i)}
                        className={`w-full flex items-center gap-2.5 text-left text-xs rounded-lg px-2 py-1.5 transition-colors ${
                          done ? 'text-slate-500 line-through' : ehAtual ? 'text-white bg-[#10b981]/10' : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: done ? E : ehAtual ? E : '#334155',
                            backgroundColor: done ? E : 'transparent',
                          }}
                        >
                          {done && <Check size={10} className="text-slate-950" />}
                        </span>
                        <span className="flex-1">{etapa}</span>
                        {ehAtual && <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981]">atual</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">{feitas.length}/{etapas.length} etapas</span>
                  <button
                    onClick={() => excluir(p)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-400 inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} /> excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
