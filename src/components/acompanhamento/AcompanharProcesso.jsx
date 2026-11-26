import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import {
  Check, Search, LoaderCircle, ShieldCheck, CircleDot, Building2,
  Landmark, MessageCircle, FileText, CheckCircle2, Clock, MapPin,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  etapasDoTipo, labelDoTipo, docIdDe, progresso, etapaAtual,
  derivarDadosRastreioCartorio,
} from '../../lib/acompanhamento';
import { negociacoesDemoCartorio } from '../../lib/cartorioEscritura';

const E = '#10b981';

export default function AcompanharProcesso() {
  const [params] = useSearchParams();
  const [codigo, setCodigo] = useState(params.get('c') || '');
  const [senha, setSenha] = useState(params.get('s') || '');
  const [processo, setProcesso] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const buscar = async (c = codigo, s = senha) => {
    const codLimpo = String(c || '').trim().toUpperCase();
    const senLimpa = String(s || '').trim();
    const id = docIdDe(codLimpo, senLimpa);

    if (!codLimpo || !senLimpa) {
      setErro('Informe o código e a senha PIN recebidos no WhatsApp.');
      return;
    }

    setCarregando(true);
    setErro('');
    setProcesso(null);

    // 1. Tenta carregar do Firestore
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'acompanhamentos_publicos', id));
        if (snap.exists()) {
          const d = snap.data() || {};
          setProcesso({ id, ...d, etapas: d.etapas?.length ? d.etapas : etapasDoTipo(d.tipo) });
          setCarregando(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[AcompanharProcesso] Firestore offline ou inacessível, checando cache local:', err?.message);
    }

    // 2. Fallback de cache local (localStorage)
    try {
      if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(`public_acompanhamento_${id}`);
        if (local) {
          const d = JSON.parse(local);
          setProcesso({ id, ...d, etapas: d.etapas?.length ? d.etapas : etapasDoTipo(d.tipo) });
          setCarregando(false);
          return;
        }
      }
    } catch (err) {
      // ignora falha de local storage
    }

    // 3. Fallback inteligente de demonstração para negociações demo
    try {
      const demos = negociacoesDemoCartorio();
      const demoMatch = demos.find((d) => {
        const codDemo = String(d.codigoRastreio || d.codigoImovel || '').trim().toUpperCase();
        const senDemo = String(d.senhaRastreio || codDemo.replace(/\D/g, '').slice(-4) || '1234').trim();
        return codDemo === codLimpo && senDemo === senLimpa;
      });

      if (demoMatch) {
        const payload = derivarDadosRastreioCartorio(demoMatch);
        setProcesso({ id, ...payload });
        setCarregando(false);
        return;
      }
    } catch {
      // prossegue para mensagem de não encontrado
    }

    setErro('Processo não localizado. Confira se o código e a senha PIN de 4 dígitos foram digitados corretamente.');
    setCarregando(false);
  };

  // Link direto (?c=&s=) resolve sozinho
  useEffect(() => {
    const c = params.get('c');
    const s = params.get('s');
    if (c && s) buscar(c, s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const etapas = processo?.etapas || [];
  const feitas = Array.isArray(processo?.concluidas) ? processo.concluidas : [];
  const atual = processo ? etapaAtual(processo) : 0;
  const pct = processo ? progresso(processo) : 0;
  const detalhes = Array.isArray(processo?.detalhesEtapas) ? processo.detalhesEtapas : null;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Marca & Header */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20" style={{ backgroundColor: E }}>
            <Building2 size={20} className="text-slate-950" />
          </div>
          <div>
            <p className="text-sm font-black tracking-widest text-white">EXPRESS IMOBI TECH</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Portal de Rastreio Público do Cliente</p>
          </div>
        </div>

        {/* Consulta */}
        <section className="bg-[#060a10] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-2 text-[#10b981] text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={16} />
            <span>Acompanhamento Seguro em Tempo Real</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight mt-1 text-white">
            Rastreio de <span style={{ color: E }}>Cartório &amp; Escritura</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
            Consulte o andamento da sua compra ou venda em tempo real. Veja a emissão de certidões, ITBI,
            escritura, protocolo no RGI e liberação das chaves sem precisar ligar.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); buscar(); }}
            className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_auto]"
          >
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Código (ex: IMB-4092)"
              aria-label="Código do processo"
              autoComplete="off"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
            />
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN (4 dígitos)"
              aria-label="Senha PIN de 4 dígitos"
              autoComplete="off"
              inputMode="numeric"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
            />
            <button
              type="submit"
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: E }}
            >
              {carregando ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}
              Consultar
            </button>
          </form>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
              {erro}
            </div>
          )}
        </section>

        {/* Resultado */}
        {processo && (
          <section className="bg-[#060a10] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            {/* Cabeçalho do Processo */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                    {processo.tenantNome || 'Imobiliária Parceira'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {labelDoTipo(processo.tipo)}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-white mt-1">
                  Olá, {processo.cliente}!
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-500" />
                  {processo.imovel || 'Imóvel em negociação'}
                </p>
                {processo.banco && (
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Landmark size={12} className="text-emerald-400" />
                    Financiamento: <strong className="text-slate-200">{processo.banco}</strong>
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    processo.status === 'concluido'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {processo.status === 'concluido' ? 'Concluído' : `${pct}% concluído`}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Código: {processo.codigo}
                </span>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                <span>Evolução do Processo</span>
                <span className="text-white font-mono">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: E }}
                />
              </div>
            </div>

            {/* Linha do Tempo Visual */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock size={14} className="text-emerald-400" />
                Linha do Tempo das Etapas
              </h3>

              <ol className="relative border-l border-slate-800 ml-3.5 space-y-6">
                {etapas.map((etapaNome, idx) => {
                  const done = feitas.includes(idx);
                  const ehAtual = idx === atual && !done;
                  const itemDetalhe = detalhes ? detalhes[idx] : null;

                  return (
                    <li key={idx} className="ml-6 relative">
                      {/* Marcador do Ponto */}
                      <span
                        className={`absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                          done
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                            : ehAtual
                              ? 'bg-slate-950 border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}
                      >
                        {done ? (
                          <Check size={14} className="stroke-[3]" />
                        ) : ehAtual ? (
                          <CircleDot size={13} className="animate-pulse" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </span>

                      {/* Card da Etapa */}
                      <div
                        className={`rounded-2xl border p-4 transition-all ${
                          done
                            ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                            : ehAtual
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-white shadow-lg shadow-emerald-950/40'
                              : 'bg-slate-950/20 border-slate-900 text-slate-500'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold ${ehAtual ? 'text-white' : done ? 'text-slate-300' : 'text-slate-500'}`}>
                            {itemDetalhe?.titulo || etapaNome}
                          </h4>
                          {done && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                              <CheckCircle2 size={12} /> Concluída
                            </span>
                          )}
                          {ehAtual && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              <CircleDot size={10} className="animate-pulse" /> Em Andamento
                            </span>
                          )}
                        </div>

                        {itemDetalhe?.descricao && (
                          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                            {itemDetalhe.descricao}
                          </p>
                        )}

                        {itemDetalhe?.resumo && (
                          <p className="mt-2 text-[11px] font-mono font-medium text-emerald-400/90">
                            {itemDetalhe.resumo}
                          </p>
                        )}

                        {itemDetalhe?.protocoloRgi && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[11px] font-mono text-emerald-300">
                            <FileText size={12} />
                            Protocolo RGI: <strong>{itemDetalhe.protocoloRgi}</strong>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Contato & Dúvidas */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Dúvidas sobre o andamento?
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Fale com a equipe responsável pelo seu atendimento na{' '}
                  <strong className="text-white">{processo.tenantNome || 'imobiliária'}</strong>.
                </p>
              </div>

              {processo.telefoneContato ? (
                <a
                  href={`https://wa.me/55${processo.telefoneContato}?text=${encodeURIComponent(`Olá! Estou acompanhando o processo ${processo.codigo} do imóvel ${processo.imovel}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 transition hover:brightness-110"
                >
                  <MessageCircle size={14} />
                  Falar no WhatsApp
                </a>
              ) : null}
            </div>

            <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1.5 pt-2">
              <ShieldCheck size={12} /> Consulta pública segura protegida por código e PIN. Em conformidade com a LGPD.
            </p>
          </section>
        )}
      </div>

      {/* Privacidade desta consulta: código + senha, sem coleta de dado novo. */}
      <p className="mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500">
        Esta consulta usa apenas o código e a senha PIN enviados pela imobiliária — nenhuma credencial ou dado
        bancário é gravado no seu navegador. Os dados pertencem ao atendimento da imobiliária; para correção ou
        exclusão, fale com ela ou consulte a{' '}
        <Link to="/privacidade" className="text-[#10b981] underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
